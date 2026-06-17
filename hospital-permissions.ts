/**
 * Hospital-Specific Role Permissions Service
 * Customizable access control with authority levels and department rules
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Permission Categories
export type PermissionCategory =
  | 'patients'
  | 'medications'
  | 'labs'
  | 'appointments'
  | 'documents'
  | 'communications'
  | 'admin'
  | 'finance'
  | 'reports'
  | 'settings'
  | 'jedi'
  | 'emergency';

// Permission Actions
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'override';

// Permission Definition
export interface Permission {
  category: PermissionCategory;
  action: PermissionAction;
  description: string;
}

// All Available Permissions
export const ALL_PERMISSIONS: Permission[] = [
  // Patients
  { category: 'patients', action: 'view', description: 'View patient records' },
  { category: 'patients', action: 'create', description: 'Create new patients' },
  { category: 'patients', action: 'edit', description: 'Edit patient information' },
  { category: 'patients', action: 'delete', description: 'Delete patient records' },
  { category: 'patients', action: 'approve', description: 'Approve patient discharges' },
  
  // Medications
  { category: 'medications', action: 'view', description: 'View medications' },
  { category: 'medications', action: 'create', description: 'Prescribe medications' },
  { category: 'medications', action: 'edit', description: 'Modify prescriptions' },
  { category: 'medications', action: 'delete', description: 'Cancel prescriptions' },
  { category: 'medications', action: 'approve', description: 'Approve controlled substances' },
  
  // Labs
  { category: 'labs', action: 'view', description: 'View lab results' },
  { category: 'labs', action: 'create', description: 'Order lab tests' },
  { category: 'labs', action: 'edit', description: 'Modify lab orders' },
  { category: 'labs', action: 'approve', description: 'Approve lab results' },
  
  // Appointments
  { category: 'appointments', action: 'view', description: 'View appointments' },
  { category: 'appointments', action: 'create', description: 'Schedule appointments' },
  { category: 'appointments', action: 'edit', description: 'Modify appointments' },
  { category: 'appointments', action: 'delete', description: 'Cancel appointments' },
  
  // Documents
  { category: 'documents', action: 'view', description: 'View documents' },
  { category: 'documents', action: 'create', description: 'Upload documents' },
  { category: 'documents', action: 'edit', description: 'Edit documents' },
  { category: 'documents', action: 'delete', description: 'Delete documents' },
  { category: 'documents', action: 'approve', description: 'Approve document releases' },
  
  // Communications
  { category: 'communications', action: 'view', description: 'View messages' },
  { category: 'communications', action: 'create', description: 'Send messages' },
  { category: 'communications', action: 'edit', description: 'Edit bulletins' },
  { category: 'communications', action: 'delete', description: 'Delete messages' },
  { category: 'communications', action: 'approve', description: 'Approve announcements' },
  
  // Admin
  { category: 'admin', action: 'view', description: 'View admin panel' },
  { category: 'admin', action: 'create', description: 'Create users' },
  { category: 'admin', action: 'edit', description: 'Edit user roles' },
  { category: 'admin', action: 'delete', description: 'Deactivate users' },
  { category: 'admin', action: 'approve', description: 'Approve role changes' },
  { category: 'admin', action: 'override', description: 'Override system settings' },
  
  // Finance
  { category: 'finance', action: 'view', description: 'View financial data' },
  { category: 'finance', action: 'create', description: 'Create invoices' },
  { category: 'finance', action: 'edit', description: 'Edit billing' },
  { category: 'finance', action: 'approve', description: 'Approve payments' },
  
  // Reports
  { category: 'reports', action: 'view', description: 'View reports' },
  { category: 'reports', action: 'create', description: 'Generate reports' },
  { category: 'reports', action: 'edit', description: 'Customize reports' },
  
  // Settings
  { category: 'settings', action: 'view', description: 'View settings' },
  { category: 'settings', action: 'edit', description: 'Modify settings' },
  { category: 'settings', action: 'override', description: 'Override system config' },
  
  // JEDI Systems
  { category: 'jedi', action: 'view', description: 'View JEDI status' },
  { category: 'jedi', action: 'create', description: 'Create JEDI connections' },
  { category: 'jedi', action: 'edit', description: 'Configure JEDI systems' },
  { category: 'jedi', action: 'approve', description: 'Approve JEDI sync' },
  { category: 'jedi', action: 'override', description: 'Override JEDI protocols' },
  
  // Emergency
  { category: 'emergency', action: 'view', description: 'View emergency alerts' },
  { category: 'emergency', action: 'create', description: 'Trigger emergency alerts' },
  { category: 'emergency', action: 'override', description: 'Emergency override all' },
];

// Hospital Departments
export type Department =
  | 'emergency'
  | 'surgery'
  | 'icu'
  | 'pediatrics'
  | 'oncology'
  | 'cardiology'
  | 'neurology'
  | 'radiology'
  | 'pathology'
  | 'pharmacy'
  | 'administration'
  | 'it'
  | 'maintenance'
  | 'all';

// Role Definition with Permissions
export interface HospitalRole {
  id: string;
  name: string;
  description: string;
  authorityLevel: number; // 1-10
  departments: Department[];
  permissions: string[]; // Format: "category:action"
  canDelegate: boolean;
  maxDelegationLevel: number;
  emergencyOverride: boolean;
  jediAccess: boolean;
  isCustom: boolean;
  createdAt: string;
  modifiedAt: string;
}

// Default Hospital Roles
const DEFAULT_ROLES: HospitalRole[] = [
  {
    id: 'master_jedi',
    name: 'Master JEDI',
    description: 'Supreme system authority with full control',
    authorityLevel: 10,
    departments: ['all'],
    permissions: ALL_PERMISSIONS.map(p => `${p.category}:${p.action}`),
    canDelegate: true,
    maxDelegationLevel: 10,
    emergencyOverride: true,
    jediAccess: true,
    isCustom: false,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  },
  {
    id: 'jedi_commander',
    name: 'JEDI Commander',
    description: 'Senior command authority',
    authorityLevel: 9,
    departments: ['all'],
    permissions: ALL_PERMISSIONS.filter(p => p.action !== 'override' || p.category === 'emergency')
      .map(p => `${p.category}:${p.action}`),
    canDelegate: true,
    maxDelegationLevel: 8,
    emergencyOverride: true,
    jediAccess: true,
    isCustom: false,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  },
  {
    id: 'hospital_director',
    name: 'Hospital Director',
    description: 'Hospital administration head',
    authorityLevel: 8,
    departments: ['administration', 'all'],
    permissions: [
      'patients:view', 'patients:approve',
      'admin:view', 'admin:create', 'admin:edit', 'admin:approve',
      'finance:view', 'finance:approve',
      'reports:view', 'reports:create', 'reports:edit',
      'settings:view', 'settings:edit',
      'communications:view', 'communications:create', 'communications:approve',
      'jedi:view', 'jedi:approve',
      'emergency:view', 'emergency:create',
    ],
    canDelegate: true,
    maxDelegationLevel: 7,
    emergencyOverride: true,
    jediAccess: true,
    isCustom: false,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  },
  {
    id: 'chief_medical_officer',
    name: 'Chief Medical Officer',
    description: 'Senior medical authority',
    authorityLevel: 8,
    departments: ['all'],
    permissions: [
      'patients:view', 'patients:create', 'patients:edit', 'patients:approve',
      'medications:view', 'medications:create', 'medications:edit', 'medications:approve',
      'labs:view', 'labs:create', 'labs:approve',
      'appointments:view', 'appointments:create', 'appointments:edit',
      'documents:view', 'documents:create', 'documents:approve',
      'reports:view', 'reports:create',
      'communications:view', 'communications:create',
      'emergency:view', 'emergency:create',
    ],
    canDelegate: true,
    maxDelegationLevel: 6,
    emergencyOverride: true,
    jediAccess: false,
    isCustom: false,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  },
  {
    id: 'surgeon',
    name: 'Surgeon',
    description: 'Surgical department physician',
    authorityLevel: 7,
    departments: ['surgery', 'icu'],
    permissions: [
      'patients:view', 'patients:create', 'patients:edit',
      'medications:view', 'medications:create', 'medications:edit',
      'labs:view', 'labs:create',
      'appointments:view', 'appointments:create', 'appointments:edit',
      'documents:view', 'documents:create',
      'communications:view', 'communications:create',
      'emergency:view', 'emergency:create',
    ],
    canDelegate: false,
    maxDelegationLevel: 0,
    emergencyOverride: false,
    jediAccess: false,
    isCustom: false,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  },
  {
    id: 'doctor',
    name: 'Doctor',
    description: 'General physician',
    authorityLevel: 6,
    departments: ['all'],
    permissions: [
      'patients:view', 'patients:create', 'patients:edit',
      'medications:view', 'medications:create', 'medications:edit',
      'labs:view', 'labs:create',
      'appointments:view', 'appointments:create', 'appointments:edit',
      'documents:view', 'documents:create',
      'communications:view', 'communications:create',
      'emergency:view',
    ],
    canDelegate: false,
    maxDelegationLevel: 0,
    emergencyOverride: false,
    jediAccess: false,
    isCustom: false,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  },
  {
    id: 'nurse_manager',
    name: 'Nurse Manager',
    description: 'Nursing department supervisor',
    authorityLevel: 5,
    departments: ['all'],
    permissions: [
      'patients:view', 'patients:edit',
      'medications:view', 'medications:edit',
      'labs:view',
      'appointments:view', 'appointments:create', 'appointments:edit',
      'documents:view', 'documents:create',
      'communications:view', 'communications:create', 'communications:edit',
      'admin:view',
      'emergency:view',
    ],
    canDelegate: true,
    maxDelegationLevel: 4,
    emergencyOverride: false,
    jediAccess: false,
    isCustom: false,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  },
  {
    id: 'nurse',
    name: 'Nurse',
    description: 'Registered nurse',
    authorityLevel: 4,
    departments: ['all'],
    permissions: [
      'patients:view', 'patients:edit',
      'medications:view',
      'labs:view',
      'appointments:view', 'appointments:create',
      'documents:view', 'documents:create',
      'communications:view', 'communications:create',
      'emergency:view',
    ],
    canDelegate: false,
    maxDelegationLevel: 0,
    emergencyOverride: false,
    jediAccess: false,
    isCustom: false,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  },
  {
    id: 'lab_technician',
    name: 'Lab Technician',
    description: 'Laboratory staff',
    authorityLevel: 4,
    departments: ['pathology', 'radiology'],
    permissions: [
      'patients:view',
      'labs:view', 'labs:create', 'labs:edit',
      'documents:view', 'documents:create',
      'communications:view',
    ],
    canDelegate: false,
    maxDelegationLevel: 0,
    emergencyOverride: false,
    jediAccess: false,
    isCustom: false,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  },
  {
    id: 'pharmacist',
    name: 'Pharmacist',
    description: 'Pharmacy staff',
    authorityLevel: 5,
    departments: ['pharmacy'],
    permissions: [
      'patients:view',
      'medications:view', 'medications:edit', 'medications:approve',
      'documents:view',
      'communications:view',
    ],
    canDelegate: false,
    maxDelegationLevel: 0,
    emergencyOverride: false,
    jediAccess: false,
    isCustom: false,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  },
  {
    id: 'receptionist',
    name: 'Receptionist',
    description: 'Front desk staff',
    authorityLevel: 2,
    departments: ['administration'],
    permissions: [
      'patients:view', 'patients:create',
      'appointments:view', 'appointments:create', 'appointments:edit', 'appointments:delete',
      'communications:view',
    ],
    canDelegate: false,
    maxDelegationLevel: 0,
    emergencyOverride: false,
    jediAccess: false,
    isCustom: false,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  },
  {
    id: 'security',
    name: 'Security Guard',
    description: 'Security personnel',
    authorityLevel: 3,
    departments: ['all'],
    permissions: [
      'patients:view',
      'communications:view', 'communications:create',
      'emergency:view', 'emergency:create',
    ],
    canDelegate: false,
    maxDelegationLevel: 0,
    emergencyOverride: false,
    jediAccess: false,
    isCustom: false,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  },
  {
    id: 'it_admin',
    name: 'IT Administrator',
    description: 'IT support staff',
    authorityLevel: 6,
    departments: ['it', 'administration'],
    permissions: [
      'admin:view', 'admin:create', 'admin:edit',
      'settings:view', 'settings:edit',
      'jedi:view', 'jedi:create', 'jedi:edit',
      'communications:view', 'communications:create',
    ],
    canDelegate: false,
    maxDelegationLevel: 0,
    emergencyOverride: false,
    jediAccess: true,
    isCustom: false,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  },
];

// Storage Keys
const ROLES_STORAGE_KEY = 'medivac_hospital_roles';
const AUDIT_STORAGE_KEY = 'medivac_permission_audit';

// Audit Log Entry
export interface PermissionAuditEntry {
  id: string;
  timestamp: string;
  action: 'create' | 'update' | 'delete' | 'grant' | 'revoke';
  roleId: string;
  roleName: string;
  performedBy: string;
  changes: string;
  reason?: string;
}

/**
 * Initialize default roles
 */
