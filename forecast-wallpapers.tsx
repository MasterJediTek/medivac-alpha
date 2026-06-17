/**
 * Weather Forecast Wallpapers UI Screen
 * MediVac WACHS v9.1
 */

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { 
  weatherForecastWallpapersService, 
  WeatherForecast, 
  ForecastWallpaper,
  CountdownTimer 
} from '@/lib/services/weather-forecast-wallpapers-service';

type TabType = 'forecasts' | 'queue' | 'countdowns' | 'analytics';

const CONDITION_ICONS: Record<string, string> = {
  'clear': '☀️',
  'partly-cloudy': '⛅',
  'cloudy': '☁️',
  'rain': '🌧️',
  'heavy-rain': '🌧️',
  'thunderstorm': '⛈️',
  'snow': '❄️',
  'heavy-snow': '🌨️',
  'fog': '🌫️',
  'wind': '💨',
  'hot': '🔥',
  'cold': '🧊',
};

const CONDITION_COLORS: Record<string, string> = {
  'clear': '#FFD700',
  'partly-cloudy': '#87CEEB',
  'cloudy': '#B0C4DE',
  'rain': '#4682B4',
  'heavy-rain': '#4169E1',
  'thunderstorm': '#483D8B',
  'snow': '#E0FFFF',
  'heavy-snow': '#F0F8FF',
  'fog': '#708090',
  'wind': '#98FB98',
  'hot': '#FF4500',
  'cold': '#ADD8E6',
};

