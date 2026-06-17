/**
 * Transcription Speaker Analytics Service
 * Speaking time distribution and participation metrics
 * MediVac One v6.2
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  ANALYTICS: 'medivac_speaker_analytics',
  PREFERENCES: 'medivac_speaker_preferences',
};

// Types
export interface Speaker {
  id: string;
  name: string;
  email?: string;
  role: string;
  department: string;
  avatarColor: string;
}

export interface SpeakerMetrics {
  speakerId: string;
  speakerName: string;
  totalSpeakingTime: number; // seconds
  totalWordCount: number;
  meetingCount: number;
  averageSpeakingTimePerMeeting: number;
  averageWordsPerMinute: number;
  longestContribution: number; // seconds
  interruptionCount: number;
  questionCount: number;
  engagementScore: number; // 0-100
}

export interface MeetingAnalytics {
  id: string;
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  duration: number; // seconds
  participantCount: number;
  speakerBreakdown: SpeakerBreakdown[];
  silenceTime: number;
  overlapTime: number;
  engagementScore: number;
  topTopics: string[];
}

export interface SpeakerBreakdown {
  speakerId: string;
  speakerName: string;
  speakingTime: number;
  speakingPercentage: number;
  wordCount: number;
  turnCount: number;
  averageTurnLength: number;
  interruptions: number;
  questions: number;
}

export interface SpeakerComparison {
  speakers: SpeakerMetrics[];
  period: string;
  totalMeetings: number;
  averageEngagement: number;
}

export interface SpeakerTrend {
  speakerId: string;
  speakerName: string;
  dataPoints: TrendDataPoint[];
}

export interface TrendDataPoint {
  date: string;
  speakingTime: number;
  engagementScore: number;
  meetingCount: number;
}

export interface LeaderboardEntry {
  rank: number;
  speakerId: string;
  speakerName: string;
  department: string;
  metric: number;
  change: number; // percentage change from previous period
}

export interface AnalyticsStats {
  totalMeetingsAnalyzed: number;
  totalSpeakersTracked: number;
  totalSpeakingHours: number;
  averageEngagement: number;
  mostActiveSpeaker: string;
  quietestSpeaker: string;
}

// Sample data
const SAMPLE_SPEAKERS: Speaker[] = [
  { id: 'spk_1', name: 'Sarah Mitchell', role: 'IT Manager', department: 'IT', avatarColor: '#3B82F6' },
  { id: 'spk_2', name: 'James Wilson', role: 'CTO', department: 'Executive', avatarColor: '#10B981' },
  { id: 'spk_3', name: 'Dr. Emily Chen', role: 'Security Officer', department: 'Security', avatarColor: '#8B5CF6' },
  { id: 'spk_4', name: 'David Thompson', role: 'Senior Analyst', department: 'IT', avatarColor: '#F59E0B' },
  { id: 'spk_5', name: 'Lisa Anderson', role: 'Compliance Officer', department: 'Compliance', avatarColor: '#EC4899' },
  { id: 'spk_6', name: 'Michael Roberts', role: 'Network Admin', department: 'IT', avatarColor: '#06B6D4' },
];

const SAMPLE_MEETING_ANALYTICS: MeetingAnalytics[] = [
  {
    id: 'ma_1',
    meetingId: 'meet_1',
    meetingTitle: 'Quarterly Security Review',
    meetingDate: new Date(Date.now() - 86400000).toISOString(),
    duration: 3600,
    participantCount: 6,
    speakerBreakdown: [
      { speakerId: 'spk_1', speakerName: 'Sarah Mitchell', speakingTime: 720, speakingPercentage: 20, wordCount: 1440, turnCount: 15, averageTurnLength: 48, interruptions: 2, questions: 5 },
      { speakerId: 'spk_2', speakerName: 'James Wilson', speakingTime: 540, speakingPercentage: 15, wordCount: 1080, turnCount: 12, averageTurnLength: 45, interruptions: 1, questions: 3 },
      { speakerId: 'spk_3', speakerName: 'Dr. Emily Chen', speakingTime: 900, speakingPercentage: 25, wordCount: 1800, turnCount: 18, averageTurnLength: 50, interruptions: 0, questions: 8 },
      { speakerId: 'spk_4', speakerName: 'David Thompson', speakingTime: 360, speakingPercentage: 10, wordCount: 720, turnCount: 8, averageTurnLength: 45, interruptions: 3, questions: 2 },
      { speakerId: 'spk_5', speakerName: 'Lisa Anderson', speakingTime: 540, speakingPercentage: 15, wordCount: 1080, turnCount: 10, averageTurnLength: 54, interruptions: 1, questions: 4 },
      { speakerId: 'spk_6', speakerName: 'Michael Roberts', speakingTime: 180, speakingPercentage: 5, wordCount: 360, turnCount: 5, averageTurnLength: 36, interruptions: 0, questions: 1 },
    ],
    silenceTime: 360,
    overlapTime: 120,
    engagementScore: 78,
    topTopics: ['ransomware', 'compliance', 'WACHS', 'backup'],
  },
  {
    id: 'ma_2',
    meetingId: 'meet_2',
    meetingTitle: 'Incident Response Drill Debrief',
    meetingDate: new Date(Date.now() - 259200000).toISOString(),
    duration: 2700,
    participantCount: 5,
    speakerBreakdown: [
      { speakerId: 'spk_1', speakerName: 'Sarah Mitchell', speakingTime: 810, speakingPercentage: 30, wordCount: 1620, turnCount: 20, averageTurnLength: 40.5, interruptions: 1, questions: 6 },
      { speakerId: 'spk_3', speakerName: 'Dr. Emily Chen', speakingTime: 675, speakingPercentage: 25, wordCount: 1350, turnCount: 15, averageTurnLength: 45, interruptions: 2, questions: 4 },
      { speakerId: 'spk_4', speakerName: 'David Thompson', speakingTime: 540, speakingPercentage: 20, wordCount: 1080, turnCount: 12, averageTurnLength: 45, interruptions: 0, questions: 3 },
      { speakerId: 'spk_6', speakerName: 'Michael Roberts', speakingTime: 405, speakingPercentage: 15, wordCount: 810, turnCount: 10, averageTurnLength: 40.5, interruptions: 1, questions: 2 },
    ],
    silenceTime: 270,
    overlapTime: 90,
    engagementScore: 85,
    topTopics: ['drill', 'response time', 'playbook', 'improvement'],
  },
  {
    id: 'ma_3',
    meetingId: 'meet_3',
    meetingTitle: 'WACHS Network Planning',
    meetingDate: new Date(Date.now() - 604800000).toISOString(),
    duration: 4500,
    participantCount: 4,
    speakerBreakdown: [
      { speakerId: 'spk_2', speakerName: 'James Wilson', speakingTime: 1125, speakingPercentage: 25, wordCount: 2250, turnCount: 22, averageTurnLength: 51, interruptions: 0, questions: 7 },
      { speakerId: 'spk_1', speakerName: 'Sarah Mitchell', speakingTime: 1350, speakingPercentage: 30, wordCount: 2700, turnCount: 25, averageTurnLength: 54, interruptions: 2, questions: 5 },
      { speakerId: 'spk_6', speakerName: 'Michael Roberts', speakingTime: 900, speakingPercentage: 20, wordCount: 1800, turnCount: 18, averageTurnLength: 50, interruptions: 1, questions: 4 },
      { speakerId: 'spk_4', speakerName: 'David Thompson', speakingTime: 675, speakingPercentage: 15, wordCount: 1350, turnCount: 15, averageTurnLength: 45, interruptions: 0, questions: 3 },
    ],
    silenceTime: 450,
    overlapTime: 150,
    engagementScore: 82,
    topTopics: ['WACHS', 'network', 'deployment', 'sites'],
  },
];

class SpeakerAnalyticsService {
  private speakers: Speaker[] = [];
  private meetingAnalytics: MeetingAnalytics[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const analyticsData = await AsyncStorage.getItem(STORAGE_KEYS.ANALYTICS);
      this.meetingAnalytics = analyticsData ? JSON.parse(analyticsData) : SAMPLE_MEETING_ANALYTICS;
      this.speakers = SAMPLE_SPEAKERS;
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize speaker analytics:', error);
      this.meetingAnalytics = SAMPLE_MEETING_ANALYTICS;
      this.speakers = SAMPLE_SPEAKERS;
      this.initialized = true;
    }
  }

  private async saveAnalytics(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(this.meetingAnalytics));
    } catch (error) {
      console.error('Failed to save analytics:', error);
    }
  }

  // Speakers
  getSpeakers(): Speaker[] {
    return [...this.speakers];
  }

  getSpeaker(id: string): Speaker | undefined {
    return this.speakers.find(s => s.id === id);
  }

  // Meeting Analytics
  getMeetingAnalytics(): MeetingAnalytics[] {
    return [...this.meetingAnalytics].sort((a, b) => 
      new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime()
    );
  }

  getMeetingAnalytic(id: string): MeetingAnalytics | undefined {
    return this.meetingAnalytics.find(m => m.id === id);
  }

  // Speaker Metrics
  getSpeakerMetrics(speakerId: string): SpeakerMetrics {
    const speakerMeetings = this.meetingAnalytics.filter(m => 
      m.speakerBreakdown.some(s => s.speakerId === speakerId)
    );

    const speaker = this.speakers.find(s => s.id === speakerId);
    let totalSpeakingTime = 0;
    let totalWordCount = 0;
    let totalInterruptions = 0;
    let totalQuestions = 0;
    let longestContribution = 0;
    let totalEngagement = 0;

    for (const meeting of speakerMeetings) {
      const breakdown = meeting.speakerBreakdown.find(s => s.speakerId === speakerId);
      if (breakdown) {
        totalSpeakingTime += breakdown.speakingTime;
        totalWordCount += breakdown.wordCount;
        totalInterruptions += breakdown.interruptions;
        totalQuestions += breakdown.questions;
        if (breakdown.speakingTime > longestContribution) {
          longestContribution = breakdown.speakingTime;
        }
        totalEngagement += meeting.engagementScore * (breakdown.speakingPercentage / 100);
      }
    }

    const meetingCount = speakerMeetings.length;
    const averageSpeakingTime = meetingCount > 0 ? totalSpeakingTime / meetingCount : 0;
    const averageWPM = totalSpeakingTime > 0 ? (totalWordCount / totalSpeakingTime) * 60 : 0;
    const engagementScore = meetingCount > 0 ? Math.min(100, (totalEngagement / meetingCount) * 2) : 0;

    return {
      speakerId,
      speakerName: speaker?.name || 'Unknown',
      totalSpeakingTime,
      totalWordCount,
      meetingCount,
      averageSpeakingTimePerMeeting: averageSpeakingTime,
      averageWordsPerMinute: Math.round(averageWPM),
      longestContribution,
      interruptionCount: totalInterruptions,
      questionCount: totalQuestions,
      engagementScore: Math.round(engagementScore),
    };
  }

  getAllSpeakerMetrics(): SpeakerMetrics[] {
    return this.speakers.map(s => this.getSpeakerMetrics(s.id));
  }

  // Comparisons
  compareSpeakers(speakerIds: string[], period: string = 'all'): SpeakerComparison {
    const metrics = speakerIds.map(id => this.getSpeakerMetrics(id));
    const totalMeetings = new Set(
      this.meetingAnalytics
        .filter(m => m.speakerBreakdown.some(s => speakerIds.includes(s.speakerId)))
        .map(m => m.id)
    ).size;

    const averageEngagement = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.engagementScore, 0) / metrics.length
      : 0;

    return {
      speakers: metrics,
      period,
      totalMeetings,
      averageEngagement: Math.round(averageEngagement),
    };
  }

  // Trends
  getSpeakerTrend(speakerId: string, days: number = 30): SpeakerTrend {
    const speaker = this.speakers.find(s => s.id === speakerId);
    const cutoffDate = new Date(Date.now() - days * 86400000);
    
    const relevantMeetings = this.meetingAnalytics
      .filter(m => new Date(m.meetingDate) >= cutoffDate)
      .filter(m => m.speakerBreakdown.some(s => s.speakerId === speakerId))
      .sort((a, b) => new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime());

    const dataPoints: TrendDataPoint[] = relevantMeetings.map(meeting => {
      const breakdown = meeting.speakerBreakdown.find(s => s.speakerId === speakerId);
      return {
        date: meeting.meetingDate,
        speakingTime: breakdown?.speakingTime || 0,
        engagementScore: meeting.engagementScore,
        meetingCount: 1,
      };
    });

    return {
      speakerId,
      speakerName: speaker?.name || 'Unknown',
      dataPoints,
    };
  }

  // Leaderboards
  getLeaderboard(metric: 'speaking_time' | 'engagement' | 'questions' | 'meetings', limit: number = 10): LeaderboardEntry[] {
    const allMetrics = this.getAllSpeakerMetrics();
    
    let sorted: SpeakerMetrics[];
    switch (metric) {
      case 'speaking_time':
        sorted = allMetrics.sort((a, b) => b.totalSpeakingTime - a.totalSpeakingTime);
        break;
      case 'engagement':
        sorted = allMetrics.sort((a, b) => b.engagementScore - a.engagementScore);
        break;
      case 'questions':
        sorted = allMetrics.sort((a, b) => b.questionCount - a.questionCount);
        break;
      case 'meetings':
        sorted = allMetrics.sort((a, b) => b.meetingCount - a.meetingCount);
        break;
      default:
        sorted = allMetrics;
    }

    return sorted.slice(0, limit).map((m, index) => {
      const speaker = this.speakers.find(s => s.id === m.speakerId);
      let metricValue: number;
      switch (metric) {
        case 'speaking_time': metricValue = m.totalSpeakingTime; break;
        case 'engagement': metricValue = m.engagementScore; break;
        case 'questions': metricValue = m.questionCount; break;
        case 'meetings': metricValue = m.meetingCount; break;
        default: metricValue = 0;
      }

      return {
        rank: index + 1,
        speakerId: m.speakerId,
        speakerName: m.speakerName,
        department: speaker?.department || 'Unknown',
        metric: metricValue,
        change: Math.round((Math.random() - 0.3) * 20), // Simulated change
      };
    });
  }

  // Talk Time Distribution
  getTalkTimeDistribution(meetingId?: string): { speakerId: string; speakerName: string; percentage: number; color: string }[] {
    if (meetingId) {
      const meeting = this.meetingAnalytics.find(m => m.id === meetingId);
      if (!meeting) return [];

      return meeting.speakerBreakdown.map(b => {
        const speaker = this.speakers.find(s => s.id === b.speakerId);
        return {
          speakerId: b.speakerId,
          speakerName: b.speakerName,
          percentage: b.speakingPercentage,
          color: speaker?.avatarColor || '#6B7280',
        };
      });
    }

    // Overall distribution
    const totalTime: Record<string, number> = {};
    let grandTotal = 0;

    for (const meeting of this.meetingAnalytics) {
      for (const breakdown of meeting.speakerBreakdown) {
        totalTime[breakdown.speakerId] = (totalTime[breakdown.speakerId] || 0) + breakdown.speakingTime;
        grandTotal += breakdown.speakingTime;
      }
    }

    return Object.entries(totalTime).map(([speakerId, time]) => {
      const speaker = this.speakers.find(s => s.id === speakerId);
      return {
        speakerId,
        speakerName: speaker?.name || 'Unknown',
        percentage: grandTotal > 0 ? Math.round((time / grandTotal) * 100) : 0,
        color: speaker?.avatarColor || '#6B7280',
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }

  // Statistics
  getStats(): AnalyticsStats {
    const allMetrics = this.getAllSpeakerMetrics();
    const totalHours = allMetrics.reduce((sum, m) => sum + m.totalSpeakingTime, 0) / 3600;
    const avgEngagement = allMetrics.length > 0
      ? allMetrics.reduce((sum, m) => sum + m.engagementScore, 0) / allMetrics.length
      : 0;

    const sortedByTime = [...allMetrics].sort((a, b) => b.totalSpeakingTime - a.totalSpeakingTime);
    const mostActive = sortedByTime[0]?.speakerName || 'N/A';
    const quietest = sortedByTime[sortedByTime.length - 1]?.speakerName || 'N/A';

    return {
      totalMeetingsAnalyzed: this.meetingAnalytics.length,
      totalSpeakersTracked: this.speakers.length,
      totalSpeakingHours: Math.round(totalHours * 10) / 10,
      averageEngagement: Math.round(avgEngagement),
      mostActiveSpeaker: mostActive,
      quietestSpeaker: quietest,
    };
  }
}

export const speakerAnalyticsService = new SpeakerAnalyticsService();
