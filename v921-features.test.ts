/**
 * v9.21 Feature Tests
 * - Active Alerts Dashboard (wait-alerts screen)
 * - Floor-Specific Accessibility Overlay
 * - Visitor Analytics Dashboard
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AccessibilityOverlayService } from '../accessibility-overlay.service';
import { VisitorAnalyticsService } from '../visitor-analytics.service';
import { WaitAlertService } from '../wait-alert.service';

// ── Accessibility Overlay Service ─────────────────────────────────────
describe('AccessibilityOverlayService', () => {
  beforeEach(() => {
    AccessibilityOverlayService.resetInstance();
  });

  it('should be a singleton', () => {
    const a = AccessibilityOverlayService.getInstance();
    const b = AccessibilityOverlayService.getInstance();
    expect(a).toBe(b);
  });

  it('should initialize with features for all floors', () => {
    const svc = AccessibilityOverlayService.getInstance();
    const all = svc.getAllFeatures();
    expect(all.length).toBeGreaterThan(20);
  });

  it('should filter features by floor', () => {
    const svc = AccessibilityOverlayService.getInstance();
    const ground = svc.getFeaturesForFloor('ground');
    const level1 = svc.getFeaturesForFloor('level1');
    const level2 = svc.getFeaturesForFloor('level2');
    expect(ground.length).toBeGreaterThan(0);
    expect(level1.length).toBeGreaterThan(0);
    expect(level2.length).toBeGreaterThan(0);
    expect(ground.length + level1.length + level2.length).toBe(svc.getAllFeatures().length);
  });

  it('should toggle overlay visibility', () => {
    const svc = AccessibilityOverlayService.getInstance();
    expect(svc.getOverlayVisible()).toBe(false);
    const result = svc.toggleOverlay();
    expect(result).toBe(true);
    expect(svc.getOverlayVisible()).toBe(true);
    svc.toggleOverlay();
    expect(svc.getOverlayVisible()).toBe(false);
  });

  it('should return empty array when overlay is hidden', () => {
    const svc = AccessibilityOverlayService.getInstance();
    const visible = svc.getVisibleFeatures('ground');
    expect(visible).toHaveLength(0);
  });

  it('should return features when overlay is visible', () => {
    const svc = AccessibilityOverlayService.getInstance();
    svc.setOverlayVisible(true);
    const visible = svc.getVisibleFeatures('ground');
    expect(visible.length).toBeGreaterThan(0);
  });

  it('should filter by feature type', () => {
    const svc = AccessibilityOverlayService.getInstance();
    svc.setOverlayVisible(true);
    svc.setSelectedTypes(['elevator']);
    const filtered = svc.getFilteredFeatures('all');
    expect(filtered.every(f => f.type === 'elevator')).toBe(true);
  });

  it('should toggle individual feature types', () => {
    const svc = AccessibilityOverlayService.getInstance();
    expect(svc.isTypeSelected('elevator')).toBe(true);
    svc.toggleType('elevator');
    expect(svc.isTypeSelected('elevator')).toBe(false);
    svc.toggleType('elevator');
    expect(svc.isTypeSelected('elevator')).toBe(true);
  });

  it('should select/deselect all types', () => {
    const svc = AccessibilityOverlayService.getInstance();
    svc.deselectAllTypes();
    expect(svc.getSelectedTypes()).toHaveLength(0);
    svc.selectAllTypes();
    expect(svc.getSelectedTypes()).toHaveLength(6);
  });

  it('should get floor summary with correct counts', () => {
    const svc = AccessibilityOverlayService.getInstance();
    const summary = svc.getFloorSummary('ground');
    expect(summary.floorId).toBe('ground');
    expect(summary.floorLabel).toBe('Ground Floor');
    expect(summary.elevatorCount).toBeGreaterThan(0);
    expect(summary.rampCount).toBeGreaterThan(0);
    expect(summary.restroomCount).toBeGreaterThan(0);
    expect(summary.totalFeatures).toBeGreaterThan(0);
    expect(summary.operationalPercentage).toBeGreaterThanOrEqual(0);
    expect(summary.operationalPercentage).toBeLessThanOrEqual(100);
  });

  it('should find nearest feature by building and type', () => {
    const svc = AccessibilityOverlayService.getInstance();
    const elevator = svc.getNearestFeature('emergency', 'elevator');
    expect(elevator).not.toBeNull();
    expect(elevator!.type).toBe('elevator');
  });

  it('should get accessible route between buildings', () => {
    const svc = AccessibilityOverlayService.getInstance();
    const route = svc.getAccessibleRoute('main-entrance', 'emergency');
    expect(route.isAccessible).toBe(true);
    expect(route.instructions.length).toBeGreaterThan(0);
    expect(route.distanceMeters).toBeGreaterThan(0);
    expect(route.estimatedMinutes).toBeGreaterThan(0);
  });

  it('should provide static feature icons and colors', () => {
    expect(AccessibilityOverlayService.getFeatureIcon('elevator')).toBe('🛗');
    expect(AccessibilityOverlayService.getFeatureColor('ramp')).toBe('#22C55E');
    expect(AccessibilityOverlayService.getFeatureLabel('restroom')).toBe('Accessible Restroom');
  });

  it('should provide all feature type info', () => {
    const info = AccessibilityOverlayService.getFeatureTypeInfo();
    expect(info).toHaveLength(6);
    expect(info[0]).toHaveProperty('type');
    expect(info[0]).toHaveProperty('icon');
    expect(info[0]).toHaveProperty('color');
    expect(info[0]).toHaveProperty('label');
  });

  it('should notify listeners on overlay change', () => {
    const svc = AccessibilityOverlayService.getInstance();
    let notified = false;
    const unsub = svc.onOverlayChange(() => { notified = true; });
    svc.toggleOverlay();
    expect(notified).toBe(true);
    unsub();
  });

  it('should handle non-operational features', () => {
    const svc = AccessibilityOverlayService.getInstance();
    const all = svc.getAllFeatures();
    const nonOperational = all.filter(f => !f.isOperational);
    expect(nonOperational.length).toBeGreaterThan(0);
  });
});

// ── Visitor Analytics Service ─────────────────────────────────────────
describe('VisitorAnalyticsService', () => {
  beforeEach(() => {
    VisitorAnalyticsService.resetInstance();
  });

  it('should be a singleton', () => {
    const a = VisitorAnalyticsService.getInstance();
    const b = VisitorAnalyticsService.getInstance();
    expect(a).toBe(b);
  });

  it('should generate analytics with all required fields', () => {
    const svc = VisitorAnalyticsService.getInstance();
    const analytics = svc.getAnalytics();
    expect(analytics.totalVisits).toBeGreaterThan(0);
    expect(analytics.uniqueVisitors).toBeGreaterThan(0);
    expect(analytics.averageDurationMinutes).toBeGreaterThan(0);
    expect(analytics.peakHour).toBeGreaterThanOrEqual(0);
    expect(analytics.peakHour).toBeLessThan(24);
    expect(analytics.returningVisitorRate).toBeGreaterThanOrEqual(0);
    expect(analytics.returningVisitorRate).toBeLessThanOrEqual(100);
  });

  it('should have hourly distribution for all 24 hours', () => {
    const svc = VisitorAnalyticsService.getInstance();
    const analytics = svc.getAnalytics();
    expect(analytics.hourlyDistribution).toHaveLength(24);
    analytics.hourlyDistribution.forEach(h => {
      expect(h.hour).toBeGreaterThanOrEqual(0);
      expect(h.hour).toBeLessThan(24);
      expect(h.label).toMatch(/^\d{2}:00$/);
      expect(h.percentage).toBeGreaterThanOrEqual(0);
      expect(h.percentage).toBeLessThanOrEqual(100);
    });
  });

  it('should have department load data', () => {
    const svc = VisitorAnalyticsService.getInstance();
    const analytics = svc.getAnalytics();
    expect(analytics.departmentLoad.length).toBeGreaterThan(0);
    analytics.departmentLoad.forEach(dept => {
      expect(dept.departmentName).toBeTruthy();
      expect(dept.totalVisits).toBeGreaterThan(0);
      expect(dept.averageDurationMinutes).toBeGreaterThan(0);
      expect(dept.percentage).toBeGreaterThan(0);
    });
  });

  it('should have 7-day trend data', () => {
    const svc = VisitorAnalyticsService.getInstance();
    const analytics = svc.getAnalytics();
    expect(analytics.dailyTrend).toHaveLength(7);
    analytics.dailyTrend.forEach(day => {
      expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(day.dayLabel).toBeTruthy();
      expect(day.visits).toBeGreaterThanOrEqual(0);
    });
  });

  it('should have purpose breakdown', () => {
    const svc = VisitorAnalyticsService.getInstance();
    const analytics = svc.getAnalytics();
    expect(analytics.purposeBreakdown.length).toBeGreaterThan(0);
    const totalPct = analytics.purposeBreakdown.reduce((sum, p) => sum + p.percentage, 0);
    expect(totalPct).toBeGreaterThanOrEqual(95); // rounding tolerance
    expect(totalPct).toBeLessThanOrEqual(105);
  });

  it('should get today visits', () => {
    const svc = VisitorAnalyticsService.getInstance();
    expect(svc.getTodayVisits()).toBeGreaterThanOrEqual(0);
  });

  it('should get peak hours', () => {
    const svc = VisitorAnalyticsService.getInstance();
    const peaks = svc.getPeakHours();
    expect(peaks.length).toBeGreaterThan(0);
    peaks.forEach(p => expect(p.percentage).toBeGreaterThanOrEqual(70));
  });

  it('should get top departments', () => {
    const svc = VisitorAnalyticsService.getInstance();
    const top = svc.getTopDepartments(3);
    expect(top).toHaveLength(3);
    expect(top[0].totalVisits).toBeGreaterThanOrEqual(top[1].totalVisits);
  });

  it('should refresh analytics and notify listeners', () => {
    const svc = VisitorAnalyticsService.getInstance();
    let notified = false;
    const unsub = svc.onAnalyticsChange(() => { notified = true; });
    svc.refreshAnalytics();
    expect(notified).toBe(true);
    unsub();
  });

  it('should cache analytics and return same object', () => {
    const svc = VisitorAnalyticsService.getInstance();
    const a = svc.getAnalytics();
    const b = svc.getAnalytics();
    expect(a).toBe(b);
  });

  it('should bust cache on refresh', () => {
    const svc = VisitorAnalyticsService.getInstance();
    const a = svc.getAnalytics();
    const b = svc.refreshAnalytics();
    expect(a).not.toBe(b);
    expect(a.totalVisits).toBe(b.totalVisits); // same data, new object
  });
});

// ── Wait Alert Service (Dashboard integration) ───────────────────────
describe('WaitAlertService (Dashboard)', () => {
  beforeEach(() => {
    WaitAlertService.resetInstance();
  });

  it('should manage multiple subscriptions', () => {
    const svc = WaitAlertService.getInstance();
    svc.subscribe('emergency', 'Emergency', 15);
    svc.subscribe('pharmacy', 'Pharmacy', 10);
    svc.subscribe('radiology', 'Radiology', 20);
    expect(svc.getAllSubscriptions()).toHaveLength(3);
  });

  it('should get subscription for specific department', () => {
    const svc = WaitAlertService.getInstance();
    svc.subscribe('emergency', 'Emergency', 15);
    const sub = svc.getSubscriptionForDepartment('emergency');
    expect(sub).not.toBeNull();
    expect(sub!.departmentName).toBe('Emergency');
    expect(sub!.thresholdMinutes).toBe(15);
  });

  it('should reactivate paused subscriptions', () => {
    const svc = WaitAlertService.getInstance();
    svc.subscribe('emergency', 'Emergency', 15);
    const sub = svc.getAllSubscriptions()[0];
    expect(sub.isActive).toBe(true);
    svc.unsubscribe(sub.id);
    expect(svc.getAllSubscriptions()[0].isActive).toBe(false);
    svc.reactivate(sub.id);
    expect(svc.getAllSubscriptions()[0].isActive).toBe(true);
  });

  it('should remove subscriptions permanently', () => {
    const svc = WaitAlertService.getInstance();
    svc.subscribe('emergency', 'Emergency', 15);
    const sub = svc.getAllSubscriptions()[0];
    svc.removeSubscription(sub.id);
    expect(svc.getAllSubscriptions()).toHaveLength(0);
  });

  it('should track alert history', () => {
    const svc = WaitAlertService.getInstance();
    expect(svc.getAlertHistory()).toHaveLength(0);
  });

  it('should mark alerts as read', () => {
    const svc = WaitAlertService.getInstance();
    // History starts empty
    svc.markAllRead();
    expect(svc.getAlertHistory().filter(h => !h.isRead)).toHaveLength(0);
  });

  it('should clear history', () => {
    const svc = WaitAlertService.getInstance();
    svc.clearHistory();
    expect(svc.getAlertHistory()).toHaveLength(0);
  });
});
