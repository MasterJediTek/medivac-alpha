// Patient Onboarding Tutorial Service for MediVac WACHS v9.6
// Interactive first-time user walkthrough with full effects

// Sound effects
const SOUNDS = {
  TUTORIAL_START: 'tutorial_start',
  STEP_COMPLETE: 'step_complete',
  STEP_SKIP: 'step_skip',
  ACHIEVEMENT_UNLOCK: 'achievement_unlock',
  TUTORIAL_COMPLETE: 'tutorial_complete',
  HOTSPOT_TAP: 'hotspot_tap',
  TOOLTIP_SHOW: 'tooltip_show',
  PROGRESS_MILESTONE: 'progress_milestone',
  VOICEOVER_START: 'voiceover_start',
  CELEBRATION: 'celebration',
  REWARD_EARNED: 'reward_earned',
  NAVIGATION: 'navigation',
};

// Haptic patterns
const HAPTICS = {
  STEP_START: 'light',
  STEP_COMPLETE: 'success',
  ACHIEVEMENT: 'heavy',
  SKIP: 'warning',
  TAP: 'selection',
  MILESTONE: 'medium',
};

function playSound(sound: string): void {
  console.log(`Playing: ${sound}`);
}

function triggerHaptic(type: string): void {
  console.log(`Haptic: ${type}`);
}

// Types
export type UserRole = 'patient' | 'carer' | 'family' | 'visitor' | 'staff';
export type TutorialStatus = 'not_started' | 'in_progress' | 'paused' | 'completed' | 'skipped';
export type StepType = 'intro' | 'feature' | 'action' | 'quiz' | 'celebration' | 'summary';
export type AnimationType = 'fade' | 'slide' | 'zoom' | 'bounce' | 'pulse' | 'glow' | 'shake' | 'confetti';

export interface TutorialStep {
  id: string;
  order: number;
  title: string;
  description: string;
  type: StepType;
  targetElement?: string;
  hotspot?: {
    x: number;
    y: number;
    radius: number;
    pulseColor: string;
  };
  tooltip?: {
    text: string;
    position: 'top' | 'bottom' | 'left' | 'right';
    arrow: boolean;
  };
  voiceover?: {
    text: string;
    voice: string;
    language: string;
    duration: number;
  };
  animation: {
    type: AnimationType;
    duration: number;
    delay: number;
    easing: string;
  };
  action?: {
    type: 'tap' | 'swipe' | 'scroll' | 'input' | 'navigate';
    target: string;
    validation?: string;
  };
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  };
  reward?: {
    type: 'points' | 'badge' | 'unlock';
    value: number | string;
    message: string;
  };
  duration: number;
  skippable: boolean;
  requiredForCompletion: boolean;
  completedAt?: number;
}

export interface TutorialPath {
  id: string;
  name: string;
  description: string;
  targetRole: UserRole;
  steps: TutorialStep[];
  totalSteps: number;
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  rewards: TutorialReward[];
  createdAt: number;
}

export interface TutorialProgress {
  id: string;
  pathId: string;
  userId: string;
  userRole: UserRole;
  status: TutorialStatus;
  currentStepIndex: number;
  completedSteps: string[];
  skippedSteps: string[];
  startedAt: number;
  lastActiveAt: number;
  completedAt?: number;
  totalTimeSpent: number;
  stepTimes: Record<string, number>;
  quizScores: Record<string, boolean>;
  earnedRewards: string[];
  resumePoint?: {
    stepId: string;
    timestamp: number;
  };
}

export interface TutorialReward {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'badge' | 'points' | 'unlock' | 'achievement';
  value: number | string;
  condition: {
    type: 'complete_steps' | 'complete_path' | 'quiz_score' | 'time_bonus' | 'no_skips';
    threshold: number;
  };
  animation: AnimationType;
  sound: string;
  unlockedAt?: number;
}

export interface TutorialAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  condition: string;
  progress: number;
  maxProgress: number;
  unlockedAt?: number;
  celebrationAnimation: AnimationType;
}

export interface TutorialAnalytics {
  totalUsers: number;
  completionRate: number;
  averageCompletionTime: number;
  mostSkippedSteps: string[];
  averageQuizScore: number;
  popularPaths: string[];
  dropOffPoints: string[];
  rewardDistribution: Record<string, number>;
}

