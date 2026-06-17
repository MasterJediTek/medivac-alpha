/**
 * WACHS Site Provisioning Wizard Service
 * Streamlined wizard for adding new health sites
 * MediVac One v5.8
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { WACHSRegion, SiteType, WACHS_REGIONS } from './wachs-wan-service';

// Storage keys
const STORAGE_KEYS = {
  TEMPLATES: 'medivac_site_templates',
  PROVISIONING_HISTORY: 'medivac_provisioning_history',
  DRAFT_SITES: 'medivac_draft_sites',
};

// Types
export type ProvisioningStatus = 'draft' | 'validating' | 'provisioning' | 'completed' | 'failed';
export type WizardStep = 'template' | 'basic' | 'network' | 'services' | 'contacts' | 'review';

export interface SiteTemplate {
  id: string;
  name: string;
  description: string;
  type: SiteType;
  isDefault: boolean;
  defaultServices: string[];
  defaultVlanRange: { start: number; end: number };
  defaultBandwidth: number;
  requiredContacts: string[];
  icon: string;
  color: string;
}

export interface ProvisioningDraft {
  id: string;
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  template?: SiteTemplate;
  basicInfo: {
    name: string;
    code: string;
    type: SiteType;
    region: WACHSRegion;
    address: string;
    postcode: string;
    phone: string;
  };
  networkConfig: {
    ipRange: string;
    gateway: string;
    subnetMask: string;
    vlanId: number;
    bandwidth: number;
    dnsServers: string[];
    ntpServers: string[];
    autoDiscovered: boolean;
  };
  services: {
    selected: string[];
    customServices: string[];
  };
  contacts: SiteContact[];
  validation: {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
  };
  status: ProvisioningStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SiteContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  isPrimary: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  step: WizardStep;
}

export interface ValidationWarning {
  field: string;
  message: string;
  step: WizardStep;
}

export interface ProvisioningResult {
  id: string;
  draftId: string;
  siteName: string;
  siteCode: string;
  region: WACHSRegion;
  status: 'success' | 'partial' | 'failed';
  siteId?: string;
  steps: ProvisioningStep[];
  startedAt: string;
  completedAt: string;
  errors: string[];
}

export interface ProvisioningStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  message?: string;
  duration?: number;
}

// Available services
export const AVAILABLE_SERVICES: { id: string; name: string; category: string; required: boolean }[] = [
  { id: 'emr', name: 'Electronic Medical Records', category: 'Clinical', required: true },
  { id: 'pacs', name: 'PACS Imaging', category: 'Clinical', required: false },
  { id: 'pathology', name: 'Pathology System', category: 'Clinical', required: false },
  { id: 'pharmacy', name: 'Pharmacy Management', category: 'Clinical', required: false },
  { id: 'telehealth', name: 'Telehealth', category: 'Clinical', required: false },
  { id: 'radiology', name: 'Radiology RIS', category: 'Clinical', required: false },
  { id: 'scheduling', name: 'Patient Scheduling', category: 'Administrative', required: true },
  { id: 'billing', name: 'Billing & Claims', category: 'Administrative', required: false },
  { id: 'hr', name: 'HR Management', category: 'Administrative', required: false },
  { id: 'inventory', name: 'Inventory Management', category: 'Operations', required: false },
  { id: 'facilities', name: 'Facilities Management', category: 'Operations', required: false },
  { id: 'security', name: 'Security Systems', category: 'Operations', required: false },
];

// Contact roles
export const CONTACT_ROLES = [
  'IT Manager',
  'Network Administrator',
  'Clinical Director',
  'Facility Manager',
  'Security Officer',
  'Emergency Contact',
  'Billing Contact',
  'General Manager',
];

// Default templates
const DEFAULT_TEMPLATES: SiteTemplate[] = [
  {
    id: 'template_hospital',
    name: 'Regional Hospital',
    description: 'Full-service regional hospital with all clinical systems',
    type: 'hospital',
    isDefault: true,
    defaultServices: ['emr', 'pacs', 'pathology', 'pharmacy', 'telehealth', 'scheduling', 'billing'],
    defaultVlanRange: { start: 100, end: 199 },
    defaultBandwidth: 1000,
    requiredContacts: ['IT Manager', 'Clinical Director', 'Emergency Contact'],
    icon: 'building.2.fill',
    color: '#3B82F6',
  },
  {
    id: 'template_clinic',
    name: 'Community Clinic',
    description: 'Primary care clinic with essential services',
    type: 'clinic',
    isDefault: false,
    defaultServices: ['emr', 'telehealth', 'scheduling'],
    defaultVlanRange: { start: 200, end: 249 },
    defaultBandwidth: 100,
    requiredContacts: ['IT Manager', 'Clinical Director'],
    icon: 'cross.fill',
    color: '#10B981',
  },
  {
    id: 'template_aged_care',
    name: 'Aged Care Facility',
    description: 'Residential aged care with specialized systems',
    type: 'aged_care',
    isDefault: false,
    defaultServices: ['emr', 'pharmacy', 'scheduling', 'facilities'],
    defaultVlanRange: { start: 250, end: 299 },
    defaultBandwidth: 250,
    requiredContacts: ['Facility Manager', 'Clinical Director', 'Emergency Contact'],
    icon: 'heart.fill',
    color: '#EC4899',
  },
  {
    id: 'template_community',
    name: 'Community Health Center',
    description: 'Outreach and community health services',
    type: 'community_health',
    isDefault: false,
    defaultServices: ['emr', 'telehealth', 'scheduling'],
    defaultVlanRange: { start: 300, end: 349 },
    defaultBandwidth: 50,
    requiredContacts: ['IT Manager'],
    icon: 'person.3.fill',
    color: '#F59E0B',
  },
];

// Wizard steps configuration
export const WIZARD_STEPS: { id: WizardStep; title: string; description: string }[] = [
  { id: 'template', title: 'Select Template', description: 'Choose a site template' },
  { id: 'basic', title: 'Basic Information', description: 'Site name, location, and type' },
  { id: 'network', title: 'Network Configuration', description: 'IP addresses and connectivity' },
  { id: 'services', title: 'Services', description: 'Select available services' },
  { id: 'contacts', title: 'Contacts', description: 'Site contacts and responsibilities' },
  { id: 'review', title: 'Review & Provision', description: 'Review and create site' },
];

class SiteProvisioningService {
  private templates: SiteTemplate[] = [];
  private drafts: ProvisioningDraft[] = [];
  private history: ProvisioningResult[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const [templatesData, draftsData, historyData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TEMPLATES),
        AsyncStorage.getItem(STORAGE_KEYS.DRAFT_SITES),
        AsyncStorage.getItem(STORAGE_KEYS.PROVISIONING_HISTORY),
      ]);

      this.templates = templatesData ? JSON.parse(templatesData) : DEFAULT_TEMPLATES;
      this.drafts = draftsData ? JSON.parse(draftsData) : [];
      this.history = historyData ? JSON.parse(historyData) : [];

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize site provisioning service:', error);
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

  private async saveDrafts(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DRAFT_SITES, JSON.stringify(this.drafts));
    } catch (error) {
      console.error('Failed to save drafts:', error);
    }
  }

  private async saveHistory(): Promise<void> {
    try {
      if (this.history.length > 50) {
        this.history = this.history.slice(-50);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.PROVISIONING_HISTORY, JSON.stringify(this.history));
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  }

  // Templates
  getTemplates(): SiteTemplate[] {
    return [...this.templates];
  }

  getTemplate(id: string): SiteTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  // Drafts
  getDrafts(): ProvisioningDraft[] {
    return [...this.drafts];
  }

  getDraft(id: string): ProvisioningDraft | undefined {
    return this.drafts.find(d => d.id === id);
  }

  async createDraft(templateId?: string): Promise<ProvisioningDraft> {
    await this.initialize();

    const template = templateId ? this.templates.find(t => t.id === templateId) : undefined;

    const draft: ProvisioningDraft = {
      id: `draft_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      currentStep: 'template',
      completedSteps: [],
      template,
      basicInfo: {
        name: '',
        code: '',
        type: template?.type || 'hospital',
        region: 'south_west',
        address: '',
        postcode: '',
        phone: '',
      },
      networkConfig: {
        ipRange: '',
        gateway: '',
        subnetMask: '255.255.255.0',
        vlanId: template ? template.defaultVlanRange.start : 100,
        bandwidth: template?.defaultBandwidth || 100,
        dnsServers: ['10.0.0.10', '10.0.0.11'],
        ntpServers: ['10.0.0.20'],
        autoDiscovered: false,
      },
      services: {
        selected: template?.defaultServices || ['emr', 'scheduling'],
        customServices: [],
      },
      contacts: [],
      validation: {
        isValid: false,
        errors: [],
        warnings: [],
      },
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.drafts.push(draft);
    await this.saveDrafts();

    return draft;
  }

  async updateDraft(id: string, updates: Partial<ProvisioningDraft>): Promise<ProvisioningDraft | null> {
    const index = this.drafts.findIndex(d => d.id === id);
    if (index === -1) return null;

    this.drafts[index] = {
      ...this.drafts[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.saveDrafts();
    return this.drafts[index];
  }

  async deleteDraft(id: string): Promise<boolean> {
    const index = this.drafts.findIndex(d => d.id === id);
    if (index === -1) return false;

    this.drafts.splice(index, 1);
    await this.saveDrafts();

    return true;
  }

  // Step navigation
  async goToStep(draftId: string, step: WizardStep): Promise<ProvisioningDraft | null> {
    const draft = this.drafts.find(d => d.id === draftId);
    if (!draft) return null;

    draft.currentStep = step;
    draft.updatedAt = new Date().toISOString();

    await this.saveDrafts();
    return draft;
  }

  async completeStep(draftId: string, step: WizardStep): Promise<ProvisioningDraft | null> {
    const draft = this.drafts.find(d => d.id === draftId);
    if (!draft) return null;

    if (!draft.completedSteps.includes(step)) {
      draft.completedSteps.push(step);
    }

    // Move to next step
    const stepIndex = WIZARD_STEPS.findIndex(s => s.id === step);
    if (stepIndex < WIZARD_STEPS.length - 1) {
      draft.currentStep = WIZARD_STEPS[stepIndex + 1].id;
    }

    draft.updatedAt = new Date().toISOString();
    await this.saveDrafts();

    return draft;
  }

  // Auto-discovery
  async autoDiscoverNetwork(draftId: string): Promise<{
    success: boolean;
    ipRange?: string;
    gateway?: string;
    vlanId?: number;
    message: string;
  }> {
    const draft = this.drafts.find(d => d.id === draftId);
    if (!draft) {
      return { success: false, message: 'Draft not found' };
    }

    // Simulate network discovery
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (Math.random() > 0.2) {
      const vlanId = draft.template 
        ? draft.template.defaultVlanRange.start + Math.floor(Math.random() * 50)
        : 100 + Math.floor(Math.random() * 100);
      
      const discovered = {
        ipRange: `10.100.${vlanId}.0/24`,
        gateway: `10.100.${vlanId}.1`,
        vlanId,
      };

      draft.networkConfig = {
        ...draft.networkConfig,
        ...discovered,
        autoDiscovered: true,
      };

      await this.saveDrafts();

      return {
        success: true,
        ...discovered,
        message: 'Network configuration auto-discovered',
      };
    } else {
      return {
        success: false,
        message: 'Auto-discovery failed. Please configure manually.',
      };
    }
  }

  // Validation
  async validateDraft(draftId: string): Promise<{ isValid: boolean; errors: ValidationError[]; warnings: ValidationWarning[] }> {
    const draft = this.drafts.find(d => d.id === draftId);
    if (!draft) {
      return { isValid: false, errors: [{ field: 'draft', message: 'Draft not found', step: 'template' }], warnings: [] };
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic info validation
    if (!draft.basicInfo.name) {
      errors.push({ field: 'name', message: 'Site name is required', step: 'basic' });
    }
    if (!draft.basicInfo.code || draft.basicInfo.code.length < 2) {
      errors.push({ field: 'code', message: 'Site code must be at least 2 characters', step: 'basic' });
    }
    if (!draft.basicInfo.address) {
      errors.push({ field: 'address', message: 'Address is required', step: 'basic' });
    }

    // Network validation
    if (!draft.networkConfig.ipRange) {
      errors.push({ field: 'ipRange', message: 'IP range is required', step: 'network' });
    }
    if (!draft.networkConfig.gateway) {
      errors.push({ field: 'gateway', message: 'Gateway is required', step: 'network' });
    }
    if (draft.networkConfig.vlanId < 1 || draft.networkConfig.vlanId > 4094) {
      errors.push({ field: 'vlanId', message: 'VLAN ID must be between 1 and 4094', step: 'network' });
    }

    // Services validation
    if (draft.services.selected.length === 0) {
      errors.push({ field: 'services', message: 'At least one service must be selected', step: 'services' });
    }
    const requiredServices = AVAILABLE_SERVICES.filter(s => s.required).map(s => s.id);
    const missingRequired = requiredServices.filter(s => !draft.services.selected.includes(s));
    if (missingRequired.length > 0) {
      warnings.push({ field: 'services', message: `Recommended services not selected: ${missingRequired.join(', ')}`, step: 'services' });
    }

    // Contacts validation
    if (draft.contacts.length === 0) {
      errors.push({ field: 'contacts', message: 'At least one contact is required', step: 'contacts' });
    }
    const hasPrimary = draft.contacts.some(c => c.isPrimary);
    if (draft.contacts.length > 0 && !hasPrimary) {
      warnings.push({ field: 'contacts', message: 'No primary contact designated', step: 'contacts' });
    }

    const isValid = errors.length === 0;

    draft.validation = { isValid, errors, warnings };
    await this.saveDrafts();

    return { isValid, errors, warnings };
  }

  // Provisioning
  async provisionSite(draftId: string): Promise<ProvisioningResult> {
    const draft = this.drafts.find(d => d.id === draftId);
    if (!draft) {
      throw new Error('Draft not found');
    }

    const validation = await this.validateDraft(draftId);
    if (!validation.isValid) {
      throw new Error('Draft validation failed');
    }

    draft.status = 'provisioning';
    await this.saveDrafts();

    const startTime = Date.now();
    const steps: ProvisioningStep[] = [
      { name: 'Validate configuration', status: 'pending' },
      { name: 'Reserve network resources', status: 'pending' },
      { name: 'Configure VLAN', status: 'pending' },
      { name: 'Setup routing', status: 'pending' },
      { name: 'Register services', status: 'pending' },
      { name: 'Create site record', status: 'pending' },
      { name: 'Notify administrators', status: 'pending' },
    ];

    // Simulate provisioning steps
    for (let i = 0; i < steps.length; i++) {
      steps[i].status = 'running';
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
      
      if (Math.random() > 0.05) {
        steps[i].status = 'success';
        steps[i].duration = 500 + Math.floor(Math.random() * 500);
      } else {
        steps[i].status = 'failed';
        steps[i].message = 'Step failed - please retry';
        break;
      }
    }

    const hasFailure = steps.some(s => s.status === 'failed');
    const allSuccess = steps.every(s => s.status === 'success');

    const result: ProvisioningResult = {
      id: `prov_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      draftId: draft.id,
      siteName: draft.basicInfo.name,
      siteCode: draft.basicInfo.code,
      region: draft.basicInfo.region,
      status: hasFailure ? 'failed' : (allSuccess ? 'success' : 'partial'),
      siteId: allSuccess ? `site_${draft.basicInfo.code.toLowerCase()}` : undefined,
      steps,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      errors: hasFailure ? ['Provisioning failed at step: ' + steps.find(s => s.status === 'failed')?.name] : [],
    };

    // Update draft status
    draft.status = hasFailure ? 'failed' : 'completed';
    
    // Add to history
    this.history.push(result);

    await Promise.all([
      this.saveDrafts(),
      this.saveHistory(),
    ]);

    return result;
  }

  // History
  getHistory(): ProvisioningResult[] {
    return [...this.history].sort((a, b) => 
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  }

  // Statistics
  getStatistics(): {
    totalTemplates: number;
    activeDrafts: number;
    completedProvisions: number;
    failedProvisions: number;
    successRate: number;
  } {
    const completed = this.history.filter(h => h.status === 'success').length;
    const failed = this.history.filter(h => h.status === 'failed').length;
    
    return {
      totalTemplates: this.templates.length,
      activeDrafts: this.drafts.filter(d => d.status === 'draft').length,
      completedProvisions: completed,
      failedProvisions: failed,
      successRate: this.history.length > 0 ? Math.round((completed / this.history.length) * 100) : 100,
    };
  }
}

export const siteProvisioningService = new SiteProvisioningService();
