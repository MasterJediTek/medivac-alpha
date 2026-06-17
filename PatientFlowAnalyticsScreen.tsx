/**
 * Patient Flow Analytics Screen
 * Comprehensive dashboard for capacity planning and throughput optimization
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  patientFlowAnalyticsService,
  UnitCensus,
  FlowMetrics,
  BottleneckAnalysis,
  CapacityForecast,
  ThroughputMetric,
  DischargePrediction,
  BenchmarkComparison,
} from '../services/PatientFlowAnalyticsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PatientFlowAnalyticsScreen() {
  const colors = useColors();
  const [unitCensus, setUnitCensus] = useState<UnitCensus[]>([]);
  const [totalCensus, setTotalCensus] = useState({ total: 0, occupied: 0, available: 0, occupancyRate: 0 });
  const [flowMetrics, setFlowMetrics] = useState<FlowMetrics[]>([]);
  const [bottlenecks, setBottlenecks] = useState<BottleneckAnalysis[]>([]);
  const [forecasts, setForecasts] = useState<CapacityForecast[]>([]);
  const [throughputMetrics, setThroughputMetrics] = useState<ThroughputMetric[]>([]);
  const [dischargePredictions, setDischargePredictions] = useState<DischargePrediction[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkComparison[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'flow' | 'forecast' | 'benchmark'>('overview');
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [showBottleneckModal, setShowBottleneckModal] = useState(false);

  // Load data
  const loadData = useCallback(() => {
    setUnitCensus(patientFlowAnalyticsService.getUnitCensus());
    setTotalCensus(patientFlowAnalyticsService.getTotalCensus());
    setFlowMetrics(patientFlowAnalyticsService.getFlowMetrics('daily'));
    setBottlenecks(patientFlowAnalyticsService.identifyBottlenecks());
    setForecasts(patientFlowAnalyticsService.generateCapacityForecast(7));
    setThroughputMetrics(patientFlowAnalyticsService.getThroughputMetrics());
    setDischargePredictions(patientFlowAnalyticsService.getDischargePredictions());
    setBenchmarks(patientFlowAnalyticsService.getBenchmarkComparisons());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Subscribe to updates
  useEffect(() => {
    const unsubscribe = patientFlowAnalyticsService.subscribe(() => {
      loadData();
    });
    return unsubscribe;
  }, [loadData]);

  // Render occupancy gauge
  const renderOccupancyGauge = () => {
    const occupancy = totalCensus.occupancyRate;
    const gaugeColor = occupancy > 90 ? colors.error : occupancy > 80 ? colors.warning : colors.success;
    
    return (
      <View style={[styles.gaugeContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.gaugeHeader}>
          <Text style={[styles.gaugeTitle, { color: colors.foreground }]}>Hospital Occupancy</Text>
          <Text style={[styles.gaugeValue, { color: gaugeColor }]}>{occupancy}%</Text>
        </View>
        <View style={[styles.gaugeBar, { backgroundColor: colors.border }]}>
          <View style={[styles.gaugeFill, { width: `${occupancy}%`, backgroundColor: gaugeColor }]} />
        </View>
        <View style={styles.gaugeStats}>
          <View style={styles.gaugeStat}>
            <Text style={[styles.gaugeStatValue, { color: colors.foreground }]}>{totalCensus.occupied}</Text>
            <Text style={[styles.gaugeStatLabel, { color: colors.muted }]}>Occupied</Text>
          </View>
          <View style={styles.gaugeStat}>
            <Text style={[styles.gaugeStatValue, { color: colors.success }]}>{totalCensus.available}</Text>
            <Text style={[styles.gaugeStatLabel, { color: colors.muted }]}>Available</Text>
          </View>
          <View style={styles.gaugeStat}>
            <Text style={[styles.gaugeStatValue, { color: colors.foreground }]}>{totalCensus.total}</Text>
            <Text style={[styles.gaugeStatLabel, { color: colors.muted }]}>Total Beds</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render unit card
  const renderUnitCard = (unit: UnitCensus) => {
    const occupancyColor = unit.occupancyRate > 90 ? colors.error : unit.occupancyRate > 80 ? colors.warning : colors.success;
    
    return (
      <View key={unit.unitType} style={[styles.unitCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.unitHeader}>
          <Text style={[styles.unitName, { color: colors.foreground }]} numberOfLines={1}>{unit.unitName}</Text>
          <View style={[styles.occupancyBadge, { backgroundColor: occupancyColor }]}>
            <Text style={styles.occupancyText}>{unit.occupancyRate}%</Text>
          </View>
        </View>
        <View style={styles.unitStats}>
          <View style={styles.unitStat}>
            <Text style={[styles.unitStatValue, { color: colors.primary }]}>{unit.occupiedBeds}</Text>
            <Text style={[styles.unitStatLabel, { color: colors.muted }]}>Occupied</Text>
          </View>
          <View style={styles.unitStat}>
            <Text style={[styles.unitStatValue, { color: colors.success }]}>{unit.availableBeds}</Text>
            <Text style={[styles.unitStatLabel, { color: colors.muted }]}>Available</Text>
          </View>
          <View style={styles.unitStat}>
            <Text style={[styles.unitStatValue, { color: colors.warning }]}>{unit.pendingDischarges}</Text>
            <Text style={[styles.unitStatLabel, { color: colors.muted }]}>Pending DC</Text>
          </View>
        </View>
        <View style={[styles.unitBar, { backgroundColor: colors.border }]}>
          <View style={[styles.unitBarFill, { width: `${unit.occupancyRate}%`, backgroundColor: occupancyColor }]} />
        </View>
      </View>
    );
  };

  // Render bottleneck card
  const renderBottleneckCard = (bottleneck: BottleneckAnalysis) => {
    const severityColors: Record<string, string> = {
      critical: colors.error,
      high: '#F97316',
      moderate: colors.warning,
      low: colors.success,
    };
    
    return (
      <View key={bottleneck.location} style={[styles.bottleneckCard, { backgroundColor: colors.surface, borderColor: severityColors[bottleneck.severity] }]}>
        <View style={styles.bottleneckHeader}>
          <Text style={[styles.bottleneckLocation, { color: colors.foreground }]}>{bottleneck.location}</Text>
          <View style={[styles.severityBadge, { backgroundColor: severityColors[bottleneck.severity] }]}>
            <Text style={styles.severityText}>{bottleneck.severity.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={[styles.bottleneckImpact, { color: colors.muted }]}>{bottleneck.impact}</Text>
        <View style={styles.bottleneckStats}>
          <Text style={[styles.bottleneckStat, { color: colors.error }]}>
            {bottleneck.waitingPatients} waiting
          </Text>
          <Text style={[styles.bottleneckStat, { color: colors.warning }]}>
            ~{Math.round(bottleneck.averageWaitTime / 60)}h avg wait
          </Text>
        </View>
      </View>
    );
  };

  // Render throughput metric
  const renderThroughputMetric = (metric: ThroughputMetric) => {
    const statusColors: Record<string, string> = {
      at: colors.success,
      above: metric.metric.includes('Rate') && !metric.metric.includes('Readmission') ? colors.success : colors.error,
      below: metric.metric.includes('Rate') && !metric.metric.includes('Readmission') ? colors.error : colors.warning,
    };
    const trendIcons: Record<string, string> = {
      improving: '↑',
      stable: '→',
      declining: '↓',
    };
    
    return (
      <View key={metric.metric} style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.metricName, { color: colors.muted }]}>{metric.metric}</Text>
        <View style={styles.metricValueRow}>
          <Text style={[styles.metricValue, { color: statusColors[metric.status] }]}>
            {metric.value}{metric.unit === '%' ? '%' : ` ${metric.unit}`}
          </Text>
          <Text style={[styles.metricTrend, { color: metric.trend === 'improving' ? colors.success : metric.trend === 'declining' ? colors.error : colors.muted }]}>
            {trendIcons[metric.trend]} {metric.percentChange > 0 ? '+' : ''}{metric.percentChange}%
          </Text>
        </View>
        <Text style={[styles.metricTarget, { color: colors.muted }]}>Target: {metric.target}{metric.unit === '%' ? '%' : ` ${metric.unit}`}</Text>
      </View>
    );
  };

  // Render forecast card
  const renderForecastCard = (forecast: CapacityForecast, index: number) => {
    const date = new Date(forecast.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const occupancyColor = forecast.predictedOccupancy > 90 ? colors.error : forecast.predictedOccupancy > 80 ? colors.warning : colors.success;
    
    return (
      <View key={index} style={[styles.forecastCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.forecastDay, { color: colors.foreground }]}>{dayName}</Text>
        <Text style={[styles.forecastDate, { color: colors.muted }]}>{dateStr}</Text>
        <View style={[styles.forecastOccupancy, { backgroundColor: occupancyColor }]}>
          <Text style={styles.forecastOccupancyText}>{forecast.predictedOccupancy}%</Text>
        </View>
        <View style={styles.forecastFlow}>
          <Text style={[styles.forecastAdmit, { color: colors.error }]}>+{forecast.predictedAdmissions}</Text>
          <Text style={[styles.forecastDischarge, { color: colors.success }]}>-{forecast.predictedDischarges}</Text>
        </View>
        <Text style={[styles.forecastConfidence, { color: colors.muted }]}>{forecast.confidence}% conf</Text>
      </View>
    );
  };

  // Render benchmark row
  const renderBenchmarkRow = (benchmark: BenchmarkComparison) => {
    const percentileColor = benchmark.percentile >= 75 ? colors.success : benchmark.percentile >= 50 ? colors.warning : colors.error;
    
    return (
      <View key={benchmark.metric} style={[styles.benchmarkRow, { borderBottomColor: colors.border }]}>
        <View style={styles.benchmarkMetric}>
          <Text style={[styles.benchmarkName, { color: colors.foreground }]}>{benchmark.metric}</Text>
          <Text style={[styles.benchmarkValue, { color: colors.primary }]}>{benchmark.facilityValue}</Text>
        </View>
        <View style={styles.benchmarkComparisons}>
          <View style={styles.benchmarkItem}>
            <Text style={[styles.benchmarkItemValue, { color: colors.muted }]}>{benchmark.regionalAverage}</Text>
            <Text style={[styles.benchmarkItemLabel, { color: colors.muted }]}>Regional</Text>
          </View>
          <View style={styles.benchmarkItem}>
            <Text style={[styles.benchmarkItemValue, { color: colors.muted }]}>{benchmark.nationalAverage}</Text>
            <Text style={[styles.benchmarkItemLabel, { color: colors.muted }]}>National</Text>
          </View>
          <View style={styles.benchmarkItem}>
            <Text style={[styles.benchmarkItemValue, { color: colors.success }]}>{benchmark.topQuartile}</Text>
            <Text style={[styles.benchmarkItemLabel, { color: colors.muted }]}>Top 25%</Text>
          </View>
        </View>
        <View style={[styles.percentileBadge, { backgroundColor: percentileColor }]}>
          <Text style={styles.percentileText}>{benchmark.percentile}th</Text>
        </View>
      </View>
    );
  };

  // Render discharge prediction
  const renderDischargePrediction = ({ item }: { item: DischargePrediction }) => {
    const readinessColor = item.readinessScore >= 80 ? colors.success : item.readinessScore >= 50 ? colors.warning : colors.error;
    
    return (
      <View style={[styles.dischargeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.dischargeHeader}>
          <View>
            <Text style={[styles.dischargeName, { color: colors.foreground }]}>{item.patientName}</Text>
            <Text style={[styles.dischargeBed, { color: colors.muted }]}>{item.currentUnit} • {item.bedId}</Text>
          </View>
          <View style={[styles.readinessBadge, { backgroundColor: readinessColor }]}>
            <Text style={styles.readinessText}>{item.readinessScore}%</Text>
          </View>
        </View>
        <View style={styles.dischargeDetails}>
          <Text style={[styles.dischargeDate, { color: colors.primary }]}>
            Est. DC: {new Date(item.predictedDischargeDate).toLocaleDateString()}
          </Text>
          <Text style={[styles.dischargeConfidence, { color: colors.muted }]}>
            {item.confidence}% confidence
          </Text>
        </View>
        {item.barriers.length > 0 && (
          <View style={styles.barriersList}>
            {item.barriers.slice(0, 2).map(b => (
              <View key={b.id} style={[styles.barrierTag, { backgroundColor: colors.error + '20' }]}>
                <Text style={[styles.barrierText, { color: colors.error }]}>{b.type}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Tab buttons
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'flow', label: 'Flow' },
    { id: 'forecast', label: 'Forecast' },
    { id: 'benchmark', label: 'Benchmark' },
  ] as const;

  return (
    <ScreenContainer>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Patient Flow Analytics</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Real-time capacity and throughput insights
          </Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                { backgroundColor: activeTab === tab.id ? colors.primary : colors.surface }
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === tab.id ? '#fff' : colors.foreground }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {renderOccupancyGauge()}

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: colors.primary }]}
                onPress={() => setShowDischargeModal(true)}
              >
                <Text style={styles.quickActionIcon}>📋</Text>
                <Text style={styles.quickActionText}>Discharge List</Text>
                <View style={styles.quickActionBadge}>
                  <Text style={styles.quickActionBadgeText}>{dischargePredictions.length}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: bottlenecks.length > 0 ? colors.error : colors.success }]}
                onPress={() => setShowBottleneckModal(true)}
              >
                <Text style={styles.quickActionIcon}>⚠️</Text>
                <Text style={styles.quickActionText}>Bottlenecks</Text>
                <View style={styles.quickActionBadge}>
                  <Text style={styles.quickActionBadgeText}>{bottlenecks.length}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Unit Census */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Unit Census</Text>
              <View style={styles.unitGrid}>
                {unitCensus.slice(0, 6).map(renderUnitCard)}
              </View>
            </View>

            {/* Bottlenecks Preview */}
            {bottlenecks.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Active Bottlenecks</Text>
                {bottlenecks.slice(0, 2).map(renderBottleneckCard)}
              </View>
            )}
          </>
        )}

        {/* Flow Tab */}
        {activeTab === 'flow' && (
          <>
            {/* Today's Flow */}
            <View style={[styles.flowSummary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.flowTitle, { color: colors.foreground }]}>Today's Patient Flow</Text>
              <View style={styles.flowStats}>
                <View style={styles.flowStat}>
                  <Text style={[styles.flowStatValue, { color: colors.error }]}>
                    +{flowMetrics[flowMetrics.length - 1]?.admissions || 0}
                  </Text>
                  <Text style={[styles.flowStatLabel, { color: colors.muted }]}>Admissions</Text>
                </View>
                <View style={styles.flowStat}>
                  <Text style={[styles.flowStatValue, { color: colors.success }]}>
                    -{flowMetrics[flowMetrics.length - 1]?.discharges || 0}
                  </Text>
                  <Text style={[styles.flowStatLabel, { color: colors.muted }]}>Discharges</Text>
                </View>
                <View style={styles.flowStat}>
                  <Text style={[styles.flowStatValue, { color: colors.primary }]}>
                    {flowMetrics[flowMetrics.length - 1]?.transfers || 0}
                  </Text>
                  <Text style={[styles.flowStatLabel, { color: colors.muted }]}>Transfers</Text>
                </View>
              </View>
            </View>

            {/* Throughput Metrics */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Key Performance Indicators</Text>
              <View style={styles.metricsGrid}>
                {throughputMetrics.map(renderThroughputMetric)}
              </View>
            </View>

            {/* Mini Chart - 7 Day Trend */}
            <View style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.chartTitle, { color: colors.foreground }]}>7-Day Occupancy Trend</Text>
              <View style={styles.miniChart}>
                {flowMetrics.slice(-7).map((m, idx) => {
                  const height = Math.max(20, (m.occupancyRate / 100) * 80);
                  const barColor = m.occupancyRate > 90 ? colors.error : m.occupancyRate > 80 ? colors.warning : colors.success;
                  return (
                    <View key={idx} style={styles.chartBarContainer}>
                      <View style={[styles.chartBar, { height, backgroundColor: barColor }]} />
                      <Text style={[styles.chartBarLabel, { color: colors.muted }]}>
                        {new Date(m.timestamp).toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* Forecast Tab */}
        {activeTab === 'forecast' && (
          <>
            <View style={[styles.forecastHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.forecastHeaderTitle, { color: colors.foreground }]}>7-Day Capacity Forecast</Text>
              <Text style={[styles.forecastHeaderSubtitle, { color: colors.muted }]}>
                AI-powered predictions based on historical patterns
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScroll}>
              {forecasts.map((f, idx) => renderForecastCard(f, idx))}
            </ScrollView>

            {/* Forecast Factors */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Influencing Factors</Text>
              {forecasts[0]?.factors.map((factor, idx) => (
                <View key={idx} style={[styles.factorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.factorHeader}>
                    <Text style={[styles.factorName, { color: colors.foreground }]}>{factor.name}</Text>
                    <View style={[
                      styles.factorImpact,
                      { backgroundColor: factor.impact === 'positive' ? colors.success : factor.impact === 'negative' ? colors.error : colors.muted }
                    ]}>
                      <Text style={styles.factorImpactText}>
                        {factor.impact === 'positive' ? '↑' : factor.impact === 'negative' ? '↓' : '→'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.factorDescription, { color: colors.muted }]}>{factor.description}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Benchmark Tab */}
        {activeTab === 'benchmark' && (
          <>
            <View style={[styles.benchmarkHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.benchmarkHeaderTitle, { color: colors.foreground }]}>Performance Benchmarks</Text>
              <Text style={[styles.benchmarkHeaderSubtitle, { color: colors.muted }]}>
                Compare against regional and national standards
              </Text>
            </View>

            <View style={styles.benchmarkList}>
              {benchmarks.map(renderBenchmarkRow)}
            </View>
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Discharge Predictions Modal */}
      <Modal
        visible={showDischargeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDischargeModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Discharge Predictions</Text>
            <TouchableOpacity onPress={() => setShowDischargeModal(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={dischargePredictions}
            keyExtractor={(item) => item.patientId}
            renderItem={renderDischargePrediction}
            contentContainerStyle={styles.modalContent}
          />
        </View>
      </Modal>

      {/* Bottleneck Modal */}
      <Modal
        visible={showBottleneckModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBottleneckModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Bottleneck Analysis</Text>
            <TouchableOpacity onPress={() => setShowBottleneckModal(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {bottlenecks.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>✓</Text>
                <Text style={[styles.emptyText, { color: colors.muted }]}>No bottlenecks detected</Text>
              </View>
            ) : (
              bottlenecks.map(b => (
                <View key={b.location} style={[styles.bottleneckDetail, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.bottleneckDetailTitle, { color: colors.foreground }]}>{b.location}</Text>
                  <Text style={[styles.bottleneckDetailImpact, { color: colors.muted }]}>{b.impact}</Text>
                  <View style={styles.recommendationsList}>
                    <Text style={[styles.recommendationsLabel, { color: colors.foreground }]}>Recommendations:</Text>
                    {b.recommendations.map((rec, idx) => (
                      <Text key={idx} style={[styles.recommendationItem, { color: colors.muted }]}>• {rec}</Text>
                    ))}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  gaugeContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gaugeTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  gaugeValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  gaugeBar: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 6,
  },
  gaugeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  gaugeStat: {
    alignItems: 'center',
  },
  gaugeStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  gaugeStatLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  quickActionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  quickActionBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  quickActionBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  unitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  unitCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  unitName: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  occupancyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  occupancyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  unitStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  unitStat: {
    alignItems: 'center',
  },
  unitStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  unitStatLabel: {
    fontSize: 9,
  },
  unitBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  unitBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  bottleneckCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
  },
  bottleneckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bottleneckLocation: {
    fontSize: 16,
    fontWeight: '600',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  bottleneckImpact: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  bottleneckStats: {
    flexDirection: 'row',
    gap: 16,
  },
  bottleneckStat: {
    fontSize: 12,
    fontWeight: '500',
  },
  flowSummary: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  flowTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  flowStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  flowStat: {
    alignItems: 'center',
  },
  flowStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  flowStatLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  metricsGrid: {
    gap: 12,
  },
  metricCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  metricName: {
    fontSize: 12,
    marginBottom: 4,
  },
  metricValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  metricTrend: {
    fontSize: 14,
    fontWeight: '600',
  },
  metricTarget: {
    fontSize: 11,
    marginTop: 4,
  },
  chartContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  miniChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 24,
    borderRadius: 4,
  },
  chartBarLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  forecastHeader: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  forecastHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  forecastHeaderSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  forecastScroll: {
    marginBottom: 16,
  },
  forecastCard: {
    width: 100,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
  },
  forecastDay: {
    fontSize: 14,
    fontWeight: '600',
  },
  forecastDate: {
    fontSize: 11,
    marginBottom: 8,
  },
  forecastOccupancy: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  forecastOccupancyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  forecastFlow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  forecastAdmit: {
    fontSize: 11,
    fontWeight: '600',
  },
  forecastDischarge: {
    fontSize: 11,
    fontWeight: '600',
  },
  forecastConfidence: {
    fontSize: 10,
  },
  factorCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  factorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  factorImpact: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factorImpactText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  factorDescription: {
    fontSize: 12,
  },
  benchmarkHeader: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  benchmarkHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  benchmarkHeaderSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  benchmarkList: {
    gap: 0,
  },
  benchmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  benchmarkMetric: {
    flex: 1,
  },
  benchmarkName: {
    fontSize: 13,
    fontWeight: '500',
  },
  benchmarkValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  benchmarkComparisons: {
    flexDirection: 'row',
    gap: 12,
  },
  benchmarkItem: {
    alignItems: 'center',
  },
  benchmarkItemValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  benchmarkItemLabel: {
    fontSize: 9,
  },
  percentileBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 12,
  },
  percentileText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalContent: {
    padding: 16,
  },
  dischargeCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  dischargeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dischargeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  dischargeBed: {
    fontSize: 12,
    marginTop: 2,
  },
  readinessBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  readinessText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dischargeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dischargeDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  dischargeConfidence: {
    fontSize: 12,
  },
  barriersList: {
    flexDirection: 'row',
    gap: 8,
  },
  barrierTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  barrierText: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  bottleneckDetail: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  bottleneckDetailTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  bottleneckDetailImpact: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  recommendationsList: {
    gap: 4,
  },
  recommendationsLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  recommendationItem: {
    fontSize: 12,
    lineHeight: 18,
  },
  bottomPadding: {
    height: 100,
  },
});
