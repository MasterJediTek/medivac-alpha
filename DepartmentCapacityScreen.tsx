/**
 * Department Capacity Alerts Screen
 * Displays real-time bed occupancy and capacity alerts
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { capacityAlertsService, DepartmentCapacity } from '@/lib/services/capacity-alerts.service';

export default function DepartmentCapacityScreen() {
  const colors = useColors();
  const [capacities, setCapacities] = useState<DepartmentCapacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning'>('all');

  useEffect(() => {
    loadCapacities();
    const interval = setInterval(loadCapacities, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const loadCapacities = async () => {
    try {
      await capacityAlertsService.initialize();
      const allCapacities = capacityAlertsService.getCapacities();
      setCapacities(allCapacities);
    } catch (error) {
      console.error('[Capacity] Error loading capacities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: DepartmentCapacity['status']) => {
    switch (status) {
      case 'available':
        return '#22c55e'; // Green
      case 'warning':
        return '#eab308'; // Yellow
      case 'critical':
        return '#f97316'; // Orange
      case 'full':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  const getStatusLabel = (status: DepartmentCapacity['status']) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'warning':
        return 'Warning';
      case 'critical':
        return 'Critical';
      case 'full':
        return 'Full';
      default:
        return 'Unknown';
    }
  };

  const getTrendIcon = (trend: DepartmentCapacity['trend']) => {
    switch (trend) {
      case 'increasing':
        return '📈';
      case 'decreasing':
        return '📉';
      default:
        return '➡️';
    }
  };

  const filteredCapacities = capacities.filter(dept => {
    if (filter === 'all') return true;
    if (filter === 'critical') return dept.occupancyPercentage > 90;
    if (filter === 'warning') return dept.occupancyPercentage >= 80 && dept.occupancyPercentage <= 90;
    return true;
  });

  const stats = capacityAlertsService.getCapacityStats();

  const renderCapacityCard = (dept: DepartmentCapacity) => (
    <View key={dept.departmentId} className="bg-surface rounded-2xl p-4 mb-3 border border-border">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1">
          <Text className="text-foreground font-semibold text-lg">{dept.departmentName}</Text>
          <Text className="text-muted text-sm">
            {getTrendIcon(dept.trend)} {dept.trend.charAt(0).toUpperCase() + dept.trend.slice(1)}
          </Text>
        </View>
        <View
          className="rounded-full px-3 py-1"
          style={{ backgroundColor: getStatusColor(dept.status) }}
        >
          <Text className="text-white font-semibold text-xs">
            {getStatusLabel(dept.status)}
          </Text>
        </View>
      </View>

      {/* Occupancy Bar */}
      <View className="mb-3">
        <View className="flex-row justify-between mb-2">
          <Text className="text-muted text-sm">Occupancy</Text>
          <Text className="text-foreground font-semibold">{dept.occupancyPercentage}%</Text>
        </View>
        <View className="bg-background rounded-full h-2 overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${dept.occupancyPercentage}%`,
              backgroundColor: getStatusColor(dept.status),
            }}
          />
        </View>
      </View>

      {/* Bed Count */}
      <View className="flex-row gap-4 mb-3">
        <View className="flex-1">
          <Text className="text-muted text-xs mb-1">Occupied</Text>
          <Text className="text-foreground font-semibold">{dept.occupiedBeds}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-muted text-xs mb-1">Available</Text>
          <Text className="text-success font-semibold">{dept.availableBeds}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-muted text-xs mb-1">Total</Text>
          <Text className="text-foreground font-semibold">{dept.totalBeds}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-muted text-xs mb-1">Wait Time</Text>
          <Text className="text-foreground font-semibold">{dept.estimatedWaitTime}min</Text>
        </View>
      </View>

      {/* Last Updated */}
      <Text className="text-muted text-xs">
        Updated {new Date(dept.lastUpdated).toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">
            Department Capacity
          </Text>
          <Text className="text-muted">
            Real-time bed occupancy and capacity alerts
          </Text>
        </View>

        {/* Statistics */}
        <View className="grid grid-cols-2 gap-3 mb-6">
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-muted text-sm mb-1">Average Occupancy</Text>
            <Text className="text-2xl font-bold text-foreground">{stats.averageOccupancy}%</Text>
          </View>
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-muted text-sm mb-1">Critical Depts</Text>
            <Text className="text-2xl font-bold text-warning">{stats.criticalDepartments}</Text>
          </View>
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-muted text-sm mb-1">Total Beds</Text>
            <Text className="text-2xl font-bold text-foreground">{stats.totalBeds}</Text>
          </View>
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-muted text-sm mb-1">Available</Text>
            <Text className="text-2xl font-bold text-success">{stats.totalAvailable}</Text>
          </View>
        </View>

        {/* Filter Buttons */}
        <View className="flex-row gap-2 mb-4">
          {(['all', 'critical', 'warning'] as const).map(f => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              className={cn(
                'flex-1 py-2 rounded-lg',
                filter === f ? 'bg-primary' : 'bg-surface border border-border'
              )}
            >
              <Text
                className={cn(
                  'text-center font-semibold text-sm',
                  filter === f ? 'text-white' : 'text-foreground'
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Capacity Cards */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredCapacities.length > 0 ? (
          <View>
            {filteredCapacities.map(dept => renderCapacityCard(dept))}
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted text-center">No departments match filter</Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
