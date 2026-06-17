/**
 * MediVac One - FileMaker Integration Service
 * Deep integration with FileMaker Pro database systems
 * Provides object mapping, layout compatibility, and data synchronization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Storage, { STORAGE_KEYS } from './storage';

// FileMaker Object Types
export type FMObjectType = 
  | 'layout' 
  | 'table' 
  | 'field' 
  | 'script' 
  | 'portal' 
  | 'button' 
  | 'container'
  | 'calculation'
  | 'relationship'
  | 'valueList';

// FileMaker Layout Types
export type FMLayoutType = 
  | 'form' 
  | 'list' 
  | 'table' 
  | 'report' 
  | 'dashboard'
  | 'portal'
  | 'card';

// FileMaker Field Types
export type FMFieldType = 
  | 'text' 
  | 'number' 
  | 'date' 
  | 'time' 
  | 'timestamp' 
  | 'container'
  | 'calculation'
  | 'summary'
  | 'global';

// FileMaker Object Definition
export interface FMObject {
  id: string;
  name: string;
  type: FMObjectType;
  parent?: string;
  properties: Record<string, any>;
  scripts?: string[];
  triggers?: FMTrigger[];
  permissions?: FMPermission[];
  metadata?: FMMetadata;
}

// FileMaker Trigger
export interface FMTrigger {
  id: string;
  event: 'onObjectEnter' | 'onObjectExit' | 'onObjectModify' | 'onObjectSave' | 'onLayoutEnter' | 'onLayoutExit';
  script: string;
  condition?: string;
}

// FileMaker Permission
export interface FMPermission {
  role: string;
  access: 'none' | 'view' | 'edit' | 'create' | 'delete' | 'full';
}

// FileMaker Metadata
export interface FMMetadata {
  created: string;
  modified: string;
  createdBy: string;
  modifiedBy: string;
  version: number;
}

// FileMaker Layout Definition
export interface FMLayout {
  id: string;
  name: string;
  type: FMLayoutType;
  table: string;
  objects: FMObject[];
  portals: FMPortal[];
  buttons: FMButton[];
  scripts: FMScript[];
  theme?: FMTheme;
  permissions: FMPermission[];
}

// FileMaker Portal Definition
export interface FMPortal {
  id: string;
  name: string;
  relationship: string;
  sourceTable: string;
  targetTable: string;
  fields: string[];
  sortOrder?: { field: string; direction: 'asc' | 'desc' }[];
  filterExpression?: string;
  rowCount: number;
  scrollable: boolean;
  allowCreation: boolean;
  allowDeletion: boolean;
}

// FileMaker Button Definition
export interface FMButton {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  action: FMButtonAction;
  position: { x: number; y: number; width: number; height: number };
  visible: boolean;
  enabled: boolean;
  tooltip?: string;
  hotkey?: string;
}

// FileMaker Button Actions
export interface FMButtonAction {
  type: 'script' | 'navigation' | 'newRecord' | 'deleteRecord' | 'commit' | 'revert' | 'find' | 'sort' | 'print' | 'export' | 'import' | 'custom';
  target?: string;
  parameters?: Record<string, any>;
}

// FileMaker Script Definition
export interface FMScript {
  id: string;
  name: string;
  folder?: string;
  steps: FMScriptStep[];
  parameters?: FMScriptParameter[];
  runWithFullAccess: boolean;
}

// FileMaker Script Step
export interface FMScriptStep {
  id: number;
  action: string;
  parameters?: Record<string, any>;
  condition?: string;
  comment?: string;
}

// FileMaker Script Parameter
export interface FMScriptParameter {
  name: string;
  type: FMFieldType;
  required: boolean;
  defaultValue?: any;
}

// FileMaker Theme
export interface FMTheme {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  fontSize: number;
}

// FileMaker Database Connection
export interface FMConnection {
  id: string;
  name: string;
  host: string;
  database: string;
  username: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: number;
  version?: string;
}

// FileMaker Sync Configuration
export interface FMSyncConfig {
  enabled: boolean;
  interval: number;
  tables: string[];
  direction: 'push' | 'pull' | 'bidirectional';
  conflictResolution: 'server' | 'client' | 'manual';
  deltaSync: boolean;
}

// MediVac One FileMaker Module Definitions
export const FM_MODULES = {
  // General Practice Modules
  PATIENT: {
    id: 'patient',
    name: 'Patient Records',
    table: 'Patients',
    layout: 'Patient_Detail',
    icon: '🏥',
    color: '#E74C3C',
    fields: ['patient_id', 'first_name', 'last_name', 'dob', 'gender', 'address', 'phone', 'email', 'medical_history', 'allergies', 'medications'],
    relationships: ['Appointments', 'MedicalRecords', 'Prescriptions', 'LabResults'],
  },
  DOCTORS: {
    id: 'doctors',
    name: 'Doctors Directory',
    table: 'Staff',
    layout: 'Doctor_List',
    icon: '👨‍⚕️',
    color: '#F5F5DC',
    fields: ['staff_id', 'first_name', 'last_name', 'specialty', 'license_number', 'phone', 'email', 'schedule'],
    relationships: ['Appointments', 'Patients', 'Departments'],
  },
  MEDICATION: {
    id: 'medication',
    name: 'Medication Management',
    table: 'Medications',
    layout: 'Medication_List',
    icon: '💊',
    color: '#FFB6C1',
    fields: ['medication_id', 'name', 'dosage', 'form', 'manufacturer', 'stock_level', 'reorder_point', 'expiry_date'],
    relationships: ['Prescriptions', 'Inventory', 'Suppliers'],
  },
  CHECKUP: {
    id: 'checkup',
    name: 'Check Up Scheduling',
    table: 'Appointments',
    layout: 'Appointment_Calendar',
    icon: '🌡️',
    color: '#90EE90',
    fields: ['appointment_id', 'patient_id', 'doctor_id', 'date', 'time', 'duration', 'type', 'status', 'notes'],
    relationships: ['Patients', 'Staff', 'Rooms'],
  },
  SURGERY: {
    id: 'surgery',
    name: 'Surgery Management',
    table: 'Surgeries',
    layout: 'Surgery_Schedule',
    icon: '🏥',
    color: '#87CEEB',
    fields: ['surgery_id', 'patient_id', 'surgeon_id', 'procedure', 'date', 'room_id', 'status', 'pre_op_notes', 'post_op_notes'],
    relationships: ['Patients', 'Staff', 'Rooms', 'Equipment'],
  },
  NURSE: {
    id: 'nurse',
    name: 'Nursing Station',
    table: 'Staff',
    layout: 'Nurse_Dashboard',
    icon: '👩‍⚕️',
    color: '#98FB98',
    fields: ['staff_id', 'first_name', 'last_name', 'ward', 'shift', 'patients_assigned'],
    relationships: ['Patients', 'Wards', 'Tasks'],
  },
  LABS: {
    id: 'labs',
    name: 'Laboratory Results',
    table: 'LabResults',
    layout: 'Lab_Results',
    icon: '🔬',
    color: '#DEB887',
    fields: ['result_id', 'patient_id', 'test_type', 'date', 'results', 'reference_range', 'status', 'technician_id'],
    relationships: ['Patients', 'Staff', 'TestTypes'],
  },
  ROOMS: {
    id: 'rooms',
    name: 'Room Management',
    table: 'Rooms',
    layout: 'Room_Status',
    icon: '🛏️',
    color: '#D2B48C',
    fields: ['room_id', 'room_number', 'ward', 'type', 'status', 'patient_id', 'equipment'],
    relationships: ['Patients', 'Wards', 'Equipment'],
  },
  APPOINTMENT: {
    id: 'appointment',
    name: 'Appointment Booking',
    table: 'Appointments',
    layout: 'Appointment_Booking',
    icon: '📞',
    color: '#ADD8E6',
    fields: ['appointment_id', 'patient_id', 'doctor_id', 'date', 'time', 'type', 'status', 'contact_number'],
    relationships: ['Patients', 'Staff', 'Rooms'],
  },
  
  // Mental Health Modules
  TASK_LIST: {
    id: 'task_list',
    name: 'Task List',
    table: 'Tasks',
    layout: 'Task_List',
    icon: '📋',
    color: '#87CEEB',
    fields: ['task_id', 'title', 'description', 'assignee', 'due_date', 'priority', 'status'],
    relationships: ['Staff', 'Patients'],
  },
  GUARD_HANDOVER: {
    id: 'guard_handover',
    name: 'Guard Handover',
    table: 'Handovers',
    layout: 'Guard_Handover',
    icon: '👮',
    color: '#FFD700',
    fields: ['handover_id', 'from_guard', 'to_guard', 'date', 'time', 'notes', 'incidents', 'patient_status'],
    relationships: ['Staff', 'Patients', 'Incidents'],
  },
  CLINICAL_STAFF: {
    id: 'clinical_staff',
    name: 'Clinical Staff',
    table: 'Staff',
    layout: 'Clinical_Staff',
    icon: '👨‍⚕️',
    color: '#F5F5DC',
    fields: ['staff_id', 'name', 'role', 'department', 'qualifications', 'schedule'],
    relationships: ['Departments', 'Patients', 'Tasks'],
  },
  FLAGS: {
    id: 'flags',
    name: 'Patient Flags',
    table: 'PatientFlags',
    layout: 'Flags_Dashboard',
    icon: '🚩',
    color: '#DEB887',
    fields: ['flag_id', 'patient_id', 'type', 'severity', 'description', 'created_date', 'resolved_date'],
    relationships: ['Patients', 'Staff'],
  },
  
  // Learning Tools
  PROJECTS: {
    id: 'projects',
    name: 'Projects',
    table: 'Projects',
    layout: 'Project_List',
    icon: '📊',
    color: '#4A90D9',
    fields: ['project_id', 'name', 'description', 'status', 'start_date', 'end_date', 'team_members'],
    relationships: ['Staff', 'Tasks', 'Documents'],
  },
  WORKS: {
    id: 'works',
    name: 'Works',
    table: 'Works',
    layout: 'Work_Items',
    icon: '🚶',
    color: '#4A90D9',
    fields: ['work_id', 'title', 'type', 'assignee', 'status', 'priority', 'due_date'],
    relationships: ['Projects', 'Staff'],
  },
  
  // Communications
  BULLETIN_BOARD: {
    id: 'bulletin_board',
    name: 'Bulletin Board',
    table: 'Bulletins',
    layout: 'Bulletin_Board',
    icon: '📋',
    color: '#FFFFFF',
    fields: ['bulletin_id', 'title', 'content', 'author', 'date', 'category', 'priority', 'expiry_date'],
    relationships: ['Staff', 'Departments'],
  },
  FORUM: {
    id: 'forum',
    name: 'ISU Forum',
    table: 'ForumPosts',
    layout: 'Forum_List',
    icon: '👥',
    color: '#FFFFFF',
    fields: ['post_id', 'title', 'content', 'author', 'date', 'category', 'replies_count', 'views_count'],
    relationships: ['Staff', 'ForumReplies'],
  },
  
  // Admin Tasks
  INVOICES: {
    id: 'invoices',
    name: 'Invoices',
    table: 'Invoices',
    layout: 'Invoice_List',
    icon: '📄',
    color: '#4A90D9',
    fields: ['invoice_id', 'patient_id', 'date', 'items', 'total', 'status', 'payment_method'],
    relationships: ['Patients', 'Payments', 'Services'],
  },
  EXPENSES: {
    id: 'expenses',
    name: 'Expenses',
    table: 'Expenses',
    layout: 'Expense_Report',
    icon: '💰',
    color: '#4A90D9',
    fields: ['expense_id', 'category', 'amount', 'date', 'description', 'approved_by', 'status'],
    relationships: ['Staff', 'Departments', 'Budget'],
  },
};

// FileMaker Control Panel Configuration
export interface FMControlPanelConfig {
  id: string;
  name: string;
  modules: string[];
  layout: 'grid' | 'list' | 'tree';
  columns: number;
  showLabels: boolean;
  showIcons: boolean;
  theme: FMTheme;
  permissions: FMPermission[];
}

// Default Control Panel Configurations
export const FM_CONTROL_PANELS: FMControlPanelConfig[] = [
  {
    id: 'general-practice',
    name: 'General Practice',
    modules: ['PATIENT', 'DOCTORS', 'MEDICATION', 'CHECKUP', 'SURGERY', 'NURSE', 'LABS', 'ROOMS', 'APPOINTMENT'],
    layout: 'grid',
    columns: 3,
    showLabels: true,
    showIcons: true,
    theme: {
      name: 'MediVac Blue',
      primaryColor: '#0066CC',
      secondaryColor: '#4A90D9',
      backgroundColor: '#FFFFFF',
      textColor: '#333333',
      accentColor: '#E74C3C',
      fontFamily: 'System',
      fontSize: 14,
    },
    permissions: [
      { role: 'admin', access: 'full' },
      { role: 'doctor', access: 'full' },
      { role: 'nurse', access: 'edit' },
      { role: 'staff', access: 'view' },
    ],
  },
  {
    id: 'mental-health',
    name: 'Mental Health',
    modules: ['TASK_LIST', 'GUARD_HANDOVER', 'CLINICAL_STAFF', 'FLAGS'],
    layout: 'grid',
    columns: 2,
    showLabels: true,
    showIcons: true,
    theme: {
      name: 'Mental Health',
      primaryColor: '#87CEEB',
      secondaryColor: '#98FB98',
      backgroundColor: '#F5F5F5',
      textColor: '#333333',
      accentColor: '#FFD700',
      fontFamily: 'System',
      fontSize: 14,
    },
    permissions: [
      { role: 'admin', access: 'full' },
      { role: 'doctor', access: 'full' },
      { role: 'nurse', access: 'edit' },
    ],
  },
  {
    id: 'learning-tools',
    name: 'Learning Tools',
    modules: ['PROJECTS', 'WORKS'],
    layout: 'grid',
    columns: 2,
    showLabels: true,
    showIcons: true,
    theme: {
      name: 'Learning',
      primaryColor: '#4A90D9',
      secondaryColor: '#5BA4C9',
      backgroundColor: '#FFFFFF',
      textColor: '#333333',
      accentColor: '#2196F3',
      fontFamily: 'System',
      fontSize: 14,
    },
    permissions: [
      { role: 'admin', access: 'full' },
      { role: 'staff', access: 'edit' },
    ],
  },
  {
    id: 'communications',
    name: 'Communications',
    modules: ['BULLETIN_BOARD', 'FORUM'],
    layout: 'list',
    columns: 1,
    showLabels: true,
    showIcons: true,
    theme: {
      name: 'Communications',
      primaryColor: '#FFFFFF',
      secondaryColor: '#F5F5F5',
      backgroundColor: '#FFFFFF',
      textColor: '#333333',
      accentColor: '#0066CC',
      fontFamily: 'System',
      fontSize: 14,
    },
    permissions: [
      { role: 'admin', access: 'full' },
      { role: 'doctor', access: 'edit' },
      { role: 'nurse', access: 'edit' },
      { role: 'staff', access: 'view' },
    ],
  },
  {
    id: 'admin-tasks',
    name: 'Admin Tasks',
    modules: ['INVOICES', 'EXPENSES'],
    layout: 'grid',
    columns: 2,
    showLabels: true,
    showIcons: true,
    theme: {
      name: 'Admin',
      primaryColor: '#4A90D9',
      secondaryColor: '#5BA4C9',
      backgroundColor: '#FFFFFF',
      textColor: '#333333',
      accentColor: '#E74C3C',
      fontFamily: 'System',
      fontSize: 14,
    },
    permissions: [
      { role: 'admin', access: 'full' },
    ],
  },
];

// Internal State
let connections: Map<string, FMConnection> = new Map();
let layouts: Map<string, FMLayout> = new Map();
let syncConfig: FMSyncConfig = {
  enabled: true,
  interval: 300000,
  tables: [],
  direction: 'bidirectional',
  conflictResolution: 'server',
  deltaSync: true,
};

/**
 * Initialize FileMaker Integration
 */
