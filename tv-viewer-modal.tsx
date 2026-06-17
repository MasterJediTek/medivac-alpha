/**
 * TV Viewer Modal Component
 * 
 * Full-screen modal for viewing JediTek Radio YouTube stream
 * when user taps on a TV terminal
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Modal,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { youtubeStreamService, YouTubeStream, JEDITEK_STREAMS } from '@/lib/services/youtube-stream.service';

// ============================================================================
// TYPES
// ============================================================================

export interface TVViewerModalProps {
  visible: boolean;
  tvId?: string;
  onClose: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TVViewerModal({ visible, tvId, onClose }: TVViewerModalProps) {
  const colors = useColors();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  const [currentStream, setCurrentStream] = useState<YouTubeStream | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [showChannelList, setShowChannelList] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Start playing
      youtubeStreamService.play();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);
  
  useEffect(() => {
    // Subscribe to stream service
    const unsubscribe = youtubeStreamService.addListener({
      onStreamChange: (stream) => setCurrentStream(stream),
      onPlayStateChange: (playing) => setIsPlaying(playing),
      onVolumeChange: (vol) => setVolume(vol),
    });
    
    // Initialize with current state
    const state = youtubeStreamService.getState();
    setCurrentStream(state.currentStream);
    setIsPlaying(state.isPlaying);
    setVolume(state.volume);
    setIsMuted(state.isMuted);
    
    return () => unsubscribe();
  }, []);
  
  // Glow animation
  useEffect(() => {
    if (visible && isPlaying) {
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      glow.start();
      return () => glow.stop();
    }
  }, [visible, isPlaying]);
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handlePlayPause = () => {
    youtubeStreamService.toggle();
  };
  
  const handleMute = () => {
    youtubeStreamService.toggleMute();
    setIsMuted(!isMuted);
  };
  
  const handleVolumeUp = () => {
    youtubeStreamService.setVolume(Math.min(1, volume + 0.1));
  };
  
  const handleVolumeDown = () => {
    youtubeStreamService.setVolume(Math.max(0, volume - 0.1));
  };
  
  const handleNextChannel = () => {
    youtubeStreamService.nextStream();
  };
  
  const handlePrevChannel = () => {
    youtubeStreamService.previousStream();
  };
  
  const handleSelectChannel = (streamId: string) => {
    youtubeStreamService.switchStream(streamId);
    setShowChannelList(false);
  };
  
  const handleClose = () => {
    onClose();
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });
  
  const embedUrl = youtubeStreamService.getEmbedUrl(true, isMuted);
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          { opacity: fadeAnim },
        ]}
      >
        <TouchableOpacity
          style={styles.backdrop}
          onPress={handleClose}
          activeOpacity={1}
        />
        
        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: '#0a0a0a',
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerIcon}>📺</Text>
              <View>
                <Text style={styles.headerTitle}>JediTek Radio TV</Text>
                <Text style={styles.headerSubtitle}>
                  {currentStream?.name || 'Loading...'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {/* Video Container */}
          <View style={styles.videoContainer}>
            {/* Glow Effect */}
            <Animated.View
              style={[
                styles.videoGlow,
                { opacity: glowOpacity },
              ]}
            />
            
            {/* Video Frame */}
            <View style={styles.videoFrame}>
              {Platform.OS === 'web' ? (
                // Web: Use iframe
                <iframe
                  src={embedUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    borderRadius: 8,
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                // Native: Show placeholder with info
                <View style={styles.nativeVideoPlaceholder}>
                  <Text style={styles.placeholderIcon}>📻</Text>
                  <Text style={styles.placeholderTitle}>
                    {currentStream?.name}
                  </Text>
                  <Text style={styles.placeholderSubtitle}>
                    {currentStream?.channelName}
                  </Text>
                  <Text style={styles.placeholderGenre}>
                    {currentStream?.genre}
                  </Text>
                  
                  {/* Animated visualizer bars */}
                  <View style={styles.visualizerContainer}>
                    {[...Array(12)].map((_, i) => (
                      <Animated.View
                        key={i}
                        style={[
                          styles.visualizerBar,
                          {
                            height: 20 + Math.random() * 40,
                            backgroundColor: `hsl(${200 + i * 15}, 80%, 50%)`,
                            opacity: glowAnim,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  
                  {currentStream?.isLive && (
                    <View style={styles.liveIndicator}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
          
          {/* Controls */}
          <View style={styles.controls}>
            {/* Playback Controls */}
            <View style={styles.controlRow}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={handlePrevChannel}
              >
                <Text style={styles.controlButtonText}>⏮️</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.controlButton, styles.playButton]}
                onPress={handlePlayPause}
              >
                <Text style={styles.playButtonText}>
                  {isPlaying ? '⏸️' : '▶️'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleNextChannel}
              >
                <Text style={styles.controlButtonText}>⏭️</Text>
              </TouchableOpacity>
            </View>
            
            {/* Volume Controls */}
            <View style={styles.controlRow}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleVolumeDown}
              >
                <Text style={styles.controlButtonText}>🔉</Text>
              </TouchableOpacity>
              
              <View style={styles.volumeBar}>
                <View
                  style={[
                    styles.volumeFill,
                    { width: `${volume * 100}%` },
                  ]}
                />
              </View>
              
              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleVolumeUp}
              >
                <Text style={styles.controlButtonText}>🔊</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.controlButton, isMuted && styles.mutedButton]}
                onPress={handleMute}
              >
                <Text style={styles.controlButtonText}>
                  {isMuted ? '🔇' : '🔈'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Channel List Toggle */}
            <TouchableOpacity
              style={styles.channelListToggle}
              onPress={() => setShowChannelList(!showChannelList)}
            >
              <Text style={styles.channelListToggleText}>
                📡 {showChannelList ? 'Hide Channels' : 'Show Channels'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Channel List */}
          {showChannelList && (
            <ScrollView style={styles.channelList}>
              {JEDITEK_STREAMS.map((stream) => (
                <TouchableOpacity
                  key={stream.id}
                  style={[
                    styles.channelItem,
                    currentStream?.id === stream.id && styles.channelItemActive,
                  ]}
                  onPress={() => handleSelectChannel(stream.id)}
                >
                  <View style={styles.channelInfo}>
                    <Text style={styles.channelName}>{stream.name}</Text>
                    <Text style={styles.channelGenre}>{stream.genre}</Text>
                  </View>
                  {stream.isLive && (
                    <View style={styles.channelLive}>
                      <Text style={styles.channelLiveText}>LIVE</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          
          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              📻 JediTek Radio • Broadcasting from the Goldfields
            </Text>
            <Text style={styles.footerSubtext}>
              Tap outside or press ✕ to close
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: '95%',
    maxWidth: 600,
    maxHeight: '90%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#00BFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00BFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#fff',
  },
  videoContainer: {
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  videoGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: '#00BFFF',
    shadowColor: '#00BFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  videoFrame: {
    flex: 1,
    margin: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
  },
  nativeVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00BFFF',
    textAlign: 'center',
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  placeholderGenre: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  visualizerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
    marginTop: 20,
    gap: 4,
  },
  visualizerBar: {
    width: 8,
    borderRadius: 4,
  },
  liveIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  controls: {
    padding: 16,
    backgroundColor: '#111',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 20,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00BFFF',
  },
  playButtonText: {
    fontSize: 28,
  },
  mutedButton: {
    backgroundColor: '#DC2626',
  },
  volumeBar: {
    flex: 1,
    maxWidth: 120,
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  volumeFill: {
    height: '100%',
    backgroundColor: '#00BFFF',
    borderRadius: 4,
  },
  channelListToggle: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#222',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  channelListToggleText: {
    color: '#00BFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  channelList: {
    maxHeight: 200,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  channelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  channelItemActive: {
    backgroundColor: '#00BFFF20',
    borderLeftWidth: 3,
    borderLeftColor: '#00BFFF',
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  channelGenre: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  channelLive: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  channelLiveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  footer: {
    padding: 12,
    backgroundColor: '#0a0a0a',
    borderTopWidth: 1,
    borderTopColor: '#222',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#00BFFF',
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
});

export default TVViewerModal;
