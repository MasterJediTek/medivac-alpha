/**
 * Family Member Role Management Service
 * Manages family member designations, permissions, and emergency contact hierarchies
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type FamilyRole = 'primary_caregiver' | 'emergency_contact' | 'route_sharer' | 'healthcare_proxy' | 'family_member';
export type PermissionLevel = 'full' | 'limited' | 'view_only' | 'emergency_only';

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  relationship: string;
  role: FamilyRole;
  permissionLevel: PermissionLevel;
  isEmergencyContact: boolean;
  emergencyContactOrder?: number; // 1 = primary, 2 = secondary, etc.
  canShareRoutes: boolean;
  canViewMedicalInfo: boolean;
  canEditDirectives: boolean;
  canAccessAnalytics: boolean;
  status: 'active' | 'inactive' | 'pending_invitation';
  invitationSentAt?: string;
  invitationAcceptedAt?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface FamilyPermissions {
  viewPatientInfo: boolean;
  viewMedicalHistory: boolean;
  viewAppointments: boolean;
  shareRoutes: boolean;
  editDirectives: boolean;
  accessAnalytics: boolean;
  manageEmergencyContacts: boolean;
  receiveNotifications: boolean;
}

export interface FamilyInvitation {
  id: string;
  recipientEmail: string;
  recipientName: string;
  role: FamilyRole;
  permissionLevel: PermissionLevel;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  acceptedAt?: string;
  declinedAt?: string;
}

class FamilyMemberService {
  private readonly FAMILY_MEMBERS_KEY = 'family_members';
  private readonly INVITATIONS_KEY = 'family_invitations';
  private familyMembers: Map<string, FamilyMember> = new Map();
  private invitations: Map<string, FamilyInvitation> = new Map();

  async initialize(): Promise<void> {
    await this.loadFamilyMembers();
    await this.loadInvitations();
  }

  /**
   * Add a family member
   */
  async addFamilyMember(
    name: string,
    email: string,
    phone: string,
    relationship: string,
    role: FamilyRole,
    permissionLevel: PermissionLevel = 'limited'
  ): Promise<FamilyMember> {
    const member: FamilyMember = {
      id: 'fm_' + Date.now(),
      name,
      email,
      phone,
      relationship,
      role,
      permissionLevel,
      isEmergencyContact: role === 'emergency_contact',
      canShareRoutes: role === 'route_sharer' || role === 'primary_caregiver',
      canViewMedicalInfo: role !== 'family_member',
      canEditDirectives: role === 'healthcare_proxy' || role === 'primary_caregiver',
      canAccessAnalytics: role === 'primary_caregiver',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.familyMembers.set(member.id, member);
    await this.saveFamilyMembers();

    return member;
  }

  /**
   * Invite a family member
   */
  async inviteFamilyMember(
    recipientEmail: string,
    recipientName: string,
    role: FamilyRole,
    permissionLevel: PermissionLevel,
    invitedBy: string
  ): Promise<FamilyInvitation> {
    const invitation: FamilyInvitation = {
      id: 'inv_' + Date.now(),
      recipientEmail,
      recipientName,
      role,
      permissionLevel,
      invitedBy,
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      status: 'pending',
    };

    this.invitations.set(invitation.id, invitation);
    await this.saveInvitations();

    // Send invitation email
    await this.sendInvitationEmail(invitation);

    return invitation;
  }

  /**
   * Accept family member invitation
   */
  async acceptInvitation(invitationId: string): Promise<FamilyMember | null> {
    const invitation = this.invitations.get(invitationId);
    if (!invitation) return null;

    if (invitation.status !== 'pending') {
      throw new Error('Invitation is not pending');
    }

    const expirationDate = new Date(invitation.expiresAt);
    if (expirationDate < new Date()) {
      invitation.status = 'expired';
      await this.saveInvitations();
      throw new Error('Invitation has expired');
    }

    // Create family member
    const member = await this.addFamilyMember(
      invitation.recipientName,
      invitation.recipientEmail,
      '', // Phone not provided in invitation
      'Family Member', // Default relationship
      invitation.role,
      invitation.permissionLevel
    );

    // Update invitation
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date().toISOString();
    await this.saveInvitations();

    return member;
  }

  /**
   * Decline family member invitation
   */
  async declineInvitation(invitationId: string): Promise<void> {
    const invitation = this.invitations.get(invitationId);
    if (!invitation) return;

    invitation.status = 'declined';
    invitation.declinedAt = new Date().toISOString();
    await this.saveInvitations();
  }

  /**
   * Get all family members
   */
  getFamilyMembers(): FamilyMember[] {
    return Array.from(this.familyMembers.values()).sort((a, b) => {
      // Sort by emergency contact order, then by role
      if (a.isEmergencyContact && b.isEmergencyContact) {
        return (a.emergencyContactOrder || 999) - (b.emergencyContactOrder || 999);
      }
      return a.isEmergencyContact ? -1 : 1;
    });
  }

  /**
   * Get emergency contacts in order
   */
  getEmergencyContacts(): FamilyMember[] {
    return Array.from(this.familyMembers.values())
      .filter(m => m.isEmergencyContact && m.status === 'active')
      .sort((a, b) => (a.emergencyContactOrder || 999) - (b.emergencyContactOrder || 999));
  }

  /**
   * Get route sharers
   */
  getRouteSharers(): FamilyMember[] {
    return Array.from(this.familyMembers.values()).filter(
      m => m.canShareRoutes && m.status === 'active'
    );
  }

  /**
   * Get family member by ID
   */
  getFamilyMember(memberId: string): FamilyMember | null {
    return this.familyMembers.get(memberId) || null;
  }

  /**
   * Update family member
   */
  async updateFamilyMember(memberId: string, updates: Partial<FamilyMember>): Promise<FamilyMember | null> {
    const member = this.familyMembers.get(memberId);
    if (!member) return null;

    Object.assign(member, updates);
    member.updatedAt = new Date().toISOString();

    this.familyMembers.set(memberId, member);
    await this.saveFamilyMembers();

    return member;
  }

  /**
   * Remove family member
   */
  async removeFamilyMember(memberId: string): Promise<boolean> {
    const member = this.familyMembers.get(memberId);
    if (!member) return false;

    member.status = 'inactive';
    member.updatedAt = new Date().toISOString();

    await this.saveFamilyMembers();
    return true;
  }

  /**
   * Set emergency contact order
   */
  async setEmergencyContactOrder(memberIds: string[]): Promise<void> {
    memberIds.forEach((memberId, index) => {
      const member = this.familyMembers.get(memberId);
      if (member) {
        member.emergencyContactOrder = index + 1;
        member.isEmergencyContact = true;
        member.updatedAt = new Date().toISOString();
      }
    });

    await this.saveFamilyMembers();
  }

  /**
   * Get permissions for a family member
   */
  getPermissions(memberId: string): FamilyPermissions {
    const member = this.familyMembers.get(memberId);
    if (!member) {
      return {
        viewPatientInfo: false,
        viewMedicalHistory: false,
        viewAppointments: false,
        shareRoutes: false,
        editDirectives: false,
        accessAnalytics: false,
        manageEmergencyContacts: false,
        receiveNotifications: false,
      };
    }

    const basePermissions: Record<PermissionLevel, FamilyPermissions> = {
      full: {
        viewPatientInfo: true,
        viewMedicalHistory: true,
        viewAppointments: true,
        shareRoutes: true,
        editDirectives: true,
        accessAnalytics: true,
        manageEmergencyContacts: true,
        receiveNotifications: true,
      },
      limited: {
        viewPatientInfo: true,
        viewMedicalHistory: true,
        viewAppointments: true,
        shareRoutes: true,
        editDirectives: false,
        accessAnalytics: false,
        manageEmergencyContacts: false,
        receiveNotifications: true,
      },
      view_only: {
        viewPatientInfo: true,
        viewMedicalHistory: true,
        viewAppointments: true,
        shareRoutes: false,
        editDirectives: false,
        accessAnalytics: false,
        manageEmergencyContacts: false,
        receiveNotifications: false,
      },
      emergency_only: {
        viewPatientInfo: true,
        viewMedicalHistory: false,
        viewAppointments: false,
        shareRoutes: false,
        editDirectives: false,
        accessAnalytics: false,
        manageEmergencyContacts: false,
        receiveNotifications: true,
      },
    };

    return basePermissions[member.permissionLevel];
  }

  /**
   * Get pending invitations
   */
  getPendingInvitations(): FamilyInvitation[] {
    return Array.from(this.invitations.values()).filter(inv => inv.status === 'pending');
  }

  /**
   * Send invitation email (mock)
   */
  private async sendInvitationEmail(invitation: FamilyInvitation): Promise<void> {
    try {
      console.log(`[Family Member] Invitation sent to ${invitation.recipientEmail}`);
    } catch (error) {
      console.error('[Family Member] Failed to send invitation email:', error);
    }
  }

  /**
   * Get family statistics
   */
  getFamilyStats() {
    const members = Array.from(this.familyMembers.values());
    const activeMembers = members.filter(m => m.status === 'active');

    return {
      totalMembers: members.length,
      activeMembers: activeMembers.length,
      emergencyContacts: activeMembers.filter(m => m.isEmergencyContact).length,
      routeSharers: activeMembers.filter(m => m.canShareRoutes).length,
      primaryCaregivers: activeMembers.filter(m => m.role === 'primary_caregiver').length,
      healthcareProxies: activeMembers.filter(m => m.role === 'healthcare_proxy').length,
    };
  }

  private async loadFamilyMembers(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.FAMILY_MEMBERS_KEY);
      if (data) {
        const members = JSON.parse(data);
        this.familyMembers = new Map(members.map((m: FamilyMember) => [m.id, m]));
      }
    } catch (error) {
      console.error('[Family Member] Failed to load family members:', error);
    }
  }

  private async saveFamilyMembers(): Promise<void> {
    try {
      const members = Array.from(this.familyMembers.values());
      await AsyncStorage.setItem(this.FAMILY_MEMBERS_KEY, JSON.stringify(members));
    } catch (error) {
      console.error('[Family Member] Failed to save family members:', error);
    }
  }

  private async loadInvitations(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.INVITATIONS_KEY);
      if (data) {
        const invitations = JSON.parse(data);
        this.invitations = new Map(invitations.map((inv: FamilyInvitation) => [inv.id, inv]));
      }
    } catch (error) {
      console.error('[Family Member] Failed to load invitations:', error);
    }
  }

  private async saveInvitations(): Promise<void> {
    try {
      const invitations = Array.from(this.invitations.values());
      await AsyncStorage.setItem(this.INVITATIONS_KEY, JSON.stringify(invitations));
    } catch (error) {
      console.error('[Family Member] Failed to save invitations:', error);
    }
  }
}

export const familyMemberService = new FamilyMemberService();
