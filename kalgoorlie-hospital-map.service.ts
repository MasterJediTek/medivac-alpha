/**
 * Kalgoorlie Regional Hospital Virtual Map Service
 * 
 * Comprehensive virtual hospital map system featuring:
 * - Aerial photo rendering in cartoon animation style
 * - Real hospital layout based on Kalgoorlie Health Campus
 * - Avatar navigation with collision detection
 * - AI, pet, and staff interactions
 * - Storyboard popups with maximum effects
 * - VR-ready immersive experience preparation
 * 
 * Location: 15 Piccadilly Street, Kalgoorlie WA 6430
 * GPS: -30.7489, 121.4658
 */

// ============================================================================
// HOSPITAL BUILDING DEFINITIONS
// ============================================================================

export interface HospitalBuilding {
  id: string;
  name: string;
  shortName: string;
  type: BuildingType;
  description: string;
  services: string[];
  floors: number;
  position: MapPosition;
  dimensions: BuildingDimensions;
  entrances: Entrance[];
  color: CartoonColor;
  icon: string;
  operatingHours: OperatingHours;
  staffCount: number;
  interactionPoints: InteractionPoint[];
  storyboardScenes: StoryboardScene[];
  accessibility: AccessibilityFeatures;
  emergencyInfo?: EmergencyInfo;
}

export interface MapPosition {
  x: number; // Grid position X (0-100)
  y: number; // Grid position Y (0-100)
  z: number; // Elevation level
  latitude: number;
  longitude: number;
  rotation: number; // Building rotation in degrees
}

export interface BuildingDimensions {
  width: number;
  height: number;
  depth: number;
  roofStyle: 'flat' | 'gabled' | 'hip' | 'modern' | 'dome';
}

export interface Entrance {
  id: string;
  name: string;
  type: 'main' | 'emergency' | 'staff' | 'delivery' | 'accessible';
  position: { x: number; y: number };
  direction: 'north' | 'south' | 'east' | 'west';
  isAccessible: boolean;
  autoOpen: boolean;
}

export interface CartoonColor {
  primary: string;
  secondary: string;
  accent: string;
  roof: string;
  trim: string;
  glow: string;
}

export interface OperatingHours {
  is24Hours: boolean;
  weekday: { open: string; close: string };
  weekend: { open: string; close: string };
  holidays: 'closed' | 'limited' | 'normal';
}

export interface InteractionPoint {
  id: string;
  name: string;
  type: InteractionType;
  position: { x: number; y: number; z: number };
  triggerRadius: number;
  npcId?: string;
  dialogueId?: string;
  questId?: string;
  animation: string;
}

export interface StoryboardScene {
  id: string;
  title: string;
  description: string;
  voiceoverText: string;
  voiceId: string;
  duration: number;
  animations: SceneAnimation[];
  effects: VisualEffect[];
  soundEffects: string[];
  cameraMovement: CameraMovement;
}

export interface SceneAnimation {
  type: 'fade' | 'slide' | 'zoom' | 'rotate' | 'bounce' | 'pulse' | 'shake' | 'glow';
  target: string;
  duration: number;
  delay: number;
  easing: string;
  params: Record<string, number | string>;
}

export interface VisualEffect {
  type: 'particles' | 'sparkle' | 'glow' | 'trail' | 'ripple' | 'confetti' | 'medical-cross' | 'heartbeat';
  intensity: number;
  color: string;
  duration: number;
}

export interface CameraMovement {
  type: 'pan' | 'zoom' | 'orbit' | 'follow' | 'static';
  startPosition: { x: number; y: number; z: number };
  endPosition: { x: number; y: number; z: number };
  duration: number;
  easing: string;
}

export interface AccessibilityFeatures {
  wheelchairAccess: boolean;
  brailleSignage: boolean;
  hearingLoop: boolean;
  guideDogFriendly: boolean;
  accessibleParking: number;
  elevatorAccess: boolean;
  accessibleToilets: boolean;
}

export interface EmergencyInfo {
  isEmergencyDept: boolean;
  traumaLevel: number;
  helipadAccess: boolean;
  ambulanceBay: number;
  emergencyContact: string;
}

export type BuildingType = 
  | 'main-hospital'
  | 'emergency'
  | 'outpatient'
  | 'mental-health'
  | 'pathology'
  | 'physiotherapy'
  | 'radiology'
  | 'pharmacy'
  | 'maternity'
  | 'paediatrics'
  | 'surgical'
  | 'medical'
  | 'administration'
  | 'cafeteria'
  | 'parking'
  | 'helipad'
  | 'chapel'
  | 'garden';

export type InteractionType = 
  | 'npc-staff'
  | 'npc-patient'
  | 'ai-assistant'
  | 'pet-companion'
  | 'info-kiosk'
  | 'quest-giver'
  | 'service-point'
  | 'emergency-button'
  | 'wayfinding'
  | 'storyboard-trigger';

// ============================================================================
// AVATAR SYSTEM
// ============================================================================

export interface Avatar {
  id: string;
  name: string;
  type: AvatarType;
  appearance: AvatarAppearance;
  position: AvatarPosition;
  movement: MovementState;
  inventory: InventoryItem[];
  companions: Companion[];
  stats: AvatarStats;
  animations: AvatarAnimations;
}

export interface AvatarAppearance {
  bodyType: 'adult' | 'child' | 'elderly';
  gender: 'male' | 'female' | 'neutral';
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  outfit: string;
  accessories: string[];
  expression: string;
}

export interface AvatarPosition {
  x: number;
  y: number;
  z: number;
  rotation: number;
  buildingId?: string;
  floorLevel: number;
  isIndoors: boolean;
}

export interface MovementState {
  isMoving: boolean;
  direction: number;
  speed: number;
  targetPosition?: { x: number; y: number };
  pathNodes: PathNode[];
  currentNodeIndex: number;
  movementType: 'walk' | 'run' | 'wheelchair' | 'teleport';
}

export interface PathNode {
  x: number;
  y: number;
  z: number;
  action?: 'door' | 'elevator' | 'stairs' | 'wait';
  duration?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'document' | 'medication' | 'equipment' | 'collectible';
  icon: string;
  quantity: number;
}

export interface Companion {
  id: string;
  type: CompanionType;
  name: string;
  appearance: CompanionAppearance;
  position: { x: number; y: number; z: number };
  behavior: CompanionBehavior;
  animations: string[];
  sounds: string[];
}

export interface CompanionAppearance {
  species: string;
  color: string;
  size: 'small' | 'medium' | 'large';
  accessories: string[];
  expression: string;
}

export interface CompanionBehavior {
  followDistance: number;
  idleAnimations: string[];
  interactionAnimations: string[];
  sounds: { idle: string[]; happy: string[]; alert: string[] };
  specialAbilities: string[];
}

export interface AvatarStats {
  healthKnowledge: number;
  questsCompleted: number;
  buildingsVisited: string[];
  distanceTraveled: number;
  interactionsCount: number;
  achievementsUnlocked: string[];
}

export interface AvatarAnimations {
  idle: string;
  walk: string;
  run: string;
  wave: string;
  sit: string;
  interact: string;
  celebrate: string;
  confused: string;
}

export type AvatarType = 'patient' | 'visitor' | 'staff' | 'admin';
export type CompanionType = 'therapy-dog' | 'therapy-cat' | 'robot-helper' | 'fairy-guide' | 'medical-mascot' | 'spirit-animal';

// ============================================================================
// VR EXPERIENCE
// ============================================================================

export interface VRExperience {
  id: string;
  name: string;
  mode: VRMode;
  settings: VRSettings;
  cameras: VRCamera[];
  controllers: VRController[];
  interactions: VRInteraction[];
  comfortSettings: ComfortSettings;
  audioConfig: VRAudioConfig;
}

export interface VRSettings {
  renderScale: number;
  fieldOfView: number;
  interpupillaryDistance: number;
  refreshRate: 60 | 72 | 90 | 120;
  antiAliasing: 'none' | 'fxaa' | 'msaa2x' | 'msaa4x';
  shadowQuality: 'off' | 'low' | 'medium' | 'high';
  textureQuality: 'low' | 'medium' | 'high' | 'ultra';
}

export interface VRCamera {
  id: string;
  type: 'main' | 'ui' | 'minimap';
  position: { x: number; y: number; z: number };
  rotation: { pitch: number; yaw: number; roll: number };
  fov: number;
  nearClip: number;
  farClip: number;
}

export interface VRController {
  id: string;
  hand: 'left' | 'right';
  model: string;
  hapticIntensity: number;
  buttons: VRButton[];
  gestures: VRGesture[];
}

export interface VRButton {
  id: string;
  name: string;
  action: string;
  hapticFeedback: boolean;
}

export interface VRGesture {
  id: string;
  name: string;
  type: 'point' | 'grab' | 'pinch' | 'wave' | 'thumbsup';
  action: string;
}

export interface VRInteraction {
  id: string;
  type: 'grab' | 'point' | 'gaze' | 'voice';
  targetId: string;
  action: string;
  feedback: VRFeedback;
}

export interface VRFeedback {
  visual: { type: string; color: string; duration: number };
  audio: { sound: string; volume: number };
  haptic: { hand: 'left' | 'right' | 'both'; intensity: number; duration: number };
}

export interface ComfortSettings {
  vignetteOnMove: boolean;
  vignetteIntensity: number;
  snapTurning: boolean;
  snapTurnAngle: 30 | 45 | 60 | 90;
  smoothTurnSpeed: number;
  teleportEnabled: boolean;
  seatedMode: boolean;
  heightOffset: number;
}

export interface VRAudioConfig {
  spatialAudio: boolean;
  ambisonics: boolean;
  hrtfEnabled: boolean;
  masterVolume: number;
  environmentVolume: number;
  voiceVolume: number;
  musicVolume: number;
}

export type VRMode = 'immersive' | 'seated' | 'standing' | 'roomscale';

// ============================================================================
// MAP RENDERING
// ============================================================================

export interface MapRenderConfig {
  style: RenderStyle;
  quality: RenderQuality;
  effects: RenderEffects;
  lighting: LightingConfig;
  weather: WeatherConfig;
  timeOfDay: TimeOfDayConfig;
}

