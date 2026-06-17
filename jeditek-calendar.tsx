/**
 * JediTek Calendar Screen
 * MediVac WACHS v8.6
 */

import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, TextInput } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { 
  jediTekCalendarService, 
  CalendarEvent, 
  EventType, 
  CalendarWeek,
  JEDITEK_COLORS,
} from '@/lib/services/jeditek-calendar-service';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type ViewMode = 'week' | 'agenda' | 'medications';

export default function JediTekCalendarScreen() {
  const colors = useColors();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekView, setWeekView] = useState<CalendarWeek | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<EventType>('event');

  useEffect(() => {
    loadCalendarData();
    const unsubscribe = jediTekCalendarService.subscribe(() => loadCalendarData());
    return unsubscribe;
  }, [selectedDate]);

  const loadCalendarData = useCallback(() => {
    setWeekView(jediTekCalendarService.generateWeekView(selectedDate));
    setEvents(jediTekCalendarService.getEventsForDay(selectedDate));
  }, [selectedDate]);

  const navigateWeek = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setSelectedDate(newDate);
  };

  const selectDay = (timestamp: number) => {
    setSelectedDate(new Date(timestamp));
  };

  const handleAddEvent = () => {
    if (!newEventTitle.trim()) return;
    const startDate = new Date(selectedDate);
    startDate.setHours(9, 0, 0, 0);
    jediTekCalendarService.addEvent({
      type: newEventType,
      title: newEventTitle,
      startDate: startDate.getTime(),
      endDate: startDate.getTime() + 60 * 60 * 1000,
    });
    setNewEventTitle('');
    setShowAddEvent(false);
  };

  const markMedicationTaken = (eventId: string) => {
    jediTekCalendarService.markMedicationTaken(eventId);
  };

  const analytics = jediTekCalendarService.getAnalytics();

  const renderWeekView = () => (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable onPress={() => navigateWeek(-1)} style={{ padding: 8, backgroundColor: colors.surface, borderRadius: 8 }}>
          <Text style={{ fontSize: 18, color: colors.foreground }}>←</Text>
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>
          {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
        </Text>
        <Pressable onPress={() => navigateWeek(1)} style={{ padding: 8, backgroundColor: colors.surface, borderRadius: 8 }}>
          <Text style={{ fontSize: 18, color: colors.foreground }}>→</Text>
        </Pressable>
      </View>

      {weekView && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 8 }}>
          {weekView.days.map((day, idx) => (
            <Pressable
              key={idx}
              onPress={() => selectDay(day.date)}
              style={{
                width: 80,
                marginHorizontal: 4,
                padding: 12,
                borderRadius: 16,
                backgroundColor: day.isToday ? '#1ABC9C' : day.isWeekend ? colors.surface : colors.background,
                borderWidth: new Date(day.date).toDateString() === selectedDate.toDateString() ? 2 : 0,
                borderColor: '#F39C12',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 12, color: day.isToday ? '#FFFFFF' : colors.muted }}>{DAY_NAMES[day.dayOfWeek]}</Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: day.isToday ? '#FFFFFF' : colors.foreground, marginVertical: 4 }}>
                {new Date(day.date).getDate()}
              </Text>
              <View style={{ flexDirection: 'row', gap: 2 }}>
                {day.eventCount > 0 && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#3498DB' }} />}
                {day.hasMedication && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#E74C3C' }} />}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={{ flex: 1, marginTop: 16, paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
          Events for {selectedDate.toLocaleDateString()}
        </Text>
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 12,
              marginBottom: 8,
              borderRadius: 12,
              backgroundColor: item.color.primary + '20',
              borderLeftWidth: 4,
              borderLeftColor: item.color.primary,
            }}>
              <Text style={{ fontSize: 24, marginRight: 12 }}>{item.color.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>{item.title}</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  {new Date(item.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              {item.type === 'medication' && !item.medication?.taken && (
                <Pressable onPress={() => markMedicationTaken(item.id)} style={{ backgroundColor: '#27AE60', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>Take</Text>
                </Pressable>
              )}
              {item.medication?.taken && <Text style={{ color: '#27AE60', fontSize: 12 }}>✓ Taken</Text>}
            </View>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📅</Text>
              <Text style={{ fontSize: 16, color: colors.muted }}>No events for this day</Text>
            </View>
          }
        />
      </View>
    </View>
  );

  const renderMedicationsView = () => {
    const medications = jediTekCalendarService.getTodayMedications();
    const adherence = jediTekCalendarService.getMedicationAdherence();

    return (
      <View style={{ flex: 1, padding: 16 }}>
        <View style={{ backgroundColor: adherence >= 80 ? '#27AE60' : adherence >= 50 ? '#F39C12' : '#E74C3C', borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 14, opacity: 0.9 }}>Medication Adherence</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 36, fontWeight: '700' }}>{adherence}%</Text>
        </View>

        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>Today's Medications</Text>
        <FlatList
          data={medications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{
              backgroundColor: item.medication?.taken ? '#27AE60' + '20' : '#E74C3C' + '20',
              borderRadius: 12,
              padding: 16,
              marginBottom: 8,
              borderLeftWidth: 4,
              borderLeftColor: item.medication?.taken ? '#27AE60' : '#E74C3C',
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>💊 {item.medication?.medicationName}</Text>
                  <Text style={{ fontSize: 14, color: colors.muted }}>{item.medication?.dosage} {item.medication?.unit}</Text>
                </View>
                {!item.medication?.taken ? (
                  <Pressable onPress={() => markMedicationTaken(item.id)} style={{ backgroundColor: '#27AE60', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Mark Taken</Text>
                  </Pressable>
                ) : (
                  <Text style={{ color: '#27AE60', fontSize: 20 }}>✓</Text>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>💊</Text>
              <Text style={{ fontSize: 16, color: colors.muted }}>No medications scheduled</Text>
            </View>
          }
        />
      </View>
    );
  };

  const renderAgendaView = () => {
    const upcoming = jediTekCalendarService.getUpcomingEvents(7);

    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>Upcoming 7 Days</Text>
        <FlatList
          data={upcoming}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const eventDate = new Date(item.startDate);
            return (
              <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 8 }}>
                <View style={{ width: 50, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Text style={{ fontSize: 12, color: colors.muted }}>{DAY_NAMES[eventDate.getDay()]}</Text>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>{eventDate.getDate()}</Text>
                </View>
                <View style={{ flex: 1, borderLeftWidth: 3, borderLeftColor: item.color.primary, paddingLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 16 }}>{item.color.icon}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>{item.title}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                    {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {item.type}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
              <Text style={{ fontSize: 16, color: colors.muted }}>No upcoming events</Text>
            </View>
          }
        />
      </View>
    );
  };

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: '#1ABC9C', paddingHorizontal: 16, paddingVertical: 16 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>JediTek Calendar</Text>
        <Text style={{ color: '#FFFFFF', opacity: 0.9, fontSize: 14 }}>{analytics.totalEvents} events • {analytics.upcomingEvents} upcoming</Text>
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: colors.surface, padding: 4, margin: 16, borderRadius: 12 }}>
        {(['week', 'agenda', 'medications'] as ViewMode[]).map((mode) => (
          <Pressable
            key={mode}
            onPress={() => setViewMode(mode)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: viewMode === mode ? '#1ABC9C' : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: viewMode === mode ? '#FFFFFF' : colors.muted, fontWeight: '600', fontSize: 12 }}>
              {mode === 'week' ? '📅 Week' : mode === 'agenda' ? '📋 Agenda' : '💊 Meds'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'agenda' && renderAgendaView()}
        {viewMode === 'medications' && renderMedicationsView()}
      </View>

      <Pressable
        onPress={() => setShowAddEvent(true)}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#F39C12',
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 5,
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '300' }}>+</Text>
      </Pressable>

      {showAddEvent && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: colors.background, borderRadius: 16, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 16 }}>Add New Event</Text>
            <TextInput
              value={newEventTitle}
              onChangeText={setNewEventTitle}
              placeholder="Event title..."
              placeholderTextColor={colors.muted}
              style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 12, color: colors.foreground, marginBottom: 12 }}
            />
            <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>Event Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {(['event', 'task', 'meeting', 'appointment', 'medication', 'reminder'] as EventType[]).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setNewEventType(type)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: newEventType === type ? JEDITEK_COLORS[type].primary : colors.surface,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: newEventType === type ? '#FFFFFF' : colors.foreground }}>{JEDITEK_COLORS[type].icon} {type}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable onPress={() => setShowAddEvent(false)} style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: colors.surface, alignItems: 'center' }}>
                <Text style={{ color: colors.foreground }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleAddEvent} style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#1ABC9C', alignItems: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Add Event</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}
