/**
 * Highlight Reels Screen
 * Create and manage shareable training clips from recordings
 */

import { useState, useEffect, useCallback } from 'react';
import { ScrollView, Text, View, Pressable, RefreshControl, TextInput, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { 
  highlightReelsService, 
  HighlightReel, 
  HighlightCategory,
  HighlightAnalytics 
} from '@/lib/services/highlight-reels-service';

type TabType = 'gallery' | 'create' | 'playlists' | 'analytics';

const CATEGORIES: { value: HighlightCategory; label: string; icon: string }[] = [
  { value: 'training', label: 'Training', icon: '🎓' },
  { value: 'incident', label: 'Incident', icon: '⚠️' },
  { value: 'best_practice', label: 'Best Practice', icon: '⭐' },
  { value: 'protocol', label: 'Protocol', icon: '📋' },
  { value: 'emergency', label: 'Emergency', icon: '🚨' },
  { value: 'debrief', label: 'Debrief', icon: '📊' },
  { value: 'custom', label: 'Custom', icon: '🎬' },
];

export default function HighlightReelsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('gallery');
  const [refreshing, setRefreshing] = useState(false);
  const [reels, setReels] = useState<HighlightReel[]>([]);
  const [analytics, setAnalytics] = useState<HighlightAnalytics | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<HighlightCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<HighlightCategory>('training');

  const loadData = useCallback(async () => {
    await highlightReelsService.initialize();
    setReels(highlightReelsService.getReels({
      category: selectedCategory || undefined,
      search: searchQuery || undefined,
    }));
    setAnalytics(highlightReelsService.getAnalytics());
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleCreateReel = async () => {
    if (!newTitle.trim()) return;
    
    await highlightReelsService.createReel(
      newTitle,
      newDescription,
      newCategory,
      'recording_sample',
      'Sample Recording',
      'current_user',
      'Current User',
      'master'
    );
    
    setNewTitle('');
    setNewDescription('');
    setNewCategory('training');
    setActiveTab('gallery');
    await loadData();
  };

  const handleViewReel = async (reelId: string) => {
    await highlightReelsService.incrementViews(reelId);
    await loadData();
  };

  const handleLikeReel = async (reelId: string) => {
    await highlightReelsService.likeReel(reelId);
    await loadData();
  };

  const handlePublishReel = async (reelId: string) => {
    await highlightReelsService.processReel(reelId);
    await highlightReelsService.publishReel(reelId, 'current_user');
    await loadData();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderTabs = () => (
    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border }}>
      {(['gallery', 'create', 'playlists', 'analytics'] as TabType[]).map((tab) => (
        <Pressable
          key={tab}
          onPress={() => setActiveTab(tab)}
          style={{
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            borderBottomWidth: 2,
            borderBottomColor: activeTab === tab ? colors.primary : 'transparent',
          }}
        >
          <Text style={{
            color: activeTab === tab ? colors.primary : colors.muted,
            fontWeight: activeTab === tab ? '600' : '400',
            fontSize: 13,
          }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const renderReelCard = ({ item: reel }: { item: HighlightReel }) => (
    <Pressable
      onPress={() => handleViewReel(reel.id)}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
      }}
    >
      <View style={{
        backgroundColor: colors.primary + '20',
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 48 }}>
          {CATEGORIES.find(c => c.value === reel.category)?.icon || '🎬'}
        </Text>
        <Text style={{ color: colors.primary, fontWeight: '600', marginTop: 8 }}>
          {formatDuration(reel.totalDuration)}
        </Text>
      </View>

      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, flex: 1 }} numberOfLines={1}>
            {reel.title}
          </Text>
          <View style={{
            backgroundColor: reel.status === 'published' ? colors.success :
              reel.status === 'ready' ? colors.primary :
              reel.status === 'processing' ? colors.warning : colors.muted,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 4,
          }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>
              {reel.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }} numberOfLines={2}>
          {reel.description}
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
          {reel.tags.slice(0, 3).map((tag, i) => (
            <View key={i} style={{
              backgroundColor: colors.background,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 4,
            }}>
              <Text style={{ color: colors.muted, fontSize: 11 }}>#{tag}</Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 12 }}>👁️</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{reel.views}</Text>
            </View>
            <Pressable
              onPress={() => handleLikeReel(reel.id)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={{ fontSize: 12 }}>❤️</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{reel.likes}</Text>
            </Pressable>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 12 }}>📤</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{reel.shares}</Text>
            </View>
          </View>

          {reel.status === 'draft' && (
            <Pressable
              onPress={() => handlePublishReel(reel.id)}
              style={{
                backgroundColor: colors.success,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Publish</Text>
            </Pressable>
          )}
        </View>

        <Text style={{ fontSize: 11, color: colors.muted, marginTop: 8 }}>
          By {reel.createdByName} • {reel.segments.length} segments • {formatFileSize(reel.fileSize)}
        </Text>
      </View>
    </Pressable>
  );

  const renderGallery = () => (
    <View style={{ padding: 16 }}>
      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search highlight reels..."
        placeholderTextColor={colors.muted}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 8,
          padding: 12,
          color: colors.foreground,
          marginBottom: 12,
        }}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <Pressable
          onPress={() => setSelectedCategory(null)}
          style={{
            backgroundColor: selectedCategory === null ? colors.primary : colors.surface,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            marginRight: 8,
          }}
        >
          <Text style={{ color: selectedCategory === null ? '#fff' : colors.foreground }}>All</Text>
        </Pressable>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.value}
            onPress={() => setSelectedCategory(cat.value)}
            style={{
              backgroundColor: selectedCategory === cat.value ? colors.primary : colors.surface,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              marginRight: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Text>{cat.icon}</Text>
            <Text style={{ color: selectedCategory === cat.value ? '#fff' : colors.foreground }}>
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {reels.length === 0 ? (
        <View style={{ padding: 32, alignItems: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🎬</Text>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>No highlight reels found</Text>
        </View>
      ) : (
        <FlatList
          data={reels}
          renderItem={renderReelCard}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  const renderCreate = () => (
    <View style={{ padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>
        Create Highlight Reel
      </Text>

      <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 16 }}>
        <View>
          <Text style={{ color: colors.foreground, fontWeight: '500', marginBottom: 8 }}>Title</Text>
          <TextInput
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="Enter reel title..."
            placeholderTextColor={colors.muted}
            style={{
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              padding: 12,
              color: colors.foreground,
            }}
          />
        </View>

        <View>
          <Text style={{ color: colors.foreground, fontWeight: '500', marginBottom: 8 }}>Description</Text>
          <TextInput
            value={newDescription}
            onChangeText={setNewDescription}
            placeholder="Describe the highlight reel..."
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              padding: 12,
              color: colors.foreground,
              minHeight: 80,
              textAlignVertical: 'top',
            }}
          />
        </View>

        <View>
          <Text style={{ color: colors.foreground, fontWeight: '500', marginBottom: 8 }}>Category</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.value}
                onPress={() => setNewCategory(cat.value)}
                style={{
                  backgroundColor: newCategory === cat.value ? colors.primary : colors.background,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: newCategory === cat.value ? colors.primary : colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Text>{cat.icon}</Text>
                <Text style={{ color: newCategory === cat.value ? '#fff' : colors.foreground }}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          onPress={handleCreateReel}
          style={{
            backgroundColor: newTitle.trim() ? colors.primary : colors.muted,
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
          }}
          disabled={!newTitle.trim()}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Create Highlight Reel</Text>
        </Pressable>
      </View>

      <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 8 }}>
          💡 Tips for Great Highlight Reels
        </Text>
        <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>
          • Keep segments focused on single learning points{'\n'}
          • Add annotations to highlight key moments{'\n'}
          • Use descriptive titles for easy discovery{'\n'}
          • Tag with relevant keywords for searchability
        </Text>
      </View>
    </View>
  );

  const renderAnalytics = () => (
    <View style={{ padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>
        Highlight Analytics
      </Text>

      {analytics && (
        <>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: colors.primary }}>{analytics.totalReels}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Total Reels</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: colors.success }}>{analytics.totalViews}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Total Views</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: colors.error }}>{analytics.totalLikes}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Total Likes</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: colors.warning }}>{analytics.totalShares}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Total Shares</Text>
            </View>
          </View>

          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
              Reels by Category
            </Text>
            {CATEGORIES.map((cat) => (
              <View key={cat.value} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text>{cat.icon}</Text>
                  <Text style={{ color: colors.muted }}>{cat.label}</Text>
                </View>
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>
                  {analytics.reelsByCategory[cat.value]}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
              Top Reels
            </Text>
            {analytics.topReels.map((reel, i) => (
              <View key={reel.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Text style={{ color: colors.primary, fontWeight: '600' }}>#{i + 1}</Text>
                  <Text style={{ color: colors.foreground }} numberOfLines={1}>{reel.title}</Text>
                </View>
                <Text style={{ color: colors.muted }}>{reel.views} views</Text>
              </View>
            ))}
          </View>

          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
              Storage Usage
            </Text>
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.primary }}>
              {formatFileSize(analytics.storageUsed)}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              Avg {analytics.averageSegmentsPerReel.toFixed(1)} segments per reel
            </Text>
          </View>
        </>
      )}
    </View>
  );

  return (
    <ScreenContainer>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ fontSize: 24 }}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>
            Highlight Reels
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>
            Training Clips & Shareable Content
          </Text>
        </View>
      </View>

      {renderTabs()}

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'gallery' && renderGallery()}
        {activeTab === 'create' && renderCreate()}
        {activeTab === 'playlists' && (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📁</Text>
            <Text style={{ color: colors.muted, textAlign: 'center' }}>Playlists coming soon</Text>
          </View>
        )}
        {activeTab === 'analytics' && renderAnalytics()}
      </ScrollView>
    </ScreenContainer>
  );
}
