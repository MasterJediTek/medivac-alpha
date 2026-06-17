/**
 * WACHS Site Health Dashboard Screen
 * Aggregate network status across all WACHS sites
 * MediVac One v6.0
 */

import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, Alert, RefreshControl } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { 
  wachsHealthService, 
  SiteHealth, 
  HealthAlert, 
  RegionHealth,
  WACHS_REGIONS,
  SERVICE_TYPES,
  HealthStatus
} from "@/lib/services/wachs-health-service";

type TabType = 'overview' | 'sites' | 'alerts' | 'regions';

const STATUS_COLORS: Record<HealthStatus, string> = {
  healthy: '#10B981',
  degraded: '#F59E0B',
  critical: '#EF4444',
  offline: '#6B7280',
  unknown: '#9CA3AF',
};

export default function WACHSHealthScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [sites, setSites] = useState<SiteHealth[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [regions, setRegions] = useState<RegionHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSite, setSelectedSite] = useState<SiteHealth | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await wachsHealthService.initialize();
    setSites(wachsHealthService.getSites());
    setAlerts(wachsHealthService.getAlerts());
    setRegions(wachsHealthService.getRegionHealth());
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await wachsHealthService.runHealthCheck();
    await loadData();
    setRefreshing(false);
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    await wachsHealthService.acknowledgeAlert(alertId, 'Current User');
    setAlerts(wachsHealthService.getAlerts());
    Alert.alert('Success', 'Alert acknowledged');
  };

  const handleResolveAlert = async (alertId: string) => {
    await wachsHealthService.resolveAlert(alertId);
    setAlerts(wachsHealthService.getAlerts());
    Alert.alert('Success', 'Alert resolved');
  };

  const getStatusIcon = (status: HealthStatus): string => {
    switch (status) {
      case 'healthy': return 'checkmark.circle.fill';
      case 'degraded': return 'exclamationmark.triangle.fill';
      case 'critical': return 'xmark.circle.fill';
      case 'offline': return 'wifi.slash';
      default: return 'questionmark.circle.fill';
    }
  };

  const renderOverview = () => {
    const overall = wachsHealthService.getOverallHealth();

    return (
      <View className="gap-4">
        <View className="bg-surface rounded-xl p-4 border border-border">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-foreground">System Health</Text>
            <View className="flex-row items-center gap-2">
              <View 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: overall.criticalSites > 0 ? '#EF4444' : overall.degradedSites > 0 ? '#F59E0B' : '#10B981' }}
              />
              <Text style={{ color: overall.criticalSites > 0 ? '#EF4444' : overall.degradedSites > 0 ? '#F59E0B' : '#10B981' }}>
                {overall.criticalSites > 0 ? 'Critical' : overall.degradedSites > 0 ? 'Degraded' : 'Healthy'}
              </Text>
            </View>
          </View>

          <View className="items-center mb-4">
            <Text className="text-5xl font-bold text-foreground">{overall.averageScore}</Text>
            <Text className="text-muted">Average Health Score</Text>
          </View>

          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-2xl font-bold" style={{ color: '#10B981' }}>{overall.healthySites}</Text>
              <Text className="text-muted text-sm">Healthy</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold" style={{ color: '#F59E0B' }}>{overall.degradedSites}</Text>
              <Text className="text-muted text-sm">Degraded</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold" style={{ color: '#EF4444' }}>{overall.criticalSites}</Text>
              <Text className="text-muted text-sm">Critical</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold" style={{ color: '#6B7280' }}>{overall.offlineSites}</Text>
              <Text className="text-muted text-sm">Offline</Text>
            </View>
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
            <Text className="text-muted text-sm">Active Alerts</Text>
            <Text className="text-2xl font-bold" style={{ color: overall.activeAlerts > 0 ? '#EF4444' : colors.foreground }}>
              {overall.activeAlerts}
            </Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
            <Text className="text-muted text-sm">Acknowledged</Text>
            <Text className="text-2xl font-bold text-foreground">{overall.acknowledgedAlerts}</Text>
          </View>
        </View>

        <View className="bg-surface rounded-xl p-4 border border-border">
          <Text className="font-semibold text-foreground mb-3">Sites Requiring Attention</Text>
          {sites.filter(s => s.overallStatus !== 'healthy').length === 0 ? (
            <View className="items-center py-4">
              <IconSymbol name="checkmark.circle.fill" size={32} color="#10B981" />
              <Text className="text-muted mt-2">All sites are healthy</Text>
            </View>
          ) : (
            sites.filter(s => s.overallStatus !== 'healthy').map(site => (
              <TouchableOpacity
                key={site.siteId}
                onPress={() => { setSelectedSite(site); setActiveTab('sites'); }}
                className="flex-row items-center justify-between py-3 border-b border-border"
              >
                <View className="flex-row items-center gap-3">
                  <IconSymbol 
                    name={getStatusIcon(site.overallStatus) as any} 
                    size={20} 
                    color={STATUS_COLORS[site.overallStatus]} 
                  />
                  <View>
                    <Text className="font-medium text-foreground">{site.siteName}</Text>
                    <Text className="text-muted text-sm">{WACHS_REGIONS[site.region]}</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="font-semibold" style={{ color: STATUS_COLORS[site.overallStatus] }}>
                    {site.healthScore}%
                  </Text>
                  <Text className="text-muted text-sm">{site.alerts} alerts</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <TouchableOpacity
          onPress={handleRefresh}
          className="bg-primary py-3 rounded-xl"
        >
          <Text className="text-center text-white font-semibold">Run Health Check</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSites = () => (
    <View className="gap-4">
      {selectedSite ? (
        <View className="gap-4">
          <TouchableOpacity
            onPress={() => setSelectedSite(null)}
            className="flex-row items-center gap-2"
          >
            <IconSymbol name="chevron.left" size={20} color={colors.primary} />
            <Text className="text-primary">Back to Sites</Text>
          </TouchableOpacity>

          <View className="bg-surface rounded-xl p-4 border border-border">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-xl font-bold text-foreground">{selectedSite.siteName}</Text>
                <Text className="text-muted">{selectedSite.siteCode} • {WACHS_REGIONS[selectedSite.region]}</Text>
              </View>
              <View 
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[selectedSite.overallStatus] + '20' }}
              >
                <Text style={{ color: STATUS_COLORS[selectedSite.overallStatus] }}>
                  {selectedSite.overallStatus.charAt(0).toUpperCase() + selectedSite.overallStatus.slice(1)}
                </Text>
              </View>
            </View>

            <View className="flex-row justify-around py-4 border-y border-border">
              <View className="items-center">
                <Text className="text-2xl font-bold text-foreground">{selectedSite.healthScore}</Text>
                <Text className="text-muted text-sm">Health Score</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-foreground">{selectedSite.uptime}%</Text>
                <Text className="text-muted text-sm">Uptime</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-foreground">{selectedSite.latency}ms</Text>
                <Text className="text-muted text-sm">Latency</Text>
              </View>
            </View>
          </View>

          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="font-semibold text-foreground mb-3">Network Metrics</Text>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-muted">Bandwidth</Text>
                <Text className="text-foreground">{selectedSite.networkMetrics.bandwidth} Mbps</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">Packet Loss</Text>
                <Text className={selectedSite.networkMetrics.packetLoss > 2 ? 'text-error' : 'text-foreground'}>
                  {selectedSite.networkMetrics.packetLoss}%
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">Jitter</Text>
                <Text className="text-foreground">{selectedSite.networkMetrics.jitter}ms</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">VPN Status</Text>
                <Text style={{ color: selectedSite.networkMetrics.vpnConnected ? '#10B981' : '#EF4444' }}>
                  {selectedSite.networkMetrics.vpnConnected ? 'Connected' : 'Disconnected'}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">Tunnel</Text>
                <Text className="text-foreground capitalize">{selectedSite.networkMetrics.tunnelStatus}</Text>
              </View>
            </View>
          </View>

          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="font-semibold text-foreground mb-3">Services</Text>
            {selectedSite.services.map(service => (
              <View key={service.type} className="flex-row items-center justify-between py-3 border-b border-border">
                <View className="flex-row items-center gap-3">
                  <IconSymbol 
                    name={getStatusIcon(service.status) as any} 
                    size={18} 
                    color={STATUS_COLORS[service.status]} 
                  />
                  <View>
                    <Text className="text-foreground">{SERVICE_TYPES[service.type].label}</Text>
                    <Text className="text-muted text-sm">{service.responseTime}ms • {service.uptime}% uptime</Text>
                  </View>
                </View>
                <Text className="text-muted text-sm">{service.errorRate}% errors</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        sites.map(site => (
          <TouchableOpacity
            key={site.siteId}
            onPress={() => setSelectedSite(site)}
            className="bg-surface rounded-xl p-4 border border-border"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <IconSymbol 
                  name={getStatusIcon(site.overallStatus) as any} 
                  size={24} 
                  color={STATUS_COLORS[site.overallStatus]} 
                />
                <View>
                  <Text className="font-semibold text-foreground">{site.siteName}</Text>
                  <Text className="text-muted text-sm">{site.siteCode} • {WACHS_REGIONS[site.region]}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-xl font-bold" style={{ color: STATUS_COLORS[site.overallStatus] }}>
                  {site.healthScore}
                </Text>
                <Text className="text-muted text-sm">{site.latency}ms</Text>
              </View>
            </View>

            <View className="flex-row gap-2 mt-3">
              {site.services.slice(0, 4).map(service => (
                <View 
                  key={service.type}
                  className="px-2 py-1 rounded"
                  style={{ backgroundColor: STATUS_COLORS[service.status] + '20' }}
                >
                  <Text style={{ color: STATUS_COLORS[service.status], fontSize: 11 }}>
                    {SERVICE_TYPES[service.type].label}
                  </Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderAlerts = () => {
    const activeAlerts = alerts.filter(a => !a.resolved);
    const resolvedAlerts = alerts.filter(a => a.resolved);

    return (
      <View className="gap-4">
        <Text className="text-lg font-semibold text-foreground">Active Alerts ({activeAlerts.length})</Text>
        
        {activeAlerts.length === 0 ? (
          <View className="bg-surface rounded-xl p-6 border border-border items-center">
            <IconSymbol name="checkmark.circle.fill" size={40} color="#10B981" />
            <Text className="text-foreground font-medium mt-2">No Active Alerts</Text>
            <Text className="text-muted text-sm">All systems operating normally</Text>
          </View>
        ) : (
          activeAlerts.map(alert => (
            <View 
              key={alert.id} 
              className="bg-surface rounded-xl p-4 border-l-4"
              style={{ 
                borderColor: alert.severity === 'critical' ? '#EF4444' : alert.severity === 'warning' ? '#F59E0B' : '#3B82F6',
                borderTopWidth: 1,
                borderRightWidth: 1,
                borderBottomWidth: 1,
                borderTopColor: colors.border,
                borderRightColor: colors.border,
                borderBottomColor: colors.border,
              }}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">{alert.title}</Text>
                  <Text className="text-muted text-sm mt-1">{alert.siteName}</Text>
                </View>
                <View 
                  className="px-2 py-1 rounded"
                  style={{ 
                    backgroundColor: alert.severity === 'critical' ? '#EF444420' : 
                                     alert.severity === 'warning' ? '#F59E0B20' : '#3B82F620'
                  }}
                >
                  <Text style={{ 
                    color: alert.severity === 'critical' ? '#EF4444' : 
                           alert.severity === 'warning' ? '#F59E0B' : '#3B82F6',
                    fontSize: 12
                  }}>
                    {alert.severity.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text className="text-muted text-sm mt-2">{alert.message}</Text>

              {alert.acknowledged && (
                <Text className="text-muted text-xs mt-2">
                  Acknowledged by {alert.acknowledgedBy}
                </Text>
              )}

              <View className="flex-row gap-2 mt-3">
                {!alert.acknowledged && (
                  <TouchableOpacity
                    onPress={() => handleAcknowledgeAlert(alert.id)}
                    className="flex-1 bg-background py-2 rounded-lg border border-border"
                  >
                    <Text className="text-center text-foreground">Acknowledge</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => handleResolveAlert(alert.id)}
                  className="flex-1 bg-primary py-2 rounded-lg"
                >
                  <Text className="text-center text-white">Resolve</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {resolvedAlerts.length > 0 && (
          <>
            <Text className="text-lg font-semibold text-foreground mt-4">Resolved ({resolvedAlerts.length})</Text>
            {resolvedAlerts.slice(0, 3).map(alert => (
              <View key={alert.id} className="bg-surface rounded-xl p-4 border border-border opacity-60">
                <Text className="font-medium text-foreground">{alert.title}</Text>
                <Text className="text-muted text-sm">{alert.siteName}</Text>
              </View>
            ))}
          </>
        )}
      </View>
    );
  };

  const renderRegions = () => (
    <View className="gap-4">
      {regions.map(region => (
        <View key={region.region} className="bg-surface rounded-xl p-4 border border-border">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-foreground">{region.regionName}</Text>
            <Text className="text-muted">{region.siteCount} sites</Text>
          </View>

          <View className="flex-row justify-around py-3 border-y border-border">
            <View className="items-center">
              <Text className="text-xl font-bold text-foreground">{region.averageScore}</Text>
              <Text className="text-muted text-sm">Avg Score</Text>
            </View>
            <View className="items-center">
              <Text className="text-xl font-bold" style={{ color: '#10B981' }}>{region.healthySites}</Text>
              <Text className="text-muted text-sm">Healthy</Text>
            </View>
            <View className="items-center">
              <Text className="text-xl font-bold" style={{ color: '#F59E0B' }}>{region.degradedSites}</Text>
              <Text className="text-muted text-sm">Degraded</Text>
            </View>
            <View className="items-center">
              <Text className="text-xl font-bold" style={{ color: '#EF4444' }}>{region.criticalSites}</Text>
              <Text className="text-muted text-sm">Critical</Text>
            </View>
          </View>

          {region.activeAlerts > 0 && (
            <View className="flex-row items-center gap-2 mt-3">
              <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#EF4444" />
              <Text style={{ color: '#EF4444' }}>{region.activeAlerts} active alerts</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Loading...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View className="gap-6 pb-8">
          <View>
            <Text className="text-2xl font-bold text-foreground">WACHS Health Dashboard</Text>
            <Text className="text-muted mt-1">Network status across all WA Country Health sites</Text>
          </View>

          <View className="flex-row bg-surface rounded-xl p-1">
            {(['overview', 'sites', 'alerts', 'regions'] as TabType[]).map(tab => (
              <TouchableOpacity
                key={tab}
                onPress={() => { setActiveTab(tab); setSelectedSite(null); }}
                className={`flex-1 py-3 rounded-lg ${activeTab === tab ? 'bg-primary' : ''}`}
              >
                <Text className={`text-center font-medium ${activeTab === tab ? 'text-white' : 'text-muted'}`}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'sites' && renderSites()}
          {activeTab === 'alerts' && renderAlerts()}
          {activeTab === 'regions' && renderRegions()}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
