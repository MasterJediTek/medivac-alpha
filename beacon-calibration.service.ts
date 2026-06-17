/**
 * Beacon Calibration Service
 * Allows staff to fine-tune beacon positions and signal strengths
 * for improved indoor positioning accuracy
 */

export interface BeaconCalibrationData {
  beaconId: string;
  name: string;
  location: string;
  position: { x: number; y: number };
  signalStrength: number; // dBm at 1 meter
  txPower: number; // Transmission power
  pathLossExponent: number; // Environmental factor
  lastCalibrated: string;
  calibratedBy: string;
  status: 'active' | 'inactive' | 'maintenance';
  notes: string;
}

export interface CalibrationPoint {
  id: string;
  beaconId: string;
  measuredRssi: number;
  actualDistance: number;
  timestamp: string;
}

export interface CalibrationSession {
  id: string;
  beaconId: string;
  startTime: string;
  endTime?: string;
  points: CalibrationPoint[];
  status: 'in-progress' | 'completed' | 'cancelled';
  calibratedBy: string;
  notes: string;
}

type Listener = () => void;

class BeaconCalibrationService {
  private static instance: BeaconCalibrationService;
  private listeners: Set<Listener> = new Set();
  private beacons: Map<string, BeaconCalibrationData> = new Map();
  private sessions: Map<string, CalibrationSession> = new Map();
  private activeSession: CalibrationSession | null = null;

  private constructor() {
    this.initializeBeacons();
  }

  static getInstance(): BeaconCalibrationService {
    if (!BeaconCalibrationService.instance) {
      BeaconCalibrationService.instance = new BeaconCalibrationService();
    }
    return BeaconCalibrationService.instance;
  }

