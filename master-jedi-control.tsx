import { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Switch, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';

// JEDI Command Levels
type CommandLevel = 'padawan' | 'knight' | 'master' | 'council' | 'grandmaster';

// JEDI System Node
interface JediNode {
  id: string;
  name: string;
  type: 'hub' | 'beacon' | 'station' | 'relay' | 'archive';
  status: 'online' | 'offline' | 'syncing' | 'error';
  endpoint: string;
  lastPing: number;
  latency: number;
  commandLevel: CommandLevel;
}

// Control Directive
interface ControlDirective {
  id: string;
  name: string;
  description: string;
  level: CommandLevel;
  category: 'operations' | 'security' | 'data' | 'communications' | 'emergency';
  enabled: boolean;
  parameters?: Record<string, any>;
}

// Hospital Role Mapping
interface HospitalRole {
  id: string;
  name: string;
  jediLevel: CommandLevel;
  permissions: string[];
  modules: string[];
  color: string;
}

// JEDI Nodes Configuration
const JEDI_NODES: JediNode[] = [
  { id: 'main-hub', name: 'JediTek Main Hub', type: 'hub', status: 'online', endpoint: 'https://jeditek.com.au', lastPing: Date.now(), latency: 45, commandLevel: 'grandmaster' },
  { id: 'wongi-station', name: 'WONGI Station', type: 'station', status: 'online', endpoint: 'https://jeditek.net', lastPing: Date.now(), latency: 52, commandLevel: 'master' },
  { id: 'nexus-beacon', name: 'Nexus Beacon', type: 'beacon', status: 'online', endpoint: 'https://nexus.jeditek.net', lastPing: Date.now(), latency: 38, commandLevel: 'master' },
  { id: 'alpha-prime', name: 'AlphaPrime', type: 'hub', status: 'online', endpoint: 'https://alphaprime.jeditek.com.au', lastPing: Date.now(), latency: 41, commandLevel: 'council' },
  { id: 'smpo-archive', name: 'SMPO.ink Archive', type: 'archive', status: 'online', endpoint: 'https://smpo-ink.manus.space', lastPing: Date.now(), latency: 65, commandLevel: 'master' },
  { id: 'medivac-relay', name: 'MediVac Relay', type: 'relay', status: 'online', endpoint: 'https://wongi.com.au', lastPing: Date.now(), latency: 33, commandLevel: 'knight' },
  { id: 'evidence-archive', name: 'Evidence Portal', type: 'archive', status: 'syncing', endpoint: 'https://smpo-evidance-port.manus.space', lastPing: Date.now(), latency: 78, commandLevel: 'council' },
  { id: 'jedi-systems', name: 'JEDI Systems Core', type: 'hub', status: 'online', endpoint: 'https://jeditek.org', lastPing: Date.now(), latency: 29, commandLevel: 'grandmaster' },
];

// Control Directives
const CONTROL_DIRECTIVES: ControlDirective[] = [
  // Operations
  { id: 'dir-sync-all', name: 'Global Sync', description: 'Synchronize all JEDI nodes', level: 'master', category: 'operations', enabled: true },
  { id: 'dir-backup', name: 'System Backup', description: 'Create full system backup', level: 'council', category: 'operations', enabled: true },
  { id: 'dir-restore', name: 'System Restore', description: 'Restore from backup point', level: 'grandmaster', category: 'operations', enabled: true },
  { id: 'dir-maintenance', name: 'Maintenance Mode', description: 'Enable maintenance mode', level: 'master', category: 'operations', enabled: false },
  
  // Security
  { id: 'dir-lockdown', name: 'System Lockdown', description: 'Emergency system lockdown', level: 'grandmaster', category: 'security', enabled: true },
  { id: 'dir-audit', name: 'Security Audit', description: 'Run comprehensive audit', level: 'council', category: 'security', enabled: true },
  { id: 'dir-encryption', name: 'Force Encryption', description: 'Enable forced encryption', level: 'master', category: 'security', enabled: true },
  { id: 'dir-2fa', name: 'Enforce 2FA', description: 'Require two-factor auth', level: 'master', category: 'security', enabled: true },
  
  // Data
  { id: 'dir-purge', name: 'Data Purge', description: 'Purge expired data', level: 'council', category: 'data', enabled: true },
  { id: 'dir-archive', name: 'Archive Data', description: 'Archive old records', level: 'master', category: 'data', enabled: true },
  { id: 'dir-validate', name: 'Data Validation', description: 'Validate data integrity', level: 'knight', category: 'data', enabled: true },
  { id: 'dir-migrate', name: 'Data Migration', description: 'Migrate to new schema', level: 'grandmaster', category: 'data', enabled: false },
  
  // Communications
  { id: 'dir-broadcast', name: 'Global Broadcast', description: 'Send to all nodes', level: 'council', category: 'communications', enabled: true },
  { id: 'dir-silence', name: 'Radio Silence', description: 'Disable all comms', level: 'grandmaster', category: 'communications', enabled: true },
  { id: 'dir-priority', name: 'Priority Channel', description: 'Open priority channel', level: 'master', category: 'communications', enabled: true },
  
  // Emergency
  { id: 'dir-evac', name: 'Data Evacuation', description: 'Emergency data evac', level: 'grandmaster', category: 'emergency', enabled: true },
  { id: 'dir-failover', name: 'Failover Mode', description: 'Activate failover', level: 'council', category: 'emergency', enabled: true },
  { id: 'dir-shutdown', name: 'Emergency Shutdown', description: 'Complete shutdown', level: 'grandmaster', category: 'emergency', enabled: true },
];

// Hospital Roles with JEDI Mapping
const HOSPITAL_ROLES: HospitalRole[] = [
  { id: 'role-admin', name: 'Administrator', jediLevel: 'grandmaster', permissions: ['all'], modules: ['all'], color: '#9333EA' },
  { id: 'role-chief', name: 'Chief Medical Officer', jediLevel: 'council', permissions: ['view', 'edit', 'create', 'delete', 'approve'], modules: ['patient', 'doctors', 'surgery', 'labs', 'reports'], color: '#DC2626' },
  { id: 'role-doctor', name: 'Doctor', jediLevel: 'master', permissions: ['view', 'edit', 'create'], modules: ['patient', 'medication', 'labs', 'appointments'], color: '#2563EB' },
  { id: 'role-nurse', name: 'Nurse', jediLevel: 'knight', permissions: ['view', 'edit'], modules: ['patient', 'medication', 'rooms', 'tasks'], color: '#16A34A' },
  { id: 'role-staff', name: 'Staff', jediLevel: 'padawan', permissions: ['view'], modules: ['appointments', 'rooms', 'inventory'], color: '#CA8A04' },
  { id: 'role-security', name: 'Security Guard', jediLevel: 'knight', permissions: ['view', 'edit'], modules: ['guard_handover', 'alerts', 'incidents'], color: '#0891B2' },
];

// Level Colors
const LEVEL_COLORS: Record<CommandLevel, string> = {
  padawan: '#CA8A04',
  knight: '#16A34A',
  master: '#2563EB',
  council: '#DC2626',
  grandmaster: '#9333EA',
};

// Status Colors
const STATUS_COLORS: Record<string, string> = {
  online: '#22C55E',
  offline: '#EF4444',
  syncing: '#F59E0B',
  error: '#DC2626',
};

// Type Icons
const TYPE_ICONS: Record<string, string> = {
  hub: '🏛️',
  beacon: '📡',
  station: '🛰️',
  relay: '📶',
  archive: '🗄️',
};

export default function MasterJediControlScreen() {
  const router = useRouter();
  const [nodes, setNodes] = useState<JediNode[]>(JEDI_NODES);
  const [directives, setDirectives] = useState<ControlDirective[]>(CONTROL_DIRECTIVES);
  const [activeTab, setActiveTab] = useState<'nodes' | 'directives' | 'roles' | 'matrix'>('nodes');
  const [selectedNode, setSelectedNode] = useState<JediNode | null>(null);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<CommandLevel>('master');

  // Toggle directive
  const toggleDirective = (directiveId: string) => {
    setDirectives(prev => prev.map(d => 
      d.id === directiveId ? { ...d, enabled: !d.enabled } : d
    ));
  };

  // Check if user can execute directive
  const canExecuteDirective = (directive: ControlDirective): boolean => {
    const levels: CommandLevel[] = ['padawan', 'knight', 'master', 'council', 'grandmaster'];
    return levels.indexOf(currentLevel) >= levels.indexOf(directive.level);
  };

  // Render node card
  const renderNodeCard = (node: JediNode) => (
    <TouchableOpacity
      key={node.id}
      className="bg-surface rounded-xl p-4 mb-3 border border-border"
      onPress={() => { setSelectedNode(node); setShowNodeModal(true); }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <Text className="text-2xl mr-3">{TYPE_ICONS[node.type]}</Text>
          <View className="flex-1">
            <Text className="text-foreground font-semibold">{node.name}</Text>
            <Text className="text-muted text-xs">{node.endpoint}</Text>
          </View>
        </View>
        <View className="items-end">
          <View className="flex-row items-center">
            <View 
              style={{ 
                width: 10, 
                height: 10, 
                borderRadius: 5, 
                backgroundColor: STATUS_COLORS[node.status],
                marginRight: 6 
              }} 
            />
            <Text className="text-foreground text-xs capitalize">{node.status}</Text>
          </View>
          <Text className="text-muted text-xs mt-1">{node.latency}ms</Text>
        </View>
      </View>
      <View className="mt-2 flex-row items-center justify-between">
        <View 
          className="px-2 py-1 rounded"
          style={{ backgroundColor: LEVEL_COLORS[node.commandLevel] + '20' }}
        >
          <Text style={{ color: LEVEL_COLORS[node.commandLevel] }} className="text-xs font-medium capitalize">
            {node.commandLevel}
          </Text>
        </View>
        <Text className="text-muted text-xs">
          Last ping: {new Date(node.lastPing).toLocaleTimeString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Render directive card
  const renderDirectiveCard = (directive: ControlDirective) => {
    const canExecute = canExecuteDirective(directive);
    return (
      <View
        key={directive.id}
        className={`bg-surface rounded-xl p-4 mb-3 border border-border ${!canExecute ? 'opacity-50' : ''}`}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-foreground font-semibold">{directive.name}</Text>
              <View 
                className="ml-2 px-2 py-0.5 rounded"
                style={{ backgroundColor: LEVEL_COLORS[directive.level] + '20' }}
              >
                <Text style={{ color: LEVEL_COLORS[directive.level] }} className="text-xs capitalize">
                  {directive.level}
                </Text>
              </View>
            </View>
            <Text className="text-muted text-xs mt-1">{directive.description}</Text>
          </View>
          <Switch
            value={directive.enabled}
            onValueChange={() => toggleDirective(directive.id)}
            disabled={!canExecute}
            trackColor={{ false: '#767577', true: LEVEL_COLORS[directive.level] + '80' }}
            thumbColor={directive.enabled ? LEVEL_COLORS[directive.level] : '#f4f3f4'}
          />
        </View>
      </View>
    );
  };

  // Render role card
  const renderRoleCard = (role: HospitalRole) => (
    <View
      key={role.id}
      className="bg-surface rounded-xl p-4 mb-3 border border-border"
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <View 
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: role.color + '20' }}
          >
            <Text style={{ color: role.color }} className="text-lg">👤</Text>
          </View>
          <View>
            <Text className="text-foreground font-semibold">{role.name}</Text>
            <View 
              className="px-2 py-0.5 rounded mt-1"
              style={{ backgroundColor: LEVEL_COLORS[role.jediLevel] + '20' }}
            >
              <Text style={{ color: LEVEL_COLORS[role.jediLevel] }} className="text-xs capitalize">
                JEDI {role.jediLevel}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View className="mt-2">
        <Text className="text-muted text-xs mb-1">Permissions</Text>
        <View className="flex-row flex-wrap">
          {role.permissions.slice(0, 4).map(perm => (
            <View key={perm} className="bg-primary/10 rounded px-2 py-1 mr-1 mb-1">
              <Text className="text-xs text-primary capitalize">{perm}</Text>
            </View>
          ))}
          {role.permissions.length > 4 && (
            <View className="bg-muted/20 rounded px-2 py-1">
              <Text className="text-xs text-muted">+{role.permissions.length - 4}</Text>
            </View>
          )}
        </View>
      </View>
      <View className="mt-2">
        <Text className="text-muted text-xs mb-1">Modules</Text>
        <View className="flex-row flex-wrap">
          {role.modules.slice(0, 4).map(mod => (
            <View key={mod} className="bg-success/10 rounded px-2 py-1 mr-1 mb-1">
              <Text className="text-xs text-success capitalize">{mod}</Text>
            </View>
          ))}
          {role.modules.length > 4 && (
            <View className="bg-muted/20 rounded px-2 py-1">
              <Text className="text-xs text-muted">+{role.modules.length - 4}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  // Render command matrix
  const renderCommandMatrix = () => {
    const categories = ['operations', 'security', 'data', 'communications', 'emergency'];
    return (
      <View>
        {categories.map(category => (
          <View key={category} className="mb-4">
            <Text className="text-foreground font-bold text-lg mb-2 capitalize">{category}</Text>
            <View className="flex-row flex-wrap">
              {directives
                .filter(d => d.category === category)
                .map(directive => {
                  const canExecute = canExecuteDirective(directive);
                  return (
                    <TouchableOpacity
                      key={directive.id}
                      className={`bg-surface rounded-xl p-3 m-1 items-center justify-center border ${directive.enabled ? 'border-primary' : 'border-border'} ${!canExecute ? 'opacity-50' : ''}`}
                      style={{ width: 100, height: 80 }}
                      onPress={() => canExecute && toggleDirective(directive.id)}
                      disabled={!canExecute}
                    >
                      <View 
                        className="w-8 h-8 rounded-full items-center justify-center mb-1"
                        style={{ backgroundColor: directive.enabled ? LEVEL_COLORS[directive.level] : '#9CA3AF' }}
                      >
                        <Text className="text-white text-xs">
                          {directive.enabled ? '✓' : '○'}
                        </Text>
                      </View>
                      <Text className="text-foreground text-xs text-center font-medium" numberOfLines={2}>
                        {directive.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
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
            <IconSymbol name="chevron.right" size={24} color="#0066CC" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground">Master JEDI Control</Text>
          <View className="p-2">
            <Text className="text-2xl">🎖️</Text>
          </View>
        </View>

        {/* Current Level Selector */}
        <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
          <Text className="text-foreground font-semibold mb-2">Current Command Level</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {(['padawan', 'knight', 'master', 'council', 'grandmaster'] as CommandLevel[]).map(level => (
                <TouchableOpacity
                  key={level}
                  className={`px-4 py-2 rounded-full`}
                  style={{ 
                    backgroundColor: currentLevel === level ? LEVEL_COLORS[level] : LEVEL_COLORS[level] + '20',
                  }}
                  onPress={() => setCurrentLevel(level)}
                >
                  <Text 
                    className="capitalize font-medium"
                    style={{ color: currentLevel === level ? '#FFFFFF' : LEVEL_COLORS[level] }}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Tab Selector */}
        <View className="flex-row bg-surface rounded-xl p-1 mb-4">
          {[
            { id: 'nodes' as const, label: 'Nodes', icon: '🛰️' },
            { id: 'directives' as const, label: 'Directives', icon: '📜' },
            { id: 'roles' as const, label: 'Roles', icon: '👥' },
            { id: 'matrix' as const, label: 'Matrix', icon: '🔲' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              className={`flex-1 py-2 rounded-lg ${activeTab === tab.id ? 'bg-primary' : ''}`}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text className={`text-center text-sm ${activeTab === tab.id ? 'text-white font-medium' : 'text-foreground'}`}>
                {tab.icon} {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* System Stats */}
        <View className="flex-row mb-4">
          <View className="flex-1 bg-success/10 rounded-xl p-3 mr-2">
            <Text className="text-success text-xl font-bold">{nodes.filter(n => n.status === 'online').length}</Text>
            <Text className="text-success text-xs">Online</Text>
          </View>
          <View className="flex-1 bg-warning/10 rounded-xl p-3 mr-2">
            <Text className="text-warning text-xl font-bold">{nodes.filter(n => n.status === 'syncing').length}</Text>
            <Text className="text-warning text-xs">Syncing</Text>
          </View>
          <View className="flex-1 bg-error/10 rounded-xl p-3 mr-2">
            <Text className="text-error text-xl font-bold">{nodes.filter(n => n.status === 'offline' || n.status === 'error').length}</Text>
            <Text className="text-error text-xs">Offline</Text>
          </View>
          <View className="flex-1 bg-primary/10 rounded-xl p-3">
            <Text className="text-primary text-xl font-bold">{directives.filter(d => d.enabled).length}</Text>
            <Text className="text-primary text-xs">Active</Text>
          </View>
        </View>

        {/* Nodes Tab */}
        {activeTab === 'nodes' && (
          <View>
            <Text className="text-foreground font-bold text-lg mb-3">JEDI Network Nodes</Text>
            {nodes.map(renderNodeCard)}
          </View>
        )}

        {/* Directives Tab */}
        {activeTab === 'directives' && (
          <View>
            <Text className="text-foreground font-bold text-lg mb-3">Control Directives</Text>
            {['operations', 'security', 'data', 'communications', 'emergency'].map(category => (
              <View key={category} className="mb-4">
                <Text className="text-muted font-semibold text-sm mb-2 uppercase">{category}</Text>
                {directives.filter(d => d.category === category).map(renderDirectiveCard)}
              </View>
            ))}
          </View>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <View>
            <Text className="text-foreground font-bold text-lg mb-3">Hospital Roles</Text>
            {HOSPITAL_ROLES.map(renderRoleCard)}
          </View>
        )}

        {/* Matrix Tab */}
        {activeTab === 'matrix' && (
          <View>
            <Text className="text-foreground font-bold text-lg mb-3">Command Matrix</Text>
            {renderCommandMatrix()}
          </View>
        )}

        {/* Quick Actions */}
        <View className="mt-6 mb-8">
          <Text className="text-foreground font-bold text-lg mb-3">Quick Actions</Text>
          <View className="flex-row flex-wrap">
            <TouchableOpacity className="bg-primary rounded-xl px-4 py-3 mr-2 mb-2">
              <Text className="text-white font-medium">🔄 Sync All Nodes</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-success rounded-xl px-4 py-3 mr-2 mb-2">
              <Text className="text-white font-medium">✅ Run Diagnostics</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-warning rounded-xl px-4 py-3 mr-2 mb-2">
              <Text className="text-white font-medium">📊 View Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-error rounded-xl px-4 py-3 mb-2">
              <Text className="text-white font-medium">🚨 Emergency</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Node Detail Modal */}
      <Modal
        visible={showNodeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNodeModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-foreground">
                {selectedNode?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowNodeModal(false)}>
                <Text className="text-2xl">✕</Text>
              </TouchableOpacity>
            </View>
            
            {selectedNode && (
              <ScrollView>
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">Type</Text>
                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-2">{TYPE_ICONS[selectedNode.type]}</Text>
                    <Text className="text-foreground capitalize">{selectedNode.type}</Text>
                  </View>
                </View>
                
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">Status</Text>
                  <View className="flex-row items-center">
                    <View 
                      style={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: 6, 
                        backgroundColor: STATUS_COLORS[selectedNode.status],
                        marginRight: 8 
                      }} 
                    />
                    <Text className="text-foreground capitalize">{selectedNode.status}</Text>
                  </View>
                </View>
                
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">Endpoint</Text>
                  <Text className="text-primary">{selectedNode.endpoint}</Text>
                </View>
                
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">Command Level</Text>
                  <View 
                    className="px-3 py-1 rounded self-start"
                    style={{ backgroundColor: LEVEL_COLORS[selectedNode.commandLevel] + '20' }}
                  >
                    <Text style={{ color: LEVEL_COLORS[selectedNode.commandLevel] }} className="font-medium capitalize">
                      {selectedNode.commandLevel}
                    </Text>
                  </View>
                </View>
                
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">Latency</Text>
                  <Text className="text-foreground">{selectedNode.latency}ms</Text>
                </View>
                
                <View className="flex-row mt-4">
                  <TouchableOpacity 
                    className="flex-1 bg-primary rounded-xl py-3 mr-2"
                    onPress={() => setShowNodeModal(false)}
                  >
                    <Text className="text-white text-center font-medium">Ping Node</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="flex-1 bg-success rounded-xl py-3"
                    onPress={() => setShowNodeModal(false)}
                  >
                    <Text className="text-white text-center font-medium">Sync Data</Text>
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
