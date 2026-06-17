/**
 * Visitor Check-In Kiosk Mode - v9.19
 * Full-screen kiosk mode for lobby tablets.
 * Features: visitor registration, pass generation, QR code, printed directions.
 * Auto-resets after 60 seconds of inactivity.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  VisitorCheckInService,
  type CheckInFormData,
  type VisitorPass,
  type KioskState,
} from '@/lib/services/visitor-checkin.service';
import { VisitorHistoryService, type ReturningVisitor } from '@/lib/services/visitor-history.service';

const { width: SW, height: SH } = Dimensions.get('window');

const DEPARTMENTS = [
  { id: 'emergency', name: 'Emergency Dept', icon: '🚨' },
  { id: 'maternity', name: 'Maternity Ward', icon: '👶' },
  { id: 'icu', name: 'ICU', icon: '❤️‍🩹' },
  { id: 'surgical', name: 'Surgical Ward', icon: '🔪' },
  { id: 'paediatrics', name: 'Paediatrics', icon: '🧸' },
  { id: 'radiology', name: 'Radiology', icon: '📷' },
  { id: 'pathology', name: 'Pathology Lab', icon: '🔬' },
  { id: 'pharmacy', name: 'Pharmacy', icon: '💊' },
  { id: 'mental-health', name: 'Mental Health', icon: '🧠' },
  { id: 'physiotherapy', name: 'Physiotherapy', icon: '🏃' },
  { id: 'cafeteria', name: 'Cafeteria', icon: '🍽️' },
  { id: 'main-hospital', name: 'Main Hospital', icon: '🏥' },
];

export default function KioskCheckInScreen() {
  const colors = useColors();
  const serviceRef = useRef<VisitorCheckInService | null>(null);
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [kioskState, setKioskState] = useState<KioskState>('idle');
  const [formData, setFormData] = useState<Partial<CheckInFormData>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [generatedPass, setGeneratedPass] = useState<VisitorPass | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [returningVisitors, setReturningVisitors] = useState<ReturningVisitor[]>([]);
  const [showReturning, setShowReturning] = useState(false);
  const historyRef = useRef<VisitorHistoryService | null>(null);

  useEffect(() => {
    serviceRef.current = VisitorCheckInService.getInstance();
    historyRef.current = VisitorHistoryService.getInstance();
    setReturningVisitors(historyRef.current.getFrequentVisitors(1));
    return () => {
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
    };
  }, []);

  // Auto-reset countdown
  useEffect(() => {
    if (kioskState === 'pass_generated') {
      setCountdown(60);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            resetKiosk();
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [kioskState]);

  // Inactivity timer for form state
  useEffect(() => {
    if (kioskState === 'form' || kioskState === 'confirming') {
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
      inactivityRef.current = setTimeout(() => {
        resetKiosk();
      }, 60000);
      return () => {
        if (inactivityRef.current) clearTimeout(inactivityRef.current);
      };
    }
  }, [kioskState, formData]);

  const resetInactivity = useCallback(() => {
    if (inactivityRef.current) clearTimeout(inactivityRef.current);
    if (kioskState === 'form' || kioskState === 'confirming') {
      inactivityRef.current = setTimeout(() => {
        resetKiosk();
      }, 60000);
    }
  }, [kioskState]);

  const resetKiosk = useCallback(() => {
    setKioskState('idle');
    setFormData({});
    setErrors([]);
    setGeneratedPass(null);
    setCountdown(60);
  }, []);

  const startCheckIn = useCallback(() => {
    setKioskState('form');
    setFormData({});
    setErrors([]);
  }, []);

  const handleSubmit = useCallback(() => {
    const service = serviceRef.current;
    if (!service) return;

    const validation = service.validateForm(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setKioskState('confirming');
    setErrors([]);
  }, [formData]);

  const confirmCheckIn = useCallback(() => {
    const service = serviceRef.current;
    if (!service) return;

    const pass = service.checkIn(formData as CheckInFormData);
    setGeneratedPass(pass);
    setKioskState('pass_generated');

    // Save to visitor history
    const history = historyRef.current;
    if (history) {
      const dept = DEPARTMENTS.find(d => d.id === formData.destinationDepartment);
      history.addRecord({
        visitorName: formData.visitorName || '',
        purpose: formData.purpose || '',
        purposeLabel: formData.purpose === 'patient_visit' ? 'Patient Visit' : formData.purpose === 'appointment' ? 'Appointment' : formData.purpose === 'delivery' ? 'Delivery' : 'Other',
        destinationDepartment: dept?.name || formData.destinationDepartment || '',
        destinationFloor: 'Ground',
        patientName: formData.patientName,
        passNumber: pass.passNumber,
        checkInTime: pass.issuedAt,
        checkOutTime: null,
      });
      setReturningVisitors(history.getFrequentVisitors(1));
    }
  }, [formData]);

  const quickCheckIn = useCallback((visitor: ReturningVisitor) => {
    setFormData({
      visitorName: visitor.visitorName,
      purpose: visitor.lastPurpose as any,
      destinationDepartment: DEPARTMENTS.find(d => d.name === visitor.lastDepartment)?.id || '',
      patientName: visitor.lastPatientName,
    });
    setShowReturning(false);
    setKioskState('form');
  }, []);

  const textScale = largeText ? 1.3 : 1;
  const bg = highContrast ? '#000' : colors.background;
  const fg = highContrast ? '#FFF' : colors.foreground;
  const accent = highContrast ? '#FFD700' : colors.primary;
  const surface = highContrast ? '#222' : colors.surface;
  const muted = highContrast ? '#CCC' : colors.muted;

  // ============================================================
  // IDLE SCREEN
  // ============================================================
  if (kioskState === 'idle') {
    return (
      <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
        <View style={[styles.idleContainer, { backgroundColor: bg }]}>
          {/* Accessibility controls */}
          <View style={styles.accessRow}>
            <TouchableOpacity
              style={[styles.accessBtn, { backgroundColor: surface }]}
              onPress={() => setHighContrast(!highContrast)}
            >
              <Text style={[styles.accessBtnText, { color: fg }]}>
                {highContrast ? '◐ Normal' : '◑ High Contrast'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.accessBtn, { backgroundColor: surface }]}
              onPress={() => setLargeText(!largeText)}
            >
              <Text style={[styles.accessBtnText, { color: fg }]}>
                {largeText ? 'Aa Normal' : 'AA Large Text'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.idleContent}>
            <Text style={[styles.idleIcon]}>🏥</Text>
            <Text style={[styles.idleTitle, { color: fg, fontSize: 36 * textScale }]}>
              Welcome to{'\n'}MediVac WACHS
            </Text>
            <Text style={[styles.idleSubtitle, { color: muted, fontSize: 18 * textScale }]}>
              Visitor Check-In Kiosk
            </Text>

            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: accent }]}
              onPress={startCheckIn}
              activeOpacity={0.8}
            >
              <Text style={[styles.startBtnText, { fontSize: 22 * textScale }]}>
                Tap to Check In
              </Text>
            </TouchableOpacity>

            {returningVisitors.length > 0 && (
              <TouchableOpacity
                style={[styles.returningBtn, { backgroundColor: surface, borderColor: accent }]}
                onPress={() => setShowReturning(!showReturning)}
                activeOpacity={0.8}
              >
                <Text style={[styles.returningBtnText, { color: accent, fontSize: 16 * textScale }]}>
                  🔄 Returning Visitor? Quick Check-In ({returningVisitors.length})
                </Text>
              </TouchableOpacity>
            )}

            {showReturning && returningVisitors.length > 0 && (
              <View style={[styles.returningList, { backgroundColor: surface, borderColor: accent + '40' }]}>
                <Text style={[styles.returningListTitle, { color: fg, fontSize: 14 * textScale }]}>Recent Visitors</Text>
                {returningVisitors.slice(0, 5).map((v, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.returningItem, { borderBottomColor: muted + '30' }]}
                    onPress={() => quickCheckIn(v)}
                  >
                    <View style={styles.returningItemInfo}>
                      <Text style={[styles.returningItemName, { color: fg, fontSize: 15 * textScale }]}>{v.visitorName}</Text>
                      <Text style={[styles.returningItemMeta, { color: muted, fontSize: 12 * textScale }]}>
                        {v.lastDepartment} • {v.visitCount} visit{v.visitCount > 1 ? 's' : ''}
                      </Text>
                    </View>
                    <Text style={[styles.returningItemArrow, { color: accent }]}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[styles.idleHint, { color: muted, fontSize: 14 * textScale }]}>
              Touch the screen to begin visitor registration
            </Text>
          </View>

          <Text style={[styles.idleFooter, { color: muted }]}>
            MediVac One™ • SMPO.ink™ • J.E.D.iTek PTY LTD
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  // ============================================================
  // FORM SCREEN
  // ============================================================
  if (kioskState === 'form') {
    return (
      <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
        <ScrollView
          style={[styles.formContainer, { backgroundColor: bg }]}
          contentContainerStyle={styles.formContent}
          onScrollBeginDrag={resetInactivity}
        >
          {/* Header */}
          <View style={styles.formHeader}>
            <TouchableOpacity onPress={resetKiosk} style={styles.backBtn}>
              <Text style={[styles.backBtnText, { color: accent }]}>← Back</Text>
            </TouchableOpacity>
            <Text style={[styles.formTitle, { color: fg, fontSize: 24 * textScale }]}>
              Visitor Check-In
            </Text>
          </View>

          {/* Errors */}
          {errors.length > 0 && (
            <View style={[styles.errorBox, { backgroundColor: '#FEE2E2' }]}>
              {errors.map((e, i) => (
                <Text key={i} style={[styles.errorText, { fontSize: 14 * textScale }]}>⚠️ {e}</Text>
              ))}
            </View>
          )}

          {/* Name */}
          <Text style={[styles.fieldLabel, { color: fg, fontSize: 16 * textScale }]}>Full Name *</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: surface, color: fg, borderColor: colors.border, fontSize: 18 * textScale }]}
            placeholder="Enter your full name"
            placeholderTextColor={muted}
            value={formData.visitorName || ''}
            onChangeText={(t) => { setFormData({ ...formData, visitorName: t }); resetInactivity(); }}
            returnKeyType="done"
          />

          {/* Purpose */}
          <Text style={[styles.fieldLabel, { color: fg, fontSize: 16 * textScale }]}>Purpose of Visit *</Text>
          <View style={styles.purposeGrid}>
            {[
              { value: 'visit_patient', label: 'Visit Patient', icon: '👤' },
              { value: 'appointment', label: 'Appointment', icon: '📋' },
              { value: 'delivery', label: 'Delivery', icon: '📦' },
              { value: 'contractor', label: 'Contractor', icon: '🔧' },
              { value: 'other', label: 'Other', icon: '❓' },
            ].map(p => (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.purposeBtn,
                  {
                    backgroundColor: formData.purpose === p.value ? accent : surface,
                    borderColor: formData.purpose === p.value ? accent : colors.border,
                  },
                ]}
                onPress={() => { setFormData({ ...formData, purpose: p.value as any }); resetInactivity(); }}
              >
                <Text style={styles.purposeIcon}>{p.icon}</Text>
                <Text style={[styles.purposeLabel, {
                  color: formData.purpose === p.value ? '#fff' : fg,
                  fontSize: 13 * textScale,
                }]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Patient Name (if visiting) */}
          {formData.purpose === 'visit_patient' && (
            <>
              <Text style={[styles.fieldLabel, { color: fg, fontSize: 16 * textScale }]}>Patient Name *</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: surface, color: fg, borderColor: colors.border, fontSize: 18 * textScale }]}
                placeholder="Enter patient name"
                placeholderTextColor={muted}
                value={formData.patientName || ''}
                onChangeText={(t) => { setFormData({ ...formData, patientName: t }); resetInactivity(); }}
                returnKeyType="done"
              />
            </>
          )}

          {/* Destination */}
          <Text style={[styles.fieldLabel, { color: fg, fontSize: 16 * textScale }]}>Destination *</Text>
          <View style={styles.deptGrid}>
            {DEPARTMENTS.map(d => (
              <TouchableOpacity
                key={d.id}
                style={[
                  styles.deptBtn,
                  {
                    backgroundColor: formData.destinationDepartment === d.id ? accent : surface,
                    borderColor: formData.destinationDepartment === d.id ? accent : colors.border,
                  },
                ]}
                onPress={() => { setFormData({ ...formData, destinationDepartment: d.id }); resetInactivity(); }}
              >
                <Text style={styles.deptIcon}>{d.icon}</Text>
                <Text style={[styles.deptLabel, {
                  color: formData.destinationDepartment === d.id ? '#fff' : fg,
                  fontSize: 11 * textScale,
                }]} numberOfLines={1}>
                  {d.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: accent }]}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={[styles.submitBtnText, { fontSize: 18 * textScale }]}>Continue →</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ============================================================
  // CONFIRMING SCREEN
  // ============================================================
  if (kioskState === 'confirming') {
    const dept = DEPARTMENTS.find(d => d.id === formData.destinationDepartment);
    return (
      <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
        <View style={[styles.confirmContainer, { backgroundColor: bg }]}>
          <Text style={[styles.confirmTitle, { color: fg, fontSize: 24 * textScale }]}>
            Confirm Your Details
          </Text>

          <View style={[styles.confirmCard, { backgroundColor: surface, borderColor: colors.border }]}>
            <View style={styles.confirmRow}>
              <Text style={[styles.confirmLabel, { color: muted, fontSize: 14 * textScale }]}>Name</Text>
              <Text style={[styles.confirmValue, { color: fg, fontSize: 16 * textScale }]}>{formData.visitorName}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={[styles.confirmLabel, { color: muted, fontSize: 14 * textScale }]}>Purpose</Text>
              <Text style={[styles.confirmValue, { color: fg, fontSize: 16 * textScale }]}>
                {formData.purpose === 'visit_patient' ? 'Visiting a Patient' :
                 formData.purpose === 'appointment' ? 'Medical Appointment' :
                 formData.purpose === 'delivery' ? 'Delivery / Courier' :
                 formData.purpose === 'contractor' ? 'Contractor' : 'Other'}
              </Text>
            </View>
            {formData.patientName && (
              <View style={styles.confirmRow}>
                <Text style={[styles.confirmLabel, { color: muted, fontSize: 14 * textScale }]}>Patient</Text>
                <Text style={[styles.confirmValue, { color: fg, fontSize: 16 * textScale }]}>{formData.patientName}</Text>
              </View>
            )}
            <View style={styles.confirmRow}>
              <Text style={[styles.confirmLabel, { color: muted, fontSize: 14 * textScale }]}>Destination</Text>
              <Text style={[styles.confirmValue, { color: fg, fontSize: 16 * textScale }]}>
                {dept?.icon} {dept?.name}
              </Text>
            </View>
          </View>

          <View style={styles.confirmActions}>
            <TouchableOpacity
              style={[styles.confirmBackBtn, { borderColor: colors.border }]}
              onPress={() => setKioskState('form')}
            >
              <Text style={[styles.confirmBackText, { color: fg, fontSize: 16 * textScale }]}>← Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmSubmitBtn, { backgroundColor: '#22C55E' }]}
              onPress={confirmCheckIn}
              activeOpacity={0.8}
            >
              <Text style={[styles.confirmSubmitText, { fontSize: 16 * textScale }]}>✓ Check In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // ============================================================
  // PASS GENERATED SCREEN
  // ============================================================
  if (kioskState === 'pass_generated' && generatedPass) {
    return (
      <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
        <ScrollView
          style={[styles.passContainer, { backgroundColor: bg }]}
          contentContainerStyle={styles.passContent}
        >
          {/* Success header */}
          <View style={[styles.passHeader, { backgroundColor: '#22C55E' }]}>
            <Text style={styles.passHeaderIcon}>✓</Text>
            <Text style={[styles.passHeaderTitle, { fontSize: 24 * textScale }]}>Check-In Complete</Text>
            <Text style={[styles.passHeaderSub, { fontSize: 14 * textScale }]}>
              Your visitor pass has been generated
            </Text>
          </View>

          {/* Pass card */}
          <View style={[styles.passCard, { backgroundColor: surface, borderColor: colors.border }]}>
            <View style={styles.passCardHeader}>
              <Text style={[styles.passNumber, { color: accent, fontSize: 18 * textScale }]}>
                {generatedPass.passNumber}
              </Text>
              <Text style={[styles.passExpiry, { color: muted, fontSize: 12 * textScale }]}>
                Valid until {new Date(generatedPass.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>

            <View style={styles.passDetails}>
              <View style={styles.passRow}>
                <Text style={[styles.passLabel, { color: muted, fontSize: 13 * textScale }]}>Visitor</Text>
                <Text style={[styles.passValue, { color: fg, fontSize: 15 * textScale }]}>{generatedPass.visitorName}</Text>
              </View>
              <View style={styles.passRow}>
                <Text style={[styles.passLabel, { color: muted, fontSize: 13 * textScale }]}>Purpose</Text>
                <Text style={[styles.passValue, { color: fg, fontSize: 15 * textScale }]}>{generatedPass.purpose}</Text>
              </View>
              <View style={styles.passRow}>
                <Text style={[styles.passLabel, { color: muted, fontSize: 13 * textScale }]}>Destination</Text>
                <Text style={[styles.passValue, { color: fg, fontSize: 15 * textScale }]}>
                  {DEPARTMENTS.find(d => d.id === generatedPass.destinationDepartment)?.icon}{' '}
                  {DEPARTMENTS.find(d => d.id === generatedPass.destinationDepartment)?.name}
                </Text>
              </View>
              <View style={styles.passRow}>
                <Text style={[styles.passLabel, { color: muted, fontSize: 13 * textScale }]}>Floor</Text>
                <Text style={[styles.passValue, { color: fg, fontSize: 15 * textScale }]}>{generatedPass.destinationFloor}</Text>
              </View>
            </View>

            {/* QR Code placeholder */}
            <View style={[styles.qrContainer, { borderColor: colors.border }]}>
              <View style={[styles.qrPlaceholder, { backgroundColor: '#f0f0f0' }]}>
                <Text style={styles.qrIcon}>📱</Text>
                <Text style={[styles.qrText, { color: '#333', fontSize: 12 * textScale }]}>
                  Scan for digital pass
                </Text>
                <Text style={[styles.qrCode, { color: '#666', fontSize: 10 * textScale }]}>
                  {generatedPass.passNumber}
                </Text>
              </View>
            </View>
          </View>

          {/* Directions */}
          <View style={[styles.directionsCard, { backgroundColor: surface, borderColor: colors.border }]}>
            <Text style={[styles.directionsTitle, { color: fg, fontSize: 18 * textScale }]}>
              🧭 Directions
            </Text>
            {generatedPass.directions.map((dir, i) => (
              <View key={i} style={styles.directionItem}>
                <View style={[styles.directionNum, { backgroundColor: accent }]}>
                  <Text style={styles.directionNumText}>{i + 1}</Text>
                </View>
                <Text style={[styles.directionText, { color: fg, fontSize: 15 * textScale }]}>{dir}</Text>
              </View>
            ))}
          </View>

          {/* Auto-reset countdown */}
          <View style={styles.countdownWrap}>
            <Text style={[styles.countdownText, { color: muted, fontSize: 14 * textScale }]}>
              Screen resets in {countdown} seconds
            </Text>
            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: accent }]}
              onPress={resetKiosk}
              activeOpacity={0.8}
            >
              <Text style={[styles.doneBtnText, { fontSize: 16 * textScale }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return null;
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Idle
  idleContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  accessRow: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', gap: 8 },
  accessBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  accessBtnText: { fontSize: 13, fontWeight: '600' },
  idleContent: { alignItems: 'center', gap: 12 },
  idleIcon: { fontSize: 80 },
  idleTitle: { fontWeight: '800', textAlign: 'center', lineHeight: 44 },
  idleSubtitle: { fontWeight: '500', marginTop: 4 },
  startBtn: { marginTop: 32, paddingHorizontal: 48, paddingVertical: 20, borderRadius: 20 },
  startBtnText: { color: '#fff', fontWeight: '800' },
  idleHint: { marginTop: 16 },
  idleFooter: { position: 'absolute', bottom: 16, fontSize: 11 },

  // Form
  formContainer: { flex: 1 },
  formContent: { padding: 20, paddingBottom: 40 },
  formHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  backBtn: { padding: 8 },
  backBtnText: { fontSize: 16, fontWeight: '600' },
  formTitle: { fontWeight: '800' },
  errorBox: { padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { color: '#DC2626', marginBottom: 4 },
  fieldLabel: { fontWeight: '700', marginBottom: 8, marginTop: 16 },
  textInput: { height: 52, borderRadius: 12, paddingHorizontal: 16, borderWidth: 1 },
  purposeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  purposeBtn: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  purposeIcon: { fontSize: 18 },
  purposeLabel: { fontWeight: '600' },
  deptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  deptBtn: { width: '31%', padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  deptIcon: { fontSize: 24, marginBottom: 4 },
  deptLabel: { fontWeight: '600', textAlign: 'center' },
  submitBtn: { marginTop: 24, padding: 18, borderRadius: 16, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '800' },

  // Confirm
  confirmContainer: { flex: 1, padding: 20, justifyContent: 'center' },
  confirmTitle: { fontWeight: '800', textAlign: 'center', marginBottom: 20 },
  confirmCard: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 24 },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' },
  confirmLabel: {},
  confirmValue: { fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 16 },
  confirmActions: { flexDirection: 'row', gap: 12 },
  confirmBackBtn: { flex: 1, padding: 16, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  confirmBackText: { fontWeight: '700' },
  confirmSubmitBtn: { flex: 2, padding: 16, borderRadius: 14, alignItems: 'center' },
  confirmSubmitText: { color: '#fff', fontWeight: '800' },

  // Pass
  passContainer: { flex: 1 },
  passContent: { paddingBottom: 40 },
  passHeader: { padding: 24, alignItems: 'center' },
  passHeaderIcon: { fontSize: 48, color: '#fff', marginBottom: 8 },
  passHeaderTitle: { color: '#fff', fontWeight: '800' },
  passHeaderSub: { color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  passCard: { margin: 16, borderRadius: 16, borderWidth: 1, padding: 20 },
  passCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' },
  passNumber: { fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  passExpiry: {},
  passDetails: {},
  passRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  passLabel: {},
  passValue: { fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 16 },
  qrContainer: { marginTop: 16, borderTopWidth: 0.5, paddingTop: 16, alignItems: 'center' },
  qrPlaceholder: { width: 160, height: 160, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  qrIcon: { fontSize: 48, marginBottom: 8 },
  qrText: { fontWeight: '600' },
  qrCode: { marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  // Directions
  directionsCard: { margin: 16, marginTop: 0, borderRadius: 16, borderWidth: 1, padding: 20 },
  directionsTitle: { fontWeight: '800', marginBottom: 16 },
  directionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  directionNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  directionNumText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  directionText: { flex: 1, lineHeight: 22 },

  // Countdown
  countdownWrap: { alignItems: 'center', padding: 20 },
  countdownText: { marginBottom: 12 },
  doneBtn: { paddingHorizontal: 40, paddingVertical: 14, borderRadius: 14 },
  doneBtnText: { color: '#fff', fontWeight: '700' },

  // Returning Visitors
  returningBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5 },
  returningBtnText: { fontWeight: '700', textAlign: 'center' },
  returningList: { marginTop: 12, borderRadius: 14, borderWidth: 1, padding: 12, width: '80%', maxWidth: 400 },
  returningListTitle: { fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  returningItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5 },
  returningItemInfo: { flex: 1 },
  returningItemName: { fontWeight: '700' },
  returningItemMeta: { marginTop: 2 },
  returningItemArrow: { fontSize: 24, fontWeight: '700', marginLeft: 8 },
});
