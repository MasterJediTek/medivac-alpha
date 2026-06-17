/**
 * Theme Preview Calendar Service
 * Visual calendar showing when each theme will be active throughout the week
 */

export type ThemeName = 'light' | 'dark' | 'high-contrast' | 'jedi' | 'medical-blue';

export interface CalendarTimeSlot {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startHour: number; // 0-23
  endHour: number; // 0-23
  theme: ThemeName;
  profileId?: string;
  isOverride: boolean;
  label?: string;
}

export interface CalendarDay {
  dayOfWeek: number;
  dayName: string;
  slots: CalendarTimeSlot[];
}

export interface CalendarWeek {
  startDate: Date;
  endDate: Date;
  days: CalendarDay[];
}

export interface ScheduleConflict {
  id: string;
  dayOfWeek: number;
  conflictingSlots: CalendarTimeSlot[];
  overlapStart: number;
  overlapEnd: number;
  severity: 'warning' | 'error';
  message: string;
}

export interface CalendarExport {
  id: string;
  format: 'ical' | 'json' | 'csv' | 'pdf';
  createdAt: Date;
  weekStart: Date;
  data: string;
  downloadUrl?: string;
}

export interface CalendarAnalytics {
  totalSlots: number;
  slotsByTheme: Record<ThemeName, number>;
  hoursPerTheme: Record<ThemeName, number>;
  conflictCount: number;
  overrideCount: number;
  mostUsedTheme: ThemeName;
  coveragePercentage: number;
}

