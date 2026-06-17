/**
 * Signature Pad Service - MediVac WACHS v9.3
 * Touch-based signature drawing with canvas capture
 */

// Types
export type SignatureColor = 'black' | 'blue' | 'navy' | 'dark-gray';
export type SignatureThickness = 'thin' | 'medium' | 'thick' | 'extra-thick';
export type ExportFormat = 'png' | 'svg' | 'base64' | 'json';

export interface Point {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  thickness: number;
  startTime: number;
  endTime: number;
}

export interface SignatureData {
  id: string;
  strokes: Stroke[];
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
  signedBy: string;
  purpose: 'maker' | 'witness' | 'tdm' | 'other';
  isValid: boolean;
  validationErrors: string[];
  metadata: {
    deviceType: string;
    touchPoints: number;
    totalTime: number;
    averagePressure: number;
  };
}

export interface SignatureSettings {
  color: SignatureColor;
  thickness: SignatureThickness;
  smoothing: number; // 0-1
  pressureSensitivity: boolean;
  minStrokesRequired: number;
  minPointsPerStroke: number;
  hapticFeedback: boolean;
  showGuideLines: boolean;
  backgroundColor: string;
}

export interface SignatureComparison {
  similarity: number; // 0-1
  strokeCountMatch: boolean;
  proportionMatch: boolean;
  flowMatch: boolean;
  isLikelyMatch: boolean;
  confidence: 'low' | 'medium' | 'high';
  details: string[];
}

export interface SignatureExport {
  format: ExportFormat;
  data: string;
  width: number;
  height: number;
  fileSize: number;
  filename: string;
}

// Color mapping
const COLORS: Record<SignatureColor, string> = {
  'black': '#000000',
  'blue': '#0066CC',
  'navy': '#001F3F',
  'dark-gray': '#333333',
};

// Thickness mapping (in pixels)
const THICKNESSES: Record<SignatureThickness, number> = {
  'thin': 1,
  'medium': 2,
  'thick': 3,
  'extra-thick': 4,
};

// Haptic patterns
const HAPTIC_PATTERNS = {
  strokeStart: { type: 'impact', style: 'light' },
  strokeEnd: { type: 'impact', style: 'medium' },
  clear: { type: 'notification', style: 'warning' },
  undo: { type: 'impact', style: 'light' },
  redo: { type: 'impact', style: 'light' },
  save: { type: 'notification', style: 'success' },
  error: { type: 'notification', style: 'error' },
};

class SignaturePadService {
  private signatures: Map<string, SignatureData> = new Map();
  private currentSignature: SignatureData | null = null;
  private currentStroke: Stroke | null = null;
  private undoStack: Stroke[][] = [];
  private redoStack: Stroke[][] = [];
  private settings: SignatureSettings = {
    color: 'black',
    thickness: 'medium',
    smoothing: 0.5,
    pressureSensitivity: true,
    minStrokesRequired: 2,
    minPointsPerStroke: 10,
    hapticFeedback: true,
    showGuideLines: true,
    backgroundColor: '#FFFFFF',
  };

  // Initialize a new signature
  createSignature(
    signedBy: string,
    purpose: SignatureData['purpose'],
    width: number = 400,
    height: number = 200
  ): SignatureData {
    const signature: SignatureData = {
      id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      strokes: [],
      width,
      height,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      signedBy,
      purpose,
      isValid: false,
      validationErrors: ['Signature is empty'],
      metadata: {
        deviceType: 'unknown',
        touchPoints: 0,
        totalTime: 0,
        averagePressure: 0,
      },
    };

    this.signatures.set(signature.id, signature);
    this.currentSignature = signature;
    this.undoStack = [];
    this.redoStack = [];

    return signature;
  }

