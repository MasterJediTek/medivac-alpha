 * Pet System Service
 * Manages companion pets with equipment slots including Tricorder
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@medivac_pets';

export type PetSpecies = 'tribble' | 'sehlat' | 'targ' | 'spot' | 'porthos' | 'mugato' | 'horta' | 'phoenix';
export type PetRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type PetMood = 'happy' | 'content' | 'neutral' | 'hungry' | 'tired' | 'sick';

export interface PetStats {
  health: number;
  happiness: number;
  energy: number;
  loyalty: number;
  level: number;
  experience: number;
  scanAssist: number;      // Bonus to tricorder scans
  dataCollection: number;  // Passive data gathering
}

export interface PetEquipment {
  tricorderId?: string;
  collarId?: string;
  badgeId?: string;
}

export interface PetAbility {
  id: string;
  name: string;
  description: string;
  unlockLevel: number;
}

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  species: PetSpecies;
  rarity: PetRarity;
  mood: PetMood;
  stats: PetStats;
  equipment: PetEquipment;
  abilities: PetAbility[];
  adoptedAt: string;
  lastFed: string;
  lastPlayed: string;
  totalScansAssisted: number;
  bondLevel: number;
  customColor?: string;
}

export interface PetTemplate {
  species: PetSpecies;
  rarity: PetRarity;
  name: string;
  description: string;
  baseStats: Omit<PetStats, 'level' | 'experience'>;
  abilities: PetAbility[];
  adoptionFee: number;
  iconEmoji: string;
  color: string;
}

export const PET_TEMPLATES: PetTemplate[] = [
  {
    species: 'tribble',
    rarity: 'common',
    name: 'Tribble',
    description: 'A small, furry creature that purrs when content. Known for rapid reproduction.',
    baseStats: {
      health: 80,
      happiness: 90,
      energy: 70,
      loyalty: 60,
      scanAssist: 5,
      dataCollection: 10,