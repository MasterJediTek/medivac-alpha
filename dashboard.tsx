import React, { useState, useEffect } from 'react';
import { ScrollView, Text, View, Pressable, RefreshControl } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

/**
 * Patient Dashboard - Main hub after login
 * Displays patient vitals, appointments, and quick actions
 */
export default function DashboardScreen() {
  const colors = useColors();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [vitals, setVitals] = useState({
    heartRate: 72,
    bloodPressure: '120/80',
    temperature: 98.6,
    oxygenSaturation: 98,
  });
  const [nextAppointment, setNextAppointment] = useState({
    date: 'Today',
    time: '2:30 PM',
    provider: 'Dr. Sarah Johnson',
    type: 'Follow-up Consultation',
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // TODO: Load patient data from cloud
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View className="py-6 px-6 gap-6">
          {/* Header */}
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-sm text-muted">Welcome back,</Text>
              <Text className="text-2xl font-bold text-foreground">
                Patient
              </Text>
            </View>
            <Pressable
              className="w-10 h-10 rounded-full bg-surface items-center justify-center"
            >
              <Text className="text-lg">👤</Text>
            </Pressable>
          </View>

          {/* Vital Signs */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Vital Signs</Text>
            <View className="flex-row gap-3">
              <VitalCard
                icon="❤️"
                label="Heart Rate"
                value={vitals.heartRate.toString()}
                unit="bpm"
                colors={colors}
              />
              <VitalCard
                icon="🌡️"
                label="Temperature"
                value={vitals.temperature.toString()}
                unit="°F"
                colors={colors}
              />
            </View>
            <View className="flex-row gap-3">
              <VitalCard
                icon="💨"
                label="O₂ Saturation"
                value={vitals.oxygenSaturation.toString()}
                unit="%"
                colors={colors}
              />
              <VitalCard
                icon="💪"
                label="Blood Pressure"
                value={vitals.bloodPressure}
                unit=""
                colors={colors}
              />
            </View>
          </View>

          {/* Next Appointment */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Next Appointment</Text>
            <View className="p-4 rounded-xl bg-primary/10 border border-primary gap-3">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-sm text-muted">{nextAppointment.date}</Text>
                  <Text className="text-2xl font-bold text-foreground">
                    {nextAppointment.time}
                  </Text>
                </View>
                <Text className="text-3xl">📅</Text>
              </View>
              <View className="border-t border-primary/20 pt-3">
                <Text className="text-sm text-muted mb-1">Provider</Text>
                <Text className="text-base font-semibold text-foreground">
                  {nextAppointment.provider}
                </Text>
                <Text className="text-sm text-muted mt-2">{nextAppointment.type}</Text>
              </View>
              <Pressable
                className="mt-2 py-2 px-4 rounded-lg bg-primary items-center"
              >
                <Text className="text-sm font-semibold text-white">Reschedule</Text>
              </Pressable>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Quick Actions</Text>
            <View className="flex-row gap-3">
              <QuickActionButton
                icon="📋"
                label="Medical Records"
                colors={colors}
              />
              <QuickActionButton
                icon="💬"
                label="Message Provider"
                colors={colors}
              />
            </View>
            <View className="flex-row gap-3">
              <QuickActionButton
                icon="📞"
                label="Emergency"
                colors={colors}
              />
              <QuickActionButton
                icon="⚙️"
                label="Settings"
                colors={colors}
              />
            </View>
          </View>

          {/* Sync Status */}
          <View className="p-3 rounded-lg bg-surface border border-border">
            <Text className="text-xs text-muted">
              Last synced: {new Date().toLocaleTimeString()}
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

/**
 * Vital Card Component
 */
function VitalCard({
  icon,
  label,
  value,
  unit,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  unit: string;
  colors: any;
}) {
  return (
    <View className="flex-1 p-4 rounded-xl bg-surface border border-border gap-2">
      <View className="flex-row justify-between items-start">
        <Text className="text-2xl">{icon}</Text>
      </View>
      <Text className="text-xs text-muted uppercase tracking-wide">{label}</Text>
      <View className="flex-row items-baseline gap-1">
        <Text className="text-2xl font-bold text-foreground">{value}</Text>
        <Text className="text-xs text-muted">{unit}</Text>
      </View>
    </View>
  );
}

/**
 * Quick Action Button
 */
function QuickActionButton({
  icon,
  label,
  colors,
}: {
  icon: string;
  label: string;
  colors: any;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
      className="flex-1 py-3 px-4 rounded-lg items-center gap-2"
    >
      <Text className="text-2xl">{icon}</Text>
      <Text className="text-xs font-medium text-foreground text-center">{label}</Text>
    </Pressable>
  );
}
