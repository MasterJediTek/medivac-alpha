 * Map Gesture Handler Component
 * 
 * Provides touch gesture recognition for the hospital map using
 * react-native-gesture-handler for pinch-to-zoom and pan gestures.
 */

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

// ============================================================================
// TYPES
// ============================================================================

export interface GestureState {
  scale: number;
  translateX: number;
  translateY: number;
  rotation: number;
  isGesturing: boolean;
  gestureType: 'pinch' | 'pan' | 'tap' | 'doubleTap' | null;
}

export interface GestureConfig {