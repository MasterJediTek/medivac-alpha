/**
 * Dashboard Widget Templates Service
 * MediVac WACHS v8.6
 * 
 * Pre-built dashboard templates for different user roles including
 * doctors, nurses, administrators, and JEDI commanders.
 */

export type UserRole = 'doctor' | 'nurse' | 'administrator' | 'jedi-commander' | 'master-jedi' | 'patient' | 'technician' | 'pharmacist';
export type WidgetType = 'calendar' | 'medications' | 'vitals' | 'tasks' | 'alerts' | 'stats' | 'chart' | 'messages' | 'patients' | 'reports' | 'schedule' | 'jedi-status' | 'quick-actions' | 'recent-activity' | 'notifications' | 'weather';
export type WidgetSize = 'small' | 'medium' | 'large' | 'full-width';

export interface WidgetPosition {
  row: number;
  col: number;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  position: WidgetPosition;
  color: string;
  icon: string;
  refreshInterval: number;
  visible: boolean;
  settings: Record<string, unknown>;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  role: UserRole;
  icon: string;
  color: string;
  widgets: DashboardWidget[];
  columns: number;
  rows: number;
  isDefault: boolean;
  isCustom: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TemplatePreview {
  id: string;
  name: string;
  role: UserRole;
  icon: string;
  color: string;
  widgetCount: number;
  layout: string;
  description: string;
}

export interface RoleColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

const ROLE_COLORS: Record<UserRole, RoleColorPalette> = {
  doctor: { primary: '#3498DB', secondary: '#5DADE2', accent: '#2980B9', background: '#EBF5FB', text: '#1A5276' },
  nurse: { primary: '#E91E63', secondary: '#F06292', accent: '#C2185B', background: '#FCE4EC', text: '#880E4F' },
  administrator: { primary: '#9B59B6', secondary: '#BB8FCE', accent: '#7D3C98', background: '#F5EEF8', text: '#4A235A' },
  'jedi-commander': { primary: '#F39C12', secondary: '#F5B041', accent: '#D68910', background: '#FEF9E7', text: '#7E5109' },
  'master-jedi': { primary: '#1ABC9C', secondary: '#48C9B0', accent: '#16A085', background: '#E8F8F5', text: '#0E6655' },
  patient: { primary: '#27AE60', secondary: '#58D68D', accent: '#1E8449', background: '#EAFAF1', text: '#145A32' },
  technician: { primary: '#607D8B', secondary: '#90A4AE', accent: '#455A64', background: '#ECEFF1', text: '#263238' },
  pharmacist: { primary: '#E74C3C', secondary: '#EC7063', accent: '#C0392B', background: '#FDEDEC', text: '#78281F' },
};

const WIDGET_ICONS: Record<WidgetType, string> = {
  calendar: '📅',
  medications: '💊',
  vitals: '❤️',
  tasks: '✓',
  alerts: '🔔',
  stats: '📊',
  chart: '📈',
  messages: '💬',
  patients: '👥',
  reports: '📋',
  schedule: '⏰',
  'jedi-status': '⚔️',
  'quick-actions': '⚡',
  'recent-activity': '🕐',
  notifications: '🔔',
  weather: '☀️',
};

type Listener = (template: DashboardTemplate | null) => void;

class DashboardWidgetTemplatesService {
  private templates: Map<string, DashboardTemplate> = new Map();
  private activeWidgets: Map<string, DashboardWidget> = new Map();
  private activeTemplateId: string | null = null;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    const now = Date.now();

