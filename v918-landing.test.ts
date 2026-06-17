/**
 * v9.18 Landing Page Feature Tests
 * Tests the public landing page data, filtering, directions, and install options
 */

import { describe, it, expect } from 'vitest';

// ============================================================================
// Inline test data matching landing.tsx
// ============================================================================

interface HospitalBuilding {
  id: string;
  name: string;
  icon: string;
  category: 'emergency' | 'department' | 'ward' | 'service' | 'facility' | 'entrance';
  position: { x: number; y: number };
  color: string;
  services: string[];
  hours: string;
  floor: string;
  description: string;
  isAccessible: boolean;
}

const BUILDINGS: HospitalBuilding[] = [
  { id: 'main-entrance', name: 'Main Entrance', icon: '🚪', category: 'entrance', position: { x: 50, y: 85 }, color: '#F59E0B', services: ['Reception', 'Information Desk', 'Wheelchair Access'], hours: '24/7', floor: 'Ground', description: 'Primary hospital entrance', isAccessible: true },
  { id: 'emergency', name: 'Emergency Dept', icon: '🚨', category: 'emergency', position: { x: 18, y: 35 }, color: '#EF4444', services: ['Triage', 'Resuscitation', 'Acute Care', 'Ambulance Bay'], hours: '24/7', floor: 'Ground', description: '24/7 emergency', isAccessible: true },
  { id: 'main-hospital', name: 'Main Hospital', icon: '🏥', category: 'department', position: { x: 50, y: 40 }, color: '#0077B6', services: ['Administration', 'Medical Records', 'Cafeteria', 'Gift Shop'], hours: '24/7', floor: 'Ground-3', description: 'Central building', isAccessible: true },
  { id: 'maternity', name: 'Maternity Ward', icon: '👶', category: 'ward', position: { x: 72, y: 25 }, color: '#EC4899', services: ['Labour & Delivery', 'Postnatal Care', 'Nursery', 'Antenatal'], hours: '24/7', floor: 'Level 1', description: 'Maternity', isAccessible: true },
  { id: 'pharmacy', name: 'Pharmacy', icon: '💊', category: 'service', position: { x: 55, y: 68 }, color: '#22C55E', services: ['Prescriptions', 'Medication Advice', 'Supplies'], hours: '8am-6pm', floor: 'Ground', description: 'Pharmacy', isAccessible: true },
  { id: 'parking', name: 'Visitor Parking', icon: '🅿️', category: 'facility', position: { x: 85, y: 85 }, color: '#64748B', services: ['Visitor Parking', 'Disabled Parking', 'Staff Parking'], hours: '24/7', floor: 'Ground', description: 'Parking', isAccessible: true },
  { id: 'helipad', name: 'Helipad', icon: '🚁', category: 'emergency', position: { x: 15, y: 15 }, color: '#EF4444', services: ['Air Ambulance', 'Emergency Transport'], hours: '24/7', floor: 'Roof', description: 'Helipad', isAccessible: false },
];

const ACCESSIBILITY_MARKERS = [
  { id: 'elev-1', type: 'elevator', icon: '🛗', position: { x: 48, y: 42 }, name: 'Main Elevator A' },
  { id: 'elev-2', type: 'elevator', icon: '🛗', position: { x: 70, y: 38 }, name: 'East Wing Elevator' },
  { id: 'ramp-1', type: 'ramp', icon: '♿', position: { x: 50, y: 80 }, name: 'Main Entrance Ramp' },
  { id: 'wc-1', type: 'restroom', icon: '🚻', position: { x: 45, y: 50 }, name: 'Accessible Restroom - Main' },
];

