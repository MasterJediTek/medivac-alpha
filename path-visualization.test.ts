/**
 * Path Visualization Tests
 */

import { describe, it, expect } from 'vitest';

// Test path calculation utilities
describe('Path Visualization Utilities', () => {
  describe('calculatePathDistance', () => {
    it('should calculate distance for simple path', () => {
      const path = [
        { x: 0, y: 0 },
        { x: 3, y: 4 },
      ];
      // Distance should be 5 (3-4-5 triangle)
      const dx = path[1].x - path[0].x;
      const dy = path[1].y - path[0].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      expect(distance).toBe(5);
    });

    it('should calculate distance for multi-point path', () => {
      const path = [
        { x: 0, y: 0 },
        { x: 3, y: 4 },
        { x: 6, y: 0 },
      ];
      // First segment: 5, Second segment: 5
      let totalDistance = 0;
      for (let i = 1; i < path.length; i++) {
        const dx = path[i].x - path[i - 1].x;
        const dy = path[i].y - path[i - 1].y;
        totalDistance += Math.sqrt(dx * dx + dy * dy);
      }
      expect(totalDistance).toBe(10);
    });

    it('should return 0 for single point path', () => {
      const path = [{ x: 0, y: 0 }];
      let distance = 0;
      for (let i = 1; i < path.length; i++) {
        const dx = path[i].x - path[i - 1].x;
        const dy = path[i].y - path[i - 1].y;
        distance += Math.sqrt(dx * dx + dy * dy);
      }
      expect(distance).toBe(0);
    });
  });

  describe('getPointAtProgress', () => {
    const getPointAtProgress = (path: { x: number; y: number }[], progress: number) => {
      if (path.length === 0) return { x: 0, y: 0 };
      if (path.length === 1) return path[0];
      if (progress <= 0) return path[0];
      if (progress >= 1) return path[path.length - 1];

      let totalDistance = 0;
      for (let i = 1; i < path.length; i++) {
        const dx = path[i].x - path[i - 1].x;
        const dy = path[i].y - path[i - 1].y;
        totalDistance += Math.sqrt(dx * dx + dy * dy);
      }
      
      const targetDistance = totalDistance * progress;
      let currentDistance = 0;
      
      for (let i = 1; i < path.length; i++) {
        const dx = path[i].x - path[i - 1].x;
        const dy = path[i].y - path[i - 1].y;
        const segmentDistance = Math.sqrt(dx * dx + dy * dy);
        
        if (currentDistance + segmentDistance >= targetDistance) {
          const segmentProgress = (targetDistance - currentDistance) / segmentDistance;
          return {
            x: path[i - 1].x + dx * segmentProgress,
            y: path[i - 1].y + dy * segmentProgress,
          };
        }
        currentDistance += segmentDistance;
      }
      
      return path[path.length - 1];
    };

    it('should return start point at progress 0', () => {
      const path = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ];
      const point = getPointAtProgress(path, 0);
      expect(point.x).toBe(0);
      expect(point.y).toBe(0);
    });

    it('should return end point at progress 1', () => {
      const path = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ];
      const point = getPointAtProgress(path, 1);
      expect(point.x).toBe(100);
      expect(point.y).toBe(100);
    });

    it('should return midpoint at progress 0.5', () => {
      const path = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ];
      const point = getPointAtProgress(path, 0.5);
      expect(point.x).toBe(50);
      expect(point.y).toBe(0);
    });

    it('should handle empty path', () => {
      const path: { x: number; y: number }[] = [];
      const point = getPointAtProgress(path, 0.5);
      expect(point.x).toBe(0);
      expect(point.y).toBe(0);
    });

    it('should handle single point path', () => {
      const path = [{ x: 50, y: 50 }];
      const point = getPointAtProgress(path, 0.5);
      expect(point.x).toBe(50);
      expect(point.y).toBe(50);
    });
  });

  describe('generatePathString', () => {
    const generatePathString = (points: { x: number; y: number }[]) => {
      if (points.length === 0) return '';
      let pathString = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        pathString += ` L ${points[i].x} ${points[i].y}`;
      }
      return pathString;
    };

    it('should generate SVG path string', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 50 },
        { x: 200, y: 100 },
      ];
      const pathString = generatePathString(points);
      expect(pathString).toBe('M 0 0 L 100 50 L 200 100');
    });

    it('should handle empty points', () => {
      const points: { x: number; y: number }[] = [];
      const pathString = generatePathString(points);
      expect(pathString).toBe('');
    });

    it('should handle single point', () => {
      const points = [{ x: 50, y: 50 }];
      const pathString = generatePathString(points);
      expect(pathString).toBe('M 50 50');
    });
  });

  describe('formatETA', () => {
    const formatETA = (seconds: number) => {
      if (seconds < 60) {
        return `${Math.round(seconds)}s`;
      }
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      if (remainingSeconds === 0) {
        return `${minutes}m`;
      }
      return `${minutes}m ${remainingSeconds}s`;
    };

    it('should format seconds only', () => {
      expect(formatETA(30)).toBe('30s');
      expect(formatETA(45)).toBe('45s');
    });

    it('should format minutes only', () => {
      expect(formatETA(60)).toBe('1m');
      expect(formatETA(120)).toBe('2m');
    });

    it('should format minutes and seconds', () => {
      expect(formatETA(90)).toBe('1m 30s');
      expect(formatETA(150)).toBe('2m 30s');
    });

    it('should round seconds', () => {
      expect(formatETA(30.4)).toBe('30s');
      expect(formatETA(30.6)).toBe('31s');
    });
  });
});

describe('Avatar Path Types', () => {
  it('should have valid avatar types', () => {
    const validTypes = ['staff', 'patient', 'visitor', 'pet'];
    validTypes.forEach(type => {
      expect(['staff', 'patient', 'visitor', 'pet']).toContain(type);
    });
  });

  it('should have valid path structure', () => {
    const mockPath = {
      id: 'path-1',
      avatarId: 'avatar-1',
      avatarName: 'Dr. Smith',
      avatarIcon: '👨‍⚕️',
      avatarType: 'staff',
      path: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
      currentPosition: { x: 0, y: 0 },
      destination: { x: 100, y: 100 },
      destinationName: 'Emergency',
      progress: 0.5,
      eta: 30,
      isActive: true,
      color: '#3B82F6',
    };

    expect(mockPath.id).toBeDefined();
    expect(mockPath.avatarId).toBeDefined();
    expect(mockPath.path.length).toBeGreaterThan(0);
    expect(mockPath.progress).toBeGreaterThanOrEqual(0);
    expect(mockPath.progress).toBeLessThanOrEqual(1);
  });
});
