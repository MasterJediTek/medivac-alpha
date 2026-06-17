/**
 * SharePoint Document Sync Screen
 * Microsoft 365 integration for compliance documents
 * MediVac One v5.8
 */

import { useState, useEffect, useCallback } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  sharePointSyncService,
  SharePointConfig,
  DocumentLibrary,
  SyncMapping,
  SyncHistoryEntry,
  DOCUMENT_CATEGORIES,
  DocumentCategory,
  SyncDirection,
  ConflictResolution,
} from "@/lib/services/sharepoint-sync-service";

type TabType = 'config' | 'libraries' | 'mappings' | 'history';

export default function SharePointSyncScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('config');
  const [config, setConfig] = useState<SharePointConfig | null>(null);
  const [libraries, setLibraries] = useState<DocumentLibrary[]>([]);
  const [mappings, setMappings] = useState<SyncMapping[]>([]);
  const [history, setHistory] = useState<SyncHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  // Form state
  const [tenantId, setTenantId] = useState('');
  const [clientId, setClientId] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [siteName, setSiteName] = useState('');

  // New mapping form
  const [showNewMapping, setShowNewMapping] = useState(false);
  const [selectedLibrary, setSelectedLibrary] = useState<string>('');
  const [localFolder, setLocalFolder] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('compliance');
  const [direction, setDirection] = useState<SyncDirection>('bidirectional');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await sharePointSyncService.initialize();
      const cfg = sharePointSyncService.getConfig();
      setConfig(cfg);
      setTenantId(cfg.tenantId);
      setClientId(cfg.clientId);
      setSiteUrl(cfg.siteUrl);
      setSiteName(cfg.siteName);
      setLibraries(sharePointSyncService.getLibraries());
      setMappings(sharePointSyncService.getMappings());
      setHistory(sharePointSyncService.getHistory());
    } catch (error) {
      console.error('Failed to load SharePoint config:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveConfig = async () => {
    try {
      await sharePointSyncService.updateConfig({
        tenantId,
        clientId,
        siteUrl,
        siteName,
      });
      Alert.alert('Success', 'Configuration saved');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to save configuration');
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const result = await sharePointSyncService.connect();
      if (result.success) {
        Alert.alert('Connected', result.message);
      } else {
        Alert.alert('Failed', result.message);
      }
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to connect');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect',
      'Are you sure you want to disconnect from SharePoint?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await sharePointSyncService.disconnect();
            loadData();
          },
        },
      ]
    );
  };

  const handleCreateMapping = async () => {
    if (!selectedLibrary || !localFolder) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const library = libraries.find(l => l.id === selectedLibrary);
    if (!library) return;

    try {
      await sharePointSyncService.createMapping({
        libraryId: selectedLibrary,
        libraryName: library.name,
        localFolder,
        category,
        direction,
        conflictResolution: 'newest_wins' as ConflictResolution,
        includeSubfolders: true,
        fileTypes: ['*'],
        excludePatterns: [],
      });
      setShowNewMapping(false);
      setSelectedLibrary('');
      setLocalFolder('');
      loadData();
      Alert.alert('Success', 'Sync mapping created');
    } catch (error) {
      Alert.alert('Error', 'Failed to create mapping');
    }
  };

  const handleSync = async (mappingId: string) => {
    setSyncing(mappingId);
    try {
      await sharePointSyncService.syncMapping(mappingId);
      loadData();
      Alert.alert('Success', 'Sync completed');
    } catch (error) {
      Alert.alert('Error', 'Sync failed');
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncAll = async () => {
    setSyncing('all');
    try {
      await sharePointSyncService.syncAll();
      loadData();
      Alert.alert('Success', 'All mappings synced');
    } catch (error) {
      Alert.alert('Error', 'Some syncs failed');
    } finally {
      setSyncing(null);
    }
  };

  const stats = sharePointSyncService.getStatistics();

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'connected':
      case 'success': return colors.success;
      case 'connecting':
      case 'syncing': return colors.warning;
      case 'error':
      case 'failed': return colors.error;
      default: return colors.muted;
    }
  };

  const renderTabs = () => (
    <View className="flex-row mb-4 bg-surface rounded-xl p-1">
      {(['config', 'libraries', 'mappings', 'history'] as TabType[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          className={`flex-1 py-3 rounded-lg ${activeTab === tab ? 'bg-primary' : ''}`}
        >
          <Text className={`text-center text-sm font-medium ${activeTab === tab ? 'text-white' : 'text-muted'}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderConfigTab = () => (
    <View>
      {/* Connection Status */}
      <View className="bg-surface rounded-xl p-4 mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-3">
            <View className="bg-[#0078D4] p-3 rounded-xl">
              <IconSymbol name="folder.fill" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text className="text-foreground font-semibold">SharePoint</Text>
              <Text style={{ color: getStatusColor(config?.status || 'disconnected') }} className="text-sm capitalize">
                {config?.status || 'Disconnected'}
              </Text>
            </View>
          </View>
        </View>

        {config?.lastSync && (
          <Text className="text-muted text-sm">
            Last sync: {new Date(config.lastSync).toLocaleString()}
          </Text>
        )}
      </View>

      {/* Azure AD Configuration */}
      <View className="bg-surface rounded-xl p-4 mb-4">
        <Text className="text-foreground font-semibold mb-3">Azure AD Configuration</Text>
        
        <View className="mb-3">
          <Text className="text-muted text-sm mb-1">Tenant ID *</Text>
          <TextInput
            value={tenantId}
            onChangeText={setTenantId}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            placeholderTextColor={colors.muted}
            className="bg-background text-foreground p-3 rounded-lg"
            autoCapitalize="none"
          />
        </View>

        <View className="mb-3">
          <Text className="text-muted text-sm mb-1">Client ID *</Text>
          <TextInput
            value={clientId}
            onChangeText={setClientId}
            placeholder="Application (client) ID"
            placeholderTextColor={colors.muted}
            className="bg-background text-foreground p-3 rounded-lg"
            autoCapitalize="none"
          />
        </View>

        <View className="mb-3">
          <Text className="text-muted text-sm mb-1">SharePoint Site URL</Text>
          <TextInput
            value={siteUrl}
            onChangeText={setSiteUrl}
            placeholder="https://contoso.sharepoint.com/sites/medivac"
            placeholderTextColor={colors.muted}
            className="bg-background text-foreground p-3 rounded-lg"
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <View className="mb-4">
          <Text className="text-muted text-sm mb-1">Site Name</Text>
          <TextInput
            value={siteName}
            onChangeText={setSiteName}
            placeholder="MediVac One Documents"
            placeholderTextColor={colors.muted}
            className="bg-background text-foreground p-3 rounded-lg"
          />
        </View>

        <TouchableOpacity
          onPress={handleSaveConfig}
          className="bg-primary/10 py-3 rounded-lg"
        >
          <Text style={{ color: colors.primary }} className="text-center font-medium">Save Configuration</Text>
        </TouchableOpacity>
      </View>

      {/* Connect/Disconnect Button */}
      {config?.status === 'connected' ? (
        <TouchableOpacity
          onPress={handleDisconnect}
          className="py-4 rounded-xl"
          style={{ backgroundColor: colors.error + '20' }}
        >
          <Text style={{ color: colors.error }} className="text-center font-semibold">Disconnect from SharePoint</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={handleConnect}
          disabled={connecting}
          className="bg-[#0078D4] py-4 rounded-xl"
        >
          <Text className="text-white text-center font-semibold">
            {connecting ? 'Connecting...' : 'Connect to SharePoint'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderLibrariesTab = () => (
    <View>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-foreground text-lg font-bold">Document Libraries</Text>
        {config?.status === 'connected' && (
          <TouchableOpacity
            onPress={async () => {
              await sharePointSyncService.refreshLibraries();
              loadData();
            }}
            className="bg-primary/10 px-4 py-2 rounded-lg"
          >
            <Text style={{ color: colors.primary }} className="font-medium">Refresh</Text>
          </TouchableOpacity>
        )}
      </View>

      {libraries.map((library) => (
        <View key={library.id} className="bg-surface rounded-xl p-4 mb-3">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1">
              <Text className="text-foreground font-semibold">{library.name}</Text>
              <Text className="text-muted text-sm">{library.description}</Text>
            </View>
            <View 
              style={{ backgroundColor: library.syncEnabled ? colors.success + '20' : colors.muted + '20' }}
              className="px-2 py-1 rounded"
            >
              <Text style={{ color: library.syncEnabled ? colors.success : colors.muted }} className="text-xs">
                {library.syncEnabled ? 'Sync Enabled' : 'Not Synced'}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-4">
            <View>
              <Text className="text-muted text-xs">Items</Text>
              <Text className="text-foreground font-medium">{library.itemCount}</Text>
            </View>
            <View>
              <Text className="text-muted text-xs">Last Modified</Text>
              <Text className="text-foreground font-medium">
                {new Date(library.lastModified).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderMappingsTab = () => (
    <View>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-foreground text-lg font-bold">Sync Mappings</Text>
        <View className="flex-row gap-2">
          {mappings.length > 0 && (
            <TouchableOpacity
              onPress={handleSyncAll}
              disabled={syncing !== null}
              className="bg-primary px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-medium">
                {syncing === 'all' ? 'Syncing...' : 'Sync All'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setShowNewMapping(true)}
            className="bg-primary/10 px-4 py-2 rounded-lg"
          >
            <Text style={{ color: colors.primary }} className="font-medium">+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showNewMapping && (
        <View className="bg-surface rounded-xl p-4 mb-4">
          <Text className="text-foreground font-semibold mb-3">New Sync Mapping</Text>

          <View className="mb-3">
            <Text className="text-muted text-sm mb-2">Library</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {libraries.map((lib) => (
                  <TouchableOpacity
                    key={lib.id}
                    onPress={() => setSelectedLibrary(lib.id)}
                    className={`px-3 py-2 rounded-lg ${selectedLibrary === lib.id ? 'bg-primary' : 'bg-background'}`}
                  >
                    <Text className={selectedLibrary === lib.id ? 'text-white font-medium' : 'text-muted'}>
                      {lib.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View className="mb-3">
            <Text className="text-muted text-sm mb-1">Local Folder</Text>
            <TextInput
              value={localFolder}
              onChangeText={setLocalFolder}
              placeholder="/Documents/Compliance"
              placeholderTextColor={colors.muted}
              className="bg-background text-foreground p-3 rounded-lg"
            />
          </View>

          <View className="mb-3">
            <Text className="text-muted text-sm mb-2">Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {(Object.keys(DOCUMENT_CATEGORIES) as DocumentCategory[]).map((cat) => {
                  const catConfig = DOCUMENT_CATEGORIES[cat];
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={category === cat ? { backgroundColor: catConfig.color } : undefined}
                      className={`px-3 py-2 rounded-lg ${category !== cat ? 'bg-background' : ''}`}
                    >
                      <Text className={category === cat ? 'text-white font-medium' : 'text-muted'}>
                        {catConfig.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          <View className="mb-4">
            <Text className="text-muted text-sm mb-2">Sync Direction</Text>
            <View className="flex-row gap-2">
              {(['upload', 'download', 'bidirectional'] as SyncDirection[]).map((dir) => (
                <TouchableOpacity
                  key={dir}
                  onPress={() => setDirection(dir)}
                  className={`flex-1 py-2 rounded-lg ${direction === dir ? 'bg-primary' : 'bg-background'}`}
                >
                  <Text className={`text-center ${direction === dir ? 'text-white font-medium' : 'text-muted'}`}>
                    {dir === 'bidirectional' ? 'Both' : dir.charAt(0).toUpperCase() + dir.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setShowNewMapping(false)}
              className="flex-1 bg-background py-3 rounded-lg"
            >
              <Text className="text-muted text-center font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCreateMapping}
              className="flex-1 bg-primary py-3 rounded-lg"
            >
              <Text className="text-white text-center font-medium">Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {mappings.length === 0 ? (
        <View className="bg-surface rounded-xl p-8 items-center">
          <IconSymbol name="folder.fill" size={48} color={colors.muted} />
          <Text className="text-muted mt-4 text-center">No sync mappings configured</Text>
          <Text className="text-muted text-sm text-center mt-1">
            Create a mapping to sync documents
          </Text>
        </View>
      ) : (
        mappings.map((mapping) => {
          const catConfig = DOCUMENT_CATEGORIES[mapping.category];
          return (
            <View key={mapping.id} className="bg-surface rounded-xl p-4 mb-3">
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">{mapping.libraryName}</Text>
                  <Text className="text-muted text-sm">{mapping.localFolder}</Text>
                </View>
                <View 
                  style={{ backgroundColor: getStatusColor(mapping.status) + '20' }}
                  className="px-2 py-1 rounded"
                >
                  <Text style={{ color: getStatusColor(mapping.status) }} className="text-xs capitalize">
                    {mapping.status}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3 mb-3">
                <View 
                  style={{ backgroundColor: catConfig.color + '20' }}
                  className="px-2 py-1 rounded"
                >
                  <Text style={{ color: catConfig.color }} className="text-xs">{catConfig.label}</Text>
                </View>
                <Text className="text-muted text-sm capitalize">{mapping.direction}</Text>
                <Text className="text-muted text-sm">{mapping.itemsSynced} items synced</Text>
              </View>

              <TouchableOpacity
                onPress={() => handleSync(mapping.id)}
                disabled={syncing !== null}
                className="bg-primary/10 py-2 rounded-lg"
              >
                <Text style={{ color: colors.primary }} className="text-center font-medium">
                  {syncing === mapping.id ? 'Syncing...' : 'Sync Now'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </View>
  );

  const renderHistoryTab = () => (
    <View>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-foreground text-lg font-bold">Sync History</Text>
        {history.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Clear History', 'Clear all sync history?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: async () => {
                  await sharePointSyncService.clearHistory();
                  loadData();
                }},
              ]);
            }}
            className="px-3 py-1 rounded-lg"
            style={{ backgroundColor: colors.error + '20' }}
          >
            <Text style={{ color: colors.error }} className="text-sm">Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View className="bg-surface rounded-xl p-8 items-center">
          <IconSymbol name="clock.fill" size={48} color={colors.muted} />
          <Text className="text-muted mt-4 text-center">No sync history yet</Text>
        </View>
      ) : (
        history.slice(0, 20).map((entry) => (
          <View key={entry.id} className="bg-surface rounded-xl p-4 mb-3">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-foreground font-semibold">{entry.mappingName}</Text>
              <View 
                style={{ backgroundColor: getStatusColor(entry.status) + '20' }}
                className="px-2 py-1 rounded"
              >
                <Text style={{ color: getStatusColor(entry.status) }} className="text-xs capitalize">
                  {entry.status}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-4 mb-2">
              <View>
                <Text className="text-muted text-xs">Uploaded</Text>
                <Text className="text-foreground font-medium">{entry.itemsUploaded}</Text>
              </View>
              <View>
                <Text className="text-muted text-xs">Downloaded</Text>
                <Text className="text-foreground font-medium">{entry.itemsDownloaded}</Text>
              </View>
              <View>
                <Text className="text-muted text-xs">Duration</Text>
                <Text className="text-foreground font-medium">{(entry.duration / 1000).toFixed(1)}s</Text>
              </View>
            </View>

            <Text className="text-muted text-xs">
              {new Date(entry.completedAt).toLocaleString()}
            </Text>
          </View>
        ))
      )}
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Loading SharePoint configuration...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-foreground text-2xl font-bold">SharePoint Sync</Text>
            <Text className="text-muted">Microsoft 365 Document Integration</Text>
          </View>
          <View className="bg-[#0078D4] p-3 rounded-full">
            <IconSymbol name="folder.fill" size={24} color="#FFFFFF" />
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row flex-wrap gap-2 mb-4">
          <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3">
            <Text className="text-muted text-xs">Libraries</Text>
            <Text className="text-foreground text-xl font-bold">{stats.totalLibraries}</Text>
          </View>
          <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3">
            <Text className="text-muted text-xs">Mappings</Text>
            <Text className="text-foreground text-xl font-bold">{stats.totalMappings}</Text>
          </View>
          <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3">
            <Text className="text-muted text-xs">Success Rate</Text>
            <Text style={{ color: colors.success }} className="text-xl font-bold">{stats.successRate}%</Text>
          </View>
        </View>

        {renderTabs()}

        {activeTab === 'config' && renderConfigTab()}
        {activeTab === 'libraries' && renderLibrariesTab()}
        {activeTab === 'mappings' && renderMappingsTab()}
        {activeTab === 'history' && renderHistoryTab()}

        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
