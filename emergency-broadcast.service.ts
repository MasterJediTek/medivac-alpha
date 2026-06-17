/**
 * Emergency Broadcast Service
 * 
 * Staff-only emergency broadcast system:
 * - Staff authentication check
 * - Emergency message input
 * - Visual overlay on all TVs
 * - All-TV broadcast capability
 * - Emergency deactivation
 */

// ============================================================================
// TYPES
// ============================================================================

export type EmergencyLevel = 'info' | 'warning' | 'critical' | 'evacuation';

export interface EmergencyBroadcast {
  id: string;
  level: EmergencyLevel;
  title: string;
  message: string;
  instructions: string[];
  activatedBy: string;
  activatedAt: Date;
  expiresAt: Date | null;
  affectedAreas: string[];
  isActive: boolean;
}

export interface StaffCredentials {
  staffId: string;
  name: string;
  role: 'nurse' | 'doctor' | 'admin' | 'security' | 'manager';
  department: string;
  canActivateEmergency: boolean;
}

export interface EmergencyPreset {
  id: string;
  level: EmergencyLevel;
  title: string;
  message: string;
  instructions: string[];
  icon: string;
  color: string;
}

export interface EmergencyState {
  isActive: boolean;
  currentBroadcast: EmergencyBroadcast | null;
  history: EmergencyBroadcast[];
  authorizedStaff: StaffCredentials | null;
}

export interface EmergencyListener {
  onEmergencyActivate?: (broadcast: EmergencyBroadcast) => void;
  onEmergencyDeactivate?: () => void;
  onEmergencyUpdate?: (broadcast: EmergencyBroadcast) => void;
}

// ============================================================================
// EMERGENCY PRESETS
// ============================================================================

export const EMERGENCY_PRESETS: EmergencyPreset[] = [
  {
    id: 'code-blue',
    level: 'critical',
    title: 'CODE BLUE - Medical Emergency',
    message: 'A medical emergency has been declared. Emergency response team to designated location.',
    instructions: [
      'Clear corridors for emergency team',
      'Do not use elevators',
      'Follow staff instructions',
      'Remain calm',
    ],
    icon: '🔵',
    color: '#2563EB',
  },
  {
    id: 'code-red',
    level: 'evacuation',
    title: 'CODE RED - Fire Emergency',
    message: 'Fire emergency declared. Prepare for possible evacuation.',
    instructions: [
      'Do not use elevators',
      'Proceed to nearest exit',
      'Close doors behind you',
      'Assist patients if safe to do so',
      'Assemble at designated muster point',
    ],
    icon: '🔴',
    color: '#DC2626',
  },
  {
    id: 'code-orange',
    level: 'warning',
    title: 'CODE ORANGE - External Disaster',
    message: 'External disaster response activated. Hospital preparing for mass casualty event.',
    instructions: [
      'Non-essential visitors please leave',
      'Staff report to department heads',
      'Clear emergency department access',
      'Await further instructions',
    ],
    icon: '🟠',
    color: '#EA580C',
  },
  {
    id: 'code-yellow',
    level: 'warning',
    title: 'CODE YELLOW - Internal Emergency',
    message: 'Internal emergency declared. Infrastructure or utility issue detected.',
    instructions: [
      'Remain in current location',
      'Follow staff instructions',
      'Report any hazards',
      'Await all-clear announcement',
    ],
    icon: '🟡',
    color: '#CA8A04',
  },
  {
    id: 'code-purple',
    level: 'critical',
    title: 'CODE PURPLE - Bomb Threat',
    message: 'Security threat detected. Lockdown procedures in effect.',
    instructions: [
      'Remain calm',
      'Do not touch suspicious items',
      'Follow security instructions',
      'Do not use mobile phones',
      'Await all-clear announcement',
    ],
    icon: '🟣',
    color: '#7C3AED',
  },
  {
    id: 'code-black',
    level: 'critical',
    title: 'CODE BLACK - Personal Threat',
    message: 'Personal threat situation. Security lockdown in effect.',
    instructions: [
      'Lock doors if possible',
      'Stay away from windows',
      'Remain silent',
      'Do not open doors',
      'Wait for security all-clear',
    ],
    icon: '⚫',
    color: '#1F2937',
  },
  {
    id: 'code-brown',
    level: 'warning',
    title: 'CODE BROWN - Severe Weather',
    message: 'Severe weather warning in effect for Kalgoorlie region.',
    instructions: [
      'Stay indoors',
      'Move away from windows',
      'Secure loose items',
      'Monitor for updates',
    ],
    icon: '🟤',
    color: '#92400E',
  },
  {
    id: 'lockdown',
    level: 'critical',
    title: 'HOSPITAL LOCKDOWN',
    message: 'Full hospital lockdown in effect. All entries and exits secured.',
    instructions: [
      'Remain in current location',
      'Do not attempt to leave',
      'Follow all staff instructions',
      'Await lockdown release announcement',
    ],
    icon: '🔒',
    color: '#374151',
  },
  {
    id: 'all-clear',
    level: 'info',
    title: 'ALL CLEAR',
    message: 'Emergency situation has been resolved. Normal operations resuming.',
    instructions: [
      'Resume normal activities',
      'Report any remaining concerns to staff',
      'Thank you for your cooperation',
    ],
    icon: '✅',
    color: '#059669',
  },
];

