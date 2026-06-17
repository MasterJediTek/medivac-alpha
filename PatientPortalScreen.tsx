/**
 * Patient Portal Screen
 * Extreme Disco Styled Patient Interface
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
  Animated,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import {
  patientPortalService,
  PatientProfile,
  PortalAppointment,
  LabResult,
  PortalMessage,
  Medication,
  HealthSummary,
} from '@/src/services/PatientPortalService';
import { DISCO_COLORS, DISCO_STYLES, getGlowShadow, getNeonTextStyle } from '@/src/theme/DiscoTheme';

type PortalTab = 'dashboard' | 'appointments' | 'results' | 'messages' | 'medications' | 'profile';

export default function PatientPortalScreen() {
  const [activeTab, setActiveTab] = useState<PortalTab>('dashboard');
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<PortalAppointment[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  const loadData = useCallback(() => {
    setProfile(patientPortalService.getProfile());
    setAppointments(patientPortalService.getUpcomingAppointments());
    setLabResults(patientPortalService.getLabResults());
    setMessages(patientPortalService.getMessages());
    setMedications(patientPortalService.getMedications());
    setHealthSummary(patientPortalService.getHealthSummary());
  }, []);

  useEffect(() => {
    patientPortalService.initialize();
    loadData();
    const unsubscribe = patientPortalService.subscribe(loadData);

    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    return unsubscribe;
  }, [loadData, pulseAnim]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 500);
  }, [loadData]);

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleRequestRefill = async (medicationId: string) => {
    try {
      await patientPortalService.requestRefill(medicationId);
      Alert.alert('🎉 Groovy!', 'Refill request submitted! Your pharmacy will be notified.');
    } catch (error) {
      Alert.alert('Oops!', 'Could not submit refill request.');
    }
  };

  const getFlagColor = (flag: string): string => {
    switch (flag) {
      case 'normal': return DISCO_COLORS.neonGreen;
      case 'low': return DISCO_COLORS.neonCyan;
      case 'high': return DISCO_COLORS.neonOrange;
      case 'critical': return DISCO_COLORS.neonRed;
      default: return DISCO_COLORS.neonPink;
    }
  };

  const renderDashboard = () => {
    if (!healthSummary || !profile) return null;

    return (
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DISCO_COLORS.neonPink} />}
        contentContainerStyle={styles.dashboardContent}
      >
        {/* Welcome Banner */}
        <Animated.View style={[styles.welcomeBanner, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.welcomeEmoji}>🪩</Text>
          <Text style={styles.welcomeText}>Welcome back, {profile.firstName}!</Text>
          <Text style={styles.welcomeSubtext}>Let's get groovy with your health</Text>
        </Animated.View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderColor: DISCO_COLORS.neonPink }, getGlowShadow(DISCO_COLORS.neonPink)]}>
            <Text style={styles.statEmoji}>📅</Text>
            <Text style={[styles.statValue, getNeonTextStyle(DISCO_COLORS.neonPink)]}>{healthSummary.upcomingAppointments}</Text>
            <Text style={styles.statLabel}>Appointments</Text>
          </View>
          <View style={[styles.statCard, { borderColor: DISCO_COLORS.neonCyan }, getGlowShadow(DISCO_COLORS.neonCyan)]}>
            <Text style={styles.statEmoji}>💬</Text>
            <Text style={[styles.statValue, getNeonTextStyle(DISCO_COLORS.neonCyan)]}>{healthSummary.unreadMessages}</Text>
            <Text style={styles.statLabel}>Messages</Text>
          </View>
          <View style={[styles.statCard, { borderColor: DISCO_COLORS.neonPurple }, getGlowShadow(DISCO_COLORS.neonPurple)]}>
            <Text style={styles.statEmoji}>🧪</Text>
            <Text style={[styles.statValue, getNeonTextStyle(DISCO_COLORS.neonPurple)]}>{healthSummary.newResults}</Text>
            <Text style={styles.statLabel}>New Results</Text>
          </View>
          <View style={[styles.statCard, { borderColor: DISCO_COLORS.neonGreen }, getGlowShadow(DISCO_COLORS.neonGreen)]}>
            <Text style={styles.statEmoji}>💊</Text>
            <Text style={[styles.statValue, getNeonTextStyle(DISCO_COLORS.neonGreen)]}>{healthSummary.pendingRefills}</Text>
            <Text style={styles.statLabel}>Refills</Text>
          </View>
        </View>

        {/* Health Trends */}
        <View style={[styles.discoCard, getGlowShadow(DISCO_COLORS.neonPink)]}>
          <Text style={styles.sectionTitle}>🩺 Health Trends</Text>
          <View style={styles.trendRow}>
            <View style={styles.trendItem}>
              <Text style={styles.trendLabel}>Blood Pressure</Text>
              <Text style={[styles.trendValue, { color: DISCO_COLORS.neonGreen }]}>
                {healthSummary.vitalsTrend.bloodPressure[healthSummary.vitalsTrend.bloodPressure.length - 1]?.systolic}/
                {healthSummary.vitalsTrend.bloodPressure[healthSummary.vitalsTrend.bloodPressure.length - 1]?.diastolic}
              </Text>
              <Text style={styles.trendChange}>↓ Improving</Text>
            </View>
            <View style={styles.trendItem}>
              <Text style={styles.trendLabel}>Weight</Text>
              <Text style={[styles.trendValue, { color: DISCO_COLORS.neonCyan }]}>
                {healthSummary.vitalsTrend.weight[healthSummary.vitalsTrend.weight.length - 1]?.value} lbs
              </Text>
              <Text style={styles.trendChange}>↓ -6 lbs</Text>
            </View>
            <View style={styles.trendItem}>
              <Text style={styles.trendLabel}>Heart Rate</Text>
              <Text style={[styles.trendValue, { color: DISCO_COLORS.neonPurple }]}>
                {healthSummary.vitalsTrend.heartRate[healthSummary.vitalsTrend.heartRate.length - 1]?.value} bpm
              </Text>
              <Text style={styles.trendChange}>↓ Stable</Text>
            </View>
          </View>
        </View>

        {/* Upcoming Appointment */}
        {appointments.length > 0 && (
          <View style={[styles.discoCard, getGlowShadow(DISCO_COLORS.neonCyan)]}>
            <Text style={styles.sectionTitle}>📅 Next Appointment</Text>
            <View style={styles.appointmentPreview}>
              <Text style={styles.appointmentDate}>{formatDate(appointments[0].scheduledDate)}</Text>
              <Text style={styles.appointmentTime}>{formatTime(appointments[0].scheduledDate)}</Text>
              <Text style={styles.appointmentProvider}>{appointments[0].providerName}</Text>
              <Text style={styles.appointmentType}>{appointments[0].type === 'telemedicine' ? '📹 Video Visit' : '🏥 In-Person'}</Text>
            </View>
          </View>
        )}

        {/* Allergies & Conditions */}
        <View style={[styles.discoCard, getGlowShadow(DISCO_COLORS.neonOrange)]}>
          <Text style={styles.sectionTitle}>⚠️ Important Info</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Allergies</Text>
              <View style={styles.tagContainer}>
                {healthSummary.allergies.map((allergy, idx) => (
                  <View key={idx} style={[styles.allergyTag, { backgroundColor: DISCO_COLORS.neonRed + '40' }]}>
                    <Text style={[styles.tagText, { color: DISCO_COLORS.neonRed }]}>{allergy}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Conditions</Text>
              <View style={styles.tagContainer}>
                {healthSummary.conditions.map((condition, idx) => (
                  <View key={idx} style={[styles.conditionTag, { backgroundColor: DISCO_COLORS.neonPurple + '40' }]}>
                    <Text style={[styles.tagText, { color: DISCO_COLORS.neonPurple }]}>{condition}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderAppointments = () => (
    <FlatList
      data={appointments}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DISCO_COLORS.neonPink} />}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🪩</Text>
          <Text style={styles.emptyText}>No upcoming appointments</Text>
          <Text style={styles.emptySubtext}>Time to book your next disco... I mean, checkup!</Text>
        </View>
      }
      renderItem={({ item, index }) => (
        <View style={[styles.appointmentCard, { borderColor: index % 2 === 0 ? DISCO_COLORS.neonPink : DISCO_COLORS.neonCyan }, getGlowShadow(index % 2 === 0 ? DISCO_COLORS.neonPink : DISCO_COLORS.neonCyan)]}>
          <View style={styles.appointmentHeader}>
            <View>
              <Text style={styles.appointmentCardDate}>{formatDate(item.scheduledDate)}</Text>
              <Text style={styles.appointmentCardTime}>{formatTime(item.scheduledDate)}</Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: item.type === 'telemedicine' ? DISCO_COLORS.neonCyan + '40' : DISCO_COLORS.neonPink + '40' }]}>
              <Text style={[styles.typeText, { color: item.type === 'telemedicine' ? DISCO_COLORS.neonCyan : DISCO_COLORS.neonPink }]}>
                {item.type === 'telemedicine' ? '📹 Video' : '🏥 In-Person'}
              </Text>
            </View>
          </View>
          <Text style={styles.providerName}>{item.providerName}</Text>
          <Text style={styles.providerSpecialty}>{item.providerSpecialty}</Text>
          <Text style={styles.appointmentReason}>{item.reason}</Text>
          {item.location && <Text style={styles.appointmentLocation}>📍 {item.location}</Text>}
          {item.canCancel && (
            <View style={styles.appointmentActions}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: DISCO_COLORS.neonCyan }]}>
                <Text style={styles.actionBtnText}>Reschedule</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: DISCO_COLORS.neonRed }]}>
                <Text style={styles.actionBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    />
  );

  const renderResults = () => (
    <FlatList
      data={labResults}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DISCO_COLORS.neonPink} />}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.resultCard, { borderColor: getFlagColor(item.flag) }, getGlowShadow(getFlagColor(item.flag))]}
          onPress={() => patientPortalService.markResultReviewed(item.id)}
        >
          <View style={styles.resultHeader}>
            <View>
              <Text style={styles.resultName}>{item.testName}</Text>
              <Text style={styles.resultDate}>{formatDate(item.resultDate)}</Text>
            </View>
            {!item.reviewed && (
              <View style={[styles.newBadge, { backgroundColor: DISCO_COLORS.neonPink }]}>
                <Text style={styles.newBadgeText}>NEW ✨</Text>
              </View>
            )}
          </View>
          <View style={styles.resultBody}>
            <View style={styles.resultValue}>
              <Text style={[styles.valueText, { color: getFlagColor(item.flag) }]}>{item.value}</Text>
              <Text style={styles.unitText}>{item.unit}</Text>
            </View>
            <View style={styles.resultRange}>
              <Text style={styles.rangeLabel}>Reference</Text>
              <Text style={styles.rangeValue}>{item.referenceRange}</Text>
            </View>
            <View style={[styles.flagBadge, { backgroundColor: getFlagColor(item.flag) + '40' }]}>
              <Text style={[styles.flagText, { color: getFlagColor(item.flag) }]}>{item.flag.toUpperCase()}</Text>
            </View>
          </View>
          {item.interpretation && (
            <Text style={styles.interpretation}>{item.interpretation}</Text>
          )}
        </TouchableOpacity>
      )}
    />
  );

  const renderMessages = () => (
    <FlatList
      data={messages}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DISCO_COLORS.neonPink} />}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.messageCard, { borderColor: item.isRead ? DISCO_COLORS.neonPurple : DISCO_COLORS.neonPink }, getGlowShadow(item.isRead ? DISCO_COLORS.neonPurple : DISCO_COLORS.neonPink, item.isRead ? 0.5 : 1)]}
          onPress={() => patientPortalService.markMessageRead(item.id)}
        >
          <View style={styles.messageHeader}>
            <Text style={styles.messageSender}>{item.senderName}</Text>
            {!item.isRead && (
              <View style={[styles.unreadDot, { backgroundColor: DISCO_COLORS.neonPink }]} />
            )}
          </View>
          <Text style={styles.messageSubject}>{item.subject}</Text>
          <Text style={styles.messagePreview} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.messageDate}>{formatDate(item.sentAt)} at {formatTime(item.sentAt)}</Text>
        </TouchableOpacity>
      )}
    />
  );

  const renderMedications = () => (
    <FlatList
      data={medications}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DISCO_COLORS.neonPink} />}
      contentContainerStyle={styles.listContent}
      renderItem={({ item, index }) => (
        <View style={[styles.medicationCard, { borderColor: [DISCO_COLORS.neonPink, DISCO_COLORS.neonCyan, DISCO_COLORS.neonPurple][index % 3] }, getGlowShadow([DISCO_COLORS.neonPink, DISCO_COLORS.neonCyan, DISCO_COLORS.neonPurple][index % 3])]}>
          <View style={styles.medHeader}>
            <Text style={styles.medName}>{item.name}</Text>
            <Text style={styles.medDosage}>{item.dosage}</Text>
          </View>
          <Text style={styles.medGeneric}>{item.genericName}</Text>
          <Text style={styles.medFrequency}>💊 {item.frequency}</Text>
          <Text style={styles.medInstructions}>{item.instructions}</Text>
          <View style={styles.medFooter}>
            <View>
              <Text style={styles.refillsLabel}>Refills Remaining</Text>
              <Text style={[styles.refillsValue, { color: item.refillsRemaining > 2 ? DISCO_COLORS.neonGreen : DISCO_COLORS.neonOrange }]}>
                {item.refillsRemaining}
              </Text>
            </View>
            {item.canRequestRefill && (
              <TouchableOpacity
                style={[styles.refillBtn, { backgroundColor: DISCO_COLORS.neonGreen }]}
                onPress={() => handleRequestRefill(item.id)}
              >
                <Text style={styles.refillBtnText}>Request Refill 🎉</Text>
              </TouchableOpacity>
            )}
          </View>
          {item.warnings.length > 0 && (
            <View style={styles.warningsContainer}>
              {item.warnings.map((warning, idx) => (
                <Text key={idx} style={styles.warningText}>⚠️ {warning}</Text>
              ))}
            </View>
          )}
        </View>
      )}
    />
  );

  const renderProfile = () => {
    if (!profile) return null;

    return (
      <ScrollView contentContainerStyle={styles.profileContent}>
        <View style={[styles.profileHeader, getGlowShadow(DISCO_COLORS.neonPink)]}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{profile.firstName[0]}{profile.lastName[0]}</Text>
          </View>
          <Text style={styles.profileName}>{profile.firstName} {profile.lastName}</Text>
          <Text style={styles.profileEmail}>{profile.email}</Text>
        </View>

        <View style={[styles.discoCard, getGlowShadow(DISCO_COLORS.neonCyan)]}>
          <Text style={styles.sectionTitle}>📱 Contact Info</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoItemLabel}>Phone</Text>
            <Text style={styles.infoItemValue}>{profile.phone}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoItemLabel}>Address</Text>
            <Text style={styles.infoItemValue}>{profile.address}</Text>
          </View>
        </View>

        <View style={[styles.discoCard, getGlowShadow(DISCO_COLORS.neonPurple)]}>
          <Text style={styles.sectionTitle}>🆘 Emergency Contact</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoItemLabel}>Name</Text>
            <Text style={styles.infoItemValue}>{profile.emergencyContact.name}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoItemLabel}>Phone</Text>
            <Text style={styles.infoItemValue}>{profile.emergencyContact.phone}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoItemLabel}>Relationship</Text>
            <Text style={styles.infoItemValue}>{profile.emergencyContact.relationship}</Text>
          </View>
        </View>

        <View style={[styles.discoCard, getGlowShadow(DISCO_COLORS.neonGreen)]}>
          <Text style={styles.sectionTitle}>🏥 Insurance</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoItemLabel}>Provider</Text>
            <Text style={styles.infoItemValue}>{profile.insuranceInfo.provider}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoItemLabel}>Policy #</Text>
            <Text style={styles.infoItemValue}>{profile.insuranceInfo.policyNumber}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoItemLabel}>Group #</Text>
            <Text style={styles.infoItemValue}>{profile.insuranceInfo.groupNumber}</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const tabs: { key: PortalTab; icon: string; label: string }[] = [
    { key: 'dashboard', icon: '🏠', label: 'Home' },
    { key: 'appointments', icon: '📅', label: 'Visits' },
    { key: 'results', icon: '🧪', label: 'Labs' },
    { key: 'messages', icon: '💬', label: 'Messages' },
    { key: 'medications', icon: '💊', label: 'Meds' },
    { key: 'profile', icon: '👤', label: 'Profile' },
  ];

  return (
    <ScreenContainer containerClassName="bg-[#0D0D0D]">
      {/* Disco Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🪩</Text>
        <Text style={styles.headerTitle}>Patient Portal</Text>
        <Text style={styles.headerSubtitle}>Disco Health Edition</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.activeTabLabel]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'appointments' && renderAppointments()}
      {activeTab === 'results' && renderResults()}
      {activeTab === 'messages' && renderMessages()}
      {activeTab === 'medications' && renderMedications()}
      {activeTab === 'profile' && renderProfile()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingVertical: 16, backgroundColor: DISCO_COLORS.midnightPurple },
  headerEmoji: { fontSize: 32 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2, textShadowColor: DISCO_COLORS.neonPink, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 15 },
  headerSubtitle: { fontSize: 12, color: DISCO_COLORS.neonCyan, letterSpacing: 4, marginTop: 4 },
  tabBar: { flexDirection: 'row', backgroundColor: DISCO_COLORS.darkDisco, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: DISCO_COLORS.neonPink + '40' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: DISCO_COLORS.neonPink },
  tabIcon: { fontSize: 20 },
  tabLabel: { fontSize: 10, color: '#888', marginTop: 4 },
  activeTabLabel: { color: DISCO_COLORS.neonPink },
  dashboardContent: { padding: 16, paddingBottom: 100 },
  welcomeBanner: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: DISCO_COLORS.neonPink },
  welcomeEmoji: { fontSize: 48, marginBottom: 8 },
  welcomeText: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', textShadowColor: DISCO_COLORS.neonPink, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  welcomeSubtext: { fontSize: 14, color: DISCO_COLORS.neonCyan, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { width: '47%', backgroundColor: DISCO_COLORS.darkDisco, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 2 },
  statEmoji: { fontSize: 28, marginBottom: 8 },
  statValue: { fontSize: 32, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  discoCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: DISCO_COLORS.neonPink },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  trendRow: { flexDirection: 'row', justifyContent: 'space-between' },
  trendItem: { alignItems: 'center' },
  trendLabel: { fontSize: 11, color: '#888' },
  trendValue: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  trendChange: { fontSize: 10, color: DISCO_COLORS.neonGreen, marginTop: 2 },
  appointmentPreview: { alignItems: 'center' },
  appointmentDate: { fontSize: 16, color: DISCO_COLORS.neonCyan, fontWeight: '600' },
  appointmentTime: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginTop: 4 },
  appointmentProvider: { fontSize: 14, color: '#FFFFFF', marginTop: 8 },
  appointmentType: { fontSize: 12, color: DISCO_COLORS.neonPink, marginTop: 4 },
  infoRow: { gap: 16 },
  infoSection: { marginBottom: 12 },
  infoLabel: { fontSize: 12, color: '#888', marginBottom: 8 },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  allergyTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  conditionTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagText: { fontSize: 12, fontWeight: '600' },
  listContent: { padding: 16, paddingBottom: 100 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, color: '#FFFFFF', fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: '#888', marginTop: 8 },
  appointmentCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2 },
  appointmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  appointmentCardDate: { fontSize: 14, color: DISCO_COLORS.neonCyan },
  appointmentCardTime: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  typeBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  typeText: { fontSize: 12, fontWeight: '600' },
  providerName: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  providerSpecialty: { fontSize: 13, color: '#888', marginTop: 2 },
  appointmentReason: { fontSize: 14, color: DISCO_COLORS.neonPink, marginTop: 8 },
  appointmentLocation: { fontSize: 12, color: '#888', marginTop: 8 },
  appointmentActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: 'center' },
  actionBtnText: { color: '#000', fontWeight: '600', fontSize: 13 },
  resultCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  resultName: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  resultDate: { fontSize: 12, color: '#888', marginTop: 2 },
  newBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  newBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  resultBody: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  resultValue: { flexDirection: 'row', alignItems: 'baseline' },
  valueText: { fontSize: 28, fontWeight: 'bold' },
  unitText: { fontSize: 14, color: '#888', marginLeft: 4 },
  resultRange: { flex: 1 },
  rangeLabel: { fontSize: 10, color: '#666' },
  rangeValue: { fontSize: 12, color: '#888' },
  flagBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  flagText: { fontSize: 11, fontWeight: 'bold' },
  interpretation: { fontSize: 13, color: '#AAA', marginTop: 12, fontStyle: 'italic' },
  messageCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2 },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  messageSender: { fontSize: 14, fontWeight: '600', color: DISCO_COLORS.neonCyan },
  unreadDot: { width: 10, height: 10, borderRadius: 5 },
  messageSubject: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 8 },
  messagePreview: { fontSize: 13, color: '#888', lineHeight: 18 },
  messageDate: { fontSize: 11, color: '#666', marginTop: 8 },
  medicationCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2 },
  medHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  medName: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  medDosage: { fontSize: 16, fontWeight: '600', color: DISCO_COLORS.neonPink },
  medGeneric: { fontSize: 12, color: '#888', marginBottom: 8 },
  medFrequency: { fontSize: 14, color: DISCO_COLORS.neonCyan, marginBottom: 4 },
  medInstructions: { fontSize: 13, color: '#AAA', marginBottom: 12 },
  medFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  refillsLabel: { fontSize: 11, color: '#666' },
  refillsValue: { fontSize: 20, fontWeight: 'bold' },
  refillBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  refillBtnText: { color: '#000', fontWeight: '600', fontSize: 13 },
  warningsContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: DISCO_COLORS.neonOrange + '40' },
  warningText: { fontSize: 12, color: DISCO_COLORS.neonOrange, marginBottom: 4 },
  profileContent: { padding: 16, paddingBottom: 100 },
  profileHeader: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: DISCO_COLORS.neonPink },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: DISCO_COLORS.neonPink, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#000' },
  profileName: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  profileEmail: { fontSize: 14, color: DISCO_COLORS.neonCyan, marginTop: 4 },
  infoItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  infoItemLabel: { fontSize: 14, color: '#888' },
  infoItemValue: { fontSize: 14, color: '#FFFFFF', flex: 1, textAlign: 'right' },
});
