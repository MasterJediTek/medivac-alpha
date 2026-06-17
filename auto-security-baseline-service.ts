 * Auto Security Baseline Service
 * Automatic security scanning and baseline establishment for MediVac One v5.1
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types
// ==========================================

export type SecurityGrade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
export type TrendDirection = 'improving' | 'stable' | 'declining';
export type MonitoringMode = 'passive' | 'active' | 'aggressive';

export interface SecurityBaseline {
  id: string;
  establishedAt: string;
  score: number;
  grade: SecurityGrade;
  vulnerabilityCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  categories: CategoryBaseline[];
  complianceScores: ComplianceBaseline[];
}

export interface CategoryBaseline {
  category: string;
  score: number;
  vulnerabilities: number;
  status: 'secure' | 'at_risk' | 'critical';
}

export interface ComplianceBaseline {
  framework: string;
  score: number;
  controlsAssessed: number;
  controlsCompliant: number;
}

export interface SecuritySnapshot {
  id: string;
  timestamp: string;
  score: number;
  grade: SecurityGrade;
  vulnerabilities: number;
  changeFromBaseline: number;
  changeFromPrevious: number;
  trend: TrendDirection;
}

export interface SecurityTrend {
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  dataPoints: { date: string; score: number }[];
  averageScore: number;
  minScore: number;
  maxScore: number;
  trend: TrendDirection;
  projectedScore: number;
}

export interface RemediationRoadmap {
  id: string;
  generatedAt: string;
  currentScore: number;
  targetScore: number;
  estimatedTimeToTarget: string;
  phases: RemediationPhase[];
  quickWins: QuickWin[];
}

export interface RemediationPhase {
  id: string;
  name: string;
  description: string;
  priority: number;
  estimatedEffort: string;
  scoreImpact: number;
  items: RemediationItem[];
  status: 'pending' | 'in_progress' | 'completed';
}

export interface RemediationItem {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  effort: 'minimal' | 'moderate' | 'significant';
  scoreImpact: number;
  status: 'pending' | 'in_progress' | 'completed' | 'deferred';
  dueDate?: string;
  assignedTo?: string;
}

export interface QuickWin {
  id: string;