export default function ForecastWallpapersScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('forecasts');
  const [forecasts, setForecasts] = useState<WeatherForecast[]>([]);
  const [wallpapers, setWallpapers] = useState<ForecastWallpaper[]>([]);
  const [countdowns, setCountdowns] = useState<CountdownTimer[]>([]);
  const [activeWallpaper, setActiveWallpaper] = useState<ForecastWallpaper | null>(null);
  const [isAutoPreload, setIsAutoPreload] = useState(false);
  const [analytics, setAnalytics] = useState(weatherForecastWallpapersService.getAnalytics());

  useEffect(() => {
    const unsubscribe = weatherForecastWallpapersService.subscribe(() => {
      setForecasts(weatherForecastWallpapersService.getAllForecasts());
      setWallpapers(weatherForecastWallpapersService.getAllForecastWallpapers());
      setCountdowns(weatherForecastWallpapersService.getAllCountdowns());
      setActiveWallpaper(weatherForecastWallpapersService.getActiveWallpaper());
      setAnalytics(weatherForecastWallpapersService.getAnalytics());
    });

    setForecasts(weatherForecastWallpapersService.getAllForecasts());
    setWallpapers(weatherForecastWallpapersService.getAllForecastWallpapers());
    setCountdowns(weatherForecastWallpapersService.getAllCountdowns());
    setActiveWallpaper(weatherForecastWallpapersService.getActiveWallpaper());

    // Start countdown updates
    weatherForecastWallpapersService.startCountdownUpdates();

    return () => {
      unsubscribe();
      weatherForecastWallpapersService.stopCountdownUpdates();
    };
  }, []);

  const handleToggleAutoPreload = (value: boolean) => {
    setIsAutoPreload(value);
    if (value) {
      weatherForecastWallpapersService.startAutoPreload(30);
    } else {
      weatherForecastWallpapersService.stopAutoPreload();
    }
  };

  const handlePreloadAll = () => {
    weatherForecastWallpapersService.preloadUpcoming(6);
  };

  const handleActivateWallpaper = (forecastId: string) => {
    weatherForecastWallpapersService.activateWallpaperForForecast(forecastId);
  };

  const handleCreateCountdown = (forecastId: string) => {
    weatherForecastWallpapersService.createCountdown(forecastId);
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatCountdown = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'forecasts', label: 'Forecast', icon: '🌤️' },
    { id: 'queue', label: 'Queue', icon: '📋' },
    { id: 'countdowns', label: 'Timers', icon: '⏱️' },
    { id: 'analytics', label: 'Stats', icon: '📊' },
  ];

  const renderForecasts = () => (
    <View className="gap-4">
      {/* Auto Preload Toggle */}
      <View className="bg-surface rounded-xl p-4 border border-border">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-base font-semibold text-foreground">Auto Preload</Text>
          <Switch
            value={isAutoPreload}
            onValueChange={handleToggleAutoPreload}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
        <Text className="text-sm text-muted">
          Automatically preload wallpapers for upcoming weather changes
        </Text>
      </View>

      {/* Active Wallpaper */}
      {activeWallpaper && (
        <View 
          className="rounded-xl p-4 border-2"
          style={{ 
            backgroundColor: CONDITION_COLORS[activeWallpaper.condition] + '20',
            borderColor: CONDITION_COLORS[activeWallpaper.condition],
          }}
        >
          <View className="flex-row items-center gap-3">
            <Text className="text-4xl">{CONDITION_ICONS[activeWallpaper.condition] || '🌤️'}</Text>
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">Currently Active</Text>
              <Text className="text-sm text-muted capitalize">{activeWallpaper.condition.replace('-', ' ')}</Text>
            </View>
            <View className="bg-success/20 px-3 py-1 rounded-full">
              <Text className="text-xs font-medium text-success">LIVE</Text>
            </View>
          </View>
        </View>
      )}

      {/* Forecast List */}
      <Text className="text-base font-semibold text-foreground">Upcoming Weather</Text>
      
      {forecasts.map((forecast) => {
        const wallpaper = wallpapers.find(w => w.forecastId === forecast.id);
        const isActive = activeWallpaper?.forecastId === forecast.id;
        
        return (
          <Pressable
            key={forecast.id}
            onPress={() => handleActivateWallpaper(forecast.id)}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <View 
              className="rounded-xl p-4 border"
              style={{ 
                backgroundColor: isActive ? CONDITION_COLORS[forecast.condition] + '20' : colors.surface,
                borderColor: isActive ? CONDITION_COLORS[forecast.condition] : colors.border,
              }}
            >
              <View className="flex-row items-center gap-3">
                <View 
                  className="w-14 h-14 rounded-full items-center justify-center"
                  style={{ backgroundColor: CONDITION_COLORS[forecast.condition] + '30' }}
                >
                  <Text className="text-3xl">{CONDITION_ICONS[forecast.condition] || '🌤️'}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground capitalize">
                    {forecast.condition.replace('-', ' ')}
                  </Text>
                  <Text className="text-sm text-muted">{formatTime(forecast.timestamp)}</Text>
                  <View className="flex-row gap-3 mt-1">
                    <Text className="text-xs text-muted">🌡️ {forecast.temperature.toFixed(0)}°C</Text>
                    <Text className="text-xs text-muted">💧 {forecast.humidity.toFixed(0)}%</Text>
                    <Text className="text-xs text-muted">💨 {forecast.windSpeed.toFixed(0)} km/h</Text>
                  </View>
                </View>
                <View className="items-end">
                  {wallpaper?.isPreloaded ? (
                    <View className="bg-success/20 px-2 py-1 rounded-full">
                      <Text className="text-xs font-medium text-success">Ready</Text>
                    </View>
                  ) : (
                    <View className="bg-warning/20 px-2 py-1 rounded-full">
                      <Text className="text-xs font-medium text-warning">Pending</Text>
                    </View>
                  )}
                  <Text className="text-xs text-muted mt-1">
                    {(forecast.confidence * 100).toFixed(0)}% conf
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-2 mt-3">
                <Pressable
                  onPress={() => handleCreateCountdown(forecast.id)}
                  style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.7 : 1 }]}
                >
                  <View className="bg-primary/20 rounded-lg py-2 items-center">
                    <Text className="text-xs font-medium text-primary">⏱️ Set Timer</Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => handleActivateWallpaper(forecast.id)}
                  style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.7 : 1 }]}
                >
                  <View className="bg-success/20 rounded-lg py-2 items-center">
                    <Text className="text-xs font-medium text-success">▶️ Activate</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </Pressable>
        );
      })}

      {/* Preload All Button */}
      <Pressable
        onPress={handlePreloadAll}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      >
        <View className="bg-primary rounded-xl py-4 items-center">
          <Text className="text-white font-semibold">📥 Preload All Upcoming</Text>
        </View>
      </Pressable>
    </View>
  );

  const renderQueue = () => {
    const queue = weatherForecastWallpapersService.getWallpaperQueue();
    
    return (
      <View className="gap-4">
        {/* Queue Status */}
        <View className="bg-surface rounded-xl p-4 border border-border">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-base font-semibold text-foreground">Wallpaper Queue</Text>
            <View 
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: queue?.isPlaying ? colors.success + '20' : colors.muted + '20' }}
            >
              <Text 
                className="text-xs font-medium"
                style={{ color: queue?.isPlaying ? colors.success : colors.muted }}
              >
                {queue?.isPlaying ? 'Playing' : 'Paused'}
              </Text>
            </View>
          </View>
          <Text className="text-sm text-muted">
            {queue?.wallpapers.length || 0} wallpapers in queue
          </Text>
        </View>

        {/* Queue Controls */}
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => weatherForecastWallpapersService.startQueue()}
            style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.7 : 1 }]}
          >
            <View className="bg-success/20 rounded-xl py-3 items-center">
              <Text className="text-success font-semibold">▶️ Play</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => weatherForecastWallpapersService.stopQueue()}
            style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.7 : 1 }]}
          >
            <View className="bg-warning/20 rounded-xl py-3 items-center">
              <Text className="text-warning font-semibold">⏸️ Pause</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => weatherForecastWallpapersService.advanceQueue()}
            style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.7 : 1 }]}
          >
            <View className="bg-primary/20 rounded-xl py-3 items-center">
              <Text className="text-primary font-semibold">⏭️ Next</Text>
            </View>
          </Pressable>
        </View>

        {/* Queue Items */}
        <Text className="text-base font-semibold text-foreground">Queue Items</Text>
        
        {wallpapers.map((wp, index) => (
          <View 
            key={wp.id}
            className="rounded-xl p-4 border"
            style={{ 
              backgroundColor: wp.isActive ? CONDITION_COLORS[wp.condition] + '20' : colors.surface,
              borderColor: wp.isActive ? CONDITION_COLORS[wp.condition] : colors.border,
            }}
          >
            <View className="flex-row items-center gap-3">
              <View 
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.primary + '20' }}
              >
                <Text className="text-lg font-bold text-primary">{index + 1}</Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-xl">{CONDITION_ICONS[wp.condition] || '🌤️'}</Text>
                  <Text className="text-base font-semibold text-foreground capitalize">
                    {wp.condition.replace('-', ' ')}
                  </Text>
                </View>
                <Text className="text-xs text-muted">
                  Transition: {wp.transitionEffect} ({wp.transitionDuration}ms)
                </Text>
              </View>
              <View className="items-end">
                {wp.isActive && (
                  <View className="bg-success/20 px-2 py-1 rounded-full">
                    <Text className="text-xs font-medium text-success">Active</Text>
                  </View>
                )}
                {wp.isPreloaded && !wp.isActive && (
                  <View className="bg-primary/20 px-2 py-1 rounded-full">
                    <Text className="text-xs font-medium text-primary">Ready</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderCountdowns = () => (
    <View className="gap-4">
      <Text className="text-base font-semibold text-foreground">Active Countdowns</Text>
      
      {countdowns.length > 0 ? (
        countdowns.map((timer) => (
          <View 
            key={timer.id}
            className="rounded-xl p-4 border"
            style={{ 
              backgroundColor: CONDITION_COLORS[timer.condition] + '20',
              borderColor: CONDITION_COLORS[timer.condition],
            }}
          >
            <View className="flex-row items-center gap-3">
              <Text className="text-4xl">{CONDITION_ICONS[timer.condition] || '🌤️'}</Text>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground capitalize">
                  {timer.condition.replace('-', ' ')}
                </Text>
                <Text className="text-sm text-muted">
                  Scheduled: {formatTime(timer.targetTime)}
                </Text>
              </View>
              <View className="items-end">
                <Text 
                  className="text-2xl font-bold"
                  style={{ color: timer.remainingSeconds < 300 ? colors.error : colors.primary }}
                >
                  {formatCountdown(timer.remainingSeconds)}
                </Text>
                {timer.remainingSeconds === 0 && (
                  <Text className="text-xs text-success">✓ Activated</Text>
                )}
              </View>
            </View>
          </View>
        ))
      ) : (
        <View className="bg-surface rounded-xl p-8 border border-border items-center">
          <Text className="text-4xl mb-3">⏱️</Text>
          <Text className="text-lg font-semibold text-foreground">No Active Timers</Text>
          <Text className="text-sm text-muted text-center mt-1">
            Set timers from the Forecast tab to countdown to weather changes
          </Text>
        </View>
      )}

      {/* Create Countdown for All */}
      <Pressable
        onPress={() => forecasts.forEach(f => handleCreateCountdown(f.id))}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      >
        <View className="bg-primary rounded-xl py-4 items-center">
          <Text className="text-white font-semibold">⏱️ Create All Timers</Text>
        </View>
      </Pressable>
    </View>
  );

  const renderAnalytics = () => (
    <View className="gap-4">
      {/* Accuracy */}
      <View className="bg-surface rounded-xl p-4 border border-border">
        <Text className="text-base font-semibold text-foreground mb-3">Forecast Accuracy</Text>
        <View className="items-center mb-3">
          <Text className="text-4xl font-bold text-primary">
            {analytics.accuracyPercentage.toFixed(1)}%
          </Text>
          <Text className="text-sm text-muted">
            {analytics.accurateForecasts} / {analytics.totalForecasts} accurate
          </Text>
        </View>
        <View className="h-3 bg-border rounded-full overflow-hidden">
          <View 
            className="h-full bg-primary rounded-full"
            style={{ width: `${analytics.accuracyPercentage}%` }}
          />
        </View>
      </View>

      {/* Stats Grid */}
      <View className="flex-row gap-3">
        <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
          <Text className="text-3xl font-bold text-primary">{analytics.totalPreloads}</Text>
          <Text className="text-sm text-muted">Preloads</Text>
        </View>
        <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
          <Text className="text-3xl font-bold text-success">{analytics.successfulPreloads}</Text>
          <Text className="text-sm text-muted">Successful</Text>
        </View>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
          <Text className="text-3xl font-bold text-primary">{analytics.totalTransitions}</Text>
          <Text className="text-sm text-muted">Transitions</Text>
        </View>
        <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
          <Text className="text-3xl font-bold text-success">{analytics.smoothTransitions}</Text>
          <Text className="text-sm text-muted">Smooth</Text>
        </View>
      </View>

      {/* Avg Preload Time */}
      <View className="bg-surface rounded-xl p-4 border border-border">
        <View className="flex-row justify-between items-center">
          <Text className="text-sm text-muted">Average Preload Time</Text>
          <Text className="text-lg font-bold text-foreground">
            {analytics.avgPreloadTime.toFixed(0)}ms
          </Text>
        </View>
      </View>

      {/* Condition Accuracy */}
      <View className="bg-surface rounded-xl p-4 border border-border">
        <Text className="text-base font-semibold text-foreground mb-3">Condition Accuracy</Text>
        {Object.entries(analytics.conditionAccuracy).length > 0 ? (
          Object.entries(analytics.conditionAccuracy).map(([condition, data]) => (
            <View key={condition} className="flex-row items-center justify-between py-2 border-b border-border">
              <View className="flex-row items-center gap-2">
                <Text className="text-xl">{CONDITION_ICONS[condition] || '🌤️'}</Text>
                <Text className="text-sm text-foreground capitalize">{condition.replace('-', ' ')}</Text>
              </View>
              <Text className="text-sm font-medium text-foreground">
                {data.accurate}/{data.predicted} ({data.predicted > 0 ? ((data.accurate / data.predicted) * 100).toFixed(0) : 0}%)
              </Text>
            </View>
          ))
        ) : (
          <Text className="text-sm text-muted text-center py-4">No accuracy data yet</Text>
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
            <Text className="text-2xl font-bold text-foreground">Forecast Wallpapers</Text>
            <Text className="text-sm text-muted">Predictive weather-based wallpapers</Text>
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
          {activeTab === 'forecasts' && renderForecasts()}
          {activeTab === 'queue' && renderQueue()}
          {activeTab === 'countdowns' && renderCountdowns()}
          {activeTab === 'analytics' && renderAnalytics()}

          <View className="h-20" />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
