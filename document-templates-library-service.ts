/**
 * Document Templates Library Service - MediVac WACHS v9.4
 * Pre-filled AHD templates for common healthcare scenarios
 */

// Types
export type TemplateCategory = 
  | 'palliative_care'
  | 'dementia_care'
  | 'end_of_life'
  | 'chronic_illness'
  | 'cancer_care'
  | 'cardiac_care'
  | 'respiratory_care'
  | 'general';

export type TreatmentPreference = 'want' | 'do_not_want' | 'undecided' | 'conditional';

export interface TemplateMetadata {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  suitableFor: string[];
  createdAt: number;
  updatedAt: number;
  version: string;
  author: string;
  isOfficial: boolean;
  usageCount: number;
  rating: number;
  reviewCount: number;
}

export interface TreatmentDecision {
  treatment: string;
  preference: TreatmentPreference;
  conditions?: string;
  notes?: string;
}

export interface TemplateContent {
  // Values and Wishes
  valuesAndWishes: {
    qualityOfLife: string;
    importantActivities: string;
    fears: string;
    spiritualBeliefs: string;
    familyInvolvement: string;
    communicationPreferences: string;
    endOfLifeWishes: string;
  };
  
  // Treatment Decisions
  treatmentDecisions: {
    cardiopulmonaryResuscitation: TreatmentDecision;
    mechanicalVentilation: TreatmentDecision;
    artificialNutrition: TreatmentDecision;
    artificialHydration: TreatmentDecision;
    dialysis: TreatmentDecision;
    antibiotics: TreatmentDecision;
    bloodTransfusion: TreatmentDecision;
    palliativeCare: TreatmentDecision;
  };
  
  // Other preferences
  organDonation: {
    willing: boolean;
    organs?: string[];
    restrictions?: string;
  };
  
  // Care location preferences
  careLocation: {
    preferredLocation: 'home' | 'hospital' | 'hospice' | 'aged_care' | 'no_preference';
    notes?: string;
  };
  
  // Additional instructions
  additionalInstructions: string;
}

export interface DocumentTemplate {
  metadata: TemplateMetadata;
  content: TemplateContent;
  customFields: { key: string; label: string; value: string }[];
  guidance: {
    section: string;
    tips: string[];
  }[];
}

// Haptic feedback simulation
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success') => {
  console.log(`Haptic: ${type}`);
};

