import { useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Switch, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';

// Role Types
type RoleLevel = 'admin' | 'manager' | 'staff' | 'viewer' | 'guest';
type JediRank = 'grandmaster' | 'council' | 'master' | 'knight' | 'padawan';

// User Role
interface UserRole {
  id: string;
  name: string;
  level: RoleLevel;
  jediRank: JediRank;
  description: string;
  permissions: Permission[];
  modules: string[];
  color: string;
  userCount: number;
  isSystem: boolean;
}

// Permission
interface Permission {
  id: string;
  name: string;
  category: string;
  description: string;
}

// User Group
interface UserGroup {
  id: string;
  name: string;
  description: string;
  roles: string[];
  memberCount: number;
  color: string;
}

// User
interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  roleId: string;
  groupIds: string[];
  status: 'active' | 'inactive' | 'pending';
  lastLogin: number;
  jediRank: JediRank;
}

// All Permissions
const ALL_PERMISSIONS: Permission[] = [
  // Patient
  { id: 'perm-patient-view', name: 'View Patients', category: 'Patient', description: 'View patient records' },
  { id: 'perm-patient-create', name: 'Create Patients', category: 'Patient', description: 'Create new patient records' },
  { id: 'perm-patient-edit', name: 'Edit Patients', category: 'Patient', description: 'Edit patient records' },
  { id: 'perm-patient-delete', name: 'Delete Patients', category: 'Patient', description: 'Delete patient records' },
  
  // Medical
  { id: 'perm-medical-view', name: 'View Medical', category: 'Medical', description: 'View medical records' },
  { id: 'perm-medical-prescribe', name: 'Prescribe', category: 'Medical', description: 'Prescribe medications' },
  { id: 'perm-medical-surgery', name: 'Surgery Access', category: 'Medical', description: 'Access surgery scheduling' },
  { id: 'perm-medical-labs', name: 'Lab Results', category: 'Medical', description: 'View and manage lab results' },
  
  // Admin
  { id: 'perm-admin-users', name: 'Manage Users', category: 'Admin', description: 'Manage user accounts' },
  { id: 'perm-admin-roles', name: 'Manage Roles', category: 'Admin', description: 'Manage roles and permissions' },
  { id: 'perm-admin-settings', name: 'System Settings', category: 'Admin', description: 'Access system settings' },
  { id: 'perm-admin-audit', name: 'Audit Logs', category: 'Admin', description: 'View audit logs' },
  
  // JEDI
  { id: 'perm-jedi-command', name: 'JEDI Command', category: 'JEDI', description: 'Execute JEDI commands' },
  { id: 'perm-jedi-sync', name: 'JEDI Sync', category: 'JEDI', description: 'Sync with JEDI systems' },
  { id: 'perm-jedi-config', name: 'JEDI Config', category: 'JEDI', description: 'Configure JEDI integration' },
  
  // Communications
  { id: 'perm-comms-send', name: 'Send Messages', category: 'Communications', description: 'Send messages and alerts' },
  { id: 'perm-comms-broadcast', name: 'Broadcast', category: 'Communications', description: 'Send broadcast messages' },
  { id: 'perm-comms-emergency', name: 'Emergency Alerts', category: 'Communications', description: 'Send emergency alerts' },
];

