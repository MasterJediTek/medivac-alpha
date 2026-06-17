/**
 * Visitor Analytics Dashboard - v9.21
 * Hospital administration dashboard showing check-in statistics,
 * peak hours, department load, visitor trends, and duration metrics.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useRouter } from 'expo-router';
import {
  VisitorAnalyticsService,
  type VisitorAnalytics,
  type HourlyData,
} from '@/lib/services/visitor-analytics.service';

export default function VisitorAnalyticsScreen() {
  const colors = useColors();
  const router = useRouter();
  const serviceRef = useRef<VisitorAnalyticsService | null>(null);
  const [analytics, setAnalytics] = useState<VisitorAnalytics | null>(null);

  useEffect(() => {
    const service = VisitorAnalyticsService.getInstance();
    serviceRef.current = service;
    setAnalytics(service.getAnalytics());
  }, []);

  const handleRefresh = () => {
    const data = serviceRef.current?.refreshAnalytics();
    if (data) setAnalytics(data);
  };

  if (!analytics) return null;

  const barColor = (pct: number) => {
    if (pct >= 80) return '#EF4444';
    if (pct >= 60) return '#F97316';
    if (pct >= 40) return '#F59E0B';
    return '#22C55E';
  };

  return (
    <ScreenContainer className="p-0">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>📊 Visitor Analytics</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
          <Text style={[styles.refreshBtnText, { color: colors.primary }]}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
            <Text style={[styles.kpiValue, { color: colors.primary }]}>{analytics.todayVisits}</Text>
            <Text style={[styles.kpiLabel, { color: colors.muted }]}>Today</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#22C55E12', borderColor: '#22C55E30' }]}>
            <Text style={[styles.kpiValue, { color: '#22C55E' }]}>{analytics.thisWeekVisits}</Text>
            <Text style={[styles.kpiLabel, { color: colors.muted }]}>This Week</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#8B5CF612', borderColor: '#8B5CF630' }]}>
            <Text style={[styles.kpiValue, { color: '#8B5CF6' }]}>{analytics.totalVisits}</Text>
            <Text style={[styles.kpiLabel, { color: colors.muted }]}>Total (30d)</Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{analytics.uniqueVisitors}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Unique Visitors</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{analytics.averageDurationMinutes}m</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Avg Duration</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{analytics.returningVisitorRate}%</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Returning Rate</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{analytics.peakHourLabel}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Peak Hour</Text>
            </View>
          </View>
        </View>

        {/* Hourly Distribution */}
        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hourly Distribution</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>Visitor check-ins by hour (30-day average)</Text>
          <View style={styles.barChart}>
            {analytics.hourlyDistribution.filter(h => h.hour >= 6 && h.hour <= 20).map(h => (
              <View key={h.hour} style={styles.barCol}>
                <View style={styles.barWrap}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${Math.max(h.percentage, 3)}%`,
                        backgroundColor: barColor(h.percentage),
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: colors.muted }]}>{h.hour}</Text>
              </View>
            ))}
          </View>
          <View style={styles.peakNote}>
            <Text style={[styles.peakNoteText, { color: colors.primary }]}>
              📌 Peak: {analytics.peakHourLabel} ({analytics.peakHourCount} visits)
            </Text>
          </View>
        </View>

        {/* Daily Trend */}
        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>7-Day Trend</Text>
          <View style={styles.trendGrid}>
            {analytics.dailyTrend.map(day => {
              const maxVisits = Math.max(...analytics.dailyTrend.map(d => d.visits), 1);
              const pct = Math.round((day.visits / maxVisits) * 100);
              return (
                <View key={day.date} style={styles.trendItem}>
                  <Text style={[styles.trendDay, { color: colors.muted }]}>{day.dayLabel}</Text>
                  <View style={styles.trendBarWrap}>
                    <View style={[styles.trendBar, { width: `${pct}%`, backgroundColor: colors.primary }]} />
                  </View>
                  <Text style={[styles.trendCount, { color: colors.foreground }]}>{day.visits}</Text>
                </View>
              );
            })}
          </View>
          <Text style={[styles.trendNote, { color: colors.muted }]}>
            Busiest: {analytics.busiestDay} ({analytics.busiestDayCount} visits)
          </Text>
        </View>

        {/* Department Load */}
        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Department Load</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>Most visited departments (30 days)</Text>
          {analytics.departmentLoad.slice(0, 8).map((dept, i) => (
            <View key={dept.departmentId} style={styles.deptRow}>
              <View style={styles.deptInfo}>
                <Text style={[styles.deptRank, { color: colors.muted }]}>#{i + 1}</Text>
                <View style={styles.deptNameWrap}>
                  <Text style={[styles.deptName, { color: colors.foreground }]}>{dept.departmentName}</Text>
                  <Text style={[styles.deptMeta, { color: colors.muted }]}>
                    {dept.todayVisits} today • Avg {dept.averageDurationMinutes}m
                  </Text>
                </View>
              </View>
              <View style={styles.deptRight}>
                <View style={[styles.deptBarOuter, { backgroundColor: colors.border + '50' }]}>
                  <View style={[styles.deptBarInner, { width: `${dept.percentage}%`, backgroundColor: colors.primary }]} />
                </View>
                <Text style={[styles.deptCount, { color: colors.foreground }]}>{dept.totalVisits}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Purpose Breakdown */}
        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Visit Purpose</Text>
          {analytics.purposeBreakdown.map(p => {
            const purposeColors: Record<string, string> = {
              'Patient Visit': '#3B82F6',
              'Appointment': '#22C55E',
              'Delivery': '#F59E0B',
              'Other': '#8B5CF6',
            };
            const pColor = purposeColors[p.purpose] || colors.primary;
            return (
              <View key={p.purpose} style={styles.purposeRow}>
                <View style={[styles.purposeDot, { backgroundColor: pColor }]} />
                <Text style={[styles.purposeName, { color: colors.foreground }]}>{p.purpose}</Text>
                <View style={styles.purposeRight}>
                  <Text style={[styles.purposePct, { color: pColor }]}>{p.percentage}%</Text>
                  <Text style={[styles.purposeCount, { color: colors.muted }]}>{p.count}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { paddingRight: 12 },
  backBtnText: { fontSize: 18, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '800', flex: 1 },
  refreshBtn: { padding: 8 },
  refreshBtnText: { fontSize: 22, fontWeight: '700' },

  content: { flex: 1 },
  contentInner: { padding: 12, paddingBottom: 40 },

  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  kpiCard: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  kpiValue: { fontSize: 28, fontWeight: '900' },
  kpiLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },

  statsCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  statItem: { width: '46%', alignItems: 'center', padding: 8 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 2 },

  chartCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  barChart: { flexDirection: 'row', height: 120, alignItems: 'flex-end', gap: 2, marginTop: 12 },
  barCol: { flex: 1, alignItems: 'center' },
  barWrap: { width: '100%', height: 100, justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '80%', borderRadius: 3, minHeight: 3 },
  barLabel: { fontSize: 9, marginTop: 4 },
  peakNote: { marginTop: 10, padding: 8, borderRadius: 8, alignItems: 'center' },
  peakNoteText: { fontSize: 12, fontWeight: '700' },

  trendGrid: { gap: 8, marginTop: 8 },
  trendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trendDay: { width: 30, fontSize: 12, fontWeight: '600' },
  trendBarWrap: { flex: 1, height: 16, borderRadius: 4, overflow: 'hidden', backgroundColor: '#E5E7EB30' },
  trendBar: { height: '100%', borderRadius: 4 },
  trendCount: { width: 30, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  trendNote: { fontSize: 11, marginTop: 8, textAlign: 'center' },

  deptRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB30' },
  deptInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  deptRank: { width: 24, fontSize: 12, fontWeight: '700' },
  deptNameWrap: { flex: 1 },
  deptName: { fontSize: 14, fontWeight: '600' },
  deptMeta: { fontSize: 11, marginTop: 1 },
  deptRight: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 120 },
  deptBarOuter: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  deptBarInner: { height: '100%', borderRadius: 4 },
  deptCount: { width: 36, fontSize: 13, fontWeight: '700', textAlign: 'right' },

  purposeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  purposeDot: { width: 10, height: 10, borderRadius: 5 },
  purposeName: { flex: 1, fontSize: 14, fontWeight: '600' },
  purposeRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  purposePct: { fontSize: 14, fontWeight: '800' },
  purposeCount: { fontSize: 12, width: 36, textAlign: 'right' },
});
