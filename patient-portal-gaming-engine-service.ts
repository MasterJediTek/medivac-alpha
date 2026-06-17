// Patient Portal Gaming Engine Service
// Immersive patient experience with map navigation, storyboard, roles, pets, and AI integration

// Types
export type UserRole = 'patient' | 'carer' | 'family' | 'visitor' | 'staff';
export type PetType = 'dog' | 'cat' | 'bird' | 'rabbit' | 'fish' | 'robot' | 'dragon' | 'unicorn';
export type MapZone = 'reception' | 'waiting' | 'consultation' | 'pharmacy' | 'lab' | 'imaging' | 'emergency' | 'cafe' | 'garden';
export type QuestType = 'health_check' | 'medication' | 'appointment' | 'education' | 'social' | 'achievement';

export interface PlayerProfile {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  
  // Progress
  level: number;
  experience: number;
  healthPoints: number;
  maxHealthPoints: number;
  
  // Stats
  appointmentsCompleted: number;
  medicationAdherence: number;
  questsCompleted: number;
  achievementsUnlocked: number;
  
  // Pet
  pet?: VirtualPet;
  
  // Preferences
  soundEnabled: boolean;
  voiceoverEnabled: boolean;
  hapticEnabled: boolean;
  
  // Timestamps
  createdAt: number;
  lastActiveAt: number;
  totalPlayTime: number;
}

export interface VirtualPet {
  id: string;
  name: string;
  type: PetType;
  sprite: string;
  
  // Stats
  happiness: number; // 0-100
  energy: number; // 0-100
  health: number; // 0-100
  
  // Abilities
  abilities: string[];
  
  // Customization
  accessories: string[];
  color: string;
  
  // Interaction
  lastFed: number;
  lastPlayed: number;
  lastPetted: number;
  
  // Bonding
  bondLevel: number; // 0-100
  totalInteractions: number;
}

export interface MapLocation {
  id: string;
  zone: MapZone;
  name: string;
  description: string;
  
  // Position
  x: number;
  y: number;
  width: number;
  height: number;
  
  // Visual
  icon: string;
  color: string;
  backgroundImage?: string;
  
  // State
  isUnlocked: boolean;
  isVisited: boolean;
  hasActiveQuest: boolean;
  
  // NPCs
  npcs: NPC[];
  
  // Connections
  connectedZones: MapZone[];
}

export interface NPC {
  id: string;
  name: string;
  role: string;
  avatar: string;
  
  // Dialogue
  greeting: string;
  dialogues: Dialogue[];
  
  // Position
  locationId: string;
  x: number;
  y: number;
  
  // State
  isAvailable: boolean;
  mood: 'happy' | 'neutral' | 'busy';
}

export interface Dialogue {
  id: string;
  text: string;
  voiceoverUrl?: string;
  responses?: DialogueResponse[];
  action?: string;
}

export interface DialogueResponse {
  text: string;
  nextDialogueId?: string;
  action?: string;
}

export interface Quest {
  id: string;
  type: QuestType;
  title: string;
  description: string;
  
  // Requirements
  objectives: QuestObjective[];
  
  // Rewards
  experienceReward: number;
  healthReward: number;
  itemRewards: string[];
  achievementId?: string;
  
  // State
  status: 'available' | 'active' | 'completed' | 'failed';
  progress: number; // 0-100
  
  // Timing
  startedAt?: number;
  completedAt?: number;
  expiresAt?: number;
  
  // Location
  locationId?: string;
  npcId?: string;
}

export interface QuestObjective {
  id: string;
  description: string;
  type: 'visit' | 'talk' | 'collect' | 'complete' | 'wait';
  target: string;
  currentCount: number;
  requiredCount: number;
  isCompleted: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  
  // Requirements
  requirement: string;
  threshold: number;
  
  // Rewards
  experienceReward: number;
  titleReward?: string;
  petUnlock?: PetType;
  
  // State
  isUnlocked: boolean;
  unlockedAt?: number;
  progress: number;
}

export interface AIAssistant {
  id: string;
  name: string;
  personality: 'professional' | 'friendly' | 'calm' | 'energetic';
  avatar: string;
  
  // Capabilities
  canAnswerQuestions: boolean;
  canScheduleAppointments: boolean;
  canProvideReminders: boolean;
  canGiveHealthTips: boolean;
  
