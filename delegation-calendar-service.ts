        severity: 'high',
        description: 'No senior approvers available for production deployments',
        suggestedDelegates: ['Dr. Michael Lee', 'Dr. Anna Rodriguez'],
      },
      {
        id: 'gap_2',
        startDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000).toISOString(),
        affectedRoles: ['Admin Approver'],
        severity: 'medium',
        description: 'Limited admin approval coverage',
        suggestedDelegates: ['Admin Lead John Smith'],
      },
      {
        id: 'gap_3',
        startDate: new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(now.getTime() + 36 * 24 * 60 * 60 * 1000).toISOString(),
        affectedRoles: ['Clinical Approver'],
        severity: 'critical',
        description: 'No clinical approval coverage - patient safety risk',
        suggestedDelegates: ['Dr. Emily Chen', 'Dr. Robert Taylor'],
      },
    ];

    // Detect overlaps
    this.detectOverlaps();
  }

  private detectOverlaps(): void {
    this.overlaps = [];
    
    for (let i = 0; i < this.delegations.length; i++) {
      for (let j = i + 1; j < this.delegations.length; j++) {
        const d1 = this.delegations[i];
        const d2 = this.delegations[j];
        
        const start1 = new Date(d1.startDate);
        const end1 = new Date(d1.endDate);
        const start2 = new Date(d2.startDate);
        const end2 = new Date(d2.endDate);
        
        // Check for overlap
        if (start1 <= end2 && start2 <= end1) {
          const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
          const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));
          
          // Determine if same delegate
          const sameDelegate = d1.delegateId === d2.delegateId;
          
          this.overlaps.push({
            id: `overlap_${i}_${j}`,
            delegations: [d1, d2],
            overlapStart: overlapStart.toISOString(),
            overlapEnd: overlapEnd.toISOString(),
            type: sameDelegate ? 'full' : 'partial',
            risk: sameDelegate ? 'high' : 'low',
          });
        }
      }
    }
  }

  private async save(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        delegations: this.delegations,
        coverageGaps: this.coverageGaps,
        overlaps: this.overlaps,
      }));
    } catch (error) {
      console.error('Failed to save delegation calendar:', error);
    }
  }

  getDelegations(): CalendarDelegation[] {
    return [...this.delegations];
  }

  getActiveDelegations(): CalendarDelegation[] {
    return this.delegations.filter(d => d.status === 'active');