  private initializeBeacons(): void {
    const hospitalBeacons: BeaconCalibrationData[] = [
      {
        beaconId: 'BCN-001',
        name: 'Main Entrance',
        location: 'Main Building - Ground Floor',
        position: { x: 180, y: 280 },
        signalStrength: -59,
        txPower: -12,
        pathLossExponent: 2.0,
        lastCalibrated: '2026-01-15T10:30:00Z',
        calibratedBy: 'Admin',
        status: 'active',
        notes: 'Primary entrance beacon'
      },
      {
        beaconId: 'BCN-002',
        name: 'Emergency Department',
        location: 'Emergency Wing - Entry',
        position: { x: 80, y: 200 },
        signalStrength: -62,
        txPower: -12,
        pathLossExponent: 2.2,
        lastCalibrated: '2026-01-15T11:00:00Z',
        calibratedBy: 'Admin',
        status: 'active',
        notes: 'High traffic area - increased power'
      },
      {
        beaconId: 'BCN-003',
        name: 'Maternity Ward',
        location: 'Maternity Building - Lobby',
        position: { x: 280, y: 150 },
        signalStrength: -58,
        txPower: -12,
        pathLossExponent: 1.8,
        lastCalibrated: '2026-01-14T09:00:00Z',
        calibratedBy: 'Admin',
        status: 'active',
        notes: 'Quiet zone - reduced interference'
      },
      {
        beaconId: 'BCN-004',
        name: 'Radiology',
        location: 'Radiology Department - Reception',
        position: { x: 120, y: 320 },
        signalStrength: -65,
        txPower: -15,
        pathLossExponent: 2.5,
        lastCalibrated: '2026-01-13T14:30:00Z',
        calibratedBy: 'Admin',
        status: 'active',
        notes: 'Metal equipment interference - adjusted'
      },
      {
        beaconId: 'BCN-005',
        name: 'Pathology Lab',
        location: 'Pathology Building - Entry',
        position: { x: 320, y: 280 },
        signalStrength: -60,
        txPower: -12,
        pathLossExponent: 2.1,
        lastCalibrated: '2026-01-12T16:00:00Z',
        calibratedBy: 'Admin',
        status: 'active',
        notes: 'Standard calibration'
      },
      {
        beaconId: 'BCN-006',
        name: 'Pharmacy',
        location: 'Main Building - Pharmacy Wing',
        position: { x: 220, y: 350 },
        signalStrength: -58,
        txPower: -12,
        pathLossExponent: 1.9,
        lastCalibrated: '2026-01-11T10:00:00Z',
        calibratedBy: 'Admin',
        status: 'active',
        notes: 'Clear line of sight'
      },
      {
        beaconId: 'BCN-007',
        name: 'Mental Health',
        location: 'Maritana Street Building',
        position: { x: 50, y: 100 },
        signalStrength: -63,
        txPower: -12,
        pathLossExponent: 2.3,
        lastCalibrated: '2026-01-10T11:30:00Z',
        calibratedBy: 'Admin',
        status: 'active',
        notes: 'Separate building - isolated network'
      },
      {
        beaconId: 'BCN-008',
        name: 'Cafeteria',
        location: 'Main Building - Ground Floor',
        position: { x: 250, y: 220 },
        signalStrength: -61,
        txPower: -12,
        pathLossExponent: 2.0,
        lastCalibrated: '2026-01-09T13:00:00Z',
        calibratedBy: 'Admin',
        status: 'active',
        notes: 'High foot traffic area'
      },
      {
        beaconId: 'BCN-009',
        name: 'Physiotherapy Gym',
        location: 'Physio Building - Main Hall',
        position: { x: 350, y: 180 },
        signalStrength: -64,
        txPower: -15,
        pathLossExponent: 2.4,
        lastCalibrated: '2026-01-08T09:30:00Z',
        calibratedBy: 'Admin',
        status: 'active',
        notes: 'Large open space - extended range'
      },
      {
        beaconId: 'BCN-010',
        name: 'Administration',
        location: 'Admin Building - Reception',
        position: { x: 150, y: 120 },
        signalStrength: -57,
        txPower: -12,
        pathLossExponent: 1.7,
        lastCalibrated: '2026-01-07T15:00:00Z',
        calibratedBy: 'Admin',
        status: 'active',
        notes: 'Office environment - low interference'
      },
      {
        beaconId: 'BCN-011',
        name: 'Surgical Ward',
        location: 'Main Building - Level 1',
        position: { x: 200, y: 180 },
        signalStrength: -66,
        txPower: -18,
        pathLossExponent: 2.6,
        lastCalibrated: '2026-01-06T08:00:00Z',
        calibratedBy: 'Admin',
        status: 'active',
        notes: 'Restricted area - reduced power'
      },
      {
        beaconId: 'BCN-012',
        name: 'ICU',
        location: 'Main Building - Level 1',
        position: { x: 160, y: 160 },
        signalStrength: -68,
        txPower: -20,
        pathLossExponent: 2.8,
        lastCalibrated: '2026-01-05T07:30:00Z',
        calibratedBy: 'Admin',
        status: 'maintenance',
        notes: 'Critical care - minimal interference required'
      },
      {
        beaconId: 'BCN-013',
        name: 'Paediatrics',
        location: 'Paediatric Wing - Lobby',
        position: { x: 300, y: 100 },
        signalStrength: -59,
        txPower: -12,
        pathLossExponent: 2.0,
        lastCalibrated: '2026-01-04T10:00:00Z',
        calibratedBy: 'Admin',
        status: 'active',
        notes: 'Child-friendly zone'
      },
      {
        beaconId: 'BCN-014',
        name: 'Outpatients',
        location: 'Outpatient Clinic - Waiting Area',
        position: { x: 100, y: 280 },
        signalStrength: -60,
        txPower: -12,
        pathLossExponent: 2.1,
        lastCalibrated: '2026-01-03T14:00:00Z',
        calibratedBy: 'Admin',
        status: 'active',
        notes: 'High volume waiting area'
      },
      {
        beaconId: 'BCN-015',
        name: 'Chapel',
        location: 'Main Building - Ground Floor',
        position: { x: 280, y: 320 },
        signalStrength: -55,
        txPower: -10,
        pathLossExponent: 1.5,
        lastCalibrated: '2026-01-02T09:00:00Z',
        calibratedBy: 'Admin',
        status: 'active',
        notes: 'Quiet space - optimal conditions'
      },
      {
        beaconId: 'BCN-016',
        name: 'Parking Entrance',
        location: 'Car Park - Main Entry',
        position: { x: 180, y: 380 },
        signalStrength: -70,
        txPower: -12,
        pathLossExponent: 3.0,
        lastCalibrated: '2026-01-01T12:00:00Z',
        calibratedBy: 'Admin',
        status: 'inactive',
        notes: 'Outdoor beacon - weather protected'
      }
    ];

    hospitalBeacons.forEach(beacon => {
      this.beacons.set(beacon.beaconId, beacon);
    });
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Get all beacons
  getAllBeacons(): BeaconCalibrationData[] {
    return Array.from(this.beacons.values());
  }

  // Get beacon by ID
  getBeacon(beaconId: string): BeaconCalibrationData | undefined {
    return this.beacons.get(beaconId);
  }

  // Get beacons by status
  getBeaconsByStatus(status: BeaconCalibrationData['status']): BeaconCalibrationData[] {
    return this.getAllBeacons().filter(b => b.status === status);
  }

  // Update beacon position
  updateBeaconPosition(beaconId: string, position: { x: number; y: number }): void {
    const beacon = this.beacons.get(beaconId);
    if (beacon) {
      beacon.position = position;
      beacon.lastCalibrated = new Date().toISOString();
      this.notifyListeners();
    }
  }

  // Update beacon signal strength
  updateSignalStrength(beaconId: string, signalStrength: number): void {
    const beacon = this.beacons.get(beaconId);
    if (beacon) {
      beacon.signalStrength = Math.max(-100, Math.min(-30, signalStrength));
      beacon.lastCalibrated = new Date().toISOString();
      this.notifyListeners();
    }
  }

  // Update beacon transmission power
  updateTxPower(beaconId: string, txPower: number): void {
    const beacon = this.beacons.get(beaconId);
    if (beacon) {
      beacon.txPower = Math.max(-30, Math.min(0, txPower));
      beacon.lastCalibrated = new Date().toISOString();
      this.notifyListeners();
    }
  }

  // Update path loss exponent
  updatePathLossExponent(beaconId: string, exponent: number): void {
    const beacon = this.beacons.get(beaconId);
    if (beacon) {
      beacon.pathLossExponent = Math.max(1.0, Math.min(4.0, exponent));
      beacon.lastCalibrated = new Date().toISOString();
      this.notifyListeners();
    }
  }

  // Update beacon status
  updateBeaconStatus(beaconId: string, status: BeaconCalibrationData['status']): void {
    const beacon = this.beacons.get(beaconId);
    if (beacon) {
      beacon.status = status;
      this.notifyListeners();
    }
  }

  // Update beacon notes
  updateBeaconNotes(beaconId: string, notes: string): void {
    const beacon = this.beacons.get(beaconId);
    if (beacon) {
      beacon.notes = notes;
      this.notifyListeners();
    }
  }

  // Start calibration session
  startCalibrationSession(beaconId: string, calibratedBy: string): CalibrationSession {
    const session: CalibrationSession = {
      id: `CAL-${Date.now()}`,
      beaconId,
      startTime: new Date().toISOString(),
      points: [],
      status: 'in-progress',
      calibratedBy,
      notes: ''
    };

    this.sessions.set(session.id, session);
    this.activeSession = session;
    this.notifyListeners();
    return session;
  }

  // Add calibration point
  addCalibrationPoint(measuredRssi: number, actualDistance: number): CalibrationPoint | null {
    if (!this.activeSession) return null;

    const point: CalibrationPoint = {
      id: `PNT-${Date.now()}`,
      beaconId: this.activeSession.beaconId,
      measuredRssi,
      actualDistance,
      timestamp: new Date().toISOString()
    };

    this.activeSession.points.push(point);
    this.notifyListeners();
    return point;
  }

  // Complete calibration session
  completeCalibrationSession(notes: string = ''): void {
    if (!this.activeSession) return;

    this.activeSession.endTime = new Date().toISOString();
    this.activeSession.status = 'completed';
    this.activeSession.notes = notes;

    // Calculate optimal parameters from calibration points
    if (this.activeSession.points.length >= 3) {
      const optimalParams = this.calculateOptimalParameters(this.activeSession.points);
      const beacon = this.beacons.get(this.activeSession.beaconId);
      if (beacon) {
        beacon.signalStrength = optimalParams.signalStrength;
        beacon.pathLossExponent = optimalParams.pathLossExponent;
        beacon.lastCalibrated = new Date().toISOString();
        beacon.calibratedBy = this.activeSession.calibratedBy;
      }
    }

    this.activeSession = null;
    this.notifyListeners();
  }

  // Cancel calibration session
  cancelCalibrationSession(): void {
    if (!this.activeSession) return;

    this.activeSession.endTime = new Date().toISOString();
    this.activeSession.status = 'cancelled';
    this.activeSession = null;
    this.notifyListeners();
  }

  // Get active session
  getActiveSession(): CalibrationSession | null {
    return this.activeSession;
  }

  // Get all sessions
  getAllSessions(): CalibrationSession[] {
    return Array.from(this.sessions.values());
  }

  // Get sessions for beacon
  getSessionsForBeacon(beaconId: string): CalibrationSession[] {
    return this.getAllSessions().filter(s => s.beaconId === beaconId);
  }

  // Calculate optimal parameters from calibration points
  private calculateOptimalParameters(points: CalibrationPoint[]): { signalStrength: number; pathLossExponent: number } {
    // Use linear regression to find optimal path loss exponent
    // RSSI = TxPower - 10 * n * log10(d)
    // Where n is path loss exponent and d is distance

    const logDistances = points.map(p => Math.log10(p.actualDistance));
    const rssiValues = points.map(p => p.measuredRssi);

    // Calculate means
    const meanLogD = logDistances.reduce((a, b) => a + b, 0) / logDistances.length;
    const meanRssi = rssiValues.reduce((a, b) => a + b, 0) / rssiValues.length;

    // Calculate slope (path loss exponent * -10)
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < points.length; i++) {
      numerator += (logDistances[i] - meanLogD) * (rssiValues[i] - meanRssi);
      denominator += (logDistances[i] - meanLogD) ** 2;
    }

    const slope = denominator !== 0 ? numerator / denominator : -20;
    const pathLossExponent = Math.abs(slope / 10);

    // Calculate signal strength at 1 meter
    const signalStrength = meanRssi + 10 * pathLossExponent * meanLogD;

    return {
      signalStrength: Math.round(signalStrength),
      pathLossExponent: Math.round(pathLossExponent * 10) / 10
    };
  }

