/**
 * Visitor Pass History Service
 * Stores completed check-in records and enables quick re-check-in
 * for returning visitors with pre-filled data.
 */

export interface VisitorRecord {
  id: string;
  visitorName: string;
  purpose: string;
  purposeLabel: string;
  destinationDepartment: string;
  destinationFloor: string;
  patientName?: string;
  passNumber: string;
  checkInTime: number;
  checkOutTime: number | null;
  visitDurationMinutes: number | null;
  isCompleted: boolean;
}

export interface ReturningVisitor {
  visitorName: string;
  visitCount: number;
  lastVisitDate: number;
  lastPurpose: string;
  lastDepartment: string;
  lastPatientName?: string;
  averageVisitDuration: number;
  records: VisitorRecord[];
}

type HistoryChangeCallback = (records: VisitorRecord[]) => void;

const STORAGE_KEY = 'medivac_visitor_history';
const MAX_RECORDS = 500;

export class VisitorHistoryService {
  private static instance: VisitorHistoryService | null = null;
  private records: VisitorRecord[] = [];
  private callbacks: Set<HistoryChangeCallback> = new Set();

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): VisitorHistoryService {
    if (!VisitorHistoryService.instance) {
      VisitorHistoryService.instance = new VisitorHistoryService();
    }
    return VisitorHistoryService.instance;
  }

  static resetInstance(): void {
    if (VisitorHistoryService.instance) {
      VisitorHistoryService.instance.records = [];
      VisitorHistoryService.instance.callbacks.clear();
    }
    VisitorHistoryService.instance = null;
  }

  // ── Storage ──────────────────────────────────────────────────────────
  private loadFromStorage(): void {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.records = JSON.parse(raw);
      }
    } catch {
      // ignore
    }
  }

  private saveToStorage(): void {
    try {
      if (typeof window === 'undefined') return;
      // Keep only the most recent records
      const toSave = this.records.slice(0, MAX_RECORDS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // ignore
    }
  }

  // ── Record Management ────────────────────────────────────────────────
  addRecord(record: Omit<VisitorRecord, 'id' | 'isCompleted' | 'visitDurationMinutes'>): VisitorRecord {
    const newRecord: VisitorRecord = {
      ...record,
      id: `vr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      isCompleted: false,
      visitDurationMinutes: null,
    };
    this.records.unshift(newRecord);
    this.saveToStorage();
    this.notifyChange();
    return newRecord;
  }

  completeVisit(recordId: string): VisitorRecord | null {
    const record = this.records.find(r => r.id === recordId);
    if (!record) return null;
    record.isCompleted = true;
    record.checkOutTime = Date.now();
    record.visitDurationMinutes = Math.round((record.checkOutTime - record.checkInTime) / 60000);
    this.saveToStorage();
    this.notifyChange();
    return record;
  }

  // ── Query ────────────────────────────────────────────────────────────
  getAllRecords(): VisitorRecord[] {
    return [...this.records];
  }

  getTodayRecords(): VisitorRecord[] {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return this.records.filter(r => r.checkInTime >= todayStart.getTime());
  }

  getRecentRecords(count: number = 10): VisitorRecord[] {
    return this.records.slice(0, count);
  }

  getRecordsByVisitor(visitorName: string): VisitorRecord[] {
    const normalizedName = visitorName.toLowerCase().trim();
    return this.records.filter(r => r.visitorName.toLowerCase().trim() === normalizedName);
  }

  getRecordById(recordId: string): VisitorRecord | null {
    return this.records.find(r => r.id === recordId) || null;
  }

  // ── Returning Visitors ───────────────────────────────────────────────
  getReturningVisitors(): ReturningVisitor[] {
    const visitorMap = new Map<string, VisitorRecord[]>();

    this.records.forEach(r => {
      const key = r.visitorName.toLowerCase().trim();
      const existing = visitorMap.get(key) || [];
      existing.push(r);
      visitorMap.set(key, existing);
    });

    const returning: ReturningVisitor[] = [];
    visitorMap.forEach((records, _key) => {
      if (records.length < 1) return;
      const sorted = records.sort((a, b) => b.checkInTime - a.checkInTime);
      const latest = sorted[0];
      const completedVisits = sorted.filter(r => r.visitDurationMinutes !== null);
      const avgDuration = completedVisits.length > 0
        ? Math.round(completedVisits.reduce((sum, r) => sum + (r.visitDurationMinutes || 0), 0) / completedVisits.length)
        : 0;

      returning.push({
        visitorName: latest.visitorName,
        visitCount: records.length,
        lastVisitDate: latest.checkInTime,
        lastPurpose: latest.purpose,
        lastDepartment: latest.destinationDepartment,
        lastPatientName: latest.patientName,
        averageVisitDuration: avgDuration,
        records: sorted,
      });
    });

    return returning.sort((a, b) => b.lastVisitDate - a.lastVisitDate);
  }

  getFrequentVisitors(minVisits: number = 2): ReturningVisitor[] {
    return this.getReturningVisitors().filter(v => v.visitCount >= minVisits);
  }

  // ── Quick Re-Check-In ───────────────────────────────────────────────
  getQuickCheckInData(visitorName: string): {
    visitorName: string;
    purpose: string;
    destinationDepartment: string;
    patientName?: string;
    visitCount: number;
    lastVisitFormatted: string;
  } | null {
    const records = this.getRecordsByVisitor(visitorName);
    if (records.length === 0) return null;

    const latest = records.sort((a, b) => b.checkInTime - a.checkInTime)[0];
    const lastDate = new Date(latest.checkInTime);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    let lastVisitFormatted: string;
    if (diffDays === 0) lastVisitFormatted = 'Today';
    else if (diffDays === 1) lastVisitFormatted = 'Yesterday';
    else if (diffDays < 7) lastVisitFormatted = `${diffDays} days ago`;
    else if (diffDays < 30) lastVisitFormatted = `${Math.floor(diffDays / 7)} weeks ago`;
    else lastVisitFormatted = `${Math.floor(diffDays / 30)} months ago`;

    return {
      visitorName: latest.visitorName,
      purpose: latest.purpose,
      destinationDepartment: latest.destinationDepartment,
      patientName: latest.patientName,
      visitCount: records.length,
      lastVisitFormatted,
    };
  }

  searchVisitors(query: string): ReturningVisitor[] {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return this.getReturningVisitors().filter(v =>
      v.visitorName.toLowerCase().includes(q)
    );
  }

  // ── Statistics ───────────────────────────────────────────────────────
  getStatistics(): {
    totalVisits: number;
    todayVisits: number;
    uniqueVisitors: number;
    averageDuration: number;
    mostVisitedDepartment: string;
    peakHour: number;
  } {
    const today = this.getTodayRecords();
    const uniqueNames = new Set(this.records.map(r => r.visitorName.toLowerCase().trim()));
    const completed = this.records.filter(r => r.visitDurationMinutes !== null);
    const avgDuration = completed.length > 0
      ? Math.round(completed.reduce((sum, r) => sum + (r.visitDurationMinutes || 0), 0) / completed.length)
      : 0;

    // Most visited department
    const deptCounts = new Map<string, number>();
    this.records.forEach(r => {
      deptCounts.set(r.destinationDepartment, (deptCounts.get(r.destinationDepartment) || 0) + 1);
    });
    let mostVisited = '';
    let maxCount = 0;
    deptCounts.forEach((count, dept) => {
      if (count > maxCount) { maxCount = count; mostVisited = dept; }
    });

    // Peak hour
    const hourCounts = new Array(24).fill(0);
    this.records.forEach(r => {
      const hour = new Date(r.checkInTime).getHours();
      hourCounts[hour]++;
    });
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

    return {
      totalVisits: this.records.length,
      todayVisits: today.length,
      uniqueVisitors: uniqueNames.size,
      averageDuration: avgDuration,
      mostVisitedDepartment: mostVisited || 'N/A',
      peakHour,
    };
  }

  // ── Clear ────────────────────────────────────────────────────────────
  clearHistory(): void {
    this.records = [];
    this.saveToStorage();
    this.notifyChange();
  }

  removeRecord(recordId: string): boolean {
    const idx = this.records.findIndex(r => r.id === recordId);
    if (idx === -1) return false;
    this.records.splice(idx, 1);
    this.saveToStorage();
    this.notifyChange();
    return true;
  }

  // ── Listeners ────────────────────────────────────────────────────────
  onHistoryChange(callback: HistoryChangeCallback): () => void {
    this.callbacks.add(callback);
    return () => { this.callbacks.delete(callback); };
  }

  private notifyChange(): void {
    const records = this.getAllRecords();
    this.callbacks.forEach(cb => cb(records));
  }
}