// Default tutorial paths
const DEFAULT_PATHS: Omit<TutorialPath, 'id' | 'createdAt'>[] = [
  {
    name: 'Patient Welcome Journey',
    description: 'Complete introduction to MediVac WACHS for new patients',
    targetRole: 'patient',
    steps: [],
    totalSteps: 12,
    estimatedDuration: 600000, // 10 minutes
    difficulty: 'beginner',
    prerequisites: [],
    rewards: [],
  },
  {
    name: 'Carer Quick Start',
    description: 'Essential features for carers supporting patients',
    targetRole: 'carer',
    steps: [],
    totalSteps: 8,
    estimatedDuration: 480000, // 8 minutes
    difficulty: 'beginner',
    prerequisites: [],
    rewards: [],
  },
  {
    name: 'Family Member Guide',
    description: 'How to stay connected with your loved one\'s health journey',
    targetRole: 'family',
    steps: [],
    totalSteps: 6,
    estimatedDuration: 360000, // 6 minutes
    difficulty: 'beginner',
    prerequisites: [],
    rewards: [],
  },
  {
    name: 'Advanced Health Directive Tutorial',
    description: 'Step-by-step guide to completing your AHD',
    targetRole: 'patient',
    steps: [],
    totalSteps: 15,
    estimatedDuration: 900000, // 15 minutes
    difficulty: 'intermediate',
    prerequisites: ['Patient Welcome Journey'],
    rewards: [],
  },
  {
    name: 'Medication Management Mastery',
    description: 'Learn to track and manage medications effectively',
    targetRole: 'patient',
    steps: [],
    totalSteps: 10,
    estimatedDuration: 600000, // 10 minutes
    difficulty: 'intermediate',
    prerequisites: ['Patient Welcome Journey'],
    rewards: [],
  },
];

// Default achievements
const DEFAULT_ACHIEVEMENTS: Omit<TutorialAchievement, 'id'>[] = [
  {
    name: 'First Steps',
    description: 'Complete your first tutorial step',
    icon: '👣',
    rarity: 'common',
    condition: 'complete_1_step',
    progress: 0,
    maxProgress: 1,
    celebrationAnimation: 'bounce',
  },
  {
    name: 'Quick Learner',
    description: 'Complete 5 tutorial steps',
    icon: '📚',
    rarity: 'common',
    condition: 'complete_5_steps',
    progress: 0,
    maxProgress: 5,
    celebrationAnimation: 'pulse',
  },
  {
    name: 'Tutorial Champion',
    description: 'Complete an entire tutorial path',
    icon: '🏆',
    rarity: 'uncommon',
    condition: 'complete_path',
    progress: 0,
    maxProgress: 1,
    celebrationAnimation: 'confetti',
  },
  {
    name: 'Perfect Score',
    description: 'Answer all quiz questions correctly',
    icon: '💯',
    rarity: 'rare',
    condition: 'perfect_quiz',
    progress: 0,
    maxProgress: 1,
    celebrationAnimation: 'glow',
  },
  {
    name: 'Speed Runner',
    description: 'Complete a tutorial in under 5 minutes',
    icon: '⚡',
    rarity: 'rare',
    condition: 'speed_complete',
    progress: 0,
    maxProgress: 1,
    celebrationAnimation: 'zoom',
  },
  {
    name: 'Dedicated Student',
    description: 'Complete all tutorial paths',
    icon: '🎓',
    rarity: 'epic',
    condition: 'complete_all_paths',
    progress: 0,
    maxProgress: 5,
    celebrationAnimation: 'confetti',
  },
  {
    name: 'No Skip Master',
    description: 'Complete a tutorial without skipping any steps',
    icon: '🌟',
    rarity: 'epic',
    condition: 'no_skips',
    progress: 0,
    maxProgress: 1,
    celebrationAnimation: 'glow',
  },
  {
    name: 'WACHS Expert',
    description: 'Unlock all achievements',
    icon: '👑',
    rarity: 'legendary',
    condition: 'all_achievements',
    progress: 0,
    maxProgress: 7,
    celebrationAnimation: 'confetti',
  },
];

class PatientOnboardingTutorialService {
  private paths: Map<string, TutorialPath> = new Map();
  private progress: Map<string, TutorialProgress> = new Map();
  private achievements: Map<string, TutorialAchievement> = new Map();
  private userAchievements: Map<string, Set<string>> = new Map();
  private currentProgressId: string | null = null;

  constructor() {
    this.initializeDefaultPaths();
    this.initializeDefaultAchievements();
  }

