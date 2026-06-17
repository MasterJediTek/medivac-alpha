/**
 * Visitor Analytics Service - v9.21
 * Aggregates visitor check-in data for hospital administration,
 * including peak hours, department load, trends, and duration metrics.
 */

export interface HourlyData {
  hour: number;
  label: string;
  count: number;
  percentage: number;
}

export interface DepartmentLoad {
  departmentId: string;
  departmentName: string;
  totalVisits: number;
  todayVisits: number;
  averageDurationMinutes: number;
  percentage: number;
}

export interface DailyTrend {
  date: string;
  dayLabel: string;
  visits: number;
  uniqueVisitors: number;
}

export interface VisitorAnalytics {
  totalVisits: number;
  todayVisits: number;
  thisWeekVisits: number;
  thisMonthVisits: number;
  uniqueVisitors: number;
  averageDurationMinutes: number;
  peakHour: number;
  peakHourLabel: string;
  peakHourCount: number;
  busiestDay: string;
  busiestDayCount: number;
  returningVisitorRate: number;
  hourlyDistribution: HourlyData[];
  departmentLoad: DepartmentLoad[];
  dailyTrend: DailyTrend[];
  purposeBreakdown: Array<{ purpose: string; count: number; percentage: number }>;
}

type AnalyticsChangeCallback = (analytics: VisitorAnalytics) => void;

export class VisitorAnalyticsService {
  private static instance: VisitorAnalyticsService | null = null;
  private listeners: AnalyticsChangeCallback[] = [];
  private cachedAnalytics: VisitorAnalytics | null = null;

  // Simulated historical data
  private visitRecords: Array<{
    visitorName: string;
    purpose: string;
    department: string;
    checkInTime: number;
    durationMinutes: number;
  }> = [];

  private constructor() {
    this.generateHistoricalData();
  }

  static getInstance(): VisitorAnalyticsService {
    if (!VisitorAnalyticsService.instance) {
      VisitorAnalyticsService.instance = new VisitorAnalyticsService();
    }
    return VisitorAnalyticsService.instance;
  }

  static resetInstance(): void {
    VisitorAnalyticsService.instance = null;
  }

  private generateHistoricalData(): void {
    const departments = [
      'Emergency', 'Pharmacy', 'Radiology', 'Pathology',
      'Maternity', 'Paediatrics', 'Surgical', 'ICU',
      'Cafeteria', 'Administration',
    ];
    const purposes = ['patient_visit', 'appointment', 'delivery', 'other'];
    const names = [
      'John Smith', 'Jane Doe', 'Robert Brown', 'Emily Wilson',
      'Michael Chen', 'Sarah Johnson', 'David Lee', 'Lisa Wang',
      'James Taylor', 'Maria Garcia', 'Kevin Patel', 'Amanda White',
      'Thomas Anderson', 'Rachel Kim', 'Christopher Davis',
    ];

    const now = Date.now();
    const records: typeof this.visitRecords = [];

    // Generate 30 days of data
    for (let day = 0; day < 30; day++) {
      const dayStart = now - (day * 86400000);
      const isWeekend = new Date(dayStart).getDay() === 0 || new Date(dayStart).getDay() === 6;
      const visitsPerDay = isWeekend ? 15 + Math.floor(Math.random() * 10) : 25 + Math.floor(Math.random() * 20);

      for (let v = 0; v < visitsPerDay; v++) {
        // Weighted hour distribution (peak at 10am and 2pm)
        const hourWeights = [1, 1, 1, 1, 2, 3, 5, 8, 12, 15, 18, 16, 14, 12, 15, 13, 10, 8, 5, 3, 2, 1, 1, 1];
        const totalWeight = hourWeights.reduce((a, b) => a + b, 0);
        let rand = Math.random() * totalWeight;
        let hour = 0;
        for (let h = 0; h < 24; h++) {
          rand -= hourWeights[h];
          if (rand <= 0) { hour = h; break; }
        }

        const checkInTime = dayStart - (new Date(dayStart).getHours() * 3600000) + (hour * 3600000) + Math.floor(Math.random() * 3600000);

        // Department weighting
        const deptWeights = [20, 15, 10, 8, 12, 8, 6, 3, 10, 8];
        const deptTotal = deptWeights.reduce((a, b) => a + b, 0);
        let deptRand = Math.random() * deptTotal;
        let deptIdx = 0;
        for (let d = 0; d < departments.length; d++) {
          deptRand -= deptWeights[d];
          if (deptRand <= 0) { deptIdx = d; break; }
        }

        records.push({
          visitorName: names[Math.floor(Math.random() * names.length)],
          purpose: purposes[Math.floor(Math.random() * purposes.length)],
          department: departments[deptIdx],
          checkInTime,
          durationMinutes: 15 + Math.floor(Math.random() * 90),
        });
      }
    }

    this.visitRecords = records;
    this.cachedAnalytics = null;
  }

