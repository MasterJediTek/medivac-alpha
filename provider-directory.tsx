import React, { useState, useEffect } from 'react';
import { ScrollView, Text, View, Pressable, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

/**
 * Provider Directory Screen - Search and browse healthcare providers
 */
export default function ProviderDirectoryScreen() {
  const router = useRouter();
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const specialties = [
    'General Practice',
    'Cardiology',
    'Dermatology',
    'Neurology',
    'Orthopedics',
    'Psychiatry',
  ];

  useEffect(() => {
    loadProviders();
  }, [selectedSpecialty]);

  const loadProviders = async () => {
    setIsLoading(true);
    try {
      // TODO: Load from provider directory service
      // Mock data for now
      setProviders([
        {
          id: '1',
          name: 'Dr. Sarah Johnson',
          specialty: 'General Practice',
          rating: 4.8,
          reviewCount: 124,
          avatar: '👩‍⚕️',
          acceptingPatients: true,
          consultationFee: 75,
          responseTime: '< 1 hour',
        },
        {
          id: '2',
          name: 'Dr. Michael Chen',
          specialty: 'Cardiology',
          rating: 4.9,
          reviewCount: 89,
          avatar: '👨‍⚕️',
          acceptingPatients: true,
          consultationFee: 100,
          responseTime: '< 2 hours',
        },
        {
          id: '3',
          name: 'Dr. Emily Davis',
          specialty: 'Dermatology',
          rating: 4.7,
          reviewCount: 156,
          avatar: '👩‍⚕️',
          acceptingPatients: false,
          consultationFee: 85,
          responseTime: '< 3 hours',
        },
      ]);
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = (providerId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(providerId)) {
      newFavorites.delete(providerId);
    } else {
      newFavorites.add(providerId);
    }
    setFavorites(newFavorites);
  };

  const filteredProviders = selectedSpecialty
    ? providers.filter(p => p.specialty === selectedSpecialty)
    : providers;

  return (
    <ScreenContainer className="bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="py-6 px-6 gap-6">
          {/* Header */}
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-2xl font-bold text-foreground">Find a Provider</Text>
              <Text className="text-sm text-muted mt-1">Search healthcare professionals</Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-surface items-center justify-center"
            >
              <Text className="text-lg">✕</Text>
            </Pressable>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center gap-2 px-4 py-3 rounded-lg bg-surface border border-border">
            <Text className="text-lg">🔍</Text>
            <TextInput
              placeholder="Search by name or specialty"
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-foreground"
            />
          </View>

          {/* Specialty Filter */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Specialties</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
              {specialties.map((specialty) => (
                <Pressable
                  key={specialty}
                  onPress={() => setSelectedSpecialty(
                    selectedSpecialty === specialty ? null : specialty
                  )}
                  style={({ pressed }) => [
                    {
                      backgroundColor: selectedSpecialty === specialty
                        ? colors.primary
                        : colors.surface,
                      borderColor: colors.border,
                      borderWidth: 1,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  className="px-4 py-2 rounded-full"
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedSpecialty === specialty
                        ? 'text-white'
                        : 'text-foreground'
                    }`}
                  >
                    {specialty}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Providers List */}
          {isLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : filteredProviders.length === 0 ? (
            <View className="py-8 items-center gap-2">
              <Text className="text-lg text-muted">No providers found</Text>
              <Text className="text-sm text-muted">Try adjusting your search</Text>
            </View>
          ) : (
            <View className="gap-3">
              {filteredProviders.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  colors={colors}
                  isFavorite={favorites.has(provider.id)}
                  onFavoritePress={() => handleToggleFavorite(provider.id)}
                  onPress={() => router.push(`/provider/${provider.id}`)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

/**
 * Provider Card Component
 */
function ProviderCard({
  provider,
  colors,
  isFavorite,
  onFavoritePress,
  onPress,
}: {
  provider: any;
  colors: any;
  isFavorite: boolean;
  onFavoritePress: () => void;
  onPress: () => void;
}) {
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
      className="p-4 rounded-lg gap-3"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-row items-center gap-3 flex-1">
          <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center">
            <Text className="text-2xl">{provider.avatar}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground">
              {provider.name}
            </Text>
            <Text className="text-xs text-muted">{provider.specialty}</Text>
          </View>
        </View>
        <Pressable
          onPress={onFavoritePress}
          className="w-8 h-8 items-center justify-center"
        >
          <Text className="text-lg">{isFavorite ? '❤️' : '🤍'}</Text>
        </Pressable>
      </View>

      <View className="flex-row justify-between items-center pt-2 border-t border-border">
        <View className="flex-row items-center gap-1">
          <Text className="text-yellow-500">⭐</Text>
          <Text className="text-sm font-semibold text-foreground">{provider.rating}</Text>
          <Text className="text-xs text-muted">({provider.reviewCount})</Text>
        </View>

        <View className="items-end">
          <Text className="text-sm font-semibold text-foreground">
            ${provider.consultationFee}
          </Text>
          <Text className="text-xs text-muted">{provider.responseTime}</Text>
        </View>
      </View>

      <View className="flex-row gap-2">
        <Pressable
          style={({ pressed }) => [
            {
              backgroundColor: provider.acceptingPatients ? colors.primary : colors.muted,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          className="flex-1 py-2 rounded-lg items-center"
        >
          <Text className="text-sm font-semibold text-white">
            {provider.acceptingPatients ? 'Book Now' : 'Not Available'}
          </Text>
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
          className="flex-1 py-2 rounded-lg items-center"
        >
          <Text className="text-sm font-semibold text-foreground">View Profile</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}
