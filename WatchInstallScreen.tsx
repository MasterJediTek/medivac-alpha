/**
 * JEDI Watch App Installation Screen
 * Download and install guide for smartwatches
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { watchPackage, InstallationPackage, PlatformPackage } from '@/src/watch/JEDIWatchPackage';
import { DISCO_COLORS, getGlowShadow } from '@/src/theme/DiscoTheme';

type ScreenMode = 'platforms' | 'guide' | 'troubleshoot';

export default function WatchInstallScreen() {
  const [mode, setMode] = useState<ScreenMode>('platforms');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformPackage | null>(null);
  const [installProgress, setInstallProgress] = useState(0);
  const [isInstalling, setIsInstalling] = useState(false);

  const pkg = watchPackage.generatePackage();

  const getPlatformIcon = (platform: string): string => {
    switch (platform) {
      case 'apple_watch': return '⌚';
      case 'wear_os': return '🤖';
      case 'galaxy_watch': return '⭕';
      default: return '⌚';
    }
  };

  const getPlatformName = (platform: string): string => {
    switch (platform) {
      case 'apple_watch': return 'Apple Watch';
      case 'wear_os': return 'Wear OS';
      case 'galaxy_watch': return 'Galaxy Watch';
      default: return platform;
    }
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleDownload = (platform: PlatformPackage) => {
    setSelectedPlatform(platform);
    setIsInstalling(true);
    setInstallProgress(0);

    // Simulate download progress
    const interval = setInterval(() => {
      setInstallProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsInstalling(false);
          Alert.alert(
            '✅ Download Complete',
            `${getPlatformName(platform.platform)} package ready for installation.\n\nFile: ${platform.fileName}\nSize: ${formatFileSize(platform.fileSize)}`,
            [{ text: 'OK' }]
          );
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  const renderPlatforms = () => (
    <ScrollView contentContainerStyle={styles.content}>
      {/* Header Card */}
      <View style={[styles.headerCard, getGlowShadow(DISCO_COLORS.neonPink)]}>
        <Text style={styles.headerIcon}>⌚</Text>
        <Text style={styles.headerTitle}>JEDI Watch</Text>
        <Text style={styles.headerVersion}>v{pkg.manifest.version}</Text>
        <Text style={styles.headerDesc}>{pkg.manifest.description}</Text>
      </View>

      {/* Platform Selection */}
      <Text style={styles.sectionTitle}>📱 Select Your Platform</Text>
      {pkg.platforms.map((platform) => (
        <TouchableOpacity
          key={platform.platform}
          style={[styles.platformCard, getGlowShadow(DISCO_COLORS.neonCyan)]}
          onPress={() => handleDownload(platform)}
          disabled={isInstalling}
        >
          <Text style={styles.platformIcon}>{getPlatformIcon(platform.platform)}</Text>
          <View style={styles.platformInfo}>
            <Text style={styles.platformName}>{getPlatformName(platform.platform)}</Text>
            <Text style={styles.platformVersion}>{platform.minVersion}</Text>
            <Text style={styles.platformSize}>{formatFileSize(platform.fileSize)}</Text>
          </View>
          <View style={styles.downloadButton}>
            <Text style={styles.downloadIcon}>⬇️</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* Progress Bar */}
      {isInstalling && selectedPlatform && (
        <View style={[styles.progressCard, getGlowShadow(DISCO_COLORS.neonGreen)]}>
          <Text style={styles.progressTitle}>
            Downloading {getPlatformName(selectedPlatform.platform)}...
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${installProgress}%` }]} />
          </View>
          <Text style={styles.progressText}>{installProgress}%</Text>
        </View>
      )}

      {/* Supported Devices */}
      <Text style={styles.sectionTitle}>📋 Supported Devices</Text>
      {pkg.platforms.map((platform) => (
        <View key={`devices-${platform.platform}`} style={styles.devicesCard}>
          <Text style={styles.devicesTitle}>
            {getPlatformIcon(platform.platform)} {getPlatformName(platform.platform)}
          </Text>
          {platform.supportedDevices.map((device, idx) => (
            <Text key={idx} style={styles.deviceItem}>• {device}</Text>
          ))}
        </View>
      ))}

      {/* Features */}
      <Text style={styles.sectionTitle}>✨ Features</Text>
      <View style={styles.featuresGrid}>
        {pkg.manifest.capabilities.slice(0, 12).map((cap, idx) => (
          <View key={idx} style={styles.featureItem}>
            <Text style={styles.featureIcon}>
              {cap.includes('vital') ? '❤️' : cap.includes('med') ? '💊' : cap.includes('task') ? '✓' : cap.includes('emergency') ? '🚨' : cap.includes('voice') ? '🎤' : cap.includes('offline') ? '📴' : '⚡'}
            </Text>
            <Text style={styles.featureText}>{cap.replace(/_/g, ' ')}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderGuide = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>📖 Installation Guide</Text>

      {/* Requirements */}
      <View style={[styles.requirementsCard, getGlowShadow(DISCO_COLORS.neonOrange)]}>
        <Text style={styles.requirementsTitle}>⚠️ Requirements</Text>
        {pkg.installationGuide.requirements.map((req, idx) => (
          <Text key={idx} style={styles.requirementItem}>• {req}</Text>
        ))}
      </View>

      {/* Steps */}
      {pkg.installationGuide.steps.map((step) => (
        <View key={step.order} style={[styles.stepCard, getGlowShadow(DISCO_COLORS.neonCyan, 0.4)]}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{step.order}</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDesc}>{step.description}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderTroubleshoot = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>🔧 Troubleshooting</Text>

      {pkg.installationGuide.troubleshooting.map((item, idx) => (
        <View key={idx} style={[styles.troubleCard, getGlowShadow(DISCO_COLORS.neonPurple, 0.4)]}>
          <Text style={styles.troubleIssue}>❓ {item.issue}</Text>
          <Text style={styles.troubleSolution}>✅ {item.solution}</Text>
        </View>
      ))}

      {/* Release Notes */}
      <Text style={styles.sectionTitle}>📝 Release Notes</Text>
      <View style={styles.releaseCard}>
        <Text style={styles.releaseText}>{pkg.releaseNotes}</Text>
      </View>
    </ScrollView>
  );

  return (
    <ScreenContainer containerClassName="bg-[#0D0D0D]">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>📦</Text>
        <Text style={styles.mainTitle}>JEDI WATCH INSTALLER</Text>
        <Text style={styles.subtitle}>Download & Setup</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(['platforms', 'guide', 'troubleshoot'] as ScreenMode[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, mode === tab && styles.activeTab]}
            onPress={() => setMode(tab)}
          >
            <Text style={styles.tabIcon}>
              {tab === 'platforms' ? '📱' : tab === 'guide' ? '📖' : '🔧'}
            </Text>
            <Text style={[styles.tabLabel, mode === tab && styles.activeTabLabel]}>
              {tab === 'platforms' ? 'Download' : tab === 'guide' ? 'Guide' : 'Help'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {mode === 'platforms' && renderPlatforms()}
      {mode === 'guide' && renderGuide()}
      {mode === 'troubleshoot' && renderTroubleshoot()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingVertical: 16, backgroundColor: DISCO_COLORS.midnightPurple },
  headerEmoji: { fontSize: 32 },
  mainTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2 },
  subtitle: { fontSize: 11, color: DISCO_COLORS.neonCyan, letterSpacing: 2, marginTop: 4 },
  tabBar: { flexDirection: 'row', backgroundColor: DISCO_COLORS.darkDisco, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: DISCO_COLORS.neonPink + '40' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: DISCO_COLORS.neonPink },
  tabIcon: { fontSize: 18 },
  tabLabel: { fontSize: 10, color: '#888', marginTop: 2 },
  activeTabLabel: { color: DISCO_COLORS.neonPink },
  content: { padding: 16, paddingBottom: 100 },
  headerCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: DISCO_COLORS.neonPink },
  headerIcon: { fontSize: 48, marginBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF' },
  headerVersion: { fontSize: 14, color: DISCO_COLORS.neonGreen, fontWeight: 'bold', marginTop: 4 },
  headerDesc: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 12, lineHeight: 18 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12, marginTop: 8 },
  platformCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: DISCO_COLORS.neonCyan },
  platformIcon: { fontSize: 36, marginRight: 16 },
  platformInfo: { flex: 1 },
  platformName: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  platformVersion: { fontSize: 12, color: DISCO_COLORS.neonCyan },
  platformSize: { fontSize: 11, color: '#888' },
  downloadButton: { backgroundColor: DISCO_COLORS.neonGreen, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  downloadIcon: { fontSize: 20 },
  progressCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 2, borderColor: DISCO_COLORS.neonGreen },
  progressTitle: { fontSize: 14, color: '#FFFFFF', marginBottom: 12 },
  progressBar: { height: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: DISCO_COLORS.neonGreen, borderRadius: 6 },
  progressText: { fontSize: 14, color: DISCO_COLORS.neonGreen, fontWeight: 'bold', textAlign: 'center', marginTop: 8 },
  devicesCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 12, padding: 16, marginBottom: 12 },
  devicesTitle: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  deviceItem: { fontSize: 12, color: '#888', marginLeft: 8, marginBottom: 4 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featureItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, gap: 6 },
  featureIcon: { fontSize: 14 },
  featureText: { fontSize: 10, color: '#FFFFFF', textTransform: 'capitalize' },
  requirementsCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 2, borderColor: DISCO_COLORS.neonOrange },
  requirementsTitle: { fontSize: 16, fontWeight: 'bold', color: DISCO_COLORS.neonOrange, marginBottom: 12 },
  requirementItem: { fontSize: 13, color: '#CCC', marginBottom: 6 },
  stepCard: { flexDirection: 'row', backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  stepNumber: { width: 36, height: 36, borderRadius: 18, backgroundColor: DISCO_COLORS.neonCyan, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  stepNumberText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  stepDesc: { fontSize: 13, color: '#888', lineHeight: 18 },
  troubleCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  troubleIssue: { fontSize: 14, fontWeight: 'bold', color: DISCO_COLORS.neonOrange, marginBottom: 8 },
  troubleSolution: { fontSize: 13, color: DISCO_COLORS.neonGreen, lineHeight: 18 },
  releaseCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 16 },
  releaseText: { fontSize: 12, color: '#CCC', lineHeight: 20 },
});