  private initializeDefaultPaths(): void {
    DEFAULT_PATHS.forEach((path, index) => {
      const id = `path_${index + 1}`;
      const fullPath: TutorialPath = {
        ...path,
        id,
        steps: this.generateStepsForPath(path.name, path.targetRole, path.totalSteps),
        rewards: this.generateRewardsForPath(path.name),
        createdAt: Date.now(),
      };
      this.paths.set(id, fullPath);
    });
  }

  private generateStepsForPath(pathName: string, role: UserRole, count: number): TutorialStep[] {
    const steps: TutorialStep[] = [];
    const stepTemplates = this.getStepTemplatesForRole(role);

    for (let i = 0; i < count; i++) {
      const template = stepTemplates[i % stepTemplates.length];
      steps.push({
        id: `step_${Date.now()}_${i}`,
        order: i + 1,
        title: template.title,
        description: template.description,
        type: i === 0 ? 'intro' : i === count - 1 ? 'celebration' : template.type,
        hotspot: template.hotspot,
        tooltip: {
          text: template.description,
          position: 'bottom',
          arrow: true,
        },
        voiceover: {
          text: template.description,
          voice: 'professional-female',
          language: 'en-AU',
          duration: 5000,
        },
        animation: {
          type: this.getAnimationForStepType(template.type),
          duration: 500,
          delay: 200,
          easing: 'ease-out',
        },
        duration: 10000,
        skippable: i > 0 && i < count - 1,
        requiredForCompletion: template.type !== 'celebration',
      });
    }

    return steps;
  }

  private getStepTemplatesForRole(role: UserRole): Array<{
    title: string;
    description: string;
    type: StepType;
    hotspot?: TutorialStep['hotspot'];
  }> {
    const commonSteps = [
      { title: 'Welcome to MediVac WACHS', description: 'Your personal health companion for Western Australia', type: 'intro' as StepType },
      { title: 'Dashboard Overview', description: 'See your health summary at a glance', type: 'feature' as StepType },
      { title: 'Navigation Menu', description: 'Access all features from here', type: 'action' as StepType },
    ];

    const roleSpecificSteps: Record<UserRole, Array<{ title: string; description: string; type: StepType }>> = {
      patient: [
        { title: 'Your Health Profile', description: 'View and update your personal health information', type: 'feature' },
        { title: 'Appointments', description: 'Book and manage your medical appointments', type: 'feature' },
        { title: 'Medications', description: 'Track your medications and set reminders', type: 'feature' },
        { title: 'Advanced Health Directive', description: 'Create your legally binding health wishes', type: 'feature' },
        { title: 'Telehealth', description: 'Connect with doctors via video consultation', type: 'feature' },
        { title: 'Health Records', description: 'Access your medical history securely', type: 'feature' },
        { title: 'Emergency Contacts', description: 'Set up your emergency contact list', type: 'action' },
        { title: 'Pet Companion', description: 'Meet your virtual health buddy', type: 'feature' },
        { title: 'Congratulations!', description: 'You\'re ready to use MediVac WACHS', type: 'celebration' },
      ],
      carer: [
        { title: 'Patient Overview', description: 'Monitor your patient\'s health status', type: 'feature' },
        { title: 'Care Tasks', description: 'Manage daily care activities', type: 'feature' },
        { title: 'Medication Administration', description: 'Record medication given to patients', type: 'action' },
        { title: 'Communication', description: 'Message healthcare providers', type: 'feature' },
        { title: 'All Set!', description: 'You\'re ready to provide excellent care', type: 'celebration' },
      ],
      family: [
        { title: 'Family Dashboard', description: 'Stay updated on your loved one\'s health', type: 'feature' },
        { title: 'Appointment Alerts', description: 'Get notified about upcoming appointments', type: 'feature' },
        { title: 'Messaging', description: 'Communicate with the care team', type: 'feature' },
        { title: 'Connected!', description: 'You\'re now connected to your family member', type: 'celebration' },
      ],
      visitor: [
        { title: 'Visitor Check-in', description: 'Register your visit', type: 'action' },
        { title: 'Facility Map', description: 'Find your way around', type: 'feature' },
        { title: 'Welcome!', description: 'Enjoy your visit', type: 'celebration' },
      ],
      staff: [
        { title: 'Staff Dashboard', description: 'Your clinical workspace', type: 'feature' },
        { title: 'Patient Management', description: 'Access patient records', type: 'feature' },
        { title: 'Scheduling', description: 'Manage appointments and shifts', type: 'feature' },
        { title: 'Ready to Work!', description: 'You\'re all set up', type: 'celebration' },
      ],
    };

    return [...commonSteps, ...roleSpecificSteps[role]];
  }

