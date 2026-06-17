/**
 * Crash Report Templates Screen
 * Pre-defined annotation templates for faster forum posting
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
import crashReportTemplateService, {
  type CrashReportTemplate,
  type TemplateCategory,
  type TemplateAnalytics,
} from '@/lib/services/crash-report-template-service';

type TabType = 'templates' | 'categories' | 'analytics';

export default function CrashTemplatesScreen() {
  const colors = useColors();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('templates');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data states
  const [templates, setTemplates] = useState<CrashReportTemplate[]>([]);
  const [analytics, setAnalytics] = useState<TemplateAnalytics | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | null>(null);

  const loadData = useCallback(async () => {
    try {
      await crashReportTemplateService.initialize();
      const [templatesData, analyticsData] = await Promise.all([
        crashReportTemplateService.getTemplates(selectedCategory ? { category: selectedCategory } : undefined),
        crashReportTemplateService.getAnalytics(),
      ]);

      setTemplates(templatesData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load template data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleApplyTemplate = async (templateId: string) => {
    Alert.alert(
      'Apply Template',
      'This template will be applied to the next crash report. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            const result = await crashReportTemplateService.applyTemplate(
              templateId,
              `crash_${Date.now()}`,
              `screenshot_${Date.now()}`,
              'user_current'
            );
            if (result) {
              Alert.alert('Success', 'Template applied successfully');
              loadData();
            }
          },
        },
      ]
    );
  };

  const handleShareTemplate = async (templateId: string) => {
    const success = await crashReportTemplateService.shareTemplate(templateId);
    if (success) {
      Alert.alert('Success', 'Template shared with team');
      loadData();
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    Alert.alert(
      'Delete Template',
      'Are you sure you want to delete this template?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await crashReportTemplateService.deleteTemplate(templateId);
            if (success) {
              loadData();
            } else {
              Alert.alert('Error', 'Cannot delete built-in templates');
            }
          },
        },
      ]
    );
  };

  const getCategoryIcon = (category: TemplateCategory): string => {
    const icons: Record<TemplateCategory, string> = {
      ui_crash: '🖼️',
      network_error: '🌐',
      memory_issue: '💾',
      database_error: '🗄️',
      authentication_failure: '🔐',
      permission_denied: '🚫',
      api_failure: '⚡',
      rendering_error: '🎨',
      navigation_crash: '🧭',
      general: '📋',
    };
    return icons[category] || '📋';
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return colors.error;
      case 'high':
        return '#FF6600';
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.success;
      default:
        return colors.muted;
    }
  };

  const categories = crashReportTemplateService.getCategories();

  const renderTabs = () => (
    <View className="flex-row gap-2 mb-4">
      {(['templates', 'categories', 'analytics'] as TabType[]).map((tab) => (
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

  const renderTemplates = () => (
    <View className="gap-4">
      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
        <View className="flex-row gap-2 px-1">
          <TouchableOpacity
            onPress={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full ${!selectedCategory ? 'bg-primary' : 'bg-surface'}`}
          >
            <Text className={!selectedCategory ? 'text-white' : 'text-foreground'}>All</Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              onPress={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-full ${selectedCategory === cat.value ? 'bg-primary' : 'bg-surface'}`}
            >
              <Text className={selectedCategory === cat.value ? 'text-white' : 'text-foreground'}>
                {getCategoryIcon(cat.value)} {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Templates List */}
      {templates.map((template) => (
        <View key={template.id} className="bg-surface rounded-xl p-4">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-row items-center gap-3 flex-1">
              <Text className="text-2xl">{getCategoryIcon(template.category)}</Text>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-foreground">{template.name}</Text>
                <Text className="text-sm text-muted" numberOfLines={2}>{template.description}</Text>
              </View>
            </View>
            <View
              className="px-2 py-1 rounded"
              style={{ backgroundColor: getSeverityColor(template.severity) + '20' }}
            >
              <Text
                className="text-xs font-medium capitalize"
                style={{ color: getSeverityColor(template.severity) }}
              >
                {template.severity}
              </Text>
            </View>
          </View>

          {/* Annotations Preview */}
          <View className="flex-row flex-wrap gap-2 mb-3">
            {template.annotations.map((ann) => (
              <View key={ann.id} className="px-2 py-1 bg-background rounded">
                <Text className="text-xs text-muted capitalize">{ann.type}: {ann.label}</Text>
              </View>
            ))}
          </View>

          {/* Target Forums */}
          <View className="flex-row flex-wrap gap-2 mb-3">
            {template.targetForums.map((forum) => (
              <View key={forum} className="px-2 py-1 bg-primary/10 rounded">
                <Text className="text-xs text-primary capitalize">{forum.replace(/_/g, ' ')}</Text>
              </View>
            ))}
          </View>

          {/* Stats & Actions */}
          <View className="flex-row items-center justify-between pt-3 border-t border-border">
            <View className="flex-row items-center gap-4">
              <Text className="text-sm text-muted">Used {template.usageCount} times</Text>
              {template.isBuiltIn && (
                <View className="px-2 py-0.5 bg-muted/20 rounded">
                  <Text className="text-xs text-muted">Built-in</Text>
                </View>
              )}
              {template.isShared && (
                <View className="px-2 py-0.5 bg-success/20 rounded">
                  <Text className="text-xs text-success">Shared</Text>
                </View>
              )}
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => handleApplyTemplate(template.id)}
                className="px-3 py-2 bg-primary rounded-lg"
              >
                <Text className="text-white text-sm font-medium">Apply</Text>
              </TouchableOpacity>
              {!template.isBuiltIn && (
                <>
                  <TouchableOpacity
                    onPress={() => handleShareTemplate(template.id)}
                    className="px-3 py-2 bg-surface border border-border rounded-lg"
                  >
                    <Text className="text-foreground text-sm">Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteTemplate(template.id)}
                    className="px-3 py-2 bg-error/10 rounded-lg"
                  >
                    <Text className="text-error text-sm">Delete</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      ))}

      {templates.length === 0 && (
        <View className="bg-surface rounded-xl p-8 items-center">
          <Text className="text-4xl mb-3">📋</Text>
          <Text className="text-lg font-semibold text-foreground">No Templates</Text>
          <Text className="text-muted text-center">
            {selectedCategory ? 'No templates in this category' : 'No templates available'}
          </Text>
        </View>
      )}
    </View>
  );

  const renderCategories = () => (
    <View className="gap-4">
      {categories.map((category) => {
        const categoryStats = analytics?.byCategory[category.value];
        return (
          <TouchableOpacity
            key={category.value}
            onPress={() => {
              setSelectedCategory(category.value);
              setActiveTab('templates');
            }}
            className="bg-surface rounded-xl p-4"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Text className="text-3xl">{getCategoryIcon(category.value)}</Text>
                <View>
                  <Text className="text-lg font-semibold text-foreground">{category.label}</Text>
                  <Text className="text-sm text-muted">{category.description}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-xl font-bold text-foreground">
                  {categoryStats?.templates || 0}
                </Text>
                <Text className="text-xs text-muted">templates</Text>
              </View>
            </View>
            {categoryStats && categoryStats.applications > 0 && (
              <View className="mt-3 pt-3 border-t border-border">
                <Text className="text-sm text-muted">
                  {categoryStats.applications} applications
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderAnalytics = () => (
    <View className="gap-4">
      {analytics && (
        <>
          {/* Summary Stats */}
          <View className="flex-row flex-wrap gap-4">
            <View className="flex-1 min-w-[140px] bg-surface rounded-xl p-4">
              <Text className="text-3xl font-bold text-foreground">{analytics.totalTemplates}</Text>
              <Text className="text-sm text-muted">Total Templates</Text>
            </View>
            <View className="flex-1 min-w-[140px] bg-surface rounded-xl p-4">
              <Text className="text-3xl font-bold text-foreground">{analytics.totalApplications}</Text>
              <Text className="text-sm text-muted">Applications</Text>
            </View>
            <View className="flex-1 min-w-[140px] bg-surface rounded-xl p-4">
              <Text className="text-3xl font-bold text-success">{analytics.templateEfficiency}%</Text>
              <Text className="text-sm text-muted">Efficiency</Text>
            </View>
            <View className="flex-1 min-w-[140px] bg-surface rounded-xl p-4">
              <Text className="text-3xl font-bold text-foreground">{analytics.averageTimeToApply}s</Text>
              <Text className="text-sm text-muted">Avg. Apply Time</Text>
            </View>
          </View>

          {/* Most Used Templates */}
          <View className="bg-surface rounded-xl p-4">
            <Text className="text-lg font-semibold text-foreground mb-4">Most Used Templates</Text>
            {analytics.mostUsedTemplates.length > 0 ? (
              <View className="gap-3">
                {analytics.mostUsedTemplates.map((item, index) => (
                  <View
                    key={item.templateId}
                    className="flex-row items-center justify-between p-3 bg-background rounded-lg"
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="w-8 h-8 bg-primary/20 rounded-full items-center justify-center">
                        <Text className="text-primary font-bold">{index + 1}</Text>
                      </View>
                      <Text className="text-foreground font-medium">{item.name}</Text>
                    </View>
                    <Text className="text-muted">{item.usageCount} uses</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-muted text-center py-4">No usage data yet</Text>
            )}
          </View>

          {/* Category Distribution */}
          <View className="bg-surface rounded-xl p-4">
            <Text className="text-lg font-semibold text-foreground mb-4">By Category</Text>
            <View className="gap-3">
              {Object.entries(analytics.byCategory)
                .filter(([_, stats]) => stats.templates > 0)
                .sort((a, b) => b[1].applications - a[1].applications)
                .map(([category, stats]) => (
                  <View
                    key={category}
                    className="flex-row items-center justify-between p-3 bg-background rounded-lg"
                  >
                    <View className="flex-row items-center gap-2">
                      <Text className="text-lg">{getCategoryIcon(category as TemplateCategory)}</Text>
                      <Text className="text-foreground capitalize">{category.replace(/_/g, ' ')}</Text>
                    </View>
                    <View className="flex-row items-center gap-4">
                      <Text className="text-muted">{stats.templates} templates</Text>
                      <Text className="text-primary font-medium">{stats.applications} uses</Text>
                    </View>
                  </View>
                ))}
            </View>
          </View>
        </>
      )}
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Loading templates...</Text>
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
              <Text className="text-2xl font-bold text-foreground">Crash Templates</Text>
              <Text className="text-muted">Pre-defined Annotations</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        {renderTabs()}

        {/* Content */}
        <View className="pb-8">
          {activeTab === 'templates' && renderTemplates()}
          {activeTab === 'categories' && renderCategories()}
          {activeTab === 'analytics' && renderAnalytics()}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
