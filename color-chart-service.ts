/**
 * MediVac WACHS Standard Color Chart Service
 * Comprehensive color coding system for all features and data pathways
 */

// ============================================================================
// MEDICAL STATUS COLORS (Hospital Emergency Codes)
// ============================================================================
export const MEDICAL_STATUS_COLORS = {
  code_blue: { hex: "#1E40AF", name: "Code Blue", description: "Cardiac/Respiratory Arrest", rgb: "30, 64, 175" },
  code_red: { hex: "#DC2626", name: "Code Red", description: "Fire Emergency", rgb: "220, 38, 38" },
  code_yellow: { hex: "#F59E0B", name: "Code Yellow", description: "Internal Emergency", rgb: "245, 158, 11" },
  code_orange: { hex: "#EA580C", name: "Code Orange", description: "External Disaster", rgb: "234, 88, 12" },
  code_green: { hex: "#16A34A", name: "Code Green", description: "Evacuation", rgb: "22, 163, 74" },
  code_purple: { hex: "#7C3AED", name: "Code Purple", description: "Hostage/Violent Situation", rgb: "124, 58, 237" },
  code_pink: { hex: "#EC4899", name: "Code Pink", description: "Infant/Child Abduction", rgb: "236, 72, 153" },
  code_black: { hex: "#1F2937", name: "Code Black", description: "Bomb Threat", rgb: "31, 41, 55" },
  code_brown: { hex: "#92400E", name: "Code Brown", description: "Hazardous Spill", rgb: "146, 64, 14" },
  code_white: { hex: "#F3F4F6", name: "Code White", description: "Aggressive Person", rgb: "243, 244, 246" },
  code_gray: { hex: "#6B7280", name: "Code Gray", description: "System Failure", rgb: "107, 114, 128" },
  code_silver: { hex: "#9CA3AF", name: "Code Silver", description: "Active Shooter", rgb: "156, 163, 175" },
} as const;

// ============================================================================
// JEDI RANK COLORS
// ============================================================================
export const JEDI_RANK_COLORS = {
  youngling: { hex: "#A7F3D0", name: "Youngling", level: 1, rgb: "167, 243, 208" },
  padawan: { hex: "#34D399", name: "Padawan", level: 2, rgb: "52, 211, 153" },
  knight: { hex: "#3B82F6", name: "Knight", level: 3, rgb: "59, 130, 246" },
  guardian: { hex: "#6366F1", name: "Guardian", level: 4, rgb: "99, 102, 241" },
  sentinel: { hex: "#8B5CF6", name: "Sentinel", level: 5, rgb: "139, 92, 246" },
  master: { hex: "#A855F7", name: "Master", level: 6, rgb: "168, 85, 247" },
  council_member: { hex: "#D946EF", name: "Council Member", level: 7, rgb: "217, 70, 239" },
  grand_master: { hex: "#FFD700", name: "Grand Master", level: 8, rgb: "255, 215, 0" },
  supreme_commander: { hex: "#F59E0B", name: "Supreme Commander", level: 9, rgb: "245, 158, 11" },
  force_ghost: { hex: "#93C5FD", name: "Force Ghost", level: 10, rgb: "147, 197, 253", opacity: 0.7 },
} as const;

// ============================================================================
// DATA PATHWAY COLORS
// ============================================================================
export const DATA_PATHWAY_COLORS = {
  l1_cache: { hex: "#22C55E", name: "L1 Memory Cache", description: "Fast in-memory storage", speed: "instant", rgb: "34, 197, 94" },
  l2_async: { hex: "#3B82F6", name: "L2 AsyncStorage", description: "Persistent local storage", speed: "fast", rgb: "59, 130, 246" },
  l3_s3: { hex: "#8B5CF6", name: "L3 S3 Cloud", description: "Cloud synchronization", speed: "moderate", rgb: "139, 92, 246" },
  websocket: { hex: "#F97316", name: "WebSocket", description: "Real-time live data", speed: "instant", rgb: "249, 115, 22" },
  api_rest: { hex: "#06B6D4", name: "REST API", description: "External API calls", speed: "variable", rgb: "6, 182, 212" },
  jedi_sync: { hex: "#FFD700", name: "JEDI Sync", description: "JEDI system integration", speed: "fast", rgb: "255, 215, 0" },
  offline_queue: { hex: "#6B7280", name: "Offline Queue", description: "Pending sync operations", speed: "deferred", rgb: "107, 114, 128" },
  tentacle_sync: { hex: "#EC4899", name: "Tentacle Sync", description: "Multi-system sync", speed: "fast", rgb: "236, 72, 153" },
  smpo_protocol: { hex: "#14B8A6", name: "SMPO Protocol", description: "SMPO.ink compliance", speed: "moderate", rgb: "20, 184, 166" },
} as const;