  private getAnimationForStepType(type: StepType): AnimationType {
    const animations: Record<StepType, AnimationType> = {
      intro: 'fade',
      feature: 'slide',
      action: 'pulse',
      quiz: 'bounce',
      celebration: 'confetti',
      summary: 'zoom',
    };
    return animations[type];
  }

  private generateRewardsForPath(pathName: string): TutorialReward[] {
    return [
      {
        id: `reward_${Date.now()}_1`,
        name: `${pathName} Starter`,
        description: 'Started the tutorial',
        icon: '🌱',
        type: 'badge',
        value: 'starter_badge',
        condition: { type: 'complete_steps', threshold: 1 },
        animation: 'bounce',
        sound: SOUNDS.REWARD_EARNED,
      },
      {
        id: `reward_${Date.now()}_2`,
        name: `${pathName} Graduate`,
        description: 'Completed the tutorial',
        icon: '🎓',
        type: 'badge',
        value: 'graduate_badge',
        condition: { type: 'complete_path', threshold: 100 },
        animation: 'confetti',
        sound: SOUNDS.CELEBRATION,
      },
      {
        id: `reward_${Date.now()}_3`,
        name: 'Bonus Points',
        description: 'Earned completion points',
        icon: '⭐',
        type: 'points',
        value: 100,
        condition: { type: 'complete_path', threshold: 100 },
        animation: 'glow',
        sound: SOUNDS.ACHIEVEMENT_UNLOCK,
      },
    ];
  }

  private initializeDefaultAchievements(): void {
    DEFAULT_ACHIEVEMENTS.forEach((achievement, index) => {
      const id = `achievement_${index + 1}`;
      this.achievements.set(id, { ...achievement, id });
    });
  }

