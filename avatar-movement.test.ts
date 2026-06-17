/**
 * Avatar Movement Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { avatarMovementService } from '../avatar-movement.service';

describe('AvatarMovementService', () => {
  beforeEach(() => {
    avatarMovementService.initializeDemoAvatars();
  });

  afterEach(() => {
    avatarMovementService.destroy();
  });

  describe('initializeDemoAvatars', () => {
    it('should create demo avatars', () => {
      const avatars = avatarMovementService.getAvatars();
      expect(avatars.length).toBeGreaterThan(0);
    });

    it('should create avatars with required properties', () => {
      const avatars = avatarMovementService.getAvatars();
      avatars.forEach(avatar => {
        expect(avatar.id).toBeDefined();
        expect(avatar.name).toBeDefined();
        expect(avatar.type).toBeDefined();
        expect(avatar.currentPosition).toBeDefined();
        expect(avatar.currentPosition.x).toBeDefined();
        expect(avatar.currentPosition.y).toBeDefined();
      });
    });
  });

  describe('getAvatar', () => {
    it('should return avatar by ID', () => {
      const avatars = avatarMovementService.getAvatars();
      if (avatars.length > 0) {
        const avatar = avatarMovementService.getAvatar(avatars[0].id);
        expect(avatar).toBeDefined();
        expect(avatar?.id).toBe(avatars[0].id);
      }
    });

    it('should return undefined for invalid ID', () => {
      const avatar = avatarMovementService.getAvatar('invalid-id');
      expect(avatar).toBeUndefined();
    });
  });

  describe('addAvatar', () => {
    it('should add a new avatar', () => {
      const initialCount = avatarMovementService.getAvatars().length;
      
      avatarMovementService.addAvatar({
        id: 'test-avatar',
        name: 'Test Avatar',
        type: 'visitor',
        icon: '👤',
        currentPosition: { x: 100, y: 100 },
        targetPosition: { x: 100, y: 100 },
        path: [],
        speed: 30,
        destination: 'Reception',
      });
      
      const newCount = avatarMovementService.getAvatars().length;
      expect(newCount).toBe(initialCount + 1);
    });
  });

  describe('removeAvatar', () => {
    it('should remove an avatar', () => {
      const avatars = avatarMovementService.getAvatars();
      if (avatars.length > 0) {
        const initialCount = avatars.length;
        avatarMovementService.removeAvatar(avatars[0].id);
        const newCount = avatarMovementService.getAvatars().length;
        expect(newCount).toBe(initialCount - 1);
      }
    });
  });

  describe('setPath', () => {
    it('should set path for avatar', () => {
      const avatars = avatarMovementService.getAvatars();
      if (avatars.length > 0) {
        const path = [
          { x: 150, y: 100 },
          { x: 200, y: 150 },
          { x: 250, y: 200 },
        ];
        avatarMovementService.setPath(avatars[0].id, path, 'Emergency');
        
        const avatar = avatarMovementService.getAvatar(avatars[0].id);
        expect(avatar?.path).toEqual(path);
        expect(avatar?.destination).toBe('Emergency');
      }
    });
  });

  describe('startMovement', () => {
    it('should start avatar movement', () => {
      const avatars = avatarMovementService.getAvatars();
      if (avatars.length > 0) {
        const path = [{ x: 200, y: 200 }];
        avatarMovementService.setPath(avatars[0].id, path, 'Test');
        avatarMovementService.startMovement(avatars[0].id);
        
        const avatar = avatarMovementService.getAvatar(avatars[0].id);
        expect(avatar?.isMoving).toBe(true);
      }
    });
  });

  describe('stopMovement', () => {
    it('should stop avatar movement', () => {
      const avatars = avatarMovementService.getAvatars();
      if (avatars.length > 0) {
        const path = [{ x: 200, y: 200 }];
        avatarMovementService.setPath(avatars[0].id, path, 'Test');
        avatarMovementService.startMovement(avatars[0].id);
        avatarMovementService.stopMovement(avatars[0].id);
        
        const avatar = avatarMovementService.getAvatar(avatars[0].id);
        expect(avatar?.isMoving).toBe(false);
      }
    });
  });

  describe('state listeners', () => {
    it('should notify listeners on state change', () => {
      let notified = false;
      const unsubscribe = avatarMovementService.onStateChange(() => {
        notified = true;
      });

      // Trigger a state change by adding an avatar
      avatarMovementService.addAvatar({
        id: 'listener-test',
        name: 'Listener Test',
        type: 'visitor',
        icon: '👤',
        currentPosition: { x: 50, y: 50 },
        targetPosition: { x: 50, y: 50 },
        path: [],
        speed: 30,
        destination: 'Test',
      });
      
      expect(notified).toBe(true);
      unsubscribe();
    });
  });

  describe('destroy', () => {
    it('should clean up all resources', () => {
      avatarMovementService.destroy();
      const avatars = avatarMovementService.getAvatars();
      expect(avatars.length).toBe(0);
    });
  });
});
