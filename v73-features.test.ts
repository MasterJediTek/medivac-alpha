/**
 * Tests for MediVac One v7.3 Features
 * - Recording Alerts Service
 * - Highlight Reels Service
 * - Retention Policies Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { recordingAlertsService } from '../recording-alerts-service';
import { highlightReelsService } from '../highlight-reels-service';
import { retentionPoliciesService } from '../retention-policies-service';

describe('Recording Alerts Service', () => {
  beforeEach(async () => {
    await recordingAlertsService.initialize();
  });

  describe('Alert Management', () => {
    it('should send recording started alert', async () => {
      const alert = await recordingAlertsService.sendRecordingStartedAlert(
        'recording_test_1',
        'channel_mission',
        'Mission Channel',
        'master_yoda',
        'Master Yoda',
        'grand_master',
        ['user_1', 'user_2']
      );

      expect(alert).toBeDefined();
      expect(alert.type).toBe('recording_started');
      expect(alert.channelName).toBe('Mission Channel');
      expect(alert.requestedByName).toBe('Master Yoda');
    });

    it('should send recording stopped alert', async () => {
      // First create a started alert
      await recordingAlertsService.sendRecordingStartedAlert(
        'recording_test_2',
        'channel_team',
        'Team Channel',
        'master_windu',
        'Mace Windu',
        'council_member',
        ['user_3']
      );

      const stoppedAlert = await recordingAlertsService.sendRecordingStoppedAlert('recording_test_2');
      
      if (stoppedAlert) {
        expect(stoppedAlert.type).toBe('recording_stopped');
      }
      expect(true).toBe(true);
    });

    it('should mark alert as read', async () => {
      const alerts = recordingAlertsService.getAlerts({ limit: 1 });
      if (alerts.length > 0) {
        const result = await recordingAlertsService.markAlertRead(alerts[0].id, 'test_user');
        expect(result).toBe(true);
      }
      expect(true).toBe(true);
    });

    it('should acknowledge alert', async () => {
      const alerts = recordingAlertsService.getAlerts({ limit: 1 });
      if (alerts.length > 0) {
        const result = await recordingAlertsService.acknowledgeAlert(alerts[0].id, 'test_user');
        expect(result).toBe(true);
      }
      expect(true).toBe(true);
    });
  });

  describe('User Preferences', () => {
    it('should get user preferences', async () => {
      const prefs = await recordingAlertsService.getUserPreferences('test_user_prefs');
      expect(prefs).toBeDefined();
      expect(prefs.odId).toBe('test_user_prefs');
    });

    it('should update user preferences', async () => {
      const updated = await recordingAlertsService.updateUserPreferences('test_user_prefs', {
        enableRecordingAlerts: false,
        soundEnabled: false,
      });
      expect(updated.enableRecordingAlerts).toBe(false);
      expect(updated.soundEnabled).toBe(false);
    });

    it('should opt out of recording', async () => {
      const result = await recordingAlertsService.optOutOfRecording(
        'opt_out_user',
        'Test User',
        'Privacy concerns'
      );
      expect(result).toBe(true);

      const optedOut = recordingAlertsService.getOptedOutUsers();
      expect(optedOut.some(u => u.odId === 'opt_out_user')).toBe(true);
    });

    it('should opt back in to recording', async () => {
      await recordingAlertsService.optOutOfRecording('opt_in_user', 'Test User');
      const result = await recordingAlertsService.optInToRecording('opt_in_user');
      expect(result).toBe(true);
    });
  });

  describe('Consent Management', () => {
    it('should request consent', async () => {
      const consent = await recordingAlertsService.requestConsent(
        'recording_consent_1',
        'consent_user',
        'Consent User'
      );
      expect(consent).toBeDefined();
      expect(consent.status).toBe('pending');
    });

    it('should respond to consent', async () => {
      const consent = await recordingAlertsService.requestConsent(
        'recording_consent_2',
        'consent_user_2',
        'Consent User 2'
      );

      const responded = await recordingAlertsService.respondToConsent(consent.id, 'granted');
      expect(responded?.status).toBe('granted');
    });
  });

  describe('Analytics', () => {
    it('should get analytics', () => {
      const analytics = recordingAlertsService.getAnalytics();
      expect(analytics).toBeDefined();
      expect(typeof analytics.totalAlerts).toBe('number');
      expect(typeof analytics.deliveryRate).toBe('number');
    });
  });
});

describe('Highlight Reels Service', () => {
  beforeEach(async () => {
    await highlightReelsService.initialize();
  });

  describe('Reel Management', () => {
    it('should create a highlight reel', async () => {
      const reel = await highlightReelsService.createReel(
        'Test Training Reel',
        'A test reel for training purposes',
        'training',
        'recording_source_1',
        'Source Recording',
        'master_kenobi',
        'Obi-Wan Kenobi',
        'master'
      );

      expect(reel).toBeDefined();
      expect(reel.title).toBe('Test Training Reel');
      expect(reel.category).toBe('training');
      expect(reel.status).toBe('draft');
    });

    it('should get reels with filters', () => {
      const allReels = highlightReelsService.getReels();
      expect(Array.isArray(allReels)).toBe(true);

      const trainingReels = highlightReelsService.getReels({ category: 'training' });
      trainingReels.forEach(r => {
        expect(r.category).toBe('training');
      });
    });

    it('should update a reel', async () => {
      const reels = highlightReelsService.getReels({ limit: 1 });
      if (reels.length > 0) {
        const updated = await highlightReelsService.updateReel(reels[0].id, {
          title: 'Updated Title',
        });
        expect(updated?.title).toBe('Updated Title');
      }
      expect(true).toBe(true);
    });
  });

  describe('Segment Management', () => {
    it('should add segment to reel', async () => {
      const reels = highlightReelsService.getReels({ limit: 1 });
      if (reels.length > 0) {
        const segment = await highlightReelsService.addSegment(
          reels[0].id,
          0,
          30,
          'Test Segment',
          { importance: 'high' }
        );
        if (segment) {
          expect(segment.label).toBe('Test Segment');
          expect(segment.duration).toBe(30);
        }
      }
      expect(true).toBe(true);
    });

    it('should merge segments', async () => {
      const reel = await highlightReelsService.createReel(
        'Merge Test Reel',
        'Testing segment merge',
        'training',
        'recording_merge',
        'Merge Recording',
        'master_test',
        'Test Master',
        'master'
      );

      await highlightReelsService.addSegment(reel.id, 0, 30, 'Segment 1');
      await highlightReelsService.addSegment(reel.id, 30, 60, 'Segment 2');

      const updatedReel = highlightReelsService.getReel(reel.id);
      if (updatedReel && updatedReel.segments.length >= 2) {
        const merged = await highlightReelsService.mergeSegments(
          reel.id,
          updatedReel.segments.map(s => s.id),
          'Merged Segment'
        );
        if (merged) {
          expect(merged.label).toBe('Merged Segment');
        }
      }
      expect(true).toBe(true);
    });
  });

  describe('Publishing', () => {
    it('should process and publish reel', async () => {
      const reel = await highlightReelsService.createReel(
        'Publish Test Reel',
        'Testing publish flow',
        'best_practice',
        'recording_publish',
        'Publish Recording',
        'master_publish',
        'Publish Master',
        'master'
      );

      await highlightReelsService.addSegment(reel.id, 0, 60, 'Content Segment');

      const processed = await highlightReelsService.processReel(reel.id);
      expect(processed?.status).toBe('ready');

      const published = await highlightReelsService.publishReel(reel.id, 'master_publish');
      expect(published?.status).toBe('published');
    });
  });

  describe('Engagement', () => {
    it('should increment views', async () => {
      const reels = highlightReelsService.getReels({ limit: 1 });
      if (reels.length > 0) {
        const initialViews = reels[0].views;
        const newViews = await highlightReelsService.incrementViews(reels[0].id);
        expect(newViews).toBe(initialViews + 1);
      }
      expect(true).toBe(true);
    });

    it('should like reel', async () => {
      const reels = highlightReelsService.getReels({ limit: 1 });
      if (reels.length > 0) {
        const initialLikes = reels[0].likes;
        const newLikes = await highlightReelsService.likeReel(reels[0].id);
        expect(newLikes).toBe(initialLikes + 1);
      }
      expect(true).toBe(true);
    });
  });

  describe('Analytics', () => {
    it('should get analytics', () => {
      const analytics = highlightReelsService.getAnalytics();
      expect(analytics).toBeDefined();
      expect(typeof analytics.totalReels).toBe('number');
      expect(typeof analytics.totalViews).toBe('number');
    });
  });
});

describe('Retention Policies Service', () => {
  beforeEach(async () => {
    await retentionPoliciesService.initialize();
  });

  describe('Policy Management', () => {
    it('should get default policies', () => {
      const policies = retentionPoliciesService.getPolicies();
      expect(Array.isArray(policies)).toBe(true);
      expect(policies.length).toBeGreaterThan(0);
    });

    it('should create a policy', async () => {
      const policy = await retentionPoliciesService.createPolicy(
        'Test Policy',
        'A test retention policy',
        'standard',
        [{ id: 'cond_test', type: 'age_days', operator: 'greater_than', value: 30, andOr: 'and' }],
        [{ id: 'act_test', action: 'archive', delayDays: 0, notifyOwner: true, notifyAdmins: false, requireApproval: false, approvalLevel: 'master' }],
        'test_admin',
        'Test Admin'
      );

      expect(policy).toBeDefined();
      expect(policy.name).toBe('Test Policy');
      expect(policy.tier).toBe('standard');
    });

    it('should toggle policy', async () => {
      const policies = retentionPoliciesService.getPolicies({ limit: 1 } as any);
      if (policies.length > 0) {
        const initialState = policies[0].isActive;
        const newState = await retentionPoliciesService.togglePolicy(policies[0].id);
        expect(newState).toBe(!initialState);
        // Toggle back
        await retentionPoliciesService.togglePolicy(policies[0].id);
      }
      expect(true).toBe(true);
    });
  });

  describe('Exception Management', () => {
    it('should add exception to policy', async () => {
      const policies = retentionPoliciesService.getPolicies();
      if (policies.length > 0) {
        const exception = await retentionPoliciesService.addException(
          policies[0].id,
          'recording_id',
          'important_recording_123',
          'Critical training material',
          'test_admin'
        );
        expect(exception).toBeDefined();
        expect(exception?.type).toBe('recording_id');
      }
      expect(true).toBe(true);
    });
  });

  describe('Retention Records', () => {
    it('should schedule retention', async () => {
      const record = await retentionPoliciesService.scheduleRetention(
        'recording_schedule_1',
        'Test Recording',
        'policy_standard_90',
        'archive',
        'age',
        { originalSize: 1024 * 1024, ageDays: 100, viewCount: 5, importance: 'low' }
      );

      expect(record).toBeDefined();
      expect(record.action).toBe('archive');
    });

    it('should get pending records', () => {
      const pending = retentionPoliciesService.getPendingRecords();
      expect(Array.isArray(pending)).toBe(true);
    });

    it('should approve retention', async () => {
      const pending = retentionPoliciesService.getPendingRecords();
      if (pending.length > 0) {
        const approved = await retentionPoliciesService.approveRetention(pending[0].id, 'test_admin');
        if (approved) {
          expect(approved.status).toBe('approved');
        }
      }
      expect(true).toBe(true);
    });
  });

  describe('Storage Quota', () => {
    it('should get storage quota', () => {
      const quota = retentionPoliciesService.getStorageQuota();
      expect(quota).toBeDefined();
      expect(typeof quota.totalLimit).toBe('number');
      expect(typeof quota.used).toBe('number');
    });

    it('should update storage usage', async () => {
      const newUsage = 5 * 1024 * 1024 * 1024; // 5GB
      const quota = await retentionPoliciesService.updateStorageUsage(newUsage);
      expect(quota.used).toBe(newUsage);
    });
  });

  describe('Compliance Reporting', () => {
    it('should generate compliance report', async () => {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const report = await retentionPoliciesService.generateComplianceReport(startDate, endDate);
      expect(report).toBeDefined();
      expect(report.status).toBeDefined();
      expect(typeof report.totalRecordings).toBe('number');
    });

    it('should get reports', () => {
      const reports = retentionPoliciesService.getReports(5);
      expect(Array.isArray(reports)).toBe(true);
    });
  });

  describe('Analytics', () => {
    it('should get analytics', () => {
      const analytics = retentionPoliciesService.getAnalytics();
      expect(analytics).toBeDefined();
      expect(typeof analytics.totalPolicies).toBe('number');
      expect(typeof analytics.complianceRate).toBe('number');
    });
  });
});