  // Start a new stroke
  startStroke(x: number, y: number, pressure: number = 0.5): Stroke | null {
    if (!this.currentSignature) return null;

    // Save current state for undo
    this.undoStack.push([...this.currentSignature.strokes]);
    this.redoStack = [];

    const stroke: Stroke = {
      id: `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      points: [{
        x,
        y,
        pressure: this.settings.pressureSensitivity ? pressure : 0.5,
        timestamp: Date.now(),
      }],
      color: COLORS[this.settings.color],
      thickness: THICKNESSES[this.settings.thickness],
      startTime: Date.now(),
      endTime: 0,
    };

    this.currentStroke = stroke;
    this.triggerHaptic('strokeStart');

    return stroke;
  }

  // Add point to current stroke
  addPoint(x: number, y: number, pressure: number = 0.5): Point | null {
    if (!this.currentStroke) return null;

    // Apply smoothing
    const lastPoint = this.currentStroke.points[this.currentStroke.points.length - 1];
    const smoothedX = lastPoint.x + (x - lastPoint.x) * (1 - this.settings.smoothing);
    const smoothedY = lastPoint.y + (y - lastPoint.y) * (1 - this.settings.smoothing);

    const point: Point = {
      x: smoothedX,
      y: smoothedY,
      pressure: this.settings.pressureSensitivity ? pressure : 0.5,
      timestamp: Date.now(),
    };

    this.currentStroke.points.push(point);
    return point;
  }

  // End current stroke
  endStroke(): Stroke | null {
    if (!this.currentStroke || !this.currentSignature) return null;

    this.currentStroke.endTime = Date.now();
    this.currentSignature.strokes.push(this.currentStroke);
    this.currentSignature.updatedAt = new Date().toISOString();

    // Update metadata
    this.updateMetadata();
    this.validateSignature();

    const completedStroke = this.currentStroke;
    this.currentStroke = null;

    this.triggerHaptic('strokeEnd');
    return completedStroke;
  }

  // Update signature metadata
  private updateMetadata(): void {
    if (!this.currentSignature) return;

    const strokes = this.currentSignature.strokes;
    let totalPoints = 0;
    let totalPressure = 0;
    let totalTime = 0;

    strokes.forEach(stroke => {
      totalPoints += stroke.points.length;
      stroke.points.forEach(p => totalPressure += p.pressure);
      totalTime += stroke.endTime - stroke.startTime;
    });

    this.currentSignature.metadata = {
      deviceType: 'touch',
      touchPoints: totalPoints,
      totalTime,
      averagePressure: totalPoints > 0 ? totalPressure / totalPoints : 0,
    };
  }

  // Validate signature
  private validateSignature(): void {
    if (!this.currentSignature) return;

    const errors: string[] = [];
    const strokes = this.currentSignature.strokes;

    if (strokes.length === 0) {
      errors.push('Signature is empty');
    } else if (strokes.length < this.settings.minStrokesRequired) {
      errors.push(`Minimum ${this.settings.minStrokesRequired} strokes required`);
    }

    const validStrokes = strokes.filter(s => s.points.length >= this.settings.minPointsPerStroke);
    if (validStrokes.length < this.settings.minStrokesRequired) {
      errors.push('Strokes are too short - please sign more clearly');
    }

    // Check if signature is too small
    const bounds = this.getBounds();
    if (bounds && (bounds.width < 50 || bounds.height < 20)) {
      errors.push('Signature is too small');
    }

    this.currentSignature.validationErrors = errors;
    this.currentSignature.isValid = errors.length === 0;
  }

  // Get signature bounds
  getBounds(): { x: number; y: number; width: number; height: number } | null {
    if (!this.currentSignature || this.currentSignature.strokes.length === 0) return null;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    this.currentSignature.strokes.forEach(stroke => {
      stroke.points.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  // Clear signature
  clear(): void {
    if (!this.currentSignature) return;

    this.undoStack.push([...this.currentSignature.strokes]);
    this.redoStack = [];
    this.currentSignature.strokes = [];
    this.currentSignature.updatedAt = new Date().toISOString();
    this.validateSignature();
    this.triggerHaptic('clear');
  }

  // Undo last stroke
  undo(): boolean {
    if (!this.currentSignature || this.undoStack.length === 0) return false;

    this.redoStack.push([...this.currentSignature.strokes]);
    this.currentSignature.strokes = this.undoStack.pop()!;
    this.currentSignature.updatedAt = new Date().toISOString();
    this.updateMetadata();
    this.validateSignature();
    this.triggerHaptic('undo');
    return true;
  }

  // Redo last undone stroke
  redo(): boolean {
    if (!this.currentSignature || this.redoStack.length === 0) return false;

    this.undoStack.push([...this.currentSignature.strokes]);
    this.currentSignature.strokes = this.redoStack.pop()!;
    this.currentSignature.updatedAt = new Date().toISOString();
    this.updateMetadata();
    this.validateSignature();
    this.triggerHaptic('redo');
    return true;
  }

  // Check if can undo
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  // Check if can redo
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  // Update settings
  updateSettings(newSettings: Partial<SignatureSettings>): SignatureSettings {
    this.settings = { ...this.settings, ...newSettings };
    return this.settings;
  }

  // Get current settings
  getSettings(): SignatureSettings {
    return { ...this.settings };
  }

  // Set color
  setColor(color: SignatureColor): void {
    this.settings.color = color;
  }

  // Set thickness
  setThickness(thickness: SignatureThickness): void {
    this.settings.thickness = thickness;
  }

  // Get available colors
  getAvailableColors(): { id: SignatureColor; hex: string; name: string }[] {
    return [
      { id: 'black', hex: '#000000', name: 'Black' },
      { id: 'blue', hex: '#0066CC', name: 'Blue' },
      { id: 'navy', hex: '#001F3F', name: 'Navy' },
      { id: 'dark-gray', hex: '#333333', name: 'Dark Gray' },
    ];
  }

  // Get available thicknesses
  getAvailableThicknesses(): { id: SignatureThickness; pixels: number; name: string }[] {
    return [
      { id: 'thin', pixels: 1, name: 'Thin' },
      { id: 'medium', pixels: 2, name: 'Medium' },
      { id: 'thick', pixels: 3, name: 'Thick' },
      { id: 'extra-thick', pixels: 4, name: 'Extra Thick' },
    ];
  }

  // Export signature
  exportSignature(format: ExportFormat): SignatureExport | null {
    if (!this.currentSignature) return null;

    let data: string;
    let fileSize: number;
    const filename = `signature_${this.currentSignature.signedBy.replace(/\s+/g, '_')}_${Date.now()}`;

    switch (format) {
      case 'base64':
        data = this.generateBase64();
        fileSize = data.length;
        break;
      case 'svg':
        data = this.generateSVG();
        fileSize = data.length;
        break;
      case 'json':
        data = JSON.stringify(this.currentSignature, null, 2);
        fileSize = data.length;
        break;
      case 'png':
      default:
        data = this.generateBase64();
        fileSize = data.length;
        break;
    }

    return {
      format,
      data,
      width: this.currentSignature.width,
      height: this.currentSignature.height,
      fileSize,
      filename: `${filename}.${format === 'base64' ? 'png' : format}`,
    };
  }

  // Generate base64 representation
  private generateBase64(): string {
    if (!this.currentSignature) return '';
    
    // In a real implementation, this would render to canvas and export
    // For now, return a placeholder that represents the signature data
    const signatureJson = JSON.stringify({
      strokes: this.currentSignature.strokes,
      width: this.currentSignature.width,
      height: this.currentSignature.height,
    });
    
    // Simulate base64 encoding
    return `data:image/png;base64,${Buffer.from(signatureJson).toString('base64')}`;
  }

  // Generate SVG representation
  private generateSVG(): string {
    if (!this.currentSignature) return '';

    const { width, height, strokes } = this.currentSignature;
    
    let paths = '';
    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      
      let d = `M ${stroke.points[0].x} ${stroke.points[0].y}`;
      for (let i = 1; i < stroke.points.length; i++) {
        const p = stroke.points[i];
        d += ` L ${p.x} ${p.y}`;
      }
      
      paths += `<path d="${d}" stroke="${stroke.color}" stroke-width="${stroke.thickness}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${this.settings.backgroundColor}"/>
  ${paths}
</svg>`;
  }

  // Compare two signatures
  compareSignatures(sig1Id: string, sig2Id: string): SignatureComparison | null {
    const sig1 = this.signatures.get(sig1Id);
    const sig2 = this.signatures.get(sig2Id);

    if (!sig1 || !sig2) return null;

    const details: string[] = [];
    
    // Compare stroke counts
    const strokeCountDiff = Math.abs(sig1.strokes.length - sig2.strokes.length);
    const strokeCountMatch = strokeCountDiff <= 2;
    details.push(`Stroke count difference: ${strokeCountDiff}`);

    // Compare proportions
    const bounds1 = this.getBoundsForSignature(sig1);
    const bounds2 = this.getBoundsForSignature(sig2);
    
    let proportionMatch = false;
    if (bounds1 && bounds2) {
      const ratio1 = bounds1.width / bounds1.height;
      const ratio2 = bounds2.width / bounds2.height;
      proportionMatch = Math.abs(ratio1 - ratio2) < 0.3;
      details.push(`Proportion ratio difference: ${Math.abs(ratio1 - ratio2).toFixed(2)}`);
    }

    // Compare flow (average points per stroke)
    const avgPoints1 = sig1.strokes.reduce((sum, s) => sum + s.points.length, 0) / sig1.strokes.length;
    const avgPoints2 = sig2.strokes.reduce((sum, s) => sum + s.points.length, 0) / sig2.strokes.length;
    const flowMatch = Math.abs(avgPoints1 - avgPoints2) < 20;
    details.push(`Average points difference: ${Math.abs(avgPoints1 - avgPoints2).toFixed(0)}`);

    // Calculate overall similarity
    let similarity = 0;
    if (strokeCountMatch) similarity += 0.3;
    if (proportionMatch) similarity += 0.4;
    if (flowMatch) similarity += 0.3;

    const isLikelyMatch = similarity >= 0.7;
    const confidence = similarity >= 0.8 ? 'high' : similarity >= 0.5 ? 'medium' : 'low';

    return {
      similarity,
      strokeCountMatch,
      proportionMatch,
      flowMatch,
      isLikelyMatch,
      confidence,
      details,
    };
  }

  // Get bounds for a specific signature
  private getBoundsForSignature(sig: SignatureData): { width: number; height: number } | null {
    if (sig.strokes.length === 0) return null;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    sig.strokes.forEach(stroke => {
      stroke.points.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    });

    return {
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  // Get current signature
  getCurrentSignature(): SignatureData | null {
    return this.currentSignature;
  }

  // Get signature by ID
  getSignature(id: string): SignatureData | null {
    return this.signatures.get(id) || null;
  }

  // Get all signatures
  getAllSignatures(): SignatureData[] {
    return Array.from(this.signatures.values());
  }

  // Save signature
  saveSignature(): SignatureData | null {
    if (!this.currentSignature) return null;

    this.validateSignature();
    
    if (!this.currentSignature.isValid) {
      this.triggerHaptic('error');
      return null;
    }

    this.currentSignature.updatedAt = new Date().toISOString();
    this.signatures.set(this.currentSignature.id, this.currentSignature);
    this.triggerHaptic('save');

    return this.currentSignature;
  }

  // Delete signature
  deleteSignature(id: string): boolean {
    return this.signatures.delete(id);
  }

  // Trigger haptic feedback
  private triggerHaptic(type: keyof typeof HAPTIC_PATTERNS): void {
    if (!this.settings.hapticFeedback) return;
    
    // In a real implementation, this would trigger device haptics
    // For now, just log the haptic event
    const pattern = HAPTIC_PATTERNS[type];
    console.log(`Haptic: ${pattern.type} - ${pattern.style}`);
  }

  // Get analytics
  getAnalytics(): {
    totalSignatures: number;
    validSignatures: number;
    invalidSignatures: number;
    averageStrokes: number;
    averageTime: number;
    byPurpose: Record<string, number>;
  } {
    const signatures = Array.from(this.signatures.values());
    const valid = signatures.filter(s => s.isValid);
    
    const byPurpose: Record<string, number> = {};
    signatures.forEach(s => {
      byPurpose[s.purpose] = (byPurpose[s.purpose] || 0) + 1;
    });

    const totalStrokes = signatures.reduce((sum, s) => sum + s.strokes.length, 0);
    const totalTime = signatures.reduce((sum, s) => sum + s.metadata.totalTime, 0);

    return {
      totalSignatures: signatures.length,
      validSignatures: valid.length,
      invalidSignatures: signatures.length - valid.length,
      averageStrokes: signatures.length > 0 ? totalStrokes / signatures.length : 0,
      averageTime: signatures.length > 0 ? totalTime / signatures.length : 0,
      byPurpose,
    };
  }

  // Reset service
  reset(): void {
    this.signatures.clear();
    this.currentSignature = null;
    this.currentStroke = null;
    this.undoStack = [];
    this.redoStack = [];
  }
}

export const signaturePadService = new SignaturePadService();