// ============================================================================
// AUTHORIZED STAFF (Demo purposes)
// ============================================================================

export const DEMO_STAFF: StaffCredentials[] = [
  {
    staffId: 'STAFF001',
    name: 'Dr. Sarah Mitchell',
    role: 'doctor',
    department: 'Emergency',
    canActivateEmergency: true,
  },
  {
    staffId: 'STAFF002',
    name: 'Nurse James Wilson',
    role: 'nurse',
    department: 'Medical Ward',
    canActivateEmergency: true,
  },
  {
    staffId: 'STAFF003',
    name: 'Admin Lisa Chen',
    role: 'admin',
    department: 'Administration',
    canActivateEmergency: true,
  },
  {
    staffId: 'STAFF004',
    name: 'Security Officer Mike Brown',
    role: 'security',
    department: 'Security',
    canActivateEmergency: true,
  },
  {
    staffId: 'STAFF005',
    name: 'Hospital Manager David Lee',
    role: 'manager',
    department: 'Management',
    canActivateEmergency: true,
  },
];

// ============================================================================
// SERVICE CLASS
// ============================================================================

class EmergencyBroadcastService {
  private isActive: boolean;
  private currentBroadcast: EmergencyBroadcast | null;
  private history: EmergencyBroadcast[];
  private authorizedStaff: StaffCredentials | null;
  private listeners: Set<EmergencyListener>;
  private expirationTimeout: NodeJS.Timeout | null;

  constructor() {
    this.isActive = false;
    this.currentBroadcast = null;
    this.history = [];
    this.authorizedStaff = null;
    this.listeners = new Set();
    this.expirationTimeout = null;
  }

  /**
   * Get current state
   */
  getState(): EmergencyState {
    return {
      isActive: this.isActive,
      currentBroadcast: this.currentBroadcast ? { ...this.currentBroadcast } : null,
      history: [...this.history],
      authorizedStaff: this.authorizedStaff ? { ...this.authorizedStaff } : null,
    };
  }

  /**
   * Authenticate staff member
   */
  authenticateStaff(staffId: string): boolean {
    const staff = DEMO_STAFF.find(s => s.staffId === staffId);
    if (staff && staff.canActivateEmergency) {
      this.authorizedStaff = staff;
      return true;
    }
    return false;
  }

  /**
   * Check if staff is authenticated
   */
  isStaffAuthenticated(): boolean {
    return this.authorizedStaff !== null && this.authorizedStaff.canActivateEmergency;
  }

  /**
   * Get current authorized staff
   */
  getAuthorizedStaff(): StaffCredentials | null {
    return this.authorizedStaff ? { ...this.authorizedStaff } : null;
  }

  /**
   * Logout staff
   */
  logoutStaff(): void {
    this.authorizedStaff = null;
  }

  /**
   * Get emergency presets
   */
  getPresets(): EmergencyPreset[] {
    return [...EMERGENCY_PRESETS];
  }

  /**
   * Get preset by ID
   */
  getPreset(presetId: string): EmergencyPreset | undefined {
    return EMERGENCY_PRESETS.find(p => p.id === presetId);
  }

  /**
   * Activate emergency from preset
   */
  activateFromPreset(
    presetId: string,
    affectedAreas: string[] = ['All Areas'],
    durationMinutes?: number
  ): EmergencyBroadcast | null {
    if (!this.isStaffAuthenticated()) {
      console.error('Staff not authenticated');
      return null;
    }

    const preset = this.getPreset(presetId);
    if (!preset) {
      console.error('Preset not found:', presetId);
      return null;
    }

    return this.activateEmergency({
      level: preset.level,
      title: preset.title,
      message: preset.message,
      instructions: preset.instructions,
      affectedAreas,
      durationMinutes,
    });
  }

