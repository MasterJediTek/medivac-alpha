/**
 * Smartwatch Face Designer Service
 * MediVac WACHS v8.7
 * 
 * Visual watch face editor with drag-and-drop complications,
 * animated previews, color themes, and JEDI-styled designs.
 */

export type WatchFaceStyle = 'analog' | 'digital' | 'hybrid' | 'infograph' | 'modular' | 'jedi-classic' | 'jedi-hologram';
export type ComplicationType = 
  | 'time' | 'date' | 'day' | 'month' | 'year' | 'weekday'
  | 'heart-rate' | 'steps' | 'calories' | 'distance' | 'blood-oxygen' | 'temperature'
  | 'battery' | 'weather' | 'uv-index' | 'air-quality'
  | 'next-event' | 'countdown' | 'medication' | 'task-count'
  | 'sunrise-sunset' | 'moon-phase' | 'world-clock' | 'stopwatch' | 'timer'
  | 'music-control' | 'phone-battery' | 'notifications' | 'activity-rings'
  | 'jedi-force-meter' | 'jedi-mission-status' | 'jedi-comm-status';

export type ComplicationSize = 'small' | 'medium' | 'large' | 'extra-large';
export type ComplicationShape = 'circular' | 'rectangular' | 'rounded' | 'gauge' | 'ring' | 'text-only';
export type HandStyle = 'classic' | 'modern' | 'thin' | 'bold' | 'sword' | 'lightsaber' | 'arrow' | 'dot';
export type TickStyle = 'lines' | 'dots' | 'numbers' | 'roman' | 'none' | 'jedi-symbols';

export interface WatchFace {
  id: string;
  name: string;
  style: WatchFaceStyle;
  backgroundColor: string;
  backgroundImage?: string;
  backgroundPattern?: BackgroundPattern;
  complications: Complication[];
  analogConfig?: AnalogConfig;
  digitalConfig?: DigitalConfig;
  animations: FaceAnimations;
  colors: ColorTheme;
  createdAt: number;
  updatedAt: number;
  isDefault: boolean;
  isCustom: boolean;
  previewUrl?: string;
}

export interface Complication {
  id: string;
  type: ComplicationType;
  position: ComplicationPosition;
  size: ComplicationSize;
  shape: ComplicationShape;
  style: ComplicationStyle;
  data?: ComplicationData;
  animation?: ComplicationAnimation;
  tapAction?: TapAction;
}

export interface ComplicationPosition {
  zone: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'bezel';
  x: number;
  y: number;
  rotation: number;
}

export interface ComplicationStyle {
  backgroundColor: string;
  foregroundColor: string;
  accentColor: string;
  borderColor: string;
  borderWidth: number;
  opacity: number;
  blur: number;
  glow: boolean;
  glowColor: string;
  glowIntensity: number;
  shadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  font: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | 'light';
}

export interface ComplicationData {
  value: string | number;
  unit?: string;
  min?: number;
  max?: number;
  progress?: number;
  icon?: string;
  label?: string;
  secondaryValue?: string;
}

export interface ComplicationAnimation {
  type: 'pulse' | 'glow' | 'rotate' | 'bounce' | 'fade' | 'scale' | 'shake' | 'none';
  duration: number;
  delay: number;
  repeat: boolean;
  trigger: 'always' | 'on-update' | 'on-tap' | 'on-alert';
}

export interface TapAction {
  type: 'open-app' | 'toggle' | 'navigate' | 'call' | 'message' | 'custom';
  target: string;
  haptic: boolean;
  sound?: string;
}

export interface AnalogConfig {
  hourHand: HandConfig;
  minuteHand: HandConfig;
  secondHand: HandConfig;
  centerDot: CenterDotConfig;
  ticks: TickConfig;
  numerals: NumeralConfig;
}

export interface HandConfig {
  style: HandStyle;
  color: string;
  length: number;
  width: number;
  glow: boolean;
  glowColor: string;
  shadow: boolean;
  animation: 'smooth' | 'tick' | 'bounce';
}

export interface CenterDotConfig {
  visible: boolean;
  size: number;
  color: string;
  style: 'solid' | 'ring' | 'jewel' | 'jedi-crystal';
  glow: boolean;
  glowColor: string;
}

