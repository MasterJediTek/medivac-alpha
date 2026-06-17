/**
 * MediVac One - Wearable Device Integration Service
 * Apple Watch, Fitbit, Samsung Health, and Garmin Connect integration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types and Interfaces
// ==========================================

export type WearablePlatform = 'apple_watch' | 'fitbit' | 'samsung_health' | 'garmin' | 'google_fit' | 'withings' | 'oura';
export type DataType = 'heart_rate' | 'steps' | 'sleep' | 'blood_oxygen' | 'ecg' | 'activity' | 'calories' | 'distance' | 'floors' | 'hrv' | 'respiratory_rate' | 'body_temperature' | 'blood_pressure' | 'weight' | 'body_fat';
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface WearableDevice {
  id: string;
  platform: WearablePlatform;
  deviceName: string;
  deviceModel: string;
  firmwareVersion?: string;
  batteryLevel?: number;
  lastSyncTime?: string;
  syncStatus: SyncStatus;
  isConnected: boolean;
  userId: string;
  patientId?: string;
  capabilities: DataType[];
  settings: WearableSettings;
}

export interface WearableSettings {
  syncInterval: number; // minutes
  enableBackgroundSync: boolean;
  enableNotifications: boolean;
  dataRetentionDays: number;
  shareWithCareTeam: boolean;
  alertThresholds: {
    heartRateHigh: number;
    heartRateLow: number;
    bloodOxygenLow: number;
    irregularRhythm: boolean;
  };
}

export interface HealthDataPoint {
  id: string;
  deviceId: string;
  platform: WearablePlatform;
  dataType: DataType;
  value: number;
  unit: string;
  timestamp: string;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface HeartRateData extends HealthDataPoint {
  dataType: 'heart_rate';
  restingHeartRate?: number;
  walkingHeartRate?: number;
  heartRateVariability?: number;
  zone?: 'rest' | 'fat_burn' | 'cardio' | 'peak';
}

export interface SleepData {
  id: string;
  deviceId: string;
  platform: WearablePlatform;
  date: string;
  startTime: string;
  endTime: string;
  totalMinutes: number;
  stages: {
    awake: number;
    light: number;
    deep: number;
    rem: number;
  };
  efficiency: number;
  interruptions: number;
  sleepScore?: number;
}

export interface ActivityData {
  id: string;
  deviceId: string;
  platform: WearablePlatform;
  date: string;
  steps: number;
  distance: number; // meters
  calories: number;
  activeMinutes: number;
  floors?: number;
  sedentaryMinutes?: number;
  activityScore?: number;
}

export interface ECGReading {
  id: string;
  deviceId: string;
  platform: WearablePlatform;
  timestamp: string;
  classification: 'sinus_rhythm' | 'afib' | 'inconclusive' | 'low_high_heart_rate';
  averageHeartRate: number;
  symptoms?: string[];
  waveformData?: number[];
  duration: number; // seconds
  leadConfiguration: string;
}

export interface BloodOxygenReading {
  id: string;
  deviceId: string;
  platform: WearablePlatform;
  timestamp: string;
  spO2: number;
  altitude?: number;
  confidence: 'high' | 'medium' | 'low';
  measurementCondition: 'rest' | 'sleep' | 'activity';
}

export interface WearableAlert {
  id: string;
  deviceId: string;
  platform: WearablePlatform;
  alertType: 'high_heart_rate' | 'low_heart_rate' | 'irregular_rhythm' | 'low_blood_oxygen' | 'fall_detected' | 'inactivity' | 'sleep_apnea';
  severity: 'info' | 'warning' | 'critical';
  value?: number;
  threshold?: number;
  timestamp: string;
  message: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface PlatformCredentials {
  platform: WearablePlatform;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  scope: string[];
  userId: string;
}

// ==========================================
// Platform Configurations
// ==========================================

interface PlatformConfig {
  name: string;
  authUrl: string;
  tokenUrl: string;
  apiBaseUrl: string;
  scopes: string[];
  supportedDataTypes: DataType[];
  rateLimit: { requests: number; period: number };
}

const PLATFORM_CONFIGS: Record<WearablePlatform, PlatformConfig> = {
  apple_watch: {
    name: 'Apple Watch (HealthKit)',
    authUrl: 'healthkit://authorize',
    tokenUrl: 'healthkit://token',
    apiBaseUrl: 'healthkit://data',
    scopes: ['heart_rate', 'steps', 'sleep', 'ecg', 'blood_oxygen', 'activity'],
    supportedDataTypes: ['heart_rate', 'steps', 'sleep', 'blood_oxygen', 'ecg', 'activity', 'calories', 'distance', 'hrv', 'respiratory_rate'],
    rateLimit: { requests: 1000, period: 3600 },
  },
  fitbit: {
    name: 'Fitbit',
    authUrl: 'https://www.fitbit.com/oauth2/authorize',
    tokenUrl: 'https://api.fitbit.com/oauth2/token',
    apiBaseUrl: 'https://api.fitbit.com/1/user/-',
    scopes: ['activity', 'heartrate', 'sleep', 'weight', 'profile', 'oxygen_saturation', 'respiratory_rate'],
    supportedDataTypes: ['heart_rate', 'steps', 'sleep', 'blood_oxygen', 'activity', 'calories', 'distance', 'floors', 'hrv', 'respiratory_rate', 'weight'],
    rateLimit: { requests: 150, period: 3600 },
  },
  samsung_health: {
    name: 'Samsung Health',
    authUrl: 'https://account.samsung.com/oauth2/authorize',
    tokenUrl: 'https://account.samsung.com/oauth2/token',
    apiBaseUrl: 'https://api.shealth.samsung.com/v1',
    scopes: ['heart_rate', 'step_count', 'sleep', 'blood_oxygen', 'stress'],
    supportedDataTypes: ['heart_rate', 'steps', 'sleep', 'blood_oxygen', 'activity', 'calories', 'distance', 'floors'],
    rateLimit: { requests: 100, period: 3600 },
  },
  garmin: {
    name: 'Garmin Connect',
    authUrl: 'https://connect.garmin.com/oauthConfirm',
    tokenUrl: 'https://connectapi.garmin.com/oauth-service/oauth/access_token',
    apiBaseUrl: 'https://apis.garmin.com/wellness-api/rest',
    scopes: ['activity', 'heartrate', 'sleep', 'body', 'stress', 'respiration'],
    supportedDataTypes: ['heart_rate', 'steps', 'sleep', 'blood_oxygen', 'activity', 'calories', 'distance', 'floors', 'hrv', 'respiratory_rate', 'body_temperature'],
    rateLimit: { requests: 200, period: 3600 },
  },
  google_fit: {
    name: 'Google Fit',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    apiBaseUrl: 'https://www.googleapis.com/fitness/v1/users/me',
    scopes: ['https://www.googleapis.com/auth/fitness.activity.read', 'https://www.googleapis.com/auth/fitness.heart_rate.read', 'https://www.googleapis.com/auth/fitness.sleep.read'],
    supportedDataTypes: ['heart_rate', 'steps', 'sleep', 'activity', 'calories', 'distance', 'weight'],
    rateLimit: { requests: 1000, period: 3600 },
  },
  withings: {
    name: 'Withings',
    authUrl: 'https://account.withings.com/oauth2_user/authorize2',
    tokenUrl: 'https://wbsapi.withings.net/v2/oauth2',
    apiBaseUrl: 'https://wbsapi.withings.net',
    scopes: ['user.metrics', 'user.activity', 'user.sleepevents'],
    supportedDataTypes: ['heart_rate', 'steps', 'sleep', 'blood_oxygen', 'blood_pressure', 'weight', 'body_fat', 'body_temperature'],
    rateLimit: { requests: 120, period: 3600 },
  },
  oura: {
    name: 'Oura Ring',
    authUrl: 'https://cloud.ouraring.com/oauth/authorize',
    tokenUrl: 'https://api.ouraring.com/oauth/token',
    apiBaseUrl: 'https://api.ouraring.com/v2',
    scopes: ['daily', 'heartrate', 'personal', 'session', 'sleep', 'workout'],
    supportedDataTypes: ['heart_rate', 'sleep', 'activity', 'hrv', 'respiratory_rate', 'body_temperature'],
    rateLimit: { requests: 5000, period: 86400 },
  },
};

// ==========================================
// Wearable Device Service
// ==========================================

class WearableDeviceService {
  private devices: Map<string, WearableDevice> = new Map();
  private credentials: Map<string, PlatformCredentials> = new Map();
  private healthData: HealthDataPoint[] = [];
  private sleepData: SleepData[] = [];
  private activityData: ActivityData[] = [];
  private ecgReadings: ECGReading[] = [];
  private bloodOxygenReadings: BloodOxygenReading[] = [];
  private alerts: WearableAlert[] = [];
  private syncIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();

  constructor() {
    this.loadState();
  }

  private async loadState(): Promise<void> {
    try {
      const devicesData = await AsyncStorage.getItem('wearable_devices');
      if (devicesData) {
        const parsed = JSON.parse(devicesData);
        Object.entries(parsed).forEach(([key, value]) => {
          this.devices.set(key, value as WearableDevice);
        });
      }

      const healthDataStr = await AsyncStorage.getItem('wearable_health_data');
      if (healthDataStr) {
        this.healthData = JSON.parse(healthDataStr);
      }

      const alertsData = await AsyncStorage.getItem('wearable_alerts');
      if (alertsData) {
        this.alerts = JSON.parse(alertsData);
      }
    } catch (error) {
      console.error('Failed to load wearable state:', error);
    }
  }

  private async saveState(): Promise<void> {
    try {
      const devicesObj: Record<string, WearableDevice> = {};
      this.devices.forEach((value, key) => {
        devicesObj[key] = value;
      });
      await AsyncStorage.setItem('wearable_devices', JSON.stringify(devicesObj));
      await AsyncStorage.setItem('wearable_health_data', JSON.stringify(this.healthData.slice(-5000)));
      await AsyncStorage.setItem('wearable_alerts', JSON.stringify(this.alerts.slice(-500)));
    } catch (error) {
      console.error('Failed to save wearable state:', error);
    }
  }

  // ==========================================
  // Platform Configuration
  // ==========================================

  getSupportedPlatforms(): { platform: WearablePlatform; config: PlatformConfig }[] {
    return Object.entries(PLATFORM_CONFIGS).map(([platform, config]) => ({
      platform: platform as WearablePlatform,
      config,
    }));
  }

  getPlatformConfig(platform: WearablePlatform): PlatformConfig {
    return PLATFORM_CONFIGS[platform];
  }

  // ==========================================
  // Authorization
  // ==========================================

  async initiateOAuth(platform: WearablePlatform, userId: string): Promise<string> {
    const config = PLATFORM_CONFIGS[platform];
    const state = `${platform}_${userId}_${Date.now()}`;
    
    // In a real implementation, this would redirect to the OAuth provider
    const authUrl = `${config.authUrl}?client_id=MEDIVAC_CLIENT_ID&redirect_uri=medivac://oauth/callback&scope=${config.scopes.join(' ')}&state=${state}&response_type=code`;
    
    return authUrl;
  }

  async handleOAuthCallback(
    platform: WearablePlatform,
    code: string,
    userId: string
  ): Promise<PlatformCredentials> {
    // Simulate token exchange
    const credentials: PlatformCredentials = {
      platform,
      accessToken: `access_${platform}_${Date.now()}`,
      refreshToken: `refresh_${platform}_${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      scope: PLATFORM_CONFIGS[platform].scopes,
      userId,
    };

    this.credentials.set(`${platform}_${userId}`, credentials);
    return credentials;
  }

  async refreshToken(platform: WearablePlatform, userId: string): Promise<PlatformCredentials | null> {
    const key = `${platform}_${userId}`;
    const existing = this.credentials.get(key);
    
    if (!existing?.refreshToken) return null;

    const newCredentials: PlatformCredentials = {
      ...existing,
      accessToken: `access_${platform}_${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };

    this.credentials.set(key, newCredentials);
    return newCredentials;
  }

  // ==========================================
  // Device Management
  // ==========================================

  async registerDevice(
    platform: WearablePlatform,
    userId: string,
    deviceInfo: { deviceName: string; deviceModel: string; firmwareVersion?: string },
    patientId?: string
  ): Promise<WearableDevice> {
    const config = PLATFORM_CONFIGS[platform];
    
    const device: WearableDevice = {
      id: `wearable_${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      platform,
      deviceName: deviceInfo.deviceName,
      deviceModel: deviceInfo.deviceModel,
      firmwareVersion: deviceInfo.firmwareVersion,
      syncStatus: 'idle',
      isConnected: true,
      userId,
      patientId,
      capabilities: config.supportedDataTypes,
      settings: {
        syncInterval: 15,
        enableBackgroundSync: true,
        enableNotifications: true,
        dataRetentionDays: 90,
        shareWithCareTeam: true,
        alertThresholds: {
          heartRateHigh: 120,
          heartRateLow: 50,
          bloodOxygenLow: 90,
          irregularRhythm: true,
        },
      },
    };

    this.devices.set(device.id, device);
    await this.saveState();

    // Start background sync
    this.startBackgroundSync(device.id);

    return device;
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId);
    if (device) {
      device.isConnected = false;
      device.syncStatus = 'idle';
      this.devices.set(deviceId, device);
      
      // Stop background sync
      const interval = this.syncIntervals.get(deviceId);
      if (interval) {
        clearInterval(interval);
        this.syncIntervals.delete(deviceId);
      }
      
      await this.saveState();
    }
  }

  getDevice(deviceId: string): WearableDevice | undefined {
    return this.devices.get(deviceId);
  }

  getDevicesByUser(userId: string): WearableDevice[] {
    return Array.from(this.devices.values()).filter(d => d.userId === userId);
  }

  getDevicesByPatient(patientId: string): WearableDevice[] {
    return Array.from(this.devices.values()).filter(d => d.patientId === patientId);
  }

  async updateDeviceSettings(deviceId: string, settings: Partial<WearableSettings>): Promise<WearableDevice | null> {
    const device = this.devices.get(deviceId);
    if (!device) return null;

    device.settings = { ...device.settings, ...settings };
    this.devices.set(deviceId, device);
    await this.saveState();

    return device;
  }

  // ==========================================
  // Data Synchronization
  // ==========================================

  private startBackgroundSync(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (!device || !device.settings.enableBackgroundSync) return;

    const interval = setInterval(() => {
      this.syncDeviceData(deviceId);
    }, device.settings.syncInterval * 60 * 1000);

    this.syncIntervals.set(deviceId, interval);
  }

  async syncDeviceData(deviceId: string): Promise<{ success: boolean; dataPoints: number }> {
    const device = this.devices.get(deviceId);
    if (!device) return { success: false, dataPoints: 0 };

    device.syncStatus = 'syncing';
    this.devices.set(deviceId, device);

    try {
      // Simulate fetching data from wearable platform
      const dataPoints = await this.fetchPlatformData(device);
      
      device.syncStatus = 'success';
      device.lastSyncTime = new Date().toISOString();
      this.devices.set(deviceId, device);
      await this.saveState();

      return { success: true, dataPoints };
    } catch (error) {
      device.syncStatus = 'error';
      this.devices.set(deviceId, device);
      return { success: false, dataPoints: 0 };
    }
  }

  private async fetchPlatformData(device: WearableDevice): Promise<number> {
    let dataPointCount = 0;
    const now = new Date();

    // Simulate heart rate data
    if (device.capabilities.includes('heart_rate')) {
      for (let i = 0; i < 10; i++) {
        const timestamp = new Date(now.getTime() - i * 6 * 60 * 1000);
        const heartRate = 60 + Math.floor(Math.random() * 40);
        
        const dataPoint: HeartRateData = {
          id: `hr_${Date.now()}_${i}`,
          deviceId: device.id,
          platform: device.platform,
          dataType: 'heart_rate',
          value: heartRate,
          unit: 'bpm',
          timestamp: timestamp.toISOString(),
          source: device.deviceName,
          heartRateVariability: 20 + Math.floor(Math.random() * 30),
          zone: heartRate < 70 ? 'rest' : heartRate < 100 ? 'fat_burn' : 'cardio',
        };

        this.healthData.push(dataPoint);
        dataPointCount++;

        // Check for alerts
        this.checkHeartRateAlerts(device, dataPoint);
      }
    }

    // Simulate blood oxygen data
    if (device.capabilities.includes('blood_oxygen')) {
      const spO2 = 94 + Math.floor(Math.random() * 6);
      const reading: BloodOxygenReading = {
        id: `spo2_${Date.now()}`,
        deviceId: device.id,
        platform: device.platform,
        timestamp: now.toISOString(),
        spO2,
        confidence: spO2 > 95 ? 'high' : 'medium',
        measurementCondition: 'rest',
      };

      this.bloodOxygenReadings.push(reading);
      dataPointCount++;

      // Check for low SpO2 alert
      if (spO2 < device.settings.alertThresholds.bloodOxygenLow) {
        this.createAlert(device, 'low_blood_oxygen', spO2, device.settings.alertThresholds.bloodOxygenLow);
      }
    }

    // Simulate steps data
    if (device.capabilities.includes('steps')) {
      const steps = 2000 + Math.floor(Math.random() * 8000);
      const dataPoint: HealthDataPoint = {
        id: `steps_${Date.now()}`,
        deviceId: device.id,
        platform: device.platform,
        dataType: 'steps',
        value: steps,
        unit: 'steps',
        timestamp: now.toISOString(),
        source: device.deviceName,
      };

      this.healthData.push(dataPoint);
      dataPointCount++;
    }

    // Simulate sleep data
    if (device.capabilities.includes('sleep')) {
      const sleepRecord: SleepData = {
        id: `sleep_${Date.now()}`,
        deviceId: device.id,
        platform: device.platform,
        date: now.toISOString().split('T')[0],
        startTime: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
        endTime: now.toISOString(),
        totalMinutes: 420 + Math.floor(Math.random() * 60),
        stages: {
          awake: 30 + Math.floor(Math.random() * 20),
          light: 180 + Math.floor(Math.random() * 60),
          deep: 60 + Math.floor(Math.random() * 30),
          rem: 90 + Math.floor(Math.random() * 30),
        },
        efficiency: 80 + Math.floor(Math.random() * 15),
        interruptions: Math.floor(Math.random() * 5),
        sleepScore: 70 + Math.floor(Math.random() * 25),
      };

      this.sleepData.push(sleepRecord);
      dataPointCount++;
    }

    // Simulate ECG data (Apple Watch only)
    if (device.platform === 'apple_watch' && device.capabilities.includes('ecg')) {
      const ecgReading: ECGReading = {
        id: `ecg_${Date.now()}`,
        deviceId: device.id,
        platform: device.platform,
        timestamp: now.toISOString(),
        classification: Math.random() > 0.95 ? 'afib' : 'sinus_rhythm',
        averageHeartRate: 60 + Math.floor(Math.random() * 30),
        duration: 30,
        leadConfiguration: 'Lead I',
      };

      this.ecgReadings.push(ecgReading);
      dataPointCount++;

      // Alert for AFib detection
      if (ecgReading.classification === 'afib') {
        this.createAlert(device, 'irregular_rhythm', 0, 0, 'Atrial fibrillation detected');
      }
    }

    return dataPointCount;
  }

  private checkHeartRateAlerts(device: WearableDevice, reading: HeartRateData): void {
    const { heartRateHigh, heartRateLow } = device.settings.alertThresholds;

    if (reading.value > heartRateHigh) {
      this.createAlert(device, 'high_heart_rate', reading.value, heartRateHigh);
    } else if (reading.value < heartRateLow) {
      this.createAlert(device, 'low_heart_rate', reading.value, heartRateLow);
    }
  }

  private createAlert(
    device: WearableDevice,
    alertType: WearableAlert['alertType'],
    value: number,
    threshold: number,
    customMessage?: string
  ): void {
    const messages: Record<WearableAlert['alertType'], string> = {
      high_heart_rate: `High heart rate detected: ${value} bpm (threshold: ${threshold} bpm)`,
      low_heart_rate: `Low heart rate detected: ${value} bpm (threshold: ${threshold} bpm)`,
      irregular_rhythm: customMessage || 'Irregular heart rhythm detected',
      low_blood_oxygen: `Low blood oxygen: ${value}% (threshold: ${threshold}%)`,
      fall_detected: 'Fall detected - emergency response may be needed',
      inactivity: 'Extended period of inactivity detected',
      sleep_apnea: 'Possible sleep apnea event detected',
    };

    const severity: Record<WearableAlert['alertType'], WearableAlert['severity']> = {
      high_heart_rate: 'warning',
      low_heart_rate: 'warning',
      irregular_rhythm: 'critical',
      low_blood_oxygen: 'critical',
      fall_detected: 'critical',
      inactivity: 'info',
      sleep_apnea: 'warning',
    };

    const alert: WearableAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deviceId: device.id,
      platform: device.platform,
      alertType,
      severity: severity[alertType],
      value,
      threshold,
      timestamp: new Date().toISOString(),
      message: messages[alertType],
      acknowledged: false,
    };

    this.alerts.push(alert);
  }

  // ==========================================
  // Data Retrieval
  // ==========================================

  getHeartRateData(deviceId: string, startDate?: string, endDate?: string): HealthDataPoint[] {
    let data = this.healthData.filter(d => d.deviceId === deviceId && d.dataType === 'heart_rate');
    
    if (startDate) data = data.filter(d => d.timestamp >= startDate);
    if (endDate) data = data.filter(d => d.timestamp <= endDate);
    
    return data.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  getSleepData(deviceId: string, startDate?: string, endDate?: string): SleepData[] {
    let data = this.sleepData.filter(d => d.deviceId === deviceId);
    
    if (startDate) data = data.filter(d => d.date >= startDate);
    if (endDate) data = data.filter(d => d.date <= endDate);
    
    return data.sort((a, b) => b.date.localeCompare(a.date));
  }

  getActivityData(deviceId: string, startDate?: string, endDate?: string): ActivityData[] {
    let data = this.activityData.filter(d => d.deviceId === deviceId);
    
    if (startDate) data = data.filter(d => d.date >= startDate);
    if (endDate) data = data.filter(d => d.date <= endDate);
    
    return data.sort((a, b) => b.date.localeCompare(a.date));
  }

  getECGReadings(deviceId: string, limit: number = 10): ECGReading[] {
    return this.ecgReadings
      .filter(r => r.deviceId === deviceId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }

  getBloodOxygenReadings(deviceId: string, limit: number = 50): BloodOxygenReading[] {
    return this.bloodOxygenReadings
      .filter(r => r.deviceId === deviceId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }

  // ==========================================
  // Alerts
  // ==========================================

  getAlerts(deviceId?: string, acknowledged?: boolean): WearableAlert[] {
    let alerts = this.alerts;
    
    if (deviceId) alerts = alerts.filter(a => a.deviceId === deviceId);
    if (acknowledged !== undefined) alerts = alerts.filter(a => a.acknowledged === acknowledged);
    
    return alerts.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date().toISOString();
      await this.saveState();
    }
  }

  // ==========================================
  // Statistics
  // ==========================================

  getStatistics(): {
    totalDevices: number;
    connectedDevices: number;
    totalDataPoints: number;
    alertsToday: number;
    platformBreakdown: Record<string, number>;
  } {
    const today = new Date().toISOString().split('T')[0];
    const platformBreakdown: Record<string, number> = {};
    
    this.devices.forEach(device => {
      platformBreakdown[device.platform] = (platformBreakdown[device.platform] || 0) + 1;
    });

    return {
      totalDevices: this.devices.size,
      connectedDevices: Array.from(this.devices.values()).filter(d => d.isConnected).length,
      totalDataPoints: this.healthData.length + this.sleepData.length + this.activityData.length,
      alertsToday: this.alerts.filter(a => a.timestamp.startsWith(today)).length,
      platformBreakdown,
    };
  }

  // ==========================================
  // Patient Data Aggregation
  // ==========================================

  getPatientHealthSummary(patientId: string, days: number = 7): {
    averageHeartRate: number;
    averageSleepMinutes: number;
    averageSteps: number;
    averageSpO2: number;
    alerts: WearableAlert[];
    devices: WearableDevice[];
  } {
    const devices = this.getDevicesByPatient(patientId);
    const deviceIds = devices.map(d => d.id);
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const heartRateData = this.healthData.filter(
      d => deviceIds.includes(d.deviceId) && d.dataType === 'heart_rate' && d.timestamp >= cutoffDate
    );
    const sleepRecords = this.sleepData.filter(
      d => deviceIds.includes(d.deviceId) && d.date >= cutoffDate.split('T')[0]
    );
    const stepsData = this.healthData.filter(
      d => deviceIds.includes(d.deviceId) && d.dataType === 'steps' && d.timestamp >= cutoffDate
    );
    const spO2Data = this.bloodOxygenReadings.filter(
      d => deviceIds.includes(d.deviceId) && d.timestamp >= cutoffDate
    );
    const alerts = this.alerts.filter(
      a => deviceIds.includes(a.deviceId) && a.timestamp >= cutoffDate
    );

    return {
      averageHeartRate: heartRateData.length > 0 
        ? Math.round(heartRateData.reduce((sum, d) => sum + d.value, 0) / heartRateData.length)
        : 0,
      averageSleepMinutes: sleepRecords.length > 0
        ? Math.round(sleepRecords.reduce((sum, d) => sum + d.totalMinutes, 0) / sleepRecords.length)
        : 0,
      averageSteps: stepsData.length > 0
        ? Math.round(stepsData.reduce((sum, d) => sum + d.value, 0) / stepsData.length)
        : 0,
      averageSpO2: spO2Data.length > 0
        ? Math.round(spO2Data.reduce((sum, d) => sum + d.spO2, 0) / spO2Data.length)
        : 0,
      alerts,
      devices,
    };
  }
}

export const wearableDevices = new WearableDeviceService();