    // Doctor Dashboard
    this.templates.set('doctor-default', {
      id: 'doctor-default',
      name: 'Doctor Dashboard',
      description: 'Comprehensive view for medical professionals with patient data, schedules, and clinical tools',
      role: 'doctor',
      icon: '🩺',
      color: ROLE_COLORS.doctor.primary,
      columns: 4,
      rows: 6,
      isDefault: true,
      isCustom: false,
      createdAt: now,
      updatedAt: now,
      widgets: [
        { id: 'w1', type: 'patients', title: 'My Patients', size: 'large', position: { row: 0, col: 0 }, color: '#3498DB', icon: '👥', refreshInterval: 300, visible: true, settings: {} },
        { id: 'w2', type: 'schedule', title: 'Today\'s Schedule', size: 'medium', position: { row: 0, col: 2 }, color: '#2ECC71', icon: '📅', refreshInterval: 300, visible: true, settings: {} },
        { id: 'w3', type: 'alerts', title: 'Critical Alerts', size: 'medium', position: { row: 1, col: 0 }, color: '#E74C3C', icon: '🚨', refreshInterval: 60, visible: true, settings: {} },
        { id: 'w4', type: 'vitals', title: 'Patient Vitals', size: 'medium', position: { row: 1, col: 2 }, color: '#9B59B6', icon: '❤️', refreshInterval: 120, visible: true, settings: {} },
        { id: 'w5', type: 'reports', title: 'Pending Reports', size: 'small', position: { row: 2, col: 0 }, color: '#F39C12', icon: '📋', refreshInterval: 600, visible: true, settings: {} },
        { id: 'w6', type: 'quick-actions', title: 'Quick Actions', size: 'small', position: { row: 2, col: 1 }, color: '#1ABC9C', icon: '⚡', refreshInterval: 0, visible: true, settings: {} },
      ],
    });

    // Nurse Dashboard
    this.templates.set('nurse-default', {
      id: 'nurse-default',
      name: 'Nurse Dashboard',
      description: 'Patient care focused dashboard with medication schedules and vital monitoring',
      role: 'nurse',
      icon: '👩‍⚕️',
      color: ROLE_COLORS.nurse.primary,
      columns: 4,
      rows: 6,
      isDefault: true,
      isCustom: false,
      createdAt: now,
      updatedAt: now,
      widgets: [
        { id: 'w1', type: 'medications', title: 'Medication Rounds', size: 'large', position: { row: 0, col: 0 }, color: '#E91E63', icon: '💊', refreshInterval: 60, visible: true, settings: {} },
        { id: 'w2', type: 'vitals', title: 'Vital Signs Monitor', size: 'large', position: { row: 0, col: 2 }, color: '#E74C3C', icon: '❤️', refreshInterval: 60, visible: true, settings: {} },
        { id: 'w3', type: 'tasks', title: 'Care Tasks', size: 'medium', position: { row: 1, col: 0 }, color: '#3498DB', icon: '✓', refreshInterval: 120, visible: true, settings: {} },
        { id: 'w4', type: 'alerts', title: 'Patient Alerts', size: 'medium', position: { row: 1, col: 2 }, color: '#F39C12', icon: '🔔', refreshInterval: 30, visible: true, settings: {} },
        { id: 'w5', type: 'schedule', title: 'Shift Schedule', size: 'medium', position: { row: 2, col: 0 }, color: '#9B59B6', icon: '⏰', refreshInterval: 300, visible: true, settings: {} },
      ],
    });

    // Administrator Dashboard
    this.templates.set('admin-default', {
      id: 'admin-default',
      name: 'Administrator Dashboard',
      description: 'System overview with analytics, user management, and operational metrics',
      role: 'administrator',
      icon: '👔',
      color: ROLE_COLORS.administrator.primary,
      columns: 4,
      rows: 6,
      isDefault: true,
      isCustom: false,
      createdAt: now,
      updatedAt: now,
      widgets: [
        { id: 'w1', type: 'stats', title: 'System Statistics', size: 'large', position: { row: 0, col: 0 }, color: '#9B59B6', icon: '📊', refreshInterval: 300, visible: true, settings: {} },
        { id: 'w2', type: 'chart', title: 'Usage Analytics', size: 'large', position: { row: 0, col: 2 }, color: '#3498DB', icon: '📈', refreshInterval: 600, visible: true, settings: {} },
        { id: 'w3', type: 'alerts', title: 'System Alerts', size: 'medium', position: { row: 1, col: 0 }, color: '#E74C3C', icon: '🚨', refreshInterval: 60, visible: true, settings: {} },
        { id: 'w4', type: 'reports', title: 'Reports Queue', size: 'medium', position: { row: 1, col: 2 }, color: '#F39C12', icon: '📋', refreshInterval: 300, visible: true, settings: {} },
        { id: 'w5', type: 'recent-activity', title: 'Recent Activity', size: 'full-width', position: { row: 2, col: 0 }, color: '#1ABC9C', icon: '🕐', refreshInterval: 120, visible: true, settings: {} },
      ],
    });