class DocumentTemplatesLibraryService {
  private templates: Map<string, DocumentTemplate> = new Map();
  private userTemplates: Map<string, DocumentTemplate> = new Map();
  private favorites: Set<string> = new Set();
  private recentlyUsed: string[] = [];

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    // Palliative Care Template
    this.templates.set('palliative_care_standard', {
      metadata: {
        id: 'palliative_care_standard',
        name: 'Palliative Care - Standard',
        category: 'palliative_care',
        description: 'For patients receiving palliative care who wish to focus on comfort and quality of life rather than curative treatments.',
        suitableFor: ['Terminal illness', 'Advanced cancer', 'End-stage organ failure'],
        createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
        version: '2.1',
        author: 'WA Health Department',
        isOfficial: true,
        usageCount: 15420,
        rating: 4.8,
        reviewCount: 342,
      },
      content: {
        valuesAndWishes: {
          qualityOfLife: 'I value comfort and dignity above prolonging life. I want to be free from pain and distress, and to spend quality time with my loved ones.',
          importantActivities: 'Being able to communicate with family, maintaining my dignity, and having peaceful surroundings.',
          fears: 'I fear prolonged suffering, loss of dignity, and being a burden on my family.',
          spiritualBeliefs: '[To be completed based on personal beliefs]',
          familyInvolvement: 'I want my family to be involved in my care decisions and to be present during my final days.',
          communicationPreferences: 'Please speak to me honestly about my condition. I want to be informed of any changes.',
          endOfLifeWishes: 'I wish to die peacefully, preferably at home or in a hospice, surrounded by loved ones.',
        },
        treatmentDecisions: {
          cardiopulmonaryResuscitation: { treatment: 'CPR', preference: 'do_not_want', notes: 'Allow natural death' },
          mechanicalVentilation: { treatment: 'Mechanical Ventilation', preference: 'do_not_want', notes: 'Do not want to be on life support' },
          artificialNutrition: { treatment: 'Artificial Nutrition', preference: 'do_not_want', notes: 'Comfort feeding only if desired' },
          artificialHydration: { treatment: 'Artificial Hydration', preference: 'conditional', conditions: 'Only for comfort if I am thirsty', notes: 'Mouth care preferred' },
          dialysis: { treatment: 'Dialysis', preference: 'do_not_want', notes: 'Not appropriate for palliative care' },
          antibiotics: { treatment: 'Antibiotics', preference: 'conditional', conditions: 'Only if they will improve comfort', notes: 'For symptom relief only' },
          bloodTransfusion: { treatment: 'Blood Transfusion', preference: 'conditional', conditions: 'Only if it significantly improves quality of life' },
          palliativeCare: { treatment: 'Palliative Care', preference: 'want', notes: 'Full palliative care with focus on comfort' },
        },
        organDonation: {
          willing: false,
          restrictions: 'Not applicable due to illness',
        },
        careLocation: {
          preferredLocation: 'home',
          notes: 'Prefer to remain at home with palliative care support. Hospice as second choice.',
        },
        additionalInstructions: 'Please ensure I have adequate pain management at all times. I do not want to be transferred to hospital unless absolutely necessary for comfort care.',
      },
      customFields: [],
      guidance: [
        {
          section: 'Values and Wishes',
          tips: [
            'Focus on what brings you comfort and peace',
            'Consider what activities or people are most important to you',
            'Think about your spiritual or religious needs',
          ],
        },
        {
          section: 'Treatment Decisions',
          tips: [
            'Palliative care focuses on comfort, not cure',
            'Most life-prolonging treatments are typically declined',
            'Pain management should be a priority',
          ],
        },
      ],
    });

