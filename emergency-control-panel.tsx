/**
 * Emergency Control Panel Component
 * 
 * Staff-only emergency broadcast controls:
 * - Staff authentication
 * - Emergency preset selection
 * - Custom message input
 * - Broadcast activation/deactivation
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  StyleSheet,
  Modal,
} from 'react-native';
import { useColors } from '@/hooks/use-colors';
import {
  emergencyBroadcastService,
  EMERGENCY_PRESETS,
  DEMO_STAFF,
  EmergencyPreset,
  StaffCredentials,
} from '@/lib/services/emergency-broadcast.service';

// ============================================================================
// TYPES
// ============================================================================

export interface EmergencyControlPanelProps {
  visible: boolean;
  onClose: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EmergencyControlPanel({ visible, onClose }: EmergencyControlPanelProps) {
  const colors = useColors();
  
  // State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<EmergencyPreset | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [duration, setDuration] = useState('');
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Animations
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 500,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);
  
  useEffect(() => {
    // Check current emergency state
    setIsEmergencyActive(emergencyBroadcastService.isEmergencyActive());
    
    // Subscribe to emergency changes
    const unsubscribe = emergencyBroadcastService.addListener({
      onEmergencyActivate: () => setIsEmergencyActive(true),
      onEmergencyDeactivate: () => setIsEmergencyActive(false),
    });
    
    return unsubscribe;
  }, []);
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleAuthenticate = () => {
    if (selectedStaff && emergencyBroadcastService.authenticateStaff(selectedStaff)) {
      setIsAuthenticated(true);
    }
  };
  
  const handleLogout = () => {
    emergencyBroadcastService.logoutStaff();
    setIsAuthenticated(false);
    setSelectedStaff('');
  };
  
  const handleSelectPreset = (preset: EmergencyPreset) => {
    setSelectedPreset(preset);
    setCustomMessage(preset.message);
  };
  
  const handleActivateEmergency = () => {
    if (!selectedPreset) return;
    setShowConfirmation(true);
  };
  
  const handleConfirmActivation = () => {
    if (!selectedPreset) return;
    
    const durationMinutes = duration ? parseInt(duration, 10) : undefined;
    
    emergencyBroadcastService.activateFromPreset(
      selectedPreset.id,
      ['All Areas'],
      durationMinutes
    );
    
    setShowConfirmation(false);
    setSelectedPreset(null);
    setCustomMessage('');
    setDuration('');
  };
  
  const handleDeactivateEmergency = () => {
    emergencyBroadcastService.deactivateEmergency();
  };
  
  // ============================================================================
  // RENDER HELPERS
  // ============================================================================
  
  const renderAuthScreen = () => (
    <View style={styles.authContainer}>
      <Text style={styles.authIcon}>🔐</Text>
      <Text style={[styles.authTitle, { color: colors.foreground }]}>
        Staff Authentication Required
      </Text>
      <Text style={[styles.authSubtitle, { color: colors.muted }]}>
        Select your staff ID to access emergency controls
      </Text>
      
      <View style={styles.staffList}>
        {DEMO_STAFF.map((staff) => (
          <TouchableOpacity
            key={staff.staffId}
            style={[
              styles.staffItem,
              selectedStaff === staff.staffId && styles.staffItemSelected,
              { borderColor: selectedStaff === staff.staffId ? '#DC2626' : colors.border },
            ]}
            onPress={() => setSelectedStaff(staff.staffId)}
          >
            <Text style={styles.staffIcon}>
              {staff.role === 'doctor' ? '👨‍⚕️' : 
               staff.role === 'nurse' ? '👩‍⚕️' :
               staff.role === 'security' ? '👮' :
               staff.role === 'manager' ? '👔' : '👤'}
            </Text>
            <View style={styles.staffInfo}>
              <Text style={[styles.staffName, { color: colors.foreground }]}>
                {staff.name}
              </Text>
              <Text style={[styles.staffRole, { color: colors.muted }]}>
                {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)} • {staff.department}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      
      <TouchableOpacity
        style={[
          styles.authButton,
          { backgroundColor: selectedStaff ? '#DC2626' : '#666' },
        ]}
        onPress={handleAuthenticate}
        disabled={!selectedStaff}
      >
        <Text style={styles.authButtonText}>🔓 Authenticate</Text>
      </TouchableOpacity>
    </View>
  );
  
  const renderControlPanel = () => {
    const staff = emergencyBroadcastService.getAuthorizedStaff();
    
    return (
      <View style={styles.controlContainer}>
        {/* Staff Info */}
        <View style={[styles.staffBanner, { backgroundColor: colors.surface }]}>
          <Text style={styles.staffBannerIcon}>👤</Text>
          <View style={styles.staffBannerInfo}>
            <Text style={[styles.staffBannerName, { color: colors.foreground }]}>
              {staff?.name}
            </Text>
            <Text style={[styles.staffBannerRole, { color: colors.muted }]}>
              {staff?.department}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        {/* Active Emergency Banner */}
        {isEmergencyActive && (
          <View style={[styles.activeBanner, { backgroundColor: '#DC2626' }]}>
            <Text style={styles.activeBannerIcon}>🚨</Text>
            <Text style={styles.activeBannerText}>EMERGENCY ACTIVE</Text>
            <TouchableOpacity
              style={styles.deactivateButton}
              onPress={handleDeactivateEmergency}
            >
              <Text style={styles.deactivateButtonText}>DEACTIVATE</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Preset Selection */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Emergency Presets
        </Text>
        <ScrollView style={styles.presetList} horizontal={false}>
          {EMERGENCY_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.id}
              style={[
                styles.presetItem,
                selectedPreset?.id === preset.id && styles.presetItemSelected,
                { 
                  borderColor: preset.color,
                  backgroundColor: selectedPreset?.id === preset.id ? preset.color + '20' : 'transparent',
                },
              ]}
              onPress={() => handleSelectPreset(preset)}
            >
              <Text style={styles.presetIcon}>{preset.icon}</Text>
              <View style={styles.presetInfo}>
                <Text style={[styles.presetTitle, { color: colors.foreground }]}>
                  {preset.title}
                </Text>
                <Text style={[styles.presetLevel, { color: preset.color }]}>
                  {preset.level.toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Custom Message */}
        {selectedPreset && (
          <View style={styles.customSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Message (Optional Edit)
            </Text>
            <TextInput
              style={[styles.messageInput, { 
                backgroundColor: colors.surface,
                color: colors.foreground,
                borderColor: colors.border,
              }]}
              value={customMessage}
              onChangeText={setCustomMessage}
              multiline
              numberOfLines={3}
              placeholder="Edit emergency message..."
              placeholderTextColor={colors.muted}
            />
            
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Duration (Optional)
            </Text>
            <TextInput
              style={[styles.durationInput, { 
                backgroundColor: colors.surface,
                color: colors.foreground,
                borderColor: colors.border,
              }]}
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              placeholder="Minutes (leave empty for manual deactivation)"
              placeholderTextColor={colors.muted}
            />
            
            <TouchableOpacity
              style={[styles.activateButton, { backgroundColor: selectedPreset.color }]}
              onPress={handleActivateEmergency}
            >
              <Text style={styles.activateButtonText}>
                🚨 ACTIVATE {selectedPreset.title}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };
  
  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.overlayTouchable} onPress={onClose} />
        
        <Animated.View
          style={[
            styles.panel,
            {
              backgroundColor: colors.background,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={styles.headerIcon}>🚨</Text>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Emergency Broadcast Control
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {/* Content */}
          <ScrollView style={styles.content}>
            {isAuthenticated ? renderControlPanel() : renderAuthScreen()}
          </ScrollView>
        </Animated.View>
        
        {/* Confirmation Modal */}
        {showConfirmation && selectedPreset && (
          <View style={styles.confirmationOverlay}>
            <View style={[styles.confirmationModal, { backgroundColor: colors.background }]}>
              <Text style={styles.confirmationIcon}>⚠️</Text>
              <Text style={[styles.confirmationTitle, { color: colors.foreground }]}>
                Confirm Emergency Activation
              </Text>
              <Text style={[styles.confirmationText, { color: colors.muted }]}>
                You are about to activate: {selectedPreset.title}
              </Text>
              <Text style={[styles.confirmationWarning, { color: '#DC2626' }]}>
                This will broadcast to ALL TV terminals in the hospital.
              </Text>
              <View style={styles.confirmationButtons}>
                <TouchableOpacity
                  style={[styles.confirmButton, { backgroundColor: '#DC2626' }]}
                  onPress={handleConfirmActivation}
                >
                  <Text style={styles.confirmButtonText}>ACTIVATE</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: colors.border }]}
                  onPress={() => setShowConfirmation(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.foreground }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  panel: {
    maxHeight: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
  },
  content: {
    padding: 16,
  },
  
  // Auth Screen
  authContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  authIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  staffList: {
    width: '100%',
    gap: 10,
    marginBottom: 24,
  },
  staffItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  staffItemSelected: {
    backgroundColor: 'rgba(220,38,38,0.1)',
  },
  staffIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 14,
    fontWeight: '600',
  },
  staffRole: {
    fontSize: 12,
    marginTop: 2,
  },
  authButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Control Panel
  controlContainer: {
    paddingBottom: 40,
  },
  staffBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  staffBannerIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  staffBannerInfo: {
    flex: 1,
  },
  staffBannerName: {
    fontSize: 14,
    fontWeight: '600',
  },
  staffBannerRole: {
    fontSize: 12,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  logoutButtonText: {
    fontSize: 12,
    color: '#DC2626',
  },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  activeBannerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  activeBannerText: {
    flex: 1,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  deactivateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  deactivateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  presetList: {
    maxHeight: 200,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    marginBottom: 8,
  },
  presetItemSelected: {
    borderWidth: 3,
  },
  presetIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  presetInfo: {
    flex: 1,
  },
  presetTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  presetLevel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  customSection: {
    marginTop: 16,
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  durationInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  activateButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  activateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Confirmation Modal
  confirmationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationModal: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  confirmationIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmationText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmationWarning: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },
  confirmationButtons: {
    width: '100%',
    gap: 10,
  },
  confirmButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
});

export default EmergencyControlPanel;
