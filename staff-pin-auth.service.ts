 * Staff PIN Authentication Service
 * Provides secure PIN-based authentication for staff-only features
 */

export interface StaffMember {
  id: string;
  name: string;
  role: 'admin' | 'nurse' | 'doctor' | 'technician' | 'manager';
  department: string;
  pinHash: string;
  isActive: boolean;
  lastLogin?: number;
  failedAttempts: number;
  lockedUntil?: number;
}

export interface AuthSession {
  staffId: string;
  staffName: string;
  role: string;
  department: string;
  authenticatedAt: number;
  expiresAt: number;
  permissions: string[];
}

export interface AuthResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
  remainingAttempts?: number;
  lockedUntil?: number;
}

type AuthListener = (session: AuthSession | null) => void;

class StaffPinAuthService {
  private static instance: StaffPinAuthService;
  private currentSession: AuthSession | null = null;
  private listeners: Set<AuthListener> = new Set();
  private readonly SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  
  // Simulated staff database (in production, this would be server-side)
  private staffMembers: Map<string, StaffMember> = new Map([
    ['STAFF001', {
      id: 'STAFF001',
      name: 'Dr. Sarah Mitchell',
      role: 'admin',
      department: 'Administration',
      pinHash: this.hashPin('1234'), // Default admin PIN
      isActive: true,
      failedAttempts: 0
    }],
    ['STAFF002', {
      id: 'STAFF002',
      name: 'Nurse James Wilson',
      role: 'nurse',
      department: 'Emergency',
      pinHash: this.hashPin('5678'),
      isActive: true,
      failedAttempts: 0
    }],
    ['STAFF003', {
      id: 'STAFF003',
      name: 'Tech Mike Brown',
      role: 'technician',
      department: 'IT',
      pinHash: this.hashPin('9012'),
      isActive: true,
      failedAttempts: 0
    }],
    ['STAFF004', {
      id: 'STAFF004',
      name: 'Dr. Emily Chen',
      role: 'doctor',
      department: 'Radiology',
      pinHash: this.hashPin('3456'),
      isActive: true,
      failedAttempts: 0
    }],
    ['STAFF005', {
      id: 'STAFF005',
      name: 'Manager Lisa Park',
      role: 'manager',
      department: 'Operations',
      pinHash: this.hashPin('7890'),
      isActive: true,
      failedAttempts: 0
    }]
  ]);

  // Role-based permissions
  private readonly rolePermissions: Record<string, string[]> = {
    admin: ['beacon_calibration', 'staff_management', 'system_config', 'view_logs', 'emergency_override'],
    manager: ['beacon_calibration', 'view_logs', 'staff_schedule'],
    doctor: ['patient_records', 'prescriptions', 'view_logs'],
    nurse: ['patient_records', 'medication_admin', 'vitals'],