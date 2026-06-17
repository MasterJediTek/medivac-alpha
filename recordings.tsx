/**
 * Meeting Recording Integration Screen
 * Auto-save Teams recordings to SharePoint with incident/drill linking
 * MediVac One v5.9
 */

import { useState, useEffect, useCallback } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert, Switch } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  recordingIntegrationService,
  RecordingConfig,
  Recording,
  RecordingType,
  RecordingStatus,
  RECORDING_TYPES,
} from "@/lib/services/recording-integration-service";

type TabType = 'all' | 'incidents' | 'drills' | 'settings';

export default function RecordingsScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [config, setConfig] = useState<RecordingConfig | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await recordingIntegrationService.initialize();
      setConfig(recordingIntegrationService.getConfig());
      setRecordings(recordingIntegrationService.getRecordings());
    } catch (error) {
      console.error('Failed to load recordings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpload = async (recordingId: string) => {
    setUploading(recordingId);
    try {
      await recordingIntegrationService.uploadRecording(recordingId);
      Alert.alert('Success', 'Recording uploaded to SharePoint');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to upload recording');
    } finally {
      setUploading(null);
    }
  };

  const handleRequestTranscript = async (recordingId: string) => {
    try {
      await recordingIntegrationService.requestTranscription(recordingId);
      Alert.alert('Transcription Started', 'You will be notified when the transcript is ready');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to request transcription');
    }
  };

  const handleArchive = async (recordingId: string) => {
    Alert.alert(
      'Archive Recording',
      'This will move the recording to the archive. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: async () => {
            await recordingIntegrationService.archiveRecording(recordingId);
            loadData();
            setSelectedRecording(null);
          },
        },
      ]
    );
  };

  const handleToggleSetting = async (key: keyof RecordingConfig, value: boolean) => {
    await recordingIntegrationService.updateConfig({ [key]: value });
    loadData();
  };

  const analytics = recordingIntegrationService.getAnalytics();

  const getStatusColor = (status: RecordingStatus): string => {
    switch (status) {
      case 'uploaded': return colors.success;
      case 'ready': return colors.primary;
      case 'processing':
      case 'uploading': return colors.warning;
      case 'failed': return colors.error;
      case 'archived': return colors.muted;
      default: return colors.muted;
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes: number): string => {
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

  const filteredRecordings = searchQuery
    ? recordingIntegrationService.searchRecordings(searchQuery)
    : activeTab === 'incidents'
      ? recordings.filter(r => r.linkedIncidentId)
      : activeTab === 'drills'
        ? recordings.filter(r => r.linkedDrillId)
        : recordings;

  const renderTabs = () => (
    <View className="flex-row mb-4 bg-surface rounded-xl p-1">
      {(['all', 'incidents', 'drills', 'settings'] as TabType[]).map((tab) => (
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

  const renderRecordingCard = (recording: Recording) => {
    const typeConfig = RECORDING_TYPES[recording.type];
    const isUploading = uploading === recording.id;

    return (
      <TouchableOpacity
        key={recording.id}
        onPress={() => setSelectedRecording(recording)}
        className="bg-surface rounded-xl p-4 mb-3"
      >
        <View className="flex-row items-start gap-3">
          <View style={{ backgroundColor: typeConfig.color }} className="p-3 rounded-xl">
            <IconSymbol name="video.fill" size={24} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="text-foreground font-semibold" numberOfLines={1}>{recording.title}</Text>
            <Text className="text-muted text-sm">{formatDate(recording.recordedAt)}</Text>
            <View className="flex-row items-center gap-3 mt-2">
              <Text className="text-muted text-sm">{formatDuration(recording.duration)}</Text>
              <Text className="text-muted text-sm">{formatSize(recording.fileSize)}</Text>
              <Text className="text-muted text-sm">{recording.participants.length} participants</Text>
            </View>
          </View>
          <View 
            style={{ backgroundColor: getStatusColor(recording.status) + '20' }}
            className="px-2 py-1 rounded"
          >
            <Text style={{ color: getStatusColor(recording.status) }} className="text-xs capitalize">
              {recording.status}
            </Text>
          </View>
        </View>

        {/* Quick actions */}
        {recording.status === 'ready' && (
          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity
              onPress={() => handleUpload(recording.id)}
              disabled={isUploading}
              className="flex-1 bg-primary py-2 rounded-lg"
            >
              <Text className="text-white text-center text-sm font-medium">
                {isUploading ? 'Uploading...' : 'Upload to SharePoint'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Links */}
        {(recording.linkedIncidentId || recording.linkedDrillId) && (
          <View className="flex-row items-center gap-2 mt-2">
            {recording.linkedIncidentId && (
              <View className="bg-error/20 px-2 py-1 rounded">
                <Text style={{ color: colors.error }} className="text-xs">Incident Linked</Text>
              </View>
            )}
            {recording.linkedDrillId && (
              <View className="bg-warning/20 px-2 py-1 rounded">
                <Text style={{ color: colors.warning }} className="text-xs">Drill Linked</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderRecordingDetail = () => {
    if (!selectedRecording) return null;
    const typeConfig = RECORDING_TYPES[selectedRecording.type];

    return (
      <View>
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => setSelectedRecording(null)}
            className="flex-row items-center gap-2"
          >
            <IconSymbol name="chevron.left" size={20} color={colors.primary} />
            <Text style={{ color: colors.primary }} className="font-medium">Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleArchive(selectedRecording.id)}
            className="px-3 py-1 rounded-lg"
            style={{ backgroundColor: colors.muted + '20' }}
          >
            <Text className="text-muted text-sm">Archive</Text>
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View className="bg-surface rounded-xl p-4 mb-4">
          <View className="flex-row items-center gap-3 mb-3">
            <View style={{ backgroundColor: typeConfig.color }} className="p-3 rounded-xl">
              <IconSymbol name="video.fill" size={24} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-foreground text-lg font-bold">{selectedRecording.title}</Text>
              <View 
                style={{ backgroundColor: typeConfig.color + '20' }}
                className="px-2 py-1 rounded self-start mt-1"
              >
                <Text style={{ color: typeConfig.color }} className="text-xs">{typeConfig.label}</Text>
              </View>
            </View>
          </View>

          {selectedRecording.description && (
            <Text className="text-muted mb-3">{selectedRecording.description}</Text>
          )}

          <View className="flex-row items-center gap-4 mb-3">
            <View>
              <Text className="text-muted text-xs">Duration</Text>
              <Text className="text-foreground font-medium">{formatDuration(selectedRecording.duration)}</Text>
            </View>
            <View>
              <Text className="text-muted text-xs">Size</Text>
              <Text className="text-foreground font-medium">{formatSize(selectedRecording.fileSize)}</Text>
            </View>
            <View>
              <Text className="text-muted text-xs">Views</Text>
              <Text className="text-foreground font-medium">{selectedRecording.viewCount}</Text>
            </View>
          </View>

          {/* Actions */}
          <View className="flex-row gap-2">
            {selectedRecording.status === 'ready' && (
              <TouchableOpacity
                onPress={() => handleUpload(selectedRecording.id)}
                className="flex-1 bg-primary py-3 rounded-lg"
              >
                <Text className="text-white text-center font-medium">Upload to SharePoint</Text>
              </TouchableOpacity>
            )}
            {selectedRecording.sharePointUrl && (
              <TouchableOpacity
                onPress={() => Alert.alert('Open Recording', 'Opening in SharePoint...')}
                className="flex-1 bg-[#0078D4] py-3 rounded-lg"
              >
                <Text className="text-white text-center font-medium">Open in SharePoint</Text>
              </TouchableOpacity>
            )}
            {!selectedRecording.transcript && (
              <TouchableOpacity
                onPress={() => handleRequestTranscript(selectedRecording.id)}
                className="flex-1 bg-surface py-3 rounded-lg border border-border"
              >
                <Text className="text-foreground text-center font-medium">Get Transcript</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Participants */}
        <View className="bg-surface rounded-xl p-4 mb-4">
          <Text className="text-foreground font-semibold mb-3">
            Participants ({selectedRecording.participants.length})
          </Text>
          {selectedRecording.participants.map((participant) => (
            <View key={participant.id} className="flex-row items-center justify-between mb-2 pb-2 border-b border-border">
              <View>
                <Text className="text-foreground font-medium">{participant.name}</Text>
                <Text className="text-muted text-sm">{participant.role}</Text>
              </View>
              {participant.speakingTime && (
                <Text className="text-muted text-sm">
                  {formatDuration(participant.speakingTime)} speaking
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Transcript */}
        {selectedRecording.transcript && (
          <View className="bg-surface rounded-xl p-4 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-foreground font-semibold">Transcript</Text>
              <View 
                style={{ backgroundColor: selectedRecording.transcript.status === 'ready' ? colors.success + '20' : colors.warning + '20' }}
                className="px-2 py-1 rounded"
              >
                <Text 
                  style={{ color: selectedRecording.transcript.status === 'ready' ? colors.success : colors.warning }} 
                  className="text-xs capitalize"
                >
                  {selectedRecording.transcript.status}
                </Text>
              </View>
            </View>

            {selectedRecording.transcript.summary && (
              <View className="bg-background rounded-lg p-3 mb-3">
                <Text className="text-muted text-sm font-medium mb-1">Summary</Text>
                <Text className="text-foreground">{selectedRecording.transcript.summary}</Text>
              </View>
            )}

            {selectedRecording.transcript.keywords && (
              <View className="flex-row flex-wrap gap-2">
                {selectedRecording.transcript.keywords.map((keyword, index) => (
                  <View key={index} className="bg-primary/20 px-2 py-1 rounded">
                    <Text style={{ color: colors.primary }} className="text-xs">{keyword}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderSettings = () => (
    <View>
      <Text className="text-foreground text-lg font-bold mb-4">Recording Settings</Text>

      <View className="bg-surface rounded-xl p-4 mb-4">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-foreground font-medium">Recording Integration</Text>
            <Text className="text-muted text-sm">Enable automatic recording capture</Text>
          </View>
          <Switch
            value={config?.enabled}
            onValueChange={(value) => handleToggleSetting('enabled', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-foreground font-medium">Auto Upload</Text>
            <Text className="text-muted text-sm">Automatically upload to SharePoint</Text>
          </View>
          <Switch
            value={config?.autoUpload}
            onValueChange={(value) => handleToggleSetting('autoUpload', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-foreground font-medium">Transcription</Text>
            <Text className="text-muted text-sm">Generate transcripts automatically</Text>
          </View>
          <Switch
            value={config?.transcriptionEnabled}
            onValueChange={(value) => handleToggleSetting('transcriptionEnabled', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-foreground font-medium">Notifications</Text>
            <Text className="text-muted text-sm">Notify when processing complete</Text>
          </View>
          <Switch
            value={config?.notifyOnComplete}
            onValueChange={(value) => handleToggleSetting('notifyOnComplete', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      {/* Storage */}
      <View className="bg-surface rounded-xl p-4">
        <Text className="text-foreground font-semibold mb-3">Storage Usage</Text>
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-muted">Used</Text>
          <Text className="text-foreground font-medium">
            {formatSize(config?.storageQuotaUsed || 0)} / {formatSize(config?.storageQuotaTotal || 0)}
          </Text>
        </View>
        <View className="bg-background rounded-full h-3">
          <View 
            className="bg-primary h-3 rounded-full"
            style={{ width: `${((config?.storageQuotaUsed || 0) / (config?.storageQuotaTotal || 1)) * 100}%` }}
          />
        </View>
      </View>
    </View>
  );

  const renderList = () => (
    <View>
      {/* Stats */}
      <View className="flex-row flex-wrap gap-2 mb-4">
        <View className="flex-1 min-w-[80px] bg-surface rounded-xl p-3">
          <Text className="text-muted text-xs">Total</Text>
          <Text className="text-foreground text-xl font-bold">{analytics.totalRecordings}</Text>
        </View>
        <View className="flex-1 min-w-[80px] bg-surface rounded-xl p-3">
          <Text className="text-muted text-xs">Duration</Text>
          <Text className="text-foreground text-xl font-bold">{formatDuration(analytics.totalDuration)}</Text>
        </View>
        <View className="flex-1 min-w-[80px] bg-surface rounded-xl p-3">
          <Text className="text-muted text-xs">Storage</Text>
          <Text className="text-foreground text-xl font-bold">{formatSize(analytics.totalSize)}</Text>
        </View>
      </View>

      {/* Search */}
      <View className="bg-surface rounded-xl p-3 mb-4">
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search recordings..."
          placeholderTextColor={colors.muted}
          className="text-foreground"
        />
      </View>

      {/* Recordings */}
      {filteredRecordings.length === 0 ? (
        <View className="bg-surface rounded-xl p-8 items-center">
          <IconSymbol name="video.fill" size={48} color={colors.muted} />
          <Text className="text-muted mt-4 text-center">No recordings found</Text>
        </View>
      ) : (
        filteredRecordings.map(renderRecordingCard)
      )}
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Loading recordings...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-foreground text-2xl font-bold">Recordings</Text>
            <Text className="text-muted">Meeting Recording Integration</Text>
          </View>
          <View className="bg-[#5B5FC7] p-3 rounded-full">
            <IconSymbol name="video.fill" size={24} color="#FFFFFF" />
          </View>
        </View>

        {selectedRecording ? (
          renderRecordingDetail()
        ) : (
          <>
            {renderTabs()}
            {activeTab === 'settings' ? renderSettings() : renderList()}
          </>
        )}

        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
