/**
 * Highlight Reel Playlists Screen
 * Organize highlight reels into curated playlists for structured training programs
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  playlistService,
  Playlist,
  PlaylistCategory,
  UserProgress,
} from '@/lib/services/playlist-service';

type TabType = 'browse' | 'my_playlists' | 'progress' | 'analytics';

export default function PlaylistsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('browse');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [myPlaylists, setMyPlaylists] = useState<Playlist[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PlaylistCategory | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await playlistService.initialize();
      const allPlaylists = playlistService.getPlaylists({ isPublished: true });
      const userPlaylists = playlistService.getPlaylists({ createdBy: 'current_user' });
      const userProgress = playlistService.getUserProgress('current_user');
      
      setPlaylists(allPlaylists);
      setMyPlaylists(userPlaylists);
      setProgress(userProgress);
    } catch (error) {
      console.error('Failed to load playlists:', error);
    }
    setLoading(false);
  };

  const filteredPlaylists = playlists.filter(p => {
    const matchesSearch = searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      Alert.alert('Error', 'Please enter a playlist name');
      return;
    }

    try {
      await playlistService.createPlaylist(
        newPlaylistName,
        newPlaylistDescription,
        'custom',
        'private',
        'current_user',
        'Current User'
      );
      setShowCreateModal(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      loadData();
      Alert.alert('Success', 'Playlist created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create playlist');
    }
  };

  const handleStartPlaylist = async (playlistId: string) => {
    try {
      await playlistService.startPlaylist('current_user', 'Current User', playlistId);
      loadData();
      Alert.alert('Success', 'Playlist started! Track your progress in the Progress tab.');
    } catch (error) {
      Alert.alert('Error', 'Failed to start playlist');
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getCategoryIcon = (category: PlaylistCategory): string => {
    switch (category) {
      case 'training_program': return 'school';
      case 'onboarding': return 'person-add';
      case 'certification': return 'ribbon';
      case 'compliance': return 'shield-checkmark';
      case 'emergency_protocols': return 'warning';
      case 'best_practices': return 'star';
      default: return 'folder';
    }
  };

  const getCategoryColor = (category: PlaylistCategory): string => {
    switch (category) {
      case 'training_program': return '#3B82F6';
      case 'onboarding': return '#10B981';
      case 'certification': return '#F59E0B';
      case 'compliance': return '#8B5CF6';
      case 'emergency_protocols': return '#EF4444';
      case 'best_practices': return '#EC4899';
      default: return colors.primary;
    }
  };

  const renderPlaylistCard = (playlist: Playlist) => (
    <TouchableOpacity
      key={playlist.id}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
      onPress={() => handleStartPlaylist(playlist.id)}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: getCategoryColor(playlist.category) + '20',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons
            name={getCategoryIcon(playlist.category) as any}
            size={24}
            color={getCategoryColor(playlist.category)}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
            {playlist.name}
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
            by {playlist.createdByName}
          </Text>
        </View>
        {playlist.category === 'certification' && (
          <View
            style={{
              backgroundColor: '#F59E0B20',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 10, color: '#F59E0B', fontWeight: '600' }}>
              CERTIFICATION
            </Text>
          </View>
        )}
      </View>

      <Text
        style={{ fontSize: 14, color: colors.muted, marginBottom: 12 }}
        numberOfLines={2}
      >
        {playlist.description}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="play-circle" size={16} color={colors.muted} />
          <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 4 }}>
            {playlist.itemCount} items
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="time" size={16} color={colors.muted} />
          <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 4 }}>
            {formatDuration(playlist.totalDuration)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="eye" size={16} color={colors.muted} />
          <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 4 }}>
            {playlist.analytics.totalViews} views
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 4 }}>
            {playlist.analytics.ratings.average.toFixed(1)}
          </Text>
        </View>
      </View>

      {playlist.tags.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {playlist.tags.slice(0, 3).map((tag, index) => (
            <View
              key={index}
              style={{
                backgroundColor: colors.background,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
              }}
            >
              <Text style={{ fontSize: 10, color: colors.muted }}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderProgressCard = (userProgress: UserProgress) => {
    const completedItems = userProgress.itemProgress.filter(ip => ip.status === 'completed').length;
    const totalItems = userProgress.itemProgress.length;

    return (
      <View
        key={userProgress.id}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
              {userProgress.playlistName}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
              Started {new Date(userProgress.startedAt).toLocaleDateString()}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: userProgress.status === 'completed' ? '#10B98120' : '#3B82F620',
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: userProgress.status === 'completed' ? '#10B981' : '#3B82F6',
                fontWeight: '600',
              }}
            >
              {userProgress.status === 'completed' ? 'COMPLETED' : 'IN PROGRESS'}
            </Text>
          </View>
        </View>

        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 12, color: colors.muted }}>
              {completedItems} of {totalItems} items completed
            </Text>
            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>
              {Math.round(userProgress.overallProgress)}%
            </Text>
          </View>
          <View
            style={{
              height: 8,
              backgroundColor: colors.border,
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: '100%',
                width: `${userProgress.overallProgress}%`,
                backgroundColor: userProgress.status === 'completed' ? '#10B981' : colors.primary,
                borderRadius: 4,
              }}
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="time" size={14} color={colors.muted} />
            <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 4 }}>
              {formatDuration(userProgress.totalTimeSpent)} spent
            </Text>
          </View>
          {userProgress.certificateIssued && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="ribbon" size={14} color="#F59E0B" />
              <Text style={{ fontSize: 12, color: '#F59E0B', marginLeft: 4 }}>
                Certificate Earned
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderAnalytics = () => {
    const analytics = playlistService.getGlobalAnalytics();

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <View
            style={{
              flex: 1,
              minWidth: 140,
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="albums" size={24} color={colors.primary} />
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground, marginTop: 8 }}>
              {analytics.totalPlaylists}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>Total Playlists</Text>
          </View>
          <View
            style={{
              flex: 1,
              minWidth: 140,
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="people" size={24} color="#10B981" />
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground, marginTop: 8 }}>
              {analytics.activeUsers}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>Active Users</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <View
            style={{
              flex: 1,
              minWidth: 140,
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="checkmark-circle" size={24} color="#F59E0B" />
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground, marginTop: 8 }}>
              {analytics.completionRate.toFixed(0)}%
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>Completion Rate</Text>
          </View>
          <View
            style={{
              flex: 1,
              minWidth: 140,
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="time" size={24} color="#8B5CF6" />
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground, marginTop: 8 }}>
              {formatDuration(analytics.totalDuration)}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>Total Content</Text>
          </View>
        </View>

        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
          Top Playlists
        </Text>
        {analytics.topPlaylists.slice(0, 5).map((playlist, index) => (
          <View
            key={playlist.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 12,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: colors.primary,
                width: 30,
              }}
            >
              #{index + 1}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>
                {playlist.name}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                {playlist.views} views • {playlist.completionRate.toFixed(0)}% completion
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  const categories: { value: PlaylistCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'training_program', label: 'Training' },
    { value: 'certification', label: 'Certification' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'emergency_protocols', label: 'Emergency' },
    { value: 'best_practices', label: 'Best Practices' },
  ];

  return (
    <ScreenContainer>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ padding: 16, paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
              <Ionicons name="arrow-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>
                Playlists
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted }}>
                Curated training programs
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={{
                backgroundColor: colors.primary,
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { key: 'browse', label: 'Browse', icon: 'search' },
                { key: 'my_playlists', label: 'My Playlists', icon: 'folder' },
                { key: 'progress', label: 'Progress', icon: 'trending-up' },
                { key: 'analytics', label: 'Analytics', icon: 'bar-chart' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key as TabType)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 20,
                    backgroundColor: activeTab === tab.key ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: activeTab === tab.key ? colors.primary : colors.border,
                  }}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={16}
                    color={activeTab === tab.key ? '#FFFFFF' : colors.muted}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: activeTab === tab.key ? '#FFFFFF' : colors.muted,
                      marginLeft: 6,
                    }}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Content */}
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          {activeTab === 'browse' && (
            <>
              {/* Search */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="search" size={20} color={colors.muted} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search playlists..."
                  placeholderTextColor={colors.muted}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 8,
                    fontSize: 16,
                    color: colors.foreground,
                  }}
                />
              </View>

              {/* Categories */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 16 }}
              >
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      onPress={() => setSelectedCategory(cat.value)}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 16,
                        backgroundColor:
                          selectedCategory === cat.value ? colors.primary + '20' : colors.surface,
                        borderWidth: 1,
                        borderColor:
                          selectedCategory === cat.value ? colors.primary : colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: selectedCategory === cat.value ? colors.primary : colors.muted,
                          fontWeight: selectedCategory === cat.value ? '600' : '400',
                        }}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <FlatList
                data={filteredPlaylists}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => renderPlaylistCard(item)}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <Ionicons name="albums-outline" size={48} color={colors.muted} />
                    <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12 }}>
                      No playlists found
                    </Text>
                  </View>
                }
              />
            </>
          )}

          {activeTab === 'my_playlists' && (
            <FlatList
              data={myPlaylists}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => renderPlaylistCard(item)}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Ionicons name="folder-open-outline" size={48} color={colors.muted} />
                  <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12 }}>
                    No playlists created yet
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowCreateModal(true)}
                    style={{
                      marginTop: 16,
                      backgroundColor: colors.primary,
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                      borderRadius: 20,
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                      Create Playlist
                    </Text>
                  </TouchableOpacity>
                </View>
              }
            />
          )}

          {activeTab === 'progress' && (
            <FlatList
              data={progress}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => renderProgressCard(item)}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Ionicons name="trending-up-outline" size={48} color={colors.muted} />
                  <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12 }}>
                    No playlists started yet
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4, textAlign: 'center' }}>
                    Browse playlists and start learning
                  </Text>
                </View>
              }
            />
          )}

          {activeTab === 'analytics' && renderAnalytics()}
        </View>

        {/* Create Modal */}
        {showCreateModal && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
            }}
          >
            <View
              style={{
                backgroundColor: colors.background,
                borderRadius: 20,
                padding: 24,
                width: '100%',
                maxWidth: 400,
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground, marginBottom: 20 }}>
                Create Playlist
              </Text>

              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground, marginBottom: 8 }}>
                Name
              </Text>
              <TextInput
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                placeholder="Enter playlist name"
                placeholderTextColor={colors.muted}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 16,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: 16,
                }}
              />

              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground, marginBottom: 8 }}>
                Description
              </Text>
              <TextInput
                value={newPlaylistDescription}
                onChangeText={setNewPlaylistDescription}
                placeholder="Enter description"
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 16,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: 20,
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setShowCreateModal(false)}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: colors.surface,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreatePlaylist}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                    Create
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
