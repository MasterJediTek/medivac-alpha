/**
 * Route Creation Wizard Service
 * Allows users to create custom hospital routes with step-by-step builder
 */

import { routeHistoryService, type SavedRoute } from './route-history.service';

export interface HospitalLocation {
  id: string;
  name: string;
  category: 'entrance' | 'department' | 'ward' | 'service' | 'facility' | 'emergency';
  position: { x: number; y: number };
  floor: number;
  description: string;
}

export interface RouteWizardStep {
  step: number;
  title: string;
  description: string;
  isComplete: boolean;
}

export interface RouteCreationDraft {
  id: string;
  name: string;
  startLocation: HospitalLocation | null;
  endLocation: HospitalLocation | null;
  waypoints: HospitalLocation[];
  isAccessible: boolean;
  notes: string;
  sharedWith: string[];
  currentStep: number;
  createdAt: string;
}

export interface RoutePreview {
  totalDistance: number;
  estimatedTime: number;
  waypointCount: number;
  isAccessible: boolean;
  pathPoints: Array<{ x: number; y: number; name: string }>;
}

type WizardListener = (draft: RouteCreationDraft | null) => void;

class RouteCreationWizardService {
  private static instance: RouteCreationWizardService;
  private listeners: Set<WizardListener> = new Set();
  private currentDraft: RouteCreationDraft | null = null;
  private hospitalLocations: HospitalLocation[] = [];

  private constructor() {
    this.initializeHospitalLocations();
  }

  static getInstance(): RouteCreationWizardService {
    if (!RouteCreationWizardService.instance) {
      RouteCreationWizardService.instance = new RouteCreationWizardService();
    }
    return RouteCreationWizardService.instance;
  }

  private initializeHospitalLocations(): void {
    this.hospitalLocations = [
      // Entrances
      { id: 'loc-001', name: 'Main Entrance', category: 'entrance', position: { x: 180, y: 280 }, floor: 0, description: 'Primary hospital entrance with reception' },
      { id: 'loc-002', name: 'Emergency Entrance', category: 'entrance', position: { x: 60, y: 220 }, floor: 0, description: 'Emergency department entrance' },
      { id: 'loc-003', name: 'Parking Entrance', category: 'entrance', position: { x: 180, y: 380 }, floor: 0, description: 'Entrance from parking area' },
      { id: 'loc-004', name: 'Staff Entrance', category: 'entrance', position: { x: 320, y: 280 }, floor: 0, description: 'Staff-only entrance with badge access' },

      // Departments
      { id: 'loc-010', name: 'Emergency Department', category: 'emergency', position: { x: 80, y: 200 }, floor: 0, description: 'Emergency and trauma care' },
      { id: 'loc-011', name: 'Radiology', category: 'department', position: { x: 120, y: 160 }, floor: 0, description: 'X-ray, CT, MRI imaging' },
      { id: 'loc-012', name: 'Pathology Lab', category: 'department', position: { x: 140, y: 380 }, floor: 0, description: 'Blood tests and laboratory services' },
      { id: 'loc-013', name: 'Pharmacy', category: 'department', position: { x: 160, y: 340 }, floor: 0, description: 'Medication dispensary' },
      { id: 'loc-014', name: 'Physiotherapy', category: 'department', position: { x: 280, y: 280 }, floor: 0, description: 'Rehabilitation and therapy' },
      { id: 'loc-015', name: 'Mental Health Unit', category: 'department', position: { x: 320, y: 200 }, floor: 0, description: 'Mental health services' },

      // Wards
      { id: 'loc-020', name: 'Maternity Ward', category: 'ward', position: { x: 280, y: 150 }, floor: 1, description: 'Maternity and birthing suite' },
      { id: 'loc-021', name: 'Paediatrics', category: 'ward', position: { x: 300, y: 100 }, floor: 1, description: 'Children\'s ward' },
      { id: 'loc-022', name: 'ICU', category: 'ward', position: { x: 160, y: 120 }, floor: 1, description: 'Intensive Care Unit' },
      { id: 'loc-023', name: 'Surgical Ward', category: 'ward', position: { x: 200, y: 100 }, floor: 1, description: 'Post-surgical recovery' },
      { id: 'loc-024', name: 'General Ward A', category: 'ward', position: { x: 240, y: 180 }, floor: 1, description: 'General medical ward' },
      { id: 'loc-025', name: 'General Ward B', category: 'ward', position: { x: 260, y: 220 }, floor: 1, description: 'General medical ward' },

      // Services
      { id: 'loc-030', name: 'Reception', category: 'service', position: { x: 200, y: 260 }, floor: 0, description: 'Patient registration and enquiries' },
      { id: 'loc-031', name: 'Administration', category: 'service', position: { x: 200, y: 180 }, floor: 0, description: 'Hospital administration offices' },
      { id: 'loc-032', name: 'Medical Records', category: 'service', position: { x: 220, y: 200 }, floor: 0, description: 'Patient records department' },

      // Facilities
      { id: 'loc-040', name: 'Cafeteria', category: 'facility', position: { x: 250, y: 220 }, floor: 0, description: 'Hospital cafeteria and dining' },
      { id: 'loc-041', name: 'Chapel', category: 'facility', position: { x: 300, y: 260 }, floor: 0, description: 'Multi-faith prayer room' },
      { id: 'loc-042', name: 'Gift Shop', category: 'facility', position: { x: 190, y: 300 }, floor: 0, description: 'Hospital gift shop' },
      { id: 'loc-043', name: 'Waiting Area', category: 'facility', position: { x: 160, y: 260 }, floor: 0, description: 'Main waiting area' },
    ];
  }

