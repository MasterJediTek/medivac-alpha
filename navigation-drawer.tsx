import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(320, SCREEN_WIDTH * 0.85);

// Screen categories with their screens
const SCREEN_CATEGORIES = [
  {
    id: 'clinical',
    name: 'Clinical',
    icon: '🏥',
    screens: [
      { name: 'cpoe', label: 'CPOE Orders', icon: '📋' },
      { name: 'vital-signs', label: 'Vital Signs', icon: '💓' },
      { name: 'patient-onboarding', label: 'Patient Onboarding', icon: '👤' },
      { name: 'infection-control', label: 'Infection Control', icon: '🦠' },
    ],
  },
  {
    id: 'admin',
    name: 'Administration',
    icon: '⚙️',
    screens: [
      { name: 'admin-control', label: 'Admin Control', icon: '🔧' },
      { name: 'delegation', label: 'Delegation', icon: '👥' },
      { name: 'policy-editor', label: 'Policy Editor', icon: '📝' },
      { name: 'audit-dashboard', label: 'Audit Dashboard', icon: '📊' },
      { name: 'report-templates', label: 'Report Templates', icon: '📄' },
      { name: 'scheduled-reports', label: 'Scheduled Reports', icon: '📅' },
    ],
  },
  {
    id: 'communications',
    name: 'Communications',
    icon: '💬',
    screens: [
      { name: 'broadcasts', label: 'Broadcasts', icon: '📢' },
      { name: 'email-templates', label: 'Email Templates', icon: '✉️' },
      { name: 'smtp-settings', label: 'SMTP Settings', icon: '📧' },
      { name: 'smtp-health', label: 'SMTP Health', icon: '🔍' },
      { name: 'smtp-import', label: 'SMTP Import', icon: '📥' },
      { name: 'virtual-receptionist', label: 'Virtual Receptionist', icon: '🤖' },
      { name: 'virtual-assistant', label: 'Virtual Assistant', icon: '💡' },
    ],
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    icon: '🟦',
    screens: [
      { name: 'teams-integration', label: 'Teams Integration', icon: '🔗' },
      { name: 'teams-meetings', label: 'Teams Meetings', icon: '📹' },
      { name: 'microsoft-auth', label: 'Microsoft Auth', icon: '🔐' },
      { name: 'onedrive-sync', label: 'OneDrive Sync', icon: '☁️' },
      { name: 'sharepoint-sync', label: 'SharePoint Sync', icon: '📁' },
    ],
  },
  {
    id: 'security',
    name: 'Security',
    icon: '🔒',
    screens: [
      { name: 'auth-login', label: 'Auth Login', icon: '🔑' },
      { name: 'mfa-setup', label: 'MFA Setup', icon: '📱' },
      { name: 'password-test', label: 'Password Test', icon: '🔐' },
      { name: 'security-monitor', label: 'Security Monitor', icon: '🛡️' },
    ],
  },
  {
    id: 'system',
    name: 'System',
    icon: '🖥️',
    screens: [
      { name: 'system-status', label: 'System Status', icon: '📊' },
      { name: 'system-dashboard', label: 'System Dashboard', icon: '📈' },
      { name: 'dependency-map', label: 'Dependency Map', icon: '🗺️' },
      { name: 'auto-discovery', label: 'Auto Discovery', icon: '🔍' },
      { name: 'sync-rules', label: 'Sync Rules', icon: '🔄' },
    ],
  },
  {
    id: 'jedi',
    name: 'JEDI Systems',
    icon: '⚡',
    screens: [
      { name: 'jeditek-agent', label: 'JediTek Agent', icon: '🤖' },
      { name: 'homing-beacons', label: 'Homing Beacons', icon: '📡' },
      { name: 'beacon-calibration', label: 'Beacon Calibration', icon: '🔧' },
    ],
  },
  {
    id: 'wachs',
    name: 'WACHS',
    icon: '🏛️',
    screens: [
      { name: 'wachs-wan', label: 'WACHS WAN', icon: '🌐' },
      { name: 'wachs-health', label: 'WACHS Health', icon: '💚' },
      { name: 'wachs-deployment', label: 'WACHS Deployment', icon: '🚀' },
      { name: 'site-cloning', label: 'Site Cloning', icon: '📋' },
      { name: 'site-provisioning', label: 'Site Provisioning', icon: '🏗️' },
    ],
  },
  {
    id: 'tasks',
    name: 'Tasks & Workflows',
    icon: '✅',
    screens: [
      { name: 'tasks', label: 'Tasks', icon: '📝' },
      { name: 'tasks-todo', label: 'Tasks Todo', icon: '☑️' },
      { name: 'webhooks', label: 'Webhooks', icon: '🔗' },
      { name: 'ai-commands', label: 'AI Commands', icon: '🤖' },
    ],
  },
  {
    id: 'drills',
    name: 'Drills & Training',
    icon: '🎯',
    screens: [
      { name: 'drill-mode', label: 'Drill Mode', icon: '🚨' },
      { name: 'drill-certificates', label: 'Drill Certificates', icon: '📜' },
      { name: 'incident-playbooks', label: 'Incident Playbooks', icon: '📕' },
      { name: 'playbook-analytics', label: 'Playbook Analytics', icon: '📊' },
    ],
  },
  {
    id: 'media',
    name: 'Media & Recordings',
    icon: '🎬',
    screens: [
      { name: 'recordings', label: 'Recordings', icon: '🎙️' },
      { name: 'recording-highlights', label: 'Recording Highlights', icon: '⭐' },
      { name: 'transcription-search', label: 'Transcription Search', icon: '🔍' },
      { name: 'speaker-analytics', label: 'Speaker Analytics', icon: '📈' },
    ],
  },
  {
    id: 'other',
    name: 'Other',
    icon: '📦',
    screens: [
      { name: 'gifting', label: 'Gifting', icon: '🎁' },
      { name: 'color-calendar', label: 'Color Calendar', icon: '🗓️' },
      { name: 'gp-integration', label: 'GP Integration', icon: '👨‍⚕️' },
      { name: 'tricorder-panel', label: 'Tricorder Panel', icon: '📟' },
      { name: 'tricorder-shop', label: 'Tricorder Shop', icon: '🛒' },
      { name: 'alerts-dashboard', label: 'Alerts Dashboard', icon: '🔔' },
      { name: 'satisfaction-surveys', label: 'Satisfaction Surveys', icon: '📋' },
      { name: 'deployment-approvals', label: 'Deployment Approvals', icon: '✅' },
    ],
  },
];

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NavigationDrawer({ isOpen, onClose }: NavigationDrawerProps) {
  const colors = useColors();
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['clinical', 'admin']);

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: -DRAWER_WIDTH,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const navigateToScreen = (screenName: string) => {
    onClose();
    setTimeout(() => {
      router.push(`/(tabs)/${screenName}` as any);
    }, 300);
  };

  const filteredCategories = searchQuery
    ? SCREEN_CATEGORIES.map((category) => ({
        ...category,
        screens: category.screens.filter(
          (screen) =>
            screen.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            screen.name.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((category) => category.screens.length > 0)
    : SCREEN_CATEGORIES;

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
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
    drawer: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      width: DRAWER_WIDTH,
      backgroundColor: colors.background,
      shadowColor: '#000',
      shadowOffset: { width: 2, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 10,
    },
    header: {
      padding: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      backgroundColor: colors.primary,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    searchContainer: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchInput: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 12,
      fontSize: 16,
      color: colors.foreground,
    },
    scrollView: {
      flex: 1,
    },
    category: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.surface,
    },
    categoryIcon: {
      fontSize: 20,
      marginRight: 12,
    },
    categoryName: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
    },
    categoryArrow: {
      fontSize: 16,
      color: colors.muted,
    },
    categoryCount: {
      fontSize: 12,
      color: colors.muted,
      marginRight: 8,
      backgroundColor: colors.background,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    screenList: {
      backgroundColor: colors.background,
    },
    screenItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      paddingLeft: 48,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    screenIcon: {
      fontSize: 18,
      marginRight: 12,
    },
    screenLabel: {
      fontSize: 15,
      color: colors.foreground,
    },
    closeButton: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 60 : 40,
      right: 16,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButtonText: {
      fontSize: 18,
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    footer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    footerText: {
      fontSize: 12,
      color: colors.muted,
      textAlign: 'center',
    },
  });

  if (!isOpen) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View
        style={[styles.backdrop, { opacity: backdropAnim }]}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📱 Navigation</Text>
          <Text style={styles.headerSubtitle}>Access all MediVac screens</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search screens..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView style={styles.scrollView}>
          {filteredCategories.map((category) => (
            <View key={category.id} style={styles.category}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(category.id)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryCount}>{category.screens.length}</Text>
                <Text style={styles.categoryArrow}>
                  {expandedCategories.includes(category.id) ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>

              {expandedCategories.includes(category.id) && (
                <View style={styles.screenList}>
                  {category.screens.map((screen) => (
                    <TouchableOpacity
                      key={screen.name}
                      style={styles.screenItem}
                      onPress={() => navigateToScreen(screen.name)}
                    >
                      <Text style={styles.screenIcon}>{screen.icon}</Text>
                      <Text style={styles.screenLabel}>{screen.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {SCREEN_CATEGORIES.reduce((acc, cat) => acc + cat.screens.length, 0)} screens available
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

export { SCREEN_CATEGORIES };
