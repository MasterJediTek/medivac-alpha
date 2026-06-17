/**
 * Tests for v7.4 Features
 * - Transcription Search Service
 * - Playlist Service
 * - Storage Pricing Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { transcriptionSearchService } from '../transcription-search-service';
import { playlistService } from '../playlist-service';
import { storagePricingService } from '../storage-pricing-service';

describe('Transcription Search Service', () => {
  beforeEach(async () => {
    await transcriptionSearchService.initialize();
  });

  it('should initialize with sample data', () => {
    const transcriptions = transcriptionSearchService.getTranscriptions();
    expect(transcriptions.length).toBeGreaterThan(0);
  });

  it('should search transcriptions', () => {
    const results = transcriptionSearchService.search({ text: 'emergency' });
    expect(results).toBeDefined();
    expect(results.results).toBeDefined();
  });

  it('should get search history', () => {
    transcriptionSearchService.search({ text: 'test query' });
    const history = transcriptionSearchService.getSearchHistory();
    expect(Array.isArray(history)).toBe(true);
  });

  it('should provide search stats', () => {
    const stats = transcriptionSearchService.getStats();
    expect(stats).toBeDefined();
    expect(stats.totalTranscriptions).toBeGreaterThanOrEqual(0);
  });

  it('should get transcription by id', () => {
    const transcriptions = transcriptionSearchService.getTranscriptions();
    if (transcriptions.length > 0) {
      const transcription = transcriptionSearchService.getTranscription(transcriptions[0].id);
      expect(transcription).toBeDefined();
    }
  });

  it('should filter by date range', () => {
    const results = transcriptionSearchService.search({
      text: 'test',
      filters: {
        dateFrom: '2024-01-01',
        dateTo: '2026-12-31',
      },
    });
    expect(results).toBeDefined();
  });

  it('should create saved search', async () => {
    const saved = await transcriptionSearchService.createSavedSearch({
      name: 'Test Search',
      query: 'emergency',
      filters: {},
      notifyOnNew: false,
    });
    expect(saved).toBeDefined();
    expect(saved.name).toBe('Test Search');
  });

  it('should get saved searches', () => {
    const saved = transcriptionSearchService.getSavedSearches();
    expect(Array.isArray(saved)).toBe(true);
  });
});

describe('Playlist Service', () => {
  beforeEach(async () => {
    await playlistService.initialize();
  });

  it('should initialize with sample playlists', () => {
    const playlists = playlistService.getPlaylists({});
    expect(playlists.length).toBeGreaterThan(0);
  });

  it('should create a new playlist', async () => {
    const playlist = await playlistService.createPlaylist(
      'Test Playlist',
      'A test playlist description',
      'custom',
      'private',
      'test_user',
      'Test User'
    );
    expect(playlist).toBeDefined();
    expect(playlist.name).toBe('Test Playlist');
  });

  it('should add items to playlist', async () => {
    const playlists = playlistService.getPlaylists({});
    if (playlists.length > 0) {
      const result = await playlistService.addItem(
        playlists[0].id,
        'reel_1',
        'Test Reel',
        120,
        'training',
        true,
        'test_user'
      );
      expect(result).toBeDefined();
    }
  });

  it('should track user progress', async () => {
    const playlists = playlistService.getPlaylists({ isPublished: true });
    if (playlists.length > 0) {
      await playlistService.startPlaylist('test_user', 'Test User', playlists[0].id);
      const progress = playlistService.getUserProgress('test_user');
      expect(progress.length).toBeGreaterThan(0);
    }
  });

  it('should filter playlists by category', () => {
    const playlists = playlistService.getPlaylists({ category: 'onboarding' });
    playlists.forEach(p => {
      expect(p.category).toBe('onboarding');
    });
  });

  it('should provide global analytics', () => {
    const analytics = playlistService.getGlobalAnalytics();
    expect(analytics).toBeDefined();
    expect(analytics.totalPlaylists).toBeGreaterThanOrEqual(0);
  });

  it('should publish a playlist', async () => {
    const playlist = await playlistService.createPlaylist(
      'Publish Test',
      'Testing publish',
      'training_program',
      'private',
      'test_user',
      'Test User'
    );
    const published = await playlistService.publishPlaylist(playlist.id);
    expect(published).toBeDefined();
    if (published) {
      expect(published.isPublished).toBe(true);
    }
  });
});

describe('Storage Pricing Service', () => {
  beforeEach(async () => {
    await storagePricingService.initialize();
  });

  it('should initialize with tier pricing', () => {
    const tiers = storagePricingService.getAllTierPricing();
    expect(tiers.length).toBeGreaterThan(0);
  });

  it('should get tier pricing', () => {
    const tiers = storagePricingService.getAllTierPricing();
    const standardTier = tiers.find(t => t.tier === 'standard');
    expect(standardTier).toBeDefined();
    if (standardTier) {
      expect(standardTier.pricePerGBMonth).toBeGreaterThan(0);
    }
  });

  it('should provide analytics', () => {
    const analytics = storagePricingService.getAnalytics();
    expect(analytics).toBeDefined();
    expect(analytics.totalStorageGB).toBeGreaterThanOrEqual(0);
  });

  it('should manage department budgets', () => {
    const budgets = storagePricingService.getAllBudgets();
    expect(Array.isArray(budgets)).toBe(true);
  });

  it('should check budget status', () => {
    const budgets = storagePricingService.getAllBudgets();
    if (budgets.length > 0) {
      const status = storagePricingService.checkBudgetStatus(budgets[0].departmentId);
      expect(status).toBeDefined();
      expect(['ok', 'warning', 'critical', 'exceeded']).toContain(status.status);
    }
  });

  it('should generate cost forecasts', () => {
    const budgets = storagePricingService.getAllBudgets();
    if (budgets.length > 0) {
      const forecast = storagePricingService.getForecast(budgets[0].departmentId);
      expect(forecast).toBeDefined();
      expect(forecast.currentMonthProjected).toBeGreaterThanOrEqual(0);
    }
  });

  it('should manage alerts', () => {
    const alerts = storagePricingService.getAlerts({});
    expect(Array.isArray(alerts)).toBe(true);
  });

  it('should acknowledge alerts', async () => {
    const alerts = storagePricingService.getAlerts({ status: 'active' });
    if (alerts.length > 0) {
      const result = await storagePricingService.acknowledgeAlert(alerts[0].id, 'test_user');
      expect(result).toBeDefined();
      if (result) {
        expect(result.status).toBe('acknowledged');
      }
    }
  });

  it('should provide tier recommendations', () => {
    const tiers = storagePricingService.getAllTierPricing();
    expect(tiers.some(t => t.features.length > 0)).toBe(true);
  });

  it('should track storage by tier', () => {
    const analytics = storagePricingService.getAnalytics();
    expect(analytics.storageByTier).toBeDefined();
    expect(Array.isArray(analytics.storageByTier)).toBe(true);
  });
});
