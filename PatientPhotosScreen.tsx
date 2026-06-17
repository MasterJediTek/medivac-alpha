/**
 * Patient Photos Screen
 * Capture, view, and sync patient photos
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  TextInput,
  RefreshControl,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  patientPhotoService,
  PatientPhoto,
  PhotoGallery,
  PhotoType,
  SyncStatus,
  StorageStats,
} from '../services/PatientPhotoService';

export default function PatientPhotosScreen() {
  const colors = useColors();
  const [galleries, setGalleries] = useState<PhotoGallery[]>([]);
  const [selectedGallery, setSelectedGallery] = useState<PhotoGallery | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PatientPhoto | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(patientPhotoService.getSyncStatus());
  const [storageStats, setStorageStats] = useState<StorageStats>(patientPhotoService.getStorageStats());
  const [refreshing, setRefreshing] = useState(false);
  const [showCapture, setShowCapture] = useState(false);
  const [selectedPhotoType, setSelectedPhotoType] = useState<PhotoType>('progress');
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');

  // Load data
  const loadData = useCallback(() => {
    setGalleries(patientPhotoService.getAllGalleries());
    setStorageStats(patientPhotoService.getStorageStats());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Subscribe to sync status
  useEffect(() => {
    const unsubscribe = patientPhotoService.subscribe((status) => {
      setSyncStatus(status);
      setStorageStats(patientPhotoService.getStorageStats());
    });
    return unsubscribe;
  }, []);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }, [loadData]);

  // Capture photo
  const handleCapturePhoto = async () => {
    if (!patientId || !patientName) {
      Alert.alert('Error', 'Please enter patient ID and name');
      return;
    }

    try {
      const photo = await patientPhotoService.capturePhoto(
        patientId,
        patientName,
        selectedPhotoType,
        'Current User',
        { clinicalNotes }
      );

      loadData();
      setShowCapture(false);
      setPatientId('');
      setPatientName('');
      setClinicalNotes('');

      Alert.alert(
        'Photo Captured',
        `Photo saved and compressed.\nOriginal: ${patientPhotoService.formatFileSize(photo.originalSize)}\nCompressed: ${patientPhotoService.formatFileSize(photo.compressedSize || 0)}\nSaved: ${Math.round((photo.compressionRatio || 0) * 100)}%`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  // Sync photos
  const handleSync = async () => {
    try {
      await patientPhotoService.syncPhotos();
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to sync photos');
    }
  };

  // Delete photo
  const handleDeletePhoto = (photo: PatientPhoto) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await patientPhotoService.deletePhoto(photo.id);
            loadData();
            setSelectedPhoto(null);
            if (selectedGallery) {
              const updatedGallery = patientPhotoService.getGallery(selectedGallery.patientId);
              setSelectedGallery(updatedGallery || null);
            }
          },
        },
      ]
    );
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'synced': return colors.success;
      case 'syncing': return colors.primary;
      case 'cached': return colors.warning;
      case 'error': return colors.error;
      default: return colors.muted;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'synced': return '☁️';
      case 'syncing': return '🔄';
      case 'cached': return '💾';
      case 'error': return '⚠️';
      default: return '📷';
    }
  };

  // Get photo type icon
  const getPhotoTypeIcon = (type: PhotoType): string => {
    switch (type) {
      case 'profile': return '👤';
      case 'wound': return '🩹';
      case 'skin_condition': return '🔬';
      case 'surgical_site': return '🏥';
      case 'diagnostic': return '📊';
      case 'progress': return '📈';
      case 'consent_form': return '📝';
      case 'id_document': return '🪪';
      default: return '📷';
    }
  };

  // Render gallery card
  const renderGalleryCard = ({ item }: { item: PhotoGallery }) => (
    <TouchableOpacity
      style={[styles.galleryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => setSelectedGallery(item)}
    >
      {/* Thumbnail Grid */}
      <View style={styles.thumbnailGrid}>
        {item.photos.slice(0, 4).map((photo, index) => (
          <View
            key={photo.id}
            style={[
              styles.thumbnail,
              { backgroundColor: colors.primary + '20' },
              index === 0 && styles.thumbnailLarge,
            ]}
          >
            <Text style={styles.thumbnailIcon}>{getPhotoTypeIcon(photo.type)}</Text>
          </View>
        ))}
        {item.photos.length > 4 && (
          <View style={[styles.thumbnailMore, { backgroundColor: colors.muted + '30' }]}>
            <Text style={[styles.thumbnailMoreText, { color: colors.foreground }]}>
              +{item.photos.length - 4}
            </Text>
          </View>
        )}
      </View>

      {/* Gallery Info */}
      <View style={styles.galleryInfo}>
        <Text style={[styles.galleryName, { color: colors.foreground }]}>
          {item.patientName}
        </Text>
        <Text style={[styles.galleryMeta, { color: colors.muted }]}>
          {item.totalPhotos} photo{item.totalPhotos !== 1 ? 's' : ''} • {patientPhotoService.formatFileSize(item.totalSize)}
        </Text>
        <Text style={[styles.galleryDate, { color: colors.muted }]}>
          Updated {patientPhotoService.formatDate(item.lastUpdated)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Render photo item
  const renderPhotoItem = ({ item }: { item: PatientPhoto }) => (
    <TouchableOpacity
      style={[styles.photoItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => setSelectedPhoto(item)}
    >
      <View style={[styles.photoThumbnail, { backgroundColor: colors.primary + '15' }]}>
        <Text style={styles.photoIcon}>{getPhotoTypeIcon(item.type)}</Text>
        <View style={[styles.photoStatusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.photoStatusIcon}>{getStatusIcon(item.status)}</Text>
        </View>
      </View>
      <View style={styles.photoInfo}>
        <Text style={[styles.photoType, { color: colors.foreground }]}>
          {patientPhotoService.getPhotoTypeLabel(item.type)}
        </Text>
        <Text style={[styles.photoSize, { color: colors.muted }]}>
          {patientPhotoService.formatFileSize(item.compressedSize || item.originalSize)}
        </Text>
        <Text style={[styles.photoDate, { color: colors.muted }]}>
          {patientPhotoService.formatDate(item.capturedAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Patient Photos
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Capture and sync clinical photos
          </Text>
        </View>

        {/* Sync Status Card */}
        <View style={[styles.syncCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.syncHeader}>
            <View style={styles.syncStatus}>
              <View style={[
                styles.syncDot,
                { backgroundColor: syncStatus.isOnline ? colors.success : colors.error }
              ]} />
              <Text style={[styles.syncStatusText, { color: colors.foreground }]}>
                {syncStatus.isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.syncButton,
                { backgroundColor: colors.primary, opacity: syncStatus.isSyncing ? 0.7 : 1 }
              ]}
              onPress={handleSync}
              disabled={syncStatus.isSyncing}
            >
              <Text style={styles.syncButtonText}>
                {syncStatus.isSyncing ? 'Syncing...' : 'Sync Now'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sync Progress */}
          {syncStatus.pendingCount > 0 && (
            <View style={styles.syncProgress}>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${Math.max(5, (syncStatus.bytesUploaded / (syncStatus.bytesUploaded + syncStatus.bytesRemaining)) * 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.syncProgressText, { color: colors.muted }]}>
                {syncStatus.pendingCount} photo{syncStatus.pendingCount !== 1 ? 's' : ''} pending
              </Text>
            </View>
          )}

          {/* Storage Stats */}
          <View style={styles.storageStats}>
            <View style={styles.storageStat}>
              <Text style={[styles.storageValue, { color: colors.foreground }]}>
                {storageStats.totalPhotos}
              </Text>
              <Text style={[styles.storageLabel, { color: colors.muted }]}>Photos</Text>
            </View>
            <View style={styles.storageStat}>
              <Text style={[styles.storageValue, { color: colors.success }]}>
                {storageStats.syncedCount}
              </Text>
              <Text style={[styles.storageLabel, { color: colors.muted }]}>Synced</Text>
            </View>
            <View style={styles.storageStat}>
              <Text style={[styles.storageValue, { color: colors.warning }]}>
                {storageStats.pendingSyncCount}
              </Text>
              <Text style={[styles.storageLabel, { color: colors.muted }]}>Pending</Text>
            </View>
            <View style={styles.storageStat}>
              <Text style={[styles.storageValue, { color: colors.foreground }]}>
                {patientPhotoService.formatFileSize(storageStats.totalSize)}
              </Text>
              <Text style={[styles.storageLabel, { color: colors.muted }]}>Used</Text>
            </View>
          </View>
        </View>

        {/* Capture Button */}
        <TouchableOpacity
          style={[styles.captureButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowCapture(true)}
        >
          <Text style={styles.captureButtonIcon}>📷</Text>
          <Text style={styles.captureButtonText}>Capture New Photo</Text>
        </TouchableOpacity>

        {/* Galleries */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Patient Galleries
          </Text>
          
          {galleries.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.emptyIcon}>📸</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                No photos yet
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.muted }]}>
                Capture your first patient photo
              </Text>
            </View>
          ) : (
            <FlatList
              data={galleries}
              keyExtractor={(item) => item.patientId}
              renderItem={renderGalleryCard}
              scrollEnabled={false}
            />
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Capture Modal */}
      <Modal
        visible={showCapture}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCapture(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Capture Photo
            </Text>
            <TouchableOpacity onPress={() => setShowCapture(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.captureForm}>
            {/* Patient ID */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Patient ID *</Text>
              <TextInput
                style={[styles.formInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={patientId}
                onChangeText={setPatientId}
                placeholder="Enter patient ID"
                placeholderTextColor={colors.muted}
              />
            </View>

            {/* Patient Name */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Patient Name *</Text>
              <TextInput
                style={[styles.formInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={patientName}
                onChangeText={setPatientName}
                placeholder="Enter patient name"
                placeholderTextColor={colors.muted}
              />
            </View>

            {/* Photo Type */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Photo Type</Text>
              <View style={styles.photoTypeGrid}>
                {patientPhotoService.getPhotoTypes().map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.photoTypeOption,
                      { borderColor: colors.border },
                      selectedPhotoType === type.value && { borderColor: colors.primary, backgroundColor: colors.primary + '15' }
                    ]}
                    onPress={() => setSelectedPhotoType(type.value)}
                  >
                    <Text style={styles.photoTypeIcon}>{getPhotoTypeIcon(type.value)}</Text>
                    <Text style={[styles.photoTypeLabel, { color: colors.foreground }]} numberOfLines={1}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Clinical Notes */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Clinical Notes</Text>
              <TextInput
                style={[styles.formTextarea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={clinicalNotes}
                onChangeText={setClinicalNotes}
                placeholder="Add clinical notes..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Simulated Camera View */}
            <View style={[styles.cameraPreview, { backgroundColor: '#000' }]}>
              <Text style={styles.cameraText}>Camera Preview</Text>
              <Text style={styles.cameraHint}>(Simulated for demo)</Text>
            </View>

            {/* Capture Button */}
            <TouchableOpacity
              style={[styles.capturePhotoButton, { backgroundColor: colors.primary }]}
              onPress={handleCapturePhoto}
            >
              <Text style={styles.capturePhotoButtonText}>📷 Capture Photo</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Gallery Modal */}
      <Modal
        visible={!!selectedGallery}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedGallery(null)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {selectedGallery?.patientName}
            </Text>
            <TouchableOpacity onPress={() => setSelectedGallery(null)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>

          {selectedGallery && (
            <FlatList
              data={selectedGallery.photos}
              keyExtractor={(item) => item.id}
              renderItem={renderPhotoItem}
              contentContainerStyle={styles.photoList}
            />
          )}
        </View>
      </Modal>

      {/* Photo Detail Modal */}
      <Modal
        visible={!!selectedPhoto}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Photo Details
            </Text>
            <TouchableOpacity onPress={() => setSelectedPhoto(null)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>

          {selectedPhoto && (
            <ScrollView style={styles.photoDetail}>
              {/* Photo Preview */}
              <View style={[styles.photoPreview, { backgroundColor: colors.primary + '15' }]}>
                <Text style={styles.photoPreviewIcon}>{getPhotoTypeIcon(selectedPhoto.type)}</Text>
                <View style={[styles.photoPreviewStatus, { backgroundColor: getStatusColor(selectedPhoto.status) }]}>
                  <Text style={styles.photoPreviewStatusText}>
                    {selectedPhoto.status.charAt(0).toUpperCase() + selectedPhoto.status.slice(1)}
                  </Text>
                </View>
              </View>

              {/* Photo Info */}
              <View style={[styles.photoInfoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.muted }]}>Type</Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]}>
                    {patientPhotoService.getPhotoTypeLabel(selectedPhoto.type)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.muted }]}>Patient</Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]}>
                    {selectedPhoto.patientName}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.muted }]}>Captured</Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]}>
                    {patientPhotoService.formatDate(selectedPhoto.capturedAt)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.muted }]}>Original Size</Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]}>
                    {patientPhotoService.formatFileSize(selectedPhoto.originalSize)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.muted }]}>Compressed</Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]}>
                    {patientPhotoService.formatFileSize(selectedPhoto.compressedSize || 0)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.muted }]}>Saved</Text>
                  <Text style={[styles.infoValue, { color: colors.success }]}>
                    {Math.round((selectedPhoto.compressionRatio || 0) * 100)}%
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.muted }]}>Dimensions</Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]}>
                    {selectedPhoto.width} × {selectedPhoto.height}
                  </Text>
                </View>
                {selectedPhoto.syncedAt && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.muted }]}>Synced</Text>
                    <Text style={[styles.infoValue, { color: colors.foreground }]}>
                      {patientPhotoService.formatDate(selectedPhoto.syncedAt)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Clinical Notes */}
              {selectedPhoto.metadata.clinicalNotes && (
                <View style={[styles.notesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.notesTitle, { color: colors.foreground }]}>Clinical Notes</Text>
                  <Text style={[styles.notesText, { color: colors.muted }]}>
                    {selectedPhoto.metadata.clinicalNotes}
                  </Text>
                </View>
              )}

              {/* Actions */}
              <View style={styles.photoActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.error }]}
                  onPress={() => handleDeletePhoto(selectedPhoto)}
                >
                  <Text style={styles.actionButtonText}>Delete Photo</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  syncCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  syncHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  syncStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  syncButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  syncButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  syncProgress: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  syncProgressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  storageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  storageStat: {
    alignItems: 'center',
  },
  storageValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  storageLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  captureButtonIcon: {
    fontSize: 24,
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyState: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  galleryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
  },
  thumbnailGrid: {
    width: 80,
    height: 80,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    marginRight: 12,
  },
  thumbnail: {
    width: 38,
    height: 38,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailLarge: {
    width: 80,
    height: 38,
  },
  thumbnailIcon: {
    fontSize: 16,
  },
  thumbnailMore: {
    width: 38,
    height: 38,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailMoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  galleryInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  galleryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  galleryMeta: {
    fontSize: 13,
    marginBottom: 2,
  },
  galleryDate: {
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  captureForm: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  formTextarea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  photoTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoTypeOption: {
    width: '31%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  photoTypeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  photoTypeLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  cameraPreview: {
    height: 200,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cameraText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  cameraHint: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },
  capturePhotoButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  capturePhotoButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  photoList: {
    padding: 16,
  },
  photoItem: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  photoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  photoIcon: {
    fontSize: 28,
  },
  photoStatusBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoStatusIcon: {
    fontSize: 10,
  },
  photoInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  photoType: {
    fontSize: 14,
    fontWeight: '500',
  },
  photoSize: {
    fontSize: 12,
    marginTop: 2,
  },
  photoDate: {
    fontSize: 12,
    marginTop: 2,
  },
  photoDetail: {
    padding: 16,
  },
  photoPreview: {
    height: 200,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  photoPreviewIcon: {
    fontSize: 64,
  },
  photoPreviewStatus: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  photoPreviewStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  photoInfoCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  notesCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  photoActions: {
    marginBottom: 32,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  bottomPadding: {
    height: 100,
  },
});
