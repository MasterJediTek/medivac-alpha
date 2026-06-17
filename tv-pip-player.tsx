/**
 * TV Picture-in-Picture Player Component
 * 
 * Floating mini TV player for map navigation:
 * - Drag-to-move functionality
 * - Resize controls
 * - Minimize/maximize toggle
 * - YouTube video playback
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import { useColors } from '@/hooks/use-colors';

// ============================================================================
// TYPES
// ============================================================================

export interface TVPiPPlayerProps {
  visible: boolean;
  videoId: string;
  channelName: string;
  channelLogo: string;
  onClose: () => void;
  onMaximize: () => void;
}

type PiPSize = 'small' | 'medium' | 'large';

interface PiPDimensions {
  width: number;
  height: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PIP_SIZES: Record<PiPSize, PiPDimensions> = {
  small: { width: 160, height: 90 },
  medium: { width: 240, height: 135 },
  large: { width: 320, height: 180 },
};

const SNAP_MARGIN = 16;
const HEADER_HEIGHT = 30;

// ============================================================================
// COMPONENT
// ============================================================================

export function TVPiPPlayer({
  visible,
  videoId,
  channelName,
  channelLogo,
  onClose,
  onMaximize,
}: TVPiPPlayerProps) {
  const colors = useColors();
  
  // State
  const [size, setSize] = useState<PiPSize>('medium');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  
  // Animations
  const position = useRef(new Animated.ValueXY({ 
    x: SCREEN_WIDTH - PIP_SIZES.medium.width - SNAP_MARGIN,
    y: SCREEN_HEIGHT - PIP_SIZES.medium.height - 200,
  })).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  // Current dimensions
  const dimensions = PIP_SIZES[size];
  
  // ============================================================================
  // PAN RESPONDER (Drag functionality)
  // ============================================================================
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Store current position
        position.setOffset({
          x: (position.x as any)._value,
          y: (position.y as any)._value,
        });
        position.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: position.x, dy: position.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gesture) => {
        position.flattenOffset();
        
        // Snap to edges
        let finalX = (position.x as any)._value;
        let finalY = (position.y as any)._value;
        
        // Snap to left or right edge
        if (finalX < SCREEN_WIDTH / 2 - dimensions.width / 2) {
          finalX = SNAP_MARGIN;
        } else {
          finalX = SCREEN_WIDTH - dimensions.width - SNAP_MARGIN;
        }
        
        // Keep within screen bounds
        finalY = Math.max(SNAP_MARGIN + 100, Math.min(finalY, SCREEN_HEIGHT - dimensions.height - 100));
        
        Animated.spring(position, {
          toValue: { x: finalX, y: finalY },
          useNativeDriver: false,
          tension: 40,
          friction: 8,
        }).start();
      },
    })
  ).current;
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);
  
  // Update position when size changes
  useEffect(() => {
    const newDimensions = PIP_SIZES[size];
    const currentX = (position.x as any)._value;
    
    // Adjust position to keep within bounds
    if (currentX + newDimensions.width > SCREEN_WIDTH - SNAP_MARGIN) {
      Animated.timing(position.x, {
        toValue: SCREEN_WIDTH - newDimensions.width - SNAP_MARGIN,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [size]);
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleSizeChange = () => {
    const sizes: PiPSize[] = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(size);
    const nextIndex = (currentIndex + 1) % sizes.length;
    setSize(sizes[nextIndex]);
  };
  
  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };
  
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  if (!visible) return null;
  
  const minimizedHeight = HEADER_HEIGHT + 10;
  const currentHeight = isMinimized ? minimizedHeight : dimensions.height + HEADER_HEIGHT;
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: dimensions.width,
          height: currentHeight,
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { scale: scaleAnim },
          ],
          opacity: opacityAnim,
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Header / Drag Handle */}
      <View style={[styles.header, { backgroundColor: '#1a1a1a' }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.channelLogo}>{channelLogo}</Text>
          <Text style={styles.channelName} numberOfLines={1}>
            {channelName}
          </Text>
        </View>
        <View style={styles.headerControls}>
          <TouchableOpacity onPress={handleMinimize} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>
              {isMinimized ? '▢' : '▁'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onMaximize} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>⤢</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Video Content */}
      {!isMinimized && (
        <View style={[styles.videoContainer, { height: dimensions.height }]}>
          {/* YouTube Embed (Web) */}
          {Platform.OS === 'web' ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&controls=0&modestbranding=1&rel=0`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            // Placeholder for native
            <View style={styles.nativePlaceholder}>
              <Text style={styles.placeholderIcon}>📺</Text>
              <Text style={styles.placeholderText}>JediTek Radio</Text>
              <Text style={styles.placeholderSubtext}>Live Stream</Text>
            </View>
          )}
          
          {/* Overlay Controls */}
          <View style={styles.overlayControls}>
            <TouchableOpacity 
              style={styles.overlayButton}
              onPress={handlePlayPause}
            >
              <Text style={styles.overlayButtonText}>
                {isPlaying ? '⏸' : '▶️'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.overlayButton}
              onPress={handleMuteToggle}
            >
              <Text style={styles.overlayButtonText}>
                {isMuted ? '🔇' : '🔊'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Live Indicator */}
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
      )}
      
      {/* Bottom Controls */}
      {!isMinimized && (
        <View style={[styles.bottomControls, { backgroundColor: '#1a1a1a' }]}>
          <TouchableOpacity 
            style={styles.sizeButton}
            onPress={handleSizeChange}
          >
            <Text style={styles.sizeButtonText}>
              {size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L'}
            </Text>
          </TouchableOpacity>
          <View style={styles.dragHint}>
            <Text style={styles.dragHintText}>⋮⋮ Drag to move</Text>
          </View>
        </View>
      )}
      
      {/* Glow Effect */}
      <View style={[styles.glowEffect, { shadowColor: '#00BFFF' }]} />
    </Animated.View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 15,
    zIndex: 1000,
  },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  channelLogo: {
    fontSize: 14,
    marginRight: 6,
  },
  channelName: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    flex: 1,
  },
  headerControls: {
    flexDirection: 'row',
    gap: 4,
  },
  headerButton: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 10,
    color: '#fff',
  },
  videoContainer: {
    width: '100%',
    backgroundColor: '#000',
    position: 'relative',
  },
  nativePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  placeholderIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#00BFFF',
    fontWeight: 'bold',
  },
  placeholderSubtext: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
  },
  overlayControls: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    gap: 6,
  },
  overlayButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayButtonText: {
    fontSize: 12,
  },
  liveIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220,38,38,0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: 4,
  },
  liveText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: 'bold',
  },
  bottomControls: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  sizeButton: {
    width: 20,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#00BFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeButtonText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: 'bold',
  },
  dragHint: {
    flex: 1,
    alignItems: 'center',
  },
  dragHintText: {
    fontSize: 9,
    color: '#666',
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 0,
    pointerEvents: 'none',
  },
});

export default TVPiPPlayer;
