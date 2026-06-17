/**
 * Storyboard Map Popup Service
 * 
 * Creates interactive popup storyboards that emerge from map locations
 * with maximum visual effects, animations, and immersive features.
 * 
 * Features:
 * - Department information cards with animations
 * - Staff introduction sequences
 * - Service description popups
 * - Appointment booking from map
 * - Emergency information overlays
 * - Wayfinding assistance
 * - Multilingual support
 * - Accessibility information
 */

// ============================================================================
// POPUP TYPES
// ============================================================================

export interface MapPopup {
  id: string;
  type: PopupType;
  title: string;
  subtitle?: string;
  content: PopupContent;
  position: PopupPosition;
  animation: PopupAnimation;
  effects: PopupEffect[];
  audio: PopupAudio;
  interaction: PopupInteraction;
  style: PopupStyle;
  accessibility: PopupAccessibility;
  metadata: PopupMetadata;
}

export type PopupType = 
  | 'department-info'
  | 'staff-intro'
  | 'service-description'
  | 'appointment-booking'
  | 'emergency-info'
  | 'wayfinding'
  | 'accessibility-info'
  | 'quest-objective'
  | 'achievement'
  | 'notification'
  | 'tutorial';

export interface PopupContent {
  header: ContentHeader;
  body: ContentBody;
  footer: ContentFooter;
  media?: ContentMedia;
  actions: ContentAction[];
}

export interface ContentHeader {
  icon: string;
  title: string;
  subtitle?: string;
  badge?: string;
  color: string;
}

export interface ContentBody {
  type: 'text' | 'list' | 'grid' | 'carousel' | 'form' | 'map-preview';
  text?: string;
  items?: ContentItem[];
  form?: FormField[];
  mapPreview?: MapPreviewConfig;
}

export interface ContentItem {
  id: string;
  icon?: string;
  title: string;
  description?: string;
  value?: string;
  action?: string;
  highlighted?: boolean;
}

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'date' | 'time' | 'select' | 'checkbox';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  value?: string;
}

export interface MapPreviewConfig {
  center: { x: number; y: number };
  zoom: number;
  markers: MapMarker[];
  route?: RouteConfig;
}

export interface MapMarker {
  position: { x: number; y: number };
  icon: string;
  label: string;
  type: 'start' | 'end' | 'waypoint' | 'poi';
}

export interface RouteConfig {
  points: { x: number; y: number }[];
  color: string;
  animated: boolean;
}

export interface ContentFooter {
  text?: string;
  links?: FooterLink[];
  disclaimer?: string;
}

export interface FooterLink {
  text: string;
  action: string;
  icon?: string;
}

export interface ContentMedia {
  type: 'image' | 'video' | 'avatar' | 'animation' | '3d-model';
  source: string;
  alt?: string;
  autoplay?: boolean;
  loop?: boolean;
  controls?: boolean;
}

export interface ContentAction {
  id: string;
  label: string;
  icon?: string;
  type: 'primary' | 'secondary' | 'danger' | 'success';
  action: string;
  disabled?: boolean;
  loading?: boolean;
}

export interface PopupPosition {
  x: number;
  y: number;
  z: number;
  anchor: 'top' | 'bottom' | 'left' | 'right' | 'center';
  offset: { x: number; y: number };
  followAvatar: boolean;
  worldSpace: boolean;
}

export interface PopupAnimation {
  entrance: AnimationConfig;
  exit: AnimationConfig;
  idle: AnimationConfig[];
  highlight: AnimationConfig;
}

export interface AnimationConfig {
  type: AnimationType;
  duration: number;
  delay: number;
  easing: string;
  params: Record<string, number | string>;
}

export type AnimationType = 
  | 'fade'
  | 'scale'
  | 'slide'
  | 'bounce'
  | 'rotate'
  | 'flip'
  | 'shake'
  | 'pulse'
  | 'glow'
  | 'morph'
  | 'explode'
  | 'implode'
  | 'spiral'
  | 'wave';

export interface PopupEffect {
  type: EffectType;
  intensity: number;
  color: string;
  duration: number;
  trigger: 'entrance' | 'exit' | 'hover' | 'click' | 'continuous';
}