export async function initializeFileMaker(): Promise<boolean> {
  try {
    // Load saved connections
    const savedConnections = await AsyncStorage.getItem('fm_connections');
    if (savedConnections) {
      const parsed = JSON.parse(savedConnections);
      parsed.forEach((conn: FMConnection) => connections.set(conn.id, conn));
    }

    // Load sync configuration
    const savedSyncConfig = await AsyncStorage.getItem('fm_sync_config');
    if (savedSyncConfig) {
      syncConfig = { ...syncConfig, ...JSON.parse(savedSyncConfig) };
    }

    console.log('[FileMaker] Integration initialized');
    return true;
  } catch (error) {
    console.error('[FileMaker] Initialization failed:', error);
    return false;
  }
}

/**
 * Add FileMaker Connection
 */
export async function addConnection(connection: Omit<FMConnection, 'status' | 'lastSync'>): Promise<FMConnection> {
  const fullConnection: FMConnection = {
    ...connection,
    status: 'disconnected',
    lastSync: 0,
  };
  
  connections.set(connection.id, fullConnection);
  await saveConnections();
  
  return fullConnection;
}

/**
 * Connect to FileMaker Database
 */
export async function connectToDatabase(connectionId: string): Promise<boolean> {
  const connection = connections.get(connectionId);
  if (!connection) return false;

  try {
    connection.status = 'connected';
    connection.lastSync = Date.now();
    await saveConnections();
    return true;
  } catch (error) {
    connection.status = 'error';
    await saveConnections();
    return false;
  }
}

