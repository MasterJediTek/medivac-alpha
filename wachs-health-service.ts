    return this.sites.find(s => s.siteId === siteId);
  }

  getSitesByRegion(region: string): SiteHealth[] {
    return this.sites.filter(s => s.region === region);
  }

  getSitesByStatus(status: HealthStatus): SiteHealth[] {
    return this.sites.filter(s => s.overallStatus === status);
  }

  // Region health
  getRegionHealth(): RegionHealth[] {
    const regions: Record<string, RegionHealth> = {};

    Object.entries(WACHS_REGIONS).forEach(([key, name]) => {
      regions[key] = {
        region: key,
        regionName: name,
        siteCount: 0,
        healthySites: 0,
        degradedSites: 0,
        criticalSites: 0,
        offlineSites: 0,
        averageScore: 0,
        activeAlerts: 0,
      };
    });

    this.sites.forEach(site => {
      const region = regions[site.region];
      if (region) {
        region.siteCount++;
        region.averageScore += site.healthScore;
        region.activeAlerts += site.alerts;

        switch (site.overallStatus) {
          case 'healthy': region.healthySites++; break;
          case 'degraded': region.degradedSites++; break;
          case 'critical': region.criticalSites++; break;
          case 'offline': region.offlineSites++; break;
        }
      }
    });

    Object.values(regions).forEach(region => {
      if (region.siteCount > 0) {
        region.averageScore = Math.round(region.averageScore / region.siteCount);
      }
    });

    return Object.values(regions).filter(r => r.siteCount > 0);
  }

  // Alerts
  getAlerts(): HealthAlert[] {
    return [...this.alerts].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  getActiveAlerts(): HealthAlert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  getAlertsBySite(siteId: string): HealthAlert[] {
    return this.alerts.filter(a => a.siteId === siteId);
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<HealthAlert | null> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return null;

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date().toISOString();
    await this.saveAlerts();

    return alert;
  }