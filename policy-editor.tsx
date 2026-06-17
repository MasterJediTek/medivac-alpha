/**
 * Department Policy Customization Screen
 * Interactive policy editor for each department - MediVac One v5.2
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  FlatList,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';

// Types
interface AccessLevel {
  id: string;
  name: string;
  level: number;
  permissions: string[];
}

interface TimeRestriction {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  days: string[];
  enabled: boolean;
}

interface DepartmentPolicy {
  id: string;
  departmentId: string;
  departmentName: string;
  accessLevels: AccessLevel[];
  timeRestrictions: TimeRestriction[];
  emergencyOverride: boolean;
  mfaRequired: boolean;
  sessionTimeout: number;
  ipWhitelist: string[];
  auditLevel: 'minimal' | 'standard' | 'detailed';
  lastModified: string;
  version: number;
}

// Default policies for departments
const DEFAULT_POLICIES: DepartmentPolicy[] = [
  {
    id: 'emergency',
    departmentId: 'emergency',
    departmentName: 'Emergency Department',
    accessLevels: [
      { id: 'full', name: 'Full Access', level: 100, permissions: ['read', 'write', 'delete', 'admin'] },
      { id: 'clinical', name: 'Clinical Access', level: 80, permissions: ['read', 'write'] },
      { id: 'view', name: 'View Only', level: 20, permissions: ['read'] },
    ],
    timeRestrictions: [],
    emergencyOverride: true,
    mfaRequired: true,
    sessionTimeout: 480,
    ipWhitelist: [],
    auditLevel: 'detailed',
    lastModified: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'icu',
    departmentId: 'icu',
    departmentName: 'ICU / Critical Care',
    accessLevels: [
      { id: 'full', name: 'Full Access', level: 100, permissions: ['read', 'write', 'delete', 'admin'] },
      { id: 'clinical', name: 'Clinical Access', level: 80, permissions: ['read', 'write'] },
    ],
    timeRestrictions: [],
    emergencyOverride: true,
    mfaRequired: true,
    sessionTimeout: 240,
    ipWhitelist: [],
    auditLevel: 'detailed',
    lastModified: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'surgery',
    departmentId: 'surgery',
    departmentName: 'Surgery Department',
    accessLevels: [
      { id: 'surgeon', name: 'Surgeon Access', level: 100, permissions: ['read', 'write', 'delete'] },
      { id: 'nurse', name: 'Surgical Nurse', level: 60, permissions: ['read', 'write'] },
    ],
    timeRestrictions: [
      { id: 'business', name: 'Business Hours', startTime: '06:00', endTime: '22:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], enabled: true },
    ],
    emergencyOverride: true,
    mfaRequired: true,
    sessionTimeout: 360,
    ipWhitelist: [],
    auditLevel: 'detailed',
    lastModified: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'pharmacy',
    departmentId: 'pharmacy',
    departmentName: 'Pharmacy',
    accessLevels: [
      { id: 'pharmacist', name: 'Pharmacist', level: 100, permissions: ['read', 'write', 'dispense'] },
      { id: 'tech', name: 'Pharmacy Tech', level: 40, permissions: ['read', 'assist'] },
    ],
    timeRestrictions: [
      { id: 'hours', name: 'Operating Hours', startTime: '07:00', endTime: '21:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], enabled: true },
    ],
    emergencyOverride: true,
    mfaRequired: true,
    sessionTimeout: 120,
    ipWhitelist: [],
    auditLevel: 'detailed',
    lastModified: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'radiology',
    departmentId: 'radiology',
    departmentName: 'Radiology / Imaging',
    accessLevels: [
      { id: 'radiologist', name: 'Radiologist', level: 100, permissions: ['read', 'write', 'report'] },
      { id: 'tech', name: 'Radiology Tech', level: 60, permissions: ['read', 'scan'] },
    ],
    timeRestrictions: [],
    emergencyOverride: true,
    mfaRequired: false,
    sessionTimeout: 480,
    ipWhitelist: [],
    auditLevel: 'standard',
    lastModified: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'laboratory',
    departmentId: 'laboratory',
    departmentName: 'Pathology / Laboratory',
    accessLevels: [
      { id: 'pathologist', name: 'Pathologist', level: 100, permissions: ['read', 'write', 'report'] },
      { id: 'scientist', name: 'Lab Scientist', level: 80, permissions: ['read', 'write', 'test'] },
      { id: 'tech', name: 'Lab Technician', level: 40, permissions: ['read', 'collect'] },
    ],
    timeRestrictions: [],
    emergencyOverride: false,
    mfaRequired: true,
    sessionTimeout: 480,
    ipWhitelist: [],
    auditLevel: 'standard',
    lastModified: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'nursing',
    departmentId: 'nursing',
    departmentName: 'Nursing',
    accessLevels: [
      { id: 'nurse_manager', name: 'Nurse Manager', level: 90, permissions: ['read', 'write', 'schedule'] },
      { id: 'rn', name: 'Registered Nurse', level: 70, permissions: ['read', 'write', 'administer'] },
      { id: 'en', name: 'Enrolled Nurse', level: 50, permissions: ['read', 'assist'] },
    ],
    timeRestrictions: [],
    emergencyOverride: true,
    mfaRequired: false,
    sessionTimeout: 480,
    ipWhitelist: [],
    auditLevel: 'standard',
    lastModified: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'administration',
    departmentId: 'administration',
    departmentName: 'Administration',
    accessLevels: [
      { id: 'admin', name: 'Administrator', level: 80, permissions: ['read', 'write', 'billing'] },
      { id: 'clerk', name: 'Admin Clerk', level: 40, permissions: ['read', 'schedule'] },
    ],
    timeRestrictions: [
      { id: 'business', name: 'Business Hours', startTime: '08:00', endTime: '18:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], enabled: true },
    ],
    emergencyOverride: false,
    mfaRequired: false,
    sessionTimeout: 240,
    ipWhitelist: [],
    auditLevel: 'minimal',
    lastModified: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'mental_health',
    departmentId: 'mental_health',
    departmentName: 'Mental Health',
    accessLevels: [
      { id: 'psychiatrist', name: 'Psychiatrist', level: 100, permissions: ['read', 'write', 'prescribe'] },
      { id: 'psychologist', name: 'Psychologist', level: 80, permissions: ['read', 'write', 'assess'] },
      { id: 'counselor', name: 'Counselor', level: 60, permissions: ['read', 'write'] },
    ],
    timeRestrictions: [],
    emergencyOverride: true,
    mfaRequired: true,
    sessionTimeout: 120,
    ipWhitelist: [],
    auditLevel: 'detailed',
    lastModified: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'outpatient',
    departmentId: 'outpatient',
    departmentName: 'Outpatient Clinics',
    accessLevels: [
      { id: 'doctor', name: 'Doctor', level: 100, permissions: ['read', 'write', 'prescribe'] },
      { id: 'nurse', name: 'Clinic Nurse', level: 60, permissions: ['read', 'write'] },
      { id: 'reception', name: 'Reception', level: 20, permissions: ['read', 'schedule'] },
    ],
    timeRestrictions: [
      { id: 'clinic', name: 'Clinic Hours', startTime: '08:00', endTime: '17:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], enabled: true },
    ],
    emergencyOverride: false,
    mfaRequired: false,
    sessionTimeout: 480,
    ipWhitelist: [],
    auditLevel: 'standard',
    lastModified: new Date().toISOString(),
    version: 1,
  },
];

export default function PolicyEditorScreen() {
  const colors = useColors();
  const [policies, setPolicies] = useState<DepartmentPolicy[]>(DEFAULT_POLICIES);
  const [selectedPolicy, setSelectedPolicy] = useState<DepartmentPolicy | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSelectPolicy = (policy: DepartmentPolicy) => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Discard them?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => {
            setSelectedPolicy(policy);
            setEditMode(false);
            setHasChanges(false);
          }},
        ]
      );
    } else {
      setSelectedPolicy(policy);
      setEditMode(false);
    }
  };

  const handleSavePolicy = () => {
    if (!selectedPolicy) return;

    const updatedPolicies = policies.map(p =>
      p.id === selectedPolicy.id
        ? { ...selectedPolicy, lastModified: new Date().toISOString(), version: selectedPolicy.version + 1 }
        : p
    );
    setPolicies(updatedPolicies);
    setHasChanges(false);
    setEditMode(false);
    Alert.alert('Success', 'Policy saved successfully');
  };

  const handleToggleMFA = (value: boolean) => {
    if (!selectedPolicy) return;
    setSelectedPolicy({ ...selectedPolicy, mfaRequired: value });
    setHasChanges(true);
  };

  const handleToggleEmergencyOverride = (value: boolean) => {
    if (!selectedPolicy) return;
    setSelectedPolicy({ ...selectedPolicy, emergencyOverride: value });
    setHasChanges(true);
  };

  const handleSessionTimeoutChange = (value: string) => {
    if (!selectedPolicy) return;
    const timeout = parseInt(value, 10) || 0;
    setSelectedPolicy({ ...selectedPolicy, sessionTimeout: timeout });
    setHasChanges(true);
  };

  const handleAuditLevelChange = (level: 'minimal' | 'standard' | 'detailed') => {
    if (!selectedPolicy) return;
    setSelectedPolicy({ ...selectedPolicy, auditLevel: level });
    setHasChanges(true);
  };

  const renderDepartmentItem = ({ item }: { item: DepartmentPolicy }) => (
    <TouchableOpacity
      style={{
        padding: 16,
        backgroundColor: selectedPolicy?.id === item.id ? colors.primary + '20' : colors.surface,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: selectedPolicy?.id === item.id ? 2 : 1,
        borderColor: selectedPolicy?.id === item.id ? colors.primary : colors.border,
      }}
      onPress={() => handleSelectPolicy(item)}
    >
      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
        {item.departmentName}
      </Text>
      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
        {item.accessLevels.length} access levels • v{item.version}
      </Text>
      <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
        {item.mfaRequired && (
          <View style={{ backgroundColor: colors.success + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
            <Text style={{ fontSize: 10, color: colors.success }}>MFA</Text>
          </View>
        )}
        {item.emergencyOverride && (
          <View style={{ backgroundColor: colors.warning + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
            <Text style={{ fontSize: 10, color: colors.warning }}>Emergency</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderAccessLevel = (level: AccessLevel, index: number) => (
    <View
      key={level.id}
      style={{
        padding: 12,
        backgroundColor: colors.surface,
        borderRadius: 8,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: `hsl(${120 - (100 - level.level) * 1.2}, 70%, 50%)`,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>{level.name}</Text>
        <Text style={{ fontSize: 12, color: colors.muted }}>Level {level.level}</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 4 }}>
        {level.permissions.map(perm => (
          <View key={perm} style={{ backgroundColor: colors.primary + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
            <Text style={{ fontSize: 10, color: colors.primary }}>{perm}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderTimeRestriction = (restriction: TimeRestriction) => (
    <View
      key={restriction.id}
      style={{
        padding: 12,
        backgroundColor: colors.surface,
        borderRadius: 8,
        marginBottom: 8,
        opacity: restriction.enabled ? 1 : 0.5,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>{restriction.name}</Text>
        <Switch
          value={restriction.enabled}
          onValueChange={(value) => {
            if (!selectedPolicy) return;
            const updated = selectedPolicy.timeRestrictions.map(t =>
              t.id === restriction.id ? { ...t, enabled: value } : t
            );
            setSelectedPolicy({ ...selectedPolicy, timeRestrictions: updated });
            setHasChanges(true);
          }}
          trackColor={{ false: colors.border, true: colors.primary }}
        />
      </View>
      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
        {restriction.startTime} - {restriction.endTime}
      </Text>
      <Text style={{ fontSize: 12, color: colors.muted }}>
        {restriction.days.join(', ')}
      </Text>
    </View>
  );

  return (
    <ScreenContainer>
      <View style={{ flex: 1, padding: 16 }}>
        {/* Header */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.foreground }}>
            Policy Editor
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
            Customize access policies for each department
          </Text>
        </View>

        <View style={{ flex: 1, flexDirection: 'row', gap: 16 }}>
          {/* Department List */}
          <View style={{ width: '35%' }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
              Departments
            </Text>
            <FlatList
              data={policies}
              renderItem={renderDepartmentItem}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* Policy Details */}
          <View style={{ flex: 1 }}>
            {selectedPolicy ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Policy Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <View>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.foreground }}>
                      {selectedPolicy.departmentName}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted }}>
                      Last modified: {new Date(selectedPolicy.lastModified).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {hasChanges && (
                      <TouchableOpacity
                        style={{ backgroundColor: colors.success, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
                        onPress={handleSavePolicy}
                      >
                        <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={{ backgroundColor: editMode ? colors.warning : colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
                      onPress={() => setEditMode(!editMode)}
                    >
                      <Text style={{ color: '#fff', fontWeight: '600' }}>{editMode ? 'Cancel' : 'Edit'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Access Levels */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
                    Access Levels
                  </Text>
                  {selectedPolicy.accessLevels.map(renderAccessLevel)}
                </View>

                {/* Time Restrictions */}
                {selectedPolicy.timeRestrictions.length > 0 && (
                  <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
                      Time Restrictions
                    </Text>
                    {selectedPolicy.timeRestrictions.map(renderTimeRestriction)}
                  </View>
                )}

                {/* Security Settings */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
                    Security Settings
                  </Text>

                  {/* MFA Required */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: colors.surface, borderRadius: 8, marginBottom: 8 }}>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>MFA Required</Text>
                      <Text style={{ fontSize: 12, color: colors.muted }}>Require multi-factor authentication</Text>
                    </View>
                    <Switch
                      value={selectedPolicy.mfaRequired}
                      onValueChange={handleToggleMFA}
                      disabled={!editMode}
                      trackColor={{ false: colors.border, true: colors.primary }}
                    />
                  </View>

                  {/* Emergency Override */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: colors.surface, borderRadius: 8, marginBottom: 8 }}>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>Emergency Override</Text>
                      <Text style={{ fontSize: 12, color: colors.muted }}>Allow emergency access bypass</Text>
                    </View>
                    <Switch
                      value={selectedPolicy.emergencyOverride}
                      onValueChange={handleToggleEmergencyOverride}
                      disabled={!editMode}
                      trackColor={{ false: colors.border, true: colors.warning }}
                    />
                  </View>

                  {/* Session Timeout */}
                  <View style={{ padding: 12, backgroundColor: colors.surface, borderRadius: 8, marginBottom: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>Session Timeout</Text>
                    <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>Minutes before auto-logout</Text>
                    <TextInput
                      style={{
                        backgroundColor: colors.background,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 8,
                        padding: 12,
                        color: colors.foreground,
                      }}
                      value={String(selectedPolicy.sessionTimeout)}
                      onChangeText={handleSessionTimeoutChange}
                      keyboardType="numeric"
                      editable={editMode}
                    />
                  </View>

                  {/* Audit Level */}
                  <View style={{ padding: 12, backgroundColor: colors.surface, borderRadius: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground, marginBottom: 8 }}>Audit Level</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {(['minimal', 'standard', 'detailed'] as const).map(level => (
                        <TouchableOpacity
                          key={level}
                          style={{
                            flex: 1,
                            padding: 12,
                            backgroundColor: selectedPolicy.auditLevel === level ? colors.primary : colors.background,
                            borderRadius: 8,
                            alignItems: 'center',
                          }}
                          onPress={() => editMode && handleAuditLevelChange(level)}
                          disabled={!editMode}
                        >
                          <Text style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: selectedPolicy.auditLevel === level ? '#fff' : colors.foreground,
                            textTransform: 'capitalize',
                          }}>
                            {level}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </ScrollView>
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <IconSymbol name="doc.text.fill" size={48} color={colors.muted} />
                <Text style={{ fontSize: 16, color: colors.muted, marginTop: 16 }}>
                  Select a department to view its policy
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
