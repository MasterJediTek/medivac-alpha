import { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Switch, TextInput, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FM_MODULES } from '@/lib/filemaker';

// Module Status Types
type ModuleStatus = 'installed' | 'available' | 'updating' | 'error' | 'deprecated';

// Scanned Module
interface ScannedModule {
  id: string;
  name: string;
  version: string;
  status: ModuleStatus;
  category: string;
  description: string;
  dependencies: string[];
  size: string;
  lastUpdated: number;
  author: string;
  compatibility: string[];
  installPath?: string;
}

// Scan Result
interface ScanResult {
  timestamp: number;
  modulesFound: number;
  modulesInstalled: number;
  modulesAvailable: number;
  errors: string[];
  warnings: string[];
}

// Installation Queue Item
interface InstallQueueItem {
  moduleId: string;
  status: 'pending' | 'downloading' | 'installing' | 'complete' | 'failed';
  progress: number;
  error?: string;
}

// Available Modules for Installation
const AVAILABLE_MODULES: ScannedModule[] = [
  // Core Medical Modules
  { id: 'mod-patient-core', name: 'Patient Core', version: '2.1.0', status: 'installed', category: 'Medical', description: 'Core patient management functionality', dependencies: [], size: '2.4 MB', lastUpdated: Date.now() - 86400000, author: 'JediTek', compatibility: ['MediVac 2.0+'] },
  { id: 'mod-doctors-core', name: 'Doctors Directory', version: '2.0.5', status: 'installed', category: 'Medical', description: 'Staff and doctor management', dependencies: ['mod-patient-core'], size: '1.8 MB', lastUpdated: Date.now() - 172800000, author: 'JediTek', compatibility: ['MediVac 2.0+'] },
  { id: 'mod-medication', name: 'Medication Manager', version: '2.1.2', status: 'installed', category: 'Medical', description: 'Medication tracking and prescriptions', dependencies: ['mod-patient-core'], size: '3.2 MB', lastUpdated: Date.now() - 259200000, author: 'JediTek', compatibility: ['MediVac 2.0+'] },
  { id: 'mod-labs', name: 'Laboratory Results', version: '2.0.8', status: 'installed', category: 'Medical', description: 'Lab test results and tracking', dependencies: ['mod-patient-core'], size: '2.1 MB', lastUpdated: Date.now() - 345600000, author: 'JediTek', compatibility: ['MediVac 2.0+'] },
  { id: 'mod-surgery', name: 'Surgery Scheduler', version: '1.9.5', status: 'available', category: 'Medical', description: 'Surgical procedure scheduling', dependencies: ['mod-patient-core', 'mod-rooms'], size: '4.5 MB', lastUpdated: Date.now() - 432000000, author: 'JediTek', compatibility: ['MediVac 2.0+'] },
  
  // JEDI Integration Modules
  { id: 'mod-jedi-core', name: 'JEDI Core', version: '3.0.0', status: 'installed', category: 'JEDI', description: 'Core JEDI systems integration', dependencies: [], size: '5.2 MB', lastUpdated: Date.now() - 86400000, author: 'JediTek', compatibility: ['MediVac 2.0+', 'JEDI 3.0+'] },
  { id: 'mod-smpo-protocol', name: 'SMPO.ink Protocol', version: '2.1.0', status: 'installed', category: 'JEDI', description: 'SMPO.ink compliance and security', dependencies: ['mod-jedi-core'], size: '1.5 MB', lastUpdated: Date.now() - 172800000, author: 'SMPO', compatibility: ['MediVac 2.0+'] },
  { id: 'mod-wongi-tracker', name: 'WONGI Tracker', version: '2.0.3', status: 'installed', category: 'JEDI', description: 'Health outcomes tracking', dependencies: ['mod-jedi-core', 'mod-patient-core'], size: '2.8 MB', lastUpdated: Date.now() - 259200000, author: 'JediTek', compatibility: ['MediVac 2.0+', 'WONGI 2.0+'] },
  { id: 'mod-python-hitch', name: 'Python Hitch', version: '1.5.0', status: 'installed', category: 'JEDI', description: 'Automation and task scheduling', dependencies: ['mod-jedi-core'], size: '3.1 MB', lastUpdated: Date.now() - 345600000, author: 'JediTek', compatibility: ['MediVac 2.0+', 'Python 3.9+'] },
  { id: 'mod-nexus-beacon', name: 'Nexus Beacon', version: '1.2.0', status: 'available', category: 'JEDI', description: 'Real-time beacon connectivity', dependencies: ['mod-jedi-core'], size: '1.9 MB', lastUpdated: Date.now() - 432000000, author: 'JediTek', compatibility: ['MediVac 2.0+'] },
  
  // Communication Modules
  { id: 'mod-comms-core', name: 'Communications Core', version: '2.0.0', status: 'installed', category: 'Communications', description: 'Core messaging and alerts', dependencies: [], size: '2.0 MB', lastUpdated: Date.now() - 86400000, author: 'JediTek', compatibility: ['MediVac 2.0+'] },
  { id: 'mod-bulk-sms', name: 'Bulk SMS', version: '1.8.0', status: 'available', category: 'Communications', description: 'Bulk SMS messaging', dependencies: ['mod-comms-core'], size: '1.2 MB', lastUpdated: Date.now() - 172800000, author: 'JediTek', compatibility: ['MediVac 2.0+'] },
  { id: 'mod-video-conf', name: 'Video Conference', version: '1.5.2', status: 'available', category: 'Communications', description: 'Video conferencing integration', dependencies: ['mod-comms-core'], size: '8.5 MB', lastUpdated: Date.now() - 259200000, author: 'JediTek', compatibility: ['MediVac 2.0+'] },
  
  // Admin Modules
  { id: 'mod-admin-core', name: 'Admin Core', version: '2.0.0', status: 'installed', category: 'Admin', description: 'Core administration tools', dependencies: [], size: '1.8 MB', lastUpdated: Date.now() - 86400000, author: 'JediTek', compatibility: ['MediVac 2.0+'] },
  { id: 'mod-invoicing', name: 'Invoicing System', version: '1.9.0', status: 'available', category: 'Admin', description: 'Invoice generation and tracking', dependencies: ['mod-admin-core', 'mod-patient-core'], size: '2.5 MB', lastUpdated: Date.now() - 172800000, author: 'JediTek', compatibility: ['MediVac 2.0+'] },
  { id: 'mod-reporting', name: 'Advanced Reports', version: '2.1.0', status: 'available', category: 'Admin', description: 'Advanced reporting and analytics', dependencies: ['mod-admin-core'], size: '4.2 MB', lastUpdated: Date.now() - 259200000, author: 'JediTek', compatibility: ['MediVac 2.0+'] },
  
  // Deprecated Modules
  { id: 'mod-legacy-patient', name: 'Legacy Patient (v1)', version: '1.0.0', status: 'deprecated', category: 'Legacy', description: 'Legacy patient module - deprecated', dependencies: [], size: '1.5 MB', lastUpdated: Date.now() - 31536000000, author: 'JediTek', compatibility: ['MediVac 1.x'] },
];

