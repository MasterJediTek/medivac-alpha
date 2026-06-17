/**
 * OneDrive Personal File Sync Screen
 * Sync personal compliance documents from OneDrive
 * MediVac One v5.9
 */

import { useState, useEffect, useCallback } from "react";
import { ScrollView, Text, View, TouchableOpacity, Alert, Switch } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  oneDriveSyncService,
  OneDriveConfig,
  OneDriveFile,
  SyncFolder,
  SyncHistoryEntry,
  FileStatus,
  ConflictResolution,
} from "@/lib/services/onedrive-sync-service";

type TabType = 'files' | 'folders' | 'history';

export default function OneDriveSyncScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('files');
  const [config, setConfig] = useState<OneDriveConfig | null>(null);
  const [files, setFiles] = useState<OneDriveFile[]>([]);
  const [folders, setFolders] = useState<SyncFolder[]>([]);
  const [history, setHistory] = useState<SyncHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await oneDriveSyncService.initialize();
      setConfig(oneDriveSyncService.getConfig());
      setFiles(oneDriveSyncService.getFiles());
      setFolders(oneDriveSyncService.getSyncFolders());
      setHistory(oneDriveSyncService.getSyncHistory());
    } catch (error) {
      console.error('Failed to load OneDrive data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await oneDriveSyncService.connect('mock_access_token');
      Alert.alert('Connected', 'Successfully connected to OneDrive');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to OneDrive');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect OneDrive',
      'This will remove all sync settings. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await oneDriveSyncService.disconnect();
            loadData();
          },
        },
      ]
    );
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const result = await oneDriveSyncService.syncAll();
      Alert.alert('Sync Complete', `Synced ${result.success} files, ${result.failed} failed`);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncFile = async (fileId: string) => {
    await oneDriveSyncService.syncFile(fileId);
    loadData();
  };

  const handleResolveConflict = async (fileId: string, resolution: ConflictResolution) => {
    await oneDriveSyncService.resolveConflict(fileId, resolution);
    loadData();
  };

  const handleToggleFolder = async (folderId: string, enabled: boolean) => {
    await oneDriveSyncService.updateSyncFolder(folderId, { enabled });
    loadData();
  };

  const handleToggleAutoSync = async (enabled: boolean) => {
    await oneDriveSyncService.updateConfig({ autoSync: enabled });
    loadData();
  };

  const stats = oneDriveSyncService.getStatistics();

  const getStatusColor = (status: FileStatus): string => {
    switch (status) {
      case 'synced': return colors.success;
      case 'pending': return colors.warning;
      case 'uploading':
      case 'downloading': return colors.primary;
      case 'conflict': return '#F59E0B';
      case 'error': return colors.error;
      default: return colors.muted;
    }
  };

  const getStatusIcon = (status: FileStatus): string => {
    switch (status) {
      case 'synced': return '✓';
      case 'pending': return '⏳';
      case 'uploading': return '↑';
      case 'downloading': return '↓';
      case 'conflict': return '⚠';
      case 'error': return '✕';
      default: return '?';
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString('en-AU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTabs = () => (
    <View className="flex-row mb-4 bg-surface rounded-xl p-1">
      {(['files', 'folders', 'history'] as TabType[]).map((tab) => (
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

  const renderConnectionCard = () => (
    <View className="bg-surface rounded-xl p-4 mb-4">
      {config?.connected ? (
        <>
          <View className="flex-row items-center gap-3 mb-3">
            <View className="bg-[#0078D4] p-3 rounded-full">
              <IconSymbol name="cloud.fill" size={24} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-semibold">{config.userName}</Text>
              <Text className="text-muted text-sm">{config.userEmail}</Text>
            </View>
            <View className="bg-success/20 px-2 py-1 rounded">
              <Text style={{ color: colors.success }} className="text-xs">Connected</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-muted text-sm">Storage Used</Text>
            <Text className="text-foreground font-medium">
              {formatSize(config.quotaUsed || 0)} / {formatSize(config.quotaTotal || 0)}
            </Text>
          </View>

          <View className="bg-background rounded-full h-2 mb-3">
            <View 
              className="bg-[#0078D4] h-2 rounded-full"
              style={{ width: `${((config.quotaUsed || 0) / (config.quotaTotal || 1)) * 100}%` }}
            />
          </View>

          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-foreground">Auto Sync</Text>
            <Switch
              value={config.autoSync}
              onValueChange={handleToggleAutoSync}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleSyncAll}
              disabled={syncing}
              className="flex-1 bg-[#0078D4] py-3 rounded-lg"
            >
              <Text className="text-white text-center font-medium">
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDisconnect}
              className="px-4 py-3 rounded-lg"
              style={{ backgroundColor: colors.error + '20' }}
            >
              <Text style={{ color: colors.error }} className="font-medium">Disconnect</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View className="items-center py-4">
          <View className="bg-[#0078D4]/20 p-4 rounded-full mb-4">
            <IconSymbol name="cloud.fill" size={48} color="#0078D4" />
          </View>
          <Text className="text-foreground text-lg font-bold mb-2">Connect to OneDrive</Text>
          <Text className="text-muted text-center mb-4">
            Sync your personal compliance documents from Microsoft OneDrive
          </Text>
          <TouchableOpacity
            onPress={handleConnect}
            disabled={connecting}
            className="bg-[#0078D4] px-8 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">
              {connecting ? 'Connecting...' : 'Sign in with Microsoft'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderFiles = () => (
    <View>
      {/* Stats */}
      <View className="flex-row flex-wrap gap-2 mb-4">
        <View className="flex-1 min-w-[80px] bg-surface rounded-xl p-3">
          <Text className="text-muted text-xs">Total</Text>
          <Text className="text-foreground text-xl font-bold">{stats.totalFiles}</Text>
        </View>
        <View className="flex-1 min-w-[80px] bg-surface rounded-xl p-3">
          <Text className="text-muted text-xs">Synced</Text>
          <Text style={{ color: colors.success }} className="text-xl font-bold">{stats.syncedFiles}</Text>
        </View>
        <View className="flex-1 min-w-[80px] bg-surface rounded-xl p-3">
          <Text className="text-muted text-xs">Pending</Text>
          <Text style={{ color: colors.warning }} className="text-xl font-bold">{stats.pendingFiles}</Text>
        </View>
        <View className="flex-1 min-w-[80px] bg-surface rounded-xl p-3">
          <Text className="text-muted text-xs">Conflicts</Text>
          <Text style={{ color: '#F59E0B' }} className="text-xl font-bold">{stats.conflictFiles}</Text>
        </View>
      </View>

      {files.length === 0 ? (
        <View className="bg-surface rounded-xl p-8 items-center">
          <IconSymbol name="doc.fill" size={48} color={colors.muted} />
          <Text className="text-muted mt-4 text-center">No files synced yet</Text>
        </View>
      ) : (
        files.map((file) => (
          <TouchableOpacity
            key={file.id}
            onPress={() => {
              if (file.status === 'conflict') {
                Alert.alert(
                  'Resolve Conflict',
                  `${file.name} has conflicting versions`,
                  [
                    { text: 'Keep Local', onPress: () => handleResolveConflict(file.id, 'keep_local') },
                    { text: 'Keep Remote', onPress: () => handleResolveConflict(file.id, 'keep_remote') },
                    { text: 'Keep Both', onPress: () => handleResolveConflict(file.id, 'keep_both') },
                    { text: 'Cancel', style: 'cancel' },
                  ]
                );
              } else if (file.status === 'pending') {
                handleSyncFile(file.id);
              }
            }}
            className="bg-surface rounded-xl p-4 mb-3"
          >
            <View className="flex-row items-center gap-3">
              <View className="bg-[#0078D4]/20 p-2 rounded-lg">
                <IconSymbol name="doc.fill" size={24} color="#0078D4" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-medium" numberOfLines={1}>{file.name}</Text>
                <Text className="text-muted text-sm">{formatSize(file.size)} • v{file.version}</Text>
              </View>
              <View 
                style={{ backgroundColor: getStatusColor(file.status) + '20' }}
                className="px-2 py-1 rounded"
              >
                <Text style={{ color: getStatusColor(file.status) }} className="text-xs">
                  {getStatusIcon(file.status)} {file.status}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderFolders = () => (
    <View>
      <Text className="text-foreground text-lg font-bold mb-3">Sync Folders</Text>
      
      {folders.length === 0 ? (
        <View className="bg-surface rounded-xl p-8 items-center">
          <IconSymbol name="folder.fill" size={48} color={colors.muted} />
          <Text className="text-muted mt-4 text-center">No folders configured</Text>
        </View>
      ) : (
        folders.map((folder) => (
          <View key={folder.id} className="bg-surface rounded-xl p-4 mb-3">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-3 flex-1">
                <View className="bg-[#0078D4]/20 p-2 rounded-lg">
                  <IconSymbol name="folder.fill" size={24} color="#0078D4" />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">{folder.name}</Text>
                  <Text className="text-muted text-sm">{folder.path}</Text>
                </View>
              </View>
              <Switch
                value={folder.enabled}
                onValueChange={(value) => handleToggleFolder(folder.id, value)}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
            
            <View className="flex-row items-center gap-4 mt-2">
              <Text className="text-muted text-sm">{folder.fileCount} files</Text>
              <View 
                className="px-2 py-1 rounded"
                style={{ backgroundColor: colors.primary + '20' }}
              >
                <Text style={{ color: colors.primary }} className="text-xs capitalize">
                  {folder.syncDirection}
                </Text>
              </View>
              {folder.lastSync && (
                <Text className="text-muted text-xs">
                  Last: {formatDate(folder.lastSync)}
                </Text>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderHistory = () => (
    <View>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-foreground text-lg font-bold">Sync History</Text>
        {history.length > 0 && (
          <TouchableOpacity
            onPress={async () => {
              await oneDriveSyncService.clearHistory();
              loadData();
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
          <Text className="text-muted mt-4 text-center">No sync history</Text>
        </View>
      ) : (
        history.slice(0, 20).map((entry) => (
          <View key={entry.id} className="bg-surface rounded-xl p-4 mb-3">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-foreground font-medium" numberOfLines={1}>{entry.fileName}</Text>
              <View 
                style={{ backgroundColor: entry.status === 'success' ? colors.success + '20' : colors.error + '20' }}
                className="px-2 py-1 rounded"
              >
                <Text 
                  style={{ color: entry.status === 'success' ? colors.success : colors.error }} 
                  className="text-xs capitalize"
                >
                  {entry.status}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-3">
              <Text className="text-muted text-sm capitalize">{entry.action.replace('_', ' ')}</Text>
              <Text className="text-muted text-sm">{formatDate(entry.timestamp)}</Text>
              {entry.bytesTransferred && (
                <Text className="text-muted text-sm">{formatSize(entry.bytesTransferred)}</Text>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Loading OneDrive...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-foreground text-2xl font-bold">OneDrive Sync</Text>
            <Text className="text-muted">Personal File Synchronization</Text>
          </View>
          <View className="bg-[#0078D4] p-3 rounded-full">
            <IconSymbol name="cloud.fill" size={24} color="#FFFFFF" />
          </View>
        </View>

        {renderConnectionCard()}

        {config?.connected && (
          <>
            {renderTabs()}
            {activeTab === 'files' && renderFiles()}
            {activeTab === 'folders' && renderFolders()}
            {activeTab === 'history' && renderHistory()}
          </>
        )}

        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
