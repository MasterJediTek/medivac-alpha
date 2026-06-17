 * Destination Picker Component
 * 
 * Allows users to search and select destinations for wayfinding navigation.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Animated,
} from 'react-native';
import { wayfindingService, Destination, DestinationCategory, Route } from '@/lib/services/wayfinding.service';

// ============================================================================
// TYPES
// ============================================================================

interface DestinationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectDestination: (route: Route) => void;
  currentPosition?: { x: number; y: number };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORY_INFO: Record<DestinationCategory, { label: string; icon: string; color: string }> = {
  emergency: { label: 'Emergency', icon: '🚨', color: '#EF4444' },
  department: { label: 'Departments', icon: '🏥', color: '#3B82F6' },
  service: { label: 'Services', icon: '📋', color: '#10B981' },
  facility: { label: 'Facilities', icon: '🏢', color: '#8B5CF6' },
  entrance: { label: 'Entrances', icon: '🚪', color: '#F59E0B' },
  parking: { label: 'Parking', icon: '🅿️', color: '#6B7280' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function DestinationPicker({
  visible,
  onClose,
  onSelectDestination,
  currentPosition,
}: DestinationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DestinationCategory | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Get all destinations
  const allDestinations = useMemo(() => wayfindingService.getDestinations(), []);
