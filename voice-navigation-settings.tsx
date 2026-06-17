/**
 * Voice Navigation Settings Component
 * 
 * Settings panel for configuring voice-guided navigation preferences.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, ScrollView } from 'react-native';
import { voiceNavigationService, VoiceSettings, VoiceLanguage } from '@/lib/services/voice-navigation.service';

interface VoiceNavigationSettingsProps {
  visible: boolean;
  onClose: () => void;
}

export function VoiceNavigationSettings({ visible, onClose }: VoiceNavigationSettingsProps) {
  const [settings, setSettings] = useState<VoiceSettings>(voiceNavigationService.getSettings());
  const [languages] = useState(voiceNavigationService.getAvailableLanguages());

  useEffect(() => {
    const unsubscribe = voiceNavigationService.onSettingsChange(setSettings);
    return unsubscribe;
  }, []);

  if (!visible) return null;

  const handleToggle = (key: keyof VoiceSettings) => {
    const current = settings[key];
    if (typeof current === 'boolean') {
      voiceNavigationService.updateSettings({ [key]: !current });
    }
  };

  const handleVolumeChange = (delta: number) => {
    const newVolume = Math.max(0, Math.min(1, settings.volume + delta));
    voiceNavigationService.setVolume(newVolume);
  };

  const handleRateChange = (delta: number) => {
    const newRate = Math.max(0.5, Math.min(2, settings.rate + delta));
    voiceNavigationService.setRate(newRate);
  };

  const handleLanguageChange = (language: VoiceLanguage) => {
    voiceNavigationService.setLanguage(language);
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </View>
      
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerIcon}>🔊</Text>
          <Text style={styles.headerTitle}>Voice Navigation</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.content}>
          {/* Enable/Disable */}
          <View style={styles.section}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Voice Navigation</Text>
                <Text style={styles.settingDescription}>Enable spoken directions</Text>
              </View>
              <Switch
                value={settings.enabled}
                onValueChange={() => handleToggle('enabled')}
                trackColor={{ false: '#767577', true: '#10B981' }}
                thumbColor={settings.enabled ? '#FFFFFF' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Volume */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Volume</Text>
            <View style={styles.sliderRow}>
              <Pressable 
                style={styles.sliderButton} 
                onPress={() => handleVolumeChange(-0.1)}
              >
                <Text style={styles.sliderButtonText}>−</Text>
              </Pressable>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${settings.volume * 100}%` }]} />
              </View>
              <Pressable 
                style={styles.sliderButton} 
                onPress={() => handleVolumeChange(0.1)}
              >
                <Text style={styles.sliderButtonText}>+</Text>
              </Pressable>
              <Text style={styles.sliderValue}>{Math.round(settings.volume * 100)}%</Text>
            </View>
          </View>

          {/* Speech Rate */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Speech Rate</Text>
            <View style={styles.sliderRow}>
              <Pressable 
                style={styles.sliderButton} 
                onPress={() => handleRateChange(-0.1)}
              >
                <Text style={styles.sliderButtonText}>🐢</Text>
              </Pressable>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${((settings.rate - 0.5) / 1.5) * 100}%` }]} />
              </View>
              <Pressable 
                style={styles.sliderButton} 
                onPress={() => handleRateChange(0.1)}
              >
                <Text style={styles.sliderButtonText}>🐇</Text>
              </Pressable>
              <Text style={styles.sliderValue}>{settings.rate.toFixed(1)}x</Text>
            </View>
          </View>

          {/* Language */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Language</Text>
            <View style={styles.languageGrid}>
              {languages.map(lang => (
                <Pressable
                  key={lang.code}
                  style={[
                    styles.languageButton,
                    settings.language === lang.code && styles.languageButtonActive,
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <Text style={[
                    styles.languageButtonText,
                    settings.language === lang.code && styles.languageButtonTextActive,
                  ]}>
                    {lang.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Announcement Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Announcements</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Distance Updates</Text>
                <Text style={styles.settingDescription}>Announce remaining distance</Text>
              </View>
              <Switch
                value={settings.announceDistance}
                onValueChange={() => handleToggle('announceDistance')}
                trackColor={{ false: '#767577', true: '#10B981' }}
                thumbColor={settings.announceDistance ? '#FFFFFF' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Landmarks</Text>
                <Text style={styles.settingDescription}>Announce nearby landmarks</Text>
              </View>
              <Switch
                value={settings.announceLandmarks}
                onValueChange={() => handleToggle('announceLandmarks')}
                trackColor={{ false: '#767577', true: '#10B981' }}
                thumbColor={settings.announceLandmarks ? '#FFFFFF' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Arrival</Text>
                <Text style={styles.settingDescription}>Announce when you arrive</Text>
              </View>
              <Switch
                value={settings.announceArrival}
                onValueChange={() => handleToggle('announceArrival')}
                trackColor={{ false: '#767577', true: '#10B981' }}
                thumbColor={settings.announceArrival ? '#FFFFFF' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Test Voice */}
          <View style={styles.section}>
            <Pressable 
              style={styles.testButton}
              onPress={() => {
                voiceNavigationService.announceNavigationStart('Emergency Department');
              }}
            >
              <Text style={styles.testButtonIcon}>🎤</Text>
              <Text style={styles.testButtonText}>Test Voice</Text>
            </Pressable>
          </View>
        </ScrollView>
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
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  settingDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  sliderValue: {
    width: 50,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#374151',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#34D399',
  },
  languageButtonText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  languageButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    gap: 8,
  },
  testButtonIcon: {
    fontSize: 20,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default VoiceNavigationSettings;
