/**
 * System Dashboard - Comprehensive Integration Overview
 * Execute with extreme prejudice
 */

import { useState, useEffect, useCallback } from "react";
import { ScrollView, Text, View, TouchableOpacity, RefreshControl } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

// ==========================================
// Types
// ==========================================

interface SystemMetric {
  id: string;
  name: string;
  value: number | string;
  unit?: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  trend?: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

interface IntegrationStatus {
  id: string;
  name: string;
  provider: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSync?: string;
  errorMessage?: string;
}

interface AgentStatus {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'standby' | 'busy' | 'offline';
  activeTasks: number;
  uptime: number;
}

interface SecurityAlert {
  id: string;
  level: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  timestamp: string;
  acknowledged: boolean;
}

interface QuickAction {
  id: string;
  name: string;
  icon: string;
  color: string;
  command: string;
}

// ==========================================
// Mock Data
// ==========================================

const SYSTEM_METRICS: SystemMetric[] = [
  { id: 'cpu', name: 'CPU Usage', value: 23, unit: '%', status: 'healthy', trend: 'stable', lastUpdated: new Date().toISOString() },
  { id: 'memory', name: 'Memory', value: 67, unit: '%', status: 'healthy', trend: 'up', lastUpdated: new Date().toISOString() },
  { id: 'storage', name: 'Storage', value: 45, unit: '%', status: 'healthy', trend: 'stable', lastUpdated: new Date().toISOString() },
  { id: 'network', name: 'Network', value: 'Online', status: 'healthy', trend: 'stable', lastUpdated: new Date().toISOString() },
  { id: 'api_latency', name: 'API Latency', value: 45, unit: 'ms', status: 'healthy', trend: 'down', lastUpdated: new Date().toISOString() },
  { id: 'active_users', name: 'Active Users', value: 127, status: 'healthy', trend: 'up', lastUpdated: new Date().toISOString() },
];

const INTEGRATIONS: IntegrationStatus[] = [
  { id: 'jeditek_sso', name: 'JEDITek SSO', provider: 'JEDITek', status: 'connected', lastSync: new Date().toISOString() },
  { id: 'azure_ad', name: 'Azure AD', provider: 'Microsoft', status: 'connected', lastSync: new Date().toISOString() },
  { id: 'google_oauth', name: 'Google OAuth', provider: 'Google', status: 'connected', lastSync: new Date().toISOString() },
  { id: 'apple_signin', name: 'Apple Sign-In', provider: 'Apple', status: 'connected', lastSync: new Date().toISOString() },
  { id: 'facebook', name: 'Facebook', provider: 'Meta', status: 'connected', lastSync: new Date().toISOString() },
  { id: 'claris', name: 'Claris Connect', provider: 'Claris', status: 'connected', lastSync: new Date().toISOString() },
  { id: 'filemaker', name: 'FileMaker', provider: 'Claris', status: 'connected', lastSync: new Date().toISOString() },
  { id: 'medicare', name: 'Medicare Eclipse', provider: 'Services Australia', status: 'connected', lastSync: new Date().toISOString() },
  { id: 'mhr', name: 'My Health Record', provider: 'Australian Digital Health', status: 'connected', lastSync: new Date().toISOString() },
  { id: 'best_practice', name: 'Best Practice', provider: 'Best Practice Software', status: 'pending' },
];

const AGENTS: AgentStatus[] = [
  { id: 'commander', name: 'JEDI Commander', role: 'commander', status: 'active', activeTasks: 3, uptime: 86400 },
  { id: 'sentinel', name: 'Security Sentinel', role: 'sentinel', status: 'active', activeTasks: 1, uptime: 86400 },
  { id: 'medic', name: 'Clinical Medic', role: 'medic', status: 'standby', activeTasks: 0, uptime: 86400 },
  { id: 'analyst', name: 'Data Analyst', role: 'analyst', status: 'busy', activeTasks: 5, uptime: 86400 },
];

const SECURITY_ALERTS: SecurityAlert[] = [
  { id: 'alert_1', level: 'low', title: 'Routine security scan completed', timestamp: new Date().toISOString(), acknowledged: true },
  { id: 'alert_2', level: 'medium', title: 'New device login detected', timestamp: new Date(Date.now() - 3600000).toISOString(), acknowledged: false },
];

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'sync_all', name: 'Sync All', icon: 'arrow.triangle.2.circlepath', color: '#3B82F6', command: 'sync:all' },
  { id: 'backup', name: 'Backup', icon: 'externaldrive.fill', color: '#10B981', command: 'maintenance:backup' },
  { id: 'scan', name: 'Security Scan', icon: 'shield.fill', color: '#EF4444', command: 'security:scan' },
  { id: 'report', name: 'Generate Report', icon: 'doc.text.fill', color: '#8B5CF6', command: 'report:compliance' },
];

// ==========================================
// Component
// ==========================================

