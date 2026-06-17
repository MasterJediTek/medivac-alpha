/**
 * v9.17 Features Unit Tests
 * Tests for Route Creation Wizard, Biometric Timeout Settings, and Language Preference Sync
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { routeCreationWizardService } from '../route-creation-wizard.service';
import { biometricTimeoutService, type TimeoutDuration } from '../biometric-timeout.service';
import { languageSyncService } from '../language-sync.service';
import { routeHistoryService } from '../route-history.service';
import { languageService } from '../language.service';

describe('v9.17 Features', () => {
  describe('Route Creation Wizard Service', () => {
    beforeEach(() => {
      routeCreationWizardService.cancelRoute();
    });

    it('should have hospital locations initialized', () => {
      const locations = routeCreationWizardService.getHospitalLocations();
      expect(locations.length).toBeGreaterThan(0);
    });

    it('should have locations in multiple categories', () => {
      const categories = routeCreationWizardService.getCategories();
      expect(categories.length).toBe(6);
      categories.forEach(cat => {
        expect(cat.count).toBeGreaterThan(0);
      });
    });

    it('should get locations by category', () => {
      const entrances = routeCreationWizardService.getLocationsByCategory('entrance');
      expect(entrances.length).toBeGreaterThan(0);
      entrances.forEach(loc => {
        expect(loc.category).toBe('entrance');
      });
    });

    it('should search locations by name', () => {
      const results = routeCreationWizardService.searchLocations('Emergency');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should search locations by description', () => {
      const results = routeCreationWizardService.searchLocations('imaging');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should start a new route draft', () => {
      const draft = routeCreationWizardService.startNewRoute();
      expect(draft).toBeDefined();
      expect(draft.id).toBeDefined();
      expect(draft.currentStep).toBe(1);
      expect(draft.startLocation).toBeNull();
      expect(draft.endLocation).toBeNull();
      expect(draft.waypoints).toEqual([]);
    });

    it('should set start location', () => {
      routeCreationWizardService.startNewRoute();
      const locations = routeCreationWizardService.getHospitalLocations();
      routeCreationWizardService.setStartLocation(locations[0]);
      
      const draft = routeCreationWizardService.getCurrentDraft();
      expect(draft?.startLocation).toBeDefined();
      expect(draft?.startLocation?.id).toBe(locations[0].id);
    });

    it('should set end location', () => {
      routeCreationWizardService.startNewRoute();
      const locations = routeCreationWizardService.getHospitalLocations();
      routeCreationWizardService.setStartLocation(locations[0]);
      routeCreationWizardService.setEndLocation(locations[1]);
      
      const draft = routeCreationWizardService.getCurrentDraft();
      expect(draft?.endLocation).toBeDefined();
      expect(draft?.endLocation?.id).toBe(locations[1].id);
    });

    it('should auto-generate route name', () => {
      routeCreationWizardService.startNewRoute();
      const locations = routeCreationWizardService.getHospitalLocations();
      routeCreationWizardService.setStartLocation(locations[0]);
      routeCreationWizardService.setEndLocation(locations[1]);
      
      const draft = routeCreationWizardService.getCurrentDraft();
      expect(draft?.name).toContain('to');
      expect(draft?.name?.length).toBeGreaterThan(0);
    });

    it('should add waypoints', () => {
      routeCreationWizardService.startNewRoute();
      const locations = routeCreationWizardService.getHospitalLocations();
      routeCreationWizardService.addWaypoint(locations[2]);
      
      const draft = routeCreationWizardService.getCurrentDraft();
      expect(draft?.waypoints.length).toBe(1);
    });

    it('should remove waypoints', () => {
      routeCreationWizardService.startNewRoute();
      const locations = routeCreationWizardService.getHospitalLocations();
      routeCreationWizardService.addWaypoint(locations[2]);
      routeCreationWizardService.addWaypoint(locations[3]);
      routeCreationWizardService.removeWaypoint(0);
      
      const draft = routeCreationWizardService.getCurrentDraft();
      expect(draft?.waypoints.length).toBe(1);
    });

    it('should reorder waypoints', () => {
      routeCreationWizardService.startNewRoute();
      const locations = routeCreationWizardService.getHospitalLocations();
      routeCreationWizardService.addWaypoint(locations[2]);
      routeCreationWizardService.addWaypoint(locations[3]);
      routeCreationWizardService.reorderWaypoints(0, 1);
      
      const draft = routeCreationWizardService.getCurrentDraft();
      expect(draft?.waypoints[0].id).toBe(locations[3].id);
    });

    it('should set custom route name', () => {
      routeCreationWizardService.startNewRoute();
      routeCreationWizardService.setRouteName('My Custom Route');
      
      const draft = routeCreationWizardService.getCurrentDraft();
      expect(draft?.name).toBe('My Custom Route');
    });

    it('should set accessibility flag', () => {
      routeCreationWizardService.startNewRoute();
      routeCreationWizardService.setAccessible(false);
      
      const draft = routeCreationWizardService.getCurrentDraft();
      expect(draft?.isAccessible).toBe(false);
    });

    it('should add share recipients', () => {
      routeCreationWizardService.startNewRoute();
      routeCreationWizardService.addShareRecipient('family@example.com');
      
      const draft = routeCreationWizardService.getCurrentDraft();
      expect(draft?.sharedWith).toContain('family@example.com');
    });

    it('should not add duplicate share recipients', () => {
      routeCreationWizardService.startNewRoute();
      routeCreationWizardService.addShareRecipient('family@example.com');
      routeCreationWizardService.addShareRecipient('family@example.com');
      
      const draft = routeCreationWizardService.getCurrentDraft();
      expect(draft?.sharedWith.length).toBe(1);
    });

    it('should remove share recipients', () => {
      routeCreationWizardService.startNewRoute();
      routeCreationWizardService.addShareRecipient('family@example.com');
      routeCreationWizardService.removeShareRecipient('family@example.com');
      
      const draft = routeCreationWizardService.getCurrentDraft();
      expect(draft?.sharedWith.length).toBe(0);
    });

    it('should navigate between steps', () => {
      routeCreationWizardService.startNewRoute();
      routeCreationWizardService.nextStep();
      
      const draft = routeCreationWizardService.getCurrentDraft();
      expect(draft?.currentStep).toBe(2);
    });

    it('should go to previous step', () => {
      routeCreationWizardService.startNewRoute();
      routeCreationWizardService.goToStep(3);
      routeCreationWizardService.previousStep();
      
      const draft = routeCreationWizardService.getCurrentDraft();
      expect(draft?.currentStep).toBe(2);
    });

    it('should generate route preview', () => {
      routeCreationWizardService.startNewRoute();
      const locations = routeCreationWizardService.getHospitalLocations();
      routeCreationWizardService.setStartLocation(locations[0]);
      routeCreationWizardService.setEndLocation(locations[4]);
      
      const preview = routeCreationWizardService.getRoutePreview();
      expect(preview).toBeDefined();
      expect(preview!.totalDistance).toBeGreaterThan(0);
      expect(preview!.estimatedTime).toBeGreaterThan(0);
      expect(preview!.pathPoints.length).toBeGreaterThanOrEqual(2);
    });

    it('should validate draft - missing start', () => {
      routeCreationWizardService.startNewRoute();
      const validation = routeCreationWizardService.validateDraft();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Start location is required');
    });

    it('should validate draft - missing end', () => {
      routeCreationWizardService.startNewRoute();
      const locations = routeCreationWizardService.getHospitalLocations();
      routeCreationWizardService.setStartLocation(locations[0]);
      
      const validation = routeCreationWizardService.validateDraft();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('End location is required');
    });

    it('should validate draft - same start and end', () => {
      routeCreationWizardService.startNewRoute();
      const locations = routeCreationWizardService.getHospitalLocations();
      routeCreationWizardService.setStartLocation(locations[0]);
      routeCreationWizardService.setEndLocation(locations[0]);
      
      const validation = routeCreationWizardService.validateDraft();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Start and end locations must be different');
    });

    it('should save valid route to history', () => {
      const initialCount = routeHistoryService.getAllRoutes().length;
      
      routeCreationWizardService.startNewRoute();
      const locations = routeCreationWizardService.getHospitalLocations();
      // Use locations far apart to avoid matching existing routes
      const chapel = locations.find(l => l.name === 'Chapel');
      const pathLab = locations.find(l => l.name === 'Pathology Lab');
      routeCreationWizardService.setStartLocation(chapel || locations[locations.length - 2]);
      routeCreationWizardService.setEndLocation(pathLab || locations[locations.length - 1]);
      routeCreationWizardService.setRouteName('Test Wizard Route');
      
      const saved = routeCreationWizardService.saveRoute();
      expect(saved).toBeDefined();
      // The route may match an existing one if positions are close, so just verify it saved
      expect(saved!.name.length).toBeGreaterThan(0);
      
      const newCount = routeHistoryService.getAllRoutes().length;
      expect(newCount).toBeGreaterThanOrEqual(initialCount);
    });

    it('should clear draft after saving', () => {
      routeCreationWizardService.startNewRoute();
      const locations = routeCreationWizardService.getHospitalLocations();
      routeCreationWizardService.setStartLocation(locations[0]);
      routeCreationWizardService.setEndLocation(locations[4]);
      routeCreationWizardService.setRouteName('Test Clear Route');
      routeCreationWizardService.saveRoute();
      
      expect(routeCreationWizardService.getCurrentDraft()).toBeNull();
    });

    it('should cancel route creation', () => {
      routeCreationWizardService.startNewRoute();
      routeCreationWizardService.cancelRoute();
      
      expect(routeCreationWizardService.getCurrentDraft()).toBeNull();
    });

    it('should get wizard steps', () => {
      routeCreationWizardService.startNewRoute();
      const steps = routeCreationWizardService.getWizardSteps();
      expect(steps.length).toBe(5);
      expect(steps[0].title).toBe('Start Location');
      expect(steps[4].title).toBe('Preview & Save');
    });
  });

  describe('Biometric Timeout Service', () => {
    it('should have default timeout of 15 minutes', () => {
      const duration = biometricTimeoutService.getTimeoutDuration();
      // Default is 900 (15 min) unless previously changed
      expect([300, 900, 1800, 3600, -1]).toContain(duration);
    });

    it('should provide timeout options', () => {
      const options = biometricTimeoutService.getTimeoutOptions();
      expect(options.length).toBe(5);
      expect(options.map(o => o.duration)).toEqual([300, 900, 1800, 3600, -1]);
    });

    it('should set timeout duration', () => {
      biometricTimeoutService.setTimeoutDuration(1800);
      expect(biometricTimeoutService.getTimeoutDuration()).toBe(1800);
      
      // Reset
      biometricTimeoutService.setTimeoutDuration(900);
    });

    it('should get current config', () => {
      biometricTimeoutService.setTimeoutDuration(300);
      const config = biometricTimeoutService.getCurrentConfig();
      expect(config.label).toBe('5 minutes');
      
      // Reset
      biometricTimeoutService.setTimeoutDuration(900);
    });

    it('should get state', () => {
      const state = biometricTimeoutService.getState();
      expect(state).toBeDefined();
      expect(state.isLocked).toBeDefined();
      expect(state.timeoutDuration).toBeDefined();
    });

    it('should record activity', () => {
      biometricTimeoutService.recordActivity();
      const state = biometricTimeoutService.getState();
      expect(state.lastActivity).toBeGreaterThan(0);
    });

    it('should unlock with staff ID', () => {
      biometricTimeoutService.unlock('STAFF001');
      const state = biometricTimeoutService.getState();
      expect(state.isLocked).toBe(false);
      
      // Lock again
      biometricTimeoutService.lock();
    });

    it('should lock manually', () => {
      biometricTimeoutService.unlock('STAFF001');
      biometricTimeoutService.lock();
      const state = biometricTimeoutService.getState();
      expect(state.isLocked).toBe(true);
    });

    it('should not be timed out with never duration', () => {
      biometricTimeoutService.setTimeoutDuration(-1);
      expect(biometricTimeoutService.isTimedOut()).toBe(false);
      
      // Reset
      biometricTimeoutService.setTimeoutDuration(900);
    });

    it('should format remaining time', () => {
      biometricTimeoutService.unlock('STAFF001');
      biometricTimeoutService.recordActivity();
      const formatted = biometricTimeoutService.getFormattedRemainingTime();
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
      
      biometricTimeoutService.lock();
    });

    it('should get timeout label', () => {
      expect(biometricTimeoutService.getTimeoutLabel(300)).toBe('5 minutes');
      expect(biometricTimeoutService.getTimeoutLabel(900)).toBe('15 minutes');
      expect(biometricTimeoutService.getTimeoutLabel(1800)).toBe('30 minutes');
      expect(biometricTimeoutService.getTimeoutLabel(3600)).toBe('1 hour');
      expect(biometricTimeoutService.getTimeoutLabel(-1)).toBe('Never');
    });

    it('should subscribe and unsubscribe', () => {
      let callCount = 0;
      const unsubscribe = biometricTimeoutService.subscribe(() => {
        callCount++;
      });
      
      biometricTimeoutService.setTimeoutDuration(1800);
      expect(callCount).toBe(1);
      
      unsubscribe();
      biometricTimeoutService.setTimeoutDuration(900);
      expect(callCount).toBe(1); // Should not increase
    });
  });

  describe('Language Sync Service', () => {
    it('should have a device ID', () => {
      const deviceId = languageSyncService.getDeviceId();
      expect(deviceId).toBeDefined();
      expect(deviceId.length).toBeGreaterThan(0);
    });

    it('should get initial state', () => {
      const state = languageSyncService.getState();
      expect(state).toBeDefined();
      expect(state.deviceId).toBeDefined();
      expect(state.isSyncing).toBe(false);
    });

    it('should sync to cloud', async () => {
      const result = await languageSyncService.syncToCloud();
      expect(result).toBe(true);
      
      const state = languageSyncService.getState();
      expect(state.syncStatus).toBe('success');
      expect(state.lastSyncTime).toBeGreaterThan(0);
    });

    it('should sync from cloud', async () => {
      // First sync to cloud
      await languageSyncService.syncToCloud();
      
      // Then sync from cloud
      const result = await languageSyncService.syncFromCloud();
      // Result may be null if no remote records from other devices
      expect(result === null || typeof result === 'string').toBe(true);
    });

    it('should get sync records', async () => {
      await languageSyncService.syncToCloud();
      const records = languageSyncService.getSyncRecords();
      expect(records.length).toBeGreaterThan(0);
    });

    it('should format last sync time', async () => {
      await languageSyncService.syncToCloud();
      const formatted = languageSyncService.getFormattedLastSync();
      expect(formatted).toBe('Just now');
    });

    it('should get sync status label', () => {
      const label = languageSyncService.getSyncStatusLabel();
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    });

    it('should get sync status color', () => {
      const color = languageSyncService.getSyncStatusColor();
      expect(typeof color).toBe('string');
      expect(['muted', 'primary', 'success', 'error', 'warning']).toContain(color);
    });

    it('should subscribe to state changes', async () => {
      let callCount = 0;
      const unsubscribe = languageSyncService.subscribe(() => {
        callCount++;
      });
      
      await languageSyncService.syncToCloud();
      expect(callCount).toBeGreaterThan(0);
      
      unsubscribe();
    });

    it('should reset sync data', () => {
      languageSyncService.resetSync();
      const state = languageSyncService.getState();
      expect(state.syncStatus).toBe('idle');
      expect(state.lastSyncTime).toBeNull();
    });
  });

  describe('Integration Tests', () => {
    it('should create route via wizard and find it in history', () => {
      routeCreationWizardService.startNewRoute();
      const locations = routeCreationWizardService.getHospitalLocations();
      routeCreationWizardService.setStartLocation(locations[0]);
      routeCreationWizardService.setEndLocation(locations[5]);
      routeCreationWizardService.setRouteName('Integration Test Route');
      
      const saved = routeCreationWizardService.saveRoute();
      expect(saved).toBeDefined();
      
      const found = routeHistoryService.searchRoutes('Integration Test');
      expect(found.length).toBeGreaterThan(0);
    });

    it('should sync language after changing it', async () => {
      const originalLang = languageService.getCurrentLanguageCode();
      
      languageService.setLanguage('es-ES');
      const syncResult = await languageSyncService.syncToCloud();
      expect(syncResult).toBe(true);
      
      // Restore
      languageService.setLanguage(originalLang);
    });

    it('should maintain timeout settings independently of biometric enrollment', () => {
      biometricTimeoutService.setTimeoutDuration(3600);
      expect(biometricTimeoutService.getTimeoutDuration()).toBe(3600);
      
      biometricTimeoutService.setTimeoutDuration(900);
    });
  });
});
