import { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Switch, TextInput, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FileMaker, FM_MODULES, FM_CONTROL_PANELS, FMControlPanelConfig } from '@/lib/filemaker';

// Object State Types
type ObjectState = 'active' | 'inactive' | 'pending' | 'error' | 'locked';

// Control Object Definition
interface ControlObject {
  id: string;
  name: string;
  type: 'module' | 'panel' | 'portal' | 'button' | 'script' | 'webhook' | 'integration';
  state: ObjectState;
  enabled: boolean;
  config: Record<string, any>;
  permissions: string[];
  lastModified: number;
  dependencies?: string[];
}

// Command Centre Option
interface CommandOption {
  id: string;
  label: string;
  icon: string;
  category: 'system' | 'data' | 'communication' | 'security' | 'integration';
  action: () => void;
  enabled: boolean;
  requiresAuth: boolean;
}

// Initial Control Objects
const INITIAL_OBJECTS: ControlObject[] = [
  // Modules
  { id: 'mod-patient', name: 'Patient Module', type: 'module', state: 'active', enabled: true, config: { table: 'Patients', layout: 'Patient_Detail' }, permissions: ['view', 'edit', 'create'], lastModified: Date.now() },
  { id: 'mod-doctors', name: 'Doctors Module', type: 'module', state: 'active', enabled: true, config: { table: 'Staff', layout: 'Doctor_List' }, permissions: ['view', 'edit'], lastModified: Date.now() },
  { id: 'mod-medication', name: 'Medication Module', type: 'module', state: 'active', enabled: true, config: { table: 'Medications', layout: 'Medication_List' }, permissions: ['view', 'edit', 'create'], lastModified: Date.now() },
  { id: 'mod-labs', name: 'Labs Module', type: 'module', state: 'active', enabled: true, config: { table: 'LabResults', layout: 'Lab_Results' }, permissions: ['view', 'edit'], lastModified: Date.now() },
  { id: 'mod-rooms', name: 'Rooms Module', type: 'module', state: 'active', enabled: true, config: { table: 'Rooms', layout: 'Room_Status' }, permissions: ['view', 'edit'], lastModified: Date.now() },
  
  // Portals
  { id: 'portal-appointments', name: 'Appointments Portal', type: 'portal', state: 'active', enabled: true, config: { relationship: 'Patient_Appointments', rowCount: 10 }, permissions: ['view', 'edit'], lastModified: Date.now() },
  { id: 'portal-prescriptions', name: 'Prescriptions Portal', type: 'portal', state: 'active', enabled: true, config: { relationship: 'Patient_Prescriptions', rowCount: 5 }, permissions: ['view'], lastModified: Date.now() },
  { id: 'portal-lab-results', name: 'Lab Results Portal', type: 'portal', state: 'active', enabled: true, config: { relationship: 'Patient_Labs', rowCount: 8 }, permissions: ['view'], lastModified: Date.now() },
  
  // Integrations
  { id: 'int-jedi', name: 'JEDI Systems', type: 'integration', state: 'active', enabled: true, config: { endpoint: 'https://jeditek.org', protocol: 'SMPO.ink' }, permissions: ['connect', 'sync'], lastModified: Date.now(), dependencies: ['int-smpo'] },
  { id: 'int-smpo', name: 'SMPO.ink Protocol', type: 'integration', state: 'active', enabled: true, config: { version: '2.1.0', encryption: true }, permissions: ['audit', 'compliance'], lastModified: Date.now() },
  { id: 'int-wongi', name: 'WONGI Tracker', type: 'integration', state: 'active', enabled: true, config: { endpoint: 'https://jeditek.net', healthSync: true }, permissions: ['track', 'report'], lastModified: Date.now(), dependencies: ['int-jedi'] },
  { id: 'int-hitch', name: 'Python Hitch', type: 'integration', state: 'active', enabled: true, config: { automation: true, scheduler: true }, permissions: ['execute', 'schedule'], lastModified: Date.now() },
  { id: 'int-office365', name: 'Office 365', type: 'integration', state: 'pending', enabled: false, config: { calendar: true, email: true, teams: true }, permissions: ['calendar', 'email'], lastModified: Date.now() },
  
  // Webhooks
  { id: 'webhook-patient-create', name: 'Patient Created Webhook', type: 'webhook', state: 'active', enabled: true, config: { event: 'patient.created', url: '/api/webhooks/patient' }, permissions: ['trigger'], lastModified: Date.now() },
  { id: 'webhook-appointment-update', name: 'Appointment Updated Webhook', type: 'webhook', state: 'active', enabled: true, config: { event: 'appointment.updated', url: '/api/webhooks/appointment' }, permissions: ['trigger'], lastModified: Date.now() },
  { id: 'webhook-alert', name: 'Alert Webhook', type: 'webhook', state: 'active', enabled: true, config: { event: 'alert.triggered', url: '/api/webhooks/alert' }, permissions: ['trigger'], lastModified: Date.now() },
];