  subscribe(listener: WizardListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentDraft));
  }

  // Get all hospital locations
  getHospitalLocations(): HospitalLocation[] {
    return [...this.hospitalLocations];
  }

  // Get locations by category
  getLocationsByCategory(category: HospitalLocation['category']): HospitalLocation[] {
    return this.hospitalLocations.filter(loc => loc.category === category);
  }

  // Search locations
  searchLocations(query: string): HospitalLocation[] {
    const lowerQuery = query.toLowerCase();
    return this.hospitalLocations.filter(loc =>
      loc.name.toLowerCase().includes(lowerQuery) ||
      loc.description.toLowerCase().includes(lowerQuery) ||
      loc.category.toLowerCase().includes(lowerQuery)
    );
  }

  // Get wizard steps
  getWizardSteps(): RouteWizardStep[] {
    const draft = this.currentDraft;
    return [
      {
        step: 1,
        title: 'Start Location',
        description: 'Choose where your route begins',
        isComplete: draft?.startLocation !== null && draft?.startLocation !== undefined,
      },
      {
        step: 2,
        title: 'End Location',
        description: 'Choose your destination',
        isComplete: draft?.endLocation !== null && draft?.endLocation !== undefined,
      },
      {
        step: 3,
        title: 'Waypoints',
        description: 'Add stops along the way (optional)',
        isComplete: true, // Always complete since waypoints are optional
      },
      {
        step: 4,
        title: 'Name & Options',
        description: 'Name your route and set preferences',
        isComplete: (draft?.name?.length ?? 0) > 0,
      },
      {
        step: 5,
        title: 'Preview & Save',
        description: 'Review and save your route',
        isComplete: false,
      },
    ];
  }

  // Start a new route creation
  startNewRoute(): RouteCreationDraft {
    this.currentDraft = {
      id: `draft-${Date.now()}`,
      name: '',
      startLocation: null,
      endLocation: null,
      waypoints: [],
      isAccessible: true,
      notes: '',
      sharedWith: [],
      currentStep: 1,
      createdAt: new Date().toISOString(),
    };
    this.notifyListeners();
    return this.currentDraft;
  }

  // Get current draft
  getCurrentDraft(): RouteCreationDraft | null {
    return this.currentDraft;
  }

  // Set start location
  setStartLocation(location: HospitalLocation): void {
    if (this.currentDraft) {
      this.currentDraft.startLocation = location;
      if (this.currentDraft.currentStep < 2) {
        this.currentDraft.currentStep = 2;
      }
      this.autoGenerateName();
      this.notifyListeners();
    }
  }

  // Set end location
  setEndLocation(location: HospitalLocation): void {
    if (this.currentDraft) {
      this.currentDraft.endLocation = location;
      if (this.currentDraft.currentStep < 3) {
        this.currentDraft.currentStep = 3;
      }
      this.autoGenerateName();
      this.notifyListeners();
    }
  }

  // Add waypoint
  addWaypoint(location: HospitalLocation, index?: number): void {
    if (this.currentDraft) {
      if (index !== undefined && index >= 0 && index <= this.currentDraft.waypoints.length) {
        this.currentDraft.waypoints.splice(index, 0, location);
      } else {
        this.currentDraft.waypoints.push(location);
      }
      this.notifyListeners();
    }
  }

  // Remove waypoint
  removeWaypoint(index: number): void {
    if (this.currentDraft && index >= 0 && index < this.currentDraft.waypoints.length) {
      this.currentDraft.waypoints.splice(index, 1);
      this.notifyListeners();
    }
  }

  // Reorder waypoints
  reorderWaypoints(fromIndex: number, toIndex: number): void {
    if (this.currentDraft) {
      const waypoints = this.currentDraft.waypoints;
      if (fromIndex >= 0 && fromIndex < waypoints.length && toIndex >= 0 && toIndex < waypoints.length) {
        const [removed] = waypoints.splice(fromIndex, 1);
        waypoints.splice(toIndex, 0, removed);
        this.notifyListeners();
      }
    }
  }

  // Set route name
  setRouteName(name: string): void {
    if (this.currentDraft) {
      this.currentDraft.name = name;
      this.notifyListeners();
    }
  }

  // Set accessibility
  setAccessible(isAccessible: boolean): void {
    if (this.currentDraft) {
      this.currentDraft.isAccessible = isAccessible;
      this.notifyListeners();
    }
  }

  // Set notes
  setNotes(notes: string): void {
    if (this.currentDraft) {
      this.currentDraft.notes = notes;
      this.notifyListeners();
    }
  }

  // Share with family member
  addShareRecipient(email: string): void {
    if (this.currentDraft && !this.currentDraft.sharedWith.includes(email)) {
      this.currentDraft.sharedWith.push(email);
      this.notifyListeners();
    }
  }

  // Remove share recipient
  removeShareRecipient(email: string): void {
    if (this.currentDraft) {
      this.currentDraft.sharedWith = this.currentDraft.sharedWith.filter(e => e !== email);
      this.notifyListeners();
    }
  }

  // Go to step
  goToStep(step: number): void {
    if (this.currentDraft && step >= 1 && step <= 5) {
      this.currentDraft.currentStep = step;
      this.notifyListeners();
    }
  }

  // Next step
  nextStep(): void {
    if (this.currentDraft && this.currentDraft.currentStep < 5) {
      this.currentDraft.currentStep++;
      this.notifyListeners();
    }
  }

  // Previous step
  previousStep(): void {
    if (this.currentDraft && this.currentDraft.currentStep > 1) {
      this.currentDraft.currentStep--;
      this.notifyListeners();
    }
  }

  // Auto-generate route name
  private autoGenerateName(): void {
    if (this.currentDraft && this.currentDraft.startLocation && this.currentDraft.endLocation) {
      if (!this.currentDraft.name || this.currentDraft.name.includes(' to ')) {
        this.currentDraft.name = `${this.currentDraft.startLocation.name} to ${this.currentDraft.endLocation.name}`;
      }
    }
  }

  // Calculate distance between two points
  private calculateDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
  }

  // Generate route preview
  getRoutePreview(): RoutePreview | null {
    if (!this.currentDraft?.startLocation || !this.currentDraft?.endLocation) {
      return null;
    }

    const points: Array<{ x: number; y: number; name: string }> = [];
    points.push({ ...this.currentDraft.startLocation.position, name: this.currentDraft.startLocation.name });

    for (const wp of this.currentDraft.waypoints) {
      points.push({ ...wp.position, name: wp.name });
    }

    points.push({ ...this.currentDraft.endLocation.position, name: this.currentDraft.endLocation.name });

    // Calculate total distance
    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      totalDistance += this.calculateDistance(points[i], points[i + 1]);
    }

    // Estimate time (average walking speed ~1.2m/s in hospital, scale factor for pixel-to-meter)
    const scaleFactor = 1.5; // pixels to meters
    const distanceMeters = totalDistance * scaleFactor;
    const estimatedTime = Math.ceil(distanceMeters / 1.2); // seconds

    return {
      totalDistance: Math.round(distanceMeters),
      estimatedTime,
      waypointCount: this.currentDraft.waypoints.length,
      isAccessible: this.currentDraft.isAccessible,
      pathPoints: points,
    };
  }

  // Validate draft before saving
  validateDraft(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.currentDraft) {
      return { isValid: false, errors: ['No route draft in progress'] };
    }

    if (!this.currentDraft.startLocation) {
      errors.push('Start location is required');
    }

    if (!this.currentDraft.endLocation) {
      errors.push('End location is required');
    }

    if (!this.currentDraft.name || this.currentDraft.name.trim().length === 0) {
      errors.push('Route name is required');
    }

    if (this.currentDraft.startLocation && this.currentDraft.endLocation &&
        this.currentDraft.startLocation.id === this.currentDraft.endLocation.id) {
      errors.push('Start and end locations must be different');
    }

    return { isValid: errors.length === 0, errors };
  }

  // Save route to history
  saveRoute(): SavedRoute | null {
    const validation = this.validateDraft();
    if (!validation.isValid || !this.currentDraft?.startLocation || !this.currentDraft?.endLocation) {
      return null;
    }

    const preview = this.getRoutePreview();
    if (!preview) return null;

    const savedRoute = routeHistoryService.saveRoute({
      name: this.currentDraft.name,
      startLocation: this.currentDraft.startLocation.name,
      endLocation: this.currentDraft.endLocation.name,
      startPosition: this.currentDraft.startLocation.position,
      endPosition: this.currentDraft.endLocation.position,
      distance: preview.totalDistance,
      estimatedTime: preview.estimatedTime,
      waypoints: preview.pathPoints,
      isAccessible: this.currentDraft.isAccessible,
    });

    // Clear draft after saving
    this.currentDraft = null;
    this.notifyListeners();

    return savedRoute;
  }

  // Cancel route creation
  cancelRoute(): void {
    this.currentDraft = null;
    this.notifyListeners();
  }

  // Get location categories
  getCategories(): Array<{ id: HospitalLocation['category']; name: string; icon: string; count: number }> {
    const categories: Array<{ id: HospitalLocation['category']; name: string; icon: string }> = [
      { id: 'entrance', name: 'Entrances', icon: '🚪' },
      { id: 'emergency', name: 'Emergency', icon: '🚨' },
      { id: 'department', name: 'Departments', icon: '🏥' },
      { id: 'ward', name: 'Wards', icon: '🛏️' },
      { id: 'service', name: 'Services', icon: '📋' },
      { id: 'facility', name: 'Facilities', icon: '🏢' },
    ];

    return categories.map(cat => ({
      ...cat,
      count: this.hospitalLocations.filter(loc => loc.category === cat.id).length,
    }));
  }
}

export const routeCreationWizardService = RouteCreationWizardService.getInstance();
