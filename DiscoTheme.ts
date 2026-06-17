/**
 * Extreme Disco Theme Configuration
 * Vibrant neon colors, gradients, and animated effects
 */

// ============================================
// DISCO COLOR PALETTE
// ============================================

export const DISCO_COLORS = {
  // Primary Neon Colors
  neonPink: '#FF1493',
  neonCyan: '#00FFFF',
  neonPurple: '#BF00FF',
  neonGreen: '#39FF14',
  neonOrange: '#FF6600',
  neonYellow: '#FFFF00',
  neonBlue: '#4D4DFF',
  neonRed: '#FF073A',
  
  // Gradient Bases
  hotPink: '#FF69B4',
  electricBlue: '#7DF9FF',
  laserLemon: '#FFFF66',
  plasmaOrange: '#FF9933',
  cosmicPurple: '#9933FF',
  
  // Dark Backgrounds
  discoBlack: '#0D0D0D',
  midnightPurple: '#1A0A2E',
  deepSpace: '#0A0A1A',
  darkDisco: '#120318',
  
  // Metallic Accents
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
  chrome: '#E8E8E8',
  
  // Glow Colors (with opacity for shadows)
  glowPink: 'rgba(255, 20, 147, 0.8)',
  glowCyan: 'rgba(0, 255, 255, 0.8)',
  glowPurple: 'rgba(191, 0, 255, 0.8)',
  glowGreen: 'rgba(57, 255, 20, 0.8)',
};

// ============================================
// GRADIENT DEFINITIONS
// ============================================

export const DISCO_GRADIENTS = {
  // Primary Gradients
  pinkToCyan: ['#FF1493', '#FF69B4', '#00FFFF'],
  purpleToBlue: ['#BF00FF', '#7B68EE', '#4D4DFF'],
  sunsetDisco: ['#FF6600', '#FF1493', '#BF00FF'],
  neonRainbow: ['#FF073A', '#FF6600', '#FFFF00', '#39FF14', '#00FFFF', '#4D4DFF', '#BF00FF'],
  
  // Background Gradients
  darkDisco: ['#0D0D0D', '#1A0A2E', '#0D0D0D'],
  midnightGlow: ['#120318', '#1A0A2E', '#0A0A1A'],
  cosmicNight: ['#0A0A1A', '#1A0A2E', '#2D1B4E'],
  
  // Button Gradients
  hotButton: ['#FF1493', '#FF6600'],
  coolButton: ['#00FFFF', '#4D4DFF'],
  partyButton: ['#BF00FF', '#FF1493', '#FF6600'],
  
  // Card Gradients
  glassCard: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
  neonCard: ['rgba(255, 20, 147, 0.2)', 'rgba(0, 255, 255, 0.2)'],
};

// ============================================
// ANIMATION CONFIGURATIONS
// ============================================

export const DISCO_ANIMATIONS = {
  // Pulse Animation
  pulse: {
    duration: 1500,
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
  },
  
  // Glow Animation
  glow: {
    duration: 2000,
    shadowRadius: [10, 20, 10],
    shadowOpacity: [0.5, 1, 0.5],
  },
  
  // Rainbow Border Animation
  rainbowBorder: {
    duration: 3000,
    colors: ['#FF1493', '#FF6600', '#FFFF00', '#39FF14', '#00FFFF', '#4D4DFF', '#BF00FF', '#FF1493'],
  },
  
  // Sparkle Animation
  sparkle: {
    duration: 500,
    scale: [0, 1.2, 0],
    opacity: [0, 1, 0],
    rotation: [0, 180, 360],
  },
  
  // Disco Ball Rotation
  discoBall: {
    duration: 4000,
    rotation: [0, 360],
    loop: true,
  },
  
  // Neon Flicker
  neonFlicker: {
    duration: 100,
    opacity: [1, 0.7, 1, 0.9, 1],
    repeat: 3,
  },
  
  // Slide In
  slideIn: {
    duration: 400,
    translateY: [50, 0],
    opacity: [0, 1],
  },
  
  // Bounce
  bounce: {
    duration: 600,
    translateY: [0, -10, 0, -5, 0],
  },
};

// ============================================
// TYPOGRAPHY STYLES
// ============================================

