import { ScrollView, Text, View, TouchableOpacity, Pressable } from "react-native";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { 
  themePreviewCalendarService, 
  type CalendarWeek, 
  type CalendarDay, 
  type CalendarTimeSlot,
  type ThemeName,
  type ScheduleConflict,
  type CalendarAnalytics,
} from "@/lib/services/theme-preview-calendar-service";

type TabType = 'calendar' | 'conflicts' | 'analytics' | 'export';

export default function ThemePreviewCalendarScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [calendar, setCalendar] = useState<CalendarWeek | null>(null);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [analytics, setAnalytics] = useState<CalendarAnalytics | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [selectedSlot, setSelectedSlot] = useState<CalendarTimeSlot | null>(null);

  useEffect(() => {
    loadData();
    const unsubscribe = themePreviewCalendarService.subscribe(handleCalendarUpdate);
    return () => unsubscribe();
  }, []);

  const loadData = () => {
    setCalendar(themePreviewCalendarService.generateWeekCalendar());
    setConflicts(themePreviewCalendarService.getAllConflicts());
    setAnalytics(themePreviewCalendarService.getAnalytics());
  };

  const handleCalendarUpdate = (updatedCalendar: CalendarWeek) => {
    setCalendar(updatedCalendar);
    setConflicts(themePreviewCalendarService.getAllConflicts());
    setAnalytics(themePreviewCalendarService.getAnalytics());
  };

  const getThemeColor = (theme: ThemeName) => {
    const themeColors = themePreviewCalendarService.getThemeColors(theme);
    return themeColors;
  };

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}${period}`;
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'calendar', label: 'Calendar' },
    { key: 'conflicts', label: 'Conflicts' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'export', label: 'Export' },
  ];

  const renderCalendarTab = () => (
    <View className="flex-1">
      {/* Day Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        <View className="flex-row gap-2 px-1">
          {calendar?.days.map((day) => (
            <TouchableOpacity
              key={day.dayOfWeek}
              onPress={() => setSelectedDay(day.dayOfWeek)}
              className={`px-4 py-2 rounded-lg ${selectedDay === day.dayOfWeek ? 'bg-primary' : 'bg-surface'}`}
            >
              <Text className={`font-medium ${selectedDay === day.dayOfWeek ? 'text-background' : 'text-foreground'}`}>
                {day.dayName.substring(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Time Slots Grid */}
      <View className="bg-surface rounded-xl p-4 mb-4">
        <Text className="text-lg font-semibold text-foreground mb-3">
          {calendar?.days.find(d => d.dayOfWeek === selectedDay)?.dayName} Schedule
        </Text>
        
        {/* Hour Grid */}
        <View className="gap-1">
          {Array.from({ length: 24 }, (_, hour) => {
            const theme = themePreviewCalendarService.getThemeAtTime(selectedDay, hour);
            const themeColor = getThemeColor(theme);
            
            return (
              <Pressable
                key={hour}
                onPress={() => {
                  const slot = calendar?.days
                    .find(d => d.dayOfWeek === selectedDay)?.slots
                    .find(s => {
                      if (s.startHour <= s.endHour) {
                        return hour >= s.startHour && hour < s.endHour;
                      }
                      return hour >= s.startHour || hour < s.endHour;
                    });
                  setSelectedSlot(slot || null);
                }}
                style={({ pressed }) => [
                  { opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <View 
                  className="flex-row items-center rounded-md overflow-hidden"
                  style={{ backgroundColor: themeColor.bg, borderWidth: 1, borderColor: themeColor.border }}
                >
                  <View className="w-16 py-2 px-2 bg-surface/50">
                    <Text className="text-xs text-muted">{formatHour(hour)}</Text>
                  </View>
                  <View className="flex-1 py-2 px-3">
                    <Text style={{ color: themeColor.text }} className="text-sm font-medium capitalize">
                      {theme}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Selected Slot Details */}
      {selectedSlot && (
        <View className="bg-surface rounded-xl p-4">
          <Text className="text-lg font-semibold text-foreground mb-3">Slot Details</Text>
          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text className="text-muted">Theme:</Text>
              <Text className="text-foreground font-medium capitalize">{selectedSlot.theme}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted">Time:</Text>
              <Text className="text-foreground font-medium">
                {formatHour(selectedSlot.startHour)} - {formatHour(selectedSlot.endHour)}
              </Text>
            </View>
            {selectedSlot.label && (
              <View className="flex-row justify-between">
                <Text className="text-muted">Label:</Text>
                <Text className="text-foreground font-medium">{selectedSlot.label}</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );

  const renderConflictsTab = () => (
    <View className="flex-1">
      {conflicts.length === 0 ? (
        <View className="bg-success/10 rounded-xl p-6 items-center">
          <Text className="text-success text-lg font-semibold mb-2">No Conflicts</Text>
          <Text className="text-muted text-center">
            Your theme schedule has no overlapping time slots.
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {conflicts.map((conflict) => (
            <View 
              key={conflict.id} 
              className={`rounded-xl p-4 ${conflict.severity === 'error' ? 'bg-error/10' : 'bg-warning/10'}`}
            >
              <View className="flex-row items-center mb-2">
                <View className={`w-3 h-3 rounded-full mr-2 ${conflict.severity === 'error' ? 'bg-error' : 'bg-warning'}`} />
                <Text className={`font-semibold ${conflict.severity === 'error' ? 'text-error' : 'text-warning'}`}>
                  {conflict.severity === 'error' ? 'Theme Conflict' : 'Time Overlap'}
                </Text>
              </View>
              <Text className="text-foreground mb-2">{conflict.message}</Text>
              <View className="flex-row gap-2 mt-2">
                {conflict.conflictingSlots.map((slot) => (
                  <TouchableOpacity
                    key={slot.id}
                    onPress={() => themePreviewCalendarService.resolveConflict(conflict.id, slot.id)}
                    className="flex-1 bg-surface rounded-lg p-2"
                  >
                    <Text className="text-foreground text-center font-medium capitalize">{slot.theme}</Text>
                    <Text className="text-muted text-center text-xs">Keep this</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderAnalyticsTab = () => (
    <View className="flex-1 gap-4">
      {analytics && (
        <>
          {/* Summary Cards */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-surface rounded-xl p-4">
              <Text className="text-muted text-sm">Total Slots</Text>
              <Text className="text-foreground text-2xl font-bold">{analytics.totalSlots}</Text>
            </View>
            <View className="flex-1 bg-surface rounded-xl p-4">
              <Text className="text-muted text-sm">Coverage</Text>
              <Text className="text-foreground text-2xl font-bold">{analytics.coveragePercentage.toFixed(1)}%</Text>
            </View>
          </View>

          {/* Theme Distribution */}
          <View className="bg-surface rounded-xl p-4">
            <Text className="text-lg font-semibold text-foreground mb-3">Theme Distribution</Text>
            <View className="gap-2">
              {Object.entries(analytics.hoursPerTheme).map(([theme, hours]) => {
                const percentage = (hours / (7 * 24)) * 100;
                const themeColor = getThemeColor(theme as ThemeName);
                
                return (
                  <View key={theme}>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-foreground capitalize">{theme}</Text>
                      <Text className="text-muted">{hours}h ({percentage.toFixed(1)}%)</Text>
                    </View>
                    <View className="h-2 bg-border rounded-full overflow-hidden">
                      <View 
                        className="h-full rounded-full"
                        style={{ width: `${percentage}%`, backgroundColor: themeColor.border }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Most Used Theme */}
          <View className="bg-primary/10 rounded-xl p-4">
            <Text className="text-muted text-sm mb-1">Most Used Theme</Text>
            <Text className="text-primary text-xl font-bold capitalize">{analytics.mostUsedTheme}</Text>
          </View>

          {/* Conflict Status */}
          <View className={`rounded-xl p-4 ${analytics.conflictCount > 0 ? 'bg-warning/10' : 'bg-success/10'}`}>
            <Text className="text-muted text-sm mb-1">Schedule Status</Text>
            <Text className={`text-xl font-bold ${analytics.conflictCount > 0 ? 'text-warning' : 'text-success'}`}>
              {analytics.conflictCount > 0 ? `${analytics.conflictCount} Conflicts` : 'No Conflicts'}
            </Text>
          </View>
        </>
      )}
    </View>
  );

  const renderExportTab = () => (
    <View className="flex-1 gap-4">
      <Text className="text-lg font-semibold text-foreground">Export Schedule</Text>
      <Text className="text-muted">
        Export your theme schedule in various formats for sharing or backup.
      </Text>

      <View className="gap-3">
        {(['ical', 'json', 'csv', 'pdf'] as const).map((format) => (
          <TouchableOpacity
            key={format}
            onPress={async () => {
              await themePreviewCalendarService.exportCalendar(format);
            }}
            className="bg-surface rounded-xl p-4 flex-row items-center justify-between"
          >
            <View>
              <Text className="text-foreground font-semibold uppercase">{format}</Text>
              <Text className="text-muted text-sm">
                {format === 'ical' && 'Calendar format for import'}
                {format === 'json' && 'Machine-readable data'}
                {format === 'csv' && 'Spreadsheet compatible'}
                {format === 'pdf' && 'Printable document'}
              </Text>
            </View>
            <View className="bg-primary/10 rounded-lg px-3 py-1">
              <Text className="text-primary font-medium">Export</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Actions */}
      <View className="bg-surface rounded-xl p-4 mt-4">
        <Text className="text-lg font-semibold text-foreground mb-3">Quick Actions</Text>
        <View className="gap-2">
          <TouchableOpacity
            onPress={() => themePreviewCalendarService.applyScheduleToAllDays(selectedDay)}
            className="bg-primary/10 rounded-lg p-3"
          >
            <Text className="text-primary font-medium text-center">
              Apply {calendar?.days.find(d => d.dayOfWeek === selectedDay)?.dayName}'s Schedule to All Days
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => themePreviewCalendarService.resetToDefault()}
            className="bg-error/10 rounded-lg p-3"
          >
            <Text className="text-error font-medium text-center">Reset to Default Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">Theme Preview Calendar</Text>
          <Text className="text-muted mt-1">
            Visual overview of scheduled theme changes throughout the week
          </Text>
        </View>

        {/* Tab Navigation */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row gap-2">
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-full ${activeTab === tab.key ? 'bg-primary' : 'bg-surface'}`}
              >
                <Text className={`font-medium ${activeTab === tab.key ? 'text-background' : 'text-foreground'}`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Tab Content */}
        {activeTab === 'calendar' && renderCalendarTab()}
        {activeTab === 'conflicts' && renderConflictsTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
        {activeTab === 'export' && renderExportTab()}
      </ScrollView>
    </ScreenContainer>
  );
}
