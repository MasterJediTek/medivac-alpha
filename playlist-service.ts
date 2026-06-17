  getPlaylist(playlistId: string): Playlist | null {
    return this.playlists.get(playlistId) || null;
  }

  getPlaylists(options: {
    category?: PlaylistCategory;
    visibility?: PlaylistVisibility;
    createdBy?: string;
    isPublished?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Playlist[] {
    let playlists = Array.from(this.playlists.values());

    if (options.category) {
      playlists = playlists.filter(p => p.category === options.category);
    }
    if (options.visibility) {
      playlists = playlists.filter(p => p.visibility === options.visibility);
    }
    if (options.createdBy) {
      playlists = playlists.filter(p => p.createdBy === options.createdBy);
    }
    if (options.isPublished !== undefined) {
      playlists = playlists.filter(p => p.isPublished === options.isPublished);
    }
    if (options.search) {
      const search = options.search.toLowerCase();
      playlists = playlists.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search) ||
        p.tags.some(t => t.toLowerCase().includes(search))
      );
    }

    playlists.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const { limit = 50, offset = 0 } = options;
    return playlists.slice(offset, offset + limit);
  }

  async updatePlaylist(playlistId: string, updates: Partial<Playlist>): Promise<Playlist | null> {
    const playlist = this.playlists.get(playlistId);
    if (!playlist) return null;

    Object.assign(playlist, updates, { updatedAt: new Date().toISOString() });
    await this.savePlaylists();
    return playlist;
  }

  async deletePlaylist(playlistId: string): Promise<boolean> {
    const deleted = this.playlists.delete(playlistId);
    if (deleted) {
      await this.savePlaylists();
    }
    return deleted;
  }

  async publishPlaylist(playlistId: string): Promise<Playlist | null> {
    const playlist = this.playlists.get(playlistId);
    if (!playlist) return null;

    playlist.isPublished = true;
    playlist.publishedAt = new Date().toISOString();
    playlist.updatedAt = new Date().toISOString();
    await this.savePlaylists();
    return playlist;
  }

  async unpublishPlaylist(playlistId: string): Promise<Playlist | null> {
    const playlist = this.playlists.get(playlistId);
    if (!playlist) return null;

    playlist.isPublished = false;
    playlist.updatedAt = new Date().toISOString();
    await this.savePlaylists();
    return playlist;
  }

  // Item Management
  async addItem(
    playlistId: string,
    reelId: string,
    reelTitle: string,
    reelDuration: number,
    reelCategory: string,
    isRequired: boolean,
    addedBy: string,
    notes?: string
  ): Promise<PlaylistItem | null> {
    const playlist = this.playlists.get(playlistId);
    if (!playlist) return null;

    const item: PlaylistItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reelId,
      reelTitle,
      reelDuration,
      reelCategory,