/**
 * MediVac One - Role-Based Configuration Service
 * Defines job types, command authority levels, and role-specific navigation
 */

// Authority Levels - Higher number = more authority
export enum AuthorityLevel {
  TRAINEE = 1,
  JUNIOR = 2,
  STANDARD = 3,
  SENIOR = 4,
  SUPERVISOR = 5,
  MANAGER = 6,
  DIRECTOR = 7,
  COMMANDER = 8,
  MASTER_JEDI = 9,
  SUPREME_COMMANDER = 10,
}

// Job Types / Roles
export type JobRole = 
  | 'doctor'
  | 'nurse'
  | 'surgeon'
  | 'admin'
  | 'receptionist'
  | 'lab_technician'
  | 'pharmacist'
  | 'radiologist'
  | 'therapist'
  | 'security'
  | 'maintenance'
  | 'it_support'
  | 'finance'
  | 'hr'
  | 'jedi_commander'
  | 'master_jedi';

// Navigation Item
export interface NavItem {
  id: string;
  title: string;
  icon: string;
  route: string;
  color: string;
  badge?: number;
  shortcut?: string;
  requiresAuth?: AuthorityLevel;
}

// Role Configuration
export interface RoleConfig {
  role: JobRole;
  displayName: string;
  icon: string;
  color: string;
  authorityLevel: AuthorityLevel;
  department: string;
  primaryModules: NavItem[];
  quickActions: NavItem[];
  shortcuts: { key: string; action: string; route: string }[];
  permissions: string[];
  canOverride: JobRole[];
  reportsTo: JobRole[];
  commandAuthority: boolean;
}

// Module Definitions
const MODULES = {
  // Medical Modules
  patients: { id: 'patients', title: 'Patients', icon: '🏥', route: '/patients', color: '#3B82F6' },
  doctors: { id: 'doctors', title: 'Doctors', icon: '👨‍⚕️', route: '/staff?filter=doctor', color: '#10B981' },
  nurses: { id: 'nurses', title: 'Nurses', icon: '👩‍⚕️', route: '/staff?filter=nurse', color: '#EC4899' },
  medications: { id: 'medications', title: 'Medications', icon: '💊', route: '/medications', color: '#F59E0B' },
  labs: { id: 'labs', title: 'Labs', icon: '🔬', route: '/labs', color: '#8B5CF6' },
  surgery: { id: 'surgery', title: 'Surgery', icon: '🏥', route: '/surgery', color: '#EF4444' },
  rooms: { id: 'rooms', title: 'Rooms', icon: '🛏️', route: '/rooms', color: '#06B6D4' },
  appointments: { id: 'appointments', title: 'Appointments', icon: '📅', route: '/schedule', color: '#84CC16' },
  
  // Admin Modules
  inventory: { id: 'inventory', title: 'Inventory', icon: '📦', route: '/inventory', color: '#F97316' },
  staff: { id: 'staff', title: 'Staff', icon: '👥', route: '/staff', color: '#6366F1' },
  billing: { id: 'billing', title: 'Billing', icon: '💰', route: '/admin?tab=invoices', color: '#22C55E' },
  reports: { id: 'reports', title: 'Reports', icon: '📊', route: '/analytics', color: '#A855F7' },
  
  // Communication Modules
  messages: { id: 'messages', title: 'Messages', icon: '💬', route: '/messages', color: '#0EA5E9' },
  alerts: { id: 'alerts', title: 'Alerts', icon: '🔔', route: '/notifications', color: '#DC2626' },
  comms: { id: 'comms', title: 'Communications', icon: '📡', route: '/communications', color: '#14B8A6' },
  
  // JEDI Modules
  jediHub: { id: 'jedi-hub', title: 'JEDI Hub', icon: '⚡', route: '/jedi', color: '#8B5CF6' },
  commandCenter: { id: 'command-center', title: 'Command Center', icon: '🎯', route: '/command-center', color: '#1F2937' },
  masterControl: { id: 'master-control', title: 'Master Control', icon: '👑', route: '/master-jedi-control', color: '#D97706' },
  vpnBrowser: { id: 'vpn', title: 'VPN Browser', icon: '🔒', route: '/vpn', color: '#059669' },
  webhooks: { id: 'webhooks', title: 'Webhooks', icon: '🔗', route: '/webhooks', color: '#7C3AED' },
  
  // Management Modules
  tasks: { id: 'tasks', title: 'Tasks', icon: '✅', route: '/tasks', color: '#F43F5E' },
  guardHandover: { id: 'handover', title: 'Guard Handover', icon: '🔄', route: '/guard-handover', color: '#0891B2' },
  rolesManager: { id: 'roles', title: 'Roles Manager', icon: '🛡️', route: '/roles-manager', color: '#BE185D' },
  knowledgeBase: { id: 'kb', title: 'Knowledge Base', icon: '📚', route: '/knowledge-base', color: '#4F46E5' },
  
  // System Modules
  settings: { id: 'settings', title: 'Settings', icon: '⚙️', route: '/settings', color: '#64748B' },
  profile: { id: 'profile', title: 'Profile', icon: '👤', route: '/profile', color: '#78716C' },
  sync: { id: 'sync', title: 'Sync Status', icon: '🔄', route: '/sync', color: '#0D9488' },
  moduleScanner: { id: 'scanner', title: 'Module Scanner', icon: '📡', route: '/module-scanner', color: '#DB2777' },
};