    // JEDI Commander Dashboard
    this.templates.set('jedi-commander-default', {
      id: 'jedi-commander-default',
      name: 'JEDI Commander Dashboard',
      description: 'Mission control center with team status, operations, and strategic overview',
      role: 'jedi-commander',
      icon: '⚔️',
      color: ROLE_COLORS['jedi-commander'].primary,
      columns: 4,
      rows: 6,
      isDefault: true,
      isCustom: false,
      createdAt: now,
      updatedAt: now,
      widgets: [
        { id: 'w1', type: 'jedi-status', title: 'JEDI Team Status', size: 'large', position: { row: 0, col: 0 }, color: '#F39C12', icon: '⚔️', refreshInterval: 60, visible: true, settings: {} },
        { id: 'w2', type: 'calendar', title: 'Mission Calendar', size: 'large', position: { row: 0, col: 2 }, color: '#3498DB', icon: '📅', refreshInterval: 300, visible: true, settings: {} },
        { id: 'w3', type: 'alerts', title: 'Priority Alerts', size: 'medium', position: { row: 1, col: 0 }, color: '#E74C3C', icon: '🚨', refreshInterval: 30, visible: true, settings: {} },
        { id: 'w4', type: 'stats', title: 'Operations Stats', size: 'medium', position: { row: 1, col: 2 }, color: '#9B59B6', icon: '📊', refreshInterval: 120, visible: true, settings: {} },
        { id: 'w5', type: 'messages', title: 'Command Channel', size: 'medium', position: { row: 2, col: 0 }, color: '#1ABC9C', icon: '💬', refreshInterval: 30, visible: true, settings: {} },
        { id: 'w6', type: 'quick-actions', title: 'Command Actions', size: 'small', position: { row: 2, col: 2 }, color: '#E91E63', icon: '⚡', refreshInterval: 0, visible: true, settings: {} },
      ],
    });

    // Master JEDI Dashboard
    this.templates.set('master-jedi-default', {
      id: 'master-jedi-default',
      name: 'Master JEDI Dashboard',
      description: 'Supreme command center with full system oversight and strategic controls',
      role: 'master-jedi',
      icon: '🌟',
      color: ROLE_COLORS['master-jedi'].primary,
      columns: 4,
      rows: 6,
      isDefault: true,
      isCustom: false,
      createdAt: now,
      updatedAt: now,
      widgets: [
        { id: 'w1', type: 'jedi-status', title: 'Council Overview', size: 'full-width', position: { row: 0, col: 0 }, color: '#1ABC9C', icon: '🌟', refreshInterval: 60, visible: true, settings: {} },
        { id: 'w2', type: 'stats', title: 'Global Statistics', size: 'large', position: { row: 1, col: 0 }, color: '#3498DB', icon: '📊', refreshInterval: 120, visible: true, settings: {} },
        { id: 'w3', type: 'chart', title: 'Performance Trends', size: 'large', position: { row: 1, col: 2 }, color: '#9B59B6', icon: '📈', refreshInterval: 300, visible: true, settings: {} },
        { id: 'w4', type: 'alerts', title: 'Critical Alerts', size: 'medium', position: { row: 2, col: 0 }, color: '#E74C3C', icon: '🚨', refreshInterval: 30, visible: true, settings: {} },
        { id: 'w5', type: 'calendar', title: 'Council Calendar', size: 'medium', position: { row: 2, col: 2 }, color: '#F39C12', icon: '📅', refreshInterval: 300, visible: true, settings: {} },
      ],
    });

