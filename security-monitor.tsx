/**
 * Real-Time Security Monitoring Dashboard
 * Live monitoring with alert notifications - MediVac One v5.2
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Animated,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';

// Types
type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'escalated';
type ThreatType = 'intrusion' | 'malware' | 'unauthorized_access' | 'data_breach' | 'ddos' | 'anomaly' | 'policy_violation' | 'authentication_failure';

interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  threatType: ThreatType;
  source: string;
  timestamp: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  escalatedTo?: string;
}

interface SecurityMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
}

interface ThreatEvent {
  id: string;
  type: ThreatType;
  description: string;
  sourceIp: string;
  targetSystem: string;
  timestamp: string;
  blocked: boolean;
}

// Mock data generators
const generateMockAlerts = (): SecurityAlert[] => [
  {
    id: 'alert_1',
    title: 'Multiple Failed Login Attempts',
    description: '15 failed login attempts from IP 192.168.1.105 in the last 5 minutes',
    severity: 'high',
    status: 'active',
    threatType: 'authentication_failure',
    source: 'Authentication Service',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert_2',
    title: 'Unusual Data Access Pattern',
    description: 'User accessed 50+ patient records in 10 minutes',
    severity: 'medium',
    status: 'active',
    threatType: 'anomaly',
    source: 'Data Access Monitor',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert_3',
    title: 'Policy Violation Detected',
    description: 'Access attempt outside authorized hours',
    severity: 'low',
    status: 'acknowledged',
    threatType: 'policy_violation',
    source: 'Policy Engine',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    acknowledgedBy: 'Security Admin',
  },
  {
    id: 'alert_4',
    title: 'Potential DDoS Attack',
    description: 'Abnormal traffic spike detected from multiple sources',
    severity: 'critical',
    status: 'escalated',
    threatType: 'ddos',
    source: 'Network Monitor',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    escalatedTo: 'CISO',
  },
  {
    id: 'alert_5',
    title: 'Unauthorized API Access',
    description: 'Invalid API key used for patient data endpoint',
    severity: 'high',
    status: 'resolved',
    threatType: 'unauthorized_access',
    source: 'API Gateway',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
];

const generateMockMetrics = (): SecurityMetric[] => [
  { id: 'm1', name: 'Security Score', value: 87, unit: '%', trend: 'up', status: 'good' },
  { id: 'm2', name: 'Active Threats', value: 2, unit: '', trend: 'down', status: 'warning' },
  { id: 'm3', name: 'Blocked Attacks', value: 156, unit: 'today', trend: 'up', status: 'good' },
  { id: 'm4', name: 'Failed Logins', value: 23, unit: '/hr', trend: 'stable', status: 'warning' },
  { id: 'm5', name: 'Active Sessions', value: 342, unit: '', trend: 'up', status: 'good' },
  { id: 'm6', name: 'Avg Response', value: 1.2, unit: 'sec', trend: 'down', status: 'good' },
];

const generateMockEvents = (): ThreatEvent[] => {
  const types: ThreatType[] = ['intrusion', 'malware', 'unauthorized_access', 'authentication_failure', 'anomaly'];
  return Array.from({ length: 20 }, (_, i) => ({
    id: `event_${i}`,
    type: types[Math.floor(Math.random() * types.length)],
    description: `Security event ${i + 1}`,
    sourceIp: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    targetSystem: ['API Gateway', 'Auth Service', 'Database', 'File Storage'][Math.floor(Math.random() * 4)],
    timestamp: new Date(Date.now() - i * 3 * 60 * 1000).toISOString(),
    blocked: Math.random() > 0.2,
  }));
};

export default function SecurityMonitorScreen() {
  const colors = useColors();
  const [alerts, setAlerts] = useState<SecurityAlert[]>(generateMockAlerts());
  const [metrics, setMetrics] = useState<SecurityMetric[]>(generateMockMetrics());
  const [events, setEvents] = useState<ThreatEvent[]>(generateMockEvents());
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | AlertSeverity>('all');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for active monitoring
  useEffect(() => {
    if (isMonitoring) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isMonitoring, pulseAnim]);

  // Simulate real-time updates
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      // Update metrics with slight variations
      setMetrics(prev => prev.map(m => ({
        ...m,
        value: m.id === 'm1' ? m.value : Math.max(0, m.value + (Math.random() - 0.5) * 5),
      })));

      // Occasionally add new events
      if (Math.random() > 0.7) {
        const types: ThreatType[] = ['intrusion', 'authentication_failure', 'anomaly'];
        const newEvent: ThreatEvent = {
          id: `event_${Date.now()}`,
          type: types[Math.floor(Math.random() * types.length)],
          description: 'New security event detected',
          sourceIp: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          targetSystem: ['API Gateway', 'Auth Service', 'Database'][Math.floor(Math.random() * 3)],
          timestamp: new Date().toISOString(),
          blocked: Math.random() > 0.3,
        };
        setEvents(prev => [newEvent, ...prev.slice(0, 19)]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const getSeverityColor = (severity: AlertSeverity): string => {
    switch (severity) {
      case 'critical': return colors.error;
      case 'high': return '#FF6B6B';
      case 'medium': return colors.warning;
      case 'low': return '#4ECDC4';
      case 'info': return colors.primary;
    }
  };

  const getStatusColor = (status: AlertStatus): string => {
    switch (status) {
      case 'active': return colors.error;
      case 'acknowledged': return colors.warning;
      case 'resolved': return colors.success;
      case 'escalated': return '#9B59B6';
    }
  };

  const handleAcknowledge = (alertId: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === alertId
        ? { ...a, status: 'acknowledged' as AlertStatus, acknowledgedAt: new Date().toISOString(), acknowledgedBy: 'Current User' }
        : a
    ));
  };

  const handleResolve = (alertId: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === alertId
        ? { ...a, status: 'resolved' as AlertStatus, resolvedAt: new Date().toISOString() }
        : a
    ));
  };

  const filteredAlerts = selectedFilter === 'all'
    ? alerts
    : alerts.filter(a => a.severity === selectedFilter);

  const activeAlertCount = alerts.filter(a => a.status === 'active').length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length;

  const renderMetricCard = (metric: SecurityMetric) => (
    <View
      key={metric.id}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        minWidth: 140,
        borderLeftWidth: 4,
        borderLeftColor: metric.status === 'good' ? colors.success : metric.status === 'warning' ? colors.warning : colors.error,
      }}
    >
      <Text style={{ fontSize: 12, color: colors.muted }}>{metric.name}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.foreground }}>
          {typeof metric.value === 'number' ? metric.value.toFixed(metric.unit === '%' ? 0 : 1) : metric.value}
        </Text>
        <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 4 }}>{metric.unit}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
        <IconSymbol
          name={metric.trend === 'up' ? 'arrow.up' : metric.trend === 'down' ? 'arrow.down' : 'minus'}
          size={12}
          color={metric.trend === 'up' ? colors.success : metric.trend === 'down' ? colors.error : colors.muted}
        />
        <Text style={{ fontSize: 10, color: colors.muted, marginLeft: 4 }}>{metric.trend}</Text>
      </View>
    </View>
  );

  const renderAlertItem = ({ item }: { item: SecurityAlert }) => (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: getSeverityColor(item.severity),
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ backgroundColor: getSeverityColor(item.severity) + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: getSeverityColor(item.severity), textTransform: 'uppercase' }}>
                {item.severity}
              </Text>
            </View>
            <View style={{ backgroundColor: getStatusColor(item.status) + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: getStatusColor(item.status), textTransform: 'uppercase' }}>
                {item.status}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginTop: 8 }}>
            {item.title}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
            {item.description}
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 8, gap: 16 }}>
            <Text style={{ fontSize: 11, color: colors.muted }}>
              Source: {item.source}
            </Text>
            <Text style={{ fontSize: 11, color: colors.muted }}>
              {new Date(item.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        </View>
      </View>

      {item.status === 'active' && (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: colors.warning, padding: 10, borderRadius: 8, alignItems: 'center' }}
            onPress={() => handleAcknowledge(item.id)}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Acknowledge</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: colors.success, padding: 10, borderRadius: 8, alignItems: 'center' }}
            onPress={() => handleResolve(item.id)}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Resolve</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'acknowledged' && (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: colors.success, padding: 10, borderRadius: 8, alignItems: 'center' }}
            onPress={() => handleResolve(item.id)}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Mark Resolved</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderEventItem = ({ item }: { item: ThreatEvent }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: item.blocked ? colors.success : colors.error,
        marginRight: 12,
      }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: colors.foreground }}>{item.type.replace('_', ' ')}</Text>
        <Text style={{ fontSize: 10, color: colors.muted }}>{item.sourceIp} → {item.targetSystem}</Text>
      </View>
      <Text style={{ fontSize: 10, color: colors.muted }}>
        {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <ScreenContainer>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 16 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <View>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.foreground }}>
                Security Monitor
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
                Real-time threat detection and response
              </Text>
            </View>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isMonitoring ? colors.success + '20' : colors.error + '20',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 20,
              }}
              onPress={() => setIsMonitoring(!isMonitoring)}
            >
              <Animated.View style={{ transform: [{ scale: isMonitoring ? pulseAnim : 1 }] }}>
                <View style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: isMonitoring ? colors.success : colors.error,
                  marginRight: 8,
                }} />
              </Animated.View>
              <Text style={{ color: isMonitoring ? colors.success : colors.error, fontWeight: '600' }}>
                {isMonitoring ? 'Monitoring' : 'Paused'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Alert Summary */}
          {(activeAlertCount > 0 || criticalCount > 0) && (
            <View style={{
              backgroundColor: criticalCount > 0 ? colors.error + '20' : colors.warning + '20',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <IconSymbol name="exclamationmark.triangle.fill" size={24} color={criticalCount > 0 ? colors.error : colors.warning} />
              <View style={{ marginLeft: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                  {criticalCount > 0 ? `${criticalCount} Critical Alert${criticalCount > 1 ? 's' : ''}` : `${activeAlertCount} Active Alert${activeAlertCount > 1 ? 's' : ''}`}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  Requires immediate attention
                </Text>
              </View>
            </View>
          )}

          {/* Metrics */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {metrics.map(renderMetricCard)}
            </View>
          </ScrollView>

          {/* Alerts Section */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>
                Security Alerts
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['all', 'critical', 'high', 'medium', 'low'] as const).map(filter => (
                  <TouchableOpacity
                    key={filter}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      backgroundColor: selectedFilter === filter ? colors.primary : colors.surface,
                    }}
                    onPress={() => setSelectedFilter(filter)}
                  >
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '500',
                      color: selectedFilter === filter ? '#fff' : colors.muted,
                      textTransform: 'capitalize',
                    }}>
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <FlatList
              data={filteredAlerts}
              renderItem={renderAlertItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </View>

          {/* Event Stream */}
          <View>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
              Event Stream
            </Text>
            <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
              <FlatList
                data={events.slice(0, 10)}
                renderItem={renderEventItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
