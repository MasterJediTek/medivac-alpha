    role: SignatureRole,
    signerName: string,
    signatureDataUrl: string,
    options: {
      email?: string;
      phone?: string;
      relationship?: string;
      occupation?: string;
      method?: SigningMethod;
      emailLinkId?: string;
    } = {}
  ): Promise<SignatureMetadata | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Check session validity
    if (session.status === 'expired' || session.status === 'revoked') {
      playSound(SOUNDS.SESSION_EXPIRED);
      return null;
    }

    // Get GPS and device info
    const gps = await this.startGPSTracking();
    const device = this.getDeviceInfo();
    const now = Date.now();

    // Create signature metadata
    const signature: SignatureMetadata = {
      id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      signerName,
      signerEmail: options.email,
      signerPhone: options.phone,
      relationship: options.relationship,
      occupation: options.occupation,
      signedAt: now,
      signedAtISO: new Date(now).toISOString(),
      signedAtLocal: new Date(now).toLocaleString('en-AU', { timeZone: 'Australia/Perth' }),
      timezone: 'Australia/Perth',
      gps,
      locationVerified: gps !== null && gps.accuracy < 50,
      device,
      method: options.method || 'live_device',
      emailLinkId: options.emailLinkId,
      verified: true,
      verificationMethod: options.method === 'email_link' ? 'email_confirmation' : 'live_witness',
      signatureDataUrl,
      signatureHash: this.generateHash(signatureDataUrl + now.toString()),
    };

    // Validate signing sequence
    if (role === 'maker') {
      if (session.maker) {
        return null; // Maker already signed
      }
      session.maker = signature;
      session.currentStep = 'awaiting_witnesses';
    } else if (role === 'witness1' || role === 'witness2') {
      if (!session.maker) {
        return null; // Maker must sign first
      }
      
      // Check if this witness role is already filled
      const existingWitness = session.witnesses.find(w => w.role === role);
      if (existingWitness) {
        return null;
      }
      
      // For live signing, witnesses should be present
      if (options.method !== 'email_link' && session.maker) {
        signature.witnessedBy = [session.maker.id];
      }
      
      session.witnesses.push(signature);
      
      // Check if all witnesses have signed
      if (session.witnesses.length >= session.requiredWitnesses) {
        session.currentStep = 'completed';
        session.status = 'completed';
        session.completedAt = now;
        playSound(SOUNDS.ALL_SIGNED);
        triggerHaptic('success');
      }
    }

    // Add audit log
    session.auditLog.push({
      id: `audit_${Date.now()}`,
      timestamp: now,
      action: 'signature_recorded',
      actor: signerName,
      actorRole: role,
      details: `${role} signature recorded via ${signature.method}`,
      gps: gps || undefined,
      device,
    });

    session.updatedAt = now;
    session.status = session.currentStep === 'completed' ? 'completed' : 'in_progress';

    playSound(SOUNDS.SIGNATURE_COMPLETE);
    triggerHaptic('medium');

    return signature;
  }

  // Email Link Signing
  createEmailSigningLink(
    sessionId: string,
    role: SignatureRole,