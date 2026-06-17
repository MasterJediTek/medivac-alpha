import { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Switch } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { themeSchedulingService, ShiftProfile, ScheduleRule, ThemeId } from '@/lib/services/theme-scheduling-service';

export default function ThemeSchedulingScreen() {
  const colors = useColors();
  const [profiles, setProfiles] = useState<ShiftProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<ShiftProfile | null>(null);
  const [isSchedulerRunning, setIsSchedulerRunning] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeId>('light');
  const [analytics, setAnalytics] = useState(themeSchedulingService.getAnalytics());

  useEffect(() => {
    loadData();
    const unsubscribe = themeSchedulingService.onThemeChange((themeId) => {
      setCurrentTheme(themeId);
    });
    return unsubscribe;
  }, []);

  const loadData = () => {
    setProfiles(themeSchedulingService.getAllProfiles());
    setActiveProfile(themeSchedulingService.getActiveProfile());
    setIsSchedulerRunning(themeSchedulingService.isSchedulerRunning());
    setCurrentTheme(themeSchedulingService.getCurrentTheme());
    setAnalytics(themeSchedulingService.getAnalytics());
  };

  const handleActivateProfile = (profileId: string) => {
    themeSchedulingService.activateProfile(profileId);
    loadData();
  };

  const handleToggleScheduler = () => {
    if (isSchedulerRunning) {
      themeSchedulingService.stopScheduler();
    } else {
      themeSchedulingService.startScheduler();
    }
    setIsSchedulerRunning(!isSchedulerRunning);
  };

  const getThemeColor = (themeId: ThemeId): string => {
    const themeColors: Record<ThemeId, string> = {
      'light': '#FFFFFF',
      'dark': '#1A1A2E',
      'high-contrast': '#000000',
      'jedi': '#FFD700',
      'medical-blue': '#0066CC',
    };
    return themeColors[themeId];
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        <Text className="text-2xl font-bold text-foreground mb-2">Theme Scheduling</Text>
        <Text className="text-muted mb-6">Automatic time-based theme switching</Text>

        {/* Current Status */}
        <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-3">Current Status</Text>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-foreground">Scheduler</Text>
            <View className="flex-row items-center">
              <Text className={`mr-2 ${isSchedulerRunning ? 'text-green-500' : 'text-muted'}`}>
                {isSchedulerRunning ? 'Running' : 'Stopped'}
              </Text>
              <Switch
                value={isSchedulerRunning}
                onValueChange={handleToggleScheduler}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-foreground">Current Theme</Text>
            <View className="flex-row items-center">
              <View 
                style={{ 
                  width: 20, 
                  height: 20, 
                  borderRadius: 10, 
                  backgroundColor: getThemeColor(currentTheme),
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginRight: 8,
                }} 
              />
              <Text className="text-foreground capitalize">{currentTheme.replace('-', ' ')}</Text>
            </View>
          </View>
        </View>

        {/* Analytics */}
        <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-3">Analytics</Text>
          <View className="flex-row flex-wrap">
            <View className="w-1/2 mb-3">
              <Text className="text-2xl font-bold text-primary">{analytics.totalRules}</Text>
              <Text className="text-muted text-sm">Total Rules</Text>
            </View>
            <View className="w-1/2 mb-3">
              <Text className="text-2xl font-bold text-primary">{analytics.activeRules}</Text>
              <Text className="text-muted text-sm">Active Rules</Text>
            </View>
            <View className="w-1/2 mb-3">
              <Text className="text-2xl font-bold text-primary">{analytics.transitionsToday}</Text>
              <Text className="text-muted text-sm">Transitions Today</Text>
            </View>
            <View className="w-1/2 mb-3">
              <Text className="text-2xl font-bold text-primary">{analytics.averageTransitionsPerDay}</Text>
              <Text className="text-muted text-sm">Avg/Day</Text>
            </View>
          </View>
          <View className="flex-row items-center mt-2">
            <Text className="text-muted">Most Used: </Text>
            <View 
              style={{ 
                width: 16, 
                height: 16, 
                borderRadius: 8, 
                backgroundColor: getThemeColor(analytics.mostUsedTheme),
                borderWidth: 1,
                borderColor: colors.border,
                marginHorizontal: 4,
              }} 
            />
            <Text className="text-foreground capitalize">{analytics.mostUsedTheme.replace('-', ' ')}</Text>
          </View>
        </View>

        {/* Shift Profiles */}
        <Text className="text-lg font-semibold text-foreground mb-3">Shift Profiles</Text>
        {profiles.map((profile) => (
          <TouchableOpacity
            key={profile.id}
            onPress={() => handleActivateProfile(profile.id)}
            className={`bg-surface rounded-xl p-4 mb-3 border ${
              profile.isActive ? 'border-primary' : 'border-border'
            }`}
            style={{ opacity: profile.isActive ? 1 : 0.8 }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-semibold text-foreground">{profile.name}</Text>
              {profile.isActive && (
                <View className="bg-primary px-2 py-1 rounded">
                  <Text className="text-white text-xs font-medium">ACTIVE</Text>
                </View>
              )}
            </View>
            <Text className="text-muted mb-3">{profile.description}</Text>
            <View className="flex-row flex-wrap">
              {profile.rules.map((rule) => (
                <View 
                  key={rule.id}
                  className="flex-row items-center mr-4 mb-2"
                >
                  <View 
                    style={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: 6, 
                      backgroundColor: getThemeColor(rule.themeId),
                      borderWidth: 1,
                      borderColor: colors.border,
                      marginRight: 4,
                    }} 
                  />
                  <Text className="text-sm text-muted">
                    {rule.startTime} - {rule.endTime}
                  </Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}

        {/* Upcoming Transitions */}
        <Text className="text-lg font-semibold text-foreground mb-3 mt-4">Upcoming Transitions</Text>
        <View className="bg-surface rounded-xl p-4 border border-border">
          {analytics.upcomingTransitions.length > 0 ? (
            analytics.upcomingTransitions.slice(0, 5).map((transition, index) => (
              <View 
                key={transition.id}
                className={`flex-row items-center justify-between py-2 ${
                  index < analytics.upcomingTransitions.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <View className="flex-row items-center">
                  <View 
                    style={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: 8, 
                      backgroundColor: getThemeColor(transition.fromTheme),
                      borderWidth: 1,
                      borderColor: colors.border,
                    }} 
                  />
                  <Text className="text-muted mx-2">→</Text>
                  <View 
                    style={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: 8, 
                      backgroundColor: getThemeColor(transition.toTheme),
                      borderWidth: 1,
                      borderColor: colors.border,
                    }} 
                  />
                </View>
                <Text className="text-muted text-sm">
                  {transition.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-muted text-center py-4">No upcoming transitions</Text>
          )}
        </View>

        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
