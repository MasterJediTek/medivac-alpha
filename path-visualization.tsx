/**
 * Path Visualization Component
 * 
 * Renders animated dotted path lines showing avatar navigation routes
 * with destination markers and ETA displays.
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';

// ============================================================================
// TYPES
// ============================================================================

export interface PathPoint {
  x: number;
  y: number;
}

export interface PathSegment {
  start: PathPoint;
  end: PathPoint;
  distance: number;
}

export interface AvatarPath {
  id: string;
  avatarId: string;
  avatarName: string;
  avatarIcon: string;
  avatarType: 'staff' | 'patient' | 'visitor' | 'pet';
  path: PathPoint[];
  currentPosition: PathPoint;
  destination: PathPoint;
  destinationName: string;
  progress: number; // 0-1
  eta: number; // seconds
  isActive: boolean;
  color: string;
}

export interface PathVisualizationProps {
  paths: AvatarPath[];
  mapWidth: number;
  mapHeight: number;
  showLabels?: boolean;
  showETA?: boolean;
  showDestinationMarker?: boolean;
  animateProgress?: boolean;
  pathStyle?: 'dotted' | 'dashed' | 'solid';
  pathWidth?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const AVATAR_TYPE_COLORS: Record<string, string> = {
  staff: '#3B82F6',    // Blue
  patient: '#10B981',  // Green
  visitor: '#F59E0B',  // Amber
  pet: '#EC4899',      // Pink
};

const PATH_STYLES = {
  dotted: '4,8',
  dashed: '12,6',
  solid: '',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate total path distance
 */
function calculatePathDistance(path: PathPoint[]): number {
  let distance = 0;
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    distance += Math.sqrt(dx * dx + dy * dy);
  }
  return distance;
}

/**
 * Get point along path at given progress (0-1)
 */
function getPointAtProgress(path: PathPoint[], progress: number): PathPoint {
  if (path.length === 0) return { x: 0, y: 0 };
  if (path.length === 1) return path[0];
  if (progress <= 0) return path[0];
  if (progress >= 1) return path[path.length - 1];

  const totalDistance = calculatePathDistance(path);
  const targetDistance = totalDistance * progress;
  
  let currentDistance = 0;
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    const segmentDistance = Math.sqrt(dx * dx + dy * dy);
    
    if (currentDistance + segmentDistance >= targetDistance) {
      const segmentProgress = (targetDistance - currentDistance) / segmentDistance;
      return {
        x: path[i - 1].x + dx * segmentProgress,
        y: path[i - 1].y + dy * segmentProgress,
      };
    }
    currentDistance += segmentDistance;
  }
  
  return path[path.length - 1];
}

/**
 * Generate SVG path string from points
 */
function generatePathString(points: PathPoint[]): string {
  if (points.length === 0) return '';
  
  let pathString = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 1; i < points.length; i++) {
    pathString += ` L ${points[i].x} ${points[i].y}`;
  }
  
  return pathString;
}

/**
 * Format ETA for display
 */
