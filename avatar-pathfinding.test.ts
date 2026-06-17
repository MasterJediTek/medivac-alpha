import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { avatarPathfindingService, HOSPITAL_NODES } from '../avatar-pathfinding.service';

describe('Avatar Pathfinding Service', () => {
  beforeEach(() => {
    // Reset service state
    avatarPathfindingService.stop();
  });

  afterEach(() => {
    avatarPathfindingService.destroy();
  });

  describe('Hospital Nodes', () => {
    it('should have entrance nodes', () => {
      const entrances = HOSPITAL_NODES.filter(n => n.type === 'entrance');
      expect(entrances.length).toBeGreaterThan(0);
    });

    it('should have destination nodes for buildings', () => {
      const destinations = HOSPITAL_NODES.filter(n => n.type === 'destination');
      expect(destinations.length).toBeGreaterThan(0);
      destinations.forEach(dest => {
        expect(dest.buildingId).toBeDefined();
      });
    });

    it('should have intersection nodes for navigation', () => {
      const intersections = HOSPITAL_NODES.filter(n => n.type === 'intersection');
      expect(intersections.length).toBeGreaterThan(0);
    });

    it('should have all nodes connected', () => {
      HOSPITAL_NODES.forEach(node => {
        expect(node.connections.length).toBeGreaterThan(0);
        node.connections.forEach(connId => {
          const connectedNode = HOSPITAL_NODES.find(n => n.id === connId);
          expect(connectedNode).toBeDefined();
        });
      });
    });

    it('should have valid positions for all nodes', () => {
      HOSPITAL_NODES.forEach(node => {
        expect(node.position.x).toBeGreaterThanOrEqual(0);
        expect(node.position.x).toBeLessThanOrEqual(100);
        expect(node.position.y).toBeGreaterThanOrEqual(0);
        expect(node.position.y).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Avatar Registration', () => {
    it('should register an avatar', () => {
      const avatar = {
        id: 'test-avatar',
        name: 'Test Avatar',
        type: 'staff' as const,
        icon: '👩‍⚕️',
        position: { x: 50, y: 50 },
        targetPosition: null,
        currentPath: [],
        pathIndex: 0,
        speed: 5,
        animation: 'idle' as const,
        destinationNodeId: null,
        isMoving: false,
      };
      
      avatarPathfindingService.registerAvatar(avatar);
      const registered = avatarPathfindingService.getAvatar('test-avatar');
      expect(registered).toBeDefined();
      expect(registered?.name).toBe('Test Avatar');
    });

    it('should unregister an avatar', () => {
      const avatar = {
        id: 'test-avatar-2',
        name: 'Test Avatar 2',
        type: 'patient' as const,
        icon: '🧑',
        position: { x: 30, y: 30 },
        targetPosition: null,
        currentPath: [],
        pathIndex: 0,
        speed: 3,
        animation: 'idle' as const,
        destinationNodeId: null,
        isMoving: false,
      };
      
      avatarPathfindingService.registerAvatar(avatar);
      avatarPathfindingService.unregisterAvatar('test-avatar-2');
      const registered = avatarPathfindingService.getAvatar('test-avatar-2');
      expect(registered).toBeUndefined();
    });

    it('should get all avatars', () => {
      const avatar1 = {
        id: 'avatar-a',
        name: 'Avatar A',
        type: 'staff' as const,
        icon: '👨‍⚕️',
        position: { x: 20, y: 20 },
        targetPosition: null,
        currentPath: [],
        pathIndex: 0,
        speed: 5,
        animation: 'idle' as const,
        destinationNodeId: null,
        isMoving: false,
      };
      const avatar2 = {
        id: 'avatar-b',
        name: 'Avatar B',
        type: 'visitor' as const,
        icon: '👤',
        position: { x: 40, y: 40 },
        targetPosition: null,
        currentPath: [],
        pathIndex: 0,
        speed: 4,
        animation: 'idle' as const,
        destinationNodeId: null,
        isMoving: false,
      };
      
      avatarPathfindingService.registerAvatar(avatar1);
      avatarPathfindingService.registerAvatar(avatar2);
      
      const avatars = avatarPathfindingService.getAvatars();
      expect(avatars.length).toBe(2);
    });
  });

  describe('Path Preview', () => {
    it('should calculate path between buildings', () => {
      const path = avatarPathfindingService.getPathPreview('parking', 'main-hospital');
      expect(path).not.toBeNull();
      if (path) {
        expect(path.path.length).toBeGreaterThan(0);
        expect(path.distance).toBeGreaterThan(0);
        expect(path.estimatedTime).toBeGreaterThan(0);
      }
    });

    it('should return null for invalid building IDs', () => {
      const path = avatarPathfindingService.getPathPreview('invalid-building', 'main-hospital');
      expect(path).toBeNull();
    });

    it('should find path from emergency to mental health', () => {
      const path = avatarPathfindingService.getPathPreview('emergency', 'mental-health');
      expect(path).not.toBeNull();
    });
  });

  describe('Event Listeners', () => {
    it('should add and remove listeners', () => {
      const listener = {
        onAvatarMove: vi.fn(),
        onAvatarArrived: vi.fn(),
      };
      
      const unsubscribe = avatarPathfindingService.addListener(listener);
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });

  describe('Service Control', () => {
    it('should start and stop the service', () => {
      avatarPathfindingService.start();
      // Service should be running
      avatarPathfindingService.stop();
      // Service should be stopped
    });

    it('should stop an avatar', () => {
      const avatar = {
        id: 'stop-test',
        name: 'Stop Test',
        type: 'staff' as const,
        icon: '👩‍⚕️',
        position: { x: 50, y: 50 },
        targetPosition: null,
        currentPath: [],
        pathIndex: 0,
        speed: 5,
        animation: 'walking' as const,
        destinationNodeId: null,
        isMoving: true,
      };
      
      avatarPathfindingService.registerAvatar(avatar);
      avatarPathfindingService.stopAvatar('stop-test');
      
      const stoppedAvatar = avatarPathfindingService.getAvatar('stop-test');
      expect(stoppedAvatar?.isMoving).toBe(false);
      expect(stoppedAvatar?.animation).toBe('idle');
    });
  });
});
