import { useState, useEffect, useCallback } from 'react';
import { ScrollView, Text, View, TouchableOpacity, RefreshControl } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { speakerAnalyticsService, SpeakerMetrics, MeetingAnalytics, AnalyticsStats, LeaderboardEntry } from '@/lib/services/speaker-analytics-service';

type TabType = 'overview' | 'leaderboard' | 'meetings';

export default function SpeakerAnalyticsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [speakerMetrics, setSpeakerMetrics] = useState<SpeakerMetrics[]>([]);
  const [meetings, setMeetings] = useState<MeetingAnalytics[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardMetric, setLeaderboardMetric] = useState<'speaking_time' | 'engagement' | 'questions' | 'meetings'>('engagement');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      await speakerAnalyticsService.initialize();
      setStats(speakerAnalyticsService.getStats());
      setSpeakerMetrics(speakerAnalyticsService.getAllSpeakerMetrics());
      setMeetings(speakerAnalyticsService.getMeetingAnalytics());
      setLeaderboard(speakerAnalyticsService.getLeaderboard(leaderboardMetric));
    } catch (error) {
      console.error('Failed to load speaker analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [leaderboardMetric]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!loading) {
      setLeaderboard(speakerAnalyticsService.getLeaderboard(leaderboardMetric));
    }
  }, [leaderboardMetric, loading]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getEngagementColor = (score: number): string => {
    if (score >= 80) return '#22C55E';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getChangeColor = (change: number): string => {
    if (change > 0) return '#22C55E';
    if (change < 0) return '#EF4444';
    return '#6B7280';
  };

  if (loading) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Loading analytics...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-bold text-foreground mb-2">Speaker Analytics</Text>
        <Text className="text-muted mb-4">Speaking time and participation metrics</Text>

        {/* Stats Overview */}
        {stats && (
          <View className="flex-row flex-wrap gap-2 mb-4">
            <View className="bg-blue-500/20 rounded-lg p-3 flex-1 min-w-[100px]">
              <Text className="text-blue-600 text-xl font-bold">{stats.totalMeetingsAnalyzed}</Text>
              <Text className="text-blue-600 text-xs">Meetings</Text>
            </View>
            <View className="bg-green-500/20 rounded-lg p-3 flex-1 min-w-[100px]">
              <Text className="text-green-600 text-xl font-bold">{stats.totalSpeakingHours}h</Text>
              <Text className="text-green-600 text-xs">Speaking</Text>
            </View>
            <View className="bg-purple-500/20 rounded-lg p-3 flex-1 min-w-[100px]">
              <Text className="text-purple-600 text-xl font-bold">{stats.averageEngagement}%</Text>
              <Text className="text-purple-600 text-xs">Engagement</Text>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View className="flex-row bg-surface rounded-lg p-1 mb-4">
          {(['overview', 'leaderboard', 'meetings'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-md ${activeTab === tab ? 'bg-primary' : ''}`}
            >
              <Text className={`text-center font-medium capitalize ${activeTab === tab ? 'text-white' : 'text-muted'}`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View className="gap-3">
            <Text className="text-foreground font-semibold mb-2">Talk Time Distribution</Text>
            
            {speakerAnalyticsService.getTalkTimeDistribution().map((item, index) => (
              <View key={item.speakerId} className="bg-surface rounded-lg p-3 border border-border">
                <View className="flex-row items-center mb-2">
                  <View 
                    className="w-8 h-8 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: item.color }}
                  >
                    <Text className="text-white font-bold text-sm">
                      {item.speakerName.split(' ').map(n => n[0]).join('')}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground font-medium">{item.speakerName}</Text>
                  </View>
                  <Text className="text-foreground font-bold">{item.percentage}%</Text>
                </View>
                <View className="bg-background rounded-full h-2 overflow-hidden">
                  <View 
                    className="h-full rounded-full"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  />
                </View>
              </View>
            ))}

            <Text className="text-foreground font-semibold mt-4 mb-2">Speaker Metrics</Text>
            
            {speakerMetrics.map((metric) => {
              const speaker = speakerAnalyticsService.getSpeakers().find(s => s.id === metric.speakerId);
              return (
                <View key={metric.speakerId} className="bg-surface rounded-lg p-4 border border-border">
                  <View className="flex-row items-center mb-3">
                    <View 
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: speaker?.avatarColor || '#6B7280' }}
                    >
                      <Text className="text-white font-bold">
                        {metric.speakerName.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground font-semibold">{metric.speakerName}</Text>
                      <Text className="text-muted text-sm">{metric.meetingCount} meetings</Text>
                    </View>
                    <View 
                      className="px-2 py-1 rounded"
                      style={{ backgroundColor: getEngagementColor(metric.engagementScore) + '20' }}
                    >
                      <Text style={{ color: getEngagementColor(metric.engagementScore) }} className="font-bold">
                        {metric.engagementScore}%
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2">
                    <View className="flex-1 bg-background rounded p-2">
                      <Text className="text-muted text-xs">Speaking</Text>
                      <Text className="text-foreground font-medium">{formatTime(metric.totalSpeakingTime)}</Text>
                    </View>
                    <View className="flex-1 bg-background rounded p-2">
                      <Text className="text-muted text-xs">Words</Text>
                      <Text className="text-foreground font-medium">{metric.totalWordCount.toLocaleString()}</Text>
                    </View>
                    <View className="flex-1 bg-background rounded p-2">
                      <Text className="text-muted text-xs">Questions</Text>
                      <Text className="text-foreground font-medium">{metric.questionCount}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <View className="gap-3">
            <View className="flex-row flex-wrap gap-2 mb-2">
              {(['engagement', 'speaking_time', 'questions', 'meetings'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setLeaderboardMetric(m)}
                  className={`px-3 py-2 rounded-lg ${
                    leaderboardMetric === m ? 'bg-primary' : 'bg-surface border border-border'
                  }`}
                >
                  <Text className={leaderboardMetric === m ? 'text-white' : 'text-foreground'}>
                    {m === 'speaking_time' ? 'Time' : m.charAt(0).toUpperCase() + m.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {leaderboard.map((entry) => {
              const speaker = speakerAnalyticsService.getSpeakers().find(s => s.id === entry.speakerId);
              return (
                <View key={entry.speakerId} className="bg-surface rounded-lg p-4 border border-border">
                  <View className="flex-row items-center">
                    <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                      entry.rank === 1 ? 'bg-yellow-500' :
                      entry.rank === 2 ? 'bg-gray-400' :
                      entry.rank === 3 ? 'bg-amber-600' : 'bg-gray-600'
                    }`}>
                      <Text className="text-white font-bold">{entry.rank}</Text>
                    </View>
                    <View 
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: speaker?.avatarColor || '#6B7280' }}
                    >
                      <Text className="text-white font-bold text-sm">
                        {entry.speakerName.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground font-semibold">{entry.speakerName}</Text>
                      <Text className="text-muted text-sm">{entry.department}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-foreground font-bold">
                        {leaderboardMetric === 'speaking_time' 
                          ? formatTime(entry.metric)
                          : leaderboardMetric === 'engagement'
                          ? `${entry.metric}%`
                          : entry.metric}
                      </Text>
                      <Text style={{ color: getChangeColor(entry.change) }} className="text-sm">
                        {entry.change > 0 ? '+' : ''}{entry.change}%
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Meetings Tab */}
        {activeTab === 'meetings' && (
          <View className="gap-3">
            {meetings.map((meeting) => (
              <View key={meeting.id} className="bg-surface rounded-lg p-4 border border-border">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold">{meeting.meetingTitle}</Text>
                    <Text className="text-muted text-sm">{formatDate(meeting.meetingDate)} • {formatTime(meeting.duration)}</Text>
                  </View>
                  <View 
                    className="px-2 py-1 rounded"
                    style={{ backgroundColor: getEngagementColor(meeting.engagementScore) + '20' }}
                  >
                    <Text style={{ color: getEngagementColor(meeting.engagementScore) }} className="font-bold text-sm">
                      {meeting.engagementScore}%
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-2 mb-3">
                  <View className="bg-background rounded px-2 py-1">
                    <Text className="text-muted text-xs">{meeting.participantCount} participants</Text>
                  </View>
                  <View className="bg-background rounded px-2 py-1">
                    <Text className="text-muted text-xs">{formatTime(meeting.silenceTime)} silence</Text>
                  </View>
                </View>

                <Text className="text-muted text-xs mb-2">Speaker Breakdown</Text>
                <View className="gap-1">
                  {meeting.speakerBreakdown.slice(0, 3).map((breakdown) => {
                    const speaker = speakerAnalyticsService.getSpeakers().find(s => s.id === breakdown.speakerId);
                    return (
                      <View key={breakdown.speakerId} className="flex-row items-center">
                        <View 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: speaker?.avatarColor || '#6B7280' }}
                        />
                        <Text className="text-foreground text-sm flex-1">{breakdown.speakerName}</Text>
                        <Text className="text-muted text-sm">{breakdown.speakingPercentage}%</Text>
                      </View>
                    );
                  })}
                  {meeting.speakerBreakdown.length > 3 && (
                    <Text className="text-muted text-xs">+{meeting.speakerBreakdown.length - 3} more</Text>
                  )}
                </View>

                {meeting.topTopics.length > 0 && (
                  <View className="flex-row flex-wrap gap-1 mt-3">
                    {meeting.topTopics.map((topic, i) => (
                      <View key={i} className="bg-primary/20 px-2 py-1 rounded">
                        <Text className="text-primary text-xs">{topic}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
