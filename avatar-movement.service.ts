  };
  
  private listeners: Set<(event: MovementEvent) => void> = new Set();
  private stateListeners: Set<(avatars: MovingAvatar[]) => void> = new Set();
  private animationFrame: number | null = null;
  private frameCounter: number = 0;

  // ============================================================================
  // AVATAR MANAGEMENT
  // ============================================================================

  /**
   * Add a new avatar to the movement system
   */
  addAvatar(avatar: Omit<MovingAvatar, 'isMoving' | 'direction' | 'animationFrame' | 'pathIndex' | 'eta'>): void {
    const movingAvatar: MovingAvatar = {
      ...avatar,
      isMoving: false,
      direction: 'idle',
      animationFrame: 0,
      pathIndex: 0,
      eta: this.calculateETA(avatar.currentPosition, avatar.path, avatar.speed),
    };
    
    this.state.avatars.set(avatar.id, movingAvatar);
    this.notifyStateListeners();
  }

  /**
   * Remove an avatar from the movement system
   */
  removeAvatar(avatarId: string): void {
    this.state.avatars.delete(avatarId);
    this.notifyStateListeners();
  }

  /**
   * Get all avatars
   */
  getAvatars(): MovingAvatar[] {
    return Array.from(this.state.avatars.values());
  }

  /**
   * Get a specific avatar
   */
  getAvatar(avatarId: string): MovingAvatar | undefined {
    return this.state.avatars.get(avatarId);
  }

  // ============================================================================
  // MOVEMENT CONTROL
  // ============================================================================

  /**
   * Set a new path for an avatar
   */
  setPath(avatarId: string, path: Position[], destination: string): void {
    const avatar = this.state.avatars.get(avatarId);
    if (!avatar) return;

    avatar.path = path;
    avatar.pathIndex = 0;
    avatar.destination = destination;
    avatar.targetPosition = path.length > 0 ? path[0] : avatar.currentPosition;
    avatar.eta = this.calculateETA(avatar.currentPosition, path, avatar.speed);
    
    this.emitEvent({
      type: 'path_updated',
      avatarId,
      destination,
      timestamp: Date.now(),
    });
    
    this.notifyStateListeners();
  }

  /**
   * Start movement for an avatar
   */
  startMovement(avatarId: string): void {
    const avatar = this.state.avatars.get(avatarId);
    if (!avatar || avatar.path.length === 0) return;

    avatar.isMoving = true;
    avatar.targetPosition = avatar.path[avatar.pathIndex];
    
    this.emitEvent({
      type: 'avatar_started',
      avatarId,
      position: avatar.currentPosition,
      timestamp: Date.now(),
    });
    
    this.notifyStateListeners();
    
    if (!this.state.isRunning) {
      this.startUpdateLoop();
    }
  }