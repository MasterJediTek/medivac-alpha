/**
 * Staff Gamification Leaderboard Screen
 * Disco-themed achievements, points, and rewards
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import {
  gamificationService,
  LeaderboardEntry,
  StaffMember,
  Badge,
  Challenge,
  Reward,
} from '@/src/services/GamificationService';
import { DISCO_COLORS, getGlowShadow } from '@/src/theme/DiscoTheme';

type ScreenMode = 'leaderboard' | 'profile' | 'challenges' | 'rewards';

export default function GamificationScreen() {
  const [mode, setMode] = useState<ScreenMode>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null);
  const [staffBadges, setStaffBadges] = useState<Badge[]>([]);
  const [dailyChallenges, setDailyChallenges] = useState<Challenge[]>([]);
  const [weeklyChallenges, setWeeklyChallenges] = useState<Challenge[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [glowAnim] = useState(new Animated.Value(0));

  const loadData = useCallback(() => {
    setLeaderboard(gamificationService.getLeaderboard(10));
    const staff = gamificationService.getStaffMember('STAFF-001');
    setCurrentStaff(staff || null);
    if (staff) {
      setStaffBadges(gamificationService.getStaffBadges(staff.id));
    }
    setDailyChallenges(gamificationService.getDailyChallenges());
    setWeeklyChallenges(gamificationService.getWeeklyChallenges());
    setRewards(gamificationService.getAvailableRewards());
  }, []);

  useEffect(() => {
    gamificationService.initialize().then(loadData);
    const unsubscribe = gamificationService.subscribe(loadData);

    // Pulse animation for top ranks
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
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

  const getRankColor = (rank: number): string => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return DISCO_COLORS.neonCyan;
  };

  const getRankEmoji = (rank: number): string => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'same', amount: number): string => {
    if (trend === 'up') return `↑${amount}`;
    if (trend === 'down') return `↓${amount}`;
    return '—';
  };

  const renderLeaderboard = () => (
    <ScrollView contentContainerStyle={styles.leaderboardContent}>
      {/* Current User Stats */}
      {currentStaff && (
        <View style={[styles.userStatsCard, getGlowShadow(DISCO_COLORS.neonPink)]}>
          <View style={styles.userHeader}>
            <Text style={styles.userAvatar}>{currentStaff.avatar}</Text>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{currentStaff.name}</Text>
              <Text style={styles.userRole}>{currentStaff.role} • {currentStaff.department}</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>LVL</Text>
              <Text style={styles.levelValue}>{currentStaff.level}</Text>
            </View>
          </View>
          <View style={styles.userStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentStaff.totalPoints.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>🔥 {currentStaff.currentStreak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentStaff.badges.length}</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
          </View>
          {/* XP Progress */}
          <View style={styles.xpSection}>
            <Text style={styles.xpLabel}>XP to Level {currentStaff.level + 1}</Text>
            <View style={styles.xpBar}>
              <View style={[styles.xpFill, { width: `${gamificationService.getXpProgress(currentStaff.xp).percentage}%` }]} />
            </View>
            <Text style={styles.xpText}>
              {gamificationService.getXpProgress(currentStaff.xp).current.toLocaleString()} / {gamificationService.getXpProgress(currentStaff.xp).required.toLocaleString()} XP
            </Text>
          </View>
        </View>
      )}

      {/* Leaderboard Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🏆 Top Performers</Text>
        <Text style={styles.sectionSubtitle}>This Month</Text>
      </View>

      {/* Leaderboard List */}
      {leaderboard.map((entry, idx) => (
        <Animated.View
          key={entry.staffId}
          style={[
            styles.leaderboardItem,
            idx < 3 && { transform: [{ scale: pulseAnim }] },
            getGlowShadow(getRankColor(entry.rank), idx < 3 ? 0.8 : 0.4),
          ]}
        >
          <View style={[styles.rankBadge, { backgroundColor: getRankColor(entry.rank) + '40' }]}>
            <Text style={[styles.rankText, { color: getRankColor(entry.rank) }]}>
              {getRankEmoji(entry.rank)}
            </Text>
          </View>
          <Text style={styles.entryAvatar}>{entry.avatar}</Text>
          <View style={styles.entryInfo}>
            <Text style={styles.entryName}>{entry.name}</Text>
            <Text style={styles.entryRole}>{entry.role} • Lvl {entry.level}</Text>
          </View>
          <View style={styles.entryStats}>
            <Text style={styles.entryPoints}>{entry.points.toLocaleString()}</Text>
            <Text style={[styles.entryTrend, { color: entry.trend === 'up' ? DISCO_COLORS.neonGreen : entry.trend === 'down' ? DISCO_COLORS.neonRed : '#888' }]}>
              {getTrendIcon(entry.trend, entry.trendAmount)}
            </Text>
          </View>
        </Animated.View>
      ))}
    </ScrollView>
  );

  const renderProfile = () => {
    if (!currentStaff) return null;

    return (
      <ScrollView contentContainerStyle={styles.profileContent}>
        {/* Profile Header */}
        <View style={[styles.profileHeader, getGlowShadow(DISCO_COLORS.neonPurple)]}>
          <Text style={styles.profileAvatar}>{currentStaff.avatar}</Text>
          <Text style={styles.profileName}>{currentStaff.name}</Text>
          <Text style={styles.profileRole}>{currentStaff.role} • {currentStaff.department}</Text>
          <View style={styles.profileLevelBadge}>
            <Text style={styles.profileLevelText}>LEVEL {currentStaff.level}</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, getGlowShadow(DISCO_COLORS.neonGreen, 0.5)]}>
            <Text style={styles.statCardValue}>{currentStaff.totalPoints.toLocaleString()}</Text>
            <Text style={styles.statCardLabel}>Total Points</Text>
          </View>
          <View style={[styles.statCard, getGlowShadow(DISCO_COLORS.neonOrange, 0.5)]}>
            <Text style={styles.statCardValue}>{currentStaff.currentStreak}</Text>
            <Text style={styles.statCardLabel}>Current Streak 🔥</Text>
          </View>
          <View style={[styles.statCard, getGlowShadow(DISCO_COLORS.neonCyan, 0.5)]}>
            <Text style={styles.statCardValue}>{currentStaff.longestStreak}</Text>
            <Text style={styles.statCardLabel}>Best Streak</Text>
          </View>
          <View style={[styles.statCard, getGlowShadow(DISCO_COLORS.neonPink, 0.5)]}>
            <Text style={styles.statCardValue}>{currentStaff.xp.toLocaleString()}</Text>
            <Text style={styles.statCardLabel}>Total XP</Text>
          </View>
        </View>

        {/* Badges Section */}
        <Text style={styles.sectionTitle}>🏅 Badges Earned ({staffBadges.length})</Text>
        <View style={styles.badgesGrid}>
          {staffBadges.map((badge) => (
            <View key={badge.id} style={[styles.badgeCard, { borderColor: badge.discoColor }, getGlowShadow(badge.discoColor, 0.6)]}>
              <Text style={styles.badgeIcon}>{badge.icon}</Text>
              <Text style={styles.badgeName}>{badge.name}</Text>
              <View style={[styles.rarityBadge, { backgroundColor: gamificationService.getRarityColor(badge.rarity) + '40' }]}>
                <Text style={[styles.rarityText, { color: gamificationService.getRarityColor(badge.rarity) }]}>
                  {badge.rarity.toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Available Badges */}
        <Text style={styles.sectionTitle}>🔒 Badges to Unlock</Text>
        <View style={styles.badgesGrid}>
          {gamificationService.BADGES.filter(b => !currentStaff.badges.includes(b.id)).slice(0, 6).map((badge) => (
            <View key={badge.id} style={[styles.badgeCard, styles.lockedBadge]}>
              <Text style={[styles.badgeIcon, { opacity: 0.3 }]}>{badge.icon}</Text>
              <Text style={[styles.badgeName, { opacity: 0.5 }]}>{badge.name}</Text>
              <Text style={styles.badgeCriteria}>{badge.criteria}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderChallenges = () => (
    <ScrollView contentContainerStyle={styles.challengesContent}>
      {/* Daily Challenges */}
      <Text style={styles.sectionTitle}>📅 Daily Challenges</Text>
      {dailyChallenges.map((challenge) => (
        <View key={challenge.id} style={[styles.challengeCard, getGlowShadow(DISCO_COLORS.neonCyan)]}>
          <View style={styles.challengeHeader}>
            <Text style={styles.challengeIcon}>{challenge.icon}</Text>
            <View style={styles.challengeInfo}>
              <Text style={styles.challengeTitle}>{challenge.title}</Text>
              <Text style={styles.challengeDesc}>{challenge.description}</Text>
            </View>
            <View style={styles.challengeReward}>
              <Text style={styles.rewardXP}>+{challenge.xpReward} XP</Text>
              <Text style={styles.rewardPoints}>+{challenge.pointsReward} pts</Text>
            </View>
          </View>
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(challenge.currentValue / challenge.targetValue) * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>{challenge.currentValue}/{challenge.targetValue}</Text>
          </View>
        </View>
      ))}

      {/* Weekly Challenges */}
      <Text style={styles.sectionTitle}>📆 Weekly Challenges</Text>
      {weeklyChallenges.map((challenge) => (
        <View key={challenge.id} style={[styles.challengeCard, getGlowShadow(DISCO_COLORS.neonPurple)]}>
          <View style={styles.challengeHeader}>
            <Text style={styles.challengeIcon}>{challenge.icon}</Text>
            <View style={styles.challengeInfo}>
              <Text style={styles.challengeTitle}>{challenge.title}</Text>
              <Text style={styles.challengeDesc}>{challenge.description}</Text>
            </View>
            <View style={styles.challengeReward}>
              <Text style={styles.rewardXP}>+{challenge.xpReward} XP</Text>
              <Text style={styles.rewardPoints}>+{challenge.pointsReward} pts</Text>
            </View>
          </View>
          <View style={styles.progressSection}>
            <View style={[styles.progressBar, { backgroundColor: DISCO_COLORS.neonPurple + '30' }]}>
              <View style={[styles.progressFill, { width: `${(challenge.currentValue / challenge.targetValue) * 100}%`, backgroundColor: DISCO_COLORS.neonPurple }]} />
            </View>
            <Text style={styles.progressText}>{challenge.currentValue}/{challenge.targetValue}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderRewards = () => (
    <ScrollView contentContainerStyle={styles.rewardsContent}>
      <View style={styles.pointsBalance}>
        <Text style={styles.balanceLabel}>Your Points Balance</Text>
        <Text style={styles.balanceValue}>{currentStaff?.totalPoints.toLocaleString() || 0}</Text>
      </View>

      <Text style={styles.sectionTitle}>🎁 Available Rewards</Text>
      {rewards.map((reward) => (
        <View key={reward.id} style={[styles.rewardCard, getGlowShadow(DISCO_COLORS.neonGreen)]}>
          <Text style={styles.rewardIcon}>{reward.icon}</Text>
          <View style={styles.rewardInfo}>
            <Text style={styles.rewardName}>{reward.name}</Text>
            <Text style={styles.rewardDesc}>{reward.description}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.redeemButton,
              (currentStaff?.totalPoints || 0) < reward.pointsCost && styles.redeemButtonDisabled,
            ]}
            disabled={(currentStaff?.totalPoints || 0) < reward.pointsCost}
          >
            <Text style={styles.redeemCost}>{reward.pointsCost.toLocaleString()}</Text>
            <Text style={styles.redeemLabel}>pts</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <ScreenContainer containerClassName="bg-[#0D0D0D]">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🕺</Text>
        <Text style={styles.headerTitle}>DISCO LEADERBOARD</Text>
        <Text style={styles.headerSubtitle}>Earn • Compete • Win</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(['leaderboard', 'profile', 'challenges', 'rewards'] as ScreenMode[]).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, mode === tab && styles.activeTab]} onPress={() => setMode(tab)}>
            <Text style={styles.tabIcon}>
              {tab === 'leaderboard' ? '🏆' : tab === 'profile' ? '👤' : tab === 'challenges' ? '🎯' : '🎁'}
            </Text>
            <Text style={[styles.tabLabel, mode === tab && styles.activeTabLabel]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {mode === 'leaderboard' && renderLeaderboard()}
      {mode === 'profile' && renderProfile()}
      {mode === 'challenges' && renderChallenges()}
      {mode === 'rewards' && renderRewards()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingVertical: 16, backgroundColor: DISCO_COLORS.midnightPurple },
  headerEmoji: { fontSize: 36 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: 3 },
  headerSubtitle: { fontSize: 11, color: DISCO_COLORS.neonPink, letterSpacing: 4, marginTop: 4 },
  tabBar: { flexDirection: 'row', backgroundColor: DISCO_COLORS.darkDisco, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: DISCO_COLORS.neonPink + '40' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: DISCO_COLORS.neonPink },
  tabIcon: { fontSize: 18 },
  tabLabel: { fontSize: 10, color: '#888', marginTop: 2 },
  activeTabLabel: { color: DISCO_COLORS.neonPink },
  leaderboardContent: { padding: 16, paddingBottom: 100 },
  userStatsCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 2, borderColor: DISCO_COLORS.neonPink },
  userHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  userAvatar: { fontSize: 40, marginRight: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  userRole: { fontSize: 12, color: '#888' },
  levelBadge: { backgroundColor: DISCO_COLORS.neonPink, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
  levelText: { fontSize: 9, color: '#000', fontWeight: 'bold' },
  levelValue: { fontSize: 20, color: '#000', fontWeight: '900' },
  userStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  statLabel: { fontSize: 11, color: '#888' },
  xpSection: { marginTop: 8 },
  xpLabel: { fontSize: 11, color: '#888', marginBottom: 6 },
  xpBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: DISCO_COLORS.neonCyan, borderRadius: 4 },
  xpText: { fontSize: 11, color: DISCO_COLORS.neonCyan, marginTop: 4, textAlign: 'right' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12, marginTop: 8 },
  sectionSubtitle: { fontSize: 12, color: '#888' },
  leaderboardItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  rankBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rankText: { fontSize: 16, fontWeight: 'bold' },
  entryAvatar: { fontSize: 28, marginRight: 12 },
  entryInfo: { flex: 1 },
  entryName: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' },
  entryRole: { fontSize: 11, color: '#888' },
  entryStats: { alignItems: 'flex-end' },
  entryPoints: { fontSize: 16, fontWeight: 'bold', color: DISCO_COLORS.neonGreen },
  entryTrend: { fontSize: 11, fontWeight: 'bold' },
  profileContent: { padding: 16, paddingBottom: 100 },
  profileHeader: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: DISCO_COLORS.neonPurple },
  profileAvatar: { fontSize: 64, marginBottom: 12 },
  profileName: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  profileRole: { fontSize: 14, color: '#888', marginTop: 4 },
  profileLevelBadge: { backgroundColor: DISCO_COLORS.neonPurple, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 8, marginTop: 16 },
  profileLevelText: { fontSize: 14, fontWeight: 'bold', color: '#000' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { width: '47%', backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statCardValue: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  statCardLabel: { fontSize: 11, color: '#888', marginTop: 4 },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  badgeCard: { width: '30%', backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 2 },
  lockedBadge: { borderColor: 'rgba(255,255,255,0.2)', opacity: 0.6 },
  badgeIcon: { fontSize: 32, marginBottom: 8 },
  badgeName: { fontSize: 11, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  rarityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 6 },
  rarityText: { fontSize: 8, fontWeight: 'bold' },
  badgeCriteria: { fontSize: 9, color: '#666', textAlign: 'center', marginTop: 4 },
  challengesContent: { padding: 16, paddingBottom: 100 },
  challengeCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: DISCO_COLORS.neonCyan },
  challengeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  challengeIcon: { fontSize: 32, marginRight: 12 },
  challengeInfo: { flex: 1 },
  challengeTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  challengeDesc: { fontSize: 12, color: '#888' },
  challengeReward: { alignItems: 'flex-end' },
  rewardXP: { fontSize: 14, fontWeight: 'bold', color: DISCO_COLORS.neonGreen },
  rewardPoints: { fontSize: 11, color: DISCO_COLORS.neonCyan },
  progressSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressBar: { flex: 1, height: 8, backgroundColor: DISCO_COLORS.neonCyan + '30', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: DISCO_COLORS.neonCyan, borderRadius: 4 },
  progressText: { fontSize: 12, color: '#FFFFFF', fontWeight: 'bold', width: 50, textAlign: 'right' },
  rewardsContent: { padding: 16, paddingBottom: 100 },
  pointsBalance: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: DISCO_COLORS.neonGreen },
  balanceLabel: { fontSize: 12, color: '#888' },
  balanceValue: { fontSize: 48, fontWeight: '900', color: DISCO_COLORS.neonGreen },
  rewardCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: DISCO_COLORS.neonGreen },
  rewardIcon: { fontSize: 32, marginRight: 12 },
  rewardInfo: { flex: 1 },
  rewardName: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  rewardDesc: { fontSize: 12, color: '#888' },
  redeemButton: { backgroundColor: DISCO_COLORS.neonGreen, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },
  redeemButtonDisabled: { backgroundColor: '#444', opacity: 0.5 },
  redeemCost: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  redeemLabel: { fontSize: 10, color: '#000' },
});
