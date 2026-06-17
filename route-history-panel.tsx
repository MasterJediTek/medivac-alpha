import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TextInput,
} from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { routeHistoryService, type SavedRoute } from '@/lib/services/route-history.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PANEL_WIDTH = Math.min(300, SCREEN_WIDTH * 0.8);

interface RouteHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoute: (route: SavedRoute) => void;
}

export function RouteHistoryPanel({ isOpen, onClose, onSelectRoute }: RouteHistoryPanelProps) {
  const colors = useColors();
  const slideAnim = useRef(new Animated.Value(PANEL_WIDTH)).current;
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'recent' | 'favorites' | 'frequent'>('recent');

  useEffect(() => {
    if (isOpen) {
      loadRoutes();
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: PANEL_WIDTH,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [isOpen, activeTab]);

  const loadRoutes = () => {
    let loadedRoutes: SavedRoute[] = [];
    
    switch (activeTab) {
      case 'recent':
        loadedRoutes = routeHistoryService.getRecentRoutes(20);
        break;
      case 'favorites':
        loadedRoutes = routeHistoryService.getFavoriteRoutes();
        break;
      case 'frequent':
        loadedRoutes = routeHistoryService.getMostUsedRoutes(10);
        break;
    }
    
    if (searchQuery) {
      loadedRoutes = routeHistoryService.searchRoutes(searchQuery);
    }
    
    setRoutes(loadedRoutes);
  };

  useEffect(() => {
    if (isOpen) {
      loadRoutes();
    }
  }, [searchQuery]);

  const handleToggleFavorite = (routeId: string) => {
    routeHistoryService.toggleFavorite(routeId);
    loadRoutes();
  };

  const handleDeleteRoute = (routeId: string) => {
    routeHistoryService.deleteRoute(routeId);
    loadRoutes();
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      width: PANEL_WIDTH,
      backgroundColor: colors.background,
      shadowColor: '#000',
      shadowOffset: { width: -2, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 10,
      zIndex: 100,
    },
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.foreground,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButtonText: {
      fontSize: 16,
      color: colors.muted,
    },
    searchInput: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 10,
      fontSize: 14,
      color: colors.foreground,
      marginBottom: 12,
    },
    tabs: {
      flexDirection: 'row',
      gap: 8,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    tabActive: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.muted,
    },
    tabTextActive: {
      color: '#FFFFFF',
    },
    scrollView: {
      flex: 1,
    },
    routeCard: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    routeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
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
    routeDate: {
      fontSize: 11,
      color: colors.muted,
    },
    routeActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionButtonText: {
      fontSize: 14,
    },
    routeDetails: {
      flexDirection: 'row',
      gap: 16,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    detailIcon: {
      fontSize: 12,
    },
    detailText: {
      fontSize: 12,
      color: colors.muted,
    },
    routePoints: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    pointRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    pointDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    pointText: {
      fontSize: 12,
      color: colors.foreground,
    },
    emptyState: {
      padding: 24,
      alignItems: 'center',
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 12,
    },
    emptyText: {
      fontSize: 14,
      color: colors.muted,
      textAlign: 'center',
    },
    stats: {
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.foreground,
    },
    statLabel: {
      fontSize: 10,
      color: colors.muted,
    },
  });

  if (!isOpen) return null;

  const stats = routeHistoryService.getRouteStats();

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: slideAnim }] }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>📍 Route History</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Search routes..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'recent' && styles.tabActive]}
            onPress={() => setActiveTab('recent')}
          >
            <Text style={[styles.tabText, activeTab === 'recent' && styles.tabTextActive]}>
              Recent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'favorites' && styles.tabActive]}
            onPress={() => setActiveTab('favorites')}
          >
            <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>
              Favorites
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'frequent' && styles.tabActive]}
            onPress={() => setActiveTab('frequent')}
          >
            <Text style={[styles.tabText, activeTab === 'frequent' && styles.tabTextActive]}>
              Frequent
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {routes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'No routes match your search'
                : activeTab === 'favorites'
                ? 'No favorite routes yet'
                : 'No routes in history'}
            </Text>
          </View>
        ) : (
          routes.map((route) => (
            <TouchableOpacity
              key={route.id}
              style={styles.routeCard}
              onPress={() => onSelectRoute(route)}
            >
              <View style={styles.routeHeader}>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeName}>{route.name}</Text>
                  <Text style={styles.routeDate}>{formatDate(route.timestamp)}</Text>
                </View>
                <View style={styles.routeActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleToggleFavorite(route.id)}
                  >
                    <Text style={styles.actionButtonText}>
                      {route.isFavorite ? '⭐' : '☆'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteRoute(route.id)}
                  >
                    <Text style={styles.actionButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.routeDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>📏</Text>
                  <Text style={styles.detailText}>{route.distance.toFixed(0)}m</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>⏱️</Text>
                  <Text style={styles.detailText}>{formatDuration(route.duration)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>🔄</Text>
                  <Text style={styles.detailText}>{route.useCount}x</Text>
                </View>
              </View>

              <View style={styles.routePoints}>
                <View style={styles.pointRow}>
                  <View style={[styles.pointDot, { backgroundColor: '#22C55E' }]} />
                  <Text style={styles.pointText}>{route.startLocation}</Text>
                </View>
                <View style={styles.pointRow}>
                  <View style={[styles.pointDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.pointText}>{route.endLocation}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <View style={styles.stats}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalRoutes}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.favoriteCount}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{(stats.totalDistance / 1000).toFixed(1)}km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.floor(stats.totalDuration / 60)}m</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
