  id: string;
  playbookId: string;
  incidentId: string;
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'completed' | 'failed' | 'aborted';
  actionsExecuted: number;
  actionsFailed: number;
  logs: ExecutionLog[];
}

export interface ExecutionLog {
  timestamp: string;
  actionId: string;
  actionName: string;
  status: 'started' | 'completed' | 'failed' | 'skipped';
  message: string;
  duration?: number;
}

class IncidentPlaybookService {
  private playbooks: Playbook[] = [];
  private activeIncidents: Incident[] = [];

  async initialize(): Promise<void> {
    await this.loadPlaybooks();
    await this.loadActiveIncidents();
    
    // Initialize with default playbooks if none exist
    if (this.playbooks.length === 0) {
      await this.createDefaultPlaybooks();
    }
  }

  /**
   * Get all playbooks
   */
  getPlaybooks(): Playbook[] {
    return [...this.playbooks];
  }

  /**
   * Get playbook by ID
   */
  getPlaybook(id: string): Playbook | null {
    return this.playbooks.find(p => p.id === id) || null;
  }

  /**
   * Get playbook for threat type
   */
  getPlaybookForThreat(threatType: ThreatType): Playbook | null {
    return this.playbooks.find(p => p.threatType === threatType && p.isActive) || null;
  }

  /**
   * Create or update playbook
   */
  async savePlaybook(playbook: Partial<Playbook>): Promise<Playbook> {
    const now = new Date().toISOString();

    if (playbook.id) {
      const index = this.playbooks.findIndex(p => p.id === playbook.id);
      if (index >= 0) {
        this.playbooks[index] = {
          ...this.playbooks[index],
          ...playbook,
          updatedAt: now,
        };
        await this.savePlaybooks();
        return this.playbooks[index];
      }
    }

    const newPlaybook: Playbook = {
      id: `playbook_${Date.now()}`,
      name: playbook.name || 'New Playbook',
      description: playbook.description || '',
      threatType: playbook.threatType || 'unauthorized_access',
      severity: playbook.severity || 'medium',
      actions: playbook.actions || [],
      escalationRules: playbook.escalationRules || [],
      containmentProcedures: playbook.containmentProcedures || [],
      recoverySteps: playbook.recoverySteps || [],
      notificationChain: playbook.notificationChain || [],
      isActive: playbook.isActive ?? true,
      isTestMode: playbook.isTestMode ?? false,
      version: '1.0',
      createdAt: now,
      updatedAt: now,
      executionCount: 0,
    };

    this.playbooks.push(newPlaybook);
    await this.savePlaybooks();
    return newPlaybook;
  }

  /**
   * Delete playbook
   */
  async deletePlaybook(id: string): Promise<boolean> {
    const index = this.playbooks.findIndex(p => p.id === id);
    if (index >= 0) {
      this.playbooks.splice(index, 1);
      await this.savePlaybooks();
      return true;
    }
    return false;
  }

  /**
   * Create new incident
   */
  async createIncident(incident: Partial<Incident>): Promise<Incident> {
    const newIncident: Incident = {
      id: `incident_${Date.now()}`,
      threatType: incident.threatType || 'unauthorized_access',
      severity: incident.severity || 'medium',
      status: 'detected',
      title: incident.title || 'New Security Incident',
      description: incident.description || '',
      affectedSystems: incident.affectedSystems || [],
      affectedUsers: incident.affectedUsers || [],
      detectedAt: new Date().toISOString(),
      detectedBy: incident.detectedBy || 'System',
      currentActionIndex: 0,
      completedActions: [],
      evidence: [],
      timeline: [{
        id: `timeline_${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'Incident Created',
        actor: 'System',
        details: `Incident detected: ${incident.title}`,
        automated: true,
      }],
    };

    this.activeIncidents.push(newIncident);
    await this.saveActiveIncidents();

    // Auto-trigger playbook if available
    const playbook = this.getPlaybookForThreat(newIncident.threatType);
    if (playbook && playbook.isActive) {
      newIncident.playbookId = playbook.id;
      await this.executePlaybook(playbook.id, newIncident.id);
    }

    return newIncident;