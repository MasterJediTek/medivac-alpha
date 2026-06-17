/**
 * Crash Report Template Service
 * Pre-defined annotation templates for faster forum posting
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export type TemplateCategory = 
  | 'ui_crash'
  | 'network_error'
  | 'memory_issue'
  | 'database_error'
  | 'authentication_failure'
  | 'permission_denied'
  | 'api_failure'
  | 'rendering_error'
  | 'navigation_crash'
  | 'general';

export type AnnotationType = 'arrow' | 'circle' | 'rectangle' | 'text' | 'highlight' | 'blur';

export interface TemplateAnnotation {
  id: string;
  type: AnnotationType;
  relativeX: number; // 0-100 percentage
  relativeY: number; // 0-100 percentage
  width?: number;
  height?: number;
  endX?: number;
  endY?: number;
  color: string;
  strokeWidth: number;
  text?: string;
  fontSize?: number;
  label: string; // Description of what this annotation highlights
}

export interface CrashReportTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  annotations: TemplateAnnotation[];
  forumTitle: string;
  forumBodyTemplate: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  targetForums: ('high_council' | 'jedi_masters' | 'engineering' | 'clinical' | 'security')[];
  tags: string[];
  isBuiltIn: boolean;
  isShared: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  lastUsed?: string;
}

export interface TemplateApplication {
  id: string;
  templateId: string;
  crashId: string;
  screenshotId: string;
  appliedAnnotations: TemplateAnnotation[];
  customizations: Record<string, any>;
  appliedAt: string;
  appliedBy: string;
}

export interface TemplateAnalytics {
  totalTemplates: number;
  totalApplications: number;
  byCategory: Record<TemplateCategory, { templates: number; applications: number }>;
  mostUsedTemplates: { templateId: string; name: string; usageCount: number }[];
  averageTimeToApply: number;
  templateEfficiency: number; // Percentage of crashes using templates
}

export interface AutoSuggestion {
  templateId: string;
  template: CrashReportTemplate;
  confidence: number;
  matchedCriteria: string[];
}

// Storage keys
const STORAGE_KEYS = {
  TEMPLATES: '@medivac_crash_templates',
  APPLICATIONS: '@medivac_template_applications',
};

// Default templates
const DEFAULT_TEMPLATES: Omit<CrashReportTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>[] = [
  {
    name: 'UI Crash - Button Not Responding',
    description: 'Template for crashes caused by unresponsive UI buttons',
    category: 'ui_crash',
    annotations: [
      {
        id: 'ann_1',
        type: 'circle',
        relativeX: 50,
        relativeY: 50,
        width: 20,
        height: 20,
        color: '#FF0000',
        strokeWidth: 3,
        label: 'Unresponsive button location',
      },
      {
        id: 'ann_2',
        type: 'arrow',
        relativeX: 70,
        relativeY: 50,
        endX: 55,
        endY: 50,
        color: '#FF0000',
        strokeWidth: 2,
        label: 'Points to crash trigger',
      },
      {
        id: 'ann_3',
        type: 'text',
        relativeX: 75,
        relativeY: 48,
        color: '#FF0000',
        strokeWidth: 1,
        text: 'Crash trigger',
        fontSize: 14,
        label: 'Label for crash location',
      },
    ],
    forumTitle: '[UI CRASH] Button Not Responding - {{screenName}}',
    forumBodyTemplate: `## Crash Report: UI Button Unresponsive

**Screen:** {{screenName}}
**Device:** {{deviceModel}} ({{osVersion}})
**App Version:** {{appVersion}}
**Timestamp:** {{timestamp}}

### Description
A button on the {{screenName}} screen became unresponsive, causing the app to crash.

### Steps to Reproduce
1. Navigate to {{screenName}}
2. Tap the indicated button
3. App becomes unresponsive and crashes

### Stack Trace
\`\`\`
{{stackTrace}}
\`\`\`

### Screenshot
See attached annotated screenshot.

### Suggested Fix
Check event handler binding and ensure proper state management.`,
    severity: 'high',
    targetForums: ['jedi_masters', 'engineering'],
    tags: ['ui', 'button', 'unresponsive', 'crash'],
    isBuiltIn: true,
    isShared: true,
    createdBy: 'system',
  },
  {
    name: 'Network Error - API Timeout',
    description: 'Template for crashes caused by API request timeouts',
    category: 'network_error',
    annotations: [
      {
        id: 'ann_1',
        type: 'rectangle',
        relativeX: 10,
        relativeY: 30,
        width: 80,
        height: 40,
        color: '#FF6600',
        strokeWidth: 2,
        label: 'Loading/error state area',
      },
      {
        id: 'ann_2',
        type: 'text',
        relativeX: 50,
        relativeY: 75,
        color: '#FF6600',
        strokeWidth: 1,
        text: 'Network timeout occurred here',
        fontSize: 12,
        label: 'Timeout description',
      },
    ],
    forumTitle: '[NETWORK] API Timeout - {{endpoint}}',
    forumBodyTemplate: `## Crash Report: API Request Timeout

**Endpoint:** {{endpoint}}
**Device:** {{deviceModel}} ({{osVersion}})
**Network Type:** {{networkType}}
**App Version:** {{appVersion}}
**Timestamp:** {{timestamp}}

### Description
An API request to {{endpoint}} timed out after {{timeoutDuration}}ms, causing the app to crash or enter an error state.

### Request Details
- Method: {{requestMethod}}
- URL: {{requestUrl}}
- Timeout: {{timeoutDuration}}ms

### Network Conditions
- Type: {{networkType}}
- Signal Strength: {{signalStrength}}

### Stack Trace
\`\`\`
{{stackTrace}}
\`\`\`

### Screenshot
See attached annotated screenshot.

### Suggested Fix
Implement proper timeout handling and retry logic with exponential backoff.`,
    severity: 'medium',
    targetForums: ['jedi_masters', 'engineering'],
    tags: ['network', 'api', 'timeout', 'connection'],
    isBuiltIn: true,
    isShared: true,
    createdBy: 'system',
  },
  {
    name: 'Memory Issue - Out of Memory',
    description: 'Template for crashes caused by memory exhaustion',
    category: 'memory_issue',
    annotations: [
      {
        id: 'ann_1',
        type: 'highlight',
        relativeX: 0,
        relativeY: 0,
        width: 100,
        height: 100,
        color: '#FF000033',
        strokeWidth: 0,
        label: 'Memory-intensive screen',
      },
      {
        id: 'ann_2',
        type: 'text',
        relativeX: 50,
        relativeY: 10,
        color: '#FF0000',
        strokeWidth: 1,
        text: '⚠️ HIGH MEMORY USAGE',
        fontSize: 16,
        label: 'Memory warning',
      },
    ],
    forumTitle: '[CRITICAL] Out of Memory - {{screenName}}',
    forumBodyTemplate: `## Crash Report: Out of Memory

**Screen:** {{screenName}}
**Device:** {{deviceModel}} ({{osVersion}})
**Available RAM:** {{availableRam}}
**App Memory:** {{appMemory}}
**App Version:** {{appVersion}}
**Timestamp:** {{timestamp}}

### Description
The app ran out of memory while on {{screenName}}, causing an immediate crash.

### Memory Stats
- Device Total RAM: {{totalRam}}
- Available at Crash: {{availableRam}}
- App Usage: {{appMemory}}
- Peak Usage: {{peakMemory}}

### Possible Causes
- Large image loading
- Memory leaks in component lifecycle
- Excessive data caching

### Stack Trace
\`\`\`
{{stackTrace}}
\`\`\`

### Screenshot
See attached annotated screenshot.

### Suggested Fix
Profile memory usage, implement image lazy loading, and review component cleanup.`,
    severity: 'critical',
    targetForums: ['high_council', 'jedi_masters', 'engineering'],
    tags: ['memory', 'oom', 'critical', 'performance'],
    isBuiltIn: true,
    isShared: true,
    createdBy: 'system',
  },
  {
    name: 'Database Error - Query Failure',
    description: 'Template for crashes caused by database query failures',
    category: 'database_error',
    annotations: [
      {
        id: 'ann_1',
        type: 'rectangle',
        relativeX: 5,
        relativeY: 20,
        width: 90,
        height: 60,
        color: '#9900FF',
        strokeWidth: 2,
        label: 'Data display area',
      },
      {
        id: 'ann_2',
        type: 'text',
        relativeX: 50,
        relativeY: 85,
        color: '#9900FF',
        strokeWidth: 1,
        text: 'Database query failed',
        fontSize: 12,
        label: 'Error description',
      },
    ],
    forumTitle: '[DATABASE] Query Failure - {{tableName}}',
    forumBodyTemplate: `## Crash Report: Database Query Failure

**Table/Collection:** {{tableName}}
**Query Type:** {{queryType}}
**Device:** {{deviceModel}} ({{osVersion}})
**App Version:** {{appVersion}}
**Timestamp:** {{timestamp}}

### Description
A database query to {{tableName}} failed, causing the app to crash.

### Query Details
- Type: {{queryType}}
- Table: {{tableName}}
- Error Code: {{errorCode}}
- Error Message: {{errorMessage}}

### Database State
- Connection Status: {{connectionStatus}}
- Last Successful Query: {{lastSuccessfulQuery}}

### Stack Trace
\`\`\`
{{stackTrace}}
\`\`\`

### Screenshot
See attached annotated screenshot.

### Suggested Fix
Review query syntax, check database connection, and implement proper error handling.`,
    severity: 'high',
    targetForums: ['jedi_masters', 'engineering'],
    tags: ['database', 'query', 'sql', 'data'],
    isBuiltIn: true,
    isShared: true,
    createdBy: 'system',
  },
  {
    name: 'Authentication Failure - Token Expired',
    description: 'Template for crashes caused by expired authentication tokens',
    category: 'authentication_failure',
    annotations: [
      {
        id: 'ann_1',
        type: 'circle',
        relativeX: 50,
        relativeY: 15,
        width: 15,
        height: 15,
        color: '#FF0000',
        strokeWidth: 2,
        label: 'User profile/auth indicator',
      },
      {
        id: 'ann_2',
        type: 'text',
        relativeX: 50,
        relativeY: 50,
        color: '#FF0000',
        strokeWidth: 1,
        text: 'Session expired - Auth failure',
        fontSize: 14,
        label: 'Auth error message',
      },
    ],
    forumTitle: '[AUTH] Token Expired - Session Invalidated',
    forumBodyTemplate: `## Crash Report: Authentication Token Expired

**User ID:** {{userId}}
**Auth Provider:** {{authProvider}}
**Device:** {{deviceModel}} ({{osVersion}})
**App Version:** {{appVersion}}
**Timestamp:** {{timestamp}}

### Description
The user's authentication token expired, and the app failed to refresh it properly, causing a crash.

### Auth Details
- Provider: {{authProvider}}
- Token Type: {{tokenType}}
- Token Expiry: {{tokenExpiry}}
- Refresh Attempted: {{refreshAttempted}}

### Session Info
- Session Start: {{sessionStart}}
- Last Activity: {{lastActivity}}

### Stack Trace
\`\`\`
{{stackTrace}}
\`\`\`

### Screenshot
See attached annotated screenshot.

### Suggested Fix
Implement proper token refresh flow and graceful session expiry handling.`,
    severity: 'medium',
    targetForums: ['jedi_masters', 'security'],
    tags: ['auth', 'token', 'session', 'security'],
    isBuiltIn: true,
    isShared: true,
    createdBy: 'system',
  },
  {
    name: 'Navigation Crash - Invalid Route',
    description: 'Template for crashes caused by navigation to invalid routes',
    category: 'navigation_crash',
    annotations: [
      {
        id: 'ann_1',
        type: 'arrow',
        relativeX: 50,
        relativeY: 90,
        endX: 50,
        endY: 50,
        color: '#FF0000',
        strokeWidth: 3,
        label: 'Navigation trigger',
      },
      {
        id: 'ann_2',
        type: 'text',
        relativeX: 50,
        relativeY: 95,
        color: '#FF0000',
        strokeWidth: 1,
        text: 'Invalid route navigation',
        fontSize: 12,
        label: 'Navigation error',
      },
    ],
    forumTitle: '[NAVIGATION] Invalid Route - {{routeName}}',
    forumBodyTemplate: `## Crash Report: Navigation to Invalid Route

**Target Route:** {{routeName}}
**Source Screen:** {{sourceScreen}}
**Device:** {{deviceModel}} ({{osVersion}})
**App Version:** {{appVersion}}
**Timestamp:** {{timestamp}}

### Description
The app attempted to navigate to an invalid or undefined route, causing a crash.

### Navigation Details
- Source: {{sourceScreen}}
- Target: {{routeName}}
- Params: {{navigationParams}}
- Navigation Type: {{navigationType}}

### Route Stack
\`\`\`
{{routeStack}}
\`\`\`

### Stack Trace
\`\`\`
{{stackTrace}}
\`\`\`

### Screenshot
See attached annotated screenshot.

### Suggested Fix
Verify route registration and implement navigation error boundaries.`,
    severity: 'high',
    targetForums: ['jedi_masters', 'engineering'],
    tags: ['navigation', 'route', 'router', 'crash'],
    isBuiltIn: true,
    isShared: true,
    createdBy: 'system',
  },
  {
    name: 'Rendering Error - Component Crash',
    description: 'Template for crashes caused by React component rendering errors',
    category: 'rendering_error',
    annotations: [
      {
        id: 'ann_1',
        type: 'rectangle',
        relativeX: 10,
        relativeY: 20,
        width: 80,
        height: 60,
        color: '#FF0000',
        strokeWidth: 2,
        label: 'Crashed component area',
      },
      {
        id: 'ann_2',
        type: 'text',
        relativeX: 50,
        relativeY: 50,
        color: '#FFFFFF',
        strokeWidth: 1,
        text: 'Component render failed',
        fontSize: 14,
        label: 'Render error',
      },
    ],
    forumTitle: '[RENDER] Component Crash - {{componentName}}',
    forumBodyTemplate: `## Crash Report: Component Rendering Error

**Component:** {{componentName}}
**Screen:** {{screenName}}
**Device:** {{deviceModel}} ({{osVersion}})
**App Version:** {{appVersion}}
**Timestamp:** {{timestamp}}

### Description
A React component failed to render properly, causing the app to crash.

### Component Details
- Name: {{componentName}}
- Props: {{componentProps}}
- State: {{componentState}}

### Error Boundary Info
- Caught By: {{errorBoundary}}
- Fallback Shown: {{fallbackShown}}

### Stack Trace
\`\`\`
{{stackTrace}}
\`\`\`

### Screenshot
See attached annotated screenshot.

### Suggested Fix
Review component props validation and implement proper error boundaries.`,
    severity: 'high',
    targetForums: ['jedi_masters', 'engineering'],
    tags: ['render', 'component', 'react', 'ui'],
    isBuiltIn: true,
    isShared: true,
    createdBy: 'system',
  },
  {
    name: 'API Failure - Server Error 500',
    description: 'Template for crashes caused by server-side errors',
    category: 'api_failure',
    annotations: [
      {
        id: 'ann_1',
        type: 'rectangle',
        relativeX: 20,
        relativeY: 30,
        width: 60,
        height: 30,
        color: '#FF6600',
        strokeWidth: 2,
        label: 'Error message display',
      },
      {
        id: 'ann_2',
        type: 'text',
        relativeX: 50,
        relativeY: 70,
        color: '#FF6600',
        strokeWidth: 1,
        text: '500 Internal Server Error',
        fontSize: 14,
        label: 'Server error indicator',
      },
    ],
    forumTitle: '[API] Server Error 500 - {{endpoint}}',
    forumBodyTemplate: `## Crash Report: Server Error 500

**Endpoint:** {{endpoint}}
**Device:** {{deviceModel}} ({{osVersion}})
**App Version:** {{appVersion}}
**Timestamp:** {{timestamp}}

### Description
The server returned a 500 Internal Server Error, and the app failed to handle it gracefully.

### Request Details
- Method: {{requestMethod}}
- URL: {{requestUrl}}
- Status: 500
- Response Time: {{responseTime}}ms

### Request Body
\`\`\`json
{{requestBody}}
\`\`\`

### Response Body
\`\`\`json
{{responseBody}}
\`\`\`

### Stack Trace
\`\`\`
{{stackTrace}}
\`\`\`

### Screenshot
See attached annotated screenshot.

### Suggested Fix
Implement proper error handling for server errors and show user-friendly error messages.`,
    severity: 'high',
    targetForums: ['jedi_masters', 'engineering'],
    tags: ['api', 'server', '500', 'error'],
    isBuiltIn: true,
    isShared: true,
    createdBy: 'system',
  },
];

// Event types
type TemplateEventType = 
  | 'template_created'
  | 'template_updated'
  | 'template_deleted'
  | 'template_applied'
  | 'template_shared';

type TemplateEventCallback = (data: any) => void;

class CrashReportTemplateService {
  private templates: CrashReportTemplate[] = [];
  private applications: TemplateApplication[] = [];
  private listeners: Map<TemplateEventType, Set<TemplateEventCallback>> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.loadData();
    this.initializeDefaultTemplates();
    this.initialized = true;
  }

  private async loadData(): Promise<void> {
    try {
      const [templatesData, applicationsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TEMPLATES),
        AsyncStorage.getItem(STORAGE_KEYS.APPLICATIONS),
      ]);

      if (templatesData) this.templates = JSON.parse(templatesData);
      if (applicationsData) this.applications = JSON.parse(applicationsData);
    } catch (error) {
      console.error('Failed to load template data:', error);
    }
  }

  private async saveData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(this.templates)),
        AsyncStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(this.applications)),
      ]);
    } catch (error) {
      console.error('Failed to save template data:', error);
    }
  }

  private initializeDefaultTemplates(): void {
    const existingBuiltIn = this.templates.filter(t => t.isBuiltIn);
    if (existingBuiltIn.length === 0) {
      const now = new Date().toISOString();
      const defaultTemplates: CrashReportTemplate[] = DEFAULT_TEMPLATES.map((t, index) => ({
        ...t,
        id: `template_builtin_${index + 1}`,
        createdAt: now,
        updatedAt: now,
        usageCount: 0,
      }));

      this.templates = [...this.templates, ...defaultTemplates];
      this.saveData();
    }
  }

  // Event handling
  on(event: TemplateEventType, callback: TemplateEventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: TemplateEventType, callback: TemplateEventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: TemplateEventType, data: any): void {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  // Template CRUD
  async getTemplates(filter?: { category?: TemplateCategory; isBuiltIn?: boolean; isShared?: boolean }): Promise<CrashReportTemplate[]> {
    let result = [...this.templates];

    if (filter?.category) {
      result = result.filter(t => t.category === filter.category);
    }
    if (filter?.isBuiltIn !== undefined) {
      result = result.filter(t => t.isBuiltIn === filter.isBuiltIn);
    }
    if (filter?.isShared !== undefined) {
      result = result.filter(t => t.isShared === filter.isShared);
    }

    return result.sort((a, b) => b.usageCount - a.usageCount);
  }

  async getTemplate(templateId: string): Promise<CrashReportTemplate | null> {
    return this.templates.find(t => t.id === templateId) || null;
  }

  async createTemplate(
    template: Omit<CrashReportTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'isBuiltIn'>
  ): Promise<CrashReportTemplate> {
    const now = new Date().toISOString();
    const newTemplate: CrashReportTemplate = {
      ...template,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
      isBuiltIn: false,
    };

    this.templates.push(newTemplate);
    await this.saveData();
    this.emit('template_created', newTemplate);

    return newTemplate;
  }

  async updateTemplate(templateId: string, updates: Partial<CrashReportTemplate>): Promise<CrashReportTemplate | null> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) return null;

    // Don't allow updating built-in templates
    if (template.isBuiltIn && !updates.usageCount && !updates.lastUsed) {
      return null;
    }

    Object.assign(template, updates, { updatedAt: new Date().toISOString() });
    await this.saveData();
    this.emit('template_updated', template);

    return template;
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    const index = this.templates.findIndex(t => t.id === templateId);
    if (index === -1) return false;

    const template = this.templates[index];
    if (template.isBuiltIn) return false; // Can't delete built-in templates

    this.templates.splice(index, 1);
    await this.saveData();
    this.emit('template_deleted', { templateId });

    return true;
  }

  // Template application
  async applyTemplate(
    templateId: string,
    crashId: string,
    screenshotId: string,
    appliedBy: string,
    customizations?: Record<string, any>
  ): Promise<TemplateApplication | null> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) return null;

    const application: TemplateApplication = {
      id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateId,
      crashId,
      screenshotId,
      appliedAnnotations: template.annotations.map(a => ({ ...a })),
      customizations: customizations || {},
      appliedAt: new Date().toISOString(),
      appliedBy,
    };

    // Update template usage stats
    template.usageCount++;
    template.lastUsed = application.appliedAt;

    this.applications.push(application);
    await this.saveData();
    this.emit('template_applied', { application, template });

    return application;
  }

  async getApplications(filter?: { templateId?: string; crashId?: string }): Promise<TemplateApplication[]> {
    let result = [...this.applications];

    if (filter?.templateId) {
      result = result.filter(a => a.templateId === filter.templateId);
    }
    if (filter?.crashId) {
      result = result.filter(a => a.crashId === filter.crashId);
    }

    return result.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
  }

  // Auto-suggestion
  async suggestTemplates(crashInfo: {
    errorType?: string;
    errorMessage?: string;
    screenName?: string;
    stackTrace?: string;
    tags?: string[];
  }): Promise<AutoSuggestion[]> {
    const suggestions: AutoSuggestion[] = [];

    for (const template of this.templates) {
      let confidence = 0;
      const matchedCriteria: string[] = [];

      // Match by error type to category
      if (crashInfo.errorType) {
        const errorTypeLower = crashInfo.errorType.toLowerCase();
        if (
          (template.category === 'ui_crash' && (errorTypeLower.includes('ui') || errorTypeLower.includes('button') || errorTypeLower.includes('touch'))) ||
          (template.category === 'network_error' && (errorTypeLower.includes('network') || errorTypeLower.includes('timeout') || errorTypeLower.includes('connection'))) ||
          (template.category === 'memory_issue' && (errorTypeLower.includes('memory') || errorTypeLower.includes('oom'))) ||
          (template.category === 'database_error' && (errorTypeLower.includes('database') || errorTypeLower.includes('sql') || errorTypeLower.includes('query'))) ||
          (template.category === 'authentication_failure' && (errorTypeLower.includes('auth') || errorTypeLower.includes('token') || errorTypeLower.includes('session'))) ||
          (template.category === 'navigation_crash' && (errorTypeLower.includes('navigation') || errorTypeLower.includes('route'))) ||
          (template.category === 'rendering_error' && (errorTypeLower.includes('render') || errorTypeLower.includes('component'))) ||
          (template.category === 'api_failure' && (errorTypeLower.includes('api') || errorTypeLower.includes('500') || errorTypeLower.includes('server')))
        ) {
          confidence += 40;
          matchedCriteria.push('Error type matches category');
        }
      }

      // Match by error message
      if (crashInfo.errorMessage) {
        const messageLower = crashInfo.errorMessage.toLowerCase();
        for (const tag of template.tags) {
          if (messageLower.includes(tag.toLowerCase())) {
            confidence += 10;
            matchedCriteria.push(`Error message contains "${tag}"`);
          }
        }
      }

      // Match by tags
      if (crashInfo.tags) {
        for (const tag of crashInfo.tags) {
          if (template.tags.includes(tag.toLowerCase())) {
            confidence += 15;
            matchedCriteria.push(`Tag match: ${tag}`);
          }
        }
      }

      // Match by stack trace keywords
      if (crashInfo.stackTrace) {
        const stackLower = crashInfo.stackTrace.toLowerCase();
        for (const tag of template.tags) {
          if (stackLower.includes(tag.toLowerCase())) {
            confidence += 5;
            matchedCriteria.push(`Stack trace contains "${tag}"`);
          }
        }
      }

      // Boost frequently used templates
      if (template.usageCount > 10) {
        confidence += 5;
        matchedCriteria.push('Frequently used template');
      }

      if (confidence > 20) {
        suggestions.push({
          templateId: template.id,
          template,
          confidence: Math.min(confidence, 100),
          matchedCriteria,
        });
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }

  // Template sharing
  async shareTemplate(templateId: string): Promise<boolean> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template || template.isBuiltIn) return false;

    template.isShared = true;
    template.updatedAt = new Date().toISOString();
    await this.saveData();
    this.emit('template_shared', template);

    return true;
  }

  async unshareTemplate(templateId: string): Promise<boolean> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template || template.isBuiltIn) return false;

    template.isShared = false;
    template.updatedAt = new Date().toISOString();
    await this.saveData();

    return true;
  }

  // Import/Export
  async exportTemplates(templateIds?: string[]): Promise<string> {
    let templatesToExport = this.templates;
    if (templateIds) {
      templatesToExport = this.templates.filter(t => templateIds.includes(t.id));
    }

    return JSON.stringify(templatesToExport, null, 2);
  }

  async importTemplates(jsonData: string, createdBy: string): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const result = { imported: 0, skipped: 0, errors: [] as string[] };

    try {
      const templates = JSON.parse(jsonData) as CrashReportTemplate[];
      const now = new Date().toISOString();

      for (const template of templates) {
        // Check for duplicates
        if (this.templates.some(t => t.name === template.name && t.category === template.category)) {
          result.skipped++;
          continue;
        }

        const newTemplate: CrashReportTemplate = {
          ...template,
          id: `template_imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: now,
          updatedAt: now,
          usageCount: 0,
          isBuiltIn: false,
          createdBy,
        };

        this.templates.push(newTemplate);
        result.imported++;
      }

      await this.saveData();
    } catch (error) {
      result.errors.push(`Import failed: ${error}`);
    }

    return result;
  }

  // Analytics
  async getAnalytics(): Promise<TemplateAnalytics> {
    const byCategory: Record<TemplateCategory, { templates: number; applications: number }> = {
      ui_crash: { templates: 0, applications: 0 },
      network_error: { templates: 0, applications: 0 },
      memory_issue: { templates: 0, applications: 0 },
      database_error: { templates: 0, applications: 0 },
      authentication_failure: { templates: 0, applications: 0 },
      permission_denied: { templates: 0, applications: 0 },
      api_failure: { templates: 0, applications: 0 },
      rendering_error: { templates: 0, applications: 0 },
      navigation_crash: { templates: 0, applications: 0 },
      general: { templates: 0, applications: 0 },
    };

    for (const template of this.templates) {
      byCategory[template.category].templates++;
      byCategory[template.category].applications += template.usageCount;
    }

    const mostUsedTemplates = [...this.templates]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)
      .map(t => ({ templateId: t.id, name: t.name, usageCount: t.usageCount }));

    return {
      totalTemplates: this.templates.length,
      totalApplications: this.applications.length,
      byCategory,
      mostUsedTemplates,
      averageTimeToApply: 15, // Simulated average time in seconds
      templateEfficiency: this.applications.length > 0 ? 75 : 0, // Simulated efficiency percentage
    };
  }

  // Get categories
  getCategories(): { value: TemplateCategory; label: string; description: string }[] {
    return [
      { value: 'ui_crash', label: 'UI Crash', description: 'User interface related crashes' },
      { value: 'network_error', label: 'Network Error', description: 'Network and connectivity issues' },
      { value: 'memory_issue', label: 'Memory Issue', description: 'Memory exhaustion and leaks' },
      { value: 'database_error', label: 'Database Error', description: 'Database query and connection failures' },
      { value: 'authentication_failure', label: 'Authentication Failure', description: 'Auth and session issues' },
      { value: 'permission_denied', label: 'Permission Denied', description: 'Permission and access issues' },
      { value: 'api_failure', label: 'API Failure', description: 'API and server errors' },
      { value: 'rendering_error', label: 'Rendering Error', description: 'Component rendering failures' },
      { value: 'navigation_crash', label: 'Navigation Crash', description: 'Navigation and routing issues' },
      { value: 'general', label: 'General', description: 'Other crash types' },
    ];
  }
}

export const crashReportTemplateService = new CrashReportTemplateService();
export default crashReportTemplateService;
