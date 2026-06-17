/**
 * Voice Commands Screen
 * MediVac WACHS v8.7
 * Maximum visual effects with animated waveform and haptic feedback
 */

import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, TextInput, Animated } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  voiceCommandsService,
  VoiceCommand,
  VoiceState,
  VOICE_SOUND_EFFECTS,
  VOICE_HAPTIC_PATTERNS,
} from '@/lib/services/voice-commands-service';

type TabType = 'voice' | 'history' | 'training' | 'settings';

const STATE_COLORS: Record<VoiceState, { bg: string; text: string; glow: string }> = {
  idle: { bg: '#1ABC9C', text: '#FFFFFF', glow: '#1ABC9C' },
  listening: { bg: '#3498DB', text: '#FFFFFF', glow: '#3498DB' },
  processing: { bg: '#F39C12', text: '#FFFFFF', glow: '#F39C12' },
  speaking: { bg: '#9B59B6', text: '#FFFFFF', glow: '#9B59B6' },
  error: { bg: '#E74C3C', text: '#FFFFFF', glow: '#E74C3C' },
};

const STATE_ICONS: Record<VoiceState, string> = {
  idle: '🎤',
  listening: '👂',
  processing: '⚙️',
  speaking: '🔊',
  error: '❌',
};

export default function VoiceCommandsScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('voice');
  const [state, setState] = useState<VoiceState>('idle');
  const [history, setHistory] = useState<VoiceCommand[]>([]);
  const [testInput, setTestInput] = useState('');
  const [waveform, setWaveform] = useState<number[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
    const unsubscribe = voiceCommandsService.subscribe(() => loadData());
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (state === 'listening') {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])
      ).start();
      // Generate mock waveform
      const interval = setInterval(() => {
        setWaveform(voiceCommandsService.generateMockWaveform());
      }, 100);
      return () => clearInterval(interval);
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
      setWaveform([]);
    }
  }, [state]);

  const loadData = () => {
    setState(voiceCommandsService.getState());
    setHistory(voiceCommandsService.getCommandHistory());
  };

  const toggleListening = () => {
    if (state === 'listening') {
      voiceCommandsService.stopListening();
    } else {
      voiceCommandsService.startListening();
    }
    loadData();
  };

  const processTestCommand = () => {
    if (testInput.trim()) {
      voiceCommandsService.processCommand(testInput.trim());
      setTestInput('');
      loadData();
    }
  };

  const stateColor = STATE_COLORS[state];

  const renderVoiceTab = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      {/* Main Voice Button */}
      <View style={{ alignItems: 'center', marginBottom: 32 }}>
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
            shadowColor: stateColor.glow,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: glowAnim,
            shadowRadius: 30,
          }}
        >
          <Pressable
            onPress={toggleListening}
            style={{
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: stateColor.bg,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 4,
              borderColor: stateColor.glow,
            }}
          >
            <Text style={{ fontSize: 64 }}>{STATE_ICONS[state]}</Text>
          </Pressable>
        </Animated.View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: stateColor.bg, marginTop: 16, textTransform: 'uppercase' }}>
          {state}
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
          {state === 'idle' ? 'Tap to start listening' : state === 'listening' ? 'Listening... Speak now' : 'Processing your command'}
        </Text>
      </View>

      {/* Waveform Visualization */}
      {state === 'listening' && waveform.length > 0 && (
        <View style={{ height: 80, backgroundColor: colors.surface, borderRadius: 12, marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, overflow: 'hidden' }}>
          {waveform.map((amplitude, idx) => (
            <View
              key={idx}
              style={{
                width: 4,
                height: Math.max(4, amplitude * 60),
                backgroundColor: stateColor.bg,
                marginHorizontal: 1,
                borderRadius: 2,
                opacity: 0.3 + amplitude * 0.7,
              }}
            />
          ))}
        </View>
      )}

      {/* Test Input */}
      <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 8 }}>Test Voice Command</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={testInput}
            onChangeText={setTestInput}
            placeholder="Type a command to test..."
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              backgroundColor: colors.background,
              borderRadius: 8,
              padding: 12,
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            onSubmitEditing={processTestCommand}
            returnKeyType="done"
          />
          <Pressable
            onPress={processTestCommand}
            style={{ backgroundColor: '#3498DB', paddingHorizontal: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Send</Text>
          </Pressable>
        </View>
      </View>

      {/* Quick Commands */}
      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>Quick Commands</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {[
          { text: 'Create event', icon: '📅', color: '#3498DB' },
          { text: 'Mark medication taken', icon: '💊', color: '#E74C3C' },
          { text: "What's my schedule", icon: '📋', color: '#27AE60' },
          { text: 'Set timer 5 minutes', icon: '⏱️', color: '#F39C12' },
          { text: 'Help', icon: '🆘', color: '#9B59B6' },
        ].map((cmd, idx) => (
          <Pressable
            key={idx}
            onPress={() => {
              voiceCommandsService.processCommand(cmd.text);
              loadData();
            }}
            style={{
              backgroundColor: cmd.color + '20',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              borderWidth: 1,
              borderColor: cmd.color,
            }}
          >
            <Text style={{ fontSize: 16 }}>{cmd.icon}</Text>
            <Text style={{ color: cmd.color, fontWeight: '500', fontSize: 12 }}>{cmd.text}</Text>
          </Pressable>
        ))}
      </View>

      {/* Sound Effects Info */}
      <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginTop: 24 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>🔊 Sound Effects</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(VOICE_SOUND_EFFECTS).slice(0, 6).map(([key, value]) => (
            <View key={key} style={{ backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
              <Text style={{ fontSize: 10, color: colors.muted }}>{value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Haptic Patterns Info */}
      <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginTop: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>📳 Haptic Patterns</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(VOICE_HAPTIC_PATTERNS).map(([key, pattern]) => (
            <View key={key} style={{ backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 10, color: colors.muted }}>{key}:</Text>
              <Text style={{ fontSize: 10, color: colors.foreground, fontFamily: 'monospace' }}>[{pattern.join(',')}]</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderHistoryTab = () => (
    <FlatList
      data={history}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderLeftWidth: 4,
          borderLeftColor: item.result?.success ? '#27AE60' : '#E74C3C',
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>{item.transcript}</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Type: {item.type}</Text>
            </View>
            <View style={{ backgroundColor: item.result?.success ? '#27AE6020' : '#E74C3C20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
              <Text style={{ fontSize: 10, color: item.result?.success ? '#27AE60' : '#E74C3C', fontWeight: '600' }}>
                {item.result?.success ? 'SUCCESS' : 'FAILED'}
              </Text>
            </View>
          </View>
          {item.result && (
            <View style={{ backgroundColor: colors.background, borderRadius: 8, padding: 12 }}>
              <Text style={{ fontSize: 12, color: colors.foreground }}>{item.result.message}</Text>
              {item.result.followUp && (
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4, fontStyle: 'italic' }}>{item.result.followUp}</Text>
              )}
            </View>
          )}
          <View style={{ flexDirection: 'row', marginTop: 8, gap: 12 }}>
            <Text style={{ fontSize: 10, color: colors.muted }}>Confidence: {(item.confidence * 100).toFixed(0)}%</Text>
            <Text style={{ fontSize: 10, color: colors.muted }}>Duration: {item.duration}ms</Text>
            <Text style={{ fontSize: 10, color: colors.muted }}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🎤</Text>
          <Text style={{ fontSize: 16, color: colors.muted }}>No command history yet</Text>
        </View>
      }
    />
  );

  const renderTrainingTab = () => {
    const phrases = voiceCommandsService.getTrainingPhrases();
    return (
      <FlatList
        data={phrases}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>{item.phrase}</Text>
              {item.trained ? (
                <View style={{ backgroundColor: '#27AE6020', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                  <Text style={{ fontSize: 10, color: '#27AE60', fontWeight: '600' }}>TRAINED</Text>
                </View>
              ) : (
                <Pressable
                  onPress={() => {
                    voiceCommandsService.trainPhrase(item.id);
                    loadData();
                  }}
                  style={{ backgroundColor: '#3498DB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 }}
                >
                  <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: '600' }}>TRAIN</Text>
                </Pressable>
              )}
            </View>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>Command: {item.commandType}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {item.variations.map((v, idx) => (
                <View key={idx} style={{ backgroundColor: colors.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 10, color: colors.muted }}>{v}</Text>
                </View>
              ))}
            </View>
            {item.trained && (
              <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1, height: 4, backgroundColor: colors.background, borderRadius: 2, overflow: 'hidden' }}>
                  <View style={{ width: `${item.accuracy}%`, height: '100%', backgroundColor: '#27AE60' }} />
                </View>
                <Text style={{ fontSize: 10, color: '#27AE60' }}>{item.accuracy.toFixed(0)}%</Text>
              </View>
            )}
          </View>
        )}
      />
    );
  };

  const renderSettingsTab = () => {
    const settings = voiceCommandsService.getSettings();
    const analytics = voiceCommandsService.getAnalytics();

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>Voice Settings</Text>
          {[
            { label: 'Language', value: settings.language },
            { label: 'Wake Word', value: settings.wakeWord },
            { label: 'Feedback Voice', value: settings.feedbackVoice },
            { label: 'Speed', value: `${settings.feedbackSpeed}x` },
          ].map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: idx < 3 ? 1 : 0, borderBottomColor: colors.border }}>
              <Text style={{ color: colors.muted }}>{item.label}</Text>
              <Text style={{ color: colors.foreground, fontWeight: '500' }}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>Analytics</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {[
              { label: 'Total Commands', value: analytics.totalCommands, color: '#3498DB' },
              { label: 'Successful', value: analytics.successfulCommands, color: '#27AE60' },
              { label: 'Failed', value: analytics.failedCommands, color: '#E74C3C' },
              { label: 'Avg Confidence', value: `${(analytics.avgConfidence * 100).toFixed(0)}%`, color: '#F39C12' },
              { label: 'SOS Triggered', value: analytics.sosTriggered, color: '#9B59B6' },
              { label: 'Meds Confirmed', value: analytics.medicationsConfirmed, color: '#E74C3C' },
            ].map((stat, idx) => (
              <View key={idx} style={{ width: '45%', backgroundColor: stat.color + '20', borderRadius: 8, padding: 12 }}>
                <Text style={{ fontSize: 24, fontWeight: '700', color: stat.color }}>{stat.value}</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <Pressable
          onPress={() => {
            voiceCommandsService.clearHistory();
            loadData();
          }}
          style={{ backgroundColor: '#E74C3C', padding: 16, borderRadius: 12, alignItems: 'center' }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Clear History</Text>
        </Pressable>
      </ScrollView>
    );
  };

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: stateColor.bg, paddingHorizontal: 16, paddingVertical: 16 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>Voice Commands</Text>
        <Text style={{ color: '#FFFFFF', opacity: 0.9, fontSize: 14 }}>
          {history.length} commands • {state.toUpperCase()}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: colors.surface, padding: 4, margin: 16, borderRadius: 12 }}>
        {(['voice', 'history', 'training', 'settings'] as TabType[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: activeTab === tab ? stateColor.bg : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: activeTab === tab ? '#FFFFFF' : colors.muted, fontWeight: '600', fontSize: 11 }}>
              {tab === 'voice' ? '🎤 Voice' : tab === 'history' ? '📜 History' : tab === 'training' ? '🎯 Training' : '⚙️ Settings'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'voice' && renderVoiceTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'training' && renderTrainingTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </View>
    </ScreenContainer>
  );
}
