/**
 * Document Templates Library UI Screen - MediVac WACHS v9.4
 * Pre-filled AHD templates for common healthcare scenarios
 */

import { useState, useEffect } from 'react';
import { ScrollView, Text, View, Pressable, TextInput } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { documentTemplatesLibraryService, DocumentTemplate, TemplateCategory } from '@/lib/services/document-templates-library-service';

type TabType = 'browse' | 'favorites' | 'custom' | 'preview';

export default function DocumentTemplatesScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('browse');
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');

  useEffect(() => {
    loadTemplates();
  }, [selectedCategory, searchQuery]);

  const loadTemplates = () => {
    let results: DocumentTemplate[];
    
    if (searchQuery) {
      results = documentTemplatesLibraryService.searchTemplates(searchQuery);
    } else if (selectedCategory === 'all') {
      results = documentTemplatesLibraryService.getAllTemplates();
    } else {
      results = documentTemplatesLibraryService.getTemplatesByCategory(selectedCategory);
    }
    
    setTemplates(results);
  };

  const categories = documentTemplatesLibraryService.getCategories();

  const getCategoryColor = (category: TemplateCategory): string => {
    const colorMap: Record<TemplateCategory, string> = {
      palliative_care: '#EC4899',
      dementia_care: '#8B5CF6',
      end_of_life: '#6366F1',
      chronic_illness: '#F59E0B',
      cancer_care: '#EF4444',
      cardiac_care: '#EF4444',
      respiratory_care: '#3B82F6',
      general: '#10B981',
    };
    return colorMap[category] || colors.primary;
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'browse', label: 'Browse', icon: '📚' },
    { id: 'favorites', label: 'Favorites', icon: '⭐' },
    { id: 'custom', label: 'Custom', icon: '✏️' },
    { id: 'preview', label: 'Preview', icon: '👁️' },
  ];

  const renderBrowseTab = () => (
    <View className="gap-4">
      {/* Search */}
      <View className="bg-surface rounded-xl p-3 border border-border flex-row items-center gap-2">
        <Text className="text-lg">🔍</Text>
        <TextInput
          className="flex-1 text-foreground"
          placeholder="Search templates..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setSelectedCategory('all')}
            style={({ pressed }) => [
              { opacity: pressed ? 0.8 : 1 },
              { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
              { backgroundColor: selectedCategory === 'all' ? colors.primary : colors.surface },
              { borderWidth: 1, borderColor: selectedCategory === 'all' ? colors.primary : colors.border }
            ]}
          >
            <Text className={selectedCategory === 'all' ? 'text-background font-medium' : 'text-foreground'}>
              All
            </Text>
          </Pressable>
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={({ pressed }) => [
                { opacity: pressed ? 0.8 : 1 },
                { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
                { backgroundColor: selectedCategory === cat.id ? getCategoryColor(cat.id) : colors.surface },
                { borderWidth: 1, borderColor: selectedCategory === cat.id ? getCategoryColor(cat.id) : colors.border }
              ]}
            >
              <Text className={selectedCategory === cat.id ? 'text-white font-medium' : 'text-foreground'}>
                {cat.name} ({cat.count})
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Popular Templates */}
      {!searchQuery && selectedCategory === 'all' && (
        <View>
          <Text className="text-lg font-bold text-foreground mb-2">🔥 Popular Templates</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              {documentTemplatesLibraryService.getPopularTemplates(3).map((template) => (
                <Pressable
                  key={template.metadata.id}
                  onPress={() => {
                    setSelectedTemplate(template);
                    setActiveTab('preview');
                  }}
                  style={({ pressed }) => [
                    { opacity: pressed ? 0.8 : 1 },
                    { width: 200, padding: 16, borderRadius: 16 },
                    { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }
                  ]}
                >
                  <View className="flex-row items-center gap-2 mb-2">
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: getCategoryColor(template.metadata.category) }} />
                    <Text className="text-xs text-muted">{template.metadata.category.replace('_', ' ')}</Text>
                  </View>
                  <Text className="text-foreground font-bold mb-1" numberOfLines={2}>
                    {template.metadata.name}
                  </Text>
                  <Text className="text-xs text-muted" numberOfLines={2}>
                    {template.metadata.description}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-2">
                    <Text className="text-yellow-400">★ {template.metadata.rating.toFixed(1)}</Text>
                    <Text className="text-xs text-muted">({template.metadata.usageCount} uses)</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Template List */}
      <View>
        <Text className="text-lg font-bold text-foreground mb-2">
          {searchQuery ? 'Search Results' : 'All Templates'}
        </Text>
        {templates.length === 0 ? (
          <View className="bg-surface rounded-2xl p-6 border border-border items-center">
            <Text className="text-4xl mb-2">📭</Text>
            <Text className="text-foreground font-bold">No Templates Found</Text>
            <Text className="text-sm text-muted text-center mt-1">
              Try a different search or category
            </Text>
          </View>
        ) : (
          templates.map((template) => (
            <Pressable
              key={template.metadata.id}
              onPress={() => {
                setSelectedTemplate(template);
                setActiveTab('preview');
              }}
              style={({ pressed }) => [
                { opacity: pressed ? 0.8 : 1 },
                { padding: 16, borderRadius: 16, marginBottom: 12 },
                { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }
              ]}
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: getCategoryColor(template.metadata.category) }} />
                    <Text className="text-xs text-muted uppercase">
                      {template.metadata.category.replace('_', ' ')}
                    </Text>
                    {template.metadata.isOfficial && (
                      <View className="bg-blue-500/20 px-2 py-0.5 rounded">
                        <Text className="text-xs text-blue-400">Official</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-foreground font-bold text-base mb-1">
                    {template.metadata.name}
                  </Text>
                  <Text className="text-sm text-muted" numberOfLines={2}>
                    {template.metadata.description}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    if (documentTemplatesLibraryService.isFavorite(template.metadata.id)) {
                      documentTemplatesLibraryService.removeFromFavorites(template.metadata.id);
                    } else {
                      documentTemplatesLibraryService.addToFavorites(template.metadata.id);
                    }
                    loadTemplates();
                  }}
                >
                  <Text className="text-2xl">
                    {documentTemplatesLibraryService.isFavorite(template.metadata.id) ? '⭐' : '☆'}
                  </Text>
                </Pressable>
              </View>
              <View className="flex-row items-center gap-4 mt-3">
                <Text className="text-yellow-400 text-sm">★ {template.metadata.rating.toFixed(1)}</Text>
                <Text className="text-xs text-muted">{template.metadata.usageCount.toLocaleString()} uses</Text>
                <Text className="text-xs text-muted">v{template.metadata.version}</Text>
              </View>
              <View className="flex-row flex-wrap gap-1 mt-2">
                {template.metadata.suitableFor.slice(0, 3).map((tag, i) => (
                  <View key={i} className="bg-background px-2 py-1 rounded">
                    <Text className="text-xs text-muted">{tag}</Text>
                  </View>
                ))}
              </View>
            </Pressable>
          ))
        )}
      </View>
    </View>
  );

  const renderFavoritesTab = () => {
    const favorites = documentTemplatesLibraryService.getFavorites();
    const recentlyUsed = documentTemplatesLibraryService.getRecentlyUsed();

    return (
      <View className="gap-4">
        <View>
          <Text className="text-lg font-bold text-foreground mb-2">⭐ Favorites</Text>
          {favorites.length === 0 ? (
            <View className="bg-surface rounded-2xl p-6 border border-border items-center">
              <Text className="text-4xl mb-2">⭐</Text>
              <Text className="text-foreground font-bold">No Favorites</Text>
              <Text className="text-sm text-muted text-center mt-1">
                Star templates to add them here
              </Text>
            </View>
          ) : (
            favorites.map((template) => (
              <Pressable
                key={template.metadata.id}
                onPress={() => {
                  setSelectedTemplate(template);
                  setActiveTab('preview');
                }}
                style={({ pressed }) => [
                  { opacity: pressed ? 0.8 : 1 },
                  { padding: 12, borderRadius: 12, marginBottom: 8 },
                  { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }
                ]}
              >
                <Text className="text-foreground font-bold">{template.metadata.name}</Text>
                <Text className="text-xs text-muted">{template.metadata.category.replace('_', ' ')}</Text>
              </Pressable>
            ))
          )}
        </View>

        <View>
          <Text className="text-lg font-bold text-foreground mb-2">🕐 Recently Used</Text>
          {recentlyUsed.length === 0 ? (
            <View className="bg-surface rounded-2xl p-6 border border-border items-center">
              <Text className="text-4xl mb-2">🕐</Text>
              <Text className="text-foreground font-bold">No Recent Templates</Text>
              <Text className="text-sm text-muted text-center mt-1">
                Templates you use will appear here
              </Text>
            </View>
          ) : (
            recentlyUsed.map((template) => (
              <Pressable
                key={template.metadata.id}
                onPress={() => {
                  setSelectedTemplate(template);
                  setActiveTab('preview');
                }}
                style={({ pressed }) => [
                  { opacity: pressed ? 0.8 : 1 },
                  { padding: 12, borderRadius: 12, marginBottom: 8 },
                  { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }
                ]}
              >
                <Text className="text-foreground font-bold">{template.metadata.name}</Text>
                <Text className="text-xs text-muted">{template.metadata.category.replace('_', ' ')}</Text>
              </Pressable>
            ))
          )}
        </View>
      </View>
    );
  };

  const renderCustomTab = () => {
    const userTemplates = documentTemplatesLibraryService.getUserTemplates();
    const analytics = documentTemplatesLibraryService.getAnalytics();

    return (
      <View className="gap-4">
        <View className="bg-surface rounded-2xl p-4 border border-border">
          <Text className="text-lg font-bold text-foreground mb-4">📊 Template Statistics</Text>
          <View className="flex-row flex-wrap gap-2">
            <View className="bg-background rounded-xl p-3 flex-1 min-w-[140px]">
              <Text className="text-2xl font-bold text-primary">{analytics.totalTemplates}</Text>
              <Text className="text-xs text-muted">Total Templates</Text>
            </View>
            <View className="bg-background rounded-xl p-3 flex-1 min-w-[140px]">
              <Text className="text-2xl font-bold text-blue-400">{analytics.officialTemplates}</Text>
              <Text className="text-xs text-muted">Official</Text>
            </View>
            <View className="bg-background rounded-xl p-3 flex-1 min-w-[140px]">
              <Text className="text-2xl font-bold text-purple-400">{analytics.userTemplates}</Text>
              <Text className="text-xs text-muted">Custom</Text>
            </View>
            <View className="bg-background rounded-xl p-3 flex-1 min-w-[140px]">
              <Text className="text-2xl font-bold text-yellow-400">★ {analytics.averageRating.toFixed(1)}</Text>
              <Text className="text-xs text-muted">Avg Rating</Text>
            </View>
          </View>
        </View>

        <View>
          <Text className="text-lg font-bold text-foreground mb-2">✏️ Your Custom Templates</Text>
          {userTemplates.length === 0 ? (
            <View className="bg-surface rounded-2xl p-6 border border-border items-center">
              <Text className="text-4xl mb-2">✏️</Text>
              <Text className="text-foreground font-bold">No Custom Templates</Text>
              <Text className="text-sm text-muted text-center mt-1">
                Create your own templates based on your needs
              </Text>
              <Pressable
                style={({ pressed }) => [
                  { opacity: pressed ? 0.8 : 1, backgroundColor: colors.primary },
                  { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 16 }
                ]}
              >
                <Text className="text-background font-bold">+ Create Template</Text>
              </Pressable>
            </View>
          ) : (
            userTemplates.map((template) => (
              <Pressable
                key={template.metadata.id}
                onPress={() => {
                  setSelectedTemplate(template);
                  setActiveTab('preview');
                }}
                style={({ pressed }) => [
                  { opacity: pressed ? 0.8 : 1 },
                  { padding: 12, borderRadius: 12, marginBottom: 8 },
                  { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }
                ]}
              >
                <Text className="text-foreground font-bold">{template.metadata.name}</Text>
                <Text className="text-xs text-muted">
                  Created: {new Date(template.metadata.createdAt).toLocaleDateString()}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      </View>
    );
  };

  const renderPreviewTab = () => {
    if (!selectedTemplate) {
      return (
        <View className="bg-surface rounded-2xl p-6 border border-border items-center">
          <Text className="text-4xl mb-2">👁️</Text>
          <Text className="text-foreground font-bold">No Template Selected</Text>
          <Text className="text-sm text-muted text-center mt-1">
            Select a template from Browse to preview
          </Text>
        </View>
      );
    }

    return (
      <View className="gap-4">
        <View className="bg-surface rounded-2xl p-4 border border-border">
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1">
              <Text className="text-xl font-bold text-foreground">{selectedTemplate.metadata.name}</Text>
              <Text className="text-sm text-muted">{selectedTemplate.metadata.description}</Text>
            </View>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: getCategoryColor(selectedTemplate.metadata.category) }} />
          </View>
          
          <View className="flex-row gap-2 mb-4">
            <Pressable
              onPress={() => documentTemplatesLibraryService.useTemplate(selectedTemplate.metadata.id)}
              style={({ pressed }) => [
                { opacity: pressed ? 0.8 : 1, backgroundColor: colors.primary },
                { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' }
              ]}
            >
              <Text className="text-background font-bold">📋 Use Template</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (documentTemplatesLibraryService.isFavorite(selectedTemplate.metadata.id)) {
                  documentTemplatesLibraryService.removeFromFavorites(selectedTemplate.metadata.id);
                } else {
                  documentTemplatesLibraryService.addToFavorites(selectedTemplate.metadata.id);
                }
              }}
              style={({ pressed }) => [
                { opacity: pressed ? 0.8 : 1, backgroundColor: colors.surface },
                { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border }
              ]}
            >
              <Text className="text-xl">
                {documentTemplatesLibraryService.isFavorite(selectedTemplate.metadata.id) ? '⭐' : '☆'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Values and Wishes Preview */}
        <View className="bg-surface rounded-2xl p-4 border border-border">
          <Text className="text-lg font-bold text-foreground mb-3">📝 Values and Wishes</Text>
          
          <View className="gap-3">
            <View>
              <Text className="text-sm font-medium text-primary mb-1">Quality of Life</Text>
              <Text className="text-sm text-muted">{selectedTemplate.content.valuesAndWishes.qualityOfLife}</Text>
            </View>
            <View>
              <Text className="text-sm font-medium text-primary mb-1">Important Activities</Text>
              <Text className="text-sm text-muted">{selectedTemplate.content.valuesAndWishes.importantActivities}</Text>
            </View>
            <View>
              <Text className="text-sm font-medium text-primary mb-1">Fears and Concerns</Text>
              <Text className="text-sm text-muted">{selectedTemplate.content.valuesAndWishes.fears}</Text>
            </View>
          </View>
        </View>

        {/* Treatment Decisions Preview */}
        <View className="bg-surface rounded-2xl p-4 border border-border">
          <Text className="text-lg font-bold text-foreground mb-3">💊 Treatment Decisions</Text>
          
          {Object.entries(selectedTemplate.content.treatmentDecisions).map(([key, decision]) => (
            <View key={key} className="flex-row justify-between items-center py-2 border-b border-border last:border-b-0">
              <Text className="text-sm text-foreground flex-1">{decision.treatment}</Text>
              <View className={`px-2 py-1 rounded ${
                decision.preference === 'want' ? 'bg-green-500/20' :
                decision.preference === 'do_not_want' ? 'bg-red-500/20' :
                decision.preference === 'conditional' ? 'bg-yellow-500/20' : 'bg-gray-500/20'
              }`}>
                <Text className={`text-xs font-medium ${
                  decision.preference === 'want' ? 'text-green-400' :
                  decision.preference === 'do_not_want' ? 'text-red-400' :
                  decision.preference === 'conditional' ? 'text-yellow-400' : 'text-gray-400'
                }`}>
                  {decision.preference.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Guidance */}
        {selectedTemplate.guidance.length > 0 && (
          <View className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/30">
            <Text className="text-blue-400 font-bold mb-2">💡 Guidance Tips</Text>
            {selectedTemplate.guidance.map((guide, index) => (
              <View key={index} className="mb-3 last:mb-0">
                <Text className="text-sm font-medium text-foreground mb-1">{guide.section}</Text>
                {guide.tips.map((tip, i) => (
                  <Text key={i} className="text-xs text-muted ml-2">• {tip}</Text>
                ))}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 gap-4">
          {/* Header */}
          <View className="items-center mb-2">
            <Text className="text-3xl mb-1">📚</Text>
            <Text className="text-2xl font-bold text-foreground">Document Templates</Text>
            <Text className="text-sm text-muted text-center">
              Pre-filled AHD templates for common scenarios
            </Text>
          </View>

          {/* Tab Bar */}
          <View className="flex-row bg-surface rounded-xl p-1 border border-border">
            {tabs.map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={({ pressed }) => [
                  { opacity: pressed ? 0.8 : 1 },
                  { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, alignItems: 'center' },
                  activeTab === tab.id && { backgroundColor: colors.primary }
                ]}
              >
                <Text className="text-lg">{tab.icon}</Text>
                <Text className={`text-xs font-medium ${activeTab === tab.id ? 'text-background' : 'text-muted'}`}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Tab Content */}
          {activeTab === 'browse' && renderBrowseTab()}
          {activeTab === 'favorites' && renderFavoritesTab()}
          {activeTab === 'custom' && renderCustomTab()}
          {activeTab === 'preview' && renderPreviewTab()}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
