import { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Alert, Platform } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useRouter } from 'expo-router';
import { 
  JobRole, 
  ROLE_CONFIGS, 
  getRoleConfig, 
  hasAuthorityOver, 
  executeCommand,
  AuthorityLevel,
  type RoleConfig,
  type NavItem 
} from '@/lib/role-config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Current user state
interface CurrentUser {
  id: string;
  name: string;
  role: JobRole;
  department: string;
  authorityLevel: AuthorityLevel;
}

export default function RoleDashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [roleConfig, setRoleConfig] = useState<RoleConfig | null>(null);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  // Load user role
  useEffect(() => {
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    try {
      const stored = await AsyncStorage.getItem('medivac_user_role');
      if (stored) {
        const user = JSON.parse(stored) as CurrentUser;
        setCurrentUser(user);
        setRoleConfig(getRoleConfig(user.role));
      } else {
        // Default to doctor for demo
        const defaultUser: CurrentUser = {
          id: '1',
          name: 'Dr. Stephen Orazi',
          role: 'doctor',
          department: 'Medical',
          authorityLevel: AuthorityLevel.SENIOR,
        };
        setCurrentUser(defaultUser);
        setRoleConfig(getRoleConfig('doctor'));
      }
    } catch (error) {
      console.error('Failed to load user role:', error);
    }
  };

  const switchRole = async (role: JobRole) => {
    const config = ROLE_CONFIGS[role];
    const user: CurrentUser = {
      id: '1',
      name: config.displayName,
      role: role,
      department: config.department,
      authorityLevel: config.authorityLevel,
    };
    await AsyncStorage.setItem('medivac_user_role', JSON.stringify(user));
    setCurrentUser(user);
    setRoleConfig(config);
    setShowRoleSelector(false);
  };

  const handleNavPress = (item: NavItem) => {
    router.push(item.route as any);
  };

  const handleQuickAction = (item: NavItem) => {
    router.push(item.route as any);
  };

  const handleCommand = (command: string) => {
    if (!currentUser) return;
    
    const result = executeCommand(currentUser.role, command);
    Alert.alert(
      result.success ? 'Command Executed' : 'Command Failed',
      result.message
    );
  };

  if (!roleConfig || !currentUser) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground">Loading...</Text>
      </ScreenContainer>
    );
  }

  // Role selector modal
  const RoleSelector = () => (
    <View className="absolute inset-0 bg-black/50 z-50 items-center justify-center p-5">
      <View className="bg-background rounded-2xl p-4 w-full max-w-md max-h-[80%]">
        <Text className="text-foreground text-xl font-bold mb-4 text-center">Select Role</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {Object.values(ROLE_CONFIGS).map(config => (
            <TouchableOpacity
              key={config.role}
              className="flex-row items-center p-3 rounded-xl mb-2"
              style={{
                backgroundColor: currentUser.role === config.role ? config.color + '20' : colors.surface,
                borderWidth: currentUser.role === config.role ? 2 : 1,
                borderColor: currentUser.role === config.role ? config.color : colors.border,
              }}
              onPress={() => switchRole(config.role)}
            >
              <Text className="text-2xl mr-3">{config.icon}</Text>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">{config.displayName}</Text>
                <Text className="text-muted text-sm">{config.department}</Text>
              </View>
              <View 
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: config.color + '20' }}
              >
                <Text style={{ color: config.color, fontSize: 10, fontWeight: '600' }}>
                  L{config.authorityLevel}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity
          className="mt-4 p-3 rounded-xl bg-surface border border-border"
          onPress={() => setShowRoleSelector(false)}
        >
          <Text className="text-foreground text-center font-medium">Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      {showRoleSelector && <RoleSelector />}
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header with Role Info */}
        <View className="px-5 pt-4 pb-2">
          <TouchableOpacity
            className="flex-row items-center p-4 rounded-2xl"
            style={{ backgroundColor: roleConfig.color + '15' }}
            onPress={() => setShowRoleSelector(true)}
          >
            <Text className="text-4xl mr-3">{roleConfig.icon}</Text>
            <View className="flex-1">
              <Text className="text-foreground text-xl font-bold">{currentUser.name}</Text>
              <Text style={{ color: roleConfig.color }} className="font-semibold">
                {roleConfig.displayName} • {roleConfig.department}
              </Text>
              <View className="flex-row items-center mt-1">
                <View 
                  className="px-2 py-0.5 rounded-full mr-2"
                  style={{ backgroundColor: roleConfig.color }}
                >
                  <Text className="text-white text-xs font-bold">
                    Authority Level {roleConfig.authorityLevel}
                  </Text>
                </View>
                {roleConfig.commandAuthority && (
                  <View className="px-2 py-0.5 rounded-full bg-yellow-500">
                    <Text className="text-white text-xs font-bold">⚡ Command</Text>
                  </View>
                )}
              </View>
            </View>
            <Text className="text-muted text-2xl">▼</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View className="px-5 mb-4">
          <Text className="text-foreground font-bold text-lg mb-3">Quick Actions</Text>
          <View className="flex-row flex-wrap">
            {roleConfig.quickActions.map(action => (
              <TouchableOpacity
                key={action.id}
                className="w-1/2 p-1"
                onPress={() => handleQuickAction(action)}
              >
                <View 
                  className="rounded-xl p-4 items-center"
                  style={{ backgroundColor: action.color + '15' }}
                >
                  <Text className="text-3xl mb-2">{action.icon}</Text>
                  <Text 
                    className="font-semibold text-center"
                    style={{ color: action.color }}
                  >
                    {action.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Primary Modules */}
        <View className="px-5 mb-4">
          <Text className="text-foreground font-bold text-lg mb-3">Your Modules</Text>
          <View className="bg-surface rounded-2xl border border-border overflow-hidden">
            {roleConfig.primaryModules.map((module, index) => (
              <TouchableOpacity
                key={module.id}
                className="flex-row items-center p-4"
                style={{
                  borderBottomWidth: index < roleConfig.primaryModules.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
                onPress={() => handleNavPress(module)}
              >
                <View 
                  className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: module.color + '15' }}
                >
                  <Text className="text-xl">{module.icon}</Text>
                </View>
                <Text className="flex-1 text-foreground font-medium">{module.title}</Text>
                {module.badge && (
                  <View className="px-2 py-1 rounded-full mr-2 bg-red-500">
                    <Text className="text-white text-xs font-bold">{module.badge}</Text>
                  </View>
                )}
                <Text className="text-muted">›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Keyboard Shortcuts */}
        <View className="px-5 mb-4">
          <Text className="text-foreground font-bold text-lg mb-3">Shortcuts</Text>
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <View className="flex-row flex-wrap">
              {roleConfig.shortcuts.map(shortcut => (
                <TouchableOpacity
                  key={shortcut.key}
                  className="w-1/3 p-2"
                  onPress={() => router.push(shortcut.route as any)}
                >
                  <View className="items-center">
                    <View 
                      className="w-10 h-10 rounded-lg items-center justify-center mb-1"
                      style={{ backgroundColor: roleConfig.color + '20' }}
                    >
                      <Text style={{ color: roleConfig.color }} className="font-bold text-lg">
                        {shortcut.key}
                      </Text>
                    </View>
                    <Text className="text-muted text-xs text-center" numberOfLines={1}>
                      {shortcut.action}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Command Authority Section (for roles with command authority) */}
        {roleConfig.commandAuthority && (
          <View className="px-5 mb-4">
            <Text className="text-foreground font-bold text-lg mb-3">Command Authority</Text>
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <View className="flex-row items-center mb-3">
                <Text className="text-2xl mr-2">⚡</Text>
                <Text className="text-foreground font-semibold flex-1">
                  Direct Command Execution
                </Text>
                <View className="px-2 py-1 rounded-full bg-green-500">
                  <Text className="text-white text-xs font-bold">ACTIVE</Text>
                </View>
              </View>
              
              <Text className="text-muted text-sm mb-3">
                You have authority to execute commands without approval for roles below your level.
              </Text>
              
              {/* Can Override */}
              {roleConfig.canOverride.length > 0 && (
                <View className="mb-3">
                  <Text className="text-foreground font-medium mb-2">Can Override:</Text>
                  <View className="flex-row flex-wrap">
                    {roleConfig.canOverride.map(role => (
                      <View 
                        key={role}
                        className="px-2 py-1 rounded-full mr-1 mb-1"
                        style={{ backgroundColor: ROLE_CONFIGS[role].color + '20' }}
                      >
                        <Text style={{ color: ROLE_CONFIGS[role].color }} className="text-xs">
                          {ROLE_CONFIGS[role].icon} {ROLE_CONFIGS[role].displayName}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              {/* Command Buttons */}
              <View className="flex-row mt-2">
                <TouchableOpacity
                  className="flex-1 p-3 rounded-xl mr-2"
                  style={{ backgroundColor: colors.primary }}
                  onPress={() => handleCommand('broadcast')}
                >
                  <Text className="text-white text-center font-semibold">📢 Broadcast</Text>
                </TouchableOpacity>
                {(currentUser.role === 'jedi_commander' || currentUser.role === 'master_jedi') && (
                  <TouchableOpacity
                    className="flex-1 p-3 rounded-xl"
                    style={{ backgroundColor: colors.error }}
                    onPress={() => handleCommand('override')}
                  >
                    <Text className="text-white text-center font-semibold">⚡ Override</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Reports To */}
        {roleConfig.reportsTo.length > 0 && (
          <View className="px-5 mb-4">
            <Text className="text-foreground font-bold text-lg mb-3">Reports To</Text>
            <View className="flex-row flex-wrap">
              {roleConfig.reportsTo.map(role => (
                <View 
                  key={role}
                  className="flex-row items-center px-3 py-2 rounded-xl mr-2 mb-2"
                  style={{ backgroundColor: ROLE_CONFIGS[role].color + '15' }}
                >
                  <Text className="text-lg mr-2">{ROLE_CONFIGS[role].icon}</Text>
                  <Text style={{ color: ROLE_CONFIGS[role].color }} className="font-medium">
                    {ROLE_CONFIGS[role].displayName}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Permissions */}
        <View className="px-5 mb-8">
          <Text className="text-foreground font-bold text-lg mb-3">Your Permissions</Text>
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <View className="flex-row flex-wrap">
              {roleConfig.permissions.map(permission => (
                <View 
                  key={permission}
                  className="px-2 py-1 rounded-full mr-1 mb-1 bg-green-500/20"
                >
                  <Text className="text-green-600 text-xs">✓ {permission.replace(/_/g, ' ')}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
