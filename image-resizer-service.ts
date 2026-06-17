 * Image Resizer Service
 * MediVac WACHS v8.8
 * 
 * Provides image shrinking and refitting for watch face backgrounds,
 * wallpapers, screensavers, and startup animations with filters and effects.
 */

export type ImageTargetType = 'watch-face' | 'wallpaper' | 'screensaver' | 'startup-animation' | 'app-icon' | 'profile-avatar' | 'custom';
export type FitMode = 'fill' | 'fit' | 'stretch' | 'tile' | 'center' | 'crop-center' | 'crop-top' | 'crop-bottom';
export type ImageFormat = 'png' | 'jpg' | 'webp' | 'gif' | 'bmp';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImagePreset {
  id: string;
  name: string;
  target: ImageTargetType;
  dimensions: ImageDimensions;
  aspectRatio: string;
  fitMode: FitMode;
  format: ImageFormat;
  quality: number;
  isCircular: boolean;
  cornerRadius: number;
  description: string;
}

export interface ImageFilter {
  id: string;
  name: string;
  type: 'brightness' | 'contrast' | 'saturation' | 'blur' | 'sharpen' | 'grayscale' | 'sepia' | 'invert' | 'hue-rotate' | 'opacity' | 'vignette' | 'glow';
  value: number;
  min: number;
  max: number;
  unit: string;
  icon: string;
}

export interface ImageEffect {
  id: string;
  name: string;
  type: 'jedi-hologram' | 'force-glow' | 'lightsaber-edge' | 'hyperspace' | 'particle-overlay' | 'scan-lines' | 'glitch' | 'neon' | 'vintage' | 'cyberpunk';
  intensity: number;
  color?: string;
  animated?: boolean;
  duration?: number;