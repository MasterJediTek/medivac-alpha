/**
 * Patient Photo Service
 * Offline-first patient photos with automatic compression and sync
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Photo status
export type PhotoStatus = 
  | 'captured'
  | 'processing'
  | 'compressed'
  | 'cached'
  | 'syncing'
  | 'synced'
  | 'error';

// Photo type
export type PhotoType = 
  | 'profile'
  | 'wound'
  | 'skin_condition'
  | 'surgical_site'
  | 'diagnostic'
  | 'progress'
  | 'consent_form'
  | 'id_document'
  | 'other';

// Photo annotation
export interface PhotoAnnotation {
  id: string;
  type: 'text' | 'arrow' | 'circle' | 'rectangle' | 'freehand';
  content?: string;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  color: string;
  createdAt: number;
  createdBy: string;
}

// Patient photo
export interface PatientPhoto {
  id: string;
  patientId: string;
  patientName?: string;
  type: PhotoType;
  status: PhotoStatus;
  originalUri: string;
  compressedUri?: string;
  thumbnailUri?: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize?: number;
  compressionRatio?: number;
  annotations: PhotoAnnotation[];
  metadata: PhotoMetadata;
  capturedAt: number;
  capturedBy: string;
  syncedAt?: number;
  cloudUrl?: string;
  isEncrypted: boolean;
  tags: string[];
}

// Photo metadata
export interface PhotoMetadata {
  deviceModel?: string;
  osVersion?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  bodyPart?: string;
  clinicalNotes?: string;
  linkedEncounterId?: string;
  linkedNoteId?: string;
}

// Photo gallery
export interface PhotoGallery {
  patientId: string;
  patientName: string;
  photos: PatientPhoto[];
  totalPhotos: number;
  totalSize: number;
  lastUpdated: number;
}

// Compression settings
export interface CompressionSettings {
  quality: number; // 0-1
  maxWidth: number;
  maxHeight: number;
  format: 'jpeg' | 'png' | 'webp';
  generateThumbnail: boolean;
  thumbnailSize: number;
}

// Sync settings
export interface SyncSettings {
  autoSync: boolean;
  syncOnWifiOnly: boolean;
  syncInterval: number;
  retryAttempts: number;
  retryDelay: number;
  encryptBeforeSync: boolean;
}

// Sync status
export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime?: number;
  lastError?: string;
  bytesUploaded: number;
  bytesRemaining: number;
}

// Storage stats
export interface StorageStats {
  totalPhotos: number;
  totalSize: number;
  cachedSize: number;
  pendingSyncCount: number;
  syncedCount: number;
  storageLimit: number;
  storageUsedPercent: number;
}

class PatientPhotoService {
  private photos: Map<string, PatientPhoto> = new Map();
  private galleries: Map<string, PhotoGallery> = new Map();
  private compressionSettings: CompressionSettings;
  private syncSettings: SyncSettings;
  private syncStatus: SyncStatus;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  constructor() {
    this.compressionSettings = this.getDefaultCompressionSettings();
    this.syncSettings = this.getDefaultSyncSettings();
    this.syncStatus = {
      isOnline: true,
      isSyncing: false,
      pendingCount: 0,
      bytesUploaded: 0,
      bytesRemaining: 0,
    };
    this.loadState();
    this.startSyncTimer();
  }

  // Get default compression settings
  private getDefaultCompressionSettings(): CompressionSettings {
    return {
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1920,
      format: 'jpeg',
      generateThumbnail: true,
      thumbnailSize: 200,
    };
  }

  // Get default sync settings
  private getDefaultSyncSettings(): SyncSettings {
    return {
      autoSync: true,
      syncOnWifiOnly: true,
      syncInterval: 60000, // 1 minute
      retryAttempts: 3,
      retryDelay: 5000,
      encryptBeforeSync: true,
    };
  }

  // Get compression settings
  getCompressionSettings(): CompressionSettings {
    return { ...this.compressionSettings };
  }

  // Update compression settings
  async updateCompressionSettings(updates: Partial<CompressionSettings>): Promise<void> {
    this.compressionSettings = { ...this.compressionSettings, ...updates };
    await this.saveSettings();
  }

  // Get sync settings
  getSyncSettings(): SyncSettings {
    return { ...this.syncSettings };
  }

  // Update sync settings
  async updateSyncSettings(updates: Partial<SyncSettings>): Promise<void> {
    this.syncSettings = { ...this.syncSettings, ...updates };
    await this.saveSettings();
    this.restartSyncTimer();
  }

  // Capture photo (simulated - in production would use camera)
  async capturePhoto(
    patientId: string,
    patientName: string,
    type: PhotoType,
    capturedBy: string,
    metadata?: Partial<PhotoMetadata>
  ): Promise<PatientPhoto> {
    const photoId = `photo-${Date.now()}`;
    
    // Simulate photo capture
    const photo: PatientPhoto = {
      id: photoId,
      patientId,
      patientName,
      type,
      status: 'captured',
      originalUri: `file:///photos/${photoId}_original.jpg`,
      width: 3024,
      height: 4032,
      originalSize: 3500000, // ~3.5MB
      annotations: [],
      metadata: {
        deviceModel: 'iPhone 15 Pro',
        osVersion: 'iOS 17.2',
        ...metadata,
      },
      capturedAt: Date.now(),
      capturedBy,
      isEncrypted: false,
      tags: [],
    };

    // Process photo (compress)
    await this.processPhoto(photo);

    // Save to storage
    this.photos.set(photoId, photo);
    this.updateGallery(patientId, patientName, photo);
    await this.saveState();

    // Update sync status
    this.updateSyncStatus();

    return photo;
  }

  // Process photo (compress and generate thumbnail)
  private async processPhoto(photo: PatientPhoto): Promise<void> {
    photo.status = 'processing';

    // Simulate compression
    await new Promise(resolve => setTimeout(resolve, 500));

    // Calculate compressed size (simulated)
    const compressionRatio = this.compressionSettings.quality;
    const compressedSize = Math.floor(photo.originalSize * compressionRatio * 0.3);

    photo.compressedUri = `file:///photos/${photo.id}_compressed.jpg`;
    photo.compressedSize = compressedSize;
    photo.compressionRatio = 1 - (compressedSize / photo.originalSize);
    photo.status = 'compressed';

    // Generate thumbnail
    if (this.compressionSettings.generateThumbnail) {
      photo.thumbnailUri = `file:///photos/${photo.id}_thumbnail.jpg`;
    }

    // Cache locally
    photo.status = 'cached';
  }

  // Add annotation to photo
  async addAnnotation(
    photoId: string,
    annotation: Omit<PhotoAnnotation, 'id' | 'createdAt'>
  ): Promise<PhotoAnnotation | null> {
    const photo = this.photos.get(photoId);
    if (!photo) return null;

    const newAnnotation: PhotoAnnotation = {
      ...annotation,
      id: `annotation-${Date.now()}`,
      createdAt: Date.now(),
    };

    photo.annotations.push(newAnnotation);
    await this.saveState();

    return newAnnotation;
  }

  // Remove annotation
  async removeAnnotation(photoId: string, annotationId: string): Promise<boolean> {
    const photo = this.photos.get(photoId);
    if (!photo) return false;

    const index = photo.annotations.findIndex(a => a.id === annotationId);
    if (index === -1) return false;

    photo.annotations.splice(index, 1);
    await this.saveState();

    return true;
  }

  // Update photo metadata
  async updatePhotoMetadata(
    photoId: string,
    updates: Partial<PhotoMetadata>
  ): Promise<PatientPhoto | null> {
    const photo = this.photos.get(photoId);
    if (!photo) return null;

    photo.metadata = { ...photo.metadata, ...updates };
    await this.saveState();

    return photo;
  }

  // Add tags to photo
  async addTags(photoId: string, tags: string[]): Promise<PatientPhoto | null> {
    const photo = this.photos.get(photoId);
    if (!photo) return null;

    const uniqueTags = [...new Set([...photo.tags, ...tags])];
    photo.tags = uniqueTags;
    await this.saveState();

    return photo;
  }

  // Get photo by ID
  getPhoto(photoId: string): PatientPhoto | undefined {
    return this.photos.get(photoId);
  }

  // Get photos for patient
  getPatientPhotos(patientId: string): PatientPhoto[] {
    return Array.from(this.photos.values())
      .filter(p => p.patientId === patientId)
      .sort((a, b) => b.capturedAt - a.capturedAt);
  }

  // Get photos by type
  getPhotosByType(type: PhotoType): PatientPhoto[] {
    return Array.from(this.photos.values())
      .filter(p => p.type === type)
      .sort((a, b) => b.capturedAt - a.capturedAt);
  }

  // Get all photos
  getAllPhotos(): PatientPhoto[] {
    return Array.from(this.photos.values())
      .sort((a, b) => b.capturedAt - a.capturedAt);
  }

  // Get gallery for patient
  getGallery(patientId: string): PhotoGallery | undefined {
    return this.galleries.get(patientId);
  }

  // Get all galleries
  getAllGalleries(): PhotoGallery[] {
    return Array.from(this.galleries.values())
      .sort((a, b) => b.lastUpdated - a.lastUpdated);
  }

  // Update gallery
  private updateGallery(patientId: string, patientName: string, photo: PatientPhoto): void {
    let gallery = this.galleries.get(patientId);
    
    if (!gallery) {
      gallery = {
        patientId,
        patientName,
        photos: [],
        totalPhotos: 0,
        totalSize: 0,
        lastUpdated: Date.now(),
      };
    }

    gallery.photos.unshift(photo);
    gallery.totalPhotos = gallery.photos.length;
    gallery.totalSize = gallery.photos.reduce((sum, p) => sum + (p.compressedSize || p.originalSize), 0);
    gallery.lastUpdated = Date.now();

    this.galleries.set(patientId, gallery);
  }

  // Delete photo
  async deletePhoto(photoId: string): Promise<boolean> {
    const photo = this.photos.get(photoId);
    if (!photo) return false;

    // Remove from photos
    this.photos.delete(photoId);

    // Update gallery
    const gallery = this.galleries.get(photo.patientId);
    if (gallery) {
      gallery.photos = gallery.photos.filter(p => p.id !== photoId);
      gallery.totalPhotos = gallery.photos.length;
      gallery.totalSize = gallery.photos.reduce((sum, p) => sum + (p.compressedSize || p.originalSize), 0);
      gallery.lastUpdated = Date.now();

      if (gallery.photos.length === 0) {
        this.galleries.delete(photo.patientId);
      }
    }

    await this.saveState();
    this.updateSyncStatus();

    return true;
  }

  // Sync photos to cloud
  async syncPhotos(): Promise<void> {
    if (this.syncStatus.isSyncing) return;

    const pendingPhotos = Array.from(this.photos.values())
      .filter(p => p.status === 'cached' || p.status === 'error');

    if (pendingPhotos.length === 0) return;

    this.syncStatus.isSyncing = true;
    this.syncStatus.pendingCount = pendingPhotos.length;
    this.syncStatus.bytesRemaining = pendingPhotos.reduce(
      (sum, p) => sum + (p.compressedSize || p.originalSize),
      0
    );
    this.notifyListeners();

    for (const photo of pendingPhotos) {
      try {
        photo.status = 'syncing';
        this.notifyListeners();

        // Simulate upload
        await this.uploadPhoto(photo);

        photo.status = 'synced';
        photo.syncedAt = Date.now();
        photo.cloudUrl = `https://cloud.medivac.one/photos/${photo.id}`;

        this.syncStatus.bytesUploaded += photo.compressedSize || photo.originalSize;
        this.syncStatus.bytesRemaining -= photo.compressedSize || photo.originalSize;
        this.syncStatus.pendingCount--;
        this.notifyListeners();
      } catch (error) {
        photo.status = 'error';
        this.syncStatus.lastError = 'Failed to sync photo';
        this.notifyListeners();
      }
    }

    this.syncStatus.isSyncing = false;
    this.syncStatus.lastSyncTime = Date.now();
    await this.saveState();
    this.notifyListeners();
  }

  // Upload photo (simulated)
  private async uploadPhoto(photo: PatientPhoto): Promise<void> {
    // Simulate network delay based on file size
    const uploadTime = Math.min(2000, (photo.compressedSize || photo.originalSize) / 1000);
    await new Promise(resolve => setTimeout(resolve, uploadTime));

    // Simulate occasional failures
    if (Math.random() < 0.05) {
      throw new Error('Network error');
    }
  }

  // Get sync status
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // Update sync status
  private updateSyncStatus(): void {
    const pendingPhotos = Array.from(this.photos.values())
      .filter(p => p.status === 'cached' || p.status === 'error');

    this.syncStatus.pendingCount = pendingPhotos.length;
    this.syncStatus.bytesRemaining = pendingPhotos.reduce(
      (sum, p) => sum + (p.compressedSize || p.originalSize),
      0
    );
    this.notifyListeners();
  }

  // Start sync timer
  private startSyncTimer(): void {
    if (this.syncSettings.autoSync) {
      this.syncTimer = setInterval(() => {
        if (this.syncStatus.isOnline && !this.syncStatus.isSyncing) {
          this.syncPhotos();
        }
      }, this.syncSettings.syncInterval);
    }
  }

  // Restart sync timer
  private restartSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    this.startSyncTimer();
  }

  // Set online status
  setOnlineStatus(isOnline: boolean): void {
    this.syncStatus.isOnline = isOnline;
    this.notifyListeners();

    if (isOnline && this.syncSettings.autoSync) {
      this.syncPhotos();
    }
  }

  // Get storage stats
  getStorageStats(): StorageStats {
    const photos = Array.from(this.photos.values());
    const totalSize = photos.reduce((sum, p) => sum + (p.compressedSize || p.originalSize), 0);
    const cachedSize = photos
      .filter(p => p.status !== 'synced')
      .reduce((sum, p) => sum + (p.compressedSize || p.originalSize), 0);
    const pendingSyncCount = photos.filter(p => p.status === 'cached' || p.status === 'error').length;
    const syncedCount = photos.filter(p => p.status === 'synced').length;
    const storageLimit = 500 * 1024 * 1024; // 500MB

    return {
      totalPhotos: photos.length,
      totalSize,
      cachedSize,
      pendingSyncCount,
      syncedCount,
      storageLimit,
      storageUsedPercent: (totalSize / storageLimit) * 100,
    };
  }

  // Subscribe to sync status updates
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify listeners
  private notifyListeners(): void {
    const status = { ...this.syncStatus };
    this.listeners.forEach(listener => listener(status));
  }

  // Save state
  private async saveState(): Promise<void> {
    try {
      await AsyncStorage.setItem('patient_photos', JSON.stringify(Array.from(this.photos.entries())));
      await AsyncStorage.setItem('photo_galleries', JSON.stringify(Array.from(this.galleries.entries())));
    } catch (error) {
      console.error('Failed to save photo state:', error);
    }
  }

  // Load state
  private async loadState(): Promise<void> {
    try {
      const photosJson = await AsyncStorage.getItem('patient_photos');
      if (photosJson) {
        const entries = JSON.parse(photosJson);
        entries.forEach(([key, value]: [string, PatientPhoto]) => {
          this.photos.set(key, value);
        });
      }

      const galleriesJson = await AsyncStorage.getItem('photo_galleries');
      if (galleriesJson) {
        const entries = JSON.parse(galleriesJson);
        entries.forEach(([key, value]: [string, PhotoGallery]) => {
          this.galleries.set(key, value);
        });
      }

      this.updateSyncStatus();
    } catch (error) {
      console.error('Failed to load photo state:', error);
    }
  }

  // Save settings
  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem('photo_compression_settings', JSON.stringify(this.compressionSettings));
      await AsyncStorage.setItem('photo_sync_settings', JSON.stringify(this.syncSettings));
    } catch (error) {
      console.error('Failed to save photo settings:', error);
    }
  }

  // Get photo type label
  getPhotoTypeLabel(type: PhotoType): string {
    const labels: Record<PhotoType, string> = {
      profile: 'Profile Photo',
      wound: 'Wound Documentation',
      skin_condition: 'Skin Condition',
      surgical_site: 'Surgical Site',
      diagnostic: 'Diagnostic Image',
      progress: 'Progress Photo',
      consent_form: 'Consent Form',
      id_document: 'ID Document',
      other: 'Other',
    };
    return labels[type] || type;
  }

  // Get all photo types
  getPhotoTypes(): { value: PhotoType; label: string }[] {
    return [
      { value: 'profile', label: 'Profile Photo' },
      { value: 'wound', label: 'Wound Documentation' },
      { value: 'skin_condition', label: 'Skin Condition' },
      { value: 'surgical_site', label: 'Surgical Site' },
      { value: 'diagnostic', label: 'Diagnostic Image' },
      { value: 'progress', label: 'Progress Photo' },
      { value: 'consent_form', label: 'Consent Form' },
      { value: 'id_document', label: 'ID Document' },
      { value: 'other', label: 'Other' },
    ];
  }

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Format date
  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }
}

// Export singleton instance
export const patientPhotoService = new PatientPhotoService();
export default patientPhotoService;
