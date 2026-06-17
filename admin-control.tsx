import { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cloudInfrastructure, type Deployment } from '@/lib/services/cloud-infrastructure-service';

interface ComponentHealth {
  name: string;
  type: string;
  status: string;
  latency?: number;
  errorRate?: number;
}
import { companionControl, type ConnectedDevice, type SystemMetrics } from '@/lib/services/companion-control-service';
import { appStoreService } from '@/lib/services/app-store-service';
import { desktopCompanion } from '@/lib/services/desktop-companion-service';

type TabType = 'overview' | 'devices' | 'deployments' | 'stores' | 'desktop';

export default function AdminControlScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [systemHealth, setSystemHealth] = useState<{ overall: string; components: ComponentHealth[]; alerts: unknown[]; lastChecked: string } | null>(null);
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [health, deviceList, deploymentList] = await Promise.all([
        companionControl.getSystemHealth(),
        companionControl.getConnectedDevices(),
        Promise.resolve(cloudInfrastructure.getDeployments()),
      ]);

      setSystemHealth(health);
      setDevices(deviceList);
      setDeployments(deploymentList);

      // Get latest metrics
      const metricsData = await companionControl.getSystemMetrics();
      if (metricsData.length > 0) {
        setMetrics(metricsData[metricsData.length - 1]);
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleBroadcastSync = async () => {
    Alert.alert(
      'Broadcast Sync',
      'Send sync command to all connected devices?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            await companionControl.broadcastCommand('sync', {}, 'high');
            Alert.alert('Success', 'Sync command sent to all devices');
          },
        },
      ]
    );
  };

  const handleCreateDeployment = async () => {
    Alert.alert(
      'Create Deployment',
      'Create a new deployment for version 4.0.0?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            const deployment = await cloudInfrastructure.createDeployment('4.0.0', [
              { type: 'feature', description: 'Patient Satisfaction Surveys' },
              { type: 'feature', description: 'Infection Control Surveillance' },
              { type: 'feature', description: 'CPOE with Clinical Decision Support' },
              { type: 'feature', description: 'Production API Backend' },
              { type: 'feature', description: 'Desktop Companion Apps' },
            ]);
            setDeployments([deployment, ...deployments]);
            Alert.alert('Success', `Deployment ${deployment.id} created`);
          },
        },
      ]
    );
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#22C55E';
      case 'degraded': return '#F59E0B';
      case 'critical': return '#EF4444';
      default: return colors.muted;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#22C55E';
      case 'offline': return '#EF4444';
      case 'idle': return '#F59E0B';
      default: return colors.muted;
    }
  };

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* System Health */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>System Health</Text>
        <View style={styles.healthGrid}>
          <View style={styles.healthItem}>
            <View style={[styles.healthIndicator, { backgroundColor: getHealthColor(systemHealth?.overall || 'unknown') }]} />
            <Text style={[styles.healthLabel, { color: colors.foreground }]}>Overall</Text>
            <Text style={[styles.healthValue, { color: colors.muted }]}>{systemHealth?.overall || 'Unknown'}</Text>
          </View>
          {systemHealth?.components.slice(0, 5).map((component: ComponentHealth, index: number) => (
            <View key={index} style={styles.healthItem}>
              <View style={[styles.healthIndicator, { backgroundColor: getHealthColor(component.status) }]} />
              <Text style={[styles.healthLabel, { color: colors.foreground }]}>{component.name}</Text>
              <Text style={[styles.healthValue, { color: colors.muted }]}>{component.latency ? `${component.latency}ms` : component.status}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Stats */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Quick Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{devices.filter(d => d.status === 'online').length}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Online Devices</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{metrics?.activeUsers || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Active Users</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{metrics?.requests?.total || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>API Requests</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{deployments.length}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Deployments</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleBroadcastSync}
          >
            <Text style={styles.actionButtonText}>Broadcast Sync</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#22C55E' }]}
            onPress={handleCreateDeployment}
          >
            <Text style={styles.actionButtonText}>New Deployment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#F59E0B' }]}
            onPress={() => Alert.alert('Health Check', 'Running system health check...')}
          >
            <Text style={styles.actionButtonText}>Health Check</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#8B5CF6' }]}
            onPress={() => Alert.alert('Generate Report', 'Generating system report...')}
          >
            <Text style={styles.actionButtonText}>Generate Report</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderDevicesTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Connected Devices ({devices.length})</Text>
          <TouchableOpacity onPress={handleBroadcastSync}>
            <Text style={[styles.linkText, { color: colors.primary }]}>Sync All</Text>
          </TouchableOpacity>
        </View>
        {devices.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.muted }]}>No devices connected</Text>
        ) : (
          devices.map((device, index) => (
            <View key={device.id} style={[styles.deviceItem, index < devices.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={styles.deviceInfo}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(device.status) }]} />
                <View style={styles.deviceDetails}>
                  <Text style={[styles.deviceName, { color: colors.foreground }]}>{device.name}</Text>
                  <Text style={[styles.deviceMeta, { color: colors.muted }]}>
                    {device.platform} • {device.type} • Last seen: {new Date(device.lastSeen).toLocaleTimeString()}
                  </Text>
                </View>
              </View>
              <View style={styles.deviceActions}>
                <TouchableOpacity
                  style={[styles.deviceActionButton, { backgroundColor: colors.primary + '20' }]}
                  onPress={() => companionControl.sendCommand([device.id], 'sync')}
                >
                  <Text style={[styles.deviceActionText, { color: colors.primary }]}>Sync</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );

  const renderDeploymentsTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Deployments</Text>
          <TouchableOpacity onPress={handleCreateDeployment}>
            <Text style={[styles.linkText, { color: colors.primary }]}>+ New</Text>
          </TouchableOpacity>
        </View>
        {deployments.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.muted }]}>No deployments yet</Text>
        ) : (
          deployments.map((deployment, index) => (
            <View key={deployment.id} style={[styles.deploymentItem, index < deployments.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={styles.deploymentHeader}>
                <Text style={[styles.deploymentVersion, { color: colors.foreground }]}>v{deployment.version}</Text>
                <View style={[styles.statusBadge, { backgroundColor: deployment.status === 'success' ? '#22C55E' : deployment.status === 'failed' ? '#EF4444' : '#F59E0B' }]}>
                  <Text style={styles.statusBadgeText}>{deployment.status}</Text>
                </View>
              </View>
              <Text style={[styles.deploymentMeta, { color: colors.muted }]}>
                {deployment.environment} • {new Date(deployment.startedAt).toLocaleDateString()}
              </Text>
              <Text style={[styles.deploymentChanges, { color: colors.muted }]}>
                {deployment.changes.length} changes
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Cloud Config */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Cloud Configuration</Text>
        <View style={styles.configGrid}>
          <View style={styles.configItem}>
            <Text style={[styles.configLabel, { color: colors.muted }]}>Provider</Text>
            <Text style={[styles.configValue, { color: colors.foreground }]}>{cloudInfrastructure.getCloudConfig().provider.toUpperCase()}</Text>
          </View>
          <View style={styles.configItem}>
            <Text style={[styles.configLabel, { color: colors.muted }]}>Region</Text>
            <Text style={[styles.configValue, { color: colors.foreground }]}>{cloudInfrastructure.getCloudConfig().region}</Text>
          </View>
          <View style={styles.configItem}>
            <Text style={[styles.configLabel, { color: colors.muted }]}>Environment</Text>
            <Text style={[styles.configValue, { color: colors.foreground }]}>{cloudInfrastructure.getCloudConfig().environment}</Text>
          </View>
          <View style={styles.configItem}>
            <Text style={[styles.configLabel, { color: colors.muted }]}>Auto-Scaling</Text>
            <Text style={[styles.configValue, { color: colors.foreground }]}>{cloudInfrastructure.getCloudConfig().autoScaling.enabled ? 'Enabled' : 'Disabled'}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStoresTab = () => {
    const appStoreMetadata = appStoreService.getAppStoreMetadata();
    const playStoreMetadata = appStoreService.getPlayStoreMetadata();
    const checklist = appStoreService.getSubmissionChecklist();
    const completedCount = checklist.filter(item => item.completed).length;

    return (
      <View style={styles.tabContent}>
        {/* App Store */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Apple App Store</Text>
          <View style={styles.storeInfo}>
            <View style={styles.storeRow}>
              <Text style={[styles.storeLabel, { color: colors.muted }]}>App Name</Text>
              <Text style={[styles.storeValue, { color: colors.foreground }]}>{appStoreMetadata.name}</Text>
            </View>
            <View style={styles.storeRow}>
              <Text style={[styles.storeLabel, { color: colors.muted }]}>Bundle ID</Text>
              <Text style={[styles.storeValue, { color: colors.foreground }]}>{appStoreMetadata.bundleId}</Text>
            </View>
            <View style={styles.storeRow}>
              <Text style={[styles.storeLabel, { color: colors.muted }]}>Version</Text>
              <Text style={[styles.storeValue, { color: colors.foreground }]}>{appStoreMetadata.version}</Text>
            </View>
            <View style={styles.storeRow}>
              <Text style={[styles.storeLabel, { color: colors.muted }]}>Category</Text>
              <Text style={[styles.storeValue, { color: colors.foreground }]}>{appStoreMetadata.primaryCategory}</Text>
            </View>
            <View style={styles.storeRow}>
              <Text style={[styles.storeLabel, { color: colors.muted }]}>Age Rating</Text>
              <Text style={[styles.storeValue, { color: colors.foreground }]}>{appStoreMetadata.ageRating.rating}</Text>
            </View>
          </View>
        </View>

        {/* Play Store */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Google Play Store</Text>
          <View style={styles.storeInfo}>
            <View style={styles.storeRow}>
              <Text style={[styles.storeLabel, { color: colors.muted }]}>App Title</Text>
              <Text style={[styles.storeValue, { color: colors.foreground }]}>{playStoreMetadata.title}</Text>
            </View>
            <View style={styles.storeRow}>
              <Text style={[styles.storeLabel, { color: colors.muted }]}>Package Name</Text>
              <Text style={[styles.storeValue, { color: colors.foreground }]}>{playStoreMetadata.packageName}</Text>
            </View>
            <View style={styles.storeRow}>
              <Text style={[styles.storeLabel, { color: colors.muted }]}>Category</Text>
              <Text style={[styles.storeValue, { color: colors.foreground }]}>{playStoreMetadata.category}</Text>
            </View>
            <View style={styles.storeRow}>
              <Text style={[styles.storeLabel, { color: colors.muted }]}>Content Rating</Text>
              <Text style={[styles.storeValue, { color: colors.foreground }]}>{playStoreMetadata.contentRating.rating}</Text>
            </View>
          </View>
        </View>

        {/* Submission Checklist */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Submission Checklist ({completedCount}/{checklist.length})</Text>
          {checklist.slice(0, 8).map((item, index) => (
            <View key={index} style={styles.checklistItem}>
              <View style={[styles.checkbox, item.completed && { backgroundColor: '#22C55E' }]}>
                {item.completed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.checklistText, { color: item.completed ? colors.foreground : colors.muted }]}>
                {item.item} {item.required && <Text style={{ color: '#EF4444' }}>*</Text>}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderDesktopTab = () => {
    const desktopConfig = desktopCompanion.getConfig();
    const shortcuts = desktopCompanion.getShortcuts();

    return (
      <View style={styles.tabContent}>
        {/* Desktop App Info */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Desktop Companion App</Text>
          <View style={styles.storeInfo}>
            <View style={styles.storeRow}>
              <Text style={[styles.storeLabel, { color: colors.muted }]}>Product Name</Text>
              <Text style={[styles.storeValue, { color: colors.foreground }]}>{desktopConfig.productName}</Text>
            </View>
            <View style={styles.storeRow}>
              <Text style={[styles.storeLabel, { color: colors.muted }]}>Version</Text>
              <Text style={[styles.storeValue, { color: colors.foreground }]}>{desktopConfig.version}</Text>
            </View>
            <View style={styles.storeRow}>
              <Text style={[styles.storeLabel, { color: colors.muted }]}>App ID</Text>
              <Text style={[styles.storeValue, { color: colors.foreground }]}>{desktopConfig.appId}</Text>
            </View>
          </View>
        </View>

        {/* Build Targets */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Build Targets</Text>
          <View style={styles.targetGrid}>
            <View style={[styles.targetItem, { backgroundColor: colors.background }]}>
              <Text style={[styles.targetIcon, { color: colors.foreground }]}>🍎</Text>
              <Text style={[styles.targetName, { color: colors.foreground }]}>macOS</Text>
              <Text style={[styles.targetFormats, { color: colors.muted }]}>{desktopConfig.build.mac.target.join(', ')}</Text>
            </View>
            <View style={[styles.targetItem, { backgroundColor: colors.background }]}>
              <Text style={[styles.targetIcon, { color: colors.foreground }]}>🪟</Text>
              <Text style={[styles.targetName, { color: colors.foreground }]}>Windows</Text>
              <Text style={[styles.targetFormats, { color: colors.muted }]}>{desktopConfig.build.win.target.join(', ')}</Text>
            </View>
            <View style={[styles.targetItem, { backgroundColor: colors.background }]}>
              <Text style={[styles.targetIcon, { color: colors.foreground }]}>🐧</Text>
              <Text style={[styles.targetName, { color: colors.foreground }]}>Linux</Text>
              <Text style={[styles.targetFormats, { color: colors.muted }]}>{desktopConfig.build.linux.target.join(', ')}</Text>
            </View>
          </View>
        </View>

        {/* Keyboard Shortcuts */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Keyboard Shortcuts</Text>
          {shortcuts.slice(0, 6).map((shortcut, index) => (
            <View key={shortcut.id} style={[styles.shortcutItem, index < 5 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.shortcutName, { color: colors.foreground }]}>{shortcut.name}</Text>
                <Text style={[styles.shortcutDesc, { color: colors.muted }]}>{shortcut.description}</Text>
              </View>
              <View style={[styles.shortcutKey, { backgroundColor: colors.background }]}>
                <Text style={[styles.shortcutKeyText, { color: colors.foreground }]}>{shortcut.accelerator}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Features */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Features</Text>
          <View style={styles.featuresGrid}>
            {Object.entries(desktopConfig.features).slice(0, 8).map(([key, value]) => (
              <View key={key} style={styles.featureItem}>
                <View style={[styles.featureIndicator, { backgroundColor: value ? '#22C55E' : colors.muted }]} />
                <Text style={[styles.featureText, { color: colors.foreground }]}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'devices', label: 'Devices' },
    { id: 'deployments', label: 'Deploy' },
    { id: 'stores', label: 'Stores' },
    { id: 'desktop', label: 'Desktop' },
  ];

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Admin Control</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Production Management</Text>
      </View>

      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarContent}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === tab.id ? colors.primary : colors.muted },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'devices' && renderDevicesTab()}
        {activeTab === 'deployments' && renderDeploymentsTab()}
        {activeTab === 'stores' && renderStoresTab()}
        {activeTab === 'desktop' && renderDesktopTab()}
        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  tabBar: {
    borderBottomWidth: 1,
  },
  tabBarContent: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  healthItem: {
    width: '30%',
    alignItems: 'center',
    padding: 8,
  },
  healthIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  healthLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  healthValue: {
    fontSize: 11,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    padding: 12,
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
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: '48%',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 14,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '500',
  },
  deviceMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  deviceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  deviceActionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  deviceActionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deploymentItem: {
    paddingVertical: 12,
  },
  deploymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deploymentVersion: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  deploymentMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  deploymentChanges: {
    fontSize: 12,
    marginTop: 2,
  },
  configGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  configItem: {
    width: '50%',
    paddingVertical: 8,
  },
  configLabel: {
    fontSize: 12,
  },
  configValue: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  storeInfo: {
    gap: 8,
  },
  storeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  storeLabel: {
    fontSize: 13,
  },
  storeValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  checklistText: {
    fontSize: 13,
  },
  targetGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  targetItem: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  targetIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  targetName: {
    fontSize: 13,
    fontWeight: '600',
  },
  targetFormats: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  shortcutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  shortcutName: {
    fontSize: 13,
    fontWeight: '500',
  },
  shortcutDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  shortcutKey: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  shortcutKeyText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  featureIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  featureText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
});