    // Patient Dashboard
    this.templates.set('patient-default', {
      id: 'patient-default',
      name: 'Patient Dashboard',
      description: 'Personal health dashboard with medications, appointments, and health tracking',
      role: 'patient',
      icon: '🏥',
      color: ROLE_COLORS.patient.primary,
      columns: 4,
      rows: 6,
      isDefault: true,
      isCustom: false,
      createdAt: now,
      updatedAt: now,
      widgets: [
        { id: 'w1', type: 'medications', title: 'My Medications', size: 'large', position: { row: 0, col: 0 }, color: '#E74C3C', icon: '💊', refreshInterval: 60, visible: true, settings: {} },
        { id: 'w2', type: 'calendar', title: 'Appointments', size: 'medium', position: { row: 0, col: 2 }, color: '#3498DB', icon: '📅', refreshInterval: 300, visible: true, settings: {} },
        { id: 'w3', type: 'vitals', title: 'My Vitals', size: 'medium', position: { row: 1, col: 0 }, color: '#27AE60', icon: '❤️', refreshInterval: 120, visible: true, settings: {} },
        { id: 'w4', type: 'messages', title: 'Messages', size: 'medium', position: { row: 1, col: 2 }, color: '#9B59B6', icon: '💬', refreshInterval: 60, visible: true, settings: {} },
        { id: 'w5', type: 'weather', title: 'Weather', size: 'small', position: { row: 2, col: 0 }, color: '#F39C12', icon: '☀️', refreshInterval: 1800, visible: true, settings: {} },
      ],
    });

    // Additional templates
    this.templates.set('doctor-compact', {
      id: 'doctor-compact',
      name: 'Doctor Compact View',
      description: 'Streamlined doctor dashboard for quick access',
      role: 'doctor',
      icon: '🩺',
      color: ROLE_COLORS.doctor.secondary,
      columns: 3,
      rows: 4,
      isDefault: false,
      isCustom: false,
      createdAt: now,
      updatedAt: now,
      widgets: [
        { id: 'w1', type: 'patients', title: 'Patients', size: 'medium', position: { row: 0, col: 0 }, color: '#3498DB', icon: '👥', refreshInterval: 300, visible: true, settings: {} },
        { id: 'w2', type: 'alerts', title: 'Alerts', size: 'medium', position: { row: 0, col: 1 }, color: '#E74C3C', icon: '🔔', refreshInterval: 60, visible: true, settings: {} },
        { id: 'w3', type: 'quick-actions', title: 'Actions', size: 'small', position: { row: 1, col: 0 }, color: '#1ABC9C', icon: '⚡', refreshInterval: 0, visible: true, settings: {} },
      ],
    });

    this.templates.set('nurse-mobile', {
      id: 'nurse-mobile',
      name: 'Nurse Mobile View',
      description: 'Mobile-optimized nurse dashboard',
      role: 'nurse',
      icon: '👩‍⚕️',
      color: ROLE_COLORS.nurse.secondary,
      columns: 2,
      rows: 4,
      isDefault: false,
      isCustom: false,
      createdAt: now,
      updatedAt: now,
      widgets: [
        { id: 'w1', type: 'medications', title: 'Meds', size: 'full-width', position: { row: 0, col: 0 }, color: '#E91E63', icon: '💊', refreshInterval: 60, visible: true, settings: {} },
        { id: 'w2', type: 'tasks', title: 'Tasks', size: 'medium', position: { row: 1, col: 0 }, color: '#3498DB', icon: '✓', refreshInterval: 120, visible: true, settings: {} },
        { id: 'w3', type: 'alerts', title: 'Alerts', size: 'medium', position: { row: 1, col: 1 }, color: '#E74C3C', icon: '🔔', refreshInterval: 30, visible: true, settings: {} },
      ],
    });

