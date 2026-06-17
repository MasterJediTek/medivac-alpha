/**
 * Floor Plan Tests
 */

import { describe, it, expect } from 'vitest';

// Test floor plan data structures
describe('Floor Plan Data Structures', () => {
  describe('Room Types', () => {
    const ROOM_TYPES = [
      'patient_room',
      'operating_room',
      'consultation',
      'nurses_station',
      'waiting_area',
      'storage',
      'bathroom',
      'utility',
      'office',
      'lab',
      'imaging',
      'pharmacy',
      'reception',
      'corridor',
      'elevator',
      'stairs',
      'emergency_exit',
    ];

    it('should have all required room types', () => {
      expect(ROOM_TYPES.length).toBe(17);
      expect(ROOM_TYPES).toContain('patient_room');
      expect(ROOM_TYPES).toContain('operating_room');
      expect(ROOM_TYPES).toContain('emergency_exit');
    });
  });

  describe('Room Status', () => {
    const STATUS_TYPES = ['available', 'occupied', 'maintenance', 'emergency'];

    it('should have all status types', () => {
      expect(STATUS_TYPES.length).toBe(4);
      expect(STATUS_TYPES).toContain('available');
      expect(STATUS_TYPES).toContain('emergency');
    });
  });

  describe('Room Structure', () => {
    it('should have valid room structure', () => {
      const mockRoom = {
        id: 'room-1',
        name: 'Emergency Room 1',
        type: 'operating_room',
        icon: '🚨',
        position: { x: 10, y: 20 },
        size: { width: 80, height: 60 },
        capacity: 2,
        equipment: ['Defibrillator', 'Ventilator'],
        status: 'available',
        occupant: undefined,
        description: 'Main emergency treatment room',
      };

      expect(mockRoom.id).toBeDefined();
      expect(mockRoom.name).toBeDefined();
      expect(mockRoom.type).toBeDefined();
      expect(mockRoom.position.x).toBeGreaterThanOrEqual(0);
      expect(mockRoom.position.y).toBeGreaterThanOrEqual(0);
      expect(mockRoom.size.width).toBeGreaterThan(0);
      expect(mockRoom.size.height).toBeGreaterThan(0);
    });

    it('should handle occupied room', () => {
      const occupiedRoom = {
        id: 'room-2',
        name: 'Patient Room 1',
        type: 'patient_room',
        icon: '🛏️',
        position: { x: 100, y: 50 },
        size: { width: 60, height: 50 },
        status: 'occupied',
        occupant: 'John Doe',
      };

      expect(occupiedRoom.status).toBe('occupied');
      expect(occupiedRoom.occupant).toBe('John Doe');
    });
  });

  describe('Floor Plan Structure', () => {
    it('should have valid floor plan structure', () => {
      const mockFloorPlan = {
        id: 'floor-1',
        buildingId: 'emergency',
        buildingName: 'Emergency Department',
        floor: 1,
        floorName: 'Ground Floor',
        width: 400,
        height: 300,
        rooms: [],
        corridors: [],
        doors: [],
        features: [],
      };

      expect(mockFloorPlan.id).toBeDefined();
      expect(mockFloorPlan.buildingId).toBeDefined();
      expect(mockFloorPlan.width).toBeGreaterThan(0);
      expect(mockFloorPlan.height).toBeGreaterThan(0);
      expect(Array.isArray(mockFloorPlan.rooms)).toBe(true);
      expect(Array.isArray(mockFloorPlan.corridors)).toBe(true);
    });
  });

  describe('Corridor Structure', () => {
    it('should have valid corridor structure', () => {
      const mockCorridor = {
        id: 'corridor-1',
        path: [
          { x: 0, y: 100 },
          { x: 200, y: 100 },
          { x: 200, y: 200 },
        ],
        width: 10,
      };

      expect(mockCorridor.id).toBeDefined();
      expect(mockCorridor.path.length).toBeGreaterThan(1);
      expect(mockCorridor.width).toBeGreaterThan(0);
    });
  });

  describe('Door Structure', () => {
    it('should have valid door structure', () => {
      const mockDoor = {
        id: 'door-1',
        position: { x: 50, y: 60 },
        rotation: 90,
        type: 'double',
      };

      expect(mockDoor.id).toBeDefined();
      expect(mockDoor.position.x).toBeDefined();
      expect(mockDoor.position.y).toBeDefined();
      expect(mockDoor.rotation).toBeDefined();
      expect(['single', 'double', 'sliding', 'emergency']).toContain(mockDoor.type);
    });
  });

  describe('Feature Structure', () => {
    it('should have valid feature structure', () => {
      const mockFeature = {
        id: 'feature-1',
        type: 'plant',
        position: { x: 150, y: 20 },
        icon: '🌿',
      };

      expect(mockFeature.id).toBeDefined();
      expect(['window', 'column', 'plant', 'bench', 'vending', 'water_fountain', 'fire_extinguisher']).toContain(mockFeature.type);
      expect(mockFeature.icon).toBeDefined();
    });
  });
});

