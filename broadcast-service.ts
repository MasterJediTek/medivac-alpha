      {
        id: 'bc_5',
        title: 'Microsoft Teams Integration Now Available',
        message: 'MediVac One is now integrated with Microsoft Teams. You can receive alerts and notifications directly in your Teams channels.',
        urgency: 'informational',
        category: 'announcement',
        status: 'sent',
        audienceScope: 'all',
        channels: ['app', 'teams'],
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        sentAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: 'IT Department',
        recipientCount: 1250,
        deliveredCount: 1250,
        readCount: 876,
      },
      {
        id: 'bc_6',
        title: 'Incident Response Drill Next Week',
        message: 'A scheduled incident response drill will take place next Tuesday at 10:00 AM. All security team members are required to participate.',
        urgency: 'normal',
        category: 'training',
        status: 'draft',
        audienceScope: 'department',
        audienceFilter: 'Security',
        channels: ['app', 'email'],
        createdAt: now.toISOString(),
        createdBy: 'Security Team',
      },
    ];
  }

  private async save(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.broadcasts));
    } catch (error) {
      console.error('Failed to save broadcasts:', error);
    }
  }

  getBroadcasts(filter?: { urgency?: BroadcastUrgency[]; category?: BroadcastCategory[]; status?: BroadcastStatus[] }): Broadcast[] {
    let filtered = [...this.broadcasts];
    
    if (filter?.urgency?.length) {
      filtered = filtered.filter(b => filter.urgency!.includes(b.urgency));
    }
    if (filter?.category?.length) {
      filtered = filtered.filter(b => filter.category!.includes(b.category));
    }
    if (filter?.status?.length) {
      filtered = filtered.filter(b => filter.status!.includes(b.status));
    }
    
    // Sort by urgency then date
    const urgencyOrder: Record<BroadcastUrgency, number> = {
      emergency: 0, urgent: 1, important: 2, normal: 3, informational: 4
    };
    
    return filtered.sort((a, b) => {
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  async createBroadcast(broadcast: Omit<Broadcast, 'id' | 'createdAt' | 'status'>): Promise<Broadcast> {
    const newBroadcast: Broadcast = {
      ...broadcast,
      id: `bc_${Date.now()}`,