/**
 * Beta Testing Management Screen
 * TestFlight, Google Play Internal Testing, and crash reporting
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import betaTestingService, {
  type TestFlightConfig,
  type GooglePlayConfig,
  type BetaTester,
  type TesterGroup,
  type BetaBuild,
  type CrashReport,
  type BetaAnalytics,
} from '@/lib/services/beta-testing-service';

type TabType = 'overview' | 'builds' | 'testers' | 'crashes' | 'config';

export default function BetaTestingScreen() {
  const colors = useColors();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data states
  const [analytics, setAnalytics] = useState<BetaAnalytics | null>(null);
  const [testFlightConfig, setTestFlightConfig] = useState<TestFlightConfig | null>(null);
  const [googlePlayConfig, setGooglePlayConfig] = useState<GooglePlayConfig | null>(null);
  const [testers, setTesters] = useState<BetaTester[]>([]);
  const [groups, setGroups] = useState<TesterGroup[]>([]);
  const [builds, setBuilds] = useState<BetaBuild[]>([]);
  const [crashes, setCrashes] = useState<CrashReport[]>([]);

  // Form states
  const [newTesterEmail, setNewTesterEmail] = useState('');
  const [validatingConfig, setValidatingConfig] = useState<'testflight' | 'google_play' | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [analyticsData, tfConfig, gpConfig, testersData, groupsData, buildsData, crashesData] = await Promise.all([
        betaTestingService.getAnalytics(),
        betaTestingService.getTestFlightConfig(),
        betaTestingService.getGooglePlayConfig(),
        betaTestingService.getTesters(),
        betaTestingService.getGroups(),
        betaTestingService.getBuilds(),
        betaTestingService.getCrashReports(),
      ]);

      setAnalytics(analyticsData);
      setTestFlightConfig(tfConfig);
      setGooglePlayConfig(gpConfig);
      setTesters(testersData);
      setGroups(groupsData);
      setBuilds(buildsData);
      setCrashes(crashesData);
    } catch (error) {
      console.error('Failed to load beta testing data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleValidateTestFlight = async () => {
    setValidatingConfig('testflight');
    const result = await betaTestingService.validateTestFlightConfig();
    setValidatingConfig(null);
    
    if (result.valid) {
      Alert.alert('Success', 'TestFlight configuration is valid');
      loadData();
    } else {
      Alert.alert('Validation Failed', result.error || 'Unknown error');
    }
  };

  const handleValidateGooglePlay = async () => {
    setValidatingConfig('google_play');
    const result = await betaTestingService.validateGooglePlayConfig();
    setValidatingConfig(null);
    
    if (result.valid) {
      Alert.alert('Success', 'Google Play configuration is valid');
      loadData();
    } else {
      Alert.alert('Validation Failed', result.error || 'Unknown error');
    }
  };

  const handleInviteTester = async () => {
    if (!newTesterEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    await betaTestingService.inviteTester(newTesterEmail.trim());
    setNewTesterEmail('');
    loadData();
    Alert.alert('Success', 'Tester invitation sent');
  };

  const handleRemoveTester = async (testerId: string, email: string) => {
    Alert.alert(
      'Remove Tester',
      `Are you sure you want to remove ${email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await betaTestingService.removeTester(testerId);
            loadData();
          },
        },
      ]
    );
  };

  const handleUpdateCrashStatus = async (crashId: string, status: CrashReport['status']) => {
    await betaTestingService.updateCrashStatus(crashId, status);
    loadData();
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
      case 'testing':
      case 'fixed':
        return colors.success;
      case 'inactive':
      case 'expired':
      case 'removed':
        return colors.muted;
      case 'pending_review':
      case 'processing':
      case 'investigating':
        return colors.warning;
      case 'error':
      case 'rejected':
      case 'new':
      case 'critical':
        return colors.error;
      default:
        return colors.foreground;
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return colors.error;
      case 'high':
        return '#FF6B00';
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.muted;
      default:
        return colors.foreground;
    }
  };

  const renderTabs = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
      <View className="flex-row gap-2 px-1">
        {(['overview', 'builds', 'testers', 'crashes', 'config'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full ${activeTab === tab ? 'bg-primary' : 'bg-surface'}`}
          >
            <Text
              className={`text-sm font-medium capitalize ${activeTab === tab ? 'text-white' : 'text-foreground'}`}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderOverview = () => (
    <View className="gap-4">
      {/* Key Metrics */}
      <View className="bg-surface rounded-xl p-4">
        <Text className="text-lg font-semibold text-foreground mb-4">Beta Analytics</Text>
        <View className="flex-row flex-wrap gap-4">
          <View className="flex-1 min-w-[140px] bg-background rounded-lg p-3">
            <Text className="text-2xl font-bold text-primary">{analytics?.totalTesters || 0}</Text>
            <Text className="text-sm text-muted">Total Testers</Text>
          </View>
          <View className="flex-1 min-w-[140px] bg-background rounded-lg p-3">
            <Text className="text-2xl font-bold text-success">{analytics?.activeTesters || 0}</Text>
            <Text className="text-sm text-muted">Active Testers</Text>
          </View>
          <View className="flex-1 min-w-[140px] bg-background rounded-lg p-3">
            <Text className="text-2xl font-bold text-foreground">{analytics?.totalInstalls || 0}</Text>
            <Text className="text-sm text-muted">Total Installs</Text>
          </View>
          <View className="flex-1 min-w-[140px] bg-background rounded-lg p-3">
            <Text className="text-2xl font-bold" style={{ color: (analytics?.crashFreeRate || 0) > 99 ? colors.success : colors.warning }}>
              {(analytics?.crashFreeRate || 0).toFixed(1)}%
            </Text>
            <Text className="text-sm text-muted">Crash-Free Rate</Text>
          </View>
        </View>
      </View>

      {/* Platform Breakdown */}
      <View className="bg-surface rounded-xl p-4">
        <Text className="text-lg font-semibold text-foreground mb-4">Platform Breakdown</Text>
        <View className="gap-3">
          <View className="flex-row items-center justify-between p-3 bg-background rounded-lg">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center">
                <Text className="text-white font-bold">iOS</Text>
              </View>
              <View>
                <Text className="text-foreground font-medium">TestFlight</Text>
                <Text className="text-sm text-muted">{analytics?.platformBreakdown.ios.testers || 0} testers</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-foreground font-medium">{analytics?.platformBreakdown.ios.installs || 0} installs</Text>
              <Text className="text-sm text-error">{analytics?.platformBreakdown.ios.crashes || 0} crashes</Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between p-3 bg-background rounded-lg">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-green-600 items-center justify-center">
                <Text className="text-white font-bold text-xs">AND</Text>
              </View>
              <View>
                <Text className="text-foreground font-medium">Google Play</Text>
                <Text className="text-sm text-muted">{analytics?.platformBreakdown.android.testers || 0} testers</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-foreground font-medium">{analytics?.platformBreakdown.android.installs || 0} installs</Text>
              <Text className="text-sm text-error">{analytics?.platformBreakdown.android.crashes || 0} crashes</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Top Crashes */}
      {analytics?.topCrashes && analytics.topCrashes.length > 0 && (
        <View className="bg-surface rounded-xl p-4">
          <Text className="text-lg font-semibold text-foreground mb-4">Top Crashes</Text>
          <View className="gap-2">
            {analytics.topCrashes.map((crash, index) => (
              <View key={crash.id} className="flex-row items-center justify-between p-3 bg-background rounded-lg">
                <View className="flex-1 mr-3">
                  <Text className="text-foreground font-medium" numberOfLines={1}>{crash.title}</Text>
                </View>
                <View className="bg-error/20 px-2 py-1 rounded">
                  <Text className="text-error text-sm font-medium">{crash.occurrences}x</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const renderBuilds = () => (
    <View className="gap-4">
      {builds.map((build) => (
        <View key={build.id} className="bg-surface rounded-xl p-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <View className={`px-2 py-1 rounded ${build.platform === 'testflight' ? 'bg-gray-800' : 'bg-green-600'}`}>
                <Text className="text-white text-xs font-medium">
                  {build.platform === 'testflight' ? 'iOS' : 'Android'}
                </Text>
              </View>
              <Text className="text-lg font-semibold text-foreground">v{build.version}</Text>
              <Text className="text-muted">({build.buildNumber})</Text>
            </View>
            <View className="px-2 py-1 rounded" style={{ backgroundColor: getStatusColor(build.status) + '20' }}>
              <Text className="text-sm font-medium capitalize" style={{ color: getStatusColor(build.status) }}>
                {build.status}
              </Text>
            </View>
          </View>

          <Text className="text-muted text-sm mb-3" numberOfLines={2}>{build.releaseNotes}</Text>

          <View className="flex-row flex-wrap gap-4">
            <View>
              <Text className="text-foreground font-medium">{build.downloadCount}</Text>
              <Text className="text-xs text-muted">Downloads</Text>
            </View>
            <View>
              <Text className="text-foreground font-medium">{build.installCount}</Text>
              <Text className="text-xs text-muted">Installs</Text>
            </View>
            <View>
              <Text className="text-error font-medium">{build.crashCount}</Text>
              <Text className="text-xs text-muted">Crashes</Text>
            </View>
            <View>
              <Text className="text-foreground font-medium">{build.feedbackCount}</Text>
              <Text className="text-xs text-muted">Feedback</Text>
            </View>
          </View>

          <Text className="text-xs text-muted mt-3">
            Uploaded: {new Date(build.uploadedAt).toLocaleDateString()}
            {build.expiresAt && ` • Expires: ${new Date(build.expiresAt).toLocaleDateString()}`}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderTesters = () => (
    <View className="gap-4">
      {/* Invite Tester */}
      <View className="bg-surface rounded-xl p-4">
        <Text className="text-lg font-semibold text-foreground mb-3">Invite Tester</Text>
        <View className="flex-row gap-2">
          <TextInput
            value={newTesterEmail}
            onChangeText={setNewTesterEmail}
            placeholder="Enter email address"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            className="flex-1 bg-background rounded-lg px-4 py-3 text-foreground"
          />
          <TouchableOpacity
            onPress={handleInviteTester}
            className="bg-primary px-4 rounded-lg items-center justify-center"
          >
            <Text className="text-white font-medium">Invite</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tester Groups */}
      <View className="bg-surface rounded-xl p-4">
        <Text className="text-lg font-semibold text-foreground mb-3">Tester Groups</Text>
        <View className="gap-2">
          {groups.map((group) => (
            <View key={group.id} className="flex-row items-center justify-between p-3 bg-background rounded-lg">
              <View>
                <Text className="text-foreground font-medium">{group.name}</Text>
                <Text className="text-sm text-muted">{group.description}</Text>
              </View>
              <View className="items-end">
                <Text className="text-foreground font-medium">{group.testerCount}</Text>
                <Text className="text-xs text-muted">testers</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Testers List */}
      <View className="bg-surface rounded-xl p-4">
        <Text className="text-lg font-semibold text-foreground mb-3">
          Testers ({testers.filter(t => t.status !== 'removed').length})
        </Text>
        <View className="gap-2">
          {testers.filter(t => t.status !== 'removed').map((tester) => (
            <View key={tester.id} className="p-3 bg-background rounded-lg">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-1">
                  <Text className="text-foreground font-medium">{tester.name || tester.email}</Text>
                  {tester.name && <Text className="text-sm text-muted">{tester.email}</Text>}
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="px-2 py-1 rounded" style={{ backgroundColor: getStatusColor(tester.status) + '20' }}>
                    <Text className="text-xs font-medium capitalize" style={{ color: getStatusColor(tester.status) }}>
                      {tester.status}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveTester(tester.id, tester.email)}
                    className="p-1"
                  >
                    <IconSymbol name="chevron.right" size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
              <View className="flex-row gap-4">
                <Text className="text-xs text-muted">{tester.deviceCount} devices</Text>
                <Text className="text-xs text-muted">{tester.feedbackCount} feedback</Text>
                <Text className="text-xs text-muted">{tester.crashCount} crashes</Text>
              </View>
              <View className="flex-row flex-wrap gap-1 mt-2">
                {tester.platforms.map((platform) => (
                  <View key={platform} className="px-2 py-0.5 bg-surface rounded">
                    <Text className="text-xs text-muted capitalize">{platform.replace('_', ' ')}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderCrashes = () => (
    <View className="gap-4">
      {crashes.map((crash) => (
        <View key={crash.id} className="bg-surface rounded-xl p-4">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 mr-3">
              <View className="flex-row items-center gap-2 mb-1">
                <View className={`px-2 py-0.5 rounded ${crash.platform === 'ios' ? 'bg-gray-800' : 'bg-green-600'}`}>
                  <Text className="text-white text-xs font-medium uppercase">{crash.platform}</Text>
                </View>
                <View className="px-2 py-0.5 rounded" style={{ backgroundColor: getPriorityColor(crash.priority) + '20' }}>
                  <Text className="text-xs font-medium capitalize" style={{ color: getPriorityColor(crash.priority) }}>
                    {crash.priority}
                  </Text>
                </View>
              </View>
              <Text className="text-foreground font-medium" numberOfLines={2}>{crash.title}</Text>
            </View>
            <View className="px-2 py-1 rounded" style={{ backgroundColor: getStatusColor(crash.status) + '20' }}>
              <Text className="text-xs font-medium capitalize" style={{ color: getStatusColor(crash.status) }}>
                {crash.status.replace('_', ' ')}
              </Text>
            </View>
          </View>

          <View className="bg-background rounded-lg p-3 mb-3">
            <Text className="text-xs text-muted font-mono" numberOfLines={4}>{crash.stackTrace}</Text>
          </View>

          <View className="flex-row flex-wrap gap-4 mb-3">
            <View>
              <Text className="text-foreground font-medium">{crash.occurrences}</Text>
              <Text className="text-xs text-muted">Occurrences</Text>
            </View>
            <View>
              <Text className="text-foreground font-medium">{crash.affectedUsers}</Text>
              <Text className="text-xs text-muted">Users Affected</Text>
            </View>
            <View>
              <Text className="text-foreground font-medium">v{crash.buildVersion}</Text>
              <Text className="text-xs text-muted">Build</Text>
            </View>
          </View>

          <View className="flex-row gap-2">
            {crash.status === 'new' && (
              <TouchableOpacity
                onPress={() => handleUpdateCrashStatus(crash.id, 'investigating')}
                className="flex-1 bg-warning/20 py-2 rounded-lg items-center"
              >
                <Text className="text-warning font-medium">Investigate</Text>
              </TouchableOpacity>
            )}
            {crash.status === 'investigating' && (
              <TouchableOpacity
                onPress={() => handleUpdateCrashStatus(crash.id, 'fixed')}
                className="flex-1 bg-success/20 py-2 rounded-lg items-center"
              >
                <Text className="text-success font-medium">Mark Fixed</Text>
              </TouchableOpacity>
            )}
            {crash.status !== 'fixed' && crash.status !== 'wont_fix' && (
              <TouchableOpacity
                onPress={() => handleUpdateCrashStatus(crash.id, 'wont_fix')}
                className="flex-1 bg-muted/20 py-2 rounded-lg items-center"
              >
                <Text className="text-muted font-medium">Won't Fix</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text className="text-xs text-muted mt-3">
            {crash.deviceModel} • {crash.osVersion} • {new Date(crash.occurredAt).toLocaleString()}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderConfig = () => (
    <View className="gap-4">
      {/* TestFlight Config */}
      <View className="bg-surface rounded-xl p-4">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <View className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center">
              <Text className="text-white font-bold">TF</Text>
            </View>
            <View>
              <Text className="text-lg font-semibold text-foreground">TestFlight</Text>
              <Text className="text-sm text-muted">iOS Beta Testing</Text>
            </View>
          </View>
          <View className="px-2 py-1 rounded" style={{ backgroundColor: getStatusColor(testFlightConfig?.status || 'inactive') + '20' }}>
            <Text className="text-sm font-medium capitalize" style={{ color: getStatusColor(testFlightConfig?.status || 'inactive') }}>
              {testFlightConfig?.status || 'Not Configured'}
            </Text>
          </View>
        </View>

        {testFlightConfig && (
          <>
            <View className="gap-2 mb-4">
              <View className="flex-row justify-between">
                <Text className="text-muted">Bundle ID</Text>
                <Text className="text-foreground">{testFlightConfig.bundleId}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">Team ID</Text>
                <Text className="text-foreground">{testFlightConfig.teamId}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">Last Build</Text>
                <Text className="text-foreground">v{testFlightConfig.lastBuildVersion} ({testFlightConfig.lastBuildNumber})</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">External Testing</Text>
                <Text className={testFlightConfig.externalTestingEnabled ? 'text-success' : 'text-muted'}>
                  {testFlightConfig.externalTestingEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleValidateTestFlight}
              disabled={validatingConfig === 'testflight'}
              className="bg-primary py-3 rounded-lg items-center"
            >
              {validatingConfig === 'testflight' ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-medium">Validate Configuration</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Google Play Config */}
      <View className="bg-surface rounded-xl p-4">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <View className="w-10 h-10 rounded-full bg-green-600 items-center justify-center">
              <Text className="text-white font-bold">GP</Text>
            </View>
            <View>
              <Text className="text-lg font-semibold text-foreground">Google Play</Text>
              <Text className="text-sm text-muted">Android Beta Testing</Text>
            </View>
          </View>
          <View className="px-2 py-1 rounded" style={{ backgroundColor: getStatusColor(googlePlayConfig?.status || 'inactive') + '20' }}>
            <Text className="text-sm font-medium capitalize" style={{ color: getStatusColor(googlePlayConfig?.status || 'inactive') }}>
              {googlePlayConfig?.status || 'Not Configured'}
            </Text>
          </View>
        </View>

        {googlePlayConfig && (
          <>
            <View className="gap-2 mb-4">
              <View className="flex-row justify-between">
                <Text className="text-muted">Package Name</Text>
                <Text className="text-foreground">{googlePlayConfig.packageName}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">Track</Text>
                <Text className="text-foreground capitalize">{googlePlayConfig.track}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">Last Version</Text>
                <Text className="text-foreground">v{googlePlayConfig.lastVersionName} ({googlePlayConfig.lastVersionCode})</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">Rollout</Text>
                <Text className="text-foreground">{googlePlayConfig.rolloutPercentage}%</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleValidateGooglePlay}
              disabled={validatingConfig === 'google_play'}
              className="bg-primary py-3 rounded-lg items-center"
            >
              {validatingConfig === 'google_play' ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-medium">Validate Configuration</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Loading beta testing data...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between py-4">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-bold text-foreground">Beta Testing</Text>
              <Text className="text-muted">TestFlight & Google Play Management</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        {renderTabs()}

        {/* Content */}
        <View className="pb-8">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'builds' && renderBuilds()}
          {activeTab === 'testers' && renderTesters()}
          {activeTab === 'crashes' && renderCrashes()}
          {activeTab === 'config' && renderConfig()}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