const THEME_COLORS: Record<ThemeName, { bg: string; text: string; border: string }> = {
  'light': { bg: '#FFFFFF', text: '#11181C', border: '#E5E7EB' },
  'dark': { bg: '#151718', text: '#ECEDEE', border: '#334155' },
  'high-contrast': { bg: '#000000', text: '#FFFF00', border: '#FFFF00' },
  'jedi': { bg: '#1A1A2E', text: '#FFD700', border: '#FFD700' },
  'medical-blue': { bg: '#E6F4FE', text: '#0A7EA4', border: '#0A7EA4' },
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

class ThemePreviewCalendarService {
  private timeSlots: Map<string, CalendarTimeSlot> = new Map();
  private conflicts: Map<string, ScheduleConflict> = new Map();
  private exports: Map<string, CalendarExport> = new Map();
  private listeners: Set<(calendar: CalendarWeek) => void> = new Set();

  constructor() {
    this.initializeDefaultSchedule();
  }

  private initializeDefaultSchedule(): void {
    // Default schedule: Light during day (6am-6pm), Dark at night
    for (let day = 0; day < 7; day++) {
      // Morning/Day slot
      this.addTimeSlot({
        dayOfWeek: day,
        startHour: 6,
        endHour: 18,
        theme: 'light',
        label: 'Day Shift',
      });

      // Evening/Night slot
      this.addTimeSlot({
        dayOfWeek: day,
        startHour: 18,
        endHour: 6,
        theme: 'dark',
        label: 'Night Shift',
      });
    }
  }

  private generateId(): string {
    return `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Time Slot Management
  addTimeSlot(config: Omit<CalendarTimeSlot, 'id' | 'isOverride'>): CalendarTimeSlot {
    const slot: CalendarTimeSlot = {
      id: this.generateId(),
      ...config,
      isOverride: false,
    };

    this.timeSlots.set(slot.id, slot);
    this.detectConflicts();
    this.notifyListeners();

    return slot;
  }

  updateTimeSlot(slotId: string, updates: Partial<Omit<CalendarTimeSlot, 'id'>>): CalendarTimeSlot | null {
    const slot = this.timeSlots.get(slotId);
    if (!slot) return null;

    const updated = { ...slot, ...updates };
    this.timeSlots.set(slotId, updated);
    this.detectConflicts();
    this.notifyListeners();

    return updated;
  }

  removeTimeSlot(slotId: string): boolean {
    const result = this.timeSlots.delete(slotId);
    if (result) {
      this.detectConflicts();
      this.notifyListeners();
    }
    return result;
  }

  getTimeSlot(slotId: string): CalendarTimeSlot | undefined {
    return this.timeSlots.get(slotId);
  }

  getAllTimeSlots(): CalendarTimeSlot[] {
    return Array.from(this.timeSlots.values());
  }

  getSlotsByDay(dayOfWeek: number): CalendarTimeSlot[] {
    return this.getAllTimeSlots().filter(slot => slot.dayOfWeek === dayOfWeek);
  }

  getSlotsByTheme(theme: ThemeName): CalendarTimeSlot[] {
    return this.getAllTimeSlots().filter(slot => slot.theme === theme);
  }

  // Calendar Generation
  generateWeekCalendar(startDate?: Date): CalendarWeek {
    const start = startDate || this.getWeekStart(new Date());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const days: CalendarDay[] = [];

    for (let i = 0; i < 7; i++) {
      const dayOfWeek = (start.getDay() + i) % 7;
      days.push({
        dayOfWeek,
        dayName: DAY_NAMES[dayOfWeek],
        slots: this.getSlotsByDay(dayOfWeek).sort((a, b) => a.startHour - b.startHour),
      });
    }

    return {
      startDate: start,
      endDate: end,
      days,
    };
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // Get theme at specific time
  getThemeAtTime(dayOfWeek: number, hour: number): ThemeName {
    const slots = this.getSlotsByDay(dayOfWeek);
    
    for (const slot of slots) {
      if (slot.startHour <= slot.endHour) {
        // Normal slot (e.g., 6-18)
        if (hour >= slot.startHour && hour < slot.endHour) {
          return slot.theme;
        }
      } else {
        // Overnight slot (e.g., 18-6)
        if (hour >= slot.startHour || hour < slot.endHour) {
          return slot.theme;
        }
      }
    }

    return 'light'; // Default fallback
  }

  // Theme Colors
  getThemeColors(theme: ThemeName): { bg: string; text: string; border: string } {
    return THEME_COLORS[theme];
  }

  getAllThemeColors(): Record<ThemeName, { bg: string; text: string; border: string }> {
    return { ...THEME_COLORS };
  }

  // Conflict Detection
  detectConflicts(): ScheduleConflict[] {
    this.conflicts.clear();

    for (let day = 0; day < 7; day++) {
      const daySlots = this.getSlotsByDay(day);
      
      for (let i = 0; i < daySlots.length; i++) {
        for (let j = i + 1; j < daySlots.length; j++) {
          const overlap = this.checkOverlap(daySlots[i], daySlots[j]);
          if (overlap) {
            const conflict: ScheduleConflict = {
              id: `conflict_${day}_${i}_${j}`,
              dayOfWeek: day,
              conflictingSlots: [daySlots[i], daySlots[j]],
              overlapStart: overlap.start,
              overlapEnd: overlap.end,
              severity: daySlots[i].theme !== daySlots[j].theme ? 'error' : 'warning',
              message: `Time overlap detected on ${DAY_NAMES[day]} between ${overlap.start}:00 and ${overlap.end}:00`,
            };
            this.conflicts.set(conflict.id, conflict);
          }
        }
      }
    }

    return this.getAllConflicts();
  }

  private checkOverlap(slot1: CalendarTimeSlot, slot2: CalendarTimeSlot): { start: number; end: number } | null {
    const normalize = (start: number, end: number): number[] => {
      const hours: number[] = [];
      if (start <= end) {
        for (let h = start; h < end; h++) hours.push(h);
      } else {
        for (let h = start; h < 24; h++) hours.push(h);
        for (let h = 0; h < end; h++) hours.push(h);
      }
      return hours;
    };

    const hours1 = normalize(slot1.startHour, slot1.endHour);
    const hours2 = normalize(slot2.startHour, slot2.endHour);
    
    const overlap = hours1.filter(h => hours2.includes(h));
    
    if (overlap.length > 0) {
      return {
        start: Math.min(...overlap),
        end: Math.max(...overlap) + 1,
      };
    }

    return null;
  }

  getAllConflicts(): ScheduleConflict[] {
    return Array.from(this.conflicts.values());
  }

  hasConflicts(): boolean {
    return this.conflicts.size > 0;
  }

  resolveConflict(conflictId: string, keepSlotId: string): boolean {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return false;

    const slotToRemove = conflict.conflictingSlots.find(s => s.id !== keepSlotId);
    if (slotToRemove) {
      this.removeTimeSlot(slotToRemove.id);
    }

    return true;
  }

  // Interactive Editing
  splitTimeSlot(slotId: string, splitHour: number): CalendarTimeSlot[] {
    const slot = this.timeSlots.get(slotId);
    if (!slot) return [];

    const slot1: CalendarTimeSlot = {
      ...slot,
      id: this.generateId(),
      endHour: splitHour,
    };

    const slot2: CalendarTimeSlot = {
      ...slot,
      id: this.generateId(),
      startHour: splitHour,
    };

    this.timeSlots.delete(slotId);
    this.timeSlots.set(slot1.id, slot1);
    this.timeSlots.set(slot2.id, slot2);

    this.detectConflicts();
    this.notifyListeners();

    return [slot1, slot2];
  }

  mergeTimeSlots(slotIds: string[]): CalendarTimeSlot | null {
    const slots = slotIds.map(id => this.timeSlots.get(id)).filter(Boolean) as CalendarTimeSlot[];
    if (slots.length < 2) return null;

    // Check all slots are on same day and same theme
    const day = slots[0].dayOfWeek;
    const theme = slots[0].theme;
    if (!slots.every(s => s.dayOfWeek === day && s.theme === theme)) {
      return null;
    }

    const minStart = Math.min(...slots.map(s => s.startHour));
    const maxEnd = Math.max(...slots.map(s => s.endHour));

    // Remove old slots
    slotIds.forEach(id => this.timeSlots.delete(id));

    // Create merged slot
    const merged = this.addTimeSlot({
      dayOfWeek: day,
      startHour: minStart,
      endHour: maxEnd,
      theme,
      label: slots[0].label,
    });

    return merged;
  }

  copyDaySchedule(fromDay: number, toDay: number): CalendarTimeSlot[] {
    const sourceSlots = this.getSlotsByDay(fromDay);
    const newSlots: CalendarTimeSlot[] = [];

    // Remove existing slots on target day
    this.getSlotsByDay(toDay).forEach(slot => this.timeSlots.delete(slot.id));

    // Copy slots
    sourceSlots.forEach(slot => {
      const newSlot = this.addTimeSlot({
        dayOfWeek: toDay,
        startHour: slot.startHour,
        endHour: slot.endHour,
        theme: slot.theme,
        profileId: slot.profileId,
        label: slot.label,
      });
      newSlots.push(newSlot);
    });

    return newSlots;
  }

  applyScheduleToAllDays(dayOfWeek: number): void {
    for (let day = 0; day < 7; day++) {
      if (day !== dayOfWeek) {
        this.copyDaySchedule(dayOfWeek, day);
      }
    }
  }

  // Export Functionality
  async exportCalendar(format: 'ical' | 'json' | 'csv' | 'pdf', weekStart?: Date): Promise<CalendarExport> {
    const calendar = this.generateWeekCalendar(weekStart);
    let data: string;

    switch (format) {
      case 'ical':
        data = this.generateICalFormat(calendar);
        break;
      case 'json':
        data = JSON.stringify(calendar, null, 2);
        break;
      case 'csv':
        data = this.generateCSVFormat(calendar);
        break;
      case 'pdf':
        data = this.generatePDFData(calendar);
        break;
    }

    const exportRecord: CalendarExport = {
      id: `export_${Date.now()}`,
      format,
      createdAt: new Date(),
      weekStart: calendar.startDate,
      data,
      downloadUrl: `data:${this.getMimeType(format)};base64,${Buffer.from(data).toString('base64')}`,
    };

    this.exports.set(exportRecord.id, exportRecord);
    return exportRecord;
  }

  private generateICalFormat(calendar: CalendarWeek): string {
    let ical = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//MediVac WACHS//Theme Calendar//EN\n';

    calendar.days.forEach(day => {
      day.slots.forEach(slot => {
        const date = new Date(calendar.startDate);
        date.setDate(date.getDate() + day.dayOfWeek);
        
        ical += 'BEGIN:VEVENT\n';
        ical += `DTSTART:${this.formatICalDate(date, slot.startHour)}\n`;
        ical += `DTEND:${this.formatICalDate(date, slot.endHour)}\n`;
        ical += `SUMMARY:Theme: ${slot.theme}\n`;
        ical += `DESCRIPTION:${slot.label || 'Theme Schedule'}\n`;
        ical += 'END:VEVENT\n';
      });
    });

    ical += 'END:VCALENDAR';
    return ical;
  }

  private formatICalDate(date: Date, hour: number): string {
    const d = new Date(date);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  private generateCSVFormat(calendar: CalendarWeek): string {
    let csv = 'Day,Start Hour,End Hour,Theme,Label\n';

    calendar.days.forEach(day => {
      day.slots.forEach(slot => {
        csv += `${day.dayName},${slot.startHour}:00,${slot.endHour}:00,${slot.theme},${slot.label || ''}\n`;
      });
    });

    return csv;
  }

  private generatePDFData(calendar: CalendarWeek): string {
    // Generate HTML representation for PDF
    let html = '<html><head><style>';
    html += 'table { border-collapse: collapse; width: 100%; }';
    html += 'th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }';
    html += 'th { background-color: #0A7EA4; color: white; }';
    html += '</style></head><body>';
    html += '<h1>MediVac WACHS Theme Schedule</h1>';
    html += '<table><tr><th>Day</th><th>Time</th><th>Theme</th></tr>';

    calendar.days.forEach(day => {
      day.slots.forEach(slot => {
        const colors = this.getThemeColors(slot.theme);
        html += `<tr><td>${day.dayName}</td>`;
        html += `<td>${slot.startHour}:00 - ${slot.endHour}:00</td>`;
        html += `<td style="background-color:${colors.bg};color:${colors.text}">${slot.theme}</td></tr>`;
      });
    });

    html += '</table></body></html>';
    return html;
  }

  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      'ical': 'text/calendar',
      'json': 'application/json',
      'csv': 'text/csv',
      'pdf': 'text/html',
    };
    return mimeTypes[format] || 'text/plain';
  }

  getExport(exportId: string): CalendarExport | undefined {
    return this.exports.get(exportId);
  }

  getAllExports(): CalendarExport[] {
    return Array.from(this.exports.values());
  }

  // Analytics
  getAnalytics(): CalendarAnalytics {
    const slots = this.getAllTimeSlots();
    const themes: ThemeName[] = ['light', 'dark', 'high-contrast', 'jedi', 'medical-blue'];

    const slotsByTheme: Record<ThemeName, number> = {} as Record<ThemeName, number>;
    const hoursPerTheme: Record<ThemeName, number> = {} as Record<ThemeName, number>;

    themes.forEach(theme => {
      slotsByTheme[theme] = 0;
      hoursPerTheme[theme] = 0;
    });

    slots.forEach(slot => {
      slotsByTheme[slot.theme]++;
      const hours = slot.startHour <= slot.endHour 
        ? slot.endHour - slot.startHour 
        : (24 - slot.startHour) + slot.endHour;
      hoursPerTheme[slot.theme] += hours;
    });

    const totalHours = Object.values(hoursPerTheme).reduce((a, b) => a + b, 0);
    const mostUsedTheme = themes.reduce((a, b) => 
      hoursPerTheme[a] > hoursPerTheme[b] ? a : b
    );

    return {
      totalSlots: slots.length,
      slotsByTheme,
      hoursPerTheme,
      conflictCount: this.conflicts.size,
      overrideCount: slots.filter(s => s.isOverride).length,
      mostUsedTheme,
      coveragePercentage: Math.min(100, (totalHours / (7 * 24)) * 100),
    };
  }

  // Event Listeners
  subscribe(listener: (calendar: CalendarWeek) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const calendar = this.generateWeekCalendar();
    this.listeners.forEach(listener => listener(calendar));
  }

  // Reset
  resetToDefault(): void {
    this.timeSlots.clear();
    this.conflicts.clear();
    this.initializeDefaultSchedule();
    this.notifyListeners();
  }
}

export const themePreviewCalendarService = new ThemePreviewCalendarService();
