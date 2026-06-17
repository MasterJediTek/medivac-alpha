/**
 * Wearable Integration Screen
 * Disco-styled health dashboard with device management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import {
  wearableIntegrationService,
  WearableConnection,
  WearableProvider,
  VitalsSnapshot,
  MetricType,
} from '@/src/services/WearableIntegrationService';
import { DISCO_COLORS, getGlowShadow } from '@/src/theme/DiscoTheme';

type ScreenMode = 'dashboard' | 'devices' | 'connect';

export default function WearableIntegrationScreen() {
  const [mode, setMode] = useState<ScreenMode>('dashboard');
  const [connections, setConnections] = useState<WearableConnection[]>([]);
  const [vitals, setVitals] = useState<VitalsSnapshot | null>(null);
  const [syncingDeviceId, setSyncingDeviceId] = useState<string | null>(null);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [heartAnim] = useState(new Animated.Value(1));

  const loadData = useCallback(() => {
    setConnections(wearableIntegrationService.getConnections());
    setVitals(wearableIntegrationService.getVitalsSnapshot('PAT-001'));
  }, []);

  useEffect(() => {
    wearableIntegrationService.initialize();
    loadData();
    const unsubscribe = wearableIntegrationService.subscribe(loadData);

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    // Heart beat animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
        Animated.timing(heartAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(heartAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
        Animated.timing(heartAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    return unsubscribe;
  }, [loadData, pulseAnim, heartAnim]);

  const handleConnectDevice = async (provider: WearableProvider) => {
    const providerInfo = wearableIntegrationService.getProviderInfo(provider);
    const permissions: MetricType[] = ['heart_rate', 'steps', 'calories', 'sleep', 'blood_oxygen'];
    
    try {
      await wearableIntegrationService.connectDevice(
        provider,
        `${providerInfo.name} Device`,
        'Smart Watch',
        permissions
      );
      Alert.alert('🎉 Connected!', `${providerInfo.name} is now syncing with MediVac One!`);
      setMode('devices');
    } catch (error) {
      Alert.alert('Error', 'Could not connect device');
    }
  };

  const handleSyncDevice = async (connectionId: string) => {
    setSyncingDeviceId(connectionId);
    try {
      await wearableIntegrationService.syncDevice(connectionId);
      loadData();
    } catch (error) {
      Alert.alert('Sync Error', 'Could not sync device data');
    } finally {
      setSyncingDeviceId(null);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    Alert.alert(
      'Disconnect Device',
      'Are you sure you want to disconnect this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await wearableIntegrationService.disconnectDevice(connectionId);
            loadData();
          },
        },
      ]
    );
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return DISCO_COLORS.neonGreen;
    if (score >= 60) return DISCO_COLORS.neonYellow;
    if (score >= 40) return DISCO_COLORS.neonOrange;
    return DISCO_COLORS.neonRed;
  };

  const renderDashboard = () => {
    if (!vitals) return null;

    return (
      <ScrollView contentContainerStyle={styles.dashboardContent}>
        {/* Overall Health Score */}
        <Animated.View style={[styles.scoreCard, { transform: [{ scale: pulseAnim }] }, getGlowShadow(getScoreColor(vitals.overallScore))]}>
          <Text style={styles.scoreLabel}>Overall Health Score</Text>
          <Text style={[styles.scoreValue, { color: getScoreColor(vitals.overallScore) }]}>
            {vitals.overallScore}
          </Text>
          <View style={styles.scoreBar}>
            <View style={[styles.scoreBarFill, { width: `${vitals.overallScore}%`, backgroundColor: getScoreColor(vitals.overallScore) }]} />
          </View>
        </Animated.View>

        {/* Heart Rate Card */}
        <View style={[styles.metricCard, getGlowShadow(DISCO_COLORS.neonPink)]}>
          <View style={styles.metricHeader}>
            <Animated.Text style={[styles.metricIcon, { transform: [{ scale: heartAnim }] }]}>❤️</Animated.Text>
            <Text style={styles.metricTitle}>Heart Rate</Text>
          </View>
          <Text style={[styles.metricValue, { color: DISCO_COLORS.neonPink }]}>
            {vitals.heartRate.current} <Text style={styles.metricUnit}>bpm</Text>
          </Text>
          <View style={styles.heartRateDetails}>
            <View style={styles.hrDetail}>
              <Text style={styles.hrLabel}>Resting</Text>
              <Text style={styles.hrValue}>{vitals.heartRate.resting}</Text>
            </View>
            <View style={styles.hrDetail}>
              <Text style={styles.hrLabel}>Average</Text>
              <Text style={styles.hrValue}>{vitals.heartRate.average}</Text>
            </View>
            <View style={styles.hrDetail}>
              <Text style={styles.hrLabel}>HRV</Text>
              <Text style={styles.hrValue}>{vitals.heartRate.variability}ms</Text>
            </View>
          </View>
          {/* Heart Rate Zones */}
          <View style={styles.zonesContainer}>
            {vitals.heartRate.zones.map((zone, idx) => (
              <View key={idx} style={styles.zoneItem}>
                <View style={[styles.zoneDot, { backgroundColor: zone.color }]} />
                <Text style={styles.zoneName}>{zone.zone}</Text>
                <Text style={styles.zoneMinutes}>{zone.minutes}m</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Activity Card */}
        <View style={[styles.metricCard, getGlowShadow(DISCO_COLORS.neonCyan)]}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricIcon}>🏃</Text>
            <Text style={styles.metricTitle}>Activity</Text>
          </View>
          <View style={styles.activityGrid}>
            <View style={styles.activityItem}>
              <Text style={[styles.activityValue, { color: DISCO_COLORS.neonCyan }]}>{vitals.activity.steps.toLocaleString()}</Text>
              <Text style={styles.activityLabel}>Steps</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(100, (vitals.activity.steps / vitals.activity.stepsGoal) * 100)}%`, backgroundColor: DISCO_COLORS.neonCyan }]} />
              </View>
            </View>
            <View style={styles.activityItem}>
              <Text style={[styles.activityValue, { color: DISCO_COLORS.neonOrange }]}>{vitals.activity.calories}</Text>
              <Text style={styles.activityLabel}>Calories</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(100, (vitals.activity.calories / vitals.activity.caloriesGoal) * 100)}%`, backgroundColor: DISCO_COLORS.neonOrange }]} />
              </View>
            </View>
            <View style={styles.activityItem}>
              <Text style={[styles.activityValue, { color: DISCO_COLORS.neonGreen }]}>{vitals.activity.activeMinutes}</Text>
              <Text style={styles.activityLabel}>Active Min</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(100, (vitals.activity.activeMinutes / vitals.activity.activeMinutesGoal) * 100)}%`, backgroundColor: DISCO_COLORS.neonGreen }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Sleep Card */}
        <View style={[styles.metricCard, getGlowShadow(DISCO_COLORS.neonPurple)]}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricIcon}>😴</Text>
            <Text style={styles.metricTitle}>Sleep</Text>
            <View style={[styles.sleepScoreBadge, { backgroundColor: getScoreColor(vitals.sleep.sleepScore) + '40' }]}>
              <Text style={[styles.sleepScoreText, { color: getScoreColor(vitals.sleep.sleepScore) }]}>{vitals.sleep.sleepScore}</Text>
            </View>
          </View>
          <Text style={[styles.metricValue, { color: DISCO_COLORS.neonPurple }]}>
            {vitals.sleep.totalHours.toFixed(1)} <Text style={styles.metricUnit}>hours</Text>
          </Text>
          <View style={styles.sleepBreakdown}>
            <View style={[styles.sleepBar, { flex: vitals.sleep.deepSleep, backgroundColor: '#1E3A5F' }]} />
            <View style={[styles.sleepBar, { flex: vitals.sleep.lightSleep, backgroundColor: '#4A90D9' }]} />
            <View style={[styles.sleepBar, { flex: vitals.sleep.remSleep, backgroundColor: '#BF00FF' }]} />
            <View style={[styles.sleepBar, { flex: vitals.sleep.awakeTime, backgroundColor: '#FF6600' }]} />
          </View>
          <View style={styles.sleepLegend}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#1E3A5F' }]} /><Text style={styles.legendText}>Deep</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#4A90D9' }]} /><Text style={styles.legendText}>Light</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#BF00FF' }]} /><Text style={styles.legendText}>REM</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#FF6600' }]} /><Text style={styles.legendText}>Awake</Text></View>
          </View>
        </View>

        {/* Vitals Grid */}
        <Text style={styles.sectionTitle}>Vital Signs</Text>
        <View style={styles.vitalsGrid}>
          <View style={[styles.vitalCard, getGlowShadow(DISCO_COLORS.neonBlue, 0.5)]}>
            <Text style={styles.vitalIcon}>🫁</Text>
            <Text style={styles.vitalValue}>{vitals.bloodOxygen}%</Text>
            <Text style={styles.vitalLabel}>SpO2</Text>
          </View>
          <View style={[styles.vitalCard, getGlowShadow(DISCO_COLORS.neonRed, 0.5)]}>
            <Text style={styles.vitalIcon}>🌡️</Text>
            <Text style={styles.vitalValue}>{vitals.temperature}°C</Text>
            <Text style={styles.vitalLabel}>Temp</Text>
          </View>
          <View style={[styles.vitalCard, getGlowShadow(DISCO_COLORS.neonGreen, 0.5)]}>
            <Text style={styles.vitalIcon}>💨</Text>
            <Text style={styles.vitalValue}>{vitals.respiratoryRate}</Text>
            <Text style={styles.vitalLabel}>Resp Rate</Text>
          </View>
          <View style={[styles.vitalCard, getGlowShadow(DISCO_COLORS.neonPink, 0.5)]}>
            <Text style={styles.vitalIcon}>🩸</Text>
            <Text style={styles.vitalValue}>{vitals.bloodPressure.systolic}/{vitals.bloodPressure.diastolic}</Text>
            <Text style={styles.vitalLabel}>BP</Text>
          </View>
        </View>

        {/* Alerts */}
        {vitals.alerts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>⚠️ Alerts</Text>
            {vitals.alerts.map((alert) => (
              <View key={alert.id} style={[styles.alertCard, { borderColor: alert.severity === 'critical' ? DISCO_COLORS.neonRed : DISCO_COLORS.neonOrange }]}>
                <Text style={styles.alertMessage}>{alert.message}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    );
  };

  const renderDevices = () => (
    <FlatList
      data={connections}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.devicesContent}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>⌚</Text>
          <Text style={styles.emptyText}>No devices connected</Text>
          <TouchableOpacity style={styles.connectButton} onPress={() => setMode('connect')}>
            <Text style={styles.connectButtonText}>Connect a Device</Text>
          </TouchableOpacity>
        </View>
      }
      renderItem={({ item }) => {
        const providerInfo = wearableIntegrationService.getProviderInfo(item.provider);
        const isSyncing = syncingDeviceId === item.id;

        return (
          <View style={[styles.deviceCard, { borderColor: providerInfo.color }, getGlowShadow(providerInfo.color, 0.7)]}>
            <View style={styles.deviceHeader}>
              <Text style={styles.deviceIcon}>{providerInfo.icon}</Text>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{item.deviceName}</Text>
                <Text style={styles.deviceModel}>{item.deviceModel}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: item.status === 'connected' ? DISCO_COLORS.neonGreen + '40' : DISCO_COLORS.neonRed + '40' }]}>
                <Text style={[styles.statusText, { color: item.status === 'connected' ? DISCO_COLORS.neonGreen : DISCO_COLORS.neonRed }]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.deviceMeta}>
              <Text style={styles.deviceMetaText}>🔋 {item.batteryLevel}%</Text>
              <Text style={styles.deviceMetaText}>📊 {item.permissions.length} metrics</Text>
              <Text style={styles.deviceMetaText}>🕐 {new Date(item.lastSyncAt).toLocaleTimeString()}</Text>
            </View>

            <View style={styles.deviceActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: DISCO_COLORS.neonCyan }]}
                onPress={() => handleSyncDevice(item.id)}
                disabled={isSyncing}
              >
                <Text style={styles.actionButtonText}>{isSyncing ? '🔄 Syncing...' : '🔄 Sync'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: DISCO_COLORS.neonRed }]}
                onPress={() => handleDisconnect(item.id)}
              >
                <Text style={styles.actionButtonText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
    />
  );

  const renderConnect = () => {
    const providers = wearableIntegrationService.getAllProviders();

    return (
      <ScrollView contentContainerStyle={styles.connectContent}>
        <Text style={styles.connectTitle}>🔗 Connect a Device</Text>
        <Text style={styles.connectSubtitle}>Choose your wearable platform</Text>

        {providers.map((provider) => (
          <TouchableOpacity
            key={provider.id}
            style={[styles.providerCard, { borderColor: provider.color }, getGlowShadow(provider.color)]}
            onPress={() => handleConnectDevice(provider.id)}
          >
            <Text style={styles.providerIcon}>{provider.icon}</Text>
            <Text style={[styles.providerName, { color: provider.color }]}>{provider.name}</Text>
            <Text style={styles.providerArrow}>→</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <ScreenContainer containerClassName="bg-[#0D0D0D]">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>⌚</Text>
        <Text style={styles.headerTitle}>Wearable Integration</Text>
        <Text style={styles.headerSubtitle}>Health Data Dashboard</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, mode === 'dashboard' && styles.activeTab]} onPress={() => setMode('dashboard')}>
          <Text style={styles.tabIcon}>📊</Text>
          <Text style={[styles.tabLabel, mode === 'dashboard' && styles.activeTabLabel]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, mode === 'devices' && styles.activeTab]} onPress={() => setMode('devices')}>
          <Text style={styles.tabIcon}>⌚</Text>
          <Text style={[styles.tabLabel, mode === 'devices' && styles.activeTabLabel]}>Devices</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, mode === 'connect' && styles.activeTab]} onPress={() => setMode('connect')}>
          <Text style={styles.tabIcon}>➕</Text>
          <Text style={[styles.tabLabel, mode === 'connect' && styles.activeTabLabel]}>Connect</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {mode === 'dashboard' && renderDashboard()}
      {mode === 'devices' && renderDevices()}
      {mode === 'connect' && renderConnect()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingVertical: 16, backgroundColor: DISCO_COLORS.midnightPurple },
  headerEmoji: { fontSize: 32 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2 },
  headerSubtitle: { fontSize: 11, color: DISCO_COLORS.neonCyan, letterSpacing: 3, marginTop: 4 },
  tabBar: { flexDirection: 'row', backgroundColor: DISCO_COLORS.darkDisco, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: DISCO_COLORS.neonCyan + '40' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: DISCO_COLORS.neonCyan },
  tabIcon: { fontSize: 20 },
  tabLabel: { fontSize: 11, color: '#888', marginTop: 4 },
  activeTabLabel: { color: DISCO_COLORS.neonCyan },
  dashboardContent: { padding: 16, paddingBottom: 100 },
  scoreCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 20, padding: 24, marginBottom: 20, alignItems: 'center', borderWidth: 2, borderColor: DISCO_COLORS.neonGreen },
  scoreLabel: { fontSize: 14, color: '#888', marginBottom: 8 },
  scoreValue: { fontSize: 72, fontWeight: '900' },
  scoreBar: { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, marginTop: 16 },
  scoreBarFill: { height: '100%', borderRadius: 4 },
  metricCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 2, borderColor: DISCO_COLORS.neonPink },
  metricHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  metricIcon: { fontSize: 24, marginRight: 10 },
  metricTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', flex: 1 },
  metricValue: { fontSize: 48, fontWeight: '900' },
  metricUnit: { fontSize: 18, color: '#888' },
  heartRateDetails: { flexDirection: 'row', marginTop: 16, gap: 20 },
  hrDetail: { alignItems: 'center' },
  hrLabel: { fontSize: 11, color: '#888' },
  hrValue: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  zonesContainer: { flexDirection: 'row', marginTop: 16, gap: 12 },
  zoneItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  zoneDot: { width: 8, height: 8, borderRadius: 4 },
  zoneName: { fontSize: 10, color: '#888' },
  zoneMinutes: { fontSize: 10, color: '#666' },
  activityGrid: { flexDirection: 'row', gap: 12 },
  activityItem: { flex: 1, alignItems: 'center' },
  activityValue: { fontSize: 24, fontWeight: 'bold' },
  activityLabel: { fontSize: 11, color: '#888', marginTop: 4 },
  progressBar: { width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 8 },
  progressFill: { height: '100%', borderRadius: 2 },
  sleepScoreBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  sleepScoreText: { fontSize: 14, fontWeight: 'bold' },
  sleepBreakdown: { flexDirection: 'row', height: 20, borderRadius: 10, overflow: 'hidden', marginTop: 16 },
  sleepBar: { height: '100%' },
  sleepLegend: { flexDirection: 'row', marginTop: 12, gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: '#888' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12, marginTop: 8 },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  vitalCard: { width: '47%', backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  vitalIcon: { fontSize: 24, marginBottom: 8 },
  vitalValue: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  vitalLabel: { fontSize: 11, color: '#888', marginTop: 4 },
  alertCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 2 },
  alertMessage: { fontSize: 14, color: '#FFFFFF' },
  devicesContent: { padding: 16, paddingBottom: 100 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, color: '#FFFFFF', fontWeight: '600', marginBottom: 20 },
  connectButton: { backgroundColor: DISCO_COLORS.neonCyan, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  connectButtonText: { color: '#000', fontWeight: 'bold' },
  deviceCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2 },
  deviceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  deviceIcon: { fontSize: 32, marginRight: 12 },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  deviceModel: { fontSize: 12, color: '#888' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  deviceMeta: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  deviceMetaText: { fontSize: 12, color: '#888' },
  deviceActions: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  actionButtonText: { color: '#000', fontWeight: 'bold', fontSize: 12 },
  connectContent: { padding: 16, paddingBottom: 100 },
  connectTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 },
  connectSubtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 24 },
  providerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 2 },
  providerIcon: { fontSize: 32, marginRight: 16 },
  providerName: { fontSize: 18, fontWeight: 'bold', flex: 1 },
  providerArrow: { fontSize: 24, color: '#888' },
});
