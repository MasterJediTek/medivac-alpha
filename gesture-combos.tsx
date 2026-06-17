/**
 * Gesture Combos Screen
 * MediVac WACHS v8.9
 * 
 * Power user gesture sequences with combo detection,
 * training mode, streak tracking, and rewards.
 */

import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  gestureCombosService,
  GestureCombo,
  ComboDetectionSession,
  ComboExecution,
  ComboStreak,
  ComboReward,
  GESTURE_ICONS,
  COMBO_SOUNDS,
} from '@/lib/services/gesture-combos-service';

type TabType = 'combos' | 'detection' | 'rewards' | 'history';

export default function GestureCombosScreen() {
  const router = useRouter();
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('combos');
  const [combos, setCombos] = useState<GestureCombo[]>([]);
  const [currentSession, setCurrentSession] = useState<ComboDetectionSession | null>(null);
  const [streak, setStreak] = useState<ComboStreak | null>(null);
  const [rewards, setRewards] = useState<ComboReward[]>([]);
  const [selectedCombo, setSelectedCombo] = useState<GestureCombo | null>(null);

  useEffect(() => {
    loadData();
    const unsubscribe = gestureCombosService.subscribe(loadData);
    return unsubscribe;
  }, []);

  const loadData = useCallback(() => {
    setCombos(gestureCombosService.getAllCombos());
    setCurrentSession(gestureCombosService.getCurrentSession());
    setStreak(gestureCombosService.getStreak());
    setRewards(gestureCombosService.getRewards());
  }, []);

  const haptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const startDetection = (combo?: GestureCombo) => {
    haptic();
    setSelectedCombo(combo || null);
    gestureCombosService.startDetection(combo?.id);
    setActiveTab('detection');
  };

  const simulateGesture = (type: string) => {
    haptic();
    gestureCombosService.inputGesture({
      type: type as any,
      timestamp: Date.now(),
      confidence: 0.8 + Math.random() * 0.2,
      duration: 200 + Math.random() * 300,
    });
  };

  const cancelDetection = () => {
    haptic();
    gestureCombosService.cancelDetection();
    setSelectedCombo(null);
  };

  const toggleCombo = (id: string) => {
    haptic();
    gestureCombosService.toggleCombo(id);
  };

  const toggleFavorite = (id: string) => {
    haptic();
    gestureCombosService.toggleFavorite(id);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#2ECC71';
      case 'medium': return '#F39C12';
      case 'hard': return '#E74C3C';
      case 'expert': return '#9B59B6';
      case 'master': return '#FFD700';
      default: return colors.muted;
    }
  };

  const renderCombos = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Streak Banner */}
      {streak && streak.current > 0 && (
        <View style={[styles.streakBanner, { backgroundColor: '#FFD700' }]}>
          <Text style={styles.streakText}>🔥 {streak.current} Combo Streak!</Text>
          <Text style={styles.streakMultiplier}>{streak.multiplier.toFixed(1)}x Multiplier</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Gesture Combos</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
          Chain gestures for power actions
        </Text>
      </View>

      {/* Quick Start */}
      <TouchableOpacity
        style={[styles.quickStartButton, { backgroundColor: colors.primary }]}
        onPress={() => startDetection()}
      >
        <Text style={styles.quickStartText}>🎯 Start Free Detection</Text>
      </TouchableOpacity>

      {/* Combo List */}
      {combos.map((combo) => (
        <TouchableOpacity
          key={combo.id}
          style={[styles.comboCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => startDetection(combo)}
        >
          <View style={styles.comboHeader}>
            <View style={[styles.comboIcon, { backgroundColor: combo.color }]}>
              <Text style={styles.comboIconText}>{combo.icon}</Text>
            </View>
            <View style={styles.comboInfo}>
              <View style={styles.comboTitleRow}>
                <Text style={[styles.comboName, { color: colors.foreground }]}>{combo.name}</Text>
                {combo.isFavorite && <Text style={styles.favoriteIcon}>⭐</Text>}
              </View>
              <Text style={[styles.comboDescription, { color: colors.muted }]}>{combo.description}</Text>
            </View>
            <TouchableOpacity
              style={[styles.favoriteButton]}
              onPress={() => toggleFavorite(combo.id)}
            >
              <Text style={styles.favoriteButtonText}>{combo.isFavorite ? '⭐' : '☆'}</Text>
            </TouchableOpacity>
          </View>

          {/* Gesture Sequence */}
          <View style={styles.gestureSequence}>
            {combo.gestures.map((gesture, index) => (
              <View key={index} style={styles.gestureItem}>
                <View style={[styles.gestureCircle, { backgroundColor: combo.color + '30' }]}>
                  <Text style={styles.gestureIcon}>{GESTURE_ICONS[gesture.type]}</Text>
                </View>
                {index < combo.gestures.length - 1 && (
                  <Text style={[styles.gestureArrow, { color: colors.muted }]}>→</Text>
                )}
              </View>
            ))}
          </View>

          {/* Stats Row */}
          <View style={styles.comboStats}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(combo.difficulty) }]}>
              <Text style={styles.difficultyText}>{combo.difficulty.toUpperCase()}</Text>
            </View>
            <Text style={[styles.comboStat, { color: colors.muted }]}>
              ✓ {combo.successCount} | ✗ {combo.failCount}
            </Text>
            {combo.bestTime !== Infinity && (
              <Text style={[styles.comboStat, { color: colors.muted }]}>
                ⚡ {combo.bestTime.toFixed(0)}ms best
              </Text>
            )}
          </View>

          {/* Toggle */}
          <TouchableOpacity
            style={[styles.toggleRow, { borderTopColor: colors.border }]}
            onPress={() => toggleCombo(combo.id)}
          >
            <Text style={[styles.toggleLabel, { color: colors.muted }]}>Enabled</Text>
            <View style={[styles.toggle, { backgroundColor: combo.isEnabled ? '#2ECC71' : colors.muted }]}>
              <Text style={styles.toggleText}>{combo.isEnabled ? 'ON' : 'OFF'}</Text>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderDetection = () => (
    <View style={styles.detectionContainer}>
      <View style={styles.detectionHeader}>
        <Text style={[styles.detectionTitle, { color: colors.foreground }]}>
          {currentSession?.state === 'detecting' ? 'Detecting...' :
           currentSession?.state === 'partial' ? 'Keep Going!' :
           currentSession?.state === 'complete' ? '🎉 Combo Complete!' :
           currentSession?.state === 'failed' ? '❌ Combo Failed' :
           currentSession?.state === 'timeout' ? '⏱️ Timeout' : 'Ready'}
        </Text>
        {selectedCombo && (
          <Text style={[styles.detectionCombo, { color: colors.primary }]}>
            {selectedCombo.icon} {selectedCombo.name}
          </Text>
        )}
      </View>

      {/* Visual Guide */}
      {currentSession?.feedback.visualGuide && currentSession.feedback.visualGuide.length > 0 && (
        <View style={styles.visualGuide}>
          {currentSession.feedback.visualGuide.map((frame, index) => (
            <View key={index} style={styles.guideItem}>
              <View style={[
                styles.guideCircle,
                {
                  backgroundColor: frame.isCompleted ? '#2ECC71' : 
                                   frame.isCurrent ? colors.primary : colors.surface,
                  borderColor: frame.isCurrent ? colors.primary : colors.border,
                  borderWidth: frame.isCurrent ? 3 : 1,
                  transform: [{ scale: frame.isCurrent ? 1.2 : 1 }],
                }
              ]}>
                <Text style={[styles.guideIcon, { opacity: frame.isCompleted || frame.isCurrent ? 1 : 0.5 }]}>
                  {frame.icon}
                </Text>
              </View>
              {index < currentSession.feedback.visualGuide.length - 1 && (
                <View style={[styles.guideLine, { backgroundColor: frame.isCompleted ? '#2ECC71' : colors.border }]} />
              )}
            </View>
          ))}
        </View>
      )}

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${currentSession?.feedback.progress || 0}%`,
                backgroundColor: currentSession?.state === 'complete' ? '#2ECC71' : 
                                currentSession?.state === 'failed' ? '#E74C3C' : colors.primary
              }
            ]} 
          />
        </View>
        <Text style={[styles.progressText, { color: colors.muted }]}>
          {currentSession?.feedback.progress?.toFixed(0) || 0}%
        </Text>
      </View>

      {/* Gesture Buttons (for simulation) */}
      <View style={styles.gestureButtons}>
        <Text style={[styles.gestureButtonsTitle, { color: colors.foreground }]}>Tap to Simulate Gestures</Text>
        <View style={styles.gestureGrid}>
          {Object.entries(GESTURE_ICONS).slice(0, 12).map(([type, icon]) => (
            <TouchableOpacity
              key={type}
              style={[styles.gestureButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => simulateGesture(type)}
            >
              <Text style={styles.gestureButtonIcon}>{icon}</Text>
              <Text style={[styles.gestureButtonLabel, { color: colors.muted }]}>{type.split('-')[0]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Controls */}
      <View style={styles.detectionControls}>
        {currentSession?.state === 'complete' || currentSession?.state === 'failed' || currentSession?.state === 'timeout' ? (
          <View style={styles.resultActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => startDetection(selectedCombo || undefined)}
            >
              <Text style={styles.actionButtonText}>🔄 Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.muted }]}
              onPress={() => { cancelDetection(); setActiveTab('combos'); }}
            >
              <Text style={styles.actionButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: '#E74C3C' }]}
            onPress={cancelDetection}
          >
            <Text style={styles.cancelButtonText}>Cancel Detection</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderRewards = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Rewards & Achievements</Text>
      </View>

      {/* Streak Card */}
      <View style={[styles.streakCard, { backgroundColor: colors.surface }]}>
        <Text style={styles.streakCardIcon}>🔥</Text>
        <View style={styles.streakCardInfo}>
          <Text style={[styles.streakCardTitle, { color: colors.foreground }]}>Current Streak</Text>
          <Text style={[styles.streakCardValue, { color: '#FFD700' }]}>{streak?.current || 0}</Text>
        </View>
        <View style={styles.streakCardInfo}>
          <Text style={[styles.streakCardTitle, { color: colors.foreground }]}>Best Streak</Text>
          <Text style={[styles.streakCardValue, { color: colors.primary }]}>{streak?.best || 0}</Text>
        </View>
        <View style={styles.streakCardInfo}>
          <Text style={[styles.streakCardTitle, { color: colors.foreground }]}>Multiplier</Text>
          <Text style={[styles.streakCardValue, { color: '#2ECC71' }]}>{streak?.multiplier.toFixed(1) || 1}x</Text>
        </View>
      </View>

      {/* Rewards List */}
      {rewards.map((reward) => (
        <View 
          key={reward.id}
          style={[
            styles.rewardCard, 
            { 
              backgroundColor: colors.surface, 
              borderColor: reward.unlockedAt ? '#FFD700' : colors.border,
              opacity: reward.unlockedAt ? 1 : 0.6,
            }
          ]}
        >
          <View style={[styles.rewardIcon, { backgroundColor: reward.unlockedAt ? '#FFD700' : colors.muted }]}>
            <Text style={styles.rewardIconText}>{reward.icon}</Text>
          </View>
          <View style={styles.rewardInfo}>
            <Text style={[styles.rewardName, { color: colors.foreground }]}>{reward.name}</Text>
            <Text style={[styles.rewardDescription, { color: colors.muted }]}>{reward.description}</Text>
          </View>
          {reward.unlockedAt ? (
            <View style={[styles.unlockedBadge, { backgroundColor: '#2ECC71' }]}>
              <Text style={styles.unlockedText}>✓</Text>
            </View>
          ) : (
            <View style={[styles.lockedBadge, { backgroundColor: colors.muted }]}>
              <Text style={styles.lockedText}>🔒</Text>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );

  const renderHistory = () => {
    const history = gestureCombosService.getExecutionHistory();
    const analytics = gestureCombosService.getAnalytics();

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Combo History</Text>
        </View>

        {/* Analytics */}
        <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
          <View style={styles.analyticsRow}>
            <View style={styles.analyticsItem}>
              <Text style={[styles.analyticsValue, { color: colors.primary }]}>{analytics.totalExecutions}</Text>
              <Text style={[styles.analyticsLabel, { color: colors.muted }]}>Total</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={[styles.analyticsValue, { color: '#2ECC71' }]}>{analytics.successfulExecutions}</Text>
              <Text style={[styles.analyticsLabel, { color: colors.muted }]}>Success</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={[styles.analyticsValue, { color: '#E74C3C' }]}>{analytics.failedExecutions}</Text>
              <Text style={[styles.analyticsLabel, { color: colors.muted }]}>Failed</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={[styles.analyticsValue, { color: '#F39C12' }]}>{(analytics.avgAccuracy * 100).toFixed(0)}%</Text>
              <Text style={[styles.analyticsLabel, { color: colors.muted }]}>Accuracy</Text>
            </View>
          </View>
        </View>

        {/* History List */}
        {history.slice(0, 20).map((execution, index) => {
          const combo = combos.find(c => c.id === execution.comboId);
          return (
            <View 
              key={execution.id}
              style={[styles.historyItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.historyIcon, { backgroundColor: execution.success ? '#2ECC71' : '#E74C3C' }]}>
                <Text style={styles.historyIconText}>{execution.success ? '✓' : '✗'}</Text>
              </View>
              <View style={styles.historyInfo}>
                <Text style={[styles.historyName, { color: colors.foreground }]}>
                  {combo?.icon} {combo?.name || 'Unknown Combo'}
                </Text>
                <Text style={[styles.historyMeta, { color: colors.muted }]}>
                  {execution.executionTime.toFixed(0)}ms • {(execution.accuracy * 100).toFixed(0)}% accuracy
                </Text>
              </View>
            </View>
          );
        })}

        {history.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>No combo history yet</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Gesture Combos</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.surface }]}>
        {(['combos', 'detection', 'rewards', 'history'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => { haptic(); setActiveTab(tab); }}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.muted }]}>
              {tab === 'combos' ? '🎯 Combos' :
               tab === 'detection' ? '👆 Detect' :
               tab === 'rewards' ? '🏆 Rewards' : '📊 History'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'combos' && renderCombos()}
      {activeTab === 'detection' && renderDetection()}
      {activeTab === 'rewards' && renderRewards()}
      {activeTab === 'history' && renderHistory()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { padding: 4 },
  backText: { fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  headerRight: { width: 60 },
  tabs: { flexDirection: 'row', paddingHorizontal: 8 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 12, fontWeight: '500' },
  tabContent: { flex: 1, padding: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  sectionSubtitle: { fontSize: 14 },
  streakBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 16 },
  streakText: { fontSize: 16, fontWeight: '700', color: '#000' },
  streakMultiplier: { fontSize: 14, fontWeight: '600', color: '#000' },
  quickStartButton: { padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  quickStartText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  comboCard: { borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1 },
  comboHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  comboIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  comboIconText: { fontSize: 24 },
  comboInfo: { flex: 1, marginLeft: 12 },
  comboTitleRow: { flexDirection: 'row', alignItems: 'center' },
  comboName: { fontSize: 16, fontWeight: '600' },
  favoriteIcon: { marginLeft: 6 },
  comboDescription: { fontSize: 12, marginTop: 2 },
  favoriteButton: { padding: 8 },
  favoriteButtonText: { fontSize: 20 },
  gestureSequence: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12, flexWrap: 'wrap' },
  gestureItem: { flexDirection: 'row', alignItems: 'center' },
  gestureCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  gestureIcon: { fontSize: 20 },
  gestureArrow: { marginHorizontal: 4, fontSize: 16 },
  comboStats: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  difficultyBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  difficultyText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  comboStat: { fontSize: 12 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1 },
  toggleLabel: { fontSize: 14 },
  toggle: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  toggleText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  detectionContainer: { flex: 1, padding: 16 },
  detectionHeader: { alignItems: 'center', marginBottom: 24 },
  detectionTitle: { fontSize: 24, fontWeight: '700' },
  detectionCombo: { fontSize: 18, marginTop: 8 },
  visualGuide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  guideItem: { flexDirection: 'row', alignItems: 'center' },
  guideCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  guideIcon: { fontSize: 28 },
  guideLine: { width: 24, height: 3, marginHorizontal: 4 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  progressBar: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { marginLeft: 12, fontSize: 14, fontWeight: '600' },
  gestureButtons: { marginBottom: 24 },
  gestureButtonsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  gestureGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  gestureButton: { width: 70, height: 70, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  gestureButtonIcon: { fontSize: 24 },
  gestureButtonLabel: { fontSize: 10, marginTop: 4 },
  detectionControls: { alignItems: 'center' },
  resultActions: { flexDirection: 'row', gap: 12 },
  actionButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  actionButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  cancelButton: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 30 },
  cancelButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  streakCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 16 },
  streakCardIcon: { fontSize: 40, marginRight: 16 },
  streakCardInfo: { flex: 1, alignItems: 'center' },
  streakCardTitle: { fontSize: 12 },
  streakCardValue: { fontSize: 24, fontWeight: '700' },
  rewardCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 2 },
  rewardIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  rewardIconText: { fontSize: 24 },
  rewardInfo: { flex: 1, marginLeft: 12 },
  rewardName: { fontSize: 16, fontWeight: '600' },
  rewardDescription: { fontSize: 12, marginTop: 2 },
  unlockedBadge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  unlockedText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  lockedBadge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  lockedText: { fontSize: 16 },
  analyticsCard: { borderRadius: 12, padding: 16, marginBottom: 16 },
  analyticsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  analyticsItem: { alignItems: 'center' },
  analyticsValue: { fontSize: 24, fontWeight: '700' },
  analyticsLabel: { fontSize: 10, marginTop: 4 },
  historyItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1 },
  historyIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  historyIconText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  historyInfo: { flex: 1, marginLeft: 12 },
  historyName: { fontSize: 14, fontWeight: '500' },
  historyMeta: { fontSize: 12, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16 },
});
