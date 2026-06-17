/**
 * Accessibility Mode Toggle Component
 * 
 * Toggle button and settings for wheelchair-accessible routing.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Switch, ScrollView } from 'react-native';
import { accessibilityRoutesService, AccessibilitySettings } from '@/lib/services/accessibility-routes.service';

interface AccessibilityModeToggleProps {
  compact?: boolean;
  onSettingsPress?: () => void;
}

export function AccessibilityModeToggle({ compact = false, onSettingsPress }: AccessibilityModeToggleProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>(accessibilityRoutesService.getSettings());

  useEffect(() => {
    const unsubscribe = accessibilityRoutesService.onSettingsChange(setSettings);
    return unsubscribe;
  }, []);

  const handleToggle = () => {
    if (settings.requireWheelchairAccess) {
      accessibilityRoutesService.disableAccessibilityMode();
    } else {
      accessibilityRoutesService.enableWheelchairMode();
    }
  };

  if (compact) {
    return (
      <Pressable 
        style={[
          styles.compactButton,
          settings.requireWheelchairAccess && styles.compactButtonActive,
        ]}
        onPress={handleToggle}
        onLongPress={onSettingsPress}
      >
        <Text style={styles.compactIcon}>♿</Text>
        <Text style={[
          styles.compactLabel,
          settings.requireWheelchairAccess && styles.compactLabelActive,
        ]}>
          {settings.requireWheelchairAccess ? 'ON' : 'OFF'}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>♿</Text>
        <Text style={styles.headerTitle}>Accessibility Mode</Text>
        <Switch
          value={settings.requireWheelchairAccess}
          onValueChange={handleToggle}
          trackColor={{ false: '#767577', true: '#10B981' }}
          thumbColor={settings.requireWheelchairAccess ? '#FFFFFF' : '#f4f3f4'}
        />
      </View>

      {settings.requireWheelchairAccess && (
        <View style={styles.features}>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>🛗</Text>
            <Text style={styles.featureText}>Prefer elevators</Text>
            <Text style={styles.featureStatus}>
              {settings.preferElevators ? '✓' : '✗'}
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>🚫</Text>
            <Text style={styles.featureText}>Avoid stairs</Text>
            <Text style={styles.featureStatus}>
              {settings.avoidStairs ? '✓' : '✗'}
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>↗️</Text>
            <Text style={styles.featureText}>Max gradient: {settings.maximumGradient}%</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>↔️</Text>
            <Text style={styles.featureText}>Min width: {settings.minimumPathWidth}cm</Text>
          </View>
        </View>
      )}
    </View>
  );
}

interface AccessibilitySettingsPanelProps {
  visible: boolean;
  onClose: () => void;
}

export function AccessibilitySettingsPanel({ visible, onClose }: AccessibilitySettingsPanelProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>(accessibilityRoutesService.getSettings());

  useEffect(() => {
    const unsubscribe = accessibilityRoutesService.onSettingsChange(setSettings);
    return unsubscribe;
  }, []);

  if (!visible) return null;

  const handleToggle = (key: keyof AccessibilitySettings) => {
    const current = settings[key];
    if (typeof current === 'boolean') {
      accessibilityRoutesService.updateSettings({ [key]: !current });
    }
  };

  const handleNumberChange = (key: keyof AccessibilitySettings, delta: number) => {
    const current = settings[key];
    if (typeof current === 'number') {
      accessibilityRoutesService.updateSettings({ [key]: current + delta });
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </View>
      
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelIcon}>♿</Text>
          <Text style={styles.panelTitle}>Accessibility Settings</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.panelContent}>
          {/* Wheelchair Access */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Wheelchair Access</Text>
              <Text style={styles.settingDescription}>Only show accessible routes</Text>
            </View>
            <Switch
              value={settings.requireWheelchairAccess}
              onValueChange={() => handleToggle('requireWheelchairAccess')}
              trackColor={{ false: '#767577', true: '#10B981' }}
            />
          </View>

          {/* Prefer Elevators */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Prefer Elevators</Text>
              <Text style={styles.settingDescription}>Choose elevator routes when available</Text>
            </View>
            <Switch
              value={settings.preferElevators}
              onValueChange={() => handleToggle('preferElevators')}
              trackColor={{ false: '#767577', true: '#10B981' }}
            />
          </View>

          {/* Prefer Ramps */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Prefer Ramps</Text>
              <Text style={styles.settingDescription}>Choose ramp routes when available</Text>
            </View>
            <Switch
              value={settings.preferRamps}
              onValueChange={() => handleToggle('preferRamps')}
              trackColor={{ false: '#767577', true: '#10B981' }}
            />
          </View>

          {/* Avoid Stairs */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Avoid Stairs</Text>
              <Text style={styles.settingDescription}>Never include stairs in routes</Text>
            </View>
            <Switch
              value={settings.avoidStairs}
              onValueChange={() => handleToggle('avoidStairs')}
              trackColor={{ false: '#767577', true: '#10B981' }}
            />
          </View>

          {/* Minimum Path Width */}
          <View style={styles.numberSettingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Minimum Path Width</Text>
              <Text style={styles.settingDescription}>Required corridor width in cm</Text>
            </View>
            <View style={styles.numberControl}>
              <Pressable 
                style={styles.numberButton}
                onPress={() => handleNumberChange('minimumPathWidth', -10)}
              >
                <Text style={styles.numberButtonText}>−</Text>
              </Pressable>
              <Text style={styles.numberValue}>{settings.minimumPathWidth}cm</Text>
              <Pressable 
                style={styles.numberButton}
                onPress={() => handleNumberChange('minimumPathWidth', 10)}
              >
                <Text style={styles.numberButtonText}>+</Text>
              </Pressable>
            </View>
          </View>

          {/* Maximum Gradient */}
          <View style={styles.numberSettingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Maximum Gradient</Text>
              <Text style={styles.settingDescription}>Maximum slope percentage</Text>
            </View>
            <View style={styles.numberControl}>
              <Pressable 
                style={styles.numberButton}
                onPress={() => handleNumberChange('maximumGradient', -1)}
              >
                <Text style={styles.numberButtonText}>−</Text>
              </Pressable>
              <Text style={styles.numberValue}>{settings.maximumGradient}%</Text>
              <Pressable 
                style={styles.numberButton}
                onPress={() => handleNumberChange('maximumGradient', 1)}
              >
                <Text style={styles.numberButtonText}>+</Text>
              </Pressable>
            </View>
          </View>

          {/* Automatic Doors */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Require Automatic Doors</Text>
              <Text style={styles.settingDescription}>Only routes with automatic doors</Text>
            </View>
            <Switch
              value={settings.requireAutomaticDoors}
              onValueChange={() => handleToggle('requireAutomaticDoors')}
              trackColor={{ false: '#767577', true: '#10B981' }}
            />
          </View>

          {/* Accessible Restrooms */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Accessible Restrooms</Text>
              <Text style={styles.settingDescription}>Highlight accessible facilities</Text>
            </View>
            <Switch
              value={settings.requireAccessibleRestrooms}
              onValueChange={() => handleToggle('requireAccessibleRestrooms')}
              trackColor={{ false: '#767577', true: '#10B981' }}
            />
          </View>

          {/* Quick Presets */}
          <View style={styles.presetsSection}>
            <Text style={styles.presetsTitle}>Quick Presets</Text>
            <View style={styles.presetsRow}>
              <Pressable 
                style={styles.presetButton}
                onPress={() => accessibilityRoutesService.enableWheelchairMode()}
              >
                <Text style={styles.presetIcon}>♿</Text>
                <Text style={styles.presetText}>Wheelchair</Text>
              </Pressable>
              <Pressable 
                style={styles.presetButton}
                onPress={() => accessibilityRoutesService.disableAccessibilityMode()}
              >
                <Text style={styles.presetIcon}>🚶</Text>
                <Text style={styles.presetText}>Standard</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Compact button styles
  compactButton: {
    width: 60,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  compactButtonActive: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOpacity: 0.5,
  },
  compactIcon: {
    fontSize: 18,
  },
  compactLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  compactLabelActive: {
    color: '#FFFFFF',
  },

  // Full container styles
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#111827',
  },
  headerIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  features: {
    padding: 12,
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureIcon: {
    fontSize: 14,
    width: 24,
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    color: '#D1D5DB',
  },
  featureStatus: {
    fontSize: 14,
    color: '#10B981',
  },

  // Overlay styles
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
  panel: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  panelIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  panelTitle: {
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
  panelContent: {
    padding: 16,
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
  numberSettingRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  numberControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  numberButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  numberValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    minWidth: 60,
    textAlign: 'center',
  },
  presetsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  presetsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  presetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#374151',
    borderRadius: 8,
    gap: 8,
  },
  presetIcon: {
    fontSize: 20,
  },
  presetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AccessibilityModeToggle;
