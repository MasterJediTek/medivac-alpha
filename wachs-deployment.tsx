/**
 * WACHS Deployment Manager Screen
 * Full deployment workflow for WACHS sites
 * MediVac One v6.0
 */

import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { 
  wachsDeploymentService, 
  Deployment, 
  DeploymentPackage,
  PACKAGE_TYPES,
  DeploymentStatus
} from "@/lib/services/wachs-deployment-service";

type TabType = 'deployments' | 'packages' | 'create' | 'analytics';

const STATUS_COLORS: Record<DeploymentStatus, string> = {
  pending: '#6B7280',
  in_progress: '#3B82F6',
  completed: '#10B981',
  failed: '#EF4444',
  rolled_back: '#F59E0B',
  scheduled: '#8B5CF6',
};

const SAMPLE_SITES = [
  { id: 'site_broome', name: 'Broome Hospital', region: 'kimberley' },
  { id: 'site_karratha', name: 'Karratha Health Campus', region: 'pilbara' },
  { id: 'site_geraldton', name: 'Geraldton Hospital', region: 'midwest' },
  { id: 'site_kalgoorlie', name: 'Kalgoorlie Hospital', region: 'goldfields' },
  { id: 'site_bunbury', name: 'Bunbury Hospital', region: 'southwest' },
  { id: 'site_albany', name: 'Albany Health Campus', region: 'greatSouthern' },
];