// Role Configurations
export const ROLE_CONFIGS: Record<JobRole, RoleConfig> = {
  doctor: {
    role: 'doctor',
    displayName: 'Doctor',
    icon: '👨‍⚕️',
    color: '#3B82F6',
    authorityLevel: AuthorityLevel.SENIOR,
    department: 'Medical',
    primaryModules: [
      MODULES.patients,
      MODULES.appointments,
      MODULES.medications,
      MODULES.labs,
      MODULES.rooms,
      MODULES.messages,
    ],
    quickActions: [
      { id: 'new-patient', title: 'New Patient', icon: '➕', route: '/patients/new', color: '#22C55E' },
      { id: 'prescribe', title: 'Prescribe', icon: '📝', route: '/medications/new', color: '#F59E0B' },
      { id: 'order-lab', title: 'Order Lab', icon: '🔬', route: '/labs/new', color: '#8B5CF6' },
      { id: 'view-results', title: 'View Results', icon: '📋', route: '/labs?filter=pending', color: '#0EA5E9' },
    ],
    shortcuts: [
      { key: 'P', action: 'Open Patients', route: '/patients' },
      { key: 'A', action: 'Appointments', route: '/schedule' },
      { key: 'L', action: 'Lab Results', route: '/labs' },
      { key: 'M', action: 'Medications', route: '/medications' },
      { key: 'N', action: 'New Prescription', route: '/medications/new' },
    ],
    permissions: ['view_patients', 'edit_patients', 'prescribe', 'order_labs', 'view_results', 'discharge'],
    canOverride: ['nurse', 'receptionist', 'lab_technician'],
    reportsTo: ['surgeon', 'jedi_commander'],
    commandAuthority: true,
  },
  
  nurse: {
    role: 'nurse',
    displayName: 'Nurse',
    icon: '👩‍⚕️',
    color: '#EC4899',
    authorityLevel: AuthorityLevel.STANDARD,
    department: 'Nursing',
    primaryModules: [
      MODULES.patients,
      MODULES.medications,
      MODULES.rooms,
      MODULES.tasks,
      MODULES.guardHandover,
      MODULES.alerts,
    ],
    quickActions: [
      { id: 'vitals', title: 'Record Vitals', icon: '❤️', route: '/patients/vitals', color: '#EF4444' },
      { id: 'administer', title: 'Administer Med', icon: '💉', route: '/medications/administer', color: '#F59E0B' },
      { id: 'handover', title: 'Shift Handover', icon: '🔄', route: '/guard-handover', color: '#0891B2' },
      { id: 'alert', title: 'Send Alert', icon: '🚨', route: '/alerts/new', color: '#DC2626' },
    ],
    shortcuts: [
      { key: 'P', action: 'Patients', route: '/patients' },
      { key: 'V', action: 'Record Vitals', route: '/patients/vitals' },
      { key: 'M', action: 'Medications', route: '/medications' },
      { key: 'H', action: 'Handover', route: '/guard-handover' },
      { key: 'T', action: 'Tasks', route: '/tasks' },
    ],
    permissions: ['view_patients', 'record_vitals', 'administer_meds', 'update_status', 'handover'],
    canOverride: [],
    reportsTo: ['doctor', 'surgeon', 'jedi_commander'],
    commandAuthority: false,
  },
  
  surgeon: {
    role: 'surgeon',
    displayName: 'Surgeon',
    icon: '🔪',
    color: '#EF4444',
    authorityLevel: AuthorityLevel.SUPERVISOR,
    department: 'Surgery',
    primaryModules: [
      MODULES.patients,
      MODULES.surgery,
      MODULES.rooms,
      MODULES.labs,
      MODULES.staff,
      MODULES.appointments,
    ],
    quickActions: [
      { id: 'schedule-surgery', title: 'Schedule Surgery', icon: '📅', route: '/surgery/schedule', color: '#EF4444' },
      { id: 'or-status', title: 'OR Status', icon: '🏥', route: '/rooms?filter=or', color: '#06B6D4' },
      { id: 'pre-op', title: 'Pre-Op Check', icon: '✅', route: '/surgery/preop', color: '#22C55E' },
      { id: 'post-op', title: 'Post-Op Notes', icon: '📝', route: '/surgery/postop', color: '#F59E0B' },
    ],
    shortcuts: [
      { key: 'S', action: 'Surgery Schedule', route: '/surgery' },
      { key: 'O', action: 'Operating Rooms', route: '/rooms?filter=or' },
      { key: 'P', action: 'Patients', route: '/patients' },
      { key: 'L', action: 'Lab Results', route: '/labs' },
    ],
    permissions: ['view_patients', 'edit_patients', 'schedule_surgery', 'operate', 'prescribe', 'order_labs', 'discharge'],
    canOverride: ['doctor', 'nurse', 'lab_technician', 'receptionist'],
    reportsTo: ['jedi_commander', 'master_jedi'],
    commandAuthority: true,
  },
  
  admin: {
    role: 'admin',
    displayName: 'Administrator',
    icon: '👔',
    color: '#6366F1',
    authorityLevel: AuthorityLevel.MANAGER,
    department: 'Administration',
    primaryModules: [
      MODULES.staff,
      MODULES.billing,
      MODULES.reports,
      MODULES.inventory,
      MODULES.rolesManager,
      MODULES.settings,
    ],
    quickActions: [
      { id: 'new-staff', title: 'Add Staff', icon: '👤', route: '/staff/new', color: '#6366F1' },
      { id: 'invoice', title: 'New Invoice', icon: '💰', route: '/admin?tab=invoices&action=new', color: '#22C55E' },
      { id: 'report', title: 'Generate Report', icon: '📊', route: '/analytics', color: '#A855F7' },
      { id: 'roles', title: 'Manage Roles', icon: '🛡️', route: '/roles-manager', color: '#BE185D' },
    ],
    shortcuts: [
      { key: 'S', action: 'Staff', route: '/staff' },
      { key: 'B', action: 'Billing', route: '/admin?tab=invoices' },
      { key: 'R', action: 'Reports', route: '/analytics' },
      { key: 'I', action: 'Inventory', route: '/inventory' },
      { key: 'O', action: 'Roles', route: '/roles-manager' },
    ],
    permissions: ['manage_staff', 'manage_billing', 'view_reports', 'manage_inventory', 'manage_roles', 'system_config'],
    canOverride: ['receptionist', 'finance', 'hr', 'maintenance', 'it_support'],
    reportsTo: ['jedi_commander', 'master_jedi'],
    commandAuthority: true,
  },
  
  receptionist: {
    role: 'receptionist',
    displayName: 'Receptionist',
    icon: '💁',
    color: '#F97316',
    authorityLevel: AuthorityLevel.JUNIOR,
    department: 'Front Desk',
    primaryModules: [
      MODULES.appointments,
      MODULES.patients,
      MODULES.messages,
      MODULES.rooms,
      MODULES.comms,
    ],
    quickActions: [
      { id: 'new-appt', title: 'New Appointment', icon: '📅', route: '/schedule/new', color: '#84CC16' },
      { id: 'check-in', title: 'Check In', icon: '✅', route: '/patients/checkin', color: '#22C55E' },
      { id: 'check-out', title: 'Check Out', icon: '👋', route: '/patients/checkout', color: '#F59E0B' },
      { id: 'call', title: 'Make Call', icon: '📞', route: '/communications?tab=phone', color: '#0EA5E9' },
    ],
    shortcuts: [
      { key: 'A', action: 'Appointments', route: '/schedule' },
      { key: 'C', action: 'Check In', route: '/patients/checkin' },
      { key: 'P', action: 'Patients', route: '/patients' },
      { key: 'M', action: 'Messages', route: '/messages' },
    ],
    permissions: ['view_appointments', 'create_appointments', 'check_in', 'check_out', 'view_patients_basic'],
    canOverride: [],
    reportsTo: ['admin', 'jedi_commander'],
    commandAuthority: false,
  },
  
  lab_technician: {
    role: 'lab_technician',
    displayName: 'Lab Technician',
    icon: '🔬',
    color: '#8B5CF6',
    authorityLevel: AuthorityLevel.STANDARD,
    department: 'Laboratory',
    primaryModules: [
      MODULES.labs,
      MODULES.patients,
      MODULES.inventory,
      MODULES.tasks,
      MODULES.messages,
    ],
    quickActions: [
      { id: 'new-test', title: 'New Test', icon: '🧪', route: '/labs/new', color: '#8B5CF6' },
      { id: 'results', title: 'Enter Results', icon: '📝', route: '/labs/results', color: '#22C55E' },
      { id: 'pending', title: 'Pending Tests', icon: '⏳', route: '/labs?filter=pending', color: '#F59E0B' },
      { id: 'inventory', title: 'Lab Supplies', icon: '📦', route: '/inventory?filter=lab', color: '#F97316' },
    ],
    shortcuts: [
      { key: 'L', action: 'Lab Tests', route: '/labs' },
      { key: 'R', action: 'Enter Results', route: '/labs/results' },
      { key: 'P', action: 'Pending', route: '/labs?filter=pending' },
      { key: 'I', action: 'Inventory', route: '/inventory?filter=lab' },
    ],
    permissions: ['view_labs', 'create_tests', 'enter_results', 'manage_lab_inventory'],
    canOverride: [],
    reportsTo: ['doctor', 'surgeon', 'admin'],
    commandAuthority: false,
  },
  
  pharmacist: {
    role: 'pharmacist',
    displayName: 'Pharmacist',
    icon: '💊',
    color: '#F59E0B',
    authorityLevel: AuthorityLevel.STANDARD,
    department: 'Pharmacy',
    primaryModules: [
      MODULES.medications,
      MODULES.patients,
      MODULES.inventory,
      MODULES.alerts,
      MODULES.messages,
    ],
    quickActions: [
      { id: 'dispense', title: 'Dispense', icon: '💊', route: '/medications/dispense', color: '#F59E0B' },
      { id: 'verify', title: 'Verify Rx', icon: '✅', route: '/medications/verify', color: '#22C55E' },
      { id: 'stock', title: 'Check Stock', icon: '📦', route: '/inventory?filter=pharmacy', color: '#F97316' },
      { id: 'interactions', title: 'Check Interactions', icon: '⚠️', route: '/medications/interactions', color: '#EF4444' },
    ],
    shortcuts: [
      { key: 'M', action: 'Medications', route: '/medications' },
      { key: 'D', action: 'Dispense', route: '/medications/dispense' },
      { key: 'V', action: 'Verify', route: '/medications/verify' },
      { key: 'I', action: 'Inventory', route: '/inventory?filter=pharmacy' },
    ],
    permissions: ['view_prescriptions', 'dispense_meds', 'verify_prescriptions', 'manage_pharmacy_inventory', 'flag_interactions'],
    canOverride: [],
    reportsTo: ['doctor', 'admin'],
    commandAuthority: false,
  },
  
  radiologist: {
    role: 'radiologist',
    displayName: 'Radiologist',
    icon: '🩻',
    color: '#06B6D4',
    authorityLevel: AuthorityLevel.SENIOR,
    department: 'Radiology',
    primaryModules: [
      MODULES.patients,
      MODULES.labs,
      MODULES.rooms,
      MODULES.reports,
      MODULES.messages,
    ],
    quickActions: [
      { id: 'imaging', title: 'New Imaging', icon: '🩻', route: '/imaging/new', color: '#06B6D4' },
      { id: 'read', title: 'Read Images', icon: '👁️', route: '/imaging/read', color: '#8B5CF6' },
      { id: 'report', title: 'Create Report', icon: '📝', route: '/imaging/report', color: '#22C55E' },
      { id: 'schedule', title: 'Schedule Scan', icon: '📅', route: '/imaging/schedule', color: '#F59E0B' },
    ],
    shortcuts: [
      { key: 'I', action: 'Imaging', route: '/imaging' },
      { key: 'R', action: 'Read Images', route: '/imaging/read' },
      { key: 'P', action: 'Patients', route: '/patients' },
      { key: 'S', action: 'Schedule', route: '/imaging/schedule' },
    ],
    permissions: ['view_patients', 'view_imaging', 'create_imaging', 'read_imaging', 'create_reports'],
    canOverride: [],
    reportsTo: ['surgeon', 'jedi_commander'],
    commandAuthority: true,
  },
  
  therapist: {
    role: 'therapist',
    displayName: 'Therapist',
    icon: '🧠',
    color: '#A855F7',
    authorityLevel: AuthorityLevel.STANDARD,
    department: 'Mental Health',
    primaryModules: [
      MODULES.patients,
      MODULES.appointments,
      { id: 'mental-health', title: 'Mental Health', icon: '🧠', route: '/mental-health', color: '#A855F7' },
      MODULES.tasks,
      MODULES.messages,
    ],
    quickActions: [
      { id: 'session', title: 'New Session', icon: '🗣️', route: '/mental-health/session', color: '#A855F7' },
      { id: 'notes', title: 'Session Notes', icon: '📝', route: '/mental-health/notes', color: '#22C55E' },
      { id: 'assessment', title: 'Assessment', icon: '📋', route: '/mental-health/assessment', color: '#F59E0B' },
      { id: 'schedule', title: 'Schedule', route: '/schedule', icon: '📅', color: '#84CC16' },
    ],
    shortcuts: [
      { key: 'M', action: 'Mental Health', route: '/mental-health' },
      { key: 'P', action: 'Patients', route: '/patients' },
      { key: 'A', action: 'Appointments', route: '/schedule' },
      { key: 'N', action: 'Notes', route: '/mental-health/notes' },
    ],
    permissions: ['view_patients', 'create_sessions', 'view_mental_health', 'create_assessments'],
    canOverride: [],
    reportsTo: ['doctor', 'admin'],
    commandAuthority: false,
  },
  
  security: {
    role: 'security',
    displayName: 'Security Guard',
    icon: '👮',
    color: '#1F2937',
    authorityLevel: AuthorityLevel.STANDARD,
    department: 'Security',
    primaryModules: [
      MODULES.guardHandover,
      MODULES.alerts,
      MODULES.rooms,
      MODULES.comms,
      MODULES.tasks,
    ],
    quickActions: [
      { id: 'incident', title: 'Report Incident', icon: '🚨', route: '/security/incident', color: '#EF4444' },
      { id: 'patrol', title: 'Log Patrol', icon: '🚶', route: '/security/patrol', color: '#22C55E' },
      { id: 'handover', title: 'Shift Handover', icon: '🔄', route: '/guard-handover', color: '#0891B2' },
      { id: 'alert', title: 'Send Alert', icon: '📢', route: '/alerts/new', color: '#DC2626' },
    ],
    shortcuts: [
      { key: 'H', action: 'Handover', route: '/guard-handover' },
      { key: 'I', action: 'Incident', route: '/security/incident' },
      { key: 'P', action: 'Patrol', route: '/security/patrol' },
      { key: 'A', action: 'Alerts', route: '/notifications' },
    ],
    permissions: ['view_rooms', 'create_incidents', 'log_patrol', 'handover', 'send_alerts'],
    canOverride: [],
    reportsTo: ['admin', 'jedi_commander'],
    commandAuthority: false,
  },
  
  maintenance: {
    role: 'maintenance',
    displayName: 'Maintenance',
    icon: '🔧',
    color: '#78716C',
    authorityLevel: AuthorityLevel.JUNIOR,
    department: 'Facilities',
    primaryModules: [
      MODULES.tasks,
      MODULES.rooms,
      MODULES.inventory,
      MODULES.messages,
    ],
    quickActions: [
      { id: 'work-order', title: 'Work Order', icon: '📋', route: '/maintenance/order', color: '#78716C' },
      { id: 'complete', title: 'Complete Task', icon: '✅', route: '/tasks?filter=mine', color: '#22C55E' },
      { id: 'request', title: 'Request Parts', icon: '📦', route: '/inventory/request', color: '#F97316' },
      { id: 'report', title: 'Report Issue', icon: '⚠️', route: '/maintenance/report', color: '#EF4444' },
    ],
    shortcuts: [
      { key: 'T', action: 'Tasks', route: '/tasks' },
      { key: 'R', action: 'Rooms', route: '/rooms' },
      { key: 'I', action: 'Inventory', route: '/inventory' },
      { key: 'W', action: 'Work Orders', route: '/maintenance/orders' },
    ],
    permissions: ['view_tasks', 'complete_tasks', 'view_rooms', 'request_inventory'],
    canOverride: [],
    reportsTo: ['admin'],
    commandAuthority: false,
  },
  
  it_support: {
    role: 'it_support',
    displayName: 'IT Support',
    icon: '💻',
    color: '#0EA5E9',
    authorityLevel: AuthorityLevel.STANDARD,
    department: 'IT',
    primaryModules: [
      MODULES.tasks,
      MODULES.settings,
      MODULES.webhooks,
      MODULES.moduleScanner,
      MODULES.sync,
      MODULES.jediHub,
    ],
    quickActions: [
      { id: 'ticket', title: 'New Ticket', icon: '🎫', route: '/it/ticket', color: '#0EA5E9' },
      { id: 'scan', title: 'Scan Modules', icon: '📡', route: '/module-scanner', color: '#DB2777' },
      { id: 'webhooks', title: 'Webhooks', icon: '🔗', route: '/webhooks', color: '#7C3AED' },
      { id: 'sync', title: 'Sync Status', icon: '🔄', route: '/sync', color: '#0D9488' },
    ],
    shortcuts: [
      { key: 'T', action: 'Tickets', route: '/it/tickets' },
      { key: 'S', action: 'Settings', route: '/settings' },
      { key: 'W', action: 'Webhooks', route: '/webhooks' },
      { key: 'M', action: 'Module Scanner', route: '/module-scanner' },
    ],
    permissions: ['manage_settings', 'manage_webhooks', 'scan_modules', 'view_sync', 'manage_integrations'],
    canOverride: [],
    reportsTo: ['admin', 'jedi_commander'],
    commandAuthority: false,
  },
  
  finance: {
    role: 'finance',
    displayName: 'Finance Officer',
    icon: '💰',
    color: '#22C55E',
    authorityLevel: AuthorityLevel.STANDARD,
    department: 'Finance',
    primaryModules: [
      MODULES.billing,
      MODULES.reports,
      { id: 'expenses', title: 'Expenses', icon: '💸', route: '/admin?tab=expenses', color: '#EF4444' },
      MODULES.inventory,
      MODULES.messages,
    ],
    quickActions: [
      { id: 'invoice', title: 'New Invoice', icon: '📄', route: '/admin?tab=invoices&action=new', color: '#22C55E' },
      { id: 'expense', title: 'Log Expense', icon: '💸', route: '/admin?tab=expenses&action=new', color: '#EF4444' },
      { id: 'report', title: 'Financial Report', icon: '📊', route: '/analytics?filter=finance', color: '#A855F7' },
      { id: 'payroll', title: 'Payroll', icon: '💵', route: '/finance/payroll', color: '#F59E0B' },
    ],
    shortcuts: [
      { key: 'B', action: 'Billing', route: '/admin?tab=invoices' },
      { key: 'E', action: 'Expenses', route: '/admin?tab=expenses' },
      { key: 'R', action: 'Reports', route: '/analytics' },
      { key: 'P', action: 'Payroll', route: '/finance/payroll' },
    ],
    permissions: ['manage_billing', 'manage_expenses', 'view_reports', 'manage_payroll'],
    canOverride: [],
    reportsTo: ['admin', 'jedi_commander'],
    commandAuthority: false,
  },
  
  hr: {
    role: 'hr',
    displayName: 'HR Manager',
    icon: '👥',
    color: '#EC4899',
    authorityLevel: AuthorityLevel.SENIOR,
    department: 'Human Resources',
    primaryModules: [
      MODULES.staff,
      MODULES.rolesManager,
      MODULES.reports,
      MODULES.messages,
      MODULES.tasks,
    ],
    quickActions: [
      { id: 'new-staff', title: 'Add Employee', icon: '👤', route: '/staff/new', color: '#6366F1' },
      { id: 'roles', title: 'Manage Roles', icon: '🛡️', route: '/roles-manager', color: '#BE185D' },
      { id: 'leave', title: 'Leave Requests', icon: '📅', route: '/hr/leave', color: '#F59E0B' },
      { id: 'performance', title: 'Performance', icon: '📈', route: '/hr/performance', color: '#22C55E' },
    ],
    shortcuts: [
      { key: 'S', action: 'Staff', route: '/staff' },
      { key: 'R', action: 'Roles', route: '/roles-manager' },
      { key: 'L', action: 'Leave', route: '/hr/leave' },
      { key: 'P', action: 'Performance', route: '/hr/performance' },
    ],
    permissions: ['manage_staff', 'manage_roles', 'manage_leave', 'view_performance', 'hire', 'terminate'],
    canOverride: ['receptionist', 'maintenance'],
    reportsTo: ['admin', 'jedi_commander'],
    commandAuthority: true,
  },
  
  jedi_commander: {
    role: 'jedi_commander',
    displayName: 'JEDI Commander',
    icon: '⚔️',
    color: '#8B5CF6',
    authorityLevel: AuthorityLevel.COMMANDER,
    department: 'JEDI Command',
    primaryModules: [
      MODULES.commandCenter,
      MODULES.masterControl,
      MODULES.jediHub,
      MODULES.rolesManager,
      MODULES.webhooks,
      MODULES.staff,
      MODULES.reports,
      MODULES.knowledgeBase,
    ],
    quickActions: [
      { id: 'command', title: 'Command Center', icon: '🎯', route: '/command-center', color: '#1F2937' },
      { id: 'override', title: 'Override', icon: '⚡', route: '/master-jedi-control?action=override', color: '#EF4444' },
      { id: 'broadcast', title: 'Broadcast', icon: '📢', route: '/communications?action=broadcast', color: '#F59E0B' },
      { id: 'lockdown', title: 'Lockdown', icon: '🔒', route: '/master-jedi-control?action=lockdown', color: '#DC2626' },
    ],
    shortcuts: [
      { key: 'C', action: 'Command Center', route: '/command-center' },
      { key: 'M', action: 'Master Control', route: '/master-jedi-control' },
      { key: 'J', action: 'JEDI Hub', route: '/jedi' },
      { key: 'O', action: 'Override', route: '/master-jedi-control?action=override' },
      { key: 'B', action: 'Broadcast', route: '/communications?action=broadcast' },
    ],
    permissions: ['full_access', 'override_all', 'command_authority', 'lockdown', 'broadcast', 'manage_all'],
    canOverride: ['doctor', 'nurse', 'surgeon', 'admin', 'receptionist', 'lab_technician', 'pharmacist', 'radiologist', 'therapist', 'security', 'maintenance', 'it_support', 'finance', 'hr'],
    reportsTo: ['master_jedi'],
    commandAuthority: true,
  },
  
  master_jedi: {
    role: 'master_jedi',
    displayName: 'Master JEDI',
    icon: '👑',
    color: '#D97706',
    authorityLevel: AuthorityLevel.SUPREME_COMMANDER,
    department: 'Supreme Command',
    primaryModules: [
      MODULES.masterControl,
      MODULES.commandCenter,
      MODULES.jediHub,
      MODULES.rolesManager,
      MODULES.webhooks,
      MODULES.staff,
      MODULES.reports,
      MODULES.knowledgeBase,
      MODULES.settings,
      MODULES.moduleScanner,
    ],
    quickActions: [
      { id: 'supreme', title: 'Supreme Control', icon: '👑', route: '/master-jedi-control', color: '#D97706' },
      { id: 'execute', title: 'Execute Order', icon: '⚡', route: '/master-jedi-control?action=execute', color: '#EF4444' },
      { id: 'global', title: 'Global Broadcast', icon: '🌐', route: '/communications?action=global', color: '#8B5CF6' },
      { id: 'shutdown', title: 'System Control', icon: '🔴', route: '/master-jedi-control?action=system', color: '#DC2626' },
    ],
    shortcuts: [
      { key: 'M', action: 'Master Control', route: '/master-jedi-control' },
      { key: 'C', action: 'Command Center', route: '/command-center' },
      { key: 'E', action: 'Execute', route: '/master-jedi-control?action=execute' },
      { key: 'G', action: 'Global', route: '/communications?action=global' },
      { key: 'S', action: 'System', route: '/master-jedi-control?action=system' },
    ],
    permissions: ['supreme_access', 'override_all', 'command_authority', 'system_control', 'global_broadcast', 'manage_all', 'no_restrictions'],
    canOverride: ['doctor', 'nurse', 'surgeon', 'admin', 'receptionist', 'lab_technician', 'pharmacist', 'radiologist', 'therapist', 'security', 'maintenance', 'it_support', 'finance', 'hr', 'jedi_commander'],
    reportsTo: [],
    commandAuthority: true,
  },
};