// Default Roles
const DEFAULT_ROLES: UserRole[] = [
  {
    id: 'role-admin',
    name: 'Administrator',
    level: 'admin',
    jediRank: 'grandmaster',
    description: 'Full system access with all permissions',
    permissions: ALL_PERMISSIONS,
    modules: ['all'],
    color: '#9333EA',
    userCount: 2,
    isSystem: true,
  },
  {
    id: 'role-cmo',
    name: 'Chief Medical Officer',
    level: 'manager',
    jediRank: 'council',
    description: 'Medical leadership with approval authority',
    permissions: ALL_PERMISSIONS.filter(p => !p.id.includes('admin-roles') && !p.id.includes('admin-settings')),
    modules: ['patient', 'medical', 'staff', 'reports', 'communications'],
    color: '#DC2626',
    userCount: 3,
    isSystem: true,
  },
  {
    id: 'role-doctor',
    name: 'Doctor',
    level: 'staff',
    jediRank: 'master',
    description: 'Medical practitioner with patient care access',
    permissions: ALL_PERMISSIONS.filter(p => p.category === 'Patient' || p.category === 'Medical' || p.id === 'perm-comms-send'),
    modules: ['patient', 'medical', 'appointments', 'labs'],
    color: '#2563EB',
    userCount: 15,
    isSystem: true,
  },
  {
    id: 'role-nurse',
    name: 'Nurse',
    level: 'staff',
    jediRank: 'knight',
    description: 'Nursing staff with patient care duties',
    permissions: ALL_PERMISSIONS.filter(p => p.id.includes('view') || p.id === 'perm-patient-edit' || p.id === 'perm-comms-send'),
    modules: ['patient', 'medications', 'rooms', 'tasks'],
    color: '#16A34A',
    userCount: 28,
    isSystem: true,
  },
  {
    id: 'role-receptionist',
    name: 'Receptionist',
    level: 'staff',
    jediRank: 'padawan',
    description: 'Front desk and appointment management',
    permissions: ALL_PERMISSIONS.filter(p => p.id === 'perm-patient-view' || p.id === 'perm-patient-create' || p.id === 'perm-comms-send'),
    modules: ['appointments', 'patient', 'communications'],
    color: '#F59E0B',
    userCount: 8,
    isSystem: true,
  },
  {
    id: 'role-security',
    name: 'Security Guard',
    level: 'staff',
    jediRank: 'knight',
    description: 'Security and guard handover management',
    permissions: ALL_PERMISSIONS.filter(p => p.id.includes('view') || p.id === 'perm-comms-emergency'),
    modules: ['guard_handover', 'alerts', 'incidents'],
    color: '#0891B2',
    userCount: 6,
    isSystem: true,
  },
  {
    id: 'role-viewer',
    name: 'Viewer',
    level: 'viewer',
    jediRank: 'padawan',
    description: 'Read-only access to basic information',
    permissions: ALL_PERMISSIONS.filter(p => p.id.includes('view')),
    modules: ['dashboard', 'reports'],
    color: '#6B7280',
    userCount: 12,
    isSystem: true,
  },
];

// Default Groups
const DEFAULT_GROUPS: UserGroup[] = [
  { id: 'grp-medical', name: 'Medical Staff', description: 'All medical practitioners', roles: ['role-cmo', 'role-doctor', 'role-nurse'], memberCount: 46, color: '#2563EB' },
  { id: 'grp-admin', name: 'Administration', description: 'Administrative staff', roles: ['role-admin', 'role-receptionist'], memberCount: 10, color: '#9333EA' },
  { id: 'grp-security', name: 'Security Team', description: 'Security personnel', roles: ['role-security'], memberCount: 6, color: '#0891B2' },
  { id: 'grp-jedi', name: 'JEDI Council', description: 'JEDI system administrators', roles: ['role-admin', 'role-cmo'], memberCount: 5, color: '#DC2626' },
];

