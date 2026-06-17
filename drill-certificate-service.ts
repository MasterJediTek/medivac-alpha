  style?: Record<string, string | number>;
  variable?: string;
}

export interface CertificateSettings {
  defaultTemplateId: string;
  expiryMonths: number;
  issuerName: string;
  issuerTitle: string;
  organizationName: string;
  organizationLogo: string;
  enableVerification: boolean;
  verificationUrl: string;
  autoGenerate: boolean;
  passingThreshold: number;
}

export interface GenerateCertificateInput {
  drillSessionId: string;
  scenarioId: string;
  scenarioName: string;
  threatType: string;
  difficulty: string;
  userId: string;
  userName: string;
  userRole: string;
  score: number;
  maxScore: number;
  completedAt: string;
  duration: number;
  stepsCompleted: number;
  totalSteps: number;
  hintsUsed: number;
  errorsCount: number;
  templateId?: string;
}

// Certificate level thresholds
export const LEVEL_THRESHOLDS: Record<CertificateLevel, { min: number; max: number; label: string; color: string }> = {
  bronze: { min: 60, max: 74, label: 'Bronze', color: '#CD7F32' },
  silver: { min: 75, max: 84, label: 'Silver', color: '#C0C0C0' },
  gold: { min: 85, max: 94, label: 'Gold', color: '#FFD700' },
  platinum: { min: 95, max: 100, label: 'Platinum', color: '#E5E4E2' },
};

// Default templates
const DEFAULT_TEMPLATES: CertificateTemplate[] = [
  {
    id: 'template_professional',
    name: 'Professional',
    description: 'Clean professional certificate design',
    isDefault: true,
    layout: 'landscape',
    colorScheme: {
      primary: '#1E40AF',
      secondary: '#3B82F6',
      accent: '#F59E0B',
      background: '#FFFFFF',
      text: '#1F2937',
    },
    elements: [
      { id: 'e1', type: 'border', x: 20, y: 20, width: 760, height: 520, style: { borderWidth: 3, borderColor: '#1E40AF' } },
      { id: 'e2', type: 'logo', x: 350, y: 40, width: 100, height: 60, variable: 'organizationLogo' },
      { id: 'e3', type: 'text', x: 400, y: 120, width: 400, height: 40, content: 'Certificate of Completion', style: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' } },
      { id: 'e4', type: 'text', x: 400, y: 170, width: 400, height: 30, content: 'This certifies that', style: { fontSize: 16, textAlign: 'center' } },
      { id: 'e5', type: 'text', x: 400, y: 210, width: 400, height: 50, variable: 'userName', style: { fontSize: 32, fontWeight: 'bold', textAlign: 'center' } },
      { id: 'e6', type: 'text', x: 400, y: 270, width: 400, height: 30, content: 'has successfully completed', style: { fontSize: 16, textAlign: 'center' } },
      { id: 'e7', type: 'text', x: 400, y: 310, width: 400, height: 40, variable: 'scenarioName', style: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' } },
      { id: 'e8', type: 'badge', x: 350, y: 360, width: 100, height: 100, variable: 'level' },
      { id: 'e9', type: 'text', x: 200, y: 480, width: 200, height: 30, variable: 'issuerName', style: { fontSize: 14, textAlign: 'center' } },
      { id: 'e10', type: 'signature', x: 200, y: 450, width: 150, height: 30 },
      { id: 'e11', type: 'qrcode', x: 650, y: 420, width: 80, height: 80, variable: 'verificationCode' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'template_modern',
    name: 'Modern',
    description: 'Contemporary minimalist design',
    isDefault: false,
    layout: 'landscape',
    colorScheme: {
      primary: '#7C3AED',
      secondary: '#A78BFA',
      accent: '#10B981',
      background: '#F9FAFB',
      text: '#111827',
    },
    elements: [
      { id: 'e1', type: 'border', x: 0, y: 0, width: 800, height: 560, style: { borderWidth: 0, backgroundColor: '#F9FAFB' } },
      { id: 'e2', type: 'text', x: 400, y: 80, width: 400, height: 50, content: 'CERTIFICATE', style: { fontSize: 36, fontWeight: 'bold', textAlign: 'center', letterSpacing: 8 } },
      { id: 'e3', type: 'text', x: 400, y: 140, width: 400, height: 30, content: 'OF ACHIEVEMENT', style: { fontSize: 18, textAlign: 'center', letterSpacing: 4 } },
      { id: 'e4', type: 'text', x: 400, y: 220, width: 400, height: 50, variable: 'userName', style: { fontSize: 32, fontWeight: 'bold', textAlign: 'center' } },
      { id: 'e5', type: 'text', x: 400, y: 290, width: 500, height: 60, variable: 'scenarioName', style: { fontSize: 20, textAlign: 'center' } },
      { id: 'e6', type: 'badge', x: 350, y: 360, width: 100, height: 100, variable: 'level' },
      { id: 'e7', type: 'qrcode', x: 700, y: 460, width: 60, height: 60, variable: 'verificationCode' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),