    // Dementia Care Template
    this.templates.set('dementia_care_standard', {
      metadata: {
        id: 'dementia_care_standard',
        name: 'Dementia Care - Standard',
        category: 'dementia_care',
        description: 'For patients with dementia or cognitive decline who want to plan ahead while they still have capacity.',
        suitableFor: ['Early-stage dementia', 'Alzheimer\'s disease', 'Cognitive impairment'],
        createdAt: Date.now() - 300 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
        version: '1.8',
        author: 'Dementia Australia WA',
        isOfficial: true,
        usageCount: 8930,
        rating: 4.7,
        reviewCount: 198,
      },
      content: {
        valuesAndWishes: {
          qualityOfLife: 'I value being treated with dignity and respect, even when I can no longer express myself clearly. Please remember who I was and treat me accordingly.',
          importantActivities: 'Music, being outdoors, family visits, and familiar routines bring me comfort.',
          fears: 'I fear being treated as less than human, being isolated, and experiencing distress without being able to communicate it.',
          spiritualBeliefs: '[To be completed based on personal beliefs]',
          familyInvolvement: 'My family knows me best. Please involve them in decisions about my care and daily routines.',
          communicationPreferences: 'Speak to me calmly and simply. Use my name. Even if I don\'t respond, I may still understand.',
          endOfLifeWishes: 'When my dementia is advanced and I can no longer recognize loved ones or eat safely, I want comfort care only.',
        },
        treatmentDecisions: {
          cardiopulmonaryResuscitation: { treatment: 'CPR', preference: 'conditional', conditions: 'Only in early stages of dementia', notes: 'Not wanted in advanced dementia' },
          mechanicalVentilation: { treatment: 'Mechanical Ventilation', preference: 'do_not_want', notes: 'Would cause distress and confusion' },
          artificialNutrition: { treatment: 'Artificial Nutrition', preference: 'do_not_want', notes: 'Hand feeding with favorite foods preferred' },
          artificialHydration: { treatment: 'Artificial Hydration', preference: 'do_not_want', notes: 'Offer fluids by mouth only' },
          dialysis: { treatment: 'Dialysis', preference: 'do_not_want', notes: 'Too distressing for someone with dementia' },
          antibiotics: { treatment: 'Antibiotics', preference: 'conditional', conditions: 'Only for comfort (e.g., UTI causing distress)', notes: 'Not for life-threatening infections in advanced dementia' },
          bloodTransfusion: { treatment: 'Blood Transfusion', preference: 'conditional', conditions: 'Only in early stages if it improves quality of life' },
          palliativeCare: { treatment: 'Palliative Care', preference: 'want', notes: 'Full comfort care in advanced stages' },
        },
        organDonation: {
          willing: false,
          restrictions: 'Not applicable',
        },
        careLocation: {
          preferredLocation: 'home',
          notes: 'Prefer familiar surroundings as long as possible. Aged care facility if home care becomes unsafe.',
        },
        additionalInstructions: 'Please maintain my routines and familiar objects around me. Play my favorite music. Do not restrain me unless absolutely necessary for safety. If I resist care, try again later rather than forcing.',
      },
      customFields: [
        { key: 'favorite_music', label: 'Favorite Music/Songs', value: '[To be completed]' },
        { key: 'comfort_items', label: 'Comfort Items', value: '[To be completed]' },
        { key: 'daily_routines', label: 'Important Daily Routines', value: '[To be completed]' },
      ],
      guidance: [
        {
          section: 'Planning Ahead',
          tips: [
            'Complete this while you still have capacity to make decisions',
            'Discuss your wishes with your family and Treatment Decision Maker',
            'Review and update as your condition changes',
          ],
        },
        {
          section: 'Communication',
          tips: [
            'Include information about how you like to be comforted',
            'Note any behaviors that indicate distress',
            'Share your life story to help carers understand you',
          ],
        },
      ],
    });

    // General End-of-Life Template
    this.templates.set('end_of_life_general', {
      metadata: {
        id: 'end_of_life_general',
        name: 'General End-of-Life Planning',
        category: 'end_of_life',
        description: 'A comprehensive template for anyone who wants to document their end-of-life care preferences.',
        suitableFor: ['General planning', 'Healthy adults', 'Chronic conditions'],
        createdAt: Date.now() - 400 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
        version: '3.0',
        author: 'WA Health Department',
        isOfficial: true,
        usageCount: 25680,
        rating: 4.9,
        reviewCount: 567,
      },
      content: {
        valuesAndWishes: {
          qualityOfLife: 'I value being able to interact meaningfully with others, maintain my independence, and live without severe pain or distress.',
          importantActivities: '[To be completed - What activities make life worth living for you?]',
          fears: '[To be completed - What are your fears about end-of-life care?]',
          spiritualBeliefs: '[To be completed - Do you have religious or spiritual beliefs that should guide your care?]',
          familyInvolvement: 'I want my family to be informed and involved in decisions, but my Treatment Decision Maker has final authority.',
          communicationPreferences: 'I want to be told the truth about my condition and prognosis.',
          endOfLifeWishes: '[To be completed - Where and how would you like to spend your final days?]',
        },
        treatmentDecisions: {
          cardiopulmonaryResuscitation: { treatment: 'CPR', preference: 'undecided', notes: 'Consider based on likelihood of recovery' },
          mechanicalVentilation: { treatment: 'Mechanical Ventilation', preference: 'undecided', notes: 'Consider based on likelihood of recovery' },
          artificialNutrition: { treatment: 'Artificial Nutrition', preference: 'undecided', notes: 'Consider based on prognosis' },
          artificialHydration: { treatment: 'Artificial Hydration', preference: 'undecided', notes: 'Consider based on comfort' },
          dialysis: { treatment: 'Dialysis', preference: 'undecided', notes: 'Consider based on overall condition' },
          antibiotics: { treatment: 'Antibiotics', preference: 'want', notes: 'Generally want treatment for infections' },
          bloodTransfusion: { treatment: 'Blood Transfusion', preference: 'want', notes: 'Generally accept if needed' },
          palliativeCare: { treatment: 'Palliative Care', preference: 'want', notes: 'Want comfort care when appropriate' },
        },
        organDonation: {
          willing: true,
          organs: ['All organs and tissues'],
        },
        careLocation: {
          preferredLocation: 'no_preference',
          notes: 'Depends on my condition and what care is needed.',
        },
        additionalInstructions: '[To be completed - Any other specific instructions or wishes?]',
      },
      customFields: [],
      guidance: [
        {
          section: 'Getting Started',
          tips: [
            'Take your time to think about each section',
            'Discuss with family members and your doctor',
            'It\'s okay to leave some sections as "undecided"',
            'You can update this document at any time',
          ],
        },
        {
          section: 'Treatment Decisions',
          tips: [
            'Consider what quality of life means to you',
            'Think about different scenarios (sudden illness vs. gradual decline)',
            'Ask your doctor to explain each treatment option',
          ],
        },
      ],
    });

