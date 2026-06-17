/**
 * JEDI Command Library Service
 * Advanced command templates, macros, and automation for MediVac One
 * Execute with extreme prejudice
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types
// ==========================================

export type CommandCategory = 
  | 'clinical' | 'administrative' | 'emergency' | 'compliance'
  | 'sync' | 'report' | 'maintenance' | 'security' | 'communication' | 'automation';

export type CommandPriority = 'critical' | 'high' | 'normal' | 'low' | 'background';

export type CommandStatus = 'ready' | 'executing' | 'completed' | 'failed' | 'cancelled' | 'scheduled';

export interface CommandTemplate {
  id: string;
  name: string;
  description: string;
  category: CommandCategory;
  command: string;
  parameters: CommandParameter[];
  defaultPriority: CommandPriority;
  estimatedDuration: number; // seconds
  requiresConfirmation: boolean;
  permissions: string[];
  tags: string[];
  icon: string;
  color: string;
}

export interface CommandParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'select' | 'multi-select';
  required: boolean;
  defaultValue?: any;
  options?: string[];
  validation?: string;
  description: string;
}

export interface CommandMacro {
  id: string;
  name: string;
  description: string;
  commands: MacroCommand[];
  trigger?: MacroTrigger;
  schedule?: MacroSchedule;
  isActive: boolean;
  createdAt: string;
  lastExecuted?: string;
  executionCount: number;
}

export interface MacroCommand {
  templateId: string;
  parameters: Record<string, any>;
  delay: number; // ms before execution
  continueOnError: boolean;
}

export interface MacroTrigger {
  type: 'event' | 'condition' | 'webhook' | 'voice';
  config: Record<string, any>;
}

export interface MacroSchedule {
  type: 'once' | 'daily' | 'weekly' | 'monthly' | 'cron';
  config: Record<string, any>;
  nextRun?: string;
}

export interface CommandExecution {
  id: string;
  templateId: string;
  macroId?: string;
  parameters: Record<string, any>;
  status: CommandStatus;
  priority: CommandPriority;
  startedAt?: string;
  completedAt?: string;
  result?: any;
  error?: string;
  logs: ExecutionLog[];
}

export interface ExecutionLog {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  data?: any;
}

export interface EmergencyProtocol {
  id: string;
  name: string;
  code: string; // e.g., "CODE BLUE", "CODE RED"
  description: string;
  commands: MacroCommand[];
  notifications: ProtocolNotification[];
  escalation: EscalationLevel[];
  isActive: boolean;
}

export interface ProtocolNotification {
  type: 'push' | 'sms' | 'email' | 'pager' | 'intercom';
  recipients: string[];
  message: string;
  priority: 'immediate' | 'urgent' | 'normal';
}

export interface EscalationLevel {
  level: number;
  delay: number; // seconds
  actions: string[];
  contacts: string[];
}

// ==========================================
// Pre-built Command Templates
// ==========================================

const CLINICAL_COMMANDS: CommandTemplate[] = [
  {
    id: 'cmd_patient_lookup',
    name: 'Patient Lookup',
    description: 'Search and retrieve patient records',
    category: 'clinical',
    command: 'patient:lookup',
    parameters: [
      { name: 'query', type: 'string', required: true, description: 'Patient name, ID, or MRN' },
      { name: 'includeHistory', type: 'boolean', required: false, defaultValue: true, description: 'Include medical history' },
    ],
    defaultPriority: 'normal',
    estimatedDuration: 2,
    requiresConfirmation: false,
    permissions: ['patient:read'],
    tags: ['patient', 'search', 'records'],
    icon: 'person.fill',
    color: '#3B82F6',
  },
  {
    id: 'cmd_vitals_check',
    name: 'Vital Signs Check',
    description: 'Retrieve latest vital signs for patient',
    category: 'clinical',
    command: 'vitals:check',
    parameters: [
      { name: 'patientId', type: 'string', required: true, description: 'Patient identifier' },
      { name: 'timeRange', type: 'select', required: false, defaultValue: '24h', options: ['1h', '6h', '24h', '7d', '30d'], description: 'Time range for vitals' },
    ],
    defaultPriority: 'high',
    estimatedDuration: 1,
    requiresConfirmation: false,
    permissions: ['vitals:read'],
    tags: ['vitals', 'monitoring', 'patient'],
    icon: 'waveform.path.ecg',
    color: '#EF4444',
  },
  {
    id: 'cmd_medication_admin',
    name: 'Medication Administration',
    description: 'Record medication administration',
    category: 'clinical',
    command: 'medication:administer',
    parameters: [
      { name: 'patientId', type: 'string', required: true, description: 'Patient identifier' },
      { name: 'medicationId', type: 'string', required: true, description: 'Medication identifier' },
      { name: 'dose', type: 'string', required: true, description: 'Dose administered' },
      { name: 'route', type: 'select', required: true, options: ['oral', 'iv', 'im', 'sc', 'topical', 'inhaled'], description: 'Route of administration' },
      { name: 'notes', type: 'string', required: false, description: 'Administration notes' },
    ],
    defaultPriority: 'high',
    estimatedDuration: 3,
    requiresConfirmation: true,
    permissions: ['medication:write'],
    tags: ['medication', 'administration', 'clinical'],
    icon: 'pills.fill',
    color: '#10B981',
  },
  {
    id: 'cmd_order_labs',
    name: 'Order Laboratory Tests',
    description: 'Create laboratory test orders',
    category: 'clinical',
    command: 'labs:order',
    parameters: [
      { name: 'patientId', type: 'string', required: true, description: 'Patient identifier' },
      { name: 'tests', type: 'multi-select', required: true, options: ['CBC', 'BMP', 'CMP', 'LFT', 'Lipid Panel', 'TSH', 'HbA1c', 'Urinalysis', 'Coagulation'], description: 'Tests to order' },
      { name: 'priority', type: 'select', required: false, defaultValue: 'routine', options: ['stat', 'urgent', 'routine'], description: 'Order priority' },
      { name: 'clinicalIndication', type: 'string', required: true, description: 'Clinical indication' },
    ],
    defaultPriority: 'normal',
    estimatedDuration: 5,
    requiresConfirmation: true,
    permissions: ['orders:write'],
    tags: ['labs', 'orders', 'clinical'],
    icon: 'stethoscope',
    color: '#8B5CF6',
  },
  {
    id: 'cmd_discharge_patient',
    name: 'Discharge Patient',
    description: 'Initiate patient discharge process',
    category: 'clinical',
    command: 'patient:discharge',
    parameters: [
      { name: 'patientId', type: 'string', required: true, description: 'Patient identifier' },
      { name: 'disposition', type: 'select', required: true, options: ['home', 'skilled_nursing', 'rehab', 'hospice', 'transfer', 'ama'], description: 'Discharge disposition' },
      { name: 'followUp', type: 'string', required: false, description: 'Follow-up instructions' },
      { name: 'prescriptions', type: 'boolean', required: false, defaultValue: true, description: 'Include discharge prescriptions' },
    ],
    defaultPriority: 'normal',
    estimatedDuration: 15,
    requiresConfirmation: true,
    permissions: ['patient:discharge'],
    tags: ['discharge', 'patient', 'workflow'],
    icon: 'arrow.right.circle.fill',
    color: '#F59E0B',
  },
];

const EMERGENCY_COMMANDS: CommandTemplate[] = [
  {
    id: 'cmd_code_blue',
    name: 'CODE BLUE - Cardiac Arrest',
    description: 'Initiate cardiac arrest response protocol',
    category: 'emergency',
    command: 'emergency:code_blue',
    parameters: [
      { name: 'location', type: 'string', required: true, description: 'Location of emergency' },
      { name: 'patientId', type: 'string', required: false, description: 'Patient identifier if known' },
    ],
    defaultPriority: 'critical',
    estimatedDuration: 1,
    requiresConfirmation: false,
    permissions: ['emergency:activate'],
    tags: ['emergency', 'code', 'cardiac'],
    icon: 'bolt.heart.fill',
    color: '#0000FF',
  },
  {
    id: 'cmd_code_red',
    name: 'CODE RED - Fire',
    description: 'Initiate fire emergency protocol',
    category: 'emergency',
    command: 'emergency:code_red',
    parameters: [
      { name: 'location', type: 'string', required: true, description: 'Location of fire' },
      { name: 'severity', type: 'select', required: true, options: ['smoke', 'small_fire', 'large_fire', 'evacuation'], description: 'Fire severity' },
    ],
    defaultPriority: 'critical',
    estimatedDuration: 1,
    requiresConfirmation: false,
    permissions: ['emergency:activate'],
    tags: ['emergency', 'code', 'fire'],
    icon: 'flame.fill',
    color: '#FF0000',
  },
  {
    id: 'cmd_rapid_response',
    name: 'Rapid Response Team',
    description: 'Activate rapid response team',
    category: 'emergency',
    command: 'emergency:rapid_response',
    parameters: [
      { name: 'location', type: 'string', required: true, description: 'Location' },
      { name: 'patientId', type: 'string', required: true, description: 'Patient identifier' },
      { name: 'concern', type: 'string', required: true, description: 'Clinical concern' },
    ],
    defaultPriority: 'critical',
    estimatedDuration: 1,
    requiresConfirmation: false,
    permissions: ['emergency:activate'],
    tags: ['emergency', 'rapid', 'response'],
    icon: 'exclamationmark.triangle.fill',
    color: '#FF6600',
  },
  {
    id: 'cmd_mass_casualty',
    name: 'Mass Casualty Incident',
    description: 'Activate mass casualty incident protocol',
    category: 'emergency',
    command: 'emergency:mass_casualty',
    parameters: [
      { name: 'incidentType', type: 'select', required: true, options: ['trauma', 'hazmat', 'infectious', 'natural_disaster', 'active_shooter'], description: 'Incident type' },
      { name: 'estimatedCasualties', type: 'number', required: true, description: 'Estimated number of casualties' },
      { name: 'location', type: 'string', required: true, description: 'Incident location' },
    ],
    defaultPriority: 'critical',
    estimatedDuration: 2,
    requiresConfirmation: true,
    permissions: ['emergency:mci'],
    tags: ['emergency', 'mci', 'disaster'],
    icon: 'exclamationmark.octagon.fill',
    color: '#990000',
  },
];

const SYNC_COMMANDS: CommandTemplate[] = [
  {
    id: 'cmd_sync_patients',
    name: 'Sync Patient Records',
    description: 'Synchronize patient records with external systems',
    category: 'sync',
    command: 'sync:patients',
    parameters: [
      { name: 'source', type: 'select', required: true, options: ['filemaker', 'gp_systems', 'mhr', 'all'], description: 'Data source' },
      { name: 'direction', type: 'select', required: false, defaultValue: 'bidirectional', options: ['import', 'export', 'bidirectional'], description: 'Sync direction' },
      { name: 'fullSync', type: 'boolean', required: false, defaultValue: false, description: 'Full sync (vs incremental)' },
    ],
    defaultPriority: 'normal',
    estimatedDuration: 60,
    requiresConfirmation: true,
    permissions: ['sync:execute'],
    tags: ['sync', 'patients', 'data'],
    icon: 'arrow.triangle.2.circlepath',
    color: '#06B6D4',
  },
  {
    id: 'cmd_sync_medications',
    name: 'Sync Medications',
    description: 'Synchronize medication database with PBS',
    category: 'sync',
    command: 'sync:medications',
    parameters: [
      { name: 'updatePricing', type: 'boolean', required: false, defaultValue: true, description: 'Update PBS pricing' },
      { name: 'includePrivate', type: 'boolean', required: false, defaultValue: true, description: 'Include private prescriptions' },
    ],
    defaultPriority: 'low',
    estimatedDuration: 120,
    requiresConfirmation: false,
    permissions: ['sync:execute'],
    tags: ['sync', 'medications', 'pbs'],
    icon: 'pills.fill',
    color: '#10B981',
  },
  {
    id: 'cmd_sync_calendar',
    name: 'Sync Calendar',
    description: 'Synchronize appointments with external calendars',
    category: 'sync',
    command: 'sync:calendar',
    parameters: [
      { name: 'provider', type: 'select', required: true, options: ['microsoft', 'google', 'apple', 'all'], description: 'Calendar provider' },
      { name: 'dateRange', type: 'select', required: false, defaultValue: '30d', options: ['7d', '30d', '90d', '365d'], description: 'Date range' },
    ],
    defaultPriority: 'normal',
    estimatedDuration: 30,
    requiresConfirmation: false,
    permissions: ['calendar:sync'],
    tags: ['sync', 'calendar', 'appointments'],
    icon: 'calendar',
    color: '#3B82F6',
  },
];

const REPORT_COMMANDS: CommandTemplate[] = [
  {
    id: 'cmd_report_compliance',
    name: 'Compliance Report',
    description: 'Generate compliance audit report',
    category: 'report',
    command: 'report:compliance',
    parameters: [
      { name: 'framework', type: 'multi-select', required: true, options: ['HIPAA', 'Australian_Privacy', 'ISO_27001', 'NSQHS', 'All'], description: 'Compliance frameworks' },
      { name: 'dateRange', type: 'select', required: false, defaultValue: '30d', options: ['7d', '30d', '90d', '365d'], description: 'Report period' },
      { name: 'format', type: 'select', required: false, defaultValue: 'pdf', options: ['pdf', 'excel', 'html'], description: 'Output format' },
    ],
    defaultPriority: 'normal',
    estimatedDuration: 45,
    requiresConfirmation: false,
    permissions: ['reports:generate'],
    tags: ['report', 'compliance', 'audit'],
    icon: 'doc.text.fill',
    color: '#6366F1',
  },
  {
    id: 'cmd_report_financial',
    name: 'Financial Report',
    description: 'Generate financial summary report',
    category: 'report',
    command: 'report:financial',
    parameters: [
      { name: 'reportType', type: 'select', required: true, options: ['revenue', 'claims', 'outstanding', 'reconciliation'], description: 'Report type' },
      { name: 'dateRange', type: 'select', required: true, options: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'], description: 'Report period' },
      { name: 'includeProjections', type: 'boolean', required: false, defaultValue: false, description: 'Include projections' },
    ],
    defaultPriority: 'normal',
    estimatedDuration: 30,
    requiresConfirmation: false,
    permissions: ['reports:financial'],
    tags: ['report', 'financial', 'billing'],
    icon: 'dollarsign.circle.fill',
    color: '#22C55E',
  },
  {
    id: 'cmd_report_clinical',
    name: 'Clinical Summary Report',
    description: 'Generate clinical activity summary',
    category: 'report',
    command: 'report:clinical',
    parameters: [
      { name: 'department', type: 'select', required: false, defaultValue: 'all', options: ['all', 'emergency', 'surgery', 'icu', 'medical', 'pediatrics'], description: 'Department' },
      { name: 'metrics', type: 'multi-select', required: true, options: ['admissions', 'discharges', 'los', 'mortality', 'readmissions', 'infections'], description: 'Metrics to include' },
      { name: 'dateRange', type: 'select', required: true, options: ['7d', '30d', '90d'], description: 'Report period' },
    ],
    defaultPriority: 'normal',
    estimatedDuration: 60,
    requiresConfirmation: false,
    permissions: ['reports:clinical'],
    tags: ['report', 'clinical', 'metrics'],
    icon: 'chart.bar.fill',
    color: '#8B5CF6',
  },
];

const MAINTENANCE_COMMANDS: CommandTemplate[] = [
  {
    id: 'cmd_backup_database',
    name: 'Backup Database',
    description: 'Create database backup',
    category: 'maintenance',
    command: 'maintenance:backup',
    parameters: [
      { name: 'type', type: 'select', required: false, defaultValue: 'incremental', options: ['full', 'incremental', 'differential'], description: 'Backup type' },
      { name: 'compress', type: 'boolean', required: false, defaultValue: true, description: 'Compress backup' },
      { name: 'encrypt', type: 'boolean', required: false, defaultValue: true, description: 'Encrypt backup' },
    ],
    defaultPriority: 'low',
    estimatedDuration: 300,
    requiresConfirmation: true,
    permissions: ['system:backup'],
    tags: ['maintenance', 'backup', 'database'],
    icon: 'externaldrive.fill',
    color: '#64748B',
  },
  {
    id: 'cmd_clear_cache',
    name: 'Clear System Cache',
    description: 'Clear application and system caches',
    category: 'maintenance',
    command: 'maintenance:clear_cache',
    parameters: [
      { name: 'cacheType', type: 'multi-select', required: false, defaultValue: ['app'], options: ['app', 'api', 'images', 'reports', 'all'], description: 'Cache types to clear' },
    ],
    defaultPriority: 'low',
    estimatedDuration: 10,
    requiresConfirmation: false,
    permissions: ['system:maintenance'],
    tags: ['maintenance', 'cache', 'performance'],
    icon: 'trash.fill',
    color: '#EF4444',
  },
  {
    id: 'cmd_health_check',
    name: 'System Health Check',
    description: 'Run comprehensive system health check',
    category: 'maintenance',
    command: 'maintenance:health_check',
    parameters: [
      { name: 'components', type: 'multi-select', required: false, defaultValue: ['all'], options: ['database', 'api', 'auth', 'storage', 'integrations', 'all'], description: 'Components to check' },
      { name: 'detailed', type: 'boolean', required: false, defaultValue: true, description: 'Include detailed diagnostics' },
    ],
    defaultPriority: 'normal',
    estimatedDuration: 30,
    requiresConfirmation: false,
    permissions: ['system:read'],
    tags: ['maintenance', 'health', 'diagnostics'],
    icon: 'heart.fill',
    color: '#10B981',
  },
];

const SECURITY_COMMANDS: CommandTemplate[] = [
  {
    id: 'cmd_security_scan',
    name: 'Security Scan',
    description: 'Run security vulnerability scan',
    category: 'security',
    command: 'security:scan',
    parameters: [
      { name: 'scanType', type: 'select', required: false, defaultValue: 'standard', options: ['quick', 'standard', 'deep', 'compliance'], description: 'Scan type' },
      { name: 'autoRemediate', type: 'boolean', required: false, defaultValue: false, description: 'Auto-remediate issues' },
    ],
    defaultPriority: 'normal',
    estimatedDuration: 120,
    requiresConfirmation: true,
    permissions: ['security:scan'],
    tags: ['security', 'scan', 'vulnerability'],
    icon: 'shield.fill',
    color: '#EF4444',
  },
  {
    id: 'cmd_rotate_keys',
    name: 'Rotate Encryption Keys',
    description: 'Rotate system encryption keys',
    category: 'security',
    command: 'security:rotate_keys',
    parameters: [
      { name: 'keyType', type: 'select', required: true, options: ['api', 'database', 'storage', 'all'], description: 'Key type to rotate' },
      { name: 'force', type: 'boolean', required: false, defaultValue: false, description: 'Force rotation even if recent' },
    ],
    defaultPriority: 'high',
    estimatedDuration: 60,
    requiresConfirmation: true,
    permissions: ['security:admin'],
    tags: ['security', 'keys', 'encryption'],
    icon: 'key.fill',
    color: '#F59E0B',
  },
  {
    id: 'cmd_audit_access',
    name: 'Access Audit',
    description: 'Audit user access and permissions',
    category: 'security',
    command: 'security:audit_access',
    parameters: [
      { name: 'scope', type: 'select', required: false, defaultValue: 'all', options: ['users', 'roles', 'resources', 'all'], description: 'Audit scope' },
      { name: 'flagAnomalies', type: 'boolean', required: false, defaultValue: true, description: 'Flag anomalous access' },
    ],
    defaultPriority: 'normal',
    estimatedDuration: 45,
    requiresConfirmation: false,
    permissions: ['security:audit'],
    tags: ['security', 'audit', 'access'],
    icon: 'eye.fill',
    color: '#6366F1',
  },
  {
    id: 'cmd_lockdown',
    name: 'System Lockdown',
    description: 'Initiate emergency system lockdown',
    category: 'security',
    command: 'security:lockdown',
    parameters: [
      { name: 'level', type: 'select', required: true, options: ['partial', 'full', 'emergency'], description: 'Lockdown level' },
      { name: 'duration', type: 'number', required: false, defaultValue: 60, description: 'Duration in minutes' },
      { name: 'reason', type: 'string', required: true, description: 'Reason for lockdown' },
    ],
    defaultPriority: 'critical',
    estimatedDuration: 5,
    requiresConfirmation: true,
    permissions: ['security:admin'],
    tags: ['security', 'lockdown', 'emergency'],
    icon: 'lock.fill',
    color: '#DC2626',
  },
];

// ==========================================
// Emergency Protocols
// ==========================================

const EMERGENCY_PROTOCOLS: EmergencyProtocol[] = [
  {
    id: 'protocol_code_blue',
    name: 'CODE BLUE Protocol',
    code: 'CODE BLUE',
    description: 'Cardiac arrest response protocol',
    commands: [
      { templateId: 'cmd_code_blue', parameters: {}, delay: 0, continueOnError: true },
    ],
    notifications: [
      { type: 'intercom', recipients: ['all'], message: 'CODE BLUE - {location}', priority: 'immediate' },
      { type: 'pager', recipients: ['crash_team'], message: 'CODE BLUE - {location}', priority: 'immediate' },
      { type: 'push', recipients: ['duty_doctors', 'icu_nurses'], message: 'CODE BLUE activated at {location}', priority: 'immediate' },
    ],
    escalation: [
      { level: 1, delay: 0, actions: ['page_crash_team', 'announce_overhead'], contacts: ['crash_team'] },
      { level: 2, delay: 120, actions: ['page_icu_consultant'], contacts: ['icu_consultant'] },
      { level: 3, delay: 300, actions: ['notify_admin', 'activate_met'], contacts: ['hospital_admin', 'met_team'] },
    ],
    isActive: true,
  },
  {
    id: 'protocol_code_red',
    name: 'CODE RED Protocol',
    code: 'CODE RED',
    description: 'Fire emergency response protocol',
    commands: [
      { templateId: 'cmd_code_red', parameters: {}, delay: 0, continueOnError: true },
    ],
    notifications: [
      { type: 'intercom', recipients: ['all'], message: 'CODE RED - Fire reported at {location}', priority: 'immediate' },
      { type: 'push', recipients: ['all_staff'], message: 'CODE RED - Fire at {location}. Follow RACE protocol.', priority: 'immediate' },
    ],
    escalation: [
      { level: 1, delay: 0, actions: ['activate_fire_alarm', 'notify_fire_wardens'], contacts: ['fire_wardens'] },
      { level: 2, delay: 60, actions: ['call_fire_brigade', 'prepare_evacuation'], contacts: ['emergency_services'] },
      { level: 3, delay: 180, actions: ['full_evacuation', 'notify_executive'], contacts: ['hospital_executive'] },
    ],
    isActive: true,
  },
  {
    id: 'protocol_mci',
    name: 'Mass Casualty Incident Protocol',
    code: 'MCI',
    description: 'Mass casualty incident response',
    commands: [
      { templateId: 'cmd_mass_casualty', parameters: {}, delay: 0, continueOnError: true },
    ],
    notifications: [
      { type: 'sms', recipients: ['all_clinical_staff'], message: 'MCI ACTIVATED - Report to designated stations immediately', priority: 'immediate' },
      { type: 'email', recipients: ['hospital_executive'], message: 'Mass Casualty Incident activated', priority: 'urgent' },
    ],
    escalation: [
      { level: 1, delay: 0, actions: ['activate_disaster_plan', 'clear_ed'], contacts: ['ed_director', 'nursing_director'] },
      { level: 2, delay: 300, actions: ['call_in_off_duty', 'open_surge_capacity'], contacts: ['hr', 'bed_management'] },
      { level: 3, delay: 600, actions: ['media_liaison', 'family_center'], contacts: ['communications', 'social_work'] },
    ],
    isActive: true,
  },
];

// ==========================================
// Service Class
// ==========================================

class JediCommandLibraryService {
  private templates: Map<string, CommandTemplate> = new Map();
  private macros: Map<string, CommandMacro> = new Map();
  private executions: CommandExecution[] = [];
  private protocols: Map<string, EmergencyProtocol> = new Map();
  private listeners: Set<(event: string, data: any) => void> = new Set();

  constructor() {
    this.initializeTemplates();
    this.initializeProtocols();
    this.loadMacros();
  }

  private initializeTemplates(): void {
    const allTemplates = [
      ...CLINICAL_COMMANDS,
      ...EMERGENCY_COMMANDS,
      ...SYNC_COMMANDS,
      ...REPORT_COMMANDS,
      ...MAINTENANCE_COMMANDS,
      ...SECURITY_COMMANDS,
    ];

    allTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private initializeProtocols(): void {
    EMERGENCY_PROTOCOLS.forEach(protocol => {
      this.protocols.set(protocol.id, protocol);
    });
  }

  private async loadMacros(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('jedi_command_macros');
      if (stored) {
        const macros: CommandMacro[] = JSON.parse(stored);
        macros.forEach(macro => this.macros.set(macro.id, macro));
      }
    } catch (error) {
      console.error('Failed to load macros:', error);
    }
  }

  private async saveMacros(): Promise<void> {
    try {
      const macros = Array.from(this.macros.values());
      await AsyncStorage.setItem('jedi_command_macros', JSON.stringify(macros));
    } catch (error) {
      console.error('Failed to save macros:', error);
    }
  }

  private emit(event: string, data: any): void {
    this.listeners.forEach(listener => listener(event, data));
  }

  // Template Management
  getTemplates(): CommandTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: CommandCategory): CommandTemplate[] {
    return this.getTemplates().filter(t => t.category === category);
  }

  getTemplate(id: string): CommandTemplate | undefined {
    return this.templates.get(id);
  }

  searchTemplates(query: string): CommandTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.getTemplates().filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // Command Execution
  async executeCommand(
    templateId: string,
    parameters: Record<string, any>,
    options: { priority?: CommandPriority; macroId?: string } = {}
  ): Promise<CommandExecution> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Command template not found: ${templateId}`);
    }

    const execution: CommandExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateId,
      macroId: options.macroId,
      parameters,
      status: 'executing',
      priority: options.priority || template.defaultPriority,
      startedAt: new Date().toISOString(),
      logs: [],
    };

    this.executions.push(execution);
    this.emit('execution:started', execution);

    try {
      // Log start
      execution.logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Executing command: ${template.name}`,
        data: { parameters },
      });

      // Simulate command execution
      await this.simulateExecution(template, parameters, execution);

      execution.status = 'completed';
      execution.completedAt = new Date().toISOString();
      execution.result = { success: true, message: `${template.name} completed successfully` };

      execution.logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Command completed successfully',
      });

      this.emit('execution:completed', execution);
    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date().toISOString();
      execution.error = error instanceof Error ? error.message : 'Unknown error';

      execution.logs.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Command failed: ${execution.error}`,
      });

      this.emit('execution:failed', execution);
    }

    return execution;
  }

  private async simulateExecution(
    template: CommandTemplate,
    parameters: Record<string, any>,
    execution: CommandExecution
  ): Promise<void> {
    // Simulate execution time
    const duration = Math.min(template.estimatedDuration * 100, 2000);
    await new Promise(resolve => setTimeout(resolve, duration));

    // Log progress
    execution.logs.push({
      timestamp: new Date().toISOString(),
      level: 'debug',
      message: 'Processing command parameters',
      data: parameters,
    });
  }

  // Macro Management
  async createMacro(macro: Omit<CommandMacro, 'id' | 'createdAt' | 'executionCount'>): Promise<CommandMacro> {
    const newMacro: CommandMacro = {
      ...macro,
      id: `macro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      executionCount: 0,
    };

    this.macros.set(newMacro.id, newMacro);
    await this.saveMacros();
    this.emit('macro:created', newMacro);

    return newMacro;
  }

  getMacros(): CommandMacro[] {
    return Array.from(this.macros.values());
  }

  getMacro(id: string): CommandMacro | undefined {
    return this.macros.get(id);
  }

  async executeMacro(macroId: string): Promise<CommandExecution[]> {
    const macro = this.macros.get(macroId);
    if (!macro) {
      throw new Error(`Macro not found: ${macroId}`);
    }

    const executions: CommandExecution[] = [];

    for (const cmd of macro.commands) {
      if (cmd.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, cmd.delay));
      }

      try {
        const execution = await this.executeCommand(cmd.templateId, cmd.parameters, { macroId });
        executions.push(execution);

        if (execution.status === 'failed' && !cmd.continueOnError) {
          break;
        }
      } catch (error) {
        if (!cmd.continueOnError) {
          throw error;
        }
      }
    }

    // Update macro stats
    macro.lastExecuted = new Date().toISOString();
    macro.executionCount++;
    await this.saveMacros();

    return executions;
  }

  async deleteMacro(id: string): Promise<void> {
    this.macros.delete(id);
    await this.saveMacros();
    this.emit('macro:deleted', { id });
  }

  // Emergency Protocols
  getProtocols(): EmergencyProtocol[] {
    return Array.from(this.protocols.values());
  }

  getProtocol(id: string): EmergencyProtocol | undefined {
    return this.protocols.get(id);
  }

  async activateProtocol(protocolId: string, parameters: Record<string, any>): Promise<void> {
    const protocol = this.protocols.get(protocolId);
    if (!protocol) {
      throw new Error(`Protocol not found: ${protocolId}`);
    }

    this.emit('protocol:activated', { protocol, parameters });

    // Execute protocol commands
    for (const cmd of protocol.commands) {
      await this.executeCommand(cmd.templateId, { ...cmd.parameters, ...parameters });
    }

    // Send notifications (simulated)
    for (const notification of protocol.notifications) {
      this.emit('notification:sent', {
        ...notification,
        message: notification.message.replace(/{(\w+)}/g, (_, key) => parameters[key] || key),
      });
    }
  }

  // Execution History
  getExecutions(limit: number = 50): CommandExecution[] {
    return this.executions.slice(-limit).reverse();
  }

  getExecutionsByStatus(status: CommandStatus): CommandExecution[] {
    return this.executions.filter(e => e.status === status);
  }

  // Event Subscription
  subscribe(listener: (event: string, data: any) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Quick Commands
  async executeQuickCommand(commandString: string): Promise<CommandExecution | null> {
    // Parse command string like "sync:patients --source=filemaker"
    const parts = commandString.trim().split(/\s+/);
    const command = parts[0];
    const params: Record<string, any> = {};

    for (let i = 1; i < parts.length; i++) {
      const match = parts[i].match(/^--(\w+)=(.+)$/);
      if (match) {
        params[match[1]] = match[2];
      }
    }

    // Find matching template
    const template = this.getTemplates().find(t => t.command === command);
    if (!template) {
      console.warn(`Unknown command: ${command}`);
      return null;
    }

    return this.executeCommand(template.id, params);
  }

  // Statistics
  getStatistics(): {
    totalTemplates: number;
    totalMacros: number;
    totalExecutions: number;
    successRate: number;
    byCategory: Record<CommandCategory, number>;
  } {
    const completed = this.executions.filter(e => e.status === 'completed').length;
    const total = this.executions.length;

    const byCategory: Record<CommandCategory, number> = {} as any;
    this.getTemplates().forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + 1;
    });

    return {
      totalTemplates: this.templates.size,
      totalMacros: this.macros.size,
      totalExecutions: total,
      successRate: total > 0 ? (completed / total) * 100 : 100,
      byCategory,
    };
  }
}

// Export singleton instance
export const jediCommandLibrary = new JediCommandLibraryService();

// Export types and constants
export {
  CLINICAL_COMMANDS,
  EMERGENCY_COMMANDS,
  SYNC_COMMANDS,
  REPORT_COMMANDS,
  MAINTENANCE_COMMANDS,
  SECURITY_COMMANDS,
  EMERGENCY_PROTOCOLS,
};
