 * Advanced Health Directive (AHD) Service for Western Australia
 * MediVac WACHS v9.2
 * 
 * Implements the WA Advance Health Directive form with:
 * - Multi-step wizard interface
 * - Treatment Decision Maker appointment
 * - Values and Wishes documentation
 * - Life-Sustaining Treatment preferences
 * - Witness signature capture
 * - PDF generation and email submission
 * - Guest access support
 */

// Types
export type AHDStep = 
  | 'welcome'
  | 'personal-details'
  | 'treatment-decision-maker'
  | 'substitute-decision-maker'
  | 'values-wishes'
  | 'life-sustaining-treatment'
  | 'other-treatments'
  | 'organ-donation'
  | 'signature'
  | 'witness'
  | 'review'
  | 'complete';

export type TreatmentPreference = 'want' | 'do-not-want' | 'unsure' | 'not-applicable';

export type LifeSustainingTreatment = 
  | 'cardiopulmonary-resuscitation'
  | 'mechanical-ventilation'
  | 'artificial-nutrition'
  | 'artificial-hydration'
  | 'dialysis'
  | 'blood-transfusion'
  | 'antibiotics'
  | 'palliative-care';

export interface PersonalDetails {
  fullName: string;
  dateOfBirth: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  phone: string;
  email: string;
  medicareNumber?: string;
  ihi?: string; // Individual Healthcare Identifier
}

export interface TreatmentDecisionMaker {
  id: string;
  fullName: string;
  relationship: string;
  address: string;
  phone: string;
  email: string;
  isPrimary: boolean;
  dateAppointed: number;
  acceptedAppointment: boolean;
  signature?: string;
}

export interface SubstituteDecisionMaker {
  id: string;
  fullName: string;
  relationship: string;
  address: string;
  phone: string;
  email: string;
  order: number; // Order of substitution (1st, 2nd, etc.)
  dateAppointed: number;
  acceptedAppointment: boolean;
  signature?: string;
}

export interface ValuesAndWishes {
  qualityOfLife: string;
  importantActivities: string;
  religiousBeliefs: string;
  culturalConsiderations: string;
  personalValues: string;
  fearsConcerns: string;
  additionalWishes: string;
}

export interface TreatmentDecision {
  treatment: LifeSustainingTreatment;
  preference: TreatmentPreference;
  conditions?: string;
  notes?: string;
}

export interface OtherTreatmentDecision {
  id: string;
  treatmentName: string;