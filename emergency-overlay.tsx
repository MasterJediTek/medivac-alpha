/**
 * Emergency Broadcast Overlay Component
 * 
 * Full-screen emergency alert overlay:
 * - Animated alert banner
 * - Emergency message display
 * - Instructions list
 * - Pulsing visual effects
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { EmergencyBroadcast, emergencyBroadcastService } from '@/lib/services/emergency-broadcast.service';

// ============================================================================
// TYPES
// ============================================================================

export interface EmergencyOverlayProps {
  broadcast: EmergencyBroadcast;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EmergencyOverlay({ broadcast }: EmergencyOverlayProps) {
  const { width: screenWidth } = Dimensions.get('window');
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const scrollAnim = useRef(new Animated.Value(0)).current;
  
  // Get level color
  const levelColor = emergencyBroadcastService.getLevelColor(broadcast.level);
  const levelIcon = emergencyBroadcastService.getLevelIcon(broadcast.level);
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  useEffect(() => {
    // Slide in animation
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
    
    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    
    // Flash animation for critical/evacuation
    if (broadcast.level === 'critical' || broadcast.level === 'evacuation') {
      const flash = Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(flashAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
      flash.start();
      
      return () => {
        pulse.stop();
        flash.stop();
      };
    }
    
    // Scrolling text animation
    const scroll = Animated.loop(
      Animated.sequence([
        Animated.timing(scrollAnim, {
          toValue: -screenWidth,
          duration: 15000,
          useNativeDriver: true,
        }),
        Animated.timing(scrollAnim, {
          toValue: screenWidth,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    scroll.start();
    
    return () => {
      pulse.stop();
      scroll.stop();
    };
  }, [broadcast.level]);
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <View style={styles.container}>
      {/* Flash Overlay */}
      <Animated.View
        style={[
          styles.flashOverlay,
          {
            backgroundColor: levelColor,
            opacity: flashAnim,
          },
        ]}
        pointerEvents="none"
      />
      
      {/* Main Alert Banner */}
      <Animated.View
        style={[
          styles.alertBanner,
          {
            backgroundColor: levelColor,
            transform: [
              { translateY: slideAnim },
              { scale: pulseAnim },
            ],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.alertHeader}>
          <Text style={styles.alertIcon}>{levelIcon}</Text>
          <Text style={styles.alertTitle}>{broadcast.title}</Text>
          <Text style={styles.alertIcon}>{levelIcon}</Text>
        </View>
        
        {/* Scrolling Ticker */}
        <View style={styles.tickerContainer}>
          <Animated.View
            style={[
              styles.tickerContent,
              { transform: [{ translateX: scrollAnim }] },
            ]}
          >
            <Text style={styles.tickerText}>
              {broadcast.message} • {broadcast.message} • {broadcast.message}
            </Text>
          </Animated.View>
        </View>
        
        {/* Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>{broadcast.message}</Text>
        </View>
        
        {/* Instructions */}
        {broadcast.instructions.length > 0 && (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>INSTRUCTIONS:</Text>
            <ScrollView style={styles.instructionsList} horizontal={false}>
              {broadcast.instructions.map((instruction, index) => (
                <View key={index} style={styles.instructionItem}>
                  <Text style={styles.instructionNumber}>{index + 1}.</Text>
                  <Text style={styles.instructionText}>{instruction}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* Footer Info */}
        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>
            Activated by: {broadcast.activatedBy}
          </Text>
          <Text style={styles.footerText}>
            Time: {broadcast.activatedAt.toLocaleTimeString()}
          </Text>
          {broadcast.affectedAreas.length > 0 && (
            <Text style={styles.footerText}>
              Areas: {broadcast.affectedAreas.join(', ')}
            </Text>
          )}
        </View>
      </Animated.View>
      
      {/* Side Stripes */}
      <View style={[styles.sideStripe, styles.leftStripe, { backgroundColor: levelColor }]} />
      <View style={[styles.sideStripe, styles.rightStripe, { backgroundColor: levelColor }]} />
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: Dimensions.get('window').height,
  },
  alertBanner: {
    marginHorizontal: 8,
    marginTop: 50,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 20,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  alertIcon: {
    fontSize: 24,
    marginHorizontal: 8,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  tickerContainer: {
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.3)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  tickerContent: {
    flexDirection: 'row',
  },
  tickerText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  messageContainer: {
    padding: 16,
  },
  messageText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
  },
  instructionsContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 12,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  instructionsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    opacity: 0.9,
  },
  instructionsList: {
    maxHeight: 120,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  instructionNumber: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
    width: 20,
  },
  instructionText: {
    fontSize: 12,
    color: '#fff',
    flex: 1,
    lineHeight: 18,
  },
  footerInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  footerText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  sideStripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4,
    height: Dimensions.get('window').height,
  },
  leftStripe: {
    left: 0,
  },
  rightStripe: {
    right: 0,
  },
});

export default EmergencyOverlay;
