 * Floor Plan Component
 * 
 * Renders detailed interior layouts of hospital departments
 * when zoomed to room level, with interactive room elements.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import Svg, { Rect, Path, Circle, G, Text as SvgText, Line, Polygon } from 'react-native-svg';

// ============================================================================
// TYPES
// ============================================================================

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  icon: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  capacity?: number;
  equipment?: string[];
  status: 'available' | 'occupied' | 'maintenance' | 'emergency';
  occupant?: string;
  description?: string;
}

export type RoomType = 
  | 'patient_room'
  | 'operating_room'
  | 'consultation'
  | 'nurses_station'
  | 'waiting_area'
  | 'storage'
  | 'bathroom'
  | 'utility'
  | 'office'
  | 'lab'
  | 'imaging'
  | 'pharmacy'
  | 'reception'
  | 'corridor'
  | 'elevator'
  | 'stairs'
  | 'emergency_exit';

export interface FloorPlan {
  id: string;
  buildingId: string;
  buildingName: string;
  floor: number;
  floorName: string;
  width: number;
  height: number;
  rooms: Room[];
  corridors: Corridor[];
  doors: Door[];
  features: Feature[];
}

export interface Corridor {
  id: string;
  path: { x: number; y: number }[];
  width: number;
}

export interface Door {
  id: string;
  position: { x: number; y: number };