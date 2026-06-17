import { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Switch, TextInput, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';

// Integration Types
type IntegrationType = 'api' | 'webhook' | 'oauth' | 'database' | 'file' | 'realtime';
type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'syncing' | 'pending';

// Integration Endpoint
interface IntegrationEndpoint {
  id: string;
  name: string;
  type: IntegrationType;
  status: IntegrationStatus;
  url: string;
  description: string;
  lastSync: number;
  category: string;
  authMethod: 'api_key' | 'oauth' | 'basic' | 'token' | 'none';
  enabled: boolean;
  config?: Record<string, any>;
}

// Scan Instruction
interface ScanInstruction {
  id: string;
  name: string;
  description: string;
  target: string;
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';
  lastRun: number;
  nextRun: number;
  status: 'active' | 'paused' | 'error';
  actions: string[];
}

// JEDI Portal Endpoints
const JEDI_ENDPOINTS: IntegrationEndpoint[] = [
  // Main Portals
  { id: 'ep-main', name: 'JediTek Main', type: 'api', status: 'connected', url: 'https://jeditek.com.au', description: 'Main JediTek portal', lastSync: Date.now(), category: 'Portal', authMethod: 'oauth', enabled: true },
  { id: 'ep-wongi', name: 'WONGI Station', type: 'api', status: 'connected', url: 'https://jeditek.net', description: 'WONGI community communications', lastSync: Date.now(), category: 'Portal', authMethod: 'oauth', enabled: true },
  { id: 'ep-nexus', name: 'Nexus Beacon', type: 'realtime', status: 'connected', url: 'https://nexus.jeditek.net', description: 'Real-time beacon system', lastSync: Date.now(), category: 'Portal', authMethod: 'token', enabled: true },
  { id: 'ep-alpha', name: 'AlphaPrime', type: 'api', status: 'connected', url: 'https://alphaprime.jeditek.com.au', description: 'JEDI systems download portal', lastSync: Date.now(), category: 'Portal', authMethod: 'oauth', enabled: true },
  { id: 'ep-iskool', name: 'iSkoolEDU', type: 'api', status: 'connected', url: 'https://iskooledu.jeditek.com.au', description: 'Education platform', lastSync: Date.now(), category: 'Portal', authMethod: 'oauth', enabled: true },
  { id: 'ep-medivac', name: 'MediVac One', type: 'api', status: 'connected', url: 'https://wongi.com.au', description: 'Virtual hospital system', lastSync: Date.now(), category: 'Portal', authMethod: 'oauth', enabled: true },
  { id: 'ep-master', name: 'Master Class', type: 'api', status: 'connected', url: 'https://master.jeditek.com.au', description: 'Training platform', lastSync: Date.now(), category: 'Portal', authMethod: 'oauth', enabled: true },
  
  // SMPO.ink Systems
  { id: 'ep-smpo-kb', name: 'SMPO Knowledge Base', type: 'api', status: 'connected', url: 'https://smpo-ink.manus.space', description: 'JEDI Knowledge Base', lastSync: Date.now(), category: 'SMPO.ink', authMethod: 'token', enabled: true },
  { id: 'ep-smpo-evidence', name: 'Evidence Portal', type: 'database', status: 'connected', url: 'https://smpo-evidance-port.manus.space', description: 'Evidence documentation', lastSync: Date.now(), category: 'SMPO.ink', authMethod: 'token', enabled: true },
  { id: 'ep-smpo-case', name: 'Case Portal', type: 'api', status: 'connected', url: 'https://orazi-case.manus.space', description: 'Case management', lastSync: Date.now(), category: 'SMPO.ink', authMethod: 'token', enabled: true },
  
  // JEDI Systems
  { id: 'ep-jedi-org', name: 'JEDI Systems Core', type: 'api', status: 'connected', url: 'https://jeditek.org', description: 'Core JEDI integrated system', lastSync: Date.now(), category: 'JEDI', authMethod: 'oauth', enabled: true },
  { id: 'ep-jedi-xyz', name: 'JEDI Downloads', type: 'file', status: 'connected', url: 'https://jeditek.xyz', description: 'AlphaPrime downloads', lastSync: Date.now(), category: 'JEDI', authMethod: 'api_key', enabled: true },
  { id: 'ep-jedi-click', name: 'JEDI Backend', type: 'api', status: 'connected', url: 'https://jedi.click', description: 'JEDI system backend', lastSync: Date.now(), category: 'JEDI', authMethod: 'token', enabled: true },
  { id: 'ep-death-star', name: 'Death Star VIP', type: 'api', status: 'connected', url: 'https://death-star.vip', description: 'JEDI integrated platform', lastSync: Date.now(), category: 'JEDI', authMethod: 'oauth', enabled: true },
  
  // Manus Space Apps
  { id: 'ep-jedi-church', name: 'JEDI Church', type: 'api', status: 'connected', url: 'https://jedi-church.manus.space', description: 'Resource hub', lastSync: Date.now(), category: 'Manus', authMethod: 'token', enabled: true },
  { id: 'ep-jedi-camp', name: 'JEDI Camp', type: 'api', status: 'connected', url: 'https://jedi-camp.manus.space', description: 'Training camp', lastSync: Date.now(), category: 'Manus', authMethod: 'token', enabled: true },
  { id: 'ep-jedi-nav', name: 'JEDI Nav', type: 'api', status: 'connected', url: 'https://jedi-nav.manus.space', description: 'Navigation system', lastSync: Date.now(), category: 'Manus', authMethod: 'token', enabled: true },
  { id: 'ep-falcon', name: 'Falcon Command', type: 'realtime', status: 'connected', url: 'https://falcon.manus.space', description: 'Project Falcon command center', lastSync: Date.now(), category: 'Manus', authMethod: 'token', enabled: true },
  { id: 'ep-photon', name: 'Photon V2', type: 'api', status: 'connected', url: 'https://photonv2-f4bwwnhc.manus.space', description: 'Photon system', lastSync: Date.now(), category: 'Manus', authMethod: 'token', enabled: true },
  
  // Webhooks
  { id: 'ep-webhook-patient', name: 'Patient Webhook', type: 'webhook', status: 'connected', url: '/api/webhooks/patient', description: 'Patient data sync', lastSync: Date.now(), category: 'Webhook', authMethod: 'api_key', enabled: true },
  { id: 'ep-webhook-alert', name: 'Alert Webhook', type: 'webhook', status: 'connected', url: '/api/webhooks/alerts', description: 'Critical alerts', lastSync: Date.now(), category: 'Webhook', authMethod: 'api_key', enabled: true },
  { id: 'ep-webhook-sync', name: 'Sync Webhook', type: 'webhook', status: 'connected', url: '/api/webhooks/sync', description: 'Data synchronization', lastSync: Date.now(), category: 'Webhook', authMethod: 'api_key', enabled: true },
  
  // Storage
  { id: 'ep-s3', name: 'S3 Storage', type: 'file', status: 'connected', url: 's3://jedi-medivac-bucket', description: 'Cloud file storage', lastSync: Date.now(), category: 'Storage', authMethod: 'api_key', enabled: true },
  { id: 'ep-l3-cache', name: 'L3 Cache', type: 'database', status: 'connected', url: 'redis://l3-cache.jeditek.net', description: 'L3 cache layer', lastSync: Date.now(), category: 'Storage', authMethod: 'token', enabled: true },
];

// Scan Instructions
const SCAN_INSTRUCTIONS: ScanInstruction[] = [
  { id: 'scan-patient', name: 'Patient Data Scan', description: 'Scan and sync patient records', target: 'patient_records', frequency: 'realtime', lastRun: Date.now() - 60000, nextRun: Date.now(), status: 'active', actions: ['fetch', 'validate', 'sync', 'notify'] },
  { id: 'scan-inventory', name: 'Inventory Scan', description: 'Check inventory levels', target: 'inventory', frequency: 'hourly', lastRun: Date.now() - 3600000, nextRun: Date.now() + 3600000, status: 'active', actions: ['count', 'alert_low', 'reorder'] },
  { id: 'scan-appointments', name: 'Appointment Scan', description: 'Sync appointments with calendar', target: 'appointments', frequency: 'realtime', lastRun: Date.now() - 30000, nextRun: Date.now(), status: 'active', actions: ['fetch', 'merge', 'notify'] },
  { id: 'scan-jedi', name: 'JEDI Systems Scan', description: 'Check JEDI node connectivity', target: 'jedi_nodes', frequency: 'hourly', lastRun: Date.now() - 1800000, nextRun: Date.now() + 1800000, status: 'active', actions: ['ping', 'status', 'report'] },
  { id: 'scan-security', name: 'Security Scan', description: 'Security audit scan', target: 'security_logs', frequency: 'daily', lastRun: Date.now() - 86400000, nextRun: Date.now() + 86400000, status: 'active', actions: ['audit', 'detect', 'alert'] },
  { id: 'scan-backup', name: 'Backup Scan', description: 'Verify backup integrity', target: 'backups', frequency: 'daily', lastRun: Date.now() - 43200000, nextRun: Date.now() + 43200000, status: 'active', actions: ['verify', 'restore_test', 'report'] },
];

// Status Colors
const STATUS_COLORS: Record<IntegrationStatus, string> = {
  connected: '#22C55E',
  disconnected: '#9CA3AF',
  error: '#EF4444',
  syncing: '#F59E0B',
  pending: '#3B82F6',
};

// Type Icons
const TYPE_ICONS: Record<IntegrationType, string> = {
  api: '🔌',
  webhook: '🪝',
  oauth: '🔐',
  database: '🗄️',
  file: '📁',
  realtime: '⚡',
};

// Category Colors
const CATEGORY_COLORS: Record<string, string> = {
  Portal: '#3B82F6',
  'SMPO.ink': '#9333EA',
  JEDI: '#DC2626',
  Manus: '#16A34A',
  Webhook: '#F59E0B',
  Storage: '#0891B2',
};

export default function IntegrationControlArmScreen() {
  const router = useRouter();
  const [endpoints, setEndpoints] = useState<IntegrationEndpoint[]>(JEDI_ENDPOINTS);
  const [scanInstructions, setScanInstructions] = useState<ScanInstruction[]>(SCAN_INSTRUCTIONS);
  const [activeTab, setActiveTab] = useState<'endpoints' | 'scans' | 'logs'>('endpoints');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isScanning, setIsScanning] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<IntegrationEndpoint | null>(null);
  const [showEndpointModal, setShowEndpointModal] = useState(false);
  const [logs, setLogs] = useState<Array<{ timestamp: number; message: string; type: 'info' | 'success' | 'warning' | 'error' }>>([]);

  // Add log entry
  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setLogs(prev => [{ timestamp: Date.now(), message, type }, ...prev].slice(0, 100));
  };

  // Test connection
  const testConnection = async (endpoint: IntegrationEndpoint) => {
    addLog(`Testing connection to ${endpoint.name}...`, 'info');
    setEndpoints(prev => prev.map(ep => 
      ep.id === endpoint.id ? { ...ep, status: 'syncing' } : ep
    ));

    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 1500));

    const success = Math.random() > 0.1; // 90% success rate
    setEndpoints(prev => prev.map(ep => 
      ep.id === endpoint.id ? { ...ep, status: success ? 'connected' : 'error', lastSync: Date.now() } : ep
    ));

    addLog(
      success ? `✓ Connected to ${endpoint.name}` : `✗ Failed to connect to ${endpoint.name}`,
      success ? 'success' : 'error'
    );
  };

  // Toggle endpoint
  const toggleEndpoint = (endpointId: string) => {
    setEndpoints(prev => prev.map(ep => 
      ep.id === endpointId ? { ...ep, enabled: !ep.enabled } : ep
    ));
  };

  // Run scan
  const runScan = async (scan: ScanInstruction) => {
    addLog(`Running ${scan.name}...`, 'info');
    setScanInstructions(prev => prev.map(s => 
      s.id === scan.id ? { ...s, status: 'active' } : s
    ));

    // Simulate scan
    await new Promise(resolve => setTimeout(resolve, 2000));

    setScanInstructions(prev => prev.map(s => 
      s.id === scan.id ? { ...s, lastRun: Date.now() } : s
    ));

    addLog(`✓ ${scan.name} completed`, 'success');
  };

  // Run all scans
  const runAllScans = async () => {
    setIsScanning(true);
    addLog('Starting full system scan...', 'info');

    for (const scan of scanInstructions) {
      await runScan(scan);
    }

    setIsScanning(false);
    addLog('✓ All scans completed', 'success');
  };

  // Sync all endpoints
  const syncAllEndpoints = async () => {
    setIsScanning(true);
    addLog('Syncing all endpoints...', 'info');

    for (const endpoint of endpoints.filter(ep => ep.enabled)) {
      await testConnection(endpoint);
    }

    setIsScanning(false);
    addLog('✓ All endpoints synced', 'success');
  };

  // Get unique categories
  const categories = ['all', ...new Set(endpoints.map(ep => ep.category))];

  // Filter endpoints
  const filteredEndpoints = filterCategory === 'all' 
    ? endpoints 
    : endpoints.filter(ep => ep.category === filterCategory);

  // Render endpoint card
  const renderEndpointCard = (endpoint: IntegrationEndpoint) => (
    <TouchableOpacity
      key={endpoint.id}
      className="bg-surface rounded-xl p-4 mb-3 border border-border"
      onPress={() => { setSelectedEndpoint(endpoint); setShowEndpointModal(true); }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <Text className="text-2xl mr-3">{TYPE_ICONS[endpoint.type]}</Text>
          <View className="flex-1">
            <Text className="text-foreground font-semibold">{endpoint.name}</Text>
            <Text className="text-muted text-xs" numberOfLines={1}>{endpoint.url}</Text>
          </View>
        </View>
        <View className="items-end">
          <View className="flex-row items-center">
            <View 
              style={{ 
                width: 10, 
                height: 10, 
                borderRadius: 5, 
                backgroundColor: STATUS_COLORS[endpoint.status],
                marginRight: 6 
              }} 
            />
            <Text className="text-foreground text-xs capitalize">{endpoint.status}</Text>
          </View>
          <Switch
            value={endpoint.enabled}
            onValueChange={() => toggleEndpoint(endpoint.id)}
            trackColor={{ false: '#767577', true: CATEGORY_COLORS[endpoint.category] + '80' }}
            thumbColor={endpoint.enabled ? CATEGORY_COLORS[endpoint.category] : '#f4f3f4'}
            style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
          />
        </View>
      </View>
      <View className="flex-row items-center justify-between mt-2">
        <View 
          className="px-2 py-1 rounded"
          style={{ backgroundColor: CATEGORY_COLORS[endpoint.category] + '20' }}
        >
          <Text style={{ color: CATEGORY_COLORS[endpoint.category] }} className="text-xs font-medium">
            {endpoint.category}
          </Text>
        </View>
        <TouchableOpacity 
          className="bg-primary/20 rounded px-2 py-1"
          onPress={() => testConnection(endpoint)}
        >
          <Text className="text-primary text-xs">Test</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Render scan card
  const renderScanCard = (scan: ScanInstruction) => (
    <View key={scan.id} className="bg-surface rounded-xl p-4 mb-3 border border-border">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-foreground font-semibold">{scan.name}</Text>
          <Text className="text-muted text-xs mt-1">{scan.description}</Text>
        </View>
        <View 
          className="px-2 py-1 rounded"
          style={{ backgroundColor: scan.status === 'active' ? '#22C55E20' : '#EF444420' }}
        >
          <Text className={`text-xs font-medium ${scan.status === 'active' ? 'text-success' : 'text-error'}`}>
            {scan.status}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center justify-between mt-3">
        <View>
          <Text className="text-muted text-xs">Frequency: {scan.frequency}</Text>
          <Text className="text-muted text-xs">Last: {new Date(scan.lastRun).toLocaleTimeString()}</Text>
        </View>
        <TouchableOpacity 
          className="bg-primary rounded-lg px-3 py-2"
          onPress={() => runScan(scan)}
        >
          <Text className="text-white text-xs font-medium">Run Now</Text>
        </TouchableOpacity>
      </View>
      <View className="flex-row flex-wrap mt-2">
        {scan.actions.map(action => (
          <View key={action} className="bg-primary/10 rounded px-2 py-1 mr-1 mb-1">
            <Text className="text-xs text-primary capitalize">{action}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  // Render log entry
  const renderLogEntry = (log: { timestamp: number; message: string; type: string }, index: number) => {
    const colors = { info: '#3B82F6', success: '#22C55E', warning: '#F59E0B', error: '#EF4444' };
    return (
      <View key={index} className="flex-row items-start py-2 border-b border-border">
        <Text className="text-muted text-xs w-20">{new Date(log.timestamp).toLocaleTimeString()}</Text>
        <Text style={{ color: colors[log.type as keyof typeof colors] }} className="flex-1 text-xs">
          {log.message}
        </Text>
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
          <Text className="text-xl font-bold text-foreground">Integration Control Arm</Text>
          <View className="p-2">
            <Text className="text-2xl">🦾</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="flex-row mb-4">
          <TouchableOpacity 
            className={`flex-1 rounded-xl py-3 mr-2 ${isScanning ? 'bg-primary/50' : 'bg-primary'}`}
            onPress={syncAllEndpoints}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text className="text-white text-center font-medium">🔄 Sync All</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            className={`flex-1 rounded-xl py-3 ${isScanning ? 'bg-success/50' : 'bg-success'}`}
            onPress={runAllScans}
            disabled={isScanning}
          >
            <Text className="text-white text-center font-medium">📡 Scan All</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View className="flex-row mb-4">
          <View className="flex-1 bg-success/10 rounded-xl p-3 mr-2">
            <Text className="text-success text-xl font-bold">{endpoints.filter(ep => ep.status === 'connected').length}</Text>
            <Text className="text-success text-xs">Connected</Text>
          </View>
          <View className="flex-1 bg-warning/10 rounded-xl p-3 mr-2">
            <Text className="text-warning text-xl font-bold">{endpoints.filter(ep => ep.status === 'syncing').length}</Text>
            <Text className="text-warning text-xs">Syncing</Text>
          </View>
          <View className="flex-1 bg-error/10 rounded-xl p-3 mr-2">
            <Text className="text-error text-xl font-bold">{endpoints.filter(ep => ep.status === 'error').length}</Text>
            <Text className="text-error text-xs">Errors</Text>
          </View>
          <View className="flex-1 bg-primary/10 rounded-xl p-3">
            <Text className="text-primary text-xl font-bold">{scanInstructions.filter(s => s.status === 'active').length}</Text>
            <Text className="text-primary text-xs">Scans</Text>
          </View>
        </View>

        {/* Tab Selector */}
        <View className="flex-row bg-surface rounded-xl p-1 mb-4">
          {[
            { id: 'endpoints' as const, label: 'Endpoints', icon: '🔌' },
            { id: 'scans' as const, label: 'Scans', icon: '📡' },
            { id: 'logs' as const, label: 'Logs', icon: '📋' },
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

        {/* Endpoints Tab */}
        {activeTab === 'endpoints' && (
          <View>
            {/* Category Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-2">
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    className={`px-3 py-2 rounded-full ${filterCategory === cat ? 'bg-primary' : 'bg-surface border border-border'}`}
                    onPress={() => setFilterCategory(cat)}
                  >
                    <Text className={`capitalize ${filterCategory === cat ? 'text-white' : 'text-foreground'}`}>
                      {cat === 'all' ? 'All' : cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text className="text-foreground font-bold text-lg mb-3">
              Endpoints ({filteredEndpoints.length})
            </Text>
            {filteredEndpoints.map(renderEndpointCard)}
          </View>
        )}

        {/* Scans Tab */}
        {activeTab === 'scans' && (
          <View>
            <Text className="text-foreground font-bold text-lg mb-3">Scan Instructions</Text>
            {scanInstructions.map(renderScanCard)}
          </View>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-foreground font-bold text-lg">Activity Logs</Text>
              <TouchableOpacity onPress={() => setLogs([])}>
                <Text className="text-primary text-sm">Clear</Text>
              </TouchableOpacity>
            </View>
            <View className="bg-surface rounded-xl p-4 border border-border">
              {logs.length === 0 ? (
                <Text className="text-muted text-center py-4">No logs yet</Text>
              ) : (
                logs.map(renderLogEntry)
              )}
            </View>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>

      {/* Endpoint Detail Modal */}
      <Modal
        visible={showEndpointModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEndpointModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-foreground">{selectedEndpoint?.name}</Text>
              <TouchableOpacity onPress={() => setShowEndpointModal(false)}>
                <Text className="text-2xl">✕</Text>
              </TouchableOpacity>
            </View>
            
            {selectedEndpoint && (
              <ScrollView>
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">URL</Text>
                  <Text className="text-primary">{selectedEndpoint.url}</Text>
                </View>
                
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">Type</Text>
                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-2">{TYPE_ICONS[selectedEndpoint.type]}</Text>
                    <Text className="text-foreground capitalize">{selectedEndpoint.type}</Text>
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
                        backgroundColor: STATUS_COLORS[selectedEndpoint.status],
                        marginRight: 8 
                      }} 
                    />
                    <Text className="text-foreground capitalize">{selectedEndpoint.status}</Text>
                  </View>
                </View>
                
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">Auth Method</Text>
                  <Text className="text-foreground capitalize">{selectedEndpoint.authMethod.replace('_', ' ')}</Text>
                </View>
                
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">Description</Text>
                  <Text className="text-foreground">{selectedEndpoint.description}</Text>
                </View>
                
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">Last Sync</Text>
                  <Text className="text-foreground">{new Date(selectedEndpoint.lastSync).toLocaleString()}</Text>
                </View>
                
                <View className="flex-row mt-4">
                  <TouchableOpacity 
                    className="flex-1 bg-primary rounded-xl py-3 mr-2"
                    onPress={() => { testConnection(selectedEndpoint); setShowEndpointModal(false); }}
                  >
                    <Text className="text-white text-center font-medium">Test Connection</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="flex-1 bg-success rounded-xl py-3"
                    onPress={() => setShowEndpointModal(false)}
                  >
                    <Text className="text-white text-center font-medium">Configure</Text>
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
