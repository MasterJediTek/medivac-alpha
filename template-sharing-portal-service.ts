        providerName: 'Dr. James Wong',
        organization: 'WACHS Geriatric Services',
        createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
        isPublic: true,
        tags: ['dementia', 'cognitive', 'aged-care'],
        averageRating: 4.6,
        totalRatings: 28,
      },
      {
        id: 'template_cardiac',
        name: 'Cardiac Care AHD',
        description: 'For patients with heart conditions, includes specific cardiac treatment preferences',
        category: 'cardiac',
        content: {
          cardiac: { pacemaker: true, defibrillator: true },
          lifeSustaining: { cpr: true, ventilation: 'trial' },
        },
        prefilledFields: ['cardiac', 'lifeSustaining'],
        totalShares: 67,
        activeShares: 12,
        totalUses: 34,
        providerId: 'provider_003',
        providerName: 'Dr. Emily Chen',
        organization: 'WACHS Cardiology',
        createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        isPublic: true,
        tags: ['cardiac', 'heart', 'cardiovascular'],
        averageRating: 4.7,
        totalRatings: 19,
      },
    ];

    templates.forEach(t => this.sharedTemplates.set(t.id, t));
  }

  private initializeDefaultProviders(): void {
    const providers: ProviderProfile[] = [
      {
        id: 'provider_001',
        name: 'Dr. Sarah Mitchell',
        title: 'Palliative Care Specialist',
        organization: 'WACHS Palliative Care',
        department: 'Palliative Medicine',
        email: 'sarah.mitchell@wachs.health.wa.gov.au',
        verified: true,
        verificationDate: Date.now() - 180 * 24 * 60 * 60 * 1000,
        credentials: ['MBBS', 'FRACP', 'FAChPM'],
        templatesCreated: 5,
        templatesShared: 156,
        totalPatientShares: 312,
        averageTemplateRating: 4.8,
        createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'provider_002',
        name: 'Dr. James Wong',
        title: 'Geriatrician',
        organization: 'WACHS Geriatric Services',
        department: 'Geriatric Medicine',
        email: 'james.wong@wachs.health.wa.gov.au',
        verified: true,
        verificationDate: Date.now() - 120 * 24 * 60 * 60 * 1000,
        credentials: ['MBBS', 'FRACP'],
        templatesCreated: 3,
        templatesShared: 98,
        totalPatientShares: 196,
        averageTemplateRating: 4.6,
        createdAt: Date.now() - 300 * 24 * 60 * 60 * 1000,
      },
    ];

    providers.forEach(p => this.providers.set(p.id, p));
  }

  // Share Link Management
  createShareLink(
    templateId: string,
    createdBy: string,