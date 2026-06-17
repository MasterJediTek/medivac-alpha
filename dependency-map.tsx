import { useState, useEffect, useCallback } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { 
  dependencyMappingService, 
  WACHSSite,
  Dependency,
  CascadeRisk,
  DependencyAlert,
  DependencyStats,
  WACHS_REGIONS,
  DEPENDENCY_TYPES,
  SERVICE_TYPES,
} from '@/lib/services/dependency-mapping-service';

type TabType = 'overview' | 'sites' | 'risks' | 'alerts';

export default function DependencyMapScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [sites, setSites] = useState<WACHSSite[]>([]);
  const [stats, setStats] = useState<DependencyStats | null>(null);
  const [alerts, setAlerts] = useState<DependencyAlert[]>([]);
  const [selectedSite, setSelectedSite] = useState<WACHSSite | null>(null);
  const [siteRisks, setSiteRisks] = useState<CascadeRisk[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      await dependencyMappingService.initialize();
      setSites(dependencyMappingService.getSites());
      setStats(dependencyMappingService.getStats());
      setAlerts(dependencyMappingService.getActiveAlerts());
    } catch (error) {
      console.error('Failed to load dependency data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedSite) {
      const risks = dependencyMappingService.analyzeCascadeRisk(selectedSite.id);
      setSiteRisks(risks);
    } else {
      setSiteRisks([]);
    }
  }, [selectedSite]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleResolveAlert = async (alertId: string) => {
    await dependencyMappingService.resolveAlert(alertId);
    setAlerts(dependencyMappingService.getActiveAlerts());
    Alert.alert('Resolved', 'Alert has been marked as resolved.');
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy': return '#10B981';
      case 'degraded': return '#F59E0B';
      case 'down': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getCriticalityColor = (criticality: string): string => {
    switch (criticality) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const renderStats = () => {
    if (!stats) return null;
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <View style={{ flex: 1, minWidth: 100, backgroundColor: colors.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.primary }}>{stats.totalSites}</Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>Sites</Text>
        </View>
        <View style={{ flex: 1, minWidth: 100, backgroundColor: colors.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>{stats.totalDependencies}</Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>Dependencies</Text>
        </View>
        <View style={{ flex: 1, minWidth: 100, backgroundColor: colors.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#10B981' }}>{stats.healthyDependencies}</Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>Healthy</Text>
        </View>
        <View style={{ flex: 1, minWidth: 100, backgroundColor: colors.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#EF4444' }}>{stats.criticalRisks}</Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>Critical Risks</Text>
        </View>
      </View>
    );
  };

  const renderTabs = () => (
    <View style={{ flexDirection: 'row', marginBottom: 16, gap: 8 }}>
      {(['overview', 'sites', 'risks', 'alerts'] as TabType[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => { setActiveTab(tab); if (tab !== 'sites') setSelectedSite(null); }}
          style={{
            flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8,
            backgroundColor: activeTab === tab ? colors.primary : colors.surface,
            borderWidth: 1, borderColor: activeTab === tab ? colors.primary : colors.border,
          }}
        >
          <Text style={{ textAlign: 'center', fontSize: 13, fontWeight: '600', color: activeTab === tab ? '#FFFFFF' : colors.foreground }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}{tab === 'alerts' && alerts.length > 0 && ` (${alerts.length})`}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverviewTab = () => {
    const sitesByRegion: Record<string, WACHSSite[]> = {};
    for (const site of sites) {
      if (!sitesByRegion[site.region]) sitesByRegion[site.region] = [];
      sitesByRegion[site.region].push(site);
    }
    return (
      <View>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>Network Topology by Region</Text>
        {Object.entries(sitesByRegion).map(([region, regionSites]) => {
          const regionConfig = WACHS_REGIONS[region as keyof typeof WACHS_REGIONS];
          return (
            <View key={region} style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: regionConfig?.color || colors.border }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 8 }}>{regionConfig?.name || region}</Text>
              {regionSites.map((site) => {
                const siteDeps = dependencyMappingService.getOutboundDependencies(site.id);
                const services = dependencyMappingService.getServicesBySite(site.id);
                return (
                  <TouchableOpacity key={site.id} onPress={() => { setSelectedSite(site); setActiveTab('sites'); }} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: getStatusColor(site.status), marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>{site.name}</Text>
                      <Text style={{ fontSize: 12, color: colors.muted }}>{services.length} services - {siteDeps.length} dependencies</Text>
                    </View>
                    <Text style={{ fontSize: 16, color: colors.muted }}>→</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginTop: 16, marginBottom: 8 }}>Dependency Types</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(DEPENDENCY_TYPES).map(([type, config]) => (
            <View key={type} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: config.color + '20' }}>
              <Text style={{ fontSize: 14, marginRight: 4 }}>{config.icon}</Text>
              <Text style={{ fontSize: 12, color: config.color }}>{config.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderSitesTab = () => {
    if (selectedSite) {
      const services = dependencyMappingService.getServicesBySite(selectedSite.id);
      const outboundDeps = dependencyMappingService.getOutboundDependencies(selectedSite.id);
      const regionConfig = WACHS_REGIONS[selectedSite.region as keyof typeof WACHS_REGIONS];
      return (
        <View>
          <TouchableOpacity onPress={() => setSelectedSite(null)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 16, color: colors.primary }}>← Back to Sites</Text>
          </TouchableOpacity>
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>{selectedSite.name}</Text>
                <Text style={{ fontSize: 14, color: colors.muted }}>{selectedSite.location}</Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: getStatusColor(selectedSite.status) + '20' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: getStatusColor(selectedSite.status) }}>{selectedSite.status.toUpperCase()}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: regionConfig?.color + '20' }}>
                <Text style={{ fontSize: 11, color: regionConfig?.color }}>{regionConfig?.name}</Text>
              </View>
            </View>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 8 }}>Services ({services.length})</Text>
          {services.map((service) => {
            const serviceType = SERVICE_TYPES[service.type];
            return (
              <View key={service.id} style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>{service.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.muted }}>{service.description}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: serviceType?.color + '20' }}>
                      <Text style={{ fontSize: 10, color: serviceType?.color }}>{serviceType?.label}</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{service.uptime}% uptime</Text>
                  </View>
                </View>
              </View>
            );
          })}
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginTop: 16, marginBottom: 8 }}>Outbound Dependencies ({outboundDeps.length})</Text>
          {outboundDeps.map((dep) => {
            const targetSite = dependencyMappingService.getSite(dep.targetSiteId);
            const depType = DEPENDENCY_TYPES[dep.type];
            return (
              <View key={dep.id} style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 3, borderLeftColor: getCriticalityColor(dep.criticality) }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>→ {targetSite?.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.muted }}>{dep.description}</Text>
                  </View>
                  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: getStatusColor(dep.status) + '20' }}>
                    <Text style={{ fontSize: 10, color: getStatusColor(dep.status) }}>{dep.status}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: depType?.color + '20' }}>
                    <Text style={{ fontSize: 10, color: depType?.color }}>{depType?.icon} {depType?.label}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: colors.muted }}>{dep.latency}ms</Text>
                  {dep.failoverAvailable && <Text style={{ fontSize: 11, color: '#10B981' }}>✓ Failover</Text>}
                </View>
              </View>
            );
          })}
          {siteRisks.length > 0 && (
            <>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginTop: 16, marginBottom: 8 }}>Cascade Risks ({siteRisks.length})</Text>
              {siteRisks.map((risk) => (
                <View key={risk.id} style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: getCriticalityColor(risk.riskLevel) }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: getCriticalityColor(risk.riskLevel) }}>{risk.riskLevel.toUpperCase()} RISK</Text>
                    <Text style={{ fontSize: 12, color: colors.muted }}>{risk.estimatedImpact.toFixed(0)}% network impact</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: colors.foreground, marginBottom: 8 }}>Affects {risk.affectedSites.length} sites, {risk.affectedServices.length} services</Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Mitigation:</Text>
                  {risk.mitigationSteps.slice(0, 2).map((step, i) => (
                    <Text key={i} style={{ fontSize: 12, color: colors.muted }}>• {step}</Text>
                  ))}
                </View>
              ))}
            </>
          )}
        </View>
      );
    }
    return (
      <View>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>All Sites ({sites.length})</Text>
        {sites.map((site) => {
          const regionConfig = WACHS_REGIONS[site.region as keyof typeof WACHS_REGIONS];
          const services = dependencyMappingService.getServicesBySite(site.id);
          return (
            <TouchableOpacity key={site.id} onPress={() => setSelectedSite(site)} style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>{site.name}</Text>
                  <Text style={{ fontSize: 13, color: colors.muted }}>{site.location}</Text>
                </View>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: getStatusColor(site.status) }} />
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: regionConfig?.color + '20' }}>
                  <Text style={{ fontSize: 11, color: regionConfig?.color }}>{regionConfig?.name}</Text>
                </View>
                <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.background }}>
                  <Text style={{ fontSize: 11, color: colors.foreground }}>{services.length} services</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderRisksTab = () => {
    const allRisks: (CascadeRisk & { siteName: string })[] = [];
    for (const site of sites) {
      const risks = dependencyMappingService.analyzeCascadeRisk(site.id);
      for (const risk of risks) allRisks.push({ ...risk, siteName: site.name });
    }
    allRisks.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.riskLevel] - order[b.riskLevel];
    });
    if (allRisks.length === 0) {
      return (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>✓</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>No Cascade Risks</Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 4 }}>All dependencies have adequate failover coverage</Text>
        </View>
      );
    }
    return (
      <View>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>Cascade Failure Risks ({allRisks.length})</Text>
        {allRisks.map((risk) => {
          const triggerService = dependencyMappingService.getService(risk.triggerServiceId);
          return (
            <View key={risk.id} style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: getCriticalityColor(risk.riskLevel), borderLeftWidth: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>{risk.siteName}</Text>
                  <Text style={{ fontSize: 13, color: colors.muted }}>{triggerService?.name}</Text>
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: getCriticalityColor(risk.riskLevel) + '20' }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: getCriticalityColor(risk.riskLevel) }}>{risk.riskLevel.toUpperCase()}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.background }}>
                  <Text style={{ fontSize: 11, color: colors.foreground }}>{risk.affectedSites.length} sites affected</Text>
                </View>
                <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.background }}>
                  <Text style={{ fontSize: 11, color: colors.foreground }}>{risk.estimatedImpact.toFixed(0)}% network impact</Text>
                </View>
                {risk.hasFailover && (
                  <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#10B98120' }}>
                    <Text style={{ fontSize: 11, color: '#10B981' }}>Failover Available</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Mitigation Steps:</Text>
              {risk.mitigationSteps.map((step, i) => (
                <Text key={i} style={{ fontSize: 12, color: colors.foreground, marginLeft: 8 }}>• {step}</Text>
              ))}
            </View>
          );
        })}
      </View>
    );
  };

  const renderAlertsTab = () => {
    if (alerts.length === 0) {
      return (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>✓</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>No Active Alerts</Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 4 }}>All dependencies are operating normally</Text>
        </View>
      );
    }
    return (
      <View>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>Active Alerts ({alerts.length})</Text>
        {alerts.map((alert) => {
          const dependency = dependencyMappingService.getDependency(alert.dependencyId);
          const sourceSite = dependency ? dependencyMappingService.getSite(dependency.sourceSiteId) : null;
          const targetSite = dependency ? dependencyMappingService.getSite(dependency.targetSiteId) : null;
          const severityColor = alert.severity === 'critical' ? '#EF4444' : alert.severity === 'warning' ? '#F59E0B' : '#3B82F6';
          return (
            <View key={alert.id} style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: severityColor, borderLeftWidth: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: severityColor + '20' }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: severityColor }}>{alert.severity.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground, marginBottom: 4 }}>{alert.message}</Text>
              {sourceSite && targetSite && <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 12 }}>{sourceSite.name} → {targetSite.name}</Text>}
              <TouchableOpacity onPress={() => handleResolveAlert(alert.id)} style={{ backgroundColor: '#10B981', paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Resolve</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenContainer className="p-4">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 16, color: colors.muted }}>Loading...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: colors.foreground }}>Dependency Map</Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>WACHS site dependencies and cascade risks</Text>
        </View>
        {renderStats()}
        {renderTabs()}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'sites' && renderSitesTab()}
        {activeTab === 'risks' && renderRisksTab()}
        {activeTab === 'alerts' && renderAlertsTab()}
        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenContainer>
  );
}