export type EffectType = 
  | 'particles'
  | 'sparkle'
  | 'glow'
  | 'shadow'
  | 'blur'
  | 'ripple'
  | 'confetti'
  | 'fireworks'
  | 'smoke'
  | 'lightning'
  | 'rainbow'
  | 'hologram';

export interface PopupAudio {
  entrance?: AudioConfig;
  exit?: AudioConfig;
  hover?: AudioConfig;
  click?: AudioConfig;
  ambient?: AudioConfig;
  voiceover?: VoiceoverConfig;
}

export interface AudioConfig {
  source: string;
  volume: number;
  loop: boolean;
  spatial: boolean;
}

export interface VoiceoverConfig {
  text: string;
  voice: string;
  language: string;
  autoPlay: boolean;
  delay: number;
}

export interface PopupInteraction {
  dismissible: boolean;
  dismissMethods: ('tap-outside' | 'swipe' | 'button' | 'timeout')[];
  timeout?: number;
  draggable: boolean;
  resizable: boolean;
  focusable: boolean;
  keyboardNav: boolean;
}

export interface PopupStyle {
  theme: 'light' | 'dark' | 'medical' | 'jedi' | 'emergency' | 'custom';
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  shadow: ShadowConfig;
  blur: number;
  opacity: number;
  width: number | 'auto';
  maxWidth: number;
  maxHeight: number;
}

export interface ShadowConfig {
  color: string;
  blur: number;
  spread: number;
  offset: { x: number; y: number };
}

export interface PopupAccessibility {
  ariaLabel: string;
  ariaDescription: string;
  role: string;
  tabIndex: number;
  screenReaderText: string;
  highContrastMode: boolean;
  reducedMotion: boolean;
}

export interface PopupMetadata {
  buildingId?: string;
  departmentId?: string;
  staffId?: string;
  questId?: string;
  language: string;
  version: string;
  lastUpdated: string;
}

// ============================================================================
// POPUP TEMPLATES
// ============================================================================