export default function WACHSDeploymentScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('deployments');
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [packages, setPackages] = useState<DeploymentPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  
  // Create deployment state
  const [newDeployment, setNewDeployment] = useState({
    name: '',
    description: '',
    packageId: '',
    targetType: 'all_sites' as 'single_site' | 'region' | 'all_sites',
    selectedSites: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await wachsDeploymentService.initialize();
    setDeployments(wachsDeploymentService.getDeployments());
    setPackages(wachsDeploymentService.getPackages());
    setLoading(false);
  };

  const handleStartDeployment = async (id: string) => {
    Alert.alert('Start Deployment', 'Are you sure you want to start this deployment?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Start', 
        onPress: async () => {
          await wachsDeploymentService.startDeployment(id);
          loadData();
          Alert.alert('Success', 'Deployment started');
        }
      },
    ]);
  };

  const handleRollback = async (id: string) => {
    Alert.alert('Rollback Deployment', 'This will revert all changes. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Rollback', 
        style: 'destructive',
        onPress: async () => {
          await wachsDeploymentService.rollbackDeployment(id);
          loadData();
          setSelectedDeployment(null);
          Alert.alert('Success', 'Deployment rolled back');
        }
      },
    ]);
  };

  const handleApprovePackage = async (id: string) => {
    await wachsDeploymentService.approvePackage(id, 'Current User');
    loadData();
    Alert.alert('Success', 'Package approved for deployment');
  };

  const handleCreateDeployment = async () => {
    if (!newDeployment.name.trim()) {
      Alert.alert('Error', 'Please enter a deployment name');
      return;
    }
    if (!newDeployment.packageId) {
      Alert.alert('Error', 'Please select a package');
      return;
    }

    const targetSites = newDeployment.targetType === 'all_sites' 
      ? SAMPLE_SITES.map(s => s.id)
      : newDeployment.selectedSites;

    if (targetSites.length === 0) {
      Alert.alert('Error', 'Please select at least one target site');
      return;
    }

    await wachsDeploymentService.createDeployment({
      name: newDeployment.name,
      description: newDeployment.description,
      packageId: newDeployment.packageId,
      target: newDeployment.targetType,
      targetSites,
    });

    setNewDeployment({
      name: '',
      description: '',
      packageId: '',
      targetType: 'all_sites',
      selectedSites: [],
    });
    setActiveTab('deployments');
    loadData();
    Alert.alert('Success', 'Deployment created');
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleSite = (siteId: string) => {
    setNewDeployment(prev => ({
      ...prev,
      selectedSites: prev.selectedSites.includes(siteId)
        ? prev.selectedSites.filter(s => s !== siteId)
        : [...prev.selectedSites, siteId]
    }));
  };

  const renderDeployments = () => (
    <View className="gap-4">
      {selectedDeployment ? (
        <View className="gap-4">
          <TouchableOpacity
            onPress={() => setSelectedDeployment(null)}
            className="flex-row items-center gap-2"
          >
            <IconSymbol name="chevron.left" size={20} color={colors.primary} />
            <Text className="text-primary">Back to Deployments</Text>
          </TouchableOpacity>

          <View className="bg-surface rounded-xl p-4 border border-border">
            <View className="flex-row items-start justify-between mb-3">
              <View className="flex-1">
                <Text className="text-xl font-bold text-foreground">{selectedDeployment.name}</Text>
                {selectedDeployment.description && (
                  <Text className="text-muted mt-1">{selectedDeployment.description}</Text>
                )}
              </View>
              <View 
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[selectedDeployment.status] + '20' }}
              >
                <Text style={{ color: STATUS_COLORS[selectedDeployment.status] }}>
                  {selectedDeployment.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-2 mb-4">
              <View className="px-2 py-1 rounded bg-background">
                <Text className="text-muted text-sm">{selectedDeployment.packageName} v{selectedDeployment.packageVersion}</Text>
              </View>
              <View className="px-2 py-1 rounded bg-background">
                <Text className="text-muted text-sm">{selectedDeployment.targetSites.length} sites</Text>
              </View>
            </View>

            {selectedDeployment.status === 'in_progress' && (
              <View className="mb-4">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-muted text-sm">Progress</Text>
                  <Text className="text-foreground font-medium">{selectedDeployment.progress}%</Text>
                </View>
                <View className="h-2 bg-background rounded-full overflow-hidden">
                  <View 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${selectedDeployment.progress}%`,
                      backgroundColor: colors.primary 
                    }}
                  />
                </View>
              </View>
            )}
          </View>

          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="font-semibold text-foreground mb-3">Site Results</Text>
            {selectedDeployment.results.map(result => (
              <View key={result.siteId} className="flex-row items-center justify-between py-3 border-b border-border">
                <View className="flex-row items-center gap-3">
                  <View 
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      backgroundColor: result.status === 'success' ? '#10B981' :
                                       result.status === 'failed' ? '#EF4444' :
                                       result.status === 'in_progress' ? '#3B82F6' : '#6B7280'
                    }}
                  />
                  <Text className="text-foreground">{result.siteName}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-muted text-sm capitalize">{result.status.replace('_', ' ')}</Text>
                  {result.duration && (
                    <Text className="text-muted text-xs">{Math.round(result.duration / 60)}m</Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {selectedDeployment.status === 'pending' && (
            <TouchableOpacity
              onPress={() => handleStartDeployment(selectedDeployment.id)}
              className="bg-primary py-3 rounded-xl"
            >
              <Text className="text-center text-white font-semibold">Start Deployment</Text>
            </TouchableOpacity>
          )}

          {selectedDeployment.rollbackAvailable && (
            <TouchableOpacity
              onPress={() => handleRollback(selectedDeployment.id)}
              className="py-3 rounded-xl border border-error"
            >
              <Text className="text-center text-error font-semibold">Rollback Deployment</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-semibold text-foreground">Deployments</Text>
            <TouchableOpacity
              onPress={() => setActiveTab('create')}
              className="bg-primary px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-medium">+ New</Text>
            </TouchableOpacity>
          </View>

          {deployments.map(deployment => (
            <TouchableOpacity
              key={deployment.id}
              onPress={() => setSelectedDeployment(deployment)}
              className="bg-surface rounded-xl p-4 border border-border"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">{deployment.name}</Text>
                  <Text className="text-muted text-sm mt-1">
                    {deployment.packageName} v{deployment.packageVersion}
                  </Text>
                </View>
                <View 
                  className="px-2 py-1 rounded"
                  style={{ backgroundColor: STATUS_COLORS[deployment.status] + '20' }}
                >
                  <Text style={{ color: STATUS_COLORS[deployment.status], fontSize: 11 }}>
                    {deployment.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              {deployment.status === 'in_progress' && (
                <View className="mt-3">
                  <View className="h-2 bg-background rounded-full overflow-hidden">
                    <View 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${deployment.progress}%`,
                        backgroundColor: colors.primary 
                      }}
                    />
                  </View>
                </View>
              )}

              <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-border">
                <Text className="text-muted text-sm">{deployment.targetSites.length} sites</Text>
                <Text className="text-muted text-sm">{formatDate(deployment.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}
    </View>
  );

  const renderPackages = () => (
    <View className="gap-4">
      <Text className="text-lg font-semibold text-foreground">Deployment Packages</Text>

      {packages.map(pkg => (
        <View key={pkg.id} className="bg-surface rounded-xl p-4 border border-border">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="font-semibold text-foreground">{pkg.name}</Text>
                <Text className="text-muted text-sm">v{pkg.version}</Text>
              </View>
              <Text className="text-muted text-sm mt-1">{pkg.description}</Text>
            </View>
            <View 
              className="px-2 py-1 rounded"
              style={{ backgroundColor: PACKAGE_TYPES[pkg.type].color + '20' }}
            >
              <Text style={{ color: PACKAGE_TYPES[pkg.type].color, fontSize: 11 }}>
                {PACKAGE_TYPES[pkg.type].label}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-border">
            <Text className="text-muted text-sm">{formatSize(pkg.size)}</Text>
            <View className="flex-row items-center gap-1">
              <View 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: pkg.tested ? '#10B981' : '#6B7280' }}
              />
              <Text className="text-muted text-sm">Tested</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: pkg.approved ? '#10B981' : '#F59E0B' }}
              />
              <Text className="text-muted text-sm">{pkg.approved ? 'Approved' : 'Pending'}</Text>
            </View>
          </View>

          {!pkg.approved && pkg.tested && (
            <TouchableOpacity
              onPress={() => handleApprovePackage(pkg.id)}
              className="mt-3 bg-primary py-2 rounded-lg"
            >
              <Text className="text-center text-white font-medium">Approve for Deployment</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  const renderCreate = () => {
    const approvedPackages = packages.filter(p => p.approved);

    return (
      <View className="gap-4">
        <Text className="text-lg font-semibold text-foreground">Create Deployment</Text>

        <View className="bg-surface rounded-xl p-4 border border-border gap-4">
          <View>
            <Text className="text-muted text-sm mb-1">Deployment Name</Text>
            <TextInput
              value={newDeployment.name}
              onChangeText={(text) => setNewDeployment(prev => ({ ...prev, name: text }))}
              placeholder="Enter deployment name"
              placeholderTextColor={colors.muted}
              className="bg-background rounded-lg px-4 py-3 text-foreground border border-border"
            />
          </View>

          <View>
            <Text className="text-muted text-sm mb-1">Description (optional)</Text>
            <TextInput
              value={newDeployment.description}
              onChangeText={(text) => setNewDeployment(prev => ({ ...prev, description: text }))}
              placeholder="Describe this deployment"
              placeholderTextColor={colors.muted}
              className="bg-background rounded-lg px-4 py-3 text-foreground border border-border"
              multiline
            />
          </View>

          <View>
            <Text className="text-muted text-sm mb-2">Select Package</Text>
            {approvedPackages.length === 0 ? (
              <Text className="text-muted">No approved packages available</Text>
            ) : (
              <View className="gap-2">
                {approvedPackages.map(pkg => (
                  <TouchableOpacity
                    key={pkg.id}
                    onPress={() => setNewDeployment(prev => ({ ...prev, packageId: pkg.id }))}
                    className={`p-3 rounded-lg border ${newDeployment.packageId === pkg.id ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className={newDeployment.packageId === pkg.id ? 'text-primary font-medium' : 'text-foreground'}>
                        {pkg.name} v{pkg.version}
                      </Text>
                      <Text className="text-muted text-sm">{formatSize(pkg.size)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View>
            <Text className="text-muted text-sm mb-2">Target</Text>
            <View className="flex-row gap-2">
              {(['all_sites', 'single_site'] as const).map(target => (
                <TouchableOpacity
                  key={target}
                  onPress={() => setNewDeployment(prev => ({ ...prev, targetType: target, selectedSites: [] }))}
                  className={`flex-1 py-2 rounded-lg border ${newDeployment.targetType === target ? 'border-primary bg-primary' : 'border-border bg-background'}`}
                >
                  <Text className={`text-center ${newDeployment.targetType === target ? 'text-white' : 'text-foreground'}`}>
                    {target === 'all_sites' ? 'All Sites' : 'Select Sites'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {newDeployment.targetType === 'single_site' && (
            <View>
              <Text className="text-muted text-sm mb-2">Select Sites</Text>
              <View className="gap-2">
                {SAMPLE_SITES.map(site => (
                  <TouchableOpacity
                    key={site.id}
                    onPress={() => toggleSite(site.id)}
                    className={`p-3 rounded-lg border ${newDeployment.selectedSites.includes(site.id) ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}
                  >
                    <Text className={newDeployment.selectedSites.includes(site.id) ? 'text-primary' : 'text-foreground'}>
                      {site.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setActiveTab('deployments')}
            className="flex-1 bg-background py-3 rounded-lg border border-border"
          >
            <Text className="text-center text-foreground">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCreateDeployment}
            className="flex-1 bg-primary py-3 rounded-lg"
          >
            <Text className="text-center text-white font-medium">Create</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAnalytics = () => {
    const analytics = wachsDeploymentService.getAnalytics();

    return (
      <View className="gap-4">
        <Text className="text-lg font-semibold text-foreground">Analytics</Text>

        <View className="flex-row gap-3">
          <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
            <Text className="text-muted text-sm">Total</Text>
            <Text className="text-2xl font-bold text-foreground">{analytics.totalDeployments}</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
            <Text className="text-muted text-sm">Success Rate</Text>
            <Text className="text-2xl font-bold" style={{ color: '#10B981' }}>{analytics.successRate}%</Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
            <Text className="text-muted text-sm">Successful</Text>
            <Text className="text-2xl font-bold" style={{ color: '#10B981' }}>{analytics.successfulDeployments}</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
            <Text className="text-muted text-sm">Failed</Text>
            <Text className="text-2xl font-bold" style={{ color: '#EF4444' }}>{analytics.failedDeployments}</Text>
          </View>
        </View>

        <View className="bg-surface rounded-xl p-4 border border-border">
          <Text className="font-semibold text-foreground mb-3">By Package Type</Text>
          {Object.entries(PACKAGE_TYPES).map(([type, config]) => (
            <View key={type} className="flex-row items-center justify-between py-2">
              <View className="flex-row items-center gap-2">
                <View 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <Text className="text-foreground">{config.label}</Text>
              </View>
              <Text className="text-muted">{analytics.byPackageType[type as keyof typeof analytics.byPackageType]}</Text>
            </View>
          ))}
        </View>

        <View className="bg-surface rounded-xl p-4 border border-border">
          <Text className="font-semibold text-foreground mb-2">Average Duration</Text>
          <Text className="text-3xl font-bold text-primary">{analytics.averageDuration} min</Text>
          <Text className="text-muted text-sm">per deployment</Text>
        </View>
      </View>
    );
  };

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
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-6 pb-8">
          <View>
            <Text className="text-2xl font-bold text-foreground">Deployment Manager</Text>
            <Text className="text-muted mt-1">Deploy packages to WACHS sites</Text>
          </View>

          <View className="flex-row bg-surface rounded-xl p-1">
            {(['deployments', 'packages', 'create', 'analytics'] as TabType[]).map(tab => (
              <TouchableOpacity
                key={tab}
                onPress={() => { setActiveTab(tab); setSelectedDeployment(null); }}
                className={`flex-1 py-3 rounded-lg ${activeTab === tab ? 'bg-primary' : ''}`}
              >
                <Text className={`text-center font-medium text-xs ${activeTab === tab ? 'text-white' : 'text-muted'}`}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'deployments' && renderDeployments()}
          {activeTab === 'packages' && renderPackages()}
          {activeTab === 'create' && renderCreate()}
          {activeTab === 'analytics' && renderAnalytics()}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
