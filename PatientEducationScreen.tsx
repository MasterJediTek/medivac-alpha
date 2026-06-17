/**
 * Patient Education Video Library Screen
 * MediVac One v3.3
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import patientEducationService, {
  EducationVideo,
  VideoCategory,
  VideoAssignment,
} from '@/src/services/PatientEducationService';

const DISCO_COLORS = {
  neonPink: '#FF1493',
  neonCyan: '#00FFFF',
  neonPurple: '#9400D3',
  neonGreen: '#39FF14',
  neonOrange: '#FF6600',
  darkBg: '#1a1a2e',
  cardBg: '#16213e',
};

const CATEGORY_ICONS: Record<VideoCategory, string> = {
  cardiac: '❤️',
  respiratory: '🫁',
  diabetes: '💉',
  orthopedic: '🦴',
  oncology: '🎗️',
  surgical: '🏥',
  medication: '💊',
  nutrition: '🥗',
  rehabilitation: '🏃',
  mental_health: '🧠',
  general_wellness: '✨',
};

export default function PatientEducationScreen() {
  const [activeTab, setActiveTab] = useState<'library' | 'assignments' | 'history'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory | 'all'>('all');
  const [selectedVideo, setSelectedVideo] = useState<EducationVideo | null>(null);

  const allVideos = patientEducationService.getAllVideos();
  const filteredVideos = searchQuery
    ? patientEducationService.searchVideos(searchQuery)
    : selectedCategory === 'all'
    ? allVideos
    : patientEducationService.getVideosByCategory(selectedCategory);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderVideoCard = (video: EducationVideo) => (
    <TouchableOpacity
      key={video.id}
      style={styles.videoCard}
      onPress={() => setSelectedVideo(video)}
    >
      <View style={styles.thumbnailContainer}>
        <View style={styles.thumbnail}>
          <Text style={styles.categoryIcon}>{CATEGORY_ICONS[video.category]}</Text>
        </View>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(video.duration)}</Text>
        </View>
      </View>
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
        <Text style={styles.videoDescription} numberOfLines={2}>{video.description}</Text>
        <View style={styles.videoMeta}>
          <Text style={styles.metaText}>👁 {video.viewCount}</Text>
          <Text style={styles.metaText}>⭐ {video.averageRating}</Text>
          {video.hasQuiz && <Text style={styles.quizBadge}>📝 Quiz</Text>}
        </View>
        <View style={styles.languageTags}>
          {video.availableLanguages.slice(0, 3).map((lang) => (
            <View key={lang} style={styles.languageTag}>
              <Text style={styles.languageText}>{lang.toUpperCase()}</Text>
            </View>
          ))}
          {video.availableLanguages.length > 3 && (
            <Text style={styles.moreLanguages}>+{video.availableLanguages.length - 3}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderVideoDetail = () => {
    if (!selectedVideo) return null;

    const analytics = patientEducationService.getVideoAnalytics(selectedVideo.id);

    return (
      <View style={styles.detailOverlay}>
        <View style={styles.detailCard}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedVideo(null)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.detailHeader}>
            <View style={styles.detailThumbnail}>
              <Text style={styles.detailIcon}>{CATEGORY_ICONS[selectedVideo.category]}</Text>
            </View>
            <View style={styles.detailTitleContainer}>
              <Text style={styles.detailTitle}>{selectedVideo.title}</Text>
              <Text style={styles.detailCategory}>
                {selectedVideo.category.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.detailDescription}>{selectedVideo.description}</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{analytics.totalViews}</Text>
              <Text style={styles.statLabel}>Total Views</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{analytics.completionRate}%</Text>
              <Text style={styles.statLabel}>Completion Rate</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatDuration(analytics.averageWatchTime)}</Text>
              <Text style={styles.statLabel}>Avg Watch Time</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{analytics.averageQuizScore}%</Text>
              <Text style={styles.statLabel}>Avg Quiz Score</Text>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Available Languages</Text>
            <View style={styles.languageList}>
              {selectedVideo.availableLanguages.map((lang) => (
                <View key={lang} style={styles.languageChip}>
                  <Text style={styles.languageChipText}>{lang.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          </View>

          {selectedVideo.icdCodes.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Related Diagnoses (ICD-10)</Text>
              <View style={styles.icdList}>
                {selectedVideo.icdCodes.map((code) => (
                  <View key={code} style={styles.icdChip}>
                    <Text style={styles.icdChipText}>{code}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.playButton}>
              <Text style={styles.playButtonText}>▶ Play Video</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.assignButton}>
              <Text style={styles.assignButtonText}>📋 Assign to Patient</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderCategoryFilter = () => {
    const categories: (VideoCategory | 'all')[] = [
      'all',
      'cardiac',
      'diabetes',
      'respiratory',
      'surgical',
      'medication',
      'nutrition',
    ];

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              selectedCategory === cat && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === cat && styles.categoryChipTextActive,
              ]}
            >
              {cat === 'all' ? '📚 All' : `${CATEGORY_ICONS[cat]} ${cat.replace('_', ' ')}`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🎬 Patient Education</Text>
          <Text style={styles.subtitle}>Video Library & Learning Center</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {(['library', 'assignments', 'history'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'library' ? '📚 Library' : tab === 'assignments' ? '📋 Assigned' : '📊 History'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'library' && (
          <>
            {/* Search */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="🔍 Search videos..."
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Category Filter */}
            {renderCategoryFilter()}

            {/* Video Grid */}
            <ScrollView style={styles.videoList}>
              <View style={styles.videoGrid}>
                {filteredVideos.map(renderVideoCard)}
              </View>
              {filteredVideos.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🎥</Text>
                  <Text style={styles.emptyText}>No videos found</Text>
                </View>
              )}
            </ScrollView>
          </>
        )}

        {activeTab === 'assignments' && (
          <ScrollView style={styles.assignmentList}>
            <View style={styles.assignmentCard}>
              <Text style={styles.assignmentTitle}>📋 Patient Video Assignments</Text>
              <Text style={styles.assignmentDescription}>
                Assign educational videos to patients and track their progress.
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>12</Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>45</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>3</Text>
                  <Text style={styles.statLabel}>Overdue</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        )}

        {activeTab === 'history' && (
          <ScrollView style={styles.historyList}>
            <View style={styles.historyCard}>
              <Text style={styles.historyTitle}>📊 Viewing Analytics</Text>
              <View style={styles.analyticsGrid}>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>1,250</Text>
                  <Text style={styles.analyticsLabel}>Total Views</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>87%</Text>
                  <Text style={styles.analyticsLabel}>Avg Completion</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>82%</Text>
                  <Text style={styles.analyticsLabel}>Avg Quiz Score</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>156h</Text>
                  <Text style={styles.analyticsLabel}>Total Watch Time</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Video Detail Modal */}
        {selectedVideo && renderVideoDetail()}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DISCO_COLORS.darkBg,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: DISCO_COLORS.neonPurple + '40',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: DISCO_COLORS.neonCyan,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: DISCO_COLORS.cardBg,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: DISCO_COLORS.neonPurple,
  },
  tabText: {
    color: '#888',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  searchContainer: {
    padding: 10,
  },
  searchInput: {
    backgroundColor: DISCO_COLORS.cardBg,
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    borderWidth: 1,
    borderColor: DISCO_COLORS.neonCyan + '40',
  },
  categoryScroll: {
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: DISCO_COLORS.cardBg,
    marginRight: 10,
    borderWidth: 1,
    borderColor: DISCO_COLORS.neonPink + '40',
  },
  categoryChipActive: {
    backgroundColor: DISCO_COLORS.neonPink,
    borderColor: DISCO_COLORS.neonPink,
  },
  categoryChipText: {
    color: '#888',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  videoList: {
    flex: 1,
    padding: 10,
  },
  videoGrid: {
    gap: 15,
  },
  videoCard: {
    backgroundColor: DISCO_COLORS.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DISCO_COLORS.neonCyan + '30',
  },
  thumbnailContainer: {
    height: 120,
    backgroundColor: DISCO_COLORS.darkBg,
    position: 'relative',
  },
  thumbnail: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 48,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  videoInfo: {
    padding: 12,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  videoDescription: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  videoMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: DISCO_COLORS.neonCyan,
  },
  quizBadge: {
    fontSize: 12,
    color: DISCO_COLORS.neonGreen,
  },
  languageTags: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  languageTag: {
    backgroundColor: DISCO_COLORS.neonPurple + '40',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  languageText: {
    fontSize: 10,
    color: DISCO_COLORS.neonPurple,
    fontWeight: '600',
  },
  moreLanguages: {
    fontSize: 10,
    color: '#888',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  detailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    padding: 20,
  },
  detailCard: {
    backgroundColor: DISCO_COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    maxHeight: '90%',
    borderWidth: 2,
    borderColor: DISCO_COLORS.neonCyan,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#888',
  },
  detailHeader: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  detailThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: DISCO_COLORS.darkBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 40,
  },
  detailTitleContainer: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  detailCategory: {
    fontSize: 12,
    color: DISCO_COLORS.neonPink,
    marginTop: 4,
  },
  detailDescription: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 20,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: DISCO_COLORS.darkBg,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DISCO_COLORS.neonCyan,
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  detailSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  languageList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageChip: {
    backgroundColor: DISCO_COLORS.neonPurple + '40',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  languageChipText: {
    color: DISCO_COLORS.neonPurple,
    fontWeight: '600',
  },
  icdList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  icdChip: {
    backgroundColor: DISCO_COLORS.neonGreen + '30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  icdChipText: {
    color: DISCO_COLORS.neonGreen,
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  playButton: {
    flex: 1,
    backgroundColor: DISCO_COLORS.neonPink,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  playButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  assignButton: {
    flex: 1,
    backgroundColor: DISCO_COLORS.neonCyan + '30',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DISCO_COLORS.neonCyan,
  },
  assignButtonText: {
    color: DISCO_COLORS.neonCyan,
    fontWeight: 'bold',
  },
  assignmentList: {
    flex: 1,
    padding: 15,
  },
  assignmentCard: {
    backgroundColor: DISCO_COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: DISCO_COLORS.neonPink + '40',
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  assignmentDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: DISCO_COLORS.darkBg,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: DISCO_COLORS.neonCyan,
  },
  historyList: {
    flex: 1,
    padding: 15,
  },
  historyCard: {
    backgroundColor: DISCO_COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: DISCO_COLORS.neonGreen + '40',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  analyticsItem: {
    width: '48%',
    backgroundColor: DISCO_COLORS.darkBg,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DISCO_COLORS.neonGreen,
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
});