  // State
  isActive: boolean;
  lastInteraction?: number;
  conversationHistory: AIMessage[];
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  intent?: string;
}

export interface GameAnalytics {
  totalPlayers: number;
  activePlayers: number;
  averageLevel: number;
  questCompletionRate: number;
  medicationAdherenceRate: number;
  petAdoptionRate: number;
  mostPopularZone: MapZone;
  averageSessionDuration: number;
}

// Sound effects
const playSound = (sound: string) => console.log(`Playing: ${sound}`);
const triggerHaptic = (type: string) => console.log(`Haptic: ${type}`);

// Default map locations
const DEFAULT_MAP_LOCATIONS: MapLocation[] = [
  {
    id: 'loc_reception',
    zone: 'reception',
    name: 'Reception',
    description: 'Welcome to WACHS! Check in here for your appointments.',
    x: 50, y: 80, width: 20, height: 15,
    icon: 'desk',
    color: '#005A9C',
    isUnlocked: true,
    isVisited: false,
    hasActiveQuest: true,
    npcs: [],
    connectedZones: ['waiting', 'cafe'],
  },
  {
    id: 'loc_waiting',
    zone: 'waiting',
    name: 'Waiting Room',
    description: 'A comfortable space to wait for your appointment.',
    x: 50, y: 60, width: 25, height: 15,
    icon: 'chair',
    color: '#00838F',
    isUnlocked: true,
    isVisited: false,
    hasActiveQuest: false,
    npcs: [],
    connectedZones: ['reception', 'consultation', 'pharmacy'],
  },
  {
    id: 'loc_consultation',
    zone: 'consultation',
    name: 'Consultation Rooms',
    description: 'Meet with your healthcare provider here.',
    x: 30, y: 40, width: 20, height: 20,
    icon: 'stethoscope',
    color: '#2E7D32',
    isUnlocked: false,
    isVisited: false,
    hasActiveQuest: false,
    npcs: [],
    connectedZones: ['waiting', 'lab', 'imaging'],
  },
  {
    id: 'loc_pharmacy',
    zone: 'pharmacy',
    name: 'Pharmacy',
    description: 'Collect your medications and get advice.',
    x: 70, y: 40, width: 15, height: 15,
    icon: 'pill',
    color: '#7B1FA2',
    isUnlocked: true,
    isVisited: false,
    hasActiveQuest: false,
    npcs: [],
    connectedZones: ['waiting', 'cafe'],
  },
  {
    id: 'loc_lab',
    zone: 'lab',
    name: 'Pathology Lab',
    description: 'Blood tests and other pathology services.',
    x: 20, y: 20, width: 15, height: 15,
    icon: 'flask',
    color: '#F57C00',
    isUnlocked: false,
    isVisited: false,
    hasActiveQuest: false,
    npcs: [],
    connectedZones: ['consultation', 'imaging'],
  },
  {
    id: 'loc_imaging',
    zone: 'imaging',
    name: 'Medical Imaging',
    description: 'X-rays, ultrasounds, and other imaging services.',
    x: 50, y: 20, width: 20, height: 15,
    icon: 'scan',
    color: '#0288D1',
    isUnlocked: false,
    isVisited: false,
    hasActiveQuest: false,
    npcs: [],
    connectedZones: ['consultation', 'lab'],
  },
  {
    id: 'loc_emergency',
    zone: 'emergency',
    name: 'Emergency Department',
    description: 'For urgent medical care. Call 000 for emergencies.',
    x: 80, y: 80, width: 15, height: 15,
    icon: 'emergency',
    color: '#D32F2F',
    isUnlocked: true,
    isVisited: false,
    hasActiveQuest: false,
    npcs: [],
    connectedZones: ['reception'],
  },
  {
    id: 'loc_cafe',
    zone: 'cafe',
    name: 'Hospital Café',
    description: 'Relax with a coffee or snack.',
    x: 80, y: 60, width: 15, height: 15,
    icon: 'coffee',
    color: '#795548',
    isUnlocked: true,
    isVisited: false,
    hasActiveQuest: false,
    npcs: [],
    connectedZones: ['reception', 'pharmacy', 'garden'],
  },
  {
    id: 'loc_garden',
    zone: 'garden',
    name: 'Healing Garden',
    description: 'A peaceful outdoor space for relaxation.',
    x: 80, y: 40, width: 15, height: 15,
    icon: 'flower',
    color: '#4CAF50',
    isUnlocked: true,
    isVisited: false,
    hasActiveQuest: false,
    npcs: [],
    connectedZones: ['cafe'],
  },
];

