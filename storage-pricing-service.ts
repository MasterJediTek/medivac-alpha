/**
 * Storage Tier Pricing Service
 * Cost tracking for different retention tiers to help administrators optimize storage budgets
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  PRICING_CONFIG: 'medivac_storage_pricing',
  USAGE_DATA: 'medivac_storage_usage',
  BUDGETS: 'medivac_storage_budgets',
  ALERTS: 'medivac_storage_alerts',
};

export type StorageTier = 'standard' | 'important' | 'critical' | 'permanent' | 'archive';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface TierPricing {
  tier: StorageTier;
  name: string;
  description: string;
  pricePerGBMonth: number;
  minRetentionDays: number;
  maxRetentionDays: number | null;
  features: string[];
  isDefault: boolean;
}

export interface StorageUsage {
  id: string;
  departmentId: string;
  departmentName: string;
  tier: StorageTier;
  usageGB: number;
  recordingCount: number;
  averageRecordingSize: number;
  oldestRecording: string;
  newestRecording: string;
  lastUpdated: string;
}

export interface DepartmentBudget {
  id: string;
  departmentId: string;
  departmentName: string;
  monthlyBudget: number;
  yearlyBudget: number;
  currentMonthSpend: number;
  currentYearSpend: number;
  alertThreshold: number;
  criticalThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface CostRecord {
  id: string;
  departmentId: string;
  departmentName: string;
  tier: StorageTier;
  period: string;
  usageGB: number;
  cost: number;
  recordingCount: number;
  createdAt: string;
}

export interface CostForecast {
  departmentId: string;
  departmentName: string;
  currentMonthProjected: number;
  nextMonthProjected: number;
  next3MonthsProjected: number;
  yearEndProjected: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  trendPercent: number;
  recommendations: CostRecommendation[];
}

export interface CostRecommendation {
  id: string;
  type: 'archive' | 'delete' | 'downgrade' | 'optimize';
  title: string;
  description: string;
  potentialSavings: number;
  affectedRecordings: number;
  priority: 'low' | 'medium' | 'high';
  implementationSteps: string[];
}

export interface BudgetAlert {
  id: string;
  departmentId: string;
  departmentName: string;
  type: 'threshold' | 'critical' | 'overage' | 'forecast';
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  currentValue: number;
  thresholdValue: number;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
}

export interface TierUpgradeDowngrade {
  fromTier: StorageTier;
  toTier: StorageTier;
  recordingCount: number;
  currentCost: number;
  newCost: number;
  costDifference: number;
  effectiveDate: string;
}

export interface StorageAnalytics {
  totalStorageGB: number;
  totalMonthlyCost: number;
  averageCostPerGB: number;
  storageByTier: { tier: StorageTier; usageGB: number; cost: number; percentage: number }[];
  costByDepartment: { departmentId: string; departmentName: string; cost: number; percentage: number }[];
  monthlyTrend: { month: string; cost: number; usageGB: number }[];
  topCostDrivers: { departmentId: string; departmentName: string; tier: StorageTier; cost: number }[];
  savingsOpportunities: number;
}

export interface CostReport {
  id: string;
  title: string;
  period: { from: string; to: string };
  generatedAt: string;
  generatedBy: string;
  totalCost: number;
  departmentBreakdown: { departmentId: string; departmentName: string; cost: number }[];
  tierBreakdown: { tier: StorageTier; cost: number }[];
  recommendations: CostRecommendation[];
  format: 'json' | 'csv' | 'pdf';
}

class StoragePricingService {
  private tierPricing: Map<StorageTier, TierPricing> = new Map();
  private storageUsage: Map<string, StorageUsage[]> = new Map();
  private departmentBudgets: Map<string, DepartmentBudget> = new Map();
  private costHistory: CostRecord[] = [];
  private alerts: BudgetAlert[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize tier pricing
    const defaultPricing: TierPricing[] = [
      {
        tier: 'standard',
        name: 'Standard Storage',
        description: 'Default storage tier for regular recordings',
        pricePerGBMonth: 0.023,
        minRetentionDays: 30,
        maxRetentionDays: 90,
        features: ['Basic access', 'Standard retrieval', 'Auto-archive after 90 days'],
        isDefault: true,
      },
      {
        tier: 'important',
        name: 'Important Storage',
        description: 'Extended retention for important recordings',
        pricePerGBMonth: 0.045,
        minRetentionDays: 90,
        maxRetentionDays: 365,
        features: ['Priority access', 'Fast retrieval', 'Compliance ready'],
        isDefault: false,
      },
      {
        tier: 'critical',
        name: 'Critical Storage',
        description: 'Long-term retention for critical recordings',
        pricePerGBMonth: 0.087,
        minRetentionDays: 365,
        maxRetentionDays: 2555,
        features: ['Instant access', 'Redundant storage', 'Legal hold support', 'Audit trail'],
        isDefault: false,
      },
      {
        tier: 'permanent',
        name: 'Permanent Storage',
        description: 'Indefinite retention for permanent records',
        pricePerGBMonth: 0.125,
        minRetentionDays: 2555,
        maxRetentionDays: null,
        features: ['Guaranteed preservation', 'Multi-region backup', 'Immutable storage', 'Full compliance'],
        isDefault: false,
      },
      {
        tier: 'archive',
        name: 'Archive Storage',
        description: 'Low-cost cold storage for archived recordings',
        pricePerGBMonth: 0.004,
        minRetentionDays: 90,
        maxRetentionDays: null,
        features: ['Lowest cost', 'Delayed retrieval (4-12 hours)', 'Bulk operations'],
        isDefault: false,
      },
    ];

    for (const pricing of defaultPricing) {
      this.tierPricing.set(pricing.tier, pricing);
    }

    // Load persisted data
    try {
      const [usageData, budgetData, alertData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USAGE_DATA),
        AsyncStorage.getItem(STORAGE_KEYS.BUDGETS),
        AsyncStorage.getItem(STORAGE_KEYS.ALERTS),
      ]);

      if (usageData) {
        const parsed = JSON.parse(usageData);
        for (const [deptId, usage] of Object.entries(parsed)) {
          this.storageUsage.set(deptId, usage as StorageUsage[]);
        }
      }

      if (budgetData) {
        const parsed = JSON.parse(budgetData);
        for (const budget of parsed) {
          this.departmentBudgets.set(budget.departmentId, budget);
        }
      }

      if (alertData) {
        this.alerts = JSON.parse(alertData);
      }
    } catch (error) {
      console.error('Failed to load storage pricing data:', error);
    }

    // Create sample data if empty
    if (this.storageUsage.size === 0) {
      await this.createSampleData();
    }

    this.initialized = true;
  }

  private async createSampleData(): Promise<void> {
    const departments = [
      { id: 'dept_emergency', name: 'Emergency Department' },
      { id: 'dept_training', name: 'Training Division' },
      { id: 'dept_security', name: 'Security Operations' },
      { id: 'dept_admin', name: 'Administration' },
    ];

    const tiers: StorageTier[] = ['standard', 'important', 'critical', 'permanent', 'archive'];

    for (const dept of departments) {
      const usageList: StorageUsage[] = [];

      for (const tier of tiers) {
        const usage: StorageUsage = {
          id: `usage_${dept.id}_${tier}`,
          departmentId: dept.id,
          departmentName: dept.name,
          tier,
          usageGB: Math.random() * 100 + 10,
          recordingCount: Math.floor(Math.random() * 500) + 50,
          averageRecordingSize: Math.random() * 0.5 + 0.1,
          oldestRecording: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          newestRecording: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        };
        usageList.push(usage);
      }

      this.storageUsage.set(dept.id, usageList);

      // Create budget
      const monthlyBudget = Math.floor(Math.random() * 500) + 200;
      const budget: DepartmentBudget = {
        id: `budget_${dept.id}`,
        departmentId: dept.id,
        departmentName: dept.name,
        monthlyBudget,
        yearlyBudget: monthlyBudget * 12,
        currentMonthSpend: monthlyBudget * (0.5 + Math.random() * 0.4),
        currentYearSpend: monthlyBudget * (6 + Math.random() * 4),
        alertThreshold: 80,
        criticalThreshold: 95,
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.departmentBudgets.set(dept.id, budget);
    }

    // Generate cost history
    for (let i = 0; i < 6; i++) {
      const month = new Date();
      month.setMonth(month.getMonth() - i);
      const period = month.toISOString().substring(0, 7);

      for (const dept of departments) {
        for (const tier of tiers) {
          const pricing = this.tierPricing.get(tier)!;
          const usageGB = Math.random() * 100 + 10;
          const record: CostRecord = {
            id: `cost_${dept.id}_${tier}_${period}`,
            departmentId: dept.id,
            departmentName: dept.name,
            tier,
            period,
            usageGB,
            cost: usageGB * pricing.pricePerGBMonth,
            recordingCount: Math.floor(Math.random() * 500) + 50,
            createdAt: new Date().toISOString(),
          };
          this.costHistory.push(record);
        }
      }
    }

    await this.saveData();
  }

  private async saveData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USAGE_DATA, JSON.stringify(Object.fromEntries(this.storageUsage))),
        AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(Array.from(this.departmentBudgets.values()))),
        AsyncStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(this.alerts)),
      ]);
    } catch (error) {
      console.error('Failed to save storage pricing data:', error);
    }
  }

  // Tier Pricing
  getTierPricing(tier: StorageTier): TierPricing | null {
    return this.tierPricing.get(tier) || null;
  }

  getAllTierPricing(): TierPricing[] {
    return Array.from(this.tierPricing.values());
  }

  async updateTierPricing(tier: StorageTier, pricePerGBMonth: number): Promise<TierPricing | null> {
    const pricing = this.tierPricing.get(tier);
    if (!pricing) return null;

    pricing.pricePerGBMonth = pricePerGBMonth;
    return pricing;
  }

  // Usage Tracking
  getDepartmentUsage(departmentId: string): StorageUsage[] {
    return this.storageUsage.get(departmentId) || [];
  }

  getAllUsage(): StorageUsage[] {
    const allUsage: StorageUsage[] = [];
    for (const [, usageList] of this.storageUsage) {
      allUsage.push(...usageList);
    }
    return allUsage;
  }

  getTierUsage(tier: StorageTier): StorageUsage[] {
    const tierUsage: StorageUsage[] = [];
    for (const [, usageList] of this.storageUsage) {
      tierUsage.push(...usageList.filter(u => u.tier === tier));
    }
    return tierUsage;
  }

  // Cost Calculations
  calculateMonthlyCost(departmentId: string): number {
    const usageList = this.storageUsage.get(departmentId) || [];
    let totalCost = 0;

    for (const usage of usageList) {
      const pricing = this.tierPricing.get(usage.tier);
      if (pricing) {
        totalCost += usage.usageGB * pricing.pricePerGBMonth;
      }
    }

    return totalCost;
  }

  calculateTotalMonthlyCost(): number {
    let totalCost = 0;
    for (const [departmentId] of this.storageUsage) {
      totalCost += this.calculateMonthlyCost(departmentId);
    }
    return totalCost;
  }

  calculateTierUpgradeDowngradeCost(
    departmentId: string,
    fromTier: StorageTier,
    toTier: StorageTier,
    recordingCount: number
  ): TierUpgradeDowngrade | null {
    const usageList = this.storageUsage.get(departmentId);
    if (!usageList) return null;

    const fromUsage = usageList.find(u => u.tier === fromTier);
    if (!fromUsage) return null;

    const fromPricing = this.tierPricing.get(fromTier);
    const toPricing = this.tierPricing.get(toTier);
    if (!fromPricing || !toPricing) return null;

    const estimatedGB = (fromUsage.usageGB / fromUsage.recordingCount) * recordingCount;
    const currentCost = estimatedGB * fromPricing.pricePerGBMonth;
    const newCost = estimatedGB * toPricing.pricePerGBMonth;

    return {
      fromTier,
      toTier,
      recordingCount,
      currentCost,
      newCost,
      costDifference: newCost - currentCost,
      effectiveDate: new Date().toISOString(),
    };
  }

  // Budget Management
  getDepartmentBudget(departmentId: string): DepartmentBudget | null {
    return this.departmentBudgets.get(departmentId) || null;
  }

  getAllBudgets(): DepartmentBudget[] {
    return Array.from(this.departmentBudgets.values());
  }

  async setBudget(
    departmentId: string,
    departmentName: string,
    monthlyBudget: number,
    alertThreshold: number = 80,
    criticalThreshold: number = 95
  ): Promise<DepartmentBudget> {
    const existing = this.departmentBudgets.get(departmentId);
    
    const budget: DepartmentBudget = {
      id: existing?.id || `budget_${departmentId}`,
      departmentId,
      departmentName,
      monthlyBudget,
      yearlyBudget: monthlyBudget * 12,
      currentMonthSpend: existing?.currentMonthSpend || 0,
      currentYearSpend: existing?.currentYearSpend || 0,
      alertThreshold,
      criticalThreshold,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.departmentBudgets.set(departmentId, budget);
    await this.saveData();
    return budget;
  }

  checkBudgetStatus(departmentId: string): { status: 'ok' | 'warning' | 'critical' | 'overage'; percentage: number } {
    const budget = this.departmentBudgets.get(departmentId);
    if (!budget) return { status: 'ok', percentage: 0 };

    const percentage = (budget.currentMonthSpend / budget.monthlyBudget) * 100;

    if (percentage >= 100) return { status: 'overage', percentage };
    if (percentage >= budget.criticalThreshold) return { status: 'critical', percentage };
    if (percentage >= budget.alertThreshold) return { status: 'warning', percentage };
    return { status: 'ok', percentage };
  }

  // Forecasting
  getForecast(departmentId: string): CostForecast {
    const usageList = this.storageUsage.get(departmentId) || [];
    const budget = this.departmentBudgets.get(departmentId);
    const deptName = budget?.departmentName || 'Unknown Department';

    // Calculate current month projected cost
    const currentMonthCost = this.calculateMonthlyCost(departmentId);
    const dayOfMonth = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const currentMonthProjected = (currentMonthCost / dayOfMonth) * daysInMonth;

    // Estimate growth trend from history
    const deptHistory = this.costHistory.filter(c => c.departmentId === departmentId);
    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    let trendPercent = 0;

    if (deptHistory.length >= 2) {
      const recentCosts = deptHistory.slice(-3).reduce((sum, c) => sum + c.cost, 0);
      const olderCosts = deptHistory.slice(-6, -3).reduce((sum, c) => sum + c.cost, 0);
      
      if (olderCosts > 0) {
        trendPercent = ((recentCosts - olderCosts) / olderCosts) * 100;
        if (trendPercent > 5) trend = 'increasing';
        else if (trendPercent < -5) trend = 'decreasing';
      }
    }

    const growthFactor = 1 + (trendPercent / 100);
    const nextMonthProjected = currentMonthProjected * growthFactor;
    const next3MonthsProjected = currentMonthProjected * (1 + growthFactor + Math.pow(growthFactor, 2));
    const monthsRemaining = 12 - new Date().getMonth();
    const yearEndProjected = (budget?.currentYearSpend || 0) + (currentMonthProjected * monthsRemaining);

    // Generate recommendations
    const recommendations: CostRecommendation[] = [];

    // Check for archive opportunities
    const standardUsage = usageList.find(u => u.tier === 'standard');
    if (standardUsage && standardUsage.usageGB > 50) {
      const archivePricing = this.tierPricing.get('archive')!;
      const standardPricing = this.tierPricing.get('standard')!;
      const potentialSavings = standardUsage.usageGB * 0.3 * (standardPricing.pricePerGBMonth - archivePricing.pricePerGBMonth);
      
      recommendations.push({
        id: 'rec_archive_old',
        type: 'archive',
        title: 'Archive Old Recordings',
        description: 'Move recordings older than 60 days to archive storage',
        potentialSavings,
        affectedRecordings: Math.floor(standardUsage.recordingCount * 0.3),
        priority: potentialSavings > 50 ? 'high' : 'medium',
        implementationSteps: [
          'Review recordings older than 60 days',
          'Verify no active references',
          'Initiate archive migration',
          'Update retention policies',
        ],
      });
    }

    // Check for deletion opportunities
    const archiveUsage = usageList.find(u => u.tier === 'archive');
    if (archiveUsage && archiveUsage.usageGB > 100) {
      const archivePricing = this.tierPricing.get('archive')!;
      const potentialSavings = archiveUsage.usageGB * 0.2 * archivePricing.pricePerGBMonth;
      
      recommendations.push({
        id: 'rec_delete_expired',
        type: 'delete',
        title: 'Delete Expired Archives',
        description: 'Remove archived recordings past retention period',
        potentialSavings,
        affectedRecordings: Math.floor(archiveUsage.recordingCount * 0.2),
        priority: 'low',
        implementationSteps: [
          'Run retention policy audit',
          'Identify expired recordings',
          'Obtain deletion approval',
          'Execute permanent deletion',
        ],
      });
    }

    return {
      departmentId,
      departmentName: deptName,
      currentMonthProjected,
      nextMonthProjected,
      next3MonthsProjected,
      yearEndProjected,
      trend,
      trendPercent,
      recommendations,
    };
  }

  // Alerts
  getAlerts(options: { departmentId?: string; status?: AlertStatus; severity?: AlertSeverity } = {}): BudgetAlert[] {
    let alerts = [...this.alerts];

    if (options.departmentId) {
      alerts = alerts.filter(a => a.departmentId === options.departmentId);
    }
    if (options.status) {
      alerts = alerts.filter(a => a.status === options.status);
    }
    if (options.severity) {
      alerts = alerts.filter(a => a.severity === options.severity);
    }

    return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createAlert(
    departmentId: string,
    departmentName: string,
    type: BudgetAlert['type'],
    severity: AlertSeverity,
    title: string,
    message: string,
    currentValue: number,
    thresholdValue: number
  ): Promise<BudgetAlert> {
    const alert: BudgetAlert = {
      id: `alert_${Date.now()}`,
      departmentId,
      departmentName,
      type,
      severity,
      status: 'active',
      title,
      message,
      currentValue,
      thresholdValue,
      createdAt: new Date().toISOString(),
    };

    this.alerts.push(alert);
    await this.saveData();
    return alert;
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<BudgetAlert | null> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return null;

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date().toISOString();
    alert.acknowledgedBy = acknowledgedBy;
    await this.saveData();
    return alert;
  }

  async resolveAlert(alertId: string): Promise<BudgetAlert | null> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return null;

    alert.status = 'resolved';
    alert.resolvedAt = new Date().toISOString();
    await this.saveData();
    return alert;
  }

  // Analytics
  getAnalytics(): StorageAnalytics {
    const allUsage = this.getAllUsage();
    const totalStorageGB = allUsage.reduce((sum, u) => sum + u.usageGB, 0);
    const totalMonthlyCost = this.calculateTotalMonthlyCost();

    // Storage by tier
    const storageByTier: StorageAnalytics['storageByTier'] = [];
    for (const [tier, pricing] of this.tierPricing) {
      const tierUsage = allUsage.filter(u => u.tier === tier);
      const usageGB = tierUsage.reduce((sum, u) => sum + u.usageGB, 0);
      const cost = usageGB * pricing.pricePerGBMonth;
      storageByTier.push({
        tier,
        usageGB,
        cost,
        percentage: totalStorageGB > 0 ? (usageGB / totalStorageGB) * 100 : 0,
      });
    }

    // Cost by department
    const costByDepartment: StorageAnalytics['costByDepartment'] = [];
    for (const [departmentId, usageList] of this.storageUsage) {
      const deptCost = this.calculateMonthlyCost(departmentId);
      const deptName = usageList[0]?.departmentName || 'Unknown';
      costByDepartment.push({
        departmentId,
        departmentName: deptName,
        cost: deptCost,
        percentage: totalMonthlyCost > 0 ? (deptCost / totalMonthlyCost) * 100 : 0,
      });
    }
    costByDepartment.sort((a, b) => b.cost - a.cost);

    // Monthly trend from history
    const monthlyTrend: StorageAnalytics['monthlyTrend'] = [];
    const monthMap = new Map<string, { cost: number; usageGB: number }>();
    for (const record of this.costHistory) {
      const existing = monthMap.get(record.period) || { cost: 0, usageGB: 0 };
      existing.cost += record.cost;
      existing.usageGB += record.usageGB;
      monthMap.set(record.period, existing);
    }
    for (const [month, data] of monthMap) {
      monthlyTrend.push({ month, ...data });
    }
    monthlyTrend.sort((a, b) => a.month.localeCompare(b.month));

    // Top cost drivers
    const topCostDrivers: StorageAnalytics['topCostDrivers'] = [];
    for (const usage of allUsage) {
      const pricing = this.tierPricing.get(usage.tier);
      if (pricing) {
        topCostDrivers.push({
          departmentId: usage.departmentId,
          departmentName: usage.departmentName,
          tier: usage.tier,
          cost: usage.usageGB * pricing.pricePerGBMonth,
        });
      }
    }
    topCostDrivers.sort((a, b) => b.cost - a.cost);

    // Calculate savings opportunities
    let savingsOpportunities = 0;
    for (const [departmentId] of this.storageUsage) {
      const forecast = this.getForecast(departmentId);
      savingsOpportunities += forecast.recommendations.reduce((sum, r) => sum + r.potentialSavings, 0);
    }

    return {
      totalStorageGB,
      totalMonthlyCost,
      averageCostPerGB: totalStorageGB > 0 ? totalMonthlyCost / totalStorageGB : 0,
      storageByTier,
      costByDepartment,
      monthlyTrend,
      topCostDrivers: topCostDrivers.slice(0, 10),
      savingsOpportunities,
    };
  }

  // Reports
  async generateReport(
    title: string,
    periodFrom: string,
    periodTo: string,
    generatedBy: string,
    format: 'json' | 'csv' | 'pdf' = 'json'
  ): Promise<CostReport> {
    const analytics = this.getAnalytics();
    const allRecommendations: CostRecommendation[] = [];

    for (const [departmentId] of this.storageUsage) {
      const forecast = this.getForecast(departmentId);
      allRecommendations.push(...forecast.recommendations);
    }

    const report: CostReport = {
      id: `report_${Date.now()}`,
      title,
      period: { from: periodFrom, to: periodTo },
      generatedAt: new Date().toISOString(),
      generatedBy,
      totalCost: analytics.totalMonthlyCost,
      departmentBreakdown: analytics.costByDepartment.map(d => ({
        departmentId: d.departmentId,
        departmentName: d.departmentName,
        cost: d.cost,
      })),
      tierBreakdown: analytics.storageByTier.map(t => ({
        tier: t.tier,
        cost: t.cost,
      })),
      recommendations: allRecommendations,
      format,
    };

    return report;
  }

  async exportReport(report: CostReport): Promise<string> {
    if (report.format === 'json') {
      return JSON.stringify(report, null, 2);
    } else if (report.format === 'csv') {
      const lines: string[] = [
        'Storage Tier Pricing Report',
        `Period: ${report.period.from} to ${report.period.to}`,
        `Generated: ${report.generatedAt}`,
        `Total Cost: $${report.totalCost.toFixed(2)}`,
        '',
        'Department Breakdown',
        'Department,Cost',
        ...report.departmentBreakdown.map(d => `${d.departmentName},$${d.cost.toFixed(2)}`),
        '',
        'Tier Breakdown',
        'Tier,Cost',
        ...report.tierBreakdown.map(t => `${t.tier},$${t.cost.toFixed(2)}`),
      ];
      return lines.join('\n');
    }
    return '';
  }
}

export const storagePricingService = new StoragePricingService();