export async function initializeHospitalRoles(): Promise<void> {
  const existing = await getHospitalRoles();
  if (existing.length === 0) {
    await AsyncStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(DEFAULT_ROLES));
  }
}

/**
 * Get all hospital roles
 */
export async function getHospitalRoles(): Promise<HospitalRole[]> {
  try {
    const stored = await AsyncStorage.getItem(ROLES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading hospital roles:', error);
    return [];
  }
}

/**
 * Get role by ID
 */
export async function getRoleById(roleId: string): Promise<HospitalRole | null> {
  const roles = await getHospitalRoles();
  return roles.find(r => r.id === roleId) || null;
}

/**
 * Save hospital role
 */
export async function saveHospitalRole(role: HospitalRole, performedBy: string, reason?: string): Promise<void> {
  const roles = await getHospitalRoles();
  const index = roles.findIndex(r => r.id === role.id);
  
  role.modifiedAt = new Date().toISOString();
  
  const isNew = index < 0;
  if (isNew) {
    roles.push(role);
  } else {
    roles[index] = role;
  }
  
  await AsyncStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
  
  // Audit log
  await addAuditEntry({
    action: isNew ? 'create' : 'update',
    roleId: role.id,
    roleName: role.name,
    performedBy,
    changes: isNew ? 'Created new role' : 'Updated role configuration',
    reason,
  });
}

/**
 * Delete hospital role
 */
export async function deleteHospitalRole(roleId: string, performedBy: string, reason?: string): Promise<void> {
  const roles = await getHospitalRoles();
  const role = roles.find(r => r.id === roleId);
  
  if (!role) return;
  if (!role.isCustom) {
    throw new Error('Cannot delete system roles');
  }
  
  const filtered = roles.filter(r => r.id !== roleId);
  await AsyncStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(filtered));
  
  await addAuditEntry({
    action: 'delete',
    roleId,
    roleName: role.name,
    performedBy,
    changes: 'Deleted role',
    reason,
  });
}