// ============================================================================
// PRIORITY COLORS
// ============================================================================
export const PRIORITY_COLORS = {
  critical: { hex: "#DC2626", name: "Critical", level: 5, description: "Immediate action required", rgb: "220, 38, 38" },
  high: { hex: "#F97316", name: "High", level: 4, description: "Urgent attention needed", rgb: "249, 115, 22" },
  medium: { hex: "#F59E0B", name: "Medium", level: 3, description: "Standard priority", rgb: "245, 158, 11" },
  low: { hex: "#22C55E", name: "Low", level: 2, description: "Can wait", rgb: "34, 197, 94" },
  minimal: { hex: "#6B7280", name: "Minimal", level: 1, description: "Background task", rgb: "107, 114, 128" },
} as const;

// ============================================================================
// DEPARTMENT COLORS
// ============================================================================
export const DEPARTMENT_COLORS = {
  emergency: { hex: "#DC2626", name: "Emergency", code: "ED", rgb: "220, 38, 38" },
  surgery: { hex: "#7C3AED", name: "Surgery", code: "OR", rgb: "124, 58, 237" },
  icu: { hex: "#1E40AF", name: "ICU", code: "ICU", rgb: "30, 64, 175" },
  general: { hex: "#22C55E", name: "General Ward", code: "GEN", rgb: "34, 197, 94" },
  pediatrics: { hex: "#EC4899", name: "Pediatrics", code: "PED", rgb: "236, 72, 153" },
  maternity: { hex: "#F472B6", name: "Maternity", code: "MAT", rgb: "244, 114, 182" },
  cardiology: { hex: "#EF4444", name: "Cardiology", code: "CARD", rgb: "239, 68, 68" },
  neurology: { hex: "#8B5CF6", name: "Neurology", code: "NEURO", rgb: "139, 92, 246" },
  oncology: { hex: "#6366F1", name: "Oncology", code: "ONC", rgb: "99, 102, 241" },
  radiology: { hex: "#06B6D4", name: "Radiology", code: "RAD", rgb: "6, 182, 212" },
  pathology: { hex: "#14B8A6", name: "Pathology", code: "PATH", rgb: "20, 184, 166" },
  pharmacy: { hex: "#10B981", name: "Pharmacy", code: "PHARM", rgb: "16, 185, 129" },
  mental_health: { hex: "#A855F7", name: "Mental Health", code: "MH", rgb: "168, 85, 247" },
  rehabilitation: { hex: "#F59E0B", name: "Rehabilitation", code: "REHAB", rgb: "245, 158, 11" },
  administration: { hex: "#6B7280", name: "Administration", code: "ADMIN", rgb: "107, 114, 128" },
} as const;

// ============================================================================
// ALERT SEVERITY COLORS
// ============================================================================
export const ALERT_SEVERITY_COLORS = {
  emergency: { hex: "#DC2626", name: "Emergency", icon: "🚨", pulse: true, rgb: "220, 38, 38" },
  critical: { hex: "#EF4444", name: "Critical", icon: "⚠️", pulse: true, rgb: "239, 68, 68" },
  warning: { hex: "#F59E0B", name: "Warning", icon: "⚡", pulse: false, rgb: "245, 158, 11" },
  info: { hex: "#3B82F6", name: "Information", icon: "ℹ️", pulse: false, rgb: "59, 130, 246" },
  success: { hex: "#22C55E", name: "Success", icon: "✓", pulse: false, rgb: "34, 197, 94" },
  neutral: { hex: "#6B7280", name: "Neutral", icon: "○", pulse: false, rgb: "107, 114, 128" },
} as const;

