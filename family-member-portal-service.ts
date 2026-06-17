  // Invite Management
  createInvite(
    patientId: string,
    patientName: string,
    inviteeEmail: string,
    relationship: RelationshipType,
    permissionLevel: PermissionLevel,
    options?: {
      inviteeName?: string;
      message?: string;
      sendVia?: ('email' | 'sms' | 'link')[];
      expirationDays?: number;
    }
  ): FamilyInvite {
    const id = `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const token = this.generateToken();
    const inviteLink = this.generateInviteLink(token);
    const now = Date.now();
    const expirationDays = options?.expirationDays || 7;

    const invite: FamilyInvite = {
      id,
      patientId,
      patientName,
      inviteeEmail,
      inviteeName: options?.inviteeName,
      relationship,
      permissionLevel,
      status: 'pending',
      token,
      inviteLink,
      qrCode: this.generateQRCode(inviteLink),
      message: options?.message,
      createdAt: now,
      expiresAt: now + (expirationDays * 86400000),
      sentVia: options?.sendVia || ['email'],
    };

    this.invites.set(id, invite);

    playSound(SOUNDS.INVITE_SENT);
    triggerHaptic(HAPTICS.INVITE);

    // Log activity
    this.logActivity(patientId, patientId, 'invite_created', `Invite sent to ${inviteeEmail}`);

    return invite;
  }

  acceptInvite(inviteId: string, memberDetails: {