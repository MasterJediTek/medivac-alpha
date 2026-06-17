/**
 * Mission Voice Chat Screen
 * Real-time voice communication during cooperative missions
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import missionVoiceChatService, {
  type VoiceChannel,
  type VoiceParticipant,
  type VoiceSettings,
  type VoiceStats,
  type VoiceMode,
  type ChannelType,
} from '@/lib/services/mission-voice-chat-service';

type TabType = 'channels' | 'settings' | 'stats';

export default function VoiceChatScreen() {
  const colors = useColors();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('channels');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data states
  const [channels, setChannels] = useState<VoiceChannel[]>([]);
  const [settings, setSettings] = useState<VoiceSettings | null>(null);
  const [stats, setStats] = useState<VoiceStats | null>(null);
  const [currentChannel, setCurrentChannel] = useState<VoiceChannel | null>(null);
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);

  const currentUserId = 'user_current';
  const currentUserName = 'Current User';

  const loadData = useCallback(async () => {
    try {
      await missionVoiceChatService.initialize();
      const [channelsData, settingsData, statsData] = await Promise.all([
        missionVoiceChatService.getChannels(),
        missionVoiceChatService.getSettings(),
        missionVoiceChatService.getStats(),
      ]);

      setChannels(channelsData);
      setSettings(settingsData);
      setStats(statsData);
      setCurrentChannel(missionVoiceChatService.getCurrentChannel());
      setConnectionState(missionVoiceChatService.getConnectionState());
    } catch (error) {
      console.error('Failed to load voice chat data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Set up event listeners
    const handleParticipantJoined = () => loadData();
    const handleParticipantLeft = () => loadData();

    missionVoiceChatService.on('participant_joined', handleParticipantJoined);
    missionVoiceChatService.on('participant_left', handleParticipantLeft);

    return () => {
      missionVoiceChatService.off('participant_joined', handleParticipantJoined);
      missionVoiceChatService.off('participant_left', handleParticipantLeft);
    };
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleJoinChannel = async (channelId: string) => {
    const result = await missionVoiceChatService.joinChannel(
      currentUserId,
      currentUserName,
      channelId
    );

    if (result.success) {
      setCurrentChannel(result.channel || null);
      setConnectionState('connected');
      loadData();
    } else {
      Alert.alert('Error', result.error || 'Failed to join channel');
    }
  };

  const handleLeaveChannel = async () => {
    if (!currentChannel) return;

    const success = await missionVoiceChatService.leaveChannel(currentUserId, currentChannel.id);
    if (success) {
      setCurrentChannel(null);
      setConnectionState('disconnected');
      loadData();
    }
  };

  const handleToggleMute = async () => {
    const newMuted = !isMuted;
    const success = await missionVoiceChatService.setMuted(currentUserId, newMuted);
    if (success) {
      setIsMuted(newMuted);
    }
  };

  const handleToggleDeafen = async () => {
    const newDeafened = !isDeafened;
    const success = await missionVoiceChatService.setDeafened(currentUserId, newDeafened);
    if (success) {
      setIsDeafened(newDeafened);
      if (newDeafened) setIsMuted(true);
    }
  };

  const handlePushToTalkStart = () => {
    if (settings?.mode === 'push_to_talk') {
      setIsPushToTalkActive(true);
      missionVoiceChatService.startPushToTalk(currentUserId);
    }
  };

  const handlePushToTalkEnd = () => {
    if (settings?.mode === 'push_to_talk') {
      setIsPushToTalkActive(false);
      missionVoiceChatService.stopPushToTalk(currentUserId);
    }
  };

  const handleUpdateSettings = async (updates: Partial<VoiceSettings>) => {
    const newSettings = await missionVoiceChatService.updateSettings(updates);
    setSettings(newSettings);
  };

  const getChannelTypeIcon = (type: ChannelType): string => {
    switch (type) {
      case 'mission':
        return '🎯';
      case 'team':
        return '👥';
      case 'proximity':
        return '📍';
      case 'command':
        return '👑';
      default:
        return '🔊';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'speaking':
        return colors.success;
      case 'connected':
        return colors.primary;
      case 'muted':
        return colors.warning;
      case 'deafened':
        return colors.error;
      default:
        return colors.muted;
    }
  };

  const getQualityColor = (quality: string): string => {
    switch (quality) {
      case 'excellent':
        return colors.success;
      case 'good':
        return colors.primary;
      case 'fair':
        return colors.warning;
      case 'poor':
        return colors.error;
      default:
        return colors.muted;
    }
  };

  const renderTabs = () => (
    <View className="flex-row gap-2 mb-4">
      {(['channels', 'settings', 'stats'] as TabType[]).map((tab) => (
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

  const renderCurrentChannel = () => {
    if (!currentChannel) return null;

    return (
      <View className="bg-surface rounded-xl p-4 mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-2xl">{getChannelTypeIcon(currentChannel.type)}</Text>
            <View>
              <Text className="text-lg font-semibold text-foreground">{currentChannel.name}</Text>
              <Text className="text-sm text-muted">{currentChannel.participants.length} participants</Text>
            </View>
          </View>
          <View
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: connectionState === 'connected' ? colors.success : colors.muted }}
          />
        </View>

        {/* Participants */}
        <View className="flex-row flex-wrap gap-2 mb-4">
          {currentChannel.participants.map((participant) => (
            <View
              key={participant.odId}
              className="flex-row items-center gap-2 px-3 py-2 bg-background rounded-lg"
            >
              <View
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getStatusColor(participant.status) }}
              />
              <Text className="text-foreground text-sm">{participant.odName}</Text>
              {participant.isSpeaking && <Text className="text-xs">🎤</Text>}
              {participant.isMuted && <Text className="text-xs">🔇</Text>}
            </View>
          ))}
        </View>

        {/* Voice Controls */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={handleToggleMute}
            className={`flex-1 py-3 rounded-lg items-center ${isMuted ? 'bg-error/20' : 'bg-success/20'}`}
          >
            <Text className={isMuted ? 'text-error' : 'text-success'}>
              {isMuted ? '🔇 Muted' : '🎤 Unmuted'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleToggleDeafen}
            className={`flex-1 py-3 rounded-lg items-center ${isDeafened ? 'bg-error/20' : 'bg-primary/20'}`}
          >
            <Text className={isDeafened ? 'text-error' : 'text-primary'}>
              {isDeafened ? '🔇 Deafened' : '🔊 Listening'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleLeaveChannel}
            className="flex-1 bg-error/20 py-3 rounded-lg items-center"
          >
            <Text className="text-error">Leave</Text>
          </TouchableOpacity>
        </View>

        {/* Push to Talk Button */}
        {settings?.mode === 'push_to_talk' && (
          <TouchableOpacity
            onPressIn={handlePushToTalkStart}
            onPressOut={handlePushToTalkEnd}
            className={`mt-3 py-4 rounded-lg items-center ${isPushToTalkActive ? 'bg-success' : 'bg-surface border border-border'}`}
          >
            <Text className={isPushToTalkActive ? 'text-white font-bold' : 'text-foreground'}>
              {isPushToTalkActive ? '🎤 SPEAKING...' : 'Hold to Talk'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderChannels = () => (
    <View className="gap-4">
      {renderCurrentChannel()}

      <Text className="text-lg font-semibold text-foreground">Available Channels</Text>

      {channels.map((channel) => (
        <TouchableOpacity
          key={channel.id}
          onPress={() => handleJoinChannel(channel.id)}
          disabled={currentChannel?.id === channel.id}
          className={`bg-surface rounded-xl p-4 ${currentChannel?.id === channel.id ? 'opacity-50' : ''}`}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Text className="text-2xl">{getChannelTypeIcon(channel.type)}</Text>
              <View>
                <Text className="text-lg font-semibold text-foreground">{channel.name}</Text>
                <Text className="text-sm text-muted capitalize">{channel.type} channel</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-foreground font-medium">
                {channel.participants.length}/{channel.maxParticipants}
              </Text>
              <Text className="text-xs text-muted">participants</Text>
            </View>
          </View>

          {channel.participants.length > 0 && (
            <View className="flex-row flex-wrap gap-1 mt-3">
              {channel.participants.slice(0, 5).map((p) => (
                <View
                  key={p.odId}
                  className="px-2 py-1 bg-background rounded"
                >
                  <Text className="text-xs text-muted">{p.odName}</Text>
                </View>
              ))}
              {channel.participants.length > 5 && (
                <View className="px-2 py-1 bg-background rounded">
                  <Text className="text-xs text-muted">+{channel.participants.length - 5} more</Text>
                </View>
              )}
            </View>
          )}

          {channel.isLocked && (
            <View className="flex-row items-center gap-1 mt-2">
              <Text className="text-xs">🔒</Text>
              <Text className="text-xs text-muted">Password required</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSettings = () => (
    <View className="gap-4">
      {settings && (
        <>
          {/* Voice Mode */}
          <View className="bg-surface rounded-xl p-4">
            <Text className="text-lg font-semibold text-foreground mb-3">Voice Mode</Text>
            <View className="gap-2">
              {(['push_to_talk', 'open_mic', 'voice_activated'] as VoiceMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => handleUpdateSettings({ mode })}
                  className={`flex-row items-center justify-between p-3 rounded-lg ${settings.mode === mode ? 'bg-primary/20' : 'bg-background'}`}
                >
                  <View>
                    <Text className="text-foreground font-medium capitalize">{mode.replace(/_/g, ' ')}</Text>
                    <Text className="text-xs text-muted">
                      {mode === 'push_to_talk' && 'Hold button to speak'}
                      {mode === 'open_mic' && 'Always transmitting'}
                      {mode === 'voice_activated' && 'Speak to activate'}
                    </Text>
                  </View>
                  {settings.mode === mode && (
                    <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
                      <Text className="text-white text-xs">✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Volume Controls */}
          <View className="bg-surface rounded-xl p-4">
            <Text className="text-lg font-semibold text-foreground mb-3">Volume</Text>
            <View className="gap-4">
              <View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-foreground">Input Volume</Text>
                  <Text className="text-muted">{settings.inputVolume}%</Text>
                </View>
                <View className="h-2 bg-background rounded-full overflow-hidden">
                  <View
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${settings.inputVolume}%` }}
                  />
                </View>
              </View>
              <View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-foreground">Output Volume</Text>
                  <Text className="text-muted">{settings.outputVolume}%</Text>
                </View>
                <View className="h-2 bg-background rounded-full overflow-hidden">
                  <View
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${settings.outputVolume}%` }}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Audio Processing */}
          <View className="bg-surface rounded-xl p-4">
            <Text className="text-lg font-semibold text-foreground mb-3">Audio Processing</Text>
            <View className="gap-3">
              {[
                { key: 'echoCancellation', label: 'Echo Cancellation', value: settings.echoCancellation },
                { key: 'noiseSuppression', label: 'Noise Suppression', value: settings.noiseSuppression },
                { key: 'autoGainControl', label: 'Auto Gain Control', value: settings.autoGainControl },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => handleUpdateSettings({ [item.key]: !item.value })}
                  className="flex-row items-center justify-between p-3 bg-background rounded-lg"
                >
                  <Text className="text-foreground">{item.label}</Text>
                  <View
                    className={`w-12 h-6 rounded-full ${item.value ? 'bg-success' : 'bg-muted'}`}
                    style={{ justifyContent: 'center', alignItems: item.value ? 'flex-end' : 'flex-start' }}
                  >
                    <View className="w-5 h-5 bg-white rounded-full mx-0.5" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Other Settings */}
          <View className="bg-surface rounded-xl p-4">
            <Text className="text-lg font-semibold text-foreground mb-3">Other</Text>
            <View className="gap-3">
              {[
                { key: 'muteOnJoin', label: 'Mute on Join', value: settings.muteOnJoin },
                { key: 'playJoinLeaveSound', label: 'Join/Leave Sounds', value: settings.playJoinLeaveSound },
                { key: 'showSpeakingIndicator', label: 'Speaking Indicator', value: settings.showSpeakingIndicator },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => handleUpdateSettings({ [item.key]: !item.value })}
                  className="flex-row items-center justify-between p-3 bg-background rounded-lg"
                >
                  <Text className="text-foreground">{item.label}</Text>
                  <View
                    className={`w-12 h-6 rounded-full ${item.value ? 'bg-success' : 'bg-muted'}`}
                    style={{ justifyContent: 'center', alignItems: item.value ? 'flex-end' : 'flex-start' }}
                  >
                    <View className="w-5 h-5 bg-white rounded-full mx-0.5" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}
    </View>
  );

  const renderStats = () => (
    <View className="gap-4">
      {stats && (
        <>
          {/* Connection Quality */}
          <View className="bg-surface rounded-xl p-6 items-center">
            <Text className="text-muted mb-2">Connection Quality</Text>
            <Text
              className="text-3xl font-bold capitalize"
              style={{ color: getQualityColor(stats.connectionQuality) }}
            >
              {stats.connectionQuality}
            </Text>
          </View>

          {/* Stats Grid */}
          <View className="flex-row flex-wrap gap-4">
            <View className="flex-1 min-w-[140px] bg-surface rounded-xl p-4">
              <Text className="text-2xl font-bold text-foreground">{stats.latency.toFixed(0)}ms</Text>
              <Text className="text-sm text-muted">Latency</Text>
            </View>
            <View className="flex-1 min-w-[140px] bg-surface rounded-xl p-4">
              <Text className="text-2xl font-bold text-foreground">{stats.packetLoss.toFixed(1)}%</Text>
              <Text className="text-sm text-muted">Packet Loss</Text>
            </View>
            <View className="flex-1 min-w-[140px] bg-surface rounded-xl p-4">
              <Text className="text-2xl font-bold text-foreground">{stats.jitter.toFixed(0)}ms</Text>
              <Text className="text-sm text-muted">Jitter</Text>
            </View>
            <View className="flex-1 min-w-[140px] bg-surface rounded-xl p-4">
              <Text className="text-2xl font-bold text-foreground">{(stats.bitrate / 1000).toFixed(0)}kbps</Text>
              <Text className="text-sm text-muted">Bitrate</Text>
            </View>
          </View>

          {/* Codec Info */}
          <View className="bg-surface rounded-xl p-4">
            <Text className="text-lg font-semibold text-foreground mb-3">Audio Codec</Text>
            <View className="flex-row items-center justify-between p-3 bg-background rounded-lg">
              <Text className="text-foreground">Codec</Text>
              <Text className="text-primary font-medium uppercase">{stats.codec}</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Loading voice chat...</Text>
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
              <Text className="text-2xl font-bold text-foreground">Voice Chat</Text>
              <Text className="text-muted">Mission Communication</Text>
            </View>
          </View>
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: connectionState === 'connected' ? colors.success + '20' : colors.muted + '20' }}
          >
            <Text
              className="text-sm font-medium capitalize"
              style={{ color: connectionState === 'connected' ? colors.success : colors.muted }}
            >
              {connectionState}
            </Text>
          </View>
        </View>

        {/* Tabs */}
        {renderTabs()}

        {/* Content */}
        <View className="pb-8">
          {activeTab === 'channels' && renderChannels()}
          {activeTab === 'settings' && renderSettings()}
          {activeTab === 'stats' && renderStats()}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