// ============================================================================
// STATUS INDICATOR COLORS
// ============================================================================
export const STATUS_INDICATOR_COLORS = {
  online: { hex: "#22C55E", name: "Online", description: "Connected and active", rgb: "34, 197, 94" },
  offline: { hex: "#6B7280", name: "Offline", description: "Not connected", rgb: "107, 114, 128" },
  busy: { hex: "#F59E0B", name: "Busy", description: "Currently occupied", rgb: "245, 158, 11" },
  away: { hex: "#F97316", name: "Away", description: "Temporarily unavailable", rgb: "249, 115, 22" },
  do_not_disturb: { hex: "#DC2626", name: "Do Not Disturb", description: "No interruptions", rgb: "220, 38, 38" },
  in_meeting: { hex: "#8B5CF6", name: "In Meeting", description: "In a meeting", rgb: "139, 92, 246" },
  on_call: { hex: "#3B82F6", name: "On Call", description: "Available for emergencies", rgb: "59, 130, 246" },
  break: { hex: "#06B6D4", name: "On Break", description: "Taking a break", rgb: "6, 182, 212" },
} as const;

// ============================================================================
// SYNC STATUS COLORS
// ============================================================================
export const SYNC_STATUS_COLORS = {
  synced: { hex: "#22C55E", name: "Synced", description: "All data synchronized", rgb: "34, 197, 94" },
  syncing: { hex: "#3B82F6", name: "Syncing", description: "Synchronization in progress", animated: true, rgb: "59, 130, 246" },
  pending: { hex: "#F59E0B", name: "Pending", description: "Waiting to sync", rgb: "245, 158, 11" },
  conflict: { hex: "#F97316", name: "Conflict", description: "Sync conflict detected", rgb: "249, 115, 22" },
  error: { hex: "#DC2626", name: "Error", description: "Sync failed", rgb: "220, 38, 38" },
  offline: { hex: "#6B7280", name: "Offline", description: "No connection", rgb: "107, 114, 128" },
} as const;

// ============================================================================
// FEATURE CATEGORY COLORS
// ============================================================================
export const FEATURE_CATEGORY_COLORS = {
  ai_assistants: { hex: "#8B5CF6", name: "AI Assistants", icon: "sparkles", rgb: "139, 92, 246" },
  authentication: { hex: "#6366F1", name: "Authentication", icon: "key.fill", rgb: "99, 102, 241" },
  communications: { hex: "#3B82F6", name: "Communications", icon: "bubble.left.fill", rgb: "59, 130, 246" },
  patient_care: { hex: "#22C55E", name: "Patient Care", icon: "heart.fill", rgb: "34, 197, 94" },
  administration: { hex: "#6B7280", name: "Administration", icon: "gear", rgb: "107, 114, 128" },
  analytics: { hex: "#06B6D4", name: "Analytics", icon: "chart.bar.fill", rgb: "6, 182, 212" },
  integrations: { hex: "#14B8A6", name: "Integrations", icon: "network", rgb: "20, 184, 166" },
  jedi_systems: { hex: "#FFD700", name: "JEDI Systems", icon: "shield.fill", rgb: "255, 215, 0" },
  store_management: { hex: "#EC4899", name: "Store Management", icon: "cube.fill", rgb: "236, 72, 153" },
  voice_recording: { hex: "#F97316", name: "Voice Recording", icon: "waveform.path.ecg", rgb: "249, 115, 22" },
} as const;

// ============================================================================
// ACCESSIBILITY CONTRAST RATIOS
// ============================================================================
export interface ContrastResult {
  ratio: number;
  aa_normal: boolean;
  aa_large: boolean;
  aaa_normal: boolean;
  aaa_large: boolean;
}

export interface ColorDefinition {
  hex: string;
  name: string;
  rgb: string;
  description?: string;
  [key: string]: unknown;
}

// ============================================================================
// COLOR CHART SERVICE
// ============================================================================
class ColorChartService {
  private listeners: Set<() => void> = new Set();

