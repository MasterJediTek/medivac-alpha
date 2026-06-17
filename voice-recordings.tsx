/**
 * Voice Recordings Screen
 * Mission voice recording management with JEDI Master authorization
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import voiceRecordingService, {
  type VoiceRecording,
  type RecordingRequest,
  type JediMaster,
  type RecordingAnalytics,
  type JediRank,
} from '@/lib/services/voice-recording-service';

type TabType = 'recordings' | 'requests' | 'masters' | 'analytics';

export default function VoiceRecordingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('recordings');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data states
  const [recordings, setRecordings] = useState<VoiceRecording[]>([]);
  const [requests, setRequests] = useState<RecordingRequest[]>([]);
  const [jediMasters, setJediMasters] = useState<JediMaster[]>([]);
  const [analytics, setAnalytics] = useState<RecordingAnalytics | null>(null);
  const [activeRecording, setActiveRecording] = useState<VoiceRecording | null>(null);

  // Request form state
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedMaster, setSelectedMaster] = useState<string>('');
  const [requestReason, setRequestReason] = useState('');
  const [requestChannel, setRequestChannel] = useState('Mission General');

  const loadData = useCallback(async () => {
    try {
      await voiceRecordingService.initialize();
      const [recordingsData, requestsData, mastersData, analyticsData, active] = await Promise.all([
        voiceRecordingService.getRecordings(),
        voiceRecordingService.getRequests(),
        voiceRecordingService.getJediMasters(),
        voiceRecordingService.getAnalytics(),
        voiceRecordingService.getActiveRecording(),
      ]);

      setRecordings(recordingsData);
      setRequests(requestsData);
      setJediMasters(mastersData);
      setAnalytics(analyticsData);
      setActiveRecording(active);
    } catch (error) {
      console.error('Failed to load recording data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleRequestRecording = async () => {
    if (!selectedMaster || !requestReason) {
      Alert.alert('Error', 'Please select a JEDI Master and provide a reason');
      return;
    }

    const request = await voiceRecordingService.requestRecording(
      selectedMaster,
      `channel_${requestChannel.toLowerCase().replace(' ', '_')}`,
      requestChannel,
      requestReason,
      { notifyParticipants: true }
    );

    if (request) {
      Alert.alert('Success', 'Recording request submitted');
      setShowRequestForm(false);
      setSelectedMaster('');
      setRequestReason('');
      loadData();
    } else {
      Alert.alert('Error', 'Only JEDI Masters can request recordings');
    }
  };

  const handleStopRecording = async (recordingId: string) => {
    Alert.alert(
      'Stop Recording',
      'Are you sure you want to stop this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            await voiceRecordingService.stopRecording(recordingId);
            loadData();
          },
        },
      ]
    );
  };

  const handlePlayRecording = async (recordingId: string) => {
    await voiceRecordingService.startPlayback(recordingId);
    Alert.alert('Playback Started', 'Recording is now playing');
  };

  const handleExportRecording = async (recordingId: string) => {
    const result = await voiceRecordingService.exportRecording(recordingId, 'mp3');
    if (result) {
      Alert.alert('Export Ready', `File: ${result.filename}\nURL: ${result.url}`);
    }
  };

  const handleRequestTranscription = async (recordingId: string) => {
    const transcription = await voiceRecordingService.requestTranscription(recordingId);
    if (transcription) {
      Alert.alert('Transcription', transcription.status === 'completed' 
        ? 'Transcription ready' 
        : 'Transcription processing...');
      loadData();
    }
  };

  const getRankIcon = (rank: JediRank): string => {
    const icons: Record<JediRank, string> = {
      youngling: '🌱',
      padawan: '📚',
      knight: '⚔️',
      master: '🌟',
      council_member: '👑',
      grand_master: '✨',
    };
    return icons[rank] || '⚔️';
  };

  const getRankColor = (rank: JediRank): string => {
    const rankColors: Record<JediRank, string> = {
      youngling: '#10B981',
      padawan: '#3B82F6',
      knight: '#8B5CF6',
      master: '#F59E0B',
      council_member: '#EF4444',
      grand_master: '#FFD700',
    };
    return rankColors[rank] || colors.muted;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'recording':
        return colors.error;
      case 'paused':
        return colors.warning;
      case 'processing':
        return colors.primary;
      case 'approved':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'denied':
        return colors.error;
      default:
        return colors.muted;
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderTabs = () => (
    <View className="flex-row gap-2 mb-4">
      {(['recordings', 'requests', 'masters', 'analytics'] as TabType[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          className={`flex-1 py-3 rounded-xl items-center ${activeTab === tab ? 'bg-primary' : 'bg-surface'}`}
        >
          <Text className={`font-medium capitalize ${activeTab === tab ? 'text-white' : 'text-foreground'}`}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderRecordings = () => (
    <View className="gap-4">
      {/* Active Recording Banner */}
      {activeRecording && (
        <View className="bg-error/10 border border-error rounded-xl p-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <View className="w-3 h-3 bg-error rounded-full animate-pulse" />
              <Text className="text-error font-bold">RECORDING IN PROGRESS</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleStopRecording(activeRecording.id)}
              className="bg-error px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-medium">Stop</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-foreground font-medium">{activeRecording.channelName}</Text>
          <Text className="text-muted text-sm">
            Requested by {activeRecording.requestedByName} ({getRankIcon(activeRecording.requestedByRank)})
          </Text>
        </View>
      )}

      {/* Request Recording Button */}
      <TouchableOpacity
        onPress={() => setShowRequestForm(true)}
        className="bg-primary py-4 rounded-xl items-center flex-row justify-center gap-2"
      >
        <Text className="text-white text-2xl">🎙️</Text>
        <Text className="text-white font-semibold text-lg">Request Recording (JEDI Master Only)</Text>
      </TouchableOpacity>

      {/* Request Form Modal */}
      {showRequestForm && (
        <View className="bg-surface rounded-xl p-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">New Recording Request</Text>
          
          <Text className="text-sm text-muted mb-2">Select JEDI Master</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row gap-2">
              {jediMasters.filter(m => m.canRequestRecording).map((master) => (
                <TouchableOpacity
                  key={master.id}
                  onPress={() => setSelectedMaster(master.id)}
                  className={`px-4 py-2 rounded-lg border ${selectedMaster === master.id ? 'bg-primary border-primary' : 'bg-background border-border'}`}
                >
                  <Text className={selectedMaster === master.id ? 'text-white' : 'text-foreground'}>
                    {getRankIcon(master.rank)} {master.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text className="text-sm text-muted mb-2">Reason for Recording</Text>
          <TextInput
            value={requestReason}
            onChangeText={setRequestReason}
            placeholder="Training review, incident documentation, etc."
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={3}
            className="bg-background border border-border rounded-lg p-3 text-foreground mb-4"
            style={{ textAlignVertical: 'top' }}
          />

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setShowRequestForm(false)}
              className="flex-1 py-3 bg-surface border border-border rounded-lg items-center"
            >
              <Text className="text-foreground font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRequestRecording}
              className="flex-1 py-3 bg-primary rounded-lg items-center"
            >
              <Text className="text-white font-medium">Submit Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Recordings List */}
      {recordings.filter(r => r.status === 'completed').map((recording) => (
        <View key={recording.id} className="bg-surface rounded-xl p-4">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-foreground">{recording.channelName}</Text>
              {recording.missionName && (
                <Text className="text-sm text-primary">{recording.missionName}</Text>
              )}
              <Text className="text-sm text-muted">
                {new Date(recording.startedAt).toLocaleDateString()} at {new Date(recording.startedAt).toLocaleTimeString()}
              </Text>
            </View>
            <View
              className="px-2 py-1 rounded"
              style={{ backgroundColor: getStatusColor(recording.status) + '20' }}
            >
              <Text className="text-xs capitalize" style={{ color: getStatusColor(recording.status) }}>
                {recording.status}
              </Text>
            </View>
          </View>

          {/* Recording Info */}
          <View className="flex-row flex-wrap gap-4 mb-3">
            <View>
              <Text className="text-xs text-muted">Duration</Text>
              <Text className="text-foreground font-medium">{formatDuration(recording.duration)}</Text>
            </View>
            <View>
              <Text className="text-xs text-muted">Size</Text>
              <Text className="text-foreground font-medium">{formatFileSize(recording.fileSize)}</Text>
            </View>
            <View>
              <Text className="text-xs text-muted">Participants</Text>
              <Text className="text-foreground font-medium">{recording.participants.length}</Text>
            </View>
            <View>
              <Text className="text-xs text-muted">Views</Text>
              <Text className="text-foreground font-medium">{recording.views}</Text>
            </View>
          </View>

          {/* Requested By */}
          <View className="flex-row items-center gap-2 mb-3 p-2 bg-background rounded-lg">
            <Text className="text-lg">{getRankIcon(recording.requestedByRank)}</Text>
            <Text className="text-foreground">Requested by {recording.requestedByName}</Text>
          </View>

          {/* Participants Preview */}
          {recording.participants.length > 0 && (
            <View className="mb-3">
              <Text className="text-sm text-muted mb-2">Participants</Text>
              <View className="flex-row flex-wrap gap-2">
                {recording.participants.slice(0, 4).map((participant) => (
                  <View key={participant.odId} className="px-2 py-1 bg-background rounded">
                    <Text className="text-xs text-foreground">{participant.name}</Text>
                    <Text className="text-xs text-muted">{formatDuration(participant.speakingTime)} speaking</Text>
                  </View>
                ))}
                {recording.participants.length > 4 && (
                  <View className="px-2 py-1 bg-background rounded">
                    <Text className="text-xs text-muted">+{recording.participants.length - 4} more</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Transcription Status */}
          {recording.transcription && (
            <View className="mb-3 p-2 bg-success/10 rounded-lg">
              <Text className="text-success text-sm">
                ✓ Transcription available ({recording.transcription.wordCount} words, {recording.transcription.accuracy}% accuracy)
              </Text>
            </View>
          )}

          {/* Actions */}
          <View className="flex-row gap-2 pt-3 border-t border-border">
            <TouchableOpacity
              onPress={() => handlePlayRecording(recording.id)}
              className="flex-1 py-2 bg-primary rounded-lg items-center"
            >
              <Text className="text-white font-medium">▶ Play</Text>
            </TouchableOpacity>
            {!recording.transcription && (
              <TouchableOpacity
                onPress={() => handleRequestTranscription(recording.id)}
                className="flex-1 py-2 bg-surface border border-border rounded-lg items-center"
              >
                <Text className="text-foreground">Transcribe</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => handleExportRecording(recording.id)}
              className="flex-1 py-2 bg-surface border border-border rounded-lg items-center"
            >
              <Text className="text-foreground">Export</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {recordings.filter(r => r.status === 'completed').length === 0 && (
        <View className="bg-surface rounded-xl p-8 items-center">
          <Text className="text-4xl mb-3">🎙️</Text>
          <Text className="text-lg font-semibold text-foreground">No Recordings</Text>
          <Text className="text-muted text-center">
            JEDI Masters can request voice recordings for training and review
          </Text>
        </View>
      )}
    </View>
  );

  const renderRequests = () => (
    <View className="gap-4">
      {requests.map((request) => (
        <View key={request.id} className="bg-surface rounded-xl p-4">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-foreground">{request.channelName}</Text>
              {request.missionName && (
                <Text className="text-sm text-primary">{request.missionName}</Text>
              )}
            </View>
            <View
              className="px-2 py-1 rounded"
              style={{ backgroundColor: getStatusColor(request.status) + '20' }}
            >
              <Text className="text-xs capitalize" style={{ color: getStatusColor(request.status) }}>
                {request.status}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2 mb-3 p-2 bg-background rounded-lg">
            <Text className="text-lg">{getRankIcon(request.requestedByRank)}</Text>
            <View>
              <Text className="text-foreground font-medium">{request.requestedByName}</Text>
              <Text className="text-xs text-muted capitalize">{request.requestedByRank.replace('_', ' ')}</Text>
            </View>
          </View>

          <Text className="text-sm text-muted mb-1">Reason:</Text>
          <Text className="text-foreground mb-3">{request.reason}</Text>

          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1">
              <Text className="text-xs text-muted">Priority:</Text>
              <Text className={`text-xs font-medium capitalize ${request.priority === 'critical' ? 'text-error' : request.priority === 'high' ? 'text-warning' : 'text-foreground'}`}>
                {request.priority}
              </Text>
            </View>
            <Text className="text-xs text-muted">
              {new Date(request.requestedAt).toLocaleString()}
            </Text>
          </View>

          {request.status === 'denied' && request.denialReason && (
            <View className="mt-3 p-2 bg-error/10 rounded-lg">
              <Text className="text-error text-sm">Denied: {request.denialReason}</Text>
            </View>
          )}
        </View>
      ))}

      {requests.length === 0 && (
        <View className="bg-surface rounded-xl p-8 items-center">
          <Text className="text-4xl mb-3">📋</Text>
          <Text className="text-lg font-semibold text-foreground">No Requests</Text>
          <Text className="text-muted text-center">No recording requests have been made</Text>
        </View>
      )}
    </View>
  );

  const renderMasters = () => (
    <View className="gap-4">
      <View className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-2">
        <Text className="text-primary font-semibold mb-1">JEDI Master Authorization</Text>
        <Text className="text-muted text-sm">
          Only JEDI Masters can request voice recordings. Council members have auto-approval privileges.
        </Text>
      </View>

      {jediMasters.map((master) => (
        <View key={master.id} className="bg-surface rounded-xl p-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-3">
              <View 
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: getRankColor(master.rank) + '20' }}
              >
                <Text className="text-2xl">{getRankIcon(master.rank)}</Text>
              </View>
              <View>
                <Text className="text-lg font-semibold text-foreground">{master.name}</Text>
                <Text className="text-sm capitalize" style={{ color: getRankColor(master.rank) }}>
                  {master.rank.replace('_', ' ')}
                </Text>
              </View>
            </View>
            {master.councilMember && (
              <View className="bg-warning/20 px-2 py-1 rounded">
                <Text className="text-warning text-xs font-medium">Council</Text>
              </View>
            )}
          </View>

          <View className="flex-row flex-wrap gap-2 mb-3">
            {master.specializations.map((spec) => (
              <View key={spec} className="px-2 py-1 bg-background rounded">
                <Text className="text-xs text-muted">{spec}</Text>
              </View>
            ))}
          </View>

          <View className="flex-row items-center justify-between pt-3 border-t border-border">
            <Text className="text-sm text-muted">
              {master.recordingsRequested} recordings requested
            </Text>
            <View className={`px-2 py-1 rounded ${master.canRequestRecording ? 'bg-success/20' : 'bg-muted/20'}`}>
              <Text className={master.canRequestRecording ? 'text-success text-xs' : 'text-muted text-xs'}>
                {master.canRequestRecording ? 'Can Request' : 'Cannot Request'}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderAnalytics = () => (
    <View className="gap-4">
      {analytics && (
        <>
          {/* Summary Stats */}
          <View className="flex-row flex-wrap gap-4">
            <View className="flex-1 min-w-[140px] bg-surface rounded-xl p-4">
              <Text className="text-3xl font-bold text-foreground">{analytics.totalRecordings}</Text>
              <Text className="text-sm text-muted">Total Recordings</Text>
            </View>
            <View className="flex-1 min-w-[140px] bg-surface rounded-xl p-4">
              <Text className="text-3xl font-bold text-foreground">{formatDuration(analytics.totalDuration)}</Text>
              <Text className="text-sm text-muted">Total Duration</Text>
            </View>
            <View className="flex-1 min-w-[140px] bg-surface rounded-xl p-4">
              <Text className="text-3xl font-bold text-foreground">{formatFileSize(analytics.storageUsed)}</Text>
              <Text className="text-sm text-muted">Storage Used</Text>
            </View>
            <View className="flex-1 min-w-[140px] bg-surface rounded-xl p-4">
              <Text className="text-3xl font-bold text-foreground">{analytics.participantStats.totalParticipants}</Text>
              <Text className="text-sm text-muted">Unique Participants</Text>
            </View>
          </View>

          {/* Top Requesters */}
          {analytics.topRequesters.length > 0 && (
            <View className="bg-surface rounded-xl p-4">
              <Text className="text-lg font-semibold text-foreground mb-4">Top Requesters</Text>
              <View className="gap-3">
                {analytics.topRequesters.map((requester, index) => (
                  <View
                    key={requester.odId}
                    className="flex-row items-center justify-between p-3 bg-background rounded-lg"
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="w-8 h-8 bg-primary/20 rounded-full items-center justify-center">
                        <Text className="text-primary font-bold">{index + 1}</Text>
                      </View>
                      <Text className="text-foreground font-medium">{requester.name}</Text>
                    </View>
                    <Text className="text-muted">{requester.count} recordings</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Transcription Stats */}
          <View className="bg-surface rounded-xl p-4">
            <Text className="text-lg font-semibold text-foreground mb-4">Transcription Stats</Text>
            <View className="flex-row items-center justify-between p-3 bg-background rounded-lg mb-2">
              <Text className="text-foreground">Transcribed Recordings</Text>
              <Text className="text-primary font-medium">{analytics.transcriptionStats.completed}</Text>
            </View>
            <View className="flex-row items-center justify-between p-3 bg-background rounded-lg">
              <Text className="text-foreground">Average Accuracy</Text>
              <Text className="text-success font-medium">{analytics.transcriptionStats.averageAccuracy}%</Text>
            </View>
          </View>

          {/* Storage */}
          <View className="bg-surface rounded-xl p-4">
            <Text className="text-lg font-semibold text-foreground mb-4">Storage</Text>
            <View className="h-4 bg-background rounded-full overflow-hidden mb-2">
              <View 
                className="h-full bg-primary rounded-full"
                style={{ width: `${(analytics.storageUsed / analytics.storageLimit) * 100}%` }}
              />
            </View>
            <Text className="text-sm text-muted text-center">
              {formatFileSize(analytics.storageUsed)} of {formatFileSize(analytics.storageLimit)} used
            </Text>
          </View>
        </>
      )}
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Loading recordings...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between py-4">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-bold text-foreground">Voice Recordings</Text>
              <Text className="text-muted">JEDI Master Authorized</Text>
            </View>
          </View>
          {activeRecording && (
            <View className="flex-row items-center gap-2 bg-error/20 px-3 py-1 rounded-full">
              <View className="w-2 h-2 bg-error rounded-full" />
              <Text className="text-error text-sm font-medium">Recording</Text>
            </View>
          )}
        </View>

        {/* Tabs */}
        {renderTabs()}

        {/* Content */}
        <View className="pb-8">
          {activeTab === 'recordings' && renderRecordings()}
          {activeTab === 'requests' && renderRequests()}
          {activeTab === 'masters' && renderMasters()}
          {activeTab === 'analytics' && renderAnalytics()}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