// Default achievements
const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach_first_visit',
    name: 'First Steps',
    description: 'Complete your first visit to WACHS',
    icon: 'footprints',
    requirement: 'Complete first appointment',
    threshold: 1,
    experienceReward: 100,
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'ach_medication_master',
    name: 'Medication Master',
    description: 'Take all medications on time for 7 days',
    icon: 'pill',
    requirement: 'Perfect medication adherence',
    threshold: 7,
    experienceReward: 500,
    titleReward: 'Health Champion',
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'ach_explorer',
    name: 'Hospital Explorer',
    description: 'Visit all areas of the hospital',
    icon: 'map',
    requirement: 'Visit all zones',
    threshold: 9,
    experienceReward: 300,
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'ach_pet_parent',
    name: 'Pet Parent',
    description: 'Adopt and care for a virtual pet',
    icon: 'paw',
    requirement: 'Adopt a pet',
    threshold: 1,
    experienceReward: 200,
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'ach_social_butterfly',
    name: 'Social Butterfly',
    description: 'Talk to 10 different NPCs',
    icon: 'chat',
    requirement: 'NPC conversations',
    threshold: 10,
    experienceReward: 250,
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'ach_quest_champion',
    name: 'Quest Champion',
    description: 'Complete 20 quests',
    icon: 'trophy',
    requirement: 'Quests completed',
    threshold: 20,
    experienceReward: 1000,
    titleReward: 'Quest Master',
    petUnlock: 'dragon',
    isUnlocked: false,
    progress: 0,
  },
];

class PatientPortalGamingEngineService {
  private players: Map<string, PlayerProfile> = new Map();
  private pets: Map<string, VirtualPet> = new Map();
  private mapLocations: Map<string, MapLocation> = new Map();
  private quests: Map<string, Quest> = new Map();
  private achievements: Map<string, Achievement> = new Map();
  private aiAssistants: Map<string, AIAssistant> = new Map();
  
  private currentPlayerId: string | null = null;
  private currentLocationId: string | null = null;

  constructor() {
    this.initializeMap();
    this.initializeAchievements();
    this.initializeAIAssistant();
    this.initializeDefaultQuests();
  }

  private initializeMap(): void {
    DEFAULT_MAP_LOCATIONS.forEach(loc => {
      // Add NPCs to locations
      const npcs = this.createNPCsForLocation(loc.zone);
      this.mapLocations.set(loc.id, { ...loc, npcs });
    });
  }