export interface RenderStyle {
  type: 'cartoon' | 'realistic' | 'blueprint' | 'watercolor' | 'pixel';
  outlineWidth: number;
  outlineColor: string;
  cellShading: boolean;
  colorSaturation: number;
  colorVibrancy: number;
}

export interface RenderQuality {
  resolution: '720p' | '1080p' | '1440p' | '4k';
  frameRate: 30 | 60 | 120;
  drawDistance: number;
  lodBias: number;
  textureFiltering: 'bilinear' | 'trilinear' | 'anisotropic';
}

export interface RenderEffects {
  bloom: { enabled: boolean; intensity: number; threshold: number };
  ambientOcclusion: { enabled: boolean; intensity: number };
  depthOfField: { enabled: boolean; focusDistance: number; aperture: number };
  motionBlur: { enabled: boolean; intensity: number };
  colorGrading: { enabled: boolean; preset: string };
  particles: { enabled: boolean; maxCount: number };
}

export interface LightingConfig {
  sunDirection: { x: number; y: number; z: number };
  sunColor: string;
  sunIntensity: number;
  ambientColor: string;
  ambientIntensity: number;
  shadows: { enabled: boolean; quality: string; softness: number };
}

export interface WeatherConfig {
  type: 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog' | 'dust';
  intensity: number;
  windDirection: number;
  windSpeed: number;
  particles: WeatherParticle[];
}

export interface WeatherParticle {
  type: 'raindrop' | 'cloud' | 'dust' | 'leaf' | 'snow';
  count: number;
  speed: number;
  size: number;
  color: string;
}

export interface TimeOfDayConfig {
  hour: number;
  minute: number;
  autoProgress: boolean;
  progressSpeed: number;
  skyColors: { dawn: string; day: string; dusk: string; night: string };
}

// ============================================================================
// KALGOORLIE HOSPITAL MAP SERVICE
// ============================================================================

export class KalgoorlieHospitalMapService {
  private buildings: Map<string, HospitalBuilding> = new Map();
  private avatars: Map<string, Avatar> = new Map();
  private activeVRExperience: VRExperience | null = null;
  private renderConfig: MapRenderConfig;
  private mapBounds: { minX: number; maxX: number; minY: number; maxY: number };
  private eventListeners: Map<string, Function[]> = new Map();

  // Hospital GPS coordinates
  private readonly HOSPITAL_LOCATION = {
    latitude: -30.7489,
    longitude: 121.4658,
    address: '15 Piccadilly Street, Kalgoorlie WA 6430',
    name: 'Kalgoorlie Health Campus'
  };

