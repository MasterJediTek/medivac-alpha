/**
 * Homing Beacon Assignment Service
 * Manages beacon assignment with green code defaults for new users/patients
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'medivac_homing_beacons';

export type BeaconCode = 'green' | 'yellow' | 'orange' | 'red' | 'purple';
export type BeaconStatus = 'active' | 'inactive' | 'maintenance' | 'lost';
export type UserRole = 'patient' | 'staff' | 'admin' | 'wachs_pending';

export interface HomingBeacon {
  id: string;
  code: BeaconCode;
  status: BeaconStatus;
  assignedTo?: string;
  assignedToName?: string;
  assignedToRole?: UserRole;
  assignedAt?: string;
  lastPing?: string;
  batteryLevel?: number;
  location?: {
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: string;
  };
  wachsSite?: string;
  notes?: string;
}

export interface BeaconAssignment {
  beaconId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  assignedBy: string;
  assignedAt: string;
  reason?: string;
}

export const BEACON_CODE_COLORS: Record<BeaconCode, { primary: string; background: string; text: string; description: string }> = {
  green: { 
    primary: '#22C55E', 
    background: '#F0FDF4', 
    text: '#166534',
    description: 'Standard - New patients, routine monitoring'
  },
  yellow: { 
    primary: '#EAB308', 
    background: '#FEFCE8', 
    text: '#854D0E',
    description: 'Caution - Requires periodic check-ins'
  },
  orange: { 
    primary: '#F97316', 
    background: '#FFF7ED', 
    text: '#9A3412',
    description: 'Alert - Elevated monitoring required'
  },
  red: { 
    primary: '#EF4444', 
    background: '#FEF2F2', 
    text: '#991B1B',
    description: 'Critical - Immediate response required'
  },
  purple: { 
    primary: '#A855F7', 
    background: '#FAF5FF', 
    text: '#7E22CE',
    description: 'Special - VIP or special circumstances'
  },
};

export const BEACON_STATUS_COLORS: Record<BeaconStatus, { primary: string; background: string }> = {
  active: { primary: '#22C55E', background: '#F0FDF4' },
  inactive: { primary: '#6B7280', background: '#F3F4F6' },
  maintenance: { primary: '#3B82F6', background: '#EFF6FF' },
  lost: { primary: '#EF4444', background: '#FEF2F2' },
};

// Default beacon code for all new users
export const DEFAULT_BEACON_CODE: BeaconCode = 'green';

class HomingBeaconService {
  private beacons: HomingBeacon[] = [];
  private assignments: BeaconAssignment[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.beacons = data.beacons || [];
        this.assignments = data.assignments || [];
      } else {
        this.generateSampleData();
        await this.save();
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize homing beacons:', error);
      this.generateSampleData();
      this.initialized = true;
    }
  }

  private generateSampleData(): void {
    const now = new Date();
    
    // Generate sample beacons
    this.beacons = [
      // Available beacons (unassigned)
      ...Array.from({ length: 25 }, (_, i) => ({
        id: `BCN-G-${1000 + i}`,
        code: 'green' as BeaconCode,
        status: 'inactive' as BeaconStatus,
        batteryLevel: 100,
      })),
      // Assigned beacons
      {
        id: 'BCN-G-0001',
        code: 'green',
        status: 'active',
        assignedTo: 'P-2024-0892',
        assignedToName: 'John Smith',
        assignedToRole: 'patient',
        assignedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        lastPing: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        batteryLevel: 85,
        location: { lat: -31.9505, lng: 115.8605, accuracy: 10, timestamp: now.toISOString() },
        wachsSite: 'Perth',
      },
      {
        id: 'BCN-G-0002',
        code: 'green',
        status: 'active',
        assignedTo: 'P-2024-0893',
        assignedToName: 'Mary Johnson',
        assignedToRole: 'patient',
        assignedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
        lastPing: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        batteryLevel: 72,
        location: { lat: -31.9523, lng: 115.8613, accuracy: 15, timestamp: now.toISOString() },
        wachsSite: 'Perth',
      },
      {
        id: 'BCN-Y-0001',
        code: 'yellow',
        status: 'active',
        assignedTo: 'P-2024-0850',
        assignedToName: 'Robert Williams',
        assignedToRole: 'patient',
        assignedAt: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
        lastPing: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        batteryLevel: 45,
        location: { lat: -20.7256, lng: 139.4927, accuracy: 25, timestamp: now.toISOString() },
        wachsSite: 'Kimberley',
        notes: 'Requires daily check-in due to remote location',
      },
      {
        id: 'BCN-O-0001',
        code: 'orange',
        status: 'active',
        assignedTo: 'P-2024-0812',
        assignedToName: 'Sarah Davis',
        assignedToRole: 'patient',
        assignedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
        lastPing: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
        batteryLevel: 92,
        location: { lat: -33.8688, lng: 121.8919, accuracy: 8, timestamp: now.toISOString() },
        wachsSite: 'Goldfields',
        notes: 'Post-surgery monitoring - elevated alert for 48 hours',
      },
      {
        id: 'BCN-R-0001',
        code: 'red',
        status: 'active',
        assignedTo: 'P-2024-0799',
        assignedToName: 'Michael Brown',
        assignedToRole: 'patient',
        assignedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        lastPing: now.toISOString(),
        batteryLevel: 98,
        location: { lat: -31.9505, lng: 115.8605, accuracy: 5, timestamp: now.toISOString() },
        wachsSite: 'Perth',
        notes: 'Critical care patient - continuous monitoring',
      },
      {
        id: 'BCN-P-0001',
        code: 'purple',
        status: 'active',
        assignedTo: 'VIP-001',
        assignedToName: 'VIP Patient',
        assignedToRole: 'patient',
        assignedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        lastPing: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
        batteryLevel: 88,
        wachsSite: 'Perth',
        notes: 'Special handling required - privacy protocols active',
      },
    ];

    // Sample assignments history
    this.assignments = [
      {
        beaconId: 'BCN-G-0001',
        userId: 'P-2024-0892',
        userName: 'John Smith',
        userRole: 'patient',
        assignedBy: 'Nurse Wilson',
        assignedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        reason: 'New patient admission - standard green beacon assigned',
      },
      {
        beaconId: 'BCN-G-0002',
        userId: 'P-2024-0893',
        userName: 'Mary Johnson',
        userRole: 'patient',
        assignedBy: 'Dr. Anderson',
        assignedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
        reason: 'New patient - routine monitoring',
      },
    ];
  }

  private async save(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        beacons: this.beacons,
        assignments: this.assignments,
      }));
    } catch (error) {
      console.error('Failed to save homing beacons:', error);
    }
  }

  getBeacons(filter?: { code?: BeaconCode[]; status?: BeaconStatus[]; assigned?: boolean }): HomingBeacon[] {
    let filtered = [...this.beacons];
    
    if (filter?.code?.length) {
      filtered = filtered.filter(b => filter.code!.includes(b.code));
    }
    if (filter?.status?.length) {
      filtered = filtered.filter(b => filter.status!.includes(b.status));
    }
    if (filter?.assigned !== undefined) {
      filtered = filtered.filter(b => filter.assigned ? !!b.assignedTo : !b.assignedTo);
    }
    
    // Sort by code priority (red first) then by last ping
    const codeOrder: Record<BeaconCode, number> = { red: 0, orange: 1, yellow: 2, purple: 3, green: 4 };
    return filtered.sort((a, b) => {
      if (codeOrder[a.code] !== codeOrder[b.code]) {
        return codeOrder[a.code] - codeOrder[b.code];
      }
      if (a.lastPing && b.lastPing) {
        return new Date(b.lastPing).getTime() - new Date(a.lastPing).getTime();
      }
      return 0;
    });
  }

  getAvailableBeacons(code: BeaconCode = 'green'): HomingBeacon[] {
    return this.beacons.filter(b => 
      b.code === code && 
      !b.assignedTo && 
      b.status === 'inactive'
    );
  }

  async assignBeaconToNewUser(
    userId: string,
    userName: string,
    userRole: UserRole = 'patient',
    assignedBy: string,
    beaconCode: BeaconCode = DEFAULT_BEACON_CODE,
    wachsSite?: string,
    notes?: string
  ): Promise<HomingBeacon | null> {
    // Find available beacon with specified code
    let beacon = this.beacons.find(b => 
      b.code === beaconCode && 
      !b.assignedTo && 
      b.status === 'inactive'
    );
    
    // If no beacon of specified code, try green (default)
    if (!beacon && beaconCode !== 'green') {
      beacon = this.beacons.find(b => 
        b.code === 'green' && 
        !b.assignedTo && 
        b.status === 'inactive'
      );
    }
    
    if (!beacon) return null;
    
    const now = new Date().toISOString();
    
    // Assign beacon
    beacon.assignedTo = userId;
    beacon.assignedToName = userName;
    beacon.assignedToRole = userRole;
    beacon.assignedAt = now;
    beacon.status = 'active';
    beacon.wachsSite = wachsSite;
    beacon.notes = notes;
    
    // Record assignment
    this.assignments.unshift({
      beaconId: beacon.id,
      userId,
      userName,
      userRole,
      assignedBy,
      assignedAt: now,
      reason: `New ${userRole} - ${beaconCode} beacon assigned`,
    });
    
    await this.save();
    return beacon;
  }

  async upgradeBeaconCode(beaconId: string, newCode: BeaconCode, reason: string, upgradedBy: string): Promise<boolean> {
    const beacon = this.beacons.find(b => b.id === beaconId);
    if (!beacon) return false;
    
    const oldCode = beacon.code;
    beacon.code = newCode;
    
    // Update beacon ID to reflect new code
    const prefix = `BCN-${newCode.charAt(0).toUpperCase()}-`;
    if (!beacon.id.startsWith(prefix)) {
      const num = beacon.id.split('-').pop();
      beacon.id = `${prefix}${num}`;
    }
    
    // Record the change
    this.assignments.unshift({
      beaconId: beacon.id,
      userId: beacon.assignedTo || '',
      userName: beacon.assignedToName || '',
      userRole: beacon.assignedToRole || 'patient',
      assignedBy: upgradedBy,
      assignedAt: new Date().toISOString(),
      reason: `Code upgraded from ${oldCode} to ${newCode}: ${reason}`,
    });
    
    await this.save();
    return true;
  }

  async unassignBeacon(beaconId: string, unassignedBy: string, reason?: string): Promise<boolean> {
    const beacon = this.beacons.find(b => b.id === beaconId);
    if (!beacon || !beacon.assignedTo) return false;
    
    // Record unassignment
    this.assignments.unshift({
      beaconId: beacon.id,
      userId: beacon.assignedTo,
      userName: beacon.assignedToName || '',
      userRole: beacon.assignedToRole || 'patient',
      assignedBy: unassignedBy,
      assignedAt: new Date().toISOString(),
      reason: `Beacon unassigned: ${reason || 'No reason provided'}`,
    });
    
    // Clear assignment
    beacon.assignedTo = undefined;
    beacon.assignedToName = undefined;
    beacon.assignedToRole = undefined;
    beacon.assignedAt = undefined;
    beacon.status = 'inactive';
    beacon.location = undefined;
    beacon.wachsSite = undefined;
    beacon.notes = undefined;
    
    await this.save();
    return true;
  }

  getAssignmentHistory(beaconId?: string, userId?: string): BeaconAssignment[] {
    let filtered = [...this.assignments];
    
    if (beaconId) {
      filtered = filtered.filter(a => a.beaconId === beaconId);
    }
    if (userId) {
      filtered = filtered.filter(a => a.userId === userId);
    }
    
    return filtered;
  }

  getStats(): {
    total: number;
    assigned: number;
    available: number;
    byCode: Record<BeaconCode, number>;
    byStatus: Record<BeaconStatus, number>;
    lowBattery: number;
  } {
    const byCode: Record<BeaconCode, number> = { green: 0, yellow: 0, orange: 0, red: 0, purple: 0 };
    const byStatus: Record<BeaconStatus, number> = { active: 0, inactive: 0, maintenance: 0, lost: 0 };
    let assigned = 0;
    let lowBattery = 0;
    
    this.beacons.forEach(b => {
      byCode[b.code]++;
      byStatus[b.status]++;
      if (b.assignedTo) assigned++;
      if (b.batteryLevel && b.batteryLevel < 20) lowBattery++;
    });
    
    return {
      total: this.beacons.length,
      assigned,
      available: this.beacons.length - assigned,
      byCode,
      byStatus,
      lowBattery,
    };
  }
}

export const homingBeaconService = new HomingBeaconService();