  // Get luminance for contrast calculation
  private getLuminance(hex: string): number {
    const rgb = this.hexToRgb(hex);
    const [r, g, b] = rgb.map((c) => {
      const sRGB = c / 255;
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // Convert hex to RGB array
  private hexToRgb(hex: string): number[] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
  }

  // Calculate contrast ratio between two colors
  calculateContrastRatio(color1: string, color2: string): ContrastResult {
    const l1 = this.getLuminance(color1);
    const l2 = this.getLuminance(color2);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return {
      ratio: Math.round(ratio * 100) / 100,
      aa_normal: ratio >= 4.5,
      aa_large: ratio >= 3,
      aaa_normal: ratio >= 7,
      aaa_large: ratio >= 4.5,
    };
  }

  // Get all medical status colors
  getMedicalStatusColors(): typeof MEDICAL_STATUS_COLORS {
    return MEDICAL_STATUS_COLORS;
  }

  // Get all JEDI rank colors
  getJediRankColors(): typeof JEDI_RANK_COLORS {
    return JEDI_RANK_COLORS;
  }

  // Get all data pathway colors
  getDataPathwayColors(): typeof DATA_PATHWAY_COLORS {
    return DATA_PATHWAY_COLORS;
  }

  // Get all priority colors
  getPriorityColors(): typeof PRIORITY_COLORS {
    return PRIORITY_COLORS;
  }

  // Get all department colors
  getDepartmentColors(): typeof DEPARTMENT_COLORS {
    return DEPARTMENT_COLORS;
  }

  // Get all alert severity colors
  getAlertSeverityColors(): typeof ALERT_SEVERITY_COLORS {
    return ALERT_SEVERITY_COLORS;
  }

  // Get all status indicator colors
  getStatusIndicatorColors(): typeof STATUS_INDICATOR_COLORS {
    return STATUS_INDICATOR_COLORS;
  }

  // Get all sync status colors
  getSyncStatusColors(): typeof SYNC_STATUS_COLORS {
    return SYNC_STATUS_COLORS;
  }

  // Get all feature category colors
  getFeatureCategoryColors(): typeof FEATURE_CATEGORY_COLORS {
    return FEATURE_CATEGORY_COLORS;
  }

  // Get color by medical code
  getMedicalCodeColor(code: keyof typeof MEDICAL_STATUS_COLORS): (typeof MEDICAL_STATUS_COLORS)[keyof typeof MEDICAL_STATUS_COLORS] | null {
    return MEDICAL_STATUS_COLORS[code] || null;
  }

  // Get color by JEDI rank
  getJediRankColor(rank: keyof typeof JEDI_RANK_COLORS): (typeof JEDI_RANK_COLORS)[keyof typeof JEDI_RANK_COLORS] | null {
    return JEDI_RANK_COLORS[rank] || null;
  }

  // Get color by data pathway
  getDataPathwayColor(pathway: keyof typeof DATA_PATHWAY_COLORS): (typeof DATA_PATHWAY_COLORS)[keyof typeof DATA_PATHWAY_COLORS] | null {
    return DATA_PATHWAY_COLORS[pathway] || null;
  }

  // Get color by priority
  getPriorityColor(priority: keyof typeof PRIORITY_COLORS): (typeof PRIORITY_COLORS)[keyof typeof PRIORITY_COLORS] | null {
    return PRIORITY_COLORS[priority] || null;
  }

  // Get color by department
  getDepartmentColor(department: keyof typeof DEPARTMENT_COLORS): (typeof DEPARTMENT_COLORS)[keyof typeof DEPARTMENT_COLORS] | null {
    return DEPARTMENT_COLORS[department] || null;
  }

  // Get all colors as a unified chart
  getFullColorChart(): {
    medical: typeof MEDICAL_STATUS_COLORS;
    jedi: typeof JEDI_RANK_COLORS;
    pathway: typeof DATA_PATHWAY_COLORS;
    priority: typeof PRIORITY_COLORS;
    department: typeof DEPARTMENT_COLORS;
    alert: typeof ALERT_SEVERITY_COLORS;
    status: typeof STATUS_INDICATOR_COLORS;
    sync: typeof SYNC_STATUS_COLORS;
    feature: typeof FEATURE_CATEGORY_COLORS;
  } {
    return {
      medical: MEDICAL_STATUS_COLORS,
      jedi: JEDI_RANK_COLORS,
      pathway: DATA_PATHWAY_COLORS,
      priority: PRIORITY_COLORS,
      department: DEPARTMENT_COLORS,
      alert: ALERT_SEVERITY_COLORS,
      status: STATUS_INDICATOR_COLORS,
      sync: SYNC_STATUS_COLORS,
      feature: FEATURE_CATEGORY_COLORS,
    };
  }

  // Generate CSS variables for all colors
  generateCssVariables(): string {
    const lines: string[] = [":root {"];

    // Medical status colors
    Object.entries(MEDICAL_STATUS_COLORS).forEach(([key, value]) => {
      lines.push(`  --color-medical-${key.replace(/_/g, "-")}: ${value.hex};`);
    });

    // JEDI rank colors
    Object.entries(JEDI_RANK_COLORS).forEach(([key, value]) => {
      lines.push(`  --color-jedi-${key.replace(/_/g, "-")}: ${value.hex};`);
    });

    // Data pathway colors
    Object.entries(DATA_PATHWAY_COLORS).forEach(([key, value]) => {
      lines.push(`  --color-pathway-${key.replace(/_/g, "-")}: ${value.hex};`);
    });

    // Priority colors
    Object.entries(PRIORITY_COLORS).forEach(([key, value]) => {
      lines.push(`  --color-priority-${key}: ${value.hex};`);
    });

    // Department colors
    Object.entries(DEPARTMENT_COLORS).forEach(([key, value]) => {
      lines.push(`  --color-dept-${key.replace(/_/g, "-")}: ${value.hex};`);
    });

    // Alert severity colors
    Object.entries(ALERT_SEVERITY_COLORS).forEach(([key, value]) => {
      lines.push(`  --color-alert-${key}: ${value.hex};`);
    });

    // Status indicator colors
    Object.entries(STATUS_INDICATOR_COLORS).forEach(([key, value]) => {
      lines.push(`  --color-status-${key.replace(/_/g, "-")}: ${value.hex};`);
    });

    // Sync status colors
    Object.entries(SYNC_STATUS_COLORS).forEach(([key, value]) => {
      lines.push(`  --color-sync-${key}: ${value.hex};`);
    });

    // Feature category colors
    Object.entries(FEATURE_CATEGORY_COLORS).forEach(([key, value]) => {
      lines.push(`  --color-feature-${key.replace(/_/g, "-")}: ${value.hex};`);
    });

    lines.push("}");
    return lines.join("\n");
  }

  // Get color with opacity
  getColorWithOpacity(hex: string, opacity: number): string {
    const rgb = this.hexToRgb(hex);
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
  }

  // Find best text color for background
  getBestTextColor(backgroundColor: string): string {
    const whiteContrast = this.calculateContrastRatio(backgroundColor, "#FFFFFF");
    const blackContrast = this.calculateContrastRatio(backgroundColor, "#000000");
    return whiteContrast.ratio > blackContrast.ratio ? "#FFFFFF" : "#000000";
  }

  // Validate accessibility for color pair
  validateAccessibility(foreground: string, background: string): {
    passes: boolean;
    level: "AAA" | "AA" | "AA Large" | "Fail";
    contrast: ContrastResult;
  } {
    const contrast = this.calculateContrastRatio(foreground, background);

    if (contrast.aaa_normal) {
      return { passes: true, level: "AAA", contrast };
    } else if (contrast.aa_normal) {
      return { passes: true, level: "AA", contrast };
    } else if (contrast.aa_large) {
      return { passes: true, level: "AA Large", contrast };
    }
    return { passes: false, level: "Fail", contrast };
  }

  // Subscribe to changes
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners
  private notify(): void {
    this.listeners.forEach((callback) => callback());
  }

  // Get analytics
  getAnalytics(): {
    totalColors: number;
    categories: number;
    accessiblePairs: number;
  } {
    const allColors = [
      ...Object.values(MEDICAL_STATUS_COLORS),
      ...Object.values(JEDI_RANK_COLORS),
      ...Object.values(DATA_PATHWAY_COLORS),
      ...Object.values(PRIORITY_COLORS),
      ...Object.values(DEPARTMENT_COLORS),
      ...Object.values(ALERT_SEVERITY_COLORS),
      ...Object.values(STATUS_INDICATOR_COLORS),
      ...Object.values(SYNC_STATUS_COLORS),
      ...Object.values(FEATURE_CATEGORY_COLORS),
    ];

    // Count accessible pairs with white and black text
    let accessiblePairs = 0;
    allColors.forEach((color) => {
      const whiteResult = this.validateAccessibility("#FFFFFF", color.hex);
      const blackResult = this.validateAccessibility("#000000", color.hex);
      if (whiteResult.passes || blackResult.passes) accessiblePairs++;
    });

    return {
      totalColors: allColors.length,
      categories: 9,
      accessiblePairs,
    };
  }
}

export const colorChartService = new ColorChartService();
