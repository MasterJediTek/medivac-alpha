/**
 * Weather Wallpapers Screen
 * MediVac WACHS v9.0
 */

import { useState, useEffect } from 'react';
import { ScrollView, Text, View, Pressable, Switch } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { wallpaperWeatherIntegrationService, WeatherCondition, WeatherWallpaperMapping, TimeOfDay } from '@/lib/services/wallpaper-weather-integration-service';

const WEATHER_ICONS: Record<WeatherCondition, string> = {
  'clear': '☀️',
  'partly-cloudy': '⛅',
  'cloudy': '☁️',
  'overcast': '🌥️',
  'rain': '🌧️',
  'heavy-rain': '⛈️',
  'thunderstorm': '🌩️',
  'drizzle': '🌦️',
  'snow': '🌨️',
  'heavy-snow': '❄️',
  'sleet': '🌨️',
  'hail': '🌨️',
  'fog': '🌫️',
  'mist': '🌫️',
  'haze': '🌫️',
  'smoke': '💨',
  'wind': '💨',
  'tornado': '🌪️',
  'hurricane': '🌀',
  'hot': '🔥',
  'cold': '🥶',
  'freezing': '🧊',
};

const TIME_ICONS: Record<TimeOfDay, string> = {
  'dawn': '🌅',
  'morning': '🌄',
  'noon': '☀️',
  'afternoon': '🌤️',
  'dusk': '🌇',
  'evening': '🌆',
  'night': '🌙',
  'midnight': '🌑',
};