function formatETA(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

// ============================================================================
// ANIMATED PATH COMPONENT
// ============================================================================

interface AnimatedPathProps {
  avatarPath: AvatarPath;
  mapWidth: number;
  mapHeight: number;
  pathStyle: 'dotted' | 'dashed' | 'solid';
  pathWidth: number;
  showLabels: boolean;
  showETA: boolean;
  showDestinationMarker: boolean;
  animateProgress: boolean;
}

function AnimatedPath({
  avatarPath,
  mapWidth,
  mapHeight,
  pathStyle,
  pathWidth,
  showLabels,
  showETA,
  showDestinationMarker,
  animateProgress,
}: AnimatedPathProps) {
  const dashOffset = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Animate dash offset for moving effect
  useEffect(() => {
    if (!animateProgress || !avatarPath.isActive) return;
    
    const animation = Animated.loop(
      Animated.timing(dashOffset, {
        toValue: -24,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    animation.start();
    
    return () => animation.stop();
  }, [animateProgress, avatarPath.isActive]);
  
  // Pulse animation for destination marker
  useEffect(() => {
    if (!showDestinationMarker || !avatarPath.isActive) return;
    
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    
    return () => animation.stop();
  }, [showDestinationMarker, avatarPath.isActive]);
  
  const pathString = useMemo(() => {
    return generatePathString(avatarPath.path);
  }, [avatarPath.path]);
  
  const color = avatarPath.color || AVATAR_TYPE_COLORS[avatarPath.avatarType] || '#3B82F6';
  const strokeDasharray = PATH_STYLES[pathStyle];
  
  // Calculate current position on path
  const currentPoint = useMemo(() => {
    return getPointAtProgress(avatarPath.path, avatarPath.progress);
  }, [avatarPath.path, avatarPath.progress]);
  
  if (avatarPath.path.length < 2) return null;
  
  return (
    <G>
      {/* Path gradient definition */}
      <Defs>
        <LinearGradient id={`pathGradient-${avatarPath.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <Stop offset={`${avatarPath.progress * 100}%`} stopColor={color} stopOpacity="0.8" />
          <Stop offset="100%" stopColor={color} stopOpacity="0.3" />
        </LinearGradient>
      </Defs>
      
      {/* Background path (faded) */}
      <Path
        d={pathString}
        stroke={color}
        strokeWidth={pathWidth}
        strokeOpacity={0.2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Active path (animated) */}
      <Path
        d={pathString}
        stroke={`url(#pathGradient-${avatarPath.id})`}
        strokeWidth={pathWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={strokeDasharray}
      />
      
      {/* Current position marker */}
      <Circle
        cx={currentPoint.x}
        cy={currentPoint.y}
        r={8}
        fill={color}
        stroke="#FFFFFF"
        strokeWidth={2}
      />
      
      {/* Destination marker */}
      {showDestinationMarker && (
        <>
          <Circle
            cx={avatarPath.destination.x}
            cy={avatarPath.destination.y}
            r={12}
            fill={color}
            fillOpacity={0.3}
            stroke={color}
            strokeWidth={2}
          />
          <Circle
            cx={avatarPath.destination.x}
            cy={avatarPath.destination.y}
            r={6}
            fill={color}
          />
        </>
      )}
      
      {/* Path waypoints */}
      {avatarPath.path.map((point, index) => {
        if (index === 0 || index === avatarPath.path.length - 1) return null;
        return (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={3}
            fill={color}
            fillOpacity={0.5}
          />
        );
      })}
    </G>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PathVisualization({
  paths,
  mapWidth,
  mapHeight,
  showLabels = true,
  showETA = true,
  showDestinationMarker = true,
  animateProgress = true,
  pathStyle = 'dotted',
  pathWidth = 3,
}: PathVisualizationProps) {
  const activePaths = paths.filter(p => p.isActive && p.path.length >= 2);
  
  if (activePaths.length === 0) {
    return null;
  }
  
  return (
    <View style={[styles.container, { width: mapWidth, height: mapHeight }]}>
      {/* SVG Paths */}
      <Svg
        width={mapWidth}
        height={mapHeight}
        style={styles.svg}
      >
        {activePaths.map((avatarPath) => (
          <AnimatedPath
            key={avatarPath.id}
            avatarPath={avatarPath}
            mapWidth={mapWidth}
            mapHeight={mapHeight}
            pathStyle={pathStyle}
            pathWidth={pathWidth}
            showLabels={showLabels}
            showETA={showETA}
            showDestinationMarker={showDestinationMarker}
            animateProgress={animateProgress}
          />
        ))}
      </Svg>
      
      {/* Labels and ETA (rendered as React Native views for better text handling) */}
      {activePaths.map((avatarPath) => {
        const currentPoint = getPointAtProgress(avatarPath.path, avatarPath.progress);
        const color = avatarPath.color || AVATAR_TYPE_COLORS[avatarPath.avatarType] || '#3B82F6';
        
        return (
          <View key={`labels-${avatarPath.id}`}>
            {/* Avatar label */}
            {showLabels && (
              <View
                style={[
                  styles.avatarLabel,
                  {
                    left: currentPoint.x - 40,
                    top: currentPoint.y - 35,
                    backgroundColor: color,
                  },
                ]}
              >
                <Text style={styles.avatarLabelIcon}>{avatarPath.avatarIcon}</Text>
                <Text style={styles.avatarLabelText} numberOfLines={1}>
                  {avatarPath.avatarName}
                </Text>
              </View>
            )}
            
            {/* Destination label with ETA */}
            {showDestinationMarker && (
              <View
                style={[
                  styles.destinationLabel,
                  {
                    left: avatarPath.destination.x - 50,
                    top: avatarPath.destination.y + 18,
                    borderColor: color,
                  },
                ]}
              >
                <Text style={[styles.destinationName, { color }]} numberOfLines={1}>
                  📍 {avatarPath.destinationName}
                </Text>
                {showETA && avatarPath.eta > 0 && (
                  <Text style={styles.etaText}>
                    ETA: {formatETA(avatarPath.eta)}
                  </Text>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ============================================================================
// HOOK FOR PATH MANAGEMENT
// ============================================================================

export function usePathVisualization() {
  const [paths, setPaths] = useState<AvatarPath[]>([]);
  
  const addPath = (path: AvatarPath) => {
    setPaths(prev => [...prev.filter(p => p.id !== path.id), path]);
  };
  
  const removePath = (pathId: string) => {
    setPaths(prev => prev.filter(p => p.id !== pathId));
  };
  
  const updatePathProgress = (pathId: string, progress: number, eta: number) => {
    setPaths(prev => prev.map(p => 
      p.id === pathId ? { ...p, progress, eta } : p
    ));
  };
  
  const updatePathPosition = (pathId: string, currentPosition: PathPoint) => {
    setPaths(prev => prev.map(p => 
      p.id === pathId ? { ...p, currentPosition } : p
    ));
  };
  
  const setPathActive = (pathId: string, isActive: boolean) => {
    setPaths(prev => prev.map(p => 
      p.id === pathId ? { ...p, isActive } : p
    ));
  };
  
  const clearAllPaths = () => {
    setPaths([]);
  };
  
  return {
    paths,
    addPath,
    removePath,
    updatePathProgress,
    updatePathPosition,
    setPathActive,
    clearAllPaths,
  };
}

// ============================================================================
// DEMO PATHS FOR TESTING
// ============================================================================

export const DEMO_PATHS: AvatarPath[] = [
  {
    id: 'path-1',
    avatarId: 'avatar-1',
    avatarName: 'Dr. Sarah',
    avatarIcon: '👩‍⚕️',
    avatarType: 'staff',
    path: [
      { x: 50, y: 100 },
      { x: 100, y: 120 },
      { x: 150, y: 100 },
      { x: 200, y: 150 },
      { x: 250, y: 180 },
    ],
    currentPosition: { x: 50, y: 100 },
    destination: { x: 250, y: 180 },
    destinationName: 'Emergency Dept',
    progress: 0.3,
    eta: 45,
    isActive: true,
    color: '#3B82F6',
  },
  {
    id: 'path-2',
    avatarId: 'avatar-2',
    avatarName: 'Nurse Mike',
    avatarIcon: '👨‍⚕️',
    avatarType: 'staff',
    path: [
      { x: 300, y: 50 },
      { x: 280, y: 100 },
      { x: 250, y: 150 },
      { x: 200, y: 200 },
    ],
    currentPosition: { x: 300, y: 50 },
    destination: { x: 200, y: 200 },
    destinationName: 'Maternity Ward',
    progress: 0.5,
    eta: 30,
    isActive: true,
    color: '#10B981',
  },
];

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  avatarLabel: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: 100,
  },
  avatarLabelIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  avatarLabelText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  destinationLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  destinationName: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  etaText: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default PathVisualization;
