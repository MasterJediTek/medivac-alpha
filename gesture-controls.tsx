/**
 * Gesture Controls Screen
 * MediVac WACHS v8.8
 * Hand gesture recognition for hands-free navigation
 */

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  gestureControlsService,
  GestureMapping,
  GestureDetection,
  GestureTrainingData,
  GESTURE_ICONS,
  GESTURE_EFFECTS,
} from '@/lib/services/gesture-controls-service';

type TabType = 'gestures' | 'detection' | 'training' | 'settings';

export default function GestureControlsScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('gestures');
  const [mappings, setMappings] = useState<GestureMapping[]>([]);
  const [detections, setDetections] = useState<GestureDetection[]>([]);
  const [trainingData, setTrainingData] = useState<GestureTrainingData[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [settings, setSettings] = useState(gestureControlsService.getSettings());

  useEffect(() => {
    loadData();
    const unsubscribe = gestureControlsService.subscribe(() => loadData());
    return unsubscribe;
  }, []);

  const loadData = () => {
    setMappings(gestureControlsService.getAllMappings());
    setDetections(gestureControlsService.getDetectionHistory());
    setTrainingData(gestureControlsService.getTrainingData());
    setSettings(gestureControlsService.getSettings());
    setIsDetecting(gestureControlsService.getState() === 'detecting');
  };

  const toggleDetection = () => {
    if (isDetecting) {
      gestureControlsService.stopDetection();
    } else {
      gestureControlsService.startDetection();
    }
  };

  const toggleMapping = (id: string) => {
    gestureControlsService.toggleMapping(id);
  };

  const simulateGesture = (gesture: string) => {
    if (isDetecting) {
      const detection = gestureControlsService.detectGesture(gesture as any, 0.95);
      if (detection) {
        gestureControlsService.executeGesture(detection.id);
      }
    }
  };

  const updateSetting = (key: string, value: any) => {
    gestureControlsService.updateSettings({ [key]: value });
  };

  const renderGesturesTab = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      {/* Detection toggle */}
      <Pressable
        onPress={toggleDetection}
        style={{
          backgroundColor: isDetecting ? '#2ECC71' : colors.surface,
          borderRadius: 16,
          padding: 20,
          alignItems: 'center',
          marginBottom: 24,
          borderWidth: 2,
          borderColor: isDetecting ? '#27AE60' : colors.border,
        }}
      >
        <Text style={{ fontSize: 48, marginBottom: 8 }}>{isDetecting ? '👁️' : '👁️‍🗨️'}</Text>
        <Text style={{ fontSize: 18, fontWeight: '700', color: isDetecting ? '#FFFFFF' : colors.foreground }}>
          {isDetecting ? 'Detection Active' : 'Start Detection'}
        </Text>
        <Text style={{ fontSize: 12, color: isDetecting ? '#FFFFFF' : colors.muted, marginTop: 4 }}>
          {isDetecting ? 'Tap to stop gesture detection' : 'Tap to enable gesture detection'}
        </Text>
      </Pressable>

      {/* Gesture mappings */}
      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
        Gesture Mappings ({mappings.length})
      </Text>
      {mappings.map((mapping) => (
        <Pressable
          key={mapping.id}
          onPress={() => isDetecting && simulateGesture(mapping.gesture)}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            opacity: mapping.isEnabled ? 1 : 0.5,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: mapping.feedback.visual?.color + '20' || colors.background,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 28 }}>{GESTURE_ICONS[mapping.gesture]}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                {mapping.gesture.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted }}>
                {mapping.action.type} → {mapping.action.target || 'default'}
              </Text>
              <View style={{ flexDirection: 'row', marginTop: 6, gap: 8 }}>
                <Text style={{ fontSize: 10, color: colors.muted }}>Sensitivity: {mapping.sensitivity}/10</Text>
                <Text style={{ fontSize: 10, color: colors.muted }}>Used: {mapping.triggerCount}x</Text>
              </View>
            </View>

            <Pressable onPress={() => toggleMapping(mapping.id)}>
              <View style={{
                width: 40,
                height: 24,
                borderRadius: 12,
                backgroundColor: mapping.isEnabled ? '#2ECC71' : colors.border,
                justifyContent: 'center',
                paddingHorizontal: 2,
              }}>
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: '#FFFFFF',
                  alignSelf: mapping.isEnabled ? 'flex-end' : 'flex-start',
                }} />
              </View>
            </Pressable>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );

  const renderDetectionTab = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      {/* Live detection area */}
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 24,
        minHeight: 200,
        borderWidth: 2,
        borderColor: isDetecting ? '#2ECC71' : colors.border,
        borderStyle: 'dashed',
      }}>
        {isDetecting ? (
          <>
            <Text style={{ fontSize: 64, marginBottom: 12 }}>🎯</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>Detecting Gestures...</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>Make a gesture in front of the camera</Text>

            {/* Simulated gesture buttons for testing */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' }}>
              {['wave', 'thumbs-up', 'fist', 'open-palm', 'peace-sign'].map((g) => (
                <Pressable
                  key={g}
                  onPress={() => simulateGesture(g)}
                  style={{
                    backgroundColor: colors.background,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{GESTURE_ICONS[g as keyof typeof GESTURE_ICONS]}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 64, marginBottom: 12 }}>📷</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>Detection Inactive</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>Enable detection to start</Text>
          </>
        )}
      </View>

      {/* Recent detections */}
      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
        Recent Detections ({detections.length})
      </Text>
      {detections.slice(0, 10).map((detection) => (
        <View
          key={detection.id}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 12,
            marginBottom: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 28 }}>{GESTURE_ICONS[detection.gesture]}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>
              {detection.gesture.replace(/-/g, ' ')}
            </Text>
            <Text style={{ fontSize: 11, color: colors.muted }}>
              {new Date(detection.timestamp).toLocaleTimeString()} • {Math.round(detection.confidence * 100)}% confidence
            </Text>
          </View>
          <View style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            backgroundColor: detection.confidence > 0.9 ? '#2ECC71' : detection.confidence > 0.7 ? '#F39C12' : '#E74C3C',
          }}>
            <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: '600' }}>{detection.handedness?.toUpperCase()}</Text>
          </View>
        </View>
      ))}

      {detections.length === 0 && (
        <View style={{ alignItems: 'center', padding: 32 }}>
          <Text style={{ fontSize: 14, color: colors.muted }}>No gestures detected yet</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderTrainingTab = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 24,
      }}>
        <Text style={{ fontSize: 48, marginBottom: 8 }}>🎓</Text>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>Gesture Training</Text>
        <Text style={{ fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 4 }}>
          Train custom gestures by recording multiple samples
        </Text>
      </View>

      {/* Gesture guide */}
      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
        Available Gestures
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {Object.entries(GESTURE_ICONS).slice(0, 20).map(([gesture, icon]) => (
          <View
            key={gesture}
            style={{
              backgroundColor: colors.surface,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              alignItems: 'center',
              minWidth: 70,
            }}
          >
            <Text style={{ fontSize: 24 }}>{icon}</Text>
            <Text style={{ fontSize: 9, color: colors.muted, marginTop: 4 }}>{gesture.split('-')[0]}</Text>
          </View>
        ))}
      </View>

      {/* Training data */}
      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
        Training Sessions ({trainingData.length})
      </Text>
      {trainingData.map((training) => (
        <View
          key={training.id}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 32 }}>{GESTURE_ICONS[training.gesture]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                {training.gesture.replace(/-/g, ' ')}
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted }}>
                {training.samples.length} samples • {training.accuracy}% accuracy
              </Text>
            </View>
            <View style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
              backgroundColor: training.accuracy >= 80 ? '#2ECC71' : training.accuracy >= 50 ? '#F39C12' : '#E74C3C',
            }}>
              <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: '600' }}>{training.accuracy}%</Text>
            </View>
          </View>
        </View>
      ))}

      {trainingData.length === 0 && (
        <View style={{ alignItems: 'center', padding: 32 }}>
          <Text style={{ fontSize: 14, color: colors.muted }}>No training sessions yet</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderSettingsTab = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      {/* Settings sections */}
      {[
        { title: 'Detection', items: [
          { key: 'enabled', label: 'Enable Gestures', type: 'toggle', value: settings.enabled },
          { key: 'sensitivity', label: 'Sensitivity', type: 'slider', value: settings.sensitivity, min: 1, max: 10 },
          { key: 'minConfidence', label: 'Min Confidence', type: 'slider', value: settings.minConfidence * 100, min: 50, max: 100 },
        ]},
        { title: 'Feedback', items: [
          { key: 'hapticFeedback', label: 'Haptic Feedback', type: 'toggle', value: settings.hapticFeedback },
          { key: 'soundFeedback', label: 'Sound Feedback', type: 'toggle', value: settings.soundFeedback },
          { key: 'visualFeedback', label: 'Visual Feedback', type: 'toggle', value: settings.visualFeedback },
          { key: 'voiceFeedback', label: 'Voice Feedback', type: 'toggle', value: settings.voiceFeedback },
        ]},
        { title: 'Display', items: [
          { key: 'showGestureGuide', label: 'Show Gesture Guide', type: 'toggle', value: settings.showGestureGuide },
          { key: 'showDetectionOverlay', label: 'Show Detection Overlay', type: 'toggle', value: settings.showDetectionOverlay },
          { key: 'debugMode', label: 'Debug Mode', type: 'toggle', value: settings.debugMode },
        ]},
      ].map((section) => (
        <View key={section.title} style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.muted, marginBottom: 12 }}>{section.title}</Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, overflow: 'hidden' }}>
            {section.items.map((item, idx) => (
              <View
                key={item.key}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 16,
                  borderBottomWidth: idx < section.items.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 14, color: colors.foreground }}>{item.label}</Text>
                {item.type === 'toggle' && (
                  <Pressable onPress={() => updateSetting(item.key, !item.value)}>
                    <View style={{
                      width: 50,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: item.value ? '#2ECC71' : colors.border,
                      justifyContent: 'center',
                      paddingHorizontal: 2,
                    }}>
                      <View style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: '#FFFFFF',
                        alignSelf: item.value ? 'flex-end' : 'flex-start',
                      }} />
                    </View>
                  </Pressable>
                )}
                {item.type === 'slider' && (
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>{item.value}</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Analytics */}
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.muted, marginBottom: 12 }}>Analytics</Text>
      <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
        {(() => {
          const analytics = gestureControlsService.getAnalytics();
          return (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ color: colors.muted }}>Total Detections</Text>
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>{analytics.totalDetections}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ color: colors.muted }}>Success Rate</Text>
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>
                  {analytics.totalDetections > 0 ? Math.round((analytics.successfulDetections / analytics.totalDetections) * 100) : 0}%
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.muted }}>Avg Confidence</Text>
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>{Math.round(analytics.avgConfidence * 100)}%</Text>
              </View>
            </>
          );
        })()}
      </View>
    </ScrollView>
  );

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: '#E74C3C', paddingHorizontal: 16, paddingVertical: 16 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>Gesture Controls</Text>
        <Text style={{ color: '#FFFFFF', opacity: 0.9, fontSize: 14 }}>
          {mappings.filter(m => m.isEnabled).length} gestures active • {isDetecting ? 'Detecting' : 'Idle'}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: colors.surface, padding: 4, margin: 16, borderRadius: 12 }}>
        {(['gestures', 'detection', 'training', 'settings'] as TabType[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: activeTab === tab ? '#E74C3C' : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: activeTab === tab ? '#FFFFFF' : colors.muted, fontWeight: '600', fontSize: 10 }}>
              {tab === 'gestures' ? '👋 Gestures' : tab === 'detection' ? '🎯 Detect' : tab === 'training' ? '🎓 Train' : '⚙️ Settings'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'gestures' && renderGesturesTab()}
        {activeTab === 'detection' && renderDetectionTab()}
        {activeTab === 'training' && renderTrainingTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </View>
    </ScreenContainer>
  );
}