export const DISCO_TYPOGRAPHY = {
  // Retro Headers
  discoTitle: {
    fontWeight: '900' as const,
    letterSpacing: 4,
    textTransform: 'uppercase' as const,
  },
  
  neonText: {
    fontWeight: '700' as const,
    letterSpacing: 2,
  },
  
  retroBody: {
    fontWeight: '500' as const,
    letterSpacing: 1,
  },
  
  // Text Shadows for Glow Effect
  glowShadow: {
    textShadowColor: DISCO_COLORS.neonPink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  
  cyanGlowShadow: {
    textShadowColor: DISCO_COLORS.neonCyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  
  purpleGlowShadow: {
    textShadowColor: DISCO_COLORS.neonPurple,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
};

// ============================================
// DISCO COMPONENT STYLES
// ============================================

export const DISCO_STYLES = {
  // Neon Card
  neonCard: {
    backgroundColor: 'rgba(26, 10, 46, 0.8)',
    borderWidth: 2,
    borderColor: DISCO_COLORS.neonPink,
    borderRadius: 16,
    shadowColor: DISCO_COLORS.neonPink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  
  // Glass Card
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    backdropFilter: 'blur(10px)',
  },
  
  // Disco Button
  discoButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    shadowColor: DISCO_COLORS.neonPink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  
  // Neon Input
  neonInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 2,
    borderColor: DISCO_COLORS.neonCyan,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    shadowColor: DISCO_COLORS.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  
  // Rainbow Border
  rainbowBorder: {
    borderWidth: 3,
    borderRadius: 16,
  },
  
  // Disco Badge
  discoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
};

// ============================================
// DISCO BALL SPARKLE POSITIONS
// ============================================

export const SPARKLE_POSITIONS = [
  { x: 10, y: 15, delay: 0 },
  { x: 85, y: 20, delay: 200 },
  { x: 45, y: 8, delay: 400 },
  { x: 70, y: 35, delay: 600 },
  { x: 25, y: 45, delay: 800 },
  { x: 90, y: 55, delay: 1000 },
  { x: 15, y: 70, delay: 1200 },
  { x: 60, y: 80, delay: 1400 },
  { x: 35, y: 90, delay: 1600 },
  { x: 80, y: 75, delay: 1800 },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get random disco color
 */
export const getRandomDiscoColor = (): string => {
  const colors = [
    DISCO_COLORS.neonPink,
    DISCO_COLORS.neonCyan,
    DISCO_COLORS.neonPurple,
    DISCO_COLORS.neonGreen,
    DISCO_COLORS.neonOrange,
    DISCO_COLORS.neonYellow,
    DISCO_COLORS.neonBlue,
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Get gradient for index (cycling through gradients)
 */
export const getGradientForIndex = (index: number): string[] => {
  const gradients = [
    DISCO_GRADIENTS.pinkToCyan,
    DISCO_GRADIENTS.purpleToBlue,
    DISCO_GRADIENTS.sunsetDisco,
    DISCO_GRADIENTS.hotButton,
    DISCO_GRADIENTS.coolButton,
  ];
  return gradients[index % gradients.length];
};

/**
 * Get glow shadow style for color
 */
export const getGlowShadow = (color: string, intensity: number = 1) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.8 * intensity,
  shadowRadius: 15 * intensity,
  elevation: 10 * intensity,
});

/**
 * Get neon text style
 */
export const getNeonTextStyle = (color: string) => ({
  color: color,
  textShadowColor: color,
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 10,
});

/**
 * Get disco card style with custom color
 */
export const getDiscoCardStyle = (accentColor: string) => ({
  ...DISCO_STYLES.neonCard,
  borderColor: accentColor,
  shadowColor: accentColor,
});

// ============================================
// DISCO THEME EXPORT
// ============================================

export const DiscoTheme = {
  colors: DISCO_COLORS,
  gradients: DISCO_GRADIENTS,
  animations: DISCO_ANIMATIONS,
  typography: DISCO_TYPOGRAPHY,
  styles: DISCO_STYLES,
  sparklePositions: SPARKLE_POSITIONS,
  helpers: {
    getRandomDiscoColor,
    getGradientForIndex,
    getGlowShadow,
    getNeonTextStyle,
    getDiscoCardStyle,
  },
};

export default DiscoTheme;