/**
 * Check if user has permission
 */
export function hasPermission(
  role: HospitalRole,
  category: PermissionCategory,
  action: PermissionAction,
  department?: Department
): boolean {
  // Check department access
  if (department && !role.departments.includes('all') && !role.departments.includes(department)) {
    return false;
  }
  
  // Check permission
  const permissionKey = `${category}:${action}`;
  return role.permissions.includes(permissionKey);
}

/**
 * Check if user can perform emergency override
 */
export function canEmergencyOverride(role: HospitalRole): boolean {
  return role.emergencyOverride || role.authorityLevel >= 8;
}

/**
 * Check if user can delegate to another role
 */
export function canDelegateTo(delegator: HospitalRole, targetRole: HospitalRole): boolean {
  if (!delegator.canDelegate) return false;
  return targetRole.authorityLevel <= delegator.maxDelegationLevel;
}

/**
 * Get roles by authority level
 */
export async function getRolesByAuthorityLevel(minLevel: number, maxLevel?: number): Promise<HospitalRole[]> {
  const roles = await getHospitalRoles();
  return roles.filter(r => {
    if (r.authorityLevel < minLevel) return false;
    if (maxLevel !== undefined && r.authorityLevel > maxLevel) return false;
    return true;
  });
}

/**
 * Get roles by department
 */
