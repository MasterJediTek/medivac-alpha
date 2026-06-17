/**
 * Macro Voice Recording Screen
 * MediVac WACHS v8.9
 * 
 * Personalized voice phrase recording for macro triggers with
 * waveform visualization, training, and speaker verification.
 */

import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  macroVoiceRecordingService,
  VoiceProfile,
  VoiceTrigger,
  VoiceSample,
  RecordingSession,
  VOICE_SOUNDS,
  VOICE_HAPTICS,
  WAVEFORM_EFFECTS,
  JEDI_VOICE_THEMES,
} from '@/lib/services/macro-voice-recording-service';

type TabType = 'triggers' | 'recording' | 'profiles' | 'history';

export default function VoiceRecordingScreen() {
  const router = useRouter();
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('triggers');
  const [triggers, setTriggers] = useState<VoiceTrigger[]>([]);
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<VoiceProfile | undefined>();
  const [currentSession, setCurrentSession] = useState<RecordingSession | null>(null);
  const [selectedTrigger, setSelectedTrigger] = useState<VoiceTrigger | null>(null);
  const [waveformAnimation, setWaveformAnimation] = useState<number[]>([]);

  useEffect(() => {
    loadData();
    const unsubscribe = macroVoiceRecordingService.subscribe(loadData);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Animate waveform when recording
    if (currentSession?.state === 'recording') {
      const interval = setInterval(() => {
        setWaveformAnimation(Array.from({ length: 50 }, () => Math.random()));
      }, 50);
      return () => clearInterval(interval);
    }
  }, [currentSession?.state]);

  const loadData = useCallback(() => {
    setTriggers(macroVoiceRecordingService.getAllTriggers());
    setProfiles(macroVoiceRecordingService.getAllProfiles());
    setActiveProfile(macroVoiceRecordingService.getActiveProfile());
    setCurrentSession(macroVoiceRecordingService.getCurrentSession());
  }, []);

  const haptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const startRecording = (trigger: VoiceTrigger) => {
    haptic();
    setSelectedTrigger(trigger);
    macroVoiceRecordingService.startRecordingSession(trigger.profileId, trigger.phrase);
    setActiveTab('recording');
  };

  const stopRecording = () => {
    haptic();
    const sample = macroVoiceRecordingService.stopRecording();
    if (sample && selectedTrigger) {
      macroVoiceRecordingService.addSampleToTrigger(selectedTrigger.id, sample);
    }
  };

  const cancelRecording = () => {
    haptic();
    macroVoiceRecordingService.cancelRecording();
    setSelectedTrigger(null);
  };

  const toggleTrigger = (id: string) => {
    haptic();
    macroVoiceRecordingService.toggleTrigger(id);
  };

  const setProfile = (id: string) => {
    haptic();
    macroVoiceRecordingService.setActiveProfile(id);
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'recording': return '#E74C3C';
      case 'processing': return '#F39C12';
      case 'complete': return '#2ECC71';
      case 'error': return '#E74C3C';
      default: return colors.primary;
    }
  };

  const renderTriggers = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Voice Triggers</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
          Train voice phrases to activate macros
        </Text>
      </View>

      {triggers.map((trigger) => (
        <TouchableOpacity
          key={trigger.id}
          style={[styles.triggerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => startRecording(trigger)}
        >
          <View style={styles.triggerHeader}>
            <View style={[styles.triggerIcon, { backgroundColor: trigger.isEnabled ? '#2ECC71' : colors.muted }]}>
              <Text style={styles.triggerIconText}>🎤</Text>
            </View>
            <View style={styles.triggerInfo}>
              <Text style={[styles.triggerPhrase, { color: colors.foreground }]}>"{trigger.phrase}"</Text>
              <Text style={[styles.triggerMacro, { color: colors.muted }]}>→ {trigger.macroId}</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggleButton, { backgroundColor: trigger.isEnabled ? '#2ECC71' : colors.muted }]}
              onPress={() => toggleTrigger(trigger.id)}
            >
              <Text style={styles.toggleText}>{trigger.isEnabled ? 'ON' : 'OFF'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.triggerStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{trigger.samples.length}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Samples</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{(trigger.confidence * 100).toFixed(0)}%</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Confidence</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{trigger.activationCount}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Activations</Text>
            </View>
          </View>

          <View style={styles.confidenceBar}>
            <View 
              style={[
                styles.confidenceFill, 
                { 
                  width: `${trigger.confidence * 100}%`,
                  backgroundColor: trigger.confidence > 0.7 ? '#2ECC71' : trigger.confidence > 0.4 ? '#F39C12' : '#E74C3C'
                }
              ]} 
            />
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderRecording = () => (
    <View style={styles.recordingContainer}>
      <View style={styles.recordingHeader}>
        <Text style={[styles.recordingTitle, { color: colors.foreground }]}>
          {currentSession?.state === 'recording' ? 'Recording...' : 
           currentSession?.state === 'processing' ? 'Processing...' :
           currentSession?.state === 'complete' ? 'Complete!' : 'Ready to Record'}
        </Text>
        {selectedTrigger && (
          <Text style={[styles.recordingPhrase, { color: colors.primary }]}>
            "{selectedTrigger.phrase}"
          </Text>
        )}
      </View>

      {/* Waveform Visualization */}
      <View style={[styles.waveformContainer, { borderColor: getStateColor(currentSession?.state || 'idle') }]}>
        <View style={styles.waveform}>
          {waveformAnimation.map((amplitude, index) => (
            <View
              key={index}
              style={[
                styles.waveformBar,
                {
                  height: `${(amplitude * 80) + 10}%`,
                  backgroundColor: getStateColor(currentSession?.state || 'idle'),
                  opacity: currentSession?.state === 'recording' ? 0.8 : 0.3,
                }
              ]}
            />
          ))}
        </View>
        
        {/* Center microphone icon */}
        <View style={[styles.microphoneCircle, { backgroundColor: getStateColor(currentSession?.state || 'idle') }]}>
          <Text style={styles.microphoneIcon}>
            {currentSession?.state === 'recording' ? '🔴' : 
             currentSession?.state === 'processing' ? '⏳' :
             currentSession?.state === 'complete' ? '✅' : '🎤'}
          </Text>
        </View>
      </View>

      {/* Recording Controls */}
      <View style={styles.recordingControls}>
        {currentSession?.state === 'recording' ? (
          <TouchableOpacity
            style={[styles.stopButton, { backgroundColor: '#E74C3C' }]}
            onPress={stopRecording}
          >
            <Text style={styles.controlButtonText}>⏹️ Stop Recording</Text>
          </TouchableOpacity>
        ) : currentSession?.state === 'processing' ? (
          <View style={[styles.processingIndicator, { backgroundColor: '#F39C12' }]}>
            <Text style={styles.controlButtonText}>⏳ Processing...</Text>
          </View>
        ) : currentSession?.state === 'complete' ? (
          <View style={styles.completeActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#2ECC71' }]}
              onPress={() => {
                setSelectedTrigger(null);
                setActiveTab('triggers');
              }}
            >
              <Text style={styles.controlButtonText}>✅ Done</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => selectedTrigger && startRecording(selectedTrigger)}
            >
              <Text style={styles.controlButtonText}>🔄 Record Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.startActions}>
            <TouchableOpacity
              style={[styles.recordButton, { backgroundColor: '#E74C3C' }]}
              onPress={() => selectedTrigger && startRecording(selectedTrigger)}
            >
              <Text style={styles.controlButtonText}>🎤 Start Recording</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.muted }]}
              onPress={cancelRecording}
            >
              <Text style={styles.controlButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Recording Tips */}
      <View style={[styles.tipsContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.tipsTitle, { color: colors.foreground }]}>💡 Recording Tips</Text>
        <Text style={[styles.tipText, { color: colors.muted }]}>• Speak clearly and naturally</Text>
        <Text style={[styles.tipText, { color: colors.muted }]}>• Record in a quiet environment</Text>
        <Text style={[styles.tipText, { color: colors.muted }]}>• Record 3-5 samples for best accuracy</Text>
        <Text style={[styles.tipText, { color: colors.muted }]}>• Vary your tone slightly between samples</Text>
      </View>
    </View>
  );

  const renderProfiles = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Voice Profiles</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
          Manage voice recognition profiles
        </Text>
      </View>

      {profiles.map((profile) => (
        <TouchableOpacity
          key={profile.id}
          style={[
            styles.profileCard, 
            { 
              backgroundColor: colors.surface, 
              borderColor: profile.isActive ? colors.primary : colors.border,
              borderWidth: profile.isActive ? 2 : 1,
            }
          ]}
          onPress={() => setProfile(profile.id)}
        >
          <View style={styles.profileHeader}>
            <View style={[styles.profileAvatar, { backgroundColor: profile.isActive ? colors.primary : colors.muted }]}>
              <Text style={styles.profileAvatarText}>👤</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.foreground }]}>{profile.name}</Text>
              <Text style={[styles.profileStatus, { color: profile.isVerified ? '#2ECC71' : '#F39C12' }]}>
                {profile.isVerified ? '✓ Verified' : '⏳ Training Required'}
              </Text>
            </View>
            {profile.isActive && (
              <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            )}
          </View>

          <View style={styles.profileStats}>
            <View style={styles.profileStatItem}>
              <Text style={[styles.profileStatValue, { color: colors.foreground }]}>{profile.samples.length}</Text>
              <Text style={[styles.profileStatLabel, { color: colors.muted }]}>Samples</Text>
            </View>
            <View style={styles.profileStatItem}>
              <Text style={[styles.profileStatValue, { color: colors.foreground }]}>{profile.trainingProgress}%</Text>
              <Text style={[styles.profileStatLabel, { color: colors.muted }]}>Training</Text>
            </View>
            <View style={styles.profileStatItem}>
              <Text style={[styles.profileStatValue, { color: colors.foreground }]}>{(profile.voicePrint.confidence * 100).toFixed(0)}%</Text>
              <Text style={[styles.profileStatLabel, { color: colors.muted }]}>Accuracy</Text>
            </View>
          </View>

          <View style={styles.trainingBar}>
            <View 
              style={[
                styles.trainingFill, 
                { 
                  width: `${profile.trainingProgress}%`,
                  backgroundColor: profile.trainingProgress === 100 ? '#2ECC71' : colors.primary
                }
              ]} 
            />
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderHistory = () => {
    const history = macroVoiceRecordingService.getRecognitionHistory();
    const analytics = macroVoiceRecordingService.getAnalytics();

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recognition History</Text>
        </View>

        {/* Analytics Summary */}
        <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
          <View style={styles.analyticsRow}>
            <View style={styles.analyticsItem}>
              <Text style={[styles.analyticsValue, { color: colors.primary }]}>{analytics.totalRecordings}</Text>
              <Text style={[styles.analyticsLabel, { color: colors.muted }]}>Recordings</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={[styles.analyticsValue, { color: '#2ECC71' }]}>{analytics.successfulActivations}</Text>
              <Text style={[styles.analyticsLabel, { color: colors.muted }]}>Successful</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={[styles.analyticsValue, { color: '#E74C3C' }]}>{analytics.failedActivations}</Text>
              <Text style={[styles.analyticsLabel, { color: colors.muted }]}>Failed</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={[styles.analyticsValue, { color: '#F39C12' }]}>{(analytics.avgConfidence * 100).toFixed(0)}%</Text>
              <Text style={[styles.analyticsLabel, { color: colors.muted }]}>Avg Conf.</Text>
            </View>
          </View>
        </View>

        {/* History List */}
        {history.slice(0, 20).map((result, index) => (
          <View 
            key={result.timestamp + index}
            style={[styles.historyItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.historyIcon, { backgroundColor: result.isVerified ? '#2ECC71' : '#E74C3C' }]}>
              <Text style={styles.historyIconText}>{result.isVerified ? '✓' : '✗'}</Text>
            </View>
            <View style={styles.historyInfo}>
              <Text style={[styles.historyPhrase, { color: colors.foreground }]}>"{result.phrase}"</Text>
              <Text style={[styles.historyMeta, { color: colors.muted }]}>
                {(result.confidence * 100).toFixed(0)}% confidence • {result.processingTime.toFixed(0)}ms
              </Text>
            </View>
          </View>
        ))}

        {history.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyIcon]}>🎤</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>No recognition history yet</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Voice Recording</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.surface }]}>
        {(['triggers', 'recording', 'profiles', 'history'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => { haptic(); setActiveTab(tab); }}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.muted }]}>
              {tab === 'triggers' ? '🎯 Triggers' :
               tab === 'recording' ? '🎤 Record' :
               tab === 'profiles' ? '👤 Profiles' : '📊 History'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'triggers' && renderTriggers()}
      {activeTab === 'recording' && renderRecording()}
      {activeTab === 'profiles' && renderProfiles()}
      {activeTab === 'history' && renderHistory()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { padding: 4 },
  backText: { fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  headerRight: { width: 60 },
  tabs: { flexDirection: 'row', paddingHorizontal: 8 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 12, fontWeight: '500' },
  tabContent: { flex: 1, padding: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  sectionSubtitle: { fontSize: 14 },
  triggerCard: { borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1 },
  triggerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  triggerIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  triggerIconText: { fontSize: 20 },
  triggerInfo: { flex: 1, marginLeft: 12 },
  triggerPhrase: { fontSize: 16, fontWeight: '600' },
  triggerMacro: { fontSize: 12, marginTop: 2 },
  toggleButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  toggleText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  triggerStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 10, marginTop: 2 },
  confidenceBar: { height: 4, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 2, overflow: 'hidden' },
  confidenceFill: { height: '100%', borderRadius: 2 },
  recordingContainer: { flex: 1, padding: 16 },
  recordingHeader: { alignItems: 'center', marginBottom: 24 },
  recordingTitle: { fontSize: 24, fontWeight: '700' },
  recordingPhrase: { fontSize: 18, marginTop: 8 },
  waveformContainer: { height: 200, borderRadius: 16, borderWidth: 2, overflow: 'hidden', marginBottom: 24, position: 'relative' },
  waveform: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 8 },
  waveformBar: { width: 4, borderRadius: 2 },
  microphoneCircle: { position: 'absolute', top: '50%', left: '50%', width: 60, height: 60, borderRadius: 30, marginTop: -30, marginLeft: -30, alignItems: 'center', justifyContent: 'center' },
  microphoneIcon: { fontSize: 28 },
  recordingControls: { alignItems: 'center', marginBottom: 24 },
  stopButton: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 30 },
  recordButton: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 30 },
  processingIndicator: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 30 },
  controlButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  completeActions: { flexDirection: 'row', gap: 12 },
  startActions: { alignItems: 'center', gap: 12 },
  actionButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  cancelButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  tipsContainer: { borderRadius: 12, padding: 16 },
  tipsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  tipText: { fontSize: 14, marginBottom: 4 },
  profileCard: { borderRadius: 12, padding: 16, marginBottom: 12 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  profileAvatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { fontSize: 24 },
  profileInfo: { flex: 1, marginLeft: 12 },
  profileName: { fontSize: 18, fontWeight: '600' },
  profileStatus: { fontSize: 12, marginTop: 2 },
  activeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  activeBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  profileStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  profileStatItem: { alignItems: 'center' },
  profileStatValue: { fontSize: 20, fontWeight: '700' },
  profileStatLabel: { fontSize: 10, marginTop: 2 },
  trainingBar: { height: 6, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 3, overflow: 'hidden' },
  trainingFill: { height: '100%', borderRadius: 3 },
  analyticsCard: { borderRadius: 12, padding: 16, marginBottom: 16 },
  analyticsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  analyticsItem: { alignItems: 'center' },
  analyticsValue: { fontSize: 24, fontWeight: '700' },
  analyticsLabel: { fontSize: 10, marginTop: 4 },
  historyItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1 },
  historyIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  historyIconText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  historyInfo: { flex: 1, marginLeft: 12 },
  historyPhrase: { fontSize: 14, fontWeight: '500' },
  historyMeta: { fontSize: 12, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16 },
});
