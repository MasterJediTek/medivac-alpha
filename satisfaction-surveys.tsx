/**
 * Patient Satisfaction Survey Screen
 * MediVac One v3.4 - Disco-themed survey management and analytics
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
// Using View with background color instead of LinearGradient for compatibility
import { ScreenContainer } from '@/components/screen-container';
import {
  patientSatisfactionService,
  PatientSurvey,
  SatisfactionMetrics,
  SurveyBenchmark,
  SurveyTemplate,
} from '@/lib/services/patient-satisfaction-service';

const { width } = Dimensions.get('window');

// Disco neon colors
const DISCO_COLORS = {
  neonPink: '#FF10F0',
  neonCyan: '#00FFFF',
  neonPurple: '#BF00FF',
  neonGreen: '#39FF14',
  neonYellow: '#FFFF00',
  neonOrange: '#FF6600',
  darkBg: '#0D0221',
  cardBg: 'rgba(20, 10, 40, 0.8)',
};

type TabType = 'dashboard' | 'surveys' | 'followups' | 'templates';

export default function SatisfactionSurveysScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [metrics, setMetrics] = useState<SatisfactionMetrics | null>(null);
  const [benchmarks, setBenchmarks] = useState<SurveyBenchmark[]>([]);
  const [surveys, setSurveys] = useState<PatientSurvey[]>([]);
  const [followUps, setFollowUps] = useState<PatientSurvey[]>([]);
  const [templates, setTemplates] = useState<SurveyTemplate[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<PatientSurvey | null>(null);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [pulseAnim] = useState(new Animated.Value(1));
  const [glowAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    initializeService();
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  const initializeService = async () => {
    await patientSatisfactionService.initialize();
    
    // Generate demo data if empty
    const existingSurveys = patientSatisfactionService.getSurveys({ status: 'completed' });
    if (existingSurveys.length === 0) {
      await patientSatisfactionService.generateDemoData();
    }
    
    loadData();
  };

  const loadData = () => {
    const metricsData = patientSatisfactionService.calculateMetrics(
      filterDepartment ? { department: filterDepartment } : undefined
    );
    setMetrics(metricsData);
    setBenchmarks(patientSatisfactionService.getBenchmarks());
    setSurveys(patientSatisfactionService.getSurveys({ status: 'completed' }));
    setFollowUps(patientSatisfactionService.getFollowUpsRequired());
    setTemplates(patientSatisfactionService.getTemplates());
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'very_positive': return DISCO_COLORS.neonGreen;
      case 'positive': return '#7FFF00';
      case 'neutral': return DISCO_COLORS.neonYellow;
      case 'negative': return DISCO_COLORS.neonOrange;
      case 'very_negative': return '#FF0000';
      default: return DISCO_COLORS.neonCyan;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return DISCO_COLORS.neonGreen;
    if (score >= 60) return DISCO_COLORS.neonYellow;
    if (score >= 40) return DISCO_COLORS.neonOrange;
    return '#FF0000';
  };

  const renderTabs = () => (
    <View style={{ flexDirection: 'row', marginBottom: 16, gap: 8 }}>
      {(['dashboard', 'surveys', 'followups', 'templates'] as TabType[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          style={{
            flex: 1,
            paddingVertical: 12,
            paddingHorizontal: 8,
            borderRadius: 12,
            backgroundColor: activeTab === tab ? DISCO_COLORS.neonPink : DISCO_COLORS.cardBg,
            borderWidth: 1,
            borderColor: activeTab === tab ? DISCO_COLORS.neonPink : DISCO_COLORS.neonPurple,
            shadowColor: activeTab === tab ? DISCO_COLORS.neonPink : 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
          }}
        >
          <Text style={{
            color: '#FFF',
            fontSize: 11,
            fontWeight: '700',
            textAlign: 'center',
            textTransform: 'uppercase',
          }}>
            {tab === 'followups' ? 'Follow-Ups' : tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDashboard = () => {
    if (!metrics) return null;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* NPS Score Card */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <View
            style={{
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              borderWidth: 2,
              borderColor: DISCO_COLORS.neonPink,
              backgroundColor: DISCO_COLORS.neonPurple + '40',
            }}
          >
            <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
              ⭐ NET PROMOTER SCORE
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{
                color: '#FFF',
                fontSize: 64,
                fontWeight: '900',
                textShadowColor: DISCO_COLORS.neonPink,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 20,
              }}>
                {metrics.npsScore}
              </Text>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: DISCO_COLORS.neonGreen, marginRight: 8 }} />
                  <Text style={{ color: '#FFF', fontSize: 14 }}>Promoters: {metrics.promoters}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: DISCO_COLORS.neonYellow, marginRight: 8 }} />
                  <Text style={{ color: '#FFF', fontSize: 14 }}>Passives: {metrics.passives}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF0000', marginRight: 8 }} />
                  <Text style={{ color: '#FFF', fontSize: 14 }}>Detractors: {metrics.detractors}</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Key Metrics Row */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <View style={{
            flex: 1,
            backgroundColor: DISCO_COLORS.cardBg,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: DISCO_COLORS.neonCyan,
          }}>
            <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 12, marginBottom: 4 }}>📊 AVG SCORE</Text>
            <Text style={{
              color: getScoreColor(metrics.averageScore),
              fontSize: 32,
              fontWeight: '800',
            }}>
              {metrics.averageScore}%
            </Text>
          </View>
          <View style={{
            flex: 1,
            backgroundColor: DISCO_COLORS.cardBg,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: DISCO_COLORS.neonGreen,
          }}>
            <Text style={{ color: DISCO_COLORS.neonGreen, fontSize: 12, marginBottom: 4 }}>📈 RESPONSE RATE</Text>
            <Text style={{
              color: DISCO_COLORS.neonGreen,
              fontSize: 32,
              fontWeight: '800',
            }}>
              {metrics.responseRate}%
            </Text>
          </View>
        </View>

        {/* Survey Stats */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <View style={{
            flex: 1,
            backgroundColor: DISCO_COLORS.cardBg,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: DISCO_COLORS.neonPurple,
          }}>
            <Text style={{ color: DISCO_COLORS.neonPurple, fontSize: 12, marginBottom: 4 }}>📋 TOTAL SURVEYS</Text>
            <Text style={{ color: '#FFF', fontSize: 28, fontWeight: '700' }}>{metrics.totalSurveys}</Text>
          </View>
          <View style={{
            flex: 1,
            backgroundColor: DISCO_COLORS.cardBg,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: DISCO_COLORS.neonYellow,
          }}>
            <Text style={{ color: DISCO_COLORS.neonYellow, fontSize: 12, marginBottom: 4 }}>✅ COMPLETED</Text>
            <Text style={{ color: '#FFF', fontSize: 28, fontWeight: '700' }}>{metrics.completedSurveys}</Text>
          </View>
        </View>

        {/* Sentiment Breakdown */}
        <View style={{
          backgroundColor: DISCO_COLORS.cardBg,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: DISCO_COLORS.neonPink,
        }}>
          <Text style={{ color: DISCO_COLORS.neonPink, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>
            💬 SENTIMENT ANALYSIS
          </Text>
          {Object.entries(metrics.sentimentBreakdown).map(([sentiment, count]) => (
            <View key={sentiment} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: '#FFF', fontSize: 12, textTransform: 'capitalize' }}>
                  {sentiment.replace('_', ' ')}
                </Text>
                <Text style={{ color: getSentimentColor(sentiment), fontSize: 12, fontWeight: '600' }}>
                  {count}
                </Text>
              </View>
              <View style={{ height: 6, backgroundColor: '#333', borderRadius: 3 }}>
                <View style={{
                  height: 6,
                  width: `${metrics.completedSurveys > 0 ? (count / metrics.completedSurveys) * 100 : 0}%`,
                  backgroundColor: getSentimentColor(sentiment),
                  borderRadius: 3,
                }} />
              </View>
            </View>
          ))}
        </View>

        {/* Department Scores */}
        <View style={{
          backgroundColor: DISCO_COLORS.cardBg,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: DISCO_COLORS.neonCyan,
        }}>
          <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>
            🏥 DEPARTMENT SCORES
          </Text>
          {Object.entries(metrics.departmentScores).map(([dept, score]) => (
            <View key={dept} style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.1)',
            }}>
              <Text style={{ color: '#FFF', fontSize: 14 }}>{dept}</Text>
              <View style={{
                backgroundColor: getScoreColor(score) + '30',
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: getScoreColor(score),
              }}>
                <Text style={{ color: getScoreColor(score), fontSize: 14, fontWeight: '700' }}>
                  {score}%
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Benchmarks */}
        <View style={{
          backgroundColor: DISCO_COLORS.cardBg,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: DISCO_COLORS.neonGreen,
        }}>
          <Text style={{ color: DISCO_COLORS.neonGreen, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>
            📊 BENCHMARKS
          </Text>
          {benchmarks.map((benchmark) => (
            <View key={benchmark.category} style={{ marginBottom: 16 }}>
              <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>
                {benchmark.category}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: '#AAA', fontSize: 11 }}>Hospital: {benchmark.hospitalScore}</Text>
                <Text style={{ color: '#AAA', fontSize: 11 }}>Regional: {benchmark.regionalAverage}</Text>
                <Text style={{ color: '#AAA', fontSize: 11 }}>National: {benchmark.nationalAverage}</Text>
              </View>
              <View style={{ height: 8, backgroundColor: '#333', borderRadius: 4, position: 'relative' }}>
                <View style={{
                  position: 'absolute',
                  left: `${Math.min(benchmark.nationalAverage, 100)}%`,
                  top: -2,
                  width: 2,
                  height: 12,
                  backgroundColor: '#888',
                }} />
                <View style={{
                  position: 'absolute',
                  left: `${Math.min(benchmark.topQuartile, 100)}%`,
                  top: -2,
                  width: 2,
                  height: 12,
                  backgroundColor: DISCO_COLORS.neonGreen,
                }} />
                <View style={{
                  height: 8,
                  width: `${Math.min(benchmark.hospitalScore, 100)}%`,
                  backgroundColor: getScoreColor(benchmark.hospitalScore),
                  borderRadius: 4,
                }} />
              </View>
              <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 11, marginTop: 4 }}>
                Percentile Rank: {benchmark.percentileRank}%
              </Text>
            </View>
          ))}
        </View>

        {/* Keywords */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <View style={{
            flex: 1,
            backgroundColor: DISCO_COLORS.cardBg,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: DISCO_COLORS.neonGreen,
          }}>
            <Text style={{ color: DISCO_COLORS.neonGreen, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
              👍 TOP POSITIVE
            </Text>
            {metrics.topPositiveKeywords.slice(0, 5).map((keyword, i) => (
              <Text key={i} style={{ color: '#FFF', fontSize: 11, marginBottom: 4 }}>
                • {keyword}
              </Text>
            ))}
          </View>
          <View style={{
            flex: 1,
            backgroundColor: DISCO_COLORS.cardBg,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: '#FF6666',
          }}>
            <Text style={{ color: '#FF6666', fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
              👎 TOP NEGATIVE
            </Text>
            {metrics.topNegativeKeywords.slice(0, 5).map((keyword, i) => (
              <Text key={i} style={{ color: '#FFF', fontSize: 11, marginBottom: 4 }}>
                • {keyword}
              </Text>
            ))}
          </View>
        </View>

        {/* Follow-up Stats */}
        <View style={{
          backgroundColor: DISCO_COLORS.cardBg,
          borderRadius: 16,
          padding: 16,
          marginBottom: 100,
          borderWidth: 1,
          borderColor: DISCO_COLORS.neonOrange,
        }}>
          <Text style={{ color: DISCO_COLORS.neonOrange, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>
            🔔 FOLLOW-UP STATUS
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#FFF', fontSize: 24, fontWeight: '700' }}>{metrics.followUpStats.total}</Text>
              <Text style={{ color: '#AAA', fontSize: 11 }}>Total</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: DISCO_COLORS.neonYellow, fontSize: 24, fontWeight: '700' }}>{metrics.followUpStats.pending}</Text>
              <Text style={{ color: '#AAA', fontSize: 11 }}>Pending</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: DISCO_COLORS.neonGreen, fontSize: 24, fontWeight: '700' }}>{metrics.followUpStats.resolved}</Text>
              <Text style={{ color: '#AAA', fontSize: 11 }}>Resolved</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderSurveys = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
        📋 COMPLETED SURVEYS ({surveys.length})
      </Text>
      {surveys.map((survey) => (
        <TouchableOpacity
          key={survey.id}
          onPress={() => {
            setSelectedSurvey(survey);
            setShowSurveyModal(true);
          }}
          style={{
            backgroundColor: DISCO_COLORS.cardBg,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: getSentimentColor(survey.sentiment),
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '600' }}>{survey.patientName}</Text>
            <View style={{
              backgroundColor: getScoreColor(survey.overallScore) + '30',
              paddingHorizontal: 10,
              paddingVertical: 2,
              borderRadius: 10,
            }}>
              <Text style={{ color: getScoreColor(survey.overallScore), fontSize: 12, fontWeight: '700' }}>
                {survey.overallScore}%
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#AAA', fontSize: 12 }}>{survey.department}</Text>
            <Text style={{ color: '#AAA', fontSize: 12 }}>{survey.provider}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <View style={{
              backgroundColor: getSentimentColor(survey.sentiment) + '30',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 8,
            }}>
              <Text style={{ color: getSentimentColor(survey.sentiment), fontSize: 10, textTransform: 'capitalize' }}>
                {survey.sentiment.replace('_', ' ')}
              </Text>
            </View>
            {survey.npsScore !== undefined && (
              <Text style={{ color: DISCO_COLORS.neonPurple, fontSize: 11 }}>
                NPS: {survey.npsScore}
              </Text>
            )}
          </View>
          {survey.followUpRequired && (
            <View style={{
              marginTop: 8,
              backgroundColor: DISCO_COLORS.neonOrange + '30',
              padding: 8,
              borderRadius: 8,
            }}>
              <Text style={{ color: DISCO_COLORS.neonOrange, fontSize: 11 }}>
                ⚠️ Follow-up: {survey.followUpReason}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderFollowUps = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={{ color: DISCO_COLORS.neonOrange, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
        🔔 FOLLOW-UPS REQUIRED ({followUps.length})
      </Text>
      {followUps.map((survey) => (
        <View
          key={survey.id}
          style={{
            backgroundColor: DISCO_COLORS.cardBg,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 2,
            borderColor: survey.followUpStatus === 'pending' ? DISCO_COLORS.neonOrange : DISCO_COLORS.neonYellow,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '600' }}>{survey.patientName}</Text>
            <View style={{
              backgroundColor: survey.followUpStatus === 'pending' ? DISCO_COLORS.neonOrange + '30' : DISCO_COLORS.neonYellow + '30',
              paddingHorizontal: 10,
              paddingVertical: 2,
              borderRadius: 10,
            }}>
              <Text style={{
                color: survey.followUpStatus === 'pending' ? DISCO_COLORS.neonOrange : DISCO_COLORS.neonYellow,
                fontSize: 11,
                fontWeight: '600',
                textTransform: 'uppercase',
              }}>
                {survey.followUpStatus}
              </Text>
            </View>
          </View>
          <Text style={{ color: '#AAA', fontSize: 12, marginBottom: 4 }}>
            {survey.department} • {survey.provider}
          </Text>
          <Text style={{ color: '#FF6666', fontSize: 12, marginBottom: 8 }}>
            Reason: {survey.followUpReason}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={async () => {
                await patientSatisfactionService.assignFollowUp(survey.id, 'Current User');
                loadData();
              }}
              style={{
                flex: 1,
                backgroundColor: DISCO_COLORS.neonCyan + '30',
                paddingVertical: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: DISCO_COLORS.neonCyan,
              }}
            >
              <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
                ASSIGN TO ME
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                await patientSatisfactionService.resolveFollowUp(survey.id, 'Resolved');
                loadData();
              }}
              style={{
                flex: 1,
                backgroundColor: DISCO_COLORS.neonGreen + '30',
                paddingVertical: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: DISCO_COLORS.neonGreen,
              }}
            >
              <Text style={{ color: DISCO_COLORS.neonGreen, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
                RESOLVE
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      {followUps.length === 0 && (
        <View style={{
          backgroundColor: DISCO_COLORS.cardBg,
          borderRadius: 16,
          padding: 32,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: DISCO_COLORS.neonGreen,
        }}>
          <Text style={{ color: DISCO_COLORS.neonGreen, fontSize: 48, marginBottom: 12 }}>✅</Text>
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>All Caught Up!</Text>
          <Text style={{ color: '#AAA', fontSize: 12, marginTop: 4 }}>No pending follow-ups</Text>
        </View>
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderTemplates = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={{ color: DISCO_COLORS.neonPurple, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
        📝 SURVEY TEMPLATES ({templates.length})
      </Text>
      {templates.map((template) => (
        <View
          key={template.id}
          style={{
            backgroundColor: DISCO_COLORS.cardBg,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: template.active ? DISCO_COLORS.neonPurple : '#666',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '600' }}>{template.name}</Text>
            <View style={{
              backgroundColor: template.active ? DISCO_COLORS.neonGreen + '30' : '#666' + '30',
              paddingHorizontal: 10,
              paddingVertical: 2,
              borderRadius: 10,
            }}>
              <Text style={{
                color: template.active ? DISCO_COLORS.neonGreen : '#666',
                fontSize: 11,
                fontWeight: '600',
              }}>
                {template.active ? 'ACTIVE' : 'INACTIVE'}
              </Text>
            </View>
          </View>
          <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 12, marginBottom: 4 }}>
            Type: {template.type.replace('_', ' ')}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#AAA', fontSize: 12 }}>
              {template.questions.length} questions
            </Text>
            <Text style={{ color: '#AAA', fontSize: 12 }}>
              ~{template.estimatedMinutes} min
            </Text>
          </View>
          {template.department && (
            <Text style={{ color: DISCO_COLORS.neonYellow, fontSize: 11, marginTop: 4 }}>
              Department: {template.department}
            </Text>
          )}
        </View>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderSurveyModal = () => {
    if (!selectedSurvey) return null;
    const template = patientSatisfactionService.getTemplate(selectedSurvey.templateId);

    return (
      <Modal
        visible={showSurveyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSurveyModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.9)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: DISCO_COLORS.darkBg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '90%',
            borderWidth: 2,
            borderColor: DISCO_COLORS.neonPink,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: DISCO_COLORS.neonPurple,
            }}>
              <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '700' }}>Survey Details</Text>
              <TouchableOpacity onPress={() => setShowSurveyModal(false)}>
                <Text style={{ color: DISCO_COLORS.neonPink, fontSize: 16, fontWeight: '600' }}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 16 }}>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 12, marginBottom: 4 }}>Patient</Text>
                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>{selectedSurvey.patientName}</Text>
              </View>
              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 12, marginBottom: 4 }}>Department</Text>
                  <Text style={{ color: '#FFF', fontSize: 14 }}>{selectedSurvey.department}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 12, marginBottom: 4 }}>Provider</Text>
                  <Text style={{ color: '#FFF', fontSize: 14 }}>{selectedSurvey.provider}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 12, marginBottom: 4 }}>Overall Score</Text>
                  <Text style={{ color: getScoreColor(selectedSurvey.overallScore), fontSize: 24, fontWeight: '700' }}>
                    {selectedSurvey.overallScore}%
                  </Text>
                </View>
                {selectedSurvey.npsScore !== undefined && (
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 12, marginBottom: 4 }}>NPS Score</Text>
                    <Text style={{ color: DISCO_COLORS.neonPurple, fontSize: 24, fontWeight: '700' }}>
                      {selectedSurvey.npsScore}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={{ color: DISCO_COLORS.neonPink, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>
                Responses
              </Text>
              {selectedSurvey.responses.map((response, index) => {
                const question = template?.questions.find(q => q.id === response.questionId);
                return (
                  <View key={index} style={{
                    backgroundColor: DISCO_COLORS.cardBg,
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 8,
                  }}>
                    <Text style={{ color: '#AAA', fontSize: 12, marginBottom: 4 }}>
                      {question?.text || response.questionId}
                    </Text>
                    <Text style={{ color: '#FFF', fontSize: 14 }}>
                      {typeof response.answer === 'boolean' 
                        ? (response.answer ? 'Yes' : 'No')
                        : String(response.answer)}
                    </Text>
                  </View>
                );
              })}
              <View style={{ height: 100 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ScreenContainer>
      <View
        style={{ flex: 1, padding: 16, backgroundColor: DISCO_COLORS.darkBg }}
      >
        {/* Header */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{
            color: '#FFF',
            fontSize: 28,
            fontWeight: '900',
            textShadowColor: DISCO_COLORS.neonPink,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 15,
          }}>
            Patient Satisfaction
          </Text>
          <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 14 }}>
            Survey Analytics & Follow-up Management
          </Text>
        </View>

        {renderTabs()}

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'surveys' && renderSurveys()}
        {activeTab === 'followups' && renderFollowUps()}
        {activeTab === 'templates' && renderTemplates()}

        {renderSurveyModal()}
      </View>
    </ScreenContainer>
  );
}
