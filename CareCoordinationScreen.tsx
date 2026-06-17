/**
 * Care Coordination Dashboard Screen
 * MediVac One v3.2 - Unified Care Team Coordination UI
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { CareCoordinationService, Referral, ReferralType, ReferralPriority, CareConference, TeamActivity } from '../services/CareCoordinationService';

// Disco theme colors
const DISCO = {
  neonPink: '#FF1493',
  neonCyan: '#00FFFF',
  neonPurple: '#9D00FF',
  neonGreen: '#39FF14',
  neonOrange: '#FF6600',
  neonYellow: '#FFFF00',
  darkBg: '#0D0221',
  cardBg: '#1A0A2E',
  glowPink: 'rgba(255, 20, 147, 0.3)',
  glowCyan: 'rgba(0, 255, 255, 0.3)',
};

type TabType = 'dashboard' | 'referrals' | 'conferences' | 'activity';

export default function CareCoordinationScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showNewReferral, setShowNewReferral] = useState(false);
  const [selectedType, setSelectedType] = useState<ReferralType>('specialty_consult');
  const [selectedPriority, setSelectedPriority] = useState<ReferralPriority>('routine');
  const [patientName, setPatientName] = useState('');
  const [reason, setReason] = useState('');
  const [department, setDepartment] = useState('');

  const summary = CareCoordinationService.getDashboardSummary();

  const referralTypeIcons: Record<ReferralType, string> = {
    specialty_consult: '👨‍⚕️',
    imaging: '📷',
    laboratory: '🧪',
    physical_therapy: '🏃',
    occupational_therapy: '🖐️',
    speech_therapy: '🗣️',
    social_work: '🤝',
    case_management: '📋',
    nutrition: '🥗',
    pharmacy: '💊',
    wound_care: '🩹',
    palliative_care: '💜',
    home_health: '🏠',
    dme: '🦽',
    external_facility: '🏥',
  };

  const priorityColors: Record<ReferralPriority, string> = {
    routine: DISCO.neonCyan,
    urgent: DISCO.neonYellow,
    stat: DISCO.neonOrange,
    emergent: DISCO.neonPink,
  };

  const statusColors: Record<string, string> = {
    pending: DISCO.neonYellow,
    sent: DISCO.neonCyan,
    acknowledged: DISCO.neonPurple,
    scheduled: DISCO.neonGreen,
    in_progress: DISCO.neonOrange,
    completed: DISCO.neonGreen,
    cancelled: '#888',
    declined: DISCO.neonPink,
  };

  const handleCreateReferral = () => {
    if (!patientName || !reason || !department) return;
    
    CareCoordinationService.createReferral({
      type: selectedType,
      priority: selectedPriority,
      patientId: `PAT-${Date.now()}`,
      patientName,
      patientMRN: `MRN-${Math.floor(Math.random() * 100000)}`,
      patientUnit: 'ICU',
      patientRoom: '301',
      referringProviderId: 'PROV-001',
      referringProviderName: 'Dr. Smith',
      receivingDepartment: department,
      reason,
      clinicalQuestion: reason,
      relevantHistory: 'See chart for details',
    });
    
    setPatientName('');
    setReason('');
    setDepartment('');
    setShowNewReferral(false);
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {[
        { key: 'dashboard', label: 'Dashboard', icon: '📊' },
        { key: 'referrals', label: 'Referrals', icon: '📤', badge: summary.metrics.pendingReferrals },
        { key: 'conferences', label: 'Conferences', icon: '👥', badge: summary.upcomingConferences.length },
        { key: 'activity', label: 'Activity', icon: '📝' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => setActiveTab(tab.key as TabType)}
        >
          <View style={styles.tabContent}>
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            {tab.badge !== undefined && tab.badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{tab.badge}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDashboard = () => (
    <ScrollView style={styles.dashboardContainer}>
      {/* Metrics Cards */}
      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, { borderColor: DISCO.neonPink }]}>
          <Text style={styles.metricValue}>{summary.metrics.totalReferrals}</Text>
          <Text style={styles.metricLabel}>Total Referrals</Text>
        </View>
        <View style={[styles.metricCard, { borderColor: DISCO.neonYellow }]}>
          <Text style={[styles.metricValue, { color: DISCO.neonYellow }]}>{summary.metrics.pendingReferrals}</Text>
          <Text style={styles.metricLabel}>Pending</Text>
        </View>
        <View style={[styles.metricCard, { borderColor: DISCO.neonOrange }]}>
          <Text style={[styles.metricValue, { color: DISCO.neonOrange }]}>{summary.metrics.overdueReferrals}</Text>
          <Text style={styles.metricLabel}>Overdue</Text>
        </View>
        <View style={[styles.metricCard, { borderColor: DISCO.neonGreen }]}>
          <Text style={[styles.metricValue, { color: DISCO.neonGreen }]}>{summary.metrics.completionRate}%</Text>
          <Text style={styles.metricLabel}>Completion</Text>
        </View>
      </View>

      {/* Overdue Alerts */}
      {summary.overdueReferrals.length > 0 && (
        <View style={styles.alertSection}>
          <Text style={styles.sectionTitle}>⚠️ Overdue Referrals</Text>
          {summary.overdueReferrals.map((referral) => (
            <View key={referral.id} style={[styles.alertCard, { borderLeftColor: DISCO.neonOrange }]}>
              <View style={styles.alertHeader}>
                <Text style={styles.alertIcon}>{referralTypeIcons[referral.type]}</Text>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertTitle}>{referral.patientName}</Text>
                  <Text style={styles.alertSubtitle}>{referral.receivingDepartment}</Text>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: priorityColors[referral.priority] + '40' }]}>
                  <Text style={[styles.priorityText, { color: priorityColors[referral.priority] }]}>
                    {referral.priority.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.alertReason}>{referral.reason}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Upcoming Conferences */}
      {summary.upcomingConferences.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Upcoming Conferences</Text>
          {summary.upcomingConferences.map((conf) => (
            <View key={conf.id} style={styles.conferenceCard}>
              <View style={styles.conferenceHeader}>
                <Text style={styles.conferenceType}>{conf.conferenceType.replace('_', ' ')}</Text>
                <Text style={styles.conferenceTime}>
                  {conf.scheduledDate.toLocaleDateString()} {conf.scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text style={styles.conferencePatient}>{conf.patientName}</Text>
              <Text style={styles.conferenceAttendees}>
                {conf.attendees.length} attendees • {conf.duration} min
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Recent Activity</Text>
        {summary.recentActivities.slice(0, 5).map((activity) => (
          <View key={activity.id} style={styles.activityCard}>
            <View style={styles.activityDot} />
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityDescription}>{activity.description}</Text>
              <Text style={styles.activityMeta}>
                {activity.performedBy} • {activity.performedAt.toLocaleTimeString()}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );

  const renderReferrals = () => (
    <ScrollView style={styles.listContainer}>
      <TouchableOpacity
        style={styles.newButton}
        onPress={() => setShowNewReferral(true)}
      >
        <Text style={styles.newButtonIcon}>➕</Text>
        <Text style={styles.newButtonText}>New Referral</Text>
      </TouchableOpacity>

      {showNewReferral && (
        <View style={styles.newReferralForm}>
          <Text style={styles.formTitle}>Create New Referral</Text>
          
          <Text style={styles.formLabel}>Referral Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
            {Object.entries(referralTypeIcons).slice(0, 8).map(([type, icon]) => (
              <TouchableOpacity
                key={type}
                style={[styles.typeChip, selectedType === type && styles.typeChipSelected]}
                onPress={() => setSelectedType(type as ReferralType)}
              >
                <Text style={styles.typeChipIcon}>{icon}</Text>
                <Text style={styles.typeChipText}>{type.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.formLabel}>Priority</Text>
          <View style={styles.priorityRow}>
            {(['routine', 'urgent', 'stat', 'emergent'] as ReferralPriority[]).map((priority) => (
              <TouchableOpacity
                key={priority}
                style={[
                  styles.priorityChip,
                  { borderColor: priorityColors[priority] },
                  selectedPriority === priority && { backgroundColor: priorityColors[priority] + '40' },
                ]}
                onPress={() => setSelectedPriority(priority)}
              >
                <Text style={[styles.priorityChipText, { color: priorityColors[priority] }]}>
                  {priority.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Patient Name"
            placeholderTextColor="#666"
            value={patientName}
            onChangeText={setPatientName}
          />
          <TextInput
            style={styles.input}
            placeholder="Receiving Department"
            placeholderTextColor="#666"
            value={department}
            onChangeText={setDepartment}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Reason for Referral"
            placeholderTextColor="#666"
            value={reason}
            onChangeText={setReason}
            multiline
          />

          <View style={styles.formButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowNewReferral(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, (!patientName || !reason || !department) && styles.buttonDisabled]}
              onPress={handleCreateReferral}
              disabled={!patientName || !reason || !department}
            >
              <Text style={styles.submitButtonText}>Create Referral</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Text style={styles.listTitle}>Pending Referrals</Text>
      {summary.pendingReferrals.map((referral) => (
        <View key={referral.id} style={[styles.referralCard, { borderLeftColor: priorityColors[referral.priority] }]}>
          <View style={styles.referralHeader}>
            <Text style={styles.referralIcon}>{referralTypeIcons[referral.type]}</Text>
            <View style={styles.referralInfo}>
              <Text style={styles.referralNumber}>{referral.referralNumber}</Text>
              <Text style={styles.referralPatient}>{referral.patientName}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColors[referral.status] + '40' }]}>
              <Text style={[styles.statusText, { color: statusColors[referral.status] }]}>
                {referral.status}
              </Text>
            </View>
          </View>
          <Text style={styles.referralDepartment}>To: {referral.receivingDepartment}</Text>
          <Text style={styles.referralReason}>{referral.reason}</Text>
          <Text style={styles.referralDate}>
            {referral.createdAt.toLocaleDateString()} {referral.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      ))}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );

  const renderConferences = () => (
    <ScrollView style={styles.listContainer}>
      <Text style={styles.listTitle}>Upcoming Conferences</Text>
      {summary.upcomingConferences.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyText}>No upcoming conferences</Text>
        </View>
      ) : (
        summary.upcomingConferences.map((conf) => (
          <View key={conf.id} style={styles.conferenceDetailCard}>
            <View style={styles.conferenceDetailHeader}>
              <Text style={styles.conferenceDetailType}>
                {conf.conferenceType === 'interdisciplinary' ? '👥' :
                 conf.conferenceType === 'family' ? '👨‍👩‍👧' :
                 conf.conferenceType === 'discharge_planning' ? '🏠' :
                 conf.conferenceType === 'ethics' ? '⚖️' : '💜'}
                {' '}{conf.conferenceType.replace('_', ' ')}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: DISCO.neonGreen + '40' }]}>
                <Text style={[styles.statusText, { color: DISCO.neonGreen }]}>{conf.status}</Text>
              </View>
            </View>
            <Text style={styles.conferenceDetailPatient}>{conf.patientName}</Text>
            <View style={styles.conferenceDetailMeta}>
              <Text style={styles.conferenceDetailTime}>
                📅 {conf.scheduledDate.toLocaleDateString()} at {conf.scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={styles.conferenceDetailDuration}>⏱️ {conf.duration} min</Text>
            </View>
            <Text style={styles.conferenceDetailLocation}>📍 {conf.location}</Text>
            <View style={styles.attendeesList}>
              <Text style={styles.attendeesTitle}>Attendees ({conf.attendees.length}):</Text>
              {conf.attendees.slice(0, 4).map((attendee, i) => (
                <Text key={i} style={styles.attendeeName}>
                  {attendee.confirmed ? '✅' : '⏳'} {attendee.name} ({attendee.role})
                </Text>
              ))}
              {conf.attendees.length > 4 && (
                <Text style={styles.moreAttendees}>+{conf.attendees.length - 4} more</Text>
              )}
            </View>
          </View>
        ))
      )}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );

  const renderActivity = () => (
    <ScrollView style={styles.listContainer}>
      <Text style={styles.listTitle}>Activity Timeline</Text>
      {summary.recentActivities.map((activity, index) => (
        <View key={activity.id} style={styles.timelineItem}>
          <View style={styles.timelineLine}>
            <View style={[styles.timelineDot, { backgroundColor: DISCO.neonCyan }]} />
            {index < summary.recentActivities.length - 1 && <View style={styles.timelineConnector} />}
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.timelineTitle}>{activity.title}</Text>
            <Text style={styles.timelineDescription}>{activity.description}</Text>
            <View style={styles.timelineMeta}>
              <Text style={styles.timelinePerformer}>{activity.performedBy}</Text>
              <Text style={styles.timelineTime}>
                {activity.performedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        </View>
      ))}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Care Coordination</Text>
        <Text style={styles.headerSubtitle}>Unified Team Dashboard</Text>
      </View>
      
      {renderTabs()}
      
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'referrals' && renderReferrals()}
      {activeTab === 'conferences' && renderConferences()}
      {activeTab === 'activity' && renderActivity()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DISCO.darkBg,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: DISCO.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: DISCO.neonPurple,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: DISCO.neonPurple,
    textShadowColor: 'rgba(157, 0, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: DISCO.neonCyan,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: DISCO.cardBg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: DISCO.neonPurple,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabIcon: {
    fontSize: 20,
  },
  badge: {
    backgroundColor: DISCO.neonPink,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: 'bold',
  },
  tabText: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  activeTabText: {
    color: DISCO.neonPurple,
    fontWeight: 'bold',
  },
  dashboardContainer: {
    flex: 1,
    padding: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    width: '47%',
    backgroundColor: DISCO.cardBg,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  metricLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  alertSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DISCO.neonCyan,
    marginBottom: 12,
  },
  alertCard: {
    backgroundColor: DISCO.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  alertSubtitle: {
    fontSize: 13,
    color: '#888',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  alertReason: {
    fontSize: 14,
    color: '#AAA',
  },
  section: {
    marginBottom: 20,
  },
  conferenceCard: {
    backgroundColor: DISCO.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  conferenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  conferenceType: {
    fontSize: 14,
    color: DISCO.neonPurple,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  conferenceTime: {
    fontSize: 12,
    color: DISCO.neonCyan,
  },
  conferencePatient: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: 'bold',
  },
  conferenceAttendees: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  activityCard: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DISCO.neonCyan,
    marginTop: 6,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  activityDescription: {
    fontSize: 13,
    color: '#AAA',
    marginTop: 2,
  },
  activityMeta: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DISCO.neonPurple,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  newButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  newButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  newReferralForm: {
    backgroundColor: DISCO.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    color: DISCO.neonCyan,
    marginBottom: 8,
    marginTop: 12,
  },
  typeScroll: {
    marginBottom: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  typeChipSelected: {
    borderColor: DISCO.neonPurple,
    backgroundColor: DISCO.neonPurple + '20',
  },
  typeChipIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  typeChipText: {
    fontSize: 12,
    color: '#FFF',
    textTransform: 'capitalize',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  priorityChipText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 14,
    color: '#FFF',
    fontSize: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#333',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  submitButton: {
    flex: 1,
    backgroundColor: DISCO.neonPurple,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DISCO.neonCyan,
    marginBottom: 16,
  },
  referralCard: {
    backgroundColor: DISCO.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  referralIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  referralInfo: {
    flex: 1,
  },
  referralNumber: {
    fontSize: 12,
    color: DISCO.neonCyan,
    fontWeight: 'bold',
  },
  referralPatient: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  referralDepartment: {
    fontSize: 14,
    color: DISCO.neonPurple,
    marginBottom: 4,
  },
  referralReason: {
    fontSize: 13,
    color: '#AAA',
    marginBottom: 8,
  },
  referralDate: {
    fontSize: 11,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#FFF',
  },
  conferenceDetailCard: {
    backgroundColor: DISCO.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  conferenceDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  conferenceDetailType: {
    fontSize: 16,
    color: DISCO.neonPurple,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  conferenceDetailPatient: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  conferenceDetailMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  conferenceDetailTime: {
    fontSize: 13,
    color: '#AAA',
  },
  conferenceDetailDuration: {
    fontSize: 13,
    color: '#AAA',
  },
  conferenceDetailLocation: {
    fontSize: 13,
    color: DISCO.neonCyan,
    marginBottom: 12,
  },
  attendeesList: {
    backgroundColor: '#1A0A2E',
    borderRadius: 8,
    padding: 12,
  },
  attendeesTitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  attendeeName: {
    fontSize: 13,
    color: '#FFF',
    marginBottom: 4,
  },
  moreAttendees: {
    fontSize: 12,
    color: DISCO.neonPurple,
    marginTop: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLine: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#333',
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: DISCO.cardBg,
    borderRadius: 12,
    padding: 12,
    marginLeft: 8,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  timelineDescription: {
    fontSize: 13,
    color: '#AAA',
    marginTop: 4,
  },
  timelineMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timelinePerformer: {
    fontSize: 11,
    color: DISCO.neonPurple,
  },
  timelineTime: {
    fontSize: 11,
    color: '#666',
  },
  bottomSpacer: {
    height: 100,
  },
});