  // Estimate distance from RSSI
  estimateDistance(beaconId: string, rssi: number): number {
    const beacon = this.beacons.get(beaconId);
    if (!beacon) return -1;

    // Distance = 10 ^ ((TxPower - RSSI) / (10 * n))
    const ratio = (beacon.signalStrength - rssi) / (10 * beacon.pathLossExponent);
    return Math.pow(10, ratio);
  }

  // Get calibration accuracy score
  getCalibrationAccuracy(beaconId: string): number {
    const sessions = this.getSessionsForBeacon(beaconId).filter(s => s.status === 'completed');
    if (sessions.length === 0) return 0;

    const latestSession = sessions[sessions.length - 1];
    if (latestSession.points.length < 3) return 50;

    // Calculate average error
    const beacon = this.beacons.get(beaconId);
    if (!beacon) return 0;

    let totalError = 0;
    for (const point of latestSession.points) {
      const estimatedDistance = this.estimateDistance(beaconId, point.measuredRssi);
      const error = Math.abs(estimatedDistance - point.actualDistance) / point.actualDistance;
      totalError += error;
    }

    const avgError = totalError / latestSession.points.length;
    // Convert to accuracy percentage (0% error = 100% accuracy)
    return Math.max(0, Math.min(100, Math.round((1 - avgError) * 100)));
  }