export async function getRolesByDepartment(department: Department): Promise<HospitalRole[]> {
  const roles = await getHospitalRoles();
  return roles.filter(r => r.departments.includes('all') || r.departments.includes(department));
}

/**
 * Create custom role
 */
export async function createCustomRole(
  name: string,
  description: string,
  authorityLevel: number,
  departments: Department[],
  permissions: string[],
  performedBy: string
): Promise<HospitalRole> {
  const role: HospitalRole = {
    id: `custom_${Date.now()}`,
    name,
    description,
    authorityLevel,
    departments,
    permissions,
    canDelegate: false,
    maxDelegationLevel: 0,
    emergencyOverride: false,
    jediAccess: false,
    isCustom: true,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  };
  
  await saveHospitalRole(role, performedBy, 'Created custom role');
  return role;
}

/**
 * Grant permission to role
 */
export async function grantPermission(
  roleId: string,
  category: PermissionCategory,
  action: PermissionAction,
  performedBy: string,
  reason?: string
): Promise<void> {
  const role = await getRoleById(roleId);
  if (!role) throw new Error('Role not found');
  
  const permissionKey = `${category}:${action}`;
  if (!role.permissions.includes(permissionKey)) {
    role.permissions.push(permissionKey);
    await saveHospitalRole(role, performedBy, reason);
    
    await addAuditEntry({
      action: 'grant',
      roleId,
      roleName: role.name,
      performedBy,
      changes: `Granted ${permissionKey}`,
      reason,
    });
  }
}

