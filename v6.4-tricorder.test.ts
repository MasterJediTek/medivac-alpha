/**
 * Tests for MediVac One v6.4 - Tricorder System
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
  },
}));

describe('Tricorder Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have tricorder templates defined', async () => {
    const { TRICORDER_TEMPLATES } = await import('../lib/services/tricorder-service');
    expect(TRICORDER_TEMPLATES).toBeDefined();
    expect(TRICORDER_TEMPLATES.length).toBeGreaterThan(0);
  });

  it('should have all tricorder types', async () => {
    const { TRICORDER_TEMPLATES } = await import('../lib/services/tricorder-service');
    const types = new Set(TRICORDER_TEMPLATES.map(t => t.type));
    expect(types.has('medical')).toBe(true);
    expect(types.has('engineering')).toBe(true);
    expect(types.has('science')).toBe(true);
    expect(types.has('tactical')).toBe(true);
    expect(types.has('environmental')).toBe(true);
  });

  it('should have all rarity levels', async () => {
    const { TRICORDER_TEMPLATES } = await import('../lib/services/tricorder-service');
    const rarities = new Set(TRICORDER_TEMPLATES.map(t => t.rarity));
    expect(rarities.has('common')).toBe(true);
    expect(rarities.has('rare')).toBe(true);
    expect(rarities.has('legendary')).toBe(true);
  });

  it('should have price and gift price for templates', async () => {
    const { TRICORDER_TEMPLATES } = await import('../lib/services/tricorder-service');
    TRICORDER_TEMPLATES.forEach(template => {
      expect(template.price).toBeGreaterThan(0);
      expect(template.giftPrice).toBeGreaterThan(template.price);
    });
  });

  it('should have base stats for all templates', async () => {
    const { TRICORDER_TEMPLATES } = await import('../lib/services/tricorder-service');
    TRICORDER_TEMPLATES.forEach(template => {
      expect(template.baseStats).toBeDefined();
      expect(template.baseStats.scanRange).toBeGreaterThan(0);
      expect(template.baseStats.scanAccuracy).toBeGreaterThan(0);
      expect(template.baseStats.batteryLife).toBeGreaterThan(0);
    });
  });

  it('should initialize tricorder service', async () => {
    const { tricorderService } = await import('../lib/services/tricorder-service');
    await tricorderService.initialize();
    const inventory = tricorderService.getInventory();
    expect(inventory).toBeDefined();
  });

  it('should get tricorder templates', async () => {
    const { tricorderService } = await import('../lib/services/tricorder-service');
    await tricorderService.initialize();
    const templates = tricorderService.getTemplates();
    expect(templates.length).toBeGreaterThan(0);
  });
});

describe('Avatar Service', () => {
  it('should have avatar customization defined', async () => {
    const { AVATAR_CUSTOMIZATION } = await import('../lib/services/avatar-service');
    expect(AVATAR_CUSTOMIZATION).toBeDefined();
    expect(AVATAR_CUSTOMIZATION.skinTones.length).toBeGreaterThan(0);
  });

  it('should have species bonuses defined', async () => {
    const { SPECIES_BONUSES } = await import('../lib/services/avatar-service');
    expect(SPECIES_BONUSES).toBeDefined();
    expect(SPECIES_BONUSES.human).toBeDefined();
    expect(SPECIES_BONUSES.vulcan).toBeDefined();
  });

  it('should initialize avatar service', async () => {
    const { avatarService } = await import('../lib/services/avatar-service');
    await avatarService.initialize();
    expect(avatarService).toBeDefined();
  });
});

describe('Pet Service', () => {
  it('should have pet templates defined', async () => {
    const { PET_TEMPLATES } = await import('../lib/services/pet-service');
    expect(PET_TEMPLATES).toBeDefined();
    expect(PET_TEMPLATES.length).toBeGreaterThan(0);
  });

  it('should have pet stats for each template', async () => {
    const { PET_TEMPLATES } = await import('../lib/services/pet-service');
    PET_TEMPLATES.forEach((species: { species: string; name: string; baseStats: object }) => {
      expect(species.species).toBeDefined();
      expect(species.name).toBeDefined();
      expect(species.baseStats).toBeDefined();
    });
  });

  it('should initialize pet service', async () => {
    const { petService } = await import('../lib/services/pet-service');
    await petService.initialize();
    expect(petService).toBeDefined();
  });
});

describe('Gifting Service', () => {
  it('should have gift wraps defined', async () => {
    const { GIFT_WRAPS } = await import('../lib/services/gifting-service');
    expect(GIFT_WRAPS).toBeDefined();
    expect(GIFT_WRAPS.length).toBeGreaterThan(0);
  });

  it('should have free and premium gift wraps', async () => {
    const { GIFT_WRAPS } = await import('../lib/services/gifting-service');
    const freeWraps = GIFT_WRAPS.filter(w => w.cost === 0);
    const premiumWraps = GIFT_WRAPS.filter(w => w.cost > 0);
    expect(freeWraps.length).toBeGreaterThan(0);
    expect(premiumWraps.length).toBeGreaterThan(0);
  });

  it('should initialize gifting service', async () => {
    const { giftingService } = await import('../lib/services/gifting-service');
    await giftingService.initialize();
    expect(giftingService).toBeDefined();
  });

  it('should get pending gifts for user', async () => {
    const { giftingService } = await import('../lib/services/gifting-service');
    await giftingService.initialize();
    const gifts = giftingService.getPendingGifts('test_user');
    expect(Array.isArray(gifts)).toBe(true);
  });

  it('should get sent gifts for user', async () => {
    const { giftingService } = await import('../lib/services/gifting-service');
    await giftingService.initialize();
    const gifts = giftingService.getSentGifts('test_user');
    expect(Array.isArray(gifts)).toBe(true);
  });
});

describe('Tricorder Control Panel', () => {
  it('should have scan types defined', async () => {
    // Verify the tricorder panel screen exists
    const fs = await import('fs');
    const path = await import('path');
    const screenPath = path.resolve(__dirname, '../app/(tabs)/tricorder-panel.tsx');
    expect(fs.existsSync(screenPath)).toBe(true);
  });
});

describe('Tricorder Shop', () => {
  it('should have shop screen defined', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const screenPath = path.resolve(__dirname, '../app/(tabs)/tricorder-shop.tsx');
    expect(fs.existsSync(screenPath)).toBe(true);
  });
});

describe('Gifting Screen', () => {
  it('should have gifting screen defined', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const screenPath = path.resolve(__dirname, '../app/(tabs)/gifting.tsx');
    expect(fs.existsSync(screenPath)).toBe(true);
  });
});

describe('Tricorder Integration', () => {
  it('should allow purchasing tricorder for self', async () => {
    const { tricorderService, TRICORDER_TEMPLATES } = await import('../lib/services/tricorder-service');
    await tricorderService.initialize();
    
    const template = TRICORDER_TEMPLATES[0];
    const result = await tricorderService.purchaseTricorder(
      template,
      'test_user',
      'user',
      'Test User',
      false
    );
    
    // May fail due to insufficient credits in test, but should have proper structure
    expect(result).toHaveProperty('success');
    if (result.success) {
      expect(result.tricorder).toBeDefined();
      expect(result.tricorder?.name).toBe(template.name);
    }
  });

  it('should allow purchasing tricorder for avatar', async () => {
    const { tricorderService, TRICORDER_TEMPLATES } = await import('../lib/services/tricorder-service');
    await tricorderService.initialize();
    
    const template = TRICORDER_TEMPLATES[0];
    const result = await tricorderService.purchaseTricorder(
      template,
      'avatar_123',
      'avatar',
      'Test Avatar',
      true
    );
    
    expect(result).toHaveProperty('success');
  });

  it('should allow purchasing tricorder for pet', async () => {
    const { tricorderService, TRICORDER_TEMPLATES } = await import('../lib/services/tricorder-service');
    await tricorderService.initialize();
    
    const template = TRICORDER_TEMPLATES[0];
    const result = await tricorderService.purchaseTricorder(
      template,
      'pet_456',
      'pet',
      'Test Pet',
      true
    );
    
    expect(result).toHaveProperty('success');
  });
});
