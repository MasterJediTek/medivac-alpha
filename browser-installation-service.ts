 * Browser Installation Service
 * MediVac WACHS v9.2
 * 
 * Manages installation of JediTek Browser and WONGI Browser
 * with shared tasks integration
 */

// Types
export type BrowserType = 'jeditek' | 'wongi';
export type InstallationStatus = 'not-installed' | 'downloading' | 'installing' | 'installed' | 'update-available' | 'error';
export type Platform = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'web';

export interface BrowserInfo {
  id: BrowserType;
  name: string;
  fullName: string;
  description: string;
  version: string;
  size: string;
  icon: string;
  color: string;
  features: string[];
  downloadUrl: string;
  webUrl: string;
  platforms: Platform[];
  rating: number;
  downloads: number;
  lastUpdated: number;
}

export interface Installation {
  id: string;
  browser: BrowserType;
  status: InstallationStatus;
  progress: number; // 0-100
  startedAt: number;
  completedAt?: number;
  error?: string;
  platform: Platform;
  version: string;
}

export interface SharedTask {
  id: string;
  name: string;
  description: string;
  browser: BrowserType;
  action: string;
  url?: string;
  data?: Record<string, unknown>;
  createdAt: number;
  completedAt?: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

export interface BrowserFeatureComparison {
  feature: string;
  category: string;
  jeditek: boolean | string;