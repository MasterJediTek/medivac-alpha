/**
 * Patient Family Communication Portal Screen
 * MediVac One v3.0 - Family Engagement UI
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import {
  FamilyPortalService,
  FamilyMember,
  PatientUpdate,
  FamilyMessage,
  VisitRequest,
  CarePlanView,
  CareTeamMember,
  MedicationSummary,
  SatisfactionSurvey,
} from '../services/FamilyPortalService';

type TabType = 'updates' | 'messages' | 'visits' | 'care_plan' | 'survey';

export default function FamilyPortalScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('updates');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [updates, setUpdates] = useState<PatientUpdate[]>([]);
  const [messages, setMessages] = useState<FamilyMessage[]>([]);
  const [visits, setVisits] = useState<VisitRequest[]>([]);
  const [carePlan, setCarePlan] = useState<CarePlanView | null>(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [showVisitRequest, setShowVisitRequest] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [newMessageText, setNewMessageText] = useState('');
  const [selectedPatientId] = useState('PAT-001');

  useEffect(() => {
    loadData();
    const unsubscribe = FamilyPortalService.subscribe(handlePortalEvent);
    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    const [members, patientUpdates, visitRequests, plan] = await Promise.all([
      FamilyPortalService.getFamilyMembers(selectedPatientId),
      FamilyPortalService.getPatientUpdates(selectedPatientId),
      FamilyPortalService.getVisitRequests(selectedPatientId),
      FamilyPortalService.getCarePlan(selectedPatientId),
    ]);

    setFamilyMembers(members);
    setUpdates(patientUpdates);
    setVisits(visitRequests);
    setCarePlan(plan);

    // Load messages for first conversation
    if (members.length > 0) {
      const conv = await FamilyPortalService.getConversation(`CONV-${selectedPatientId}`);
      setMessages(conv);
    }
  };

  const handlePortalEvent = (event: { type: string; data: unknown }) => {
    loadData();
  };

  const sendMessage = async () => {
    if (!newMessageText.trim()) return;

    await FamilyPortalService.sendMessage(
      `CONV-${selectedPatientId}`,
      'FAM-001',
      'family',
      'Family Member',
      newMessageText,
      [],
      'normal'
    );

    setNewMessageText('');
    setShowNewMessage(false);
    loadData();
  };

  const requestVisit = async () => {
    await FamilyPortalService.requestVisit({
      patientId: selectedPatientId,
      familyMemberId: 'FAM-001',
      requestedDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      requestedTime: '14:00',
      duration: 60,
      visitors: [{ name: 'John Smith', relationship: 'Spouse', isMinor: false, requiresAssistance: false }],
      purpose: 'Regular visit',
    });

    setShowVisitRequest(false);
    Alert.alert('Success', 'Visit request submitted!');
    loadData();
  };

  const submitSurvey = async (survey: Omit<SatisfactionSurvey, 'id' | 'submittedAt'>) => {
    await FamilyPortalService.submitSurvey(survey);
    setShowSurvey(false);
    Alert.alert('Thank You', 'Your feedback has been submitted!');
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {[
        { key: 'updates', label: '📢 Updates', icon: '📢' },
        { key: 'messages', label: '💬 Messages', icon: '💬' },
        { key: 'visits', label: '🏥 Visits', icon: '🏥' },
        { key: 'care_plan', label: '📋 Care Plan', icon: '📋' },
        { key: 'survey', label: '⭐ Feedback', icon: '⭐' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => setActiveTab(tab.key as TabType)}
        >
          <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
            {tab.icon}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderUpdates = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Patient Updates</Text>
      {updates.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No updates yet</Text>
        </View>
      ) : (
        updates.map((update) => (
          <View key={update.id} style={[styles.updateCard, getPriorityStyle(update.priority)]}>
            <View style={styles.updateHeader}>
              <Text style={styles.updateType}>{getUpdateTypeIcon(update.type)} {update.type.toUpperCase()}</Text>
              <Text style={styles.updateTime}>{formatTime(update.createdAt)}</Text>
            </View>
            <Text style={styles.updateTitle}>{update.title}</Text>
            <Text style={styles.updateMessage}>{update.message}</Text>
            {update.attachments.length > 0 && (
              <View style={styles.attachmentRow}>
                <Text style={styles.attachmentText}>📎 {update.attachments.length} attachment(s)</Text>
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );

  const renderMessages = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Messages with Care Team</Text>
        <TouchableOpacity style={styles.newButton} onPress={() => setShowNewMessage(true)}>
          <Text style={styles.newButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>
      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyText}>Start a conversation with the care team</Text>
        </View>
      ) : (
        messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageCard,
              msg.senderType === 'family' ? styles.familyMessage : styles.staffMessage,
            ]}
          >
            <Text style={styles.messageSender}>{msg.senderName}</Text>
            <Text style={styles.messageContent}>{msg.content}</Text>
            <Text style={styles.messageTime}>{formatTime(msg.createdAt)}</Text>
          </View>
        ))
      )}
    </View>
  );

  const renderVisits = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Visit Schedule</Text>
        <TouchableOpacity style={styles.newButton} onPress={() => setShowVisitRequest(true)}>
          <Text style={styles.newButtonText}>+ Request</Text>
        </TouchableOpacity>
      </View>
      {visits.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏥</Text>
          <Text style={styles.emptyText}>No visits scheduled</Text>
        </View>
      ) : (
        visits.map((visit) => (
          <View key={visit.id} style={styles.visitCard}>
            <View style={styles.visitHeader}>
              <Text style={styles.visitDate}>
                📅 {new Date(visit.requestedDate).toLocaleDateString()} at {visit.requestedTime}
              </Text>
              <View style={[styles.statusBadge, getStatusStyle(visit.status)]}>
                <Text style={styles.statusText}>{visit.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.visitPurpose}>{visit.purpose}</Text>
            <Text style={styles.visitVisitors}>
              👥 {visit.visitors.map((v: { name: string }) => v.name).join(', ')}
            </Text>
            {visit.declineReason && (
              <Text style={styles.declineReason}>Reason: {visit.declineReason}</Text>
            )}
          </View>
        ))
      )}
    </View>
  );

  const renderCarePlan = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Care Plan Overview</Text>
      {carePlan ? (
        <>
          <View style={styles.carePlanCard}>
            <Text style={styles.carePlanLabel}>Diagnosis</Text>
            <Text style={styles.carePlanValue}>{carePlan.diagnosis}</Text>
          </View>

          <View style={styles.carePlanCard}>
            <Text style={styles.carePlanLabel}>Treatment Plan</Text>
            <Text style={styles.carePlanValue}>{carePlan.treatmentPlan}</Text>
          </View>

          <View style={styles.carePlanCard}>
            <Text style={styles.carePlanLabel}>💊 Current Medications</Text>
            {carePlan.medications.map((med: MedicationSummary, idx: number) => (
              <View key={idx} style={styles.medicationItem}>
                <Text style={styles.medName}>{med.name}</Text>
                <Text style={styles.medDetails}>{med.purpose} - {med.frequency}</Text>
              </View>
            ))}
          </View>

          <View style={styles.carePlanCard}>
            <Text style={styles.carePlanLabel}>🍽️ Dietary Restrictions</Text>
            {carePlan.dietaryRestrictions.map((diet: string, idx: number) => (
              <Text key={idx} style={styles.dietItem}>• {diet}</Text>
            ))}
          </View>

          <View style={styles.carePlanCard}>
            <Text style={styles.carePlanLabel}>🏃 Activity Level</Text>
            <Text style={styles.carePlanValue}>{carePlan.activityLevel}</Text>
          </View>

          {carePlan.expectedDischarge && (
            <View style={styles.dischargeCard}>
              <Text style={styles.dischargeLabel}>Expected Discharge</Text>
              <Text style={styles.dischargeDate}>
                {new Date(carePlan.expectedDischarge).toLocaleDateString()}
              </Text>
            </View>
          )}

          <View style={styles.carePlanCard}>
            <Text style={styles.carePlanLabel}>👨‍⚕️ Care Team</Text>
            {carePlan.careTeam.map((member: CareTeamMember, idx: number) => (
              <View key={idx} style={styles.teamMember}>
                <Text style={styles.teamName}>{member.name}</Text>
                <Text style={styles.teamRole}>{member.role}</Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>Care plan not available</Text>
        </View>
      )}
    </View>
  );

  const renderSurvey = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Share Your Feedback</Text>
      <View style={styles.surveyIntro}>
        <Text style={styles.surveyIntroText}>
          Your feedback helps us improve care for all patients and families.
        </Text>
        <TouchableOpacity style={styles.surveyButton} onPress={() => setShowSurvey(true)}>
          <Text style={styles.surveyButtonText}>⭐ Complete Survey</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👨‍👩‍👧 Family Portal</Text>
        <Text style={styles.headerSubtitle}>Stay connected with your loved one's care</Text>
      </View>

      {renderTabs()}

      <ScrollView style={styles.content}>
        {activeTab === 'updates' && renderUpdates()}
        {activeTab === 'messages' && renderMessages()}
        {activeTab === 'visits' && renderVisits()}
        {activeTab === 'care_plan' && renderCarePlan()}
        {activeTab === 'survey' && renderSurvey()}
      </ScrollView>

      {/* New Message Modal */}
      <Modal visible={showNewMessage} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Message</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Type your message..."
              value={newMessageText}
              onChangeText={setNewMessageText}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowNewMessage(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Visit Request Modal */}
      <Modal visible={showVisitRequest} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request a Visit</Text>
            <Text style={styles.modalSubtext}>
              Submit a request to visit your loved one. The care team will review and respond.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowVisitRequest(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sendButton} onPress={requestVisit}>
                <Text style={styles.sendButtonText}>Submit Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Survey Modal */}
      <Modal visible={showSurvey} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Satisfaction Survey</Text>
            <SurveyForm
              onSubmit={(survey) => submitSurvey({
                ...survey,
                patientId: selectedPatientId,
                familyMemberId: 'FAM-001',
              })}
              onCancel={() => setShowSurvey(false)}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

