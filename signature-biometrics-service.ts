    options: {
      preferredMethod?: BiometricType;
      fallbackMethod?: FallbackMethod;
      requireBiometricForSigning?: boolean;
    } = {}
  ): BiometricEnrollment {
    const id = `enrollment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const enrollment: BiometricEnrollment = {
      id,
      userId,
      userName,
      fingerprint: {
        enrolled: false,
        fingersEnrolled: 0,
      },
      faceId: {
        enrolled: false,
      },
      fallbackMethod: options.fallbackMethod || 'pin',
      fallbackConfigured: false,
      failedAttempts: 0,
      maxAttempts: 5,
      preferredMethod: options.preferredMethod || 'fingerprint',
      requireBiometricForSigning: options.requireBiometricForSigning !== false,
      createdAt: now,
      updatedAt: now,
    };

    this.enrollments.set(id, enrollment);
    triggerHaptic('light');

    return enrollment;
  }

  async enrollFingerprint(enrollmentId: string): Promise<BiometricEnrollment | null> {
    const enrollment = this.enrollments.get(enrollmentId);
    if (!enrollment) return null;
