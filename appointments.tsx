import React, { useState, useEffect } from 'react';
import { ScrollView, Text, View, Pressable, FlatList, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

/**
 * Appointments Screen - Book and manage appointments
 */
export default function AppointmentsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'book' | 'history'>('upcoming');
  const [isLoading, setIsLoading] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  useEffect(() => {
    loadAppointments();
  }, [activeTab]);

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      // TODO: Load from appointments service
      // Mock data for now
      setAppointments([
        {
          id: '1',
          providerName: 'Dr. Sarah Johnson',
          specialty: 'General Practice',
          date: new Date(Date.now() + 86400000).toISOString(),
          time: '2:30 PM',
          type: 'Follow-up Consultation',
          status: 'scheduled',
        },
        {
          id: '2',
          providerName: 'Dr. Michael Chen',
          specialty: 'Cardiology',
          date: new Date(Date.now() + 172800000).toISOString(),
          time: '10:00 AM',
          type: 'Consultation',
          status: 'scheduled',
        },
      ]);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="py-6 px-6 gap-6">
          {/* Header */}
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-2xl font-bold text-foreground">Appointments</Text>
              <Text className="text-sm text-muted mt-1">Manage your visits</Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-surface items-center justify-center"
            >
              <Text className="text-lg">✕</Text>
            </Pressable>
          </View>

          {/* Tab Navigation */}
          <View className="flex-row gap-2 bg-surface p-1 rounded-lg">
            {['upcoming', 'book', 'history'].map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab as any)}
                style={({ pressed }) => [
                  {
                    backgroundColor: activeTab === tab ? colors.primary : 'transparent',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                className="flex-1 py-2 px-3 rounded-md items-center"
              >
                <Text
                  className={`text-xs font-semibold ${
                    activeTab === tab ? 'text-white' : 'text-foreground'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Upcoming Appointments */}
          {activeTab === 'upcoming' && (
            <View className="gap-3">
              {isLoading ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : appointments.length === 0 ? (
                <View className="py-8 items-center gap-2">
                  <Text className="text-lg text-muted">No upcoming appointments</Text>
                  <Pressable
                    onPress={() => setActiveTab('book')}
                    className="mt-2 py-2 px-4 bg-primary rounded-lg"
                  >
                    <Text className="text-white font-semibold">Book Now</Text>
                  </Pressable>
                </View>
              ) : (
                appointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    colors={colors}
                  />
                ))
              )}
            </View>
          )}

          {/* Book Appointment */}
          {activeTab === 'book' && (
            <View className="gap-4">
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Select Provider</Text>
                <Pressable
                  style={({ pressed }) => [
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderWidth: 1,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  className="py-3 px-4 rounded-lg"
                >
                  <Text className="text-foreground">{selectedProvider || 'Choose a provider'}</Text>
                </Pressable>
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Select Date</Text>
                <Pressable
                  style={({ pressed }) => [
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderWidth: 1,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  className="py-3 px-4 rounded-lg"
                >
                  <Text className="text-foreground">{selectedDate || 'Choose a date'}</Text>
                </Pressable>
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Appointment Type</Text>
                <View className="flex-row gap-2">
                  {['Consultation', 'Follow-up', 'Procedure'].map((type) => (
                    <Pressable
                      key={type}
                      style={({ pressed }) => [
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          borderWidth: 1,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                      className="flex-1 py-2 px-3 rounded-lg items-center"
                    >
                      <Text className="text-xs font-medium text-foreground">{type}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
                className="py-3 px-4 rounded-lg items-center mt-4"
              >
                <Text className="text-white font-semibold">Book Appointment</Text>
              </Pressable>
            </View>
          )}

          {/* History */}
          {activeTab === 'history' && (
            <View className="gap-3">
              <Text className="text-sm text-muted">Past appointments appear here</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

/**
 * Appointment Card Component
 */
function AppointmentCard({
  appointment,
  colors,
}: {
  appointment: any;
  colors: any;
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View className="p-4 rounded-lg bg-primary/10 border border-primary gap-3">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">
            {appointment.providerName}
          </Text>
          <Text className="text-xs text-muted mt-1">{appointment.specialty}</Text>
        </View>
        <View
          style={{ backgroundColor: colors.success + '20' }}
          className="px-2 py-1 rounded-full"
        >
          <Text style={{ color: colors.success }} className="text-xs font-semibold">
            {appointment.status}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-4 pt-2 border-t border-primary/20">
        <View className="flex-1">
          <Text className="text-xs text-muted mb-1">Date</Text>
          <Text className="text-sm font-semibold text-foreground">
            {formatDate(appointment.date)}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-muted mb-1">Time</Text>
          <Text className="text-sm font-semibold text-foreground">{appointment.time}</Text>
        </View>
      </View>

      <View className="flex-row gap-2 pt-2">
        <Pressable
          style={({ pressed }) => [
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          className="flex-1 py-2 rounded-lg items-center"
        >
          <Text className="text-xs font-semibold text-white">Reschedule</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            {
              backgroundColor: colors.error + '20',
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          className="flex-1 py-2 rounded-lg items-center"
        >
          <Text style={{ color: colors.error }} className="text-xs font-semibold">
            Cancel
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