    this.applyTemplate('doctor-default');
  }

  getAllTemplates(): DashboardTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByRole(role: UserRole): DashboardTemplate[] {
    return this.getAllTemplates().filter(t => t.role === role);
  }

  getDefaultTemplateForRole(role: UserRole): DashboardTemplate | undefined {
    return this.getAllTemplates().find(t => t.role === role && t.isDefault);
  }

  getTemplate(id: string): DashboardTemplate | undefined {
    return this.templates.get(id);
  }

  applyTemplate(templateId: string): { success: boolean; widgetsApplied: number } {
    const template = this.templates.get(templateId);
    if (!template) {
      return { success: false, widgetsApplied: 0 };
    }

    this.activeWidgets.clear();
    template.widgets.forEach(widget => {
      this.activeWidgets.set(widget.id, { ...widget });
    });

    this.activeTemplateId = templateId;
    this.notifyListeners();

    return { success: true, widgetsApplied: template.widgets.length };
  }

  getActiveTemplate(): DashboardTemplate | null {
    if (!this.activeTemplateId) return null;
    return this.templates.get(this.activeTemplateId) || null;
  }

  getActiveWidgets(): DashboardWidget[] {
    return Array.from(this.activeWidgets.values());
  }

  duplicateTemplate(templateId: string, newName: string): DashboardTemplate | undefined {
    const original = this.templates.get(templateId);
    if (!original) return undefined;

    const newId = `custom-${Date.now()}`;
    const duplicate: DashboardTemplate = {
      ...original,
      id: newId,
      name: newName,
      isDefault: false,
      isCustom: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      widgets: original.widgets.map(w => ({ ...w, id: `${w.id}-${Date.now()}` })),
    };

    this.templates.set(newId, duplicate);
    return duplicate;
  }

  deleteTemplate(templateId: string): boolean {
    const template = this.templates.get(templateId);
    if (!template || template.isDefault) return false;
    return this.templates.delete(templateId);
  }

  addWidget(widget: Omit<DashboardWidget, 'id'>): DashboardWidget {
    const id = `widget-${Date.now()}`;
    const newWidget: DashboardWidget = { ...widget, id };
    this.activeWidgets.set(id, newWidget);
    this.notifyListeners();
    return newWidget;
  }

  updateWidget(widgetId: string, updates: Partial<Omit<DashboardWidget, 'id'>>): DashboardWidget | undefined {
    const widget = this.activeWidgets.get(widgetId);
    if (!widget) return undefined;

    const updated = { ...widget, ...updates };
    this.activeWidgets.set(widgetId, updated);
    this.notifyListeners();
    return updated;
  }

  removeWidget(widgetId: string): boolean {
    const removed = this.activeWidgets.delete(widgetId);
    if (removed) this.notifyListeners();
    return removed;
  }

  moveWidget(widgetId: string, position: WidgetPosition): boolean {
    const widget = this.activeWidgets.get(widgetId);
    if (!widget) return false;

    widget.position = position;
    this.activeWidgets.set(widgetId, widget);
    this.notifyListeners();
    return true;
  }

  resizeWidget(widgetId: string, size: WidgetSize): boolean {
    const widget = this.activeWidgets.get(widgetId);
    if (!widget) return false;

    widget.size = size;
    this.activeWidgets.set(widgetId, widget);
    this.notifyListeners();
    return true;
  }

  toggleWidgetVisibility(widgetId: string): boolean {
    const widget = this.activeWidgets.get(widgetId);
    if (!widget) return false;

    widget.visible = !widget.visible;
    this.activeWidgets.set(widgetId, widget);
    this.notifyListeners();
    return widget.visible;
  }