// Survey Form Component
function SurveyForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (survey: Omit<SatisfactionSurvey, 'id' | 'submittedAt' | 'patientId' | 'familyMemberId'>) => void;
  onCancel: () => void;
}) {
  const [ratings, setRatings] = useState({
    overall: 5,
    communication: 5,
    careQuality: 5,
    staffCourtesy: 5,
    facility: 5,
  });
  const [comments, setComments] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(true);

  const RatingRow = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <View style={surveyStyles.ratingRow}>
      <Text style={surveyStyles.ratingLabel}>{label}</Text>
      <View style={surveyStyles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => onChange(star)}>
            <Text style={surveyStyles.star}>{star <= value ? '⭐' : '☆'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={surveyStyles.container}>
      <RatingRow label="Overall Experience" value={ratings.overall} onChange={(v) => setRatings({ ...ratings, overall: v })} />
      <RatingRow label="Communication" value={ratings.communication} onChange={(v) => setRatings({ ...ratings, communication: v })} />
      <RatingRow label="Quality of Care" value={ratings.careQuality} onChange={(v) => setRatings({ ...ratings, careQuality: v })} />
      <RatingRow label="Staff Courtesy" value={ratings.staffCourtesy} onChange={(v) => setRatings({ ...ratings, staffCourtesy: v })} />
      <RatingRow label="Facility" value={ratings.facility} onChange={(v) => setRatings({ ...ratings, facility: v })} />

      <View style={surveyStyles.recommendRow}>
        <Text style={surveyStyles.recommendLabel}>Would you recommend us?</Text>
        <View style={surveyStyles.recommendButtons}>
          <TouchableOpacity
            style={[surveyStyles.recommendBtn, wouldRecommend && surveyStyles.recommendActive]}
            onPress={() => setWouldRecommend(true)}
          >
            <Text style={surveyStyles.recommendText}>👍 Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[surveyStyles.recommendBtn, !wouldRecommend && surveyStyles.recommendActive]}
            onPress={() => setWouldRecommend(false)}
          >
            <Text style={surveyStyles.recommendText}>👎 No</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TextInput
        style={surveyStyles.commentsInput}
        placeholder="Additional comments..."
        value={comments}
        onChangeText={setComments}
        multiline
        numberOfLines={3}
      />

      <View style={surveyStyles.buttons}>
        <TouchableOpacity style={surveyStyles.cancelBtn} onPress={onCancel}>
          <Text style={surveyStyles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={surveyStyles.submitBtn}
          onPress={() => onSubmit({
            overallRating: ratings.overall,
            communicationRating: ratings.communication,
            careQualityRating: ratings.careQuality,
            staffCourtesyRating: ratings.staffCourtesy,
            facilityRating: ratings.facility,
            comments,
            wouldRecommend,
          })}
        >
          <Text style={surveyStyles.submitText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Helper Functions
const getUpdateTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    status: '📊',
    procedure: '🏥',
    discharge: '🏠',
    visit: '👥',
    general: '📢',
  };
  return icons[type] || '📢';
};

const getPriorityStyle = (priority: string) => {
  const styles: Record<string, object> = {
    urgent: { borderLeftColor: '#EF4444', borderLeftWidth: 4 },
    high: { borderLeftColor: '#F59E0B', borderLeftWidth: 4 },
    normal: { borderLeftColor: '#3B82F6', borderLeftWidth: 4 },
    low: { borderLeftColor: '#6B7280', borderLeftWidth: 4 },
  };
  return styles[priority] || styles.normal;
};

const getStatusStyle = (status: string) => {
  const styles: Record<string, object> = {
    requested: { backgroundColor: '#FEF3C7' },
    approved: { backgroundColor: '#D1FAE5' },
    declined: { backgroundColor: '#FEE2E2' },
    completed: { backgroundColor: '#E0E7FF' },
    cancelled: { backgroundColor: '#F3F4F6' },
  };
  return styles[status] || styles.requested;
};

const formatTime = (date: Date): string => {
  const d = new Date(date);
  return d.toLocaleString();
};

// Styles
const styles = StyleSheet.create({
  header: {
    padding: 20,
    backgroundColor: '#4F46E5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#C7D2FE',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
  },
  tabText: {
    fontSize: 20,
  },
  activeTabText: {
    color: '#4F46E5',
  },
  content: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  newButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  newButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  updateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  updateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  updateType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  updateTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  updateMessage: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  attachmentRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  attachmentText: {
    fontSize: 12,
    color: '#6B7280',
  },
  messageCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    maxWidth: '80%',
  },
  familyMessage: {
    backgroundColor: '#4F46E5',
    alignSelf: 'flex-end',
  },
  staffMessage: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    opacity: 0.7,
  },
  visitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  visitDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  visitPurpose: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  visitVisitors: {
    fontSize: 12,
    color: '#6B7280',
  },
  declineReason: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 8,
  },
  carePlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  carePlanLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 8,
  },
  carePlanValue: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  medicationItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  medName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  medDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  dietItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  dischargeCard: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  dischargeLabel: {
    fontSize: 12,
    color: '#065F46',
    marginBottom: 4,
  },
  dischargeDate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#065F46',
  },
  teamMember: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  teamRole: {
    fontSize: 12,
    color: '#6B7280',
  },
  surveyIntro: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  surveyIntroText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 16,
  },
  surveyButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  surveyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  modalSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

const surveyStyles = StyleSheet.create({
  container: {
    maxHeight: 400,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  ratingLabel: {
    fontSize: 14,
    color: '#374151',
  },
  stars: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 24,
    marginLeft: 4,
  },
  recommendRow: {
    paddingVertical: 16,
  },
  recommendLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  recommendButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  recommendBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  recommendActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  recommendText: {
    fontSize: 16,
  },
  commentsInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginTop: 12,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