    // Chronic Illness Template
    this.templates.set('chronic_illness_standard', {
      metadata: {
        id: 'chronic_illness_standard',
        name: 'Chronic Illness Management',
        category: 'chronic_illness',
        description: 'For patients managing long-term chronic conditions who want to plan for potential deterioration.',
        suitableFor: ['Heart failure', 'COPD', 'Kidney disease', 'Diabetes complications'],
        createdAt: Date.now() - 250 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
        version: '2.0',
        author: 'WA Health Department',
        isOfficial: true,
        usageCount: 12340,
        rating: 4.6,
        reviewCount: 289,
      },
      content: {
        valuesAndWishes: {
          qualityOfLife: 'I want to maintain the best possible quality of life while managing my condition. I value being able to do the things I enjoy.',
          importantActivities: '[To be completed based on your interests and abilities]',
          fears: 'I fear sudden deterioration, prolonged hospitalization, and losing my independence.',
          spiritualBeliefs: '[To be completed based on personal beliefs]',
          familyInvolvement: 'I want my family to support me but not to feel burdened by my care.',
          communicationPreferences: 'Keep me informed about my condition and involve me in treatment decisions.',
          endOfLifeWishes: 'If my condition deteriorates significantly, I want to focus on comfort rather than aggressive treatment.',
        },
        treatmentDecisions: {
          cardiopulmonaryResuscitation: { treatment: 'CPR', preference: 'conditional', conditions: 'Only if there is a reasonable chance of meaningful recovery' },
          mechanicalVentilation: { treatment: 'Mechanical Ventilation', preference: 'conditional', conditions: 'Short-term only, with clear goals for weaning' },
          artificialNutrition: { treatment: 'Artificial Nutrition', preference: 'conditional', conditions: 'Short-term if it will help recovery' },
          artificialHydration: { treatment: 'Artificial Hydration', preference: 'want', notes: 'Generally accept IV fluids when needed' },
          dialysis: { treatment: 'Dialysis', preference: 'conditional', conditions: 'Only if it significantly improves quality of life' },
          antibiotics: { treatment: 'Antibiotics', preference: 'want', notes: 'Want treatment for infections' },
          bloodTransfusion: { treatment: 'Blood Transfusion', preference: 'want', notes: 'Accept if needed' },
          palliativeCare: { treatment: 'Palliative Care', preference: 'want', notes: 'Want palliative care alongside active treatment' },
        },
        organDonation: {
          willing: true,
          organs: ['Any suitable organs'],
          restrictions: 'Subject to medical assessment',
        },
        careLocation: {
          preferredLocation: 'home',
          notes: 'Prefer home care with hospital admission only when necessary.',
        },
        additionalInstructions: 'I want to continue managing my condition actively, but if treatment is no longer effective, I want to transition to comfort care.',
      },
      customFields: [
        { key: 'current_conditions', label: 'Current Conditions', value: '[List your conditions]' },
        { key: 'current_treatments', label: 'Current Treatments', value: '[List your treatments]' },
        { key: 'trigger_points', label: 'When to Review This Document', value: '[e.g., hospitalization, new diagnosis]' },
      ],
      guidance: [
        {
          section: 'Living with Chronic Illness',
          tips: [
            'Consider how your condition might progress',
            'Think about what treatments you would want at different stages',
            'Discuss with your specialist about likely scenarios',
          ],
        },
        {
          section: 'Review Triggers',
          tips: [
            'Review after any hospitalization',
            'Review if your condition significantly changes',
            'Review at least annually',
          ],
        },
      ],
    });

