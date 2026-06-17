 * Avatar System Service
 * Manages user avatars with customization and equipment slots including Tricorder
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@medivac_avatars';

export type AvatarGender = 'male' | 'female' | 'neutral';
export type AvatarSpecies = 'human' | 'vulcan' | 'betazoid' | 'trill' | 'bajoran' | 'android';
export type AvatarRole = 'medical_officer' | 'science_officer' | 'engineer' | 'security' | 'command' | 'civilian';

export interface AvatarAppearance {
  skinTone: string;
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  uniformColor: string;
  accessory?: string;
}

export interface AvatarEquipment {
  tricorderId?: string;
  communicatorId?: string;
  padId?: string;
  medkitId?: string;
}

export interface AvatarStats {
  health: number;
  energy: number;
  experience: number;
  level: number;
  scanBonus: number;
  analysisBonus: number;
}

export interface Avatar {
  id: string;
  userId: string;
  name: string;
  gender: AvatarGender;
  species: AvatarSpecies;
  role: AvatarRole;
  appearance: AvatarAppearance;
  equipment: AvatarEquipment;
  stats: AvatarStats;
  createdAt: string;
  lastActive: string;
  totalMissions: number;
  achievements: string[];
  bio?: string;
}

export interface AvatarCustomization {
  skinTones: string[];
  hairColors: string[];
  hairStyles: string[];
  eyeColors: string[];
  uniformColors: string[];
  accessories: string[];
}

export const AVATAR_CUSTOMIZATION: AvatarCustomization = {
  skinTones: ['#FFDFC4', '#F0C8A0', '#D4A574', '#8D5524', '#5C3317', '#2D1810'],
  hairColors: ['#090806', '#2C222B', '#71635A', '#B7A69E', '#D6C4C2', '#CABFB1', '#DCD0BA', '#977961', '#E6CEA8', '#E5C8A8', '#DEBC99', '#B89778', '#A56B46', '#B55239', '#8D4A43', '#91553D', '#533D32', '#3B3024'],
  hairStyles: ['short', 'medium', 'long', 'bald', 'ponytail', 'bun', 'braided', 'mohawk', 'crew_cut', 'bob'],
  eyeColors: ['#634E34', '#2E536F', '#3D671D', '#497665', '#1C7847', '#7F7F7F', '#0000FF', '#8B4513'],
  uniformColors: ['#1E3A5F', '#8B0000', '#FFD700', '#228B22', '#4B0082', '#2F4F4F'],
  accessories: ['none', 'glasses', 'earring', 'headband', 'visor', 'badge', 'necklace'],
};

export const SPECIES_BONUSES: Record<AvatarSpecies, { scanBonus: number; analysisBonus: number; description: string }> = {
  human: { scanBonus: 5, analysisBonus: 5, description: 'Balanced abilities across all areas' },
  vulcan: { scanBonus: 10, analysisBonus: 15, description: 'Superior logic and analysis capabilities' },
  betazoid: { scanBonus: 15, analysisBonus: 5, description: 'Enhanced empathic scanning abilities' },
  trill: { scanBonus: 8, analysisBonus: 12, description: 'Centuries of accumulated knowledge' },
  bajoran: { scanBonus: 7, analysisBonus: 8, description: 'Strong spiritual intuition' },
  android: { scanBonus: 20, analysisBonus: 20, description: 'Perfect precision and processing' },