import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { avatarPathfindingService, HOSPITAL_NODES } from '@/lib/services/avatar-pathfinding.service';
import { vrModeService } from '@/lib/services/vr-mode.service';
import { youtubeStreamService, JEDITEK_STREAMS } from '@/lib/services/youtube-stream.service';
import { TVTerminal } from '@/components/tv-terminal';
import { TVViewerModal } from '@/components/tv-viewer-modal';
import { TVRemoteControl } from '@/components/tv-remote-control';
import { jediTekChannelService, JEDITEK_CHANNELS, JediTekChannel } from '@/lib/services/jeditek-channel.service';
import { tvScheduleService, TV_SCHEDULE, ScheduleSlot } from '@/lib/services/tv-schedule.service';
import { djVoiceoverService, Voiceover } from '@/lib/services/dj-voiceover.service';
import { emergencyBroadcastService, EmergencyBroadcast } from '@/lib/services/emergency-broadcast.service';
import { TVPiPPlayer } from '@/components/tv-pip-player';
import { EmergencyOverlay } from '@/components/emergency-overlay';
import { EmergencyControlPanel } from '@/components/emergency-control-panel';
import { AvatarDialog, DEMO_AVATARS, AvatarProfile } from '@/components/avatar-dialog';
import { youtubeChannelConfigService, YouTubeStreamConfig } from '@/lib/services/youtube-channel-config.service';
import { mapGestureService, MapViewport, ZoomLevel, ZOOM_PRESETS } from '@/lib/services/map-gesture.service';
import { MapGestureHandler, useMapGestures } from '@/components/map-gesture-handler';
import { PathVisualization, AvatarPath, usePathVisualization, DEMO_PATHS } from '@/components/path-visualization';
import { FloorPlanView, FLOOR_PLANS, Room } from '@/components/floor-plan';
import { avatarMovementService, MovingAvatar } from '@/lib/services/avatar-movement.service';
import { wayfindingService, Route, WayfindingState } from '@/lib/services/wayfinding.service';
import { DestinationPicker } from '@/components/destination-picker';
import { NavigationOverlay } from '@/components/navigation-overlay';
import { RouteHistoryPanel } from '@/components/route-history-panel';
import { AccessibilityIcons, AccessibilityLegend, ACCESSIBILITY_FEATURES, AccessibilityFeature } from '@/components/accessibility-icons';
import { routeHistoryService, SavedRoute } from '@/lib/services/route-history.service';

// ============================================================================
// TYPES
// ============================================================================

interface Building {
  id: string;
  name: string;
  type: string;
  icon: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
  services: string[];
  operatingHours: { weekday: string; weekend: string };
}

interface MapAvatar {
  id: string;
  name: string;
  type: 'patient' | 'staff' | 'visitor' | 'pet' | 'security';
  icon: string;
  position: { x: number; y: number };
  animation: string;
  isMoving?: boolean;
}

interface TVLocation {
  id: string;
  position: { x: number; y: number };
  size: 'small' | 'medium' | 'large';
  orientation: 'landscape' | 'portrait';
  location: string;
}

interface PopupState {
  visible: boolean;
  building: Building | null;
}

interface VRState {
  isEnabled: boolean;
  headRotation: { pitch: number; yaw: number };
}

// ============================================================================
// HOSPITAL DATA
// ============================================================================