export const POPUP_TEMPLATES: Record<string, Partial<MapPopup>> = {
  'department-info': {
    type: 'department-info',
    animation: {
      entrance: { type: 'scale', duration: 400, delay: 0, easing: 'ease-out', params: { from: 0.5, to: 1 } },
      exit: { type: 'fade', duration: 300, delay: 0, easing: 'ease-in', params: { from: 1, to: 0 } },
      idle: [{ type: 'pulse', duration: 2000, delay: 0, easing: 'ease-in-out', params: { scale: 1.02 } }],
      highlight: { type: 'glow', duration: 500, delay: 0, easing: 'ease-out', params: { intensity: 1.5 } }
    },
    effects: [
      { type: 'glow', intensity: 0.3, color: '#00B4D8', duration: 2000, trigger: 'entrance' },
      { type: 'sparkle', intensity: 0.2, color: '#FFD700', duration: 1500, trigger: 'entrance' }
    ],
    style: {
      theme: 'medical',
      backgroundColor: '#FFFFFF',
      borderColor: '#0077B6',
      borderWidth: 2,
      borderRadius: 16,
      shadow: { color: 'rgba(0, 119, 182, 0.3)', blur: 20, spread: 0, offset: { x: 0, y: 8 } },
      blur: 0,
      opacity: 0.98,
      width: 350,
      maxWidth: 400,
      maxHeight: 500
    }
  },

  'staff-intro': {
    type: 'staff-intro',
    animation: {
      entrance: { type: 'slide', duration: 500, delay: 0, easing: 'ease-out', params: { direction: 'up', distance: 50 } },
      exit: { type: 'slide', duration: 400, delay: 0, easing: 'ease-in', params: { direction: 'down', distance: 50 } },
      idle: [{ type: 'wave', duration: 3000, delay: 0, easing: 'ease-in-out', params: { amplitude: 3 } }],
      highlight: { type: 'bounce', duration: 400, delay: 0, easing: 'ease-out', params: { height: 10 } }
    },
    effects: [
      { type: 'particles', intensity: 0.4, color: '#4CAF50', duration: 2000, trigger: 'entrance' },
      { type: 'ripple', intensity: 0.3, color: '#81C784', duration: 1000, trigger: 'hover' }
    ],
    style: {
      theme: 'light',
      backgroundColor: '#F5F5F5',
      borderColor: '#4CAF50',
      borderWidth: 2,
      borderRadius: 20,
      shadow: { color: 'rgba(76, 175, 80, 0.25)', blur: 15, spread: 0, offset: { x: 0, y: 6 } },
      blur: 0,
      opacity: 0.98,
      width: 320,
      maxWidth: 380,
      maxHeight: 450
    }
  },

  'emergency-info': {
    type: 'emergency-info',
    animation: {
      entrance: { type: 'explode', duration: 300, delay: 0, easing: 'ease-out', params: { scale: 1.2 } },
      exit: { type: 'implode', duration: 250, delay: 0, easing: 'ease-in', params: { scale: 0.8 } },
      idle: [{ type: 'pulse', duration: 1000, delay: 0, easing: 'ease-in-out', params: { scale: 1.05 } }],
      highlight: { type: 'shake', duration: 300, delay: 0, easing: 'linear', params: { intensity: 5 } }
    },
    effects: [
      { type: 'glow', intensity: 0.6, color: '#DC2626', duration: 1000, trigger: 'continuous' },
      { type: 'lightning', intensity: 0.3, color: '#FFFFFF', duration: 500, trigger: 'entrance' }
    ],
    style: {
      theme: 'emergency',
      backgroundColor: '#FEE2E2',
      borderColor: '#DC2626',
      borderWidth: 3,
      borderRadius: 12,
      shadow: { color: 'rgba(220, 38, 38, 0.4)', blur: 25, spread: 5, offset: { x: 0, y: 0 } },
      blur: 0,
      opacity: 1,
      width: 380,
      maxWidth: 420,
      maxHeight: 400
    }
  },

  'wayfinding': {
    type: 'wayfinding',
    animation: {
      entrance: { type: 'fade', duration: 400, delay: 0, easing: 'ease-out', params: { from: 0, to: 1 } },
      exit: { type: 'fade', duration: 300, delay: 0, easing: 'ease-in', params: { from: 1, to: 0 } },
      idle: [],
      highlight: { type: 'glow', duration: 400, delay: 0, easing: 'ease-out', params: { intensity: 1.3 } }
    },
    effects: [
      { type: 'ripple', intensity: 0.4, color: '#3B82F6', duration: 1500, trigger: 'entrance' }
    ],
    style: {
      theme: 'light',
      backgroundColor: '#EFF6FF',
      borderColor: '#3B82F6',
      borderWidth: 2,
      borderRadius: 16,
      shadow: { color: 'rgba(59, 130, 246, 0.2)', blur: 15, spread: 0, offset: { x: 0, y: 5 } },
      blur: 0,
      opacity: 0.98,
      width: 400,
      maxWidth: 450,
      maxHeight: 600
    }
  },

  'achievement': {
    type: 'achievement',
    animation: {
      entrance: { type: 'spiral', duration: 600, delay: 0, easing: 'ease-out', params: { rotations: 2 } },
      exit: { type: 'scale', duration: 400, delay: 0, easing: 'ease-in', params: { from: 1, to: 0 } },
      idle: [{ type: 'glow', duration: 2000, delay: 0, easing: 'ease-in-out', params: { intensity: 1.2 } }],
      highlight: { type: 'bounce', duration: 500, delay: 0, easing: 'ease-out', params: { height: 15 } }
    },
    effects: [
      { type: 'confetti', intensity: 0.8, color: '#FFD700', duration: 3000, trigger: 'entrance' },
      { type: 'fireworks', intensity: 0.5, color: '#FF6B6B', duration: 2000, trigger: 'entrance' },
      { type: 'sparkle', intensity: 0.6, color: '#FFFFFF', duration: 2500, trigger: 'continuous' }
    ],
    style: {
      theme: 'jedi',
      backgroundColor: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
      borderColor: '#FFD700',
      borderWidth: 3,
      borderRadius: 20,
      shadow: { color: 'rgba(255, 215, 0, 0.4)', blur: 30, spread: 5, offset: { x: 0, y: 0 } },
      blur: 0,
      opacity: 1,
      width: 340,
      maxWidth: 380,
      maxHeight: 400
    }
  }
};

// ============================================================================
// STORYBOARD MAP POPUP SERVICE
// ============================================================================

