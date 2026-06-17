/**
 * Recording Highlights and Clips Screen
 * Mark key moments and create shareable clips
 * MediVac One v6.0
 */

import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { 
  recordingHighlightsService, 
  Highlight, 
  Clip, 
  HIGHLIGHT_TYPES,
  HighlightType 
} from "@/lib/services/recording-highlights-service";

type TabType = 'highlights' | 'clips' | 'analytics';

export default function RecordingHighlightsScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('highlights');
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateHighlight, setShowCreateHighlight] = useState(false);
  const [showCreateClip, setShowCreateClip] = useState(false);
  const [selectedType, setSelectedType] = useState<HighlightType>('key_moment');
  const [newHighlight, setNewHighlight] = useState({ title: '', description: '', timestamp: '0', duration: '30' });
  const [newClip, setNewClip] = useState({ title: '', description: '', startTime: '0', endTime: '60' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await recordingHighlightsService.initialize();
    setHighlights(recordingHighlightsService.getHighlights());
    setClips(recordingHighlightsService.getClips());
    setLoading(false);
  };

  const handleCreateHighlight = async () => {
    if (!newHighlight.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    await recordingHighlightsService.createHighlight({
      recordingId: 'rec_1',
      type: selectedType,
      title: newHighlight.title,
      description: newHighlight.description,
      timestamp: parseInt(newHighlight.timestamp) || 0,
      duration: parseInt(newHighlight.duration) || 30,
      createdBy: 'Current User',
      tags: [],
      isBookmarked: false,
    });

    setNewHighlight({ title: '', description: '', timestamp: '0', duration: '30' });
    setShowCreateHighlight(false);
    loadData();
    Alert.alert('Success', 'Highlight created');
  };

  const handleCreateClip = async () => {
    if (!newClip.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    await recordingHighlightsService.createClip({
      recordingId: 'rec_1',
      title: newClip.title,
      description: newClip.description,
      startTime: parseInt(newClip.startTime) || 0,
      endTime: parseInt(newClip.endTime) || 60,
      createdBy: 'Current User',
    });

    setNewClip({ title: '', description: '', startTime: '0', endTime: '60' });
    setShowCreateClip(false);
    loadData();
    Alert.alert('Success', 'Clip is being processed');
  };

  const handleToggleBookmark = async (id: string) => {
    await recordingHighlightsService.toggleBookmark(id);
    loadData();
  };

  const handleShareClip = async (id: string) => {
    await recordingHighlightsService.shareClip(id, 30);
    loadData();
    Alert.alert('Success', 'Clip shared for 30 days');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderHighlights = () => (
    <View className="gap-4">
      <View className="flex-row justify-between items-center">
        <Text className="text-lg font-semibold text-foreground">Highlights</Text>
        <TouchableOpacity
          onPress={() => setShowCreateHighlight(true)}
          className="bg-primary px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-medium">+ Add Highlight</Text>
        </TouchableOpacity>
      </View>

      {showCreateHighlight && (
        <View className="bg-surface rounded-xl p-4 border border-border gap-3">
          <Text className="font-semibold text-foreground">New Highlight</Text>
          
          <View className="flex-row flex-wrap gap-2">
            {(Object.keys(HIGHLIGHT_TYPES) as HighlightType[]).map(type => (
              <TouchableOpacity
                key={type}
                onPress={() => setSelectedType(type)}
                className="px-3 py-1 rounded-full"
                style={{ 
                  backgroundColor: selectedType === type 
                    ? HIGHLIGHT_TYPES[type].color 
                    : colors.background 
                }}
              >
                <Text style={{ 
                  color: selectedType === type ? '#FFFFFF' : colors.muted 
                }}>
                  {HIGHLIGHT_TYPES[type].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            value={newHighlight.title}
            onChangeText={(text) => setNewHighlight(prev => ({ ...prev, title: text }))}
            placeholder="Highlight title"
            placeholderTextColor={colors.muted}
            className="bg-background rounded-lg px-4 py-3 text-foreground border border-border"
          />

          <TextInput
            value={newHighlight.description}
            onChangeText={(text) => setNewHighlight(prev => ({ ...prev, description: text }))}
            placeholder="Description (optional)"
            placeholderTextColor={colors.muted}
            className="bg-background rounded-lg px-4 py-3 text-foreground border border-border"
            multiline
          />

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Text className="text-muted text-sm mb-1">Timestamp (sec)</Text>
              <TextInput
                value={newHighlight.timestamp}
                onChangeText={(text) => setNewHighlight(prev => ({ ...prev, timestamp: text }))}
                keyboardType="numeric"
                className="bg-background rounded-lg px-4 py-3 text-foreground border border-border"
              />
            </View>
            <View className="flex-1">
              <Text className="text-muted text-sm mb-1">Duration (sec)</Text>
              <TextInput
                value={newHighlight.duration}
                onChangeText={(text) => setNewHighlight(prev => ({ ...prev, duration: text }))}
                keyboardType="numeric"
                className="bg-background rounded-lg px-4 py-3 text-foreground border border-border"
              />
            </View>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setShowCreateHighlight(false)}
              className="flex-1 bg-background py-3 rounded-lg border border-border"
            >
              <Text className="text-center text-foreground">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCreateHighlight}
              className="flex-1 bg-primary py-3 rounded-lg"
            >
              <Text className="text-center text-white font-medium">Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {highlights.map(highlight => (
        <View key={highlight.id} className="bg-surface rounded-xl p-4 border border-border">
          <View className="flex-row items-start justify-between">
            <View className="flex-row items-center gap-2 flex-1">
              <View 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: HIGHLIGHT_TYPES[highlight.type].color }}
              />
              <Text className="font-semibold text-foreground flex-1">{highlight.title}</Text>
            </View>
            <TouchableOpacity onPress={() => handleToggleBookmark(highlight.id)}>
              <IconSymbol 
                name={highlight.isBookmarked ? "star.fill" : "star"} 
                size={20} 
                color={highlight.isBookmarked ? "#F59E0B" : colors.muted} 
              />
            </TouchableOpacity>
          </View>

          {highlight.description && (
            <Text className="text-muted text-sm mt-2">{highlight.description}</Text>
          )}

          <View className="flex-row items-center gap-4 mt-3">
            <View className="flex-row items-center gap-1">
              <IconSymbol name="clock" size={14} color={colors.muted} />
              <Text className="text-muted text-sm">{formatTime(highlight.timestamp)}</Text>
            </View>
            <View 
              className="px-2 py-0.5 rounded"
              style={{ backgroundColor: HIGHLIGHT_TYPES[highlight.type].color + '20' }}
            >
              <Text style={{ color: HIGHLIGHT_TYPES[highlight.type].color, fontSize: 12 }}>
                {HIGHLIGHT_TYPES[highlight.type].label}
              </Text>
            </View>
            <Text className="text-muted text-sm">{highlight.createdBy}</Text>
          </View>

          {highlight.tags.length > 0 && (
            <View className="flex-row flex-wrap gap-1 mt-2">
              {highlight.tags.map(tag => (
                <View key={tag} className="bg-background px-2 py-0.5 rounded">
                  <Text className="text-muted text-xs">#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderClips = () => (
    <View className="gap-4">
      <View className="flex-row justify-between items-center">
        <Text className="text-lg font-semibold text-foreground">Clips</Text>
        <TouchableOpacity
          onPress={() => setShowCreateClip(true)}
          className="bg-primary px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-medium">+ Create Clip</Text>
        </TouchableOpacity>
      </View>

      {showCreateClip && (
        <View className="bg-surface rounded-xl p-4 border border-border gap-3">
          <Text className="font-semibold text-foreground">New Clip</Text>

          <TextInput
            value={newClip.title}
            onChangeText={(text) => setNewClip(prev => ({ ...prev, title: text }))}
            placeholder="Clip title"
            placeholderTextColor={colors.muted}
            className="bg-background rounded-lg px-4 py-3 text-foreground border border-border"
          />

          <TextInput
            value={newClip.description}
            onChangeText={(text) => setNewClip(prev => ({ ...prev, description: text }))}
            placeholder="Description (optional)"
            placeholderTextColor={colors.muted}
            className="bg-background rounded-lg px-4 py-3 text-foreground border border-border"
            multiline
          />

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Text className="text-muted text-sm mb-1">Start Time (sec)</Text>
              <TextInput
                value={newClip.startTime}
                onChangeText={(text) => setNewClip(prev => ({ ...prev, startTime: text }))}
                keyboardType="numeric"
                className="bg-background rounded-lg px-4 py-3 text-foreground border border-border"
              />
            </View>
            <View className="flex-1">
              <Text className="text-muted text-sm mb-1">End Time (sec)</Text>
              <TextInput
                value={newClip.endTime}
                onChangeText={(text) => setNewClip(prev => ({ ...prev, endTime: text }))}
                keyboardType="numeric"
                className="bg-background rounded-lg px-4 py-3 text-foreground border border-border"
              />
            </View>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setShowCreateClip(false)}
              className="flex-1 bg-background py-3 rounded-lg border border-border"
            >
              <Text className="text-center text-foreground">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCreateClip}
              className="flex-1 bg-primary py-3 rounded-lg"
            >
              <Text className="text-center text-white font-medium">Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {clips.map(clip => (
        <View key={clip.id} className="bg-surface rounded-xl p-4 border border-border">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="font-semibold text-foreground">{clip.title}</Text>
              {clip.description && (
                <Text className="text-muted text-sm mt-1">{clip.description}</Text>
              )}
            </View>
            <View 
              className="px-2 py-1 rounded"
              style={{ 
                backgroundColor: clip.status === 'ready' ? '#10B98120' : 
                                 clip.status === 'shared' ? '#3B82F620' : 
                                 clip.status === 'processing' ? '#F59E0B20' : '#EF444420'
              }}
            >
              <Text style={{ 
                color: clip.status === 'ready' ? '#10B981' : 
                       clip.status === 'shared' ? '#3B82F6' : 
                       clip.status === 'processing' ? '#F59E0B' : '#EF4444',
                fontSize: 12
              }}>
                {clip.status.charAt(0).toUpperCase() + clip.status.slice(1)}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-4 mt-3">
            <View className="flex-row items-center gap-1">
              <IconSymbol name="clock" size={14} color={colors.muted} />
              <Text className="text-muted text-sm">
                {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
              </Text>
            </View>
            <Text className="text-muted text-sm">{formatTime(clip.duration)} duration</Text>
          </View>

          <View className="flex-row items-center gap-4 mt-2">
            <View className="flex-row items-center gap-1">
              <IconSymbol name="eye.fill" size={14} color={colors.muted} />
              <Text className="text-muted text-sm">{clip.viewCount} views</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <IconSymbol name="arrow.down.circle" size={14} color={colors.muted} />
              <Text className="text-muted text-sm">{clip.downloadCount} downloads</Text>
            </View>
          </View>

          {clip.shareCode && (
            <View className="bg-background rounded-lg p-3 mt-3">
              <Text className="text-muted text-sm">Share Code</Text>
              <Text className="text-foreground font-mono font-semibold">{clip.shareCode}</Text>
            </View>
          )}

          <View className="flex-row gap-2 mt-3">
            {clip.status === 'ready' && (
              <TouchableOpacity
                onPress={() => handleShareClip(clip.id)}
                className="flex-1 bg-primary py-2 rounded-lg"
              >
                <Text className="text-center text-white font-medium">Share</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => Alert.alert('Play', 'Opening clip player...')}
              className="flex-1 bg-background py-2 rounded-lg border border-border"
            >
              <Text className="text-center text-foreground">Play</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderAnalytics = () => {
    const highlightAnalytics = recordingHighlightsService.getHighlightAnalytics();
    const clipAnalytics = recordingHighlightsService.getClipAnalytics();

    return (
      <View className="gap-4">
        <Text className="text-lg font-semibold text-foreground">Analytics</Text>

        <View className="flex-row gap-3">
          <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
            <Text className="text-muted text-sm">Total Highlights</Text>
            <Text className="text-2xl font-bold text-foreground">{highlightAnalytics.totalHighlights}</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
            <Text className="text-muted text-sm">Total Clips</Text>
            <Text className="text-2xl font-bold text-foreground">{clipAnalytics.totalClips}</Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
            <Text className="text-muted text-sm">Total Views</Text>
            <Text className="text-2xl font-bold text-primary">{clipAnalytics.totalViews}</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
            <Text className="text-muted text-sm">Downloads</Text>
            <Text className="text-2xl font-bold text-foreground">{clipAnalytics.totalDownloads}</Text>
          </View>
        </View>

        <View className="bg-surface rounded-xl p-4 border border-border">
          <Text className="font-semibold text-foreground mb-3">Highlights by Type</Text>
          {(Object.keys(HIGHLIGHT_TYPES) as HighlightType[]).map(type => (
            <View key={type} className="flex-row items-center justify-between py-2">
              <View className="flex-row items-center gap-2">
                <View 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: HIGHLIGHT_TYPES[type].color }}
                />
                <Text className="text-foreground">{HIGHLIGHT_TYPES[type].label}</Text>
              </View>
              <Text className="text-muted">{highlightAnalytics.byType[type]}</Text>
            </View>
          ))}
        </View>

        <View className="bg-surface rounded-xl p-4 border border-border">
          <Text className="font-semibold text-foreground mb-3">Top Tags</Text>
          <View className="flex-row flex-wrap gap-2">
            {highlightAnalytics.topTagged.map(({ tag, count }) => (
              <View key={tag} className="bg-background px-3 py-1 rounded-full flex-row items-center gap-1">
                <Text className="text-foreground">#{tag}</Text>
                <Text className="text-muted text-sm">({count})</Text>
              </View>
            ))}
          </View>
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
            <Text className="text-2xl font-bold text-foreground">Recording Highlights</Text>
            <Text className="text-muted mt-1">Mark key moments and create shareable clips</Text>
          </View>

          <View className="flex-row bg-surface rounded-xl p-1">
            {(['highlights', 'clips', 'analytics'] as TabType[]).map(tab => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`flex-1 py-3 rounded-lg ${activeTab === tab ? 'bg-primary' : ''}`}
              >
                <Text className={`text-center font-medium ${activeTab === tab ? 'text-white' : 'text-muted'}`}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'highlights' && renderHighlights()}
          {activeTab === 'clips' && renderClips()}
          {activeTab === 'analytics' && renderAnalytics()}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
