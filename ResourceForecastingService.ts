/**
 * Resource Utilization Forecasting Service
 * MediVac One v3.3
 * 
 * Predictive analytics for staffing, equipment, and supply needs
 * based on historical patterns and scheduled procedures.
 */

export type ResourceType = 'staff' | 'equipment' | 'supply' | 'bed';

export type StaffRole = 
  | 'nurse_rn'
  | 'nurse_lpn'
  | 'nurse_aide'
  | 'physician'
  | 'resident'
  | 'respiratory_therapist'
  | 'physical_therapist'
  | 'pharmacist'
  | 'technician'
  | 'unit_clerk';

export type ShiftType = 'day' | 'evening' | 'night';

export interface StaffingRequirement {
  role: StaffRole;
  shiftType: ShiftType;
  requiredCount: number;
  scheduledCount: number;
  variance: number;
  isCritical: boolean;
}

export interface EquipmentForecast {
  equipmentId: string;
  equipmentName: string;
  category: string;
  currentAvailable: number;
  forecastedDemand: number;
  peakDemandTime: Date;
  utilizationRate: number;
  maintenanceDue: Date | null;
  recommendations: string[];
}

export interface SupplyForecast {
  supplyId: string;
  supplyName: string;
  category: string;
  currentStock: number;
  forecastedUsage: number;
  daysUntilReorder: number;
  reorderPoint: number;
  suggestedOrderQuantity: number;
  costPerUnit: number;
  totalCost: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface BedForecast {
  unitId: string;
  unitName: string;
  totalBeds: number;
  currentOccupancy: number;
  forecastedAdmissions: number;
  forecastedDischarges: number;
  projectedOccupancy: number;
  occupancyRate: number;
  peakOccupancyTime: Date;
  recommendations: string[];
}

export interface ScheduledProcedure {
  id: string;
  procedureName: string;
  procedureCode: string;
  scheduledDate: Date;
  estimatedDuration: number; // minutes
  requiredStaff: { role: StaffRole; count: number }[];
  requiredEquipment: string[];
  requiredSupplies: { supplyId: string; quantity: number }[];
  orRoom?: string;
  surgeon?: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
}

export interface DailyForecast {
  date: Date;
  dayOfWeek: string;
  staffingRequirements: StaffingRequirement[];
  equipmentForecasts: EquipmentForecast[];
  supplyForecasts: SupplyForecast[];
  bedForecasts: BedForecast[];
  scheduledProcedures: ScheduledProcedure[];
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  alerts: ForecastAlert[];
}

export interface ForecastAlert {
  id: string;
  type: 'staffing' | 'equipment' | 'supply' | 'capacity';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  resourceId?: string;
  recommendedAction: string;
  createdAt: Date;
}

export interface HistoricalPattern {
  dayOfWeek: number; // 0-6
  hourOfDay: number; // 0-23
  averageAdmissions: number;
  averageDischarges: number;
  averageERVisits: number;
  averageSurgeries: number;
  seasonalFactor: number;
}

export interface ForecastAccuracy {
  metricName: string;
  forecastedValue: number;
  actualValue: number;
  variance: number;
  accuracyPercentage: number;
  date: Date;
}

class ResourceForecastingService {
  private historicalPatterns: Map<string, HistoricalPattern> = new Map();
  private forecasts: Map<string, DailyForecast> = new Map();
  private alerts: ForecastAlert[] = [];

  constructor() {
    this.initializeHistoricalPatterns();
    this.generateForecasts();
  }