export interface TickConfig {
  style: TickStyle;
  majorColor: string;
  minorColor: string;
  majorLength: number;
  minorLength: number;
  majorWidth: number;
  minorWidth: number;
  showMinor: boolean;
}

export interface NumeralConfig {
  visible: boolean;
  style: 'arabic' | 'roman' | 'jedi-aurebesh';
  color: string;
  font: string;
  fontSize: number;
  positions: number[];
}

export interface DigitalConfig {
  format: '12h' | '24h';
  showSeconds: boolean;
  showAmPm: boolean;
  showDate: boolean;
  dateFormat: string;
  font: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | 'light';
  color: string;
  glowEffect: boolean;
  glowColor: string;
  blinkColon: boolean;
  position: 'top' | 'center' | 'bottom';
}

export interface BackgroundPattern {
  type: 'solid' | 'gradient' | 'radial' | 'image' | 'animated' | 'particles' | 'hologram';
  colors: string[];
  direction?: number;
  opacity: number;
  blur: number;
  animation?: 'none' | 'pulse' | 'rotate' | 'shimmer' | 'stars' | 'matrix';
  animationSpeed: number;
}

export interface FaceAnimations {
  onWake: 'fade' | 'scale' | 'slide' | 'bounce' | 'hologram-flicker' | 'none';
  onSleep: 'fade' | 'scale' | 'shrink' | 'none';
  ambient: 'subtle-pulse' | 'breathing' | 'particles' | 'none';
  onNotification: 'glow' | 'shake' | 'pulse' | 'ring-expand' | 'none';
  transitionDuration: number;
}

export interface ColorTheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  success: string;
  warning: string;
  error: string;
  glow: string;
}

export interface FaceTemplate {
  id: string;
  name: string;
  description: string;
  style: WatchFaceStyle;
  thumbnail: string;
  category: 'classic' | 'modern' | 'sport' | 'medical' | 'jedi' | 'minimal' | 'luxury';
  isPremium: boolean;
  downloadCount: number;
  rating: number;
  colors: ColorTheme;
}

export interface DesignerState {
  selectedFace: string | null;
  selectedComplication: string | null;
  isDragging: boolean;
  dragTarget: string | null;
  zoom: number;
  showGrid: boolean;
  showGuides: boolean;
  previewMode: 'design' | 'live' | 'ambient';
  undoStack: string[];
  redoStack: string[];
}

// JEDI Color Themes
export const JEDI_COLOR_THEMES: Record<string, ColorTheme> = {
  'jedi-blue': {
    name: 'JEDI Blue',
    primary: '#0066FF',
    secondary: '#00BFFF',
    accent: '#00FFFF',
    background: '#0A1628',
    surface: '#1A2F4A',
    text: '#FFFFFF',
    textSecondary: '#8BA3C7',
    success: '#00FF88',
    warning: '#FFB800',
    error: '#FF3366',
    glow: '#00BFFF',
  },
  'jedi-green': {
    name: 'JEDI Green',
    primary: '#00FF66',
    secondary: '#00CC52',
    accent: '#88FF00',
    background: '#0A1A0F',
    surface: '#1A3A2A',
    text: '#FFFFFF',
    textSecondary: '#8BC7A3',
    success: '#00FF88',
    warning: '#FFB800',
    error: '#FF3366',
    glow: '#00FF66',
  },
  'sith-red': {
    name: 'Sith Red',
    primary: '#FF0033',
    secondary: '#CC0029',
    accent: '#FF3366',
    background: '#1A0A0F',
    surface: '#3A1A2A',
    text: '#FFFFFF',
    textSecondary: '#C78B9B',
    success: '#00FF88',
    warning: '#FFB800',
    error: '#FF0033',
    glow: '#FF0033',
  },
  'medical-white': {
    name: 'Medical White',
    primary: '#00A3E0',
    secondary: '#0077B6',
    accent: '#48CAE4',
    background: '#FFFFFF',
    surface: '#F0F4F8',
    text: '#1A365D',
    textSecondary: '#4A5568',
    success: '#38A169',
    warning: '#DD6B20',
    error: '#E53E3E',
    glow: '#00A3E0',
  },
  'hologram': {
    name: 'Hologram',
    primary: '#00FFFF',
    secondary: '#00CCCC',
    accent: '#00FFAA',
    background: 'transparent',
    surface: 'rgba(0, 255, 255, 0.1)',
    text: '#00FFFF',
    textSecondary: 'rgba(0, 255, 255, 0.7)',
    success: '#00FF88',
    warning: '#FFCC00',
    error: '#FF6666',
    glow: '#00FFFF',
  },
};

