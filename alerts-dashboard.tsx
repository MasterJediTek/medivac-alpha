import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { alertsDashboardService, Alert, AlertSeverity, AlertStatus, AlertCategory } from "@/lib/services/alerts-dashboard-service";
import { SEVERITY_COLORS, STATUS_COLORS, CATEGORY_COLORS } from "@/lib/services/color-code-service";

export default function AlertsDashboardScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<AlertSeverity | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<AlertStatus | 'all'>('all');

  useEffect(() => {
    loadAlerts();
  }, [selectedSeverity, selectedStatus]);

  const loadAlerts = async () => {
    setLoading(true);
    await alertsDashboardService.initialize();
    
    const filter: any = {};
    if (selectedSeverity !== 'all') filter.severity = [selectedSeverity];
    if (selectedStatus !== 'all') filter.status = [selectedStatus];
    
    setAlerts(alertsDashboardService.getAlerts(filter));
    setStats(alertsDashboardService.getStats());
    setLoading(false);
  };

  const getSeverityColor = (severity: AlertSeverity) => SEVERITY_COLORS[severity];
  const getStatusColor = (status: AlertStatus) => {
    const statusMap: Record<AlertStatus, keyof typeof STATUS_COLORS> = {
      active: 'active',
      acknowledged: 'pending',
      resolved: 'complete',
      expired: 'disabled',
    };
    return STATUS_COLORS[statusMap[status]];
  };

  const getCategoryColor = (category: AlertCategory) => {
    const categoryMap: Record<AlertCategory, keyof typeof CATEGORY_COLORS> = {
      security: 'security',
      clinical: 'clinical',
      system: 'administrative',
      compliance: 'administrative',
      integration: 'integration',
      communication: 'communications',
    };
    return CATEGORY_COLORS[categoryMap[category]];
  };

  const handleAcknowledge = async (alertId: string) => {
    await alertsDashboardService.acknowledgeAlert(alertId, 'current_user');
    loadAlerts();
  };

  const handleResolve = async (alertId: string) => {
    await alertsDashboardService.resolveAlert(alertId, 'current_user');
    loadAlerts();
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60 * 1000) return 'Just now';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`;
  };

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Loading alerts...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">Alerts Dashboard</Text>
          <Text className="text-muted">Color-coded severity monitoring</Text>
        </View>

        {/* Stats Cards */}
        <View className="flex-row flex-wrap gap-2 mb-4">
          <View 
            className="flex-1 min-w-[100px] rounded-xl p-3"
            style={{ backgroundColor: SEVERITY_COLORS.critical.background, borderWidth: 1, borderColor: SEVERITY_COLORS.critical.border }}
          >
            <Text style={{ color: SEVERITY_COLORS.critical.text, fontSize: 12 }}>Critical</Text>
            <Text style={{ color: SEVERITY_COLORS.critical.primary, fontSize: 24, fontWeight: '700' }}>
              {stats?.bySeverity.critical || 0}
            </Text>
          </View>
          <View 
            className="flex-1 min-w-[100px] rounded-xl p-3"
            style={{ backgroundColor: SEVERITY_COLORS.high.background, borderWidth: 1, borderColor: SEVERITY_COLORS.high.border }}
          >
            <Text style={{ color: SEVERITY_COLORS.high.text, fontSize: 12 }}>High</Text>
            <Text style={{ color: SEVERITY_COLORS.high.primary, fontSize: 24, fontWeight: '700' }}>
              {stats?.bySeverity.high || 0}
            </Text>
          </View>
          <View 
            className="flex-1 min-w-[100px] rounded-xl p-3"
            style={{ backgroundColor: SEVERITY_COLORS.medium.background, borderWidth: 1, borderColor: SEVERITY_COLORS.medium.border }}
          >
            <Text style={{ color: SEVERITY_COLORS.medium.text, fontSize: 12 }}>Medium</Text>
            <Text style={{ color: SEVERITY_COLORS.medium.primary, fontSize: 24, fontWeight: '700' }}>
              {stats?.bySeverity.medium || 0}
            </Text>
          </View>
          <View 
            className="flex-1 min-w-[100px] rounded-xl p-3"
            style={{ backgroundColor: SEVERITY_COLORS.low.background, borderWidth: 1, borderColor: SEVERITY_COLORS.low.border }}
          >
            <Text style={{ color: SEVERITY_COLORS.low.text, fontSize: 12 }}>Low</Text>
            <Text style={{ color: SEVERITY_COLORS.low.primary, fontSize: 24, fontWeight: '700' }}>
              {stats?.bySeverity.low || 0}
            </Text>
          </View>
        </View>

        {/* Filter Chips */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-muted mb-2">Filter by Severity</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {(['all', 'critical', 'high', 'medium', 'low', 'info'] as const).map((sev) => {
                const isSelected = selectedSeverity === sev;
                const sevColor = sev === 'all' ? colors.primary : SEVERITY_COLORS[sev].primary;
                return (
                  <TouchableOpacity
                    key={sev}
                    onPress={() => setSelectedSeverity(sev)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      backgroundColor: isSelected ? sevColor : sevColor + '20',
                      borderWidth: 1,
                      borderColor: sevColor,
                    }}
                  >
                    <Text style={{ color: isSelected ? '#FFFFFF' : sevColor, fontWeight: '600', fontSize: 12 }}>
                      {sev.charAt(0).toUpperCase() + sev.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-muted mb-2">Filter by Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {(['all', 'active', 'acknowledged', 'resolved'] as const).map((stat) => {
                const isSelected = selectedStatus === stat;
                const statColor = stat === 'all' ? colors.primary : getStatusColor(stat as AlertStatus).primary;
                return (
                  <TouchableOpacity
                    key={stat}
                    onPress={() => setSelectedStatus(stat)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      backgroundColor: isSelected ? statColor : statColor + '20',
                      borderWidth: 1,
                      borderColor: statColor,
                    }}
                  >
                    <Text style={{ color: isSelected ? '#FFFFFF' : statColor, fontWeight: '600', fontSize: 12 }}>
                      {stat.charAt(0).toUpperCase() + stat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Alerts List */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Alerts ({alerts.length})
          </Text>
          
          {alerts.length === 0 ? (
            <View className="bg-surface rounded-xl p-6 border border-border">
              <Text className="text-muted text-center">No alerts match your filters</Text>
            </View>
          ) : (
            alerts.map((alert) => {
              const sevColor = getSeverityColor(alert.severity);
              const statColor = getStatusColor(alert.status);
              const catColor = getCategoryColor(alert.category);
              
              return (
                <View
                  key={alert.id}
                  className="bg-surface rounded-xl mb-3 overflow-hidden"
                  style={{ borderWidth: 1, borderColor: sevColor.border }}
                >
                  {/* Severity indicator bar */}
                  <View style={{ height: 4, backgroundColor: sevColor.primary }} />
                  
                  <View className="p-4">
                    {/* Header row */}
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                          <View
                            style={{
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                              backgroundColor: sevColor.background,
                            }}
                          >
                            <Text style={{ fontSize: 10, color: sevColor.primary, fontWeight: '700' }}>
                              {alert.severity.toUpperCase()}
                            </Text>
                          </View>
                          <View
                            style={{
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                              backgroundColor: statColor.background,
                            }}
                          >
                            <Text style={{ fontSize: 10, color: statColor.primary, fontWeight: '600' }}>
                              {alert.status.toUpperCase()}
                            </Text>
                          </View>
                          <View
                            style={{
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                              backgroundColor: catColor + '20',
                            }}
                          >
                            <Text style={{ fontSize: 10, color: catColor, fontWeight: '600' }}>
                              {alert.category.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-foreground font-semibold">{alert.title}</Text>
                      </View>
                      <Text className="text-xs text-muted">{formatTime(alert.createdAt)}</Text>
                    </View>
                    
                    {/* Message */}
                    <Text className="text-sm text-muted mb-3">{alert.message}</Text>
                    
                    {/* Source */}
                    <Text className="text-xs text-muted mb-3">Source: {alert.source}</Text>
                    
                    {/* Actions */}
                    {alert.status === 'active' && (
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() => handleAcknowledge(alert.id)}
                          style={{
                            flex: 1,
                            paddingVertical: 8,
                            borderRadius: 8,
                            backgroundColor: STATUS_COLORS.pending.background,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: STATUS_COLORS.pending.primary, fontWeight: '600', fontSize: 12 }}>
                            Acknowledge
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleResolve(alert.id)}
                          style={{
                            flex: 1,
                            paddingVertical: 8,
                            borderRadius: 8,
                            backgroundColor: STATUS_COLORS.complete.background,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: STATUS_COLORS.complete.primary, fontWeight: '600', fontSize: 12 }}>
                            Resolve
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    {alert.status === 'acknowledged' && (
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() => handleResolve(alert.id)}
                          style={{
                            flex: 1,
                            paddingVertical: 8,
                            borderRadius: 8,
                            backgroundColor: STATUS_COLORS.complete.background,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: STATUS_COLORS.complete.primary, fontWeight: '600', fontSize: 12 }}>
                            Mark Resolved
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    {/* Custom actions */}
                    {alert.actions && alert.actions.length > 0 && (
                      <View className="flex-row flex-wrap gap-2 mt-2">
                        {alert.actions.map((action) => (
                          <TouchableOpacity
                            key={action.id}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 6,
                              backgroundColor: colors.primary + '20',
                            }}
                          >
                            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
                              {action.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Color Legend */}
        <View className="bg-surface rounded-xl p-4 border border-border mb-6">
          <Text className="font-semibold text-foreground mb-3">Color Legend</Text>
          
          <Text className="text-xs font-medium text-muted mb-2">Severity Levels</Text>
          <View className="flex-row flex-wrap gap-3 mb-4">
            {Object.entries(SEVERITY_COLORS).map(([key, color]) => (
              <View key={key} className="flex-row items-center">
                <View style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: color.primary, marginRight: 6 }} />
                <Text className="text-xs text-foreground capitalize">{key}</Text>
              </View>
            ))}
          </View>
          
          <Text className="text-xs font-medium text-muted mb-2">Status Types</Text>
          <View className="flex-row flex-wrap gap-3">
            {[
              { key: 'active', label: 'Active', color: STATUS_COLORS.active },
              { key: 'acknowledged', label: 'Acknowledged', color: STATUS_COLORS.pending },
              { key: 'resolved', label: 'Resolved', color: STATUS_COLORS.complete },
            ].map((item) => (
              <View key={item.key} className="flex-row items-center">
                <View style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: item.color.primary, marginRight: 6 }} />
                <Text className="text-xs text-foreground">{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
