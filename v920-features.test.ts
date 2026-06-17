/**
 * v9.20 Feature Tests
 * - Wait Time Alert Subscriptions
 * - Multi-Floor Map Switching
 * - Visitor Pass History
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WaitAlertService } from '../wait-alert.service';
import { FloorMapService } from '../floor-map.service';
import { VisitorHistoryService } from '../visitor-history.service';

// ============================================================================
// WAIT ALERT SERVICE
// ============================================================================
describe('WaitAlertService', () => {
  beforeEach(() => {
    WaitAlertService.resetInstance();
  });

  it('should create singleton instance', () => {
    const s1 = WaitAlertService.getInstance();
    const s2 = WaitAlertService.getInstance();
    expect(s1).toBe(s2);
  });

  it('should subscribe to department wait time alerts', () => {
    const service = WaitAlertService.getInstance();
    const sub = service.subscribe('emergency', 'Emergency Dept', 15);
    expect(sub.departmentId).toBe('emergency');
    expect(sub.departmentName).toBe('Emergency Dept');
    expect(sub.thresholdMinutes).toBe(15);
    expect(sub.isActive).toBe(true);
    expect(sub.triggerCount).toBe(0);
  });

  it('should update threshold for existing subscription', () => {
    const service = WaitAlertService.getInstance();
    service.subscribe('emergency', 'Emergency Dept', 15);
    const updated = service.subscribe('emergency', 'Emergency Dept', 10);
    expect(updated.thresholdMinutes).toBe(10);
    expect(service.getAllSubscriptions().length).toBe(1);
  });

  it('should unsubscribe (deactivate) subscription', () => {
    const service = WaitAlertService.getInstance();
    const sub = service.subscribe('emergency', 'Emergency Dept', 15);
    service.unsubscribe(sub.id);
    const found = service.getSubscriptionForDepartment('emergency');
    expect(found?.isActive).toBe(false);
  });

  it('should reactivate subscription', () => {
    const service = WaitAlertService.getInstance();
    const sub = service.subscribe('emergency', 'Emergency Dept', 15);
    service.unsubscribe(sub.id);
    service.reactivate(sub.id);
    expect(service.getSubscriptionForDepartment('emergency')?.isActive).toBe(true);
  });

  it('should remove subscription entirely', () => {
    const service = WaitAlertService.getInstance();
    const sub = service.subscribe('emergency', 'Emergency Dept', 15);
    service.removeSubscription(sub.id);
    expect(service.getSubscriptionForDepartment('emergency')).toBeNull();
  });

  it('should get active subscriptions only', () => {
    const service = WaitAlertService.getInstance();
    const sub1 = service.subscribe('emergency', 'Emergency', 15);
    service.subscribe('pharmacy', 'Pharmacy', 10);
    service.unsubscribe(sub1.id);
    expect(service.getActiveSubscriptions().length).toBe(1);
    expect(service.getActiveSubscriptions()[0].departmentId).toBe('pharmacy');
  });

  it('should trigger alert when wait drops below threshold', () => {
    const service = WaitAlertService.getInstance();
    service.subscribe('emergency', 'Emergency', 15);

    // First check: wait is above threshold
    const waits1 = new Map([['emergency', 20]]);
    const triggered1 = service.checkWaitTimes(waits1);
    expect(triggered1.length).toBe(0);

    // Second check: wait drops below threshold
    const waits2 = new Map([['emergency', 10]]);
    const triggered2 = service.checkWaitTimes(waits2);
    expect(triggered2.length).toBe(1);
    expect(triggered2[0].actualWaitMinutes).toBe(10);
    expect(triggered2[0].departmentName).toBe('Emergency');
  });

  it('should not trigger if already below threshold', () => {
    const service = WaitAlertService.getInstance();
    service.subscribe('emergency', 'Emergency', 15);

    // Both checks below threshold - should only trigger on first crossing
    const waits1 = new Map([['emergency', 10]]);
    service.checkWaitTimes(waits1); // triggers (first check, no previous)

    const waits2 = new Map([['emergency', 8]]);
    const triggered = service.checkWaitTimes(waits2);
    expect(triggered.length).toBe(0); // already below, no crossing
  });

  it('should track alert history', () => {
    const service = WaitAlertService.getInstance();
    service.subscribe('emergency', 'Emergency', 15);

    const waits = new Map([['emergency', 10]]);
    service.checkWaitTimes(waits);

    const history = service.getAlertHistory();
    expect(history.length).toBe(1);
    expect(history[0].isRead).toBe(false);
  });

  it('should mark alerts as read', () => {
    const service = WaitAlertService.getInstance();
    service.subscribe('emergency', 'Emergency', 15);
    service.checkWaitTimes(new Map([['emergency', 10]]));

    const alerts = service.getAlertHistory();
    service.markAlertRead(alerts[0].id);
    expect(service.getUnreadCount()).toBe(0);
  });

  it('should mark all alerts as read', () => {
    const service = WaitAlertService.getInstance();
    service.subscribe('emergency', 'Emergency', 30);
    service.subscribe('pharmacy', 'Pharmacy', 30);
    service.checkWaitTimes(new Map([['emergency', 10], ['pharmacy', 5]]));

    service.markAllRead();
    expect(service.getUnreadCount()).toBe(0);
  });

  it('should provide threshold presets', () => {
    const service = WaitAlertService.getInstance();
    const presets = service.getThresholdPresets();
    expect(presets.length).toBeGreaterThan(0);
    expect(presets).toContain(15);
  });

  it('should format threshold text', () => {
    const service = WaitAlertService.getInstance();
    expect(service.formatThreshold(15)).toBe('Under 15 min');
    expect(service.formatThreshold(60)).toBe('Under 1 hr');
  });

  it('should provide subscription summary', () => {
    const service = WaitAlertService.getInstance();
    service.subscribe('emergency', 'Emergency', 15);
    service.subscribe('pharmacy', 'Pharmacy', 10);
    const summary = service.getSubscriptionSummary();
    expect(summary.total).toBe(2);
    expect(summary.active).toBe(2);
  });

  it('should notify on alert via callback', () => {
    const service = WaitAlertService.getInstance();
    let notified = false;
    service.onAlert(() => { notified = true; });
    service.subscribe('emergency', 'Emergency', 15);
    service.checkWaitTimes(new Map([['emergency', 10]]));
    expect(notified).toBe(true);
  });

  it('should notify on subscription change via callback', () => {
    const service = WaitAlertService.getInstance();
    let changed = false;
    service.onSubscriptionChange(() => { changed = true; });
    service.subscribe('emergency', 'Emergency', 15);
    expect(changed).toBe(true);
  });

  it('should clear alert history', () => {
    const service = WaitAlertService.getInstance();
    service.subscribe('emergency', 'Emergency', 15);
    service.checkWaitTimes(new Map([['emergency', 10]]));
    service.clearHistory();
    expect(service.getAlertHistory().length).toBe(0);
  });
});

// ============================================================================
// FLOOR MAP SERVICE
// ============================================================================
describe('FloorMapService', () => {
  beforeEach(() => {
    FloorMapService.resetInstance();
  });

  it('should create singleton instance', () => {
    const s1 = FloorMapService.getInstance();
    const s2 = FloorMapService.getInstance();
    expect(s1).toBe(s2);
  });

  it('should initialize with building data', () => {
    const service = FloorMapService.getInstance();
    service.initializeBuildings([
      { id: 'b1', name: 'Emergency', floor: 'Ground' },
      { id: 'b2', name: 'ICU', floor: 'Level 2' },
      { id: 'b3', name: 'Maternity', floor: 'Level 1' },
    ]);
    const floors = service.getFloors();
    expect(floors.length).toBeGreaterThan(0);
  });

  it('should default to all floors selected', () => {
    const service = FloorMapService.getInstance();
    expect(service.getCurrentFloor()).toBe('all');
  });

  it('should select a floor', () => {
    const service = FloorMapService.getInstance();
    service.initializeBuildings([
      { id: 'b1', name: 'Emergency', floor: 'Ground' },
    ]);
    service.selectFloor('ground');
    expect(service.getCurrentFloor()).toBe('ground');
  });

  it('should filter buildings by floor', () => {
    const service = FloorMapService.getInstance();
    service.initializeBuildings([
      { id: 'b1', name: 'Emergency', floor: 'Ground' },
      { id: 'b2', name: 'ICU', floor: 'Level 2' },
      { id: 'b3', name: 'Maternity', floor: 'Level 1' },
    ]);

    service.selectFloor('ground');
    const filtered = service.filterBuildingsByFloor([
      { id: 'b1' }, { id: 'b2' }, { id: 'b3' },
    ]);
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('b1');
  });

  it('should return all buildings when all floors selected', () => {
    const service = FloorMapService.getInstance();
    service.initializeBuildings([
      { id: 'b1', name: 'Emergency', floor: 'Ground' },
      { id: 'b2', name: 'ICU', floor: 'Level 2' },
    ]);

    service.selectFloor('all');
    const filtered = service.filterBuildingsByFloor([{ id: 'b1' }, { id: 'b2' }]);
    expect(filtered.length).toBe(2);
  });

  it('should get building floor', () => {
    const service = FloorMapService.getInstance();
    service.initializeBuildings([
      { id: 'b1', name: 'Emergency', floor: 'Ground' },
      { id: 'b2', name: 'ICU', floor: 'Level 2' },
    ]);
    expect(service.getBuildingFloor('b1')).toBe('ground');
    expect(service.getBuildingFloor('b2')).toBe('level2');
  });

  it('should get building count for floor', () => {
    const service = FloorMapService.getInstance();
    service.initializeBuildings([
      { id: 'b1', name: 'Emergency', floor: 'Ground' },
      { id: 'b2', name: 'Pharmacy', floor: 'Ground' },
      { id: 'b3', name: 'ICU', floor: 'Level 2' },
    ]);
    expect(service.getBuildingCountForFloor('ground')).toBe(2);
    expect(service.getBuildingCountForFloor('level2')).toBe(1);
    expect(service.getBuildingCountForFloor('all')).toBe(3);
  });

  it('should notify on floor change', () => {
    const service = FloorMapService.getInstance();
    service.initializeBuildings([{ id: 'b1', name: 'Emergency', floor: 'Ground' }]);
    let changedTo = '';
    service.onFloorChange(floorId => { changedTo = floorId; });
    service.selectFloor('ground');
    expect(changedTo).toBe('ground');
  });

  it('should not notify if same floor selected', () => {
    const service = FloorMapService.getInstance();
    let callCount = 0;
    service.onFloorChange(() => { callCount++; });
    service.selectFloor('all'); // already 'all'
    expect(callCount).toBe(0);
  });

  it('should get floor labels and colors', () => {
    const service = FloorMapService.getInstance();
    expect(service.getFloorLabel('ground')).toBe('Ground Floor');
    expect(service.getFloorColor('ground')).toBe('#22C55E');
    expect(service.getFloorColor('level1')).toBe('#3B82F6');
  });

  it('should get current floor level', () => {
    const service = FloorMapService.getInstance();
    service.initializeBuildings([{ id: 'b1', name: 'Emergency', floor: 'Ground' }]);
    service.selectFloor('ground');
    const level = service.getCurrentFloorLevel();
    expect(level?.id).toBe('ground');
    expect(level?.label).toBe('Ground Floor');
  });

  it('should get floors with buildings only', () => {
    const service = FloorMapService.getInstance();
    service.initializeBuildings([
      { id: 'b1', name: 'Emergency', floor: 'Ground' },
    ]);
    const floors = service.getFloorsWithBuildings();
    // Should include 'all' plus floors that have buildings
    expect(floors.some(f => f.id === 'all')).toBe(true);
    expect(floors.some(f => f.id === 'ground')).toBe(true);
  });
});

// ============================================================================
// VISITOR HISTORY SERVICE
// ============================================================================
describe('VisitorHistoryService', () => {
  beforeEach(() => {
    VisitorHistoryService.resetInstance();
  });

  it('should create singleton instance', () => {
    const s1 = VisitorHistoryService.getInstance();
    const s2 = VisitorHistoryService.getInstance();
    expect(s1).toBe(s2);
  });

  it('should add a visitor record', () => {
    const service = VisitorHistoryService.getInstance();
    const record = service.addRecord({
      visitorName: 'John Smith',
      purpose: 'patient_visit',
      purposeLabel: 'Patient Visit',
      destinationDepartment: 'Emergency',
      destinationFloor: 'Ground',
      patientName: 'Jane Smith',
      passNumber: 'MV-001',
      checkInTime: Date.now(),
      checkOutTime: null,
    });
    expect(record.id).toBeTruthy();
    expect(record.visitorName).toBe('John Smith');
    expect(record.isCompleted).toBe(false);
  });

  it('should get all records', () => {
    const service = VisitorHistoryService.getInstance();
    service.addRecord({
      visitorName: 'John', purpose: 'visit', purposeLabel: 'Visit',
      destinationDepartment: 'Emergency', destinationFloor: 'Ground',
      passNumber: 'MV-001', checkInTime: Date.now(), checkOutTime: null,
    });
    service.addRecord({
      visitorName: 'Jane', purpose: 'appointment', purposeLabel: 'Appointment',
      destinationDepartment: 'Pharmacy', destinationFloor: 'Ground',
      passNumber: 'MV-002', checkInTime: Date.now(), checkOutTime: null,
    });
    expect(service.getAllRecords().length).toBe(2);
  });

  it('should complete a visit', () => {
    const service = VisitorHistoryService.getInstance();
    const record = service.addRecord({
      visitorName: 'John', purpose: 'visit', purposeLabel: 'Visit',
      destinationDepartment: 'Emergency', destinationFloor: 'Ground',
      passNumber: 'MV-001', checkInTime: Date.now() - 3600000, checkOutTime: null,
    });
    const completed = service.completeVisit(record.id);
    expect(completed?.isCompleted).toBe(true);
    expect(completed?.visitDurationMinutes).toBeGreaterThan(0);
  });

  it('should get records by visitor name', () => {
    const service = VisitorHistoryService.getInstance();
    service.addRecord({
      visitorName: 'John Smith', purpose: 'visit', purposeLabel: 'Visit',
      destinationDepartment: 'Emergency', destinationFloor: 'Ground',
      passNumber: 'MV-001', checkInTime: Date.now(), checkOutTime: null,
    });
    service.addRecord({
      visitorName: 'John Smith', purpose: 'appointment', purposeLabel: 'Appointment',
      destinationDepartment: 'Pharmacy', destinationFloor: 'Ground',
      passNumber: 'MV-002', checkInTime: Date.now(), checkOutTime: null,
    });
    service.addRecord({
      visitorName: 'Jane Doe', purpose: 'visit', purposeLabel: 'Visit',
      destinationDepartment: 'ICU', destinationFloor: 'Level 2',
      passNumber: 'MV-003', checkInTime: Date.now(), checkOutTime: null,
    });
    const johns = service.getRecordsByVisitor('John Smith');
    expect(johns.length).toBe(2);
  });

  it('should get returning visitors', () => {
    const service = VisitorHistoryService.getInstance();
    service.addRecord({
      visitorName: 'John Smith', purpose: 'visit', purposeLabel: 'Visit',
      destinationDepartment: 'Emergency', destinationFloor: 'Ground',
      passNumber: 'MV-001', checkInTime: Date.now() - 86400000, checkOutTime: null,
    });
    service.addRecord({
      visitorName: 'John Smith', purpose: 'visit', purposeLabel: 'Visit',
      destinationDepartment: 'Emergency', destinationFloor: 'Ground',
      passNumber: 'MV-002', checkInTime: Date.now(), checkOutTime: null,
    });
    const returning = service.getReturningVisitors();
    expect(returning.length).toBe(1);
    expect(returning[0].visitCount).toBe(2);
    expect(returning[0].visitorName).toBe('John Smith');
  });

  it('should get frequent visitors with minimum visits', () => {
    const service = VisitorHistoryService.getInstance();
    // John has 2 visits
    service.addRecord({
      visitorName: 'John', purpose: 'visit', purposeLabel: 'Visit',
      destinationDepartment: 'Emergency', destinationFloor: 'Ground',
      passNumber: 'MV-001', checkInTime: Date.now(), checkOutTime: null,
    });
    service.addRecord({
      visitorName: 'John', purpose: 'visit', purposeLabel: 'Visit',
      destinationDepartment: 'Emergency', destinationFloor: 'Ground',
      passNumber: 'MV-002', checkInTime: Date.now(), checkOutTime: null,
    });
    // Jane has 1 visit
    service.addRecord({
      visitorName: 'Jane', purpose: 'visit', purposeLabel: 'Visit',
      destinationDepartment: 'ICU', destinationFloor: 'Level 2',
      passNumber: 'MV-003', checkInTime: Date.now(), checkOutTime: null,
    });
    const frequent = service.getFrequentVisitors(2);
    expect(frequent.length).toBe(1);
    expect(frequent[0].visitorName).toBe('John');
  });

  it('should provide quick check-in data', () => {
    const service = VisitorHistoryService.getInstance();
    service.addRecord({
      visitorName: 'John Smith', purpose: 'patient_visit', purposeLabel: 'Patient Visit',
      destinationDepartment: 'Emergency', destinationFloor: 'Ground',
      patientName: 'Jane Smith', passNumber: 'MV-001', checkInTime: Date.now(), checkOutTime: null,
    });
    const data = service.getQuickCheckInData('John Smith');
    expect(data).not.toBeNull();
    expect(data?.visitorName).toBe('John Smith');
    expect(data?.purpose).toBe('patient_visit');
    expect(data?.destinationDepartment).toBe('Emergency');
    expect(data?.patientName).toBe('Jane Smith');
    expect(data?.lastVisitFormatted).toBe('Today');
  });

  it('should search visitors', () => {
    const service = VisitorHistoryService.getInstance();
    service.addRecord({
      visitorName: 'John Smith', purpose: 'visit', purposeLabel: 'Visit',
      destinationDepartment: 'Emergency', destinationFloor: 'Ground',
      passNumber: 'MV-001', checkInTime: Date.now(), checkOutTime: null,
    });
    const results = service.searchVisitors('john');
    expect(results.length).toBe(1);
    expect(results[0].visitorName).toBe('John Smith');
  });

  it('should get statistics', () => {
    const service = VisitorHistoryService.getInstance();
    service.addRecord({
      visitorName: 'John', purpose: 'visit', purposeLabel: 'Visit',
      destinationDepartment: 'Emergency', destinationFloor: 'Ground',
      passNumber: 'MV-001', checkInTime: Date.now(), checkOutTime: null,
    });
    const stats = service.getStatistics();
    expect(stats.totalVisits).toBe(1);
    expect(stats.uniqueVisitors).toBe(1);
    expect(stats.todayVisits).toBe(1);
  });

  it('should clear history', () => {
    const service = VisitorHistoryService.getInstance();
    service.addRecord({
      visitorName: 'John', purpose: 'visit', purposeLabel: 'Visit',
      destinationDepartment: 'Emergency', destinationFloor: 'Ground',
      passNumber: 'MV-001', checkInTime: Date.now(), checkOutTime: null,
    });
    service.clearHistory();
    expect(service.getAllRecords().length).toBe(0);
  });

  it('should remove individual record', () => {
    const service = VisitorHistoryService.getInstance();
    const record = service.addRecord({
      visitorName: 'John', purpose: 'visit', purposeLabel: 'Visit',
      destinationDepartment: 'Emergency', destinationFloor: 'Ground',
      passNumber: 'MV-001', checkInTime: Date.now(), checkOutTime: null,
    });
    service.removeRecord(record.id);
    expect(service.getAllRecords().length).toBe(0);
  });

  it('should get recent records', () => {
    const service = VisitorHistoryService.getInstance();
    for (let i = 0; i < 15; i++) {
      service.addRecord({
        visitorName: `Visitor ${i}`, purpose: 'visit', purposeLabel: 'Visit',
        destinationDepartment: 'Emergency', destinationFloor: 'Ground',
        passNumber: `MV-${i}`, checkInTime: Date.now() + i, checkOutTime: null,
      });
    }
    const recent = service.getRecentRecords(5);
    expect(recent.length).toBe(5);
  });

  it('should notify on history change', () => {
    const service = VisitorHistoryService.getInstance();
    let notified = false;
    service.onHistoryChange(() => { notified = true; });
    service.addRecord({
      visitorName: 'John', purpose: 'visit', purposeLabel: 'Visit',
      destinationDepartment: 'Emergency', destinationFloor: 'Ground',
      passNumber: 'MV-001', checkInTime: Date.now(), checkOutTime: null,
    });
    expect(notified).toBe(true);
  });

  it('should get record by ID', () => {
    const service = VisitorHistoryService.getInstance();
    const record = service.addRecord({
      visitorName: 'John', purpose: 'visit', purposeLabel: 'Visit',
      destinationDepartment: 'Emergency', destinationFloor: 'Ground',
      passNumber: 'MV-001', checkInTime: Date.now(), checkOutTime: null,
    });
    const found = service.getRecordById(record.id);
    expect(found?.visitorName).toBe('John');
  });

  it('should return null for non-existent record', () => {
    const service = VisitorHistoryService.getInstance();
    expect(service.getRecordById('nonexistent')).toBeNull();
  });
});