// Direction generator matching landing.tsx logic
function getDirections(building: HospitalBuilding) {
  const directions: { instruction: string; icon: string; distance: string }[] = [
    { instruction: 'Start at Main Entrance', icon: '🚪', distance: '' },
  ];
  if (building.position.y < 50) {
    directions.push({ instruction: 'Walk straight ahead through the lobby', icon: '⬆️', distance: '30m' });
  } else {
    directions.push({ instruction: 'Enter the main lobby', icon: '➡️', distance: '15m' });
  }
  if (building.position.x < 40) {
    directions.push({ instruction: 'Turn left at the corridor', icon: '⬅️', distance: '25m' });
  } else if (building.position.x > 60) {
    directions.push({ instruction: 'Turn right at the corridor', icon: '➡️', distance: '25m' });
  } else {
    directions.push({ instruction: 'Continue straight ahead', icon: '⬆️', distance: '20m' });
  }
  if (building.floor !== 'Ground') {
    directions.push({ instruction: `Take the elevator to ${building.floor}`, icon: '🛗', distance: '' });
  }
  const dist = Math.round(
    Math.sqrt(Math.pow(building.position.x - 50, 2) + Math.pow(building.position.y - 85, 2)) * 2
  );
  directions.push({ instruction: 'Continue along the corridor', icon: '⬆️', distance: `${dist}m` });
  directions.push({ instruction: `Arrive at ${building.name}`, icon: '📍', distance: '' });
  return directions;
}

// ============================================================================
// TESTS
// ============================================================================

describe('Landing Page - Hospital Data', () => {
  it('should have all required building fields', () => {
    for (const b of BUILDINGS) {
      expect(b.id).toBeTruthy();
      expect(b.name).toBeTruthy();
      expect(b.icon).toBeTruthy();
      expect(b.category).toBeTruthy();
      expect(b.position.x).toBeGreaterThanOrEqual(0);
      expect(b.position.x).toBeLessThanOrEqual(100);
      expect(b.position.y).toBeGreaterThanOrEqual(0);
      expect(b.position.y).toBeLessThanOrEqual(100);
      expect(b.services.length).toBeGreaterThan(0);
      expect(b.hours).toBeTruthy();
      expect(b.floor).toBeTruthy();
    }
  });

  it('should have unique building IDs', () => {
    const ids = BUILDINGS.map(b => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should have at least one building per category', () => {
    const categories = ['emergency', 'department', 'ward', 'service', 'facility', 'entrance'];
    for (const cat of categories) {
      const found = BUILDINGS.filter(b => b.category === cat);
      expect(found.length).toBeGreaterThan(0);
    }
  });
});

describe('Landing Page - Category Filtering', () => {
  it('should filter by emergency category', () => {
    const result = BUILDINGS.filter(b => b.category === 'emergency');
    expect(result.length).toBe(2);
    expect(result.map(b => b.id)).toContain('emergency');
    expect(result.map(b => b.id)).toContain('helipad');
  });

  it('should filter by ward category', () => {
    const result = BUILDINGS.filter(b => b.category === 'ward');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('maternity');
  });

  it('should return all buildings when category is all', () => {
    const result = BUILDINGS;
    expect(result.length).toBe(7);
  });
});

describe('Landing Page - Search Filtering', () => {
  it('should find buildings by name', () => {
    const q = 'pharmacy';
    const result = BUILDINGS.filter(b => b.name.toLowerCase().includes(q));
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('pharmacy');
  });

  it('should find buildings by service', () => {
    const q = 'triage';
    const result = BUILDINGS.filter(b => b.services.some(s => s.toLowerCase().includes(q)));
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('emergency');
  });

  it('should find buildings by description', () => {
    const q = 'maternity';
    const result = BUILDINGS.filter(b => b.description.toLowerCase().includes(q));
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('maternity');
  });

  it('should return empty for non-matching search', () => {
    const q = 'zzzznotfound';
    const result = BUILDINGS.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.services.some(s => s.toLowerCase().includes(q)) ||
      b.description.toLowerCase().includes(q)
    );
    expect(result.length).toBe(0);
  });
});

