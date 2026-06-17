import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { systemStatusService, SystemService, SystemHealth, ServiceCategory, ServiceIncident, HEALTH_COLORS, CATEGORY_COLORS } from "@/lib/services/system-status-service";

export default function SystemStatusScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<SystemService[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [overallHealth, setOverallHealth] = useState<SystemHealth>('operational');
  const [activeIncidents, setActiveIncidents] = useState<{ service: SystemService; incident: ServiceIncident }[]>([]);
  const [expandedService, setExpandedService] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    await systemStatusService.initialize();
    setServices(systemStatusService.getServices());
    setStats(systemStatusService.getStats());
    setOverallHealth(systemStatusService.getOverallHealth());
    setActiveIncidents(systemStatusService.getActiveIncidents());
    setLoading(false);
  };

  const formatResponseTime = (ms: number) => {
    if (ms === 0) return 'N/A';
    if (ms < 100) return `${ms}ms ⚡`;
    if (ms < 500) return `${ms}ms`;
    return `${ms}ms ⚠️`;
  };

  const formatUptime = (uptime: number) => {
    if (uptime >= 99.9) return `${uptime.toFixed(2)}% 🟢`;
    if (uptime >= 99) return `${uptime.toFixed(2)}% 🟡`;
    return `${uptime.toFixed(2)}% 🔴`;
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60 * 1000) return 'Just now';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Loading system status...</Text>
      </ScreenContainer>
    );
  }

  const healthColor = HEALTH_COLORS[overallHealth];

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">System Status</Text>
          <Text className="text-muted">Color-coded operational dashboard</Text>
        </View>

        {/* Overall Status Banner */}
        <View
          className="rounded-xl p-4 mb-4"
          style={{ backgroundColor: healthColor.background, borderWidth: 2, borderColor: healthColor.primary }}
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text style={{ color: healthColor.text, fontSize: 12, fontWeight: '600' }}>OVERALL STATUS</Text>
              <Text style={{ color: healthColor.primary, fontSize: 24, fontWeight: '700', textTransform: 'uppercase' }}>
                {healthColor.icon} {overallHealth.replace('_', ' ')}
              </Text>
            </View>
            <View className="items-end">
              <Text style={{ color: healthColor.text, fontSize: 12 }}>Avg Uptime</Text>
              <Text style={{ color: healthColor.primary, fontSize: 18, fontWeight: '700' }}>
                {stats?.avgUptime.toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Health Summary */}
        <View className="flex-row flex-wrap gap-2 mb-4">
          {(Object.keys(HEALTH_COLORS) as SystemHealth[]).map((health) => {
            const hColor = HEALTH_COLORS[health];
            const count = stats?.byHealth[health] || 0;
            return (
              <View
                key={health}
                style={{
                  flex: 1,
                  minWidth: 60,
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: hColor.background,
                  borderWidth: 1,
                  borderColor: hColor.primary,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: hColor.primary, fontSize: 20, fontWeight: '700' }}>{count}</Text>
                <Text style={{ color: hColor.text, fontSize: 9, textAlign: 'center', textTransform: 'capitalize' }}>
                  {health.replace('_', '\n')}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Active Incidents */}
        {activeIncidents.length > 0 && (
          <View className="mb-4">
            <Text className="text-lg font-semibold text-foreground mb-3">
              Active Incidents ({activeIncidents.length})
            </Text>
            {activeIncidents.map(({ service, incident }) => {
              const severityColors = {
                critical: { bg: '#FEF2F2', border: '#DC2626', text: '#991B1B' },
                major: { bg: '#FFF7ED', border: '#EA580C', text: '#9A3412' },
                minor: { bg: '#FFFBEB', border: '#CA8A04', text: '#854D0E' },
              };
              const sColor = severityColors[incident.severity];
              
              return (
                <View
                  key={incident.id}
                  className="rounded-xl mb-2 overflow-hidden"
                  style={{ backgroundColor: sColor.bg, borderWidth: 1, borderColor: sColor.border }}
                >
                  <View className="p-3">
                    <View className="flex-row items-center justify-between mb-1">
                      <View className="flex-row items-center gap-2">
                        <View
                          style={{
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                            backgroundColor: sColor.border,
                          }}
                        >
                          <Text style={{ fontSize: 9, color: '#FFFFFF', fontWeight: '700', textTransform: 'uppercase' }}>
                            {incident.severity}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 10, color: sColor.text, textTransform: 'uppercase' }}>
                          {incident.status}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 10, color: sColor.text }}>{formatTimeAgo(incident.startedAt)}</Text>
                    </View>
                    <Text style={{ color: sColor.text, fontWeight: '600', marginBottom: 2 }}>{incident.title}</Text>
                    <Text style={{ color: sColor.text, fontSize: 12 }}>Affecting: {service.name}</Text>
                    {incident.updates.length > 0 && (
                      <Text style={{ color: sColor.text, fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>
                        Latest: {incident.updates[incident.updates.length - 1].message}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Services by Category */}
        {(Object.keys(CATEGORY_COLORS) as ServiceCategory[]).map((category) => {
          const categoryServices = services.filter(s => s.category === category);
          if (categoryServices.length === 0) return null;
          
          const catColor = CATEGORY_COLORS[category];
          
          return (
            <View key={category} className="mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: catColor.primary }} />
                <Text className="text-base font-semibold text-foreground capitalize">{category} Services</Text>
                <Text className="text-xs text-muted">({categoryServices.length})</Text>
              </View>
              
              {categoryServices.map((service) => {
                const hColor = HEALTH_COLORS[service.health];
                const isExpanded = expandedService === service.id;
                
                return (
                  <TouchableOpacity
                    key={service.id}
                    onPress={() => setExpandedService(isExpanded ? null : service.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      className="bg-surface rounded-lg mb-2 overflow-hidden"
                      style={{ borderWidth: 1, borderColor: hColor.primary + '40' }}
                    >
                      {/* Health indicator */}
                      <View style={{ height: 3, backgroundColor: hColor.primary }} />
                      
                      <View className="p-3">
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1 flex-row items-center gap-2">
                            <Text style={{ color: hColor.primary, fontSize: 16 }}>{hColor.icon}</Text>
                            <Text className="text-foreground font-medium flex-1" numberOfLines={1}>
                              {service.name}
                            </Text>
                          </View>
                          <View className="flex-row items-center gap-3">
                            <Text className="text-xs text-muted">{formatResponseTime(service.responseTime)}</Text>
                            <Text className="text-xs" style={{ color: service.uptime >= 99 ? '#22C55E' : '#F59E0B' }}>
                              {service.uptime.toFixed(1)}%
                            </Text>
                          </View>
                        </View>
                        
                        {isExpanded && (
                          <View className="mt-3 pt-3 border-t border-border">
                            <View className="flex-row flex-wrap gap-4">
                              <View>
                                <Text className="text-xs text-muted">Status</Text>
                                <Text style={{ color: hColor.primary, fontWeight: '600', textTransform: 'capitalize' }}>
                                  {service.health.replace('_', ' ')}
                                </Text>
                              </View>
                              <View>
                                <Text className="text-xs text-muted">Uptime</Text>
                                <Text className="text-foreground font-semibold">{formatUptime(service.uptime)}</Text>
                              </View>
                              <View>
                                <Text className="text-xs text-muted">Response</Text>
                                <Text className="text-foreground font-semibold">{formatResponseTime(service.responseTime)}</Text>
                              </View>
                              <View>
                                <Text className="text-xs text-muted">Last Check</Text>
                                <Text className="text-foreground font-semibold">{formatTimeAgo(service.lastChecked)}</Text>
                              </View>
                            </View>
                            
                            {service.dependencies && service.dependencies.length > 0 && (
                              <View className="mt-2">
                                <Text className="text-xs text-muted mb-1">Dependencies</Text>
                                <View className="flex-row flex-wrap gap-1">
                                  {service.dependencies.map((depId) => {
                                    const dep = services.find(s => s.id === depId);
                                    const depHealth = dep ? HEALTH_COLORS[dep.health] : HEALTH_COLORS.operational;
                                    return (
                                      <View
                                        key={depId}
                                        style={{
                                          paddingHorizontal: 6,
                                          paddingVertical: 2,
                                          borderRadius: 4,
                                          backgroundColor: depHealth.background,
                                        }}
                                      >
                                        <Text style={{ fontSize: 10, color: depHealth.primary }}>
                                          {dep?.name || depId}
                                        </Text>
                                      </View>
                                    );
                                  })}
                                </View>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}

        {/* Health Legend */}
        <View className="bg-surface rounded-xl p-4 border border-border mb-6">
          <Text className="text-sm font-medium text-foreground mb-3">Status Legend</Text>
          <View className="flex-row flex-wrap gap-3">
            {(Object.entries(HEALTH_COLORS) as [SystemHealth, typeof HEALTH_COLORS[SystemHealth]][]).map(([key, color]) => (
              <View key={key} className="flex-row items-center">
                <Text style={{ color: color.primary, marginRight: 4 }}>{color.icon}</Text>
                <Text className="text-xs text-foreground capitalize">{key.replace('_', ' ')}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