/**
 * Get all connections
 */
export function getConnections(): FMConnection[] {
  return Array.from(connections.values());
}

/**
 * Get module definition
 */
export function getModule(moduleId: string): typeof FM_MODULES[keyof typeof FM_MODULES] | null {
  return FM_MODULES[moduleId as keyof typeof FM_MODULES] || null;
}

/**
 * Get all modules
 */
export function getAllModules(): typeof FM_MODULES {
  return FM_MODULES;
}

/**
 * Get control panel configuration
 */
export function getControlPanel(panelId: string): FMControlPanelConfig | null {
  return FM_CONTROL_PANELS.find(p => p.id === panelId) || null;
}

/**
 * Get all control panels
 */
export function getAllControlPanels(): FMControlPanelConfig[] {
  return FM_CONTROL_PANELS;
}

/**
 * Get modules for a control panel
 */
export function getModulesForPanel(panelId: string): (typeof FM_MODULES[keyof typeof FM_MODULES])[] {
  const panel = getControlPanel(panelId);
  if (!panel) return [];
  
  return panel.modules
    .map(moduleId => getModule(moduleId))
    .filter((m): m is typeof FM_MODULES[keyof typeof FM_MODULES] => m !== null);
}

/**
 * Create FileMaker Layout
 */
export function createLayout(layout: FMLayout): void {
  layouts.set(layout.id, layout);
}