  private createNPCsForLocation(zone: MapZone): NPC[] {
    const npcsByZone: Record<MapZone, NPC[]> = {
      reception: [{
        id: 'npc_receptionist',
        name: 'Sarah',
        role: 'Receptionist',
        avatar: 'receptionist',
        greeting: 'Welcome to WACHS! How can I help you today?',
        dialogues: [{
          id: 'dialog_1',
          text: 'I can help you check in for your appointment, or answer any questions about our services.',
          responses: [
            { text: 'Check in for appointment', action: 'check_in' },
            { text: 'Ask about services', nextDialogueId: 'dialog_2' },
          ],
        }],
        locationId: 'loc_reception',
        x: 55, y: 85,
        isAvailable: true,
        mood: 'happy',
      }],
      waiting: [{
        id: 'npc_volunteer',
        name: 'Margaret',
        role: 'Hospital Volunteer',
        avatar: 'volunteer',
        greeting: 'Hello dear! Is there anything I can help you with while you wait?',
        dialogues: [],
        locationId: 'loc_waiting',
        x: 45, y: 65,
        isAvailable: true,
        mood: 'happy',
      }],
      consultation: [{
        id: 'npc_doctor',
        name: 'Dr. Chen',
        role: 'General Practitioner',
        avatar: 'doctor',
        greeting: 'Good to see you. Let\'s discuss your health today.',
        dialogues: [],
        locationId: 'loc_consultation',
        x: 35, y: 45,
        isAvailable: true,
        mood: 'neutral',
      }],
      pharmacy: [{
        id: 'npc_pharmacist',
        name: 'David',
        role: 'Pharmacist',
        avatar: 'pharmacist',
        greeting: 'Hi there! Ready to collect your medications?',
        dialogues: [],
        locationId: 'loc_pharmacy',
        x: 75, y: 45,
        isAvailable: true,
        mood: 'happy',
      }],
      lab: [{
        id: 'npc_pathologist',
        name: 'Emma',
        role: 'Pathology Technician',
        avatar: 'technician',
        greeting: 'Don\'t worry, I\'ll make this quick and easy.',
        dialogues: [],
        locationId: 'loc_lab',
        x: 25, y: 25,
        isAvailable: true,
        mood: 'neutral',
      }],
      imaging: [{
        id: 'npc_radiographer',
        name: 'Michael',
        role: 'Radiographer',
        avatar: 'radiographer',
        greeting: 'Ready for your scan? I\'ll explain everything.',
        dialogues: [],
        locationId: 'loc_imaging',
        x: 55, y: 25,
        isAvailable: true,
        mood: 'neutral',
      }],
      emergency: [{
        id: 'npc_triage_nurse',
        name: 'Nurse Kim',
        role: 'Triage Nurse',
        avatar: 'nurse',
        greeting: 'How can I help you? Is this an emergency?',
        dialogues: [],
        locationId: 'loc_emergency',
        x: 85, y: 85,
        isAvailable: true,
        mood: 'busy',
      }],
      cafe: [{
        id: 'npc_barista',
        name: 'Tom',
        role: 'Café Staff',
        avatar: 'barista',
        greeting: 'What can I get for you today?',
        dialogues: [],
        locationId: 'loc_cafe',
        x: 85, y: 65,
        isAvailable: true,
        mood: 'happy',
      }],
      garden: [{
        id: 'npc_gardener',
        name: 'Betty',
        role: 'Garden Volunteer',
        avatar: 'gardener',
        greeting: 'Lovely day for a walk in the garden, isn\'t it?',
        dialogues: [],
        locationId: 'loc_garden',
        x: 85, y: 45,
        isAvailable: true,
        mood: 'happy',
      }],
    };

    return npcsByZone[zone] || [];
  }

  private initializeAchievements(): void {
    DEFAULT_ACHIEVEMENTS.forEach(ach => {
      this.achievements.set(ach.id, { ...ach });
    });
  }

  private initializeAIAssistant(): void {
    const assistant: AIAssistant = {
      id: 'ai_wachs_helper',
      name: 'WACHS Helper',
      personality: 'friendly',
      avatar: 'robot_helper',
      canAnswerQuestions: true,
      canScheduleAppointments: true,
      canProvideReminders: true,
      canGiveHealthTips: true,
      isActive: true,
      conversationHistory: [],
    };

    this.aiAssistants.set(assistant.id, assistant);
  }

  private initializeDefaultQuests(): void {
    const defaultQuests: Quest[] = [
      {
        id: 'quest_welcome',
        type: 'health_check',
        title: 'Welcome to WACHS',
        description: 'Check in at reception and explore the hospital.',
        objectives: [
          { id: 'obj_1', description: 'Visit Reception', type: 'visit', target: 'loc_reception', currentCount: 0, requiredCount: 1, isCompleted: false },
          { id: 'obj_2', description: 'Talk to Sarah', type: 'talk', target: 'npc_receptionist', currentCount: 0, requiredCount: 1, isCompleted: false },
        ],
        experienceReward: 50,
        healthReward: 10,
        itemRewards: [],
        status: 'available',
        progress: 0,
        locationId: 'loc_reception',
      },
      {
        id: 'quest_medication',
        type: 'medication',
        title: 'Medication Check',
        description: 'Visit the pharmacy and collect your medications.',
        objectives: [
          { id: 'obj_1', description: 'Visit Pharmacy', type: 'visit', target: 'loc_pharmacy', currentCount: 0, requiredCount: 1, isCompleted: false },
          { id: 'obj_2', description: 'Talk to David', type: 'talk', target: 'npc_pharmacist', currentCount: 0, requiredCount: 1, isCompleted: false },
        ],
        experienceReward: 75,
        healthReward: 20,
        itemRewards: ['medication_badge'],
        status: 'available',
        progress: 0,
        locationId: 'loc_pharmacy',
      },
      {
        id: 'quest_relax',
        type: 'social',
        title: 'Take a Break',
        description: 'Visit the café and garden to relax.',
        objectives: [
          { id: 'obj_1', description: 'Visit Café', type: 'visit', target: 'loc_cafe', currentCount: 0, requiredCount: 1, isCompleted: false },
          { id: 'obj_2', description: 'Visit Garden', type: 'visit', target: 'loc_garden', currentCount: 0, requiredCount: 1, isCompleted: false },
        ],
        experienceReward: 40,
        healthReward: 15,
        itemRewards: [],
        status: 'available',
        progress: 0,
      },
    ];

    defaultQuests.forEach(q => this.quests.set(q.id, q));
  }