  constructor() {
    this.mapBounds = { minX: 0, maxX: 100, minY: 0, maxY: 100 };
    this.renderConfig = this.createDefaultRenderConfig();
    this.initializeHospitalBuildings();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private createDefaultRenderConfig(): MapRenderConfig {
    return {
      style: {
        type: 'cartoon',
        outlineWidth: 3,
        outlineColor: '#2D3748',
        cellShading: true,
        colorSaturation: 1.2,
        colorVibrancy: 1.3
      },
      quality: {
        resolution: '1080p',
        frameRate: 60,
        drawDistance: 500,
        lodBias: 0,
        textureFiltering: 'trilinear'
      },
      effects: {
        bloom: { enabled: true, intensity: 0.5, threshold: 0.8 },
        ambientOcclusion: { enabled: true, intensity: 0.4 },
        depthOfField: { enabled: false, focusDistance: 10, aperture: 2.8 },
        motionBlur: { enabled: false, intensity: 0.2 },
        colorGrading: { enabled: true, preset: 'vibrant-medical' },
        particles: { enabled: true, maxCount: 1000 }
      },
      lighting: {
        sunDirection: { x: 0.5, y: 1, z: 0.3 },
        sunColor: '#FFF5E6',
        sunIntensity: 1.2,
        ambientColor: '#E6F0FF',
        ambientIntensity: 0.4,
        shadows: { enabled: true, quality: 'high', softness: 0.5 }
      },
      weather: {
        type: 'clear',
        intensity: 0,
        windDirection: 45,
        windSpeed: 5,
        particles: []
      },
      timeOfDay: {
        hour: 10,
        minute: 30,
        autoProgress: false,
        progressSpeed: 1,
        skyColors: {
          dawn: '#FFB366',
          day: '#87CEEB',
          dusk: '#FF6B6B',
          night: '#1A1A2E'
        }
      }
    };
  }

  private initializeHospitalBuildings(): void {
    // Main Hospital Building
    this.buildings.set('main-hospital', {
      id: 'main-hospital',
      name: 'Kalgoorlie Health Campus - Main Building',
      shortName: 'Main Hospital',
      type: 'main-hospital',
      description: 'The main 106-bed inpatient facility, one of the largest regional hospitals in Western Australia. Provides comprehensive medical services to the Goldfields region.',
      services: ['Inpatient Care', 'Outpatient Clinics', 'Allied Health', 'Medical Imaging', 'Pharmacy'],
      floors: 3,
      position: {
        x: 50, y: 50, z: 0,
        latitude: -30.7489, longitude: 121.4658,
        rotation: 0
      },
      dimensions: { width: 30, height: 15, depth: 20, roofStyle: 'modern' },
      entrances: [
        { id: 'main-entrance', name: 'Main Entrance', type: 'main', position: { x: 50, y: 42 }, direction: 'south', isAccessible: true, autoOpen: true },
        { id: 'staff-entrance', name: 'Staff Entrance', type: 'staff', position: { x: 65, y: 50 }, direction: 'east', isAccessible: true, autoOpen: false }
      ],
      color: {
        primary: '#FFFFFF',
        secondary: '#E8F4F8',
        accent: '#0077B6',
        roof: '#4A5568',
        trim: '#2D3748',
        glow: '#00B4D8'
      },
      icon: '🏥',
      operatingHours: { is24Hours: true, weekday: { open: '00:00', close: '23:59' }, weekend: { open: '00:00', close: '23:59' }, holidays: 'normal' },
      staffCount: 350,
      interactionPoints: [
        { id: 'reception-ai', name: 'Reception AI Assistant', type: 'ai-assistant', position: { x: 50, y: 45, z: 0 }, triggerRadius: 3, dialogueId: 'welcome-dialogue', animation: 'wave' },
        { id: 'info-kiosk-1', name: 'Information Kiosk', type: 'info-kiosk', position: { x: 48, y: 44, z: 0 }, triggerRadius: 2, animation: 'glow' }
      ],
      storyboardScenes: [
        {
          id: 'main-welcome',
          title: 'Welcome to Kalgoorlie Health Campus',
          description: 'Introduction to the main hospital facility',
          voiceoverText: 'Welcome to Kalgoorlie Health Campus, one of Western Australia\'s largest regional hospitals. We\'re here to provide you with exceptional care.',
          voiceId: 'professional-female',
          duration: 8000,
          animations: [
            { type: 'zoom', target: 'building', duration: 2000, delay: 0, easing: 'ease-out', params: { scale: 1.2 } },
            { type: 'fade', target: 'title', duration: 1000, delay: 2000, easing: 'ease-in', params: { opacity: 1 } }
          ],
          effects: [
            { type: 'sparkle', intensity: 0.5, color: '#00B4D8', duration: 3000 },
            { type: 'medical-cross', intensity: 0.3, color: '#FF0000', duration: 2000 }
          ],
          soundEffects: ['hospital-ambience', 'gentle-chime'],
          cameraMovement: { type: 'orbit', startPosition: { x: 50, y: 30, z: 20 }, endPosition: { x: 50, y: 50, z: 15 }, duration: 5000, easing: 'ease-in-out' }
        }
      ],
      accessibility: {
        wheelchairAccess: true,
        brailleSignage: true,
        hearingLoop: true,
        guideDogFriendly: true,
        accessibleParking: 20,
        elevatorAccess: true,
        accessibleToilets: true
      }
    });

    // Emergency Department
    this.buildings.set('emergency', {
      id: 'emergency',
      name: 'Emergency Department',
      shortName: 'ED',
      type: 'emergency',
      description: '24/7 Emergency services providing critical care, trauma response, and urgent medical treatment for the Goldfields community.',
      services: ['Emergency Care', 'Trauma Response', 'Resuscitation', 'Triage', 'Ambulance Bay'],
      floors: 1,
      position: {
        x: 35, y: 45, z: 0,
        latitude: -30.7491, longitude: 121.4655,
        rotation: 0
      },
      dimensions: { width: 15, height: 8, depth: 12, roofStyle: 'flat' },
      entrances: [
        { id: 'ed-main', name: 'Emergency Entrance', type: 'emergency', position: { x: 35, y: 40 }, direction: 'south', isAccessible: true, autoOpen: true },
        { id: 'ambulance-bay', name: 'Ambulance Bay', type: 'emergency', position: { x: 28, y: 45 }, direction: 'west', isAccessible: true, autoOpen: true }
      ],
      color: {
        primary: '#FFFFFF',
        secondary: '#FFE5E5',
        accent: '#DC2626',
        roof: '#4A5568',
        trim: '#DC2626',
        glow: '#FF4444'
      },
      icon: '🚨',
      operatingHours: { is24Hours: true, weekday: { open: '00:00', close: '23:59' }, weekend: { open: '00:00', close: '23:59' }, holidays: 'normal' },
      staffCount: 45,
      interactionPoints: [
        { id: 'ed-triage', name: 'Triage Nurse', type: 'npc-staff', position: { x: 35, y: 42, z: 0 }, triggerRadius: 2, npcId: 'nurse-triage', dialogueId: 'triage-dialogue', animation: 'alert' },
        { id: 'emergency-button', name: 'Emergency Alert', type: 'emergency-button', position: { x: 33, y: 43, z: 0 }, triggerRadius: 1, animation: 'pulse' }
      ],
      storyboardScenes: [
        {
          id: 'ed-intro',
          title: 'Emergency Department',
          description: 'Overview of emergency services',
          voiceoverText: 'Our Emergency Department operates 24 hours a day, 7 days a week, providing critical care when you need it most.',
          voiceId: 'urgent-male',
          duration: 6000,
          animations: [
            { type: 'pulse', target: 'building', duration: 1000, delay: 0, easing: 'ease-in-out', params: { scale: 1.05 } },
            { type: 'glow', target: 'cross', duration: 2000, delay: 1000, easing: 'linear', params: { intensity: 1 } }
          ],
          effects: [
            { type: 'heartbeat', intensity: 0.8, color: '#DC2626', duration: 4000 },
            { type: 'glow', intensity: 0.6, color: '#FF4444', duration: 3000 }
          ],
          soundEffects: ['emergency-alert', 'heartbeat-monitor'],
          cameraMovement: { type: 'zoom', startPosition: { x: 35, y: 30, z: 15 }, endPosition: { x: 35, y: 42, z: 8 }, duration: 4000, easing: 'ease-out' }
        }
      ],
      accessibility: {
        wheelchairAccess: true,
        brailleSignage: true,
        hearingLoop: true,
        guideDogFriendly: true,
        accessibleParking: 5,
        elevatorAccess: false,
        accessibleToilets: true
      },
      emergencyInfo: {
        isEmergencyDept: true,
        traumaLevel: 3,
        helipadAccess: true,
        ambulanceBay: 3,
        emergencyContact: '000'
      }
    });

    // Maternity Ward
    this.buildings.set('maternity', {
      id: 'maternity',
      name: 'Maternity Unit',
      shortName: 'Maternity',
      type: 'maternity',
      description: 'Comprehensive maternity services including antenatal care, birthing suites, postnatal care, and newborn services.',
      services: ['Antenatal Care', 'Birthing Suites', 'Postnatal Care', 'Newborn Care', 'Lactation Support'],
      floors: 2,
      position: {
        x: 65, y: 55, z: 0,
        latitude: -30.7487, longitude: 121.4662,
        rotation: 0
      },
      dimensions: { width: 12, height: 10, depth: 15, roofStyle: 'gabled' },
      entrances: [
        { id: 'maternity-main', name: 'Maternity Entrance', type: 'main', position: { x: 65, y: 48 }, direction: 'south', isAccessible: true, autoOpen: true }
      ],
      color: {
        primary: '#FFFFFF',
        secondary: '#FFF0F5',
        accent: '#EC4899',
        roof: '#4A5568',
        trim: '#EC4899',
        glow: '#FF69B4'
      },
      icon: '👶',
      operatingHours: { is24Hours: true, weekday: { open: '00:00', close: '23:59' }, weekend: { open: '00:00', close: '23:59' }, holidays: 'normal' },
      staffCount: 30,
      interactionPoints: [
        { id: 'midwife', name: 'Midwife Station', type: 'npc-staff', position: { x: 65, y: 52, z: 0 }, triggerRadius: 2, npcId: 'midwife-sarah', dialogueId: 'maternity-welcome', animation: 'wave' }
      ],
      storyboardScenes: [
        {
          id: 'maternity-intro',
          title: 'Maternity Unit',
          description: 'Welcome to our family-centered maternity care',
          voiceoverText: 'Our Maternity Unit provides a warm, supportive environment for you and your growing family. Our experienced midwives are here to guide you every step of the way.',
          voiceId: 'warm-female',
          duration: 8000,
          animations: [
            { type: 'fade', target: 'building', duration: 1500, delay: 0, easing: 'ease-in', params: { opacity: 1 } },
            { type: 'bounce', target: 'icon', duration: 1000, delay: 1500, easing: 'ease-out', params: { height: 10 } }
          ],
          effects: [
            { type: 'sparkle', intensity: 0.4, color: '#FF69B4', duration: 5000 },
            { type: 'particles', intensity: 0.3, color: '#FFB6C1', duration: 4000 }
          ],
          soundEffects: ['gentle-lullaby', 'soft-chime'],
          cameraMovement: { type: 'pan', startPosition: { x: 55, y: 55, z: 12 }, endPosition: { x: 70, y: 55, z: 10 }, duration: 6000, easing: 'ease-in-out' }
        }
      ],
      accessibility: {
        wheelchairAccess: true,
        brailleSignage: true,
        hearingLoop: true,
        guideDogFriendly: false,
        accessibleParking: 8,
        elevatorAccess: true,
        accessibleToilets: true
      }
    });

    // Paediatrics
    this.buildings.set('paediatrics', {
      id: 'paediatrics',
      name: 'Paediatric Unit',
      shortName: 'Paeds',
      type: 'paediatrics',
      description: 'Child-friendly healthcare environment providing specialized care for infants, children, and adolescents.',
      services: ['Paediatric Care', 'Child Health Clinics', 'Immunizations', 'Developmental Assessments', 'Play Therapy'],
      floors: 2,
      position: {
        x: 60, y: 65, z: 0,
        latitude: -30.7485, longitude: 121.4660,
        rotation: 0
      },
      dimensions: { width: 10, height: 10, depth: 12, roofStyle: 'gabled' },
      entrances: [
        { id: 'paeds-main', name: 'Paediatric Entrance', type: 'main', position: { x: 60, y: 60 }, direction: 'south', isAccessible: true, autoOpen: true }
      ],
      color: {
        primary: '#FFFFFF',
        secondary: '#E0F7FA',
        accent: '#00BCD4',
        roof: '#4A5568',
        trim: '#00BCD4',
        glow: '#4DD0E1'
      },
      icon: '🧸',
      operatingHours: { is24Hours: true, weekday: { open: '00:00', close: '23:59' }, weekend: { open: '00:00', close: '23:59' }, holidays: 'normal' },
      staffCount: 25,
      interactionPoints: [
        { id: 'play-therapist', name: 'Play Therapist', type: 'npc-staff', position: { x: 60, y: 63, z: 0 }, triggerRadius: 3, npcId: 'therapist-emma', dialogueId: 'play-welcome', animation: 'wave' },
        { id: 'therapy-pet', name: 'Therapy Dog Max', type: 'pet-companion', position: { x: 58, y: 64, z: 0 }, triggerRadius: 2, animation: 'wag-tail' }
      ],
      storyboardScenes: [
        {
          id: 'paeds-intro',
          title: 'Paediatric Unit',
          description: 'A magical place for young patients',
          voiceoverText: 'Welcome to our Paediatric Unit! We\'ve created a fun, colorful space where children can feel safe and comfortable while receiving the best care.',
          voiceId: 'friendly-female',
          duration: 7000,
          animations: [
            { type: 'bounce', target: 'building', duration: 800, delay: 0, easing: 'ease-out', params: { height: 5 } },
            { type: 'rotate', target: 'toys', duration: 2000, delay: 1000, easing: 'linear', params: { angle: 360 } }
          ],
          effects: [
            { type: 'confetti', intensity: 0.6, color: '#00BCD4', duration: 4000 },
            { type: 'sparkle', intensity: 0.5, color: '#FFD700', duration: 3000 }
          ],
          soundEffects: ['playful-music', 'children-laughter'],
          cameraMovement: { type: 'orbit', startPosition: { x: 60, y: 55, z: 15 }, endPosition: { x: 60, y: 70, z: 12 }, duration: 5000, easing: 'ease-in-out' }
        }
      ],
      accessibility: {
        wheelchairAccess: true,
        brailleSignage: true,
        hearingLoop: true,
        guideDogFriendly: true,
        accessibleParking: 6,
        elevatorAccess: true,
        accessibleToilets: true
      }
    });

    // Mental Health - Maritana Street
    this.buildings.set('mental-health', {
      id: 'mental-health',
      name: 'Community Mental Health - Maritana Street',
      shortName: 'Mental Health',
      type: 'mental-health',
      description: 'Comprehensive mental health services including counseling, psychiatric care, and community support programs. Located on Maritana Street.',
      services: ['Psychiatric Services', 'Counseling', 'Crisis Support', 'Community Programs', 'Group Therapy', 'Telehealth'],
      floors: 2,
      position: {
        x: 25, y: 70, z: 0,
        latitude: -30.7483, longitude: 121.4648,
        rotation: 15
      },
      dimensions: { width: 14, height: 10, depth: 12, roofStyle: 'hip' },
      entrances: [
        { id: 'mh-main', name: 'Main Entrance', type: 'main', position: { x: 25, y: 65 }, direction: 'south', isAccessible: true, autoOpen: true },
        { id: 'mh-garden', name: 'Garden Entrance', type: 'accessible', position: { x: 20, y: 70 }, direction: 'west', isAccessible: true, autoOpen: false }
      ],
      color: {
        primary: '#FFFFFF',
        secondary: '#E8F5E9',
        accent: '#4CAF50',
        roof: '#4A5568',
        trim: '#4CAF50',
        glow: '#81C784'
      },
      icon: '🧠',
      operatingHours: { is24Hours: false, weekday: { open: '08:00', close: '17:00' }, weekend: { open: '09:00', close: '13:00' }, holidays: 'limited' },
      staffCount: 20,
      interactionPoints: [
        { id: 'mh-counselor', name: 'Mental Health Counselor', type: 'npc-staff', position: { x: 25, y: 68, z: 0 }, triggerRadius: 2, npcId: 'counselor-david', dialogueId: 'mh-welcome', animation: 'wave' },
        { id: 'therapy-garden', name: 'Therapy Garden', type: 'service-point', position: { x: 20, y: 72, z: 0 }, triggerRadius: 4, animation: 'glow' }
      ],
      storyboardScenes: [
        {
          id: 'mh-intro',
          title: 'Community Mental Health',
          description: 'A place of healing and support',
          voiceoverText: 'Our Community Mental Health service on Maritana Street provides a safe, supportive environment for mental wellness. We\'re here to help you on your journey to better mental health.',
          voiceId: 'calm-male',
          duration: 9000,
          animations: [
            { type: 'fade', target: 'building', duration: 2000, delay: 0, easing: 'ease-in', params: { opacity: 1 } },
            { type: 'glow', target: 'garden', duration: 3000, delay: 2000, easing: 'ease-in-out', params: { intensity: 0.8 } }
          ],
          effects: [
            { type: 'particles', intensity: 0.3, color: '#81C784', duration: 6000 },
            { type: 'ripple', intensity: 0.4, color: '#4CAF50', duration: 4000 }
          ],
          soundEffects: ['nature-sounds', 'gentle-water', 'birds-chirping'],
          cameraMovement: { type: 'pan', startPosition: { x: 15, y: 70, z: 10 }, endPosition: { x: 30, y: 70, z: 8 }, duration: 7000, easing: 'ease-in-out' }
        }
      ],
      accessibility: {
        wheelchairAccess: true,
        brailleSignage: true,
        hearingLoop: true,
        guideDogFriendly: true,
        accessibleParking: 10,
        elevatorAccess: true,
        accessibleToilets: true
      }
    });

    // Pathology
    this.buildings.set('pathology', {
      id: 'pathology',
      name: 'Pathology Department',
      shortName: 'Pathology',
      type: 'pathology',
      description: 'State-of-the-art pathology laboratory providing blood tests, tissue analysis, and diagnostic services.',
      services: ['Blood Collection', 'Tissue Analysis', 'Microbiology', 'Biochemistry', 'Haematology'],
      floors: 2,
      position: {
        x: 40, y: 60, z: 0,
        latitude: -30.7486, longitude: 121.4654,
        rotation: 0
      },
      dimensions: { width: 10, height: 10, depth: 10, roofStyle: 'flat' },
      entrances: [
        { id: 'path-main', name: 'Collection Centre', type: 'main', position: { x: 40, y: 55 }, direction: 'south', isAccessible: true, autoOpen: true }
      ],
      color: {
        primary: '#FFFFFF',
        secondary: '#EDE7F6',
        accent: '#7C3AED',
        roof: '#4A5568',
        trim: '#7C3AED',
        glow: '#A78BFA'
      },
      icon: '🔬',
      operatingHours: { is24Hours: false, weekday: { open: '07:00', close: '17:00' }, weekend: { open: '08:00', close: '12:00' }, holidays: 'limited' },
      staffCount: 15,
      interactionPoints: [
        { id: 'path-collector', name: 'Blood Collection', type: 'service-point', position: { x: 40, y: 58, z: 0 }, triggerRadius: 2, animation: 'pulse' }
      ],
      storyboardScenes: [
        {
          id: 'path-intro',
          title: 'Pathology Department',
          description: 'Advanced diagnostic services',
          voiceoverText: 'Our Pathology Department uses cutting-edge technology to provide accurate diagnostic results. Our skilled team processes thousands of tests each week.',
          voiceId: 'professional-male',
          duration: 7000,
          animations: [
            { type: 'zoom', target: 'building', duration: 1500, delay: 0, easing: 'ease-out', params: { scale: 1.1 } },
            { type: 'pulse', target: 'equipment', duration: 1000, delay: 1500, easing: 'ease-in-out', params: { scale: 1.05 } }
          ],
          effects: [
            { type: 'glow', intensity: 0.5, color: '#A78BFA', duration: 4000 },
            { type: 'sparkle', intensity: 0.3, color: '#7C3AED', duration: 3000 }
          ],
          soundEffects: ['lab-equipment', 'computer-beep'],
          cameraMovement: { type: 'zoom', startPosition: { x: 40, y: 50, z: 15 }, endPosition: { x: 40, y: 58, z: 8 }, duration: 5000, easing: 'ease-out' }
        }
      ],
      accessibility: {
        wheelchairAccess: true,
        brailleSignage: true,
        hearingLoop: false,
        guideDogFriendly: true,
        accessibleParking: 4,
        elevatorAccess: true,
        accessibleToilets: true
      }
    });

    // Physiotherapy
    this.buildings.set('physiotherapy', {
      id: 'physiotherapy',
      name: 'Physiotherapy Department',
      shortName: 'Physio',
      type: 'physiotherapy',
      description: 'Comprehensive rehabilitation services including physiotherapy, occupational therapy, and exercise programs.',
      services: ['Physiotherapy', 'Occupational Therapy', 'Hydrotherapy', 'Exercise Programs', 'Pain Management'],
      floors: 1,
      position: {
        x: 70, y: 45, z: 0,
        latitude: -30.7490, longitude: 121.4665,
        rotation: 0
      },
      dimensions: { width: 12, height: 8, depth: 15, roofStyle: 'modern' },
      entrances: [
        { id: 'physio-main', name: 'Physio Entrance', type: 'main', position: { x: 70, y: 40 }, direction: 'south', isAccessible: true, autoOpen: true }
      ],
      color: {
        primary: '#FFFFFF',
        secondary: '#FFF3E0',
        accent: '#F97316',
        roof: '#4A5568',
        trim: '#F97316',
        glow: '#FB923C'
      },
      icon: '🏃',
      operatingHours: { is24Hours: false, weekday: { open: '07:30', close: '17:30' }, weekend: { open: '08:00', close: '12:00' }, holidays: 'closed' },
      staffCount: 12,
      interactionPoints: [
        { id: 'physio-therapist', name: 'Physiotherapist', type: 'npc-staff', position: { x: 70, y: 43, z: 0 }, triggerRadius: 2, npcId: 'physio-mike', dialogueId: 'physio-welcome', animation: 'stretch' }
      ],
      storyboardScenes: [
        {
          id: 'physio-intro',
          title: 'Physiotherapy Department',
          description: 'Get moving, get better',
          voiceoverText: 'Our Physiotherapy team helps you recover, rehabilitate, and regain your strength. From sports injuries to post-surgery recovery, we\'re here to support your journey.',
          voiceId: 'energetic-male',
          duration: 8000,
          animations: [
            { type: 'slide', target: 'building', duration: 1500, delay: 0, easing: 'ease-out', params: { direction: 'left' } },
            { type: 'bounce', target: 'figure', duration: 1000, delay: 2000, easing: 'ease-out', params: { height: 8 } }
          ],
          effects: [
            { type: 'trail', intensity: 0.5, color: '#FB923C', duration: 4000 },
            { type: 'particles', intensity: 0.4, color: '#F97316', duration: 3000 }
          ],
          soundEffects: ['exercise-music', 'gym-equipment'],
          cameraMovement: { type: 'follow', startPosition: { x: 60, y: 45, z: 10 }, endPosition: { x: 75, y: 45, z: 8 }, duration: 6000, easing: 'ease-in-out' }
        }
      ],
      accessibility: {
        wheelchairAccess: true,
        brailleSignage: true,
        hearingLoop: false,
        guideDogFriendly: true,
        accessibleParking: 6,
        elevatorAccess: false,
        accessibleToilets: true
      }
    });

    // Radiology
    this.buildings.set('radiology', {
      id: 'radiology',
      name: 'Medical Imaging / Radiology',
      shortName: 'Radiology',
      type: 'radiology',
      description: 'Advanced medical imaging services including X-ray, CT scan, ultrasound, and MRI.',
      services: ['X-Ray', 'CT Scan', 'Ultrasound', 'MRI', 'Fluoroscopy'],
      floors: 1,
      position: {
        x: 45, y: 55, z: 0,
        latitude: -30.7488, longitude: 121.4656,
        rotation: 0
      },
      dimensions: { width: 10, height: 8, depth: 12, roofStyle: 'flat' },
      entrances: [
        { id: 'rad-main', name: 'Imaging Entrance', type: 'main', position: { x: 45, y: 50 }, direction: 'south', isAccessible: true, autoOpen: true }
      ],
      color: {
        primary: '#FFFFFF',
        secondary: '#E3F2FD',
        accent: '#2196F3',
        roof: '#4A5568',
        trim: '#2196F3',
        glow: '#64B5F6'
      },
      icon: '📷',
      operatingHours: { is24Hours: false, weekday: { open: '08:00', close: '17:00' }, weekend: { open: '09:00', close: '13:00' }, holidays: 'limited' },
      staffCount: 18,
      interactionPoints: [
        { id: 'rad-tech', name: 'Radiographer', type: 'npc-staff', position: { x: 45, y: 53, z: 0 }, triggerRadius: 2, npcId: 'radiographer-lisa', dialogueId: 'imaging-welcome', animation: 'wave' }
      ],
      storyboardScenes: [
        {
          id: 'rad-intro',
          title: 'Medical Imaging',
          description: 'See inside with advanced technology',
          voiceoverText: 'Our Medical Imaging department uses state-of-the-art equipment to help diagnose and monitor your health conditions with precision and care.',
          voiceId: 'professional-female',
          duration: 7000,
          animations: [
            { type: 'fade', target: 'building', duration: 1500, delay: 0, easing: 'ease-in', params: { opacity: 1 } },
            { type: 'glow', target: 'scanner', duration: 2000, delay: 1500, easing: 'ease-in-out', params: { intensity: 1 } }
          ],
          effects: [
            { type: 'glow', intensity: 0.6, color: '#64B5F6', duration: 5000 },
            { type: 'ripple', intensity: 0.4, color: '#2196F3', duration: 3000 }
          ],
          soundEffects: ['scanner-hum', 'tech-beep'],
          cameraMovement: { type: 'zoom', startPosition: { x: 45, y: 45, z: 12 }, endPosition: { x: 45, y: 53, z: 6 }, duration: 5000, easing: 'ease-out' }
        }
      ],
      accessibility: {
        wheelchairAccess: true,
        brailleSignage: true,
        hearingLoop: false,
        guideDogFriendly: false,
        accessibleParking: 4,
        elevatorAccess: false,
        accessibleToilets: true
      }
    });

    // Pharmacy
    this.buildings.set('pharmacy', {
      id: 'pharmacy',
      name: 'Hospital Pharmacy',
      shortName: 'Pharmacy',
      type: 'pharmacy',
      description: 'Full-service pharmacy providing medications, consultations, and medication management services.',
      services: ['Prescription Dispensing', 'Medication Counseling', 'Medication Reviews', 'Compounding', 'Home Medicines Review'],
      floors: 1,
      position: {
        x: 55, y: 42, z: 0,
        latitude: -30.7491, longitude: 121.4659,
        rotation: 0
      },
      dimensions: { width: 8, height: 6, depth: 10, roofStyle: 'flat' },
      entrances: [
        { id: 'pharm-main', name: 'Pharmacy Entrance', type: 'main', position: { x: 55, y: 38 }, direction: 'south', isAccessible: true, autoOpen: true }
      ],
      color: {
        primary: '#FFFFFF',
        secondary: '#E8F5E9',
        accent: '#10B981',
        roof: '#4A5568',
        trim: '#10B981',
        glow: '#34D399'
      },
      icon: '💊',
      operatingHours: { is24Hours: false, weekday: { open: '08:30', close: '17:00' }, weekend: { open: '09:00', close: '12:00' }, holidays: 'limited' },
      staffCount: 8,
      interactionPoints: [
        { id: 'pharmacist', name: 'Pharmacist', type: 'npc-staff', position: { x: 55, y: 40, z: 0 }, triggerRadius: 2, npcId: 'pharmacist-chen', dialogueId: 'pharmacy-welcome', animation: 'wave' }
      ],
      storyboardScenes: [
        {
          id: 'pharm-intro',
          title: 'Hospital Pharmacy',
          description: 'Your medication experts',
          voiceoverText: 'Our pharmacy team ensures you receive the right medications with proper guidance. We\'re here to answer your questions and support your health journey.',
          voiceId: 'friendly-female',
          duration: 7000,
          animations: [
            { type: 'slide', target: 'building', duration: 1000, delay: 0, easing: 'ease-out', params: { direction: 'up' } },
            { type: 'pulse', target: 'cross', duration: 1500, delay: 1000, easing: 'ease-in-out', params: { scale: 1.1 } }
          ],
          effects: [
            { type: 'sparkle', intensity: 0.4, color: '#34D399', duration: 4000 },
            { type: 'glow', intensity: 0.3, color: '#10B981', duration: 3000 }
          ],
          soundEffects: ['pill-bottle', 'register-beep'],
          cameraMovement: { type: 'pan', startPosition: { x: 50, y: 42, z: 8 }, endPosition: { x: 60, y: 42, z: 6 }, duration: 5000, easing: 'ease-in-out' }
        }
      ],
      accessibility: {
        wheelchairAccess: true,
        brailleSignage: true,
        hearingLoop: true,
        guideDogFriendly: true,
        accessibleParking: 2,
        elevatorAccess: false,
        accessibleToilets: true
      }
    });

    // Surgical Ward
    this.buildings.set('surgical', {
      id: 'surgical',
      name: 'Surgical Ward',
      shortName: 'Surgery',
      type: 'surgical',
      description: 'Comprehensive surgical services including operating theatres, pre-operative care, and post-operative recovery.',
      services: ['General Surgery', 'Day Surgery', 'Operating Theatres', 'Recovery Ward', 'Anaesthetics'],
      floors: 2,
      position: {
        x: 50, y: 60, z: 0,
        latitude: -30.7486, longitude: 121.4658,
        rotation: 0
      },
      dimensions: { width: 14, height: 12, depth: 16, roofStyle: 'modern' },
      entrances: [
        { id: 'surg-main', name: 'Surgical Entrance', type: 'main', position: { x: 50, y: 54 }, direction: 'south', isAccessible: true, autoOpen: true },
        { id: 'surg-staff', name: 'Theatre Access', type: 'staff', position: { x: 57, y: 60 }, direction: 'east', isAccessible: true, autoOpen: false }
      ],
      color: {
        primary: '#FFFFFF',
        secondary: '#F0FDF4',
        accent: '#059669',
        roof: '#4A5568',
        trim: '#059669',
        glow: '#10B981'
      },
      icon: '🏥',
      operatingHours: { is24Hours: true, weekday: { open: '00:00', close: '23:59' }, weekend: { open: '00:00', close: '23:59' }, holidays: 'normal' },
      staffCount: 40,
      interactionPoints: [
        { id: 'surg-nurse', name: 'Surgical Nurse', type: 'npc-staff', position: { x: 50, y: 57, z: 0 }, triggerRadius: 2, npcId: 'nurse-surgical', dialogueId: 'surgery-welcome', animation: 'wave' }
      ],
      storyboardScenes: [
        {
          id: 'surg-intro',
          title: 'Surgical Ward',
          description: 'Excellence in surgical care',
          voiceoverText: 'Our Surgical Ward features modern operating theatres and a dedicated team of surgeons, anaesthetists, and nurses committed to your safe recovery.',
          voiceId: 'professional-male',
          duration: 8000,
          animations: [
            { type: 'zoom', target: 'building', duration: 2000, delay: 0, easing: 'ease-out', params: { scale: 1.15 } },
            { type: 'glow', target: 'theatre', duration: 2500, delay: 2000, easing: 'ease-in-out', params: { intensity: 0.9 } }
          ],
          effects: [
            { type: 'glow', intensity: 0.5, color: '#10B981', duration: 5000 },
            { type: 'medical-cross', intensity: 0.4, color: '#059669', duration: 3000 }
          ],
          soundEffects: ['hospital-ambience', 'monitor-beep'],
          cameraMovement: { type: 'orbit', startPosition: { x: 40, y: 60, z: 15 }, endPosition: { x: 60, y: 60, z: 12 }, duration: 6000, easing: 'ease-in-out' }
        }
      ],
      accessibility: {
        wheelchairAccess: true,
        brailleSignage: true,
        hearingLoop: true,
        guideDogFriendly: false,
        accessibleParking: 4,
        elevatorAccess: true,
        accessibleToilets: true
      }
    });

    // Medical Ward
    this.buildings.set('medical', {
      id: 'medical',
      name: 'Medical Ward',
      shortName: 'Medical',
      type: 'medical',
      description: 'General medical ward providing inpatient care for a wide range of medical conditions.',
      services: ['General Medicine', 'Cardiology', 'Respiratory', 'Gastroenterology', 'Neurology'],
      floors: 2,
      position: {
        x: 55, y: 65, z: 0,
        latitude: -30.7484, longitude: 121.4659,
        rotation: 0
      },
      dimensions: { width: 14, height: 12, depth: 16, roofStyle: 'modern' },
      entrances: [
        { id: 'med-main', name: 'Medical Ward Entrance', type: 'main', position: { x: 55, y: 58 }, direction: 'south', isAccessible: true, autoOpen: true }
      ],
      color: {
        primary: '#FFFFFF',
        secondary: '#EFF6FF',
        accent: '#3B82F6',
        roof: '#4A5568',
        trim: '#3B82F6',
        glow: '#60A5FA'
      },
      icon: '🩺',
      operatingHours: { is24Hours: true, weekday: { open: '00:00', close: '23:59' }, weekend: { open: '00:00', close: '23:59' }, holidays: 'normal' },
      staffCount: 45,
      interactionPoints: [
        { id: 'med-doctor', name: 'Medical Doctor', type: 'npc-staff', position: { x: 55, y: 62, z: 0 }, triggerRadius: 2, npcId: 'doctor-medical', dialogueId: 'medical-welcome', animation: 'wave' }
      ],
      storyboardScenes: [
        {
          id: 'med-intro',
          title: 'Medical Ward',
          description: 'Comprehensive medical care',
          voiceoverText: 'Our Medical Ward provides expert care for a wide range of conditions. Our experienced physicians and nurses are dedicated to your recovery.',
          voiceId: 'professional-female',
          duration: 7000,
          animations: [
            { type: 'fade', target: 'building', duration: 1500, delay: 0, easing: 'ease-in', params: { opacity: 1 } },
            { type: 'pulse', target: 'heart', duration: 1000, delay: 1500, easing: 'ease-in-out', params: { scale: 1.1 } }
          ],
          effects: [
            { type: 'heartbeat', intensity: 0.5, color: '#3B82F6', duration: 4000 },
            { type: 'glow', intensity: 0.4, color: '#60A5FA', duration: 3000 }
          ],
          soundEffects: ['heartbeat-monitor', 'hospital-ambience'],
          cameraMovement: { type: 'pan', startPosition: { x: 45, y: 65, z: 12 }, endPosition: { x: 65, y: 65, z: 10 }, duration: 5000, easing: 'ease-in-out' }
        }
      ],
      accessibility: {
        wheelchairAccess: true,
        brailleSignage: true,
        hearingLoop: true,
        guideDogFriendly: false,
        accessibleParking: 4,
        elevatorAccess: true,
        accessibleToilets: true
      }
    });

    // Cafeteria
    this.buildings.set('cafeteria', {
      id: 'cafeteria',
      name: 'Hospital Cafeteria',
      shortName: 'Cafe',
      type: 'cafeteria',
      description: 'Comfortable dining area serving healthy meals, snacks, and beverages for patients, visitors, and staff.',
      services: ['Hot Meals', 'Sandwiches', 'Coffee & Tea', 'Healthy Snacks', 'Special Diets'],
      floors: 1,
      position: {
        x: 35, y: 55, z: 0,
        latitude: -30.7487, longitude: 121.4652,
        rotation: 0
      },
      dimensions: { width: 10, height: 6, depth: 12, roofStyle: 'flat' },
      entrances: [
        { id: 'cafe-main', name: 'Cafeteria Entrance', type: 'main', position: { x: 35, y: 50 }, direction: 'south', isAccessible: true, autoOpen: true }
      ],
      color: {
        primary: '#FFFFFF',
        secondary: '#FEF3C7',
        accent: '#F59E0B',
        roof: '#4A5568',
        trim: '#F59E0B',
        glow: '#FBBF24'
      },
      icon: '☕',
      operatingHours: { is24Hours: false, weekday: { open: '06:30', close: '19:00' }, weekend: { open: '07:00', close: '18:00' }, holidays: 'limited' },
      staffCount: 10,
      interactionPoints: [
        { id: 'cafe-staff', name: 'Cafe Staff', type: 'npc-staff', position: { x: 35, y: 53, z: 0 }, triggerRadius: 2, npcId: 'cafe-worker', dialogueId: 'cafe-welcome', animation: 'wave' }
      ],
      storyboardScenes: [
        {
          id: 'cafe-intro',
          title: 'Hospital Cafeteria',
          description: 'Refresh and recharge',
          voiceoverText: 'Take a break at our cafeteria! We offer a variety of healthy meals and refreshments to keep you energized during your visit.',
          voiceId: 'friendly-female',
          duration: 6000,
          animations: [
            { type: 'slide', target: 'building', duration: 1000, delay: 0, easing: 'ease-out', params: { direction: 'right' } },
            { type: 'bounce', target: 'cup', duration: 800, delay: 1000, easing: 'ease-out', params: { height: 5 } }
          ],
          effects: [
            { type: 'sparkle', intensity: 0.3, color: '#FBBF24', duration: 3000 },
            { type: 'particles', intensity: 0.2, color: '#F59E0B', duration: 2500 }
          ],
          soundEffects: ['coffee-machine', 'cafe-ambience'],
          cameraMovement: { type: 'pan', startPosition: { x: 30, y: 55, z: 8 }, endPosition: { x: 40, y: 55, z: 6 }, duration: 4000, easing: 'ease-in-out' }
        }
      ],
      accessibility: {
        wheelchairAccess: true,
        brailleSignage: true,
        hearingLoop: false,
        guideDogFriendly: true,
        accessibleParking: 2,
        elevatorAccess: false,
        accessibleToilets: true
      }
    });

    // Helipad
    this.buildings.set('helipad', {
      id: 'helipad',
      name: 'Emergency Helipad',
      shortName: 'Helipad',
      type: 'helipad',
      description: 'Emergency helicopter landing pad for critical patient transfers and Royal Flying Doctor Service.',
      services: ['Emergency Transfers', 'RFDS Landing', 'Critical Care Transport'],
      floors: 1,
      position: {
        x: 25, y: 40, z: 0,
        latitude: -30.7493, longitude: 121.4650,
        rotation: 0
      },
      dimensions: { width: 15, height: 1, depth: 15, roofStyle: 'flat' },
      entrances: [
        { id: 'heli-access', name: 'Helipad Access', type: 'emergency', position: { x: 25, y: 45 }, direction: 'north', isAccessible: true, autoOpen: true }
      ],
      color: {
        primary: '#374151',
        secondary: '#4B5563',
        accent: '#EF4444',
        roof: '#374151',
        trim: '#FFFFFF',
        glow: '#FF6B6B'
      },
      icon: '🚁',
      operatingHours: { is24Hours: true, weekday: { open: '00:00', close: '23:59' }, weekend: { open: '00:00', close: '23:59' }, holidays: 'normal' },
      staffCount: 0,
      interactionPoints: [
        { id: 'heli-info', name: 'Helipad Information', type: 'info-kiosk', position: { x: 25, y: 42, z: 0 }, triggerRadius: 3, animation: 'pulse' }
      ],
      storyboardScenes: [
        {
          id: 'heli-intro',
          title: 'Emergency Helipad',
          description: 'Rapid response capability',
          voiceoverText: 'Our helipad enables rapid emergency transfers and connects us with the Royal Flying Doctor Service, ensuring critical patients receive timely care.',
          voiceId: 'urgent-male',
          duration: 6000,
          animations: [
            { type: 'zoom', target: 'helipad', duration: 2000, delay: 0, easing: 'ease-out', params: { scale: 1.2 } },
            { type: 'rotate', target: 'cross', duration: 3000, delay: 1000, easing: 'linear', params: { angle: 360 } }
          ],
          effects: [
            { type: 'glow', intensity: 0.7, color: '#EF4444', duration: 4000 },
            { type: 'particles', intensity: 0.5, color: '#FF6B6B', duration: 3000 }
          ],
          soundEffects: ['helicopter-rotor', 'wind-strong'],
          cameraMovement: { type: 'orbit', startPosition: { x: 25, y: 30, z: 20 }, endPosition: { x: 25, y: 50, z: 15 }, duration: 5000, easing: 'ease-in-out' }
        }
      ],
      accessibility: {
        wheelchairAccess: false,
        brailleSignage: false,
        hearingLoop: false,
        guideDogFriendly: false,
        accessibleParking: 0,
        elevatorAccess: false,
        accessibleToilets: false
      }
    });

    // Chapel / Spiritual Care
    this.buildings.set('chapel', {
      id: 'chapel',
      name: 'Chapel & Spiritual Care',
      shortName: 'Chapel',
      type: 'chapel',
      description: 'Multi-faith spiritual care center providing a quiet space for reflection, prayer, and pastoral support.',
      services: ['Multi-Faith Chapel', 'Pastoral Care', 'Counseling', 'Meditation Space', 'Memorial Services'],
      floors: 1,
      position: {
        x: 75, y: 60, z: 0,
        latitude: -30.7486, longitude: 121.4668,
        rotation: 0
      },
      dimensions: { width: 8, height: 8, depth: 10, roofStyle: 'gabled' },
      entrances: [
        { id: 'chapel-main', name: 'Chapel Entrance', type: 'main', position: { x: 75, y: 55 }, direction: 'south', isAccessible: true, autoOpen: true }
      ],
      color: {
        primary: '#FFFFFF',
        secondary: '#FDF2F8',
        accent: '#8B5CF6',
        roof: '#4A5568',
        trim: '#8B5CF6',
        glow: '#A78BFA'
      },
      icon: '🕊️',
      operatingHours: { is24Hours: true, weekday: { open: '00:00', close: '23:59' }, weekend: { open: '00:00', close: '23:59' }, holidays: 'normal' },
      staffCount: 3,
      interactionPoints: [
        { id: 'chaplain', name: 'Hospital Chaplain', type: 'npc-staff', position: { x: 75, y: 58, z: 0 }, triggerRadius: 2, npcId: 'chaplain-grace', dialogueId: 'spiritual-welcome', animation: 'wave' }
      ],
      storyboardScenes: [
        {
          id: 'chapel-intro',
          title: 'Chapel & Spiritual Care',
          description: 'A place of peace',
          voiceoverText: 'Our Chapel provides a peaceful sanctuary for all faiths. Our pastoral care team is here to support your spiritual and emotional wellbeing.',
          voiceId: 'calm-female',
          duration: 7000,
          animations: [
            { type: 'fade', target: 'building', duration: 2000, delay: 0, easing: 'ease-in', params: { opacity: 1 } },
            { type: 'glow', target: 'window', duration: 3000, delay: 2000, easing: 'ease-in-out', params: { intensity: 0.8 } }
          ],
          effects: [
            { type: 'sparkle', intensity: 0.3, color: '#A78BFA', duration: 5000 },
            { type: 'particles', intensity: 0.2, color: '#8B5CF6', duration: 4000 }
          ],
          soundEffects: ['peaceful-bells', 'soft-music'],
          cameraMovement: { type: 'zoom', startPosition: { x: 75, y: 50, z: 12 }, endPosition: { x: 75, y: 58, z: 8 }, duration: 5000, easing: 'ease-out' }
        }
      ],
      accessibility: {
        wheelchairAccess: true,
        brailleSignage: true,
        hearingLoop: true,
        guideDogFriendly: true,
        accessibleParking: 2,
        elevatorAccess: false,
        accessibleToilets: true
      }
    });

    // Healing Garden
    this.buildings.set('garden', {
      id: 'garden',
      name: 'Healing Garden',
      shortName: 'Garden',
      type: 'garden',
      description: 'Therapeutic outdoor space with native plants, walking paths, and seating areas for relaxation and recovery.',
      services: ['Walking Paths', 'Seating Areas', 'Native Garden', 'Bird Watching', 'Meditation Space'],
      floors: 0,
      position: {
        x: 30, y: 65, z: 0,
        latitude: -30.7484, longitude: 121.4651,
        rotation: 0
      },
      dimensions: { width: 15, height: 2, depth: 15, roofStyle: 'flat' },
      entrances: [
        { id: 'garden-north', name: 'North Path', type: 'accessible', position: { x: 30, y: 58 }, direction: 'south', isAccessible: true, autoOpen: false },
        { id: 'garden-south', name: 'South Path', type: 'accessible', position: { x: 30, y: 72 }, direction: 'north', isAccessible: true, autoOpen: false }
      ],
      color: {
        primary: '#86EFAC',
        secondary: '#BBF7D0',
        accent: '#22C55E',
        roof: '#22C55E',
        trim: '#15803D',
        glow: '#4ADE80'
      },
      icon: '🌿',
      operatingHours: { is24Hours: false, weekday: { open: '06:00', close: '20:00' }, weekend: { open: '06:00', close: '20:00' }, holidays: 'normal' },
      staffCount: 2,
      interactionPoints: [
        { id: 'garden-bench', name: 'Meditation Bench', type: 'service-point', position: { x: 30, y: 65, z: 0 }, triggerRadius: 2, animation: 'glow' },
        { id: 'therapy-bird', name: 'Garden Birds', type: 'pet-companion', position: { x: 28, y: 67, z: 0 }, triggerRadius: 3, animation: 'flutter' }
      ],
      storyboardScenes: [
        {
          id: 'garden-intro',
          title: 'Healing Garden',
          description: 'Nature\'s therapy',
          voiceoverText: 'Our Healing Garden offers a tranquil escape with native Australian plants and peaceful walking paths. Take a moment to breathe and reconnect with nature.',
          voiceId: 'calm-female',
          duration: 8000,
          animations: [
            { type: 'fade', target: 'garden', duration: 2000, delay: 0, easing: 'ease-in', params: { opacity: 1 } },
            { type: 'bounce', target: 'flowers', duration: 1500, delay: 2000, easing: 'ease-out', params: { height: 3 } }
          ],
          effects: [
            { type: 'particles', intensity: 0.4, color: '#4ADE80', duration: 6000 },
            { type: 'sparkle', intensity: 0.3, color: '#22C55E', duration: 5000 }
          ],
          soundEffects: ['birds-chirping', 'gentle-breeze', 'water-fountain'],
          cameraMovement: { type: 'pan', startPosition: { x: 20, y: 65, z: 8 }, endPosition: { x: 40, y: 65, z: 6 }, duration: 6000, easing: 'ease-in-out' }
        }
      ],
      accessibility: {
        wheelchairAccess: true,
        brailleSignage: true,
        hearingLoop: false,
        guideDogFriendly: true,
        accessibleParking: 4,
        elevatorAccess: false,
        accessibleToilets: true
      }
    });

    // Parking
    this.buildings.set('parking', {
      id: 'parking',
      name: 'Visitor Parking',
      shortName: 'Parking',
      type: 'parking',
      description: 'Free visitor parking with accessible spaces and clear signage to hospital entrances.',
      services: ['Free Parking', 'Accessible Spaces', 'Drop-off Zone', 'Motorcycle Parking'],
      floors: 1,
      position: {
        x: 50, y: 30, z: 0,
        latitude: -30.7495, longitude: 121.4658,
        rotation: 0
      },
      dimensions: { width: 25, height: 2, depth: 15, roofStyle: 'flat' },
      entrances: [
        { id: 'park-entry', name: 'Parking Entry', type: 'main', position: { x: 40, y: 30 }, direction: 'west', isAccessible: true, autoOpen: false },
        { id: 'park-exit', name: 'Parking Exit', type: 'main', position: { x: 60, y: 30 }, direction: 'east', isAccessible: true, autoOpen: false }
      ],
      color: {
        primary: '#6B7280',
        secondary: '#9CA3AF',
        accent: '#3B82F6',
        roof: '#6B7280',
        trim: '#FFFFFF',
        glow: '#60A5FA'
      },
      icon: '🅿️',
      operatingHours: { is24Hours: true, weekday: { open: '00:00', close: '23:59' }, weekend: { open: '00:00', close: '23:59' }, holidays: 'normal' },
      staffCount: 0,
      interactionPoints: [
        { id: 'park-info', name: 'Parking Information', type: 'info-kiosk', position: { x: 50, y: 32, z: 0 }, triggerRadius: 2, animation: 'glow' }
      ],
      storyboardScenes: [
        {
          id: 'park-intro',
          title: 'Visitor Parking',
          description: 'Convenient access',
          voiceoverText: 'Free parking is available for all visitors. Accessible parking spaces are located closest to the main entrance.',
          voiceId: 'professional-male',
          duration: 5000,
          animations: [
            { type: 'fade', target: 'parking', duration: 1000, delay: 0, easing: 'ease-in', params: { opacity: 1 } },
            { type: 'glow', target: 'sign', duration: 1500, delay: 1000, easing: 'ease-in-out', params: { intensity: 0.7 } }
          ],
          effects: [
            { type: 'glow', intensity: 0.3, color: '#60A5FA', duration: 3000 }
          ],
          soundEffects: ['car-engine', 'door-close'],
          cameraMovement: { type: 'zoom', startPosition: { x: 50, y: 20, z: 15 }, endPosition: { x: 50, y: 30, z: 10 }, duration: 4000, easing: 'ease-out' }
        }
      ],
      accessibility: {
        wheelchairAccess: true,
        brailleSignage: true,
        hearingLoop: false,
        guideDogFriendly: true,
        accessibleParking: 15,
        elevatorAccess: false,
        accessibleToilets: false
      }
    });

    // Administration
    this.buildings.set('administration', {
      id: 'administration',
      name: 'Administration Building',
      shortName: 'Admin',
      type: 'administration',
      description: 'Hospital administration, patient services, medical records, and business operations.',
      services: ['Patient Services', 'Medical Records', 'Billing', 'Human Resources', 'Quality & Safety'],
      floors: 2,
      position: {
        x: 70, y: 55, z: 0,
        latitude: -30.7487, longitude: 121.4665,
        rotation: 0
      },
      dimensions: { width: 10, height: 10, depth: 12, roofStyle: 'modern' },
      entrances: [
        { id: 'admin-main', name: 'Admin Entrance', type: 'main', position: { x: 70, y: 50 }, direction: 'south', isAccessible: true, autoOpen: true }
      ],
      color: {
        primary: '#FFFFFF',
        secondary: '#F3F4F6',
        accent: '#6366F1',
        roof: '#4A5568',
        trim: '#6366F1',
        glow: '#818CF8'
      },
      icon: '📋',
      operatingHours: { is24Hours: false, weekday: { open: '08:00', close: '17:00' }, weekend: { open: '00:00', close: '00:00' }, holidays: 'closed' },
      staffCount: 25,
      interactionPoints: [
        { id: 'admin-reception', name: 'Admin Reception', type: 'npc-staff', position: { x: 70, y: 53, z: 0 }, triggerRadius: 2, npcId: 'admin-receptionist', dialogueId: 'admin-welcome', animation: 'wave' }
      ],
      storyboardScenes: [
        {
          id: 'admin-intro',
          title: 'Administration',
          description: 'Supporting your care',
          voiceoverText: 'Our Administration team handles patient services, medical records, and ensures smooth hospital operations to support your healthcare journey.',
          voiceId: 'professional-female',
          duration: 6000,
          animations: [
            { type: 'slide', target: 'building', duration: 1200, delay: 0, easing: 'ease-out', params: { direction: 'left' } },
            { type: 'fade', target: 'sign', duration: 1000, delay: 1200, easing: 'ease-in', params: { opacity: 1 } }
          ],
          effects: [
            { type: 'glow', intensity: 0.3, color: '#818CF8', duration: 4000 }
          ],
          soundEffects: ['office-ambience', 'keyboard-typing'],
          cameraMovement: { type: 'pan', startPosition: { x: 65, y: 55, z: 10 }, endPosition: { x: 75, y: 55, z: 8 }, duration: 4000, easing: 'ease-in-out' }
        }
      ],
      accessibility: {
        wheelchairAccess: true,
        brailleSignage: true,
        hearingLoop: true,
        guideDogFriendly: true,
        accessibleParking: 3,
        elevatorAccess: true,
        accessibleToilets: true
      }
    });
  }

  // ============================================================================
  // PUBLIC API - BUILDING MANAGEMENT
  // ============================================================================

  /**
   * Get all hospital buildings
   */
  getAllBuildings(): HospitalBuilding[] {
    return Array.from(this.buildings.values());
  }

  /**
   * Get building by ID
   */
  getBuilding(id: string): HospitalBuilding | undefined {
    return this.buildings.get(id);
  }

  /**
   * Get buildings by type
   */
  getBuildingsByType(type: BuildingType): HospitalBuilding[] {
    return Array.from(this.buildings.values()).filter(b => b.type === type);
  }

  /**
   * Get hospital location information
   */
  getHospitalLocation(): typeof this.HOSPITAL_LOCATION {
    return { ...this.HOSPITAL_LOCATION };
  }

  /**
   * Get map bounds
   */
  getMapBounds(): typeof this.mapBounds {
    return { ...this.mapBounds };
  }

  // ============================================================================
  // PUBLIC API - AVATAR MANAGEMENT
  // ============================================================================

  /**
   * Create a new avatar
   */
  createAvatar(config: Partial<Avatar>): Avatar {
    const avatar: Avatar = {
      id: config.id || `avatar-${Date.now()}`,
      name: config.name || 'Visitor',
      type: config.type || 'visitor',
      appearance: config.appearance || {
        bodyType: 'adult',
        gender: 'neutral',
        skinTone: '#F5D0C5',
        hairStyle: 'short',
        hairColor: '#4A3728',
        outfit: 'casual',
        accessories: [],
        expression: 'neutral'
      },
      position: config.position || {
        x: 50, y: 35, z: 0,
        rotation: 0,
        floorLevel: 0,
        isIndoors: false
      },
      movement: config.movement || {
        isMoving: false,
        direction: 0,
        speed: 0,
        pathNodes: [],
        currentNodeIndex: 0,
        movementType: 'walk'
      },
      inventory: config.inventory || [],
      companions: config.companions || [],
      stats: config.stats || {
        healthKnowledge: 0,
        questsCompleted: 0,
        buildingsVisited: [],
        distanceTraveled: 0,
        interactionsCount: 0,
        achievementsUnlocked: []
      },
      animations: config.animations || {
        idle: 'idle-breathe',
        walk: 'walk-normal',
        run: 'run-normal',
        wave: 'wave-friendly',
        sit: 'sit-chair',
        interact: 'interact-touch',
        celebrate: 'celebrate-jump',
        confused: 'confused-scratch'
      }
    };

    this.avatars.set(avatar.id, avatar);
    this.emit('avatar-created', avatar);
    return avatar;
  }

  /**
   * Get avatar by ID
   */
  getAvatar(id: string): Avatar | undefined {
    return this.avatars.get(id);
  }

  /**
   * Move avatar to position
   */
  moveAvatarTo(avatarId: string, targetX: number, targetY: number): boolean {
    const avatar = this.avatars.get(avatarId);
    if (!avatar) return false;

    // Calculate path (simplified A* pathfinding)
    const path = this.calculatePath(avatar.position, { x: targetX, y: targetY });
    
    avatar.movement = {
      ...avatar.movement,
      isMoving: true,
      targetPosition: { x: targetX, y: targetY },
      pathNodes: path,
      currentNodeIndex: 0
    };

    this.emit('avatar-moving', { avatarId, path });
    return true;
  }

  /**
   * Teleport avatar to building entrance
   */
  teleportToBuilding(avatarId: string, buildingId: string): boolean {
    const avatar = this.avatars.get(avatarId);
    const building = this.buildings.get(buildingId);
    
    if (!avatar || !building) return false;

    const entrance = building.entrances[0];
    if (!entrance) return false;

    avatar.position = {
      ...avatar.position,
      x: entrance.position.x,
      y: entrance.position.y,
      buildingId: buildingId,
      isIndoors: false
    };

    // Track building visit
    if (!avatar.stats.buildingsVisited.includes(buildingId)) {
      avatar.stats.buildingsVisited.push(buildingId);
    }

    this.emit('avatar-teleported', { avatarId, buildingId });
    return true;
  }

  /**
   * Add companion to avatar
   */
  addCompanion(avatarId: string, companionType: CompanionType, name: string): Companion | null {
    const avatar = this.avatars.get(avatarId);
    if (!avatar) return null;

    const companion: Companion = {
      id: `companion-${Date.now()}`,
      type: companionType,
      name: name,
      appearance: this.getDefaultCompanionAppearance(companionType),
      position: {
        x: avatar.position.x - 1,
        y: avatar.position.y - 1,
        z: 0
      },
      behavior: this.getDefaultCompanionBehavior(companionType),
      animations: ['idle', 'walk', 'happy', 'alert'],
      sounds: ['bark', 'whine', 'happy']
    };

    avatar.companions.push(companion);
    this.emit('companion-added', { avatarId, companion });
    return companion;
  }

  private getDefaultCompanionAppearance(type: CompanionType): CompanionAppearance {
    const appearances: Record<CompanionType, CompanionAppearance> = {
      'therapy-dog': { species: 'Golden Retriever', color: '#D4A574', size: 'medium', accessories: ['therapy-vest'], expression: 'happy' },
      'therapy-cat': { species: 'Tabby Cat', color: '#8B7355', size: 'small', accessories: ['collar'], expression: 'curious' },
      'robot-helper': { species: 'MediBot', color: '#4A90D9', size: 'small', accessories: ['antenna'], expression: 'helpful' },
      'fairy-guide': { species: 'Healing Fairy', color: '#FFB6C1', size: 'small', accessories: ['wings', 'wand'], expression: 'magical' },
      'medical-mascot': { species: 'Dr. Koala', color: '#808080', size: 'medium', accessories: ['stethoscope', 'lab-coat'], expression: 'friendly' },
      'spirit-animal': { species: 'Dreamtime Spirit', color: '#9B59B6', size: 'medium', accessories: ['glow-aura'], expression: 'wise' }
    };
    return appearances[type];
  }

  private getDefaultCompanionBehavior(type: CompanionType): CompanionBehavior {
    return {
      followDistance: 2,
      idleAnimations: ['sit', 'look-around', 'yawn'],
      interactionAnimations: ['approach', 'nuzzle', 'play'],
      sounds: {
        idle: ['ambient-1', 'ambient-2'],
        happy: ['happy-1', 'happy-2'],
        alert: ['alert-1']
      },
      specialAbilities: type === 'robot-helper' ? ['translate', 'navigate', 'remind'] : ['comfort', 'play']
    };
  }

  // ============================================================================
  // PUBLIC API - VR EXPERIENCE
  // ============================================================================

  /**
   * Initialize VR experience
   */
  initializeVRExperience(mode: VRMode = 'immersive'): VRExperience {
    this.activeVRExperience = {
      id: `vr-${Date.now()}`,
      name: 'Kalgoorlie Hospital VR Tour',
      mode: mode,
      settings: {
        renderScale: 1.0,
        fieldOfView: 110,
        interpupillaryDistance: 64,
        refreshRate: 90,
        antiAliasing: 'msaa4x',
        shadowQuality: 'high',
        textureQuality: 'high'
      },
      cameras: [
        { id: 'main-cam', type: 'main', position: { x: 50, y: 50, z: 5 }, rotation: { pitch: 0, yaw: 0, roll: 0 }, fov: 110, nearClip: 0.1, farClip: 1000 },
        { id: 'ui-cam', type: 'ui', position: { x: 0, y: 0, z: 0 }, rotation: { pitch: 0, yaw: 0, roll: 0 }, fov: 60, nearClip: 0.01, farClip: 10 }
      ],
      controllers: [
        {
          id: 'left-controller',
          hand: 'left',
          model: 'generic-controller',
          hapticIntensity: 0.5,
          buttons: [
            { id: 'trigger', name: 'Select', action: 'select', hapticFeedback: true },
            { id: 'grip', name: 'Grab', action: 'grab', hapticFeedback: true },
            { id: 'menu', name: 'Menu', action: 'menu', hapticFeedback: false }
          ],
          gestures: [
            { id: 'point', name: 'Point', type: 'point', action: 'highlight' },
            { id: 'grab', name: 'Grab', type: 'grab', action: 'pickup' }
          ]
        },
        {
          id: 'right-controller',
          hand: 'right',
          model: 'generic-controller',
          hapticIntensity: 0.5,
          buttons: [
            { id: 'trigger', name: 'Select', action: 'select', hapticFeedback: true },
            { id: 'grip', name: 'Grab', action: 'grab', hapticFeedback: true },
            { id: 'a', name: 'Teleport', action: 'teleport', hapticFeedback: true }
          ],
          gestures: [
            { id: 'point', name: 'Point', type: 'point', action: 'highlight' },
            { id: 'thumbsup', name: 'Confirm', type: 'thumbsup', action: 'confirm' }
          ]
        }
      ],
      interactions: [],
      comfortSettings: {
        vignetteOnMove: true,
        vignetteIntensity: 0.3,
        snapTurning: true,
        snapTurnAngle: 45,
        smoothTurnSpeed: 60,
        teleportEnabled: true,
        seatedMode: mode === 'seated',
        heightOffset: 0
      },
      audioConfig: {
        spatialAudio: true,
        ambisonics: true,
        hrtfEnabled: true,
        masterVolume: 0.8,
        environmentVolume: 0.6,
        voiceVolume: 1.0,
        musicVolume: 0.4
      }
    };

    this.emit('vr-initialized', this.activeVRExperience);
    return this.activeVRExperience;
  }

  /**
   * Get active VR experience
   */
  getVRExperience(): VRExperience | null {
    return this.activeVRExperience;
  }

  /**
   * Update VR comfort settings
   */
  updateVRComfortSettings(settings: Partial<ComfortSettings>): void {
    if (this.activeVRExperience) {
      this.activeVRExperience.comfortSettings = {
        ...this.activeVRExperience.comfortSettings,
        ...settings
      };
      this.emit('vr-settings-updated', this.activeVRExperience.comfortSettings);
    }
  }

  // ============================================================================
  // PUBLIC API - RENDERING
  // ============================================================================

  /**
   * Get render configuration
   */
  getRenderConfig(): MapRenderConfig {
    return { ...this.renderConfig };
  }

  /**
   * Update render style
   */
  setRenderStyle(style: Partial<RenderStyle>): void {
    this.renderConfig.style = { ...this.renderConfig.style, ...style };
    this.emit('render-style-changed', this.renderConfig.style);
  }

  /**
   * Set time of day
   */
  setTimeOfDay(hour: number, minute: number = 0): void {
    this.renderConfig.timeOfDay.hour = Math.max(0, Math.min(23, hour));
    this.renderConfig.timeOfDay.minute = Math.max(0, Math.min(59, minute));
    this.emit('time-changed', this.renderConfig.timeOfDay);
  }

  /**
   * Set weather
   */
  setWeather(type: WeatherConfig['type'], intensity: number = 0.5): void {
    this.renderConfig.weather.type = type;
    this.renderConfig.weather.intensity = Math.max(0, Math.min(1, intensity));
    
    // Add weather particles based on type
    const particles: WeatherParticle[] = [];
    switch (type) {
      case 'rain':
        particles.push({ type: 'raindrop', count: 500 * intensity, speed: 15, size: 2, color: '#87CEEB' });
        break;
      case 'dust':
        particles.push({ type: 'dust', count: 200 * intensity, speed: 5, size: 3, color: '#D2691E' });
        break;
      case 'cloudy':
        particles.push({ type: 'cloud', count: 10 * intensity, speed: 1, size: 50, color: '#FFFFFF' });
        break;
    }
    this.renderConfig.weather.particles = particles;
    
    this.emit('weather-changed', this.renderConfig.weather);
  }

  // ============================================================================
  // PUBLIC API - STORYBOARD
  // ============================================================================

  /**
   * Play storyboard scene for a building
   */
  playBuildingStoryboard(buildingId: string, sceneId?: string): StoryboardScene | null {
    const building = this.buildings.get(buildingId);
    if (!building || building.storyboardScenes.length === 0) return null;

    const scene = sceneId 
      ? building.storyboardScenes.find(s => s.id === sceneId)
      : building.storyboardScenes[0];

    if (scene) {
      this.emit('storyboard-play', { buildingId, scene });
    }

    return scene || null;
  }

  /**
   * Get all storyboard scenes
   */
  getAllStoryboardScenes(): { buildingId: string; scenes: StoryboardScene[] }[] {
    return Array.from(this.buildings.entries()).map(([id, building]) => ({
      buildingId: id,
      scenes: building.storyboardScenes
    }));
  }

  // ============================================================================
  // PUBLIC API - INTERACTIONS
  // ============================================================================

  /**
   * Get interaction points near position
   */
  getInteractionPointsNear(x: number, y: number, radius: number = 5): InteractionPoint[] {
    const points: InteractionPoint[] = [];
    
    for (const building of this.buildings.values()) {
      for (const point of building.interactionPoints) {
        const distance = Math.sqrt(
          Math.pow(point.position.x - x, 2) + 
          Math.pow(point.position.y - y, 2)
        );
        if (distance <= radius) {
          points.push(point);
        }
      }
    }
    
    return points;
  }

  /**
   * Trigger interaction
   */
  triggerInteraction(avatarId: string, interactionPointId: string): boolean {
    const avatar = this.avatars.get(avatarId);
    if (!avatar) return false;

    // Find the interaction point
    for (const building of this.buildings.values()) {
      const point = building.interactionPoints.find(p => p.id === interactionPointId);
      if (point) {
        avatar.stats.interactionsCount++;
        this.emit('interaction-triggered', { avatarId, point, buildingId: building.id });
        return true;
      }
    }

    return false;
  }

  // ============================================================================
  // PATHFINDING
  // ============================================================================

  private calculatePath(
    start: { x: number; y: number },
    end: { x: number; y: number }
  ): PathNode[] {
    // Simplified pathfinding - in production, use A* with obstacle avoidance
    const path: PathNode[] = [];
    
    // Direct path with intermediate nodes
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    
    for (let i = 0; i <= steps; i++) {
      path.push({
        x: start.x + (dx * i / steps),
        y: start.y + (dy * i / steps),
        z: 0
      });
    }
    
    return path;
  }

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // ============================================================================
  // EXPORT / SERIALIZATION
  // ============================================================================

  /**
   * Export map data for rendering
   */
  exportMapData(): {
    buildings: HospitalBuilding[];
    bounds: typeof this.mapBounds;
    location: typeof this.HOSPITAL_LOCATION;
    renderConfig: MapRenderConfig;
  } {
    return {
      buildings: this.getAllBuildings(),
      bounds: this.getMapBounds(),
      location: this.getHospitalLocation(),
      renderConfig: this.getRenderConfig()
    };
  }

  /**
   * Get map statistics
   */
  getMapStatistics(): {
    totalBuildings: number;
    totalBeds: number;
    totalStaff: number;
    totalInteractionPoints: number;
    totalStoryboardScenes: number;
    buildingTypes: Record<string, number>;
  } {
    const buildings = this.getAllBuildings();
    const buildingTypes: Record<string, number> = {};
    
    buildings.forEach(b => {
      buildingTypes[b.type] = (buildingTypes[b.type] || 0) + 1;
    });

    return {
      totalBuildings: buildings.length,
      totalBeds: 106, // Kalgoorlie Health Campus has 106 beds
      totalStaff: buildings.reduce((sum, b) => sum + b.staffCount, 0),
      totalInteractionPoints: buildings.reduce((sum, b) => sum + b.interactionPoints.length, 0),
      totalStoryboardScenes: buildings.reduce((sum, b) => sum + b.storyboardScenes.length, 0),
      buildingTypes
    };
  }
}

// Export singleton instance
export const kalgoorlieHospitalMapService = new KalgoorlieHospitalMapService();