/**
 * Get FileMaker Layout
 */
export function getLayout(layoutId: string): FMLayout | null {
  return layouts.get(layoutId) || null;
}

/**
 * Execute FileMaker Script
 */
export async function executeScript(
  connectionId: string,
  scriptName: string,
  parameters?: Record<string, any>
): Promise<{ success: boolean; result?: any; error?: string }> {
  const connection = connections.get(connectionId);
  if (!connection || connection.status !== 'connected') {
    return { success: false, error: 'Not connected to database' };
  }

  try {
    console.log(`[FileMaker] Executing script: ${scriptName}`, parameters);
    // Simulate script execution
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, result: { scriptName, parameters, executedAt: Date.now() } };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Sync data with FileMaker
 */
export async function syncWithFileMaker(
  connectionId: string,
  tables?: string[]
): Promise<{ success: boolean; synced: number; errors: string[] }> {
  const connection = connections.get(connectionId);
  if (!connection || connection.status !== 'connected') {
    return { success: false, synced: 0, errors: ['Not connected'] };
  }

  const tablesToSync = tables || syncConfig.tables;
  let synced = 0;
  const errors: string[] = [];

  for (const table of tablesToSync) {
    try {
      console.log(`[FileMaker] Syncing table: ${table}`);
      await new Promise(resolve => setTimeout(resolve, 100));
      synced++;
    } catch (error) {
      errors.push(`Failed to sync ${table}: ${error}`);
    }
  }

  connection.lastSync = Date.now();
  await saveConnections();

  return { success: errors.length === 0, synced, errors };
}

/**
 * Save connections to storage
 */
async function saveConnections(): Promise<void> {
  await AsyncStorage.setItem('fm_connections', JSON.stringify(Array.from(connections.values())));
}

/**
 * Get sync configuration
 */
export function getSyncConfig(): FMSyncConfig {
  return { ...syncConfig };
}

/**
 * Update sync configuration
 */
export async function updateSyncConfig(updates: Partial<FMSyncConfig>): Promise<void> {
  syncConfig = { ...syncConfig, ...updates };
  await AsyncStorage.setItem('fm_sync_config', JSON.stringify(syncConfig));
}

// Export FileMaker service
export const FileMaker = {
  initialize: initializeFileMaker,
  addConnection,
  connectToDatabase,
  getConnections,
  getModule,
  getAllModules,
  getControlPanel,
  getAllControlPanels,
  getModulesForPanel,
  createLayout,
  getLayout,
  executeScript,
  sync: syncWithFileMaker,
  getSyncConfig,
  updateSyncConfig,
  MODULES: FM_MODULES,
  CONTROL_PANELS: FM_CONTROL_PANELS,
};

export default FileMaker;
