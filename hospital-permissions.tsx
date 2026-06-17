import { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Alert, ActivityIndicator, FlatList, TextInput } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  HospitalRole,
  PermissionAuditEntry,
  ALL_PERMISSIONS,
  getHospitalRoles,
  initializeHospitalRoles,
  saveHospitalRole,
  getAuditLog,
  resetToDefaultRoles,
  createCustomRole,
  Department,
} from '@/lib/hospital-permissions';

type TabType = 'roles' | 'create' | 'audit';

const DEPARTMENTS: Department[] = [
  'emergency', 'surgery', 'icu', 'pediatrics', 'oncology', 'cardiology',
  'neurology', 'radiology', 'pathology', 'pharmacy', 'administration', 'it', 'maintenance'
];

export default function HospitalPermissionsScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('roles');
  const [roles, setRoles] = useState<HospitalRole[]>([]);
  const [auditLog, setAuditLog] = useState<PermissionAuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<HospitalRole | null>(null);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    authorityLevel: 3,
    departments: [] as Department[],
    permissions: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await initializeHospitalRoles();
      const [r, a] = await Promise.all([
        getHospitalRoles(),
        getAuditLog(100),
      ]);
      setRoles(r);
      setAuditLog(a);
    } catch (error) {
      console.error('Error loading permissions data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'This will reset all roles to their default configuration. Custom roles will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetToDefaultRoles('current_user');
            await loadData();
            Alert.alert('Success', 'Roles reset to defaults');
          },
        },
      ]
    );
  };

  const handleTogglePermission = async (role: HospitalRole, permission: string) => {
    const hasPermission = role.permissions.includes(permission);
    const updatedPermissions = hasPermission
      ? role.permissions.filter(p => p !== permission)
      : [...role.permissions, permission];
    
    const updatedRole = { ...role, permissions: updatedPermissions };
    await saveHospitalRole(updatedRole, 'current_user', `${hasPermission ? 'Revoked' : 'Granted'} ${permission}`);
    await loadData();
  };

  const handleCreateRole = async () => {
    if (!newRole.name || !newRole.description) {
      Alert.alert('Error', 'Name and description are required');
      return;
    }
    
    try {
      await createCustomRole(
        newRole.name,
        newRole.description,
        newRole.authorityLevel,
        newRole.departments.length > 0 ? newRole.departments : ['all'],
        newRole.permissions,
        'current_user'
      );
      setNewRole({ name: '', description: '', authorityLevel: 3, departments: [], permissions: [] });
      setActiveTab('roles');
      await loadData();
      Alert.alert('Success', 'Custom role created');
    } catch (error) {
      Alert.alert('Error', 'Failed to create role');
    }
  };

  const getAuthorityColor = (level: number) => {
    if (level >= 9) return '#8B5CF6';
    if (level >= 7) return '#3B82F6';
    if (level >= 5) return '#10B981';
    if (level >= 3) return '#F59E0B';
    return colors.muted;
  };

  const renderRole = ({ item }: { item: HospitalRole }) => (
    <TouchableOpacity
      className="mb-3 p-4 rounded-xl border"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      onPress={() => setSelectedRole(selectedRole?.id === item.id ? null : item)}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-foreground font-bold text-lg">{item.name}</Text>
            {item.isCustom && (
              <View className="ml-2 px-2 py-0.5 rounded-full bg-primary/20">
                <Text style={{ color: colors.primary, fontSize: 10 }}>Custom</Text>
              </View>
            )}
          </View>
          <Text className="text-muted text-sm">{item.description}</Text>
        </View>
        <View 
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: getAuthorityColor(item.authorityLevel) + '20' }}
        >
          <Text style={{ color: getAuthorityColor(item.authorityLevel), fontWeight: 'bold' }}>
            L{item.authorityLevel}
          </Text>
        </View>
      </View>
      
      <View className="flex-row flex-wrap gap-1 mb-2">
        {item.departments.slice(0, 4).map(dept => (
          <View key={dept} className="px-2 py-0.5 rounded-full bg-muted/20">
            <Text className="text-muted text-xs capitalize">{dept}</Text>
          </View>
        ))}
        {item.departments.length > 4 && (
          <Text className="text-muted text-xs">+{item.departments.length - 4} more</Text>
        )}
      </View>
      
      <View className="flex-row items-center gap-4">
        <Text className="text-muted text-xs">{item.permissions.length} permissions</Text>
        {item.emergencyOverride && (
          <Text className="text-error text-xs">Emergency Override</Text>
        )}
        {item.jediAccess && (
          <Text style={{ color: '#8B5CF6', fontSize: 10 }}>JEDI Access</Text>
        )}
      </View>
      
      {selectedRole?.id === item.id && (
        <View className="mt-4 pt-4 border-t border-border">
          <Text className="text-foreground font-bold mb-2">Permissions</Text>
          <View className="flex-row flex-wrap gap-1">
            {ALL_PERMISSIONS.slice(0, 20).map(perm => {
              const key = `${perm.category}:${perm.action}`;
              const hasIt = item.permissions.includes(key);
              return (
                <TouchableOpacity
                  key={key}
                  className="px-2 py-1 rounded-full"
                  style={{ 
                    backgroundColor: hasIt ? colors.success + '20' : colors.muted + '10',
                    borderWidth: 1,
                    borderColor: hasIt ? colors.success : colors.border,
                  }}
                  onPress={() => handleTogglePermission(item, key)}
                >
                  <Text style={{ 
                    color: hasIt ? colors.success : colors.muted,
                    fontSize: 10,
                  }}>
                    {perm.category}:{perm.action}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text className="text-muted text-xs mt-2">Tap to toggle permissions</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderAuditEntry = ({ item }: { item: PermissionAuditEntry }) => (
    <View 
      className="mb-2 p-3 rounded-lg border"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View 
            className="w-2 h-2 rounded-full mr-2"
            style={{ 
              backgroundColor: item.action === 'grant' ? colors.success :
                              item.action === 'revoke' ? colors.error :
                              item.action === 'create' ? colors.primary :
                              colors.warning
            }}
          />
          <Text className="text-foreground font-medium capitalize">{item.action}</Text>
        </View>
        <Text className="text-muted text-xs">
          {new Date(item.timestamp).toLocaleString()}
        </Text>
      </View>
      <Text className="text-muted text-sm mt-1">{item.changes}</Text>
      <Text className="text-muted text-xs">Role: {item.roleName} • By: {item.performedBy}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Loading Permissions...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="px-5 pt-6 pb-4">
        <Text className="text-foreground text-2xl font-bold">Hospital Permissions</Text>
        <Text className="text-muted mt-1">Role-based access control configuration</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row px-5 mb-4">
        {(['roles', 'create', 'audit'] as TabType[]).map(tab => (
          <TouchableOpacity
            key={tab}
            className="flex-1 py-2 items-center rounded-lg mr-2"
            style={{ backgroundColor: activeTab === tab ? colors.primary : colors.surface }}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={{ 
              color: activeTab === tab ? 'white' : colors.foreground,
              fontWeight: '600',
              textTransform: 'capitalize',
            }}>
              {tab === 'create' ? 'New Role' : tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'roles' && (
        <View className="flex-1">
          <View className="px-5 mb-3">
            <TouchableOpacity
              className="py-2 px-4 rounded-lg self-end"
              style={{ backgroundColor: colors.error + '20' }}
              onPress={handleResetDefaults}
            >
              <Text style={{ color: colors.error, fontWeight: '600', fontSize: 12 }}>Reset to Defaults</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={roles.sort((a, b) => b.authorityLevel - a.authorityLevel)}
            renderItem={renderRole}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          />
        </View>
      )}

      {activeTab === 'create' && (
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          <View 
            className="p-4 rounded-xl border mb-4"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <Text className="text-foreground font-bold mb-3">Create Custom Role</Text>
            
            <Text className="text-muted text-sm mb-1">Role Name</Text>
            <TextInput
              className="bg-background border border-border rounded-lg p-3 text-foreground mb-3"
              placeholder="e.g., Senior Nurse"
              placeholderTextColor={colors.muted}
              value={newRole.name}
              onChangeText={(text) => setNewRole(prev => ({ ...prev, name: text }))}
            />
            
            <Text className="text-muted text-sm mb-1">Description</Text>
            <TextInput
              className="bg-background border border-border rounded-lg p-3 text-foreground mb-3"
              placeholder="Role description"
              placeholderTextColor={colors.muted}
              value={newRole.description}
              onChangeText={(text) => setNewRole(prev => ({ ...prev, description: text }))}
              multiline
            />
            
            <Text className="text-muted text-sm mb-2">Authority Level: {newRole.authorityLevel}</Text>
            <View className="flex-row gap-2 mb-4">
              {[1, 2, 3, 4, 5, 6, 7].map(level => (
                <TouchableOpacity
                  key={level}
                  className="flex-1 py-2 rounded-lg items-center"
                  style={{ 
                    backgroundColor: newRole.authorityLevel === level 
                      ? getAuthorityColor(level) 
                      : colors.muted + '20'
                  }}
                  onPress={() => setNewRole(prev => ({ ...prev, authorityLevel: level }))}
                >
                  <Text style={{ 
                    color: newRole.authorityLevel === level ? 'white' : colors.foreground,
                    fontWeight: '600',
                  }}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text className="text-muted text-sm mb-2">Departments</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {DEPARTMENTS.map(dept => (
                <TouchableOpacity
                  key={dept}
                  className="px-3 py-1 rounded-full"
                  style={{ 
                    backgroundColor: newRole.departments.includes(dept) 
                      ? colors.primary + '20' 
                      : colors.muted + '10',
                    borderWidth: 1,
                    borderColor: newRole.departments.includes(dept) ? colors.primary : colors.border,
                  }}
                  onPress={() => {
                    setNewRole(prev => ({
                      ...prev,
                      departments: prev.departments.includes(dept)
                        ? prev.departments.filter(d => d !== dept)
                        : [...prev.departments, dept]
                    }));
                  }}
                >
                  <Text style={{ 
                    color: newRole.departments.includes(dept) ? colors.primary : colors.muted,
                    fontSize: 12,
                    textTransform: 'capitalize',
                  }}>
                    {dept}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity
              className="py-3 rounded-xl items-center"
              style={{ backgroundColor: colors.primary }}
              onPress={handleCreateRole}
            >
              <Text className="text-white font-bold">Create Role</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {activeTab === 'audit' && (
        <FlatList
          data={auditLog}
          renderItem={renderAuditEntry}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center py-8">
              <Text className="text-muted">No audit entries yet</Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}
