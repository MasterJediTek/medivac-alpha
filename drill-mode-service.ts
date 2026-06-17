/**
 * Playbook Drill Mode Service
 * Simulate incident responses with separate drill performance tracking
 * MediVac One v5.6
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  DRILL_SESSIONS: 'medivac_drill_sessions',
  DRILL_SCENARIOS: 'medivac_drill_scenarios',
  DRILL_SCORES: 'medivac_drill_scores',
};

// Types
export type DrillStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
export type DrillDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type ThreatType = 
  | 'unauthorized_access'
  | 'data_breach'
  | 'malware_detected'
  | 'ransomware'
  | 'phishing_attempt'
  | 'insider_threat'
  | 'ddos_attack'
  | 'policy_violation'
  | 'compliance_breach'
  | 'system_compromise'
  | 'data_exfiltration';

export interface DrillScenario {
  id: string;
  name: string;
  description: string;
  threatType: ThreatType;
  difficulty: DrillDifficulty;
  estimatedDuration: number; // minutes
  steps: DrillStep[];
  passingScore: number;
  maxScore: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DrillStep {
  id: string;
  order: number;
  title: string;
  description: string;
  expectedAction: string;
  timeLimit: number; // seconds
  points: number;
  hints: string[];
  isRequired: boolean;
}

export interface DrillSession {
  id: string;
  scenarioId: string;
  scenarioName: string;
  threatType: ThreatType;
  difficulty: DrillDifficulty;
  status: DrillStatus;
  participantId: string;
  participantName: string;
  startedAt?: string;
  completedAt?: string;
  scheduledFor?: string;
  currentStep: number;
  totalSteps: number;
  stepResults: StepResult[];
  score: number;
  maxScore: number;
  passed: boolean;
  duration?: number; // milliseconds
  feedback?: string;
  certificateId?: string;
  createdAt: string;
}

export interface StepResult {
  stepId: string;
  stepOrder: number;
  completed: boolean;
  correct: boolean;
  timeTaken: number; // seconds
  pointsEarned: number;
  hintsUsed: number;
  response?: string;
}

export interface DrillScore {
  participantId: string;
  participantName: string;
  totalDrills: number;
  completedDrills: number;
  passedDrills: number;
  totalScore: number;
  averageScore: number;
  bestScore: number;
  averageTime: number; // seconds
  rank?: number;
  badges: string[];
  lastDrillAt?: string;
}

export interface DrillAnalytics {
  totalDrills: number;
  completedDrills: number;
  passRate: number;
  averageScore: number;
  averageDuration: number;
  byThreatType: Record<ThreatType, { count: number; passRate: number; avgScore: number }>;
  byDifficulty: Record<DrillDifficulty, { count: number; passRate: number; avgScore: number }>;
  topPerformers: DrillScore[];
  recentDrills: DrillSession[];
}

// Threat type configuration
export const THREAT_TYPE_CONFIG: Record<ThreatType, { label: string; icon: string; color: string }> = {
  unauthorized_access: { label: 'Unauthorized Access', icon: '🔐', color: '#EF4444' },
  data_breach: { label: 'Data Breach', icon: '💾', color: '#DC2626' },
  malware_detected: { label: 'Malware Detected', icon: '🦠', color: '#F97316' },
  ransomware: { label: 'Ransomware', icon: '💰', color: '#B91C1C' },
  phishing_attempt: { label: 'Phishing Attempt', icon: '🎣', color: '#F59E0B' },
  insider_threat: { label: 'Insider Threat', icon: '👤', color: '#8B5CF6' },
  ddos_attack: { label: 'DDoS Attack', icon: '🌊', color: '#3B82F6' },
  policy_violation: { label: 'Policy Violation', icon: '📋', color: '#EC4899' },
  compliance_breach: { label: 'Compliance Breach', icon: '⚖️', color: '#6366F1' },
  system_compromise: { label: 'System Compromise', icon: '💻', color: '#10B981' },
  data_exfiltration: { label: 'Data Exfiltration', icon: '📤', color: '#14B8A6' },
};

export const DIFFICULTY_CONFIG: Record<DrillDifficulty, { label: string; color: string; multiplier: number }> = {
  beginner: { label: 'Beginner', color: '#10B981', multiplier: 1.0 },
  intermediate: { label: 'Intermediate', color: '#F59E0B', multiplier: 1.25 },
  advanced: { label: 'Advanced', color: '#EF4444', multiplier: 1.5 },
  expert: { label: 'Expert', color: '#8B5CF6', multiplier: 2.0 },
};

class DrillModeService {
  private scenarios: DrillScenario[] = [];
  private sessions: DrillSession[] = [];
  private scores: DrillScore[] = [];

  async initialize(): Promise<void> {
    await this.loadScenarios();
    await this.loadSessions();
    await this.loadScores();
    
    if (this.scenarios.length === 0) {
      await this.generateDefaultScenarios();
    }
  }

  private async loadScenarios(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DRILL_SCENARIOS);
      if (data) {
        this.scenarios = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load scenarios:', error);
    }
  }

  private async saveScenarios(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.DRILL_SCENARIOS, JSON.stringify(this.scenarios));
  }

  private async loadSessions(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DRILL_SESSIONS);
      if (data) {
        this.sessions = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }

  private async saveSessions(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.DRILL_SESSIONS, JSON.stringify(this.sessions));
  }

  private async loadScores(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DRILL_SCORES);
      if (data) {
        this.scores = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load scores:', error);
    }
  }

  private async saveScores(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.DRILL_SCORES, JSON.stringify(this.scores));
  }

  /**
   * Get all scenarios
   */
  getScenarios(): DrillScenario[] {
    return [...this.scenarios];
  }

  /**
   * Get scenario by ID
   */
  getScenario(id: string): DrillScenario | null {
    return this.scenarios.find(s => s.id === id) || null;
  }

  /**
   * Get scenarios by difficulty
   */
  getScenariosByDifficulty(difficulty: DrillDifficulty): DrillScenario[] {
    return this.scenarios.filter(s => s.difficulty === difficulty);
  }

  /**
   * Get scenarios by threat type
   */
  getScenariosByThreatType(threatType: ThreatType): DrillScenario[] {
    return this.scenarios.filter(s => s.threatType === threatType);
  }

  /**
   * Start a new drill session
   */
  async startDrill(scenarioId: string, participantId: string, participantName: string): Promise<DrillSession> {
    const scenario = this.getScenario(scenarioId);
    if (!scenario) throw new Error('Scenario not found');

    const session: DrillSession = {
      id: `drill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      threatType: scenario.threatType,
      difficulty: scenario.difficulty,
      status: 'in_progress',
      participantId,
      participantName,
      startedAt: new Date().toISOString(),
      currentStep: 0,
      totalSteps: scenario.steps.length,
      stepResults: [],
      score: 0,
      maxScore: scenario.maxScore,
      passed: false,
      createdAt: new Date().toISOString(),
    };

    this.sessions.unshift(session);
    await this.saveSessions();
    return session;
  }

  /**
   * Complete a drill step
   */
  async completeStep(
    sessionId: string, 
    stepId: string, 
    correct: boolean, 
    timeTaken: number, 
    hintsUsed: number,
    response?: string
  ): Promise<DrillSession | null> {
    const sessionIndex = this.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex < 0) return null;

    const session = this.sessions[sessionIndex];
    const scenario = this.getScenario(session.scenarioId);
    if (!scenario) return null;

    const step = scenario.steps.find(s => s.id === stepId);
    if (!step) return null;

    // Calculate points (reduced for hints used and time over limit)
    let points = correct ? step.points : 0;
    if (correct) {
      // Reduce points for hints used (10% per hint)
      points = Math.max(0, points - (hintsUsed * step.points * 0.1));
      // Reduce points if over time limit (20% penalty)
      if (timeTaken > step.timeLimit) {
        points = Math.max(0, points * 0.8);
      }
    }

    const stepResult: StepResult = {
      stepId,
      stepOrder: step.order,
      completed: true,
      correct,
      timeTaken,
      pointsEarned: Math.round(points),
      hintsUsed,
      response,
    };

    session.stepResults.push(stepResult);
    session.currentStep = step.order;
    session.score += stepResult.pointsEarned;

    // Check if drill is complete
    if (session.currentStep >= session.totalSteps) {
      session.status = 'completed';
      session.completedAt = new Date().toISOString();
      session.duration = new Date(session.completedAt).getTime() - new Date(session.startedAt!).getTime();
      session.passed = session.score >= scenario.passingScore;
      
      // Generate certificate if passed
      if (session.passed) {
        session.certificateId = `cert_${Date.now()}`;
      }

      // Update participant score
      await this.updateParticipantScore(session);
    }

    this.sessions[sessionIndex] = session;
    await this.saveSessions();
    return session;
  }

  /**
   * Cancel a drill session
   */
  async cancelDrill(sessionId: string): Promise<boolean> {
    const sessionIndex = this.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex < 0) return false;

    this.sessions[sessionIndex].status = 'cancelled';
    this.sessions[sessionIndex].completedAt = new Date().toISOString();
    await this.saveSessions();
    return true;
  }

  /**
   * Get all sessions
   */
  getSessions(filters?: { participantId?: string; status?: DrillStatus; threatType?: ThreatType }): DrillSession[] {
    let result = [...this.sessions];

    if (filters?.participantId) {
      result = result.filter(s => s.participantId === filters.participantId);
    }
    if (filters?.status) {
      result = result.filter(s => s.status === filters.status);
    }
    if (filters?.threatType) {
      result = result.filter(s => s.threatType === filters.threatType);
    }

    return result;
  }

  /**
   * Get session by ID
   */
  getSession(id: string): DrillSession | null {
    return this.sessions.find(s => s.id === id) || null;
  }

  /**
   * Update participant score
   */
  private async updateParticipantScore(session: DrillSession): Promise<void> {
    const existingIndex = this.scores.findIndex(s => s.participantId === session.participantId);
    
    if (existingIndex >= 0) {
      const score = this.scores[existingIndex];
      score.totalDrills++;
      if (session.status === 'completed') {
        score.completedDrills++;
        if (session.passed) score.passedDrills++;
        score.totalScore += session.score;
        score.averageScore = Math.round(score.totalScore / score.completedDrills);
        score.bestScore = Math.max(score.bestScore, session.score);
        if (session.duration) {
          score.averageTime = Math.round(
            (score.averageTime * (score.completedDrills - 1) + session.duration / 1000) / score.completedDrills
          );
        }
        score.lastDrillAt = session.completedAt;
      }
      this.scores[existingIndex] = score;
    } else {
      const newScore: DrillScore = {
        participantId: session.participantId,
        participantName: session.participantName,
        totalDrills: 1,
        completedDrills: session.status === 'completed' ? 1 : 0,
        passedDrills: session.passed ? 1 : 0,
        totalScore: session.score,
        averageScore: session.score,
        bestScore: session.score,
        averageTime: session.duration ? session.duration / 1000 : 0,
        badges: [],
        lastDrillAt: session.completedAt,
      };
      this.scores.push(newScore);
    }

    // Update ranks
    this.scores.sort((a, b) => b.averageScore - a.averageScore);
    this.scores.forEach((s, i) => s.rank = i + 1);

    await this.saveScores();
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(limit: number = 10): DrillScore[] {
    return this.scores.slice(0, limit);
  }

  /**
   * Get participant score
   */
  getParticipantScore(participantId: string): DrillScore | null {
    return this.scores.find(s => s.participantId === participantId) || null;
  }

  /**
   * Get drill analytics
   */
  getAnalytics(): DrillAnalytics {
    const completedSessions = this.sessions.filter(s => s.status === 'completed');
    const passedSessions = completedSessions.filter(s => s.passed);

    const byThreatType: Record<ThreatType, { count: number; passRate: number; avgScore: number }> = {} as any;
    const byDifficulty: Record<DrillDifficulty, { count: number; passRate: number; avgScore: number }> = {} as any;

    // Initialize threat type stats
    Object.keys(THREAT_TYPE_CONFIG).forEach(type => {
      const sessions = completedSessions.filter(s => s.threatType === type);
      const passed = sessions.filter(s => s.passed);
      byThreatType[type as ThreatType] = {
        count: sessions.length,
        passRate: sessions.length > 0 ? Math.round((passed.length / sessions.length) * 100) : 0,
        avgScore: sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length) : 0,
      };
    });

    // Initialize difficulty stats
    Object.keys(DIFFICULTY_CONFIG).forEach(diff => {
      const sessions = completedSessions.filter(s => s.difficulty === diff);
      const passed = sessions.filter(s => s.passed);
      byDifficulty[diff as DrillDifficulty] = {
        count: sessions.length,
        passRate: sessions.length > 0 ? Math.round((passed.length / sessions.length) * 100) : 0,
        avgScore: sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length) : 0,
      };
    });

    return {
      totalDrills: this.sessions.length,
      completedDrills: completedSessions.length,
      passRate: completedSessions.length > 0 ? Math.round((passedSessions.length / completedSessions.length) * 100) : 0,
      averageScore: completedSessions.length > 0 
        ? Math.round(completedSessions.reduce((sum, s) => sum + s.score, 0) / completedSessions.length) 
        : 0,
      averageDuration: completedSessions.length > 0
        ? Math.round(completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / completedSessions.length / 1000)
        : 0,
      byThreatType,
      byDifficulty,
      topPerformers: this.getLeaderboard(5),
      recentDrills: this.sessions.slice(0, 10),
    };
  }

  /**
   * Generate default scenarios
   */
  private async generateDefaultScenarios(): Promise<void> {
    const defaults: Omit<DrillScenario, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Unauthorized Access Response',
        description: 'Respond to an unauthorized access attempt on critical systems',
        threatType: 'unauthorized_access',
        difficulty: 'beginner',
        estimatedDuration: 10,
        steps: [
          { id: 's1', order: 1, title: 'Identify the Breach', description: 'Review access logs to identify unauthorized access', expectedAction: 'Check security logs', timeLimit: 120, points: 20, hints: ['Look for failed login attempts', 'Check for unusual IP addresses'], isRequired: true },
          { id: 's2', order: 2, title: 'Isolate Affected Systems', description: 'Quarantine compromised accounts and systems', expectedAction: 'Disable compromised accounts', timeLimit: 90, points: 25, hints: ['Use admin console to disable accounts', 'Document affected systems'], isRequired: true },
          { id: 's3', order: 3, title: 'Notify Stakeholders', description: 'Alert security team and management', expectedAction: 'Send incident notification', timeLimit: 60, points: 15, hints: ['Use incident notification template', 'Include severity level'], isRequired: true },
          { id: 's4', order: 4, title: 'Document Incident', description: 'Create detailed incident report', expectedAction: 'Complete incident report', timeLimit: 120, points: 20, hints: ['Include timeline of events', 'List all affected resources'], isRequired: true },
          { id: 's5', order: 5, title: 'Implement Remediation', description: 'Apply security patches and reset credentials', expectedAction: 'Reset passwords and apply patches', timeLimit: 180, points: 20, hints: ['Force password reset for affected users', 'Apply latest security updates'], isRequired: true },
        ],
        passingScore: 70,
        maxScore: 100,
        isDefault: true,
      },
      {
        name: 'Ransomware Attack Response',
        description: 'Handle a ransomware attack scenario with data encryption',
        threatType: 'ransomware',
        difficulty: 'advanced',
        estimatedDuration: 20,
        steps: [
          { id: 's1', order: 1, title: 'Detect Ransomware', description: 'Identify ransomware indicators and affected systems', expectedAction: 'Run malware scan', timeLimit: 180, points: 15, hints: ['Check for unusual file extensions', 'Look for ransom notes'], isRequired: true },
          { id: 's2', order: 2, title: 'Isolate Network', description: 'Disconnect affected systems from network', expectedAction: 'Network isolation', timeLimit: 120, points: 20, hints: ['Disable network adapters', 'Block lateral movement'], isRequired: true },
          { id: 's3', order: 3, title: 'Preserve Evidence', description: 'Capture forensic images before remediation', expectedAction: 'Create forensic backup', timeLimit: 300, points: 15, hints: ['Use forensic imaging tools', 'Maintain chain of custody'], isRequired: true },
          { id: 's4', order: 4, title: 'Assess Impact', description: 'Determine scope of encryption and data loss', expectedAction: 'Impact assessment', timeLimit: 240, points: 15, hints: ['Identify encrypted files', 'Check backup availability'], isRequired: true },
          { id: 's5', order: 5, title: 'Restore from Backup', description: 'Recover data from clean backups', expectedAction: 'Data restoration', timeLimit: 300, points: 20, hints: ['Verify backup integrity', 'Restore in isolated environment'], isRequired: true },
          { id: 's6', order: 6, title: 'Post-Incident Review', description: 'Document lessons learned and improve defenses', expectedAction: 'Complete review report', timeLimit: 180, points: 15, hints: ['Identify attack vector', 'Recommend preventive measures'], isRequired: true },
        ],
        passingScore: 75,
        maxScore: 100,
        isDefault: true,
      },
      {
        name: 'Phishing Attack Response',
        description: 'Respond to a phishing campaign targeting employees',
        threatType: 'phishing_attempt',
        difficulty: 'intermediate',
        estimatedDuration: 15,
        steps: [
          { id: 's1', order: 1, title: 'Identify Phishing Email', description: 'Analyze suspicious email characteristics', expectedAction: 'Email analysis', timeLimit: 120, points: 20, hints: ['Check sender address', 'Examine links without clicking'], isRequired: true },
          { id: 's2', order: 2, title: 'Block Malicious URLs', description: 'Add phishing URLs to blocklist', expectedAction: 'URL blocking', timeLimit: 90, points: 20, hints: ['Update web filter', 'Block at firewall level'], isRequired: true },
          { id: 's3', order: 3, title: 'Alert Users', description: 'Send warning to all employees', expectedAction: 'User notification', timeLimit: 60, points: 20, hints: ['Use mass notification system', 'Include phishing indicators'], isRequired: true },
          { id: 's4', order: 4, title: 'Check for Compromises', description: 'Identify users who clicked malicious links', expectedAction: 'Compromise check', timeLimit: 180, points: 20, hints: ['Review web proxy logs', 'Check for credential submissions'], isRequired: true },
          { id: 's5', order: 5, title: 'Reset Credentials', description: 'Force password reset for affected users', expectedAction: 'Credential reset', timeLimit: 120, points: 20, hints: ['Identify affected accounts', 'Enable MFA'], isRequired: true },
        ],
        passingScore: 70,
        maxScore: 100,
        isDefault: true,
      },
      {
        name: 'Data Breach Response',
        description: 'Handle a confirmed data breach with potential data exposure',
        threatType: 'data_breach',
        difficulty: 'expert',
        estimatedDuration: 30,
        steps: [
          { id: 's1', order: 1, title: 'Confirm Breach', description: 'Verify data breach and scope', expectedAction: 'Breach confirmation', timeLimit: 240, points: 15, hints: ['Review access logs', 'Check data exfiltration indicators'], isRequired: true },
          { id: 's2', order: 2, title: 'Contain Breach', description: 'Stop ongoing data exfiltration', expectedAction: 'Breach containment', timeLimit: 180, points: 20, hints: ['Block suspicious connections', 'Revoke compromised credentials'], isRequired: true },
          { id: 's3', order: 3, title: 'Assess Data Impact', description: 'Identify exposed data types and volume', expectedAction: 'Data assessment', timeLimit: 300, points: 15, hints: ['Classify exposed data', 'Identify affected individuals'], isRequired: true },
          { id: 's4', order: 4, title: 'Legal Notification', description: 'Prepare regulatory notifications', expectedAction: 'Legal compliance', timeLimit: 240, points: 15, hints: ['Check notification requirements', 'Prepare breach disclosure'], isRequired: true },
          { id: 's5', order: 5, title: 'Customer Notification', description: 'Notify affected customers', expectedAction: 'Customer communication', timeLimit: 180, points: 15, hints: ['Use notification template', 'Provide credit monitoring info'], isRequired: true },
          { id: 's6', order: 6, title: 'Forensic Investigation', description: 'Conduct detailed forensic analysis', expectedAction: 'Forensic analysis', timeLimit: 360, points: 10, hints: ['Preserve evidence', 'Document attack timeline'], isRequired: true },
          { id: 's7', order: 7, title: 'Remediation Plan', description: 'Implement security improvements', expectedAction: 'Security remediation', timeLimit: 240, points: 10, hints: ['Address root cause', 'Implement additional controls'], isRequired: true },
        ],
        passingScore: 80,
        maxScore: 100,
        isDefault: true,
      },
    ];

    for (const scenario of defaults) {
      const newScenario: DrillScenario = {
        ...scenario,
        id: `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.scenarios.push(newScenario);
    }

    await this.saveScenarios();
  }

  /**
   * Clear all data
   */
  async clearData(): Promise<void> {
    this.scenarios = [];
    this.sessions = [];
    this.scores = [];
    await AsyncStorage.removeItem(STORAGE_KEYS.DRILL_SCENARIOS);
    await AsyncStorage.removeItem(STORAGE_KEYS.DRILL_SESSIONS);
    await AsyncStorage.removeItem(STORAGE_KEYS.DRILL_SCORES);
  }
}

export const drillModeService = new DrillModeService();
