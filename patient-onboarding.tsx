import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { patientOnboardingService, PatientOnboarding, StaffingRequest, OnboardingStatus, STATUS_COLORS, WACHS_REGIONS, WACHSRegion } from "@/lib/services/patient-onboarding-service";
import { BEACON_CODE_COLORS } from "@/lib/services/homing-beacon-service";

export default function PatientOnboardingScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [onboardings, setOnboardings] = useState<PatientOnboarding[]>([]);
  const [staffingRequests, setStaffingRequests] = useState<StaffingRequest[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'patients' | 'staffing'>('patients');
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<WACHSRegion | ''>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await patientOnboardingService.initialize();
    setOnboardings(patientOnboardingService.getOnboardings());
    setStaffingRequests(patientOnboardingService.getStaffingRequests());
    setStats(patientOnboardingService.getStats());
    setLoading(false);
  };

  const handleCreatePatient = async () => {
    if (!newPatientName) return;
    
    await patientOnboardingService.createNewUser(
      newPatientName,
      newPatientEmail || undefined,
      undefined,
      selectedRegion || undefined
    );
    
    setNewPatientName('');
    setNewPatientEmail('');
    setSelectedRegion('');
    setShowNewPatient(false);
    loadData();
  };

  const handleAssignBeacon = async (onboardingId: string) => {
    await patientOnboardingService.assignBeaconAndApprove(onboardingId);
    loadData();
  };

  const handleApproveStaffing = async (requestId: string) => {
    await patientOnboardingService.approveStaffingRequest(requestId, 'Current User');
    loadData();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Loading onboarding data...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">Patient Onboarding</Text>
          <Text className="text-muted">WACHS staffing integration</Text>
        </View>

        {/* Default Role Notice */}
        <View 
          className="rounded-xl p-4 mb-4"
          style={{ backgroundColor: BEACON_CODE_COLORS.green.background, borderWidth: 2, borderColor: BEACON_CODE_COLORS.green.primary }}
        >
          <View className="flex-row items-center gap-2 mb-2">
            <Text style={{ fontSize: 20 }}>👤</Text>
            <Text style={{ color: BEACON_CODE_COLORS.green.primary, fontWeight: '700', fontSize: 16 }}>
              DEFAULT: PATIENT ROLE
            </Text>
          </View>
          <Text style={{ color: BEACON_CODE_COLORS.green.text, fontSize: 13 }}>
            All new users are registered as PATIENTS with GREEN beacon assignment.
            Staff roles require WACHS staffing approval.
          </Text>
        </View>

        {/* Stats */}
        <View className="flex-row flex-wrap gap-2 mb-4">
          <View className="flex-1 min-w-[80px] bg-surface rounded-xl p-3 border border-border">
            <Text className="text-xs text-muted">Total</Text>
            <Text className="text-xl font-bold text-foreground">{stats?.totalOnboardings || 0}</Text>
          </View>
          <View 
            className="flex-1 min-w-[80px] rounded-xl p-3"
            style={{ backgroundColor: STATUS_COLORS.approved.background, borderWidth: 1, borderColor: STATUS_COLORS.approved.primary }}
          >
            <Text style={{ color: STATUS_COLORS.approved.primary, fontSize: 11 }}>Approved</Text>
            <Text style={{ color: STATUS_COLORS.approved.primary, fontSize: 20, fontWeight: '700' }}>
              {stats?.byStatus.approved || 0}
            </Text>
          </View>
          <View 
            className="flex-1 min-w-[80px] rounded-xl p-3"
            style={{ backgroundColor: STATUS_COLORS.awaiting_staffing.background, borderWidth: 1, borderColor: STATUS_COLORS.awaiting_staffing.primary }}
          >
            <Text style={{ color: STATUS_COLORS.awaiting_staffing.primary, fontSize: 11 }}>Awaiting</Text>
            <Text style={{ color: STATUS_COLORS.awaiting_staffing.primary, fontSize: 20, fontWeight: '700' }}>
              {stats?.pendingStaffing || 0}
            </Text>
          </View>
          <View 
            className="flex-1 min-w-[80px] rounded-xl p-3"
            style={{ backgroundColor: STATUS_COLORS.pending.background, borderWidth: 1, borderColor: STATUS_COLORS.pending.primary }}
          >
            <Text style={{ color: STATUS_COLORS.pending.primary, fontSize: 11 }}>Pending</Text>
            <Text style={{ color: STATUS_COLORS.pending.primary, fontSize: 20, fontWeight: '700' }}>
              {stats?.byStatus.pending || 0}
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row mb-4 bg-surface rounded-xl p-1">
          <TouchableOpacity
            onPress={() => setActiveTab('patients')}
            className="flex-1 py-3 rounded-lg"
            style={{ backgroundColor: activeTab === 'patients' ? colors.primary : 'transparent' }}
          >
            <Text style={{ color: activeTab === 'patients' ? '#FFFFFF' : colors.muted, textAlign: 'center', fontWeight: '600' }}>
              Patients ({onboardings.filter(o => o.userType === 'patient').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('staffing')}
            className="flex-1 py-3 rounded-lg"
            style={{ backgroundColor: activeTab === 'staffing' ? colors.primary : 'transparent' }}
          >
            <Text style={{ color: activeTab === 'staffing' ? '#FFFFFF' : colors.muted, textAlign: 'center', fontWeight: '600' }}>
              WACHS Staffing ({staffingRequests.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'patients' && (
          <>
            {/* New Patient Button */}
            <TouchableOpacity
              onPress={() => setShowNewPatient(true)}
              style={{
                padding: 16,
                borderRadius: 12,
                backgroundColor: BEACON_CODE_COLORS.green.primary,
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16 }}>
                + Register New Patient (Green Beacon)
              </Text>
            </TouchableOpacity>

            {/* New Patient Form */}
            {showNewPatient && (
              <View className="bg-surface rounded-xl p-4 mb-4 border-2" style={{ borderColor: BEACON_CODE_COLORS.green.primary }}>
                <Text className="text-lg font-semibold text-foreground mb-4">Register New Patient</Text>
                
                <View className="mb-3">
                  <Text className="text-sm text-muted mb-1">Full Name *</Text>
                  <TextInput
                    value={newPatientName}
                    onChangeText={setNewPatientName}
                    placeholder="Patient full name"
                    placeholderTextColor={colors.muted}
                    className="bg-background rounded-lg p-3 text-foreground"
                    style={{ borderWidth: 1, borderColor: colors.border }}
                  />
                </View>
                
                <View className="mb-3">
                  <Text className="text-sm text-muted mb-1">Email (Optional)</Text>
                  <TextInput
                    value={newPatientEmail}
                    onChangeText={setNewPatientEmail}
                    placeholder="email@example.com"
                    placeholderTextColor={colors.muted}
                    keyboardType="email-address"
                    className="bg-background rounded-lg p-3 text-foreground"
                    style={{ borderWidth: 1, borderColor: colors.border }}
                  />
                </View>
                
                <View className="mb-4">
                  <Text className="text-sm text-muted mb-2">WACHS Region (Optional)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      {WACHS_REGIONS.map(({ region }) => (
                        <TouchableOpacity
                          key={region}
                          onPress={() => setSelectedRegion(selectedRegion === region ? '' : region)}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 16,
                            backgroundColor: selectedRegion === region ? colors.primary : colors.primary + '20',
                            borderWidth: 1,
                            borderColor: colors.primary,
                          }}
                        >
                          <Text style={{ color: selectedRegion === region ? '#FFFFFF' : colors.primary, fontSize: 12 }}>
                            {region.replace('_', ' ')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
                
                <View className="bg-background rounded-lg p-3 mb-4" style={{ borderWidth: 1, borderColor: BEACON_CODE_COLORS.green.primary }}>
                  <Text style={{ color: BEACON_CODE_COLORS.green.primary, fontWeight: '600', marginBottom: 4 }}>
                    ✓ Will be assigned GREEN beacon
                  </Text>
                  <Text style={{ color: BEACON_CODE_COLORS.green.text, fontSize: 12 }}>
                    Standard monitoring - can be upgraded later if needed
                  </Text>
                </View>
                
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => setShowNewPatient(false)}
                    className="flex-1 p-3 rounded-lg"
                    style={{ backgroundColor: colors.muted + '20' }}
                  >
                    <Text className="text-center text-foreground font-medium">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCreatePatient}
                    className="flex-1 p-3 rounded-lg"
                    style={{ backgroundColor: BEACON_CODE_COLORS.green.primary }}
                  >
                    <Text className="text-center text-white font-medium">Register Patient</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Patient List */}
            {onboardings.map((onboarding) => {
              const statusColor = STATUS_COLORS[onboarding.status];
              
              return (
                <View
                  key={onboarding.id}
                  className="bg-surface rounded-xl mb-3 overflow-hidden"
                  style={{ borderWidth: 1, borderColor: statusColor.primary + '40' }}
                >
                  <View style={{ height: 3, backgroundColor: statusColor.primary }} />
                  <View className="p-4">
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center gap-2">
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                            backgroundColor: statusColor.background,
                          }}
                        >
                          <Text style={{ fontSize: 10, color: statusColor.primary, fontWeight: '600', textTransform: 'uppercase' }}>
                            {onboarding.status.replace('_', ' ')}
                          </Text>
                        </View>
                        <Text className="text-xs text-muted">{onboarding.userId}</Text>
                      </View>
                      {onboarding.beaconCode && (
                        <View className="flex-row items-center gap-1">
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: BEACON_CODE_COLORS[onboarding.beaconCode as keyof typeof BEACON_CODE_COLORS]?.primary || colors.muted }} />
                          <Text className="text-xs text-muted">{onboarding.beaconId}</Text>
                        </View>
                      )}
                    </View>
                    
                    <Text className="text-foreground font-semibold text-lg">{onboarding.fullName}</Text>
                    
                    <View className="flex-row flex-wrap gap-3 mt-2">
                      {onboarding.email && (
                        <Text className="text-xs text-muted">📧 {onboarding.email}</Text>
                      )}
                      {onboarding.wachsRegion && (
                        <Text className="text-xs text-muted">📍 {onboarding.wachsRegion.replace('_', ' ')}</Text>
                      )}
                      <Text className="text-xs text-muted">
                        👤 {onboarding.userType.replace('_', ' ')}
                      </Text>
                    </View>
                    
                    <Text className="text-xs text-muted mt-2">
                      Created: {formatDate(onboarding.createdAt)}
                    </Text>
                    
                    {onboarding.status === 'pending' && !onboarding.beaconId && (
                      <TouchableOpacity
                        onPress={() => handleAssignBeacon(onboarding.id)}
                        style={{
                          marginTop: 12,
                          padding: 10,
                          borderRadius: 8,
                          backgroundColor: BEACON_CODE_COLORS.green.primary,
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontWeight: '600', textAlign: 'center' }}>
                          Assign Green Beacon & Approve
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        )}

        {activeTab === 'staffing' && (
          <>
            {/* WACHS Staffing Notice */}
            <View 
              className="rounded-xl p-4 mb-4"
              style={{ backgroundColor: STATUS_COLORS.awaiting_staffing.background, borderWidth: 1, borderColor: STATUS_COLORS.awaiting_staffing.primary }}
            >
              <Text style={{ color: STATUS_COLORS.awaiting_staffing.primary, fontWeight: '700', marginBottom: 4 }}>
                WACHS Staffing Approval Required
              </Text>
              <Text style={{ color: STATUS_COLORS.awaiting_staffing.text, fontSize: 12 }}>
                Staff roles (nurse, doctor, admin, technician) require WACHS HR approval before activation.
                Users remain as patients until approved.
              </Text>
            </View>

            {/* Staffing Requests */}
            {staffingRequests.length === 0 ? (
              <View className="bg-surface rounded-xl p-6 border border-border">
                <Text className="text-muted text-center">No pending staffing requests</Text>
              </View>
            ) : (
              staffingRequests.map((request) => {
                const statusColors = {
                  pending: { primary: '#6B7280', background: '#F3F4F6' },
                  under_review: { primary: '#3B82F6', background: '#EFF6FF' },
                  approved: { primary: '#22C55E', background: '#F0FDF4' },
                  rejected: { primary: '#EF4444', background: '#FEF2F2' },
                };
                const reqColor = statusColors[request.status];
                
                return (
                  <View
                    key={request.id}
                    className="bg-surface rounded-xl mb-3 overflow-hidden"
                    style={{ borderWidth: 1, borderColor: reqColor.primary + '40' }}
                  >
                    <View style={{ height: 3, backgroundColor: reqColor.primary }} />
                    <View className="p-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                            backgroundColor: reqColor.background,
                          }}
                        >
                          <Text style={{ fontSize: 10, color: reqColor.primary, fontWeight: '600', textTransform: 'uppercase' }}>
                            {request.status.replace('_', ' ')}
                          </Text>
                        </View>
                        <Text className="text-xs text-muted">{request.id}</Text>
                      </View>
                      
                      <Text className="text-foreground font-semibold text-lg">{request.userName}</Text>
                      
                      <View className="flex-row flex-wrap gap-3 mt-2">
                        <View className="flex-row items-center gap-1">
                          <Text className="text-xs text-muted">Role:</Text>
                          <Text className="text-xs font-medium text-foreground capitalize">{request.requestedRole}</Text>
                        </View>
                        <Text className="text-xs text-muted">📍 {request.wachsRegion.replace('_', ' ')}</Text>
                        <Text className="text-xs text-muted">🏥 {request.wachsSite}</Text>
                      </View>
                      
                      {request.credentials && request.credentials.length > 0 && (
                        <View className="mt-2">
                          <Text className="text-xs text-muted mb-1">Credentials:</Text>
                          <View className="flex-row flex-wrap gap-1">
                            {request.credentials.map((cred, i) => (
                              <View key={i} style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: colors.primary + '20' }}>
                                <Text style={{ fontSize: 10, color: colors.primary }}>{cred}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                      
                      <Text className="text-xs text-muted mt-2">
                        Requested: {formatDate(request.requestedAt)}
                      </Text>
                      
                      {(request.status === 'pending' || request.status === 'under_review') && (
                        <View className="flex-row gap-2 mt-3">
                          <TouchableOpacity
                            onPress={() => handleApproveStaffing(request.id)}
                            className="flex-1 p-3 rounded-lg"
                            style={{ backgroundColor: '#22C55E' }}
                          >
                            <Text style={{ color: '#FFFFFF', fontWeight: '600', textAlign: 'center' }}>
                              Approve
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            className="flex-1 p-3 rounded-lg"
                            style={{ backgroundColor: '#EF4444' }}
                          >
                            <Text style={{ color: '#FFFFFF', fontWeight: '600', textAlign: 'center' }}>
                              Reject
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      
                      {request.status === 'approved' && request.reviewedBy && (
                        <View className="mt-2 pt-2 border-t border-border">
                          <Text className="text-xs text-muted">
                            ✓ Approved by {request.reviewedBy} on {formatDate(request.reviewedAt!)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        <View className="h-8" />
      </ScrollView>
    </ScreenContainer>
  );
}