export default function SystemDashboardScreen() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState(SYSTEM_METRICS);
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [agents, setAgents] = useState(AGENTS);
  const [alerts, setAlerts] = useState(SECURITY_ALERTS);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'integrations' | 'agents' | 'security'>('overview');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'active':
        return '#10B981';
      case 'warning':
      case 'pending':
      case 'standby':
        return '#F59E0B';
      case 'critical':
      case 'error':
      case 'offline':
        return '#EF4444';
      case 'busy':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical': return '#DC2626';
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  const renderOverviewTab = () => (
    <View className="gap-6">
      {/* System Health */}
      <View className="bg-surface rounded-2xl p-4 border border-border">
        <Text className="text-lg font-bold text-foreground mb-4">System Health</Text>
        <View className="flex-row flex-wrap gap-3">
          {metrics.map(metric => (
            <View 
              key={metric.id} 
              className="bg-background rounded-xl p-3 border border-border"
              style={{ width: '47%' }}
            >
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs text-muted">{metric.name}</Text>
                <View 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getStatusColor(metric.status) }}
                />
              </View>
              <View className="flex-row items-baseline">
                <Text className="text-2xl font-bold text-foreground">{metric.value}</Text>
                {metric.unit && <Text className="text-sm text-muted ml-1">{metric.unit}</Text>}
              </View>
              {metric.trend && (
                <View className="flex-row items-center mt-1">
                  <IconSymbol 
                    name={metric.trend === 'up' ? 'arrow.up.right' : metric.trend === 'down' ? 'arrow.down.right' : 'arrow.right'}
                    size={12}
                    color={metric.trend === 'up' ? '#10B981' : metric.trend === 'down' ? '#EF4444' : '#6B7280'}
                  />
                  <Text className="text-xs text-muted ml-1">{metric.trend}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View className="bg-surface rounded-2xl p-4 border border-border">
        <Text className="text-lg font-bold text-foreground mb-4">Quick Actions</Text>
        <View className="flex-row flex-wrap gap-3">
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.id}
              className="items-center justify-center rounded-xl p-4"
              style={{ backgroundColor: action.color + '20', width: '22%' }}
              activeOpacity={0.7}
            >
              <IconSymbol name={action.icon as any} size={24} color={action.color} />
              <Text className="text-xs text-foreground mt-2 text-center">{action.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Alerts */}
      <View className="bg-surface rounded-2xl p-4 border border-border">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-bold text-foreground">Security Alerts</Text>
          <View className="bg-primary/20 px-2 py-1 rounded-full">
            <Text className="text-xs text-primary font-medium">{alerts.filter(a => !a.acknowledged).length} new</Text>
          </View>
        </View>
        {alerts.slice(0, 3).map(alert => (
          <View 
            key={alert.id} 
            className="flex-row items-center p-3 bg-background rounded-xl mb-2 border border-border"
          >
            <View 
              className="w-3 h-3 rounded-full mr-3"
              style={{ backgroundColor: getAlertColor(alert.level) }}
            />
            <View className="flex-1">
              <Text className="text-sm font-medium text-foreground">{alert.title}</Text>
              <Text className="text-xs text-muted">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </Text>
            </View>
            {!alert.acknowledged && (
              <View className="w-2 h-2 rounded-full bg-primary" />
            )}
          </View>
        ))}
      </View>
    </View>
  );

  const renderIntegrationsTab = () => (
    <View className="gap-4">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-lg font-bold text-foreground">Connected Services</Text>
        <Text className="text-sm text-muted">
          {integrations.filter(i => i.status === 'connected').length}/{integrations.length} active
        </Text>
      </View>
      {integrations.map(integration => (
        <View 
          key={integration.id}
          className="bg-surface rounded-xl p-4 border border-border"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">{integration.name}</Text>
              <Text className="text-xs text-muted">{integration.provider}</Text>
            </View>
            <View className="flex-row items-center">
              <View 
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: getStatusColor(integration.status) }}
              />
              <Text 
                className="text-xs font-medium capitalize"
                style={{ color: getStatusColor(integration.status) }}
              >
                {integration.status}
              </Text>
            </View>
          </View>
          {integration.lastSync && (
            <Text className="text-xs text-muted mt-2">
              Last sync: {new Date(integration.lastSync).toLocaleString()}
            </Text>
          )}
          {integration.errorMessage && (
            <Text className="text-xs text-error mt-2">{integration.errorMessage}</Text>
          )}
        </View>
      ))}
    </View>
  );

  const renderAgentsTab = () => (
    <View className="gap-4">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-lg font-bold text-foreground">JEDI Agents</Text>
        <Text className="text-sm text-muted">
          {agents.filter(a => a.status === 'active' || a.status === 'busy').length} active
        </Text>
      </View>
      {agents.map(agent => (
        <View 
          key={agent.id}
          className="bg-surface rounded-xl p-4 border border-border"
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <View 
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: getStatusColor(agent.status) + '30' }}
              >
                <IconSymbol name="cpu" size={20} color={getStatusColor(agent.status)} />
              </View>
              <View>
                <Text className="text-base font-semibold text-foreground">{agent.name}</Text>
                <Text className="text-xs text-muted capitalize">{agent.role}</Text>
              </View>
            </View>
            <View 
              className="px-2 py-1 rounded-full"
              style={{ backgroundColor: getStatusColor(agent.status) + '20' }}
            >
              <Text 
                className="text-xs font-medium capitalize"
                style={{ color: getStatusColor(agent.status) }}
              >
                {agent.status}
              </Text>
            </View>
          </View>
          <View className="flex-row justify-between">
            <View>
              <Text className="text-xs text-muted">Active Tasks</Text>
              <Text className="text-lg font-bold text-foreground">{agent.activeTasks}</Text>
            </View>
            <View>
              <Text className="text-xs text-muted">Uptime</Text>
              <Text className="text-lg font-bold text-foreground">{formatUptime(agent.uptime)}</Text>
            </View>
            <TouchableOpacity 
              className="bg-primary/20 px-4 py-2 rounded-lg items-center justify-center"
              activeOpacity={0.7}
            >
              <Text className="text-sm font-medium text-primary">
                {agent.status === 'active' ? 'Pause' : 'Start'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderSecurityTab = () => (
    <View className="gap-4">
      {/* Security Score */}
      <View className="bg-surface rounded-2xl p-6 border border-border items-center">
        <Text className="text-sm text-muted mb-2">Security Score</Text>
        <View className="w-24 h-24 rounded-full border-4 border-success items-center justify-center mb-2">
          <Text className="text-3xl font-bold text-success">94</Text>
        </View>
        <Text className="text-sm text-success font-medium">Excellent</Text>
      </View>

      {/* Security Status */}
      <View className="bg-surface rounded-xl p-4 border border-border">
        <Text className="text-base font-semibold text-foreground mb-3">Security Status</Text>
        <View className="gap-2">
          {[
            { name: 'Encryption', status: 'Active', color: '#10B981' },
            { name: 'Firewall', status: 'Active', color: '#10B981' },
            { name: 'Intrusion Detection', status: 'Active', color: '#10B981' },
            { name: 'MFA Enforcement', status: 'Enabled', color: '#10B981' },
            { name: 'Zero Trust', status: 'Active', color: '#10B981' },
            { name: 'Last Scan', status: '2 hours ago', color: '#F59E0B' },
          ].map((item, index) => (
            <View key={index} className="flex-row items-center justify-between py-2 border-b border-border">
              <Text className="text-sm text-foreground">{item.name}</Text>
              <Text className="text-sm font-medium" style={{ color: item.color }}>{item.status}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Compliance */}
      <View className="bg-surface rounded-xl p-4 border border-border">
        <Text className="text-base font-semibold text-foreground mb-3">Compliance Status</Text>
        <View className="gap-2">
          {[
            { framework: 'HIPAA', score: 98 },
            { framework: 'Australian Privacy Act', score: 96 },
            { framework: 'ISO 27001', score: 94 },
            { framework: 'NSQHS', score: 100 },
          ].map((item, index) => (
            <View key={index} className="mb-2">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sm text-foreground">{item.framework}</Text>
                <Text className="text-sm font-medium text-success">{item.score}%</Text>
              </View>
              <View className="h-2 bg-background rounded-full overflow-hidden">
                <View 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${item.score}%`,
                    backgroundColor: item.score >= 90 ? '#10B981' : item.score >= 70 ? '#F59E0B' : '#EF4444'
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const tabs = [
    { id: 'overview', name: 'Overview', icon: 'house.fill' },
    { id: 'integrations', name: 'Integrations', icon: 'link' },
    { id: 'agents', name: 'Agents', icon: 'cpu' },
    { id: 'security', name: 'Security', icon: 'shield.fill' },
  ] as const;

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="px-4 pt-2 pb-4">
        <Text className="text-2xl font-bold text-foreground">System Dashboard</Text>
        <Text className="text-sm text-muted">Comprehensive integration overview</Text>
      </View>

      {/* Tab Bar */}
      <View className="flex-row px-4 mb-4">
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            className={`flex-1 py-2 items-center rounded-lg mr-2 ${
              selectedTab === tab.id ? 'bg-primary' : 'bg-surface'
            }`}
            onPress={() => setSelectedTab(tab.id)}
            activeOpacity={0.7}
          >
            <IconSymbol 
              name={tab.icon as any} 
              size={18} 
              color={selectedTab === tab.id ? '#FFFFFF' : colors.muted} 
            />
            <Text 
              className={`text-xs mt-1 ${
                selectedTab === tab.id ? 'text-white font-medium' : 'text-muted'
              }`}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'integrations' && renderIntegrationsTab()}
        {selectedTab === 'agents' && renderAgentsTab()}
        {selectedTab === 'security' && renderSecurityTab()}
        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
