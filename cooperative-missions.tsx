/**
 * Tricorder Cooperative Missions Screen
 * Multiplayer mission system with team coordination
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import cooperativeMissionService, {
  type CooperativeMission,
  type MissionTeam,
  type LeaderboardEntry,
  type PlayerMissionStats,
  type MissionType,
  type MissionStatus,
  type TeamRole,
} from '@/lib/services/cooperative-mission-service';

type TabType = 'missions' | 'active' | 'leaderboard' | 'stats';

export default function CooperativeMissionsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('missions');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data states
  const [missions, setMissions] = useState<CooperativeMission[]>([]);
  const [activeMission, setActiveMission] = useState<CooperativeMission | null>(null);
  const [activeTeam, setActiveTeam] = useState<MissionTeam | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerMissionStats | null>(null);
  const [selectedMissionType, setSelectedMissionType] = useState<MissionType | 'all'>('all');

  const currentUserId = 'user_current'; // Would come from auth

  const loadData = useCallback(async () => {
    try {
      const [missionsData, leaderboardData, statsData] = await Promise.all([
        cooperativeMissionService.getMissions(
          selectedMissionType !== 'all' ? { type: selectedMissionType } : undefined
        ),
        cooperativeMissionService.getLeaderboard(10),
        cooperativeMissionService.getPlayerStats(currentUserId),
      ]);

      setMissions(missionsData);
      setLeaderboard(leaderboardData);
      setPlayerStats(statsData);

      // Check for active mission
      const inProgressMission = missionsData.find(m => m.status === 'in_progress');
      if (inProgressMission) {
        setActiveMission(inProgressMission);
        const team = await cooperativeMissionService.getTeam(inProgressMission.id);
        setActiveTeam(team);
      }
    } catch (error) {
      console.error('Failed to load missions:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMissionType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleJoinMission = async (missionId: string) => {
    const result = await cooperativeMissionService.joinMission(missionId, {
      id: currentUserId,
      odId: currentUserId,
      name: 'Current User',
      role: 'support',
      status: 'ready',
    });

    if (result.success) {
      Alert.alert('Success', 'You have joined the mission!');
      loadData();
    } else {
      Alert.alert('Error', result.error || 'Failed to join mission');
    }
  };

  const handleStartMission = async (missionId: string) => {
    const result = await cooperativeMissionService.startMission(missionId);
    if (result.success) {
      Alert.alert('Mission Started', 'Good luck, team!');
      loadData();
    } else {
      Alert.alert('Error', result.error || 'Failed to start mission');
    }
  };

  const handleLeaveMission = async (missionId: string) => {
    Alert.alert(
      'Leave Mission',
      'Are you sure you want to leave this mission?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            await cooperativeMissionService.leaveMission(missionId, currentUserId);
            setActiveMission(null);
            setActiveTeam(null);
            loadData();
          },
        },
      ]
    );
  };

  const getMissionTypeColor = (type: MissionType): string => {
    switch (type) {
      case 'medical_emergency':
        return '#EF4444';
      case 'environmental_hazard':
        return '#22C55E';
      case 'engineering_crisis':
        return '#F59E0B';
      case 'security_breach':
        return '#8B5CF6';
      case 'research_expedition':
        return '#3B82F6';
      default:
        return colors.primary;
    }
  };

  const getMissionTypeIcon = (type: MissionType): string => {
    switch (type) {
      case 'medical_emergency':
        return '🏥';
      case 'environmental_hazard':
        return '☣️';
      case 'engineering_crisis':
        return '⚡';
      case 'security_breach':
        return '🔒';
      case 'research_expedition':
        return '🔬';
      default:
        return '📋';
    }
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'training':
        return colors.muted;
      case 'standard':
        return colors.success;
      case 'advanced':
        return colors.warning;
      case 'expert':
        return '#F97316';
      case 'legendary':
        return '#EF4444';
      default:
        return colors.foreground;
    }
  };

  const renderTabs = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
      <View className="flex-row gap-2 px-1">
        {(['missions', 'active', 'leaderboard', 'stats'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full ${activeTab === tab ? 'bg-primary' : 'bg-surface'}`}
          >
            <Text
              className={`text-sm font-medium capitalize ${activeTab === tab ? 'text-white' : 'text-foreground'}`}
            >
              {tab === 'stats' ? 'My Stats' : tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderMissionFilters = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
      <View className="flex-row gap-2">
        {(['all', 'medical_emergency', 'environmental_hazard', 'engineering_crisis', 'security_breach'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => setSelectedMissionType(type)}
            className={`px-3 py-1.5 rounded-lg ${selectedMissionType === type ? 'bg-primary/20' : 'bg-surface'}`}
            style={selectedMissionType === type ? { borderColor: colors.primary, borderWidth: 1 } : {}}
          >
            <Text className={`text-xs ${selectedMissionType === type ? 'text-primary' : 'text-muted'}`}>
              {type === 'all' ? 'All' : type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderMissions = () => (
    <View className="gap-4">
      {renderMissionFilters()}
      
      {missions.filter(m => m.status === 'recruiting' || m.status === 'briefing').map((mission) => (
        <View key={mission.id} className="bg-surface rounded-xl p-4">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-1">
                <Text className="text-2xl">{getMissionTypeIcon(mission.type)}</Text>
                <Text className="text-lg font-semibold text-foreground">{mission.name}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="px-2 py-0.5 rounded" style={{ backgroundColor: getMissionTypeColor(mission.type) + '20' }}>
                  <Text className="text-xs font-medium capitalize" style={{ color: getMissionTypeColor(mission.type) }}>
                    {mission.type.replace(/_/g, ' ')}
                  </Text>
                </View>
                <View className="px-2 py-0.5 rounded" style={{ backgroundColor: getDifficultyColor(mission.difficulty) + '20' }}>
                  <Text className="text-xs font-medium capitalize" style={{ color: getDifficultyColor(mission.difficulty) }}>
                    {mission.difficulty}
                  </Text>
                </View>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-foreground font-bold">{mission.currentPlayers}/{mission.maxPlayers}</Text>
              <Text className="text-xs text-muted">players</Text>
            </View>
          </View>

          <Text className="text-muted text-sm mb-3" numberOfLines={2}>{mission.description}</Text>

          <View className="flex-row flex-wrap gap-4 mb-3">
            <View>
              <Text className="text-foreground font-medium">{mission.objectives.length}</Text>
              <Text className="text-xs text-muted">Objectives</Text>
            </View>
            <View>
              <Text className="text-foreground font-medium">{Math.floor(mission.timeLimit / 60)}m</Text>
              <Text className="text-xs text-muted">Time Limit</Text>
            </View>
            <View>
              <Text className="text-primary font-medium">{mission.rewards.xp.toLocaleString()}</Text>
              <Text className="text-xs text-muted">XP Reward</Text>
            </View>
            <View>
              <Text className="text-warning font-medium">{mission.rewards.credits}</Text>
              <Text className="text-xs text-muted">Credits</Text>
            </View>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => handleJoinMission(mission.id)}
              className="flex-1 bg-primary py-3 rounded-lg items-center"
              disabled={mission.currentPlayers >= mission.maxPlayers}
            >
              <Text className="text-white font-medium">
                {mission.currentPlayers >= mission.maxPlayers ? 'Full' : 'Join Mission'}
              </Text>
            </TouchableOpacity>
            {mission.status === 'briefing' && mission.currentPlayers >= mission.minPlayers && (
              <TouchableOpacity
                onPress={() => handleStartMission(mission.id)}
                className="flex-1 bg-success py-3 rounded-lg items-center"
              >
                <Text className="text-white font-medium">Start Mission</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </View>
  );

  const renderActiveMission = () => {
    if (!activeMission) {
      return (
        <View className="bg-surface rounded-xl p-6 items-center">
          <Text className="text-6xl mb-4">🎯</Text>
          <Text className="text-lg font-semibold text-foreground mb-2">No Active Mission</Text>
          <Text className="text-muted text-center mb-4">
            Join a mission from the Missions tab to start your cooperative adventure!
          </Text>
          <TouchableOpacity
            onPress={() => setActiveTab('missions')}
            className="bg-primary px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-medium">Browse Missions</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View className="gap-4">
        {/* Mission Header */}
        <View className="bg-surface rounded-xl p-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl">{getMissionTypeIcon(activeMission.type)}</Text>
              <View>
                <Text className="text-lg font-semibold text-foreground">{activeMission.name}</Text>
                <Text className="text-sm text-muted capitalize">{activeMission.status.replace(/_/g, ' ')}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => handleLeaveMission(activeMission.id)}
              className="bg-error/20 px-3 py-1.5 rounded-lg"
            >
              <Text className="text-error text-sm font-medium">Leave</Text>
            </TouchableOpacity>
          </View>

          {/* Progress */}
          <View className="mb-3">
            <View className="flex-row justify-between mb-1">
              <Text className="text-sm text-muted">Mission Progress</Text>
              <Text className="text-sm text-foreground">
                {activeMission.objectives.filter(o => o.status === 'completed').length}/{activeMission.objectives.length}
              </Text>
            </View>
            <View className="h-2 bg-background rounded-full overflow-hidden">
              <View
                className="h-full bg-primary rounded-full"
                style={{
                  width: `${(activeMission.objectives.filter(o => o.status === 'completed').length / activeMission.objectives.length) * 100}%`,
                }}
              />
            </View>
          </View>

          {/* Time Remaining */}
          {activeMission.startedAt && (
            <View className="flex-row items-center justify-center gap-2 p-2 bg-background rounded-lg">
              <Text className="text-foreground font-mono text-lg">
                {Math.max(0, Math.floor(activeMission.timeLimit - (Date.now() - new Date(activeMission.startedAt).getTime()) / 1000 / 60))}m remaining
              </Text>
            </View>
          )}
        </View>

        {/* Objectives */}
        <View className="bg-surface rounded-xl p-4">
          <Text className="text-lg font-semibold text-foreground mb-3">Objectives</Text>
          <View className="gap-3">
            {activeMission.objectives.map((objective) => (
              <View key={objective.id} className="p-3 bg-background rounded-lg">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-foreground font-medium flex-1">{objective.title}</Text>
                  <View
                    className="px-2 py-0.5 rounded"
                    style={{
                      backgroundColor:
                        objective.status === 'completed'
                          ? colors.success + '20'
                          : objective.status === 'in_progress'
                          ? colors.warning + '20'
                          : colors.muted + '20',
                    }}
                  >
                    <Text
                      className="text-xs font-medium capitalize"
                      style={{
                        color:
                          objective.status === 'completed'
                            ? colors.success
                            : objective.status === 'in_progress'
                            ? colors.warning
                            : colors.muted,
                      }}
                    >
                      {objective.status.replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>
                <Text className="text-sm text-muted mb-2">{objective.description}</Text>
                <View className="flex-row items-center gap-2">
                  <View className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                    <View
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${objective.progress}%` }}
                    />
                  </View>
                  <Text className="text-xs text-muted">
                    {objective.completedScans}/{objective.requiredScans}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Team */}
        {activeTeam && (
          <View className="bg-surface rounded-xl p-4">
            <Text className="text-lg font-semibold text-foreground mb-3">Team ({activeTeam.members.length})</Text>
            <View className="gap-2">
              {activeTeam.members.map((member) => (
                <View key={member.id} className="flex-row items-center justify-between p-3 bg-background rounded-lg">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                      <Text className="text-primary font-bold">{member.name.charAt(0)}</Text>
                    </View>
                    <View>
                      <Text className="text-foreground font-medium">{member.name}</Text>
                      <Text className="text-xs text-muted capitalize">{member.role}</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-foreground font-medium">{member.scansCompleted}</Text>
                    <Text className="text-xs text-muted">scans</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderLeaderboard = () => (
    <View className="bg-surface rounded-xl p-4">
      <Text className="text-lg font-semibold text-foreground mb-4">Top Operatives</Text>
      <View className="gap-3">
        {leaderboard.map((entry, index) => (
          <View key={entry.odId} className="flex-row items-center p-3 bg-background rounded-lg">
            <View
              className="w-8 h-8 rounded-full items-center justify-center mr-3"
              style={{
                backgroundColor:
                  index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : colors.surface,
              }}
            >
              <Text className={`font-bold ${index < 3 ? 'text-black' : 'text-foreground'}`}>{entry.rank}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-medium">{entry.name}</Text>
              <View className="flex-row gap-2">
                {entry.badges.slice(0, 3).map((badge) => (
                  <Text key={badge} className="text-xs text-muted">🏅</Text>
                ))}
              </View>
            </View>
            <View className="items-end">
              <Text className="text-primary font-bold">{entry.totalXp.toLocaleString()}</Text>
              <Text className="text-xs text-muted">XP</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStats = () => (
    <View className="gap-4">
      {playerStats ? (
        <>
          {/* Overview */}
          <View className="bg-surface rounded-xl p-4">
            <Text className="text-lg font-semibold text-foreground mb-4">Your Stats</Text>
            <View className="flex-row flex-wrap gap-4">
              <View className="flex-1 min-w-[140px] bg-background rounded-lg p-3">
                <Text className="text-2xl font-bold text-primary">{playerStats.completedMissions}</Text>
                <Text className="text-sm text-muted">Missions Completed</Text>
              </View>
              <View className="flex-1 min-w-[140px] bg-background rounded-lg p-3">
                <Text className="text-2xl font-bold text-foreground">{playerStats.totalXpEarned.toLocaleString()}</Text>
                <Text className="text-sm text-muted">Total XP</Text>
              </View>
              <View className="flex-1 min-w-[140px] bg-background rounded-lg p-3">
                <Text className="text-2xl font-bold text-warning">{playerStats.totalCreditsEarned}</Text>
                <Text className="text-sm text-muted">Credits Earned</Text>
              </View>
              <View className="flex-1 min-w-[140px] bg-background rounded-lg p-3">
                <Text className="text-2xl font-bold text-success">{playerStats.objectivesCompleted}</Text>
                <Text className="text-sm text-muted">Objectives</Text>
              </View>
            </View>
          </View>

          {/* Rank & Level */}
          <View className="bg-surface rounded-xl p-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-muted text-sm">Current Rank</Text>
                <Text className="text-xl font-bold text-foreground">{playerStats.rank}</Text>
              </View>
              <View className="items-end">
                <Text className="text-muted text-sm">Level</Text>
                <Text className="text-xl font-bold text-primary">{playerStats.level}</Text>
              </View>
            </View>
          </View>

          {/* Badges */}
          {playerStats.badges.length > 0 && (
            <View className="bg-surface rounded-xl p-4">
              <Text className="text-lg font-semibold text-foreground mb-3">Badges</Text>
              <View className="flex-row flex-wrap gap-2">
                {playerStats.badges.map((badge) => (
                  <View key={badge} className="px-3 py-2 bg-background rounded-lg">
                    <Text className="text-foreground">🏅 {badge.replace(/_/g, ' ')}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      ) : (
        <View className="bg-surface rounded-xl p-6 items-center">
          <Text className="text-6xl mb-4">📊</Text>
          <Text className="text-lg font-semibold text-foreground mb-2">No Stats Yet</Text>
          <Text className="text-muted text-center">
            Complete missions to build your profile and earn badges!
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Loading missions...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between py-4">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-bold text-foreground">Cooperative Missions</Text>
              <Text className="text-muted">Tricorder Team Operations</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        {renderTabs()}

        {/* Content */}
        <View className="pb-8">
          {activeTab === 'missions' && renderMissions()}
          {activeTab === 'active' && renderActiveMission()}
          {activeTab === 'leaderboard' && renderLeaderboard()}
          {activeTab === 'stats' && renderStats()}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
