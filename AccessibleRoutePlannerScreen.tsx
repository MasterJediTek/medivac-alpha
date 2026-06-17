/**
 * Accessible Route Planner Screen
 * Plans wheelchair-friendly routes with accessibility features
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { accessibleRoutePlannerService, AccessibleRoute } from '@/lib/services/accessible-route-planner.service';

interface RouteLocation {
  id: string;
  name: string;
  category: string;
}

const HOSPITAL_LOCATIONS: RouteLocation[] = [
  { id: 'main_entrance', name: 'Main Entrance', category: 'Entrance' },
  { id: 'emergency', name: 'Emergency Department', category: 'Department' },
  { id: 'radiology', name: 'Radiology', category: 'Department' },
  { id: 'pharmacy', name: 'Pharmacy', category: 'Department' },
  { id: 'maternity', name: 'Maternity Ward', category: 'Department' },
  { id: 'paediatrics', name: 'Paediatrics', category: 'Department' },
  { id: 'cafeteria', name: 'Cafeteria', category: 'Facility' },
  { id: 'parking', name: 'Accessible Parking', category: 'Facility' },
  { id: 'admin', name: 'Administration', category: 'Office' },
  { id: 'mental_health', name: 'Mental Health', category: 'Department' },
];

export default function AccessibleRoutePlannerScreen() {
  const colors = useColors();
  const [startLocation, setStartLocation] = useState<RouteLocation | null>(null);
  const [endLocation, setEndLocation] = useState<RouteLocation | null>(null);
  const [wheelchairWidth, setWheelchairWidth] = useState(70); // cm
  const [route, setRoute] = useState<AccessibleRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handlePlanRoute = async () => {
    if (!startLocation || !endLocation) return;

    setLoading(true);
    try {
      const plannedRoute = await accessibleRoutePlannerService.planAccessibleRoute(
        startLocation.name,
        endLocation.name,
        wheelchairWidth
      );
      setRoute(plannedRoute);
    } catch (error) {
      console.error('[Accessible Route Planner] Error planning route:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAccessibilityColor = (score: number) => {
    if (score >= 80) return '#22c55e'; // Green
    if (score >= 60) return '#eab308'; // Yellow
    if (score >= 40) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const renderLocationPicker = (
    locations: RouteLocation[],
    onSelect: (location: RouteLocation) => void,
    onClose: () => void
  ) => (
    <View className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
      <View className="bg-surface rounded-2xl w-4/5 max-h-96 overflow-hidden">
        <View className="bg-primary p-4">
          <Text className="text-white font-semibold text-lg">Select Location</Text>
        </View>
        <FlatList
          data={locations}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                onSelect(item);
                onClose();
              }}
              className="p-4 border-b border-border"
            >
              <Text className="text-foreground font-medium">{item.name}</Text>
              <Text className="text-muted text-sm">{item.category}</Text>
            </Pressable>
          )}
        />
      </View>
    </View>
  );

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">
            Accessible Route Planner
          </Text>
          <Text className="text-muted">
            Find wheelchair-friendly routes through the hospital
          </Text>
        </View>

        {/* Route Selection */}
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">Route Selection</Text>

          {/* Start Location */}
          <Pressable
            onPress={() => setShowStartPicker(true)}
            className="bg-background rounded-lg p-3 mb-3 border border-border"
          >
            <Text className="text-muted text-sm mb-1">From</Text>
            <Text className="text-foreground font-medium">
              {startLocation?.name || 'Select starting location'}
            </Text>
          </Pressable>

          {/* End Location */}
          <Pressable
            onPress={() => setShowEndPicker(true)}
            className="bg-background rounded-lg p-3 mb-4 border border-border"
          >
            <Text className="text-muted text-sm mb-1">To</Text>
            <Text className="text-foreground font-medium">
              {endLocation?.name || 'Select destination'}
            </Text>
          </Pressable>

          {/* Wheelchair Width */}
          <View className="mb-4">
            <Text className="text-muted text-sm mb-2">Wheelchair Width: {wheelchairWidth}cm</Text>
            <View className="flex-row items-center gap-2">
              {[60, 70, 80, 90].map(width => (
                <Pressable
                  key={width}
                  onPress={() => setWheelchairWidth(width)}
                  className={cn(
                    'flex-1 py-2 rounded-lg',
                    wheelchairWidth === width ? 'bg-primary' : 'bg-background border border-border'
                  )}
                >
                  <Text
                    className={cn(
                      'text-center font-medium',
                      wheelchairWidth === width ? 'text-white' : 'text-foreground'
                    )}
                  >
                    {width}cm
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Plan Route Button */}
          <Pressable
            onPress={handlePlanRoute}
            disabled={!startLocation || !endLocation || loading}
            className={cn(
              'py-3 rounded-lg items-center',
              startLocation && endLocation && !loading ? 'bg-primary' : 'bg-muted opacity-50'
            )}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold">Plan Route</Text>
            )}
          </Pressable>
        </View>

        {/* Route Details */}
        {route && (
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">Route Details</Text>
              <View
                className="rounded-full px-3 py-1"
                style={{ backgroundColor: getAccessibilityColor(route.accessibilityScore) }}
              >
                <Text className="text-white font-semibold text-sm">
                  {route.accessibilityScore}% Accessible
                </Text>
              </View>
            </View>

            {/* Distance & Time */}
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1 bg-background rounded-lg p-3">
                <Text className="text-muted text-sm mb-1">Distance</Text>
                <Text className="text-foreground font-semibold text-lg">
                  {(route.distance / 1000).toFixed(1)}km
                </Text>
              </View>
              <View className="flex-1 bg-background rounded-lg p-3">
                <Text className="text-muted text-sm mb-1">Est. Time</Text>
                <Text className="text-foreground font-semibold text-lg">
                  {Math.round(route.estimatedAccessibleTime / 60)}min
                </Text>
              </View>
            </View>

            {/* Accessibility Features */}
            <View className="mb-4">
              <Text className="text-foreground font-semibold mb-2">Accessibility Features</Text>
              <View className="flex-row gap-2 flex-wrap">
                {route.hasElevators && (
                  <View className="bg-success/20 rounded-full px-3 py-1">
                    <Text className="text-success font-medium text-sm">✓ Elevators</Text>
                  </View>
                )}
                {route.hasRamps && (
                  <View className="bg-success/20 rounded-full px-3 py-1">
                    <Text className="text-success font-medium text-sm">✓ Ramps</Text>
                  </View>
                )}
                {route.accessibleRestrooms > 0 && (
                  <View className="bg-success/20 rounded-full px-3 py-1">
                    <Text className="text-success font-medium text-sm">
                      ✓ {route.accessibleRestrooms} Restrooms
                    </Text>
                  </View>
                )}
                {route.parkingSpaces > 0 && (
                  <View className="bg-success/20 rounded-full px-3 py-1">
                    <Text className="text-success font-medium text-sm">
                      ✓ {route.parkingSpaces} Parking
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Warnings */}
            {route.warnings.length > 0 && (
              <View className="mb-4 bg-warning/10 rounded-lg p-3 border border-warning/30">
                <Text className="text-warning font-semibold mb-2">⚠ Warnings</Text>
                {route.warnings.map((warning, idx) => (
                  <Text key={idx} className="text-warning text-sm mb-1">
                    • {warning}
                  </Text>
                ))}
              </View>
            )}

            {/* Directions */}
            <View className="mb-4">
              <Text className="text-foreground font-semibold mb-2">Directions</Text>
              {route.directions.map((direction, idx) => (
                <View key={idx} className="flex-row gap-3 mb-2">
                  <View className="bg-primary rounded-full w-6 h-6 items-center justify-center">
                    <Text className="text-white text-xs font-bold">{idx + 1}</Text>
                  </View>
                  <Text className="flex-1 text-foreground pt-0.5">{direction}</Text>
                </View>
              ))}
            </View>

            {/* Share Button */}
            <Pressable className="bg-primary py-3 rounded-lg items-center">
              <Text className="text-white font-semibold">Share Route</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Location Pickers */}
      {showStartPicker && renderLocationPicker(HOSPITAL_LOCATIONS, setStartLocation, () => setShowStartPicker(false))}
      {showEndPicker && renderLocationPicker(HOSPITAL_LOCATIONS, setEndLocation, () => setShowEndPicker(false))}
    </ScreenContainer>
  );
}