// Status Colors
const STATUS_COLORS: Record<ModuleStatus, string> = {
  installed: '#22C55E',
  available: '#3B82F6',
  updating: '#F59E0B',
  error: '#EF4444',
  deprecated: '#9CA3AF',
};

// Category Icons
const CATEGORY_ICONS: Record<string, string> = {
  Medical: '🏥',
  JEDI: '⚡',
  Communications: '📡',
  Admin: '⚙️',
  Legacy: '📦',
};

export default function ModuleScannerScreen() {
  const router = useRouter();
  const [modules, setModules] = useState<ScannedModule[]>(AVAILABLE_MODULES);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [installQueue, setInstallQueue] = useState<InstallQueueItem[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<ScannedModule | null>(null);
  const [showModuleModal, setShowModuleModal] = useState(false);

  // Perform system scan
  const performScan = async () => {
    setIsScanning(true);
    
    // Simulate scanning process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const result: ScanResult = {
      timestamp: Date.now(),
      modulesFound: modules.length,
      modulesInstalled: modules.filter(m => m.status === 'installed').length,
      modulesAvailable: modules.filter(m => m.status === 'available').length,
      errors: [],
      warnings: modules.filter(m => m.status === 'deprecated').map(m => `${m.name} is deprecated`),
    };
    
    setScanResult(result);
    setIsScanning(false);
  };

  // Install module
  const installModule = async (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module || module.status !== 'available') return;

    // Check dependencies
    const missingDeps = module.dependencies.filter(dep => {
      const depModule = modules.find(m => m.id === dep);
      return !depModule || depModule.status !== 'installed';
    });

    if (missingDeps.length > 0) {
      alert(`Missing dependencies: ${missingDeps.join(', ')}`);
      return;
    }

    // Add to install queue
    setInstallQueue(prev => [...prev, { moduleId, status: 'pending', progress: 0 }]);

    // Simulate installation
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setInstallQueue(prev => prev.map(item => 
        item.moduleId === moduleId 
          ? { ...item, status: progress < 50 ? 'downloading' : 'installing', progress }
          : item
      ));
    }

    // Complete installation
    setInstallQueue(prev => prev.map(item => 
      item.moduleId === moduleId ? { ...item, status: 'complete', progress: 100 } : item
    ));

    setModules(prev => prev.map(m => 
      m.id === moduleId ? { ...m, status: 'installed' } : m
    ));

    // Remove from queue after delay
    setTimeout(() => {
      setInstallQueue(prev => prev.filter(item => item.moduleId !== moduleId));
    }, 2000);
  };

  // Uninstall module
  const uninstallModule = (moduleId: string) => {
    // Check if other modules depend on this
    const dependentModules = modules.filter(m => 
      m.status === 'installed' && m.dependencies.includes(moduleId)
    );

    if (dependentModules.length > 0) {
      alert(`Cannot uninstall: ${dependentModules.map(m => m.name).join(', ')} depend on this module`);
      return;
    }

    setModules(prev => prev.map(m => 
      m.id === moduleId ? { ...m, status: 'available' } : m
    ));
  };

  // Filter modules
  const filteredModules = modules.filter(m => {
    const matchesCategory = filterCategory === 'all' || m.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || m.status === filterStatus;
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         m.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  // Get unique categories
  const categories = ['all', ...new Set(modules.map(m => m.category))];

  // Render module card
  const renderModuleCard = (module: ScannedModule) => {
    const queueItem = installQueue.find(item => item.moduleId === module.id);
    
    return (
      <TouchableOpacity
        key={module.id}
        className="bg-surface rounded-xl p-4 mb-3 border border-border"
        onPress={() => { setSelectedModule(module); setShowModuleModal(true); }}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-center flex-1">
            <Text className="text-2xl mr-3">{CATEGORY_ICONS[module.category] || '📦'}</Text>
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-foreground font-semibold">{module.name}</Text>
                <Text className="text-muted text-xs ml-2">v{module.version}</Text>
              </View>
              <Text className="text-muted text-xs mt-1" numberOfLines={1}>{module.description}</Text>
            </View>
          </View>
          <View 
            className="px-2 py-1 rounded"
            style={{ backgroundColor: STATUS_COLORS[module.status] + '20' }}
          >
            <Text style={{ color: STATUS_COLORS[module.status] }} className="text-xs font-medium capitalize">
              {module.status}
            </Text>
          </View>
        </View>

        {/* Installation Progress */}
        {queueItem && queueItem.status !== 'complete' && (
          <View className="mt-3">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-muted text-xs capitalize">{queueItem.status}...</Text>
              <Text className="text-muted text-xs">{queueItem.progress}%</Text>
            </View>
            <View className="h-2 bg-border rounded-full overflow-hidden">
              <View 
                className="h-full bg-primary rounded-full"
                style={{ width: `${queueItem.progress}%` }}
              />
            </View>
          </View>
        )}

        {/* Dependencies */}
        {module.dependencies.length > 0 && (
          <View className="mt-2 flex-row flex-wrap">
            <Text className="text-muted text-xs mr-1">Requires:</Text>
            {module.dependencies.map(dep => {
              const depModule = modules.find(m => m.id === dep);
              const isInstalled = depModule?.status === 'installed';
              return (
                <View 
                  key={dep} 
                  className="px-1.5 py-0.5 rounded mr-1"
                  style={{ backgroundColor: isInstalled ? '#22C55E20' : '#EF444420' }}
                >
                  <Text className={`text-xs ${isInstalled ? 'text-success' : 'text-error'}`}>
                    {depModule?.name || dep}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row mt-3">
          {module.status === 'available' && (
            <TouchableOpacity 
              className="bg-primary rounded-lg px-3 py-2 mr-2"
              onPress={(e) => { e.stopPropagation(); installModule(module.id); }}
            >
              <Text className="text-white text-xs font-medium">Install</Text>
            </TouchableOpacity>
          )}
          {module.status === 'installed' && (
            <>
              <TouchableOpacity 
                className="bg-success rounded-lg px-3 py-2 mr-2"
                onPress={(e) => e.stopPropagation()}
              >
                <Text className="text-white text-xs font-medium">Configure</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="bg-error/20 rounded-lg px-3 py-2"
                onPress={(e) => { e.stopPropagation(); uninstallModule(module.id); }}
              >
                <Text className="text-error text-xs font-medium">Uninstall</Text>
              </TouchableOpacity>
            </>
          )}
          {module.status === 'deprecated' && (
            <View className="bg-muted/20 rounded-lg px-3 py-2">
              <Text className="text-muted text-xs">No longer supported</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
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
          <Text className="text-xl font-bold text-foreground">Module Scanner</Text>
          <TouchableOpacity className="p-2" onPress={performScan}>
            <Text className="text-2xl">📡</Text>
          </TouchableOpacity>
        </View>

        {/* Scan Button */}
        <TouchableOpacity 
          className={`rounded-xl p-4 mb-4 ${isScanning ? 'bg-primary/50' : 'bg-primary'}`}
          onPress={performScan}
          disabled={isScanning}
        >
          <View className="flex-row items-center justify-center">
            {isScanning ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text className="text-white font-bold ml-2">Scanning System...</Text>
              </>
            ) : (
              <>
                <Text className="text-2xl mr-2">🔍</Text>
                <Text className="text-white font-bold">Scan for Modules</Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        {/* Scan Results */}
        {scanResult && (
          <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
            <Text className="text-foreground font-semibold mb-2">Last Scan Results</Text>
            <View className="flex-row flex-wrap">
              <View className="w-1/2 mb-2">
                <Text className="text-muted text-xs">Modules Found</Text>
                <Text className="text-foreground font-bold">{scanResult.modulesFound}</Text>
              </View>
              <View className="w-1/2 mb-2">
                <Text className="text-muted text-xs">Installed</Text>
                <Text className="text-success font-bold">{scanResult.modulesInstalled}</Text>
              </View>
              <View className="w-1/2">
                <Text className="text-muted text-xs">Available</Text>
                <Text className="text-primary font-bold">{scanResult.modulesAvailable}</Text>
              </View>
              <View className="w-1/2">
                <Text className="text-muted text-xs">Warnings</Text>
                <Text className="text-warning font-bold">{scanResult.warnings.length}</Text>
              </View>
            </View>
            {scanResult.warnings.length > 0 && (
              <View className="mt-2 bg-warning/10 rounded-lg p-2">
                {scanResult.warnings.map((warning, i) => (
                  <Text key={i} className="text-warning text-xs">⚠️ {warning}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Search and Filters */}
        <View className="mb-4">
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-3"
            placeholder="Search modules..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          
          {/* Category Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
            <View className="flex-row gap-2">
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  className={`px-3 py-2 rounded-full ${filterCategory === cat ? 'bg-primary' : 'bg-surface border border-border'}`}
                  onPress={() => setFilterCategory(cat)}
                >
                  <Text className={`capitalize ${filterCategory === cat ? 'text-white' : 'text-foreground'}`}>
                    {cat === 'all' ? 'All Categories' : `${CATEGORY_ICONS[cat] || ''} ${cat}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Status Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {['all', 'installed', 'available', 'deprecated'].map(status => (
                <TouchableOpacity
                  key={status}
                  className={`px-3 py-2 rounded-full ${filterStatus === status ? 'bg-primary' : 'bg-surface border border-border'}`}
                  onPress={() => setFilterStatus(status)}
                >
                  <Text className={`capitalize ${filterStatus === status ? 'text-white' : 'text-foreground'}`}>
                    {status === 'all' ? 'All Status' : status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Module Stats */}
        <View className="flex-row mb-4">
          <View className="flex-1 bg-success/10 rounded-xl p-3 mr-2">
            <Text className="text-success text-xl font-bold">{modules.filter(m => m.status === 'installed').length}</Text>
            <Text className="text-success text-xs">Installed</Text>
          </View>
          <View className="flex-1 bg-primary/10 rounded-xl p-3 mr-2">
            <Text className="text-primary text-xl font-bold">{modules.filter(m => m.status === 'available').length}</Text>
            <Text className="text-primary text-xs">Available</Text>
          </View>
          <View className="flex-1 bg-warning/10 rounded-xl p-3">
            <Text className="text-warning text-xl font-bold">{installQueue.length}</Text>
            <Text className="text-warning text-xs">In Queue</Text>
          </View>
        </View>

        {/* Module List */}
        <Text className="text-foreground font-bold text-lg mb-3">
          Modules ({filteredModules.length})
        </Text>
        {filteredModules.map(renderModuleCard)}

        <View className="h-8" />
      </ScrollView>

      {/* Module Detail Modal */}
      <Modal
        visible={showModuleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModuleModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6 max-h-[85%]">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Text className="text-2xl mr-2">{CATEGORY_ICONS[selectedModule?.category || ''] || '📦'}</Text>
                <Text className="text-xl font-bold text-foreground">{selectedModule?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowModuleModal(false)}>
                <Text className="text-2xl">✕</Text>
              </TouchableOpacity>
            </View>
            
            {selectedModule && (
              <ScrollView>
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">Version</Text>
                  <Text className="text-foreground">v{selectedModule.version}</Text>
                </View>
                
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">Status</Text>
                  <View 
                    className="px-3 py-1 rounded self-start"
                    style={{ backgroundColor: STATUS_COLORS[selectedModule.status] + '20' }}
                  >
                    <Text style={{ color: STATUS_COLORS[selectedModule.status] }} className="font-medium capitalize">
                      {selectedModule.status}
                    </Text>
                  </View>
                </View>
                
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">Description</Text>
                  <Text className="text-foreground">{selectedModule.description}</Text>
                </View>
                
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">Category</Text>
                  <Text className="text-foreground">{selectedModule.category}</Text>
                </View>
                
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">Size</Text>
                  <Text className="text-foreground">{selectedModule.size}</Text>
                </View>
                
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">Author</Text>
                  <Text className="text-foreground">{selectedModule.author}</Text>
                </View>
                
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">Compatibility</Text>
                  <View className="flex-row flex-wrap">
                    {selectedModule.compatibility.map(comp => (
                      <View key={comp} className="bg-primary/10 rounded px-2 py-1 mr-1 mb-1">
                        <Text className="text-xs text-primary">{comp}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                
                {selectedModule.dependencies.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-muted text-sm mb-1">Dependencies</Text>
                    <View className="flex-row flex-wrap">
                      {selectedModule.dependencies.map(dep => {
                        const depModule = modules.find(m => m.id === dep);
                        const isInstalled = depModule?.status === 'installed';
                        return (
                          <View 
                            key={dep} 
                            className="rounded px-2 py-1 mr-1 mb-1"
                            style={{ backgroundColor: isInstalled ? '#22C55E20' : '#EF444420' }}
                          >
                            <Text className={`text-xs ${isInstalled ? 'text-success' : 'text-error'}`}>
                              {isInstalled ? '✓' : '✗'} {depModule?.name || dep}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
                
                <View className="flex-row mt-4">
                  {selectedModule.status === 'available' && (
                    <TouchableOpacity 
                      className="flex-1 bg-primary rounded-xl py-3 mr-2"
                      onPress={() => { installModule(selectedModule.id); setShowModuleModal(false); }}
                    >
                      <Text className="text-white text-center font-medium">Install Module</Text>
                    </TouchableOpacity>
                  )}
                  {selectedModule.status === 'installed' && (
                    <>
                      <TouchableOpacity 
                        className="flex-1 bg-success rounded-xl py-3 mr-2"
                        onPress={() => setShowModuleModal(false)}
                      >
                        <Text className="text-white text-center font-medium">Configure</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        className="flex-1 bg-error rounded-xl py-3"
                        onPress={() => { uninstallModule(selectedModule.id); setShowModuleModal(false); }}
                      >
                        <Text className="text-white text-center font-medium">Uninstall</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
