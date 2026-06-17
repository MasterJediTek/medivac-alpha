/**
 * Surgical Procedure Tracking Screen
 * MediVac One v3.0 - OR Status Board UI
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import {
  SurgicalTrackingService,
  ORStatusBoard,
  SurgicalCase,
  ORRoomStatus,
  CaseStatus,
} from '../services/SurgicalTrackingService';

type ViewMode = 'board' | 'timeline' | 'cases';

export default function SurgicalTrackingScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [statusBoard, setStatusBoard] = useState<ORStatusBoard | null>(null);
  const [selectedCase, setSelectedCase] = useState<SurgicalCase | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
    const unsubscribe = SurgicalTrackingService.subscribe(handleEvent);
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const loadData = async () => {
    const board = await SurgicalTrackingService.getORStatusBoard();
    setStatusBoard(board);
  };

  const handleEvent = () => {
    loadData();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderViewTabs = () => (
    <View style={styles.viewTabs}>
      {[
        { key: 'board', label: '🏥 OR Board' },
        { key: 'timeline', label: '📊 Timeline' },
        { key: 'cases', label: '📋 Cases' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.viewTab, viewMode === tab.key && styles.activeViewTab]}
          onPress={() => setViewMode(tab.key as ViewMode)}
        >
          <Text style={[styles.viewTabText, viewMode === tab.key && styles.activeViewTabText]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStatusSummary = () => {
    if (!statusBoard) return null;

    return (
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: '#D1FAE5' }]}>
          <Text style={styles.summaryNumber}>{statusBoard.availableRooms}</Text>
          <Text style={styles.summaryLabel}>Available</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#FEE2E2' }]}>
          <Text style={styles.summaryNumber}>{statusBoard.inUseRooms}</Text>
          <Text style={styles.summaryLabel}>In Use</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#FEF3C7' }]}>
          <Text style={styles.summaryNumber}>{statusBoard.turnoverRooms}</Text>
          <Text style={styles.summaryLabel}>Turnover</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#E0E7FF' }]}>
          <Text style={styles.summaryNumber}>{statusBoard.upcomingCases.length}</Text>
          <Text style={styles.summaryLabel}>Upcoming</Text>
        </View>
      </View>
    );
  };

  const renderORBoard = () => {
    if (!statusBoard) return null;

    return (
      <View style={styles.boardContainer}>
        {statusBoard.rooms.map((roomStatus) => (
          <ORRoomCard
            key={roomStatus.room.id}
            roomStatus={roomStatus}
            onCasePress={(c) => setSelectedCase(c)}
          />
        ))}
      </View>
    );
  };

  const renderTimeline = () => {
    if (!statusBoard) return null;

    const allCases = [
      ...statusBoard.rooms.filter(r => r.currentCase).map(r => r.currentCase!),
      ...statusBoard.upcomingCases,
    ].sort((a, b) => {
      const timeA = a.scheduledTime.split(':').map(Number);
      const timeB = b.scheduledTime.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });

    return (
      <View style={styles.timelineContainer}>
        {allCases.map((surgicalCase, index) => (
          <TimelineItem
            key={surgicalCase.id}
            surgicalCase={surgicalCase}
            isFirst={index === 0}
            isLast={index === allCases.length - 1}
            onPress={() => setSelectedCase(surgicalCase)}
          />
        ))}
      </View>
    );
  };

  const renderCasesList = () => {
    if (!statusBoard) return null;

    const allCases = [
      ...statusBoard.rooms.filter(r => r.currentCase).map(r => r.currentCase!),
      ...statusBoard.upcomingCases,
    ];

    return (
      <View style={styles.casesContainer}>
        {allCases.map((surgicalCase) => (
          <CaseCard
            key={surgicalCase.id}
            surgicalCase={surgicalCase}
            onPress={() => setSelectedCase(surgicalCase)}
          />
        ))}
      </View>
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏥 Surgical Tracking</Text>
        <Text style={styles.headerSubtitle}>
          OR Status Board • {new Date().toLocaleDateString()}
        </Text>
      </View>

      {renderViewTabs()}
      {renderStatusSummary()}

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {viewMode === 'board' && renderORBoard()}
        {viewMode === 'timeline' && renderTimeline()}
        {viewMode === 'cases' && renderCasesList()}
      </ScrollView>

      {selectedCase && (
        <CaseDetailModal
          surgicalCase={selectedCase}
          onClose={() => setSelectedCase(null)}
        />
      )}
    </ScreenContainer>
  );
}

// OR Room Card Component
function ORRoomCard({
  roomStatus,
  onCasePress,
}: {
  roomStatus: ORRoomStatus;
  onCasePress: (c: SurgicalCase) => void;
}) {
  const { room, currentCase, nextCase, turnoverProgress } = roomStatus;

  const getStatusColor = () => {
    switch (room.status) {
      case 'available': return '#10B981';
      case 'in_use': return '#EF4444';
      case 'turnover': return '#F59E0B';
      case 'blocked': return '#6B7280';
      case 'emergency': return '#DC2626';
      default: return '#6B7280';
    }
  };

  return (
    <View style={[styles.orCard, { borderLeftColor: getStatusColor(), borderLeftWidth: 4 }]}>
      <View style={styles.orHeader}>
        <Text style={styles.orName}>{room.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusBadgeText}>{room.status.toUpperCase()}</Text>
        </View>
      </View>

      {currentCase && (
        <TouchableOpacity style={styles.currentCaseBox} onPress={() => onCasePress(currentCase)}>
          <Text style={styles.casePatient}>{currentCase.patientName}</Text>
          <Text style={styles.caseProcedure}>{currentCase.procedureName}</Text>
          <View style={styles.caseInfo}>
            <Text style={styles.caseSurgeon}>👨‍⚕️ {currentCase.surgeonName}</Text>
            <Text style={styles.caseTime}>⏱️ {currentCase.estimatedDuration} min</Text>
          </View>
          <MilestoneProgress milestones={currentCase.milestones} />
        </TouchableOpacity>
      )}

      {room.status === 'turnover' && turnoverProgress !== undefined && (
        <View style={styles.turnoverBox}>
          <Text style={styles.turnoverText}>🧹 Turnover in Progress</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${turnoverProgress}%` }]} />
          </View>
        </View>
      )}

      {room.status === 'available' && nextCase && (
        <View style={styles.nextCaseBox}>
          <Text style={styles.nextCaseLabel}>Next Case:</Text>
          <Text style={styles.nextCasePatient}>{nextCase.patientName}</Text>
          <Text style={styles.nextCaseTime}>🕐 {nextCase.scheduledTime}</Text>
        </View>
      )}

      {room.status === 'available' && !nextCase && (
        <View style={styles.availableBox}>
          <Text style={styles.availableText}>✅ Ready for Next Case</Text>
        </View>
      )}
    </View>
  );
}

// Milestone Progress Component
function MilestoneProgress({ milestones }: { milestones: SurgicalCase['milestones'] }) {
  const completedCount = milestones.filter(m => m.actualTime).length;
  const progress = (completedCount / milestones.length) * 100;

  return (
    <View style={styles.milestoneContainer}>
      <View style={styles.milestoneBar}>
        <View style={[styles.milestoneFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.milestoneText}>
        {completedCount}/{milestones.length} milestones
      </Text>
    </View>
  );
}

// Timeline Item Component
function TimelineItem({
  surgicalCase,
  isFirst,
  isLast,
  onPress,
}: {
  surgicalCase: SurgicalCase;
  isFirst: boolean;
  isLast: boolean;
  onPress: () => void;
}) {
  const getStatusIcon = (status: CaseStatus) => {
    switch (status) {
      case 'scheduled': return '📅';
      case 'pre_op': return '🏥';
      case 'in_or': return '🚪';
      case 'in_progress': return '⚡';
      case 'closing': return '🔧';
      case 'post_op': return '✅';
      case 'recovery': return '💤';
      case 'completed': return '✔️';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  return (
    <TouchableOpacity style={styles.timelineItem} onPress={onPress}>
      <View style={styles.timelineLeft}>
        <Text style={styles.timelineTime}>{surgicalCase.scheduledTime}</Text>
        {!isFirst && <View style={styles.timelineLineTop} />}
        <View style={[styles.timelineDot, surgicalCase.status === 'in_progress' && styles.timelineDotActive]} />
        {!isLast && <View style={styles.timelineLineBottom} />}
      </View>
      <View style={styles.timelineContent}>
        <View style={styles.timelineHeader}>
          <Text style={styles.timelineIcon}>{getStatusIcon(surgicalCase.status)}</Text>
          <Text style={styles.timelinePatient}>{surgicalCase.patientName}</Text>
        </View>
        <Text style={styles.timelineProcedure}>{surgicalCase.procedureName}</Text>
        <Text style={styles.timelineSurgeon}>{surgicalCase.surgeonName} • {surgicalCase.orId || 'TBD'}</Text>
      </View>
    </TouchableOpacity>
  );
}

// Case Card Component
function CaseCard({
  surgicalCase,
  onPress,
}: {
  surgicalCase: SurgicalCase;
  onPress: () => void;
}) {
  const getPriorityColor = () => {
    switch (surgicalCase.priority) {
      case 'elective': return '#3B82F6';
      case 'urgent': return '#F59E0B';
      case 'emergent': return '#EF4444';
      case 'trauma': return '#DC2626';
      default: return '#6B7280';
    }
  };

  return (
    <TouchableOpacity style={styles.caseCard} onPress={onPress}>
      <View style={styles.caseCardHeader}>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor() }]}>
          <Text style={styles.priorityText}>{surgicalCase.priority.toUpperCase()}</Text>
        </View>
        <Text style={styles.caseCardTime}>{surgicalCase.scheduledTime}</Text>
      </View>
      <Text style={styles.caseCardPatient}>{surgicalCase.patientName}</Text>
      <Text style={styles.caseCardMRN}>MRN: {surgicalCase.mrn}</Text>
      <Text style={styles.caseCardProcedure}>{surgicalCase.procedureName}</Text>
      <View style={styles.caseCardFooter}>
        <Text style={styles.caseCardSurgeon}>👨‍⚕️ {surgicalCase.surgeonName}</Text>
        <Text style={styles.caseCardOR}>{surgicalCase.orId || 'OR TBD'}</Text>
      </View>
    </TouchableOpacity>
  );
}

// Case Detail Modal Component
function CaseDetailModal({
  surgicalCase,
  onClose,
}: {
  surgicalCase: SurgicalCase;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'milestones' | 'team'>('overview');

  const renderOverview = () => (
    <View style={modalStyles.section}>
      <View style={modalStyles.infoRow}>
        <Text style={modalStyles.label}>Patient</Text>
        <Text style={modalStyles.value}>{surgicalCase.patientName}</Text>
      </View>
      <View style={modalStyles.infoRow}>
        <Text style={modalStyles.label}>MRN</Text>
        <Text style={modalStyles.value}>{surgicalCase.mrn}</Text>
      </View>
      <View style={modalStyles.infoRow}>
        <Text style={modalStyles.label}>Procedure</Text>
        <Text style={modalStyles.value}>{surgicalCase.procedureName}</Text>
      </View>
      <View style={modalStyles.infoRow}>
        <Text style={modalStyles.label}>Surgeon</Text>
        <Text style={modalStyles.value}>{surgicalCase.surgeonName}</Text>
      </View>
      <View style={modalStyles.infoRow}>
        <Text style={modalStyles.label}>Anesthesiologist</Text>
        <Text style={modalStyles.value}>{surgicalCase.anesthesiologistName || 'TBD'}</Text>
      </View>
      <View style={modalStyles.infoRow}>
        <Text style={modalStyles.label}>OR</Text>
        <Text style={modalStyles.value}>{surgicalCase.orId || 'TBD'}</Text>
      </View>
      <View style={modalStyles.infoRow}>
        <Text style={modalStyles.label}>Est. Duration</Text>
        <Text style={modalStyles.value}>{surgicalCase.estimatedDuration} minutes</Text>
      </View>
    </View>
  );

  const renderChecklist = () => (
    <View style={modalStyles.section}>
      {surgicalCase.preOpChecklist.map((item) => (
        <View key={item.id} style={modalStyles.checklistItem}>
          <Text style={modalStyles.checkIcon}>{item.isCompleted ? '✅' : '⬜'}</Text>
          <View style={modalStyles.checkContent}>
            <Text style={modalStyles.checkText}>{item.description}</Text>
            {item.isRequired && <Text style={modalStyles.requiredBadge}>Required</Text>}
          </View>
        </View>
      ))}
    </View>
  );

  const renderMilestones = () => (
    <View style={modalStyles.section}>
      {surgicalCase.milestones.map((milestone, index) => (
        <View key={milestone.id} style={modalStyles.milestoneItem}>
          <View style={[modalStyles.milestoneDot, milestone.actualTime && modalStyles.milestoneDotComplete]} />
          <View style={modalStyles.milestoneContent}>
            <Text style={modalStyles.milestoneName}>{milestone.name}</Text>
            {milestone.actualTime && (
              <Text style={modalStyles.milestoneTime}>
                {new Date(milestone.actualTime).toLocaleTimeString()}
                {milestone.duration && ` (${milestone.duration} min)`}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );

  const renderTeam = () => (
    <View style={modalStyles.section}>
      <View style={modalStyles.teamMember}>
        <Text style={modalStyles.teamRole}>Surgeon</Text>
        <Text style={modalStyles.teamName}>{surgicalCase.surgeonName}</Text>
      </View>
      {surgicalCase.anesthesiologistName && (
        <View style={modalStyles.teamMember}>
          <Text style={modalStyles.teamRole}>Anesthesiologist</Text>
          <Text style={modalStyles.teamName}>{surgicalCase.anesthesiologistName}</Text>
        </View>
      )}
      {surgicalCase.nursingTeam.map((member) => (
        <View key={member.id} style={modalStyles.teamMember}>
          <Text style={modalStyles.teamRole}>{member.role.replace('_', ' ')}</Text>
          <Text style={modalStyles.teamName}>{member.name}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={modalStyles.overlay}>
      <View style={modalStyles.container}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>Case Details</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={modalStyles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={modalStyles.tabs}>
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'checklist', label: 'Checklist' },
            { key: 'milestones', label: 'Milestones' },
            { key: 'team', label: 'Team' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[modalStyles.tab, activeTab === tab.key && modalStyles.activeTab]}
              onPress={() => setActiveTab(tab.key as typeof activeTab)}
            >
              <Text style={[modalStyles.tabText, activeTab === tab.key && modalStyles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={modalStyles.content}>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'checklist' && renderChecklist()}
          {activeTab === 'milestones' && renderMilestones()}
          {activeTab === 'team' && renderTeam()}
        </ScrollView>
      </View>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  header: {
    padding: 20,
    backgroundColor: '#1E40AF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#BFDBFE',
    marginTop: 4,
  },
  viewTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  viewTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeViewTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1E40AF',
  },
  viewTabText: {
    fontSize: 14,
    color: '#6B7280',
  },
  activeViewTabText: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  content: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  boardContainer: {
    padding: 12,
    gap: 12,
  },
  orCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  orHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  currentCaseBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  casePatient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  caseProcedure: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 2,
  },
  caseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  caseSurgeon: {
    fontSize: 12,
    color: '#6B7280',
  },
  caseTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  milestoneContainer: {
    marginTop: 8,
  },
  milestoneBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  milestoneFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  milestoneText: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
  },
  turnoverBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
  },
  turnoverText: {
    fontSize: 14,
    color: '#92400E',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#FDE68A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
  },
  nextCaseBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 12,
  },
  nextCaseLabel: {
    fontSize: 12,
    color: '#4338CA',
  },
  nextCasePatient: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  nextCaseTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  availableBox: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  availableText: {
    fontSize: 14,
    color: '#065F46',
    fontWeight: '500',
  },
  timelineContainer: {
    padding: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    width: 60,
    alignItems: 'center',
  },
  timelineTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  timelineLineTop: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  timelineDotActive: {
    backgroundColor: '#10B981',
  },
  timelineLineBottom: {
    position: 'absolute',
    bottom: -16,
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginLeft: 12,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineIcon: {
    fontSize: 16,
  },
  timelinePatient: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  timelineProcedure: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 4,
  },
  timelineSurgeon: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  casesContainer: {
    padding: 12,
    gap: 12,
  },
  caseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  caseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  caseCardTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  caseCardPatient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  caseCardMRN: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  caseCardProcedure: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
  },
  caseCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  caseCardSurgeon: {
    fontSize: 12,
    color: '#6B7280',
  },
  caseCardOR: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    fontSize: 20,
    color: '#6B7280',
  },
  tabs: {
    flexDirection: 'row',
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
    borderBottomColor: '#1E40AF',
  },
  tabText: {
    fontSize: 13,
    color: '#6B7280',
  },
  activeTabText: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  section: {},
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
  },
  value: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  checkIcon: {
    fontSize: 18,
  },
  checkContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    fontSize: 14,
    color: '#374151',
  },
  requiredBadge: {
    fontSize: 10,
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 12,
  },
  milestoneDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    marginTop: 2,
  },
  milestoneDotComplete: {
    backgroundColor: '#10B981',
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneName: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  milestoneTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  teamMember: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  teamRole: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  teamName: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    marginTop: 2,
  },
});