  saveAsTemplate(name: string, description: string, role: UserRole): DashboardTemplate {
    const id = `custom-${Date.now()}`;
    const template: DashboardTemplate = {
      id,
      name,
      description,
      role,
      icon: this.getRoleIcon(role),
      color: ROLE_COLORS[role].primary,
      widgets: Array.from(this.activeWidgets.values()),
      columns: 4,
      rows: 6,
      isDefault: false,
      isCustom: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.templates.set(id, template);
    return template;
  }

  private getRoleIcon(role: UserRole): string {
    const icons: Record<UserRole, string> = {
      doctor: '🩺',
      nurse: '👩‍⚕️',
      administrator: '👔',
      'jedi-commander': '⚔️',
      'master-jedi': '🌟',
      patient: '🏥',
      technician: '🔧',
      pharmacist: '💊',
    };
    return icons[role];
  }

  getTemplatePreview(templateId: string): TemplatePreview | undefined {
    const template = this.templates.get(templateId);
    if (!template) return undefined;

    const layout = this.generateLayoutPreview(template);

    return {
      id: template.id,
      name: template.name,
      role: template.role,
      icon: template.icon,
      color: template.color,
      widgetCount: template.widgets.length,
      layout,
      description: template.description,
    };
  }

  private generateLayoutPreview(template: DashboardTemplate): string {
    const grid: string[][] = Array(template.rows).fill(null).map(() => Array(template.columns).fill('·'));

    template.widgets.forEach((widget, idx) => {
      const char = String.fromCharCode(65 + idx);
      const width = widget.size === 'small' ? 1 : widget.size === 'medium' ? 2 : widget.size === 'full-width' ? template.columns : 2;
      const height = widget.size === 'small' ? 1 : 2;

      for (let r = widget.position.row; r < Math.min(widget.position.row + height, template.rows); r++) {
        for (let c = widget.position.col; c < Math.min(widget.position.col + width, template.columns); c++) {
          grid[r][c] = char;
        }
      }
    });

    return grid.map(row => row.join(' ')).join('\n');
  }

  getAllTemplatePreviews(): TemplatePreview[] {
    return this.getAllTemplates().map(t => this.getTemplatePreview(t.id)!).filter(Boolean);
  }

  getRoleColors(): Record<UserRole, RoleColorPalette> {
    return { ...ROLE_COLORS };
  }

  getColorForRole(role: UserRole): RoleColorPalette {
    return ROLE_COLORS[role];
  }

  getWidgetIcons(): Record<WidgetType, string> {
    return { ...WIDGET_ICONS };
  }

  getIconForWidget(type: WidgetType): string {
    return WIDGET_ICONS[type];
  }

  exportTemplate(templateId: string): string | undefined {
    const template = this.templates.get(templateId);
    if (!template) return undefined;

    const exportData = {
      name: template.name,
      description: template.description,
      role: template.role,
      icon: template.icon,
      color: template.color,
      widgets: template.widgets,
      columns: template.columns,
      rows: template.rows,
      isDefault: false,
    };

    return JSON.stringify(exportData, null, 2);
  }

  importTemplate(json: string): DashboardTemplate | undefined {
    try {
      const data = JSON.parse(json);
      const id = `imported-${Date.now()}`;

      const template: DashboardTemplate = {
        id,
        name: data.name || 'Imported Template',
        description: data.description || '',
        role: data.role || 'doctor',
        icon: data.icon || '📊',
        color: data.color || '#3498DB',
        widgets: (data.widgets || []).map((w: DashboardWidget, idx: number) => ({
          ...w,
          id: `${id}-w${idx}`,
        })),
        columns: data.columns || 4,
        rows: data.rows || 6,
        isDefault: false,
        isCustom: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      this.templates.set(id, template);
      return template;
    } catch {
      return undefined;
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const activeTemplate = this.getActiveTemplate();
    this.listeners.forEach(listener => listener(activeTemplate));
  }

  reset(): void {
    this.templates.clear();
    this.activeWidgets.clear();
    this.activeTemplateId = null;
    this.initializeDefaultTemplates();
    this.notifyListeners();
  }
}

export const dashboardWidgetTemplatesService = new DashboardWidgetTemplatesService();