export class StoryboardMapPopupService {
  private activePopups: Map<string, MapPopup> = new Map();
  private popupQueue: MapPopup[] = [];
  private eventListeners: Map<string, Function[]> = new Map();
  private maxConcurrentPopups: number = 3;
  private defaultLanguage: string = 'en';

  constructor() {
    // Initialize with default settings
  }

  // ============================================================================
  // POPUP CREATION
  // ============================================================================

  /**
   * Create department info popup
   */
  createDepartmentPopup(
    buildingId: string,
    departmentName: string,
    services: string[],
    operatingHours: { weekday: string; weekend: string },
    position: { x: number; y: number }
  ): MapPopup {
    const template = POPUP_TEMPLATES['department-info'];
    
    const popup: MapPopup = {
      id: `popup-dept-${buildingId}-${Date.now()}`,
      type: 'department-info',
      title: departmentName,
      subtitle: 'Department Information',
      content: {
        header: {
          icon: this.getDepartmentIcon(buildingId),
          title: departmentName,
          subtitle: 'Kalgoorlie Health Campus',
          color: '#0077B6'
        },
        body: {
          type: 'list',
          items: [
            { id: 'services', icon: '🏥', title: 'Services', description: services.join(', ') },
            { id: 'hours-weekday', icon: '📅', title: 'Weekday Hours', value: operatingHours.weekday },
            { id: 'hours-weekend', icon: '📅', title: 'Weekend Hours', value: operatingHours.weekend }
          ]
        },
        footer: {
          text: 'Tap for more information',
          links: [
            { text: 'Get Directions', action: 'navigate', icon: '🧭' },
            { text: 'Book Appointment', action: 'book', icon: '📋' }
          ]
        },
        actions: [
          { id: 'navigate', label: 'Navigate Here', icon: '🚶', type: 'primary', action: 'navigate-to-building' },
          { id: 'info', label: 'More Info', icon: 'ℹ️', type: 'secondary', action: 'show-details' }
        ]
      },
      position: {
        x: position.x,
        y: position.y,
        z: 10,
        anchor: 'bottom',
        offset: { x: 0, y: -20 },
        followAvatar: false,
        worldSpace: true
      },
      animation: template.animation!,
      effects: template.effects!,
      audio: {
        entrance: { source: 'popup-open', volume: 0.5, loop: false, spatial: true },
        exit: { source: 'popup-close', volume: 0.4, loop: false, spatial: true },
        hover: { source: 'hover-tick', volume: 0.2, loop: false, spatial: false }
      },
      interaction: {
        dismissible: true,
        dismissMethods: ['tap-outside', 'swipe', 'button'],
        draggable: true,
        resizable: false,
        focusable: true,
        keyboardNav: true
      },
      style: template.style!,
      accessibility: {
        ariaLabel: `${departmentName} department information`,
        ariaDescription: `Information about ${departmentName} including services and operating hours`,
        role: 'dialog',
        tabIndex: 0,
        screenReaderText: `${departmentName}. Services: ${services.join(', ')}. Weekday hours: ${operatingHours.weekday}. Weekend hours: ${operatingHours.weekend}.`,
        highContrastMode: false,
        reducedMotion: false
      },
      metadata: {
        buildingId,
        language: this.defaultLanguage,
        version: '1.0',
        lastUpdated: new Date().toISOString()
      }
    };

    return popup;
  }