  private initializeHistoricalPatterns(): void {
    // Generate patterns for each day and hour
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${day}_${hour}`;
        
        // Simulate realistic patterns
        const isWeekday = day >= 1 && day <= 5;
        const isDaytime = hour >= 7 && hour <= 19;
        const isPeakHours = hour >= 9 && hour <= 17;
        
        let baseAdmissions = isWeekday ? 2.5 : 1.5;
        let baseDischarges = isWeekday ? 3.0 : 1.0;
        let baseERVisits = 4.0;
        let baseSurgeries = isWeekday && isPeakHours ? 2.0 : 0.5;

        // Time-based adjustments
        if (isDaytime) {
          baseAdmissions *= 1.5;
          baseDischarges *= 2.0;
          baseERVisits *= 1.2;
        }

        // Monday surge
        if (day === 1) {
          baseAdmissions *= 1.3;
          baseSurgeries *= 1.4;
        }

        // Friday discharge push
        if (day === 5) {
          baseDischarges *= 1.5;
        }

        this.historicalPatterns.set(key, {
          dayOfWeek: day,
          hourOfDay: hour,
          averageAdmissions: baseAdmissions,
          averageDischarges: baseDischarges,
          averageERVisits: baseERVisits,
          averageSurgeries: baseSurgeries,
          seasonalFactor: 1.0 + (Math.random() * 0.2 - 0.1), // ±10% seasonal variation
        });
      }
    }
  }

  private generateForecasts(): void {
    const today = new Date();
    
    // Generate 14-day forecast
    for (let i = 0; i < 14; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);
      
      const forecast = this.generateDailyForecast(forecastDate);
      const key = this.getDateKey(forecastDate);
      this.forecasts.set(key, forecast);
    }
  }

  private getDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private generateDailyForecast(date: Date): DailyForecast {
    const dayOfWeek = date.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const staffingRequirements = this.forecastStaffing(date);
    const equipmentForecasts = this.forecastEquipment(date);
    const supplyForecasts = this.forecastSupplies(date);
    const bedForecasts = this.forecastBeds(date);
    const scheduledProcedures = this.getScheduledProcedures(date);
    const alerts = this.generateAlerts(staffingRequirements, equipmentForecasts, supplyForecasts, bedForecasts);

    // Calculate overall risk level
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const warningAlerts = alerts.filter(a => a.severity === 'warning').length;
    
    let overallRiskLevel: DailyForecast['overallRiskLevel'] = 'low';
    if (criticalAlerts > 0) overallRiskLevel = 'critical';
    else if (warningAlerts > 2) overallRiskLevel = 'high';
    else if (warningAlerts > 0) overallRiskLevel = 'medium';

    return {
      date,
      dayOfWeek: dayNames[dayOfWeek],
      staffingRequirements,
      equipmentForecasts,
      supplyForecasts,
      bedForecasts,
      scheduledProcedures,
      overallRiskLevel,
      alerts,
    };
  }

  private forecastStaffing(date: Date): StaffingRequirement[] {
    const dayOfWeek = date.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    
    const roles: StaffRole[] = ['nurse_rn', 'nurse_lpn', 'nurse_aide', 'physician', 'respiratory_therapist'];
    const shifts: ShiftType[] = ['day', 'evening', 'night'];
    
    const requirements: StaffingRequirement[] = [];

    roles.forEach(role => {
      shifts.forEach(shift => {
        let baseRequired = 0;
        
        switch (role) {
          case 'nurse_rn':
            baseRequired = shift === 'day' ? 24 : shift === 'evening' ? 20 : 16;
            break;
          case 'nurse_lpn':
            baseRequired = shift === 'day' ? 12 : shift === 'evening' ? 10 : 8;
            break;
          case 'nurse_aide':
            baseRequired = shift === 'day' ? 18 : shift === 'evening' ? 14 : 10;
            break;
          case 'physician':
            baseRequired = shift === 'day' ? 8 : shift === 'evening' ? 4 : 2;
            break;
          case 'respiratory_therapist':
            baseRequired = shift === 'day' ? 4 : 3;
            break;
        }

        // Weekend reduction
        if (!isWeekday) {
          baseRequired = Math.ceil(baseRequired * 0.7);
        }

        // Add some variance
        const scheduled = baseRequired + Math.floor(Math.random() * 3) - 1;
        const variance = scheduled - baseRequired;

        requirements.push({
          role,
          shiftType: shift,
          requiredCount: baseRequired,
          scheduledCount: Math.max(0, scheduled),
          variance,
          isCritical: variance < -2,
        });
      });
    });

    return requirements;
  }

  private forecastEquipment(date: Date): EquipmentForecast[] {
    const equipment = [
      { id: 'vent_001', name: 'Ventilators', category: 'Respiratory', available: 12, demand: 8 },
      { id: 'pump_001', name: 'IV Pumps', category: 'Infusion', available: 85, demand: 72 },
      { id: 'mon_001', name: 'Cardiac Monitors', category: 'Monitoring', available: 45, demand: 38 },
      { id: 'bed_001', name: 'Specialty Beds', category: 'Patient Care', available: 20, demand: 16 },
      { id: 'ultra_001', name: 'Portable Ultrasound', category: 'Imaging', available: 6, demand: 4 },
    ];

    return equipment.map(eq => {
      const peakTime = new Date(date);
      peakTime.setHours(10 + Math.floor(Math.random() * 4));

      const utilizationRate = (eq.demand / eq.available) * 100;
      const recommendations: string[] = [];

      if (utilizationRate > 90) {
        recommendations.push('Consider requesting additional units from other facilities');
      }
      if (utilizationRate > 80) {
        recommendations.push('Schedule preventive maintenance during low-demand periods');
      }

      return {
        equipmentId: eq.id,
        equipmentName: eq.name,
        category: eq.category,
        currentAvailable: eq.available,
        forecastedDemand: eq.demand,
        peakDemandTime: peakTime,
        utilizationRate: Math.round(utilizationRate),
        maintenanceDue: Math.random() > 0.7 ? new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000) : null,
        recommendations,
      };
    });
  }

  private forecastSupplies(date: Date): SupplyForecast[] {
    const supplies = [
      { id: 'glove_001', name: 'Nitrile Gloves (Box)', category: 'PPE', stock: 450, dailyUsage: 45, cost: 12.50 },
      { id: 'mask_001', name: 'N95 Masks', category: 'PPE', stock: 200, dailyUsage: 25, cost: 3.50 },
      { id: 'syringe_001', name: 'Syringes 10mL', category: 'Injection', stock: 800, dailyUsage: 120, cost: 0.35 },
      { id: 'iv_001', name: 'IV Catheters', category: 'Vascular Access', stock: 350, dailyUsage: 50, cost: 2.80 },
      { id: 'gauze_001', name: 'Sterile Gauze Pads', category: 'Wound Care', stock: 600, dailyUsage: 80, cost: 0.45 },
      { id: 'saline_001', name: 'Normal Saline 1L', category: 'IV Fluids', stock: 180, dailyUsage: 35, cost: 4.20 },
    ];

    return supplies.map(supply => {
      const daysUntilReorder = Math.floor(supply.stock / supply.dailyUsage);
      const reorderPoint = supply.dailyUsage * 5; // 5-day safety stock
      const needsReorder = supply.stock <= reorderPoint;
      
      let priority: SupplyForecast['priority'] = 'low';
      if (daysUntilReorder <= 2) priority = 'critical';
      else if (daysUntilReorder <= 5) priority = 'high';
      else if (daysUntilReorder <= 10) priority = 'medium';

      const suggestedQuantity = supply.dailyUsage * 14; // 2-week supply

      return {
        supplyId: supply.id,
        supplyName: supply.name,
        category: supply.category,
        currentStock: supply.stock,
        forecastedUsage: supply.dailyUsage,
        daysUntilReorder,
        reorderPoint,
        suggestedOrderQuantity: suggestedQuantity,
        costPerUnit: supply.cost,
        totalCost: suggestedQuantity * supply.cost,
        priority,
      };
    });
  }

  private forecastBeds(date: Date): BedForecast[] {
    const units = [
      { id: 'icu', name: 'ICU', beds: 24, currentOcc: 20 },
      { id: 'medsurg', name: 'Med/Surg', beds: 60, currentOcc: 48 },
      { id: 'tele', name: 'Telemetry', beds: 32, currentOcc: 28 },
      { id: 'peds', name: 'Pediatrics', beds: 20, currentOcc: 12 },
      { id: 'ob', name: 'Labor & Delivery', beds: 16, currentOcc: 8 },
    ];

    return units.map(unit => {
      const admissions = Math.floor(Math.random() * 5) + 2;
      const discharges = Math.floor(Math.random() * 6) + 1;
      const projectedOcc = Math.min(unit.beds, Math.max(0, unit.currentOcc + admissions - discharges));
      const occupancyRate = Math.round((projectedOcc / unit.beds) * 100);

      const peakTime = new Date(date);
      peakTime.setHours(14 + Math.floor(Math.random() * 4));

      const recommendations: string[] = [];
      if (occupancyRate > 90) {
        recommendations.push('Consider diversion protocols');
        recommendations.push('Expedite discharge planning');
      } else if (occupancyRate > 80) {
        recommendations.push('Monitor admission flow closely');
      }

      return {
        unitId: unit.id,
        unitName: unit.name,
        totalBeds: unit.beds,
        currentOccupancy: unit.currentOcc,
        forecastedAdmissions: admissions,
        forecastedDischarges: discharges,
        projectedOccupancy: projectedOcc,
        occupancyRate,
        peakOccupancyTime: peakTime,
        recommendations,
      };
    });
  }

  private getScheduledProcedures(date: Date): ScheduledProcedure[] {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return []; // No elective surgeries on weekends

    const procedures: ScheduledProcedure[] = [
      {
        id: `proc_${Date.now()}_1`,
        procedureName: 'Total Hip Replacement',
        procedureCode: '27130',
        scheduledDate: new Date(date.setHours(7, 30)),
        estimatedDuration: 180,
        requiredStaff: [
          { role: 'physician', count: 2 },
          { role: 'nurse_rn', count: 2 },
          { role: 'technician', count: 1 },
        ],
        requiredEquipment: ['OR Table', 'Fluoroscopy', 'Power Tools'],
        requiredSupplies: [
          { supplyId: 'implant_hip', quantity: 1 },
          { supplyId: 'suture_001', quantity: 5 },
        ],
        orRoom: 'OR-3',
        surgeon: 'Dr. Williams',
        status: 'confirmed',
      },
      {
        id: `proc_${Date.now()}_2`,
        procedureName: 'Laparoscopic Cholecystectomy',
        procedureCode: '47562',
        scheduledDate: new Date(date.setHours(10, 0)),
        estimatedDuration: 90,
        requiredStaff: [
          { role: 'physician', count: 1 },
          { role: 'nurse_rn', count: 2 },
        ],
        requiredEquipment: ['Laparoscopic Tower', 'Insufflator'],
        requiredSupplies: [
          { supplyId: 'trocar_001', quantity: 4 },
          { supplyId: 'clip_001', quantity: 6 },
        ],
        orRoom: 'OR-1',
        surgeon: 'Dr. Chen',
        status: 'confirmed',
      },
      {
        id: `proc_${Date.now()}_3`,
        procedureName: 'Coronary Artery Bypass Graft',
        procedureCode: '33533',
        scheduledDate: new Date(date.setHours(7, 0)),
        estimatedDuration: 300,
        requiredStaff: [
          { role: 'physician', count: 3 },
          { role: 'nurse_rn', count: 3 },
          { role: 'respiratory_therapist', count: 1 },
        ],
        requiredEquipment: ['Heart-Lung Machine', 'Cell Saver', 'TEE'],
        requiredSupplies: [
          { supplyId: 'graft_001', quantity: 2 },
          { supplyId: 'cannula_001', quantity: 4 },
        ],
        orRoom: 'OR-5 (Cardiac)',
        surgeon: 'Dr. Patel',
        status: 'confirmed',
      },
    ];

    return procedures;
  }

  private generateAlerts(
    staffing: StaffingRequirement[],
    equipment: EquipmentForecast[],
    supplies: SupplyForecast[],
    beds: BedForecast[]
  ): ForecastAlert[] {
    const alerts: ForecastAlert[] = [];

    // Staffing alerts
    staffing.filter(s => s.isCritical).forEach(s => {
      alerts.push({
        id: `alert_staff_${Date.now()}_${s.role}`,
        type: 'staffing',
        severity: 'critical',
        title: `${s.role.replace('_', ' ').toUpperCase()} Shortage`,
        message: `${s.shiftType} shift is ${Math.abs(s.variance)} staff short for ${s.role.replace('_', ' ')}`,
        resourceId: s.role,
        recommendedAction: 'Contact float pool or agency for coverage',
        createdAt: new Date(),
      });
    });

    // Equipment alerts
    equipment.filter(e => e.utilizationRate > 90).forEach(e => {
      alerts.push({
        id: `alert_equip_${Date.now()}_${e.equipmentId}`,
        type: 'equipment',
        severity: e.utilizationRate > 95 ? 'critical' : 'warning',
        title: `High ${e.equipmentName} Utilization`,
        message: `${e.equipmentName} utilization at ${e.utilizationRate}%`,
        resourceId: e.equipmentId,
        recommendedAction: 'Coordinate equipment sharing between units',
        createdAt: new Date(),
      });
    });

    // Supply alerts
    supplies.filter(s => s.priority === 'critical' || s.priority === 'high').forEach(s => {
      alerts.push({
        id: `alert_supply_${Date.now()}_${s.supplyId}`,
        type: 'supply',
        severity: s.priority === 'critical' ? 'critical' : 'warning',
        title: `Low Stock: ${s.supplyName}`,
        message: `Only ${s.daysUntilReorder} days of supply remaining`,
        resourceId: s.supplyId,
        recommendedAction: `Order ${s.suggestedOrderQuantity} units immediately`,
        createdAt: new Date(),
      });
    });

    // Bed capacity alerts
    beds.filter(b => b.occupancyRate > 90).forEach(b => {
      alerts.push({
        id: `alert_bed_${Date.now()}_${b.unitId}`,
        type: 'capacity',
        severity: b.occupancyRate > 95 ? 'critical' : 'warning',
        title: `${b.unitName} Near Capacity`,
        message: `${b.unitName} projected at ${b.occupancyRate}% occupancy`,
        resourceId: b.unitId,
        recommendedAction: b.recommendations[0] || 'Monitor closely',
        createdAt: new Date(),
      });
    });

    return alerts;
  }

  // Public API
  getForecast(date: Date): DailyForecast | undefined {
    const key = this.getDateKey(date);
    return this.forecasts.get(key);
  }

  getWeeklyForecast(): DailyForecast[] {
    const forecasts: DailyForecast[] = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const forecast = this.getForecast(date);
      if (forecast) forecasts.push(forecast);
    }

    return forecasts;
  }

  getAllAlerts(): ForecastAlert[] {
    const allForecasts = Array.from(this.forecasts.values());
    return allForecasts.flatMap(f => f.alerts);
  }

  getCriticalAlerts(): ForecastAlert[] {
    return this.getAllAlerts().filter(a => a.severity === 'critical');
  }

  getStaffingForecast(date: Date): StaffingRequirement[] {
    const forecast = this.getForecast(date);
    return forecast?.staffingRequirements || [];
  }

  getSupplyForecast(date: Date): SupplyForecast[] {
    const forecast = this.getForecast(date);
    return forecast?.supplyForecasts || [];
  }

  getCapacityForecast(date: Date): BedForecast[] {
    const forecast = this.getForecast(date);
    return forecast?.bedForecasts || [];
  }

  // Analytics
  getForecastAccuracy(): ForecastAccuracy[] {
    // Simulated accuracy metrics
    return [
      { metricName: 'Admission Forecast', forecastedValue: 45, actualValue: 42, variance: 3, accuracyPercentage: 93.3, date: new Date() },
      { metricName: 'Discharge Forecast', forecastedValue: 38, actualValue: 41, variance: -3, accuracyPercentage: 92.7, date: new Date() },
      { metricName: 'Staffing Needs', forecastedValue: 120, actualValue: 118, variance: 2, accuracyPercentage: 98.3, date: new Date() },
      { metricName: 'Supply Usage', forecastedValue: 850, actualValue: 890, variance: -40, accuracyPercentage: 95.5, date: new Date() },
    ];
  }

  getOverallStatistics(): {
    averageAccuracy: number;
    totalAlerts: number;
    criticalAlerts: number;
    forecastDays: number;
  } {
    const accuracy = this.getForecastAccuracy();
    const avgAccuracy = accuracy.reduce((sum, a) => sum + a.accuracyPercentage, 0) / accuracy.length;
    const allAlerts = this.getAllAlerts();

    return {
      averageAccuracy: Math.round(avgAccuracy * 10) / 10,
      totalAlerts: allAlerts.length,
      criticalAlerts: allAlerts.filter(a => a.severity === 'critical').length,
      forecastDays: this.forecasts.size,
    };
  }
}

export const resourceForecastingService = new ResourceForecastingService();
export default resourceForecastingService;