// JEDI Watch Face Effects
export const FACE_EFFECTS = {
  hologramFlicker: { type: 'hologram-flicker', duration: 100, intensity: 0.3 },
  lightsaberGlow: { type: 'glow', color: '#00FF66', intensity: 0.8, blur: 20 },
  forceRipple: { type: 'ripple', color: '#00BFFF', duration: 1000 },
  alertPulse: { type: 'pulse', color: '#FF3366', duration: 500 },
  heartbeat: { type: 'scale', min: 0.95, max: 1.05, duration: 800 },
} as const;

// JEDI Watch Face Sounds
export const FACE_SOUNDS = {
  wake: 'jedi-face-wake',
  sleep: 'jedi-face-sleep',
  tap: 'jedi-face-tap',
  complicationTap: 'jedi-comp-tap',
  alert: 'jedi-face-alert',
  hourChime: 'jedi-hour-chime',
} as const;

type Listener = () => void;

class SmartwatchFaceDesignerService {
  private faces: Map<string, WatchFace> = new Map();
  private templates: Map<string, FaceTemplate> = new Map();
  private state: DesignerState;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.state = this.getDefaultState();
    this.initializeDefaultFaces();
    this.initializeTemplates();
  }

  private getDefaultState(): DesignerState {
    return {
      selectedFace: null,
      selectedComplication: null,
      isDragging: false,
      dragTarget: null,
      zoom: 1,
      showGrid: true,
      showGuides: true,
      previewMode: 'design',
      undoStack: [],
      redoStack: [],
    };
  }

  private getDefaultComplicationStyle(): ComplicationStyle {
    return {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      foregroundColor: '#FFFFFF',
      accentColor: '#00BFFF',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 1,
      opacity: 1,
      blur: 0,
      glow: true,
      glowColor: '#00BFFF',
      glowIntensity: 0.5,
      shadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.5)',
      shadowBlur: 4,
      font: 'SF Pro',
      fontSize: 14,
      fontWeight: 'normal',
    };
  }

  private initializeDefaultFaces(): void {
    const defaultFaces: Omit<WatchFace, 'id'>[] = [
      {
        name: 'JEDI Commander',
        style: 'jedi-classic',
        backgroundColor: '#0A1628',
        backgroundPattern: { type: 'radial', colors: ['#1A2F4A', '#0A1628'], opacity: 1, blur: 0, animation: 'subtle-pulse', animationSpeed: 3000 },
        complications: this.createJediComplications(),
        analogConfig: this.createLightsaberAnalogConfig(),
        animations: { onWake: 'hologram-flicker', onSleep: 'fade', ambient: 'subtle-pulse', onNotification: 'glow', transitionDuration: 300 },
        colors: JEDI_COLOR_THEMES['jedi-blue'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDefault: true,
        isCustom: false,
      },
      {
        name: 'Medical Pro',
        style: 'infograph',
        backgroundColor: '#FFFFFF',
        backgroundPattern: { type: 'solid', colors: ['#FFFFFF'], opacity: 1, blur: 0, animation: 'none', animationSpeed: 0 },
        complications: this.createMedicalComplications(),
        digitalConfig: { format: '24h', showSeconds: true, showAmPm: false, showDate: true, dateFormat: 'DD MMM', font: 'SF Pro', fontSize: 48, fontWeight: 'bold', color: '#1A365D', glowEffect: false, glowColor: '', blinkColon: false, position: 'center' },
        animations: { onWake: 'fade', onSleep: 'fade', ambient: 'none', onNotification: 'pulse', transitionDuration: 200 },
        colors: JEDI_COLOR_THEMES['medical-white'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDefault: true,
        isCustom: false,
      },
      {
        name: 'Hologram Display',
        style: 'jedi-hologram',
        backgroundColor: 'transparent',
        backgroundPattern: { type: 'hologram', colors: ['#00FFFF', '#00CCCC'], opacity: 0.8, blur: 2, animation: 'shimmer', animationSpeed: 2000 },
        complications: this.createHologramComplications(),
        digitalConfig: { format: '24h', showSeconds: true, showAmPm: false, showDate: true, dateFormat: 'DD.MM.YYYY', font: 'Orbitron', fontSize: 36, fontWeight: 'bold', color: '#00FFFF', glowEffect: true, glowColor: '#00FFFF', blinkColon: true, position: 'center' },
        animations: { onWake: 'hologram-flicker', onSleep: 'shrink', ambient: 'particles', onNotification: 'ring-expand', transitionDuration: 400 },
        colors: JEDI_COLOR_THEMES['hologram'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDefault: true,
        isCustom: false,
      },
      {
        name: 'Classic Analog',
        style: 'analog',
        backgroundColor: '#1A1A2E',
        backgroundPattern: { type: 'gradient', colors: ['#1A1A2E', '#16213E'], direction: 180, opacity: 1, blur: 0, animation: 'none', animationSpeed: 0 },
        complications: this.createClassicComplications(),
        analogConfig: this.createClassicAnalogConfig(),
        animations: { onWake: 'scale', onSleep: 'fade', ambient: 'breathing', onNotification: 'glow', transitionDuration: 250 },
        colors: { name: 'Classic', primary: '#FFD700', secondary: '#C0C0C0', accent: '#FFD700', background: '#1A1A2E', surface: '#2A2A4E', text: '#FFFFFF', textSecondary: '#A0A0C0', success: '#00FF88', warning: '#FFB800', error: '#FF3366', glow: '#FFD700' },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDefault: true,
        isCustom: false,
      },
      {
        name: 'Activity Rings',
        style: 'modular',
        backgroundColor: '#000000',
        backgroundPattern: { type: 'solid', colors: ['#000000'], opacity: 1, blur: 0, animation: 'none', animationSpeed: 0 },
        complications: this.createActivityComplications(),
        digitalConfig: { format: '12h', showSeconds: false, showAmPm: true, showDate: true, dateFormat: 'EEE, MMM D', font: 'SF Pro', fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', glowEffect: false, glowColor: '', blinkColon: false, position: 'top' },
        animations: { onWake: 'bounce', onSleep: 'shrink', ambient: 'none', onNotification: 'shake', transitionDuration: 300 },
        colors: { name: 'Activity', primary: '#FF2D55', secondary: '#5AC8FA', accent: '#4CD964', background: '#000000', surface: '#1C1C1E', text: '#FFFFFF', textSecondary: '#8E8E93', success: '#4CD964', warning: '#FF9500', error: '#FF2D55', glow: '#FF2D55' },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDefault: true,
        isCustom: false,
      },
    ];

    defaultFaces.forEach((face, idx) => {
      const id = `face-${idx}`;
      this.faces.set(id, { ...face, id });
    });
  }

  private createJediComplications(): Complication[] {
    return [
      { id: 'comp-1', type: 'heart-rate', position: { zone: 'top-left', x: 20, y: 20, rotation: 0 }, size: 'medium', shape: 'circular', style: { ...this.getDefaultComplicationStyle(), accentColor: '#FF3366' }, data: { value: 72, unit: 'BPM', icon: '❤️' }, animation: { type: 'pulse', duration: 800, delay: 0, repeat: true, trigger: 'always' } },
      { id: 'comp-2', type: 'jedi-force-meter', position: { zone: 'top-right', x: 80, y: 20, rotation: 0 }, size: 'medium', shape: 'gauge', style: { ...this.getDefaultComplicationStyle(), accentColor: '#00FF66' }, data: { value: 85, unit: '%', progress: 0.85, icon: '⚡' } },
      { id: 'comp-3', type: 'next-event', position: { zone: 'bottom-left', x: 20, y: 80, rotation: 0 }, size: 'large', shape: 'rectangular', style: this.getDefaultComplicationStyle(), data: { value: 'Council Meeting', secondaryValue: '14:00', icon: '📅' } },
      { id: 'comp-4', type: 'medication', position: { zone: 'bottom-right', x: 80, y: 80, rotation: 0 }, size: 'medium', shape: 'circular', style: { ...this.getDefaultComplicationStyle(), accentColor: '#E74C3C' }, data: { value: 2, label: 'Meds Due', icon: '💊' }, animation: { type: 'glow', duration: 1500, delay: 0, repeat: true, trigger: 'on-alert' } },
      { id: 'comp-5', type: 'jedi-comm-status', position: { zone: 'bezel', x: 50, y: 0, rotation: 0 }, size: 'small', shape: 'circular', style: { ...this.getDefaultComplicationStyle(), glow: true, glowColor: '#00FF66' }, data: { value: 'Online', icon: '📡' } },
    ];
  }

  private createMedicalComplications(): Complication[] {
    return [
      { id: 'comp-1', type: 'heart-rate', position: { zone: 'top-left', x: 15, y: 15, rotation: 0 }, size: 'large', shape: 'gauge', style: { ...this.getDefaultComplicationStyle(), backgroundColor: '#FEE2E2', foregroundColor: '#991B1B', accentColor: '#EF4444' }, data: { value: 72, unit: 'BPM', min: 40, max: 180, progress: 0.4, icon: '❤️' } },
      { id: 'comp-2', type: 'blood-oxygen', position: { zone: 'top-right', x: 85, y: 15, rotation: 0 }, size: 'large', shape: 'gauge', style: { ...this.getDefaultComplicationStyle(), backgroundColor: '#DBEAFE', foregroundColor: '#1E40AF', accentColor: '#3B82F6' }, data: { value: 98, unit: '%', min: 80, max: 100, progress: 0.9, icon: '🫁' } },
      { id: 'comp-3', type: 'medication', position: { zone: 'bottom-center', x: 50, y: 85, rotation: 0 }, size: 'extra-large', shape: 'rectangular', style: { ...this.getDefaultComplicationStyle(), backgroundColor: '#FEF3C7', foregroundColor: '#92400E' }, data: { value: 'Aspirin 100mg', secondaryValue: 'Due in 30 min', icon: '💊' }, animation: { type: 'pulse', duration: 2000, delay: 0, repeat: true, trigger: 'on-alert' } },
      { id: 'comp-4', type: 'steps', position: { zone: 'center-left', x: 10, y: 50, rotation: 0 }, size: 'medium', shape: 'ring', style: { ...this.getDefaultComplicationStyle(), accentColor: '#10B981' }, data: { value: 6234, unit: 'steps', progress: 0.62, icon: '👟' } },
      { id: 'comp-5', type: 'calories', position: { zone: 'center-right', x: 90, y: 50, rotation: 0 }, size: 'medium', shape: 'ring', style: { ...this.getDefaultComplicationStyle(), accentColor: '#F59E0B' }, data: { value: 342, unit: 'kcal', progress: 0.45, icon: '🔥' } },
    ];
  }

  private createHologramComplications(): Complication[] {
    return [
      { id: 'comp-1', type: 'jedi-mission-status', position: { zone: 'top-center', x: 50, y: 10, rotation: 0 }, size: 'large', shape: 'rectangular', style: { ...this.getDefaultComplicationStyle(), backgroundColor: 'transparent', foregroundColor: '#00FFFF', glow: true, glowColor: '#00FFFF', glowIntensity: 1 }, data: { value: 'MISSION ACTIVE', secondaryValue: 'Operation: Nexus', icon: '🎯' }, animation: { type: 'glow', duration: 1500, delay: 0, repeat: true, trigger: 'always' } },
      { id: 'comp-2', type: 'heart-rate', position: { zone: 'bottom-left', x: 20, y: 80, rotation: 0 }, size: 'medium', shape: 'circular', style: { ...this.getDefaultComplicationStyle(), backgroundColor: 'transparent', foregroundColor: '#00FFAA', glow: true }, data: { value: 72, unit: 'BPM', icon: '❤️' } },
      { id: 'comp-3', type: 'battery', position: { zone: 'bottom-right', x: 80, y: 80, rotation: 0 }, size: 'medium', shape: 'gauge', style: { ...this.getDefaultComplicationStyle(), backgroundColor: 'transparent', foregroundColor: '#00FF66', glow: true }, data: { value: 78, unit: '%', progress: 0.78, icon: '🔋' } },
    ];
  }

  private createClassicComplications(): Complication[] {
    return [
      { id: 'comp-1', type: 'date', position: { zone: 'center-right', x: 75, y: 50, rotation: 0 }, size: 'small', shape: 'rectangular', style: { ...this.getDefaultComplicationStyle(), backgroundColor: '#2A2A4E', foregroundColor: '#FFFFFF' }, data: { value: '15', label: 'FEB' } },
      { id: 'comp-2', type: 'moon-phase', position: { zone: 'bottom-center', x: 50, y: 75, rotation: 0 }, size: 'small', shape: 'circular', style: { ...this.getDefaultComplicationStyle(), backgroundColor: 'transparent' }, data: { value: '🌓', label: 'First Quarter' } },
    ];
  }

  private createActivityComplications(): Complication[] {
    return [
      { id: 'comp-1', type: 'activity-rings', position: { zone: 'center', x: 50, y: 55, rotation: 0 }, size: 'extra-large', shape: 'ring', style: { ...this.getDefaultComplicationStyle(), backgroundColor: 'transparent' }, data: { value: '', icon: '' }, animation: { type: 'scale', duration: 500, delay: 0, repeat: false, trigger: 'on-update' } },
      { id: 'comp-2', type: 'steps', position: { zone: 'bottom-left', x: 25, y: 85, rotation: 0 }, size: 'small', shape: 'text-only', style: { ...this.getDefaultComplicationStyle(), foregroundColor: '#5AC8FA' }, data: { value: 6234, unit: 'steps', icon: '👟' } },
      { id: 'comp-3', type: 'calories', position: { zone: 'bottom-right', x: 75, y: 85, rotation: 0 }, size: 'small', shape: 'text-only', style: { ...this.getDefaultComplicationStyle(), foregroundColor: '#FF2D55' }, data: { value: 342, unit: 'kcal', icon: '🔥' } },
    ];
  }

  private createLightsaberAnalogConfig(): AnalogConfig {
    return {
      hourHand: { style: 'lightsaber', color: '#00FF66', length: 0.5, width: 8, glow: true, glowColor: '#00FF66', shadow: true, animation: 'smooth' },
      minuteHand: { style: 'lightsaber', color: '#00BFFF', length: 0.7, width: 6, glow: true, glowColor: '#00BFFF', shadow: true, animation: 'smooth' },
      secondHand: { style: 'thin', color: '#FF3366', length: 0.8, width: 2, glow: true, glowColor: '#FF3366', shadow: false, animation: 'tick' },
      centerDot: { visible: true, size: 12, color: '#FFFFFF', style: 'jedi-crystal', glow: true, glowColor: '#00FFFF' },
      ticks: { style: 'jedi-symbols', majorColor: '#00BFFF', minorColor: '#1A2F4A', majorLength: 15, minorLength: 8, majorWidth: 3, minorWidth: 1, showMinor: true },
      numerals: { visible: true, style: 'jedi-aurebesh', color: '#00BFFF', font: 'Aurebesh', fontSize: 14, positions: [12, 3, 6, 9] },
    };
  }

  private createClassicAnalogConfig(): AnalogConfig {
    return {
      hourHand: { style: 'classic', color: '#FFD700', length: 0.5, width: 6, glow: false, glowColor: '', shadow: true, animation: 'smooth' },
      minuteHand: { style: 'classic', color: '#C0C0C0', length: 0.7, width: 4, glow: false, glowColor: '', shadow: true, animation: 'smooth' },
      secondHand: { style: 'thin', color: '#FF3366', length: 0.85, width: 1, glow: false, glowColor: '', shadow: false, animation: 'tick' },
      centerDot: { visible: true, size: 8, color: '#FFD700', style: 'jewel', glow: false, glowColor: '' },
      ticks: { style: 'lines', majorColor: '#FFD700', minorColor: '#4A4A6E', majorLength: 12, minorLength: 6, majorWidth: 2, minorWidth: 1, showMinor: true },
      numerals: { visible: true, style: 'roman', color: '#FFD700', font: 'Times New Roman', fontSize: 16, positions: [12, 3, 6, 9] },
    };
  }

  private initializeTemplates(): void {
    const templates: Omit<FaceTemplate, 'id'>[] = [
      { name: 'JEDI Commander', description: 'Official JEDI command watch face with force meter and mission status', style: 'jedi-classic', thumbnail: '⚔️', category: 'jedi', isPremium: false, downloadCount: 15420, rating: 4.9, colors: JEDI_COLOR_THEMES['jedi-blue'] },
      { name: 'Medical Professional', description: 'Clinical watch face with vital signs and medication tracking', style: 'infograph', thumbnail: '🏥', category: 'medical', isPremium: false, downloadCount: 8930, rating: 4.8, colors: JEDI_COLOR_THEMES['medical-white'] },
      { name: 'Hologram Display', description: 'Futuristic holographic interface with animated effects', style: 'jedi-hologram', thumbnail: '🌐', category: 'jedi', isPremium: true, downloadCount: 12350, rating: 4.7, colors: JEDI_COLOR_THEMES['hologram'] },
      { name: 'Classic Elegance', description: 'Timeless analog design with gold accents', style: 'analog', thumbnail: '⌚', category: 'luxury', isPremium: false, downloadCount: 6780, rating: 4.6, colors: JEDI_COLOR_THEMES['jedi-blue'] },
      { name: 'Activity Focus', description: 'Fitness-focused with activity rings and workout metrics', style: 'modular', thumbnail: '💪', category: 'sport', isPremium: false, downloadCount: 9450, rating: 4.5, colors: JEDI_COLOR_THEMES['jedi-green'] },
      { name: 'Minimal Dark', description: 'Clean, distraction-free design for focus', style: 'digital', thumbnail: '🌙', category: 'minimal', isPremium: false, downloadCount: 5230, rating: 4.4, colors: JEDI_COLOR_THEMES['jedi-blue'] },
      { name: 'Sith Lord', description: 'Dark side themed with red accents and aggressive styling', style: 'jedi-classic', thumbnail: '🔴', category: 'jedi', isPremium: true, downloadCount: 7890, rating: 4.8, colors: JEDI_COLOR_THEMES['sith-red'] },
    ];

    templates.forEach((template, idx) => {
      const id = `template-${idx}`;
      this.templates.set(id, { ...template, id });
    });
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getAllFaces(): WatchFace[] {
    return Array.from(this.faces.values());
  }

  getFace(id: string): WatchFace | undefined {
    return this.faces.get(id);
  }

  createFace(face: Omit<WatchFace, 'id' | 'createdAt' | 'updatedAt'>): WatchFace {
    const id = `face-${Date.now()}`;
    const newFace: WatchFace = {
      ...face,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.faces.set(id, newFace);
    this.notifyListeners();
    return newFace;
  }

  updateFace(id: string, updates: Partial<Omit<WatchFace, 'id' | 'createdAt'>>): WatchFace | undefined {
    const face = this.faces.get(id);
    if (face) {
      const updated = { ...face, ...updates, updatedAt: Date.now() };
      this.faces.set(id, updated);
      this.notifyListeners();
      return updated;
    }
    return undefined;
  }

  deleteFace(id: string): boolean {
    const result = this.faces.delete(id);
    if (result) this.notifyListeners();
    return result;
  }

  duplicateFace(id: string, newName: string): WatchFace | undefined {
    const face = this.faces.get(id);
    if (face) {
      const newId = `face-${Date.now()}`;
      const duplicate: WatchFace = {
        ...face,
        id: newId,
        name: newName,
        isDefault: false,
        isCustom: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.faces.set(newId, duplicate);
      this.notifyListeners();
      return duplicate;
    }
    return undefined;
  }

  addComplication(faceId: string, complication: Omit<Complication, 'id'>): Complication | null {
    const face = this.faces.get(faceId);
    if (!face) return null;

    const newComplication: Complication = {
      ...complication,
      id: `comp-${Date.now()}`,
    };
    face.complications.push(newComplication);
    face.updatedAt = Date.now();
    this.faces.set(faceId, face);
    this.notifyListeners();
    return newComplication;
  }

  updateComplication(faceId: string, complicationId: string, updates: Partial<Omit<Complication, 'id'>>): Complication | undefined {
    const face = this.faces.get(faceId);
    if (!face) return undefined;

    const comp = face.complications.find(c => c.id === complicationId);
    if (comp) {
      Object.assign(comp, updates);
      face.updatedAt = Date.now();
      this.faces.set(faceId, face);
      this.notifyListeners();
      return comp;
    }
    return undefined;
  }

  removeComplication(faceId: string, complicationId: string): boolean {
    const face = this.faces.get(faceId);
    if (!face) return false;

    const idx = face.complications.findIndex(c => c.id === complicationId);
    if (idx >= 0) {
      face.complications.splice(idx, 1);
      face.updatedAt = Date.now();
      this.faces.set(faceId, face);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  moveComplication(faceId: string, complicationId: string, position: Partial<ComplicationPosition>): boolean {
    const face = this.faces.get(faceId);
    if (!face) return false;

    const comp = face.complications.find(c => c.id === complicationId);
    if (comp) {
      comp.position = { ...comp.position, ...position };
      face.updatedAt = Date.now();
      this.faces.set(faceId, face);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  getAllTemplates(): FaceTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: FaceTemplate['category']): FaceTemplate[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }

  applyTemplate(templateId: string): WatchFace | undefined {
    const template = this.templates.get(templateId);
    if (!template) return undefined;

    const defaultFace = this.getAllFaces().find(f => f.style === template.style && f.isDefault);
    if (defaultFace) {
      return this.duplicateFace(defaultFace.id, `My ${template.name}`);
    }
    return undefined;
  }

  getState(): DesignerState {
    return { ...this.state };
  }

  updateState(updates: Partial<DesignerState>): DesignerState {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
    return this.state;
  }

  selectFace(id: string | null): void {
    this.state.selectedFace = id;
    this.state.selectedComplication = null;
    this.notifyListeners();
  }

  selectComplication(id: string | null): void {
    this.state.selectedComplication = id;
    this.notifyListeners();
  }

  setPreviewMode(mode: DesignerState['previewMode']): void {
    this.state.previewMode = mode;
    this.notifyListeners();
  }

  getColorThemes(): Record<string, ColorTheme> {
    return { ...JEDI_COLOR_THEMES };
  }

  applyColorTheme(faceId: string, themeName: string): boolean {
    const theme = JEDI_COLOR_THEMES[themeName];
    if (!theme) return false;

    const face = this.faces.get(faceId);
    if (face) {
      face.colors = { ...theme };
      face.updatedAt = Date.now();
      this.faces.set(faceId, face);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  exportFace(id: string): string | null {
    const face = this.faces.get(id);
    if (!face) return null;
    return JSON.stringify(face, null, 2);
  }

  importFace(json: string): WatchFace | null {
    try {
      const data = JSON.parse(json);
      const newFace: WatchFace = {
        ...data,
        id: `face-${Date.now()}`,
        isDefault: false,
        isCustom: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.faces.set(newFace.id, newFace);
      this.notifyListeners();
      return newFace;
    } catch {
      return null;
    }
  }

  generatePreview(faceId: string): string {
    const face = this.faces.get(faceId);
    if (!face) return '';

    // Generate ASCII art preview
    const lines: string[] = [];
    lines.push('┌────────────────────┐');
    lines.push(`│  ${face.name.padEnd(16).slice(0, 16)}  │`);
    lines.push('│                    │');
    
    if (face.style === 'analog' || face.style === 'jedi-classic') {
      lines.push('│      12            │');
      lines.push('│   ·  │  ·         │');
      lines.push('│  9 ──┼── 3        │');
      lines.push('│   ·  │  ·         │');
      lines.push('│      6            │');
    } else {
      lines.push('│                    │');
      lines.push('│     10:30:45      │');
      lines.push('│     THU FEB 5     │');
      lines.push('│                    │');
    }
    
    lines.push('│                    │');
    lines.push(`│ Complications: ${face.complications.length.toString().padStart(2)} │`);
    lines.push('└────────────────────┘');

    return lines.join('\n');
  }

  reset(): void {
    this.faces.clear();
    this.templates.clear();
    this.state = this.getDefaultState();
    this.initializeDefaultFaces();
    this.initializeTemplates();
    this.notifyListeners();
  }
}

export const smartwatchFaceDesignerService = new SmartwatchFaceDesignerService();
