/**
 * MediVac One - FileMaker Patient Sync Service
 * Bidirectional patient record synchronization with Claris FileMaker
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types
// ==========================================

export interface FileMakerPatient {
  recordId: string;
  modId: string;
  fieldData: {
    PatientID: string;
    FirstName: string;
    LastName: string;
    DateOfBirth: string;
    Gender: string;
    MedicareNumber?: string;
    DVANumber?: string;
    IHI?: string;
    Address: string;
    Suburb: string;
    State: string;
    Postcode: string;
    Phone: string;
    Mobile: string;
    Email: string;
    EmergencyContact: string;
    EmergencyPhone: string;
    GPName?: string;
    GPClinic?: string;
    GPPhone?: string;
    Allergies?: string;
    MedicalHistory?: string;
    CurrentMedications?: string;
    Notes?: string;
    Status: 'active' | 'inactive' | 'deceased';
    CreatedDate: string;
    ModifiedDate: string;
    CreatedBy: string;
    ModifiedBy: string;
  };
  portalData?: {
    Appointments?: FileMakerAppointment[];
    Encounters?: FileMakerEncounter[];
    Medications?: FileMakerMedication[];
    Pathology?: FileMakerPathology[];
  };
}

export interface FileMakerAppointment {
  recordId: string;
  AppointmentID: string;
  PatientID: string;
  DateTime: string;
  Duration: number;
  Provider: string;
  Type: string;
  Status: string;
  Notes?: string;
}

export interface FileMakerEncounter {
  recordId: string;
  EncounterID: string;
  PatientID: string;
  DateTime: string;
  Provider: string;
  Type: string;
  ChiefComplaint?: string;
  Diagnosis?: string;
  Treatment?: string;
  Notes?: string;
}

export interface FileMakerMedication {
  recordId: string;
  MedicationID: string;
  PatientID: string;
  DrugName: string;
  Dosage: string;
  Frequency: string;
  Route: string;
  StartDate: string;
  EndDate?: string;
  Prescriber: string;
  Status: 'active' | 'discontinued' | 'completed';
}

export interface FileMakerPathology {
  recordId: string;
  PathologyID: string;
  PatientID: string;
  TestName: string;
  OrderDate: string;
  ResultDate?: string;
  Result?: string;
  ReferenceRange?: string;
  Status: 'ordered' | 'collected' | 'resulted' | 'reviewed';
  OrderingProvider: string;
}

export interface MediVacPatient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  medicareNumber?: string;
  dvaNumber?: string;
  ihi?: string;
  address: {
    street: string;
    suburb: string;
    state: string;
    postcode: string;
  };
  contact: {
    phone?: string;
    mobile?: string;
    email?: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
  };
  gp?: {
    name: string;
    clinic: string;
    phone: string;
  };
  clinical: {
    allergies: string[];
    medicalHistory: string[];
    currentMedications: string[];
  };
  notes?: string;
  status: 'active' | 'inactive' | 'deceased';
  syncMetadata: {
    fileMakerRecordId?: string;
    fileMakerModId?: string;
    lastSynced?: string;
    syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  };
  createdAt: string;
  updatedAt: string;
}

export interface SyncConfig {
  serverHost: string;
  database: string;
  layout: string;
  username: string;
  password: string;
  sslEnabled: boolean;
  syncInterval: number;
  conflictResolution: 'local_wins' | 'remote_wins' | 'manual';
  syncDirection: 'bidirectional' | 'push_only' | 'pull_only';
  batchSize: number;
  retryAttempts: number;
}

export interface SyncResult {
  success: boolean;
  syncedAt: string;
  direction: 'push' | 'pull' | 'bidirectional';
  stats: {
    created: number;
    updated: number;
    deleted: number;
    conflicts: number;
    errors: number;
  };
  conflicts: SyncConflict[];
  errors: SyncError[];
  duration: number;
}

export interface SyncConflict {
  patientId: string;
  localRecord: Partial<MediVacPatient>;
  remoteRecord: Partial<FileMakerPatient>;
  conflictFields: string[];
  resolvedBy?: 'local' | 'remote' | 'manual';
  resolvedAt?: string;
}

export interface SyncError {
  patientId?: string;
  operation: 'create' | 'update' | 'delete' | 'read';
  error: string;
  timestamp: string;
}

export interface SyncStatus {
  isRunning: boolean;
  lastSync?: string;
  nextScheduledSync?: string;
  pendingChanges: number;
  conflicts: number;
  errors: number;
  connectionStatus: 'connected' | 'disconnected' | 'error';
}

// ==========================================
// Constants
// ==========================================

const STORAGE_KEYS = {
  SYNC_CONFIG: 'fm_sync_config',
  SYNC_STATUS: 'fm_sync_status',
  PENDING_CHANGES: 'fm_pending_changes',
  CONFLICTS: 'fm_conflicts',
  SYNC_LOG: 'fm_sync_log',
};

const DEFAULT_SYNC_CONFIG: SyncConfig = {
  serverHost: '',
  database: '',
  layout: 'Patients',
  username: '',
  password: '',
  sslEnabled: true,
  syncInterval: 300000, // 5 minutes
  conflictResolution: 'manual',
  syncDirection: 'bidirectional',
  batchSize: 100,
  retryAttempts: 3,
};

// ==========================================
// FileMaker Patient Sync Service
// ==========================================

class FileMakerPatientSyncService {
  private config: SyncConfig;
  private status: SyncStatus;
  private pendingChanges: Map<string, { patient: MediVacPatient; operation: 'create' | 'update' | 'delete' }> = new Map();
  private conflicts: SyncConflict[] = [];
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private authToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor() {
    this.config = { ...DEFAULT_SYNC_CONFIG };
    this.status = {
      isRunning: false,
      pendingChanges: 0,
      conflicts: 0,
      errors: 0,
      connectionStatus: 'disconnected',
    };
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      await this.loadConfig();
      await this.loadPendingChanges();
      await this.loadConflicts();
      await this.loadStatus();
    } catch (error) {
      console.error('Failed to initialize FileMaker Patient Sync Service:', error);
    }
  }

  // ==========================================
  // Configuration
  // ==========================================

  async setConfig(config: Partial<SyncConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    await this.saveConfig();
    
    // Restart sync timer if interval changed
    if (config.syncInterval !== undefined) {
      this.stopAutoSync();
      if (this.config.syncInterval > 0) {
        this.startAutoSync();
      }
    }
    
    this.emit('config_updated', this.config);
  }

  getConfig(): SyncConfig {
    return { ...this.config };
  }

  private async loadConfig(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_CONFIG);
      if (stored) {
        this.config = { ...DEFAULT_SYNC_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load sync config:', error);
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      // Don't save password to storage
      const { password, ...safeConfig } = this.config;
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_CONFIG, JSON.stringify(safeConfig));
    } catch (error) {
      console.error('Failed to save sync config:', error);
    }
  }

  // ==========================================
  // Authentication
  // ==========================================

  async authenticate(): Promise<boolean> {
    if (!this.config.serverHost || !this.config.database) {
      throw new Error('Server host and database are required');
    }

    try {
      // Simulate FileMaker Data API authentication
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.authToken = `fm_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.tokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      this.status.connectionStatus = 'connected';
      
      await this.saveStatus();
      this.emit('authenticated', { token: this.authToken, expiry: this.tokenExpiry });
      
      return true;
    } catch (error) {
      this.status.connectionStatus = 'error';
      await this.saveStatus();
      throw error;
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.authToken || !this.tokenExpiry || this.tokenExpiry <= new Date()) {
      await this.authenticate();
    }
  }

  async disconnect(): Promise<void> {
    this.authToken = null;
    this.tokenExpiry = null;
    this.status.connectionStatus = 'disconnected';
    await this.saveStatus();
    this.emit('disconnected', {});
  }

  // ==========================================
  // Patient Mapping
  // ==========================================

  mapFileMakerToMediVac(fmPatient: FileMakerPatient): MediVacPatient {
    const { fieldData, recordId, modId } = fmPatient;
    
    return {
      id: fieldData.PatientID,
      firstName: fieldData.FirstName,
      lastName: fieldData.LastName,
      dateOfBirth: fieldData.DateOfBirth,
      gender: fieldData.Gender,
      medicareNumber: fieldData.MedicareNumber,
      dvaNumber: fieldData.DVANumber,
      ihi: fieldData.IHI,
      address: {
        street: fieldData.Address,
        suburb: fieldData.Suburb,
        state: fieldData.State,
        postcode: fieldData.Postcode,
      },
      contact: {
        phone: fieldData.Phone,
        mobile: fieldData.Mobile,
        email: fieldData.Email,
      },
      emergencyContact: {
        name: fieldData.EmergencyContact,
        phone: fieldData.EmergencyPhone,
      },
      gp: fieldData.GPName ? {
        name: fieldData.GPName,
        clinic: fieldData.GPClinic || '',
        phone: fieldData.GPPhone || '',
      } : undefined,
      clinical: {
        allergies: fieldData.Allergies ? fieldData.Allergies.split('\n').filter(Boolean) : [],
        medicalHistory: fieldData.MedicalHistory ? fieldData.MedicalHistory.split('\n').filter(Boolean) : [],
        currentMedications: fieldData.CurrentMedications ? fieldData.CurrentMedications.split('\n').filter(Boolean) : [],
      },
      notes: fieldData.Notes,
      status: fieldData.Status,
      syncMetadata: {
        fileMakerRecordId: recordId,
        fileMakerModId: modId,
        lastSynced: new Date().toISOString(),
        syncStatus: 'synced',
      },
      createdAt: fieldData.CreatedDate,
      updatedAt: fieldData.ModifiedDate,
    };
  }

  mapMediVacToFileMaker(patient: MediVacPatient): Partial<FileMakerPatient['fieldData']> {
    return {
      PatientID: patient.id,
      FirstName: patient.firstName,
      LastName: patient.lastName,
      DateOfBirth: patient.dateOfBirth,
      Gender: patient.gender,
      MedicareNumber: patient.medicareNumber,
      DVANumber: patient.dvaNumber,
      IHI: patient.ihi,
      Address: patient.address.street,
      Suburb: patient.address.suburb,
      State: patient.address.state,
      Postcode: patient.address.postcode,
      Phone: patient.contact.phone,
      Mobile: patient.contact.mobile,
      Email: patient.contact.email,
      EmergencyContact: patient.emergencyContact.name,
      EmergencyPhone: patient.emergencyContact.phone,
      GPName: patient.gp?.name,
      GPClinic: patient.gp?.clinic,
      GPPhone: patient.gp?.phone,
      Allergies: patient.clinical.allergies.join('\n'),
      MedicalHistory: patient.clinical.medicalHistory.join('\n'),
      CurrentMedications: patient.clinical.currentMedications.join('\n'),
      Notes: patient.notes,
      Status: patient.status,
      ModifiedDate: new Date().toISOString(),
    };
  }

  // ==========================================
  // Sync Operations
  // ==========================================

  async syncAll(): Promise<SyncResult> {
    const startTime = Date.now();
    
    if (this.status.isRunning) {
      throw new Error('Sync already in progress');
    }

    this.status.isRunning = true;
    await this.saveStatus();
    this.emit('sync_started', {});

    const result: SyncResult = {
      success: false,
      syncedAt: new Date().toISOString(),
      direction: this.config.syncDirection === 'push_only' ? 'push' : 
                 this.config.syncDirection === 'pull_only' ? 'pull' : 'bidirectional',
      stats: { created: 0, updated: 0, deleted: 0, conflicts: 0, errors: 0 },
      conflicts: [],
      errors: [],
      duration: 0,
    };

    try {
      await this.ensureAuthenticated();

      // Pull from FileMaker
      if (this.config.syncDirection !== 'push_only') {
        const pullResult = await this.pullFromFileMaker();
        result.stats.created += pullResult.created;
        result.stats.updated += pullResult.updated;
        result.stats.conflicts += pullResult.conflicts;
        result.conflicts.push(...pullResult.conflictDetails);
      }

      // Push to FileMaker
      if (this.config.syncDirection !== 'pull_only') {
        const pushResult = await this.pushToFileMaker();
        result.stats.created += pushResult.created;
        result.stats.updated += pushResult.updated;
        result.stats.deleted += pushResult.deleted;
        result.stats.errors += pushResult.errors;
        result.errors.push(...pushResult.errorDetails);
      }

      result.success = result.stats.errors === 0;
      this.status.lastSync = result.syncedAt;
      this.status.nextScheduledSync = this.config.syncInterval > 0 
        ? new Date(Date.now() + this.config.syncInterval).toISOString()
        : undefined;

    } catch (error) {
      result.errors.push({
        operation: 'read',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
      result.stats.errors++;
    } finally {
      this.status.isRunning = false;
      this.status.pendingChanges = this.pendingChanges.size;
      this.status.conflicts = this.conflicts.length;
      this.status.errors = result.stats.errors;
      result.duration = Date.now() - startTime;
      
      await this.saveStatus();
      this.emit('sync_completed', result);
    }

    return result;
  }

  private async pullFromFileMaker(): Promise<{ created: number; updated: number; conflicts: number; conflictDetails: SyncConflict[] }> {
    const result = { created: 0, updated: 0, conflicts: 0, conflictDetails: [] as SyncConflict[] };

    // Simulate fetching records from FileMaker
    await new Promise(resolve => setTimeout(resolve, 300));

    // In production, this would fetch actual records
    const mockRecords: FileMakerPatient[] = [
      {
        recordId: '1',
        modId: '1',
        fieldData: {
          PatientID: 'P001',
          FirstName: 'John',
          LastName: 'Smith',
          DateOfBirth: '1980-05-15',
          Gender: 'Male',
          MedicareNumber: '1234567890',
          Address: '123 Main St',
          Suburb: 'Sydney',
          State: 'NSW',
          Postcode: '2000',
          Phone: '02 9999 9999',
          Mobile: '0400 000 000',
          Email: 'john.smith@email.com',
          EmergencyContact: 'Jane Smith',
          EmergencyPhone: '0400 111 111',
          Status: 'active',
          CreatedDate: '2024-01-01T00:00:00Z',
          ModifiedDate: '2025-01-15T10:30:00Z',
          CreatedBy: 'admin',
          ModifiedBy: 'admin',
        },
      },
    ];

    for (const fmRecord of mockRecords) {
      const mediVacPatient = this.mapFileMakerToMediVac(fmRecord);
      // Check for conflicts and process
      result.created++;
    }

    return result;
  }

  private async pushToFileMaker(): Promise<{ created: number; updated: number; deleted: number; errors: number; errorDetails: SyncError[] }> {
    const result = { created: 0, updated: 0, deleted: 0, errors: 0, errorDetails: [] as SyncError[] };

    for (const [patientId, change] of this.pendingChanges) {
      try {
        await new Promise(resolve => setTimeout(resolve, 100));

        switch (change.operation) {
          case 'create':
            result.created++;
            break;
          case 'update':
            result.updated++;
            break;
          case 'delete':
            result.deleted++;
            break;
        }

        this.pendingChanges.delete(patientId);
      } catch (error) {
        result.errors++;
        result.errorDetails.push({
          patientId,
          operation: change.operation,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });
      }
    }

    await this.savePendingChanges();
    return result;
  }

  // ==========================================
  // Change Tracking
  // ==========================================

  async trackChange(patient: MediVacPatient, operation: 'create' | 'update' | 'delete'): Promise<void> {
    this.pendingChanges.set(patient.id, { patient, operation });
    this.status.pendingChanges = this.pendingChanges.size;
    await this.savePendingChanges();
    await this.saveStatus();
    this.emit('change_tracked', { patientId: patient.id, operation });
  }

  getPendingChanges(): Array<{ patientId: string; operation: string; patient: MediVacPatient }> {
    return Array.from(this.pendingChanges.entries()).map(([patientId, change]) => ({
      patientId,
      operation: change.operation,
      patient: change.patient,
    }));
  }

  async clearPendingChange(patientId: string): Promise<void> {
    this.pendingChanges.delete(patientId);
    this.status.pendingChanges = this.pendingChanges.size;
    await this.savePendingChanges();
    await this.saveStatus();
  }

  private async loadPendingChanges(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_CHANGES);
      if (stored) {
        const parsed = JSON.parse(stored) as Array<[string, { patient: MediVacPatient; operation: 'create' | 'update' | 'delete' }]>;
        this.pendingChanges = new Map(parsed);
      }
    } catch (error) {
      console.error('Failed to load pending changes:', error);
    }
  }

  private async savePendingChanges(): Promise<void> {
    try {
      const data = Array.from(this.pendingChanges.entries());
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_CHANGES, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save pending changes:', error);
    }
  }

  // ==========================================
  // Conflict Resolution
  // ==========================================

  async resolveConflict(patientId: string, resolution: 'local' | 'remote'): Promise<void> {
    const conflictIndex = this.conflicts.findIndex(c => c.patientId === patientId);
    if (conflictIndex === -1) {
      throw new Error('Conflict not found');
    }

    const conflict = this.conflicts[conflictIndex];
    conflict.resolvedBy = resolution;
    conflict.resolvedAt = new Date().toISOString();

    // Apply resolution
    if (resolution === 'local') {
      await this.trackChange(conflict.localRecord as MediVacPatient, 'update');
    }

    this.conflicts.splice(conflictIndex, 1);
    this.status.conflicts = this.conflicts.length;
    await this.saveConflicts();
    await this.saveStatus();
    
    this.emit('conflict_resolved', { patientId, resolution });
  }

  getConflicts(): SyncConflict[] {
    return [...this.conflicts];
  }

  private async loadConflicts(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CONFLICTS);
      if (stored) {
        this.conflicts = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  }

  private async saveConflicts(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONFLICTS, JSON.stringify(this.conflicts));
    } catch (error) {
      console.error('Failed to save conflicts:', error);
    }
  }

  // ==========================================
  // Auto Sync
  // ==========================================

  startAutoSync(): void {
    if (this.syncTimer) {
      this.stopAutoSync();
    }

    if (this.config.syncInterval > 0) {
      this.syncTimer = setInterval(() => {
        this.syncAll().catch(console.error);
      }, this.config.syncInterval);
      
      this.emit('auto_sync_started', { interval: this.config.syncInterval });
    }
  }

  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      this.emit('auto_sync_stopped', {});
    }
  }

  // ==========================================
  // Status
  // ==========================================

  getStatus(): SyncStatus {
    return { ...this.status };
  }

  private async loadStatus(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_STATUS);
      if (stored) {
        this.status = { ...this.status, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  }

  private async saveStatus(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify(this.status));
    } catch (error) {
      console.error('Failed to save sync status:', error);
    }
  }

  // ==========================================
  // Event System
  // ==========================================

  on(event: string, callback: (data: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: unknown) => void): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: unknown): void {
    this.eventListeners.get(event)?.forEach(callback => callback(data));
  }
}

// ==========================================
// Export Singleton
// ==========================================

export const fileMakerSync = new FileMakerPatientSyncService();

export default FileMakerPatientSyncService;
