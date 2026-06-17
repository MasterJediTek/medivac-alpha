/**
 * Infection Control Surveillance Screen
 * MediVac One v3.4 - Disco-themed HAI monitoring and outbreak management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import {
  infectionControlService,
  InfectionCase,
  Outbreak,
  InfectionMetrics,
  HAIType,
} from '@/lib/services/infection-control-service';

const { width } = Dimensions.get('window');

// Disco neon colors
const DISCO_COLORS = {
  neonPink: '#FF10F0',
  neonCyan: '#00FFFF',
  neonPurple: '#BF00FF',
  neonGreen: '#39FF14',
  neonYellow: '#FFFF00',
  neonOrange: '#FF6600',
  neonRed: '#FF0040',
  darkBg: '#0D0221',
  cardBg: 'rgba(20, 10, 40, 0.8)',
};

type TabType = 'dashboard' | 'cases' | 'outbreaks' | 'hygiene' | 'reporting';

export default function InfectionControlScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [metrics, setMetrics] = useState<InfectionMetrics | null>(null);
  const [cases, setCases] = useState<InfectionCase[]>([]);
  const [activeCases, setActiveCases] = useState<InfectionCase[]>([]);
  const [outbreaks, setOutbreaks] = useState<Outbreak[]>([]);
  const [selectedCase, setSelectedCase] = useState<InfectionCase | null>(null);
  const [selectedOutbreak, setSelectedOutbreak] = useState<Outbreak | null>(null);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showOutbreakModal, setShowOutbreakModal] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [alertAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    initializeService();
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Alert flash animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(alertAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(alertAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  const initializeService = async () => {
    await infectionControlService.initialize();
    
    // Generate demo data if empty
    const existingCases = infectionControlService.getCases();
    if (existingCases.length === 0) {
      await infectionControlService.generateDemoData();
    }
    
    loadData();
  };

  const loadData = () => {
    const metricsData = infectionControlService.calculateMetrics();
    setMetrics(metricsData);
    setCases(infectionControlService.getCases());
    setActiveCases(infectionControlService.getActiveCases());
    setOutbreaks(infectionControlService.getOutbreaks());
  };

  const getHAIColor = (haiType: HAIType) => {
    switch (haiType) {
      case 'CLABSI': return DISCO_COLORS.neonRed;
      case 'CAUTI': return DISCO_COLORS.neonOrange;
      case 'SSI': return DISCO_COLORS.neonYellow;
      case 'VAP': return DISCO_COLORS.neonPurple;
      case 'VAE': return DISCO_COLORS.neonPink;
      case 'CDI': return '#8B4513';
      case 'MRSA': return DISCO_COLORS.neonCyan;
      case 'VRE': return '#00CED1';
      case 'CRE': return '#FF1493';
      default: return '#888';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return DISCO_COLORS.neonRed;
      case 'suspected': return DISCO_COLORS.neonYellow;
      case 'resolved': return DISCO_COLORS.neonGreen;
      case 'ruled_out': return '#888';
      case 'active': return DISCO_COLORS.neonRed;
      case 'contained': return DISCO_COLORS.neonYellow;
      case 'monitoring': return DISCO_COLORS.neonCyan;
      default: return '#888';
    }
  };

  const getRateColor = (rate: number, benchmark: number) => {
    if (rate <= benchmark * 0.5) return DISCO_COLORS.neonGreen;
    if (rate <= benchmark) return DISCO_COLORS.neonYellow;
    if (rate <= benchmark * 1.5) return DISCO_COLORS.neonOrange;
    return DISCO_COLORS.neonRed;
  };

  const renderTabs = () => (
    <View style={{ flexDirection: 'row', marginBottom: 16, gap: 6 }}>
      {(['dashboard', 'cases', 'outbreaks', 'hygiene', 'reporting'] as TabType[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          style={{
            flex: 1,
            paddingVertical: 10,
            paddingHorizontal: 4,
            borderRadius: 10,
            backgroundColor: activeTab === tab ? DISCO_COLORS.neonRed : DISCO_COLORS.cardBg,
            borderWidth: 1,
            borderColor: activeTab === tab ? DISCO_COLORS.neonRed : DISCO_COLORS.neonPurple,
            shadowColor: activeTab === tab ? DISCO_COLORS.neonRed : 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 8,
          }}
        >
          <Text style={{
            color: '#FFF',
            fontSize: 9,
            fontWeight: '700',
            textAlign: 'center',
            textTransform: 'uppercase',
          }}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDashboard = () => {
    if (!metrics) return null;

    const activeOutbreakCount = outbreaks.filter(o => o.status === 'active').length;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Active Outbreak Alert */}
        {activeOutbreakCount > 0 && (
          <Animated.View style={{
            backgroundColor: alertAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [DISCO_COLORS.neonRed + '40', DISCO_COLORS.neonRed + '80'],
            }),
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 2,
            borderColor: DISCO_COLORS.neonRed,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 24, marginRight: 12 }}>🚨</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800' }}>
                  ACTIVE OUTBREAK{activeOutbreakCount > 1 ? 'S' : ''}
                </Text>
                <Text style={{ color: '#FFF', fontSize: 12 }}>
                  {activeOutbreakCount} outbreak{activeOutbreakCount > 1 ? 's' : ''} requiring attention
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Key Metrics */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <Animated.View style={{
            flex: 1,
            backgroundColor: DISCO_COLORS.cardBg,
            borderRadius: 16,
            padding: 16,
            borderWidth: 2,
            borderColor: DISCO_COLORS.neonRed,
            transform: [{ scale: pulseAnim }],
          }}>
            <Text style={{ color: DISCO_COLORS.neonRed, fontSize: 11, fontWeight: '600' }}>🦠 ACTIVE CASES</Text>
            <Text style={{
              color: '#FFF',
              fontSize: 36,
              fontWeight: '900',
              textShadowColor: DISCO_COLORS.neonRed,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 15,
            }}>
              {metrics.activeCases}
            </Text>
          </Animated.View>
          <View style={{
            flex: 1,
            backgroundColor: DISCO_COLORS.cardBg,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: DISCO_COLORS.neonGreen,
          }}>
            <Text style={{ color: DISCO_COLORS.neonGreen, fontSize: 11, fontWeight: '600' }}>✅ RESOLVED</Text>
            <Text style={{ color: '#FFF', fontSize: 36, fontWeight: '900' }}>{metrics.resolvedCases}</Text>
          </View>
        </View>

        {/* Hand Hygiene Compliance */}
        <View style={{
          backgroundColor: DISCO_COLORS.cardBg,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: DISCO_COLORS.neonCyan,
        }}>
          <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>
            🧼 HAND HYGIENE COMPLIANCE
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <View style={{ height: 12, backgroundColor: '#333', borderRadius: 6 }}>
                <View style={{
                  height: 12,
                  width: `${metrics.handHygieneCompliance}%`,
                  backgroundColor: metrics.handHygieneCompliance >= 80 ? DISCO_COLORS.neonGreen : 
                    metrics.handHygieneCompliance >= 60 ? DISCO_COLORS.neonYellow : DISCO_COLORS.neonRed,
                  borderRadius: 6,
                }} />
              </View>
            </View>
            <Text style={{
              color: metrics.handHygieneCompliance >= 80 ? DISCO_COLORS.neonGreen : 
                metrics.handHygieneCompliance >= 60 ? DISCO_COLORS.neonYellow : DISCO_COLORS.neonRed,
              fontSize: 24,
              fontWeight: '800',
              marginLeft: 16,
            }}>
              {metrics.handHygieneCompliance}%
            </Text>
          </View>
          <Text style={{ color: '#AAA', fontSize: 11, marginTop: 8 }}>
            Target: ≥85% | National Avg: 82%
          </Text>
        </View>

        {/* Infection Rates by Type */}
        <View style={{
          backgroundColor: DISCO_COLORS.cardBg,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: DISCO_COLORS.neonPink,
        }}>
          <Text style={{ color: DISCO_COLORS.neonPink, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>
            📊 INFECTION RATES (per 1,000 device days)
          </Text>
          {Object.entries(metrics.infectionRates).slice(0, 6).map(([type, data]) => (
            <View key={type} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: getHAIColor(type as HAIType),
                    marginRight: 8,
                  }} />
                  <Text style={{ color: '#FFF', fontSize: 12 }}>{type}</Text>
                </View>
                <Text style={{ color: getRateColor(data.rate, data.benchmark), fontSize: 12, fontWeight: '700' }}>
                  {data.rate.toFixed(2)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1, height: 6, backgroundColor: '#333', borderRadius: 3 }}>
                  <View style={{
                    height: 6,
                    width: `${Math.min((data.rate / (data.benchmark * 2)) * 100, 100)}%`,
                    backgroundColor: getRateColor(data.rate, data.benchmark),
                    borderRadius: 3,
                  }} />
                  <View style={{
                    position: 'absolute',
                    left: `${(data.benchmark / (data.benchmark * 2)) * 100}%`,
                    top: -2,
                    width: 2,
                    height: 10,
                    backgroundColor: '#FFF',
                  }} />
                </View>
                <Text style={{ color: '#888', fontSize: 10, marginLeft: 8 }}>
                  Benchmark: {data.benchmark}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Cases by Unit */}
        <View style={{
          backgroundColor: DISCO_COLORS.cardBg,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: DISCO_COLORS.neonPurple,
        }}>
          <Text style={{ color: DISCO_COLORS.neonPurple, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>
            🏥 CASES BY UNIT
          </Text>
          {Object.entries(metrics.casesByUnit).map(([unit, count]) => (
            <View key={unit} style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.1)',
            }}>
              <Text style={{ color: '#FFF', fontSize: 13 }}>{unit}</Text>
              <View style={{
                backgroundColor: count > 5 ? DISCO_COLORS.neonRed + '30' : DISCO_COLORS.neonGreen + '30',
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 10,
              }}>
                <Text style={{
                  color: count > 5 ? DISCO_COLORS.neonRed : DISCO_COLORS.neonGreen,
                  fontSize: 13,
                  fontWeight: '700',
                }}>
                  {count}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Compliance Metrics */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <View style={{
            flex: 1,
            backgroundColor: DISCO_COLORS.cardBg,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: DISCO_COLORS.neonYellow,
          }}>
            <Text style={{ color: DISCO_COLORS.neonYellow, fontSize: 10, fontWeight: '600' }}>🔒 ISOLATION</Text>
            <Text style={{ color: '#FFF', fontSize: 28, fontWeight: '800' }}>{metrics.isolationCompliance}%</Text>
          </View>
          <View style={{
            flex: 1,
            backgroundColor: DISCO_COLORS.cardBg,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: DISCO_COLORS.neonOrange,
          }}>
            <Text style={{ color: DISCO_COLORS.neonOrange, fontSize: 10, fontWeight: '600' }}>📋 NHSN</Text>
            <Text style={{ color: '#FFF', fontSize: 28, fontWeight: '800' }}>{metrics.nhsnReportingCompliance}%</Text>
          </View>
        </View>

        {/* Contact Tracing */}
        <View style={{
          backgroundColor: DISCO_COLORS.cardBg,
          borderRadius: 16,
          padding: 16,
          marginBottom: 100,
          borderWidth: 1,
          borderColor: DISCO_COLORS.neonCyan,
        }}>
          <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 14, fontWeight: '700', marginBottom: 8 }}>
            🔍 CONTACT TRACING
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#FFF', fontSize: 28, fontWeight: '800' }}>{metrics.contactsTraced}</Text>
              <Text style={{ color: '#AAA', fontSize: 11 }}>Contacts Traced</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: DISCO_COLORS.neonRed, fontSize: 28, fontWeight: '800' }}>{metrics.activeOutbreaks}</Text>
              <Text style={{ color: '#AAA', fontSize: 11 }}>Active Outbreaks</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderCases = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={{ color: DISCO_COLORS.neonRed, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
        🦠 INFECTION CASES ({cases.length})
      </Text>
      
      {/* Active Cases First */}
      {activeCases.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: DISCO_COLORS.neonYellow, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>
            ⚠️ Active Cases ({activeCases.length})
          </Text>
          {activeCases.map((infCase) => (
            <TouchableOpacity
              key={infCase.id}
              onPress={() => {
                setSelectedCase(infCase);
                setShowCaseModal(true);
              }}
              style={{
                backgroundColor: DISCO_COLORS.cardBg,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 2,
                borderColor: getStatusColor(infCase.status),
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '600' }}>{infCase.patientName}</Text>
                <View style={{
                  backgroundColor: getHAIColor(infCase.haiType) + '30',
                  paddingHorizontal: 10,
                  paddingVertical: 2,
                  borderRadius: 10,
                }}>
                  <Text style={{ color: getHAIColor(infCase.haiType), fontSize: 11, fontWeight: '700' }}>
                    {infCase.haiType}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#AAA', fontSize: 12 }}>{infCase.unit} • Room {infCase.room}</Text>
                <View style={{
                  backgroundColor: getStatusColor(infCase.status) + '30',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 8,
                }}>
                  <Text style={{ color: getStatusColor(infCase.status), fontSize: 10, textTransform: 'uppercase' }}>
                    {infCase.status}
                  </Text>
                </View>
              </View>
              {infCase.pathogen && (
                <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 11, marginTop: 4 }}>
                  Pathogen: {infCase.pathogen}
                </Text>
              )}
              <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
                {infCase.isolationPrecautions.map((precaution, i) => (
                  <View key={i} style={{
                    backgroundColor: DISCO_COLORS.neonPurple + '30',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}>
                    <Text style={{ color: DISCO_COLORS.neonPurple, fontSize: 9, textTransform: 'uppercase' }}>
                      {precaution}
                    </Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* All Cases */}
      <Text style={{ color: '#AAA', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>
        All Cases
      </Text>
      {cases.filter(c => !activeCases.includes(c)).map((infCase) => (
        <TouchableOpacity
          key={infCase.id}
          onPress={() => {
            setSelectedCase(infCase);
            setShowCaseModal(true);
          }}
          style={{
            backgroundColor: DISCO_COLORS.cardBg,
            borderRadius: 12,
            padding: 12,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: '#444',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#FFF', fontSize: 13 }}>{infCase.patientName}</Text>
            <Text style={{ color: getHAIColor(infCase.haiType), fontSize: 11 }}>{infCase.haiType}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <Text style={{ color: '#888', fontSize: 11 }}>{infCase.unit}</Text>
            <Text style={{ color: getStatusColor(infCase.status), fontSize: 10, textTransform: 'uppercase' }}>
              {infCase.status}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderOutbreaks = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={{ color: DISCO_COLORS.neonRed, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
        🚨 OUTBREAKS ({outbreaks.length})
      </Text>
      
      {outbreaks.length === 0 ? (
        <View style={{
          backgroundColor: DISCO_COLORS.cardBg,
          borderRadius: 16,
          padding: 32,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: DISCO_COLORS.neonGreen,
        }}>
          <Text style={{ color: DISCO_COLORS.neonGreen, fontSize: 48, marginBottom: 12 }}>✅</Text>
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>No Active Outbreaks</Text>
          <Text style={{ color: '#AAA', fontSize: 12, marginTop: 4 }}>Infection control measures are effective</Text>
        </View>
      ) : (
        outbreaks.map((outbreak) => (
          <TouchableOpacity
            key={outbreak.id}
            onPress={() => {
              setSelectedOutbreak(outbreak);
              setShowOutbreakModal(true);
            }}
            style={{
              backgroundColor: DISCO_COLORS.cardBg,
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              borderWidth: 2,
              borderColor: getStatusColor(outbreak.status),
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>{outbreak.name}</Text>
              <View style={{
                backgroundColor: getStatusColor(outbreak.status) + '30',
                paddingHorizontal: 10,
                paddingVertical: 2,
                borderRadius: 10,
              }}>
                <Text style={{ color: getStatusColor(outbreak.status), fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }}>
                  {outbreak.status}
                </Text>
              </View>
            </View>
            <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 12, marginBottom: 4 }}>
              Pathogen: {outbreak.pathogen}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#AAA', fontSize: 12 }}>
                Units: {outbreak.affectedUnits.join(', ')}
              </Text>
              <Text style={{ color: DISCO_COLORS.neonRed, fontSize: 12, fontWeight: '600' }}>
                {outbreak.caseCount} cases
              </Text>
            </View>
            <Text style={{ color: '#888', fontSize: 11, marginTop: 4 }}>
              Started: {new Date(outbreak.startDate).toLocaleDateString()}
            </Text>
            {outbreak.controlMeasures.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={{ color: DISCO_COLORS.neonGreen, fontSize: 11 }}>
                  Control measures: {outbreak.controlMeasures.length} implemented
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderHygiene = () => {
    if (!metrics) return null;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
          🧼 HAND HYGIENE MONITORING
        </Text>

        {/* Overall Compliance */}
        <View style={{
          backgroundColor: DISCO_COLORS.cardBg,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          borderWidth: 2,
          borderColor: metrics.handHygieneCompliance >= 85 ? DISCO_COLORS.neonGreen : DISCO_COLORS.neonYellow,
          alignItems: 'center',
        }}>
          <Text style={{ color: '#AAA', fontSize: 12, marginBottom: 8 }}>OVERALL COMPLIANCE</Text>
          <Text style={{
            color: metrics.handHygieneCompliance >= 85 ? DISCO_COLORS.neonGreen : 
              metrics.handHygieneCompliance >= 70 ? DISCO_COLORS.neonYellow : DISCO_COLORS.neonRed,
            fontSize: 64,
            fontWeight: '900',
            textShadowColor: metrics.handHygieneCompliance >= 85 ? DISCO_COLORS.neonGreen : DISCO_COLORS.neonYellow,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 20,
          }}>
            {metrics.handHygieneCompliance}%
          </Text>
          <Text style={{ color: '#888', fontSize: 12 }}>Target: ≥85%</Text>
        </View>

        {/* Compliance by Unit */}
        <View style={{
          backgroundColor: DISCO_COLORS.cardBg,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: DISCO_COLORS.neonPurple,
        }}>
          <Text style={{ color: DISCO_COLORS.neonPurple, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>
            📊 COMPLIANCE BY UNIT
          </Text>
          {Object.entries(metrics.handHygieneByUnit).map(([unit, compliance]) => (
            <View key={unit} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: '#FFF', fontSize: 13 }}>{unit}</Text>
                <Text style={{
                  color: compliance >= 85 ? DISCO_COLORS.neonGreen : 
                    compliance >= 70 ? DISCO_COLORS.neonYellow : DISCO_COLORS.neonRed,
                  fontSize: 13,
                  fontWeight: '700',
                }}>
                  {compliance}%
                </Text>
              </View>
              <View style={{ height: 8, backgroundColor: '#333', borderRadius: 4 }}>
                <View style={{
                  height: 8,
                  width: `${compliance}%`,
                  backgroundColor: compliance >= 85 ? DISCO_COLORS.neonGreen : 
                    compliance >= 70 ? DISCO_COLORS.neonYellow : DISCO_COLORS.neonRed,
                  borderRadius: 4,
                }} />
              </View>
            </View>
          ))}
        </View>

        {/* Five Moments */}
        <View style={{
          backgroundColor: DISCO_COLORS.cardBg,
          borderRadius: 16,
          padding: 16,
          marginBottom: 100,
          borderWidth: 1,
          borderColor: DISCO_COLORS.neonCyan,
        }}>
          <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>
            ✋ FIVE MOMENTS OF HAND HYGIENE
          </Text>
          {[
            { moment: 'Before Patient Contact', icon: '1️⃣' },
            { moment: 'Before Aseptic Task', icon: '2️⃣' },
            { moment: 'After Body Fluid Exposure', icon: '3️⃣' },
            { moment: 'After Patient Contact', icon: '4️⃣' },
            { moment: 'After Environment Contact', icon: '5️⃣' },
          ].map((item, i) => (
            <View key={i} style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 10,
              borderBottomWidth: i < 4 ? 1 : 0,
              borderBottomColor: 'rgba(255,255,255,0.1)',
            }}>
              <Text style={{ fontSize: 20, marginRight: 12 }}>{item.icon}</Text>
              <Text style={{ color: '#FFF', fontSize: 13, flex: 1 }}>{item.moment}</Text>
              <Text style={{ color: DISCO_COLORS.neonGreen, fontSize: 13, fontWeight: '600' }}>
                {75 + Math.floor(Math.random() * 20)}%
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderReporting = () => {
    const nhsnCases = infectionControlService.getCasesForNHSNReporting();

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={{ color: DISCO_COLORS.neonOrange, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
          📋 NHSN REPORTING
        </Text>

        {/* Pending Reports */}
        <View style={{
          backgroundColor: DISCO_COLORS.cardBg,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: nhsnCases.length > 0 ? DISCO_COLORS.neonOrange : DISCO_COLORS.neonGreen,
        }}>
          <Text style={{ color: nhsnCases.length > 0 ? DISCO_COLORS.neonOrange : DISCO_COLORS.neonGreen, fontSize: 14, fontWeight: '700', marginBottom: 8 }}>
            {nhsnCases.length > 0 ? '⚠️ PENDING REPORTS' : '✅ ALL REPORTED'}
          </Text>
          {nhsnCases.length > 0 ? (
            <>
              <Text style={{ color: '#FFF', fontSize: 32, fontWeight: '800' }}>{nhsnCases.length}</Text>
              <Text style={{ color: '#AAA', fontSize: 12 }}>cases awaiting NHSN submission</Text>
            </>
          ) : (
            <Text style={{ color: '#AAA', fontSize: 12 }}>All confirmed HAIs have been reported to NHSN</Text>
          )}
        </View>

        {/* Cases to Report */}
        {nhsnCases.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#AAA', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>
              Cases Requiring Report
            </Text>
            {nhsnCases.map((infCase) => (
              <View
                key={infCase.id}
                style={{
                  backgroundColor: DISCO_COLORS.cardBg,
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: DISCO_COLORS.neonOrange,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: '#FFF', fontSize: 13 }}>{infCase.patientName}</Text>
                  <Text style={{ color: getHAIColor(infCase.haiType), fontSize: 11, fontWeight: '600' }}>
                    {infCase.haiType}
                  </Text>
                </View>
                <Text style={{ color: '#888', fontSize: 11 }}>
                  Identified: {new Date(infCase.identifiedDate).toLocaleDateString()}
                </Text>
                <TouchableOpacity
                  onPress={async () => {
                    await infectionControlService.markReportedToNHSN(infCase.id);
                    loadData();
                  }}
                  style={{
                    backgroundColor: DISCO_COLORS.neonGreen + '30',
                    paddingVertical: 8,
                    borderRadius: 8,
                    marginTop: 8,
                    borderWidth: 1,
                    borderColor: DISCO_COLORS.neonGreen,
                  }}
                >
                  <Text style={{ color: DISCO_COLORS.neonGreen, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
                    MARK AS REPORTED
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Reporting Categories */}
        <View style={{
          backgroundColor: DISCO_COLORS.cardBg,
          borderRadius: 16,
          padding: 16,
          marginBottom: 100,
          borderWidth: 1,
          borderColor: DISCO_COLORS.neonPurple,
        }}>
          <Text style={{ color: DISCO_COLORS.neonPurple, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>
            📊 REPORTABLE HAI CATEGORIES
          </Text>
          {['CLABSI', 'CAUTI', 'SSI', 'VAP', 'VAE', 'CDI', 'MRSA'].map((type) => (
            <View key={type} style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.1)',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: getHAIColor(type as HAIType),
                  marginRight: 8,
                }} />
                <Text style={{ color: '#FFF', fontSize: 13 }}>{type}</Text>
              </View>
              <Text style={{ color: DISCO_COLORS.neonGreen, fontSize: 12 }}>Required</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderCaseModal = () => {
    if (!selectedCase) return null;

    return (
      <Modal
        visible={showCaseModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCaseModal(false)}
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
            borderColor: getHAIColor(selectedCase.haiType),
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: DISCO_COLORS.neonPurple,
            }}>
              <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '700' }}>Case Details</Text>
              <TouchableOpacity onPress={() => setShowCaseModal(false)}>
                <Text style={{ color: DISCO_COLORS.neonPink, fontSize: 16, fontWeight: '600' }}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 16 }}>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 12, marginBottom: 4 }}>Patient</Text>
                <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '700' }}>{selectedCase.patientName}</Text>
                <Text style={{ color: '#AAA', fontSize: 12 }}>MRN: {selectedCase.mrn}</Text>
              </View>

              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 12, marginBottom: 4 }}>HAI Type</Text>
                  <Text style={{ color: getHAIColor(selectedCase.haiType), fontSize: 16, fontWeight: '700' }}>
                    {selectedCase.haiType}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 12, marginBottom: 4 }}>Status</Text>
                  <Text style={{ color: getStatusColor(selectedCase.status), fontSize: 16, fontWeight: '700', textTransform: 'capitalize' }}>
                    {selectedCase.status}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 12, marginBottom: 4 }}>Location</Text>
                  <Text style={{ color: '#FFF', fontSize: 14 }}>{selectedCase.unit}</Text>
                  <Text style={{ color: '#AAA', fontSize: 12 }}>Room {selectedCase.room}, Bed {selectedCase.bed}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 12, marginBottom: 4 }}>Pathogen</Text>
                  <Text style={{ color: '#FFF', fontSize: 14 }}>{selectedCase.pathogen || 'Pending'}</Text>
                </View>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 12, marginBottom: 8 }}>Isolation Precautions</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {selectedCase.isolationPrecautions.map((precaution, i) => (
                    <View key={i} style={{
                      backgroundColor: DISCO_COLORS.neonPurple + '30',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: DISCO_COLORS.neonPurple,
                    }}>
                      <Text style={{ color: DISCO_COLORS.neonPurple, fontSize: 12, textTransform: 'uppercase' }}>
                        {precaution}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {selectedCase.riskFactors.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 12, marginBottom: 8 }}>Risk Factors</Text>
                  {selectedCase.riskFactors.map((factor, i) => (
                    <Text key={i} style={{ color: '#FFF', fontSize: 13, marginBottom: 4 }}>• {factor}</Text>
                  ))}
                </View>
              )}

              {selectedCase.contacts.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 12, marginBottom: 8 }}>
                    Contact Tracing ({selectedCase.contacts.length})
                  </Text>
                  {selectedCase.contacts.map((contact, i) => (
                    <View key={i} style={{
                      backgroundColor: DISCO_COLORS.cardBg,
                      borderRadius: 8,
                      padding: 10,
                      marginBottom: 8,
                    }}>
                      <Text style={{ color: '#FFF', fontSize: 12 }}>
                        {contact.contactPatientName || contact.contactStaffName}
                      </Text>
                      <Text style={{ color: '#888', fontSize: 11 }}>
                        {contact.contactType} • {contact.riskLevel} risk
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={{ height: 100 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderOutbreakModal = () => {
    if (!selectedOutbreak) return null;

    return (
      <Modal
        visible={showOutbreakModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOutbreakModal(false)}
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
            borderColor: DISCO_COLORS.neonRed,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: DISCO_COLORS.neonPurple,
            }}>
              <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '700' }}>Outbreak Details</Text>
              <TouchableOpacity onPress={() => setShowOutbreakModal(false)}>
                <Text style={{ color: DISCO_COLORS.neonPink, fontSize: 16, fontWeight: '600' }}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 16 }}>
              <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '800', marginBottom: 8 }}>
                {selectedOutbreak.name}
              </Text>
              
              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 12, marginBottom: 4 }}>Status</Text>
                  <Text style={{ color: getStatusColor(selectedOutbreak.status), fontSize: 16, fontWeight: '700', textTransform: 'uppercase' }}>
                    {selectedOutbreak.status}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 12, marginBottom: 4 }}>Cases</Text>
                  <Text style={{ color: DISCO_COLORS.neonRed, fontSize: 24, fontWeight: '800' }}>
                    {selectedOutbreak.caseCount}
                  </Text>
                </View>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 12, marginBottom: 4 }}>Pathogen</Text>
                <Text style={{ color: '#FFF', fontSize: 16 }}>{selectedOutbreak.pathogen}</Text>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 12, marginBottom: 4 }}>Affected Units</Text>
                <Text style={{ color: '#FFF', fontSize: 14 }}>{selectedOutbreak.affectedUnits.join(', ')}</Text>
              </View>

              {selectedOutbreak.controlMeasures.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: DISCO_COLORS.neonGreen, fontSize: 12, marginBottom: 8 }}>Control Measures</Text>
                  {selectedOutbreak.controlMeasures.map((measure, i) => (
                    <Text key={i} style={{ color: '#FFF', fontSize: 13, marginBottom: 4 }}>✓ {measure}</Text>
                  ))}
                </View>
              )}

              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: DISCO_COLORS.neonPurple, fontSize: 12, marginBottom: 8 }}>Timeline</Text>
                {selectedOutbreak.timeline.map((event, i) => (
                  <View key={i} style={{
                    backgroundColor: DISCO_COLORS.cardBg,
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 8,
                    borderLeftWidth: 3,
                    borderLeftColor: event.type === 'case_identified' ? DISCO_COLORS.neonRed : 
                      event.type === 'control_measure' ? DISCO_COLORS.neonGreen : DISCO_COLORS.neonCyan,
                  }}>
                    <Text style={{ color: '#888', fontSize: 10 }}>
                      {new Date(event.date).toLocaleString()}
                    </Text>
                    <Text style={{ color: '#FFF', fontSize: 12 }}>{event.description}</Text>
                  </View>
                ))}
              </View>

              <View style={{ height: 100 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ScreenContainer>
      <View style={{ flex: 1, padding: 16, backgroundColor: DISCO_COLORS.darkBg }}>
        {/* Header */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{
            color: '#FFF',
            fontSize: 26,
            fontWeight: '900',
            textShadowColor: DISCO_COLORS.neonRed,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 15,
          }}>
            Infection Control
          </Text>
          <Text style={{ color: DISCO_COLORS.neonCyan, fontSize: 14 }}>
            HAI Surveillance & Outbreak Management
          </Text>
        </View>

        {renderTabs()}

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'cases' && renderCases()}
        {activeTab === 'outbreaks' && renderOutbreaks()}
        {activeTab === 'hygiene' && renderHygiene()}
        {activeTab === 'reporting' && renderReporting()}

        {renderCaseModal()}
        {renderOutbreakModal()}
      </View>
    </ScreenContainer>
  );
}
