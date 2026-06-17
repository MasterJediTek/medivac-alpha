/**
 * Route Favorites Widget
 * Displays top 3 most-used routes on the home screen for quick navigation
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { routeHistoryService, type SavedRoute } from '@/lib/services/route-history.service';

interface RouteFavoritesWidgetProps {
  maxRoutes?: number;
  onRouteSelect?: (route: SavedRoute) => void;
}

export function RouteFavoritesWidget({ 
  maxRoutes = 3,
  onRouteSelect 
}: RouteFavoritesWidgetProps) {
  const colors = useColors();
  const router = useRouter();
  const [favoriteRoutes, setFavoriteRoutes] = useState<SavedRoute[]>([]);

  useEffect(() => {
    // Load routes immediately on mount
    const loadRoutes = () => {
      const allRoutes = routeHistoryService.getAllRoutes();
      const sortedRoutes = [...allRoutes]
        .sort((a, b) => (b.useCount || 0) - (a.useCount || 0))
        .slice(0, maxRoutes);
      setFavoriteRoutes(sortedRoutes);
    };
    
    loadRoutes();
    
    const unsubscribe = routeHistoryService.subscribe(() => {
      loadRoutes();
    });

    return unsubscribe;
  }, [maxRoutes]);

  const handleRoutePress = (route: SavedRoute) => {
    if (onRouteSelect) {
      onRouteSelect(route);
    } else {
      // Navigate to hospital map with route
      router.push('/hospital-map');
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 100) return `${meters}m`;
    return `${(meters / 100).toFixed(0)}m`;
  };

  const getRouteIcon = (index: number): string => {
    const icons = ['⭐', '🔥', '📍'];
    return icons[index] || '📍';
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
    },
    viewAllButton: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      backgroundColor: colors.primary + '20',
      borderRadius: 12,
    },
    viewAllText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '500',
    },
    routeList: {
      gap: 8,
    },
    routeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    routeIcon: {
      fontSize: 20,
      marginRight: 12,
    },
    routeInfo: {
      flex: 1,
    },
    routeName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 2,
    },
    routeDetails: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    routeDetail: {
      fontSize: 12,
      color: colors.muted,
    },
    routeStats: {
      alignItems: 'flex-end',
    },
    usageCount: {
      fontSize: 12,
      color: colors.muted,
    },
    goButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      marginTop: 4,
    },
    goButtonText: {
      fontSize: 12,
      color: '#fff',
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      padding: 20,
    },
    emptyIcon: {
      fontSize: 32,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: colors.muted,
      textAlign: 'center',
    },
    emptyHint: {
      fontSize: 12,
      color: colors.muted,
      textAlign: 'center',
      marginTop: 4,
    },
  });

  if (favoriteRoutes.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🗺️ Quick Routes</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🧭</Text>
          <Text style={styles.emptyText}>No favorite routes yet</Text>
          <Text style={styles.emptyHint}>Navigate to places to build your favorites</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Quick Routes</Text>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => router.push('/hospital-map')}
        >
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.routeList}>
        {favoriteRoutes.map((route, index) => (
          <TouchableOpacity
            key={route.id}
            style={styles.routeCard}
            onPress={() => handleRoutePress(route)}
          >
            <Text style={styles.routeIcon}>{getRouteIcon(index)}</Text>
            <View style={styles.routeInfo}>
              <Text style={styles.routeName} numberOfLines={1}>
                {route.name}
              </Text>
              <View style={styles.routeDetails}>
                <Text style={styles.routeDetail}>
                  📍 {route.startLocation} → {route.endLocation}
                </Text>
              </View>
              <View style={styles.routeDetails}>
                <Text style={styles.routeDetail}>
                  🚶 {formatDistance(route.distance || 0)}
                </Text>
                <Text style={styles.routeDetail}>
                  ⏱️ {formatTime(route.estimatedTime || 0)}
                </Text>
              </View>
            </View>
            <View style={styles.routeStats}>
              <Text style={styles.usageCount}>
                Used {route.useCount || 0}x
              </Text>
              <TouchableOpacity 
                style={styles.goButton}
                onPress={() => handleRoutePress(route)}
              >
                <Text style={styles.goButtonText}>GO</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default RouteFavoritesWidget;
