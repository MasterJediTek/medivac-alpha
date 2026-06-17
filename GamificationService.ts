/**
 * Staff Gamification Leaderboard Service
 * Achievements, points, badges, and disco-themed rewards
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES & INTERFACES
// ============================================

export type BadgeCategory = 'clinical' | 'teamwork' | 'efficiency' | 'learning' | 'leadership' | 'innovation' | 'special';
export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ChallengeType = 'daily' | 'weekly' | 'monthly' | 'special';

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar: string;
  level: number;
  xp: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  badges: string[];
  joinedAt: number;
  lastActiveAt: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  pointsRequired: number;
  criteria: string;
  discoColor: string;
}

export interface Achievement {
  id: string;
  staffId: string;
  badgeId: string;
  earnedAt: number;
  celebrationShown: boolean;
}

export interface Challenge {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  icon: string;
  targetValue: number;
  currentValue: number;
  xpReward: number;
  pointsReward: number;
  startDate: number;
  endDate: number;
  participants: string[];
  completedBy: string[];
}

export interface LeaderboardEntry {
  rank: number;
  staffId: string;
  name: string;
  role: string;
  avatar: string;
  level: number;
  points: number;
  streak: number;
  badgeCount: number;
  trend: 'up' | 'down' | 'same';
  trendAmount: number;
}

export interface TeamCompetition {
  id: string;
  name: string;
  teams: { id: string; name: string; color: string; points: number; members: string[] }[];
  startDate: number;
  endDate: number;
  prize: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  icon: string;
  pointsCost: number;
  category: 'time_off' | 'recognition' | 'gift' | 'experience';
  available: boolean;
}

// ============================================
// STORAGE & STATE
// ============================================

const STORAGE_KEYS = {
  STAFF: 'gamification_staff',
  ACHIEVEMENTS: 'gamification_achievements',
  CHALLENGES: 'gamification_challenges',
};

let staff: Map<string, StaffMember> = new Map();
let achievements: Map<string, Achievement> = new Map();
let challenges: Map<string, Challenge> = new Map();
let listeners: Set<() => void> = new Set();

const generateId = (): string => `GAM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const notifyListeners = (): void => listeners.forEach(l => l());

// ============================================
// BADGES DATABASE
// ============================================

export const BADGES: Badge[] = [
  // Clinical Excellence
  { id: 'badge_first_patient', name: 'First Steps', description: 'Complete your first patient assessment', icon: '👶', category: 'clinical', rarity: 'common', pointsRequired: 10, criteria: 'Complete 1 patient assessment', discoColor: '#39FF14' },
  { id: 'badge_100_patients', name: 'Century Club', description: 'Assess 100 patients', icon: '💯', category: 'clinical', rarity: 'rare', pointsRequired: 1000, criteria: 'Complete 100 patient assessments', discoColor: '#00FFFF' },
  { id: 'badge_lifesaver', name: 'Lifesaver', description: 'Respond to 10 code blue events', icon: '❤️‍🔥', category: 'clinical', rarity: 'epic', pointsRequired: 2500, criteria: 'Respond to 10 code blue events', discoColor: '#FF1493' },
  { id: 'badge_master_healer', name: 'Master Healer', description: 'Achieve 99% patient satisfaction', icon: '🏆', category: 'clinical', rarity: 'legendary', pointsRequired: 10000, criteria: '99% patient satisfaction rating', discoColor: '#FFD700' },
  
  // Teamwork
  { id: 'badge_team_player', name: 'Team Player', description: 'Assist 25 colleagues', icon: '🤝', category: 'teamwork', rarity: 'common', pointsRequired: 50, criteria: 'Assist 25 colleagues', discoColor: '#39FF14' },
  { id: 'badge_mentor', name: 'Mentor', description: 'Train 5 new staff members', icon: '🎓', category: 'teamwork', rarity: 'uncommon', pointsRequired: 250, criteria: 'Train 5 new staff members', discoColor: '#FFFF00' },
  { id: 'badge_shift_hero', name: 'Shift Hero', description: 'Cover 20 emergency shifts', icon: '🦸', category: 'teamwork', rarity: 'rare', pointsRequired: 1500, criteria: 'Cover 20 emergency shifts', discoColor: '#BF00FF' },
  
  // Efficiency
  { id: 'badge_speed_demon', name: 'Speed Demon', description: 'Complete tasks 50% faster than average', icon: '⚡', category: 'efficiency', rarity: 'uncommon', pointsRequired: 200, criteria: '50% faster task completion', discoColor: '#FFFF00' },
  { id: 'badge_documentation_pro', name: 'Documentation Pro', description: 'Complete 500 notes on time', icon: '📝', category: 'efficiency', rarity: 'rare', pointsRequired: 1000, criteria: '500 on-time notes', discoColor: '#00FFFF' },
  { id: 'badge_zero_waste', name: 'Zero Waste', description: 'No medication errors for 6 months', icon: '🎯', category: 'efficiency', rarity: 'epic', pointsRequired: 3000, criteria: '6 months error-free', discoColor: '#FF1493' },
  
  // Learning
  { id: 'badge_bookworm', name: 'Bookworm', description: 'Complete 10 training modules', icon: '📚', category: 'learning', rarity: 'common', pointsRequired: 100, criteria: 'Complete 10 training modules', discoColor: '#39FF14' },
  { id: 'badge_certified', name: 'Certified Expert', description: 'Earn 5 certifications', icon: '🏅', category: 'learning', rarity: 'rare', pointsRequired: 2000, criteria: 'Earn 5 certifications', discoColor: '#00FFFF' },
  
  // Leadership
  { id: 'badge_rising_star', name: 'Rising Star', description: 'Lead your first team project', icon: '⭐', category: 'leadership', rarity: 'uncommon', pointsRequired: 300, criteria: 'Lead 1 team project', discoColor: '#FFFF00' },
  { id: 'badge_commander', name: 'JEDI Commander', description: 'Achieve Level 50', icon: '🌟', category: 'leadership', rarity: 'legendary', pointsRequired: 15000, criteria: 'Reach Level 50', discoColor: '#FFD700' },
  
  // Special
  { id: 'badge_disco_dancer', name: 'Disco Dancer', description: 'Log in during disco hour (11 PM)', icon: '🕺', category: 'special', rarity: 'rare', pointsRequired: 0, criteria: 'Login at 11 PM', discoColor: '#FF1493' },
  { id: 'badge_night_owl', name: 'Night Owl', description: 'Complete 50 night shifts', icon: '🦉', category: 'special', rarity: 'epic', pointsRequired: 2000, criteria: '50 night shifts', discoColor: '#BF00FF' },
  { id: 'badge_jedi_master', name: 'JEDI Master', description: 'Unlock all other badges', icon: '🔮', category: 'special', rarity: 'legendary', pointsRequired: 50000, criteria: 'Collect all badges', discoColor: '#FFD700' },
];

// ============================================
// LEVEL SYSTEM
// ============================================

const XP_PER_LEVEL = 1000;
const LEVEL_MULTIPLIER = 1.2;

export const calculateLevel = (xp: number): number => {
  let level = 1;
  let xpRequired = XP_PER_LEVEL;
  let totalXp = 0;
  
  while (totalXp + xpRequired <= xp) {
    totalXp += xpRequired;
    level++;
    xpRequired = Math.floor(XP_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, level - 1));
  }
  
  return level;
};

export const getXpForNextLevel = (currentLevel: number): number => {
  return Math.floor(XP_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, currentLevel - 1));
};

export const getXpProgress = (xp: number): { current: number; required: number; percentage: number } => {
  let level = 1;
  let xpRequired = XP_PER_LEVEL;
  let totalXp = 0;
  
  while (totalXp + xpRequired <= xp) {
    totalXp += xpRequired;
    level++;
    xpRequired = Math.floor(XP_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, level - 1));
  }
  
  const currentLevelXp = xp - totalXp;
  return {
    current: currentLevelXp,
    required: xpRequired,
    percentage: (currentLevelXp / xpRequired) * 100,
  };
};

// ============================================
// INITIALIZATION
// ============================================

export const initializeGamification = async (): Promise<void> => {
  try {
    const storedStaff = await AsyncStorage.getItem(STORAGE_KEYS.STAFF);
    if (storedStaff) {
      staff = new Map(Object.entries(JSON.parse(storedStaff)));
    }
    
    // Initialize with sample staff if empty
    if (staff.size === 0) {
      initializeSampleData();
    }
  } catch (error) {
    console.error('Failed to initialize gamification:', error);
    initializeSampleData();
  }
};

const initializeSampleData = () => {
  const sampleStaff: StaffMember[] = [
    { id: 'STAFF-001', name: 'Dr. Sarah Chen', role: 'Physician', department: 'Emergency', avatar: '👩‍⚕️', level: 42, xp: 85000, totalPoints: 12500, currentStreak: 15, longestStreak: 45, badges: ['badge_first_patient', 'badge_100_patients', 'badge_lifesaver', 'badge_mentor'], joinedAt: Date.now() - 365 * 24 * 60 * 60 * 1000, lastActiveAt: Date.now() },
    { id: 'STAFF-002', name: 'Nurse James Wilson', role: 'RN', department: 'ICU', avatar: '👨‍⚕️', level: 38, xp: 72000, totalPoints: 10800, currentStreak: 22, longestStreak: 30, badges: ['badge_first_patient', 'badge_team_player', 'badge_shift_hero', 'badge_night_owl'], joinedAt: Date.now() - 300 * 24 * 60 * 60 * 1000, lastActiveAt: Date.now() },
    { id: 'STAFF-003', name: 'Dr. Emily Rodriguez', role: 'Surgeon', department: 'Surgery', avatar: '👩‍🔬', level: 45, xp: 95000, totalPoints: 15200, currentStreak: 8, longestStreak: 60, badges: ['badge_first_patient', 'badge_master_healer', 'badge_zero_waste', 'badge_commander'], joinedAt: Date.now() - 500 * 24 * 60 * 60 * 1000, lastActiveAt: Date.now() },
    { id: 'STAFF-004', name: 'Tech Mike Johnson', role: 'Lab Tech', department: 'Laboratory', avatar: '🧑‍🔬', level: 25, xp: 45000, totalPoints: 6500, currentStreak: 5, longestStreak: 20, badges: ['badge_first_patient', 'badge_bookworm', 'badge_speed_demon'], joinedAt: Date.now() - 200 * 24 * 60 * 60 * 1000, lastActiveAt: Date.now() },
    { id: 'STAFF-005', name: 'Nurse Lisa Park', role: 'RN', department: 'Pediatrics', avatar: '👩‍⚕️', level: 32, xp: 58000, totalPoints: 8900, currentStreak: 30, longestStreak: 30, badges: ['badge_first_patient', 'badge_team_player', 'badge_mentor', 'badge_certified'], joinedAt: Date.now() - 250 * 24 * 60 * 60 * 1000, lastActiveAt: Date.now() },
  ];
  
  sampleStaff.forEach(s => staff.set(s.id, s));
};

const saveState = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(Object.fromEntries(staff)));
    await AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(Object.fromEntries(achievements)));
  } catch (error) {
    console.error('Failed to save gamification state:', error);
  }
};

export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// ============================================
// LEADERBOARD
// ============================================

export const getLeaderboard = (limit: number = 10): LeaderboardEntry[] => {
  const staffList = Array.from(staff.values())
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, limit);
  
  return staffList.map((s, idx) => ({
    rank: idx + 1,
    staffId: s.id,
    name: s.name,
    role: s.role,
    avatar: s.avatar,
    level: s.level,
    points: s.totalPoints,
    streak: s.currentStreak,
    badgeCount: s.badges.length,
    trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'same',
    trendAmount: Math.floor(Math.random() * 5),
  }));
};

export const getStaffMember = (staffId: string): StaffMember | undefined => {
  return staff.get(staffId);
};

export const getAllStaff = (): StaffMember[] => {
  return Array.from(staff.values());
};

// ============================================
// POINTS & XP
// ============================================

export const awardPoints = async (staffId: string, points: number, xp: number): Promise<StaffMember | undefined> => {
  const member = staff.get(staffId);
  if (!member) return undefined;
  
  member.totalPoints += points;
  member.xp += xp;
  member.level = calculateLevel(member.xp);
  member.lastActiveAt = Date.now();
  
  await saveState();
  notifyListeners();
  return member;
};

export const updateStreak = async (staffId: string): Promise<StaffMember | undefined> => {
  const member = staff.get(staffId);
  if (!member) return undefined;
  
  const lastActive = new Date(member.lastActiveAt);
  const today = new Date();
  const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (24 * 60 * 60 * 1000));
  
  if (daysDiff === 1) {
    member.currentStreak++;
    if (member.currentStreak > member.longestStreak) {
      member.longestStreak = member.currentStreak;
    }
  } else if (daysDiff > 1) {
    member.currentStreak = 1;
  }
  
  member.lastActiveAt = Date.now();
  await saveState();
  notifyListeners();
  return member;
};

// ============================================
// BADGES & ACHIEVEMENTS
// ============================================

export const getBadge = (badgeId: string): Badge | undefined => {
  return BADGES.find(b => b.id === badgeId);
};

export const getStaffBadges = (staffId: string): Badge[] => {
  const member = staff.get(staffId);
  if (!member) return [];
  return member.badges.map(id => BADGES.find(b => b.id === id)).filter(Boolean) as Badge[];
};

export const awardBadge = async (staffId: string, badgeId: string): Promise<Achievement | undefined> => {
  const member = staff.get(staffId);
  const badge = BADGES.find(b => b.id === badgeId);
  if (!member || !badge || member.badges.includes(badgeId)) return undefined;
  
  member.badges.push(badgeId);
  member.totalPoints += badge.pointsRequired;
  
  const achievement: Achievement = {
    id: generateId(),
    staffId,
    badgeId,
    earnedAt: Date.now(),
    celebrationShown: false,
  };
  
  achievements.set(achievement.id, achievement);
  await saveState();
  notifyListeners();
  return achievement;
};

// ============================================
// CHALLENGES
// ============================================

export const getActiveChallenges = (): Challenge[] => {
  const now = Date.now();
  return Array.from(challenges.values())
    .filter(c => c.startDate <= now && c.endDate >= now);
};

export const getDailyChallenges = (): Challenge[] => {
  // Generate sample daily challenges
  return [
    { id: 'daily-1', type: 'daily', title: 'Early Bird', description: 'Complete 5 patient assessments before 10 AM', icon: '🌅', targetValue: 5, currentValue: 3, xpReward: 100, pointsReward: 50, startDate: Date.now(), endDate: Date.now() + 24 * 60 * 60 * 1000, participants: [], completedBy: [] },
    { id: 'daily-2', type: 'daily', title: 'Documentation Master', description: 'Complete all notes within 2 hours', icon: '📝', targetValue: 10, currentValue: 7, xpReward: 150, pointsReward: 75, startDate: Date.now(), endDate: Date.now() + 24 * 60 * 60 * 1000, participants: [], completedBy: [] },
    { id: 'daily-3', type: 'daily', title: 'Team Helper', description: 'Assist 3 colleagues today', icon: '🤝', targetValue: 3, currentValue: 1, xpReward: 80, pointsReward: 40, startDate: Date.now(), endDate: Date.now() + 24 * 60 * 60 * 1000, participants: [], completedBy: [] },
  ];
};

export const getWeeklyChallenges = (): Challenge[] => {
  return [
    { id: 'weekly-1', type: 'weekly', title: 'Marathon Runner', description: 'Complete 50 patient assessments this week', icon: '🏃', targetValue: 50, currentValue: 32, xpReward: 500, pointsReward: 250, startDate: Date.now(), endDate: Date.now() + 7 * 24 * 60 * 60 * 1000, participants: [], completedBy: [] },
    { id: 'weekly-2', type: 'weekly', title: 'Perfect Attendance', description: 'Log in every day this week', icon: '📅', targetValue: 7, currentValue: 5, xpReward: 300, pointsReward: 150, startDate: Date.now(), endDate: Date.now() + 7 * 24 * 60 * 60 * 1000, participants: [], completedBy: [] },
  ];
};

// ============================================
// REWARDS
// ============================================

export const getAvailableRewards = (): Reward[] => {
  return [
    { id: 'reward-1', name: 'Extra Break', description: '15 minutes extra break time', icon: '☕', pointsCost: 500, category: 'time_off', available: true },
    { id: 'reward-2', name: 'Priority Parking', description: 'Reserved parking spot for a week', icon: '🅿️', pointsCost: 1000, category: 'experience', available: true },
    { id: 'reward-3', name: 'Lunch on Us', description: 'Free cafeteria lunch voucher', icon: '🍽️', pointsCost: 750, category: 'gift', available: true },
    { id: 'reward-4', name: 'Wall of Fame', description: 'Featured on the staff wall of fame', icon: '🖼️', pointsCost: 2000, category: 'recognition', available: true },
    { id: 'reward-5', name: 'Half Day Off', description: 'Earn a half day of PTO', icon: '🏖️', pointsCost: 5000, category: 'time_off', available: true },
    { id: 'reward-6', name: 'JEDI Master Title', description: 'Exclusive JEDI Master badge and title', icon: '🔮', pointsCost: 10000, category: 'recognition', available: true },
  ];
};

// ============================================
// RARITY COLORS
// ============================================

export const getRarityColor = (rarity: BadgeRarity): string => {
  switch (rarity) {
    case 'common': return '#39FF14';
    case 'uncommon': return '#FFFF00';
    case 'rare': return '#00FFFF';
    case 'epic': return '#BF00FF';
    case 'legendary': return '#FFD700';
    default: return '#FFFFFF';
  }
};

// ============================================
// EXPORT SERVICE
// ============================================

export const gamificationService = {
  initialize: initializeGamification,
  subscribe,
  getLeaderboard,
  getStaffMember,
  getAllStaff,
  awardPoints,
  updateStreak,
  getBadge,
  getStaffBadges,
  awardBadge,
  getActiveChallenges,
  getDailyChallenges,
  getWeeklyChallenges,
  getAvailableRewards,
  calculateLevel,
  getXpProgress,
  getRarityColor,
  BADGES,
};

export default gamificationService;