// Get role config
export function getRoleConfig(role: JobRole): RoleConfig {
  return ROLE_CONFIGS[role];
}

// Check if user can override another role
export function canOverride(userRole: JobRole, targetRole: JobRole): boolean {
  const config = ROLE_CONFIGS[userRole];
  return config.canOverride.includes(targetRole);
}

// Check authority level
export function hasAuthorityOver(userRole: JobRole, targetRole: JobRole): boolean {
  const userConfig = ROLE_CONFIGS[userRole];
  const targetConfig = ROLE_CONFIGS[targetRole];
  return userConfig.authorityLevel > targetConfig.authorityLevel;
}

// Check permission
export function hasPermission(role: JobRole, permission: string): boolean {
  const config = ROLE_CONFIGS[role];
  return config.permissions.includes(permission) || 
         config.permissions.includes('full_access') ||
         config.permissions.includes('supreme_access');
}

// Get all roles that report to a given role
export function getSubordinates(role: JobRole): JobRole[] {
  return Object.values(ROLE_CONFIGS)
    .filter(config => config.reportsTo.includes(role))
    .map(config => config.role);
}

// Execute command with authority check
export function executeCommand(
  executorRole: JobRole, 
  command: string, 
  targetRole?: JobRole
): { success: boolean; message: string } {
  const config = ROLE_CONFIGS[executorRole];
  
  // Check command authority
  if (!config.commandAuthority) {
    return { success: false, message: 'Insufficient command authority' };
  }
  
  // Check if targeting another role
  if (targetRole && !canOverride(executorRole, targetRole)) {
    return { success: false, message: `Cannot override ${targetRole}` };
  }
  
  // Master JEDI has no restrictions
  if (executorRole === 'master_jedi') {
    return { success: true, message: 'Command executed by Supreme Authority' };
  }
  
  return { success: true, message: 'Command executed successfully' };
}
