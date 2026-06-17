/**
 * Tests for MediVac WACHS v9.3 Features
 * Signature Pad, AHD Document History, Print Preview
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { signaturePadService } from '../signature-pad-service';
import { ahdDocumentHistoryService } from '../ahd-document-history-service';
import { printPreviewService } from '../print-preview-service';

describe('Signature Pad Service', () => {
  beforeEach(() => {
    signaturePadService.reset();
  });

  it('should create a new signature', () => {
    const signature = signaturePadService.createSignature('John Smith', 'maker', 300, 150);
    expect(signature).toBeDefined();
    expect(signature.signedBy).toBe('John Smith');
    expect(signature.purpose).toBe('maker');
    // Check that signature has required properties
    expect(signature).toHaveProperty('id');
    expect(signature).toHaveProperty('strokes');
  });

  it('should record strokes', () => {
    signaturePadService.createSignature('Test User', 'witness', 300, 150);
    
    signaturePadService.startStroke(10, 10);
    signaturePadService.addPoint(20, 20);
    signaturePadService.addPoint(30, 30);
    const stroke = signaturePadService.endStroke();
    
    expect(stroke).toBeDefined();
    expect(stroke!.points.length).toBeGreaterThan(0);
  });

  it('should support undo and redo', () => {
    signaturePadService.createSignature('Test User', 'maker', 300, 150);
    
    signaturePadService.startStroke(10, 10);
    signaturePadService.addPoint(20, 20);
    signaturePadService.endStroke();
    
    expect(signaturePadService.canUndo()).toBe(true);
    expect(signaturePadService.undo()).toBe(true);
    expect(signaturePadService.canRedo()).toBe(true);
    expect(signaturePadService.redo()).toBe(true);
  });

  it('should clear signature', () => {
    signaturePadService.createSignature('Test User', 'maker', 300, 150);
    
    signaturePadService.startStroke(10, 10);
    signaturePadService.addPoint(20, 20);
    signaturePadService.endStroke();
    
    signaturePadService.clear();
    const signature = signaturePadService.getCurrentSignature();
    expect(signature?.strokes.length).toBe(0);
  });

  it('should validate signature', () => {
    signaturePadService.createSignature('Test User', 'maker', 300, 150);
    
    // Add multiple strokes to make it valid
    for (let i = 0; i < 5; i++) {
      signaturePadService.startStroke(10 + i * 20, 10);
      for (let j = 0; j < 20; j++) {
        signaturePadService.addPoint(10 + i * 20 + j, 10 + j * 5);
      }
      signaturePadService.endStroke();
    }
    
    const signature = signaturePadService.getCurrentSignature();
    expect(signature).toBeDefined();
  });

  it('should save and retrieve signatures', () => {
    signaturePadService.createSignature('Test User', 'maker', 300, 150);
    
    signaturePadService.startStroke(10, 10);
    signaturePadService.addPoint(50, 50);
    signaturePadService.endStroke();
    
    const saved = signaturePadService.saveSignature();
    expect(saved).toBeDefined();
    
    const all = signaturePadService.getAllSignatures();
    expect(all.length).toBeGreaterThan(0);
  });

  it('should get available colors and thicknesses', () => {
    const colors = signaturePadService.getAvailableColors();
    expect(colors.length).toBeGreaterThan(0);
    expect(colors[0]).toHaveProperty('id');
    expect(colors[0]).toHaveProperty('hex');
    
    const thicknesses = signaturePadService.getAvailableThicknesses();
    expect(thicknesses.length).toBeGreaterThan(0);
    expect(thicknesses[0]).toHaveProperty('id');
    expect(thicknesses[0]).toHaveProperty('pixels');
  });

  it('should update settings', () => {
    signaturePadService.setColor('blue');
    signaturePadService.setThickness('thick');
    
    const settings = signaturePadService.getSettings();
    expect(settings.color).toBe('blue');
    expect(settings.thickness).toBe('thick');
  });

  it('should export signature', () => {
    signaturePadService.createSignature('Test User', 'maker', 300, 150);
    
    signaturePadService.startStroke(10, 10);
    signaturePadService.addPoint(50, 50);
    signaturePadService.endStroke();
    
    const exported = signaturePadService.exportSignature('svg');
    expect(exported).toBeDefined();
    expect(exported!.format).toBe('svg');
    expect(exported!.filename).toContain('.svg');
  });

  it('should get analytics', () => {
    const analytics = signaturePadService.getAnalytics();
    expect(analytics).toHaveProperty('totalSignatures');
    expect(analytics).toHaveProperty('validSignatures');
    expect(analytics).toHaveProperty('invalidSignatures');
    expect(analytics).toHaveProperty('averageStrokes');
  });
});

describe('AHD Document History Service', () => {
  beforeEach(() => {
    ahdDocumentHistoryService.reset();
  });

  it('should create initial version', () => {
    const doc = { personalDetails: { fullName: 'John Smith' } };
    const version = ahdDocumentHistoryService.createInitialVersion('doc1', doc, 'user');
    
    expect(version).toBeDefined();
    expect(version.version).toBe(1);
    expect(version.changeType).toBe('create');
    expect(version.documentId).toBe('doc1');
  });

  it('should save new versions', () => {
    const doc1 = { personalDetails: { fullName: 'John Smith' } };
    ahdDocumentHistoryService.createInitialVersion('doc1', doc1, 'user');
    
    const doc2 = { personalDetails: { fullName: 'John Smith', phone: '0412345678' } };
    const version = ahdDocumentHistoryService.saveVersion('doc1', doc2, 'user', 'Added phone number');
    
    expect(version.version).toBe(2);
    expect(version.changeDescription).toBe('Added phone number');
  });

  it('should get all versions', () => {
    const doc = { personalDetails: { fullName: 'John Smith' } };
    ahdDocumentHistoryService.createInitialVersion('doc1', doc, 'user');
    ahdDocumentHistoryService.saveVersion('doc1', { ...doc, status: 'draft' }, 'user', 'Update 1');
    ahdDocumentHistoryService.saveVersion('doc1', { ...doc, status: 'pending' }, 'user', 'Update 2');
    
    const versions = ahdDocumentHistoryService.getVersions('doc1');
    expect(versions.length).toBe(3);
  });

  it('should get specific version', () => {
    const doc = { personalDetails: { fullName: 'John Smith' } };
    const initial = ahdDocumentHistoryService.createInitialVersion('doc1', doc, 'user');
    
    const version = ahdDocumentHistoryService.getVersion('doc1', initial.id);
    expect(version).toBeDefined();
    expect(version!.id).toBe(initial.id);
  });

  it('should get latest version', () => {
    const doc = { personalDetails: { fullName: 'John Smith' } };
    ahdDocumentHistoryService.createInitialVersion('doc1', doc, 'user');
    ahdDocumentHistoryService.saveVersion('doc1', { ...doc, status: 'latest' }, 'user', 'Latest');
    
    const latest = ahdDocumentHistoryService.getLatestVersion('doc1');
    expect(latest).toBeDefined();
    expect(latest!.version).toBe(2);
  });

  it('should compare versions', () => {
    const doc1 = { personalDetails: { fullName: 'John Smith' } };
    const v1 = ahdDocumentHistoryService.createInitialVersion('doc1', doc1, 'user');
    
    const doc2 = { personalDetails: { fullName: 'John Smith', phone: '0412345678' } };
    const v2 = ahdDocumentHistoryService.saveVersion('doc1', doc2, 'user', 'Added phone');
    
    const diffs = ahdDocumentHistoryService.compareVersions('doc1', v1.id, v2.id);
    expect(diffs.length).toBeGreaterThan(0);
  });

  it('should restore to version', () => {
    const doc1 = { personalDetails: { fullName: 'John Smith' } };
    const v1 = ahdDocumentHistoryService.createInitialVersion('doc1', doc1, 'user');
    
    ahdDocumentHistoryService.saveVersion('doc1', { personalDetails: { fullName: 'Jane Smith' } }, 'user', 'Changed name');
    
    const restored = ahdDocumentHistoryService.restoreToVersion('doc1', v1.id, 'user');
    expect(restored).toBeDefined();
    expect(restored!.changeType).toBe('restore');
  });

  it('should archive and restore document', () => {
    const doc = { personalDetails: { fullName: 'John Smith' } };
    ahdDocumentHistoryService.createInitialVersion('doc1', doc, 'user');
    
    const archived = ahdDocumentHistoryService.archiveDocument('doc1', 'user', 'No longer needed');
    expect(archived).toBeDefined();
    expect(ahdDocumentHistoryService.isArchived('doc1')).toBe(true);
    
    const restored = ahdDocumentHistoryService.restoreArchivedDocument('doc1', 'user');
    expect(restored).toBe(true);
    expect(ahdDocumentHistoryService.isArchived('doc1')).toBe(false);
  });

  it('should share document', () => {
    const doc = { personalDetails: { fullName: 'John Smith' } };
    ahdDocumentHistoryService.createInitialVersion('doc1', doc, 'user');
    
    const share = ahdDocumentHistoryService.shareDocument(
      'doc1',
      'doctor@hospital.com',
      'user',
      ['view', 'download'],
      30
    );
    
    expect(share).toBeDefined();
    expect(share.sharedWith).toBe('doctor@hospital.com');
    expect(share.permissions).toContain('view');
  });

  it('should get document history', () => {
    const doc = { personalDetails: { fullName: 'John Smith' } };
    ahdDocumentHistoryService.createInitialVersion('doc1', doc, 'user');
    ahdDocumentHistoryService.saveVersion('doc1', { ...doc, status: 'updated' }, 'user', 'Update');
    
    const history = ahdDocumentHistoryService.getHistory('doc1');
    expect(history.length).toBeGreaterThan(0);
  });

  it('should export and import with history', () => {
    const doc = { personalDetails: { fullName: 'John Smith' } };
    ahdDocumentHistoryService.createInitialVersion('doc1', doc, 'user');
    
    const exported = ahdDocumentHistoryService.exportWithHistory('doc1');
    expect(exported).toBeDefined();
    
    const importedId = ahdDocumentHistoryService.importWithHistory(exported);
    expect(importedId).toBeDefined();
  });

  it('should get analytics', () => {
    const analytics = ahdDocumentHistoryService.getAnalytics();
    expect(analytics).toHaveProperty('totalDocuments');
    expect(analytics).toHaveProperty('byStatus');
    expect(analytics).toHaveProperty('completionRate');
    expect(analytics).toHaveProperty('totalVersions');
  });
});

describe('Print Preview Service', () => {
  beforeEach(() => {
    printPreviewService.reset();
  });

  it('should initialize preview', () => {
    const doc = { personalDetails: { fullName: 'John Smith' } };
    const state = printPreviewService.initializePreview('doc1', doc);
    
    expect(state).toBeDefined();
    expect(state.documentId).toBe('doc1');
    expect(state.currentPage).toBe(1);
    expect(state.totalPages).toBeGreaterThan(0);
  });

  it('should get pages', () => {
    const doc = { personalDetails: { fullName: 'John Smith' } };
    printPreviewService.initializePreview('doc1', doc);
    
    const pages = printPreviewService.getPages('doc1');
    expect(pages.length).toBeGreaterThan(0);
  });

  it('should navigate pages', () => {
    const doc = { personalDetails: { fullName: 'John Smith' } };
    printPreviewService.initializePreview('doc1', doc);
    
    const next = printPreviewService.nextPage('doc1');
    expect(next).toBeDefined();
    
    const prev = printPreviewService.previousPage('doc1');
    expect(prev).toBeDefined();
  });

  it('should go to specific page', () => {
    const doc = { personalDetails: { fullName: 'John Smith' } };
    printPreviewService.initializePreview('doc1', doc);
    
    const state = printPreviewService.goToPage('doc1', 2);
    expect(state).toBeDefined();
    expect(state!.currentPage).toBe(2);
  });

  it('should zoom in and out', () => {
    const doc = { personalDetails: { fullName: 'John Smith' } };
    printPreviewService.initializePreview('doc1', doc);
    
    const zoomedIn = printPreviewService.zoomIn('doc1');
    expect(zoomedIn).toBeDefined();
    expect(zoomedIn!.zoom).toBeGreaterThan(100);
    
    const zoomedOut = printPreviewService.zoomOut('doc1');
    expect(zoomedOut).toBeDefined();
  });

  it('should set zoom level', () => {
    const doc = { personalDetails: { fullName: 'John Smith' } };
    printPreviewService.initializePreview('doc1', doc);
    
    const state = printPreviewService.setZoom('doc1', 150);
    expect(state).toBeDefined();
    expect(state!.zoom).toBe(150);
  });

  it('should toggle thumbnails and annotation panel', () => {
    const doc = { personalDetails: { fullName: 'John Smith' } };
    printPreviewService.initializePreview('doc1', doc);
    
    const withThumbnails = printPreviewService.toggleThumbnails('doc1');
    expect(withThumbnails).toBeDefined();
    
    const withAnnotations = printPreviewService.toggleAnnotationPanel('doc1');
    expect(withAnnotations).toBeDefined();
  });

  it('should add and get annotations', () => {
    const doc = { personalDetails: { fullName: 'John Smith' } };
    printPreviewService.initializePreview('doc1', doc);
    
    const annotation = printPreviewService.addAnnotation(
      'doc1', 1, 'highlight', 100, 100, 50, 20, '#FFFF00', 'Test note'
    );
    
    expect(annotation).toBeDefined();
    expect(annotation.type).toBe('highlight');
    
    const annotations = printPreviewService.getAnnotations('doc1', 1);
    expect(annotations.length).toBeGreaterThan(0);
  });

  it('should delete annotation', () => {
    const doc = { personalDetails: { fullName: 'John Smith' } };
    printPreviewService.initializePreview('doc1', doc);
    
    const annotation = printPreviewService.addAnnotation(
      'doc1', 1, 'note', 100, 100, 50, 20, '#FF0000'
    );
    
    const deleted = printPreviewService.deleteAnnotation('doc1', annotation.id);
    expect(deleted).toBe(true);
  });

  it('should update settings', () => {
    const doc = { personalDetails: { fullName: 'John Smith' } };
    printPreviewService.initializePreview('doc1', doc);
    
    const settings = printPreviewService.updateSettings('doc1', { pageSize: 'Letter' });
    expect(settings.pageSize).toBe('Letter');
  });

  it('should update watermark', () => {
    const doc = { personalDetails: { fullName: 'John Smith' } };
    printPreviewService.initializePreview('doc1', doc);
    
    const watermark = printPreviewService.updateWatermark('doc1', { 
      enabled: true, 
      text: 'CONFIDENTIAL' 
    });
    
    expect(watermark.enabled).toBe(true);
    expect(watermark.text).toBe('CONFIDENTIAL');
  });

  it('should get page dimensions', () => {
    const doc = { personalDetails: { fullName: 'John Smith' } };
    printPreviewService.initializePreview('doc1', doc);
    
    const dimensions = printPreviewService.getPageDimensions('doc1');
    expect(dimensions).toHaveProperty('width');
    expect(dimensions).toHaveProperty('height');
    expect(dimensions).toHaveProperty('marginTop');
  });

  it('should get available options', () => {
    const pageSizes = printPreviewService.getAvailablePageSizes();
    expect(pageSizes.length).toBeGreaterThan(0);
    
    const zoomLevels = printPreviewService.getAvailableZoomLevels();
    expect(zoomLevels.length).toBeGreaterThan(0);
    
    const annotationTypes = printPreviewService.getAnnotationTypes();
    expect(annotationTypes.length).toBeGreaterThan(0);
  });

  it('should export PDF', () => {
    const doc = { personalDetails: { fullName: 'John Smith' } };
    printPreviewService.initializePreview('doc1', doc);
    
    const result = printPreviewService.exportPDF('doc1');
    expect(result.success).toBe(true);
    expect(result.filename).toContain('.pdf');
  });

  it('should print document', () => {
    const doc = { personalDetails: { fullName: 'John Smith' } };
    printPreviewService.initializePreview('doc1', doc);
    
    const result = printPreviewService.print('doc1');
    expect(result.success).toBe(true);
  });

  it('should get analytics', () => {
    const analytics = printPreviewService.getAnalytics();
    expect(analytics).toHaveProperty('totalPreviews');
    expect(analytics).toHaveProperty('totalAnnotations');
    expect(analytics).toHaveProperty('mostUsedAnnotationType');
    expect(analytics).toHaveProperty('averagePagesPerDocument');
  });

  it('should get thumbnails', () => {
    const doc = { personalDetails: { fullName: 'John Smith' } };
    printPreviewService.initializePreview('doc1', doc);
    
    const thumbnails = printPreviewService.getThumbnails('doc1');
    expect(thumbnails.length).toBeGreaterThan(0);
    expect(thumbnails[0]).toHaveProperty('pageNumber');
    expect(thumbnails[0]).toHaveProperty('width');
    expect(thumbnails[0]).toHaveProperty('height');
  });
});
