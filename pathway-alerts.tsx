import { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Switch } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { 
  pathwayAlertNotificationService, 
  PathwayAlert, 
  AlertSeverity,
  PathwayType,
  AlertAnalytics 
} from '@/lib/services/pathway-alert-notification-service';

export default function PathwayAlertsScreen() {
  const colors = useColors();
  const [alerts, setAlerts] = useState<PathwayAlert[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<PathwayAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [analytics, setAnalytics] = useState<AlertAnalytics | null>(null);
  const [selectedTab, setSelectedTab] = useState<'active' | 'all' | 'analytics'>('active');

  useEffect(() => {
    loadData();
    const unsubscribe = pathwayAlertNotificationService.onAlert((alert) => {
      loadData();
    });
    return unsubscribe;
  }, []);

  const loadData = () => {
    setAlerts(pathwayAlertNotificationService.getAllAlerts());
    setActiveAlerts(pathwayAlertNotificationService.getActiveAlerts());
    setIsMonitoring(pathwayAlertNotificationService.isMonitoringActive());
    setAnalytics(pathwayAlertNotificationService.getAnalytics());
  };

  const handleToggleMonitoring = () => {
    if (isMonitoring) {
      pathwayAlertNotificationService.stopMonitoring();
    } else {
      pathwayAlertNotificationService.startMonitoring();
    }
    setIsMonitoring(!isMonitoring);
  };

  const handleAcknowledge = (alertId: string) => {
    pathwayAlertNotificationService.acknowledgeAlert(alertId, 'current-user');
    loadData();
  };

  const handleResolve = (alertId: string) => {
    pathwayAlertNotificationService.resolveAlert(alertId, 'current-user');
    loadData();
  };

  const getSeverityColor = (severity: AlertSeverity): string => {
    const severityColors: Record<AlertSeverity, string> = {
      info: '#3B82F6',
      warning: '#F59E0B',
      critical: '#EF4444',
      emergency: '#DC2626',
    };
    return severityColors[severity];
  };

  const getPathwayColor = (pathway: PathwayType): string => {
    const pathwayColors: Record<PathwayType, string> = {
      l1_cache: '#22C55E',
      l2_storage: '#3B82F6',
      l3_cloud: '#8B5CF6',
      websocket: '#F97316',
      api: '#06B6D4',
      jedi_sync: '#FFD700',
      offline_queue: '#6B7280',
    };
    return pathwayColors[pathway];
  };

  const renderAlert = (alert: PathwayAlert) => (
    <View 
      key={alert.id}
      className="bg-surface rounded-xl p-4 mb-3 border border-border"
      style={{ borderLeftWidth: 4, borderLeftColor: getSeverityColor(alert.severity) }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1">
          <View 
            style={{ 
              width: 10, 
              height: 10, 
              borderRadius: 5, 
              backgroundColor: getPathwayColor(alert.pathwayType),
              marginRight: 8,
            }} 
          />
          <Text className="text-foreground font-semibold flex-1" numberOfLines={1}>
            {alert.title}
          </Text>
        </View>
        <View 
          className="px-2 py-1 rounded"
          style={{ backgroundColor: getSeverityColor(alert.severity) + '20' }}
        >
          <Text 
            className="text-xs font-medium uppercase"
            style={{ color: getSeverityColor(alert.severity) }}
          >
            {alert.severity}
          </Text>
        </View>
      </View>
      
      <Text className="text-muted text-sm mb-3">{alert.message}</Text>
      
      <View className="flex-row items-center justify-between">
        <Text className="text-muted text-xs">
          {alert.createdAt.toLocaleString()}
        </Text>
        
        {!alert.resolvedAt && (
          <View className="flex-row">
            {!alert.acknowledgedAt && (
              <TouchableOpacity
                onPress={() => handleAcknowledge(alert.id)}
                className="bg-primary/20 px-3 py-1 rounded mr-2"
              >
                <Text className="text-primary text-sm">Acknowledge</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => handleResolve(alert.id)}
              className="bg-green-500/20 px-3 py-1 rounded"
            >
              <Text className="text-green-500 text-sm">Resolve</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {alert.resolvedAt && (
          <Text className="text-green-500 text-xs">Resolved</Text>
        )}
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        <Text className="text-2xl font-bold text-foreground mb-2">Pathway Alerts</Text>
        <Text className="text-muted mb-6">Monitor and respond to data pathway issues</Text>

        {/* Monitoring Status */}
        <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-foreground font-semibold">Real-time Monitoring</Text>
              <Text className="text-muted text-sm">
                {isMonitoring ? 'Actively monitoring pathways' : 'Monitoring paused'}
              </Text>
            </View>
            <Switch
              value={isMonitoring}
              onValueChange={handleToggleMonitoring}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </View>

        {/* Tab Navigation */}
        <View className="flex-row mb-4">
          {(['active', 'all', 'analytics'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setSelectedTab(tab)}
              className={`flex-1 py-2 rounded-lg mr-2 ${
                selectedTab === tab ? 'bg-primary' : 'bg-surface'
              }`}
            >
              <Text 
                className={`text-center font-medium capitalize ${
                  selectedTab === tab ? 'text-white' : 'text-muted'
                }`}
              >
                {tab === 'active' ? `Active (${activeAlerts.length})` : tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content based on selected tab */}
        {selectedTab === 'active' && (
          <>
            {activeAlerts.length > 0 ? (
              activeAlerts.map(renderAlert)
            ) : (
              <View className="bg-surface rounded-xl p-8 border border-border">
                <Text className="text-center text-muted">No active alerts</Text>
                <Text className="text-center text-muted text-sm mt-1">
                  All systems operating normally
                </Text>
              </View>
            )}
          </>
        )}

        {selectedTab === 'all' && (
          <>
            {alerts.slice(0, 20).map(renderAlert)}
          </>
        )}

        {selectedTab === 'analytics' && analytics && (
          <>
            {/* Summary Stats */}
            <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-3">Summary</Text>
              <View className="flex-row flex-wrap">
                <View className="w-1/2 mb-3">
                  <Text className="text-2xl font-bold text-primary">{analytics.totalAlerts}</Text>
                  <Text className="text-muted text-sm">Total Alerts</Text>
                </View>
                <View className="w-1/2 mb-3">
                  <Text className="text-2xl font-bold text-primary">{analytics.alertsToday}</Text>
                  <Text className="text-muted text-sm">Today</Text>
                </View>
                <View className="w-1/2 mb-3">
                  <Text className="text-2xl font-bold text-primary">{analytics.averageAcknowledgeTime}m</Text>
                  <Text className="text-muted text-sm">Avg Ack Time</Text>
                </View>
                <View className="w-1/2 mb-3">
                  <Text className="text-2xl font-bold text-primary">{analytics.escalationRate}%</Text>
                  <Text className="text-muted text-sm">Escalation Rate</Text>
                </View>
              </View>
            </View>

            {/* By Severity */}
            <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-3">By Severity</Text>
              {Object.entries(analytics.alertsBySeverity).map(([severity, count]) => (
                <View key={severity} className="flex-row items-center justify-between py-2">
                  <View className="flex-row items-center">
                    <View 
                      style={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: 6, 
                        backgroundColor: getSeverityColor(severity as AlertSeverity),
                        marginRight: 8,
                      }} 
                    />
                    <Text className="text-foreground capitalize">{severity}</Text>
                  </View>
                  <Text className="text-muted">{count}</Text>
                </View>
              ))}
            </View>

            {/* Top Pathway Issues */}
            <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-3">Top Pathway Issues</Text>
              {analytics.topPathwayIssues.map((item, index) => (
                <View key={item.pathway} className="flex-row items-center justify-between py-2">
                  <View className="flex-row items-center">
                    <Text className="text-muted mr-2">{index + 1}.</Text>
                    <View 
                      style={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: 6, 
                        backgroundColor: getPathwayColor(item.pathway),
                        marginRight: 8,
                      }} 
                    />
                    <Text className="text-foreground">{item.pathway.replace('_', ' ').toUpperCase()}</Text>
                  </View>
                  <Text className="text-muted">{item.count}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