  // Player Management
  createPlayer(name: string, role: UserRole): PlayerProfile {
    const id = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const player: PlayerProfile = {
      id,
      name,
      role,
      avatar: 'default_avatar',
      level: 1,
      experience: 0,
      healthPoints: 100,
      maxHealthPoints: 100,
      appointmentsCompleted: 0,
      medicationAdherence: 100,
      questsCompleted: 0,
      achievementsUnlocked: 0,
      soundEnabled: true,
      voiceoverEnabled: true,
      hapticEnabled: true,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      totalPlayTime: 0,
    };

    this.players.set(id, player);
    this.currentPlayerId = id;

    playSound('welcome_chime');
    triggerHaptic('success');

    return player;
  }

  getCurrentPlayer(): PlayerProfile | null {
    if (!this.currentPlayerId) return null;
    return this.players.get(this.currentPlayerId) || null;
  }

  addExperience(amount: number): void {
    const player = this.getCurrentPlayer();
    if (!player) return;

    player.experience += amount;

    // Level up check
    const expForNextLevel = player.level * 100;
    while (player.experience >= expForNextLevel) {
      player.experience -= expForNextLevel;
      player.level++;
      player.maxHealthPoints += 10;
      player.healthPoints = player.maxHealthPoints;

      playSound('level_up');
      triggerHaptic('success');
    }
  }