  /**
   * Create staff introduction popup
   */
  createStaffPopup(
    staffId: string,
    name: string,
    role: string,
    department: string,
    bio: string,
    avatar: string,
    position: { x: number; y: number }
  ): MapPopup {
    const template = POPUP_TEMPLATES['staff-intro'];

    const popup: MapPopup = {
      id: `popup-staff-${staffId}-${Date.now()}`,
      type: 'staff-intro',
      title: name,
      subtitle: role,
      content: {
        header: {
          icon: '👨‍⚕️',
          title: name,
          subtitle: role,
          badge: department,
          color: '#4CAF50'
        },
        body: {
          type: 'text',
          text: bio
        },
        footer: {
          text: 'Welcome to Kalgoorlie Health Campus!'
        },
        media: {
          type: 'avatar',
          source: avatar,
          alt: `Photo of ${name}`
        },
        actions: [
          { id: 'greet', label: 'Say Hello', icon: '👋', type: 'primary', action: 'greet-staff' },
          { id: 'ask', label: 'Ask Question', icon: '❓', type: 'secondary', action: 'ask-question' }
        ]
      },
      position: {
        x: position.x,
        y: position.y,
        z: 10,
        anchor: 'bottom',
        offset: { x: 0, y: -15 },
        followAvatar: false,
        worldSpace: true
      },
      animation: template.animation!,
      effects: template.effects!,
      audio: {
        entrance: { source: 'staff-greeting', volume: 0.6, loop: false, spatial: true },
        voiceover: {
          text: `Hello! I'm ${name}, ${role} here at ${department}. How can I help you today?`,
          voice: 'friendly-female',
          language: 'en',
          autoPlay: true,
          delay: 500
        }
      },
      interaction: {
        dismissible: true,
        dismissMethods: ['tap-outside', 'button'],
        draggable: false,
        resizable: false,
        focusable: true,
        keyboardNav: true
      },
      style: template.style!,
      accessibility: {
        ariaLabel: `Staff member ${name}`,
        ariaDescription: `${name} is a ${role} in ${department}`,
        role: 'dialog',
        tabIndex: 0,
        screenReaderText: `${name}, ${role} in ${department}. ${bio}`,
        highContrastMode: false,
        reducedMotion: false
      },
      metadata: {
        staffId,
        departmentId: department,
        language: this.defaultLanguage,
        version: '1.0',
        lastUpdated: new Date().toISOString()
      }
    };

    return popup;
  }

  /**
   * Create emergency info popup
   */
  createEmergencyPopup(
    emergencyType: string,
    instructions: string[],
    contactNumber: string,
    position: { x: number; y: number }
  ): MapPopup {
    const template = POPUP_TEMPLATES['emergency-info'];

    const popup: MapPopup = {
      id: `popup-emergency-${Date.now()}`,
      type: 'emergency-info',
      title: '⚠️ EMERGENCY',
      subtitle: emergencyType,
      content: {
        header: {
          icon: '🚨',
          title: 'EMERGENCY INFORMATION',
          subtitle: emergencyType,
          color: '#DC2626'
        },
        body: {
          type: 'list',
          items: instructions.map((instruction, index) => ({
            id: `step-${index}`,
            icon: `${index + 1}️⃣`,
            title: instruction,
            highlighted: index === 0
          }))
        },
        footer: {
          text: `Emergency Contact: ${contactNumber}`,
          disclaimer: 'For life-threatening emergencies, call 000 immediately'
        },
        actions: [
          { id: 'call', label: 'Call Emergency', icon: '📞', type: 'danger', action: 'call-emergency' },
          { id: 'navigate', label: 'Go to ED', icon: '🏃', type: 'primary', action: 'navigate-emergency' }
        ]
      },
      position: {
        x: position.x,
        y: position.y,
        z: 100, // High z-index for emergency
        anchor: 'center',
        offset: { x: 0, y: 0 },
        followAvatar: true,
        worldSpace: false
      },
      animation: template.animation!,
      effects: template.effects!,
      audio: {
        entrance: { source: 'emergency-alert', volume: 0.8, loop: false, spatial: false },
        ambient: { source: 'emergency-pulse', volume: 0.3, loop: true, spatial: false },
        voiceover: {
          text: `Emergency alert. ${emergencyType}. ${instructions[0]}`,
          voice: 'urgent-male',
          language: 'en',
          autoPlay: true,
          delay: 0
        }
      },
      interaction: {
        dismissible: false,
        dismissMethods: ['button'],
        timeout: undefined,
        draggable: false,
        resizable: false,
        focusable: true,
        keyboardNav: true
      },
      style: template.style!,
      accessibility: {
        ariaLabel: 'Emergency information',
        ariaDescription: `Emergency: ${emergencyType}. Follow the instructions provided.`,
        role: 'alertdialog',
        tabIndex: 0,
        screenReaderText: `Emergency alert. ${emergencyType}. ${instructions.join('. ')}. Contact: ${contactNumber}`,
        highContrastMode: true,
        reducedMotion: true
      },
      metadata: {
        language: this.defaultLanguage,
        version: '1.0',
        lastUpdated: new Date().toISOString()
      }
    };

    return popup;
  }

