/**
 * AHD Document History Service - MediVac WACHS v9.3
 * Version tracking, comparison, and document management
 */

// Types
export type DocumentStatus = 'draft' | 'pending-review' | 'signed' | 'witnessed' | 'complete' | 'archived' | 'revoked';
export type ChangeType = 'create' | 'update' | 'sign' | 'witness' | 'archive' | 'restore' | 'revoke' | 'share';

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  createdAt: string;
  createdBy: string;
  changeType: ChangeType;
  changeDescription: string;
  snapshot: string; // JSON snapshot of document at this version
  previousVersionId: string | null;
  metadata: {
    fieldsChanged: string[];
    signaturesAdded: number;
    witnessesAdded: number;
    completionPercentage: number;
  };
}

export interface DocumentDiff {
  field: string;
  section: string;
  oldValue: string | null;
  newValue: string | null;
  changeType: 'added' | 'modified' | 'removed';
}

export interface DocumentHistoryEntry {
  id: string;
  documentId: string;
  action: ChangeType;
  description: string;
  performedBy: string;
  performedAt: string;
  versionId: string;
  ipAddress?: string;
  deviceInfo?: string;
}

export interface ArchivedDocument {
  id: string;
  documentId: string;
  archivedAt: string;
  archivedBy: string;
  reason: string;
  retentionPeriod: number; // days
  expiresAt: string;
  canRestore: boolean;
}

export interface SharedDocument {
  id: string;
  documentId: string;
  sharedWith: string; // email or user ID
  sharedBy: string;
  sharedAt: string;
  expiresAt: string | null;
  permissions: ('view' | 'download' | 'print')[];
  accessCount: number;
  lastAccessedAt: string | null;
  isActive: boolean;
}

export interface DocumentSearchFilters {
  status?: DocumentStatus[];
  dateFrom?: string;
  dateTo?: string;
  signedBy?: string;
  searchText?: string;
  hasWitnesses?: boolean;
  isComplete?: boolean;
}

export interface DocumentAnalytics {
  totalDocuments: number;
  byStatus: Record<DocumentStatus, number>;
  completionRate: number;
  averageCompletionTime: number; // hours
  totalVersions: number;
  totalShares: number;
  mostEditedSections: { section: string; edits: number }[];
}

// Section names for tracking
const SECTIONS = [
  'personal-details',
  'treatment-decision-makers',
  'substitute-decision-makers',
  'values-wishes',
  'life-sustaining-treatment',
  'other-treatment',
  'organ-donation',
  'signatures',
  'witnesses',
];

class AHDDocumentHistoryService {
  private versions: Map<string, DocumentVersion[]> = new Map();
  private history: Map<string, DocumentHistoryEntry[]> = new Map();
  private archived: Map<string, ArchivedDocument> = new Map();
  private shared: Map<string, SharedDocument[]> = new Map();
  private documents: Map<string, any> = new Map(); // Current document states

  // Create initial version for a document
  createInitialVersion(
    documentId: string,
    documentSnapshot: any,
    createdBy: string
  ): DocumentVersion {
    const version: DocumentVersion = {
      id: `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      documentId,
      version: 1,
      createdAt: new Date().toISOString(),
      createdBy,
      changeType: 'create',
      changeDescription: 'Document created',
      snapshot: JSON.stringify(documentSnapshot),
      previousVersionId: null,
      metadata: {
        fieldsChanged: ['all'],
        signaturesAdded: 0,
        witnessesAdded: 0,
        completionPercentage: this.calculateCompletion(documentSnapshot),
      },
    };

    const versions = this.versions.get(documentId) || [];
    versions.push(version);
    this.versions.set(documentId, versions);
    this.documents.set(documentId, documentSnapshot);

    // Add history entry
    this.addHistoryEntry(documentId, 'create', 'Document created', createdBy, version.id);

    return version;
  }

  // Save new version
  saveVersion(
    documentId: string,
    documentSnapshot: any,
    changedBy: string,
    changeDescription: string,
    changeType: ChangeType = 'update'
  ): DocumentVersion {
    const versions = this.versions.get(documentId) || [];
    const previousVersion = versions[versions.length - 1];
    const previousSnapshot = previousVersion ? JSON.parse(previousVersion.snapshot) : null;

    // Calculate what changed
    const fieldsChanged = this.getChangedFields(previousSnapshot, documentSnapshot);

    const version: DocumentVersion = {
      id: `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      documentId,
      version: versions.length + 1,
      createdAt: new Date().toISOString(),
      createdBy: changedBy,
      changeType,
      changeDescription,
      snapshot: JSON.stringify(documentSnapshot),
      previousVersionId: previousVersion?.id || null,
      metadata: {
        fieldsChanged,
        signaturesAdded: this.countNewSignatures(previousSnapshot, documentSnapshot),
        witnessesAdded: this.countNewWitnesses(previousSnapshot, documentSnapshot),
        completionPercentage: this.calculateCompletion(documentSnapshot),
      },
    };

    versions.push(version);
    this.versions.set(documentId, versions);
    this.documents.set(documentId, documentSnapshot);

    // Add history entry
    this.addHistoryEntry(documentId, changeType, changeDescription, changedBy, version.id);

    return version;
  }

