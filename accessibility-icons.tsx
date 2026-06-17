 * Accessibility Icons Component
 * Shows elevator, ramp, and accessible restroom icons on the hospital map
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/use-colors';

export interface AccessibilityFeature {
  id: string;
  type: 'elevator' | 'ramp' | 'restroom' | 'parking' | 'entrance' | 'seating';
  name: string;
  location: string;
  position: { x: number; y: number };
  floor?: number;
  isOperational: boolean;
  notes?: string;
}

interface AccessibilityIconsProps {
  features: AccessibilityFeature[];
  scale: number;
  offset: { x: number; y: number };
  onFeaturePress?: (feature: AccessibilityFeature) => void;
  showLabels?: boolean;
  filterTypes?: AccessibilityFeature['type'][];
}

// Hospital accessibility features
export const HOSPITAL_ACCESSIBILITY_FEATURES: AccessibilityFeature[] = [
  // Elevators
  {
    id: 'elev-001',
    type: 'elevator',
    name: 'Main Elevator A',
    location: 'Main Building - Central',
    position: { x: 190, y: 240 },
    floor: 0,
    isOperational: true,
    notes: 'Serves all floors, wheelchair accessible'
  },
  {
    id: 'elev-002',
    type: 'elevator',
    name: 'Main Elevator B',
    location: 'Main Building - East Wing',
    position: { x: 240, y: 260 },
    floor: 0,
    isOperational: true,