const HOSPITAL_BUILDINGS: Building[] = [
  {
    id: 'main-hospital',
    name: 'Main Hospital',
    type: 'hospital',
    icon: '🏥',
    position: { x: 50, y: 40 },
    size: { width: 120, height: 80 },
    color: '#0077B6',
    services: ['Reception', 'Administration', 'Medical Records', 'Cafeteria'],
    operatingHours: { weekday: '24/7', weekend: '24/7' }
  },
  {
    id: 'emergency',
    name: 'Emergency Department',
    type: 'emergency',
    icon: '🚨',
    position: { x: 35, y: 38 },
    size: { width: 60, height: 50 },
    color: '#DC2626',
    services: ['Triage', 'Resuscitation', 'Acute Care', 'Ambulance Bay'],
    operatingHours: { weekday: '24/7', weekend: '24/7' }
  },
  {
    id: 'maternity',
    name: 'Maternity Ward',
    type: 'ward',
    icon: '👶',
    position: { x: 70, y: 30 },
    size: { width: 50, height: 40 },
    color: '#EC4899',
    services: ['Labour & Delivery', 'Postnatal Care', 'Nursery', 'Antenatal'],
    operatingHours: { weekday: '24/7', weekend: '24/7' }
  },
  {
    id: 'paediatrics',
    name: 'Paediatrics',
    type: 'ward',
    icon: '🧸',
    position: { x: 75, y: 50 },
    size: { width: 45, height: 35 },
    color: '#8B5CF6',
    services: ['Children\'s Ward', 'Playroom', 'Family Room'],
    operatingHours: { weekday: '24/7', weekend: '24/7' }
  },
  {
    id: 'mental-health',
    name: 'Mental Health',
    type: 'mental-health',
    icon: '🧠',
    position: { x: 25, y: 65 },
    size: { width: 55, height: 40 },
    color: '#10B981',
    services: ['Counseling', 'Psychiatric Care', 'Group Therapy', 'Crisis Support'],
    operatingHours: { weekday: '8am-6pm', weekend: 'On-call' }
  },
  {
    id: 'pathology',
    name: 'Pathology',
    type: 'diagnostic',
    icon: '🔬',
    position: { x: 60, y: 55 },
    size: { width: 40, height: 30 },
    color: '#F59E0B',
    services: ['Blood Tests', 'Specimen Collection', 'Lab Analysis'],
    operatingHours: { weekday: '7am-5pm', weekend: '8am-12pm' }
  },
  {
    id: 'radiology',
    name: 'Radiology',
    type: 'diagnostic',
    icon: '📷',
    position: { x: 45, y: 55 },
    size: { width: 40, height: 30 },
    color: '#6366F1',
    services: ['X-Ray', 'CT Scan', 'Ultrasound', 'MRI'],
    operatingHours: { weekday: '8am-5pm', weekend: 'Emergency only' }
  },
  {
    id: 'physiotherapy',
    name: 'Physiotherapy',
    type: 'therapy',
    icon: '🏃',
    position: { x: 80, y: 65 },
    size: { width: 45, height: 35 },
    color: '#14B8A6',
    services: ['Rehabilitation', 'Exercise Therapy', 'Hydrotherapy'],
    operatingHours: { weekday: '8am-5pm', weekend: 'Closed' }
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy',
    type: 'pharmacy',
    icon: '💊',
    position: { x: 55, y: 45 },
    size: { width: 35, height: 25 },
    color: '#22C55E',
    services: ['Prescriptions', 'Medication Advice', 'Supplies'],
    operatingHours: { weekday: '8am-6pm', weekend: '9am-1pm' }
  },
  {
    id: 'helipad',
    name: 'Helipad',
    type: 'transport',
    icon: '🚁',
    position: { x: 20, y: 25 },
    size: { width: 40, height: 40 },
    color: '#EF4444',
    services: ['Air Ambulance', 'Emergency Transport'],
    operatingHours: { weekday: '24/7', weekend: '24/7' }
  },
  {
    id: 'parking',
    name: 'Visitor Parking',
    type: 'parking',
    icon: '🅿️',
    position: { x: 85, y: 80 },
    size: { width: 50, height: 35 },
    color: '#64748B',
    services: ['Visitor Parking', 'Disabled Parking', 'Staff Parking'],
    operatingHours: { weekday: '24/7', weekend: '24/7' }
  },
  {
    id: 'garden',
    name: 'Therapy Garden',
    type: 'garden',
    icon: '🌿',
    position: { x: 15, y: 50 },
    size: { width: 35, height: 30 },
    color: '#22C55E',
    services: ['Relaxation Area', 'Walking Paths', 'Seating'],
    operatingHours: { weekday: '6am-8pm', weekend: '6am-8pm' }
  },
  {
    id: 'chapel',
    name: 'Chapel',
    type: 'chapel',
    icon: '🕊️',
    position: { x: 90, y: 35 },
    size: { width: 30, height: 25 },
    color: '#A855F7',
    services: ['Spiritual Care', 'Meditation Room', 'Multi-faith'],
    operatingHours: { weekday: '24/7', weekend: '24/7' }
  }
];

