// Tests for MediVac WACHS v9.6 Features
import { describe, it, expect, beforeEach } from 'vitest';
import { patientOnboardingTutorialService } from '../patient-onboarding-tutorial-service';
import { familyMemberPortalService } from '../family-member-portal-service';
import { offlineModeService } from '../offline-mode-service';

describe('Patient Onboarding Tutorial Service', () => {
  beforeEach(() => {
    patientOnboardingTutorialService.reset();
  });

  it('should get all tutorial paths', () => {
    const paths = patientOnboardingTutorialService.getAllPaths();
    expect(paths).toBeDefined();
    expect(Array.isArray(paths)).toBe(true);
  });

  it('should start a tutorial', () => {
    const paths = patientOnboardingTutorialService.getAllPaths();
    if (paths.length > 0) {
      const progress = patientOnboardingTutorialService.startTutorial('user_1', paths[0].id, 'patient');
      expect(progress).toBeDefined();
      expect(progress?.userId).toBe('user_1');
      expect(progress?.status).toBe('in_progress');
    }
  });

  it('should complete a step', () => {
    const paths = patientOnboardingTutorialService.getAllPaths();
    if (paths.length > 0) {
      const progress = patientOnboardingTutorialService.startTutorial('user_1', paths[0].id, 'patient');
      if (progress) {
        const updated = patientOnboardingTutorialService.completeStep(progress.id);
        expect(updated).toBeDefined();
        expect(updated?.completedSteps.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('should get achievements', () => {
    const achievements = patientOnboardingTutorialService.getAchievements();
    expect(achievements).toBeDefined();
    expect(Array.isArray(achievements)).toBe(true);
  });

  it('should get analytics', () => {
    const analytics = patientOnboardingTutorialService.getAnalytics();
    expect(analytics).toBeDefined();
    expect(typeof analytics.totalUsers).toBe('number');
    expect(typeof analytics.completionRate).toBe('number');
  });
});

describe('Family Member Portal Service', () => {
  beforeEach(() => {
    familyMemberPortalService.reset();
  });

  it('should get family members', () => {
    const members = familyMemberPortalService.getPatientFamilyMembers('patient_1');
    expect(members).toBeDefined();
    expect(Array.isArray(members)).toBe(true);
  });

  it('should create an invite', () => {
    const invite = familyMemberPortalService.createInvite('patient_1', 'John Doe', 'family@example.com', 'spouse', 'view');
    expect(invite).toBeDefined();
    expect(invite?.inviteeEmail).toBe('family@example.com');
    expect(invite?.status).toBe('pending');
  });

  it('should get pending invites', () => {
    familyMemberPortalService.createInvite('patient_1', 'John Doe', 'test@example.com', 'parent', 'view');
    const invites = familyMemberPortalService.getPendingInvites('patient_1');
    expect(invites).toBeDefined();
    expect(invites.length).toBeGreaterThanOrEqual(1);
  });

  it('should get health summary', () => {
    const summary = familyMemberPortalService.getHealthSummary('patient_1');
    expect(summary).toBeDefined();
    expect(summary?.patientId).toBe('patient_1');
  });

  it('should get activity log', () => {
    const activities = familyMemberPortalService.getActivityLogs('patient_1');
    expect(activities).toBeDefined();
    expect(Array.isArray(activities)).toBe(true);
  });
});

describe('Offline Mode Service', () => {
  beforeEach(() => {
    offlineModeService.reset();
  });

  it('should get connection status', () => {
    const status = offlineModeService.getConnectionStatus();
    expect(status).toBeDefined();
    expect(['online', 'offline', 'slow', 'unstable']).toContain(status);
  });

  it('should set connection status', () => {
    offlineModeService.setConnectionStatus('offline');
    expect(offlineModeService.getConnectionStatus()).toBe('offline');
    expect(offlineModeService.isOffline()).toBe(true);
  });

  it('should cache data', () => {
    const cached = offlineModeService.cacheData('medications', 'med_1', { name: 'Test Med' });
    expect(cached).toBeDefined();
    expect(cached?.category).toBe('medications');
    expect(cached?.key).toBe('med_1');
  });

  it('should retrieve cached data', () => {
    offlineModeService.cacheData('appointments', 'apt_1', { date: '2026-02-10' });
    const data = offlineModeService.getCachedData('appointments', 'apt_1');
    expect(data).toBeDefined();
    expect((data as any).date).toBe('2026-02-10');
  });

  it('should get storage quota', () => {
    const quota = offlineModeService.getStorageQuota();
    expect(quota).toBeDefined();
    expect(typeof quota.used).toBe('number');
    expect(typeof quota.total).toBe('number');
    expect(typeof quota.percentage).toBe('number');
  });

  it('should queue sync actions', () => {
    const item = offlineModeService.queueAction('medications', 'update', { id: 'med_1' }, 'high');
    expect(item).toBeDefined();
    expect(item.category).toBe('medications');
    expect(item.action).toBe('update');
    expect(item.priority).toBe('high');
  });

  it('should get sync queue', () => {
    offlineModeService.queueAction('settings', 'update', { theme: 'dark' });
    const queue = offlineModeService.getSyncQueue();
    expect(queue).toBeDefined();
    expect(queue.length).toBeGreaterThanOrEqual(1);
  });

  it('should get all capabilities', () => {
    const capabilities = offlineModeService.getAllCapabilities();
    expect(capabilities).toBeDefined();
    expect(capabilities.length).toBeGreaterThan(0);
  });

  it('should get analytics', () => {
    const analytics = offlineModeService.getAnalytics();
    expect(analytics).toBeDefined();
    expect(typeof analytics.totalCachedItems).toBe('number');
    expect(typeof analytics.syncSuccessRate).toBe('number');
  });
});