    // Cancer Care Template
    this.templates.set('cancer_care_standard', {
      metadata: {
        id: 'cancer_care_standard',
        name: 'Cancer Care Planning',
        category: 'cancer_care',
        description: 'For patients with cancer who want to plan for different stages of their illness and treatment.',
        suitableFor: ['Cancer diagnosis', 'Advanced cancer', 'Cancer treatment'],
        createdAt: Date.now() - 200 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
        version: '2.2',
        author: 'Cancer Council WA',
        isOfficial: true,
        usageCount: 9870,
        rating: 4.8,
        reviewCount: 234,
      },
      content: {
        valuesAndWishes: {
          qualityOfLife: 'I want to balance treatment with quality of life. I value time with family and being able to do things I enjoy.',
          importantActivities: '[To be completed - What matters most to you during treatment?]',
          fears: 'I fear pain, loss of dignity, and being unable to communicate my wishes.',
          spiritualBeliefs: '[To be completed based on personal beliefs]',
          familyInvolvement: 'I want my family involved but protected from having to make difficult decisions alone.',
          communicationPreferences: 'I want honest information about my prognosis and treatment options.',
          endOfLifeWishes: 'If treatment is no longer effective, I want to focus on comfort and spending time with loved ones.',
        },
        treatmentDecisions: {
          cardiopulmonaryResuscitation: { treatment: 'CPR', preference: 'conditional', conditions: 'During active treatment with curative intent', notes: 'Not wanted if cancer is terminal' },
          mechanicalVentilation: { treatment: 'Mechanical Ventilation', preference: 'conditional', conditions: 'Only if there is a reasonable chance of recovery' },
          artificialNutrition: { treatment: 'Artificial Nutrition', preference: 'conditional', conditions: 'During active treatment if needed' },
          artificialHydration: { treatment: 'Artificial Hydration', preference: 'want', notes: 'Accept IV fluids when needed' },
          dialysis: { treatment: 'Dialysis', preference: 'conditional', conditions: 'Only if cancer-related and reversible' },
          antibiotics: { treatment: 'Antibiotics', preference: 'want', notes: 'Want treatment for infections during active treatment' },
          bloodTransfusion: { treatment: 'Blood Transfusion', preference: 'want', notes: 'Accept during treatment' },
          palliativeCare: { treatment: 'Palliative Care', preference: 'want', notes: 'Want palliative care alongside cancer treatment' },
        },
        organDonation: {
          willing: false,
          restrictions: 'Not suitable due to cancer',
        },
        careLocation: {
          preferredLocation: 'home',
          notes: 'Prefer home with hospice support in final stages.',
        },
        additionalInstructions: 'I want good pain management throughout. If my cancer cannot be cured, I want to stop aggressive treatment and focus on quality time.',
      },
      customFields: [
        { key: 'cancer_type', label: 'Type of Cancer', value: '[To be completed]' },
        { key: 'treatment_stage', label: 'Current Treatment Stage', value: '[e.g., Active treatment, Remission, Palliative]' },
        { key: 'treatment_goals', label: 'Treatment Goals', value: '[e.g., Cure, Control, Comfort]' },
      ],
      guidance: [
        {
          section: 'Cancer Journey',
          tips: [
            'Your wishes may change as your treatment progresses',
            'Consider different scenarios: cure, control, and comfort',
            'Discuss with your oncologist about realistic expectations',
          ],
        },
        {
          section: 'Palliative Care',
          tips: [
            'Palliative care can be provided alongside cancer treatment',
            'It focuses on symptom management and quality of life',
            'Consider when you would want to transition to comfort-only care',
          ],
        },
      ],
    });
  }

  // Get all templates
  getAllTemplates(): DocumentTemplate[] {
    return Array.from(this.templates.values());
  }

  // Get templates by category
  getTemplatesByCategory(category: TemplateCategory): DocumentTemplate[] {
    return Array.from(this.templates.values()).filter(
      t => t.metadata.category === category
    );
  }

  // Get template by ID
  getTemplate(id: string): DocumentTemplate | null {
    return this.templates.get(id) || this.userTemplates.get(id) || null;
  }

  // Search templates
  searchTemplates(query: string): DocumentTemplate[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter(t =>
      t.metadata.name.toLowerCase().includes(lowerQuery) ||
      t.metadata.description.toLowerCase().includes(lowerQuery) ||
      t.metadata.suitableFor.some(s => s.toLowerCase().includes(lowerQuery))
    );
  }

  // Get popular templates
  getPopularTemplates(limit: number = 5): DocumentTemplate[] {
    return Array.from(this.templates.values())
      .sort((a, b) => b.metadata.usageCount - a.metadata.usageCount)
      .slice(0, limit);
  }

  // Get top rated templates
  getTopRatedTemplates(limit: number = 5): DocumentTemplate[] {
    return Array.from(this.templates.values())
      .sort((a, b) => b.metadata.rating - a.metadata.rating)
      .slice(0, limit);
  }

  // Use template (increment usage count)
  useTemplate(id: string): DocumentTemplate | null {
    const template = this.templates.get(id);
    if (template) {
      template.metadata.usageCount++;
      template.metadata.updatedAt = Date.now();
      
      // Add to recently used
      this.recentlyUsed = [id, ...this.recentlyUsed.filter(t => t !== id)].slice(0, 10);
      
      triggerHaptic('light');
      return template;
    }
    return null;
  }

  // Get recently used templates
  getRecentlyUsed(): DocumentTemplate[] {
    return this.recentlyUsed
      .map(id => this.templates.get(id) || this.userTemplates.get(id))
      .filter((t): t is DocumentTemplate => t !== undefined);
  }

  // Favorites management
  addToFavorites(id: string): boolean {
    if (this.templates.has(id) || this.userTemplates.has(id)) {
      this.favorites.add(id);
      triggerHaptic('success');
      return true;
    }
    return false;
  }

  removeFromFavorites(id: string): boolean {
    return this.favorites.delete(id);
  }

  getFavorites(): DocumentTemplate[] {
    return Array.from(this.favorites)
      .map(id => this.templates.get(id) || this.userTemplates.get(id))
      .filter((t): t is DocumentTemplate => t !== undefined);
  }

  isFavorite(id: string): boolean {
    return this.favorites.has(id);
  }

  // Create custom template
  createCustomTemplate(
    name: string,
    category: TemplateCategory,
    description: string,
    content: TemplateContent,
    suitableFor: string[] = []
  ): DocumentTemplate {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const template: DocumentTemplate = {
      metadata: {
        id,
        name,
        category,
        description,
        suitableFor,
        createdAt: now,
        updatedAt: now,
        version: '1.0',
        author: 'User',
        isOfficial: false,
        usageCount: 0,
        rating: 0,
        reviewCount: 0,
      },
      content,
      customFields: [],
      guidance: [],
    };

    this.userTemplates.set(id, template);
    triggerHaptic('success');
    return template;
  }

  // Update custom template
  updateCustomTemplate(id: string, updates: Partial<TemplateContent>): DocumentTemplate | null {
    const template = this.userTemplates.get(id);
    if (!template) return null;

    template.content = { ...template.content, ...updates };
    template.metadata.updatedAt = Date.now();
    template.metadata.version = this.incrementVersion(template.metadata.version);

    return template;
  }

  // Delete custom template
  deleteCustomTemplate(id: string): boolean {
    return this.userTemplates.delete(id);
  }

  // Get user templates
  getUserTemplates(): DocumentTemplate[] {
    return Array.from(this.userTemplates.values());
  }

  // Export template
  exportTemplate(id: string): string {
    const template = this.getTemplate(id);
    if (!template) return '';
    return JSON.stringify(template, null, 2);
  }

  // Import template
  importTemplate(json: string): DocumentTemplate | null {
    try {
      const template = JSON.parse(json) as DocumentTemplate;
      template.metadata.id = `imported_${Date.now()}`;
      template.metadata.isOfficial = false;
      template.metadata.createdAt = Date.now();
      template.metadata.updatedAt = Date.now();
      
      this.userTemplates.set(template.metadata.id, template);
      triggerHaptic('success');
      return template;
    } catch {
      return null;
    }
  }

  // Get categories
  getCategories(): { id: TemplateCategory; name: string; description: string; count: number }[] {
    const categories: { id: TemplateCategory; name: string; description: string }[] = [
      { id: 'palliative_care', name: 'Palliative Care', description: 'For comfort-focused end-of-life care' },
      { id: 'dementia_care', name: 'Dementia Care', description: 'For patients with cognitive decline' },
      { id: 'end_of_life', name: 'End-of-Life', description: 'General end-of-life planning' },
      { id: 'chronic_illness', name: 'Chronic Illness', description: 'For long-term condition management' },
      { id: 'cancer_care', name: 'Cancer Care', description: 'For cancer patients' },
      { id: 'cardiac_care', name: 'Cardiac Care', description: 'For heart conditions' },
      { id: 'respiratory_care', name: 'Respiratory Care', description: 'For lung conditions' },
      { id: 'general', name: 'General', description: 'General health directives' },
    ];

    return categories.map(cat => ({
      ...cat,
      count: this.getTemplatesByCategory(cat.id).length,
    }));
  }

  // Utility functions
  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const minor = parseInt(parts[1] || '0') + 1;
    return `${parts[0]}.${minor}`;
  }

  // Analytics
  getAnalytics(): {
    totalTemplates: number;
    officialTemplates: number;
    userTemplates: number;
    totalUsage: number;
    averageRating: number;
    favoriteCount: number;
    byCategory: { category: string; count: number }[];
  } {
    const allTemplates = [...this.templates.values(), ...this.userTemplates.values()];
    const officialTemplates = allTemplates.filter(t => t.metadata.isOfficial);
    
    let totalUsage = 0;
    let totalRating = 0;
    let ratedCount = 0;

    allTemplates.forEach(t => {
      totalUsage += t.metadata.usageCount;
      if (t.metadata.rating > 0) {
        totalRating += t.metadata.rating;
        ratedCount++;
      }
    });

    const byCategory = this.getCategories().map(cat => ({
      category: cat.name,
      count: cat.count,
    }));

    return {
      totalTemplates: allTemplates.length,
      officialTemplates: officialTemplates.length,
      userTemplates: this.userTemplates.size,
      totalUsage,
      averageRating: ratedCount > 0 ? totalRating / ratedCount : 0,
      favoriteCount: this.favorites.size,
      byCategory,
    };
  }

  // Reset for testing
  reset(): void {
    this.userTemplates.clear();
    this.favorites.clear();
    this.recentlyUsed = [];
    this.initializeDefaultTemplates();
  }
}

export const documentTemplatesLibraryService = new DocumentTemplatesLibraryService();