  /**
   * Create wayfinding popup
   */
  createWayfindingPopup(
    destination: string,
    route: { x: number; y: number }[],
    distance: number,
    estimatedTime: number,
    position: { x: number; y: number }
  ): MapPopup {
    const template = POPUP_TEMPLATES['wayfinding'];

    const popup: MapPopup = {
      id: `popup-wayfinding-${Date.now()}`,
      type: 'wayfinding',
      title: 'Navigation',
      subtitle: `To: ${destination}`,
      content: {
        header: {
          icon: '🧭',
          title: 'Directions',
          subtitle: destination,
          color: '#3B82F6'
        },
        body: {
          type: 'map-preview',
          mapPreview: {
            center: { x: route[0]?.x || 50, y: route[0]?.y || 50 },
            zoom: 1.5,
            markers: [
              { position: route[0], icon: '📍', label: 'You are here', type: 'start' },
              { position: route[route.length - 1], icon: '🎯', label: destination, type: 'end' }
            ],
            route: {
              points: route,
              color: '#3B82F6',
              animated: true
            }
          }
        },
        footer: {
          text: `${Math.round(distance)}m • ${Math.ceil(estimatedTime / 60)} min walk`
        },
        actions: [
          { id: 'start', label: 'Start Navigation', icon: '▶️', type: 'primary', action: 'start-navigation' },
          { id: 'cancel', label: 'Cancel', icon: '✖️', type: 'secondary', action: 'cancel-navigation' }
        ]
      },
      position: {
        x: position.x,
        y: position.y,
        z: 15,
        anchor: 'center',
        offset: { x: 0, y: 0 },
        followAvatar: false,
        worldSpace: false
      },
      animation: template.animation!,
      effects: template.effects!,
      audio: {
        entrance: { source: 'navigation-start', volume: 0.5, loop: false, spatial: false },
        voiceover: {
          text: `Directions to ${destination}. Distance: ${Math.round(distance)} meters. Estimated time: ${Math.ceil(estimatedTime / 60)} minutes.`,
          voice: 'professional-female',
          language: 'en',
          autoPlay: true,
          delay: 300
        }
      },
      interaction: {
        dismissible: true,
        dismissMethods: ['tap-outside', 'button'],
        draggable: true,
        resizable: false,
        focusable: true,
        keyboardNav: true
      },
      style: template.style!,
      accessibility: {
        ariaLabel: 'Navigation directions',
        ariaDescription: `Directions to ${destination}`,
        role: 'dialog',
        tabIndex: 0,
        screenReaderText: `Navigation to ${destination}. Distance: ${Math.round(distance)} meters. Estimated walking time: ${Math.ceil(estimatedTime / 60)} minutes.`,
        highContrastMode: false,
        reducedMotion: false
      },
      metadata: {
        language: this.defaultLanguage,
        version: '1.0',
        lastUpdated: new Date().toISOString()
      }
    };

    return popup;
  }

