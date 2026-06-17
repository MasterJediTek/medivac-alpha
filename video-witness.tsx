import { useState, useEffect } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { videoWitnessVerificationService, type VideoSession, type VideoRecording } from '@/lib/services/video-witness-verification-service';

const COLORS = {
  primary: '#005A9C',
  secondary: '#00838F',
  accent: '#FF6B35',
  success: '#2E7D32',
  warning: '#F57C00',
  danger: '#D32F2F',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  muted: '#6B7280',
};

export default function VideoWitnessScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'record' | 'sessions' | 'playback' | 'settings'>('record');
  const [sessions, setSessions] = useState<VideoSession[]>([]);
  const [currentSession, setCurrentSession] = useState<VideoSession | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const loadData = () => {
    setSessions(videoWitnessVerificationService.getAllSessions());
  };

  const handleStartSession = () => {
    const session = videoWitnessVerificationService.createSession('doc_' + Date.now(), 'AHD Document');
    setCurrentSession(session);
    loadData();
  };

  const handleStartRecording = () => {
    if (!currentSession) return;
    videoWitnessVerificationService.startRecording(currentSession.id);
    setIsRecording(true);
    setRecordingTime(0);
  };

  const handleStopRecording = () => {
    if (!currentSession) return;
    videoWitnessVerificationService.stopRecording(currentSession.id);
    setIsRecording(false);
    const updated = videoWitnessVerificationService.getSession(currentSession.id);
    setCurrentSession(updated);
    loadData();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ScreenContainer className="bg-white">
      {/* Header */}
      <View className="px-4 py-3 border-b flex-row items-center" style={{ borderColor: '#E5E7EB' }}>
        <Pressable onPress={() => router.back()} className="mr-3">
          <Text style={{ color: COLORS.primary }}>← Back</Text>
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-bold" style={{ color: COLORS.text }}>
            Video Witness Verification
          </Text>
          <Text className="text-xs" style={{ color: COLORS.muted }}>
            Record signing ceremony with witnesses
          </Text>
        </View>
      </View>

      {/* Tab Bar */}
      <View className="flex-row border-b" style={{ borderColor: '#E5E7EB' }}>
        {[
          { id: 'record', label: 'Record', icon: '🎬' },
          { id: 'sessions', label: 'Sessions', icon: '📁' },
          { id: 'playback', label: 'Playback', icon: '▶️' },
          { id: 'settings', label: 'Settings', icon: '⚙️' },
        ].map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => setActiveTab(tab.id as typeof activeTab)}
            className="flex-1 py-3 items-center"
            style={{
              borderBottomWidth: 2,
              borderBottomColor: activeTab === tab.id ? COLORS.primary : 'transparent',
            }}
          >
            <Text className="text-lg">{tab.icon}</Text>
            <Text
              className="text-xs mt-1"
              style={{ color: activeTab === tab.id ? COLORS.primary : COLORS.muted }}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView className="flex-1">
        {/* Record Tab */}
        {activeTab === 'record' && (
          <View className="p-4">
            {/* Recording Preview */}
            <View className="rounded-2xl overflow-hidden mb-4" style={{ backgroundColor: '#000', aspectRatio: 16/9 }}>
              <View className="flex-1 items-center justify-center">
                {isRecording ? (
                  <View className="items-center">
                    <View className="w-4 h-4 rounded-full mb-2" style={{ backgroundColor: COLORS.danger }} />
                    <Text className="text-white text-2xl font-bold">{formatTime(recordingTime)}</Text>
                    <Text className="text-white text-sm mt-1">Recording in progress...</Text>
                  </View>
                ) : (
                  <View className="items-center">
                    <Text className="text-6xl mb-2">📹</Text>
                    <Text className="text-white text-sm">Camera Preview</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Recording Controls */}
            <View className="flex-row justify-center mb-6">
              {!isRecording ? (
                <Pressable
                  onPress={currentSession ? handleStartRecording : handleStartSession}
                  className="w-20 h-20 rounded-full items-center justify-center"
                  style={{ backgroundColor: COLORS.danger }}
                >
                  <Text className="text-white text-3xl">●</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleStopRecording}
                  className="w-20 h-20 rounded-full items-center justify-center"
                  style={{ backgroundColor: COLORS.danger }}
                >
                  <View className="w-8 h-8 rounded" style={{ backgroundColor: '#FFF' }} />
                </Pressable>
              )}
            </View>

            {/* Session Info */}
            {currentSession && (
              <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: COLORS.background }}>
                <Text className="font-bold mb-2" style={{ color: COLORS.text }}>
                  Current Session
                </Text>
                <Text className="text-sm" style={{ color: COLORS.muted }}>
                  Document: {currentSession.documentTitle}
                </Text>
                <Text className="text-sm" style={{ color: COLORS.muted }}>
                  Recordings: {currentSession.recordings.length}
                </Text>
                <Text className="text-sm" style={{ color: COLORS.muted }}>
                  Status: {currentSession.status}
                </Text>
              </View>
            )}

            {/* Instructions */}
            <View className="rounded-xl p-4" style={{ backgroundColor: COLORS.primary + '10' }}>
              <Text className="font-bold mb-2" style={{ color: COLORS.primary }}>
                📋 Recording Instructions
              </Text>
              <Text className="text-sm mb-2" style={{ color: COLORS.text }}>
                1. Position the camera to capture all participants
              </Text>
              <Text className="text-sm mb-2" style={{ color: COLORS.text }}>
                2. Ensure good lighting and clear audio
              </Text>
              <Text className="text-sm mb-2" style={{ color: COLORS.text }}>
                3. Record the maker signing first
              </Text>
              <Text className="text-sm mb-2" style={{ color: COLORS.text }}>
                4. Then record each witness signing
              </Text>
              <Text className="text-sm" style={{ color: COLORS.text }}>
                5. All participants must be visible during signing
              </Text>
            </View>
          </View>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <View className="p-4">
            <Text className="text-lg font-semibold mb-3" style={{ color: COLORS.text }}>
              Recording Sessions ({sessions.length})
            </Text>

            {sessions.length === 0 ? (
              <View className="items-center py-8">
                <Text className="text-4xl mb-2">📁</Text>
                <Text style={{ color: COLORS.muted }}>No sessions yet</Text>
              </View>
            ) : (
              sessions.map((session) => (
                <Pressable
                  key={session.id}
                  onPress={() => setCurrentSession(session)}
                  className="rounded-xl p-4 mb-3"
                  style={{ backgroundColor: COLORS.background }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="font-bold" style={{ color: COLORS.text }}>
                      {session.documentTitle}
                    </Text>
                    <View
                      className="px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: session.status === 'completed' ? COLORS.success + '20' : COLORS.warning + '20',
                      }}
                    >
                      <Text
                        className="text-xs"
                        style={{
                          color: session.status === 'completed' ? COLORS.success : COLORS.warning,
                        }}
                      >
                        {session.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-sm" style={{ color: COLORS.muted }}>
                    📹 {session.recordings.length} recordings
                  </Text>
                  <Text className="text-sm" style={{ color: COLORS.muted }}>
                    📅 {new Date(session.createdAt).toLocaleDateString()}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        )}

        {/* Playback Tab */}
        {activeTab === 'playback' && (
          <View className="p-4">
            <Text className="text-lg font-semibold mb-3" style={{ color: COLORS.text }}>
              Video Playback
            </Text>

            {currentSession?.recordings.length ? (
              currentSession.recordings.map((recording, index) => (
                <View
                  key={recording.id}
                  className="rounded-xl p-4 mb-3"
                  style={{ backgroundColor: COLORS.background }}
                >
                  <View className="flex-row items-center mb-2">
                    <Text className="text-2xl mr-2">🎬</Text>
                    <View className="flex-1">
                      <Text className="font-bold" style={{ color: COLORS.text }}>
                        Recording {index + 1}
                      </Text>
                      <Text className="text-xs" style={{ color: COLORS.muted }}>
                        {recording.type} • {formatTime(Math.round(recording.duration / 1000))}
                      </Text>
                    </View>
                    <Pressable
                      className="px-3 py-2 rounded-lg"
                      style={{ backgroundColor: COLORS.primary }}
                    >
                      <Text className="text-white">▶️ Play</Text>
                    </Pressable>
                  </View>
                  {recording.gpsLocation && (
                    <Text className="text-xs" style={{ color: COLORS.muted }}>
                      📍 {recording.gpsLocation.latitude.toFixed(4)}, {recording.gpsLocation.longitude.toFixed(4)}
                    </Text>
                  )}
                </View>
              ))
            ) : (
              <View className="items-center py-8">
                <Text className="text-4xl mb-2">▶️</Text>
                <Text style={{ color: COLORS.muted }}>Select a session to view recordings</Text>
              </View>
            )}
          </View>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <View className="p-4">
            <Text className="text-lg font-semibold mb-3" style={{ color: COLORS.text }}>
              Video Settings
            </Text>

            {[
              { label: 'Video Quality', value: 'HD 1080p', icon: '📺' },
              { label: 'Audio Recording', value: 'Enabled', icon: '🎤' },
              { label: 'GPS Logging', value: 'Enabled', icon: '📍' },
              { label: 'Timestamp Overlay', value: 'Enabled', icon: '⏱️' },
              { label: 'Auto-Upload', value: 'Disabled', icon: '☁️' },
              { label: 'Storage Location', value: 'Local', icon: '💾' },
            ].map((setting, index) => (
              <View
                key={index}
                className="flex-row items-center justify-between py-3 border-b"
                style={{ borderColor: '#E5E7EB' }}
              >
                <View className="flex-row items-center">
                  <Text className="text-xl mr-3">{setting.icon}</Text>
                  <Text style={{ color: COLORS.text }}>{setting.label}</Text>
                </View>
                <Text style={{ color: COLORS.muted }}>{setting.value}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