/**
 * Revoke permission from role
 */
export async function revokePermission(
  roleId: string,
  category: PermissionCategory,
  action: PermissionAction,
  performedBy: string,
  reason?: string
): Promise<void> {
  const role = await getRoleById(roleId);
  if (!role) throw new Error('Role not found');
  
  const permissionKey = `${category}:${action}`;
  role.permissions = role.permissions.filter(p => p !== permissionKey);
  await saveHospitalRole(role, performedBy, reason);
  
  await addAuditEntry({
    action: 'revoke',
    roleId,
    roleName: role.name,
    performedBy,
    changes: `Revoked ${permissionKey}`,
    reason,
  });
}

/**
 * Add audit entry
 */
async function addAuditEntry(entry: Omit<PermissionAuditEntry, 'id' | 'timestamp'>): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(AUDIT_STORAGE_KEY);
    const entries: PermissionAuditEntry[] = stored ? JSON.parse(stored) : [];
    
    entries.unshift({
      ...entry,
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
    });
    
    // Keep last 500 entries
    const trimmed = entries.slice(0, 500);
    await AsyncStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error saving audit entry:', error);
  }
}

/**
 * Get audit log
 */
export async function getAuditLog(limit = 100): Promise<PermissionAuditEntry[]> {
  try {
    const stored = await AsyncStorage.getItem(AUDIT_STORAGE_KEY);
    const entries: PermissionAuditEntry[] = stored ? JSON.parse(stored) : [];
    return entries.slice(0, limit);
  } catch (error) {
    console.error('Error loading audit log:', error);
    return [];
  }
}

/**
 * Reset to default roles
 */
export async function resetToDefaultRoles(performedBy: string): Promise<void> {
  await AsyncStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(DEFAULT_ROLES));
  
  await addAuditEntry({
    action: 'update',
    roleId: 'system',
    roleName: 'System',
    performedBy,
    changes: 'Reset all roles to defaults',
    reason: 'System reset',
  });
}
