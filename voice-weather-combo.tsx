/**
 * Voice-Weather Combo UI Screen
 * MediVac WACHS v9.1
 */

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { 
  voiceWeatherComboService, 
  VoiceWeatherCommand, 
  WeatherOverride,
  WeatherMood 
} from '@/lib/services/voice-weather-combo-service';

type TabType = 'commands' | 'moods' | 'active' | 'analytics';

const MOOD_ICONS: Record<WeatherMood, string> = {
  'sunny-vibes': '☀️',
  'rainy-mood': '🌧️',
  'stormy-power': '⛈️',
  'snowy-calm': '❄️',
  'foggy-mystery': '🌫️',
  'windy-energy': '💨',
  'cloudy-chill': '☁️',
  'clear-focus': '🎯',
  'hot-intensity': '🔥',
  'cold-serenity': '🧊',
  'match-weather': '🌍',
  'auto': '🤖',
};

const MOOD_COLORS: Record<WeatherMood, string> = {
  'sunny-vibes': '#FFD700',
  'rainy-mood': '#4682B4',
  'stormy-power': '#483D8B',
  'snowy-calm': '#E0FFFF',
  'foggy-mystery': '#708090',
  'windy-energy': '#98FB98',
  'cloudy-chill': '#B0C4DE',
  'clear-focus': '#87CEEB',
  'hot-intensity': '#FF4500',
  'cold-serenity': '#ADD8E6',
  'match-weather': '#32CD32',
  'auto': '#9370DB',
};