  /**
   * Activate custom emergency
   */
  activateEmergency(params: {
    level: EmergencyLevel;
    title: string;
    message: string;
    instructions: string[];
    affectedAreas?: string[];
    durationMinutes?: number;
  }): EmergencyBroadcast | null {
    if (!this.isStaffAuthenticated()) {
      console.error('Staff not authenticated');
      return null;
    }

    // Deactivate any existing emergency
    if (this.isActive) {
      this.deactivateEmergency();
    }

    const now = new Date();
    const expiresAt = params.durationMinutes 
      ? new Date(now.getTime() + params.durationMinutes * 60 * 1000)
      : null;

    const broadcast: EmergencyBroadcast = {
      id: `emergency-${Date.now()}`,
      level: params.level,
      title: params.title,
      message: params.message,
      instructions: params.instructions,
      activatedBy: this.authorizedStaff!.name,
      activatedAt: now,
      expiresAt,
      affectedAreas: params.affectedAreas || ['All Areas'],
      isActive: true,
    };

    this.currentBroadcast = broadcast;
    this.isActive = true;

    // Set expiration timer if duration specified
    if (expiresAt) {
      this.expirationTimeout = setTimeout(() => {
        this.deactivateEmergency();
      }, params.durationMinutes! * 60 * 1000);
    }

    this.notifyEmergencyActivate(broadcast);
    return broadcast;
  }

  /**
   * Update current emergency message
   */
  updateEmergency(updates: Partial<Pick<EmergencyBroadcast, 'message' | 'instructions' | 'affectedAreas'>>): void {
    if (!this.currentBroadcast || !this.isStaffAuthenticated()) return;

    this.currentBroadcast = {
      ...this.currentBroadcast,
      ...updates,
    };

    this.notifyEmergencyUpdate(this.currentBroadcast);
  }

  /**
   * Deactivate emergency
   */
  deactivateEmergency(): void {
    if (!this.currentBroadcast) return;

    // Clear expiration timer
    if (this.expirationTimeout) {
      clearTimeout(this.expirationTimeout);
      this.expirationTimeout = null;
    }

    // Add to history
    this.currentBroadcast.isActive = false;
    this.history.unshift(this.currentBroadcast);
    
    // Keep only last 50 entries
    if (this.history.length > 50) {
      this.history = this.history.slice(0, 50);
    }

    this.currentBroadcast = null;
    this.isActive = false;

    this.notifyEmergencyDeactivate();
  }

  /**
   * Get emergency level color
   */
  getLevelColor(level: EmergencyLevel): string {
    switch (level) {
      case 'info':
        return '#059669';
      case 'warning':
        return '#CA8A04';
      case 'critical':
        return '#DC2626';
      case 'evacuation':
        return '#7C3AED';
      default:
        return '#6B7280';
    }
  }

  /**
   * Get emergency level icon
   */
  getLevelIcon(level: EmergencyLevel): string {
    switch (level) {
      case 'info':
        return 'ℹ️';
      case 'warning':
        return '⚠️';
      case 'critical':
        return '🚨';
      case 'evacuation':
        return '🚪';
      default:
        return '📢';
    }
  }

  /**
   * Check if emergency is active
   */
  isEmergencyActive(): boolean {
    return this.isActive;
  }

  /**
   * Get current broadcast
   */
  getCurrentBroadcast(): EmergencyBroadcast | null {
    return this.currentBroadcast ? { ...this.currentBroadcast } : null;
  }

  /**
   * Get broadcast history
   */
  getHistory(): EmergencyBroadcast[] {
    return [...this.history];
  }

  /**
   * Add listener
   */
  addListener(listener: EmergencyListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify emergency activate
   */
  private notifyEmergencyActivate(broadcast: EmergencyBroadcast): void {
    this.listeners.forEach(l => l.onEmergencyActivate?.(broadcast));
  }

  /**
   * Notify emergency deactivate
   */
  private notifyEmergencyDeactivate(): void {
    this.listeners.forEach(l => l.onEmergencyDeactivate?.());
  }

  /**
   * Notify emergency update
   */
  private notifyEmergencyUpdate(broadcast: EmergencyBroadcast): void {
    this.listeners.forEach(l => l.onEmergencyUpdate?.(broadcast));
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.deactivateEmergency();
    this.listeners.clear();
    this.authorizedStaff = null;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const emergencyBroadcastService = new EmergencyBroadcastService();
export default emergencyBroadcastService;
