/**
 * Report Template Customization Service
 * Drag-and-drop custom report templates with sections
 * MediVac One v5.7
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  TEMPLATES: 'medivac_report_templates',
  SECTIONS: 'medivac_report_sections',
};

// Types
export type SectionType = 
  | 'header'
  | 'summary'
  | 'chart'
  | 'table'
  | 'text'
  | 'metrics'
  | 'timeline'
  | 'list'
  | 'divider'
  | 'footer';

export type ChartType = 'bar' | 'line' | 'pie' | 'donut' | 'area';
export type DataSource = 'compliance' | 'incidents' | 'drills' | 'smtp' | 'analytics' | 'custom';

export interface ReportSection {
  id: string;
  type: SectionType;
  title: string;
  description?: string;
  order: number;
  visible: boolean;
  config: SectionConfig;
}

export interface SectionConfig {
  // Header/Footer
  logoUrl?: string;
  companyName?: string;
  subtitle?: string;
  showDate?: boolean;
  showPageNumbers?: boolean;
  
  // Summary
  summaryType?: 'executive' | 'technical' | 'brief';
  maxLength?: number;
  
  // Chart
  chartType?: ChartType;
  dataSource?: DataSource;
  dateRange?: string;
  showLegend?: boolean;
  showLabels?: boolean;
  colors?: string[];
  
  // Table
  columns?: TableColumn[];
  maxRows?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  
  // Text
  content?: string;
  fontSize?: number;
  alignment?: 'left' | 'center' | 'right';
  
  // Metrics
  metrics?: MetricConfig[];
  layout?: 'grid' | 'row' | 'column';
  
  // Timeline
  eventTypes?: string[];
  maxEvents?: number;
  
  // List
  listType?: 'bullet' | 'numbered' | 'checklist';
  items?: string[];
  
  // Divider
  style?: 'solid' | 'dashed' | 'dotted';
  thickness?: number;
  color?: string;
}

export interface TableColumn {
  id: string;
  header: string;
  field: string;
  width?: number;
  alignment?: 'left' | 'center' | 'right';
}

export interface MetricConfig {
  id: string;
  label: string;
  field: string;
  format?: 'number' | 'percentage' | 'currency' | 'duration';
  icon?: string;
  color?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'compliance' | 'security' | 'analytics' | 'audit' | 'custom';
  isDefault: boolean;
  sections: ReportSection[];
  styling: TemplateStyling;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface TemplateStyling {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  headerSize: number;
  bodySize: number;
  pageMargin: number;
  sectionSpacing: number;
}

// Available section library
export const SECTION_LIBRARY: Record<SectionType, {
  label: string;
  icon: string;
  description: string;
  defaultConfig: SectionConfig;
}> = {
  header: {
    label: 'Header',
    icon: 'doc.text.fill',
    description: 'Report title, logo, and date',
    defaultConfig: {
      showDate: true,
      companyName: 'MediVac One',
    },
  },
  summary: {
    label: 'Executive Summary',
    icon: 'list.clipboard.fill',
    description: 'High-level overview of key findings',
    defaultConfig: {
      summaryType: 'executive',
      maxLength: 500,
    },
  },
  chart: {
    label: 'Chart',
    icon: 'chart.bar.fill',
    description: 'Visual data representation',
    defaultConfig: {
      chartType: 'bar',
      dataSource: 'analytics',
      showLegend: true,
      showLabels: true,
    },
  },
  table: {
    label: 'Data Table',
    icon: 'rectangle.3.group.fill',
    description: 'Tabular data display',
    defaultConfig: {
      maxRows: 20,
      sortOrder: 'desc',
    },
  },
  text: {
    label: 'Text Block',
    icon: 'doc.fill',
    description: 'Custom text content',
    defaultConfig: {
      fontSize: 12,
      alignment: 'left',
    },
  },
  metrics: {
    label: 'Key Metrics',
    icon: 'chart.line.uptrend.xyaxis',
    description: 'Important numbers and KPIs',
    defaultConfig: {
      layout: 'grid',
      metrics: [],
    },
  },
  timeline: {
    label: 'Timeline',
    icon: 'calendar',
    description: 'Chronological event display',
    defaultConfig: {
      maxEvents: 10,
    },
  },
  list: {
    label: 'List',
    icon: 'list.bullet',
    description: 'Bullet or numbered list',
    defaultConfig: {
      listType: 'bullet',
      items: [],
    },
  },
  divider: {
    label: 'Divider',
    icon: 'minus',
    description: 'Visual separator',
    defaultConfig: {
      style: 'solid',
      thickness: 1,
      color: '#E5E7EB',
    },
  },
  footer: {
    label: 'Footer',
    icon: 'doc.text.fill',
    description: 'Page numbers and disclaimers',
    defaultConfig: {
      showPageNumbers: true,
    },
  },
};

// Default templates
const DEFAULT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'tpl_compliance_standard',
    name: 'Compliance Report',
    description: 'Standard compliance summary with metrics and findings',
    category: 'compliance',
    isDefault: true,
    sections: [
      { id: 's1', type: 'header', title: 'Report Header', order: 0, visible: true, config: { showDate: true, companyName: 'MediVac One' } },
      { id: 's2', type: 'summary', title: 'Executive Summary', order: 1, visible: true, config: { summaryType: 'executive', maxLength: 500 } },
      { id: 's3', type: 'metrics', title: 'Key Metrics', order: 2, visible: true, config: { layout: 'grid', metrics: [
        { id: 'm1', label: 'Compliance Score', field: 'complianceScore', format: 'percentage', color: '#10B981' },
        { id: 'm2', label: 'Issues Found', field: 'issuesCount', format: 'number', color: '#EF4444' },
        { id: 'm3', label: 'Resolved', field: 'resolvedCount', format: 'number', color: '#3B82F6' },
      ] } },
      { id: 's4', type: 'chart', title: 'Compliance Trend', order: 3, visible: true, config: { chartType: 'line', dataSource: 'compliance', showLegend: true } },
      { id: 's5', type: 'table', title: 'Findings', order: 4, visible: true, config: { maxRows: 20, columns: [
        { id: 'c1', header: 'Finding', field: 'title', width: 200 },
        { id: 'c2', header: 'Severity', field: 'severity', width: 100 },
        { id: 'c3', header: 'Status', field: 'status', width: 100 },
      ] } },
      { id: 's6', type: 'footer', title: 'Footer', order: 5, visible: true, config: { showPageNumbers: true } },
    ],
    styling: {
      primaryColor: '#1E40AF',
      secondaryColor: '#3B82F6',
      accentColor: '#10B981',
      fontFamily: 'Inter',
      headerSize: 24,
      bodySize: 12,
      pageMargin: 40,
      sectionSpacing: 20,
    },
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  },
  {
    id: 'tpl_security_incident',
    name: 'Security Incident Report',
    description: 'Detailed incident analysis and response summary',
    category: 'security',
    isDefault: false,
    sections: [
      { id: 's1', type: 'header', title: 'Report Header', order: 0, visible: true, config: { showDate: true } },
      { id: 's2', type: 'summary', title: 'Incident Overview', order: 1, visible: true, config: { summaryType: 'technical', maxLength: 800 } },
      { id: 's3', type: 'timeline', title: 'Incident Timeline', order: 2, visible: true, config: { maxEvents: 20 } },
      { id: 's4', type: 'metrics', title: 'Impact Assessment', order: 3, visible: true, config: { layout: 'row' } },
      { id: 's5', type: 'table', title: 'Affected Systems', order: 4, visible: true, config: { maxRows: 50 } },
      { id: 's6', type: 'text', title: 'Recommendations', order: 5, visible: true, config: { alignment: 'left' } },
      { id: 's7', type: 'footer', title: 'Footer', order: 6, visible: true, config: { showPageNumbers: true } },
    ],
    styling: {
      primaryColor: '#DC2626',
      secondaryColor: '#EF4444',
      accentColor: '#F59E0B',
      fontFamily: 'Inter',
      headerSize: 24,
      bodySize: 12,
      pageMargin: 40,
      sectionSpacing: 20,
    },
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  },
  {
    id: 'tpl_analytics_dashboard',
    name: 'Analytics Dashboard',
    description: 'Visual analytics with charts and trends',
    category: 'analytics',
    isDefault: false,
    sections: [
      { id: 's1', type: 'header', title: 'Dashboard Header', order: 0, visible: true, config: { showDate: true } },
      { id: 's2', type: 'metrics', title: 'Key Performance Indicators', order: 1, visible: true, config: { layout: 'grid' } },
      { id: 's3', type: 'chart', title: 'Trend Analysis', order: 2, visible: true, config: { chartType: 'area', showLegend: true } },
      { id: 's4', type: 'chart', title: 'Distribution', order: 3, visible: true, config: { chartType: 'pie', showLabels: true } },
      { id: 's5', type: 'table', title: 'Top Items', order: 4, visible: true, config: { maxRows: 10 } },
      { id: 's6', type: 'footer', title: 'Footer', order: 5, visible: true, config: { showPageNumbers: true } },
    ],
    styling: {
      primaryColor: '#7C3AED',
      secondaryColor: '#A78BFA',
      accentColor: '#10B981',
      fontFamily: 'Inter',
      headerSize: 28,
      bodySize: 12,
      pageMargin: 30,
      sectionSpacing: 24,
    },
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  },
];

class ReportTemplateService {
  private templates: ReportTemplate[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TEMPLATES);
      this.templates = data ? JSON.parse(data) : DEFAULT_TEMPLATES;

      if (this.templates.length === 0) {
        this.templates = DEFAULT_TEMPLATES;
        await this.saveTemplates();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize report template service:', error);
      this.templates = DEFAULT_TEMPLATES;
      this.initialized = true;
    }
  }

  private async saveTemplates(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(this.templates));
    } catch (error) {
      console.error('Failed to save templates:', error);
    }
  }

  // Get all templates
  getTemplates(): ReportTemplate[] {
    return [...this.templates].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  // Get template by ID
  getTemplate(id: string): ReportTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  // Get templates by category
  getTemplatesByCategory(category: string): ReportTemplate[] {
    return this.templates.filter(t => t.category === category);
  }

  // Create new template
  async createTemplate(template: Omit<ReportTemplate, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<ReportTemplate> {
    await this.initialize();

    const newTemplate: ReportTemplate = {
      ...template,
      id: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.templates.push(newTemplate);
    await this.saveTemplates();

    return newTemplate;
  }

  // Update template
  async updateTemplate(id: string, updates: Partial<ReportTemplate>): Promise<ReportTemplate | null> {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) return null;

    this.templates[index] = {
      ...this.templates[index],
      ...updates,
      version: this.templates[index].version + 1,
      updatedAt: new Date().toISOString(),
    };

    await this.saveTemplates();
    return this.templates[index];
  }

  // Delete template
  async deleteTemplate(id: string): Promise<boolean> {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) return false;

    // Don't delete default templates
    if (this.templates[index].isDefault) return false;

    this.templates.splice(index, 1);
    await this.saveTemplates();

    return true;
  }

  // Duplicate template
  async duplicateTemplate(id: string, newName: string): Promise<ReportTemplate | null> {
    const template = this.getTemplate(id);
    if (!template) return null;

    const duplicate: ReportTemplate = {
      ...template,
      id: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: newName,
      isDefault: false,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sections: template.sections.map(s => ({
        ...s,
        id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      })),
    };

    this.templates.push(duplicate);
    await this.saveTemplates();

    return duplicate;
  }

  // Section management
  async addSection(templateId: string, sectionType: SectionType, afterSectionId?: string): Promise<ReportSection | null> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) return null;

    const sectionConfig = SECTION_LIBRARY[sectionType];
    const newSection: ReportSection = {
      id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      type: sectionType,
      title: sectionConfig.label,
      order: template.sections.length,
      visible: true,
      config: { ...sectionConfig.defaultConfig },
    };

    if (afterSectionId) {
      const afterIndex = template.sections.findIndex(s => s.id === afterSectionId);
      if (afterIndex !== -1) {
        template.sections.splice(afterIndex + 1, 0, newSection);
        // Reorder
        template.sections.forEach((s, i) => s.order = i);
      } else {
        template.sections.push(newSection);
      }
    } else {
      template.sections.push(newSection);
    }

    template.updatedAt = new Date().toISOString();
    template.version++;
    await this.saveTemplates();

    return newSection;
  }

  async updateSection(templateId: string, sectionId: string, updates: Partial<ReportSection>): Promise<ReportSection | null> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) return null;

    const sectionIndex = template.sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return null;

    template.sections[sectionIndex] = {
      ...template.sections[sectionIndex],
      ...updates,
    };

    template.updatedAt = new Date().toISOString();
    template.version++;
    await this.saveTemplates();

    return template.sections[sectionIndex];
  }

  async removeSection(templateId: string, sectionId: string): Promise<boolean> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) return false;

    const sectionIndex = template.sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return false;

    template.sections.splice(sectionIndex, 1);
    template.sections.forEach((s, i) => s.order = i);

    template.updatedAt = new Date().toISOString();
    template.version++;
    await this.saveTemplates();

    return true;
  }

  async reorderSections(templateId: string, sectionIds: string[]): Promise<boolean> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) return false;

    const reorderedSections: ReportSection[] = [];
    for (let i = 0; i < sectionIds.length; i++) {
      const section = template.sections.find(s => s.id === sectionIds[i]);
      if (section) {
        section.order = i;
        reorderedSections.push(section);
      }
    }

    template.sections = reorderedSections;
    template.updatedAt = new Date().toISOString();
    template.version++;
    await this.saveTemplates();

    return true;
  }

  // Preview template
  generatePreview(templateId: string): Record<string, unknown> {
    const template = this.getTemplate(templateId);
    if (!template) throw new Error('Template not found');

    return {
      template,
      sections: template.sections.filter(s => s.visible).sort((a, b) => a.order - b.order),
      styling: template.styling,
      generatedAt: new Date().toISOString(),
    };
  }

  // Export/Import
  exportTemplate(id: string): string {
    const template = this.getTemplate(id);
    if (!template) throw new Error('Template not found');

    return JSON.stringify({
      template,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }, null, 2);
  }

  async importTemplate(jsonData: string): Promise<ReportTemplate> {
    const data = JSON.parse(jsonData);
    const template = data.template as ReportTemplate;

    // Generate new ID
    template.id = `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    template.name = `${template.name} (Imported)`;
    template.isDefault = false;
    template.createdAt = new Date().toISOString();
    template.updatedAt = new Date().toISOString();

    // Generate new section IDs
    template.sections = template.sections.map(s => ({
      ...s,
      id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    }));

    this.templates.push(template);
    await this.saveTemplates();

    return template;
  }

  // Get section library
  getSectionLibrary(): typeof SECTION_LIBRARY {
    return SECTION_LIBRARY;
  }

  // Statistics
  getStatistics(): {
    totalTemplates: number;
    byCategory: Record<string, number>;
    customTemplates: number;
    defaultTemplates: number;
  } {
    const stats = {
      totalTemplates: this.templates.length,
      byCategory: {} as Record<string, number>,
      customTemplates: 0,
      defaultTemplates: 0,
    };

    for (const template of this.templates) {
      stats.byCategory[template.category] = (stats.byCategory[template.category] || 0) + 1;
      if (template.isDefault) {
        stats.defaultTemplates++;
      } else {
        stats.customTemplates++;
      }
    }

    return stats;
  }
}

export const reportTemplateService = new ReportTemplateService();
