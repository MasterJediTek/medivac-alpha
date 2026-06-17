/**
 * Smart Scheduling Optimization Screen
 * AI-powered appointment scheduling dashboard
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  smartSchedulingService,
  SchedulingDashboard,
  Appointment,
  Provider,
  Patient,
  SlotSuggestion,
  ScheduleConflict,
  ScheduleOptimization,
} from '@/src/services/SmartSchedulingService';

type ViewMode = 'dashboard' | 'schedule' | 'book' | 'providers';

export default function SmartSchedulingScreen() {
  const colors = useColors();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [dashboard, setDashboard] = useState<SchedulingDashboard | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [slotSuggestions, setSlotSuggestions] = useState<SlotSuggestion[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    setDashboard(smartSchedulingService.getDashboard());
    setProviders(smartSchedulingService.getProviders());
    setPatients(smartSchedulingService.getPatients());
  }, []);

  useEffect(() => {
    smartSchedulingService.initialize();
    loadData();
    const unsubscribe = smartSchedulingService.subscribe(loadData);
    return unsubscribe;
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 500);
  }, [loadData]);

  const handleBookAppointment = async (suggestion: SlotSuggestion) => {
    if (!selectedPatient) {
      Alert.alert('Error', 'Please select a patient first');
      return;
    }

    try {
      await smartSchedulingService.scheduleAppointment(
        selectedPatient.id,
        suggestion.providerId,
        'consultation',
        suggestion.slot.start,
        'General consultation'
      );
      Alert.alert('Success', `Appointment scheduled with ${suggestion.providerName}`);
      setSlotSuggestions([]);
      setSelectedPatient(null);
      setViewMode('dashboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule appointment');
    }
  };

  const handleGetSuggestions = (patient: Patient) => {
    setSelectedPatient(patient);
    const suggestions = smartSchedulingService.getSlotSuggestions(
      patient.id,
      patient.preferredProvider || null,
      'consultation',
      Date.now()
    );
    setSlotSuggestions(suggestions);
  };

  const handleCheckIn = async (appointmentId: string) => {
    await smartSchedulingService.updateAppointmentStatus(appointmentId, 'checked_in');
    Alert.alert('Success', 'Patient checked in');
  };

  const handleCancel = async (appointmentId: string) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            await smartSchedulingService.cancelAppointment(appointmentId, 'Patient requested');
          },
        },
      ]
    );
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const renderDashboard = () => {
    if (!dashboard) return null;

    return (
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.dashboardContent}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{dashboard.todayAppointments}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Today</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: '#22C55E' }]}>{dashboard.metrics.completedToday}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Completed</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{dashboard.metrics.averageWaitTime}m</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Avg Wait</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{dashboard.metrics.noShowRate}%</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>No-Show</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
              onPress={() => setViewMode('book')}
            >
              <Text style={styles.actionIcon}>📅</Text>
              <Text style={styles.actionText}>Book New</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#22C55E' }]}
              onPress={() => setViewMode('schedule')}
            >
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionText}>Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#8B5CF6' }]}
              onPress={() => setViewMode('providers')}
            >
              <Text style={styles.actionIcon}>👨‍⚕️</Text>
              <Text style={styles.actionText}>Providers</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Conflicts */}
        {dashboard.conflicts.length > 0 && (
          <View style={[styles.section, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[styles.sectionTitle, { color: '#991B1B' }]}>⚠️ Scheduling Conflicts</Text>
            {dashboard.conflicts.slice(0, 3).map((conflict) => (
              <View key={conflict.id} style={styles.conflictItem}>
                <Text style={[styles.conflictType, { color: '#B91C1C' }]}>{conflict.type.replace('_', ' ').toUpperCase()}</Text>
                <Text style={[styles.conflictDesc, { color: '#991B1B' }]}>{conflict.description}</Text>
                <Text style={[styles.conflictResolution, { color: '#7F1D1D' }]}>→ {conflict.suggestedResolution}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Optimizations */}
        {dashboard.optimizations.length > 0 && (
          <View style={[styles.section, { backgroundColor: '#DBEAFE' }]}>
            <Text style={[styles.sectionTitle, { color: '#1E40AF' }]}>💡 AI Optimization Suggestions</Text>
            {dashboard.optimizations.slice(0, 3).map((opt) => (
              <View key={opt.id} style={styles.optItem}>
                <Text style={[styles.optReason, { color: '#1E3A8A' }]}>{opt.reason}</Text>
                <View style={styles.optSavings}>
                  {opt.savings.waitTime > 0 && (
                    <Text style={[styles.savingBadge, { backgroundColor: '#22C55E20', color: '#22C55E' }]}>
                      -{opt.savings.waitTime}m wait
                    </Text>
                  )}
                  {opt.savings.resourceUtilization > 0 && (
                    <Text style={[styles.savingBadge, { backgroundColor: '#3B82F620', color: '#3B82F6' }]}>
                      +{opt.savings.resourceUtilization}% util
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Upcoming Today */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Upcoming Today</Text>
          {dashboard.upcomingToday.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>No more appointments today</Text>
          ) : (
            dashboard.upcomingToday.slice(0, 5).map((apt) => (
              <View key={apt.id} style={styles.aptItem}>
                <View style={styles.aptTime}>
                  <Text style={[styles.aptTimeText, { color: colors.primary }]}>{formatTime(apt.scheduledStart)}</Text>
                </View>
                <View style={styles.aptInfo}>
                  <Text style={[styles.aptPatient, { color: colors.foreground }]}>{apt.patientName}</Text>
                  <Text style={[styles.aptProvider, { color: colors.muted }]}>{apt.providerName}</Text>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: smartSchedulingService.getAppointmentTypeColor(apt.type) + '20' }]}>
                  <Text style={[styles.typeText, { color: smartSchedulingService.getAppointmentTypeColor(apt.type) }]}>
                    {apt.type}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Provider Availability */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Provider Availability</Text>
          {providers.map((provider) => {
            const available = dashboard.providerAvailability.get(provider.id) || 0;
            const utilization = dashboard.metrics.providerUtilization.get(provider.id) || 0;
            return (
              <View key={provider.id} style={styles.providerRow}>
                <View style={styles.providerInfo}>
                  <Text style={[styles.providerName, { color: colors.foreground }]}>{provider.name}</Text>
                  <Text style={[styles.providerSpec, { color: colors.muted }]}>{provider.specialty}</Text>
                </View>
                <View style={styles.providerStats}>
                  <Text style={[styles.availableSlots, { color: available > 5 ? '#22C55E' : '#F59E0B' }]}>
                    {available} slots
                  </Text>
                  <View style={[styles.utilizationBar, { backgroundColor: colors.background }]}>
                    <View
                      style={[
                        styles.utilizationFill,
                        { width: `${utilization}%`, backgroundColor: utilization > 80 ? '#EF4444' : '#22C55E' },
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  const renderSchedule = () => {
    const todayAppointments = smartSchedulingService.getTodayAppointments();

    return (
      <FlatList
        data={todayAppointments}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyIcon, { color: colors.muted }]}>📅</Text>
            <Text style={[styles.emptyStateText, { color: colors.muted }]}>No appointments today</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.scheduleCard, { backgroundColor: colors.surface }]}>
            <View style={styles.scheduleHeader}>
              <View style={styles.scheduleTime}>
                <Text style={[styles.scheduleTimeText, { color: colors.primary }]}>{formatTime(item.scheduledStart)}</Text>
                <Text style={[styles.scheduleDuration, { color: colors.muted }]}>{item.duration} min</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: smartSchedulingService.getStatusColor(item.status) + '20' }]}>
                <Text style={[styles.statusText, { color: smartSchedulingService.getStatusColor(item.status) }]}>
                  {item.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.scheduleBody}>
              <Text style={[styles.schedulePatient, { color: colors.foreground }]}>{item.patientName}</Text>
              <Text style={[styles.scheduleProvider, { color: colors.muted }]}>{item.providerName}</Text>
              <Text style={[styles.scheduleReason, { color: colors.muted }]}>{item.reason}</Text>
            </View>

            <View style={[styles.typeBadge, { backgroundColor: smartSchedulingService.getAppointmentTypeColor(item.type) + '20', alignSelf: 'flex-start' }]}>
              <Text style={[styles.typeText, { color: smartSchedulingService.getAppointmentTypeColor(item.type) }]}>
                {item.type}
              </Text>
            </View>

            {item.status === 'scheduled' && (
              <View style={styles.scheduleActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#22C55E' }]}
                  onPress={() => handleCheckIn(item.id)}
                >
                  <Text style={styles.actionButtonText}>Check In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
                  onPress={() => handleCancel(item.id)}
                >
                  <Text style={styles.actionButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
    );
  };

  const renderBook = () => (
    <ScrollView contentContainerStyle={styles.bookContent}>
      {/* Patient Selection */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Select Patient</Text>
        {patients.map((patient) => (
          <TouchableOpacity
            key={patient.id}
            style={[
              styles.patientCard,
              selectedPatient?.id === patient.id && { borderColor: colors.primary, borderWidth: 2 },
            ]}
            onPress={() => handleGetSuggestions(patient)}
          >
            <View style={styles.patientInfo}>
              <Text style={[styles.patientName, { color: colors.foreground }]}>{patient.name}</Text>
              <Text style={[styles.patientDob, { color: colors.muted }]}>DOB: {patient.dateOfBirth}</Text>
            </View>
            <View style={[styles.acuityBadge, { backgroundColor: patient.acuity === 'high' ? '#FEE2E2' : patient.acuity === 'medium' ? '#FEF3C7' : '#DCFCE7' }]}>
              <Text style={[styles.acuityText, { color: patient.acuity === 'high' ? '#991B1B' : patient.acuity === 'medium' ? '#92400E' : '#166534' }]}>
                {patient.acuity.toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Slot Suggestions */}
      {slotSuggestions.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            AI-Recommended Slots for {selectedPatient?.name}
          </Text>
          {slotSuggestions.map((suggestion, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.slotCard, { backgroundColor: colors.background }]}
              onPress={() => handleBookAppointment(suggestion)}
            >
              <View style={styles.slotHeader}>
                <View>
                  <Text style={[styles.slotDate, { color: colors.foreground }]}>{formatDate(suggestion.slot.start)}</Text>
                  <Text style={[styles.slotTime, { color: colors.primary }]}>{formatTime(suggestion.slot.start)}</Text>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: suggestion.score >= 80 ? '#22C55E' : suggestion.score >= 60 ? '#F59E0B' : '#6B7280' }]}>
                  <Text style={styles.scoreText}>{suggestion.score}%</Text>
                </View>
              </View>
              <Text style={[styles.slotProvider, { color: colors.muted }]}>{suggestion.providerName}</Text>
              <View style={styles.slotReasons}>
                {suggestion.reasons.map((reason, rIdx) => (
                  <Text key={rIdx} style={[styles.reasonText, { color: '#22C55E' }]}>✓ {reason}</Text>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderProviders = () => (
    <FlatList
      data={providers}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => {
        const todaySchedule = smartSchedulingService.getProviderSchedule(item.id, Date.now());
        return (
          <View style={[styles.providerCard, { backgroundColor: colors.surface }]}>
            <View style={styles.providerHeader}>
              <View>
                <Text style={[styles.providerCardName, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.providerCredentials, { color: colors.muted }]}>{item.credentials}</Text>
              </View>
              <View style={[styles.specialtyBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.specialtyText, { color: colors.primary }]}>{item.specialty}</Text>
              </View>
            </View>

            <View style={styles.providerMeta}>
              <View style={styles.metaItem}>
                <Text style={[styles.metaValue, { color: colors.foreground }]}>{todaySchedule.length}</Text>
                <Text style={[styles.metaLabel, { color: colors.muted }]}>Today</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={[styles.metaValue, { color: colors.foreground }]}>{item.maxDailyPatients}</Text>
                <Text style={[styles.metaLabel, { color: colors.muted }]}>Max/Day</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={[styles.metaValue, { color: colors.foreground }]}>{item.preferredBreakTime}</Text>
                <Text style={[styles.metaLabel, { color: colors.muted }]}>Break</Text>
              </View>
            </View>

            <View style={styles.skillsContainer}>
              {item.skills.map((skill, idx) => (
                <View key={idx} style={[styles.skillBadge, { backgroundColor: colors.background }]}>
                  <Text style={[styles.skillText, { color: colors.muted }]}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      }}
    />
  );

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Smart Scheduling</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>AI-Optimized Appointments</Text>
      </View>

      <View style={[styles.viewToggle, { backgroundColor: colors.surface }]}>
        {(['dashboard', 'schedule', 'book', 'providers'] as ViewMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.toggleBtn, viewMode === mode && { backgroundColor: colors.primary }]}
            onPress={() => setViewMode(mode)}
          >
            <Text style={[styles.toggleText, { color: viewMode === mode ? '#FFFFFF' : colors.foreground }]}>
              {mode === 'dashboard' ? '📊' : mode === 'schedule' ? '📋' : mode === 'book' ? '➕' : '👨‍⚕️'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {viewMode === 'dashboard' && renderDashboard()}
      {viewMode === 'schedule' && renderSchedule()}
      {viewMode === 'book' && renderBook()}
      {viewMode === 'providers' && renderProviders()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginTop: 4 },
  viewToggle: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 8, padding: 4, marginBottom: 12 },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  toggleText: { fontSize: 18 },
  dashboardContent: { padding: 16, paddingBottom: 100 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { width: '47%', padding: 16, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 4 },
  section: { padding: 16, borderRadius: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  actionGrid: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  actionIcon: { fontSize: 24, marginBottom: 8 },
  actionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  conflictItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)' },
  conflictType: { fontSize: 12, fontWeight: '600' },
  conflictDesc: { fontSize: 14, marginTop: 4 },
  conflictResolution: { fontSize: 13, marginTop: 4, fontStyle: 'italic' },
  optItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)' },
  optReason: { fontSize: 14 },
  optSavings: { flexDirection: 'row', gap: 8, marginTop: 8 },
  savingBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, fontSize: 11 },
  aptItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  aptTime: { width: 60 },
  aptTimeText: { fontSize: 14, fontWeight: '600' },
  aptInfo: { flex: 1, marginLeft: 12 },
  aptPatient: { fontSize: 14, fontWeight: '500' },
  aptProvider: { fontSize: 12, marginTop: 2 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  typeText: { fontSize: 10, fontWeight: '600' },
  providerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 14, fontWeight: '500' },
  providerSpec: { fontSize: 12, marginTop: 2 },
  providerStats: { alignItems: 'flex-end' },
  availableSlots: { fontSize: 13, fontWeight: '600' },
  utilizationBar: { width: 60, height: 6, borderRadius: 3, marginTop: 4 },
  utilizationFill: { height: '100%', borderRadius: 3 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  listContent: { padding: 16, paddingBottom: 100 },
  emptyState: { alignItems: 'center', padding: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyStateText: { fontSize: 16 },
  scheduleCard: { padding: 16, borderRadius: 12, marginBottom: 12 },
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  scheduleTime: {},
  scheduleTimeText: { fontSize: 20, fontWeight: 'bold' },
  scheduleDuration: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '600' },
  scheduleBody: { marginBottom: 12 },
  schedulePatient: { fontSize: 16, fontWeight: '600' },
  scheduleProvider: { fontSize: 14, marginTop: 4 },
  scheduleReason: { fontSize: 13, marginTop: 4 },
  scheduleActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  actionButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  bookContent: { padding: 16, paddingBottom: 100 },
  patientCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  patientInfo: {},
  patientName: { fontSize: 14, fontWeight: '500' },
  patientDob: { fontSize: 12, marginTop: 2 },
  acuityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  acuityText: { fontSize: 10, fontWeight: '600' },
  slotCard: { padding: 12, borderRadius: 8, marginBottom: 12 },
  slotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  slotDate: { fontSize: 14, fontWeight: '500' },
  slotTime: { fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  scoreText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  slotProvider: { fontSize: 13, marginBottom: 8 },
  slotReasons: { gap: 4 },
  reasonText: { fontSize: 12 },
  providerCard: { padding: 16, borderRadius: 12, marginBottom: 12 },
  providerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  providerCardName: { fontSize: 18, fontWeight: '600' },
  providerCredentials: { fontSize: 13, marginTop: 2 },
  specialtyBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  specialtyText: { fontSize: 12, fontWeight: '600' },
  providerMeta: { flexDirection: 'row', gap: 24, marginBottom: 16 },
  metaItem: { alignItems: 'center' },
  metaValue: { fontSize: 20, fontWeight: 'bold' },
  metaLabel: { fontSize: 11, marginTop: 2 },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  skillText: { fontSize: 11 },
});