  // Get overall system health
  getSystemHealth(): { active: number; inactive: number; maintenance: number; avgAccuracy: number } {
    const beacons = this.getAllBeacons();
    const active = beacons.filter(b => b.status === 'active').length;
    const inactive = beacons.filter(b => b.status === 'inactive').length;
    const maintenance = beacons.filter(b => b.status === 'maintenance').length;

    let totalAccuracy = 0;
    let count = 0;
    for (const beacon of beacons) {
      const accuracy = this.getCalibrationAccuracy(beacon.beaconId);
      if (accuracy > 0) {
        totalAccuracy += accuracy;
        count++;
      }
    }

    return {
      active,
      inactive,
      maintenance,
      avgAccuracy: count > 0 ? Math.round(totalAccuracy / count) : 75
    };
  }

  // Export calibration data
  exportCalibrationData(): string {
    const data = {
      exportDate: new Date().toISOString(),
      beacons: this.getAllBeacons(),
      sessions: this.getAllSessions()
    };
    return JSON.stringify(data, null, 2);
  }

  // Import calibration data
  importCalibrationData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.beacons && Array.isArray(data.beacons)) {
        data.beacons.forEach((beacon: BeaconCalibrationData) => {
          this.beacons.set(beacon.beaconId, beacon);
        });
      }
      if (data.sessions && Array.isArray(data.sessions)) {
        data.sessions.forEach((session: CalibrationSession) => {
          this.sessions.set(session.id, session);
        });
      }
      this.notifyListeners();
      return true;
    } catch {
      return false;
    }
  }
}

export const beaconCalibrationService = BeaconCalibrationService.getInstance();