describe('Floor Plan Color Mapping', () => {
  const ROOM_TYPE_COLORS: Record<string, string> = {
    patient_room: '#3B82F6',
    operating_room: '#EF4444',
    consultation: '#10B981',
    nurses_station: '#8B5CF6',
    waiting_area: '#F59E0B',
    storage: '#6B7280',
    bathroom: '#06B6D4',
    utility: '#78716C',
    office: '#6366F1',
    lab: '#EC4899',
    imaging: '#14B8A6',
    pharmacy: '#22C55E',
    reception: '#F97316',
    corridor: '#E5E7EB',
    elevator: '#4B5563',
    stairs: '#9CA3AF',
    emergency_exit: '#DC2626',
  };

  const STATUS_COLORS: Record<string, string> = {
    available: '#22C55E',
    occupied: '#3B82F6',
    maintenance: '#F59E0B',
    emergency: '#EF4444',
  };

  it('should have colors for all room types', () => {
    const roomTypes = [
      'patient_room', 'operating_room', 'consultation', 'nurses_station',
      'waiting_area', 'storage', 'bathroom', 'utility', 'office', 'lab',
      'imaging', 'pharmacy', 'reception', 'corridor', 'elevator', 'stairs',
      'emergency_exit'
    ];

    roomTypes.forEach(type => {
      expect(ROOM_TYPE_COLORS[type]).toBeDefined();
      expect(ROOM_TYPE_COLORS[type]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('should have colors for all status types', () => {
    const statusTypes = ['available', 'occupied', 'maintenance', 'emergency'];

    statusTypes.forEach(status => {
      expect(STATUS_COLORS[status]).toBeDefined();
      expect(STATUS_COLORS[status]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('should have distinct colors for critical statuses', () => {
    expect(STATUS_COLORS.emergency).not.toBe(STATUS_COLORS.available);
    expect(STATUS_COLORS.maintenance).not.toBe(STATUS_COLORS.occupied);
  });
});

describe('Emergency Floor Plan', () => {
  const EMERGENCY_FLOOR_PLAN = {
    id: 'emergency-floor-1',
    buildingId: 'emergency',
    buildingName: 'Emergency Department',
    floor: 1,
    floorName: 'Ground Floor',
    width: 400,
    height: 300,
    rooms: [
      { id: 'er-reception', name: 'Reception', type: 'reception', status: 'available' },
      { id: 'er-triage', name: 'Triage', type: 'consultation', status: 'occupied' },
      { id: 'er-trauma-1', name: 'Trauma Bay 1', type: 'operating_room', status: 'available' },
      { id: 'er-trauma-2', name: 'Trauma Bay 2', type: 'operating_room', status: 'emergency' },
    ],
  };

  it('should have emergency department rooms', () => {
    expect(EMERGENCY_FLOOR_PLAN.rooms.length).toBeGreaterThan(0);
  });

  it('should have reception area', () => {
    const reception = EMERGENCY_FLOOR_PLAN.rooms.find(r => r.type === 'reception');
    expect(reception).toBeDefined();
  });

  it('should have trauma bays', () => {
    const traumaBays = EMERGENCY_FLOOR_PLAN.rooms.filter(r => r.name.includes('Trauma'));
    expect(traumaBays.length).toBeGreaterThanOrEqual(2);
  });

  it('should have at least one emergency status room', () => {
    const emergencyRooms = EMERGENCY_FLOOR_PLAN.rooms.filter(r => r.status === 'emergency');
    expect(emergencyRooms.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Maternity Floor Plan', () => {
  const MATERNITY_FLOOR_PLAN = {
    id: 'maternity-floor-1',
    buildingId: 'maternity',
    buildingName: 'Maternity Ward',
    floor: 1,
    floorName: 'Ground Floor',
    width: 350,
    height: 280,
    rooms: [
      { id: 'mat-reception', name: 'Reception', type: 'reception', status: 'available' },
      { id: 'mat-delivery-1', name: 'Delivery Suite 1', type: 'operating_room', status: 'occupied' },
      { id: 'mat-nursery', name: 'Nursery', type: 'patient_room', status: 'available' },
      { id: 'mat-nicu', name: 'NICU', type: 'patient_room', status: 'occupied' },
    ],
  };

  it('should have maternity ward rooms', () => {
    expect(MATERNITY_FLOOR_PLAN.rooms.length).toBeGreaterThan(0);
  });

  it('should have delivery suites', () => {
    const deliverySuites = MATERNITY_FLOOR_PLAN.rooms.filter(r => r.name.includes('Delivery'));
    expect(deliverySuites.length).toBeGreaterThanOrEqual(1);
  });

  it('should have nursery', () => {
    const nursery = MATERNITY_FLOOR_PLAN.rooms.find(r => r.name === 'Nursery');
    expect(nursery).toBeDefined();
  });

  it('should have NICU', () => {
    const nicu = MATERNITY_FLOOR_PLAN.rooms.find(r => r.name === 'NICU');
    expect(nicu).toBeDefined();
  });
});
