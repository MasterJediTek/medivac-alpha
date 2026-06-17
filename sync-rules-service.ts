 * OneDrive Selective Sync Rules Service
 * Configure automatic sync rules based on file type, folder, or modification date
 * MediVac One v6.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  RULES: 'medivac_sync_rules',
  HISTORY: 'medivac_sync_rule_history',
};

// Types
export type RuleType = 'file_type' | 'folder' | 'date' | 'size' | 'name_pattern';
export type RuleAction = 'include' | 'exclude';
export type RuleStatus = 'active' | 'paused' | 'disabled';
export type DateOperator = 'newer_than' | 'older_than' | 'between';
export type SizeOperator = 'larger_than' | 'smaller_than' | 'between';

export interface SyncRule {
  id: string;
  name: string;
  description?: string;
  type: RuleType;
  action: RuleAction;
  status: RuleStatus;
  priority: number; // lower = higher priority
  conditions: RuleCondition;
  stats: RuleStats;
  createdAt: string;
  updatedAt: string;
  lastTriggered?: string;
}

export interface RuleCondition {
  // File type conditions
  fileTypes?: string[]; // e.g., ['pdf', 'docx', 'xlsx']
  
  // Folder conditions
  folders?: string[]; // e.g., ['/Compliance', '/Policies']
  includeSubfolders?: boolean;
  
  // Date conditions
  dateOperator?: DateOperator;
  dateValue?: string; // ISO date
  dateEndValue?: string; // for 'between'
  dateField?: 'created' | 'modified';
  
  // Size conditions
  sizeOperator?: SizeOperator;
  sizeValue?: number; // bytes
  sizeEndValue?: number; // for 'between'
  
  // Name pattern conditions
  namePattern?: string; // regex pattern
  caseSensitive?: boolean;
}

export interface RuleStats {
  matchedFiles: number;
  syncedFiles: number;
  excludedFiles: number;
  totalSize: number; // bytes
  lastRun?: string;
}

export interface RuleTestResult {
  ruleId: string;
  matchedFiles: TestFile[];
  totalMatched: number;
  estimatedSize: number;
}

export interface TestFile {
  name: string;
  path: string;
  size: number;
  type: string;