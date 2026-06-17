/**
 * Calendar Widget Sync Screen
 * MediVac WACHS v8.7
 * Real-time sync with animated transitions and visual effects
 */

import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, Animated } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  calendarWidgetSyncService,
  CalendarWidget,
  SyncedEvent,
  WIDGET_EFFECTS,
  WIDGET_SOUNDS,
  PRIORITY_COLORS,
  PriorityLevel,
} from '@/lib/services/calendar-widget-sync-service';

type TabType = 'widgets' | 'events' | 'calendar' | 'settings';

const WIDGET_ICONS: Record<string, string> = {
  'upcoming-events': '📅',
  'today-agenda': '📋',
  'mini-calendar': '🗓️',
  'countdown-timer': '⏱️',
  'medication-tracker': '💊',
  'task-progress': '✅',
  'weekly-overview': '📊',
  'event-stream': '🌊',
};

export default function CalendarWidgetSyncScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('widgets');
  const [widgets, setWidgets] = useState<CalendarWidget[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<CalendarWidget | null>(null);
  const [calendarDays, setCalendarDays] = useState<ReturnType<typeof calendarWidgetSyncService.generateMiniCalendar>>([]);
  const syncAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
    const unsubscribe = calendarWidgetSyncService.subscribe(() => loadData());
    return unsubscribe;
  }, []);

  const loadData = () => {
    setWidgets(calendarWidgetSyncService.getAllWidgets());
    const now = new Date();
    setCalendarDays(calendarWidgetSyncService.generateMiniCalendar(now.getFullYear(), now.getMonth()));
  };

  const syncWidget = (id: string) => {
    Animated.sequence([
      Animated.timing(syncAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(syncAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    calendarWidgetSyncService.syncWidget(id);
  };

  const syncAll = () => {
    calendarWidgetSyncService.syncAllWidgets();
  };

  const renderWidgetsTab = () => (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>{widgets.length} Widgets</Text>
        <Pressable
          onPress={syncAll}
          style={{ backgroundColor: '#1ABC9C', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Text style={{ fontSize: 16 }}>🔄</Text>
          <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 12 }}>Sync All</Text>
        </Pressable>
      </View>

      <FlatList
        data={widgets}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
        renderItem={({ item }) => {
          const isSelected = selectedWidget?.id === item.id;
          return (
            <Pressable
              onPress={() => setSelectedWidget(isSelected ? null : item)}
              style={{
                flex: 1,
                backgroundColor: item.style.gradientColors?.[0] || colors.surface,
                borderRadius: item.style.borderRadius,
                padding: 16,
                borderWidth: isSelected ? 2 : item.style.borderWidth,
                borderColor: isSelected ? '#1ABC9C' : item.style.borderColor,
                shadowColor: item.style.shadowColor,
                shadowOffset: item.style.shadowOffset,
                shadowOpacity: 0.2,
                shadowRadius: item.style.shadowBlur,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <Text style={{ fontSize: 28 }}>{WIDGET_ICONS[item.type] || '📦'}</Text>
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: item.syncStatus === 'synced' ? '#27AE60' : item.syncStatus === 'syncing' ? '#F39C12' : '#E74C3C',
                }} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }} numberOfLines={1}>{item.title}</Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{item.events.length} events</Text>
              <View style={{ flexDirection: 'row', marginTop: 8, gap: 4 }}>
                <View style={{ backgroundColor: colors.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 9, color: colors.muted }}>{item.size}</Text>
                </View>
                <View style={{ backgroundColor: colors.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 9, color: colors.muted }}>{item.type}</Text>
                </View>
              </View>
              {isSelected && (
                <Pressable
                  onPress={() => syncWidget(item.id)}
                  style={{ backgroundColor: '#1ABC9C', marginTop: 12, padding: 8, borderRadius: 6, alignItems: 'center' }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 11 }}>Sync Now</Text>
                </Pressable>
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );

  const renderEventsTab = () => {
    const allEvents = widgets.flatMap(w => w.events).sort((a, b) => a.startTime - b.startTime);

    return (
      <FlatList
        data={allEvents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const priorityColor = PRIORITY_COLORS[item.priority];
          return (
            <View style={{
              backgroundColor: priorityColor.bg,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderLeftWidth: 4,
              borderLeftColor: priorityColor.border,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 32 }}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: priorityColor.text }}>{item.title}</Text>
                  <Text style={{ fontSize: 12, color: priorityColor.text, opacity: 0.7 }}>
                    {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {item.location && ` • ${item.location}`}
                  </Text>
                </View>
                <View style={{ backgroundColor: priorityColor.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                  <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: '600', textTransform: 'uppercase' }}>{item.priority}</Text>
                </View>
              </View>
              {item.description && (
                <Text style={{ fontSize: 12, color: priorityColor.text, opacity: 0.8, marginTop: 8 }}>{item.description}</Text>
              )}
              <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.5)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 9, color: priorityColor.text }}>{item.type}</Text>
                </View>
                {item.isAllDay && (
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.5)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 9, color: priorityColor.text }}>All Day</Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📅</Text>
            <Text style={{ fontSize: 16, color: colors.muted }}>No events synced</Text>
          </View>
        }
      />
    );
  };

  const renderCalendarTab = () => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, textAlign: 'center', marginBottom: 16 }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>

          {/* Week day headers */}
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            {weekDays.map((day, idx) => (
              <View key={idx} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: idx === 0 || idx === 6 ? '#E74C3C' : colors.muted }}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {calendarDays.map((day, idx) => (
              <View
                key={idx}
                style={{
                  width: '14.28%',
                  aspectRatio: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 2,
                }}
              >
                <View style={{
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  backgroundColor: day.isToday ? '#1ABC9C' : day.hasUrgent ? '#FEE2E2' : 'transparent',
                }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: day.isToday ? '700' : '400',
                    color: day.isToday ? '#FFFFFF' : !day.isCurrentMonth ? colors.muted : day.isWeekend ? '#E74C3C' : colors.foreground,
                  }}>
                    {day.dayOfMonth}
                  </Text>
                  {day.eventCount > 0 && (
                    <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
                      {day.eventDots.slice(0, 3).map((dot, dotIdx) => (
                        <View key={dotIdx} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: dot.color }} />
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Legend */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginTop: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>Priority Legend</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(Object.entries(PRIORITY_COLORS) as [PriorityLevel, typeof PRIORITY_COLORS[PriorityLevel]][]).map(([priority, pColors]) => (
              <View key={priority} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: pColors.border }} />
                <Text style={{ fontSize: 12, color: colors.muted, textTransform: 'capitalize' }}>{priority}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Effects Info */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginTop: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>✨ Widget Effects</Text>
          <View style={{ gap: 8 }}>
            {Object.entries(WIDGET_EFFECTS).map(([key, effect]) => (
              <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: effect.color, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 10, color: '#FFFFFF' }}>✨</Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.foreground, flex: 1 }}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
                <Text style={{ fontSize: 10, color: colors.muted }}>{effect.duration}ms</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderSettingsTab = () => {
    const config = calendarWidgetSyncService.getSyncConfig();
    const analytics = calendarWidgetSyncService.getAnalytics();

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>Sync Configuration</Text>
          {[
            { label: 'Auto Sync', value: config.autoSync ? 'Enabled' : 'Disabled' },
            { label: 'Sync Interval', value: `${config.syncInterval / 1000}s` },
            { label: 'Conflict Resolution', value: config.conflictResolution },
            { label: 'Delta Sync', value: config.deltaSync ? 'Enabled' : 'Disabled' },
            { label: 'Compression', value: config.compressionEnabled ? 'Enabled' : 'Disabled' },
          ].map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: idx < 4 ? 1 : 0, borderBottomColor: colors.border }}>
              <Text style={{ color: colors.muted }}>{item.label}</Text>
              <Text style={{ color: colors.foreground, fontWeight: '500' }}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>Sync Analytics</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {[
              { label: 'Total Syncs', value: analytics.totalSyncs, color: '#3498DB' },
              { label: 'Successful', value: analytics.successfulSyncs, color: '#27AE60' },
              { label: 'Failed', value: analytics.failedSyncs, color: '#E74C3C' },
              { label: 'Avg Time', value: `${analytics.avgSyncTime}ms`, color: '#F39C12' },
              { label: 'Events Added', value: analytics.eventsAdded, color: '#9B59B6' },
              { label: 'Events Updated', value: analytics.eventsUpdated, color: '#1ABC9C' },
            ].map((stat, idx) => (
              <View key={idx} style={{ width: '45%', backgroundColor: stat.color + '20', borderRadius: 8, padding: 12 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: stat.color }}>{stat.value}</Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>🔊 Widget Sounds</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(WIDGET_SOUNDS).map(([key, value]) => (
              <View key={key} style={{ backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                <Text style={{ fontSize: 10, color: colors.muted }}>{value}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: '#1ABC9C', paddingHorizontal: 16, paddingVertical: 16 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>Calendar Widget Sync</Text>
        <Text style={{ color: '#FFFFFF', opacity: 0.9, fontSize: 14 }}>
          {widgets.length} widgets • {widgets.reduce((sum, w) => sum + w.events.length, 0)} events
        </Text>
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: colors.surface, padding: 4, margin: 16, borderRadius: 12 }}>
        {(['widgets', 'events', 'calendar', 'settings'] as TabType[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: activeTab === tab ? '#1ABC9C' : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: activeTab === tab ? '#FFFFFF' : colors.muted, fontWeight: '600', fontSize: 11 }}>
              {tab === 'widgets' ? '📦 Widgets' : tab === 'events' ? '📅 Events' : tab === 'calendar' ? '🗓️ Calendar' : '⚙️ Settings'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'widgets' && renderWidgetsTab()}
        {activeTab === 'events' && renderEventsTab()}
        {activeTab === 'calendar' && renderCalendarTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </View>
    </ScreenContainer>
  );
}
