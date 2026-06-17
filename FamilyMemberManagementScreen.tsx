/**
 * Family Member Management Screen
 * Manage family members, roles, and permissions
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { familyMemberService, FamilyMember, FamilyRole, PermissionLevel } from '@/lib/services/family-member.service';

type ScreenMode = 'list' | 'add' | 'edit' | 'permissions';

export default function FamilyMemberManagementScreen() {
  const colors = useColors();
  const [mode, setMode] = useState<ScreenMode>('list');
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [role, setRole] = useState<FamilyRole>('family_member');
  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel>('limited');

  const roles: FamilyRole[] = ['primary_caregiver', 'emergency_contact', 'route_sharer', 'healthcare_proxy', 'family_member'];
  const permissionLevels: PermissionLevel[] = ['full', 'limited', 'view_only', 'emergency_only'];

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      await familyMemberService.initialize();
      const allMembers = familyMemberService.getFamilyMembers();
      setMembers(allMembers);
    } catch (error) {
      console.error('[Family Member] Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!name || !email || !relationship) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const newMember = await familyMemberService.addFamilyMember(
        name,
        email,
        phone,
        relationship,
        role,
        permissionLevel
      );

      setMembers([...members, newMember]);
      resetForm();
      setMode('list');
    } catch (error) {
      console.error('[Family Member] Error adding member:', error);
      alert('Failed to add family member');
    }
  };

  const handleUpdateMember = async () => {
    if (!selectedMember) return;

    try {
      const updated = await familyMemberService.updateFamilyMember(selectedMember.id, {
        name,
        email,
        phone,
        relationship,
        role,
        permissionLevel,
      });

      if (updated) {
        setMembers(members.map(m => (m.id === updated.id ? updated : m)));
        resetForm();
        setMode('list');
      }
    } catch (error) {
      console.error('[Family Member] Error updating member:', error);
      alert('Failed to update family member');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await familyMemberService.removeFamilyMember(memberId);
      setMembers(members.filter(m => m.id !== memberId));
    } catch (error) {
      console.error('[Family Member] Error removing member:', error);
      alert('Failed to remove family member');
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setRelationship('');
    setRole('family_member');
    setPermissionLevel('limited');
    setSelectedMember(null);
  };

  const getRoleColor = (role: FamilyRole) => {
    const colors: Record<FamilyRole, string> = {
      primary_caregiver: '#ef4444',
      emergency_contact: '#f97316',
      route_sharer: '#eab308',
      healthcare_proxy: '#3b82f6',
      family_member: '#6b7280',
    };
    return colors[role];
  };

  const getRoleLabel = (role: FamilyRole) => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  // List Mode
  if (mode === 'list') {
    const stats = familyMemberService.getFamilyStats();

    return (
      <ScreenContainer className="bg-background">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-foreground mb-2">
              Family Members
            </Text>
            <Text className="text-muted">
              Manage family member roles and permissions
            </Text>
          </View>

          {/* Statistics */}
          <View className="grid grid-cols-2 gap-3 mb-6">
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-muted text-sm mb-1">Total Members</Text>
              <Text className="text-2xl font-bold text-foreground">{stats.totalMembers}</Text>
            </View>
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-muted text-sm mb-1">Emergency Contacts</Text>
              <Text className="text-2xl font-bold text-error">{stats.emergencyContacts}</Text>
            </View>
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-muted text-sm mb-1">Route Sharers</Text>
              <Text className="text-2xl font-bold text-warning">{stats.routeSharers}</Text>
            </View>
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-muted text-sm mb-1">Caregivers</Text>
              <Text className="text-2xl font-bold text-primary">{stats.primaryCaregivers}</Text>
            </View>
          </View>

          {/* Add Member Button */}
          <Pressable
            onPress={() => {
              resetForm();
              setMode('add');
            }}
            className="bg-primary py-3 rounded-lg items-center mb-4"
          >
            <Text className="text-white font-semibold">+ Add Family Member</Text>
          </Pressable>

          {/* Members List */}
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : members.length > 0 ? (
            <View>
              {members.map(member => (
                <View key={member.id} className="bg-surface rounded-2xl p-4 mb-3 border border-border">
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-foreground font-semibold text-lg">{member.name}</Text>
                      <Text className="text-muted text-sm">{member.relationship}</Text>
                    </View>
                    <View
                      className="rounded-full px-2 py-1"
                      style={{ backgroundColor: getRoleColor(member.role) }}
                    >
                      <Text className="text-white font-semibold text-xs">
                        {getRoleLabel(member.role)}
                      </Text>
                    </View>
                  </View>

                  <View className="mb-3">
                    <Text className="text-muted text-sm mb-1">{member.email}</Text>
                    {member.phone && <Text className="text-muted text-sm">{member.phone}</Text>}
                  </View>

                  {member.isEmergencyContact && (
                    <View className="bg-error/10 rounded-lg p-2 mb-3 border border-error/30">
                      <Text className="text-error text-xs font-semibold">
                        Emergency Contact #{member.emergencyContactOrder}
                      </Text>
                    </View>
                  )}

                  {member.canShareRoutes && (
                    <View className="bg-warning/10 rounded-lg p-2 mb-3 border border-warning/30">
                      <Text className="text-warning text-xs font-semibold">Can Share Routes</Text>
                    </View>
                  )}

                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => {
                        setSelectedMember(member);
                        setName(member.name);
                        setEmail(member.email);
                        setPhone(member.phone);
                        setRelationship(member.relationship);
                        setRole(member.role);
                        setPermissionLevel(member.permissionLevel);
                        setMode('edit');
                      }}
                      className="flex-1 bg-primary/10 py-2 rounded-lg items-center border border-primary/30"
                    >
                      <Text className="text-primary font-semibold text-sm">Edit</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setSelectedMember(member);
                        setMode('permissions');
                      }}
                      className="flex-1 bg-primary py-2 rounded-lg items-center"
                    >
                      <Text className="text-white font-semibold text-sm">Permissions</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleRemoveMember(member.id)}
                      className="flex-1 bg-error/10 py-2 rounded-lg items-center border border-error/30"
                    >
                      <Text className="text-error font-semibold text-sm">Remove</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-muted text-center">No family members added yet</Text>
            </View>
          )}
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Add/Edit Mode
  if (mode === 'add' || mode === 'edit') {
    return (
      <ScreenContainer className="bg-background">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
          <View className="mb-6">
            <Text className="text-3xl font-bold text-foreground mb-2">
              {mode === 'add' ? 'Add Family Member' : 'Edit Family Member'}
            </Text>
          </View>

          <View className="bg-surface rounded-2xl p-4 border border-border mb-4">
            <TextInput
              placeholder="Full Name *"
              value={name}
              onChangeText={setName}
              placeholderTextColor={colors.muted}
              className="bg-background rounded-lg p-3 mb-3 text-foreground border border-border"
            />

            <TextInput
              placeholder="Email Address *"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholderTextColor={colors.muted}
              className="bg-background rounded-lg p-3 mb-3 text-foreground border border-border"
            />

            <TextInput
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor={colors.muted}
              className="bg-background rounded-lg p-3 mb-3 text-foreground border border-border"
            />

            <TextInput
              placeholder="Relationship *"
              value={relationship}
              onChangeText={setRelationship}
              placeholderTextColor={colors.muted}
              className="bg-background rounded-lg p-3 mb-4 text-foreground border border-border"
            />

            <Text className="text-foreground font-semibold mb-2">Role</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {roles.map(r => (
                <Pressable
                  key={r}
                  onPress={() => setRole(r)}
                  className={cn(
                    'py-2 px-3 rounded-lg',
                    role === r ? 'bg-primary' : 'bg-background border border-border'
                  )}
                >
                  <Text
                    className={cn(
                      'font-medium text-xs',
                      role === r ? 'text-white' : 'text-foreground'
                    )}
                  >
                    {getRoleLabel(r)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text className="text-foreground font-semibold mb-2">Permission Level</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {permissionLevels.map(pl => (
                <Pressable
                  key={pl}
                  onPress={() => setPermissionLevel(pl)}
                  className={cn(
                    'py-2 px-3 rounded-lg',
                    permissionLevel === pl ? 'bg-primary' : 'bg-background border border-border'
                  )}
                >
                  <Text
                    className={cn(
                      'font-medium text-xs',
                      permissionLevel === pl ? 'text-white' : 'text-foreground'
                    )}
                  >
                    {pl.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="flex-row gap-2">
              <Pressable
                onPress={() => {
                  resetForm();
                  setMode('list');
                }}
                className="flex-1 bg-surface py-3 rounded-lg items-center border border-border"
              >
                <Text className="text-foreground font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={mode === 'add' ? handleAddMember : handleUpdateMember}
                className="flex-1 bg-primary py-3 rounded-lg items-center"
              >
                <Text className="text-white font-semibold">
                  {mode === 'add' ? 'Add Member' : 'Update Member'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Permissions Mode
  if (mode === 'permissions' && selectedMember) {
    const permissions = familyMemberService.getPermissions(selectedMember.id);

    return (
      <ScreenContainer className="bg-background">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
          <View className="mb-6">
            <Text className="text-3xl font-bold text-foreground mb-2">
              Permissions
            </Text>
            <Text className="text-muted">{selectedMember.name}</Text>
          </View>

          <View className="bg-surface rounded-2xl p-4 border border-border mb-4">
            {Object.entries(permissions).map(([key, value]) => (
              <View key={key} className="flex-row items-center justify-between py-3 border-b border-border last:border-b-0">
                <Text className="text-foreground font-medium">
                  {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </Text>
                <View
                  className={cn(
                    'rounded-full w-6 h-6 items-center justify-center',
                    value ? 'bg-success' : 'bg-muted'
                  )}
                >
                  <Text className="text-white text-sm font-bold">{value ? '✓' : '✗'}</Text>
                </View>
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => {
              resetForm();
              setMode('list');
            }}
            className="bg-primary py-3 rounded-lg items-center"
          >
            <Text className="text-white font-semibold">Back to Members</Text>
          </Pressable>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return null;
}
