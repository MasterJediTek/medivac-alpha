import React, { useState, useEffect } from 'react';
import { ScrollView, Text, View, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

/**
 * Medical Records Screen - View patient medical history
 */
export default function MedicalRecordsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<'all' | 'labs' | 'prescriptions' | 'imaging'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    loadRecords();
  }, [activeTab]);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      // TODO: Load from medical records service
      // Mock data for now
      setRecords([
        {
          id: '1',
          type: 'lab_result',
          title: 'Complete Blood Count',
          date: Date.now() - 86400000,
          provider: 'Dr. Sarah Johnson',
          status: 'normal',
        },
        {
          id: '2',
          type: 'prescription',
          title: 'Lisinopril 10mg',
          date: Date.now() - 172800000,
          provider: 'Dr. Michael Chen',
          status: 'active',
        },
        {
          id: '3',
          type: 'imaging',
          title: 'Chest X-Ray',
          date: Date.now() - 259200000,
          provider: 'Dr. Emily Davis',
          status: 'normal',
        },
      ]);
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecords = records.filter(record => {
    if (activeTab === 'all') return true;
    if (activeTab === 'labs') return record.type === 'lab_result';
    if (activeTab === 'prescriptions') return record.type === 'prescription';
    if (activeTab === 'imaging') return record.type === 'imaging';
    return true;
  });

  return (
    <ScreenContainer className="bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="py-6 px-6 gap-6">
          {/* Header */}
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-2xl font-bold text-foreground">Medical Records</Text>
              <Text className="text-sm text-muted mt-1">Your health history</Text>
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
            {['all', 'labs', 'prescriptions', 'imaging'].map((tab) => (
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

          {/* Records List */}
          {isLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : filteredRecords.length === 0 ? (
            <View className="py-8 items-center gap-2">
              <Text className="text-lg text-muted">No records found</Text>
              <Text className="text-sm text-muted">Check back later for updates</Text>
            </View>
          ) : (
            <View className="gap-3">
              {filteredRecords.map((record) => (
                <RecordCard
                  key={record.id}
                  record={record}
                  colors={colors}
                  onPress={() => router.push(`/record/${record.id}`)}
                />
              ))}
            </View>
          )}

          {/* Quick Actions */}
          <View className="gap-3 mt-4">
            <Text className="text-lg font-semibold text-foreground">Quick Actions</Text>
            <Pressable
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
              className="py-3 px-4 rounded-lg items-center"
            >
              <Text className="text-white font-semibold">📥 Request Records</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              className="py-3 px-4 rounded-lg items-center"
            >
              <Text className="text-foreground font-semibold">📤 Share Records</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

/**
 * Record Card Component
 */
function RecordCard({
  record,
  colors,
  onPress,
}: {
  record: any;
  colors: any;
  onPress: () => void;
}) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'lab_result':
        return '🧪';
      case 'prescription':
        return '💊';
      case 'imaging':
        return '📸';
      default:
        return '📋';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return colors.success;
      case 'abnormal':
        return colors.warning;
      case 'critical':
        return colors.error;
      default:
        return colors.muted;
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
      className="p-4 rounded-lg flex-row items-center gap-4"
    >
      <View className="w-12 h-12 rounded-lg bg-primary/10 items-center justify-center">
        <Text className="text-2xl">{getIcon(record.type)}</Text>
      </View>

      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground">{record.title}</Text>
        <Text className="text-xs text-muted mt-1">{record.provider}</Text>
        <Text className="text-xs text-muted mt-1">{formatDate(record.date)}</Text>
      </View>

      <View className="items-center gap-2">
        <View
          style={{ backgroundColor: getStatusColor(record.status) + '20' }}
          className="px-2 py-1 rounded-full"
        >
          <Text
            style={{ color: getStatusColor(record.status) }}
            className="text-xs font-semibold capitalize"
          >
            {record.status}
          </Text>
        </View>
        <Text className="text-lg">→</Text>
      </View>
    </Pressable>
  );
}
