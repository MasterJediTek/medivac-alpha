import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { homingBeaconService, HomingBeacon, BeaconCode, BeaconStatus, DEFAULT_BEACON_CODE, BEACON_CODE_COLORS, BEACON_STATUS_COLORS } from "@/lib/services/homing-beacon-service";

export default function HomingBeaconsScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [beacons, setBeacons] = useState<HomingBeacon[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedCode, setSelectedCode] = useState<BeaconCode | 'all'>('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientId, setNewPatientId] = useState('');
  const [expandedBeacon, setExpandedBeacon] = useState<string | null>(null);

  useEffect(() => {
    loadBeacons();
  }, [selectedCode]);

  const loadBeacons = async () => {
    setLoading(true);
    await homingBeaconService.initialize();
    
    const filter: any = { assigned: true };
    if (selectedCode !== 'all') filter.code = [selectedCode];
    
    setBeacons(homingBeaconService.getBeacons(filter));
    setStats(homingBeaconService.getStats());
    setLoading(false);
  };

  const handleAssignNewPatient = async () => {
    if (!newPatientName || !newPatientId) return;
    
    await homingBeaconService.assignBeaconToNewUser(
      newPatientId,
      newPatientName,
      'patient',
      'Current User',
      DEFAULT_BEACON_CODE, // Always green for new patients
      'Perth',
      'New patient admission'
    );
    
    setNewPatientName('');
    setNewPatientId('');
    setShowAssignModal(false);
    loadBeacons();
  };

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60 * 1000) return 'Just now';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
    return date.toLocaleDateString();
  };

  const getBatteryColor = (level?: number) => {
    if (!level) return colors.muted;
    if (level > 50) return '#22C55E';
    if (level > 20) return '#F59E0B';
    return '#EF4444';
  };

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Loading beacons...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">Homing Beacons</Text>
          <Text className="text-muted">Color-coded patient tracking system</Text>
        </View>

        {/* Default Code Notice */}
        <View 
          className="rounded-xl p-4 mb-4"
          style={{ backgroundColor: BEACON_CODE_COLORS.green.background, borderWidth: 1, borderColor: BEACON_CODE_COLORS.green.primary }}
        >
          <View className="flex-row items-center gap-2 mb-1">
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: BEACON_CODE_COLORS.green.primary }} />
            <Text style={{ color: BEACON_CODE_COLORS.green.primary, fontWeight: '700' }}>DEFAULT: GREEN CODE</Text>
          </View>
          <Text style={{ color: BEACON_CODE_COLORS.green.text, fontSize: 12 }}>
            All new patients automatically receive a GREEN beacon for standard monitoring
          </Text>
        </View>

        {/* Stats Overview */}
        <View className="flex-row flex-wrap gap-2 mb-4">
          <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3 border border-border">
            <Text className="text-xs text-muted">Total</Text>
            <Text className="text-2xl font-bold text-foreground">{stats?.total || 0}</Text>
          </View>
          <View 
            className="flex-1 min-w-[100px] rounded-xl p-3"
            style={{ backgroundColor: '#22C55E20', borderWidth: 1, borderColor: '#22C55E' }}
          >
            <Text style={{ color: '#22C55E', fontSize: 12 }}>Active</Text>
            <Text style={{ color: '#22C55E', fontSize: 24, fontWeight: '700' }}>{stats?.assigned || 0}</Text>
          </View>
          <View 
            className="flex-1 min-w-[100px] rounded-xl p-3"
            style={{ backgroundColor: '#3B82F620', borderWidth: 1, borderColor: '#3B82F6' }}
          >
            <Text style={{ color: '#3B82F6', fontSize: 12 }}>Available</Text>
            <Text style={{ color: '#3B82F6', fontSize: 24, fontWeight: '700' }}>{stats?.available || 0}</Text>
          </View>
          {stats?.lowBattery > 0 && (
            <View 
              className="flex-1 min-w-[100px] rounded-xl p-3"
              style={{ backgroundColor: '#EF444420', borderWidth: 1, borderColor: '#EF4444' }}
            >
              <Text style={{ color: '#EF4444', fontSize: 12 }}>Low Battery</Text>
              <Text style={{ color: '#EF4444', fontSize: 24, fontWeight: '700' }}>{stats.lowBattery}</Text>
            </View>
          )}
        </View>

        {/* Code Filter */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-muted mb-2">Filter by Code</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setSelectedCode('all')}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: selectedCode === 'all' ? colors.primary : colors.primary + '20',
                  borderWidth: 1,
                  borderColor: colors.primary,
                }}
              >
                <Text style={{ color: selectedCode === 'all' ? '#FFFFFF' : colors.primary, fontWeight: '600' }}>
                  All ({stats?.assigned || 0})
                </Text>
              </TouchableOpacity>
              {(Object.keys(BEACON_CODE_COLORS) as BeaconCode[]).map((code) => {
                const codeColor = BEACON_CODE_COLORS[code];
                const count = stats?.byCode[code] || 0;
                const isSelected = selectedCode === code;
                return (
                  <TouchableOpacity
                    key={code}
                    onPress={() => setSelectedCode(code)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: isSelected ? codeColor.primary : codeColor.background,
                      borderWidth: 1,
                      borderColor: codeColor.primary,
                    }}
                  >
                    <Text style={{ color: isSelected ? '#FFFFFF' : codeColor.primary, fontWeight: '600', textTransform: 'capitalize' }}>
                      {code} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Code Legend */}
        <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
          <Text className="text-sm font-medium text-foreground mb-3">Beacon Code Legend</Text>
          {(Object.entries(BEACON_CODE_COLORS) as [BeaconCode, typeof BEACON_CODE_COLORS[BeaconCode]][]).map(([code, info]) => (
            <View key={code} className="flex-row items-center mb-2">
              <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: info.primary, marginRight: 8 }} />
              <Text style={{ color: info.primary, fontWeight: '600', textTransform: 'uppercase', width: 60 }}>{code}</Text>
              <Text className="text-xs text-muted flex-1">{info.description}</Text>
            </View>
          ))}
        </View>

        {/* Assign New Patient Button */}
        <TouchableOpacity
          onPress={() => setShowAssignModal(true)}
          style={{
            padding: 16,
            borderRadius: 12,
            backgroundColor: BEACON_CODE_COLORS.green.primary,
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16 }}>
            + Assign Green Beacon to New Patient
          </Text>
        </TouchableOpacity>

        {/* Assignment Modal */}
        {showAssignModal && (
          <View className="bg-surface rounded-xl p-4 mb-4 border-2" style={{ borderColor: BEACON_CODE_COLORS.green.primary }}>
            <Text className="text-lg font-semibold text-foreground mb-4">Assign Green Beacon</Text>
            
            <View className="mb-3">
              <Text className="text-sm text-muted mb-1">Patient ID</Text>
              <TextInput
                value={newPatientId}
                onChangeText={setNewPatientId}
                placeholder="e.g., P-2024-0900"
                placeholderTextColor={colors.muted}
                className="bg-background rounded-lg p-3 text-foreground"
                style={{ borderWidth: 1, borderColor: colors.border }}
              />
            </View>
            
            <View className="mb-4">
              <Text className="text-sm text-muted mb-1">Patient Name</Text>
              <TextInput
                value={newPatientName}
                onChangeText={setNewPatientName}
                placeholder="Full name"
                placeholderTextColor={colors.muted}
                className="bg-background rounded-lg p-3 text-foreground"
                style={{ borderWidth: 1, borderColor: colors.border }}
              />
            </View>
            
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setShowAssignModal(false)}
                className="flex-1 p-3 rounded-lg"
                style={{ backgroundColor: colors.muted + '20' }}
              >
                <Text className="text-center text-foreground font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAssignNewPatient}
                className="flex-1 p-3 rounded-lg"
                style={{ backgroundColor: BEACON_CODE_COLORS.green.primary }}
              >
                <Text className="text-center text-white font-medium">Assign Green Beacon</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Active Beacons List */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Active Beacons ({beacons.length})
          </Text>
          
          {beacons.length === 0 ? (
            <View className="bg-surface rounded-xl p-6 border border-border">
              <Text className="text-muted text-center">No active beacons match your filters</Text>
            </View>
          ) : (
            beacons.map((beacon) => {
              const codeColor = BEACON_CODE_COLORS[beacon.code];
              const statusColor = BEACON_STATUS_COLORS[beacon.status];
              const isExpanded = expandedBeacon === beacon.id;
              
              return (
                <TouchableOpacity
                  key={beacon.id}
                  onPress={() => setExpandedBeacon(isExpanded ? null : beacon.id)}
                  activeOpacity={0.7}
                >
                  <View
                    className="bg-surface rounded-xl mb-3 overflow-hidden"
                    style={{ borderWidth: 1, borderColor: codeColor.primary + '40' }}
                  >
                    {/* Code indicator bar */}
                    <View style={{ height: 4, backgroundColor: codeColor.primary }} />
                    
                    <View className="p-4">
                      {/* Header */}
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center gap-2">
                          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: codeColor.primary }} />
                          <Text style={{ color: codeColor.primary, fontWeight: '700', fontSize: 12 }}>{beacon.id}</Text>
                          <View
                            style={{
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                              backgroundColor: statusColor.background,
                            }}
                          >
                            <Text style={{ fontSize: 10, color: statusColor.primary, fontWeight: '600', textTransform: 'uppercase' }}>
                              {beacon.status}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <Text style={{ fontSize: 11, color: getBatteryColor(beacon.batteryLevel) }}>
                            🔋 {beacon.batteryLevel}%
                          </Text>
                        </View>
                      </View>
                      
                      {/* Patient Info */}
                      <Text className="text-foreground font-semibold">{beacon.assignedToName}</Text>
                      <Text className="text-sm text-muted">{beacon.assignedTo}</Text>
                      
                      {/* Quick Stats */}
                      <View className="flex-row items-center gap-4 mt-2">
                        <Text className="text-xs text-muted">
                          Last ping: {formatTimeAgo(beacon.lastPing)}
                        </Text>
                        {beacon.wachsSite && (
                          <Text className="text-xs text-muted">
                            Site: {beacon.wachsSite}
                          </Text>
                        )}
                      </View>
                      
                      {/* Expanded Details */}
                      {isExpanded && (
                        <View className="mt-3 pt-3 border-t border-border">
                          <View className="flex-row flex-wrap gap-4 mb-3">
                            <View>
                              <Text className="text-xs text-muted">Assigned</Text>
                              <Text className="text-foreground font-medium">{formatTimeAgo(beacon.assignedAt)}</Text>
                            </View>
                            <View>
                              <Text className="text-xs text-muted">Role</Text>
                              <Text className="text-foreground font-medium capitalize">{beacon.assignedToRole}</Text>
                            </View>
                            {beacon.location && (
                              <View>
                                <Text className="text-xs text-muted">Location</Text>
                                <Text className="text-foreground font-medium">
                                  {beacon.location.lat.toFixed(4)}, {beacon.location.lng.toFixed(4)}
                                </Text>
                              </View>
                            )}
                          </View>
                          
                          {beacon.notes && (
                            <View className="bg-background rounded-lg p-2 mb-3">
                              <Text className="text-xs text-muted">Notes</Text>
                              <Text className="text-sm text-foreground">{beacon.notes}</Text>
                            </View>
                          )}
                          
                          {/* Actions */}
                          <View className="flex-row gap-2">
                            {beacon.code !== 'red' && (
                              <TouchableOpacity
                                style={{
                                  flex: 1,
                                  paddingVertical: 8,
                                  borderRadius: 6,
                                  backgroundColor: BEACON_CODE_COLORS.orange.background,
                                  borderWidth: 1,
                                  borderColor: BEACON_CODE_COLORS.orange.primary,
                                }}
                              >
                                <Text style={{ color: BEACON_CODE_COLORS.orange.primary, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
                                  Upgrade Code
                                </Text>
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              style={{
                                flex: 1,
                                paddingVertical: 8,
                                borderRadius: 6,
                                backgroundColor: colors.muted + '20',
                              }}
                            >
                              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
                                View History
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