// Sample Users
const SAMPLE_USERS: User[] = [
  { id: 'user-1', name: 'Stephen Orazi', email: 'stephen@jeditek.com.au', avatar: '👨‍💼', roleId: 'role-admin', groupIds: ['grp-admin', 'grp-jedi'], status: 'active', lastLogin: Date.now(), jediRank: 'grandmaster' },
  { id: 'user-2', name: 'Dr. Sarah Chen', email: 'sarah@medivac.com.au', avatar: '👩‍⚕️', roleId: 'role-cmo', groupIds: ['grp-medical', 'grp-jedi'], status: 'active', lastLogin: Date.now() - 3600000, jediRank: 'council' },
  { id: 'user-3', name: 'Dr. James Wilson', email: 'james@medivac.com.au', avatar: '👨‍⚕️', roleId: 'role-doctor', groupIds: ['grp-medical'], status: 'active', lastLogin: Date.now() - 7200000, jediRank: 'master' },
  { id: 'user-4', name: 'Nurse Emily Brown', email: 'emily@medivac.com.au', avatar: '👩‍⚕️', roleId: 'role-nurse', groupIds: ['grp-medical'], status: 'active', lastLogin: Date.now() - 14400000, jediRank: 'knight' },
  { id: 'user-5', name: 'Mike Johnson', email: 'mike@medivac.com.au', avatar: '👮', roleId: 'role-security', groupIds: ['grp-security'], status: 'active', lastLogin: Date.now() - 28800000, jediRank: 'knight' },
];

// Level Colors
const LEVEL_COLORS: Record<RoleLevel, string> = {
  admin: '#9333EA',
  manager: '#DC2626',
  staff: '#2563EB',
  viewer: '#6B7280',
  guest: '#9CA3AF',
};

// Jedi Rank Colors
const JEDI_COLORS: Record<JediRank, string> = {
  grandmaster: '#9333EA',
  council: '#DC2626',
  master: '#2563EB',
  knight: '#16A34A',
  padawan: '#F59E0B',
};

// Status Colors
const STATUS_COLORS = {
  active: '#22C55E',
  inactive: '#9CA3AF',
  pending: '#F59E0B',
};

