/**
 * User Location Marker Component
 * 
 * Displays the user's current position on the map with accuracy indicator.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { indoorPositioningService, UserPosition } from '@/lib/services/indoor-positioning.service';

interface UserLocationMarkerProps {
  scale?: number;
  showAccuracy?: boolean;
  showDepartment?: boolean;
}

export function UserLocationMarker({ 
  scale = 1, 
  showAccuracy = true,
  showDepartment = true,
}: UserLocationMarkerProps) {
  const [position, setPosition] = useState<UserPosition | null>(null);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Subscribe to position updates
    const unsubscribe = indoorPositioningService.onPositionUpdate(setPosition);
    
    // Start tracking if not already
    if (!indoorPositioningService.isTracking()) {
      indoorPositioningService.startTracking();
    }

    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => {
      unsubscribe();
      pulse.stop();
    };
  }, [pulseAnim]);

  if (!position) return null;

  const markerSize = 20 * scale;
  const accuracySize = Math.min(position.accuracy * 2 * scale, 100);

  return (
    <View 
      style={[
        styles.container,
        {
          left: position.position.x * scale - markerSize / 2,
          top: position.position.y * scale - markerSize / 2,
        },
      ]}
    >
      {/* Accuracy circle */}
      {showAccuracy && (
        <Animated.View
          style={[
            styles.accuracyCircle,
            {
              width: accuracySize,
              height: accuracySize,
              borderRadius: accuracySize / 2,
              marginLeft: -(accuracySize - markerSize) / 2,
              marginTop: -(accuracySize - markerSize) / 2,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      )}

      {/* User marker */}
      <View style={[styles.marker, { width: markerSize, height: markerSize, borderRadius: markerSize / 2 }]}>
        <View style={[styles.markerInner, { width: markerSize * 0.6, height: markerSize * 0.6, borderRadius: markerSize * 0.3 }]} />
      </View>

      {/* Direction indicator */}
      <View style={[styles.directionIndicator, { top: -8 * scale }]} />

      {/* Department label */}
      {showDepartment && position.department && (
        <View style={styles.departmentLabel}>
          <Text style={styles.departmentText}>{position.department}</Text>
          <Text style={styles.accuracyText}>±{Math.round(position.accuracy)}m</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  accuracyCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  marker: {
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  markerInner: {
    backgroundColor: '#FFFFFF',
  },
  directionIndicator: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#3B82F6',
  },
  departmentLabel: {
    position: 'absolute',
    top: 30,
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  departmentText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  accuracyText: {
    fontSize: 8,
    color: '#9CA3AF',
    marginTop: 2,
  },
});

export default UserLocationMarker;