const INITIAL_AVATARS: MapAvatar[] = [
  { id: 'avatar-1', name: 'Dr. Sarah', type: 'staff', icon: '👩‍⚕️', position: { x: 52, y: 42 }, animation: 'idle' },
  { id: 'avatar-2', name: 'Nurse John', type: 'staff', icon: '👨‍⚕️', position: { x: 38, y: 40 }, animation: 'walking' },
  { id: 'avatar-3', name: 'Patient', type: 'patient', icon: '🧑‍🦽', position: { x: 70, y: 52 }, animation: 'idle' },
  { id: 'avatar-4', name: 'Visitor', type: 'visitor', icon: '👤', position: { x: 56, y: 46 }, animation: 'walking' },
  { id: 'avatar-5', name: 'Therapy Dog', type: 'pet', icon: '🐕', position: { x: 18, y: 52 }, animation: 'playing' },
  { id: 'avatar-6', name: 'Security', type: 'security', icon: '👮', position: { x: 85, y: 78 }, animation: 'patrolling' },
];

// TV Terminal Locations throughout the hospital
const TV_LOCATIONS: TVLocation[] = [
  { id: 'tv-reception', position: { x: 48, y: 35 }, size: 'large', orientation: 'landscape', location: 'Main Reception' },
  { id: 'tv-emergency-waiting', position: { x: 32, y: 32 }, size: 'medium', orientation: 'landscape', location: 'Emergency Waiting' },
  { id: 'tv-maternity-lounge', position: { x: 72, y: 25 }, size: 'medium', orientation: 'landscape', location: 'Maternity Lounge' },
  { id: 'tv-paediatrics-play', position: { x: 78, y: 45 }, size: 'small', orientation: 'landscape', location: 'Paediatrics Playroom' },
  { id: 'tv-cafeteria', position: { x: 55, y: 48 }, size: 'large', orientation: 'landscape', location: 'Cafeteria' },
  { id: 'tv-physio-gym', position: { x: 82, y: 60 }, size: 'medium', orientation: 'portrait', location: 'Physio Gym' },
  { id: 'tv-mental-health', position: { x: 22, y: 60 }, size: 'medium', orientation: 'landscape', location: 'Mental Health Lounge' },
  { id: 'tv-chapel', position: { x: 92, y: 30 }, size: 'small', orientation: 'portrait', location: 'Chapel Entrance' },
  { id: 'tv-parking-info', position: { x: 88, y: 75 }, size: 'medium', orientation: 'landscape', location: 'Parking Info' },
  { id: 'tv-garden-kiosk', position: { x: 12, y: 45 }, size: 'small', orientation: 'landscape', location: 'Garden Kiosk' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function HospitalMapScreen() {
  const colors = useColors();
  const { width: screenWidth } = Dimensions.get('window');
  
  // State
  const [buildings] = useState<Building[]>(HOSPITAL_BUILDINGS);
  const [avatars, setAvatars] = useState<MapAvatar[]>(INITIAL_AVATARS);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [popup, setPopup] = useState<PopupState>({ visible: false, building: null });
  const [mapZoom, setMapZoom] = useState(1);
  const [vrMode, setVrMode] = useState<VRState>({ isEnabled: false, headRotation: { pitch: 0, yaw: 0 } });
  const [showPathPreview, setShowPathPreview] = useState(false);
  const [pathPreviewNodes, setPathPreviewNodes] = useState<{ x: number; y: number }[]>([]);
  
  // TV and YouTube Stream State
  const [tvViewerVisible, setTvViewerVisible] = useState(false);
  const [selectedTvId, setSelectedTvId] = useState<string | null>(null);
  const [currentStream, setCurrentStream] = useState(JEDITEK_STREAMS[0]);
  const [isStreamPlaying, setIsStreamPlaying] = useState(false);
  
  // Remote Control and Schedule State
  const [showRemoteControl, setShowRemoteControl] = useState(false);
  const [currentChannel, setCurrentChannel] = useState(jediTekChannelService.getCurrentChannel());
  const [currentScheduleSlot, setCurrentScheduleSlot] = useState(tvScheduleService.getCurrentSlot());
  
  // Picture-in-Picture State
  const [showPiP, setShowPiP] = useState(false);
  const [pipVideoId, setPipVideoId] = useState('jfKfPfyJRdk');
  
  // Emergency Broadcast State
  const [emergencyBroadcast, setEmergencyBroadcast] = useState<EmergencyBroadcast | null>(null);
  const [showEmergencyPanel, setShowEmergencyPanel] = useState(false);
  
  // DJ Voiceover State
  const [currentVoiceover, setCurrentVoiceover] = useState<Voiceover | null>(null);
  const [isVoiceoverPlaying, setIsVoiceoverPlaying] = useState(false);
  
  // Avatar Dialog State
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarProfile | null>(null);
  const [followingAvatarId, setFollowingAvatarId] = useState<string | null>(null);
  
  // Map Gesture State
  const [mapViewport, setMapViewport] = useState<MapViewport>({ x: 0, y: 0, scale: 1, rotation: 0 });
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('campus');
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [isGesturing, setIsGesturing] = useState(false);
  
  // Path Visualization State
  const [activePaths, setActivePaths] = useState<AvatarPath[]>(DEMO_PATHS);
  const [showPathVisualization, setShowPathVisualization] = useState(true);
  
  // Floor Plan State
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const [selectedFloorPlanId, setSelectedFloorPlanId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  
  // Wayfinding State
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [activeRoute, setActiveRoute] = useState<Route | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Real-time Avatar Movement State
  const [movingAvatars, setMovingAvatars] = useState<MovingAvatar[]>([]);
  
  // Route History State
  const [showRouteHistory, setShowRouteHistory] = useState(false);
  
  // Accessibility Icons State
  const [showAccessibilityIcons, setShowAccessibilityIcons] = useState(true);
  const [showAccessibilityLegend, setShowAccessibilityLegend] = useState(false);
  const [accessibilityFilters, setAccessibilityFilters] = useState<string[]>([]);
  const [selectedAccessibilityFeature, setSelectedAccessibilityFeature] = useState<AccessibilityFeature | null>(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const vrParallaxX = useRef(new Animated.Value(0)).current;
  const vrParallaxY = useRef(new Animated.Value(0)).current;
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  // Initialize services and entrance animation
  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Initialize pathfinding service with avatars
    INITIAL_AVATARS.forEach(avatar => {
      avatarPathfindingService.registerAvatar({
        ...avatar,
        targetPosition: null,
        currentPath: [],
        pathIndex: 0,
        speed: avatar.type === 'pet' ? 8 : 5,
        destinationNodeId: null,
        isMoving: false,
      });
    });
    
    // Start pathfinding
    avatarPathfindingService.start();
    
    // Set random destinations for avatars
    setTimeout(() => {
      avatarPathfindingService.setRandomDestinations();
    }, 2000);
    
    // Start YouTube stream
    setTimeout(() => {
      youtubeStreamService.play();
      setIsStreamPlaying(true);
    }, 1500);
    
    // Subscribe to YouTube stream events
    const unsubscribeStream = youtubeStreamService.addListener({
      onStreamChange: (stream) => {
        setCurrentStream(stream);
      },
      onPlayStateChange: (isPlaying) => {
        setIsStreamPlaying(isPlaying);
      },
    });
    
    // Subscribe to avatar movements
    const unsubscribePathfinding = avatarPathfindingService.addListener({
      onAvatarMove: (avatar) => {
        setAvatars(prev => prev.map(a => 
          a.id === avatar.id 
            ? { ...a, position: avatar.position, animation: avatar.animation, isMoving: avatar.isMoving }
            : a
        ));
      },
      onAvatarArrived: (avatar) => {
        setAvatars(prev => prev.map(a => 
          a.id === avatar.id 
(Content truncated due to size limit. Use line ranges to read remaining content)