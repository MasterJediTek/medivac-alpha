// Patient Onboarding Tutorial UI Screen for MediVac WACHS v9.6
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { patientOnboardingTutorialService, TutorialPath, TutorialProgress, TutorialStep, TutorialAchievement } from '@/lib/services/patient-onboarding-tutorial-service';

type TabType = 'paths' | 'progress' | 'achievements' | 'analytics';

export default function OnboardingTutorialScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('paths');
  const [paths, setPaths] = useState<TutorialPath[]>([]);
  const [currentProgress, setCurrentProgress] = useState<TutorialProgress | null>(null);
  const [achievements, setAchievements] = useState<TutorialAchievement[]>([]);
  const [selectedPath, setSelectedPath] = useState<TutorialPath | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setPaths(patientOnboardingTutorialService.getAllPaths());
    setCurrentProgress(patientOnboardingTutorialService.getCurrentProgress());
    setAchievements(patientOnboardingTutorialService.getAchievements());
  };

  const startTutorial = (pathId: string) => {
    const progress = patientOnboardingTutorialService.startTutorial('user_1', pathId, 'patient');
    if (progress) {
      setCurrentProgress(progress);
      setActiveTab('progress');
    }
  };

  const completeStep = () => {
    if (currentProgress) {
      const updated = patientOnboardingTutorialService.completeStep(currentProgress.id);
      setCurrentProgress(updated);
      loadData();
    }
  };

  const skipStep = () => {
    if (currentProgress) {
      const updated = patientOnboardingTutorialService.skipStep(currentProgress.id);
      setCurrentProgress(updated);
    }
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {(['paths', 'progress', 'achievements', 'analytics'] as TabType[]).map((tab) => (
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

  const renderPaths = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.sectionTitle}>Available Tutorial Paths</Text>
      {paths.map((path) => (
        <Pressable
          key={path.id}
          style={styles.pathCard}
          onPress={() => setSelectedPath(path)}
        >
          <View style={styles.pathHeader}>
            <Text style={styles.pathName}>{path.name}</Text>
            <View style={[styles.difficultyBadge, styles[`difficulty_${path.difficulty}`]]}>
              <Text style={styles.difficultyText}>{path.difficulty}</Text>
            </View>
          </View>
          <Text style={styles.pathDescription}>{path.description}</Text>
          <View style={styles.pathMeta}>
            <Text style={styles.metaText}>📚 {path.totalSteps} steps</Text>
            <Text style={styles.metaText}>⏱️ {Math.round(path.estimatedDuration / 60000)} min</Text>
            <Text style={styles.metaText}>👤 {path.targetRole}</Text>
          </View>
          <Pressable
            style={styles.startButton}
            onPress={() => startTutorial(path.id)}
          >
            <Text style={styles.startButtonText}>Start Tutorial</Text>
          </Pressable>
        </Pressable>
      ))}
    </ScrollView>
  );

  const renderProgress = () => {
    if (!currentProgress) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📖</Text>
          <Text style={styles.emptyTitle}>No Active Tutorial</Text>
          <Text style={styles.emptyText}>Select a tutorial path to begin your learning journey</Text>
        </View>
      );
    }

    const path = patientOnboardingTutorialService.getPath(currentProgress.pathId);
    const currentStep = patientOnboardingTutorialService.getCurrentStep(currentProgress.id);
    const progressPercent = (currentProgress.completedSteps.length / (path?.totalSteps || 1)) * 100;

    return (
      <ScrollView style={styles.content}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>{path?.name}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {currentProgress.completedSteps.length} / {path?.totalSteps} steps completed
          </Text>
        </View>

        {currentStep && (
          <View style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepNumber}>Step {currentProgress.currentStepIndex + 1}</Text>
              <View style={[styles.stepTypeBadge, styles[`stepType_${currentStep.type}`]]}>
                <Text style={styles.stepTypeText}>{currentStep.type}</Text>
              </View>
            </View>
            <Text style={styles.stepTitle}>{currentStep.title}</Text>
            <Text style={styles.stepDescription}>{currentStep.description}</Text>

            {currentStep.voiceover && (
              <View style={styles.voiceoverSection}>
                <Text style={styles.voiceoverIcon}>🔊</Text>
                <Text style={styles.voiceoverText}>Voice narration available</Text>
              </View>
            )}

            <View style={styles.stepActions}>
              <Pressable style={styles.completeButton} onPress={completeStep}>
                <Text style={styles.completeButtonText}>Complete Step</Text>
              </Pressable>
              {currentStep.skippable && (
                <Pressable style={styles.skipButton} onPress={skipStep}>
                  <Text style={styles.skipButtonText}>Skip</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {currentProgress.status === 'completed' && (
          <View style={styles.completionCard}>
            <Text style={styles.completionIcon}>🎉</Text>
            <Text style={styles.completionTitle}>Tutorial Complete!</Text>
            <Text style={styles.completionText}>
              You've completed the {path?.name} tutorial
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderAchievements = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.sectionTitle}>Your Achievements</Text>
      <View style={styles.achievementsGrid}>
        {achievements.map((achievement) => (
          <View
            key={achievement.id}
            style={[
              styles.achievementCard,
              achievement.unlockedAt && styles.achievementUnlocked,
            ]}
          >
            <Text style={styles.achievementIcon}>{achievement.icon}</Text>
            <Text style={styles.achievementName}>{achievement.name}</Text>
            <Text style={styles.achievementDescription}>{achievement.description}</Text>
            <View style={[styles.rarityBadge, styles[`rarity_${achievement.rarity}`]]}>
              <Text style={styles.rarityText}>{achievement.rarity}</Text>
            </View>
            {!achievement.unlockedAt && (
              <View style={styles.achievementProgress}>
                <View style={styles.achievementProgressBar}>
                  <View
                    style={[
                      styles.achievementProgressFill,
                      { width: `${(achievement.progress / achievement.maxProgress) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.achievementProgressText}>
                  {achievement.progress}/{achievement.maxProgress}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderAnalytics = () => {
    const analytics = patientOnboardingTutorialService.getAnalytics();

    return (
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Tutorial Analytics</Text>
        <View style={styles.analyticsGrid}>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>{analytics.totalUsers}</Text>
            <Text style={styles.analyticsLabel}>Total Users</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>{analytics.completionRate.toFixed(1)}%</Text>
            <Text style={styles.analyticsLabel}>Completion Rate</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>
              {Math.round(analytics.averageCompletionTime / 60000)}m
            </Text>
            <Text style={styles.analyticsLabel}>Avg. Time</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>{analytics.averageQuizScore.toFixed(1)}%</Text>
            <Text style={styles.analyticsLabel}>Quiz Score</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Onboarding Tutorial</Text>
        <Text style={styles.subtitle}>Learn to use MediVac WACHS</Text>
      </View>
      {renderTabs()}
      {activeTab === 'paths' && renderPaths()}
      {activeTab === 'progress' && renderProgress()}
      {activeTab === 'achievements' && renderAchievements()}
      {activeTab === 'analytics' && renderAnalytics()}
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
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginBottom: 16 },
  pathCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  pathHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pathName: { fontSize: 16, fontWeight: '600', color: '#1E293B', flex: 1 },
  difficultyBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  difficulty_beginner: { backgroundColor: '#DCFCE7' },
  difficulty_intermediate: { backgroundColor: '#FEF3C7' },
  difficulty_advanced: { backgroundColor: '#FEE2E2' },
  difficultyText: { fontSize: 12, fontWeight: '500', color: '#1E293B' },
  pathDescription: { fontSize: 14, color: '#64748B', marginBottom: 12 },
  pathMeta: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  metaText: { fontSize: 12, color: '#94A3B8' },
  startButton: { backgroundColor: '#1E3A5F', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  startButtonText: { color: '#FFFFFF', fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  progressHeader: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16 },
  progressTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginBottom: 12 },
  progressBar: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#22C55E', borderRadius: 4 },
  progressText: { fontSize: 14, color: '#64748B', marginTop: 8 },
  stepCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16 },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  stepNumber: { fontSize: 14, fontWeight: '600', color: '#1E3A5F' },
  stepTypeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  stepType_intro: { backgroundColor: '#DBEAFE' },
  stepType_feature: { backgroundColor: '#DCFCE7' },
  stepType_action: { backgroundColor: '#FEF3C7' },
  stepType_quiz: { backgroundColor: '#F3E8FF' },
  stepType_celebration: { backgroundColor: '#FCE7F3' },
  stepType_summary: { backgroundColor: '#E0E7FF' },
  stepTypeText: { fontSize: 12, fontWeight: '500', color: '#1E293B' },
  stepTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginBottom: 8 },
  stepDescription: { fontSize: 14, color: '#64748B', marginBottom: 16 },
  voiceoverSection: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 8 },
  voiceoverIcon: { fontSize: 20 },
  voiceoverText: { fontSize: 14, color: '#64748B' },
  stepActions: { flexDirection: 'row', gap: 12 },
  completeButton: { flex: 1, backgroundColor: '#22C55E', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  completeButtonText: { color: '#FFFFFF', fontWeight: '600' },
  skipButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  skipButtonText: { color: '#64748B', fontWeight: '600' },
  completionCard: { backgroundColor: '#DCFCE7', borderRadius: 12, padding: 24, alignItems: 'center' },
  completionIcon: { fontSize: 48, marginBottom: 12 },
  completionTitle: { fontSize: 20, fontWeight: '600', color: '#166534', marginBottom: 8 },
  completionText: { fontSize: 14, color: '#15803D', textAlign: 'center' },
  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  achievementCard: { width: '48%', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  achievementUnlocked: { backgroundColor: '#FFFFFF', borderColor: '#22C55E' },
  achievementIcon: { fontSize: 32, marginBottom: 8 },
  achievementName: { fontSize: 14, fontWeight: '600', color: '#1E293B', textAlign: 'center', marginBottom: 4 },
  achievementDescription: { fontSize: 12, color: '#64748B', textAlign: 'center', marginBottom: 8 },
  rarityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  rarity_common: { backgroundColor: '#E2E8F0' },
  rarity_uncommon: { backgroundColor: '#DCFCE7' },
  rarity_rare: { backgroundColor: '#DBEAFE' },
  rarity_epic: { backgroundColor: '#F3E8FF' },
  rarity_legendary: { backgroundColor: '#FEF3C7' },
  rarityText: { fontSize: 10, fontWeight: '600', color: '#1E293B', textTransform: 'uppercase' },
  achievementProgress: { width: '100%', marginTop: 8 },
  achievementProgressBar: { height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, overflow: 'hidden' },
  achievementProgressFill: { height: '100%', backgroundColor: '#1E3A5F' },
  achievementProgressText: { fontSize: 10, color: '#94A3B8', textAlign: 'center', marginTop: 4 },
  analyticsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  analyticsCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  analyticsValue: { fontSize: 24, fontWeight: 'bold', color: '#1E3A5F' },
  analyticsLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
});
