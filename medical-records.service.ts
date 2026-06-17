/**
 * Medical Records Service
 * Manages patient medical history, test results, and prescriptions
 */

export interface MedicalRecord {
  id: string;
  patientId: string;
  type: 'diagnosis' | 'lab_result' | 'imaging' | 'prescription' | 'note';
  title: string;
  description: string;
  date: number;
  provider: string;
  attachments?: string[];
  status: 'active' | 'archived' | 'pending';
  tags: string[];
}

export interface LabResult {
  id: string;
  testName: string;
  value: string | number;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'abnormal' | 'critical';
  date: number;
  provider: string;
}

export interface Prescription {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  refillsRemaining: number;
  prescribedDate: number;
  expiryDate: number;
  provider: string;
  pharmacy?: string;
}

export class MedicalRecordsService {
  private static instance: MedicalRecordsService;
  private apiUrl = process.env.EXPO_PUBLIC_API_URL;

  private constructor() {}

  static getInstance(): MedicalRecordsService {
    if (!MedicalRecordsService.instance) {
      MedicalRecordsService.instance = new MedicalRecordsService();
    }
    return MedicalRecordsService.instance;
  }

  /**
   * Get all medical records for patient
   */
  async getPatientRecords(
    patientId: string,
    filters?: {
      type?: string;
      startDate?: number;
      endDate?: number;
      status?: string;
    }
  ): Promise<MedicalRecord[]> {
    try {
      const params = new URLSearchParams({
        patientId,
        ...(filters?.type && { type: filters.type }),
        ...(filters?.startDate && { startDate: filters.startDate.toString() }),
        ...(filters?.endDate && { endDate: filters.endDate.toString() }),
        ...(filters?.status && { status: filters.status }),
      });

      const response = await fetch(`${this.apiUrl}/medical-records?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch records');
      return await response.json();
    } catch (error) {
      console.error('Failed to get patient records:', error);
      throw error;
    }
  }

  /**
   * Get specific medical record
   */
  async getRecord(recordId: string): Promise<MedicalRecord> {
    try {
      const response = await fetch(`${this.apiUrl}/medical-records/${recordId}`, {
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch record');
      return await response.json();
    } catch (error) {
      console.error('Failed to get record:', error);
      throw error;
    }
  }

  /**
   * Get lab results
   */
  async getLabResults(patientId: string, limit: number = 10): Promise<LabResult[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/medical-records/lab-results?patientId=${patientId}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch lab results');
      return await response.json();
    } catch (error) {
      console.error('Failed to get lab results:', error);
      throw error;
    }
  }

  /**
   * Get prescriptions
   */
  async getPrescriptions(patientId: string): Promise<Prescription[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/medical-records/prescriptions?patientId=${patientId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch prescriptions');
      return await response.json();
    } catch (error) {
      console.error('Failed to get prescriptions:', error);
      throw error;
    }
  }

  /**
   * Add new medical record
   */
  async addRecord(record: Omit<MedicalRecord, 'id'>): Promise<MedicalRecord> {
    try {
      const response = await fetch(`${this.apiUrl}/medical-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
        body: JSON.stringify(record),
      });

      if (!response.ok) throw new Error('Failed to add record');
      return await response.json();
    } catch (error) {
      console.error('Failed to add record:', error);
      throw error;
    }
  }

  /**
   * Update medical record
   */
  async updateRecord(recordId: string, updates: Partial<MedicalRecord>): Promise<MedicalRecord> {
    try {
      const response = await fetch(`${this.apiUrl}/medical-records/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update record');
      return await response.json();
    } catch (error) {
      console.error('Failed to update record:', error);
      throw error;
    }
  }

  /**
   * Delete medical record
   */
  async deleteRecord(recordId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/medical-records/${recordId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete record');
    } catch (error) {
      console.error('Failed to delete record:', error);
      throw error;
    }
  }

  /**
   * Download record attachment
   */
  async downloadAttachment(attachmentId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.apiUrl}/medical-records/attachments/${attachmentId}`, {
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to download attachment');
      return await response.blob();
    } catch (error) {
      console.error('Failed to download attachment:', error);
      throw error;
    }
  }

  /**
   * Share record with provider
   */
  async shareRecord(recordId: string, providerId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/medical-records/${recordId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
        body: JSON.stringify({ providerId }),
      });

      if (!response.ok) throw new Error('Failed to share record');
    } catch (error) {
      console.error('Failed to share record:', error);
      throw error;
    }
  }

  /**
   * Get access token
   */
  private getAccessToken(): string {
    // TODO: Get from auth service
    return '';
  }
}
