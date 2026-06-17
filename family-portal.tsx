// Family Member Portal UI Screen for MediVac WACHS v9.6
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { familyMemberPortalService, FamilyMember, FamilyInvite, HealthSummary, FamilyActivity } from '@/lib/services/family-member-portal-service';

type TabType = 'members' | 'invites' | 'health' | 'activity';

export default function FamilyPortalScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('members');
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [invites, setInvites] = useState<FamilyInvite[]>([]);
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [activities, setActivities] = useState<FamilyActivity[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRelationship, setInviteRelationship] = useState('family');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setMembers(familyMemberPortalService.getFamilyMembers('patient_1'));
    setInvites(familyMemberPortalService.getPendingInvites('patient_1'));
    setHealthSummary(familyMemberPortalService.getHealthSummary('patient_1'));
    setActivities(familyMemberPortalService.getActivityLog('patient_1'));
  };

  const sendInvite = () => {
    if (inviteEmail) {
      familyMemberPortalService.createInvite('patient_1', inviteEmail, inviteRelationship as any);
      setInviteEmail('');
      setShowInviteModal(false);
      loadData();
    }
  };

  const revokeAccess = (memberId: string) => {
    familyMemberPortalService.revokeAccess(memberId);
    loadData();
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {(['members', 'invites', 'health', 'activity'] as TabType[]).map((tab) => (
        <Pressable
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const renderMembers = () => (
    <ScrollView style={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Family Members</Text>
        <Pressable style={styles.inviteButton} onPress={() => setShowInviteModal(true)}>
          <Text style={styles.inviteButtonText}>+ Invite</Text>
        </Pressable>
      </View>

      {members.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👨‍👩‍👧‍👦</Text>
          <Text style={styles.emptyTitle}>No Family Members</Text>
          <Text style={styles.emptyText}>Invite family members to view your health information</Text>
        </View>
      ) : (
        members.map((member) => (
          <View key={member.id} style={styles.memberCard}>
            <View style={styles.memberHeader}>
              <View style={styles.memberAvatar}>
                <Text style={styles.avatarText}>{member.name.charAt(0)}</Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberEmail}>{member.email}</Text>
                <View style={styles.relationshipBadge}>
                  <Text style={styles.relationshipText}>{member.relationship}</Text>
                </View>
              </View>
              <View style={[styles.statusDot, member.status === 'active' ? styles.statusActive : styles.statusInactive]} />
            </View>

            <View style={styles.permissionsSection}>
              <Text style={styles.permissionsTitle}>Permissions</Text>
              <View style={styles.permissionsList}>
                {Object.entries(member.permissions).map(([key, value]) => (
                  <View key={key} style={styles.permissionItem}>
                    <Text style={styles.permissionIcon}>{value ? '✓' : '✗'}</Text>
                    <Text style={[styles.permissionText, !value && styles.permissionDisabled]}>
                      {key.replace(/_/g, ' ')}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.memberActions}>
              <Pressable style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit Permissions</Text>
              </Pressable>
              <Pressable style={styles.revokeButton} onPress={() => revokeAccess(member.id)}>
                <Text style={styles.revokeButtonText}>Revoke</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      {showInviteModal && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Invite Family Member</Text>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.relationshipOptions}>
              {['spouse', 'parent', 'child', 'sibling', 'carer', 'other'].map((rel) => (
                <Pressable
                  key={rel}
                  style={[styles.relationshipOption, inviteRelationship === rel && styles.relationshipSelected]}
                  onPress={() => setInviteRelationship(rel)}
                >
                  <Text style={[styles.relationshipOptionText, inviteRelationship === rel && styles.relationshipSelectedText]}>
                    {rel}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelButton} onPress={() => setShowInviteModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.sendButton} onPress={sendInvite}>
                <Text style={styles.sendButtonText}>Send Invite</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderInvites = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.sectionTitle}>Pending Invites</Text>
      {invites.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📧</Text>
          <Text style={styles.emptyTitle}>No Pending Invites</Text>
          <Text style={styles.emptyText}>All invitations have been accepted or expired</Text>
        </View>
      ) : (
        invites.map((invite) => (
          <View key={invite.id} style={styles.inviteCard}>
            <View style={styles.inviteHeader}>
              <Text style={styles.inviteEmail}>{invite.email}</Text>
              <View style={[styles.inviteStatusBadge, styles[`invite_${invite.status}`]]}>
                <Text style={styles.inviteStatusText}>{invite.status}</Text>
              </View>
            </View>
            <Text style={styles.inviteDate}>
              Sent: {new Date(invite.createdAt).toLocaleDateString()}
            </Text>
            <Text style={styles.inviteExpiry}>
              Expires: {new Date(invite.expiresAt).toLocaleDateString()}
            </Text>
            {invite.status === 'pending' && (
              <View style={styles.inviteActions}>
                <Pressable style={styles.resendButton}>
                  <Text style={styles.resendButtonText}>Resend</Text>
                </Pressable>
                <Pressable style={styles.cancelInviteButton}>
                  <Text style={styles.cancelInviteButtonText}>Cancel</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderHealth = () => {
    if (!healthSummary) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No Health Data</Text>
          <Text style={styles.emptyText}>Health summary will appear here</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Health Summary</Text>
        <View style={styles.healthOverview}>
          <View style={[styles.healthStatusCard, styles[`health_${healthSummary.overallStatus}`]]}>
            <Text style={styles.healthStatusIcon}>
              {healthSummary.overallStatus === 'good' ? '💚' : healthSummary.overallStatus === 'fair' ? '💛' : '❤️'}
            </Text>
            <Text style={styles.healthStatusText}>
              Overall: {healthSummary.overallStatus.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.vitalsSection}>
          <Text style={styles.subsectionTitle}>Latest Vitals</Text>
          <View style={styles.vitalsGrid}>
            {healthSummary.vitals.map((vital, index) => (
              <View key={index} style={styles.vitalCard}>
                <Text style={styles.vitalName}>{vital.name}</Text>
                <Text style={styles.vitalValue}>{vital.value} {vital.unit}</Text>
                <View style={[styles.vitalStatus, styles[`vital_${vital.status}`]]} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.appointmentsSection}>
          <Text style={styles.subsectionTitle}>Upcoming Appointments</Text>
          {healthSummary.upcomingAppointments.map((apt, index) => (
            <View key={index} style={styles.appointmentCard}>
              <Text style={styles.appointmentType}>{apt.type}</Text>
              <Text style={styles.appointmentDate}>
                {new Date(apt.date).toLocaleDateString()} at {apt.time}
              </Text>
              <Text style={styles.appointmentProvider}>{apt.provider}</Text>
            </View>
          ))}
        </View>

        <View style={styles.medicationsSection}>
          <Text style={styles.subsectionTitle}>Current Medications</Text>
          {healthSummary.medications.map((med, index) => (
            <View key={index} style={styles.medicationCard}>
              <Text style={styles.medicationName}>{med.name}</Text>
              <Text style={styles.medicationDosage}>{med.dosage}</Text>
              <Text style={styles.medicationFrequency}>{med.frequency}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderActivity = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.sectionTitle}>Activity Log</Text>
      {activities.map((activity) => (
        <View key={activity.id} style={styles.activityCard}>
          <View style={styles.activityIcon}>
            <Text style={styles.activityIconText}>
              {activity.type === 'view' ? '👁️' : activity.type === 'access' ? '🔓' : '📝'}
            </Text>
          </View>
          <View style={styles.activityContent}>
            <Text style={styles.activityDescription}>{activity.description}</Text>
            <Text style={styles.activityMember}>{activity.memberName}</Text>
            <Text style={styles.activityTime}>
              {new Date(activity.timestamp).toLocaleString()}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Family Portal</Text>
        <Text style={styles.subtitle}>Manage family access to your health information</Text>
      </View>
      {renderTabs()}
      {activeTab === 'members' && renderMembers()}
      {activeTab === 'invites' && renderInvites()}
      {activeTab === 'health' && renderHealth()}
      {activeTab === 'activity' && renderActivity()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { padding: 20, backgroundColor: '#1E3A5F' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', padding: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#FFFFFF' },
  tabText: { fontSize: 14, color: '#64748B' },
  activeTabText: { color: '#1E3A5F', fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  inviteButton: { backgroundColor: '#1E3A5F', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  inviteButtonText: { color: '#FFFFFF', fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  memberCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  memberHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  memberAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1E3A5F', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberName: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  memberEmail: { fontSize: 14, color: '#64748B' },
  relationshipBadge: { backgroundColor: '#E0E7FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 },
  relationshipText: { fontSize: 12, color: '#4338CA', fontWeight: '500' },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  statusActive: { backgroundColor: '#22C55E' },
  statusInactive: { backgroundColor: '#94A3B8' },
  permissionsSection: { marginBottom: 16 },
  permissionsTitle: { fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 8 },
  permissionsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  permissionItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  permissionIcon: { fontSize: 12 },
  permissionText: { fontSize: 12, color: '#1E293B' },
  permissionDisabled: { color: '#94A3B8' },
  memberActions: { flexDirection: 'row', gap: 12 },
  editButton: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  editButtonText: { color: '#1E3A5F', fontWeight: '600' },
  revokeButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#EF4444' },
  revokeButtonText: { color: '#EF4444', fontWeight: '600' },
  modal: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, marginBottom: 16 },
  relationshipOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  relationshipOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  relationshipSelected: { backgroundColor: '#1E3A5F', borderColor: '#1E3A5F' },
  relationshipOptionText: { color: '#64748B' },
  relationshipSelectedText: { color: '#FFFFFF' },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  cancelButtonText: { color: '#64748B', fontWeight: '600' },
  sendButton: { flex: 1, backgroundColor: '#1E3A5F', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  sendButtonText: { color: '#FFFFFF', fontWeight: '600' },
  inviteCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  inviteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  inviteEmail: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  inviteStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  invite_pending: { backgroundColor: '#FEF3C7' },
  invite_accepted: { backgroundColor: '#DCFCE7' },
  invite_expired: { backgroundColor: '#FEE2E2' },
  inviteStatusText: { fontSize: 12, fontWeight: '500' },
  inviteDate: { fontSize: 14, color: '#64748B' },
  inviteExpiry: { fontSize: 14, color: '#94A3B8' },
  inviteActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  resendButton: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  resendButtonText: { color: '#1E3A5F', fontWeight: '600' },
  cancelInviteButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#EF4444' },
  cancelInviteButtonText: { color: '#EF4444', fontWeight: '600' },
  healthOverview: { marginBottom: 20 },
  healthStatusCard: { padding: 20, borderRadius: 12, alignItems: 'center' },
  health_good: { backgroundColor: '#DCFCE7' },
  health_fair: { backgroundColor: '#FEF3C7' },
  health_attention: { backgroundColor: '#FEE2E2' },
  healthStatusIcon: { fontSize: 32, marginBottom: 8 },
  healthStatusText: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  vitalsSection: { marginBottom: 20 },
  subsectionTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 12 },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  vitalCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  vitalName: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  vitalValue: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  vitalStatus: { width: 8, height: 8, borderRadius: 4, position: 'absolute', top: 12, right: 12 },
  vital_normal: { backgroundColor: '#22C55E' },
  vital_elevated: { backgroundColor: '#F59E0B' },
  vital_low: { backgroundColor: '#3B82F6' },
  vital_critical: { backgroundColor: '#EF4444' },
  appointmentsSection: { marginBottom: 20 },
  appointmentCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  appointmentType: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  appointmentDate: { fontSize: 14, color: '#1E3A5F', marginTop: 4 },
  appointmentProvider: { fontSize: 14, color: '#64748B', marginTop: 2 },
  medicationsSection: { marginBottom: 20 },
  medicationCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  medicationName: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  medicationDosage: { fontSize: 14, color: '#1E3A5F', marginTop: 4 },
  medicationFrequency: { fontSize: 14, color: '#64748B', marginTop: 2 },
  activityCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  activityIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  activityIconText: { fontSize: 18 },
  activityContent: { flex: 1, marginLeft: 12 },
  activityDescription: { fontSize: 14, color: '#1E293B' },
  activityMember: { fontSize: 12, color: '#1E3A5F', marginTop: 4 },
  activityTime: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
});
