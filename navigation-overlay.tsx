/**
 * Navigation Overlay Component
 * 
 * Displays turn-by-turn navigation instructions and route information
 * during active wayfinding navigation.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { wayfindingService, Route, NavigationStep, WayfindingState } from '@/lib/services/wayfinding.service';

// ============================================================================
// TYPES
// ============================================================================

interface NavigationOverlayProps {
  route: Route;
  onClose: () => void;
  onArrived?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function NavigationOverlay({
  route,
  onClose,
  onArrived,
}: NavigationOverlayProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));
  const [progressAnim] = useState(new Animated.Value(0));

  const currentStep = route.steps[currentStepIndex];
  const isLastStep = currentStepIndex === route.steps.length - 1;
  const progress = (currentStepIndex + 1) / route.steps.length;

  // Animate on mount
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [slideAnim]);

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  // Handle next step
  const handleNextStep = useCallback(() => {
    if (currentStepIndex < route.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      wayfindingService.nextStep();
    } else {
      // Arrived at destination
      onArrived?.();
    }
  }, [currentStepIndex, route.steps.length, onArrived]);

  // Handle previous step
  const handlePreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      wayfindingService.previousStep();
    }
  }, [currentStepIndex]);

  // Handle close navigation
  const handleClose = useCallback(() => {
    wayfindingService.stopNavigation();
    onClose();
  }, [onClose]);

  // Get direction color
  const getDirectionColor = (direction: NavigationStep['direction']): string => {
    switch (direction) {
      case 'left': return '#3B82F6';
      case 'right': return '#10B981';
      case 'straight': return '#6B7280';
      case 'arrive': return '#22C55E';
      default: return '#6B7280';
    }
  };

  // Get large direction icon
  const getLargeDirectionIcon = (direction: NavigationStep['direction']): string => {
    switch (direction) {
      case 'straight': return '⬆️';
      case 'left': return '↩️';
      case 'right': return '↪️';
      case 'up': return '⬆️';
      case 'down': return '⬇️';
      case 'arrive': return '🎯';
      default: return '➡️';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [200, 0],
              }),
            },
          ],
        },
      ]}
    >
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.destinationIcon}>{route.destination.icon}</Text>
          <View>
            <Text style={styles.destinationName}>{route.destination.name}</Text>
            <Text style={styles.routeInfo}>
              {wayfindingService.formatDistance(route.totalDistance)} • {wayfindingService.formatTime(route.estimatedTime)}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Current Step */}
      <View style={styles.currentStep}>
        <View
          style={[
            styles.directionIconContainer,
            { backgroundColor: getDirectionColor(currentStep.direction) + '20' },
          ]}
        >
          <Text style={styles.directionIcon}>
            {getLargeDirectionIcon(currentStep.direction)}
          </Text>
        </View>
        
        <View style={styles.stepInfo}>
          <Text style={styles.stepInstruction}>{currentStep.instruction}</Text>
          {currentStep.landmark && (
            <Text style={styles.stepLandmark}>📍 {currentStep.landmark}</Text>
          )}
          {currentStep.distance > 0 && (
            <Text style={styles.stepDistance}>
              {wayfindingService.formatDistance(currentStep.distance)}
            </Text>
          )}
        </View>
      </View>

      {/* Step Navigation */}
      <View style={styles.stepNavigation}>
        <TouchableOpacity
          style={[styles.navButton, currentStepIndex === 0 && styles.navButtonDisabled]}
          onPress={handlePreviousStep}
          disabled={currentStepIndex === 0}
        >
          <Text style={styles.navButtonIcon}>←</Text>
          <Text style={styles.navButtonText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.stepCounter}>
          <Text style={styles.stepCounterText}>
            Step {currentStepIndex + 1} of {route.steps.length}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.navButton,
            styles.navButtonPrimary,
            isLastStep && styles.navButtonSuccess,
          ]}
          onPress={handleNextStep}
        >
          <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
            {isLastStep ? 'Arrived!' : 'Next'}
          </Text>
          <Text style={styles.navButtonIcon}>{isLastStep ? '🎉' : '→'}</Text>
        </TouchableOpacity>
      </View>

      {/* Expandable Step List */}
      <TouchableOpacity
        style={styles.expandButton}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.expandButtonText}>
          {isExpanded ? 'Hide all steps' : 'Show all steps'}
        </Text>
        <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.allSteps}>
          {route.steps.map((step, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.stepItem,
                index === currentStepIndex && styles.stepItemActive,
                index < currentStepIndex && styles.stepItemCompleted,
              ]}
              onPress={() => setCurrentStepIndex(index)}
            >
              <View
                style={[
                  styles.stepItemIcon,
                  { backgroundColor: getDirectionColor(step.direction) + '20' },
                ]}
              >
                <Text style={styles.stepItemIconText}>{step.icon}</Text>
              </View>
              <View style={styles.stepItemInfo}>
                <Text
                  style={[
                    styles.stepItemInstruction,
                    index < currentStepIndex && styles.stepItemInstructionCompleted,
                  ]}
                >
                  {step.instruction}
                </Text>
                {step.distance > 0 && (
                  <Text style={styles.stepItemDistance}>
                    {wayfindingService.formatDistance(step.distance)}
                  </Text>
                )}
              </View>
              {index < currentStepIndex && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    maxHeight: '60%',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  destinationIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  destinationName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  routeInfo: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  currentStep: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  directionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  directionIcon: {
    fontSize: 32,
  },
  stepInfo: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 24,
  },
  stepLandmark: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  stepDistance: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    marginTop: 4,
  },
  stepNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonPrimary: {
    backgroundColor: '#3B82F6',
  },
  navButtonSuccess: {
    backgroundColor: '#22C55E',
  },
  navButtonIcon: {
    fontSize: 16,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  navButtonTextPrimary: {
    color: '#FFFFFF',
  },
  stepCounter: {
    flex: 1,
    alignItems: 'center',
  },
  stepCounterText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 6,
  },
  expandButtonText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  expandIcon: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  allSteps: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    maxHeight: 200,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  stepItemActive: {
    backgroundColor: '#EBF5FF',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  stepItemCompleted: {
    opacity: 0.6,
  },
  stepItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepItemIconText: {
    fontSize: 16,
  },
  stepItemInfo: {
    flex: 1,
  },
  stepItemInstruction: {
    fontSize: 14,
    color: '#374151',
  },
  stepItemInstructionCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  stepItemDistance: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  checkmark: {
    fontSize: 16,
    color: '#22C55E',
    fontWeight: '700',
  },
});

export default NavigationOverlay;
