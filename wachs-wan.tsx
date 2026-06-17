/**
 * WACHS WAN Integration Screen
 * WA Country Health Service Wide Area Network configuration
 * MediVac One v5.7
 */

import { useState, useEffect, useCallback } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { 
  wachsWANService, 
  WACHSConfig, 
  WACHSSite,
  WANConnection,
  ConnectionLog,
  WACHSRegion,
  AuthMethod,
  WACHS_REGIONS,
  AUTH_METHODS
} from "@/lib/services/wachs-wan-service";

type TabType = 'config' | 'sites' | 'monitor' | 'logs';

export default function WACHSWANScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('config');
  const [config, setConfig] = useState<WACHSConfig | null>(null);
  const [sites, setSites] = useState<WACHSSite[]>([]);
  const [connections, setConnections] = useState<WANConnection[]>([]);
  const [logs, setLogs] = useState<ConnectionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);

  // Form state
  const [orgId, setOrgId] = useState('');
  const [orgName, setOrgName] = useState('');
  const [region, setRegion] = useState<WACHSRegion>('south_west');
  const [primaryGateway, setPrimaryGateway] = useState('');
  const [secondaryGateway, setSecondaryGateway] = useState('');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('certificate');
  const [apiKey, setApiKey] = useState('');
  const [certificatePath, setCertificatePath] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await wachsWANService.initialize();
      const cfg = wachsWANService.getConfig();
      setConfig(cfg);
      setOrgId(cfg.organizationId);
      setOrgName(cfg.organizationName);
      setRegion(cfg.region);
      setPrimaryGateway(cfg.primaryGateway);
      setSecondaryGateway(cfg.secondaryGateway || '');
      setAuthMethod(cfg.authMethod);
      setApiKey(cfg.apiKey || '');
      setCertificatePath(cfg.certificatePath || '');
      setSites(wachsWANService.getSites());
      setConnections(wachsWANService.getConnections());
      setLogs(wachsWANService.getLogs());
    } catch (error) {
      console.error('Failed to load WACHS config:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveConfig = async () => {
    try {
      await wachsWANService.updateConfig({
        organizationId: orgId,
        organizationName: orgName,
        region,
        primaryGateway,
        secondaryGateway: secondaryGateway || undefined,
        authMethod,
        apiKey: apiKey || undefined,
        certificatePath: certificatePath || undefined,
      });
      Alert.alert('Success', 'Configuration saved');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to save configuration');
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const result = await wachsWANService.connect();
      if (result.success) {
        Alert.alert('Connected', result.message);
      } else {
        Alert.alert('Failed', result.message);
      }
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to connect');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect',
      'Are you sure you want to disconnect from WACHS WAN?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await wachsWANService.disconnect();
            loadData();
          },
        },
      ]
    );
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const result = await wachsWANService.testConnection();
      Alert.alert(result.success ? 'Success' : 'Failed', result.message);
    } catch (error) {
      Alert.alert('Error', 'Failed to test connection');
    } finally {
      setTesting(false);
    }
  };

  const handleRefreshConnections = async () => {
    await wachsWANService.refreshSiteConnections();
    loadData();
  };

  const stats = wachsWANService.getStatistics();

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'connected': return colors.success;
      case 'connecting': return colors.warning;
      case 'degraded': return '#F59E0B';
      case 'error':
      case 'disconnected': return colors.error;
      default: return colors.muted;
    }
  };

  const getRegionColor = (reg: WACHSRegion): string => {
    return WACHS_REGIONS[reg].color;
  };

  const renderTabs = () => (
    <View className="flex-row mb-4 bg-surface rounded-xl p-1">
      {(['config', 'sites', 'monitor', 'logs'] as TabType[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          className={`flex-1 py-3 rounded-lg ${activeTab === tab ? 'bg-primary' : ''}`}
        >
          <Text className={`text-center text-sm font-medium ${activeTab === tab ? 'text-white' : 'text-muted'}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderConfigTab = () => (
    <View>
      {/* Connection Status */}
      <View className="bg-surface rounded-xl p-4 mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-3">
            <View className="bg-[#1E40AF] p-3 rounded-xl">
              <IconSymbol name="network" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text className="text-foreground font-semibold">WACHS WAN</Text>
              <Text style={{ color: getStatusColor(config?.status || 'disconnected') }} className="text-sm capitalize">
                {config?.status || 'Disconnected'}
              </Text>
            </View>
          </View>
          {config?.status === 'connected' && (
            <TouchableOpacity
              onPress={handleTestConnection}
              disabled={testing}
              className="bg-primary/10 px-4 py-2 rounded-lg"
            >
              <Text style={{ color: colors.primary }} className="font-medium">
                {testing ? 'Testing...' : 'Test'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {config?.lastConnected && (
          <Text className="text-muted text-sm">
            Last connected: {new Date(config.lastConnected).toLocaleString()}
          </Text>
        )}
      </View>

      {/* Organization Configuration */}
      <View className="bg-surface rounded-xl p-4 mb-4">
        <Text className="text-foreground font-semibold mb-3">Organization</Text>
        
        <View className="mb-3">
          <Text className="text-muted text-sm mb-1">Organization ID</Text>
          <TextInput
            value={orgId}
            onChangeText={setOrgId}
            placeholder="e.g., WACHS-001"
            placeholderTextColor={colors.muted}
            className="bg-background text-foreground p-3 rounded-lg"
            autoCapitalize="none"
          />
        </View>

        <View className="mb-3">
          <Text className="text-muted text-sm mb-1">Organization Name</Text>
          <TextInput
            value={orgName}
            onChangeText={setOrgName}
            placeholder="e.g., WA Country Health Service"
            placeholderTextColor={colors.muted}
            className="bg-background text-foreground p-3 rounded-lg"
          />
        </View>

        <View className="mb-3">
          <Text className="text-muted text-sm mb-2">Region</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {(Object.keys(WACHS_REGIONS) as WACHSRegion[]).map((reg) => {
                const regConfig = WACHS_REGIONS[reg];
                return (
                  <TouchableOpacity
                    key={reg}
                    onPress={() => setRegion(reg)}
                    style={region === reg ? { backgroundColor: regConfig.color } : undefined}
                    className={`px-3 py-2 rounded-lg ${region !== reg ? 'bg-background' : ''}`}
                  >
                    <Text className={region === reg ? 'text-white font-medium' : 'text-muted'}>
                      {regConfig.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Network Configuration */}
      <View className="bg-surface rounded-xl p-4 mb-4">
        <Text className="text-foreground font-semibold mb-3">Network</Text>
        
        <View className="mb-3">
          <Text className="text-muted text-sm mb-1">Primary Gateway *</Text>
          <TextInput
            value={primaryGateway}
            onChangeText={setPrimaryGateway}
            placeholder="e.g., 10.0.0.1 or gateway.wachs.health.wa.gov.au"
            placeholderTextColor={colors.muted}
            className="bg-background text-foreground p-3 rounded-lg"
            autoCapitalize="none"
          />
        </View>

        <View className="mb-3">
          <Text className="text-muted text-sm mb-1">Secondary Gateway (Failover)</Text>
          <TextInput
            value={secondaryGateway}
            onChangeText={setSecondaryGateway}
            placeholder="Optional backup gateway"
            placeholderTextColor={colors.muted}
            className="bg-background text-foreground p-3 rounded-lg"
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Authentication */}
      <View className="bg-surface rounded-xl p-4 mb-4">
        <Text className="text-foreground font-semibold mb-3">Authentication</Text>
        
        <View className="mb-3">
          <Text className="text-muted text-sm mb-2">Method</Text>
          <View className="flex-row flex-wrap gap-2">
            {(Object.keys(AUTH_METHODS) as AuthMethod[]).map((method) => {
              const methodConfig = AUTH_METHODS[method];
              return (
                <TouchableOpacity
                  key={method}
                  onPress={() => setAuthMethod(method)}
                  className={`px-3 py-2 rounded-lg ${authMethod === method ? 'bg-primary' : 'bg-background'}`}
                >
                  <Text className={authMethod === method ? 'text-white font-medium' : 'text-muted'}>
                    {methodConfig.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text className="text-muted text-xs mt-2">
            {AUTH_METHODS[authMethod].description}
          </Text>
        </View>

        {authMethod === 'api_key' && (
          <View className="mb-3">
            <Text className="text-muted text-sm mb-1">API Key</Text>
            <TextInput
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="Enter API key"
              placeholderTextColor={colors.muted}
              className="bg-background text-foreground p-3 rounded-lg"
              secureTextEntry
            />
          </View>
        )}

        {authMethod === 'certificate' && (
          <View className="mb-3">
            <Text className="text-muted text-sm mb-1">Certificate Path</Text>
            <TextInput
              value={certificatePath}
              onChangeText={setCertificatePath}
              placeholder="/path/to/certificate.pem"
              placeholderTextColor={colors.muted}
              className="bg-background text-foreground p-3 rounded-lg"
              autoCapitalize="none"
            />
          </View>
        )}

        <TouchableOpacity
          onPress={handleSaveConfig}
          className="bg-primary/10 py-3 rounded-lg"
        >
          <Text style={{ color: colors.primary }} className="text-center font-medium">Save Configuration</Text>
        </TouchableOpacity>
      </View>

      {/* Connect/Disconnect Button */}
      {config?.status === 'connected' ? (
        <TouchableOpacity
          onPress={handleDisconnect}
          className="py-4 rounded-xl"
          style={{ backgroundColor: colors.error + '20' }}
        >
          <Text style={{ color: colors.error }} className="text-center font-semibold">Disconnect from WACHS WAN</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={handleConnect}
          disabled={connecting}
          className="bg-[#1E40AF] py-4 rounded-xl"
        >
          <Text className="text-white text-center font-semibold">
            {connecting ? 'Connecting...' : 'Connect to WACHS WAN'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSitesTab = () => (
    <View>
      <View className="flex-row flex-wrap gap-2 mb-4">
        <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3">
          <Text className="text-muted text-xs">Total Sites</Text>
          <Text className="text-foreground text-xl font-bold">{stats.totalSites}</Text>
        </View>
        <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3">
          <Text className="text-muted text-xs">Connected</Text>
          <Text style={{ color: colors.success }} className="text-xl font-bold">{stats.connectedSites}</Text>
        </View>
        <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3">
          <Text className="text-muted text-xs">Degraded</Text>
          <Text style={{ color: '#F59E0B' }} className="text-xl font-bold">{stats.degradedSites}</Text>
        </View>
        <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3">
          <Text className="text-muted text-xs">Error</Text>
          <Text style={{ color: colors.error }} className="text-xl font-bold">{stats.errorSites}</Text>
        </View>
      </View>

      {sites.map((site) => (
        <View key={site.id} className="bg-surface rounded-xl p-4 mb-3">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-foreground font-semibold">{site.name}</Text>
                <View 
                  style={{ backgroundColor: getStatusColor(site.status) + '20' }}
                  className="px-2 py-0.5 rounded"
                >
                  <Text style={{ color: getStatusColor(site.status) }} className="text-xs capitalize">
                    {site.status}
                  </Text>
                </View>
              </View>
              <Text className="text-muted text-sm">{site.code} • {site.address}</Text>
            </View>
            <View 
              style={{ backgroundColor: getRegionColor(site.region) + '20' }}
              className="px-2 py-1 rounded"
            >
              <Text style={{ color: getRegionColor(site.region) }} className="text-xs">
                {WACHS_REGIONS[site.region].label}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-4 mb-2">
            <View>
              <Text className="text-muted text-xs">Latency</Text>
              <Text className="text-foreground font-medium">{site.latency || '-'}ms</Text>
            </View>
            <View>
              <Text className="text-muted text-xs">Bandwidth</Text>
              <Text className="text-foreground font-medium">{site.bandwidth || '-'}Mbps</Text>
            </View>
            <View>
              <Text className="text-muted text-xs">VLAN</Text>
              <Text className="text-foreground font-medium">{site.vlanId}</Text>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-1">
            {site.services.map((service, index) => (
              <View key={index} className="bg-background px-2 py-0.5 rounded">
                <Text className="text-muted text-xs">{service}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );

  const renderMonitorTab = () => (
    <View>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-foreground text-lg font-bold">Connection Monitor</Text>
        <TouchableOpacity
          onPress={handleRefreshConnections}
          className="bg-primary/10 px-4 py-2 rounded-lg"
        >
          <Text style={{ color: colors.primary }} className="font-medium">Refresh</Text>
        </TouchableOpacity>
      </View>

      {!stats.isConnected ? (
        <View className="bg-surface rounded-xl p-8 items-center">
          <IconSymbol name="network" size={48} color={colors.muted} />
          <Text className="text-muted mt-4 text-center">Not connected to WACHS WAN</Text>
          <Text className="text-muted text-sm text-center mt-1">
            Connect to view site connections
          </Text>
        </View>
      ) : connections.length === 0 ? (
        <View className="bg-surface rounded-xl p-8 items-center">
          <IconSymbol name="network" size={48} color={colors.muted} />
          <Text className="text-muted mt-4 text-center">No active connections</Text>
        </View>
      ) : (
        connections.map((conn) => (
          <View key={conn.id} className="bg-surface rounded-xl p-4 mb-3">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-foreground font-semibold">{conn.siteName}</Text>
              <View 
                style={{ backgroundColor: getStatusColor(conn.status) + '20' }}
                className="px-2 py-1 rounded"
              >
                <Text style={{ color: getStatusColor(conn.status) }} className="text-xs capitalize">
                  {conn.status}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-4 mb-2">
              <View>
                <Text className="text-muted text-xs">Latency</Text>
                <Text className="text-foreground font-medium">{conn.latency}ms</Text>
              </View>
              <View>
                <Text className="text-muted text-xs">Packet Loss</Text>
                <Text className="text-foreground font-medium">{conn.packetLoss.toFixed(2)}%</Text>
              </View>
              <View>
                <Text className="text-muted text-xs">Uptime</Text>
                <Text className="text-foreground font-medium">{conn.uptime.toFixed(1)}%</Text>
              </View>
            </View>

            <View className="flex-row items-center gap-4">
              <View>
                <Text className="text-muted text-xs">Upload</Text>
                <Text className="text-foreground font-medium">{conn.bandwidth.upload.toFixed(0)}Mbps</Text>
              </View>
              <View>
                <Text className="text-muted text-xs">Download</Text>
                <Text className="text-foreground font-medium">{conn.bandwidth.download.toFixed(0)}Mbps</Text>
              </View>
              <View>
                <Text className="text-muted text-xs">Protocol</Text>
                <Text className="text-foreground font-medium uppercase">{conn.protocol}</Text>
              </View>
            </View>

            {conn.errors.length > 0 && (
              <View className="mt-2 bg-error/10 p-2 rounded">
                {conn.errors.map((error, index) => (
                  <Text key={index} style={{ color: colors.error }} className="text-sm">{error}</Text>
                ))}
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );

  const renderLogsTab = () => (
    <View>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-foreground text-lg font-bold">Connection Logs</Text>
        {logs.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Clear Logs', 'Clear all connection logs?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: async () => {
                  await wachsWANService.clearLogs();
                  loadData();
                }},
              ]);
            }}
            className="px-3 py-1 rounded-lg"
            style={{ backgroundColor: colors.error + '20' }}
          >
            <Text style={{ color: colors.error }} className="text-sm">Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {logs.length === 0 ? (
        <View className="bg-surface rounded-xl p-8 items-center">
          <IconSymbol name="doc.fill" size={48} color={colors.muted} />
          <Text className="text-muted mt-4 text-center">No logs yet</Text>
        </View>
      ) : (
        logs.slice(0, 50).map((log) => {
          const eventColors: Record<string, string> = {
            connect: colors.success,
            disconnect: colors.error,
            error: colors.error,
            warning: '#F59E0B',
            info: colors.primary,
          };

          return (
            <View key={log.id} className="bg-surface rounded-xl p-3 mb-2">
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center gap-2">
                  <View 
                    style={{ backgroundColor: eventColors[log.event] + '20' }}
                    className="px-2 py-0.5 rounded"
                  >
                    <Text style={{ color: eventColors[log.event] }} className="text-xs capitalize">
                      {log.event}
                    </Text>
                  </View>
                  {log.siteName && (
                    <Text className="text-muted text-sm">{log.siteName}</Text>
                  )}
                </View>
                <Text className="text-muted text-xs">
                  {new Date(log.timestamp).toLocaleString()}
                </Text>
              </View>
              <Text className="text-foreground text-sm">{log.message}</Text>
            </View>
          );
        })
      )}
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Loading WACHS WAN configuration...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-foreground text-2xl font-bold">WACHS WAN</Text>
            <Text className="text-muted">WA Country Health Service Network</Text>
          </View>
          <View className="bg-[#1E40AF] p-3 rounded-full">
            <IconSymbol name="network" size={24} color="#FFFFFF" />
          </View>
        </View>

        {renderTabs()}

        {activeTab === 'config' && renderConfigTab()}
        {activeTab === 'sites' && renderSitesTab()}
        {activeTab === 'monitor' && renderMonitorTab()}
        {activeTab === 'logs' && renderLogsTab()}

        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
