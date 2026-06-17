/**
 * v9.19 Feature Tests
 * - Real-Time Department Wait Times
 * - Indoor Turn-by-Turn Walking Animation
 * - Visitor Check-In Kiosk Mode
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ============================================================================
// WAIT TIME SERVICE TESTS
// ============================================================================
describe('WaitTimeService', () => {
  let WaitTimeService: any;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../wait-time.service');
    WaitTimeService = mod.WaitTimeService;
    WaitTimeService.resetInstance();
  });

  afterEach(() => {
    WaitTimeService.resetInstance();
  });

  it('should create singleton instance', () => {
    const a = WaitTimeService.getInstance();
    const b = WaitTimeService.getInstance();
    expect(a).toBe(b);
  });

  it('should refresh all department wait times', () => {
    const service = WaitTimeService.getInstance();
    const times = service.refreshAll();
    expect(times.length).toBeGreaterThan(0);
    expect(times.length).toBe(12); // 12 departments
  });

  it('should return wait time with correct structure', () => {
    const service = WaitTimeService.getInstance();
    const times = service.refreshAll();
    const wt = times[0];
    expect(wt).toHaveProperty('departmentId');
    expect(wt).toHaveProperty('waitMinutes');
    expect(wt).toHaveProperty('urgencyLevel');
    expect(wt).toHaveProperty('urgencyColor');
    expect(wt).toHaveProperty('trend');
    expect(wt).toHaveProperty('trendIcon');
    expect(wt).toHaveProperty('lastUpdated');
    expect(wt).toHaveProperty('patientsWaiting');
    expect(wt).toHaveProperty('label');
  });

  it('should assign correct urgency levels', () => {
    const service = WaitTimeService.getInstance();
    const times = service.refreshAll();
    times.forEach((wt: any) => {
      expect(['low', 'moderate', 'high', 'critical']).toContain(wt.urgencyLevel);
    });
  });

  it('should assign correct urgency colors', () => {
    const service = WaitTimeService.getInstance();
    const times = service.refreshAll();
    times.forEach((wt: any) => {
      expect(['#22C55E', '#F59E0B', '#F97316', '#EF4444']).toContain(wt.urgencyColor);
    });
  });

  it('should get wait time for specific department', () => {
    const service = WaitTimeService.getInstance();
    const wt = service.getWaitTime('emergency');
    expect(wt).not.toBeNull();
    expect(wt!.departmentId).toBe('emergency');
    expect(wt!.waitMinutes).toBeGreaterThanOrEqual(0);
  });

  it('should return null-like for unknown department', () => {
    const service = WaitTimeService.getInstance();
    const wt = service.getWaitTime('nonexistent');
    expect(wt).not.toBeNull();
    expect(wt!.waitMinutes).toBe(0);
  });

  it('should get all wait times', () => {
    const service = WaitTimeService.getInstance();
    const times = service.getAllWaitTimes();
    expect(times.length).toBe(12);
  });

  it('should get urgency summary', () => {
    const service = WaitTimeService.getInstance();
    service.refreshAll();
    const summary = service.getUrgencySummary();
    expect(summary).toHaveProperty('low');
    expect(summary).toHaveProperty('moderate');
    expect(summary).toHaveProperty('high');
    expect(summary).toHaveProperty('critical');
    expect(summary.low + summary.moderate + summary.high + summary.critical).toBe(12);
  });

  it('should get longest wait', () => {
    const service = WaitTimeService.getInstance();
    service.refreshAll();
    const longest = service.getLongestWait();
    expect(longest).not.toBeNull();
    const all = service.getAllWaitTimes();
    const maxWait = Math.max(...all.map((t: any) => t.waitMinutes));
    expect(longest!.waitMinutes).toBe(maxWait);
  });

  it('should get shortest wait', () => {
    const service = WaitTimeService.getInstance();
    service.refreshAll();
    const shortest = service.getShortestWait();
    expect(shortest).not.toBeNull();
    const all = service.getAllWaitTimes();
    const minWait = Math.min(...all.map((t: any) => t.waitMinutes));
    expect(shortest!.waitMinutes).toBe(minWait);
  });

  it('should subscribe to updates', () => {
    const service = WaitTimeService.getInstance();
    let received: any[] = [];
    const unsub = service.subscribe((times: any[]) => {
      received = times;
    });
    service.refreshAll();
    expect(received.length).toBe(12);
    unsub();
  });

  it('should generate valid labels', () => {
    const service = WaitTimeService.getInstance();
    const times = service.refreshAll();
    times.forEach((wt: any) => {
      if (wt.waitMinutes === 0) {
        expect(wt.label).toBe('No wait');
      } else {
        expect(wt.label).toMatch(/^\d+ min$/);
      }
    });
  });

  it('should track trend direction', () => {
    const service = WaitTimeService.getInstance();
    // Refresh multiple times to build history
    service.refreshAll();
    service.refreshAll();
    service.refreshAll();
    const times = service.refreshAll();
    times.forEach((wt: any) => {
      expect(['increasing', 'decreasing', 'stable']).toContain(wt.trend);
      expect(['↑', '↓', '→']).toContain(wt.trendIcon);
    });
  });

  it('should start and stop auto refresh', () => {
    vi.useFakeTimers();
    const service = WaitTimeService.getInstance();
    let callCount = 0;
    service.subscribe(() => { callCount++; });
    service.startAutoRefresh(1000);
    expect(callCount).toBe(1); // Initial refresh
    vi.advanceTimersByTime(3000);
    expect(callCount).toBe(4); // Initial + 3 intervals
    service.stopAutoRefresh();
    vi.advanceTimersByTime(3000);
    expect(callCount).toBe(4); // No more updates
    vi.useRealTimers();
  });
});

// ============================================================================
// PATH ANIMATION SERVICE TESTS
// ============================================================================
describe('PathAnimationService', () => {
  let PathAnimationService: any;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../path-animation.service');
    PathAnimationService = mod.PathAnimationService;
    PathAnimationService.resetInstance();
  });

  afterEach(() => {
    PathAnimationService.resetInstance();
  });

  it('should create singleton instance', () => {
    const a = PathAnimationService.getInstance();
    const b = PathAnimationService.getInstance();
    expect(a).toBe(b);
  });

  it('should build route with correct steps', () => {
    const service = PathAnimationService.getInstance();
    const steps = service.buildRoute('emergency', 'Emergency Dept', { x: 18, y: 42 }, 'Ground');
    expect(steps.length).toBeGreaterThanOrEqual(3);
    expect(steps[0].instruction).toContain('Enter');
    expect(steps[steps.length - 1].instruction).toContain('arrived');
  });

  it('should include elevator step for non-ground floors', () => {
    const service = PathAnimationService.getInstance();
    const steps = service.buildRoute('maternity', 'Maternity Ward', { x: 62, y: 28 }, 'Level 1');
    const elevatorStep = steps.find((s: any) => s.instruction.includes('elevator'));
    expect(elevatorStep).toBeDefined();
  });

  it('should not include elevator for ground floor', () => {
    const service = PathAnimationService.getInstance();
    const steps = service.buildRoute('pharmacy', 'Pharmacy', { x: 55, y: 55 }, 'Ground');
    const elevatorStep = steps.find((s: any) => s.instruction.includes('elevator'));
    expect(elevatorStep).toBeUndefined();
  });

  it('should generate left direction for left-side buildings', () => {
    const service = PathAnimationService.getInstance();
    const steps = service.buildRoute('emergency', 'Emergency', { x: 18, y: 42 }, 'Ground');
    const leftStep = steps.find((s: any) => s.instruction.includes('left'));
    expect(leftStep).toBeDefined();
  });

  it('should generate right direction for right-side buildings', () => {
    const service = PathAnimationService.getInstance();
    const steps = service.buildRoute('physio', 'Physiotherapy', { x: 78, y: 55 }, 'Ground');
    const rightStep = steps.find((s: any) => s.instruction.includes('right'));
    expect(rightStep).toBeDefined();
  });

  it('should start navigation', () => {
    const service = PathAnimationService.getInstance();
    service.startNavigation('emergency', 'Emergency', { x: 18, y: 42 }, 'Ground');
    const state = service.getState();
    expect(state.isActive).toBe(true);
    expect(state.isPaused).toBe(false);
    expect(state.destinationId).toBe('emergency');
    expect(state.destinationName).toBe('Emergency');
    expect(state.progress).toBe(0);
  });

  it('should pause and resume navigation', () => {
    const service = PathAnimationService.getInstance();
    service.startNavigation('emergency', 'Emergency', { x: 18, y: 42 }, 'Ground');
    service.pauseNavigation();
    expect(service.getState().isPaused).toBe(true);
    service.resumeNavigation();
    expect(service.getState().isPaused).toBe(false);
  });

  it('should cancel navigation', () => {
    const service = PathAnimationService.getInstance();
    service.startNavigation('emergency', 'Emergency', { x: 18, y: 42 }, 'Ground');
    service.cancelNavigation();
    const state = service.getState();
    expect(state.isActive).toBe(false);
    expect(state.destinationId).toBe('');
  });

  it('should subscribe to navigation updates', () => {
    const service = PathAnimationService.getInstance();
    let received: any = null;
    const unsub = service.subscribe((state: any) => {
      received = state;
    });
    service.startNavigation('emergency', 'Emergency', { x: 18, y: 42 }, 'Ground');
    expect(received).not.toBeNull();
    expect(received.isActive).toBe(true);
    unsub();
  });

  it('should have correct initial position at main entrance', () => {
    const service = PathAnimationService.getInstance();
    service.startNavigation('emergency', 'Emergency', { x: 18, y: 42 }, 'Ground');
    const state = service.getState();
    expect(state.currentPosition.x).toBe(50);
    expect(state.currentPosition.y).toBe(85);
  });

  it('should return steps after starting navigation', () => {
    const service = PathAnimationService.getInstance();
    service.startNavigation('emergency', 'Emergency', { x: 18, y: 42 }, 'Ground');
    const steps = service.getSteps();
    expect(steps.length).toBeGreaterThan(0);
  });

  it('should calculate distance remaining', () => {
    const service = PathAnimationService.getInstance();
    service.startNavigation('emergency', 'Emergency', { x: 18, y: 42 }, 'Ground');
    const state = service.getState();
    expect(state.distanceRemaining).toBeGreaterThan(0);
    expect(state.etaSeconds).toBeGreaterThan(0);
  });
});

// ============================================================================
// VISITOR CHECK-IN SERVICE TESTS
// ============================================================================
describe('VisitorCheckInService', () => {
  let VisitorCheckInService: any;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../visitor-checkin.service');
    VisitorCheckInService = mod.VisitorCheckInService;
    VisitorCheckInService.resetInstance();
  });

  afterEach(() => {
    VisitorCheckInService.resetInstance();
  });

  it('should create singleton instance', () => {
    const a = VisitorCheckInService.getInstance();
    const b = VisitorCheckInService.getInstance();
    expect(a).toBe(b);
  });

  it('should check in a visitor', () => {
    const service = VisitorCheckInService.getInstance();
    const pass = service.checkIn({
      visitorName: 'John Smith',
      purpose: 'visit_patient',
      destinationDepartment: 'maternity',
      patientName: 'Jane Smith',
    });
    expect(pass).toBeDefined();
    expect(pass.visitorName).toBe('John Smith');
    expect(pass.purpose).toBe('Visiting a Patient');
    expect(pass.destinationDepartment).toBe('maternity');
    expect(pass.patientName).toBe('Jane Smith');
    expect(pass.isActive).toBe(true);
    expect(pass.passNumber).toMatch(/^MV-\d{8}-\d{4}$/);
  });

  it('should generate unique pass numbers', () => {
    const service = VisitorCheckInService.getInstance();
    const pass1 = service.checkIn({
      visitorName: 'Visitor 1',
      purpose: 'appointment',
      destinationDepartment: 'radiology',
    });
    const pass2 = service.checkIn({
      visitorName: 'Visitor 2',
      purpose: 'delivery',
      destinationDepartment: 'pharmacy',
    });
    expect(pass1.passNumber).not.toBe(pass2.passNumber);
  });

  it('should generate QR code data', () => {
    const service = VisitorCheckInService.getInstance();
    const pass = service.checkIn({
      visitorName: 'Test Visitor',
      purpose: 'appointment',
      destinationDepartment: 'emergency',
    });
    expect(pass.qrCode).toBeTruthy();
    const qrData = JSON.parse(pass.qrCode);
    expect(qrData.type).toBe('medivac_visitor_pass');
    expect(qrData.visitor).toBe('Test Visitor');
  });

  it('should set correct expiry (8 hours)', () => {
    const service = VisitorCheckInService.getInstance();
    const before = Date.now();
    const pass = service.checkIn({
      visitorName: 'Test',
      purpose: 'other',
      destinationDepartment: 'cafeteria',
    });
    const expectedExpiry = before + 8 * 60 * 60 * 1000;
    expect(pass.expiresAt).toBeGreaterThanOrEqual(expectedExpiry - 1000);
    expect(pass.expiresAt).toBeLessThanOrEqual(expectedExpiry + 1000);
  });

  it('should provide directions for departments', () => {
    const service = VisitorCheckInService.getInstance();
    const dirs = service.getDirections('emergency');
    expect(dirs.length).toBeGreaterThan(0);
    expect(dirs[0]).toContain('lobby');
  });

  it('should provide fallback directions for unknown department', () => {
    const service = VisitorCheckInService.getInstance();
    const dirs = service.getDirections('unknown-dept');
    expect(dirs.length).toBeGreaterThan(0);
    expect(dirs[0]).toContain('information desk');
  });

  it('should check out a visitor', () => {
    const service = VisitorCheckInService.getInstance();
    const pass = service.checkIn({
      visitorName: 'Checkout Test',
      purpose: 'appointment',
      destinationDepartment: 'radiology',
    });
    const result = service.checkOut(pass.id);
    expect(result).toBe(true);
  });

  it('should return false for invalid checkout', () => {
    const service = VisitorCheckInService.getInstance();
    const result = service.checkOut('nonexistent-id');
    expect(result).toBe(false);
  });

  it('should get today visitors', () => {
    const service = VisitorCheckInService.getInstance();
    service.checkIn({
      visitorName: 'Today Visitor',
      purpose: 'appointment',
      destinationDepartment: 'pharmacy',
    });
    const today = service.getTodayVisitors();
    expect(today.length).toBe(1);
    expect(today[0].visitorName).toBe('Today Visitor');
  });

  it('should get active visitor count', () => {
    const service = VisitorCheckInService.getInstance();
    service.checkIn({ visitorName: 'V1', purpose: 'other', destinationDepartment: 'cafeteria' });
    service.checkIn({ visitorName: 'V2', purpose: 'other', destinationDepartment: 'pharmacy' });
    expect(service.getActiveVisitorCount()).toBe(2);
  });

  it('should validate form - missing name', () => {
    const service = VisitorCheckInService.getInstance();
    const result = service.validateForm({ purpose: 'appointment', destinationDepartment: 'radiology' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Please enter your full name');
  });

  it('should validate form - missing purpose', () => {
    const service = VisitorCheckInService.getInstance();
    const result = service.validateForm({ visitorName: 'Test', destinationDepartment: 'radiology' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Please select a purpose of visit');
  });

  it('should validate form - missing destination', () => {
    const service = VisitorCheckInService.getInstance();
    const result = service.validateForm({ visitorName: 'Test', purpose: 'appointment' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Please select a destination department');
  });

  it('should validate form - patient name required for visit_patient', () => {
    const service = VisitorCheckInService.getInstance();
    const result = service.validateForm({
      visitorName: 'Test',
      purpose: 'visit_patient',
      destinationDepartment: 'maternity',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Please enter the patient name');
  });

  it('should validate form - valid data', () => {
    const service = VisitorCheckInService.getInstance();
    const result = service.validateForm({
      visitorName: 'Test Visitor',
      purpose: 'appointment',
      destinationDepartment: 'radiology',
    });
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('should get purpose label', () => {
    const service = VisitorCheckInService.getInstance();
    expect(service.getPurposeLabel('visit_patient')).toBe('Visiting a Patient');
    expect(service.getPurposeLabel('appointment')).toBe('Medical Appointment');
    expect(service.getPurposeLabel('delivery')).toBe('Delivery / Courier');
    expect(service.getPurposeLabel('contractor')).toBe('Contractor / Maintenance');
    expect(service.getPurposeLabel('other')).toBe('Other');
  });

  it('should get available purposes', () => {
    const service = VisitorCheckInService.getInstance();
    const purposes = service.getAvailablePurposes();
    expect(purposes.length).toBe(5);
    expect(purposes[0]).toHaveProperty('value');
    expect(purposes[0]).toHaveProperty('label');
  });

  it('should manage kiosk state', () => {
    const service = VisitorCheckInService.getInstance();
    expect(service.getKioskState()).toBe('idle');
    service.setKioskState('form');
    expect(service.getKioskState()).toBe('form');
    service.setKioskState('confirming');
    expect(service.getKioskState()).toBe('confirming');
    service.resetToIdle();
    expect(service.getKioskState()).toBe('idle');
  });

  it('should subscribe to kiosk state changes', () => {
    const service = VisitorCheckInService.getInstance();
    let received: string = '';
    const unsub = service.subscribe((state: string) => {
      received = state;
    });
    service.setKioskState('form');
    expect(received).toBe('form');
    unsub();
  });

  it('should include directions in visitor pass', () => {
    const service = VisitorCheckInService.getInstance();
    const pass = service.checkIn({
      visitorName: 'Dir Test',
      purpose: 'appointment',
      destinationDepartment: 'maternity',
    });
    expect(pass.directions.length).toBeGreaterThan(0);
  });

  it('should set correct floor for departments', () => {
    const service = VisitorCheckInService.getInstance();
    const pass1 = service.checkIn({ visitorName: 'T1', purpose: 'other', destinationDepartment: 'emergency' });
    expect(pass1.destinationFloor).toBe('Ground');
    const pass2 = service.checkIn({ visitorName: 'T2', purpose: 'other', destinationDepartment: 'maternity' });
    expect(pass2.destinationFloor).toBe('Level 1');
    const pass3 = service.checkIn({ visitorName: 'T3', purpose: 'other', destinationDepartment: 'surgical' });
    expect(pass3.destinationFloor).toBe('Level 2');
  });
});