export default function WeatherWallpapersScreen() {
  const [activeTab, setActiveTab] = useState<'current' | 'mappings' | 'simulate' | 'settings'>('current');
  const [mappings, setMappings] = useState<WeatherWallpaperMapping[]>([]);
  const [isAutoSync, setIsAutoSync] = useState(wallpaperWeatherIntegrationService.isAutoSyncActive());
  const [, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const unsubscribe = wallpaperWeatherIntegrationService.subscribe(() => {
      setMappings(wallpaperWeatherIntegrationService.getAllMappings());
      setIsAutoSync(wallpaperWeatherIntegrationService.isAutoSyncActive());
      setUpdateTrigger(prev => prev + 1);
    });

    setMappings(wallpaperWeatherIntegrationService.getAllMappings());

    return unsubscribe;
  }, []);

  const handleToggleMapping = (id: string) => {
    wallpaperWeatherIntegrationService.toggleMapping(id);
  };

  const handleSimulateWeather = (condition: WeatherCondition) => {
    wallpaperWeatherIntegrationService.simulateWeatherChange(condition);
  };

  const handleToggleAutoSync = () => {
    if (isAutoSync) {
      wallpaperWeatherIntegrationService.stopAutoSync();
    } else {
      wallpaperWeatherIntegrationService.startAutoSync();
    }
  };

  const weather = wallpaperWeatherIntegrationService.getCurrentWeather();
  const location = wallpaperWeatherIntegrationService.getCurrentLocation();
  const timeOfDay = wallpaperWeatherIntegrationService.getCurrentTimeOfDay();
  const season = wallpaperWeatherIntegrationService.getCurrentSeason();
  const analytics = wallpaperWeatherIntegrationService.getAnalytics();
  const activeWallpaper = wallpaperWeatherIntegrationService.getActiveWallpaperId();
  const activeParticles = wallpaperWeatherIntegrationService.getActiveParticleEffects();

  const renderCurrent = () => (
    <View className="gap-4">
      {/* Current Weather Card */}
      <View 
        className="p-6 rounded-2xl"
        style={{ 
          backgroundColor: weather?.condition === 'clear' ? '#1976d2' : 
                          weather?.condition?.includes('rain') ? '#455a64' :
                          weather?.condition?.includes('snow') ? '#78909c' : '#37474f',
        }}
      >
        <View className="flex-row justify-between items-start">
          <View>
            <Text className="text-white/70 text-sm">{location?.city}, {location?.country}</Text>
            <Text className="text-white text-5xl font-bold mt-1">
              {weather?.temperature.toFixed(0)}°C
            </Text>
            <Text className="text-white/80 text-lg capitalize mt-1">
              {weather?.condition?.replace('-', ' ')}
            </Text>
          </View>
          <Text style={{ fontSize: 64 }}>
            {weather?.condition ? WEATHER_ICONS[weather.condition] : '🌡️'}
          </Text>
        </View>
        
        <View className="flex-row justify-between mt-6 pt-4 border-t border-white/20">
          <View className="items-center">
            <Text className="text-white/60 text-xs">Feels Like</Text>
            <Text className="text-white font-semibold">{weather?.feelsLike.toFixed(0)}°</Text>
          </View>
          <View className="items-center">
            <Text className="text-white/60 text-xs">Humidity</Text>
            <Text className="text-white font-semibold">{weather?.humidity}%</Text>
          </View>
          <View className="items-center">
            <Text className="text-white/60 text-xs">Wind</Text>
            <Text className="text-white font-semibold">{weather?.windSpeed} km/h</Text>
          </View>
          <View className="items-center">
            <Text className="text-white/60 text-xs">UV Index</Text>
            <Text className="text-white font-semibold">{weather?.uvIndex}</Text>
          </View>
        </View>
      </View>

      {/* Time & Season */}
      <View className="flex-row gap-3">
        <View className="flex-1 bg-surface p-4 rounded-xl border border-border items-center">
          <Text style={{ fontSize: 32 }}>{TIME_ICONS[timeOfDay]}</Text>
          <Text className="text-foreground font-semibold capitalize mt-2">{timeOfDay}</Text>
          <Text className="text-muted text-xs">Time of Day</Text>
        </View>
        <View className="flex-1 bg-surface p-4 rounded-xl border border-border items-center">
          <Text style={{ fontSize: 32 }}>
            {season === 'spring' ? '🌸' : season === 'summer' ? '☀️' : season === 'autumn' ? '🍂' : '❄️'}
          </Text>
          <Text className="text-foreground font-semibold capitalize mt-2">{season}</Text>
          <Text className="text-muted text-xs">Season</Text>
        </View>
      </View>

      {/* Active Wallpaper */}
      <View className="bg-surface p-4 rounded-xl border border-border">
        <Text className="text-foreground font-semibold mb-2">Active Wallpaper</Text>
        <Text className="text-primary text-lg">{activeWallpaper || 'None selected'}</Text>
        {activeParticles.length > 0 && (
          <View className="flex-row flex-wrap gap-2 mt-3">
            {activeParticles.map((effect, i) => (
              <View key={i} className="bg-primary/20 px-3 py-1 rounded-full">
                <Text className="text-primary text-sm">{effect}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Refresh Button */}
      <Pressable
        onPress={() => wallpaperWeatherIntegrationService.refreshWeather()}
        style={({ pressed }) => [
          {
            backgroundColor: '#00bcd4',
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
      >
        <Text className="text-white font-bold">🔄 Refresh Weather</Text>
      </Pressable>
    </View>
  );

  const renderMappings = () => {
    const groupedMappings: Record<WeatherCondition, WeatherWallpaperMapping[]> = {} as Record<WeatherCondition, WeatherWallpaperMapping[]>;
    mappings.forEach(m => {
      if (!groupedMappings[m.condition]) {
        groupedMappings[m.condition] = [];
      }
      groupedMappings[m.condition].push(m);
    });

    return (
      <View className="gap-4">
        <Text className="text-foreground text-lg font-bold">Weather Mappings</Text>
        <Text className="text-muted text-sm">
          Configure which wallpapers show for each weather condition
        </Text>

        {Object.entries(groupedMappings).map(([condition, conditionMappings]) => (
          <View key={condition} className="bg-surface rounded-xl border border-border overflow-hidden">
            <View className="flex-row items-center gap-3 p-4 bg-primary/10">
              <Text style={{ fontSize: 28 }}>{WEATHER_ICONS[condition as WeatherCondition]}</Text>
              <Text className="text-foreground font-semibold capitalize flex-1">
                {condition.replace('-', ' ')}
              </Text>
              <Text className="text-muted text-sm">{conditionMappings.length} mappings</Text>
            </View>
            
            {conditionMappings.map((mapping) => (
              <View key={mapping.id} className="p-4 border-t border-border">
                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      {mapping.timeOfDay && (
                        <Text>{TIME_ICONS[mapping.timeOfDay]}</Text>
                      )}
                      <Text className="text-foreground font-medium">
                        {mapping.timeOfDay ? mapping.timeOfDay : 'Any time'}
                      </Text>
                    </View>
                    <Text className="text-muted text-xs mt-1">
                      {mapping.wallpaperIds.length} wallpapers • {mapping.particleEffects.join(', ')}
                    </Text>
                  </View>
                  <Switch
                    value={mapping.isEnabled}
                    onValueChange={() => handleToggleMapping(mapping.id)}
                    trackColor={{ false: '#767577', true: '#00bcd4' }}
                  />
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const renderSimulate = () => {
    const conditions: WeatherCondition[] = [
      'clear', 'partly-cloudy', 'cloudy', 'rain', 'heavy-rain', 'thunderstorm',
      'snow', 'heavy-snow', 'fog', 'wind', 'hot', 'cold'
    ];

    return (
      <View className="gap-4">
        <Text className="text-foreground text-lg font-bold">Simulate Weather</Text>
        <Text className="text-muted text-sm">
          Test how your wallpapers change with different weather conditions
        </Text>

        <View className="flex-row flex-wrap gap-3">
          {conditions.map((condition) => (
            <Pressable
              key={condition}
              onPress={() => handleSimulateWeather(condition)}
              style={({ pressed }) => [
                {
                  width: '30%',
                  backgroundColor: weather?.condition === condition ? '#00bcd4' : '#1e2022',
                  padding: 16,
                  borderRadius: 16,
                  alignItems: 'center',
                  borderWidth: weather?.condition === condition ? 2 : 1,
                  borderColor: weather?.condition === condition ? '#00bcd4' : '#334155',
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                },
              ]}
            >
              <Text style={{ fontSize: 32 }}>{WEATHER_ICONS[condition]}</Text>
              <Text 
                className="text-center mt-2 capitalize"
                style={{ 
                  color: weather?.condition === condition ? '#fff' : '#9BA1A6',
                  fontSize: 11,
                }}
              >
                {condition.replace('-', ' ')}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Temperature Slider Simulation */}
        <View className="bg-surface p-4 rounded-xl border border-border mt-4">
          <Text className="text-foreground font-semibold mb-3">Temperature Simulation</Text>
          <View className="flex-row justify-between gap-2">
            {[-10, 0, 15, 25, 35, 45].map((temp) => (
              <Pressable
                key={temp}
                onPress={() => wallpaperWeatherIntegrationService.updateWeather({ temperature: temp })}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    backgroundColor: temp < 0 ? '#2196f3' : temp < 20 ? '#4caf50' : temp < 35 ? '#ff9800' : '#f44336',
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  },
                ]}
              >
                <Text className="text-white font-bold">{temp}°</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderSettings = () => (
    <View className="gap-4">
      <Text className="text-foreground text-lg font-bold">Weather Settings</Text>

      {/* Auto Sync */}
      <View className="bg-surface p-4 rounded-xl border border-border">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-foreground font-semibold">Auto Weather Sync</Text>
            <Text className="text-muted text-sm">Automatically update weather data</Text>
          </View>
          <Switch
            value={isAutoSync}
            onValueChange={handleToggleAutoSync}
            trackColor={{ false: '#767577', true: '#00bcd4' }}
          />
        </View>
      </View>

      {/* Location */}
      <View className="bg-surface p-4 rounded-xl border border-border">
        <Text className="text-foreground font-semibold mb-3">Location</Text>
        <View className="gap-2">
          <View className="flex-row justify-between">
            <Text className="text-muted">City</Text>
            <Text className="text-foreground">{location?.city}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Country</Text>
            <Text className="text-foreground">{location?.country}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Timezone</Text>
            <Text className="text-foreground">{location?.timezone}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Coordinates</Text>
            <Text className="text-foreground">
              {location?.latitude.toFixed(2)}, {location?.longitude.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Analytics */}
      <View className="bg-surface p-4 rounded-xl border border-border">
        <Text className="text-foreground font-semibold mb-3">Analytics</Text>
        <View className="gap-2">
          <View className="flex-row justify-between">
            <Text className="text-muted">Weather Changes</Text>
            <Text className="text-foreground font-semibold">{analytics.totalWeatherChanges}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Wallpaper Changes</Text>
            <Text className="text-foreground font-semibold">{analytics.totalWallpaperChanges}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Most Common Weather</Text>
            <View className="flex-row items-center gap-1">
              <Text>{WEATHER_ICONS[analytics.mostCommonCondition]}</Text>
              <Text className="text-foreground font-semibold capitalize">
                {analytics.mostCommonCondition.replace('-', ' ')}
              </Text>
            </View>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Avg Temperature</Text>
            <Text className="text-foreground font-semibold">{analytics.avgTemperature.toFixed(1)}°C</Text>
          </View>
        </View>
      </View>

      {/* Apply Weather Wallpaper */}
      <Pressable
        onPress={() => wallpaperWeatherIntegrationService.applyWeatherWallpaper()}
        style={({ pressed }) => [
          {
            backgroundColor: '#4caf50',
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
      >
        <Text className="text-white font-bold">🖼️ Apply Weather Wallpaper Now</Text>
      </Pressable>
    </View>
  );

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 px-4">
        <Text className="text-foreground text-2xl font-bold mt-4">Weather Wallpapers</Text>
        <Text className="text-muted mb-4">Wallpapers that change with the weather</Text>

        {/* Tabs */}
        <View className="flex-row gap-2 mb-4">
          {(['current', 'mappings', 'simulate', 'settings'] as const).map((tab) => (
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
              <Text style={{ color: activeTab === tab ? '#fff' : '#9BA1A6', fontWeight: '600', textTransform: 'capitalize', fontSize: 12 }}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === 'current' && renderCurrent()}
        {activeTab === 'mappings' && renderMappings()}
        {activeTab === 'simulate' && renderSimulate()}
        {activeTab === 'settings' && renderSettings()}

        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
