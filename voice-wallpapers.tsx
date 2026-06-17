/**
 * Voice-Activated Wallpapers Screen
 * MediVac WACHS v9.0
 */

import { useState, useEffect } from 'react';
import { ScrollView, Text, View, Pressable, Switch } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { voiceActivatedWallpapersService, VoiceWallpaperTrigger, WallpaperPlaylist, WallpaperMood } from '@/lib/services/voice-activated-wallpapers-service';

const MOOD_COLORS: Record<WallpaperMood, string> = {
  calm: '#3f51b5',
  energize: '#ff5722',
  focus: '#607d8b',
  relax: '#673ab7',
  adventure: '#4caf50',
  mystery: '#424242',
  celebration: '#e91e63',
  nature: '#8bc34a',
  space: '#1565c0',
  jedi: '#00bcd4',
};

const MOOD_ICONS: Record<WallpaperMood, string> = {
  calm: '🧘',
  energize: '⚡',
  focus: '🎯',
  relax: '😌',
  adventure: '🗺️',
  mystery: '🌙',
  celebration: '🎉',
  nature: '🌿',
  space: '🚀',
  jedi: '⚔️',
};

export default function VoiceWallpapersScreen() {
  const [activeTab, setActiveTab] = useState<'triggers' | 'playlists' | 'moods' | 'settings'>('triggers');
  const [triggers, setTriggers] = useState<VoiceWallpaperTrigger[]>([]);
  const [playlists, setPlaylists] = useState<WallpaperPlaylist[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [recognizedPhrase, setRecognizedPhrase] = useState<string | null>(null);
  const [feedbackMode, setFeedbackMode] = useState(voiceActivatedWallpapersService.getFeedbackMode());
  const [, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const unsubscribe = voiceActivatedWallpapersService.subscribe(() => {
      setTriggers(voiceActivatedWallpapersService.getAllTriggers());
      setPlaylists(voiceActivatedWallpapersService.getAllPlaylists());
      setFeedbackMode(voiceActivatedWallpapersService.getFeedbackMode());
      setUpdateTrigger(prev => prev + 1);
    });

    setTriggers(voiceActivatedWallpapersService.getAllTriggers());
    setPlaylists(voiceActivatedWallpapersService.getAllPlaylists());

    return unsubscribe;
  }, []);

  const handleStartListening = () => {
    setIsListening(true);
    setRecognizedPhrase(null);
    voiceActivatedWallpapersService.startListening();
    
    // Simulate voice recognition after 2 seconds
    setTimeout(() => {
      const phrases = ['hyperspace', 'calm', 'jedi', 'energize', 'nature'];
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      setRecognizedPhrase(randomPhrase);
      voiceActivatedWallpapersService.processVoiceInput(randomPhrase, 0.92);
      setIsListening(false);
    }, 2000);
  };

  const handleToggleTrigger = (id: string) => {
    voiceActivatedWallpapersService.toggleTrigger(id);
  };

  const handleStartPlaylist = (id: string) => {
    voiceActivatedWallpapersService.startPlaylist(id);
  };

  const handleStopPlaylist = (id: string) => {
    voiceActivatedWallpapersService.stopPlaylist(id);
  };

  const analytics = voiceActivatedWallpapersService.getAnalytics();

  const renderTriggers = () => (
    <View className="gap-4">
      {/* Voice Activation Button */}
      <Pressable
        onPress={handleStartListening}
        style={({ pressed }) => [
          {
            backgroundColor: isListening ? '#f44336' : '#00bcd4',
            padding: 24,
            borderRadius: 100,
            alignItems: 'center',
            alignSelf: 'center',
            width: 150,
            height: 150,
            justifyContent: 'center',
            transform: [{ scale: pressed ? 0.95 : 1 }],
            shadowColor: isListening ? '#f44336' : '#00bcd4',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 20,
          },
        ]}
      >
        <Text style={{ fontSize: 48 }}>{isListening ? '🎤' : '🎙️'}</Text>
        <Text className="text-white font-bold mt-2">
          {isListening ? 'Listening...' : 'Tap to Speak'}
        </Text>
      </Pressable>

      {recognizedPhrase && (
        <View className="bg-surface p-4 rounded-xl border border-border items-center">
          <Text className="text-muted text-sm">Recognized:</Text>
          <Text className="text-foreground text-xl font-bold">"{recognizedPhrase}"</Text>
          <Text className="text-success text-sm mt-1">✓ Wallpaper Changed</Text>
        </View>
      )}

      {/* Triggers List */}
      <Text className="text-foreground text-lg font-bold mt-4">Voice Triggers</Text>
      {triggers.map((trigger) => (
        <View key={trigger.id} className="bg-surface p-4 rounded-xl border border-border">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                {trigger.mood && (
                  <Text style={{ fontSize: 20 }}>{MOOD_ICONS[trigger.mood]}</Text>
                )}
                <Text className="text-foreground font-semibold">
                  {trigger.phrases[0]}
                </Text>
              </View>
              <Text className="text-muted text-sm mt-1">
                Phrases: {trigger.phrases.join(', ')}
              </Text>
              <View className="flex-row items-center gap-2 mt-2">
                <View 
                  style={{ 
                    backgroundColor: trigger.mood ? MOOD_COLORS[trigger.mood] : '#666',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 12,
                  }}
                >
                  <Text className="text-white text-xs">{trigger.mood || 'Custom'}</Text>
                </View>
                <Text className="text-muted text-xs">
                  {trigger.activationCount} activations
                </Text>
              </View>
            </View>
            <Switch
              value={trigger.isEnabled}
              onValueChange={() => handleToggleTrigger(trigger.id)}
              trackColor={{ false: '#767577', true: '#00bcd4' }}
            />
          </View>
        </View>
      ))}
    </View>
  );

  const renderPlaylists = () => (
    <View className="gap-4">
      <Text className="text-foreground text-lg font-bold">Wallpaper Playlists</Text>
      <Text className="text-muted text-sm">
        Say the voice trigger to start a playlist automatically
      </Text>

      {playlists.map((playlist) => (
        <View key={playlist.id} className="bg-surface p-4 rounded-xl border border-border">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-foreground font-semibold text-lg">{playlist.name}</Text>
              <Text className="text-muted text-sm mt-1">{playlist.description}</Text>
              <View className="flex-row items-center gap-2 mt-2">
                <Text className="text-muted text-xs">
                  🖼️ {playlist.wallpaperIds.length} wallpapers
                </Text>
                <Text className="text-muted text-xs">
                  ⏱️ {playlist.intervalSeconds}s interval
                </Text>
              </View>
              {playlist.voiceTrigger && (
                <View className="bg-primary/20 px-3 py-1 rounded-full mt-2 self-start">
                  <Text className="text-primary text-sm">🎤 "{playlist.voiceTrigger}"</Text>
                </View>
              )}
            </View>
            <Pressable
              onPress={() => playlist.isPlaying ? handleStopPlaylist(playlist.id) : handleStartPlaylist(playlist.id)}
              style={({ pressed }) => [
                {
                  backgroundColor: playlist.isPlaying ? '#f44336' : '#4caf50',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                },
              ]}
            >
              <Text className="text-white font-semibold">
                {playlist.isPlaying ? '⏹️ Stop' : '▶️ Play'}
              </Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );

  const renderMoods = () => (
    <View className="gap-4">
      <Text className="text-foreground text-lg font-bold">Mood-Based Wallpapers</Text>
      <Text className="text-muted text-sm">
        Say any keyword to activate the matching mood wallpaper
      </Text>

      <View className="flex-row flex-wrap gap-3">
        {(Object.keys(MOOD_COLORS) as WallpaperMood[]).map((mood) => {
          const mapping = voiceActivatedWallpapersService.getMoodMapping(mood);
          return (
            <Pressable
              key={mood}
              style={({ pressed }) => [
                {
                  backgroundColor: MOOD_COLORS[mood],
                  padding: 16,
                  borderRadius: 16,
                  width: '47%',
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                  shadowColor: MOOD_COLORS[mood],
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                },
              ]}
            >
              <Text style={{ fontSize: 32 }}>{MOOD_ICONS[mood]}</Text>
              <Text className="text-white font-bold text-lg mt-2 capitalize">{mood}</Text>
              {mapping && (
                <Text className="text-white/70 text-xs mt-1">
                  Keywords: {mapping.keywords.slice(0, 3).join(', ')}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderSettings = () => (
    <View className="gap-4">
      <Text className="text-foreground text-lg font-bold">Voice Settings</Text>

      {/* Feedback Mode */}
      <View className="bg-surface p-4 rounded-xl border border-border">
        <Text className="text-foreground font-semibold mb-3">Voice Feedback</Text>
        {(['silent', 'beep', 'chime', 'voice', 'jedi-sound'] as const).map((mode) => (
          <Pressable
            key={mode}
            onPress={() => voiceActivatedWallpapersService.setFeedbackMode(mode)}
            style={({ pressed }) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                borderRadius: 8,
                backgroundColor: feedbackMode === mode ? '#00bcd4' : 'transparent',
                transform: [{ scale: pressed ? 0.98 : 1 }],
                marginBottom: 4,
              },
            ]}
          >
            <Text style={{ fontSize: 20, marginRight: 12 }}>
              {mode === 'silent' ? '🔇' : mode === 'beep' ? '🔔' : mode === 'chime' ? '🎵' : mode === 'voice' ? '🗣️' : '⚔️'}
            </Text>
            <Text style={{ color: feedbackMode === mode ? '#fff' : '#9BA1A6', textTransform: 'capitalize' }}>
              {mode.replace('-', ' ')}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Analytics */}
      <View className="bg-surface p-4 rounded-xl border border-border">
        <Text className="text-foreground font-semibold mb-3">Analytics</Text>
        <View className="gap-2">
          <View className="flex-row justify-between">
            <Text className="text-muted">Total Activations</Text>
            <Text className="text-foreground font-semibold">{analytics.totalActivations}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Successful</Text>
            <Text className="text-success font-semibold">{analytics.successfulActivations}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Failed</Text>
            <Text className="text-error font-semibold">{analytics.failedActivations}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Avg Confidence</Text>
            <Text className="text-foreground font-semibold">{(analytics.avgConfidence * 100).toFixed(1)}%</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 px-4">
        <Text className="text-foreground text-2xl font-bold mt-4">Voice Wallpapers</Text>
        <Text className="text-muted mb-4">Speak to change your wallpaper instantly</Text>

        {/* Tabs */}
        <View className="flex-row gap-2 mb-4">
          {(['triggers', 'playlists', 'moods', 'settings'] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={({ pressed }) => [
                {
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: activeTab === tab ? '#00bcd4' : '#1e2022',
                  alignItems: 'center',
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                },
              ]}
            >
              <Text style={{ color: activeTab === tab ? '#fff' : '#9BA1A6', fontWeight: '600', textTransform: 'capitalize' }}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === 'triggers' && renderTriggers()}
        {activeTab === 'playlists' && renderPlaylists()}
        {activeTab === 'moods' && renderMoods()}
        {activeTab === 'settings' && renderSettings()}

        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
