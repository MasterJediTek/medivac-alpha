/**
 * Audio Settings Panel Component
 * Controls for accessibility audio announcements
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Switch } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { accessibilityAudioService, AudioSettings } from '@/lib/services/accessibility-audio.service';

interface AudioSettingsPanelProps {
  visible: boolean;
  onClose: () => void;
}

export function AudioSettingsPanel({ visible, onClose }: AudioSettingsPanelProps) {
  const colors = useColors();
  const [settings, setSettings] = useState<AudioSettings>(accessibilityAudioService.getSettings());

  useEffect(() => {
    const unsubscribe = accessibilityAudioService.subscribeToSettings(setSettings);
    return unsubscribe;
  }, []);

  const handleToggle = (key: keyof AudioSettings, value: boolean) => {
    accessibilityAudioService.updateSettings({ [key]: value });
  };

  const handleSlider = (key: keyof AudioSettings, value: number) => {
    accessibilityAudioService.updateSettings({ [key]: value });
  };

  const testAnnouncement = () => {
    accessibilityAudioService.speak('This is a test announcement. Accessibility audio is working correctly.');
  };

  if (!visible) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
      <View style={[styles.panel, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            🔊 Audio Settings
          </Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: colors.muted }]}>✕</Text>
          </Pressable>
        </View>

        {/* Settings List */}
        <View style={styles.content}>
          {/* Enable Audio */}
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>
                Enable Audio Announcements
              </Text>
              <Text style={[styles.settingDesc, { color: colors.muted }]}>
                Voice announcements for accessibility features
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(v) => handleToggle('enabled', v)}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          {/* Announce on Approach */}
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>
                Announce on Approach
              </Text>
              <Text style={[styles.settingDesc, { color: colors.muted }]}>
                Automatically announce nearby features
              </Text>
            </View>
            <Switch
              value={settings.announceOnApproach}
              onValueChange={(v) => handleToggle('announceOnApproach', v)}
              trackColor={{ false: colors.border, true: colors.primary }}
              disabled={!settings.enabled}
            />
          </View>

          {/* Detailed Mode */}
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>
                Detailed Descriptions
              </Text>
              <Text style={[styles.settingDesc, { color: colors.muted }]}>
                Include full details in announcements
              </Text>
            </View>
            <Switch
              value={settings.detailedMode}
              onValueChange={(v) => handleToggle('detailedMode', v)}
              trackColor={{ false: colors.border, true: colors.primary }}
              disabled={!settings.enabled}
            />
          </View>

          {/* Volume Control */}
          <View style={[styles.sliderRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>
              Volume: {Math.round(settings.volume * 100)}%
            </Text>
            <View style={styles.sliderContainer}>
              <Text style={[styles.sliderLabel, { color: colors.muted }]}>🔈</Text>
              <View style={[styles.sliderTrack, { backgroundColor: colors.surface }]}>
                <View 
                  style={[
                    styles.sliderFill, 
                    { backgroundColor: colors.primary, width: `${settings.volume * 100}%` }
                  ]} 
                />
                <View style={styles.sliderButtons}>
                  {[0.25, 0.5, 0.75, 1.0].map((v) => (
                    <Pressable
                      key={v}
                      style={[
                        styles.sliderButton,
                        settings.volume >= v && { backgroundColor: colors.primary }
                      ]}
                      onPress={() => handleSlider('volume', v)}
                    />
                  ))}
                </View>
              </View>
              <Text style={[styles.sliderLabel, { color: colors.muted }]}>🔊</Text>
            </View>
          </View>

          {/* Speech Rate */}
          <View style={[styles.sliderRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>
              Speech Rate: {settings.rate.toFixed(1)}x
            </Text>
            <View style={styles.rateButtons}>
              {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                <Pressable
                  key={rate}
                  style={[
                    styles.rateButton,
                    { 
                      backgroundColor: settings.rate === rate ? colors.primary : colors.surface,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => handleSlider('rate', rate)}
                >
                  <Text style={[
                    styles.rateText,
                    { color: settings.rate === rate ? '#fff' : colors.foreground }
                  ]}>
                    {rate}x
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Announcement Distance */}
          <View style={[styles.sliderRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>
              Announce Distance: {settings.announceDistance}m
            </Text>
            <View style={styles.rateButtons}>
              {[5, 10, 15, 20].map((dist) => (
                <Pressable
                  key={dist}
                  style={[
                    styles.rateButton,
                    { 
                      backgroundColor: settings.announceDistance === dist ? colors.primary : colors.surface,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => handleSlider('announceDistance', dist)}
                >
                  <Text style={[
                    styles.rateText,
                    { color: settings.announceDistance === dist ? '#fff' : colors.foreground }
                  ]}>
                    {dist}m
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Test Button */}
          <Pressable
            style={[styles.testButton, { backgroundColor: colors.primary }]}
            onPress={testAnnouncement}
          >
            <Text style={styles.testButtonText}>🔊 Test Announcement</Text>
          </Pressable>

          {/* Info */}
          <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.infoText, { color: colors.muted }]}>
              💡 Audio announcements help visually impaired users navigate the hospital. 
              Features include elevators, ramps, accessible restrooms, and assistance points.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  panel: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 20,
  },
  content: {
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 13,
  },
  sliderRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  sliderLabel: {
    fontSize: 16,
    width: 24,
    textAlign: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 8,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
  sliderButtons: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -8,
    bottom: -8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  sliderButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  rateButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  rateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  rateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  testButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default AudioSettingsPanel;
