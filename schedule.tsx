import { ScrollView, Text, View, TouchableOpacity, FlatList } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface Appointment {
  id: string;
  time: string;
  patient: string;
  doctor: string;
  type: string;
  status: "confirmed" | "pending" | "completed" | "cancelled";
  duration: string;
}

interface CalendarDay {
  date: number;
  day: string;
  isToday: boolean;
  hasAppointments: boolean;
}

const MOCK_APPOINTMENTS: Appointment[] = [
  { id: "1", time: "08:00", patient: "John Doe", doctor: "Dr. Smith", type: "Check-up", status: "completed", duration: "30 min" },
  { id: "2", time: "09:00", patient: "Sarah Johnson", doctor: "Dr. Chen", type: "Follow-up", status: "completed", duration: "45 min" },
  { id: "3", time: "10:30", patient: "Mike Wilson", doctor: "Dr. Smith", type: "Consultation", status: "confirmed", duration: "1 hr" },
  { id: "4", time: "12:00", patient: "Emily Chen", doctor: "Dr. Patel", type: "Lab Review", status: "pending", duration: "30 min" },
  { id: "5", time: "14:00", patient: "Robert Brown", doctor: "Dr. Smith", type: "Post-Op", status: "confirmed", duration: "45 min" },
  { id: "6", time: "15:30", patient: "Lisa Anderson", doctor: "Dr. Chen", type: "Check-up", status: "pending", duration: "30 min" },
  { id: "7", time: "16:30", patient: "David Martinez", doctor: "Dr. Patel", type: "Emergency", status: "confirmed", duration: "1 hr" },
];

export default function ScheduleScreen() {
  const colors = useColors();
  const [selectedDate, setSelectedDate] = useState(24);

  const calendarDays: CalendarDay[] = [
    { date: 22, day: "Wed", isToday: false, hasAppointments: true },
    { date: 23, day: "Thu", isToday: false, hasAppointments: true },
    { date: 24, day: "Fri", isToday: true, hasAppointments: true },
    { date: 25, day: "Sat", isToday: false, hasAppointments: false },
    { date: 26, day: "Sun", isToday: false, hasAppointments: false },
    { date: 27, day: "Mon", isToday: false, hasAppointments: true },
    { date: 28, day: "Tue", isToday: false, hasAppointments: true },
  ];

  const getStatusColor = (status: Appointment["status"]) => {
    switch (status) {
      case "confirmed": return colors.success;
      case "pending": return colors.warning;
      case "completed": return colors.muted;
      case "cancelled": return colors.error;
    }
  };

  const getStatusBg = (status: Appointment["status"]) => {
    switch (status) {
      case "confirmed": return colors.success + '15';
      case "pending": return colors.warning + '15';
      case "completed": return colors.surface;
      case "cancelled": return colors.error + '15';
    }
  };

  const renderAppointment = ({ item }: { item: Appointment }) => (
    <TouchableOpacity 
      className="rounded-2xl p-4 mb-3 flex-row"
      style={{ backgroundColor: getStatusBg(item.status) }}
      activeOpacity={0.7}
    >
      <View className="mr-4 items-center">
        <Text className="text-foreground font-bold text-lg">{item.time}</Text>
        <Text className="text-muted text-xs">{item.duration}</Text>
      </View>
      <View 
        className="w-1 rounded-full mr-4"
        style={{ backgroundColor: getStatusColor(item.status) }}
      />
      <View className="flex-1">
        <Text className="text-foreground font-semibold text-base">{item.patient}</Text>
        <Text className="text-muted text-sm">{item.type} • {item.doctor}</Text>
        <View className="flex-row items-center mt-2 gap-2">
          <View 
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: getStatusColor(item.status) + '20' }}
          >
            <Text style={{ color: getStatusColor(item.status), fontSize: 11, fontWeight: '600', textTransform: 'capitalize' }}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>
      <IconSymbol name="chevron.right" size={20} color={colors.muted} />
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-foreground text-2xl font-bold">Schedule</Text>
            <Text className="text-muted text-sm">January 2026</Text>
          </View>
          <TouchableOpacity 
            className="w-10 h-10 rounded-full bg-primary items-center justify-center"
            activeOpacity={0.7}
          >
            <IconSymbol name="plus" size={24} color={colors.background} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar Strip */}
      <View className="px-5 mb-4">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {calendarDays.map(day => (
            <TouchableOpacity
              key={day.date}
              className="items-center py-3 px-4 rounded-2xl"
              style={{
                backgroundColor: selectedDate === day.date ? colors.primary : colors.surface,
                minWidth: 56,
              }}
              onPress={() => setSelectedDate(day.date)}
              activeOpacity={0.7}
            >
              <Text 
                style={{ 
                  color: selectedDate === day.date ? colors.background : colors.muted,
                  fontSize: 12,
                  fontWeight: '500',
                }}
              >
                {day.day}
              </Text>
              <Text 
                style={{ 
                  color: selectedDate === day.date ? colors.background : colors.foreground,
                  fontSize: 18,
                  fontWeight: '700',
                  marginTop: 4,
                }}
              >
                {day.date}
              </Text>
              {day.hasAppointments && (
                <View 
                  className="w-1.5 h-1.5 rounded-full mt-2"
                  style={{ 
                    backgroundColor: selectedDate === day.date ? colors.background : colors.primary 
                  }}
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Stats Row */}
      <View className="px-5 mb-4">
        <View className="flex-row gap-3">
          <View className="flex-1 bg-surface rounded-xl p-3 items-center">
            <Text className="text-foreground text-xl font-bold">{MOCK_APPOINTMENTS.length}</Text>
            <Text className="text-muted text-xs">Total</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-3 items-center">
            <Text className="text-success text-xl font-bold">
              {MOCK_APPOINTMENTS.filter(a => a.status === "confirmed").length}
            </Text>
            <Text className="text-muted text-xs">Confirmed</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-3 items-center">
            <Text className="text-warning text-xl font-bold">
              {MOCK_APPOINTMENTS.filter(a => a.status === "pending").length}
            </Text>
            <Text className="text-muted text-xs">Pending</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-3 items-center">
            <Text className="text-muted text-xl font-bold">
              {MOCK_APPOINTMENTS.filter(a => a.status === "completed").length}
            </Text>
            <Text className="text-muted text-xs">Done</Text>
          </View>
        </View>
      </View>

      {/* Appointments List */}
      <View className="flex-1 px-5">
        <Text className="text-foreground text-lg font-semibold mb-3">Today's Appointments</Text>
        <FlatList
          data={MOCK_APPOINTMENTS}
          renderItem={renderAppointment}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="items-center py-10">
              <IconSymbol name="calendar" size={48} color={colors.muted} />
              <Text className="text-muted text-base mt-3">No appointments scheduled</Text>
            </View>
          }
        />
      </View>
    </ScreenContainer>
  );
}
