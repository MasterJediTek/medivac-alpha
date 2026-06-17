/**
 * Appointments Service
 * Manages appointment scheduling, cancellation, and rescheduling
 */

export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  providerName: string;
  providerSpecialty: string;
  appointmentType: 'consultation' | 'follow-up' | 'procedure' | 'emergency';
  startTime: number;
  endTime: number;
  location: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  reminders: boolean;
  videoCallUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TimeSlot {
  id: string;
  providerId: string;
  startTime: number;
  endTime: number;
  available: boolean;
  appointmentType: string;
}

export interface AppointmentRequest {
  providerId: string;
  appointmentType: string;
  preferredDate: number;
  preferredTime: string;
  reason: string;
}

export class AppointmentsService {
  private static instance: AppointmentsService;
  private apiUrl = process.env.EXPO_PUBLIC_API_URL;

  private constructor() {}

  static getInstance(): AppointmentsService {
    if (!AppointmentsService.instance) {
      AppointmentsService.instance = new AppointmentsService();
    }
    return AppointmentsService.instance;
  }

  /**
   * Get all appointments for patient
   */
  async getPatientAppointments(
    patientId: string,
    filters?: {
      status?: string;
      startDate?: number;
      endDate?: number;
    }
  ): Promise<Appointment[]> {
    try {
      const params = new URLSearchParams({
        patientId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.startDate && { startDate: filters.startDate.toString() }),
        ...(filters?.endDate && { endDate: filters.endDate.toString() }),
      });

      const response = await fetch(`${this.apiUrl}/appointments?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch appointments');
      return await response.json();
    } catch (error) {
      console.error('Failed to get appointments:', error);
      throw error;
    }
  }

  /**
   * Get appointment details
   */
  async getAppointment(appointmentId: string): Promise<Appointment> {
    try {
      const response = await fetch(`${this.apiUrl}/appointments/${appointmentId}`, {
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch appointment');
      return await response.json();
    } catch (error) {
      console.error('Failed to get appointment:', error);
      throw error;
    }
  }

  /**
   * Get available time slots for provider
   */
  async getAvailableSlots(
    providerId: string,
    startDate: number,
    endDate: number,
    appointmentType?: string
  ): Promise<TimeSlot[]> {
    try {
      const params = new URLSearchParams({
        providerId,
        startDate: startDate.toString(),
        endDate: endDate.toString(),
        ...(appointmentType && { appointmentType }),
      });

      const response = await fetch(`${this.apiUrl}/appointments/slots?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch available slots');
      return await response.json();
    } catch (error) {
      console.error('Failed to get available slots:', error);
      throw error;
    }
  }

  /**
   * Book new appointment
   */
  async bookAppointment(request: AppointmentRequest): Promise<Appointment> {
    try {
      const response = await fetch(`${this.apiUrl}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) throw new Error('Failed to book appointment');
      return await response.json();
    } catch (error) {
      console.error('Failed to book appointment:', error);
      throw error;
    }
  }

  /**
   * Reschedule appointment
   */
  async rescheduleAppointment(
    appointmentId: string,
    newStartTime: number,
    newEndTime: number
  ): Promise<Appointment> {
    try {
      const response = await fetch(`${this.apiUrl}/appointments/${appointmentId}/reschedule`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
        body: JSON.stringify({ newStartTime, newEndTime }),
      });

      if (!response.ok) throw new Error('Failed to reschedule appointment');
      return await response.json();
    } catch (error) {
      console.error('Failed to reschedule appointment:', error);
      throw error;
    }
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(appointmentId: string, reason?: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/appointments/${appointmentId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) throw new Error('Failed to cancel appointment');
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      throw error;
    }
  }

  /**
   * Confirm appointment attendance
   */
  async confirmAttendance(appointmentId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/appointments/${appointmentId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to confirm attendance');
    } catch (error) {
      console.error('Failed to confirm attendance:', error);
      throw error;
    }
  }

  /**
   * Get appointment reminders
   */
  async getReminders(patientId: string): Promise<Appointment[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/appointments/reminders?patientId=${patientId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch reminders');
      return await response.json();
    } catch (error) {
      console.error('Failed to get reminders:', error);
      throw error;
    }
  }

  /**
   * Join video call for appointment
   */
  async getVideoCallUrl(appointmentId: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/appointments/${appointmentId}/video-call`, {
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to get video call URL');
      const data = await response.json();
      return data.videoCallUrl;
    } catch (error) {
      console.error('Failed to get video call URL:', error);
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
