/**
 * JEDI Watch App Screen
 * Smartwatch simulator with disco styling
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import {
  jediWatchService,
  WatchDevice,
  PatientVitalsCard,
  MedicationReminder,
  TaskItem,
  ShiftInfo,
  WatchNotification,
} from '@/src/services/JEDIWatchService';
import { DISCO_COLORS, getGlowShadow } from '@/src/theme/DiscoTheme';

type WatchScreen = 'home' | 'vitals' | 'meds' | 'tasks' | 'alerts' | 'settings';

export default function JEDIWatchScreen() {
  const [currentScreen, setCurrentScreen] = useState<WatchScreen>('home');
  const [device, setDevice] = useState<WatchDevice | null>(null);
  const [vitals, setVitals] = useState<PatientVitalsCard[]>([]);
  const [meds, setMeds] = useState<MedicationReminder[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [shiftInfo, setShiftInfo] = useState<ShiftInfo | null>(null);
  const [notifications, setNotifications] = useState<WatchNotification[]>([]);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [glowAnim] = useState(new Animated.Value(0));

  const loadData = useCallback(() => {
    setDevice(jediWatchService.getDevice());
    setVitals(jediWatchService.getPatientVitalsCards());
    setMeds(jediWatchService.getMedicationReminders());
    setTasks(jediWatchService.getTaskList());
    setShiftInfo(jediWatchService.getShiftInfo());
    setNotifications(jediWatchService.getNotifications());
  }, []);

  useEffect(() => {
    jediWatchService.initialize().then(async () => {
      if (!jediWatchService.getDevice()) {
        await jediWatchService.pairDevice('apple_watch', 'Apple Watch Ultra 2', 'large');
      }
      loadData();
    });
    const unsubscribe = jediWatchService.subscribe(loadData);

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    ).start();

    return unsubscribe;
  }, [loadData, pulseAnim, glowAnim]);

  const formatTime = (minutes: number): string => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  const getAlertColor = (level: string): string => {
    switch (level) {
      case 'critical': return DISCO_COLORS.neonRed;
      case 'warning': return DISCO_COLORS.neonOrange;
      default: return DISCO_COLORS.neonGreen;
    }
  };

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'view_vitals': setCurrentScreen('vitals'); break;
      case 'view_medications': setCurrentScreen('meds'); break;
      case 'view_tasks': setCurrentScreen('tasks'); break;
      case 'code_blue':
        Alert.alert('Code Blue', 'Trigger Code Blue emergency?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', style: 'destructive', onPress: () => jediWatchService.triggerEmergencyAlert('blue', 'Current Location', 'Unknown') },
        ]);
        break;
      case 'emergency_sos':
        Alert.alert('SOS', 'Send emergency SOS signal?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send SOS', style: 'destructive', onPress: () => jediWatchService.triggerSOS() },
        ]);
        break;
      default:
        Alert.alert('Action', `Triggered: ${actionId}`);
    }
  };

  // Watch Face Home Screen
  const renderWatchHome = () => (
    <View style={styles.watchFace}>
      {/* Time Display */}
      <Text style={styles.watchTime}>
        {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
      </Text>
      <Text style={styles.watchDate}>
        {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
      </Text>

      {/* Complications Grid */}
      <View style={styles.complicationsGrid}>
        <TouchableOpacity style={[styles.complication, getGlowShadow(DISCO_COLORS.neonPink, 0.5)]} onPress={() => setCurrentScreen('vitals')}>
          <Text style={styles.compValue}>{vitals.length}</Text>
          <Text style={styles.compLabel}>Patients</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.complication, getGlowShadow(DISCO_COLORS.neonCyan, 0.5)]} onPress={() => setCurrentScreen('tasks')}>
          <Text style={styles.compValue}>{tasks.filter(t => !t.completed).length}</Text>
          <Text style={styles.compLabel}>Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.complication, getGlowShadow(DISCO_COLORS.neonGreen, 0.5)]} onPress={() => setCurrentScreen('meds')}>
          <Text style={styles.compValue}>{meds.filter(m => m.status === 'pending').length}</Text>
          <Text style={styles.compLabel}>Meds Due</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.complication, getGlowShadow(DISCO_COLORS.neonOrange, 0.5)]} onPress={() => setCurrentScreen('alerts')}>
          <Text style={styles.compValue}>{jediWatchService.getUnreadCount()}</Text>
          <Text style={styles.compLabel}>Alerts</Text>
        </TouchableOpacity>
      </View>

      {/* Shift Timer */}
      {shiftInfo && (
        <View style={styles.shiftTimer}>
          <Text style={styles.shiftLabel}>Shift Remaining</Text>
          <Text style={styles.shiftValue}>{formatTime(shiftInfo.remainingMinutes)}</Text>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActionsRow}>
        {jediWatchService.QUICK_ACTIONS.slice(0, 4).map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.quickAction, { backgroundColor: action.color + '40' }]}
            onPress={() => handleQuickAction(action.action)}
          >
            <Text style={styles.quickActionIcon}>{action.icon}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Vitals Screen
  const renderVitalsScreen = () => (
    <View style={styles.watchContent}>
      <View style={styles.watchHeader}>
        <TouchableOpacity onPress={() => setCurrentScreen('home')}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>❤️ Vitals</Text>
      </View>
      <ScrollView style={styles.watchScroll} showsVerticalScrollIndicator={false}>
        {vitals.map((patient) => (
          <Animated.View
            key={patient.patientId}
            style={[
              styles.vitalCard,
              { borderColor: getAlertColor(patient.alertLevel) },
              patient.alertLevel === 'critical' && { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View style={styles.vitalHeader}>
              <Text style={styles.vitalRoom}>{patient.room}</Text>
              <Text style={styles.vitalName}>{patient.patientName.split(' ')[0]}</Text>
              <View style={[styles.alertDot, { backgroundColor: getAlertColor(patient.alertLevel) }]} />
            </View>
            <View style={styles.vitalGrid}>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalIcon}>❤️</Text>
                <Text style={[styles.vitalValue, patient.heartRate > 100 && { color: DISCO_COLORS.neonRed }]}>{patient.heartRate}</Text>
              </View>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalIcon}>🩸</Text>
                <Text style={styles.vitalValue}>{patient.bloodPressure.systolic}/{patient.bloodPressure.diastolic}</Text>
              </View>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalIcon}>🌡️</Text>
                <Text style={[styles.vitalValue, patient.temperature > 37.5 && { color: DISCO_COLORS.neonOrange }]}>{patient.temperature}°</Text>
              </View>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalIcon}>💨</Text>
                <Text style={[styles.vitalValue, patient.oxygenSat < 94 && { color: DISCO_COLORS.neonRed }]}>{patient.oxygenSat}%</Text>
              </View>
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );

  // Medications Screen
  const renderMedsScreen = () => (
    <View style={styles.watchContent}>
      <View style={styles.watchHeader}>
        <TouchableOpacity onPress={() => setCurrentScreen('home')}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>💊 Meds</Text>
      </View>
      <ScrollView style={styles.watchScroll} showsVerticalScrollIndicator={false}>
        {meds.map((med) => (
          <View
            key={med.id}
            style={[
              styles.medCard,
              med.status === 'missed' && { borderColor: DISCO_COLORS.neonRed },
            ]}
          >
            <View style={styles.medHeader}>
              <Text style={styles.medRoom}>{med.room}</Text>
              <Text style={[styles.medStatus, { color: med.status === 'missed' ? DISCO_COLORS.neonRed : DISCO_COLORS.neonGreen }]}>
                {med.status === 'missed' ? '⚠️ OVERDUE' : '⏰'}
              </Text>
            </View>
            <Text style={styles.medName}>{med.medicationName}</Text>
            <Text style={styles.medDosage}>{med.dosage} {med.route}</Text>
            <TouchableOpacity style={styles.adminButton}>
              <Text style={styles.adminButtonText}>✓ Administer</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  // Tasks Screen
  const renderTasksScreen = () => (
    <View style={styles.watchContent}>
      <View style={styles.watchHeader}>
        <TouchableOpacity onPress={() => setCurrentScreen('home')}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>✓ Tasks</Text>
      </View>
      <ScrollView style={styles.watchScroll} showsVerticalScrollIndicator={false}>
        {tasks.filter(t => !t.completed).map((task) => (
          <View
            key={task.id}
            style={[
              styles.taskCard,
              task.priority === 'urgent' && { borderColor: DISCO_COLORS.neonRed },
              task.priority === 'high' && { borderColor: DISCO_COLORS.neonOrange },
            ]}
          >
            <View style={styles.taskHeader}>
              <View style={[styles.priorityBadge, { backgroundColor: task.priority === 'urgent' ? DISCO_COLORS.neonRed : task.priority === 'high' ? DISCO_COLORS.neonOrange : DISCO_COLORS.neonCyan }]}>
                <Text style={styles.priorityText}>{task.priority.toUpperCase()}</Text>
              </View>
              {task.room && <Text style={styles.taskRoom}>{task.room}</Text>}
            </View>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <TouchableOpacity style={styles.completeButton}>
              <Text style={styles.completeButtonText}>✓ Complete</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  // Alerts Screen
  const renderAlertsScreen = () => (
    <View style={styles.watchContent}>
      <View style={styles.watchHeader}>
        <TouchableOpacity onPress={() => setCurrentScreen('home')}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>🔔 Alerts</Text>
      </View>
      <ScrollView style={styles.watchScroll} showsVerticalScrollIndicator={false}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✓</Text>
            <Text style={styles.emptyText}>No alerts</Text>
          </View>
        ) : (
          notifications.slice(0, 5).map((notif) => (
            <TouchableOpacity
              key={notif.id}
              style={[
                styles.alertCard,
                notif.priority === 'critical' && { borderColor: DISCO_COLORS.neonRed },
                !notif.read && { backgroundColor: DISCO_COLORS.neonPink + '20' },
              ]}
              onPress={() => jediWatchService.markNotificationRead(notif.id)}
            >
              <Text style={styles.alertIcon}>{notif.icon}</Text>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{notif.title}</Text>
                <Text style={styles.alertBody} numberOfLines={2}>{notif.body}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );

  // Settings Screen
  const renderSettingsScreen = () => (
    <View style={styles.watchContent}>
      <View style={styles.watchHeader}>
        <TouchableOpacity onPress={() => setCurrentScreen('home')}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>⚙️ Settings</Text>
      </View>
      <ScrollView style={styles.watchScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Device</Text>
          <Text style={styles.settingValue}>{device?.model || 'Not paired'}</Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Battery</Text>
          <Text style={[styles.settingValue, (device?.batteryLevel || 0) < 20 && { color: DISCO_COLORS.neonRed }]}>
            {device?.batteryLevel || 0}%
          </Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Theme</Text>
          <Text style={styles.settingValue}>🕺 Disco</Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Haptics</Text>
          <Text style={styles.settingValue}>Enabled</Text>
        </View>
        <TouchableOpacity style={styles.syncButton} onPress={() => jediWatchService.syncDevice()}>
          <Text style={styles.syncButtonText}>🔄 Sync Now</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'vitals': return renderVitalsScreen();
      case 'meds': return renderMedsScreen();
      case 'tasks': return renderTasksScreen();
      case 'alerts': return renderAlertsScreen();
      case 'settings': return renderSettingsScreen();
      default: return renderWatchHome();
    }
  };

  return (
    <ScreenContainer containerClassName="bg-[#0D0D0D]">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>⌚</Text>
        <Text style={styles.headerTitle}>JEDI WATCH</Text>
        <Text style={styles.headerSubtitle}>Smartwatch Preview</Text>
      </View>

      {/* Watch Simulator */}
      <View style={styles.watchContainer}>
        <Animated.View style={[styles.watchFrame, getGlowShadow(DISCO_COLORS.neonPink, 0.8)]}>
          <View style={styles.watchBezel}>
            <View style={styles.watchScreen}>
              {renderCurrentScreen()}
            </View>
          </View>
          {/* Digital Crown */}
          <View style={styles.digitalCrown} />
          {/* Side Button */}
          <TouchableOpacity style={styles.sideButton} onPress={() => setCurrentScreen('settings')} />
        </Animated.View>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {(['home', 'vitals', 'meds', 'tasks', 'alerts'] as WatchScreen[]).map((screen) => (
          <TouchableOpacity
            key={screen}
            style={[styles.navItem, currentScreen === screen && styles.navItemActive]}
            onPress={() => setCurrentScreen(screen)}
          >
            <Text style={styles.navIcon}>
              {screen === 'home' ? '🏠' : screen === 'vitals' ? '❤️' : screen === 'meds' ? '💊' : screen === 'tasks' ? '✓' : '🔔'}
            </Text>
            <Text style={[styles.navLabel, currentScreen === screen && styles.navLabelActive]}>
              {screen.charAt(0).toUpperCase() + screen.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Device Info */}
      {device && (
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceText}>
            {device.model} • {device.batteryLevel}% 🔋 • {device.isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingVertical: 12, backgroundColor: DISCO_COLORS.midnightPurple },
  headerEmoji: { fontSize: 28 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2 },
  headerSubtitle: { fontSize: 10, color: DISCO_COLORS.neonCyan, letterSpacing: 2 },
  watchContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  watchFrame: { width: 220, height: 260, backgroundColor: '#1A1A1A', borderRadius: 44, padding: 8, position: 'relative' },
  watchBezel: { flex: 1, backgroundColor: '#000', borderRadius: 38, overflow: 'hidden', borderWidth: 2, borderColor: '#333' },
  watchScreen: { flex: 1, backgroundColor: DISCO_COLORS.darkDisco },
  digitalCrown: { position: 'absolute', right: -6, top: 60, width: 12, height: 40, backgroundColor: '#444', borderRadius: 6 },
  sideButton: { position: 'absolute', right: -6, top: 120, width: 12, height: 24, backgroundColor: '#555', borderRadius: 4 },
  watchFace: { flex: 1, padding: 12, alignItems: 'center' },
  watchTime: { fontSize: 42, fontWeight: '200', color: '#FFFFFF', letterSpacing: -2 },
  watchDate: { fontSize: 12, color: DISCO_COLORS.neonCyan, marginBottom: 12 },
  complicationsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  complication: { width: 70, height: 50, backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  compValue: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  compLabel: { fontSize: 8, color: '#888' },
  shiftTimer: { alignItems: 'center', marginBottom: 12 },
  shiftLabel: { fontSize: 9, color: '#888' },
  shiftValue: { fontSize: 16, fontWeight: 'bold', color: DISCO_COLORS.neonGreen },
  quickActionsRow: { flexDirection: 'row', gap: 8 },
  quickAction: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  quickActionIcon: { fontSize: 16 },
  watchContent: { flex: 1 },
  watchHeader: { flexDirection: 'row', alignItems: 'center', padding: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  backButton: { fontSize: 20, color: DISCO_COLORS.neonCyan, marginRight: 8 },
  screenTitle: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' },
  watchScroll: { flex: 1, padding: 8 },
  vitalCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 12, padding: 10, marginBottom: 8, borderWidth: 2, borderColor: DISCO_COLORS.neonGreen },
  vitalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  vitalRoom: { fontSize: 11, fontWeight: 'bold', color: DISCO_COLORS.neonCyan, backgroundColor: DISCO_COLORS.neonCyan + '30', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  vitalName: { flex: 1, fontSize: 11, color: '#FFFFFF', marginLeft: 6 },
  alertDot: { width: 8, height: 8, borderRadius: 4 },
  vitalGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  vitalItem: { alignItems: 'center' },
  vitalIcon: { fontSize: 12 },
  vitalValue: { fontSize: 12, fontWeight: 'bold', color: '#FFFFFF' },
  medCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 12, padding: 10, marginBottom: 8, borderWidth: 2, borderColor: DISCO_COLORS.neonGreen },
  medHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  medRoom: { fontSize: 10, color: DISCO_COLORS.neonCyan },
  medStatus: { fontSize: 10, fontWeight: 'bold' },
  medName: { fontSize: 13, fontWeight: 'bold', color: '#FFFFFF' },
  medDosage: { fontSize: 11, color: '#888', marginBottom: 6 },
  adminButton: { backgroundColor: DISCO_COLORS.neonGreen, borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  adminButtonText: { fontSize: 11, fontWeight: 'bold', color: '#000' },
  taskCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 12, padding: 10, marginBottom: 8, borderWidth: 2, borderColor: DISCO_COLORS.neonCyan },
  taskHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  priorityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  priorityText: { fontSize: 8, fontWeight: 'bold', color: '#000' },
  taskRoom: { fontSize: 10, color: '#888', marginLeft: 6 },
  taskTitle: { fontSize: 12, color: '#FFFFFF', marginBottom: 6 },
  completeButton: { backgroundColor: DISCO_COLORS.neonCyan, borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  completeButtonText: { fontSize: 11, fontWeight: 'bold', color: '#000' },
  alertCard: { flexDirection: 'row', backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 12, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  alertIcon: { fontSize: 20, marginRight: 8 },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 12, fontWeight: 'bold', color: '#FFFFFF' },
  alertBody: { fontSize: 10, color: '#888' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 32, color: DISCO_COLORS.neonGreen },
  emptyText: { fontSize: 12, color: '#888', marginTop: 8 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  settingLabel: { fontSize: 12, color: '#888' },
  settingValue: { fontSize: 12, color: '#FFFFFF' },
  syncButton: { backgroundColor: DISCO_COLORS.neonCyan, borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 16 },
  syncButtonText: { fontSize: 12, fontWeight: 'bold', color: '#000' },
  bottomNav: { flexDirection: 'row', backgroundColor: DISCO_COLORS.darkDisco, paddingVertical: 8, borderTopWidth: 1, borderTopColor: DISCO_COLORS.neonPink + '40' },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  navItemActive: { borderTopWidth: 2, borderTopColor: DISCO_COLORS.neonPink },
  navIcon: { fontSize: 16 },
  navLabel: { fontSize: 9, color: '#888', marginTop: 2 },
  navLabelActive: { color: DISCO_COLORS.neonPink },
  deviceInfo: { backgroundColor: DISCO_COLORS.midnightPurple, paddingVertical: 8, alignItems: 'center' },
  deviceText: { fontSize: 10, color: '#888' },
});