  // ── Analytics Computation ───────────────────────────────────────────
  getAnalytics(): VisitorAnalytics {
    if (this.cachedAnalytics) return this.cachedAnalytics;

    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const weekStart = todayStart - (new Date().getDay() * 86400000);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

    const totalVisits = this.visitRecords.length;
    const todayVisits = this.visitRecords.filter(r => r.checkInTime >= todayStart).length;
    const thisWeekVisits = this.visitRecords.filter(r => r.checkInTime >= weekStart).length;
    const thisMonthVisits = this.visitRecords.filter(r => r.checkInTime >= monthStart).length;

    const uniqueNames = new Set(this.visitRecords.map(r => r.visitorName));
    const uniqueVisitors = uniqueNames.size;

    const totalDuration = this.visitRecords.reduce((sum, r) => sum + r.durationMinutes, 0);
    const averageDurationMinutes = totalVisits > 0 ? Math.round(totalDuration / totalVisits) : 0;

    // Returning visitor rate
    const nameCounts = new Map<string, number>();
    this.visitRecords.forEach(r => nameCounts.set(r.visitorName, (nameCounts.get(r.visitorName) || 0) + 1));
    const returningCount = Array.from(nameCounts.values()).filter(c => c > 1).length;
    const returningVisitorRate = uniqueVisitors > 0 ? Math.round((returningCount / uniqueVisitors) * 100) : 0;

    // Hourly distribution
    const hourCounts = new Array(24).fill(0);
    this.visitRecords.forEach(r => {
      const h = new Date(r.checkInTime).getHours();
      hourCounts[h]++;
    });
    const maxHourCount = Math.max(...hourCounts);
    const peakHour = hourCounts.indexOf(maxHourCount);
    const hourlyDistribution: HourlyData[] = hourCounts.map((count, hour) => ({
      hour,
      label: `${hour.toString().padStart(2, '0')}:00`,
      count,
      percentage: maxHourCount > 0 ? Math.round((count / maxHourCount) * 100) : 0,
    }));

    // Department load
    const deptMap = new Map<string, { total: number; today: number; duration: number }>();
    this.visitRecords.forEach(r => {
      const existing = deptMap.get(r.department) || { total: 0, today: 0, duration: 0 };
      existing.total++;
      if (r.checkInTime >= todayStart) existing.today++;
      existing.duration += r.durationMinutes;
      deptMap.set(r.department, existing);
    });
    const departmentLoad: DepartmentLoad[] = Array.from(deptMap.entries())
      .map(([dept, data]) => ({
        departmentId: dept.toLowerCase().replace(/\s+/g, '-'),
        departmentName: dept,
        totalVisits: data.total,
        todayVisits: data.today,
        averageDurationMinutes: data.total > 0 ? Math.round(data.duration / data.total) : 0,
        percentage: totalVisits > 0 ? Math.round((data.total / totalVisits) * 100) : 0,
      }))
      .sort((a, b) => b.totalVisits - a.totalVisits);

    // Daily trend (last 7 days)
    const dailyTrend: DailyTrend[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let d = 6; d >= 0; d--) {
      const dayStart = todayStart - (d * 86400000);
      const dayEnd = dayStart + 86400000;
      const dayRecords = this.visitRecords.filter(r => r.checkInTime >= dayStart && r.checkInTime < dayEnd);
      const dayDate = new Date(dayStart);
      dailyTrend.push({
        date: dayDate.toISOString().split('T')[0],
        dayLabel: dayNames[dayDate.getDay()],
        visits: dayRecords.length,
        uniqueVisitors: new Set(dayRecords.map(r => r.visitorName)).size,
      });
    }

    // Busiest day
    const busiestTrend = [...dailyTrend].sort((a, b) => b.visits - a.visits)[0];

    // Purpose breakdown
    const purposeMap = new Map<string, number>();
    this.visitRecords.forEach(r => purposeMap.set(r.purpose, (purposeMap.get(r.purpose) || 0) + 1));
    const purposeLabels: Record<string, string> = {
      patient_visit: 'Patient Visit',
      appointment: 'Appointment',
      delivery: 'Delivery',
      other: 'Other',
    };
    const purposeBreakdown = Array.from(purposeMap.entries())
      .map(([purpose, count]) => ({
        purpose: purposeLabels[purpose] || purpose,
        count,
        percentage: totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const peakHourLabel = `${peakHour.toString().padStart(2, '0')}:00`;

    this.cachedAnalytics = {
      totalVisits,
      todayVisits,
      thisWeekVisits,
      thisMonthVisits,
      uniqueVisitors,
      averageDurationMinutes,
      peakHour,
      peakHourLabel,
      peakHourCount: maxHourCount,
      busiestDay: busiestTrend?.dayLabel || 'N/A',
      busiestDayCount: busiestTrend?.visits || 0,
      returningVisitorRate,
      hourlyDistribution,
      departmentLoad,
      dailyTrend,
      purposeBreakdown,
    };

    return this.cachedAnalytics;
  }

  // ── Specific Queries ────────────────────────────────────────────────
  getTodayVisits(): number {
    return this.getAnalytics().todayVisits;
  }

  getPeakHours(): HourlyData[] {
    return this.getAnalytics().hourlyDistribution.filter(h => h.percentage >= 70);
  }

  getTopDepartments(limit: number = 5): DepartmentLoad[] {
    return this.getAnalytics().departmentLoad.slice(0, limit);
  }

  getDailyTrend(): DailyTrend[] {
    return this.getAnalytics().dailyTrend;
  }

  getAverageDuration(): number {
    return this.getAnalytics().averageDurationMinutes;
  }

  getReturningRate(): number {
    return this.getAnalytics().returningVisitorRate;
  }

  refreshAnalytics(): VisitorAnalytics {
    this.cachedAnalytics = null;
    const analytics = this.getAnalytics();
    this.listeners.forEach(cb => cb(analytics));
    return analytics;
  }

  // ── Listeners ───────────────────────────────────────────────────────
  onAnalyticsChange(cb: AnalyticsChangeCallback): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }
}
