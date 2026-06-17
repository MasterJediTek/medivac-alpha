import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { 
  alertCorrelationEngineService, 
  type AlertGroup,
  type CorrelationRule,
  type RootCause,
  type CorrelationAnalytics,
  type NoiseReductionStats,
  type AlertCategory,
} from "@/lib/services/alert-correlation-engine-service";

type TabType = 'groups' | 'rules' | 'root-causes' | 'analytics';

export default function AlertCorrelationScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('groups');
  const [groups, setGroups] = useState<AlertGroup[]>([]);
  const [rules, setRules] = useState<CorrelationRule[]>([]);
  const [rootCauses, setRootCauses] = useState<RootCause[]>([]);
  const [analytics, setAnalytics] = useState<CorrelationAnalytics | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<AlertGroup | null>(null);

  useEffect(() => {
    loadData();
    const unsubscribe = alertCorrelationEngineService.subscribe(handleGroupsUpdate);
    return () => unsubscribe();
  }, []);

  const loadData = () => {
    setGroups(alertCorrelationEngineService.getActiveGroups());
    setRules(alertCorrelationEngineService.getAllRules());
    setRootCauses(alertCorrelationEngineService.getAllRootCauses());
    setAnalytics(alertCorrelationEngineService.getAnalytics());
  };

  const handleGroupsUpdate = (updatedGroups: AlertGroup[]) => {
    setGroups(updatedGroups);
    setAnalytics(alertCorrelationEngineService.getAnalytics());
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'emergency': return 'bg-error';
      case 'critical': return 'bg-error/80';
      case 'warning': return 'bg-warning';
      default: return 'bg-muted';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-error';
      case 'investigating': return 'text-warning';
      case 'resolved': return 'text-success';
      case 'dismissed': return 'text-muted';
      default: return 'text-foreground';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-success';
      case 'medium': return 'text-warning';
      case 'low': return 'text-error';
      default: return 'text-muted';
    }
  };

  const getCategoryIcon = (category: AlertCategory) => {
    switch (category) {
      case 'pathway': return '🔄';
      case 'system': return '⚙️';
      case 'security': return '🔒';
      case 'performance': return '📊';
      case 'user': return '👤';
      case 'integration': return '🔗';
      default: return '📋';
    }
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'groups', label: 'Alert Groups' },
    { key: 'rules', label: 'Rules' },
    { key: 'root-causes', label: 'Root Causes' },
    { key: 'analytics', label: 'Analytics' },
  ];

  const renderGroupsTab = () => (
    <View className="flex-1 gap-4">
      {/* Noise Reduction Summary */}
      {analytics && (
        <View className="bg-success/10 rounded-xl p-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-muted text-sm">Noise Reduction</Text>
              <Text className="text-success text-2xl font-bold">
                {analytics.noiseReduction.noiseReductionPercentage.toFixed(1)}%
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-muted text-sm">Alerts Grouped</Text>
              <Text className="text-foreground text-lg font-semibold">
                {analytics.noiseReduction.alertsGrouped}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Active Groups */}
      {groups.length === 0 ? (
        <View className="bg-surface rounded-xl p-6 items-center">
          <Text className="text-foreground text-lg font-semibold mb-2">No Active Alert Groups</Text>
          <Text className="text-muted text-center">
            Alerts will be automatically grouped when correlated issues are detected.
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {groups.map((group) => (
            <TouchableOpacity
              key={group.id}
              onPress={() => setSelectedGroup(selectedGroup?.id === group.id ? null : group)}
              className="bg-surface rounded-xl p-4"
            >
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">{group.name}</Text>
                  <Text className="text-muted text-sm">
                    {group.alerts.length} alerts • {group.correlationStrategy}
                  </Text>
                </View>
                <View className={`px-2 py-1 rounded-full ${group.status === 'active' ? 'bg-error/10' : 'bg-warning/10'}`}>
                  <Text className={`text-xs font-medium capitalize ${getStatusColor(group.status)}`}>
                    {group.status}
                  </Text>
                </View>
              </View>

              {/* Root Cause */}
              {group.rootCause && (
                <View className="bg-primary/10 rounded-lg p-3 mb-3">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-primary font-medium">Root Cause Identified</Text>
                    <Text className={`ml-2 text-xs ${getConfidenceColor(group.rootCause.confidence)}`}>
                      ({group.rootCause.confidence} confidence)
                    </Text>
                  </View>
                  <Text className="text-foreground text-sm">{group.rootCause.description}</Text>
                </View>
              )}

              {/* Expanded Details */}
              {selectedGroup?.id === group.id && (
                <View className="mt-3 pt-3 border-t border-border">
                  <Text className="text-muted text-sm mb-2">Correlated Alerts:</Text>
                  <View className="gap-2">
                    {group.alerts.slice(0, 5).map((alert) => (
                      <View key={alert.id} className="flex-row items-center">
                        <Text className="mr-2">{getCategoryIcon(alert.category)}</Text>
                        <View className={`w-2 h-2 rounded-full mr-2 ${getSeverityColor(alert.severity)}`} />
                        <Text className="text-foreground text-sm flex-1" numberOfLines={1}>
                          {alert.message}
                        </Text>
                      </View>
                    ))}
                    {group.alerts.length > 5 && (
                      <Text className="text-muted text-sm">
                        +{group.alerts.length - 5} more alerts
                      </Text>
                    )}
                  </View>

                  {/* Actions */}
                  <View className="flex-row gap-2 mt-3">
                    <TouchableOpacity
                      onPress={() => alertCorrelationEngineService.updateGroupStatus(group.id, 'investigating')}
                      className="flex-1 bg-warning/10 rounded-lg py-2"
                    >
                      <Text className="text-warning text-center font-medium">Investigate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => alertCorrelationEngineService.updateGroupStatus(group.id, 'resolved')}
                      className="flex-1 bg-success/10 rounded-lg py-2"
                    >
                      <Text className="text-success text-center font-medium">Resolve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => alertCorrelationEngineService.updateGroupStatus(group.id, 'dismissed')}
                      className="flex-1 bg-muted/10 rounded-lg py-2"
                    >
                      <Text className="text-muted text-center font-medium">Dismiss</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderRulesTab = () => (
    <View className="flex-1 gap-3">
      <Text className="text-muted mb-2">
        Correlation rules determine how alerts are grouped together.
      </Text>

      {rules.map((rule) => (
        <View key={rule.id} className="bg-surface rounded-xl p-4">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1">
              <Text className="text-foreground font-semibold">{rule.name}</Text>
              <Text className="text-muted text-sm">{rule.description}</Text>
            </View>
            <TouchableOpacity
              onPress={() => alertCorrelationEngineService.toggleRule(rule.id)}
              className={`px-3 py-1 rounded-full ${rule.enabled ? 'bg-success/10' : 'bg-muted/10'}`}
            >
              <Text className={`text-sm font-medium ${rule.enabled ? 'text-success' : 'text-muted'}`}>
                {rule.enabled ? 'Enabled' : 'Disabled'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap gap-2 mt-2">
            <View className="bg-primary/10 rounded-lg px-2 py-1">
              <Text className="text-primary text-xs">{rule.strategy}</Text>
            </View>
            <View className="bg-muted/10 rounded-lg px-2 py-1">
              <Text className="text-muted text-xs">{rule.timeWindowMinutes}min window</Text>
            </View>
            <View className="bg-muted/10 rounded-lg px-2 py-1">
              <Text className="text-muted text-xs">Min {rule.minAlertCount} alerts</Text>
            </View>
            <View className="bg-warning/10 rounded-lg px-2 py-1">
              <Text className="text-warning text-xs">Priority {rule.priority}</Text>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-1 mt-2">
            {rule.actions.map((action, idx) => (
              <View key={idx} className="bg-surface border border-border rounded px-2 py-0.5">
                <Text className="text-foreground text-xs capitalize">{action.type}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );

  const renderRootCausesTab = () => (
    <View className="flex-1 gap-3">
      {rootCauses.length === 0 ? (
        <View className="bg-surface rounded-xl p-6 items-center">
          <Text className="text-foreground text-lg font-semibold mb-2">No Root Causes Identified</Text>
          <Text className="text-muted text-center">
            Root causes will be automatically identified when alert patterns are detected.
          </Text>
        </View>
      ) : (
        rootCauses.map((cause) => (
          <View key={cause.id} className="bg-surface rounded-xl p-4">
            <View className="flex-row items-start justify-between mb-2">
              <Text className="text-foreground font-semibold flex-1">{cause.description}</Text>
              <View className={`px-2 py-1 rounded-full ${
                cause.confidence === 'high' ? 'bg-success/10' : 
                cause.confidence === 'medium' ? 'bg-warning/10' : 'bg-error/10'
              }`}>
                <Text className={`text-xs font-medium capitalize ${getConfidenceColor(cause.confidence)}`}>
                  {cause.confidence}
                </Text>
              </View>
            </View>

            <Text className="text-muted text-sm mb-3">
              Identified by {cause.identifiedBy} • {new Date(cause.identifiedAt).toLocaleString()}
            </Text>

            {/* Affected Systems */}
            <View className="mb-3">
              <Text className="text-muted text-sm mb-1">Affected Systems:</Text>
              <View className="flex-row flex-wrap gap-1">
                {cause.affectedSystems.map((system, idx) => (
                  <View key={idx} className="bg-error/10 rounded px-2 py-0.5">
                    <Text className="text-error text-xs">{system}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Suggested Actions */}
            <View>
              <Text className="text-muted text-sm mb-1">Suggested Actions:</Text>
              {cause.suggestedActions.map((action, idx) => (
                <View key={idx} className="flex-row items-center mb-1">
                  <Text className="text-primary mr-2">•</Text>
                  <Text className="text-foreground text-sm">{action}</Text>
                </View>
              ))}
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderAnalyticsTab = () => (
    <View className="flex-1 gap-4">
      {analytics && (
        <>
          {/* Summary Cards */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-surface rounded-xl p-4">
              <Text className="text-muted text-sm">Total Groups</Text>
              <Text className="text-foreground text-2xl font-bold">{analytics.totalGroups}</Text>
            </View>
            <View className="flex-1 bg-surface rounded-xl p-4">
              <Text className="text-muted text-sm">Active</Text>
              <Text className="text-error text-2xl font-bold">{analytics.activeGroups}</Text>
            </View>
            <View className="flex-1 bg-surface rounded-xl p-4">
              <Text className="text-muted text-sm">Resolved</Text>
              <Text className="text-success text-2xl font-bold">{analytics.resolvedGroups}</Text>
            </View>
          </View>

          {/* Noise Reduction Stats */}
          <View className="bg-success/10 rounded-xl p-4">
            <Text className="text-lg font-semibold text-foreground mb-3">Noise Reduction</Text>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-muted">Total Alerts Received</Text>
                <Text className="text-foreground font-medium">{analytics.noiseReduction.totalAlertsReceived}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">Alerts Grouped</Text>
                <Text className="text-foreground font-medium">{analytics.noiseReduction.alertsGrouped}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">Alerts Suppressed</Text>
                <Text className="text-foreground font-medium">{analytics.noiseReduction.alertsSuppressed}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">Avg Group Size</Text>
                <Text className="text-foreground font-medium">{analytics.noiseReduction.avgGroupSize.toFixed(1)}</Text>
              </View>
              <View className="flex-row justify-between pt-2 border-t border-border">
                <Text className="text-success font-semibold">Noise Reduction</Text>
                <Text className="text-success font-bold">{analytics.noiseReduction.noiseReductionPercentage.toFixed(1)}%</Text>
              </View>
            </View>
          </View>

          {/* Alerts by Category */}
          <View className="bg-surface rounded-xl p-4">
            <Text className="text-lg font-semibold text-foreground mb-3">Alerts by Category</Text>
            <View className="gap-2">
              {Object.entries(analytics.alertsByCategory).map(([category, count]) => (
                <View key={category} className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Text className="mr-2">{getCategoryIcon(category as AlertCategory)}</Text>
                    <Text className="text-foreground capitalize">{category}</Text>
                  </View>
                  <Text className="text-muted">{count}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Alerts by Severity */}
          <View className="bg-surface rounded-xl p-4">
            <Text className="text-lg font-semibold text-foreground mb-3">Alerts by Severity</Text>
            <View className="gap-2">
              {Object.entries(analytics.alertsBySeverity).map(([severity, count]) => (
                <View key={severity}>
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-foreground capitalize">{severity}</Text>
                    <Text className="text-muted">{count}</Text>
                  </View>
                  <View className="h-2 bg-border rounded-full overflow-hidden">
                    <View 
                      className={`h-full rounded-full ${getSeverityColor(severity)}`}
                      style={{ width: `${analytics.totalAlerts > 0 ? (count / analytics.totalAlerts) * 100 : 0}%` }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Performance Metrics */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-primary/10 rounded-xl p-4">
              <Text className="text-muted text-sm">Correlation Accuracy</Text>
              <Text className="text-primary text-2xl font-bold">{analytics.correlationAccuracy}%</Text>
            </View>
            <View className="flex-1 bg-primary/10 rounded-xl p-4">
              <Text className="text-muted text-sm">Avg Time to Correlate</Text>
              <Text className="text-primary text-2xl font-bold">{analytics.avgTimeToCorrelate}ms</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">Alert Correlation Engine</Text>
          <Text className="text-muted mt-1">
            Intelligent alert grouping to reduce noise and identify root causes
          </Text>
        </View>

        {/* Tab Navigation */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row gap-2">
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-full ${activeTab === tab.key ? 'bg-primary' : 'bg-surface'}`}
              >
                <Text className={`font-medium ${activeTab === tab.key ? 'text-background' : 'text-foreground'}`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Tab Content */}
        {activeTab === 'groups' && renderGroupsTab()}
        {activeTab === 'rules' && renderRulesTab()}
        {activeTab === 'root-causes' && renderRootCausesTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </ScrollView>
    </ScreenContainer>
  );
}