  // Get all versions for a document
  getVersions(documentId: string): DocumentVersion[] {
    return this.versions.get(documentId) || [];
  }

  // Get specific version
  getVersion(documentId: string, versionId: string): DocumentVersion | null {
    const versions = this.versions.get(documentId) || [];
    return versions.find(v => v.id === versionId) || null;
  }

  // Get version by number
  getVersionByNumber(documentId: string, versionNumber: number): DocumentVersion | null {
    const versions = this.versions.get(documentId) || [];
    return versions.find(v => v.version === versionNumber) || null;
  }

  // Get latest version
  getLatestVersion(documentId: string): DocumentVersion | null {
    const versions = this.versions.get(documentId) || [];
    return versions[versions.length - 1] || null;
  }

  // Compare two versions
  compareVersions(documentId: string, version1Id: string, version2Id: string): DocumentDiff[] {
    const v1 = this.getVersion(documentId, version1Id);
    const v2 = this.getVersion(documentId, version2Id);

    if (!v1 || !v2) return [];

    const snapshot1 = JSON.parse(v1.snapshot);
    const snapshot2 = JSON.parse(v2.snapshot);

    return this.generateDiff(snapshot1, snapshot2);
  }

  // Generate diff between two snapshots
  private generateDiff(old: any, current: any, path: string = ''): DocumentDiff[] {
    const diffs: DocumentDiff[] = [];

    // Get all keys from both objects
    const allKeys = new Set([
      ...Object.keys(old || {}),
      ...Object.keys(current || {}),
    ]);

    allKeys.forEach(key => {
      const fieldPath = path ? `${path}.${key}` : key;
      const oldValue = old?.[key];
      const newValue = current?.[key];

      if (oldValue === undefined && newValue !== undefined) {
        diffs.push({
          field: fieldPath,
          section: this.getSectionForField(fieldPath),
          oldValue: null,
          newValue: typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue),
          changeType: 'added',
        });
      } else if (oldValue !== undefined && newValue === undefined) {
        diffs.push({
          field: fieldPath,
          section: this.getSectionForField(fieldPath),
          oldValue: typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue),
          newValue: null,
          changeType: 'removed',
        });
      } else if (typeof oldValue === 'object' && typeof newValue === 'object') {
        if (Array.isArray(oldValue) && Array.isArray(newValue)) {
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            diffs.push({
              field: fieldPath,
              section: this.getSectionForField(fieldPath),
              oldValue: JSON.stringify(oldValue),
              newValue: JSON.stringify(newValue),
              changeType: 'modified',
            });
          }
        } else {
          diffs.push(...this.generateDiff(oldValue, newValue, fieldPath));
        }
      } else if (oldValue !== newValue) {
        diffs.push({
          field: fieldPath,
          section: this.getSectionForField(fieldPath),
          oldValue: String(oldValue),
          newValue: String(newValue),
          changeType: 'modified',
        });
      }
    });

    return diffs;
  }

  // Get section name for a field path
  private getSectionForField(fieldPath: string): string {
    const firstPart = fieldPath.split('.')[0];
    
    const sectionMap: Record<string, string> = {
      personalDetails: 'personal-details',
      treatmentDecisionMakers: 'treatment-decision-makers',
      substituteDecisionMakers: 'substitute-decision-makers',
      valuesAndWishes: 'values-wishes',
      lifeSustainingTreatment: 'life-sustaining-treatment',
      otherTreatment: 'other-treatment',
      organDonation: 'organ-donation',
      signatures: 'signatures',
      witnesses: 'witnesses',
    };

    return sectionMap[firstPart] || 'general';
  }

  // Restore document to a specific version
  restoreToVersion(documentId: string, versionId: string, restoredBy: string): DocumentVersion | null {
    const targetVersion = this.getVersion(documentId, versionId);
    if (!targetVersion) return null;

    const snapshot = JSON.parse(targetVersion.snapshot);
    
    return this.saveVersion(
      documentId,
      snapshot,
      restoredBy,
      `Restored to version ${targetVersion.version}`,
      'restore'
    );
  }

  // Archive document
  archiveDocument(
    documentId: string,
    archivedBy: string,
    reason: string,
    retentionDays: number = 365 * 7 // 7 years default for medical records
  ): ArchivedDocument {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + retentionDays);

    const archived: ArchivedDocument = {
      id: `arch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      documentId,
      archivedAt: new Date().toISOString(),
      archivedBy,
      reason,
      retentionPeriod: retentionDays,
      expiresAt: expiresAt.toISOString(),
      canRestore: true,
    };

    this.archived.set(documentId, archived);

    // Add history entry
    const latestVersion = this.getLatestVersion(documentId);
    this.addHistoryEntry(documentId, 'archive', reason, archivedBy, latestVersion?.id || '');

    return archived;
  }

  // Restore archived document
  restoreArchivedDocument(documentId: string, restoredBy: string): boolean {
    const archived = this.archived.get(documentId);
    if (!archived || !archived.canRestore) return false;

    this.archived.delete(documentId);

    // Add history entry
    const latestVersion = this.getLatestVersion(documentId);
    this.addHistoryEntry(documentId, 'restore', 'Document restored from archive', restoredBy, latestVersion?.id || '');

    return true;
  }

  // Get archived document info
  getArchivedInfo(documentId: string): ArchivedDocument | null {
    return this.archived.get(documentId) || null;
  }

  // Check if document is archived
  isArchived(documentId: string): boolean {
    return this.archived.has(documentId);
  }

  // Share document
  shareDocument(
    documentId: string,
    sharedWith: string,
    sharedBy: string,
    permissions: SharedDocument['permissions'],
    expiresInDays?: number
  ): SharedDocument {
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const share: SharedDocument = {
      id: `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      documentId,
      sharedWith,
      sharedBy,
      sharedAt: new Date().toISOString(),
      expiresAt,
      permissions,
      accessCount: 0,
      lastAccessedAt: null,
      isActive: true,
    };

    const shares = this.shared.get(documentId) || [];
    shares.push(share);
    this.shared.set(documentId, shares);

    // Add history entry
    const latestVersion = this.getLatestVersion(documentId);
    this.addHistoryEntry(documentId, 'share', `Shared with ${sharedWith}`, sharedBy, latestVersion?.id || '');

    return share;
  }

  // Revoke share
  revokeShare(documentId: string, shareId: string): boolean {
    const shares = this.shared.get(documentId) || [];
    const share = shares.find(s => s.id === shareId);
    
    if (!share) return false;
    
    share.isActive = false;
    return true;
  }

  // Get shares for document
  getShares(documentId: string): SharedDocument[] {
    return (this.shared.get(documentId) || []).filter(s => s.isActive);
  }

  // Record share access
  recordShareAccess(shareId: string): boolean {
    for (const shares of this.shared.values()) {
      const share = shares.find(s => s.id === shareId);
      if (share && share.isActive) {
        share.accessCount++;
        share.lastAccessedAt = new Date().toISOString();
        return true;
      }
    }
    return false;
  }

  // Add history entry
  private addHistoryEntry(
    documentId: string,
    action: ChangeType,
    description: string,
    performedBy: string,
    versionId: string
  ): void {
    const entry: DocumentHistoryEntry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      documentId,
      action,
      description,
      performedBy,
      performedAt: new Date().toISOString(),
      versionId,
    };

    const history = this.history.get(documentId) || [];
    history.push(entry);
    this.history.set(documentId, history);
  }

  // Get document history
  getHistory(documentId: string): DocumentHistoryEntry[] {
    return this.history.get(documentId) || [];
  }

  // Search documents
  searchDocuments(filters: DocumentSearchFilters): string[] {
    const results: string[] = [];

    this.documents.forEach((doc, docId) => {
      let matches = true;

      if (filters.status && filters.status.length > 0) {
        matches = matches && filters.status.includes(doc.status);
      }

      if (filters.dateFrom) {
        matches = matches && new Date(doc.createdAt) >= new Date(filters.dateFrom);
      }

      if (filters.dateTo) {
        matches = matches && new Date(doc.createdAt) <= new Date(filters.dateTo);
      }

      if (filters.signedBy) {
        matches = matches && doc.personalDetails?.fullName?.toLowerCase().includes(filters.signedBy.toLowerCase());
      }

      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const docString = JSON.stringify(doc).toLowerCase();
        matches = matches && docString.includes(searchLower);
      }

      if (filters.hasWitnesses !== undefined) {
        const hasWitnesses = (doc.witnesses?.length || 0) > 0;
        matches = matches && hasWitnesses === filters.hasWitnesses;
      }

      if (filters.isComplete !== undefined) {
        matches = matches && (doc.status === 'complete') === filters.isComplete;
      }

      if (matches) {
        results.push(docId);
      }
    });

    return results;
  }

  // Calculate completion percentage
  private calculateCompletion(doc: any): number {
    let completed = 0;
    let total = 0;

    // Personal details
    total += 5;
    if (doc.personalDetails?.fullName) completed++;
    if (doc.personalDetails?.dateOfBirth) completed++;
    if (doc.personalDetails?.address) completed++;
    if (doc.personalDetails?.phone) completed++;
    if (doc.personalDetails?.email) completed++;

    // Treatment decision makers
    total += 1;
    if (doc.treatmentDecisionMakers?.length > 0) completed++;

    // Values and wishes
    total += 3;
    if (doc.valuesAndWishes?.qualityOfLife) completed++;
    if (doc.valuesAndWishes?.importantActivities) completed++;
    if (doc.valuesAndWishes?.fears) completed++;

    // Treatment decisions
    total += 1;
    if (doc.treatmentDecisions && Object.keys(doc.treatmentDecisions).length > 0) completed++;

    // Signatures
    total += 1;
    if (doc.signatures?.length > 0) completed++;

    // Witnesses
    total += 1;
    if (doc.witnesses?.length >= 2) completed++;

    return Math.round((completed / total) * 100);
  }

  // Get changed fields between snapshots
  private getChangedFields(old: any, current: any): string[] {
    const diffs = this.generateDiff(old, current);
    return [...new Set(diffs.map(d => d.field))];
  }

  // Count new signatures
  private countNewSignatures(old: any, current: any): number {
    const oldCount = old?.signatures?.length || 0;
    const newCount = current?.signatures?.length || 0;
    return Math.max(0, newCount - oldCount);
  }

  // Count new witnesses
  private countNewWitnesses(old: any, current: any): number {
    const oldCount = old?.witnesses?.length || 0;
    const newCount = current?.witnesses?.length || 0;
    return Math.max(0, newCount - oldCount);
  }

  // Get analytics
  getAnalytics(): DocumentAnalytics {
    const documents = Array.from(this.documents.values());
    
    const byStatus: Record<DocumentStatus, number> = {
      'draft': 0,
      'pending-review': 0,
      'signed': 0,
      'witnessed': 0,
      'complete': 0,
      'archived': 0,
      'revoked': 0,
    };

    documents.forEach(doc => {
      const status = doc.status || 'draft';
      byStatus[status as DocumentStatus] = (byStatus[status as DocumentStatus] || 0) + 1;
    });

    // Calculate section edits
    const sectionEdits: Record<string, number> = {};
    this.versions.forEach(versions => {
      versions.forEach(v => {
        v.metadata.fieldsChanged.forEach(field => {
          const section = this.getSectionForField(field);
          sectionEdits[section] = (sectionEdits[section] || 0) + 1;
        });
      });
    });

    const mostEditedSections = Object.entries(sectionEdits)
      .map(([section, edits]) => ({ section, edits }))
      .sort((a, b) => b.edits - a.edits)
      .slice(0, 5);

    let totalVersions = 0;
    this.versions.forEach(v => totalVersions += v.length);

    let totalShares = 0;
    this.shared.forEach(s => totalShares += s.length);

    const completeCount = byStatus['complete'];
    const completionRate = documents.length > 0 ? (completeCount / documents.length) * 100 : 0;

    return {
      totalDocuments: documents.length,
      byStatus,
      completionRate,
      averageCompletionTime: 48, // Mock average
      totalVersions,
      totalShares,
      mostEditedSections,
    };
  }

  // Export document with history
  exportWithHistory(documentId: string): string {
    const document = this.documents.get(documentId);
    const versions = this.versions.get(documentId) || [];
    const history = this.history.get(documentId) || [];
    const shares = this.shared.get(documentId) || [];
    const archived = this.archived.get(documentId);

    return JSON.stringify({
      document,
      versions,
      history,
      shares,
      archived,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  // Import document with history
  importWithHistory(jsonData: string): string | null {
    try {
      const data = JSON.parse(jsonData);
      const newDocId = `ahd_imported_${Date.now()}`;

      if (data.document) {
        data.document.id = newDocId;
        this.documents.set(newDocId, data.document);
      }

      if (data.versions) {
        const newVersions = data.versions.map((v: DocumentVersion) => ({
          ...v,
          documentId: newDocId,
        }));
        this.versions.set(newDocId, newVersions);
      }

      if (data.history) {
        const newHistory = data.history.map((h: DocumentHistoryEntry) => ({
          ...h,
          documentId: newDocId,
        }));
        this.history.set(newDocId, newHistory);
      }

      return newDocId;
    } catch (e) {
      return null;
    }
  }

  // Reset service
  reset(): void {
    this.versions.clear();
    this.history.clear();
    this.archived.clear();
    this.shared.clear();
    this.documents.clear();
  }
}

export const ahdDocumentHistoryService = new AHDDocumentHistoryService();