export default function VoiceWeatherComboScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('commands');
  const [commands, setCommands] = useState<VoiceWeatherCommand[]>([]);
  const [activeOverride, setActiveOverride] = useState<WeatherOverride | null>(null);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [analytics, setAnalytics] = useState(voiceWeatherComboService.getAnalytics());
  const [testInput, setTestInput] = useState('');

  useEffect(() => {
    const unsubscribe = voiceWeatherComboService.subscribe(() => {
      setCommands(voiceWeatherComboService.getAllCommands());
      setActiveOverride(voiceWeatherComboService.getActiveOverride());
      setIsAutoMode(voiceWeatherComboService.isAutoModeEnabled());
      setAnalytics(voiceWeatherComboService.getAnalytics());
    });

    setCommands(voiceWeatherComboService.getAllCommands());
    setActiveOverride(voiceWeatherComboService.getActiveOverride());
    setIsAutoMode(voiceWeatherComboService.isAutoModeEnabled());

    return unsubscribe;
  }, []);

  const handleTestCommand = (phrase: string) => {
    const result = voiceWeatherComboService.processVoiceCommand(phrase);
    if (result.success) {
      // Command executed successfully
    }
  };

  const handleToggleCommand = (id: string) => {
    voiceWeatherComboService.toggleCommand(id);
  };

  const handleSetMood = (mood: WeatherMood) => {
    voiceWeatherComboService.createOverride(mood, 'manual');
  };

  const handleToggleAutoMode = (value: boolean) => {
    voiceWeatherComboService.setAutoMode(value);
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'commands', label: 'Commands', icon: '🎤' },
    { id: 'moods', label: 'Moods', icon: '🎨' },
    { id: 'active', label: 'Active', icon: '✨' },
    { id: 'analytics', label: 'Stats', icon: '📊' },
  ];

  const renderCommands = () => (
    <View className="gap-3">
      <View className="bg-surface rounded-xl p-4 border border-border">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold text-foreground">Auto Weather Mode</Text>
          <Switch
            value={isAutoMode}
            onValueChange={handleToggleAutoMode}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
        <Text className="text-sm text-muted">
          Automatically change wallpaper based on real weather conditions
        </Text>
      </View>

      <Text className="text-base font-semibold text-foreground mt-2">Voice Commands</Text>
      
      {commands.map((cmd) => (
        <Pressable
          key={cmd.id}
          onPress={() => handleTestCommand(cmd.phrase)}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <View className="bg-surface rounded-xl p-4 border border-border">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2 flex-1">
                <Text className="text-2xl">{MOOD_ICONS[cmd.targetMood]}</Text>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">"{cmd.phrase}"</Text>
                  <Text className="text-xs text-muted" numberOfLines={1}>
                    Also: {cmd.aliases.slice(0, 2).join(', ')}
                  </Text>
                </View>
              </View>
              <Switch
                value={cmd.isEnabled}
                onValueChange={() => handleToggleCommand(cmd.id)}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-muted">
                Used {cmd.usageCount} times
              </Text>
              <View 
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: MOOD_COLORS[cmd.targetMood] + '30' }}
              >
                <Text className="text-xs font-medium" style={{ color: MOOD_COLORS[cmd.targetMood] }}>
                  {cmd.targetMood.replace('-', ' ')}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );

  const renderMoods = () => (
    <View className="gap-3">
      <Text className="text-base font-semibold text-foreground">Select Weather Mood</Text>
      
      <View className="flex-row flex-wrap gap-3">
        {voiceWeatherComboService.getAllMoods().map((mood) => {
          const isActive = activeOverride?.mood === mood;
          return (
            <Pressable
              key={mood}
              onPress={() => handleSetMood(mood)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <View 
                className="rounded-xl p-4 border-2"
                style={{ 
                  backgroundColor: isActive ? MOOD_COLORS[mood] + '40' : colors.surface,
                  borderColor: isActive ? MOOD_COLORS[mood] : colors.border,
                  width: 100,
                }}
              >
                <Text className="text-3xl text-center mb-2">{MOOD_ICONS[mood]}</Text>
                <Text 
                  className="text-xs text-center font-medium"
                  style={{ color: isActive ? MOOD_COLORS[mood] : colors.foreground }}
                >
                  {mood.replace('-', ' ')}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderActive = () => (
    <View className="gap-4">
      {activeOverride ? (
        <View 
          className="rounded-2xl p-6 border-2"
          style={{ 
            backgroundColor: MOOD_COLORS[activeOverride.mood] + '20',
            borderColor: MOOD_COLORS[activeOverride.mood],
          }}
        >
          <View className="items-center mb-4">
            <Text className="text-6xl mb-2">{MOOD_ICONS[activeOverride.mood]}</Text>
            <Text 
              className="text-2xl font-bold"
              style={{ color: MOOD_COLORS[activeOverride.mood] }}
            >
              {activeOverride.mood.replace('-', ' ').toUpperCase()}
            </Text>
          </View>

          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">Triggered By</Text>
              <Text className="text-sm font-medium text-foreground">{activeOverride.triggeredBy}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">Wallpapers</Text>
              <Text className="text-sm font-medium text-foreground">{activeOverride.wallpaperIds.length}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">Particles</Text>
              <Text className="text-sm font-medium text-foreground">{activeOverride.particleEffects.join(', ') || 'None'}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">Ambient Sound</Text>
              <Text className="text-sm font-medium text-foreground">{activeOverride.ambientSound || 'None'}</Text>
            </View>
          </View>

          <Pressable
            onPress={() => voiceWeatherComboService.clearOverride()}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="mt-4"
          >
            <View className="bg-error/20 rounded-lg py-3 items-center">
              <Text className="text-error font-semibold">Clear Override</Text>
            </View>
          </Pressable>
        </View>
      ) : (
        <View className="bg-surface rounded-xl p-6 border border-border items-center">
          <Text className="text-4xl mb-3">🌈</Text>
          <Text className="text-lg font-semibold text-foreground mb-1">No Active Override</Text>
          <Text className="text-sm text-muted text-center">
            Use a voice command or select a mood to activate weather wallpapers
          </Text>
        </View>
      )}

      <View className="bg-surface rounded-xl p-4 border border-border">
        <Text className="text-base font-semibold text-foreground mb-3">Quick Commands</Text>
        <View className="flex-row flex-wrap gap-2">
          {['match the weather', 'sunny vibes', 'rainy mood', 'stormy power'].map((phrase) => (
            <Pressable
              key={phrase}
              onPress={() => handleTestCommand(phrase)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <View className="bg-primary/20 rounded-full px-4 py-2">
                <Text className="text-sm font-medium text-primary">"{phrase}"</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  const renderAnalytics = () => (
    <View className="gap-4">
      <View className="flex-row gap-3">
        <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
          <Text className="text-3xl font-bold text-primary">{analytics.totalCommands}</Text>
          <Text className="text-sm text-muted">Total Commands</Text>
        </View>
        <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
          <Text className="text-3xl font-bold text-success">{analytics.successfulCommands}</Text>
          <Text className="text-sm text-muted">Successful</Text>
        </View>
      </View>

      <View className="bg-surface rounded-xl p-4 border border-border">
        <Text className="text-base font-semibold text-foreground mb-3">Performance</Text>
        <View className="gap-2">
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted">Success Rate</Text>
            <Text className="text-sm font-medium text-foreground">
              {analytics.totalCommands > 0 
                ? ((analytics.successfulCommands / analytics.totalCommands) * 100).toFixed(1) 
                : 0}%
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted">Avg Response Time</Text>
            <Text className="text-sm font-medium text-foreground">{analytics.avgResponseTime.toFixed(0)}ms</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted">Most Used Command</Text>
            <Text className="text-sm font-medium text-foreground">{analytics.mostUsedCommand || 'None'}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted">Favorite Mood</Text>
            <View className="flex-row items-center gap-1">
              <Text className="text-lg">{MOOD_ICONS[analytics.mostUsedMood]}</Text>
              <Text className="text-sm font-medium text-foreground">
                {analytics.mostUsedMood.replace('-', ' ')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="bg-surface rounded-xl p-4 border border-border">
        <Text className="text-base font-semibold text-foreground mb-3">Mood Usage</Text>
        {Object.entries(analytics.moodCounts).length > 0 ? (
          Object.entries(analytics.moodCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([mood, count]) => (
              <View key={mood} className="flex-row items-center justify-between py-2 border-b border-border">
                <View className="flex-row items-center gap-2">
                  <Text className="text-xl">{MOOD_ICONS[mood as WeatherMood]}</Text>
                  <Text className="text-sm text-foreground">{mood.replace('-', ' ')}</Text>
                </View>
                <Text className="text-sm font-medium text-primary">{count}</Text>
              </View>
            ))
        ) : (
          <Text className="text-sm text-muted text-center py-4">No mood data yet</Text>
        )}
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 gap-4">
          {/* Header */}
          <View className="items-center mb-2">
            <Text className="text-2xl font-bold text-foreground">Voice Weather Combo</Text>
            <Text className="text-sm text-muted">Say commands to change wallpapers</Text>
          </View>

          {/* Tabs */}
          <View className="flex-row bg-surface rounded-xl p-1 border border-border">
            {tabs.map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.7 : 1 }]}
              >
                <View 
                  className="py-2 rounded-lg items-center"
                  style={{ backgroundColor: activeTab === tab.id ? colors.primary : 'transparent' }}
                >
                  <Text className="text-lg">{tab.icon}</Text>
                  <Text 
                    className="text-xs font-medium"
                    style={{ color: activeTab === tab.id ? '#fff' : colors.muted }}
                  >
                    {tab.label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Content */}
          {activeTab === 'commands' && renderCommands()}
          {activeTab === 'moods' && renderMoods()}
          {activeTab === 'active' && renderActive()}
          {activeTab === 'analytics' && renderAnalytics()}

          <View className="h-20" />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
