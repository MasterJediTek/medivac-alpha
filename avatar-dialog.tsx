/**
 * Avatar Interaction Dialog Component
 * 
 * Shows details when tapping on avatars:
 * - Staff/patient profile details
 * - Current destination and path
 * - Follow avatar feature
 * - Quick actions (message, call)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { useColors } from '@/hooks/use-colors';

// ============================================================================
// TYPES
// ============================================================================

export type AvatarType = 'staff' | 'patient' | 'visitor' | 'pet';
export type StaffRole = 'doctor' | 'nurse' | 'admin' | 'security' | 'maintenance' | 'therapist';
export type PatientStatus = 'admitted' | 'outpatient' | 'emergency' | 'discharged';

export interface AvatarProfile {
  id: string;
  type: AvatarType;
  name: string;
  avatar: string;
  role?: StaffRole;
  department?: string;
  status?: PatientStatus;
  room?: string;
  currentLocation: string;
  destination: string;
  eta: string;
  phone?: string;
  email?: string;
  notes?: string;
  isOnDuty?: boolean;
  shift?: string;
  specialization?: string;
  admissionDate?: string;
  attendingDoctor?: string;
  petType?: string;
  handler?: string;
}

export interface AvatarDialogProps {
  visible: boolean;
  avatar: AvatarProfile | null;
  onClose: () => void;
  onFollow?: (avatarId: string) => void;
  onMessage?: (avatarId: string) => void;
  onCall?: (avatarId: string) => void;
  onNavigateTo?: (location: string) => void;
}

// ============================================================================
// DEMO AVATAR PROFILES
// ============================================================================

export const DEMO_AVATARS: AvatarProfile[] = [
  // Staff
  {
    id: 'staff-001',
    type: 'staff',
    name: 'Dr. Sarah Mitchell',
    avatar: '👩‍⚕️',
    role: 'doctor',
    department: 'Emergency',
    currentLocation: 'Emergency Department',
    destination: 'Medical Ward',
    eta: '3 min',
    phone: '+61 8 9080 5888',
    email: 's.mitchell@krh.health.wa.gov.au',
    isOnDuty: true,
    shift: '07:00 - 19:00',
    specialization: 'Emergency Medicine',
  },
  {
    id: 'staff-002',
    type: 'staff',
    name: 'Nurse James Wilson',
    avatar: '👨‍⚕️',
    role: 'nurse',
    department: 'Medical Ward',
    currentLocation: 'Pharmacy',
    destination: 'Medical Ward',
    eta: '2 min',
    phone: '+61 8 9080 5889',
    email: 'j.wilson@krh.health.wa.gov.au',
    isOnDuty: true,
    shift: '07:00 - 19:00',
  },
  {
    id: 'staff-003',
    type: 'staff',
    name: 'Security Officer Mike',
    avatar: '👮',
    role: 'security',
    department: 'Security',
    currentLocation: 'Main Entrance',
    destination: 'Parking Area',
    eta: '5 min',
    phone: '+61 8 9080 5800',
    isOnDuty: true,
    shift: '06:00 - 18:00',
  },
  {
    id: 'staff-004',
    type: 'staff',
    name: 'Lisa Chen',
    avatar: '👩‍💼',
    role: 'admin',
    department: 'Administration',
    currentLocation: 'Administration',
    destination: 'Reception',
    eta: '1 min',
    phone: '+61 8 9080 5801',
    email: 'l.chen@krh.health.wa.gov.au',
    isOnDuty: true,
    shift: '08:00 - 16:00',
  },
  // Patients
  {
    id: 'patient-001',
    type: 'patient',
    name: 'John Smith',
    avatar: '🧑',
    status: 'admitted',
    room: 'Room 12A',
    currentLocation: 'Radiology',
    destination: 'Medical Ward',
    eta: '10 min',
    admissionDate: '2026-02-03',
    attendingDoctor: 'Dr. Sarah Mitchell',
    notes: 'Post-surgery recovery',
  },
  {
    id: 'patient-002',
    type: 'patient',
    name: 'Mary Johnson',
    avatar: '👵',
    status: 'outpatient',
    currentLocation: 'Pathology',
    destination: 'Exit',
    eta: '15 min',
    attendingDoctor: 'Dr. David Lee',
    notes: 'Routine blood work',
  },
  {
    id: 'patient-003',
    type: 'patient',
    name: 'Emma Davis',
    avatar: '🤰',
    status: 'admitted',
    room: 'Maternity Suite 3',
    currentLocation: 'Maternity Ward',
    destination: 'Maternity Ward',
    eta: 'At destination',
    admissionDate: '2026-02-05',
    attendingDoctor: 'Dr. Rachel Green',
    notes: 'Due date: Feb 8',
  },
  // Visitors
  {
    id: 'visitor-001',
    type: 'visitor',
    name: 'Robert Smith',
    avatar: '👨',
    currentLocation: 'Reception',
    destination: 'Medical Ward',
    eta: '4 min',
    notes: 'Visiting John Smith',
  },
  {
    id: 'visitor-002',
    type: 'visitor',
    name: 'Susan Johnson',
    avatar: '👩',
    currentLocation: 'Cafeteria',
    destination: 'Pathology',
    eta: '6 min',
    notes: 'Accompanying Mary Johnson',
  },
  // Therapy Pets
  {
    id: 'pet-001',
    type: 'pet',
    name: 'Max',
    avatar: '🐕',
    petType: 'Golden Retriever',
    handler: 'Volunteer Sarah',
    currentLocation: 'Paediatrics',
    destination: 'Mental Health',
    eta: '8 min',
    notes: 'Therapy dog - certified',
  },
  {
    id: 'pet-002',
    type: 'pet',
    name: 'Whiskers',
    avatar: '🐈',
    petType: 'Tabby Cat',
    handler: 'Volunteer Tom',
    currentLocation: 'Aged Care',
    destination: 'Aged Care',
    eta: 'At destination',
    notes: 'Therapy cat - gentle',
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function AvatarDialog({
  visible,
  avatar,
  onClose,
  onFollow,
  onMessage,
  onCall,
  onNavigateTo,
}: AvatarDialogProps) {
  const colors = useColors();
  
  // Animations
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // State
  const [isFollowing, setIsFollowing] = useState(false);
  
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
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setIsFollowing(false);
    }
  }, [visible]);
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleFollow = () => {
    if (!avatar) return;
    setIsFollowing(!isFollowing);
    onFollow?.(avatar.id);
  };
  
  const handleMessage = () => {
    if (!avatar) return;
    onMessage?.(avatar.id);
  };
  
  const handleCall = () => {
    if (!avatar) return;
    onCall?.(avatar.id);
  };
  
  const handleNavigateToDestination = () => {
    if (!avatar) return;
    onNavigateTo?.(avatar.destination);
  };
  
  const handleNavigateToLocation = () => {
    if (!avatar) return;
    onNavigateTo?.(avatar.currentLocation);
  };
  
  // ============================================================================
  // RENDER HELPERS
  // ============================================================================
  
  const getTypeColor = (type: AvatarType): string => {
    switch (type) {
      case 'staff': return '#3B82F6';
      case 'patient': return '#10B981';
      case 'visitor': return '#8B5CF6';
      case 'pet': return '#F59E0B';
      default: return colors.primary;
    }
  };
  
  const getTypeLabel = (type: AvatarType): string => {
    switch (type) {
      case 'staff': return 'Staff Member';
      case 'patient': return 'Patient';
      case 'visitor': return 'Visitor';
      case 'pet': return 'Therapy Pet';
      default: return 'Unknown';
    }
  };
  
  const getRoleIcon = (role?: StaffRole): string => {
    switch (role) {
      case 'doctor': return '🩺';
      case 'nurse': return '💉';
      case 'admin': return '📋';
      case 'security': return '🔒';
      case 'maintenance': return '🔧';
      case 'therapist': return '🧠';
      default: return '👤';
    }
  };
  
  const getStatusColor = (status?: PatientStatus): string => {
    switch (status) {
      case 'admitted': return '#3B82F6';
      case 'outpatient': return '#10B981';
      case 'emergency': return '#EF4444';
      case 'discharged': return '#6B7280';
      default: return colors.muted;
    }
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  if (!visible || !avatar) return null;
  
  const typeColor = getTypeColor(avatar.type);
  
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
            styles.dialog,
            {
              backgroundColor: colors.background,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={[styles.avatarLarge, { backgroundColor: typeColor + '20' }]}>
              <Text style={styles.avatarEmoji}>{avatar.avatar}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.name, { color: colors.foreground }]}>
                {avatar.name}
              </Text>
              <View style={styles.typeRow}>
                <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
                  <Text style={styles.typeBadgeText}>
                    {getTypeLabel(avatar.type)}
                  </Text>
                </View>
                {avatar.role && (
                  <Text style={[styles.roleText, { color: colors.muted }]}>
                    {getRoleIcon(avatar.role)} {avatar.role.charAt(0).toUpperCase() + avatar.role.slice(1)}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {/* Content */}
          <ScrollView style={styles.content}>
            {/* Location Info */}
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                📍 Location
              </Text>
              <View style={styles.locationRow}>
                <View style={styles.locationItem}>
                  <Text style={[styles.locationLabel, { color: colors.muted }]}>
                    Current
                  </Text>
                  <TouchableOpacity onPress={handleNavigateToLocation}>
                    <Text style={[styles.locationValue, { color: colors.primary }]}>
                      {avatar.currentLocation}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.locationArrow}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
                <View style={styles.locationItem}>
                  <Text style={[styles.locationLabel, { color: colors.muted }]}>
                    Destination
                  </Text>
                  <TouchableOpacity onPress={handleNavigateToDestination}>
                    <Text style={[styles.locationValue, { color: colors.primary }]}>
                      {avatar.destination}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.etaRow}>
                <Text style={styles.etaIcon}>⏱️</Text>
                <Text style={[styles.etaText, { color: colors.foreground }]}>
                  ETA: {avatar.eta}
                </Text>
              </View>
            </View>
            
            {/* Staff Details */}
            {avatar.type === 'staff' && (
              <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  👤 Staff Details
                </Text>
                {avatar.department && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.muted }]}>
                      Department
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.foreground }]}>
                      {avatar.department}
                    </Text>
                  </View>
                )}
                {avatar.specialization && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.muted }]}>
                      Specialization
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.foreground }]}>
                      {avatar.specialization}
                    </Text>
                  </View>
                )}
                {avatar.shift && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.muted }]}>
                      Shift
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.foreground }]}>
                      {avatar.shift}
                    </Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>
                    Status
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: avatar.isOnDuty ? '#10B981' : '#6B7280' }
                  ]}>
                    <Text style={styles.statusBadgeText}>
                      {avatar.isOnDuty ? 'On Duty' : 'Off Duty'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            
            {/* Patient Details */}
            {avatar.type === 'patient' && (
              <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  🏥 Patient Details
                </Text>
                {avatar.status && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.muted }]}>
                      Status
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(avatar.status) }
                    ]}>
                      <Text style={styles.statusBadgeText}>
                        {avatar.status.charAt(0).toUpperCase() + avatar.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                )}
                {avatar.room && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.muted }]}>
                      Room
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.foreground }]}>
                      {avatar.room}
                    </Text>
                  </View>
                )}
                {avatar.attendingDoctor && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.muted }]}>
                      Attending
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.foreground }]}>
                      {avatar.attendingDoctor}
                    </Text>
                  </View>
                )}
                {avatar.admissionDate && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.muted }]}>
                      Admitted
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.foreground }]}>
                      {avatar.admissionDate}
                    </Text>
                  </View>
                )}
              </View>
            )}
            
            {/* Pet Details */}
            {avatar.type === 'pet' && (
              <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  🐾 Pet Details
                </Text>
                {avatar.petType && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.muted }]}>
                      Breed
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.foreground }]}>
                      {avatar.petType}
                    </Text>
                  </View>
                )}
                {avatar.handler && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.muted }]}>
                      Handler
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.foreground }]}>
                      {avatar.handler}
                    </Text>
                  </View>
                )}
              </View>
            )}
            
            {/* Notes */}
            {avatar.notes && (
              <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  📝 Notes
                </Text>
                <Text style={[styles.notesText, { color: colors.muted }]}>
                  {avatar.notes}
                </Text>
              </View>
            )}
          </ScrollView>
          
          {/* Actions */}
          <View style={[styles.actions, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.followButton,
                { backgroundColor: isFollowing ? '#10B981' : '#3B82F6' }
              ]}
              onPress={handleFollow}
            >
              <Text style={styles.actionButtonText}>
                {isFollowing ? '✓ Following' : '👁️ Follow'}
              </Text>
            </TouchableOpacity>
            
            {(avatar.type === 'staff' || avatar.phone) && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#8B5CF6' }]}
                  onPress={handleMessage}
                >
                  <Text style={styles.actionButtonText}>💬 Message</Text>
                </TouchableOpacity>
                
                {avatar.phone && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#10B981' }]}
                    onPress={handleCall}
                  >
                    <Text style={styles.actionButtonText}>📞 Call</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </Animated.View>
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
  dialog: {
    maxHeight: '80%',
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
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  roleText: {
    fontSize: 12,
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
  section: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationItem: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  locationValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  locationArrow: {
    paddingHorizontal: 12,
  },
  arrowText: {
    fontSize: 18,
    color: '#888',
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  etaIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  etaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  notesText: {
    fontSize: 13,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  followButton: {},
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
});

export default AvatarDialog;