export default function RolesManagerScreen() {
  const router = useRouter();
  const [roles, setRoles] = useState<UserRole[]>(DEFAULT_ROLES);
  const [groups, setGroups] = useState<UserGroup[]>(DEFAULT_GROUPS);
  const [users, setUsers] = useState<User[]>(SAMPLE_USERS);
  const [activeTab, setActiveTab] = useState<'roles' | 'groups' | 'users' | 'permissions'>('roles');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter users
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get role by ID
  const getRoleById = (roleId: string) => roles.find(r => r.id === roleId);

  // Render role card
  const renderRoleCard = (role: UserRole) => (
    <TouchableOpacity
      key={role.id}
      className="bg-surface rounded-xl p-4 mb-3 border border-border"
      onPress={() => { setSelectedRole(role); setShowRoleModal(true); }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View 
            className="w-12 h-12 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: role.color + '20' }}
          >
            <Text style={{ color: role.color }} className="text-xl">👤</Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-foreground font-semibold">{role.name}</Text>
              {role.isSystem && (
                <View className="bg-muted/20 rounded px-1.5 py-0.5 ml-2">
                  <Text className="text-muted text-xs">System</Text>
                </View>
              )}
            </View>
            <Text className="text-muted text-xs mt-1">{role.description}</Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-foreground font-bold">{role.userCount}</Text>
          <Text className="text-muted text-xs">users</Text>
        </View>
      </View>
      <View className="flex-row items-center justify-between mt-3">
        <View className="flex-row">
          <View 
            className="px-2 py-1 rounded mr-2"
            style={{ backgroundColor: LEVEL_COLORS[role.level] + '20' }}
          >
            <Text style={{ color: LEVEL_COLORS[role.level] }} className="text-xs font-medium capitalize">
              {role.level}
            </Text>
          </View>
          <View 
            className="px-2 py-1 rounded"
            style={{ backgroundColor: JEDI_COLORS[role.jediRank] + '20' }}
          >
            <Text style={{ color: JEDI_COLORS[role.jediRank] }} className="text-xs font-medium capitalize">
              JEDI {role.jediRank}
            </Text>
          </View>
        </View>
        <Text className="text-muted text-xs">{role.permissions.length} permissions</Text>
      </View>
    </TouchableOpacity>
  );

  // Render group card
  const renderGroupCard = (group: UserGroup) => (
    <View key={group.id} className="bg-surface rounded-xl p-4 mb-3 border border-border">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View 
            className="w-12 h-12 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: group.color + '20' }}
          >
            <Text style={{ color: group.color }} className="text-xl">👥</Text>
          </View>
          <View className="flex-1">
            <Text className="text-foreground font-semibold">{group.name}</Text>
            <Text className="text-muted text-xs mt-1">{group.description}</Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-foreground font-bold">{group.memberCount}</Text>
          <Text className="text-muted text-xs">members</Text>
        </View>
      </View>
      <View className="flex-row flex-wrap mt-3">
        {group.roles.map(roleId => {
          const role = getRoleById(roleId);
          return role ? (
            <View 
              key={roleId}
              className="px-2 py-1 rounded mr-1 mb-1"
              style={{ backgroundColor: role.color + '20' }}
            >
              <Text style={{ color: role.color }} className="text-xs">{role.name}</Text>
            </View>
          ) : null;
        })}
      </View>
    </View>
  );

  // Render user card
  const renderUserCard = (user: User) => {
    const role = getRoleById(user.roleId);
    return (
      <TouchableOpacity
        key={user.id}
        className="bg-surface rounded-xl p-4 mb-3 border border-border"
        onPress={() => { setSelectedUser(user); setShowUserModal(true); }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center mr-3">
              <Text className="text-2xl">{user.avatar}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-semibold">{user.name}</Text>
              <Text className="text-muted text-xs">{user.email}</Text>
            </View>
          </View>
          <View className="items-end">
            <View className="flex-row items-center">
              <View 
                style={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: 4, 
                  backgroundColor: STATUS_COLORS[user.status],
                  marginRight: 4 
                }} 
              />
              <Text className="text-foreground text-xs capitalize">{user.status}</Text>
            </View>
          </View>
        </View>
        <View className="flex-row items-center justify-between mt-3">
          <View className="flex-row">
            {role && (
              <View 
                className="px-2 py-1 rounded mr-2"
                style={{ backgroundColor: role.color + '20' }}
              >
                <Text style={{ color: role.color }} className="text-xs">{role.name}</Text>
              </View>
            )}
            <View 
              className="px-2 py-1 rounded"
              style={{ backgroundColor: JEDI_COLORS[user.jediRank] + '20' }}
            >
              <Text style={{ color: JEDI_COLORS[user.jediRank] }} className="text-xs capitalize">
                {user.jediRank}
              </Text>
            </View>
          </View>
          <Text className="text-muted text-xs">
            Last: {new Date(user.lastLogin).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render permission category
  const renderPermissionCategory = (category: string) => {
    const categoryPermissions = ALL_PERMISSIONS.filter(p => p.category === category);
    return (
      <View key={category} className="mb-4">
        <Text className="text-foreground font-bold text-lg mb-2">{category}</Text>
        {categoryPermissions.map(perm => (
          <View key={perm.id} className="bg-surface rounded-xl p-3 mb-2 border border-border flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-foreground font-medium">{perm.name}</Text>
              <Text className="text-muted text-xs">{perm.description}</Text>
            </View>
            <View className="bg-primary/10 rounded px-2 py-1">
              <Text className="text-primary text-xs">{roles.filter(r => r.permissions.some(p => p.id === perm.id)).length} roles</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // Get unique permission categories
  const permissionCategories = [...new Set(ALL_PERMISSIONS.map(p => p.category))];

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <IconSymbol name="chevron.right" size={24} color="#0066CC" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground">Roles Manager</Text>
          <TouchableOpacity className="p-2">
            <Text className="text-2xl">👥</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View className="flex-row mb-4">
          <View className="flex-1 bg-primary/10 rounded-xl p-3 mr-2">
            <Text className="text-primary text-xl font-bold">{roles.length}</Text>
            <Text className="text-primary text-xs">Roles</Text>
          </View>
          <View className="flex-1 bg-success/10 rounded-xl p-3 mr-2">
            <Text className="text-success text-xl font-bold">{groups.length}</Text>
            <Text className="text-success text-xs">Groups</Text>
          </View>
          <View className="flex-1 bg-warning/10 rounded-xl p-3 mr-2">
            <Text className="text-warning text-xl font-bold">{users.length}</Text>
            <Text className="text-warning text-xs">Users</Text>
          </View>
          <View className="flex-1 bg-error/10 rounded-xl p-3">
            <Text className="text-error text-xl font-bold">{ALL_PERMISSIONS.length}</Text>
            <Text className="text-error text-xs">Perms</Text>
          </View>
        </View>

        {/* Tab Selector */}
        <View className="flex-row bg-surface rounded-xl p-1 mb-4">
          {[
            { id: 'roles' as const, label: 'Roles', icon: '🎭' },
            { id: 'groups' as const, label: 'Groups', icon: '👥' },
            { id: 'users' as const, label: 'Users', icon: '👤' },
            { id: 'permissions' as const, label: 'Perms', icon: '🔐' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              className={`flex-1 py-2 rounded-lg ${activeTab === tab.id ? 'bg-primary' : ''}`}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text className={`text-center text-sm ${activeTab === tab.id ? 'text-white font-medium' : 'text-foreground'}`}>
                {tab.icon} {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-foreground font-bold text-lg">Roles ({roles.length})</Text>
              <TouchableOpacity className="bg-primary rounded-lg px-3 py-2">
                <Text className="text-white text-sm font-medium">+ New Role</Text>
              </TouchableOpacity>
            </View>
            {roles.map(renderRoleCard)}
          </View>
        )}

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-foreground font-bold text-lg">Groups ({groups.length})</Text>
              <TouchableOpacity className="bg-primary rounded-lg px-3 py-2">
                <Text className="text-white text-sm font-medium">+ New Group</Text>
              </TouchableOpacity>
            </View>
            {groups.map(renderGroupCard)}
          </View>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <View>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-3"
              placeholder="Search users..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-foreground font-bold text-lg">Users ({filteredUsers.length})</Text>
              <TouchableOpacity className="bg-primary rounded-lg px-3 py-2">
                <Text className="text-white text-sm font-medium">+ Invite User</Text>
              </TouchableOpacity>
            </View>
            {filteredUsers.map(renderUserCard)}
          </View>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <View>
            <Text className="text-foreground font-bold text-lg mb-3">
              All Permissions ({ALL_PERMISSIONS.length})
            </Text>
            {permissionCategories.map(renderPermissionCategory)}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>

      {/* Role Detail Modal */}
      <Modal
        visible={showRoleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6 max-h-[85%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-foreground">{selectedRole?.name}</Text>
              <TouchableOpacity onPress={() => setShowRoleModal(false)}>
                <Text className="text-2xl">✕</Text>
              </TouchableOpacity>
            </View>
            
            {selectedRole && (
              <ScrollView>
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">Description</Text>
                  <Text className="text-foreground">{selectedRole.description}</Text>
                </View>
                
                <View className="flex-row mb-4">
                  <View className="flex-1 mr-2">
                    <Text className="text-muted text-sm mb-1">Level</Text>
                    <View 
                      className="px-3 py-2 rounded"
                      style={{ backgroundColor: LEVEL_COLORS[selectedRole.level] + '20' }}
                    >
                      <Text style={{ color: LEVEL_COLORS[selectedRole.level] }} className="font-medium capitalize text-center">
                        {selectedRole.level}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text className="text-muted text-sm mb-1">JEDI Rank</Text>
                    <View 
                      className="px-3 py-2 rounded"
                      style={{ backgroundColor: JEDI_COLORS[selectedRole.jediRank] + '20' }}
                    >
                      <Text style={{ color: JEDI_COLORS[selectedRole.jediRank] }} className="font-medium capitalize text-center">
                        {selectedRole.jediRank}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-2">Modules ({selectedRole.modules.length})</Text>
                  <View className="flex-row flex-wrap">
                    {selectedRole.modules.map(mod => (
                      <View key={mod} className="bg-primary/10 rounded px-2 py-1 mr-1 mb-1">
                        <Text className="text-xs text-primary capitalize">{mod}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-2">Permissions ({selectedRole.permissions.length})</Text>
                  <View className="flex-row flex-wrap">
                    {selectedRole.permissions.slice(0, 10).map(perm => (
                      <View key={perm.id} className="bg-success/10 rounded px-2 py-1 mr-1 mb-1">
                        <Text className="text-xs text-success">{perm.name}</Text>
                      </View>
                    ))}
                    {selectedRole.permissions.length > 10 && (
                      <View className="bg-muted/20 rounded px-2 py-1">
                        <Text className="text-xs text-muted">+{selectedRole.permissions.length - 10} more</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <View className="flex-row mt-4">
                  <TouchableOpacity 
                    className="flex-1 bg-primary rounded-xl py-3 mr-2"
                    onPress={() => setShowRoleModal(false)}
                  >
                    <Text className="text-white text-center font-medium">Edit Role</Text>
                  </TouchableOpacity>
                  {!selectedRole.isSystem && (
                    <TouchableOpacity 
                      className="flex-1 bg-error rounded-xl py-3"
                      onPress={() => setShowRoleModal(false)}
                    >
                      <Text className="text-white text-center font-medium">Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* User Detail Modal */}
      <Modal
        visible={showUserModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUserModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Text className="text-3xl mr-2">{selectedUser?.avatar}</Text>
                <Text className="text-xl font-bold text-foreground">{selectedUser?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <Text className="text-2xl">✕</Text>
              </TouchableOpacity>
            </View>
            
            {selectedUser && (
              <ScrollView>
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">Email</Text>
                  <Text className="text-primary">{selectedUser.email}</Text>
                </View>
                
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">Status</Text>
                  <View className="flex-row items-center">
                    <View 
                      style={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: 5, 
                        backgroundColor: STATUS_COLORS[selectedUser.status],
                        marginRight: 8 
                      }} 
                    />
                    <Text className="text-foreground capitalize">{selectedUser.status}</Text>
                  </View>
                </View>
                
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">Role</Text>
                  {(() => {
                    const role = getRoleById(selectedUser.roleId);
                    return role ? (
                      <View 
                        className="px-3 py-2 rounded self-start"
                        style={{ backgroundColor: role.color + '20' }}
                      >
                        <Text style={{ color: role.color }} className="font-medium">{role.name}</Text>
                      </View>
                    ) : null;
                  })()}
                </View>
                
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">JEDI Rank</Text>
                  <View 
                    className="px-3 py-2 rounded self-start"
                    style={{ backgroundColor: JEDI_COLORS[selectedUser.jediRank] + '20' }}
                  >
                    <Text style={{ color: JEDI_COLORS[selectedUser.jediRank] }} className="font-medium capitalize">
                      {selectedUser.jediRank}
                    </Text>
                  </View>
                </View>
                
                <View className="mb-4">
                  <Text className="text-muted text-sm mb-1">Last Login</Text>
                  <Text className="text-foreground">{new Date(selectedUser.lastLogin).toLocaleString()}</Text>
                </View>
                
                <View className="flex-row mt-4">
                  <TouchableOpacity 
                    className="flex-1 bg-primary rounded-xl py-3 mr-2"
                    onPress={() => setShowUserModal(false)}
                  >
                    <Text className="text-white text-center font-medium">Edit User</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="flex-1 bg-warning rounded-xl py-3"
                    onPress={() => setShowUserModal(false)}
                  >
                    <Text className="text-white text-center font-medium">Reset Password</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