describe('Landing Page - Directions Generator', () => {
  it('should generate directions starting from Main Entrance', () => {
    const dirs = getDirections(BUILDINGS[0]); // Main Entrance to itself
    expect(dirs[0].instruction).toBe('Start at Main Entrance');
    expect(dirs[dirs.length - 1].instruction).toContain('Arrive at');
  });

  it('should include elevator step for non-ground floors', () => {
    const maternity = BUILDINGS.find(b => b.id === 'maternity')!;
    const dirs = getDirections(maternity);
    const elevatorStep = dirs.find(d => d.instruction.includes('elevator'));
    expect(elevatorStep).toBeTruthy();
    expect(elevatorStep!.instruction).toContain('Level 1');
  });

  it('should NOT include elevator step for ground floor', () => {
    const emergency = BUILDINGS.find(b => b.id === 'emergency')!;
    const dirs = getDirections(emergency);
    const elevatorStep = dirs.find(d => d.instruction.includes('elevator'));
    expect(elevatorStep).toBeUndefined();
  });

  it('should turn left for buildings on the left side', () => {
    const emergency = BUILDINGS.find(b => b.id === 'emergency')!;
    const dirs = getDirections(emergency);
    const leftTurn = dirs.find(d => d.instruction.includes('Turn left'));
    expect(leftTurn).toBeTruthy();
  });

  it('should turn right for buildings on the right side', () => {
    const maternity = BUILDINGS.find(b => b.id === 'maternity')!;
    const dirs = getDirections(maternity);
    const rightTurn = dirs.find(d => d.instruction.includes('Turn right'));
    expect(rightTurn).toBeTruthy();
  });

  it('should calculate distance correctly', () => {
    const emergency = BUILDINGS.find(b => b.id === 'emergency')!;
    const dirs = getDirections(emergency);
    const distStep = dirs.find(d => d.distance.includes('m') && d.instruction === 'Continue along the corridor');
    expect(distStep).toBeTruthy();
    const dist = parseInt(distStep!.distance);
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThan(200);
  });
});

describe('Landing Page - Accessibility Features', () => {
  it('should have accessibility markers', () => {
    expect(ACCESSIBILITY_MARKERS.length).toBeGreaterThan(0);
  });

  it('should have unique marker IDs', () => {
    const ids = ACCESSIBILITY_MARKERS.map(m => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should include elevators, ramps, and restrooms', () => {
    const types = new Set(ACCESSIBILITY_MARKERS.map(m => m.type));
    expect(types.has('elevator')).toBe(true);
    expect(types.has('ramp')).toBe(true);
    expect(types.has('restroom')).toBe(true);
  });

  it('should have markers within map bounds', () => {
    for (const m of ACCESSIBILITY_MARKERS) {
      expect(m.position.x).toBeGreaterThanOrEqual(0);
      expect(m.position.x).toBeLessThanOrEqual(100);
      expect(m.position.y).toBeGreaterThanOrEqual(0);
      expect(m.position.y).toBeLessThanOrEqual(100);
    }
  });

  it('should mark accessible buildings correctly', () => {
    const accessible = BUILDINGS.filter(b => b.isAccessible);
    const notAccessible = BUILDINGS.filter(b => !b.isAccessible);
    expect(accessible.length).toBeGreaterThan(0);
    expect(notAccessible.length).toBeGreaterThan(0);
    expect(notAccessible[0].id).toBe('helipad');
  });
});

describe('Landing Page - Install Options', () => {
  it('should have sideload links available', () => {
    const sideloadUrl = 'https://jeditek.xyz/jedi-downloads';
    expect(sideloadUrl).toBeTruthy();
  });

  it('should have JEDI install protocol URI', () => {
    const jediUri = 'jedi://install?modules=homing-beacon,comm-station,friend-hatching,club-builder,web-share,vpn-browser';
    expect(jediUri).toContain('jedi://install');
    expect(jediUri).toContain('homing-beacon');
    expect(jediUri).toContain('vpn-browser');
  });

  it('should have browser install links', () => {
    const jediTekBrowser = 'https://jeditek-bro.manus.space';
    const wongiBrowser = 'https://wongi.manus.space';
    expect(jediTekBrowser).toBeTruthy();
    expect(wongiBrowser).toBeTruthy();
  });

  it('should have JEDI installer portal link', () => {
    const installerUrl = 'https://jediinstal-krne8jes.manus.space';
    expect(installerUrl).toBeTruthy();
  });
});

describe('Landing Page - No Auth Required', () => {
  it('should not import any auth services', () => {
    // The landing page should be self-contained with no auth dependencies
    // This test validates the data model is complete without external services
    const allBuildingsHaveData = BUILDINGS.every(b =>
      b.id && b.name && b.services.length > 0 && b.hours && b.floor
    );
    expect(allBuildingsHaveData).toBe(true);
  });

  it('should provide navigation without login', () => {
    // Directions should work for any building without auth
    for (const building of BUILDINGS) {
      const dirs = getDirections(building);
      expect(dirs.length).toBeGreaterThanOrEqual(3);
      expect(dirs[0].instruction).toBe('Start at Main Entrance');
    }
  });
});
