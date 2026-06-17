/**
 * TV Remote Control Component
 * 
 * Floating global remote control for hospital TV system:
 * - Channel up/down navigation
 * - Volume control slider
 * - Mute toggle
 * - Channel guide display
 * - Schedule preview
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { jediTekChannelService, JEDITEK_CHANNELS, JediTekChannel } from '@/lib/services/jeditek-channel.service';
import { tvScheduleService, ScheduleSlot, TV_SCHEDULE } from '@/lib/services/tv-schedule.service';
import { youtubeStreamService } from '@/lib/services/youtube-stream.service';

// ============================================================================
// TYPES
// ============================================================================

export interface TVRemoteControlProps {
  visible: boolean;
  onClose: () => void;
  onChannelChange?: (channel: JediTekChannel) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TVRemoteControl({ visible, onClose, onChannelChange }: TVRemoteControlProps) {
  const colors = useColors();
  const { width: screenWidth } = Dimensions.get('window');
  
  // State
  const [currentChannel, setCurrentChannel] = useState(jediTekChannelService.getCurrentChannel());
  const [currentSchedule, setCurrentSchedule] = useState(tvScheduleService.getCurrentSlot());
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [showChannelGuide, setShowChannelGuide] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Animations
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Start glow animation
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      glow.start();
      
      return () => glow.stop();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);
  
  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);
  
  useEffect(() => {
    // Subscribe to channel changes
    const unsubChannel = jediTekChannelService.addListener((channel) => {
      setCurrentChannel(channel);
      onChannelChange?.(channel);
    });
    
    // Subscribe to schedule changes
    const unsubSchedule = tvScheduleService.addListener({
      onSlotChange: (slot) => setCurrentSchedule(slot),
    });
    
    // Subscribe to volume changes
    const unsubStream = youtubeStreamService.addListener({
      onVolumeChange: (vol) => setVolume(vol),
    });
    
    // Start schedule service
    tvScheduleService.start();
    tvScheduleService.addHospitalAnnouncements();
    
    return () => {
      unsubChannel();
      unsubSchedule();
      unsubStream();
    };
  }, []);
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleChannelUp = () => {
    jediTekChannelService.nextChannel();
    // Sync with YouTube stream
    const newChannel = jediTekChannelService.getCurrentChannel();
    youtubeStreamService.switchStream(newChannel.id);
  };
  
  const handleChannelDown = () => {
    jediTekChannelService.previousChannel();
    const newChannel = jediTekChannelService.getCurrentChannel();
    youtubeStreamService.switchStream(newChannel.id);
  };
  
  const handleSelectChannel = (channel: JediTekChannel) => {
    jediTekChannelService.switchChannel(channel.id);
    youtubeStreamService.switchStream(channel.id);
    setShowChannelGuide(false);
  };
  
  const handleVolumeUp = () => {
    const newVolume = Math.min(1, volume + 0.1);
    setVolume(newVolume);
    youtubeStreamService.setVolume(newVolume);
  };
  
  const handleVolumeDown = () => {
    const newVolume = Math.max(0, volume - 0.1);
    setVolume(newVolume);
    youtubeStreamService.setVolume(newVolume);
  };
  
  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    youtubeStreamService.toggleMute();
  };
  
  const handlePowerToggle = () => {
    youtubeStreamService.toggle();
  };
  
  // ============================================================================
  // RENDER HELPERS
  // ============================================================================
  
  const renderRemoteButton = (
    icon: string,
    onPress: () => void,
    size: 'small' | 'medium' | 'large' = 'medium',
    color?: string
  ) => {
    const sizeMap = { small: 36, medium: 44, large: 56 };
    const fontSize = { small: 16, medium: 20, large: 28 };
    
    return (
      <TouchableOpacity
        style={[
          styles.remoteButton,
          {
            width: sizeMap[size],
            height: sizeMap[size],
            backgroundColor: color || '#333',
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: fontSize[size] }}>{icon}</Text>
      </TouchableOpacity>
    );
  };
  
  const renderChannelGuide = () => (
    <View style={[styles.channelGuide, { backgroundColor: colors.surface }]}>
      <View style={styles.guideHeader}>
        <Text style={[styles.guideTitle, { color: colors.foreground }]}>
          📺 Channel Guide
        </Text>
        <TouchableOpacity onPress={() => setShowChannelGuide(false)}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.channelList}>
        {JEDITEK_CHANNELS.map((channel) => (
          <TouchableOpacity
            key={channel.id}
            style={[
              styles.channelItem,
              currentChannel.id === channel.id && styles.channelItemActive,
              { borderColor: channel.primaryColor },
            ]}
            onPress={() => handleSelectChannel(channel)}
          >
            <Text style={styles.channelLogo}>{channel.logo}</Text>
            <View style={styles.channelInfo}>
              <Text style={[styles.channelName, { color: colors.foreground }]}>
                {channel.name}
              </Text>
              <Text style={[styles.channelGenre, { color: colors.muted }]}>
                {channel.genre} • {channel.frequency}
              </Text>
            </View>
            {currentChannel.id === channel.id && (
              <View style={[styles.nowPlayingBadge, { backgroundColor: channel.primaryColor }]}>
                <Text style={styles.nowPlayingText}>NOW</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
  
  const renderScheduleView = () => (
    <View style={[styles.scheduleView, { backgroundColor: colors.surface }]}>
      <View style={styles.guideHeader}>
        <Text style={[styles.guideTitle, { color: colors.foreground }]}>
          📅 Today's Schedule
        </Text>
        <TouchableOpacity onPress={() => setShowSchedule(false)}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scheduleList}>
        {TV_SCHEDULE.map((slot) => {
          const isNow = slot.id === currentSchedule.id;
          return (
            <View
              key={slot.id}
              style={[
                styles.scheduleItem,
                isNow && styles.scheduleItemActive,
                { borderLeftColor: slot.color },
              ]}
            >
              <View style={styles.scheduleTime}>
                <Text style={[styles.scheduleTimeText, { color: colors.muted }]}>
                  {slot.startHour.toString().padStart(2, '0')}:00
                </Text>
                <Text style={[styles.scheduleTimeText, { color: colors.muted }]}>
                  {slot.endHour.toString().padStart(2, '0')}:00
                </Text>
              </View>
              <View style={styles.scheduleContent}>
                <View style={styles.scheduleHeader}>
                  <Text style={styles.scheduleIcon}>{slot.icon}</Text>
                  <Text style={[styles.scheduleName, { color: colors.foreground }]}>
                    {slot.name}
                  </Text>
                </View>
                <Text style={[styles.scheduleDesc, { color: colors.muted }]}>
                  {slot.description}
                </Text>
              </View>
              {isNow && (
                <View style={[styles.liveBadge, { backgroundColor: '#DC2626' }]}>
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
  
  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  
  if (!visible) return null;
  
  const expandedHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [280, 450],
  });
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      {/* Remote Body */}
      <Animated.View
        style={[
          styles.remoteBody,
          {
            backgroundColor: '#1a1a1a',
            height: expandedHeight,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.remoteHeader}>
          <Animated.View
            style={[
              styles.logoGlow,
              { opacity: glowAnim },
            ]}
          />
          <Text style={styles.remoteLogo}>📻</Text>
          <Text style={styles.remoteTitle}>JediTek</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        {/* Current Channel Display */}
        <View style={[styles.channelDisplay, { backgroundColor: '#0a0a0a' }]}>
          <Text style={styles.channelDisplayLogo}>{currentChannel.logo}</Text>
          <View style={styles.channelDisplayInfo}>
            <Text style={styles.channelDisplayName} numberOfLines={1}>
              {currentChannel.name}
            </Text>
            <Text style={styles.channelDisplayFreq}>
              {currentChannel.frequency}
            </Text>
          </View>
        </View>
        
        {/* Current Schedule */}
        <View style={[styles.scheduleDisplay, { backgroundColor: currentSchedule.color + '30' }]}>
          <Text style={styles.scheduleDisplayIcon}>{currentSchedule.icon}</Text>
          <Text style={styles.scheduleDisplayText} numberOfLines={1}>
            {currentSchedule.name}
          </Text>
        </View>
        
        {/* Main Controls */}
        <View style={styles.mainControls}>
          {/* Power Button */}
          <View style={styles.powerRow}>
            {renderRemoteButton('⏻', handlePowerToggle, 'medium', '#DC2626')}
          </View>
          
          {/* Channel Controls */}
          <View style={styles.channelControls}>
            <View style={styles.controlColumn}>
              <Text style={styles.controlLabel}>CH</Text>
              {renderRemoteButton('▲', handleChannelUp, 'small')}
              {renderRemoteButton('▼', handleChannelDown, 'small')}
            </View>
            
            {/* Center Button */}
            <TouchableOpacity
              style={styles.centerButton}
              onPress={() => setShowChannelGuide(!showChannelGuide)}
            >
              <Text style={styles.centerButtonText}>GUIDE</Text>
            </TouchableOpacity>
            
            {/* Volume Controls */}
            <View style={styles.controlColumn}>
              <Text style={styles.controlLabel}>VOL</Text>
              {renderRemoteButton('🔊', handleVolumeUp, 'small')}
              {renderRemoteButton('🔉', handleVolumeDown, 'small')}
            </View>
          </View>
          
          {/* Mute Button */}
          <View style={styles.muteRow}>
            {renderRemoteButton(
              isMuted ? '🔇' : '🔈',
              handleMuteToggle,
              'medium',
              isMuted ? '#DC2626' : '#333'
            )}
          </View>
        </View>
        
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: '#00BFFF20' }]}
            onPress={() => setShowSchedule(!showSchedule)}
          >
            <Text style={styles.quickButtonText}>📅 Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: '#8B5CF620' }]}
            onPress={() => setIsExpanded(!isExpanded)}
          >
            <Text style={styles.quickButtonText}>
              {isExpanded ? '▲ Less' : '▼ More'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Expanded Section */}
        {isExpanded && (
          <View style={styles.expandedSection}>
            {/* Number Pad */}
            <View style={styles.numberPad}>
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={styles.numberButton}
                  onPress={() => {
                    const channel = JEDITEK_CHANNELS[num - 1];
                    if (channel) handleSelectChannel(channel);
                  }}
                >
                  <Text style={styles.numberButtonText}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* DJ Info */}
            <View style={styles.djInfo}>
              <Text style={styles.djLabel}>Current DJ</Text>
              <Text style={styles.djName}>{currentChannel.djName}</Text>
            </View>
          </View>
        )}
      </Animated.View>
      
      {/* Channel Guide Overlay */}
      {showChannelGuide && renderChannelGuide()}
      
      {/* Schedule Overlay */}
      {showSchedule && renderScheduleView()}
    </Animated.View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 10,
    bottom: 100,
    zIndex: 1000,
  },
  remoteBody: {
    width: 160,
    borderRadius: 20,
    padding: 12,
    shadowColor: '#00BFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  remoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoGlow: {
    position: 'absolute',
    left: -5,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#00BFFF',
  },
  remoteLogo: {
    fontSize: 20,
    marginRight: 6,
  },
  remoteTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00BFFF',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  channelDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  channelDisplayLogo: {
    fontSize: 20,
    marginRight: 8,
  },
  channelDisplayInfo: {
    flex: 1,
  },
  channelDisplayName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  channelDisplayFreq: {
    fontSize: 9,
    color: '#888',
  },
  scheduleDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 6,
    marginBottom: 10,
  },
  scheduleDisplayIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  scheduleDisplayText: {
    flex: 1,
    fontSize: 10,
    color: '#fff',
  },
  mainControls: {
    alignItems: 'center',
  },
  powerRow: {
    marginBottom: 10,
  },
  channelControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  controlColumn: {
    alignItems: 'center',
    gap: 4,
  },
  controlLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  centerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00BFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButtonText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  muteRow: {
    marginBottom: 10,
  },
  remoteButton: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 6,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 10,
    color: '#fff',
  },
  expandedSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  numberPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 10,
  },
  numberButton: {
    width: 36,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  djInfo: {
    alignItems: 'center',
  },
  djLabel: {
    fontSize: 9,
    color: '#666',
  },
  djName: {
    fontSize: 11,
    color: '#00BFFF',
    fontWeight: '600',
  },
  
  // Channel Guide
  channelGuide: {
    position: 'absolute',
    right: 170,
    bottom: 0,
    width: 220,
    maxHeight: 350,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  guideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeText: {
    fontSize: 16,
    color: '#888',
  },
  channelList: {
    maxHeight: 280,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    borderLeftWidth: 3,
  },
  channelItemActive: {
    backgroundColor: '#00BFFF10',
  },
  channelLogo: {
    fontSize: 24,
    marginRight: 10,
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 12,
    fontWeight: '600',
  },
  channelGenre: {
    fontSize: 10,
    marginTop: 2,
  },
  nowPlayingBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nowPlayingText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#fff',
  },
  
  // Schedule View
  scheduleView: {
    position: 'absolute',
    right: 170,
    bottom: 0,
    width: 260,
    maxHeight: 400,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scheduleList: {
    maxHeight: 340,
  },
  scheduleItem: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    borderLeftWidth: 4,
  },
  scheduleItemActive: {
    backgroundColor: '#00BFFF10',
  },
  scheduleTime: {
    width: 45,
    marginRight: 10,
  },
  scheduleTimeText: {
    fontSize: 10,
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  scheduleIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  scheduleName: {
    fontSize: 12,
    fontWeight: '600',
  },
  scheduleDesc: {
    fontSize: 10,
  },
  liveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  liveText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default TVRemoteControl;