// State Colors
const STATE_COLORS: Record<ObjectState, string> = {
  active: '#22C55E',
  inactive: '#9CA3AF',
  pending: '#F59E0B',
  error: '#EF4444',
  locked: '#6B7280',
};

// Type Icons
const TYPE_ICONS: Record<string, string> = {
  module: '📦',
  panel: '🖥️',
  portal: '🚪',
  button: '🔘',
  script: '📜',
  webhook: '🔗',
  integration: '🔌',
};

export default function ObjectControlPanelScreen() {
  const router = useRouter();
  const [objects, setObjects] = useState<ControlObject[]>(INITIAL_OBJECTS);
  const [selectedObject, setSelectedObject] = useState<ControlObject | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'objects' | 'commands' | 'matrix'>('objects');

  // Command Centre Options
  const commandOptions: CommandOption[] = [
    // System Commands
    { id: 'cmd-sync-all', label: 'Sync All Systems', icon: '🔄', category: 'system', action: () => handleSyncAll(), enabled: true, requiresAuth: false },
    { id: 'cmd-refresh', label: 'Refresh Objects', icon: '♻️', category: 'system', action: () => handleRefresh(), enabled: true, requiresAuth: false },
    { id: 'cmd-restart', label: 'Restart Services', icon: '🔁', category: 'system', action: () => handleRestart(), enabled: true, requiresAuth: true },
    { id: 'cmd-backup', label: 'Create Backup', icon: '💾', category: 'system', action: () => handleBackup(), enabled: true, requiresAuth: true },
    
    // Data Commands
    { id: 'cmd-import', label: 'Import Data', icon: '📥', category: 'data', action: () => handleImport(), enabled: true, requiresAuth: true },
    { id: 'cmd-export', label: 'Export Data', icon: '📤', category: 'data', action: () => handleExport(), enabled: true, requiresAuth: true },
    { id: 'cmd-validate', label: 'Validate Data', icon: '✅', category: 'data', action: () => handleValidate(), enabled: true, requiresAuth: false },
    { id: 'cmd-cleanup', label: 'Data Cleanup', icon: '🧹', category: 'data', action: () => handleCleanup(), enabled: true, requiresAuth: true },
    
    // Communication Commands
    { id: 'cmd-broadcast', label: 'Broadcast Message', icon: '📢', category: 'communication', action: () => handleBroadcast(), enabled: true, requiresAuth: true },
    { id: 'cmd-notify', label: 'Send Notification', icon: '🔔', category: 'communication', action: () => handleNotify(), enabled: true, requiresAuth: false },
    { id: 'cmd-alert', label: 'Trigger Alert', icon: '🚨', category: 'communication', action: () => handleAlert(), enabled: true, requiresAuth: true },
    
    // Security Commands
    { id: 'cmd-audit', label: 'Run Audit', icon: '🔍', category: 'security', action: () => handleAudit(), enabled: true, requiresAuth: true },
    { id: 'cmd-lock', label: 'Lock System', icon: '🔒', category: 'security', action: () => handleLock(), enabled: true, requiresAuth: true },
    { id: 'cmd-unlock', label: 'Unlock System', icon: '🔓', category: 'security', action: () => handleUnlock(), enabled: true, requiresAuth: true },
    
    // Integration Commands
    { id: 'cmd-connect-jedi', label: 'Connect JEDI', icon: '⚡', category: 'integration', action: () => handleConnectJedi(), enabled: true, requiresAuth: false },
    { id: 'cmd-sync-wongi', label: 'Sync WONGI', icon: '🏥', category: 'integration', action: () => handleSyncWongi(), enabled: true, requiresAuth: false },
    { id: 'cmd-run-hitch', label: 'Run Python Hitch', icon: '🐍', category: 'integration', action: () => handleRunHitch(), enabled: true, requiresAuth: true },
    { id: 'cmd-test-webhooks', label: 'Test Webhooks', icon: '🔗', category: 'integration', action: () => handleTestWebhooks(), enabled: true, requiresAuth: false },
  ];

  // Command Handlers
  const handleSyncAll = () => console.log('Syncing all systems...');
  const handleRefresh = () => setObjects([...INITIAL_OBJECTS]);
  const handleRestart = () => console.log('Restarting services...');
  const handleBackup = () => console.log('Creating backup...');
  const handleImport = () => console.log('Importing data...');
  const handleExport = () => console.log('Exporting data...');
  const handleValidate = () => console.log('Validating data...');
  const handleCleanup = () => console.log('Cleaning up data...');
  const handleBroadcast = () => console.log('Broadcasting message...');
  const handleNotify = () => console.log('Sending notification...');
  const handleAlert = () => console.log('Triggering alert...');
  const handleAudit = () => console.log('Running audit...');
  const handleLock = () => console.log('Locking system...');
  const handleUnlock = () => console.log('Unlocking system...');
  const handleConnectJedi = () => console.log('Connecting to JEDI...');
  const handleSyncWongi = () => console.log('Syncing WONGI...');
  const handleRunHitch = () => console.log('Running Python Hitch...');
  const handleTestWebhooks = () => console.log('Testing webhooks...');

  // Filter objects
  const filteredObjects = objects.filter(obj => {
    const matchesType = filterType === 'all' || obj.type === filterType;
    const matchesSearch = obj.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Toggle object enabled state
  const toggleObjectEnabled = (objectId: string) => {
    setObjects(prev => prev.map(obj => 
      obj.id === objectId ? { ...obj, enabled: !obj.enabled, state: !obj.enabled ? 'active' : 'inactive' } : obj
    ));
  };

  // Render object card
  const renderObjectCard = (obj: ControlObject) => (
    <TouchableOpacity
      key={obj.id}
      className="bg-surface rounded-xl p-4 mb-3 border border-border"
      onPress={() => { setSelectedObject(obj); setShowConfigModal(true); }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <Text className="text-2xl mr-3">{TYPE_ICONS[obj.type]}</Text>
          <View className="flex-1">
            <Text className="text-foreground font-semibold">{obj.name}</Text>
            <Text className="text-muted text-xs capitalize">{obj.type}</Text>
          </View>
        </View>
        <View className="flex-row items-center">
          <View 
            style={{ 
              width: 10, 
              height: 10, 
              borderRadius: 5, 
              backgroundColor: STATE_COLORS[obj.state],
              marginRight: 8 
            }} 
          />
          <Switch
            value={obj.enabled}
            onValueChange={() => toggleObjectEnabled(obj.id)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={obj.enabled ? '#0066CC' : '#f4f3f4'}
          />
        </View>
      </View>
      {obj.dependencies && obj.dependencies.length > 0 && (
        <View className="mt-2 flex-row flex-wrap">
          {obj.dependencies.map(dep => (
            <View key={dep} className="bg-primary/10 rounded px-2 py-1 mr-1 mb-1">
              <Text className="text-xs text-primary">{dep}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  // Render command button
  const renderCommandButton = (cmd: CommandOption) => (
    <TouchableOpacity
      key={cmd.id}
      className={`bg-surface rounded-xl p-4 m-1 items-center justify-center border border-border ${!cmd.enabled ? 'opacity-50' : ''}`}
      style={{ width: 100, height: 100 }}
      onPress={cmd.action}
      disabled={!cmd.enabled}
    >
      <Text className="text-3xl mb-2">{cmd.icon}</Text>
      <Text className="text-foreground text-xs text-center font-medium">{cmd.label}</Text>
      {cmd.requiresAuth && (
        <Text className="text-warning text-xs mt-1">🔐</Text>
      )}
    </TouchableOpacity>
  );

  // Render button matrix
  const renderButtonMatrix = () => {
    const categories = ['system', 'data', 'communication', 'security', 'integration'];
    return (
      <View>
        {categories.map(category => (
          <View key={category} className="mb-4">
            <Text className="text-foreground font-bold text-lg mb-2 capitalize">{category}</Text>
            <View className="flex-row flex-wrap">
              {commandOptions
                .filter(cmd => cmd.category === category)
                .map(renderCommandButton)}
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color="#0066CC" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground">Object Control Panel</Text>
          <TouchableOpacity className="p-2" onPress={() => router.push('/webhooks')}>
            <Text className="text-2xl">⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Selector */}
        <View className="flex-row bg-surface rounded-xl p-1 mb-4">
          {[
            { id: 'objects' as const, label: 'Objects', icon: '📦' },
            { id: 'commands' as const, label: 'Commands', icon: '⚡' },
            { id: 'matrix' as const, label: 'Matrix', icon: '🔲' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              className={`flex-1 py-3 rounded-lg ${activeTab === tab.id ? 'bg-primary' : ''}`}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text className={`text-center font-medium ${activeTab === tab.id ? 'text-white' : 'text-foreground'}`}>
                {tab.icon} {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Objects Tab */}
        {activeTab === 'objects' && (
          <View>
            {/* Search and Filter */}
            <View className="mb-4">
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-3"
                placeholder="Search objects..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {['all', 'module', 'portal', 'integration', 'webhook'].map(type => (
                    <TouchableOpacity
                      key={type}
                      className={`px-4 py-2 rounded-full ${filterType === type ? 'bg-primary' : 'bg-surface border border-border'}`}
                      onPress={() => setFilterType(type)}
                    >
                      <Text className={`capitalize ${filterType === type ? 'text-white' : 'text-foreground'}`}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Object Stats */}
            <View className="flex-row mb-4">
              <View className="flex-1 bg-success/10 rounded-xl p-3 mr-2">
                <Text className="text-success text-2xl font-bold">{objects.filter(o => o.state === 'active').length}</Text>
                <Text className="text-success text-xs">Active</Text>
              </View>
              <View className="flex-1 bg-warning/10 rounded-xl p-3 mr-2">
                <Text className="text-warning text-2xl font-bold">{objects.filter(o => o.state === 'pending').length}</Text>
                <Text className="text-warning text-xs">Pending</Text>
              </View>
              <View className="flex-1 bg-error/10 rounded-xl p-3">
                <Text className="text-error text-2xl font-bold">{objects.filter(o => o.state === 'error').length}</Text>
                <Text className="text-error text-xs">Error</Text>
              </View>
            </View>

            {/* Object List */}
            {filteredObjects.map(renderObjectCard)}
          </View>
        )}

        {/* Commands Tab */}
        {activeTab === 'commands' && (
          <View>
            <Text className="text-foreground font-bold text-lg mb-4">Command Centre</Text>
            <View className="flex-row flex-wrap justify-center">
              {commandOptions.map(renderCommandButton)}
            </View>
          </View>
        )}

        {/* Matrix Tab */}
        {activeTab === 'matrix' && (
          <View>
            <Text className="text-foreground font-bold text-lg mb-4">Button Matrix Portal</Text>
            {renderButtonMatrix()}
          </View>
        )}

        {/* Quick Actions */}
        <View className="mt-6 mb-8">
          <Text className="text-foreground font-bold text-lg mb-3">Quick Actions</Text>
          <View className="flex-row flex-wrap">
            <TouchableOpacity 
              className="bg-primary rounded-xl px-4 py-3 mr-2 mb-2"
              onPress={() => router.push('/master-jedi-control')}
            >
              <Text className="text-white font-medium">🎖️ Master JEDI Control</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="bg-success rounded-xl px-4 py-3 mr-2 mb-2"
              onPress={() => router.push('/module-scanner')}
            >
              <Text className="text-white font-medium">📡 Module Scanner</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="bg-warning rounded-xl px-4 py-3 mr-2 mb-2"
              onPress={() => router.push('/integration-control-arm')}
            >
              <Text className="text-white font-medium">🦾 Integration Arm</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="bg-error rounded-xl px-4 py-3 mb-2"
              onPress={() => router.push('/roles-manager')}
            >
              <Text className="text-white font-medium">👥 Roles Manager</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Config Modal */}
      <Modal
        visible={showConfigModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowConfigModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-foreground">
                {selectedObject?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowConfigModal(false)}>
                <Text className="text-2xl">✕</Text>
              </TouchableOpacity>
            </View>
            
            {selectedObject && (
              <ScrollView>
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">Type</Text>
                  <Text className="text-foreground capitalize">{selectedObject.type}</Text>
                </View>
                
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">State</Text>
                  <View className="flex-row items-center">
                    <View 
                      style={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: 6, 
                        backgroundColor: STATE_COLORS[selectedObject.state],
                        marginRight: 8 
                      }} 
                    />
                    <Text className="text-foreground capitalize">{selectedObject.state}</Text>
                  </View>
                </View>
                
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">Permissions</Text>
                  <View className="flex-row flex-wrap">
                    {selectedObject.permissions.map(perm => (
                      <View key={perm} className="bg-primary/10 rounded px-2 py-1 mr-1 mb-1">
                        <Text className="text-xs text-primary capitalize">{perm}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">Configuration</Text>
                  <View className="bg-surface rounded-xl p-3">
                    <Text className="text-foreground font-mono text-xs">
                      {JSON.stringify(selectedObject.config, null, 2)}
                    </Text>
                  </View>
                </View>
                
                {selectedObject.dependencies && selectedObject.dependencies.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-muted text-sm mb-1">Dependencies</Text>
                    <View className="flex-row flex-wrap">
                      {selectedObject.dependencies.map(dep => (
                        <View key={dep} className="bg-warning/10 rounded px-2 py-1 mr-1 mb-1">
                          <Text className="text-xs text-warning">{dep}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                
                <View className="flex-row mt-4">
                  <TouchableOpacity 
                    className="flex-1 bg-primary rounded-xl py-3 mr-2"
                    onPress={() => setShowConfigModal(false)}
                  >
                    <Text className="text-white text-center font-medium">Save Changes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="flex-1 bg-error rounded-xl py-3"
                    onPress={() => {
                      toggleObjectEnabled(selectedObject.id);
                      setShowConfigModal(false);
                    }}
                  >
                    <Text className="text-white text-center font-medium">
                      {selectedObject.enabled ? 'Disable' : 'Enable'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