  // Tutorial Management
  startTutorial(
    userId: string,
    pathId: string,
    userRole: UserRole
  ): TutorialProgress | null {
    const path = this.paths.get(pathId);
    if (!path) return null;

    // Check prerequisites
    const userProgress = Array.from(this.progress.values()).filter(p => p.userId === userId);
    for (const prereq of path.prerequisites) {
      const prereqPath = Array.from(this.paths.values()).find(p => p.name === prereq);
      if (prereqPath) {
        const completed = userProgress.find(p => p.pathId === prereqPath.id && p.status === 'completed');
        if (!completed) {
          console.log(`Prerequisite not met: ${prereq}`);
          return null;
        }
      }
    }

    const id = `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const progress: TutorialProgress = {
      id,
      pathId,
      userId,
      userRole,
      status: 'in_progress',
      currentStepIndex: 0,
      completedSteps: [],
      skippedSteps: [],
      startedAt: now,
      lastActiveAt: now,
      totalTimeSpent: 0,
      stepTimes: {},
      quizScores: {},
      earnedRewards: [],
    };

    this.progress.set(id, progress);
    this.currentProgressId = id;

    playSound(SOUNDS.TUTORIAL_START);
    triggerHaptic(HAPTICS.STEP_START);

    // Check for first step achievement
    this.checkAchievements(userId);

    return progress;
  }

  completeStep(progressId: string): TutorialProgress | null {
    const progress = this.progress.get(progressId);
    if (!progress) return null;

    const path = this.paths.get(progress.pathId);
    if (!path) return null;

    const currentStep = path.steps[progress.currentStepIndex];
    if (!currentStep) return null;

    const now = Date.now();
    const stepTime = now - progress.lastActiveAt;

    // Mark step as completed
    progress.completedSteps.push(currentStep.id);
    progress.stepTimes[currentStep.id] = stepTime;
    progress.totalTimeSpent += stepTime;
    progress.lastActiveAt = now;
    currentStep.completedAt = now;

    playSound(SOUNDS.STEP_COMPLETE);
    triggerHaptic(HAPTICS.STEP_COMPLETE);

    // Check for step rewards
    if (currentStep.reward) {
      progress.earnedRewards.push(currentStep.reward.value.toString());
      playSound(SOUNDS.REWARD_EARNED);
    }

    // Move to next step or complete tutorial
    if (progress.currentStepIndex < path.steps.length - 1) {
      progress.currentStepIndex++;
      
      // Check for milestone
      if (progress.completedSteps.length % 5 === 0) {
        playSound(SOUNDS.PROGRESS_MILESTONE);
        triggerHaptic(HAPTICS.MILESTONE);
      }
    } else {
      progress.status = 'completed';
      progress.completedAt = now;
      playSound(SOUNDS.TUTORIAL_COMPLETE);
      playSound(SOUNDS.CELEBRATION);
      triggerHaptic(HAPTICS.ACHIEVEMENT);
    }

    // Check achievements
    this.checkAchievements(progress.userId);

    return progress;
  }

  skipStep(progressId: string): TutorialProgress | null {
    const progress = this.progress.get(progressId);
    if (!progress) return null;

    const path = this.paths.get(progress.pathId);
    if (!path) return null;

    const currentStep = path.steps[progress.currentStepIndex];
    if (!currentStep || !currentStep.skippable) return null;

    progress.skippedSteps.push(currentStep.id);
    progress.lastActiveAt = Date.now();

    playSound(SOUNDS.STEP_SKIP);
    triggerHaptic(HAPTICS.SKIP);

    // Move to next step
    if (progress.currentStepIndex < path.steps.length - 1) {
      progress.currentStepIndex++;
    }

    return progress;
  }

  pauseTutorial(progressId: string): TutorialProgress | null {
    const progress = this.progress.get(progressId);
    if (!progress) return null;

    const path = this.paths.get(progress.pathId);
    if (!path) return null;

    const currentStep = path.steps[progress.currentStepIndex];

    progress.status = 'paused';
    progress.lastActiveAt = Date.now();
    progress.resumePoint = {
      stepId: currentStep?.id || '',
      timestamp: Date.now(),
    };

    return progress;
  }

  resumeTutorial(progressId: string): TutorialProgress | null {
    const progress = this.progress.get(progressId);
    if (!progress || progress.status !== 'paused') return null;

    progress.status = 'in_progress';
    progress.lastActiveAt = Date.now();

    playSound(SOUNDS.TUTORIAL_START);
    triggerHaptic(HAPTICS.STEP_START);

    return progress;
  }

  answerQuiz(progressId: string, stepId: string, answer: number): { correct: boolean; explanation: string } | null {
    const progress = this.progress.get(progressId);
    if (!progress) return null;

    const path = this.paths.get(progress.pathId);
    if (!path) return null;

    const step = path.steps.find(s => s.id === stepId);
    if (!step || !step.quiz) return null;

    const correct = answer === step.quiz.correctAnswer;
    progress.quizScores[stepId] = correct;

    if (correct) {
      playSound(SOUNDS.STEP_COMPLETE);
      triggerHaptic(HAPTICS.STEP_COMPLETE);
    } else {
      triggerHaptic(HAPTICS.SKIP);
    }

    return {
      correct,
      explanation: step.quiz.explanation,
    };
  }

  // Achievement Management
  private checkAchievements(userId: string): void {
    const userProgress = Array.from(this.progress.values()).filter(p => p.userId === userId);
    const userAchievementSet = this.userAchievements.get(userId) || new Set();

    const totalCompletedSteps = userProgress.reduce((sum, p) => sum + p.completedSteps.length, 0);
    const completedPaths = userProgress.filter(p => p.status === 'completed').length;
    const noSkipPaths = userProgress.filter(p => p.status === 'completed' && p.skippedSteps.length === 0).length;

    this.achievements.forEach((achievement, id) => {
      if (userAchievementSet.has(id)) return;

      let unlocked = false;

      switch (achievement.condition) {
        case 'complete_1_step':
          unlocked = totalCompletedSteps >= 1;
          break;
        case 'complete_5_steps':
          unlocked = totalCompletedSteps >= 5;
          break;
        case 'complete_path':
          unlocked = completedPaths >= 1;
          break;
        case 'complete_all_paths':
          unlocked = completedPaths >= 5;
          break;
        case 'no_skips':
          unlocked = noSkipPaths >= 1;
          break;
        case 'perfect_quiz':
          unlocked = userProgress.some(p => {
            const scores = Object.values(p.quizScores);
            return scores.length > 0 && scores.every(s => s);
          });
          break;
        case 'speed_complete':
          unlocked = userProgress.some(p => p.status === 'completed' && p.totalTimeSpent < 300000);
          break;
        case 'all_achievements':
          unlocked = userAchievementSet.size >= 7;
          break;
      }

      if (unlocked) {
        achievement.unlockedAt = Date.now();
        achievement.progress = achievement.maxProgress;
        userAchievementSet.add(id);
        
        playSound(SOUNDS.ACHIEVEMENT_UNLOCK);
        triggerHaptic(HAPTICS.ACHIEVEMENT);
      }
    });

    this.userAchievements.set(userId, userAchievementSet);
  }

  // Getters
  getPath(pathId: string): TutorialPath | null {
    return this.paths.get(pathId) || null;
  }

  getAllPaths(): TutorialPath[] {
    return Array.from(this.paths.values());
  }

  getPathsForRole(role: UserRole): TutorialPath[] {
    return Array.from(this.paths.values()).filter(p => p.targetRole === role);
  }

  getProgress(progressId: string): TutorialProgress | null {
    return this.progress.get(progressId) || null;
  }

  getCurrentProgress(): TutorialProgress | null {
    return this.currentProgressId ? this.progress.get(this.currentProgressId) || null : null;
  }

  getUserProgress(userId: string): TutorialProgress[] {
    return Array.from(this.progress.values()).filter(p => p.userId === userId);
  }

  getCurrentStep(progressId: string): TutorialStep | null {
    const progress = this.progress.get(progressId);
    if (!progress) return null;

    const path = this.paths.get(progress.pathId);
    if (!path) return null;

    return path.steps[progress.currentStepIndex] || null;
  }

  getAchievements(): TutorialAchievement[] {
    return Array.from(this.achievements.values());
  }

  getUserAchievements(userId: string): TutorialAchievement[] {
    const userSet = this.userAchievements.get(userId) || new Set();
    return Array.from(this.achievements.values()).filter(a => userSet.has(a.id));
  }

  getAnalytics(): TutorialAnalytics {
    const allProgress = Array.from(this.progress.values());
    const completedProgress = allProgress.filter(p => p.status === 'completed');
    const uniqueUsers = new Set(allProgress.map(p => p.userId)).size;

    // Calculate most skipped steps
    const skipCounts: Record<string, number> = {};
    allProgress.forEach(p => {
      p.skippedSteps.forEach(stepId => {
        skipCounts[stepId] = (skipCounts[stepId] || 0) + 1;
      });
    });
    const mostSkippedSteps = Object.entries(skipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([stepId]) => stepId);

    // Calculate drop-off points
    const dropOffCounts: Record<string, number> = {};
    allProgress.filter(p => p.status === 'paused' || p.status === 'in_progress').forEach(p => {
      const path = this.paths.get(p.pathId);
      if (path && path.steps[p.currentStepIndex]) {
        const stepId = path.steps[p.currentStepIndex].id;
        dropOffCounts[stepId] = (dropOffCounts[stepId] || 0) + 1;
      }
    });
    const dropOffPoints = Object.entries(dropOffCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([stepId]) => stepId);

    // Calculate average quiz score
    let totalQuizzes = 0;
    let correctQuizzes = 0;
    allProgress.forEach(p => {
      Object.values(p.quizScores).forEach(score => {
        totalQuizzes++;
        if (score) correctQuizzes++;
      });
    });

    // Calculate popular paths
    const pathCounts: Record<string, number> = {};
    allProgress.forEach(p => {
      pathCounts[p.pathId] = (pathCounts[p.pathId] || 0) + 1;
    });
    const popularPaths = Object.entries(pathCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([pathId]) => pathId);

    // Calculate reward distribution
    const rewardCounts: Record<string, number> = {};
    allProgress.forEach(p => {
      p.earnedRewards.forEach(reward => {
        rewardCounts[reward] = (rewardCounts[reward] || 0) + 1;
      });
    });

    return {
      totalUsers: uniqueUsers,
      completionRate: allProgress.length > 0 ? (completedProgress.length / allProgress.length) * 100 : 0,
      averageCompletionTime: completedProgress.length > 0
        ? completedProgress.reduce((sum, p) => sum + p.totalTimeSpent, 0) / completedProgress.length
        : 0,
      mostSkippedSteps,
      averageQuizScore: totalQuizzes > 0 ? (correctQuizzes / totalQuizzes) * 100 : 0,
      popularPaths,
      dropOffPoints,
      rewardDistribution: rewardCounts,
    };
  }

  // Reset
  reset(): void {
    this.progress.clear();
    this.userAchievements.clear();
    this.currentProgressId = null;
    this.initializeDefaultPaths();
    this.initializeDefaultAchievements();
  }
}

export const patientOnboardingTutorialService = new PatientOnboardingTutorialService();
