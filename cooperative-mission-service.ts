/**
 * MediVac One Tricorder Cooperative Missions Service
 * Multiplayer mission system with team coordination
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Mission Types
export type MissionType = 'medical_emergency' | 'environmental_hazard' | 'engineering_crisis' | 'security_breach' | 'research_expedition';

// Mission Difficulty
export type MissionDifficulty = 'training' | 'standard' | 'advanced' | 'expert' | 'legendary';

// Team Role
export type TeamRole = 'leader' | 'medic' | 'engineer' | 'scientist' | 'security' | 'support';

// Mission Status
export type MissionStatus = 'recruiting' | 'briefing' | 'in_progress' | 'completed' | 'failed' | 'abandoned';

// Mission
export interface CooperativeMission {
  id: string;
  name: string;
  description: string;
  type: MissionType;
  difficulty: MissionDifficulty;
  status: MissionStatus;
  minPlayers: number;
  maxPlayers: number;
  currentPlayers: number;
  objectives: MissionObjective[];
  rewards: MissionRewards;
  timeLimit: number; // in seconds
  startedAt?: string;
  completedAt?: string;
  createdBy: string;
  createdAt: string;
  briefing: string;
  location: MissionLocation;
  requiredTricorders: string[];
}

// Mission Objective
export interface MissionObjective {
  id: string;
  title: string;
  description: string;
  type: 'scan' | 'analyze' | 'repair' | 'treat' | 'investigate' | 'secure';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number; // 0-100
  requiredScans: number;
  completedScans: number;
  assignedTo?: string;
  completedBy?: string;
  completedAt?: string;
  xpReward: number;
}

// Mission Rewards
export interface MissionRewards {
  xp: number;
  credits: number;
  items: { itemId: string; quantity: number }[];
  badges: string[];
  bonusXp?: number;
  bonusCredits?: number;
}

// Mission Location
export interface MissionLocation {
  name: string;
  sector: string;
  coordinates: { x: number; y: number; z: number };
  hazardLevel: number;
  environment: string;
}

// Team Member
export interface TeamMember {
  id: string;
  odId: string;
  name: string;
  avatar?: string;
  role: TeamRole;
  tricorderId?: string;
  tricorderType?: string;
  status: 'ready' | 'busy' | 'offline' | 'in_mission';
  joinedAt: string;
  contribution: number;
  scansCompleted: number;
  objectivesCompleted: number;
}

// Mission Team
export interface MissionTeam {
  id: string;
  missionId: string;
  name: string;
  members: TeamMember[];
  leader: string;
  createdAt: string;
  chatEnabled: boolean;
  voiceEnabled: boolean;
}

// Mission Chat Message
export interface MissionChatMessage {
  id: string;
  missionId: string;
  senderId: string;
  senderName: string;
  message: string;
  type: 'text' | 'system' | 'objective' | 'alert' | 'coordinates';
  timestamp: string;
  readBy: string[];
}

// Mission Progress Update
export interface MissionProgressUpdate {
  id: string;
  missionId: string;
  objectiveId: string;
  playerId: string;
  playerName: string;
  action: string;
  progress: number;
  timestamp: string;
}

// Leaderboard Entry
export interface LeaderboardEntry {
  rank: number;
  odId: string;
  name: string;
  avatar?: string;
  totalXp: number;
  missionsCompleted: number;
  objectivesCompleted: number;
  averageContribution: number;
  badges: string[];
}

// Player Stats
export interface PlayerMissionStats {
  odId: string;
  totalMissions: number;
  completedMissions: number;
  failedMissions: number;
  totalXpEarned: number;
  totalCreditsEarned: number;
  objectivesCompleted: number;
  scansPerformed: number;
  averageContribution: number;
  preferredRole: TeamRole;
  badges: string[];
  rank: string;
  level: number;
}

const STORAGE_KEYS = {
  MISSIONS: 'coop_missions',
  TEAMS: 'coop_teams',
  CHAT: 'coop_chat',
  PROGRESS: 'coop_progress',
  LEADERBOARD: 'coop_leaderboard',
  PLAYER_STATS: 'coop_player_stats',
};

class CooperativeMissionService {
  private missions: CooperativeMission[] = [];
  private teams: MissionTeam[] = [];
  private chatMessages: MissionChatMessage[] = [];
  private progressUpdates: MissionProgressUpdate[] = [];
  private leaderboard: LeaderboardEntry[] = [];
  private playerStats: Map<string, PlayerMissionStats> = new Map();
  private initialized = false;
  private eventListeners: Map<string, ((data: unknown) => void)[]> = new Map();

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const [missionsData, teamsData, chatData, progressData, leaderboardData, statsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.MISSIONS),
        AsyncStorage.getItem(STORAGE_KEYS.TEAMS),
        AsyncStorage.getItem(STORAGE_KEYS.CHAT),
        AsyncStorage.getItem(STORAGE_KEYS.PROGRESS),
        AsyncStorage.getItem(STORAGE_KEYS.LEADERBOARD),
        AsyncStorage.getItem(STORAGE_KEYS.PLAYER_STATS),
      ]);

      this.missions = missionsData ? JSON.parse(missionsData) : this.getDefaultMissions();
      this.teams = teamsData ? JSON.parse(teamsData) : [];
      this.chatMessages = chatData ? JSON.parse(chatData) : [];
      this.progressUpdates = progressData ? JSON.parse(progressData) : [];
      this.leaderboard = leaderboardData ? JSON.parse(leaderboardData) : this.getDefaultLeaderboard();
      
      if (statsData) {
        const statsObj = JSON.parse(statsData);
        this.playerStats = new Map(Object.entries(statsObj));
      }

      this.initialized = true;
    } catch (error) {
      console.error('[Cooperative Mission] Failed to initialize:', error);
      this.missions = this.getDefaultMissions();
      this.leaderboard = this.getDefaultLeaderboard();
      this.initialized = true;
    }
  }

  private getDefaultMissions(): CooperativeMission[] {
    return [
      {
        id: 'mission_med_001',
        name: 'Mass Casualty Response',
        description: 'Multiple patients require immediate triage and treatment after a transport accident.',
        type: 'medical_emergency',
        difficulty: 'standard',
        status: 'recruiting',
        minPlayers: 2,
        maxPlayers: 6,
        currentPlayers: 1,
        objectives: [
          {
            id: 'obj_1',
            title: 'Triage All Patients',
            description: 'Scan and categorize all 12 patients by severity',
            type: 'scan',
            status: 'pending',
            progress: 0,
            requiredScans: 12,
            completedScans: 0,
            xpReward: 500,
          },
          {
            id: 'obj_2',
            title: 'Stabilize Critical Patients',
            description: 'Provide emergency treatment to 4 critical patients',
            type: 'treat',
            status: 'pending',
            progress: 0,
            requiredScans: 4,
            completedScans: 0,
            xpReward: 750,
          },
          {
            id: 'obj_3',
            title: 'Environmental Scan',
            description: 'Check for hazardous materials at the scene',
            type: 'analyze',
            status: 'pending',
            progress: 0,
            requiredScans: 3,
            completedScans: 0,
            xpReward: 300,
          },
        ],
        rewards: {
          xp: 2000,
          credits: 500,
          items: [{ itemId: 'med_kit_advanced', quantity: 1 }],
          badges: ['first_responder'],
        },
        timeLimit: 1800,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        briefing: 'A transport shuttle has crashed in Sector 7. Multiple casualties reported. Your team must respond immediately to triage patients, stabilize critical cases, and ensure the scene is safe.',
        location: {
          name: 'Sector 7 Crash Site',
          sector: 'Alpha-7',
          coordinates: { x: 127.5, y: 45.2, z: 0 },
          hazardLevel: 3,
          environment: 'Urban Emergency',
        },
        requiredTricorders: ['medical'],
      },
      {
        id: 'mission_env_001',
        name: 'Toxic Spill Containment',
        description: 'A chemical leak threatens the water supply. Identify and neutralize the contamination.',
        type: 'environmental_hazard',
        difficulty: 'advanced',
        status: 'recruiting',
        minPlayers: 3,
        maxPlayers: 8,
        currentPlayers: 2,
        objectives: [
          {
            id: 'obj_1',
            title: 'Identify Contaminants',
            description: 'Analyze water samples to identify all toxic compounds',
            type: 'analyze',
            status: 'pending',
            progress: 0,
            requiredScans: 8,
            completedScans: 0,
            xpReward: 600,
          },
          {
            id: 'obj_2',
            title: 'Locate Source',
            description: 'Track contamination to its source',
            type: 'investigate',
            status: 'pending',
            progress: 0,
            requiredScans: 5,
            completedScans: 0,
            xpReward: 800,
          },
          {
            id: 'obj_3',
            title: 'Seal Breach',
            description: 'Repair the containment breach',
            type: 'repair',
            status: 'pending',
            progress: 0,
            requiredScans: 3,
            completedScans: 0,
            xpReward: 1000,
          },
          {
            id: 'obj_4',
            title: 'Verify Neutralization',
            description: 'Confirm water supply is safe',
            type: 'scan',
            status: 'pending',
            progress: 0,
            requiredScans: 6,
            completedScans: 0,
            xpReward: 400,
          },
        ],
        rewards: {
          xp: 3500,
          credits: 800,
          items: [{ itemId: 'env_scanner_upgrade', quantity: 1 }, { itemId: 'hazmat_suit', quantity: 1 }],
          badges: ['environmental_hero', 'contamination_expert'],
        },
        timeLimit: 2400,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        briefing: 'Emergency alert: A chemical storage facility has reported a containment breach. Toxic compounds are leaking into the municipal water supply. Your team must identify all contaminants, locate the source, seal the breach, and verify the water is safe.',
        location: {
          name: 'Water Treatment Plant',
          sector: 'Beta-12',
          coordinates: { x: 89.3, y: 156.7, z: -5 },
          hazardLevel: 5,
          environment: 'Industrial Hazmat',
        },
        requiredTricorders: ['environmental', 'engineering'],
      },
      {
        id: 'mission_eng_001',
        name: 'Power Grid Restoration',
        description: 'Critical systems are failing. Diagnose and repair the power distribution network.',
        type: 'engineering_crisis',
        difficulty: 'expert',
        status: 'recruiting',
        minPlayers: 4,
        maxPlayers: 10,
        currentPlayers: 0,
        objectives: [
          {
            id: 'obj_1',
            title: 'Diagnostic Scan',
            description: 'Scan all 15 power nodes to identify failures',
            type: 'scan',
            status: 'pending',
            progress: 0,
            requiredScans: 15,
            completedScans: 0,
            xpReward: 700,
          },
          {
            id: 'obj_2',
            title: 'Repair Primary Conduits',
            description: 'Fix damaged power conduits',
            type: 'repair',
            status: 'pending',
            progress: 0,
            requiredScans: 8,
            completedScans: 0,
            xpReward: 1200,
          },
          {
            id: 'obj_3',
            title: 'Reroute Power',
            description: 'Configure backup power routing',
            type: 'analyze',
            status: 'pending',
            progress: 0,
            requiredScans: 6,
            completedScans: 0,
            xpReward: 900,
          },
          {
            id: 'obj_4',
            title: 'System Verification',
            description: 'Verify all systems are operational',
            type: 'scan',
            status: 'pending',
            progress: 0,
            requiredScans: 10,
            completedScans: 0,
            xpReward: 500,
          },
        ],
        rewards: {
          xp: 5000,
          credits: 1200,
          items: [{ itemId: 'engineering_tricorder_rare', quantity: 1 }],
          badges: ['power_master', 'crisis_engineer', 'team_leader'],
        },
        timeLimit: 3000,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        briefing: 'A cascading power failure has knocked out critical hospital systems including life support in ICU. Your engineering team must diagnose the failures, repair damaged infrastructure, and restore power before backup batteries are depleted.',
        location: {
          name: 'Main Power Distribution Hub',
          sector: 'Gamma-3',
          coordinates: { x: 45.0, y: 78.9, z: -15 },
          hazardLevel: 4,
          environment: 'High Voltage Area',
        },
        requiredTricorders: ['engineering'],
      },
      {
        id: 'mission_sec_001',
        name: 'Quarantine Breach',
        description: 'A pathogen has escaped containment. Secure the area and track all exposed individuals.',
        type: 'security_breach',
        difficulty: 'legendary',
        status: 'recruiting',
        minPlayers: 5,
        maxPlayers: 12,
        currentPlayers: 3,
        objectives: [
          {
            id: 'obj_1',
            title: 'Identify Pathogen',
            description: 'Analyze samples to identify the escaped pathogen',
            type: 'analyze',
            status: 'pending',
            progress: 0,
            requiredScans: 5,
            completedScans: 0,
            xpReward: 1000,
          },
          {
            id: 'obj_2',
            title: 'Track Exposure',
            description: 'Scan and identify all potentially exposed individuals',
            type: 'scan',
            status: 'pending',
            progress: 0,
            requiredScans: 20,
            completedScans: 0,
            xpReward: 1500,
          },
          {
            id: 'obj_3',
            title: 'Secure Perimeter',
            description: 'Establish and verify quarantine boundaries',
            type: 'secure',
            status: 'pending',
            progress: 0,
            requiredScans: 12,
            completedScans: 0,
            xpReward: 800,
          },
          {
            id: 'obj_4',
            title: 'Decontamination',
            description: 'Treat all exposed individuals',
            type: 'treat',
            status: 'pending',
            progress: 0,
            requiredScans: 15,
            completedScans: 0,
            xpReward: 1200,
          },
          {
            id: 'obj_5',
            title: 'Containment Verification',
            description: 'Verify pathogen is fully contained',
            type: 'investigate',
            status: 'pending',
            progress: 0,
            requiredScans: 8,
            completedScans: 0,
            xpReward: 600,
          },
        ],
        rewards: {
          xp: 8000,
          credits: 2000,
          items: [
            { itemId: 'legendary_medical_tricorder', quantity: 1 },
            { itemId: 'biohazard_suit_elite', quantity: 1 },
          ],
          badges: ['outbreak_controller', 'legendary_responder', 'pathogen_hunter'],
        },
        timeLimit: 3600,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        briefing: 'CRITICAL ALERT: A Level 4 pathogen has breached containment in the research wing. Multiple staff members may be exposed. Your team must identify the pathogen, track all exposed individuals, establish quarantine, and ensure complete containment. Time is critical.',
        location: {
          name: 'Research Wing - Biosafety Lab',
          sector: 'Delta-1',
          coordinates: { x: 200.0, y: 50.0, z: 10 },
          hazardLevel: 10,
          environment: 'Biohazard Zone',
        },
        requiredTricorders: ['medical', 'science', 'tactical'],
      },
    ];
  }

  private getDefaultLeaderboard(): LeaderboardEntry[] {
    return [
      {
        rank: 1,
        odId: 'player_001',
        name: 'Dr. Sarah Chen',
        totalXp: 125000,
        missionsCompleted: 47,
        objectivesCompleted: 312,
        averageContribution: 92,
        badges: ['legendary_responder', 'mission_master', 'team_leader'],
      },
      {
        rank: 2,
        odId: 'player_002',
        name: 'Chief Engineer Marcus',
        totalXp: 98500,
        missionsCompleted: 38,
        objectivesCompleted: 245,
        averageContribution: 88,
        badges: ['power_master', 'crisis_engineer'],
      },
      {
        rank: 3,
        odId: 'player_003',
        name: 'Lt. Commander Vex',
        totalXp: 87200,
        missionsCompleted: 35,
        objectivesCompleted: 198,
        averageContribution: 85,
        badges: ['outbreak_controller', 'environmental_hero'],
      },
    ];
  }

  private async save(): Promise<void> {
    try {
      const statsObj = Object.fromEntries(this.playerStats);
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(this.missions)),
        AsyncStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(this.teams)),
        AsyncStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(this.chatMessages.slice(-500))),
        AsyncStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(this.progressUpdates.slice(-200))),
        AsyncStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(this.leaderboard)),
        AsyncStorage.setItem(STORAGE_KEYS.PLAYER_STATS, JSON.stringify(statsObj)),
      ]);
    } catch (error) {
      console.error('[Cooperative Mission] Failed to save:', error);
    }
  }

  // Mission Management
  async getMissions(filter?: { type?: MissionType; status?: MissionStatus; difficulty?: MissionDifficulty }): Promise<CooperativeMission[]> {
    await this.initialize();
    let filtered = [...this.missions];
    
    if (filter?.type) {
      filtered = filtered.filter(m => m.type === filter.type);
    }
    if (filter?.status) {
      filtered = filtered.filter(m => m.status === filter.status);
    }
    if (filter?.difficulty) {
      filtered = filtered.filter(m => m.difficulty === filter.difficulty);
    }
    
    return filtered;
  }

  async getMission(missionId: string): Promise<CooperativeMission | null> {
    await this.initialize();
    return this.missions.find(m => m.id === missionId) || null;
  }

  async createMission(mission: Omit<CooperativeMission, 'id' | 'status' | 'currentPlayers' | 'createdAt'>): Promise<CooperativeMission> {
    await this.initialize();
    const newMission: CooperativeMission = {
      ...mission,
      id: `mission_${Date.now()}`,
      status: 'recruiting',
      currentPlayers: 0,
      createdAt: new Date().toISOString(),
    };
    this.missions.push(newMission);
    await this.save();
    this.emit('mission_created', newMission);
    return newMission;
  }

  async joinMission(missionId: string, player: Omit<TeamMember, 'joinedAt' | 'contribution' | 'scansCompleted' | 'objectivesCompleted'>): Promise<{ success: boolean; team?: MissionTeam; error?: string }> {
    await this.initialize();
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) {
      return { success: false, error: 'Mission not found' };
    }
    if (mission.status !== 'recruiting' && mission.status !== 'briefing') {
      return { success: false, error: 'Mission is not accepting new players' };
    }
    if (mission.currentPlayers >= mission.maxPlayers) {
      return { success: false, error: 'Mission is full' };
    }

    let team = this.teams.find(t => t.missionId === missionId);
    if (!team) {
      team = {
        id: `team_${missionId}`,
        missionId,
        name: `${mission.name} Team`,
        members: [],
        leader: player.id,
        createdAt: new Date().toISOString(),
        chatEnabled: true,
        voiceEnabled: true,
      };
      this.teams.push(team);
    }

    const newMember: TeamMember = {
      ...player,
      joinedAt: new Date().toISOString(),
      contribution: 0,
      scansCompleted: 0,
      objectivesCompleted: 0,
    };

    team.members.push(newMember);
    mission.currentPlayers = team.members.length;

    if (mission.currentPlayers >= mission.minPlayers && mission.status === 'recruiting') {
      mission.status = 'briefing';
    }

    await this.save();
    this.emit('player_joined', { mission, player: newMember });
    return { success: true, team };
  }

  async leaveMission(missionId: string, odId: string): Promise<boolean> {
    await this.initialize();
    const team = this.teams.find(t => t.missionId === missionId);
    if (!team) return false;

    const memberIndex = team.members.findIndex(m => m.odId === odId);
    if (memberIndex === -1) return false;

    team.members.splice(memberIndex, 1);
    
    const mission = this.missions.find(m => m.id === missionId);
    if (mission) {
      mission.currentPlayers = team.members.length;
      if (mission.currentPlayers < mission.minPlayers && mission.status === 'briefing') {
        mission.status = 'recruiting';
      }
    }

    await this.save();
    this.emit('player_left', { missionId, odId });
    return true;
  }

  async startMission(missionId: string): Promise<{ success: boolean; error?: string }> {
    await this.initialize();
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) {
      return { success: false, error: 'Mission not found' };
    }
    if (mission.status !== 'briefing') {
      return { success: false, error: 'Mission must be in briefing status to start' };
    }
    if (mission.currentPlayers < mission.minPlayers) {
      return { success: false, error: `Need at least ${mission.minPlayers} players to start` };
    }

    mission.status = 'in_progress';
    mission.startedAt = new Date().toISOString();

    await this.save();
    this.emit('mission_started', mission);
    return { success: true };
  }

  // Objective Progress
  async updateObjectiveProgress(
    missionId: string,
    objectiveId: string,
    odId: string,
    playerName: string,
    scansCompleted: number
  ): Promise<{ success: boolean; objective?: MissionObjective; missionCompleted?: boolean }> {
    await this.initialize();
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission || mission.status !== 'in_progress') {
      return { success: false };
    }

    const objective = mission.objectives.find(o => o.id === objectiveId);
    if (!objective) {
      return { success: false };
    }

    objective.completedScans += scansCompleted;
    objective.progress = Math.min(100, (objective.completedScans / objective.requiredScans) * 100);

    if (objective.completedScans >= objective.requiredScans && objective.status !== 'completed') {
      objective.status = 'completed';
      objective.completedBy = odId;
      objective.completedAt = new Date().toISOString();

      // Update player stats
      const team = this.teams.find(t => t.missionId === missionId);
      const member = team?.members.find(m => m.odId === odId);
      if (member) {
        member.objectivesCompleted++;
        member.scansCompleted += scansCompleted;
      }
    } else if (objective.status === 'pending') {
      objective.status = 'in_progress';
      objective.assignedTo = odId;
    }

    // Record progress update
    const progressUpdate: MissionProgressUpdate = {
      id: `prog_${Date.now()}`,
      missionId,
      objectiveId,
      playerId: odId,
      playerName,
      action: `Completed ${scansCompleted} scans`,
      progress: objective.progress,
      timestamp: new Date().toISOString(),
    };
    this.progressUpdates.push(progressUpdate);

    // Check if mission is complete
    const allCompleted = mission.objectives.every(o => o.status === 'completed');
    if (allCompleted) {
      await this.completeMission(missionId);
    }

    await this.save();
    this.emit('objective_updated', { mission, objective, progressUpdate });
    return { success: true, objective, missionCompleted: allCompleted };
  }

  async completeMission(missionId: string): Promise<{ success: boolean; rewards?: MissionRewards }> {
    await this.initialize();
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) {
      return { success: false };
    }

    mission.status = 'completed';
    mission.completedAt = new Date().toISOString();

    // Calculate time bonus
    if (mission.startedAt) {
      const elapsed = (Date.now() - new Date(mission.startedAt).getTime()) / 1000;
      if (elapsed < mission.timeLimit * 0.5) {
        mission.rewards.bonusXp = Math.floor(mission.rewards.xp * 0.5);
        mission.rewards.bonusCredits = Math.floor(mission.rewards.credits * 0.5);
      } else if (elapsed < mission.timeLimit * 0.75) {
        mission.rewards.bonusXp = Math.floor(mission.rewards.xp * 0.25);
        mission.rewards.bonusCredits = Math.floor(mission.rewards.credits * 0.25);
      }
    }

    // Update player stats
    const team = this.teams.find(t => t.missionId === missionId);
    if (team) {
      for (const member of team.members) {
        let stats = this.playerStats.get(member.odId);
        if (!stats) {
          stats = {
            odId: member.odId,
            totalMissions: 0,
            completedMissions: 0,
            failedMissions: 0,
            totalXpEarned: 0,
            totalCreditsEarned: 0,
            objectivesCompleted: 0,
            scansPerformed: 0,
            averageContribution: 0,
            preferredRole: member.role,
            badges: [],
            rank: 'Ensign',
            level: 1,
          };
        }
        stats.completedMissions++;
        stats.totalMissions++;
        stats.totalXpEarned += mission.rewards.xp + (mission.rewards.bonusXp || 0);
        stats.totalCreditsEarned += mission.rewards.credits + (mission.rewards.bonusCredits || 0);
        stats.objectivesCompleted += member.objectivesCompleted;
        stats.scansPerformed += member.scansCompleted;
        
        // Add badges
        for (const badge of mission.rewards.badges) {
          if (!stats.badges.includes(badge)) {
            stats.badges.push(badge);
          }
        }

        this.playerStats.set(member.odId, stats);
      }
    }

    // Update leaderboard
    await this.updateLeaderboard();

    await this.save();
    this.emit('mission_completed', { mission, rewards: mission.rewards });
    return { success: true, rewards: mission.rewards };
  }

  async failMission(missionId: string, reason: string): Promise<boolean> {
    await this.initialize();
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) return false;

    mission.status = 'failed';
    mission.completedAt = new Date().toISOString();

    // Update player stats
    const team = this.teams.find(t => t.missionId === missionId);
    if (team) {
      for (const member of team.members) {
        const stats = this.playerStats.get(member.odId);
        if (stats) {
          const updatedStats = { ...stats };
          updatedStats.failedMissions++;
          updatedStats.totalMissions++;
          this.playerStats.set(member.odId, updatedStats);
        }
      }
    }

    await this.save();
    this.emit('mission_failed', { mission, reason });
    return true;
  }

  // Chat
  async sendChatMessage(missionId: string, senderId: string, senderName: string, message: string, type: MissionChatMessage['type'] = 'text'): Promise<MissionChatMessage> {
    await this.initialize();
    const chatMessage: MissionChatMessage = {
      id: `chat_${Date.now()}`,
      missionId,
      senderId,
      senderName,
      message,
      type,
      timestamp: new Date().toISOString(),
      readBy: [senderId],
    };
    this.chatMessages.push(chatMessage);
    await this.save();
    this.emit('chat_message', chatMessage);
    return chatMessage;
  }

  async getChatMessages(missionId: string, limit: number = 50): Promise<MissionChatMessage[]> {
    await this.initialize();
    return this.chatMessages
      .filter(m => m.missionId === missionId)
      .slice(-limit);
  }

  // Leaderboard
  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    await this.initialize();
    return this.leaderboard.slice(0, limit);
  }

  private async updateLeaderboard(): Promise<void> {
    const entries: LeaderboardEntry[] = [];
    
    this.playerStats.forEach((stats, odId) => {
      entries.push({
        rank: 0,
        odId,
        name: odId, // Would be replaced with actual name lookup
        totalXp: stats.totalXpEarned,
        missionsCompleted: stats.completedMissions,
        objectivesCompleted: stats.objectivesCompleted,
        averageContribution: stats.averageContribution,
        badges: stats.badges,
      });
    });

    // Sort by XP and assign ranks
    entries.sort((a, b) => b.totalXp - a.totalXp);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Merge with existing leaderboard (keep top entries from both)
    const combined = [...entries, ...this.leaderboard];
    const uniqueMap = new Map<string, LeaderboardEntry>();
    combined.forEach(entry => {
      const existing = uniqueMap.get(entry.odId);
      if (!existing || entry.totalXp > existing.totalXp) {
        uniqueMap.set(entry.odId, entry);
      }
    });

    this.leaderboard = Array.from(uniqueMap.values())
      .sort((a, b) => b.totalXp - a.totalXp)
      .slice(0, 100);
    
    this.leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });
  }

  // Player Stats
  async getPlayerStats(odId: string): Promise<PlayerMissionStats | null> {
    await this.initialize();
    return this.playerStats.get(odId) || null;
  }

  // Team Management
  async getTeam(missionId: string): Promise<MissionTeam | null> {
    await this.initialize();
    return this.teams.find(t => t.missionId === missionId) || null;
  }

  async assignRole(missionId: string, odId: string, role: TeamRole): Promise<boolean> {
    await this.initialize();
    const team = this.teams.find(t => t.missionId === missionId);
    if (!team) return false;

    const member = team.members.find(m => m.odId === odId);
    if (!member) return false;

    member.role = role;
    await this.save();
    this.emit('role_assigned', { missionId, odId, role });
    return true;
  }

  // Event System
  on(event: string, callback: (data: unknown) => void): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(callback);
    this.eventListeners.set(event, listeners);
  }

  off(event: string, callback: (data: unknown) => void): void {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(event, listeners);
    }
  }

  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => callback(data));
  }
}

export const cooperativeMissionService = new CooperativeMissionService();
export default cooperativeMissionService;
