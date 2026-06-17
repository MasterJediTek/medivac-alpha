/**
 * MediVac One - Audit Dashboard Screen
 * Visual interface for audit events, compliance, and risk indicators
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  FlatList,
  StyleSheet,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';

// ==========================================
// Types
// ==========================================

interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: string;
  severity: 'info' | 'warning' | 'critical';
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  description: string;
  patientId?: string;
  patientName?: string;
  resourceType?: string;
  outcome: 'success' | 'failure';
  riskScore: number;
  ipAddress?: string;
}

interface ComplianceViolation {
  id: string;
  timestamp: string;
  standard: string;
  requirement: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved';
  userId?: string;
  userName?: string;
}

interface RiskIndicator {
  id: string;
  type: string;
  label: string;
  currentValue: number;
  threshold: number;
  trend: 'up' | 'down' | 'stable';
  status: 'normal' | 'warning' | 'critical';
}

interface DashboardStats {
  totalEvents: number;
  eventsToday: number;
  highRiskEvents: number;
  openViolations: number;
  uniqueUsers: number;
  failureRate: number;
}

// ==========================================
// Mock Data
// ==========================================

const generateMockEvents = (): AuditEvent[] => {
  const eventTypes = ['login', 'patient_view', 'record_update', 'medication_prescribe', 'export_data', 'ai_interaction'];
  const users = [
    { id: 'u1', name: 'Dr. Sarah Johnson', role: 'physician' },
    { id: 'u2', name: 'Nurse Mike Chen', role: 'nurse' },
    { id: 'u3', name: 'Admin Lisa Park', role: 'admin' },
    { id: 'u4', name: 'Dr. James Wilson', role: 'physician' },
  ];
  const patients = [
    { id: 'p1', name: 'John Smith' },
    { id: 'p2', name: 'Mary Johnson' },
    { id: 'p3', name: 'Robert Brown' },
  ];

  const events: AuditEvent[] = [];
  const now = Date.now();

  for (let i = 0; i < 50; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const patient = Math.random() > 0.3 ? patients[Math.floor(Math.random() * patients.length)] : undefined;
    const isFailure = Math.random() > 0.95;
    const riskScore = Math.floor(Math.random() * 10) + 1;

    events.push({
      id: `event_${i}`,
      timestamp: new Date(now - i * 15 * 60 * 1000).toISOString(),
      eventType,
      severity: riskScore > 7 ? 'critical' : riskScore > 4 ? 'warning' : 'info',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: eventType.replace('_', ' ').toUpperCase(),
      description: `${user.name} performed ${eventType.replace('_', ' ')}${patient ? ` for ${patient.name}` : ''}`,
      patientId: patient?.id,
      patientName: patient?.name,
      resourceType: eventType === 'patient_view' ? 'patient_record' : eventType,
      outcome: isFailure ? 'failure' : 'success',
      riskScore,
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
    });
  }

  return events;
};

const generateMockViolations = (): ComplianceViolation[] => {
  return [
    {
      id: 'v1',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      standard: 'Australian Privacy Act',
      requirement: 'Minimum necessary access',
      description: 'User accessed patient records outside of care relationship',
      severity: 'high',
      status: 'open',
      userId: 'u3',
      userName: 'Admin Lisa Park',
    },
    {
      id: 'v2',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      standard: 'ISO 27001',
      requirement: 'Access control logging',
      description: 'Multiple failed login attempts detected',
      severity: 'medium',
      status: 'investigating',
      userId: 'u1',
      userName: 'Dr. Sarah Johnson',
    },
    {
      id: 'v3',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      standard: 'HIPAA',
      requirement: 'Data export controls',
      description: 'Large data export without authorization',
      severity: 'critical',
      status: 'resolved',
    },
  ];
};

const generateRiskIndicators = (): RiskIndicator[] => {
  return [
    { id: 'r1', type: 'failed_logins', label: 'Failed Logins', currentValue: 8, threshold: 10, trend: 'up', status: 'warning' },
    { id: 'r2', type: 'data_exports', label: 'Data Exports', currentValue: 15, threshold: 20, trend: 'stable', status: 'normal' },
    { id: 'r3', type: 'after_hours', label: 'After Hours Access', currentValue: 24, threshold: 15, trend: 'up', status: 'critical' },
    { id: 'r4', type: 'break_glass', label: 'Break Glass Events', currentValue: 2, threshold: 5, trend: 'down', status: 'normal' },
    { id: 'r5', type: 'high_risk', label: 'High Risk Actions', currentValue: 12, threshold: 10, trend: 'up', status: 'warning' },
    { id: 'r6', type: 'patient_access', label: 'Unusual Patient Access', currentValue: 5, threshold: 10, trend: 'stable', status: 'normal' },
  ];
};

// ==========================================
// Main Component
// ==========================================

export default function AuditDashboardScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'violations' | 'risks'>('overview');
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [riskIndicators, setRiskIndicators] = useState<RiskIndicator[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    eventsToday: 0,
    highRiskEvents: 0,
    openViolations: 0,
    uniqueUsers: 0,
    failureRate: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);

  const loadData = useCallback(() => {
    const mockEvents = generateMockEvents();
    const mockViolations = generateMockViolations();
    const mockRisks = generateRiskIndicators();

    setEvents(mockEvents);
    setViolations(mockViolations);
    setRiskIndicators(mockRisks);

    const today = new Date().toISOString().split('T')[0];
    const todayEvents = mockEvents.filter(e => e.timestamp.startsWith(today));
    const highRisk = mockEvents.filter(e => e.riskScore > 7);
    const failures = mockEvents.filter(e => e.outcome === 'failure');
    const uniqueUserIds = new Set(mockEvents.map(e => e.userId));

    setStats({
      totalEvents: mockEvents.length,
      eventsToday: todayEvents.length,
      highRiskEvents: highRisk.length,
      openViolations: mockViolations.filter(v => v.status !== 'resolved').length,
      uniqueUsers: uniqueUserIds.size,
      failureRate: mockEvents.length > 0 ? Math.round(failures.length / mockEvents.length * 100 * 10) / 10 : 0,
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    loadData();
    setRefreshing(false);
  }, [loadData]);

  const filteredEvents = events.filter(event => {
    const matchesSearch = searchQuery === '' || 
      event.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.patientName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = !selectedSeverity || event.severity === selectedSeverity;
    return matchesSearch && matchesSeverity;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#EF4444';
      case 'high': return '#F97316';
      case 'warning': return '#F59E0B';
      case 'medium': return '#F59E0B';
      case 'low': return '#22C55E';
      case 'info': return '#3B82F6';
      default: return colors.muted;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#EF4444';
      case 'investigating': return '#F59E0B';
      case 'resolved': return '#22C55E';
      case 'normal': return '#22C55E';
      case 'warning': return '#F59E0B';
      case 'critical': return '#EF4444';
      default: return colors.muted;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // ==========================================
  // Render Functions
  // ==========================================

  const renderOverview = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{stats.totalEvents}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Total Events</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.eventsToday}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Today</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.highRiskEvents}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>High Risk</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.openViolations}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Violations</Text>
        </View>
      </View>

      {/* Risk Indicators */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Risk Indicators</Text>
        {riskIndicators.map(indicator => (
          <View key={indicator.id} style={styles.riskRow}>
            <View style={styles.riskInfo}>
              <Text style={[styles.riskLabel, { color: colors.foreground }]}>{indicator.label}</Text>
              <View style={styles.riskValues}>
                <Text style={[styles.riskValue, { color: getStatusColor(indicator.status) }]}>
                  {indicator.currentValue}
                </Text>
                <Text style={[styles.riskThreshold, { color: colors.muted }]}>
                  / {indicator.threshold}
                </Text>
                <View style={[styles.trendBadge, { backgroundColor: indicator.trend === 'up' ? '#FEE2E2' : indicator.trend === 'down' ? '#DCFCE7' : '#F3F4F6' }]}>
                  <Text style={{ color: indicator.trend === 'up' ? '#EF4444' : indicator.trend === 'down' ? '#22C55E' : '#6B7280', fontSize: 10 }}>
                    {indicator.trend === 'up' ? '↑' : indicator.trend === 'down' ? '↓' : '→'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.riskBarContainer}>
              <View 
                style={[
                  styles.riskBar, 
                  { 
                    width: `${Math.min(indicator.currentValue / indicator.threshold * 100, 100)}%`,
                    backgroundColor: getStatusColor(indicator.status),
                  }
                ]} 
              />
            </View>
          </View>
        ))}
      </View>

      {/* Recent Violations */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Violations</Text>
        {violations.slice(0, 3).map(violation => (
          <View key={violation.id} style={[styles.violationCard, { borderLeftColor: getSeverityColor(violation.severity) }]}>
            <View style={styles.violationHeader}>
              <Text style={[styles.violationStandard, { color: colors.foreground }]}>{violation.standard}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(violation.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(violation.status) }]}>{violation.status}</Text>
              </View>
            </View>
            <Text style={[styles.violationDesc, { color: colors.muted }]}>{violation.description}</Text>
            <Text style={[styles.violationTime, { color: colors.muted }]}>{formatTime(violation.timestamp)}</Text>
          </View>
        ))}
      </View>

      {/* Recent Events */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Events</Text>
        {events.slice(0, 5).map(event => (
          <View key={event.id} style={styles.eventRow}>
            <View style={[styles.severityDot, { backgroundColor: getSeverityColor(event.severity) }]} />
            <View style={styles.eventInfo}>
              <Text style={[styles.eventAction, { color: colors.foreground }]}>{event.action}</Text>
              <Text style={[styles.eventUser, { color: colors.muted }]}>{event.userName}</Text>
            </View>
            <Text style={[styles.eventTime, { color: colors.muted }]}>{formatTime(event.timestamp)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderEvents = () => (
    <View style={styles.eventsContainer}>
      {/* Search and Filter */}
      <View style={styles.filterRow}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface }]}>
          <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search events..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Severity Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {['all', 'critical', 'warning', 'info'].map(severity => (
          <TouchableOpacity
            key={severity}
            style={[
              styles.filterChip,
              { 
                backgroundColor: (selectedSeverity === severity || (severity === 'all' && !selectedSeverity)) 
                  ? colors.primary 
                  : colors.surface 
              }
            ]}
            onPress={() => setSelectedSeverity(severity === 'all' ? null : severity)}
          >
            <Text style={{ 
              color: (selectedSeverity === severity || (severity === 'all' && !selectedSeverity)) 
                ? '#FFFFFF' 
                : colors.foreground,
              fontSize: 12,
              fontWeight: '500',
            }}>
              {severity.charAt(0).toUpperCase() + severity.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Events List */}
      <FlatList
        data={filteredEvents}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.eventCard, { backgroundColor: colors.surface }]}>
            <View style={styles.eventCardHeader}>
              <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) + '20' }]}>
                <Text style={[styles.severityText, { color: getSeverityColor(item.severity) }]}>
                  {item.severity.toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.eventCardTime, { color: colors.muted }]}>{formatTime(item.timestamp)}</Text>
            </View>
            <Text style={[styles.eventCardAction, { color: colors.foreground }]}>{item.action}</Text>
            <Text style={[styles.eventCardDesc, { color: colors.muted }]}>{item.description}</Text>
            <View style={styles.eventCardFooter}>
              <Text style={[styles.eventCardUser, { color: colors.primary }]}>{item.userName}</Text>
              {item.outcome === 'failure' && (
                <View style={[styles.failureBadge, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={{ color: '#EF4444', fontSize: 10 }}>FAILED</Text>
                </View>
              )}
              <Text style={[styles.riskScoreText, { color: colors.muted }]}>Risk: {item.riskScore}/10</Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.eventsList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const renderViolations = () => (
    <FlatList
      data={violations}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={[styles.violationFullCard, { backgroundColor: colors.surface, borderLeftColor: getSeverityColor(item.severity) }]}>
          <View style={styles.violationFullHeader}>
            <View>
              <Text style={[styles.violationFullStandard, { color: colors.foreground }]}>{item.standard}</Text>
              <Text style={[styles.violationFullReq, { color: colors.muted }]}>{item.requirement}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
            </View>
          </View>
          <Text style={[styles.violationFullDesc, { color: colors.foreground }]}>{item.description}</Text>
          <View style={styles.violationFullFooter}>
            {item.userName && (
              <Text style={[styles.violationFullUser, { color: colors.primary }]}>{item.userName}</Text>
            )}
            <Text style={[styles.violationFullTime, { color: colors.muted }]}>{formatTime(item.timestamp)}</Text>
          </View>
          <View style={styles.violationActions}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.actionButtonText}>Investigate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#22C55E' }]}>
              <Text style={styles.actionButtonText}>Resolve</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      contentContainerStyle={styles.violationsList}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
  );

  const renderRisks = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {riskIndicators.map(indicator => (
        <View key={indicator.id} style={[styles.riskFullCard, { backgroundColor: colors.surface }]}>
          <View style={styles.riskFullHeader}>
            <Text style={[styles.riskFullLabel, { color: colors.foreground }]}>{indicator.label}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(indicator.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(indicator.status) }]}>{indicator.status}</Text>
            </View>
          </View>
          <View style={styles.riskFullValues}>
            <Text style={[styles.riskFullCurrent, { color: getStatusColor(indicator.status) }]}>
              {indicator.currentValue}
            </Text>
            <Text style={[styles.riskFullThreshold, { color: colors.muted }]}>
              Threshold: {indicator.threshold}
            </Text>
          </View>
          <View style={styles.riskFullBarContainer}>
            <View 
              style={[
                styles.riskFullBar, 
                { 
                  width: `${Math.min(indicator.currentValue / indicator.threshold * 100, 100)}%`,
                  backgroundColor: getStatusColor(indicator.status),
                }
              ]} 
            />
          </View>
          <View style={styles.riskFullTrend}>
            <Text style={[styles.riskFullTrendLabel, { color: colors.muted }]}>Trend:</Text>
            <Text style={{ 
              color: indicator.trend === 'up' ? '#EF4444' : indicator.trend === 'down' ? '#22C55E' : colors.muted,
              fontWeight: '600',
            }}>
              {indicator.trend === 'up' ? '↑ Increasing' : indicator.trend === 'down' ? '↓ Decreasing' : '→ Stable'}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Audit Dashboard</Text>
        <View style={styles.headerStats}>
          <View style={[styles.headerStatBadge, { backgroundColor: '#FEE2E2' }]}>
            <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>{stats.openViolations} Open</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.surface }]}>
        {(['overview', 'events', 'violations', 'risks'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.muted }]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'events' && renderEvents()}
        {activeTab === 'violations' && renderViolations()}
        {activeTab === 'risks' && renderRisks()}
      </View>
    </ScreenContainer>
  );
}

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerStats: {
    flexDirection: 'row',
    gap: 8,
  },
  headerStatBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  riskRow: {
    marginBottom: 12,
  },
  riskInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  riskLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  riskValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  riskValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  riskThreshold: {
    fontSize: 14,
  },
  trendBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  riskBarContainer: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  riskBar: {
    height: '100%',
    borderRadius: 3,
  },
  violationCard: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    marginBottom: 12,
  },
  violationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  violationStandard: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  violationDesc: {
    fontSize: 12,
    marginTop: 4,
  },
  violationTime: {
    fontSize: 10,
    marginTop: 4,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventAction: {
    fontSize: 14,
    fontWeight: '500',
  },
  eventUser: {
    fontSize: 12,
  },
  eventTime: {
    fontSize: 12,
  },
  eventsContainer: {
    flex: 1,
  },
  filterRow: {
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filterScroll: {
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  eventsList: {
    paddingBottom: 20,
  },
  eventCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  eventCardTime: {
    fontSize: 12,
  },
  eventCardAction: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventCardDesc: {
    fontSize: 13,
    marginBottom: 8,
  },
  eventCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventCardUser: {
    fontSize: 12,
    fontWeight: '500',
  },
  failureBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  riskScoreText: {
    fontSize: 11,
    marginLeft: 'auto',
  },
  violationsList: {
    paddingBottom: 20,
  },
  violationFullCard: {
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 12,
  },
  violationFullHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  violationFullStandard: {
    fontSize: 16,
    fontWeight: '600',
  },
  violationFullReq: {
    fontSize: 12,
    marginTop: 2,
  },
  violationFullDesc: {
    fontSize: 14,
    marginBottom: 12,
  },
  violationFullFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  violationFullUser: {
    fontSize: 13,
    fontWeight: '500',
  },
  violationFullTime: {
    fontSize: 12,
  },
  violationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  riskFullCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  riskFullHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskFullLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  riskFullValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12,
  },
  riskFullCurrent: {
    fontSize: 36,
    fontWeight: '700',
  },
  riskFullThreshold: {
    fontSize: 14,
  },
  riskFullBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  riskFullBar: {
    height: '100%',
    borderRadius: 4,
  },
  riskFullTrend: {
    flexDirection: 'row',
    gap: 8,
  },
  riskFullTrendLabel: {
    fontSize: 14,
  },
});
