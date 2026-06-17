/**
 * TV Terminal Component
 * 
 * Interactive TV screens placed around the hospital campus
 * displaying JediTek Radio YouTube live stream
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { youtubeStreamService, YouTubeStream } from '@/lib/services/youtube-stream.service';

// ============================================================================
// TYPES
// ============================================================================

export interface TVTerminalProps {
  id: string;
  position: { x: number; y: number };
  size?: 'small' | 'medium' | 'large';
  orientation?: 'landscape' | 'portrait';
  isOn?: boolean;
  onPress?: (id: string) => void;
  mapZoom?: number;
}

interface TVSize {
  width: number;
  height: number;
  screenPadding: number;
  fontSize: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TV_SIZES: Record<string, TVSize> = {
  small: { width: 30, height: 22, screenPadding: 3, fontSize: 6 },
  medium: { width: 45, height: 32, screenPadding: 4, fontSize: 8 },
  large: { width: 60, height: 42, screenPadding: 5, fontSize: 10 },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function TVTerminal({
  id,
  position,
  size = 'medium',
  orientation = 'landscape',
  isOn = true,
  onPress,
  mapZoom = 1,
}: TVTerminalProps) {
  const colors = useColors();
  const [currentStream, setCurrentStream] = useState<YouTubeStream | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showStatic, setShowStatic] = useState(false);
  
  // Animations
  const glowAnim = useRef(new Animated.Value(0)).current;
  const staticAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const tvSize = TV_SIZES[size];
  const scaledWidth = tvSize.width * mapZoom;
  const scaledHeight = tvSize.height * mapZoom;
  
  // Swap dimensions for portrait orientation
  const finalWidth = orientation === 'portrait' ? scaledHeight : scaledWidth;
  const finalHeight = orientation === 'portrait' ? scaledWidth : scaledHeight;
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  useEffect(() => {
    // Subscribe to stream service
    const unsubscribe = youtubeStreamService.addListener({
      onStreamChange: (stream) => {
        setShowStatic(true);
        setTimeout(() => {
          setCurrentStream(stream);
          setShowStatic(false);
        }, 500);
      },
      onPlayStateChange: (playing) => {
        setIsPlaying(playing);
      },
    });
    
    // Initialize with current state
    const state = youtubeStreamService.getState();
    setCurrentStream(state.currentStream);
    setIsPlaying(state.isPlaying);
    
    return () => unsubscribe();
  }, []);
  
  // Glow animation when TV is on
  useEffect(() => {
    if (isOn && isPlaying) {
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      glow.start();
      return () => glow.stop();
    }
  }, [isOn, isPlaying]);
  
  // Static noise animation
  useEffect(() => {
    if (showStatic) {
      const staticNoise = Animated.loop(
        Animated.sequence([
          Animated.timing(staticAnim, {
            toValue: 1,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(staticAnim, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ])
      );
      staticNoise.start();
      return () => staticNoise.stop();
    }
  }, [showStatic]);
  
  // Pulse animation for interaction hint
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handlePress = () => {
    onPress?.(id);
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });
  
  const staticOpacity = staticAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: `${position.x}%`,
          top: `${position.y}%`,
          width: finalWidth,
          height: finalHeight,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.touchable}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {/* TV Frame */}
        <View style={[styles.tvFrame, { backgroundColor: '#1a1a1a' }]}>
          {/* TV Glow Effect */}
          {isOn && isPlaying && (
            <Animated.View
              style={[
                styles.tvGlow,
                {
                  opacity: glowOpacity,
                  backgroundColor: '#00BFFF',
                  shadowColor: '#00BFFF',
                },
              ]}
            />
          )}
          
          {/* TV Screen */}
          <View
            style={[
              styles.tvScreen,
              {
                backgroundColor: isOn ? '#000' : '#333',
                padding: tvSize.screenPadding * mapZoom,
              },
            ]}
          >
            {isOn ? (
              showStatic ? (
                // Static noise effect
                <Animated.View
                  style={[
                    styles.staticNoise,
                    { opacity: staticOpacity },
                  ]}
                >
                  <Text style={styles.staticText}>▓░▒▓░▒</Text>
                </Animated.View>
              ) : currentStream ? (
                // Video thumbnail preview
                <View style={styles.videoPreview}>
                  {/* Thumbnail background */}
                  <View style={[styles.thumbnailBg, { backgroundColor: '#1a1a2e' }]}>
                    {/* Animated bars to simulate video */}
                    <View style={styles.videoSimulation}>
                      <Animated.View
                        style={[
                          styles.videoBar,
                          {
                            backgroundColor: '#00BFFF',
                            height: '60%',
                            opacity: glowAnim,
                          },
                        ]}
                      />
                      <Animated.View
                        style={[
                          styles.videoBar,
                          {
                            backgroundColor: '#FF6B6B',
                            height: '80%',
                            opacity: glowOpacity,
                          },
                        ]}
                      />
                      <Animated.View
                        style={[
                          styles.videoBar,
                          {
                            backgroundColor: '#4ECDC4',
                            height: '40%',
                            opacity: glowAnim,
                          },
                        ]}
                      />
                      <Animated.View
                        style={[
                          styles.videoBar,
                          {
                            backgroundColor: '#FFE66D',
                            height: '70%',
                            opacity: glowOpacity,
                          },
                        ]}
                      />
                    </View>
                    
                    {/* JediTek Radio Logo */}
                    <View style={styles.logoOverlay}>
                      <Text style={[styles.logoText, { fontSize: tvSize.fontSize * mapZoom }]}>
                        📻 JediTek
                      </Text>
                    </View>
                  </View>
                  
                  {/* Live indicator */}
                  {currentStream.isLive && (
                    <View style={styles.liveIndicator}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                  )}
                </View>
              ) : (
                // No signal
                <View style={styles.noSignal}>
                  <Text style={[styles.noSignalText, { fontSize: tvSize.fontSize * mapZoom }]}>
                    NO SIGNAL
                  </Text>
                </View>
              )
            ) : (
              // TV is off
              <View style={styles.tvOff}>
                <Text style={[styles.tvOffText, { fontSize: tvSize.fontSize * mapZoom }]}>
                  ⏻
                </Text>
              </View>
            )}
          </View>
          
          {/* TV Stand */}
          <View style={[styles.tvStand, { width: finalWidth * 0.4 }]} />
        </View>
        
        {/* Tap hint */}
        <View style={styles.tapHint}>
          <Text style={[styles.tapHintText, { fontSize: Math.max(6, tvSize.fontSize * mapZoom * 0.8) }]}>
            👆 TAP
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 20,
  },
  touchable: {
    flex: 1,
  },
  tvFrame: {
    flex: 1,
    borderRadius: 4,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  tvGlow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  tvScreen: {
    flex: 1,
    borderRadius: 2,
    overflow: 'hidden',
  },
  staticNoise: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#888',
  },
  staticText: {
    color: '#fff',
    fontSize: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  videoPreview: {
    flex: 1,
    position: 'relative',
  },
  thumbnailBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  videoSimulation: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '100%',
    width: '100%',
    justifyContent: 'space-around',
    paddingHorizontal: 2,
    paddingBottom: 2,
  },
  videoBar: {
    width: 3,
    borderRadius: 1,
  },
  logoOverlay: {
    position: 'absolute',
    top: 2,
    left: 2,
  },
  logoText: {
    color: '#00BFFF',
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  liveIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
    marginRight: 2,
  },
  liveText: {
    color: '#fff',
    fontSize: 5,
    fontWeight: 'bold',
  },
  noSignal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
  },
  noSignalText: {
    color: '#666',
    fontWeight: 'bold',
  },
  tvOff: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tvOffText: {
    color: '#444',
  },
  tvStand: {
    height: 4,
    backgroundColor: '#333',
    alignSelf: 'center',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    marginTop: 1,
  },
  tapHint: {
    position: 'absolute',
    bottom: -12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tapHintText: {
    color: '#00BFFF',
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default TVTerminal;