  /**
   * Create achievement popup
   */
  createAchievementPopup(
    achievementId: string,
    title: string,
    description: string,
    icon: string,
    reward: string,
    position: { x: number; y: number }
  ): MapPopup {
    const template = POPUP_TEMPLATES['achievement'];

    const popup: MapPopup = {
      id: `popup-achievement-${achievementId}-${Date.now()}`,
      type: 'achievement',
      title: '🏆 Achievement Unlocked!',
      subtitle: title,
      content: {
        header: {
          icon: icon,
          title: title,
          subtitle: 'Achievement Unlocked!',
          badge: '⭐ NEW',
          color: '#FFD700'
        },
        body: {
          type: 'text',
          text: description
        },
        footer: {
          text: `Reward: ${reward}`
        },
        media: {
          type: 'animation',
          source: 'achievement-glow',
          autoplay: true,
          loop: true
        },
        actions: [
          { id: 'claim', label: 'Claim Reward', icon: '🎁', type: 'primary', action: 'claim-reward' },
          { id: 'share', label: 'Share', icon: '📤', type: 'secondary', action: 'share-achievement' }
        ]
      },
      position: {
        x: position.x,
        y: position.y,
        z: 50,
        anchor: 'center',
        offset: { x: 0, y: 0 },
        followAvatar: false,
        worldSpace: false
      },
      animation: template.animation!,
      effects: template.effects!,
      audio: {
        entrance: { source: 'achievement-fanfare', volume: 0.7, loop: false, spatial: false },
        voiceover: {
          text: `Congratulations! You've unlocked the ${title} achievement! ${description}`,
          voice: 'excited-female',
          language: 'en',
          autoPlay: true,
          delay: 500
        }
      },
      interaction: {
        dismissible: true,
        dismissMethods: ['button', 'timeout'],
        timeout: 10000,
        draggable: false,
        resizable: false,
        focusable: true,
        keyboardNav: true
      },
      style: template.style!,
      accessibility: {
        ariaLabel: 'Achievement unlocked',
        ariaDescription: `You've unlocked the ${title} achievement`,
        role: 'alert',
        tabIndex: 0,
        screenReaderText: `Achievement unlocked! ${title}. ${description}. Reward: ${reward}`,
        highContrastMode: false,
        reducedMotion: false
      },
      metadata: {
        questId: achievementId,
        language: this.defaultLanguage,
        version: '1.0',
        lastUpdated: new Date().toISOString()
      }
    };

    return popup;
  }

  // ============================================================================
  // POPUP MANAGEMENT
  // ============================================================================

  /**
   * Show popup
   */
  showPopup(popup: MapPopup): void {
    // Check max concurrent popups
    if (this.activePopups.size >= this.maxConcurrentPopups) {
      this.popupQueue.push(popup);
      return;
    }

    this.activePopups.set(popup.id, popup);
    this.emit('popup-shown', popup);

    // Handle timeout dismissal
    if (popup.interaction.timeout) {
      setTimeout(() => {
        this.dismissPopup(popup.id);
      }, popup.interaction.timeout);
    }
  }

  /**
   * Dismiss popup
   */
  dismissPopup(popupId: string): void {
    const popup = this.activePopups.get(popupId);
    if (popup) {
      this.activePopups.delete(popupId);
      this.emit('popup-dismissed', popup);

      // Show next queued popup
      if (this.popupQueue.length > 0) {
        const nextPopup = this.popupQueue.shift()!;
        this.showPopup(nextPopup);
      }
    }
  }

  /**
   * Dismiss all popups
   */
  dismissAllPopups(): void {
    for (const [id] of this.activePopups) {
      this.dismissPopup(id);
    }
    this.popupQueue = [];
  }

  /**
   * Get active popups
   */
  getActivePopups(): MapPopup[] {
    return Array.from(this.activePopups.values());
  }

  /**
   * Get popup by ID
   */
  getPopup(popupId: string): MapPopup | undefined {
    return this.activePopups.get(popupId);
  }

  // ============================================================================
  // POPUP ACTIONS
  // ============================================================================

  /**
   * Handle popup action
   */
  handleAction(popupId: string, actionId: string): void {
    const popup = this.activePopups.get(popupId);
    if (!popup) return;

    const action = popup.content.actions.find(a => a.id === actionId);
    if (!action || action.disabled) return;

    this.emit('popup-action', { popup, action });
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private getDepartmentIcon(buildingId: string): string {
    const icons: Record<string, string> = {
      'main-hospital': '🏥',
      'emergency': '🚨',
      'maternity': '👶',
      'paediatrics': '🧸',
      'mental-health': '🧠',
      'pathology': '🔬',
      'physiotherapy': '🏃',
      'radiology': '📷',
      'pharmacy': '💊',
      'surgical': '🏥',
      'medical': '🩺',
      'cafeteria': '☕',
      'chapel': '🕊️',
      'garden': '🌿',
      'helipad': '🚁',
      'parking': '🅿️',
      'administration': '📋'
    };
    return icons[buildingId] || '🏥';
  }

  /**
   * Set default language
   */
  setLanguage(language: string): void {
    this.defaultLanguage = language;
  }

  /**
   * Set max concurrent popups
   */
  setMaxConcurrentPopups(max: number): void {
    this.maxConcurrentPopups = Math.max(1, max);
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

  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
}

// Export singleton instance
export const storyboardMapPopupService = new StoryboardMapPopupService();
