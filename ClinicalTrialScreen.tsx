/**
 * Clinical Trial Matching Screen
 * MediVac One v3.3
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import clinicalTrialService, {
  ClinicalTrial,
  TrialMatch,
} from '@/src/services/ClinicalTrialService';

const DISCO_COLORS = {
  neonPink: '#FF1493',
  neonCyan: '#00FFFF',
  neonPurple: '#9400D3',
  neonGreen: '#39FF14',
  neonOrange: '#FF6600',
  darkBg: '#1a1a2e',
  cardBg: '#16213e',
};

const PHASE_COLORS: Record<string, string> = {
  phase_1: '#FF6B6B',
  phase_2: '#4ECDC4',
  phase_3: '#45B7D1',
  phase_4: '#96CEB4',
  observational: '#FFEAA7',
};

export default function ClinicalTrialScreen() {
  const [activeTab, setActiveTab] = useState<'trials' | 'matching' | 'enrollments'>('trials');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrial, setSelectedTrial] = useState<ClinicalTrial | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>('all');

  const allTrials = clinicalTrialService.getAllTrials();
  const recruitingTrials = clinicalTrialService.getRecruitingTrials();
  const stats = clinicalTrialService.getOverallStatistics();

  const filteredTrials = searchQuery
    ? allTrials.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.nctNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.conditions.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : selectedArea === 'all'
    ? allTrials
    : clinicalTrialService.getTrialsByTherapeuticArea(selectedArea);

  const formatPhase = (phase: string): string => {
    return phase.replace('_', ' ').toUpperCase();
  };

  const getEnrollmentProgress = (trial: ClinicalTrial): number => {
    return Math.round((trial.currentEnrollment / trial.targetEnrollment) * 100);
  };

  const renderTrialCard = (trial: ClinicalTrial) => {
    const progress = getEnrollmentProgress(trial);
    const analytics = clinicalTrialService.getTrialAnalytics(trial.id);

    return (
      <TouchableOpacity
        key={trial.id}
        style={styles.trialCard}
        onPress={() => setSelectedTrial(trial)}
      >
        <View style={styles.trialHeader}>
          <View style={[styles.phaseBadge, { backgroundColor: PHASE_COLORS[trial.phase] }]}>
            <Text style={styles.phaseText}>{formatPhase(trial.phase)}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: trial.status === 'recruiting' ? DISCO_COLORS.neonGreen : '#888' }
          ]}>
            <Text style={styles.statusText}>
              {trial.status === 'recruiting' ? '🟢 Recruiting' : trial.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <Text style={styles.trialTitle}>{trial.shortTitle}</Text>
        <Text style={styles.nctNumber}>{trial.nctNumber}</Text>
        <Text style={styles.trialDescription} numberOfLines={2}>{trial.description}</Text>

        <View style={styles.conditionTags}>
          {trial.conditions.slice(0, 3).map((condition, idx) => (
            <View key={idx} style={styles.conditionTag}>
              <Text style={styles.conditionText}>{condition}</Text>
            </View>
          ))}
        </View>

        <View style={styles.enrollmentSection}>
          <Text style={styles.enrollmentLabel}>Enrollment Progress</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.enrollmentText}>
            {trial.currentEnrollment} / {trial.targetEnrollment} ({progress}%)
          </Text>
        </View>

        <View style={styles.trialMeta}>
          <Text style={styles.metaText}>🏥 {trial.sponsor}</Text>
          <Text style={styles.metaText}>👨‍⚕️ {trial.principalInvestigator}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTrialDetail = () => {
    if (!selectedTrial) return null;

    const analytics = clinicalTrialService.getTrialAnalytics(selectedTrial.id);
    const progress = getEnrollmentProgress(selectedTrial);

    return (
      <View style={styles.detailOverlay}>
        <ScrollView style={styles.detailScroll}>
          <View style={styles.detailCard}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedTrial(null)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.detailHeader}>
              <View style={[styles.phaseBadge, { backgroundColor: PHASE_COLORS[selectedTrial.phase] }]}>
                <Text style={styles.phaseText}>{formatPhase(selectedTrial.phase)}</Text>
              </View>
              <Text style={styles.detailNct}>{selectedTrial.nctNumber}</Text>
            </View>

            <Text style={styles.detailTitle}>{selectedTrial.title}</Text>
            <Text style={styles.detailDescription}>{selectedTrial.description}</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{analytics.totalScreened}</Text>
                <Text style={styles.statLabel}>Screened</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{analytics.totalEnrolled}</Text>
                <Text style={styles.statLabel}>Enrolled</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Math.round(analytics.enrollmentRate)}%</Text>
                <Text style={styles.statLabel}>Enrollment Rate</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{progress}%</Text>
                <Text style={styles.statLabel}>Target Progress</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📋 Eligibility Criteria</Text>
              <View style={styles.criteriaList}>
                {selectedTrial.eligibilityCriteria
                  .filter(c => c.type === 'inclusion')
                  .map((criterion, idx) => (
                    <View key={idx} style={styles.criterionItem}>
                      <Text style={styles.inclusionIcon}>✅</Text>
                      <Text style={styles.criterionText}>{criterion.description}</Text>
                    </View>
                  ))}
                {selectedTrial.eligibilityCriteria
                  .filter(c => c.type === 'exclusion')
                  .map((criterion, idx) => (
                    <View key={idx} style={styles.criterionItem}>
                      <Text style={styles.exclusionIcon}>❌</Text>
                      <Text style={styles.criterionText}>{criterion.description}</Text>
                    </View>
                  ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💊 Interventions</Text>
              {selectedTrial.interventions.map((intervention, idx) => (
                <View key={idx} style={styles.interventionItem}>
                  <Text style={styles.interventionText}>{intervention}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📍 Study Locations</Text>
              {selectedTrial.locations.map((location, idx) => (
                <View key={idx} style={styles.locationCard}>
                  <Text style={styles.locationName}>{location.name}</Text>
                  <Text style={styles.locationAddress}>
                    {location.address}, {location.city}, {location.state} {location.zipCode}
                  </Text>
                  <Text style={styles.locationContact}>
                    📞 {location.contactPhone} | ✉️ {location.contactEmail}
                  </Text>
                  {location.isRecruiting && (
                    <View style={styles.recruitingBadge}>
                      <Text style={styles.recruitingText}>🟢 Actively Recruiting</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.matchButton}>
                <Text style={styles.matchButtonText}>🔍 Find Matching Patients</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.enrollButton}>
                <Text style={styles.enrollButtonText}>📝 Enroll Patient</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderAreaFilter = () => {
    const areas = ['all', 'Cardiology', 'Endocrinology', 'Oncology'];

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {areas.map((area) => (
          <TouchableOpacity
            key={area}
            style={[
              styles.filterChip,
              selectedArea === area && styles.filterChipActive,
            ]}
            onPress={() => setSelectedArea(area)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedArea === area && styles.filterChipTextActive,
              ]}
            >
              {area === 'all' ? '🔬 All Areas' : area}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🧬 Clinical Trials</Text>
          <Text style={styles.subtitle}>Patient Matching & Enrollment</Text>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsSummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{stats.totalTrials}</Text>
            <Text style={styles.summaryLabel}>Total Trials</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{stats.recruitingTrials}</Text>
            <Text style={styles.summaryLabel}>Recruiting</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{stats.totalEnrollments}</Text>
            <Text style={styles.summaryLabel}>Enrollments</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {(['trials', 'matching', 'enrollments'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'trials' ? '🔬 Trials' : tab === 'matching' ? '🎯 Matching' : '📋 Enrolled'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'trials' && (
          <>
            {/* Search */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="🔍 Search trials, NCT numbers, conditions..."
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Area Filter */}
            {renderAreaFilter()}

            {/* Trial List */}
            <ScrollView style={styles.trialList}>
              {filteredTrials.map(renderTrialCard)}
              {filteredTrials.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🧪</Text>
                  <Text style={styles.emptyText}>No trials found</Text>
                </View>
              )}
            </ScrollView>
          </>
        )}

        {activeTab === 'matching' && (
          <ScrollView style={styles.matchingContainer}>
            <View style={styles.matchingCard}>
              <Text style={styles.matchingTitle}>🎯 Patient-Trial Matching</Text>
              <Text style={styles.matchingDescription}>
                Select a patient to find matching clinical trials based on their diagnosis, demographics, and medical history.
              </Text>
              <TouchableOpacity style={styles.selectPatientButton}>
                <Text style={styles.selectPatientText}>👤 Select Patient for Matching</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recentMatchesCard}>
              <Text style={styles.recentMatchesTitle}>📊 Recent Matches</Text>
              <View style={styles.matchStats}>
                <View style={styles.matchStatItem}>
                  <Text style={styles.matchStatValue}>24</Text>
                  <Text style={styles.matchStatLabel}>Matches Found</Text>
                </View>
                <View style={styles.matchStatItem}>
                  <Text style={styles.matchStatValue}>8</Text>
                  <Text style={styles.matchStatLabel}>Interested</Text>
                </View>
                <View style={styles.matchStatItem}>
                  <Text style={styles.matchStatValue}>5</Text>
                  <Text style={styles.matchStatLabel}>Enrolled</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        )}

        {activeTab === 'enrollments' && (
          <ScrollView style={styles.enrollmentContainer}>
            <View style={styles.enrollmentCard}>
              <Text style={styles.enrollmentTitle}>📋 Active Enrollments</Text>
              <View style={styles.enrollmentStats}>
                <View style={styles.enrollStatItem}>
                  <Text style={styles.enrollStatValue}>12</Text>
                  <Text style={styles.enrollStatLabel}>Screening</Text>
                </View>
                <View style={styles.enrollStatItem}>
                  <Text style={styles.enrollStatValue}>87</Text>
                  <Text style={styles.enrollStatLabel}>Active</Text>
                </View>
                <View style={styles.enrollStatItem}>
                  <Text style={styles.enrollStatValue}>45</Text>
                  <Text style={styles.enrollStatLabel}>Completed</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Trial Detail Modal */}
        {selectedTrial && renderTrialDetail()}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DISCO_COLORS.darkBg,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: DISCO_COLORS.neonPurple + '40',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: DISCO_COLORS.neonCyan,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  statsSummary: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: DISCO_COLORS.cardBg,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DISCO_COLORS.neonPink + '40',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DISCO_COLORS.neonPink,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: DISCO_COLORS.cardBg,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: DISCO_COLORS.neonPurple,
  },
  tabText: {
    color: '#888',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  searchContainer: {
    padding: 10,
  },
  searchInput: {
    backgroundColor: DISCO_COLORS.cardBg,
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    borderWidth: 1,
    borderColor: DISCO_COLORS.neonCyan + '40',
  },
  filterScroll: {
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: DISCO_COLORS.cardBg,
    marginRight: 10,
    borderWidth: 1,
    borderColor: DISCO_COLORS.neonGreen + '40',
  },
  filterChipActive: {
    backgroundColor: DISCO_COLORS.neonGreen,
    borderColor: DISCO_COLORS.neonGreen,
  },
  filterChipText: {
    color: '#888',
    fontSize: 12,
  },
  filterChipTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  trialList: {
    flex: 1,
    padding: 10,
  },
  trialCard: {
    backgroundColor: DISCO_COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: DISCO_COLORS.neonCyan + '30',
  },
  trialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  phaseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  phaseText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000',
  },
  trialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  nctNumber: {
    fontSize: 12,
    color: DISCO_COLORS.neonCyan,
    marginBottom: 8,
  },
  trialDescription: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 10,
    lineHeight: 18,
  },
  conditionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  conditionTag: {
    backgroundColor: DISCO_COLORS.neonPurple + '30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  conditionText: {
    fontSize: 11,
    color: DISCO_COLORS.neonPurple,
  },
  enrollmentSection: {
    marginBottom: 12,
  },
  enrollmentLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: DISCO_COLORS.darkBg,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: DISCO_COLORS.neonGreen,
    borderRadius: 4,
  },
  enrollmentText: {
    fontSize: 11,
    color: DISCO_COLORS.neonGreen,
  },
  trialMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 11,
    color: '#888',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  detailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  detailScroll: {
    flex: 1,
  },
  detailCard: {
    backgroundColor: DISCO_COLORS.cardBg,
    margin: 15,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: DISCO_COLORS.neonCyan,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#888',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  detailNct: {
    fontSize: 14,
    color: DISCO_COLORS.neonCyan,
    fontWeight: '600',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    lineHeight: 24,
  },
  detailDescription: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 20,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: DISCO_COLORS.darkBg,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DISCO_COLORS.neonCyan,
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  criteriaList: {
    gap: 8,
  },
  criterionItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  inclusionIcon: {
    fontSize: 14,
  },
  exclusionIcon: {
    fontSize: 14,
  },
  criterionText: {
    flex: 1,
    fontSize: 13,
    color: '#aaa',
    lineHeight: 18,
  },
  interventionItem: {
    backgroundColor: DISCO_COLORS.darkBg,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  interventionText: {
    fontSize: 13,
    color: '#fff',
  },
  locationCard: {
    backgroundColor: DISCO_COLORS.darkBg,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  locationName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 4,
  },
  locationContact: {
    fontSize: 11,
    color: DISCO_COLORS.neonCyan,
    marginBottom: 8,
  },
  recruitingBadge: {
    backgroundColor: DISCO_COLORS.neonGreen + '30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  recruitingText: {
    fontSize: 11,
    color: DISCO_COLORS.neonGreen,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  matchButton: {
    flex: 1,
    backgroundColor: DISCO_COLORS.neonPink,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  matchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  enrollButton: {
    flex: 1,
    backgroundColor: DISCO_COLORS.neonGreen + '30',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DISCO_COLORS.neonGreen,
  },
  enrollButtonText: {
    color: DISCO_COLORS.neonGreen,
    fontWeight: 'bold',
  },
  matchingContainer: {
    flex: 1,
    padding: 15,
  },
  matchingCard: {
    backgroundColor: DISCO_COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: DISCO_COLORS.neonPink + '40',
  },
  matchingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  matchingDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 15,
    lineHeight: 20,
  },
  selectPatientButton: {
    backgroundColor: DISCO_COLORS.neonPink,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectPatientText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  recentMatchesCard: {
    backgroundColor: DISCO_COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: DISCO_COLORS.neonGreen + '40',
  },
  recentMatchesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  matchStats: {
    flexDirection: 'row',
    gap: 10,
  },
  matchStatItem: {
    flex: 1,
    backgroundColor: DISCO_COLORS.darkBg,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  matchStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DISCO_COLORS.neonGreen,
  },
  matchStatLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  enrollmentContainer: {
    flex: 1,
    padding: 15,
  },
  enrollmentCard: {
    backgroundColor: DISCO_COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: DISCO_COLORS.neonCyan + '40',
  },
  enrollmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  enrollmentStats: {
    flexDirection: 'row',
    gap: 10,
  },
  enrollStatItem: {
    flex: 1,
    backgroundColor: DISCO_COLORS.darkBg,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  enrollStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DISCO_COLORS.neonCyan,
  },
  enrollStatLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
});