  // Pet System
  adoptPet(name: string, type: PetType): VirtualPet {
    const id = `pet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const pet: VirtualPet = {
      id,
      name,
      type,
      sprite: `pet_${type}`,
      happiness: 80,
      energy: 100,
      health: 100,
      abilities: this.getPetAbilities(type),
      accessories: [],
      color: '#FFFFFF',
      lastFed: Date.now(),
      lastPlayed: Date.now(),
      lastPetted: Date.now(),
      bondLevel: 10,
      totalInteractions: 0,
    };

    this.pets.set(id, pet);

    // Assign to current player
    const player = this.getCurrentPlayer();
    if (player) {
      player.pet = pet;
    }

    playSound('pet_adopted');
    triggerHaptic('success');

    // Unlock achievement
    this.checkAchievement('ach_pet_parent', 1);

    return pet;
  }

  private getPetAbilities(type: PetType): string[] {
    const abilities: Record<PetType, string[]> = {
      dog: ['fetch', 'guard', 'comfort'],
      cat: ['purr', 'hunt', 'nap'],
      bird: ['sing', 'fly', 'mimic'],
      rabbit: ['hop', 'dig', 'cuddle'],
      fish: ['swim', 'bubble', 'glow'],
      robot: ['scan', 'remind', 'calculate'],
      dragon: ['fly', 'breathe_fire', 'protect'],
      unicorn: ['heal', 'teleport', 'sparkle'],
    };

    return abilities[type] || [];
  }

  feedPet(petId: string): boolean {
    const pet = this.pets.get(petId);
    if (!pet) return false;

    pet.happiness = Math.min(100, pet.happiness + 15);
    pet.energy = Math.min(100, pet.energy + 20);
    pet.lastFed = Date.now();
    pet.totalInteractions++;
    pet.bondLevel = Math.min(100, pet.bondLevel + 2);

    playSound('pet_happy');
    triggerHaptic('light');

    return true;
  }

  playWithPet(petId: string): boolean {
    const pet = this.pets.get(petId);
    if (!pet || pet.energy < 10) return false;

    pet.happiness = Math.min(100, pet.happiness + 20);
    pet.energy = Math.max(0, pet.energy - 15);
    pet.lastPlayed = Date.now();
    pet.totalInteractions++;
    pet.bondLevel = Math.min(100, pet.bondLevel + 3);

    playSound('pet_play');
    triggerHaptic('medium');

    return true;
  }

  petThePet(petId: string): boolean {
    const pet = this.pets.get(petId);
    if (!pet) return false;

    pet.happiness = Math.min(100, pet.happiness + 10);
    pet.lastPetted = Date.now();
    pet.totalInteractions++;
    pet.bondLevel = Math.min(100, pet.bondLevel + 1);

    playSound('pet_purr');
    triggerHaptic('light');

    return true;
  }

  // Map Navigation
  moveToLocation(locationId: string): MapLocation | null {
    const location = this.mapLocations.get(locationId);
    if (!location || !location.isUnlocked) return null;

    // Check if connected to current location
    if (this.currentLocationId) {
      const currentLoc = this.mapLocations.get(this.currentLocationId);
      if (currentLoc && !currentLoc.connectedZones.includes(location.zone)) {
        return null; // Can't move to disconnected zone
      }
    }

    this.currentLocationId = locationId;
    location.isVisited = true;

    playSound('footsteps');
    triggerHaptic('light');

    // Update quest objectives
    this.updateQuestObjective('visit', locationId);

    // Check explorer achievement
    const visitedCount = Array.from(this.mapLocations.values()).filter(l => l.isVisited).length;
    this.checkAchievement('ach_explorer', visitedCount);

    return location;
  }

  getCurrentLocation(): MapLocation | null {
    if (!this.currentLocationId) return null;
    return this.mapLocations.get(this.currentLocationId) || null;
  }

  getMap(): MapLocation[] {
    return Array.from(this.mapLocations.values());
  }

  unlockLocation(locationId: string): boolean {
    const location = this.mapLocations.get(locationId);
    if (!location) return false;

    location.isUnlocked = true;
    playSound('unlock');
    triggerHaptic('medium');

    return true;
  }

  // NPC Interaction
  talkToNPC(npcId: string): NPC | null {
    let npc: NPC | null = null;

    for (const location of this.mapLocations.values()) {
      const found = location.npcs.find(n => n.id === npcId);
      if (found) {
        npc = found;
        break;
      }
    }

    if (!npc || !npc.isAvailable) return null;

    playSound('dialogue_start');
    triggerHaptic('light');

    // Update quest objectives
    this.updateQuestObjective('talk', npcId);

    // Check social achievement
    this.checkAchievement('ach_social_butterfly', 1);

    return npc;
  }

  // Quest System
  startQuest(questId: string): Quest | null {
    const quest = this.quests.get(questId);
    if (!quest || quest.status !== 'available') return null;

    quest.status = 'active';
    quest.startedAt = Date.now();

    playSound('quest_start');
    triggerHaptic('medium');

    return quest;
  }

  private updateQuestObjective(type: string, target: string): void {
    for (const quest of this.quests.values()) {
      if (quest.status !== 'active') continue;

      for (const obj of quest.objectives) {
        if (obj.type === type && obj.target === target && !obj.isCompleted) {
          obj.currentCount++;
          if (obj.currentCount >= obj.requiredCount) {
            obj.isCompleted = true;
            playSound('objective_complete');
          }
        }
      }

      // Update quest progress
      const completedCount = quest.objectives.filter(o => o.isCompleted).length;
      quest.progress = Math.round((completedCount / quest.objectives.length) * 100);

      // Check if quest is complete
      if (quest.objectives.every(o => o.isCompleted)) {
        this.completeQuest(quest.id);
      }
    }
  }

  private completeQuest(questId: string): void {
    const quest = this.quests.get(questId);
    if (!quest) return;

    quest.status = 'completed';
    quest.completedAt = Date.now();

    // Award rewards
    this.addExperience(quest.experienceReward);

    const player = this.getCurrentPlayer();
    if (player) {
      player.healthPoints = Math.min(player.maxHealthPoints, player.healthPoints + quest.healthReward);
      player.questsCompleted++;
    }

    playSound('quest_complete');
    triggerHaptic('success');

    // Check quest achievement
    if (player) {
      this.checkAchievement('ach_quest_champion', player.questsCompleted);
    }
  }

  getActiveQuests(): Quest[] {
    return Array.from(this.quests.values()).filter(q => q.status === 'active');
  }

  getAvailableQuests(): Quest[] {
    return Array.from(this.quests.values()).filter(q => q.status === 'available');
  }

  // Achievement System
  private checkAchievement(achievementId: string, progress: number): void {
    const achievement = this.achievements.get(achievementId);
    if (!achievement || achievement.isUnlocked) return;

    achievement.progress = Math.max(achievement.progress, progress);

    if (achievement.progress >= achievement.threshold) {
      achievement.isUnlocked = true;
      achievement.unlockedAt = Date.now();

      this.addExperience(achievement.experienceReward);

      const player = this.getCurrentPlayer();
      if (player) {
        player.achievementsUnlocked++;
      }

      playSound('achievement_unlock');
      triggerHaptic('success');
    }
  }

  getAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  getUnlockedAchievements(): Achievement[] {
    return Array.from(this.achievements.values()).filter(a => a.isUnlocked);
  }

  // AI Assistant
  async askAI(message: string): Promise<string> {
    const assistant = this.aiAssistants.get('ai_wachs_helper');
    if (!assistant) return 'AI assistant is not available.';

    // Add user message to history
    assistant.conversationHistory.push({
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: Date.now(),
    });

    // Simulate AI response based on keywords
    let response = 'I\'m here to help! Could you please tell me more about what you need?';

    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('appointment')) {
      response = 'I can help you with appointments! Would you like to book a new appointment, check your upcoming appointments, or reschedule an existing one?';
    } else if (lowerMessage.includes('medication')) {
      response = 'For medication queries, you can visit the Pharmacy zone. Would you like me to guide you there, or do you have questions about your current medications?';
    } else if (lowerMessage.includes('emergency')) {
      response = 'If this is a medical emergency, please call 000 immediately. For non-urgent concerns, I can help you navigate to the Emergency Department.';
    } else if (lowerMessage.includes('help')) {
      response = 'I can help you with: booking appointments, medication reminders, navigating the hospital, answering health questions, and more. What would you like to do?';
    }

    // Add AI response to history
    assistant.conversationHistory.push({
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: response,
      timestamp: Date.now(),
    });

    assistant.lastInteraction = Date.now();

    playSound('ai_response');

    return response;
  }

  getAIConversationHistory(): AIMessage[] {
    const assistant = this.aiAssistants.get('ai_wachs_helper');
    return assistant?.conversationHistory || [];
  }

  // Analytics
  getAnalytics(): GameAnalytics {
    const players = Array.from(this.players.values());
    const activePlayers = players.filter(p => Date.now() - p.lastActiveAt < 7 * 24 * 60 * 60 * 1000);
    
    const questsCompleted = players.reduce((sum, p) => sum + p.questsCompleted, 0);
    const totalQuests = Array.from(this.quests.values()).length * players.length;

    const playersWithPets = players.filter(p => p.pet);

    // Find most popular zone
    const zoneVisits: Record<MapZone, number> = {} as Record<MapZone, number>;
    this.mapLocations.forEach(loc => {
      if (loc.isVisited) {
        zoneVisits[loc.zone] = (zoneVisits[loc.zone] || 0) + 1;
      }
    });
    const mostPopularZone = Object.entries(zoneVisits)
      .sort(([,a], [,b]) => b - a)[0]?.[0] as MapZone || 'reception';

    return {
      totalPlayers: players.length,
      activePlayers: activePlayers.length,
      averageLevel: players.length > 0 
        ? players.reduce((sum, p) => sum + p.level, 0) / players.length 
        : 0,
      questCompletionRate: totalQuests > 0 ? questsCompleted / totalQuests : 0,
      medicationAdherenceRate: players.length > 0
        ? players.reduce((sum, p) => sum + p.medicationAdherence, 0) / players.length / 100
        : 0,
      petAdoptionRate: players.length > 0 ? playersWithPets.length / players.length : 0,
      mostPopularZone,
      averageSessionDuration: players.length > 0
        ? players.reduce((sum, p) => sum + p.totalPlayTime, 0) / players.length
        : 0,
    };
  }

  // Reset
  reset(): void {
    this.players.clear();
    this.pets.clear();
    this.currentPlayerId = null;
    this.currentLocationId = null;
    this.initializeMap();
    this.initializeAchievements();
    this.initializeDefaultQuests();
  }
}

export const patientPortalGamingEngineService = new PatientPortalGamingEngineService();
