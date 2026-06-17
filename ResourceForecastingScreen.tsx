/**
 * Resource Utilization Forecasting Screen
 * MediVac One v3.3
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import resourceForecastingService, {
  DailyForecast,
  ForecastAlert,
} from '@/src/services/ResourceForecastingService';

const DISCO_COLORS = {
  neonPink: '#FF1493',
  neonCyan: '#00FFFF',
  neonPurple: '#9400D3',
  neonGreen: '#39FF14',
  neonOrange: '#FF6600',
  neonYellow: '#FFFF00',
  darkBg: '#1a1a2e',
  cardBg: '#16213e',
};

const SEVERITY_COLORS = {
  critical: '#FF1744',
  warning: '#FF9100',
  info: '#00B0FF',
};

const RISK_COLORS = {
  low: DISCO_COLORS.neonGreen,
  medium: DISCO_COLORS.neonYellow,
  high: DISCO_COLORS.neonOrange,
  critical: '#FF1744',
};

export default function ResourceForecastingScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'staffing' | 'supplies' | 'capacity'>('overview');
  const [selectedDay, setSelectedDay] = useState(0);

  const weeklyForecast = resourceForecastingService.getWeeklyForecast();
  const stats = resourceForecastingService.getOverallStatistics();
  const accuracy = resourceForecastingService.getForecastAccuracy();
  const criticalAlerts = resourceForecastingService.getCriticalAlerts();

  const currentForecast = weeklyForecast[selectedDay];

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const renderDaySelector = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
      {weeklyForecast.map((forecast, idx) => (
        <TouchableOpacity
          key={idx}
          style={[
            styles.dayButton,
            selectedDay === idx && styles.dayButtonActive,
            { borderColor: RISK_COLORS[forecast.overallRiskLevel] },
          ]}
          onPress={() => setSelectedDay(idx)}
        >
          <Text style={[styles.dayName, selectedDay === idx && styles.dayNameActive]}>
            {forecast.dayOfWeek.slice(0, 3)}
          </Text>
          <Text style={[styles.dayDate, selectedDay === idx && styles.dayDateActive]}>
            {forecast.date.getDate()}
          </Text>
          <View style={[styles.riskDot, { backgroundColor: RISK_COLORS[forecast.overallRiskLevel] }]} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderAlertCard = (alert: ForecastAlert) => (
    <View
      key={alert.id}
      style={[styles.alertCard, { borderLeftColor: SEVERITY_COLORS[alert.severity] }]}
    >
      <View style={styles.alertHeader}>
        <Text style={styles.alertIcon}>
          {alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️'}
        </Text>
        <Text style={styles.alertTitle}>{alert.title}</Text>
      </View>
      <Text style={styles.alertMessage}>{alert.message}</Text>
      <Text style={styles.alertAction}>💡 {alert.recommendedAction}</Text>
    </View>
  );

  const renderOverview = () => {
    if (!currentForecast) return null;

    return (
      <ScrollView style={styles.tabContent}>
        {/* Stats Summary */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.averageAccuracy}%</Text>
            <Text style={styles.statLabel}>Forecast Accuracy</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: DISCO_COLORS.neonPink }]}>
              {stats.criticalAlerts}
            </Text>
            <Text style={styles.statLabel}>Critical Alerts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.forecastDays}</Text>
            <Text style={styles.statLabel}>Days Forecasted</Text>
          </View>
        </View>

        {/* Risk Level */}
        <View style={[styles.riskCard, { borderColor: RISK_COLORS[currentForecast.overallRiskLevel] }]}>
          <Text style={styles.riskLabel}>Overall Risk Level</Text>
          <Text style={[styles.riskValue, { color: RISK_COLORS[currentForecast.overallRiskLevel] }]}>
            {currentForecast.overallRiskLevel.toUpperCase()}
          </Text>
          <Text style={styles.riskDate}>{formatDate(currentForecast.date)}</Text>
        </View>

        {/* Alerts */}
        {currentForecast.alerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚨 Active Alerts</Text>
            {currentForecast.alerts.map(renderAlertCard)}
          </View>
        )}

        {/* Scheduled Procedures */}
        {currentForecast.scheduledProcedures.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏥 Scheduled Procedures</Text>
            {currentForecast.scheduledProcedures.map((proc, idx) => (
              <View key={idx} style={styles.procedureCard}>
                <View style={styles.procedureHeader}>
                  <Text style={styles.procedureName}>{proc.procedureName}</Text>
                  <Text style={styles.procedureTime}>
                    {proc.scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={styles.procedureDetails}>
                  🏠 {proc.orRoom} | 👨‍⚕️ {proc.surgeon} | ⏱️ {proc.estimatedDuration} min
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Accuracy Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Forecast Accuracy</Text>
          {accuracy.map((metric, idx) => (
            <View key={idx} style={styles.accuracyRow}>
              <Text style={styles.accuracyName}>{metric.metricName}</Text>
              <View style={styles.accuracyBar}>
                <View
                  style={[
                    styles.accuracyFill,
                    { width: `${metric.accuracyPercentage}%` },
                  ]}
                />
              </View>
              <Text style={styles.accuracyValue}>{metric.accuracyPercentage}%</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderStaffing = () => {
    if (!currentForecast) return null;

    const shifts = ['day', 'evening', 'night'] as const;

    return (
      <ScrollView style={styles.tabContent}>
        <Text style={styles.sectionTitle}>👥 Staffing Forecast - {formatDate(currentForecast.date)}</Text>

        {shifts.map((shift) => {
          const shiftStaff = currentForecast.staffingRequirements.filter(s => s.shiftType === shift);
          const hasShortage = shiftStaff.some(s => s.isCritical);

          return (
            <View key={shift} style={styles.shiftSection}>
              <View style={[styles.shiftHeader, hasShortage && styles.shiftHeaderCritical]}>
                <Text style={styles.shiftTitle}>
                  {shift === 'day' ? '☀️' : shift === 'evening' ? '🌅' : '🌙'} {shift.toUpperCase()} SHIFT
                </Text>
                {hasShortage && <Text style={styles.shortageWarning}>⚠️ SHORTAGE</Text>}
              </View>

              {shiftStaff.map((staff, idx) => (
                <View key={idx} style={styles.staffRow}>
                  <Text style={styles.staffRole}>{staff.role.replace(/_/g, ' ')}</Text>
                  <View style={styles.staffNumbers}>
                    <Text style={styles.staffScheduled}>{staff.scheduledCount}</Text>
                    <Text style={styles.staffDivider}>/</Text>
                    <Text style={styles.staffRequired}>{staff.requiredCount}</Text>
                  </View>
                  <Text
                    style={[
                      styles.staffVariance,
                      staff.variance >= 0 ? styles.variancePositive : styles.varianceNegative,
                    ]}
                  >
                    {staff.variance >= 0 ? '+' : ''}{staff.variance}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderSupplies = () => {
    if (!currentForecast) return null;

    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const sortedSupplies = [...currentForecast.supplyForecasts].sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    return (
      <ScrollView style={styles.tabContent}>
        <Text style={styles.sectionTitle}>📦 Supply Forecast - {formatDate(currentForecast.date)}</Text>

        {sortedSupplies.map((supply, idx) => (
          <View key={idx} style={styles.supplyCard}>
            <View style={styles.supplyHeader}>
              <Text style={styles.supplyName}>{supply.supplyName}</Text>
              <View
                style={[
                  styles.priorityBadge,
                  {
                    backgroundColor:
                      supply.priority === 'critical'
                        ? '#FF1744'
                        : supply.priority === 'high'
                        ? '#FF9100'
                        : supply.priority === 'medium'
                        ? '#FFEA00'
                        : DISCO_COLORS.neonGreen,
                  },
                ]}
              >
                <Text style={styles.priorityText}>{supply.priority.toUpperCase()}</Text>
              </View>
            </View>

            <Text style={styles.supplyCategory}>{supply.category}</Text>

            <View style={styles.supplyStats}>
              <View style={styles.supplyStat}>
                <Text style={styles.supplyStatValue}>{supply.currentStock}</Text>
                <Text style={styles.supplyStatLabel}>In Stock</Text>
              </View>
              <View style={styles.supplyStat}>
                <Text style={styles.supplyStatValue}>{supply.forecastedUsage}/day</Text>
                <Text style={styles.supplyStatLabel}>Usage</Text>
              </View>
              <View style={styles.supplyStat}>
                <Text
                  style={[
                    styles.supplyStatValue,
                    supply.daysUntilReorder <= 5 && { color: '#FF1744' },
                  ]}
                >
                  {supply.daysUntilReorder}
                </Text>
                <Text style={styles.supplyStatLabel}>Days Left</Text>
              </View>
            </View>

            {supply.priority !== 'low' && (
              <View style={styles.reorderInfo}>
                <Text style={styles.reorderText}>
                  💡 Order {supply.suggestedOrderQuantity} units (${supply.totalCost.toFixed(2)})
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderCapacity = () => {
    if (!currentForecast) return null;

    return (
      <ScrollView style={styles.tabContent}>
        <Text style={styles.sectionTitle}>🛏️ Bed Capacity Forecast - {formatDate(currentForecast.date)}</Text>

        {currentForecast.bedForecasts.map((bed, idx) => (
          <View key={idx} style={styles.bedCard}>
            <View style={styles.bedHeader}>
              <Text style={styles.bedName}>{bed.unitName}</Text>
              <Text
                style={[
                  styles.occupancyRate,
                  bed.occupancyRate > 90
                    ? { color: '#FF1744' }
                    : bed.occupancyRate > 80
                    ? { color: '#FF9100' }
                    : { color: DISCO_COLORS.neonGreen },
                ]}
              >
                {bed.occupancyRate}%
              </Text>
            </View>

            <View style={styles.occupancyBar}>
              <View
                style={[
                  styles.occupancyFill,
                  {
                    width: `${bed.occupancyRate}%`,
                    backgroundColor:
                      bed.occupancyRate > 90
                        ? '#FF1744'
                        : bed.occupancyRate > 80
                        ? '#FF9100'
                        : DISCO_COLORS.neonGreen,
                  },
                ]}
              />
            </View>

            <View style={styles.bedStats}>
              <View style={styles.bedStat}>
                <Text style={styles.bedStatValue}>{bed.currentOccupancy}/{bed.totalBeds}</Text>
                <Text style={styles.bedStatLabel}>Current</Text>
              </View>
              <View style={styles.bedStat}>
                <Text style={[styles.bedStatValue, { color: DISCO_COLORS.neonGreen }]}>
                  +{bed.forecastedAdmissions}
                </Text>
                <Text style={styles.bedStatLabel}>Admits</Text>
              </View>
              <View style={styles.bedStat}>
                <Text style={[styles.bedStatValue, { color: DISCO_COLORS.neonCyan }]}>
                  -{bed.forecastedDischarges}
                </Text>
                <Text style={styles.bedStatLabel}>D/C</Text>
              </View>
              <View style={styles.bedStat}>
                <Text style={styles.bedStatValue}>{bed.projectedOccupancy}</Text>
                <Text style={styles.bedStatLabel}>Projected</Text>
              </View>
            </View>

            {bed.recommendations.length > 0 && (
              <View style={styles.recommendationsBox}>
                {bed.recommendations.map((rec, i) => (
                  <Text key={i} style={styles.recommendationText}>💡 {rec}</Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📈 Resource Forecasting</Text>
          <Text style={styles.subtitle}>Predictive Analytics Dashboard</Text>
        </View>

        {/* Day Selector */}
        {renderDaySelector()}

        {/* Tabs */}
        <View style={styles.tabBar}>
          {(['overview', 'staffing', 'supplies', 'capacity'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'overview' ? '📊' : tab === 'staffing' ? '👥' : tab === 'supplies' ? '📦' : '🛏️'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'staffing' && renderStaffing()}
        {activeTab === 'supplies' && renderSupplies()}
        {activeTab === 'capacity' && renderCapacity()}
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
  daySelector: {
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  dayButton: {
    width: 60,
    height: 80,
    backgroundColor: DISCO_COLORS.cardBg,
    borderRadius: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: DISCO_COLORS.cardBg,
  },
  dayButtonActive: {
    backgroundColor: DISCO_COLORS.neonPurple + '40',
  },
  dayName: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  dayNameActive: {
    color: '#fff',
  },
  dayDate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 4,
  },
  dayDateActive: {
    color: DISCO_COLORS.neonCyan,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
    fontSize: 20,
  },
  tabTextActive: {
    transform: [{ scale: 1.2 }],
  },
  tabContent: {
    flex: 1,
    padding: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: DISCO_COLORS.cardBg,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DISCO_COLORS.neonCyan + '40',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DISCO_COLORS.neonCyan,
  },
  statLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
  riskCard: {
    backgroundColor: DISCO_COLORS.cardBg,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
  },
  riskLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  riskValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  riskDate: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  alertCard: {
    backgroundColor: DISCO_COLORS.cardBg,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  alertIcon: {
    fontSize: 16,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  alertMessage: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 8,
  },
  alertAction: {
    fontSize: 12,
    color: DISCO_COLORS.neonGreen,
  },
  procedureCard: {
    backgroundColor: DISCO_COLORS.cardBg,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  procedureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  procedureName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  procedureTime: {
    fontSize: 14,
    color: DISCO_COLORS.neonCyan,
    fontWeight: '600',
  },
  procedureDetails: {
    fontSize: 12,
    color: '#888',
  },
  accuracyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  accuracyName: {
    flex: 1,
    fontSize: 13,
    color: '#aaa',
  },
  accuracyBar: {
    flex: 1,
    height: 8,
    backgroundColor: DISCO_COLORS.cardBg,
    borderRadius: 4,
    marginHorizontal: 10,
  },
  accuracyFill: {
    height: '100%',
    backgroundColor: DISCO_COLORS.neonGreen,
    borderRadius: 4,
  },
  accuracyValue: {
    width: 50,
    fontSize: 13,
    color: DISCO_COLORS.neonGreen,
    textAlign: 'right',
  },
  shiftSection: {
    marginBottom: 20,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: DISCO_COLORS.cardBg,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  shiftHeaderCritical: {
    borderWidth: 1,
    borderColor: '#FF1744',
  },
  shiftTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  shortageWarning: {
    fontSize: 12,
    color: '#FF1744',
    fontWeight: 'bold',
  },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DISCO_COLORS.cardBg,
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  staffRole: {
    flex: 1,
    fontSize: 13,
    color: '#fff',
    textTransform: 'capitalize',
  },
  staffNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffScheduled: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DISCO_COLORS.neonCyan,
  },
  staffDivider: {
    fontSize: 14,
    color: '#888',
    marginHorizontal: 4,
  },
  staffRequired: {
    fontSize: 14,
    color: '#888',
  },
  staffVariance: {
    width: 40,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  variancePositive: {
    color: DISCO_COLORS.neonGreen,
  },
  varianceNegative: {
    color: '#FF1744',
  },
  supplyCard: {
    backgroundColor: DISCO_COLORS.cardBg,
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  supplyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  supplyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  supplyCategory: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  supplyStats: {
    flexDirection: 'row',
    gap: 10,
  },
  supplyStat: {
    flex: 1,
    backgroundColor: DISCO_COLORS.darkBg,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  supplyStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  supplyStatLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
  },
  reorderInfo: {
    marginTop: 12,
    padding: 10,
    backgroundColor: DISCO_COLORS.neonGreen + '20',
    borderRadius: 8,
  },
  reorderText: {
    fontSize: 12,
    color: DISCO_COLORS.neonGreen,
  },
  bedCard: {
    backgroundColor: DISCO_COLORS.cardBg,
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  bedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bedName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  occupancyRate: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  occupancyBar: {
    height: 10,
    backgroundColor: DISCO_COLORS.darkBg,
    borderRadius: 5,
    marginBottom: 12,
    overflow: 'hidden',
  },
  occupancyFill: {
    height: '100%',
    borderRadius: 5,
  },
  bedStats: {
    flexDirection: 'row',
    gap: 10,
  },
  bedStat: {
    flex: 1,
    alignItems: 'center',
  },
  bedStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  bedStatLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
  },
  recommendationsBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: DISCO_COLORS.neonOrange + '20',
    borderRadius: 8,
  },
  recommendationText: {
    fontSize: 12,
    color: DISCO_COLORS.neonOrange,
    marginBottom: 4,
  },
});
