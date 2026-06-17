/**
 * Barcode Scanner Service
 * QR code and barcode scanning for medication verification, patient wristbands, and equipment tracking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Barcode types
export type BarcodeType = 
  | 'qr'
  | 'code128'
  | 'code39'
  | 'ean13'
  | 'ean8'
  | 'upc_a'
  | 'upc_e'
  | 'datamatrix'
  | 'pdf417'
  | 'aztec'
  | 'unknown';

// Scan context types
export type ScanContext = 
  | 'medication'
  | 'patient_wristband'
  | 'equipment'
  | 'specimen'
  | 'document'
  | 'inventory'
  | 'general';

// Scan result status
export type ScanStatus = 
  | 'success'
  | 'verified'
  | 'warning'
  | 'error'
  | 'not_found'
  | 'expired'
  | 'mismatch';

// Scan result
export interface ScanResult {
  id: string;
  rawValue: string;
  barcodeType: BarcodeType;
  context: ScanContext;
  status: ScanStatus;
  timestamp: number;
  parsedData?: ParsedScanData;
  verificationResult?: VerificationResult;
  location?: string;
  scannedBy?: string;
}

// Parsed scan data
export interface ParsedScanData {
  type: string;
  identifier: string;
  name?: string;
  description?: string;
  expirationDate?: string;
  lotNumber?: string;
  manufacturer?: string;
  quantity?: number;
  unit?: string;
  patientId?: string;
  patientName?: string;
  metadata?: Record<string, any>;
}

// Verification result
export interface VerificationResult {
  verified: boolean;
  matchType: 'exact' | 'partial' | 'none';
  expectedValue?: string;
  actualValue?: string;
  warnings: string[];
  errors: string[];
  details?: Record<string, any>;
}

// Medication data
export interface MedicationData {
  ndc: string;
  name: string;
  genericName?: string;
  manufacturer: string;
  strength: string;
  form: string;
  lotNumber: string;
  expirationDate: string;
  quantity: number;
  unit: string;
  controlledSubstance: boolean;
  storageRequirements?: string;
}

// Patient wristband data
export interface PatientWristbandData {
  patientId: string;
  mrn: string;
  name: string;
  dob: string;
  gender: string;
  bloodType?: string;
  allergies: string[];
  roomNumber?: string;
  admitDate?: string;
  attendingPhysician?: string;
  alerts: string[];
}

// Equipment data
export interface EquipmentData {
  assetId: string;
  name: string;
  category: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  location: string;
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
  lastMaintenance?: string;
  nextMaintenance?: string;
  calibrationDue?: string;
}

// Scan history entry
export interface ScanHistoryEntry {
  id: string;
  scanResult: ScanResult;
  context: ScanContext;
  timestamp: number;
  userId?: string;
  patientId?: string;
  notes?: string;
  synced: boolean;
}

// Scanner settings
export interface ScannerSettings {
  enableFlashlight: boolean;
  enableVibration: boolean;
  enableSound: boolean;
  autoFocus: boolean;
  continuousScan: boolean;
  scanDelay: number;
  supportedFormats: BarcodeType[];
  defaultContext: ScanContext;
}

// Batch scan session
export interface BatchScanSession {
  id: string;
  context: ScanContext;
  scans: ScanResult[];
  startTime: number;
  endTime?: number;
  totalScans: number;
  successfulScans: number;
  failedScans: number;
  status: 'active' | 'paused' | 'completed';
}

class BarcodeScannerService {
  private settings: ScannerSettings;
  private history: ScanHistoryEntry[] = [];
  private currentBatchSession: BatchScanSession | null = null;
  private listeners: Set<(result: ScanResult) => void> = new Set();

  // Sample medication database for verification
  private medicationDatabase: Map<string, MedicationData> = new Map();
  
  // Sample patient database for verification
  private patientDatabase: Map<string, PatientWristbandData> = new Map();
  
  // Sample equipment database for verification
  private equipmentDatabase: Map<string, EquipmentData> = new Map();

  constructor() {
    this.settings = this.getDefaultSettings();
    this.initializeSampleData();
    this.loadHistory();
  }

  // Get default settings
  private getDefaultSettings(): ScannerSettings {
    return {
      enableFlashlight: false,
      enableVibration: true,
      enableSound: true,
      autoFocus: true,
      continuousScan: false,
      scanDelay: 500,
      supportedFormats: ['qr', 'code128', 'code39', 'ean13', 'datamatrix'],
      defaultContext: 'general',
    };
  }

  // Initialize sample data for demo
  private initializeSampleData(): void {
    // Sample medications
    this.medicationDatabase.set('NDC-12345-678-90', {
      ndc: 'NDC-12345-678-90',
      name: 'Amoxicillin',
      genericName: 'Amoxicillin',
      manufacturer: 'PharmaCorp',
      strength: '500mg',
      form: 'Capsule',
      lotNumber: 'LOT2024A001',
      expirationDate: '2025-12-31',
      quantity: 100,
      unit: 'capsules',
      controlledSubstance: false,
      storageRequirements: 'Store at room temperature',
    });

    this.medicationDatabase.set('NDC-98765-432-10', {
      ndc: 'NDC-98765-432-10',
      name: 'Lisinopril',
      genericName: 'Lisinopril',
      manufacturer: 'MediPharm',
      strength: '10mg',
      form: 'Tablet',
      lotNumber: 'LOT2024B002',
      expirationDate: '2025-06-30',
      quantity: 90,
      unit: 'tablets',
      controlledSubstance: false,
    });

    // Sample patients
    this.patientDatabase.set('MRN-2024-001', {
      patientId: 'P-001',
      mrn: 'MRN-2024-001',
      name: 'John Smith',
      dob: '1985-03-15',
      gender: 'Male',
      bloodType: 'O+',
      allergies: ['Penicillin', 'Sulfa'],
      roomNumber: '101-A',
      admitDate: '2024-01-20',
      attendingPhysician: 'Dr. Sarah Johnson',
      alerts: ['Fall Risk', 'Diabetic'],
    });

    this.patientDatabase.set('MRN-2024-002', {
      patientId: 'P-002',
      mrn: 'MRN-2024-002',
      name: 'Jane Doe',
      dob: '1972-08-22',
      gender: 'Female',
      bloodType: 'A-',
      allergies: [],
      roomNumber: '102-B',
      admitDate: '2024-01-22',
      attendingPhysician: 'Dr. Michael Chen',
      alerts: ['NPO'],
    });

    // Sample equipment
    this.equipmentDatabase.set('EQ-IV-001', {
      assetId: 'EQ-IV-001',
      name: 'IV Infusion Pump',
      category: 'Infusion',
      manufacturer: 'MedTech',
      model: 'InfuPro 3000',
      serialNumber: 'SN-2023-IV-001',
      location: 'Medical Ward A',
      status: 'available',
      lastMaintenance: '2024-01-15',
      nextMaintenance: '2024-04-15',
      calibrationDue: '2024-07-15',
    });

    this.equipmentDatabase.set('EQ-MON-002', {
      assetId: 'EQ-MON-002',
      name: 'Patient Monitor',
      category: 'Monitoring',
      manufacturer: 'VitalSign Corp',
      model: 'VitalWatch Pro',
      serialNumber: 'SN-2023-MON-002',
      location: 'ICU',
      status: 'in_use',
      lastMaintenance: '2024-01-10',
      nextMaintenance: '2024-04-10',
    });
  }

  // Get settings
  getSettings(): ScannerSettings {
    return { ...this.settings };
  }

  // Update settings
  async updateSettings(updates: Partial<ScannerSettings>): Promise<void> {
    this.settings = { ...this.settings, ...updates };
    await this.saveSettings();
  }

  // Save settings
  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem('scanner_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save scanner settings:', error);
    }
  }

  // Process scanned barcode
  async processScan(rawValue: string, barcodeType: BarcodeType, context: ScanContext): Promise<ScanResult> {
    const scanId = `scan-${Date.now()}`;
    
    // Parse the barcode data
    const parsedData = this.parseBarcode(rawValue, context);
    
    // Verify against database
    const verificationResult = await this.verifyBarcode(rawValue, context, parsedData);
    
    // Determine status
    let status: ScanStatus = 'success';
    if (verificationResult) {
      if (verificationResult.verified) {
        status = verificationResult.warnings.length > 0 ? 'warning' : 'verified';
      } else {
        status = verificationResult.errors.length > 0 ? 'error' : 'not_found';
      }
    }

    const result: ScanResult = {
      id: scanId,
      rawValue,
      barcodeType,
      context,
      status,
      timestamp: Date.now(),
      parsedData,
      verificationResult,
    };

    // Add to history
    await this.addToHistory(result);

    // Add to batch session if active
    if (this.currentBatchSession) {
      this.currentBatchSession.scans.push(result);
      this.currentBatchSession.totalScans++;
      if (status === 'verified' || status === 'success') {
        this.currentBatchSession.successfulScans++;
      } else {
        this.currentBatchSession.failedScans++;
      }
    }

    // Notify listeners
    this.notifyListeners(result);

    return result;
  }

  // Parse barcode data based on context
  private parseBarcode(rawValue: string, context: ScanContext): ParsedScanData {
    switch (context) {
      case 'medication':
        return this.parseMedicationBarcode(rawValue);
      case 'patient_wristband':
        return this.parsePatientBarcode(rawValue);
      case 'equipment':
        return this.parseEquipmentBarcode(rawValue);
      default:
        return {
          type: 'generic',
          identifier: rawValue,
        };
    }
  }

  // Parse medication barcode
  private parseMedicationBarcode(rawValue: string): ParsedScanData {
    // Check if it's an NDC code
    if (rawValue.startsWith('NDC-') || /^\d{5}-\d{4}-\d{2}$/.test(rawValue)) {
      const medication = this.medicationDatabase.get(rawValue);
      if (medication) {
        return {
          type: 'medication',
          identifier: medication.ndc,
          name: medication.name,
          description: `${medication.strength} ${medication.form}`,
          expirationDate: medication.expirationDate,
          lotNumber: medication.lotNumber,
          manufacturer: medication.manufacturer,
          quantity: medication.quantity,
          unit: medication.unit,
        };
      }
    }

    return {
      type: 'medication',
      identifier: rawValue,
    };
  }

  // Parse patient barcode
  private parsePatientBarcode(rawValue: string): ParsedScanData {
    // Check if it's an MRN
    if (rawValue.startsWith('MRN-')) {
      const patient = this.patientDatabase.get(rawValue);
      if (patient) {
        return {
          type: 'patient',
          identifier: patient.mrn,
          patientId: patient.patientId,
          patientName: patient.name,
          description: `DOB: ${patient.dob}, Room: ${patient.roomNumber}`,
          metadata: {
            bloodType: patient.bloodType,
            allergies: patient.allergies,
            alerts: patient.alerts,
          },
        };
      }
    }

    return {
      type: 'patient',
      identifier: rawValue,
    };
  }

  // Parse equipment barcode
  private parseEquipmentBarcode(rawValue: string): ParsedScanData {
    // Check if it's an asset ID
    if (rawValue.startsWith('EQ-')) {
      const equipment = this.equipmentDatabase.get(rawValue);
      if (equipment) {
        return {
          type: 'equipment',
          identifier: equipment.assetId,
          name: equipment.name,
          description: `${equipment.manufacturer} ${equipment.model}`,
          metadata: {
            category: equipment.category,
            serialNumber: equipment.serialNumber,
            location: equipment.location,
            status: equipment.status,
            nextMaintenance: equipment.nextMaintenance,
          },
        };
      }
    }

    return {
      type: 'equipment',
      identifier: rawValue,
    };
  }

  // Verify barcode against database
  private async verifyBarcode(
    rawValue: string,
    context: ScanContext,
    parsedData: ParsedScanData
  ): Promise<VerificationResult> {
    const warnings: string[] = [];
    const errors: string[] = [];
    let verified = false;
    let matchType: 'exact' | 'partial' | 'none' = 'none';

    switch (context) {
      case 'medication':
        const medication = this.medicationDatabase.get(rawValue);
        if (medication) {
          verified = true;
          matchType = 'exact';
          
          // Check expiration
          const expDate = new Date(medication.expirationDate);
          const now = new Date();
          const daysUntilExpiry = Math.floor((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry < 0) {
            errors.push('Medication has expired');
            verified = false;
          } else if (daysUntilExpiry < 30) {
            warnings.push(`Medication expires in ${daysUntilExpiry} days`);
          }

          if (medication.controlledSubstance) {
            warnings.push('Controlled substance - requires additional verification');
          }
        } else {
          errors.push('Medication not found in database');
        }
        break;

      case 'patient_wristband':
        const patient = this.patientDatabase.get(rawValue);
        if (patient) {
          verified = true;
          matchType = 'exact';
          
          if (patient.allergies.length > 0) {
            warnings.push(`Patient has allergies: ${patient.allergies.join(', ')}`);
          }
          if (patient.alerts.length > 0) {
            warnings.push(`Patient alerts: ${patient.alerts.join(', ')}`);
          }
        } else {
          errors.push('Patient not found in database');
        }
        break;

      case 'equipment':
        const equipment = this.equipmentDatabase.get(rawValue);
        if (equipment) {
          verified = true;
          matchType = 'exact';
          
          if (equipment.status === 'maintenance') {
            errors.push('Equipment is currently under maintenance');
            verified = false;
          } else if (equipment.status === 'retired') {
            errors.push('Equipment has been retired');
            verified = false;
          }

          if (equipment.nextMaintenance) {
            const maintDate = new Date(equipment.nextMaintenance);
            const now = new Date();
            if (maintDate < now) {
              warnings.push('Equipment maintenance is overdue');
            }
          }

          if (equipment.calibrationDue) {
            const calibDate = new Date(equipment.calibrationDue);
            const now = new Date();
            if (calibDate < now) {
              warnings.push('Equipment calibration is overdue');
            }
          }
        } else {
          errors.push('Equipment not found in database');
        }
        break;

      default:
        verified = true;
        matchType = 'partial';
    }

    return {
      verified,
      matchType,
      warnings,
      errors,
    };
  }

  // Add to history
  private async addToHistory(result: ScanResult): Promise<void> {
    const entry: ScanHistoryEntry = {
      id: `history-${Date.now()}`,
      scanResult: result,
      context: result.context,
      timestamp: Date.now(),
      synced: false,
    };

    this.history.unshift(entry);

    // Keep only last 500 entries
    if (this.history.length > 500) {
      this.history = this.history.slice(0, 500);
    }

    await this.saveHistory();
  }

  // Get history
  getHistory(context?: ScanContext): ScanHistoryEntry[] {
    if (context) {
      return this.history.filter(h => h.context === context);
    }
    return [...this.history];
  }

  // Clear history
  async clearHistory(): Promise<void> {
    this.history = [];
    await this.saveHistory();
  }

  // Save history
  private async saveHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem('scan_history', JSON.stringify(this.history));
    } catch (error) {
      console.error('Failed to save scan history:', error);
    }
  }

  // Load history
  private async loadHistory(): Promise<void> {
    try {
      const json = await AsyncStorage.getItem('scan_history');
      if (json) {
        this.history = JSON.parse(json);
      }
    } catch (error) {
      console.error('Failed to load scan history:', error);
    }
  }

  // Start batch scan session
  startBatchSession(context: ScanContext): BatchScanSession {
    this.currentBatchSession = {
      id: `batch-${Date.now()}`,
      context,
      scans: [],
      startTime: Date.now(),
      totalScans: 0,
      successfulScans: 0,
      failedScans: 0,
      status: 'active',
    };
    return this.currentBatchSession;
  }

  // End batch scan session
  endBatchSession(): BatchScanSession | null {
    if (!this.currentBatchSession) return null;

    this.currentBatchSession.endTime = Date.now();
    this.currentBatchSession.status = 'completed';

    const session = { ...this.currentBatchSession };
    this.currentBatchSession = null;
    return session;
  }

  // Get current batch session
  getCurrentBatchSession(): BatchScanSession | null {
    return this.currentBatchSession ? { ...this.currentBatchSession } : null;
  }

  // Subscribe to scan results
  subscribe(listener: (result: ScanResult) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify listeners
  private notifyListeners(result: ScanResult): void {
    this.listeners.forEach(listener => listener(result));
  }

  // Get context label
  getContextLabel(context: ScanContext): string {
    const labels: Record<ScanContext, string> = {
      medication: 'Medication',
      patient_wristband: 'Patient Wristband',
      equipment: 'Equipment',
      specimen: 'Specimen',
      document: 'Document',
      inventory: 'Inventory',
      general: 'General',
    };
    return labels[context] || context;
  }

  // Get status color
  getStatusColor(status: ScanStatus): string {
    const colors: Record<ScanStatus, string> = {
      success: '#22C55E',
      verified: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      not_found: '#6B7280',
      expired: '#EF4444',
      mismatch: '#EF4444',
    };
    return colors[status] || '#6B7280';
  }

  // Get barcode type label
  getBarcodeTypeLabel(type: BarcodeType): string {
    const labels: Record<BarcodeType, string> = {
      qr: 'QR Code',
      code128: 'Code 128',
      code39: 'Code 39',
      ean13: 'EAN-13',
      ean8: 'EAN-8',
      upc_a: 'UPC-A',
      upc_e: 'UPC-E',
      datamatrix: 'Data Matrix',
      pdf417: 'PDF417',
      aztec: 'Aztec',
      unknown: 'Unknown',
    };
    return labels[type] || type;
  }

  // Simulate scan for demo
  simulateScan(context: ScanContext): Promise<ScanResult> {
    const sampleBarcodes: Record<ScanContext, string[]> = {
      medication: ['NDC-12345-678-90', 'NDC-98765-432-10', 'NDC-UNKNOWN-001'],
      patient_wristband: ['MRN-2024-001', 'MRN-2024-002', 'MRN-UNKNOWN-001'],
      equipment: ['EQ-IV-001', 'EQ-MON-002', 'EQ-UNKNOWN-001'],
      specimen: ['SPEC-001', 'SPEC-002'],
      document: ['DOC-001', 'DOC-002'],
      inventory: ['INV-001', 'INV-002'],
      general: ['GENERAL-001', 'GENERAL-002'],
    };

    const barcodes = sampleBarcodes[context] || sampleBarcodes.general;
    const randomBarcode = barcodes[Math.floor(Math.random() * barcodes.length)];

    return this.processScan(randomBarcode, 'qr', context);
  }
}

// Export singleton instance
export const barcodeScannerService = new BarcodeScannerService();
export default barcodeScannerService;
