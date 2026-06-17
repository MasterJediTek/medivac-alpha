/**
 * CI/CD Build Automation Screen
 * Manage builds, deployments, and version control
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import cicdBuildService, {
  type BuildRecord,
  type BuildConfiguration,
  type VersionInfo,
  type BuildStatus,
  type BuildPlatform,
} from '@/lib/services/cicd-build-service';

type TabType = 'builds' | 'configs' | 'version';

export default function CICDBuildsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('builds');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data states
  const [builds, setBuilds] = useState<BuildRecord[]>([]);
  const [configs, setConfigs] = useState<BuildConfiguration[]>([]);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<BuildPlatform | 'all'>('all');

  const loadData = useCallback(async () => {
    try {
      const [buildsData, configsData, versionData] = await Promise.all([
        cicdBuildService.getBuilds(selectedPlatform !== 'all' ? { platform: selectedPlatform } : undefined),
        cicdBuildService.getConfigs(),
        cicdBuildService.getVersionInfo(),
      ]);

      setBuilds(buildsData);
      setConfigs(configsData);
      setVersionInfo(versionData);
    } catch (error) {
      console.error('Failed to load CI/CD data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPlatform]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleTriggerBuild = async (configId: string) => {
    Alert.alert(
      'Trigger Build',
      'Start a new build with this configuration?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Build',
          onPress: async () => {
            try {
              const build = await cicdBuildService.triggerBuild(configId, 'manual', 'admin@medivac.one');
              Alert.alert('Build Started', `Build ${build.id} has been queued.`);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to trigger build');
            }
          },
        },
      ]
    );
  };

  const handleCancelBuild = async (buildId: string) => {
    Alert.alert(
      'Cancel Build',
      'Are you sure you want to cancel this build?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            const success = await cicdBuildService.cancelBuild(buildId);
            if (success) {
              Alert.alert('Cancelled', 'Build has been cancelled.');
              loadData();
            }
          },
        },
      ]
    );
  };

  const handleBumpVersion = async (type: 'major' | 'minor' | 'patch' | 'build') => {
    Alert.alert(
      'Bump Version',
      `Bump ${type} version? This will trigger automatic builds.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Bump',
          onPress: async () => {
            try {
              const newVersion = await cicdBuildService.bumpVersion(
                type,
                [`Version ${type} bump`],
                'admin@medivac.one'
              );
              Alert.alert('Version Updated', `New version: ${newVersion.version} (${newVersion.buildNumber})`);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to bump version');
            }
          },
        },
      ]
    );
  };

  const handleRollback = async (buildId: string) => {
    Alert.alert(
      'Rollback Build',
      'This will revert to the previous successful build. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rollback',
          style: 'destructive',
          onPress: async () => {
            const result = await cicdBuildService.rollbackBuild(buildId, 'Manual rollback', 'admin@medivac.one');
            if (result.success) {
              Alert.alert('Rolled Back', 'Successfully rolled back to previous version.');
              loadData();
            } else {
              Alert.alert('Error', 'No previous build available for rollback');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: BuildStatus): string => {
    switch (status) {
      case 'ready':
        return colors.success;
      case 'building':
      case 'testing':
      case 'uploading':
      case 'processing':
        return colors.warning;
      case 'queued':
        return colors.muted;
      case 'failed':
      case 'cancelled':
      case 'rolled_back':
        return colors.error;
      default:
        return colors.foreground;
    }
  };

  const getPlatformIcon = (platform: BuildPlatform): string => {
    switch (platform) {
      case 'ios':
        return '🍎';
      case 'android':
        return '🤖';
      case 'web':
        return '🌐';
      default:
        return '📱';
    }
  };

  const renderTabs = () => (
    <View className="flex-row gap-2 mb-4">
      {(['builds', 'configs', 'version'] as TabType[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          className={`flex-1 py-3 rounded-xl items-center ${activeTab === tab ? 'bg-primary' : 'bg-surface'}`}
        >
          <Text className={`font-medium capitalize ${activeTab === tab ? 'text-white' : 'text-foreground'}`}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPlatformFilters = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
      <View className="flex-row gap-2">
        {(['all', 'ios', 'android', 'web'] as const).map((platform) => (
          <TouchableOpacity
            key={platform}
            onPress={() => setSelectedPlatform(platform)}
            className={`px-4 py-2 rounded-lg ${selectedPlatform === platform ? 'bg-primary/20' : 'bg-surface'}`}
            style={selectedPlatform === platform ? { borderColor: colors.primary, borderWidth: 1 } : {}}
          >
            <Text className={`${selectedPlatform === platform ? 'text-primary' : 'text-muted'}`}>
              {platform === 'all' ? '📱 All' : `${getPlatformIcon(platform)} ${platform.toUpperCase()}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderBuilds = () => (
    <View className="gap-4">
      {renderPlatformFilters()}
      
      {builds.map((build) => (
        <View key={build.id} className="bg-surface rounded-xl p-4">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl">{getPlatformIcon(build.platform)}</Text>
              <View>
                <Text className="text-lg font-semibold text-foreground">
                  v{build.version} ({build.buildNumber})
                </Text>
                <Text className="text-sm text-muted capitalize">{build.environment}</Text>
              </View>
            </View>
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: getStatusColor(build.status) + '20' }}
            >
              <Text className="text-sm font-medium capitalize" style={{ color: getStatusColor(build.status) }}>
                {build.status.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>

          <Text className="text-muted text-sm mb-3" numberOfLines={2}>
            {build.commitMessage}
          </Text>

          <View className="flex-row flex-wrap gap-4 mb-3">
            <View>
              <Text className="text-foreground font-medium">{build.trigger}</Text>
              <Text className="text-xs text-muted">Trigger</Text>
            </View>
            <View>
              <Text className="text-foreground font-medium">{build.branch}</Text>
              <Text className="text-xs text-muted">Branch</Text>
            </View>
            {build.duration && (
              <View>
                <Text className="text-foreground font-medium">{Math.floor(build.duration / 60)}m {build.duration % 60}s</Text>
                <Text className="text-xs text-muted">Duration</Text>
              </View>
            )}
            {build.testResults && (
              <View>
                <Text className="text-success font-medium">{build.testResults.passed}/{build.testResults.total}</Text>
                <Text className="text-xs text-muted">Tests</Text>
              </View>
            )}
          </View>

          {/* Upload Status */}
          {build.uploadStatus && (
            <View className="flex-row gap-2 mb-3">
              {build.uploadStatus.testflight && (
                <View className="flex-row items-center gap-1 px-2 py-1 bg-background rounded">
                  <Text className="text-xs">🍎</Text>
                  <Text className="text-xs text-muted capitalize">{build.uploadStatus.testflight.status}</Text>
                </View>
              )}
              {build.uploadStatus.googlePlay && (
                <View className="flex-row items-center gap-1 px-2 py-1 bg-background rounded">
                  <Text className="text-xs">🤖</Text>
                  <Text className="text-xs text-muted capitalize">{build.uploadStatus.googlePlay.status}</Text>
                </View>
              )}
            </View>
          )}

          {/* Actions */}
          <View className="flex-row gap-2">
            {['queued', 'building', 'testing', 'uploading'].includes(build.status) && (
              <TouchableOpacity
                onPress={() => handleCancelBuild(build.id)}
                className="flex-1 bg-error/20 py-2 rounded-lg items-center"
              >
                <Text className="text-error font-medium">Cancel</Text>
              </TouchableOpacity>
            )}
            {build.status === 'ready' && (
              <TouchableOpacity
                onPress={() => handleRollback(build.id)}
                className="flex-1 bg-warning/20 py-2 rounded-lg items-center"
              >
                <Text className="text-warning font-medium">Rollback</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </View>
  );

  const renderConfigs = () => (
    <View className="gap-4">
      {configs.map((config) => (
        <View key={config.id} className="bg-surface rounded-xl p-4">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl">{getPlatformIcon(config.platform)}</Text>
              <View>
                <Text className="text-lg font-semibold text-foreground">{config.name}</Text>
                <Text className="text-sm text-muted capitalize">{config.environment} • {config.branch}</Text>
              </View>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2 mb-3">
            {config.autoUpload && (
              <View className="px-2 py-1 bg-success/20 rounded">
                <Text className="text-xs text-success">Auto Upload</Text>
              </View>
            )}
            {config.autoDistribute && (
              <View className="px-2 py-1 bg-primary/20 rounded">
                <Text className="text-xs text-primary">Auto Distribute</Text>
              </View>
            )}
            {config.testGroups.map((group) => (
              <View key={group} className="px-2 py-1 bg-background rounded">
                <Text className="text-xs text-muted">{group}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => handleTriggerBuild(config.id)}
            className="bg-primary py-3 rounded-lg items-center"
          >
            <Text className="text-white font-medium">Trigger Build</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const renderVersion = () => (
    <View className="gap-4">
      {versionInfo && (
        <>
          {/* Current Version */}
          <View className="bg-surface rounded-xl p-6 items-center">
            <Text className="text-muted mb-2">Current Version</Text>
            <Text className="text-4xl font-bold text-foreground mb-1">{versionInfo.version}</Text>
            <Text className="text-lg text-primary">Build {versionInfo.buildNumber}</Text>
            <Text className="text-sm text-muted mt-2">
              Last updated: {new Date(versionInfo.lastBumpedAt).toLocaleDateString()}
            </Text>
          </View>

          {/* Version Bump Actions */}
          <View className="bg-surface rounded-xl p-4">
            <Text className="text-lg font-semibold text-foreground mb-4">Bump Version</Text>
            <View className="gap-3">
              <TouchableOpacity
                onPress={() => handleBumpVersion('major')}
                className="flex-row items-center justify-between p-4 bg-background rounded-lg"
              >
                <View>
                  <Text className="text-foreground font-medium">Major</Text>
                  <Text className="text-sm text-muted">Breaking changes (X.0.0)</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.muted} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleBumpVersion('minor')}
                className="flex-row items-center justify-between p-4 bg-background rounded-lg"
              >
                <View>
                  <Text className="text-foreground font-medium">Minor</Text>
                  <Text className="text-sm text-muted">New features (x.X.0)</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.muted} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleBumpVersion('patch')}
                className="flex-row items-center justify-between p-4 bg-background rounded-lg"
              >
                <View>
                  <Text className="text-foreground font-medium">Patch</Text>
                  <Text className="text-sm text-muted">Bug fixes (x.x.X)</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.muted} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleBumpVersion('build')}
                className="flex-row items-center justify-between p-4 bg-background rounded-lg"
              >
                <View>
                  <Text className="text-foreground font-medium">Build Only</Text>
                  <Text className="text-sm text-muted">Increment build number</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Changelog */}
          {versionInfo.changelog.length > 0 && (
            <View className="bg-surface rounded-xl p-4">
              <Text className="text-lg font-semibold text-foreground mb-3">Recent Changes</Text>
              <View className="gap-2">
                {versionInfo.changelog.map((change, index) => (
                  <View key={index} className="flex-row items-start gap-2">
                    <Text className="text-primary">•</Text>
                    <Text className="text-foreground flex-1">{change}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Loading CI/CD data...</Text>
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
              <Text className="text-2xl font-bold text-foreground">CI/CD Builds</Text>
              <Text className="text-muted">Build Automation</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        {renderTabs()}

        {/* Content */}
        <View className="pb-8">
          {activeTab === 'builds' && renderBuilds()}
          {activeTab === 'configs' && renderConfigs()}
          {activeTab === 'version' && renderVersion()}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
