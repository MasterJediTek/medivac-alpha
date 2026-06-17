/**
 * Print Preview Service - MediVac WACHS v9.3
 * PDF-accurate page layout preview with annotations
 */

// Types
export type PageSize = 'A4' | 'Letter' | 'Legal';
export type PageOrientation = 'portrait' | 'landscape';
export type ZoomLevel = 25 | 50 | 75 | 100 | 125 | 150 | 200;
export type AnnotationType = 'highlight' | 'underline' | 'strikethrough' | 'note' | 'stamp' | 'signature';

export interface PageDimensions {
  width: number;
  height: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
}

export interface PageContent {
  id: string;
  pageNumber: number;
  sections: PageSection[];
  hasHeader: boolean;
  hasFooter: boolean;
  isPageBreak: boolean;
}

export interface PageSection {
  id: string;
  type: 'heading' | 'paragraph' | 'list' | 'table' | 'signature-block' | 'checkbox-group' | 'divider';
  content: string;
  style: {
    fontSize: number;
    fontWeight: 'normal' | 'bold';
    fontStyle: 'normal' | 'italic';
    textAlign: 'left' | 'center' | 'right' | 'justify';
    marginTop: number;
    marginBottom: number;
  };
  metadata?: Record<string, any>;
}

export interface Annotation {
  id: string;
  pageNumber: number;
  type: AnnotationType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  content?: string;
  createdAt: string;
  createdBy: string;
}

export interface Watermark {
  text: string;
  fontSize: number;
  color: string;
  opacity: number;
  rotation: number;
  position: 'center' | 'diagonal' | 'top' | 'bottom';
  enabled: boolean;
}

export interface HeaderFooter {
  left: string;
  center: string;
  right: string;
  fontSize: number;
  showPageNumber: boolean;
  showDate: boolean;
  showDocumentTitle: boolean;
}

export interface PrintSettings {
  pageSize: PageSize;
  orientation: PageOrientation;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  header: HeaderFooter;
  footer: HeaderFooter;
  watermark: Watermark;
  includeAnnotations: boolean;
  grayscale: boolean;
  highQuality: boolean;
}

export interface PreviewState {
  documentId: string;
  currentPage: number;
  totalPages: number;
  zoom: ZoomLevel;
  showThumbnails: boolean;
  showAnnotationPanel: boolean;
  fitMode: 'width' | 'height' | 'page' | 'none';
}

export interface PageThumbnail {
  pageNumber: number;
  imageData: string;
  width: number;
  height: number;
}

// Page size dimensions in points (72 points = 1 inch)
const PAGE_SIZES: Record<PageSize, { width: number; height: number }> = {
  'A4': { width: 595, height: 842 },
  'Letter': { width: 612, height: 792 },
  'Legal': { width: 612, height: 1008 },
};

// Default print settings
const DEFAULT_SETTINGS: PrintSettings = {
  pageSize: 'A4',
  orientation: 'portrait',
  margins: { top: 72, bottom: 72, left: 72, right: 72 },
  header: {
    left: '',
    center: 'Advanced Health Directive',
    right: '',
    fontSize: 10,
    showPageNumber: false,
    showDate: true,
    showDocumentTitle: true,
  },
  footer: {
    left: 'Western Australia',
    center: '',
    right: 'Page {page} of {total}',
    fontSize: 9,
    showPageNumber: true,
    showDate: false,
    showDocumentTitle: false,
  },
  watermark: {
    text: 'DRAFT',
    fontSize: 72,
    color: '#CCCCCC',
    opacity: 0.3,
    rotation: -45,
    position: 'diagonal',
    enabled: false,
  },
  includeAnnotations: true,
  grayscale: false,
  highQuality: true,
};

class PrintPreviewService {
  private pages: Map<string, PageContent[]> = new Map();
  private annotations: Map<string, Annotation[]> = new Map();
  private settings: Map<string, PrintSettings> = new Map();
  private previewState: Map<string, PreviewState> = new Map();
  private thumbnails: Map<string, PageThumbnail[]> = new Map();

  // Initialize preview for a document
  initializePreview(documentId: string, documentData: any): PreviewState {
    // Generate pages from document data
    const pages = this.generatePages(documentId, documentData);
    this.pages.set(documentId, pages);

    // Initialize settings
    this.settings.set(documentId, { ...DEFAULT_SETTINGS });

    // Initialize annotations
    this.annotations.set(documentId, []);

    // Create preview state
    const state: PreviewState = {
      documentId,
      currentPage: 1,
      totalPages: pages.length,
      zoom: 100,
      showThumbnails: true,
      showAnnotationPanel: false,
      fitMode: 'width',
    };

    this.previewState.set(documentId, state);

    // Generate thumbnails
    this.generateThumbnails(documentId);

    return state;
  }

  // Generate pages from document data
  private generatePages(documentId: string, doc: any): PageContent[] {
    const pages: PageContent[] = [];
    let currentPage: PageContent = this.createEmptyPage(1);

    // Page 1: Title and Personal Details
    currentPage.sections.push({
      id: 'title',
      type: 'heading',
      content: 'ADVANCE HEALTH DIRECTIVE',
      style: { fontSize: 24, fontWeight: 'bold', fontStyle: 'normal', textAlign: 'center', marginTop: 0, marginBottom: 20 },
    });

    currentPage.sections.push({
      id: 'subtitle',
      type: 'paragraph',
      content: 'Made under the Guardianship and Administration Act 1990 (WA)',
      style: { fontSize: 12, fontWeight: 'normal', fontStyle: 'italic', textAlign: 'center', marginTop: 0, marginBottom: 30 },
    });

    currentPage.sections.push({
      id: 'personal-heading',
      type: 'heading',
      content: 'Part 1: Personal Details',
      style: { fontSize: 16, fontWeight: 'bold', fontStyle: 'normal', textAlign: 'left', marginTop: 20, marginBottom: 10 },
    });

    if (doc.personalDetails) {
      const pd = doc.personalDetails;
      currentPage.sections.push({
        id: 'personal-details',
        type: 'table',
        content: JSON.stringify([
          ['Full Name:', pd.fullName || ''],
          ['Date of Birth:', pd.dateOfBirth || ''],
          ['Address:', pd.address || ''],
          ['Phone:', pd.phone || ''],
          ['Email:', pd.email || ''],
        ]),
        style: { fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left', marginTop: 0, marginBottom: 20 },
      });
    }

    pages.push(currentPage);

    // Page 2: Treatment Decision Makers
    currentPage = this.createEmptyPage(2);
    currentPage.sections.push({
      id: 'tdm-heading',
      type: 'heading',
      content: 'Part 2: Treatment Decision Makers',
      style: { fontSize: 16, fontWeight: 'bold', fontStyle: 'normal', textAlign: 'left', marginTop: 0, marginBottom: 10 },
    });

    if (doc.treatmentDecisionMakers && doc.treatmentDecisionMakers.length > 0) {
      doc.treatmentDecisionMakers.forEach((tdm: any, index: number) => {
        currentPage.sections.push({
          id: `tdm-${index}`,
          type: 'paragraph',
          content: `${index + 1}. ${tdm.fullName} (${tdm.relationship})\n   Address: ${tdm.address}\n   Phone: ${tdm.phone}`,
          style: { fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left', marginTop: 10, marginBottom: 10 },
        });
      });
    } else {
      currentPage.sections.push({
        id: 'no-tdm',
        type: 'paragraph',
        content: 'No Treatment Decision Makers appointed.',
        style: { fontSize: 11, fontWeight: 'normal', fontStyle: 'italic', textAlign: 'left', marginTop: 10, marginBottom: 10 },
      });
    }

    pages.push(currentPage);

    // Page 3: Values and Wishes
    currentPage = this.createEmptyPage(3);
    currentPage.sections.push({
      id: 'values-heading',
      type: 'heading',
      content: 'Part 3: Values and Wishes',
      style: { fontSize: 16, fontWeight: 'bold', fontStyle: 'normal', textAlign: 'left', marginTop: 0, marginBottom: 10 },
    });

    if (doc.valuesAndWishes) {
      const vw = doc.valuesAndWishes;
      if (vw.qualityOfLife) {
        currentPage.sections.push({
          id: 'quality-of-life',
          type: 'paragraph',
          content: `Quality of Life:\n${vw.qualityOfLife}`,
          style: { fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left', marginTop: 10, marginBottom: 15 },
        });
      }
      if (vw.importantActivities) {
        currentPage.sections.push({
          id: 'important-activities',
          type: 'paragraph',
          content: `Important Activities:\n${vw.importantActivities}`,
          style: { fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left', marginTop: 10, marginBottom: 15 },
        });
      }
      if (vw.fears) {
        currentPage.sections.push({
          id: 'fears',
          type: 'paragraph',
          content: `Fears and Concerns:\n${vw.fears}`,
          style: { fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left', marginTop: 10, marginBottom: 15 },
        });
      }
    }

    pages.push(currentPage);

    // Page 4: Treatment Decisions
    currentPage = this.createEmptyPage(4);
    currentPage.sections.push({
      id: 'treatment-heading',
      type: 'heading',
      content: 'Part 4: Life-Sustaining Treatment Decisions',
      style: { fontSize: 16, fontWeight: 'bold', fontStyle: 'normal', textAlign: 'left', marginTop: 0, marginBottom: 10 },
    });

    const treatments = [
      { id: 'cardiopulmonary-resuscitation', name: 'Cardiopulmonary Resuscitation (CPR)' },
      { id: 'mechanical-ventilation', name: 'Mechanical Ventilation' },
      { id: 'artificial-nutrition', name: 'Artificial Nutrition and Hydration' },
      { id: 'dialysis', name: 'Dialysis' },
      { id: 'antibiotics', name: 'Antibiotics for Life-Threatening Infections' },
      { id: 'blood-transfusion', name: 'Blood Transfusion' },
      { id: 'palliative-care', name: 'Palliative Care' },
    ];

    treatments.forEach(treatment => {
      const decision = doc.treatmentDecisions?.[treatment.id];
      const preference = decision?.preference || 'not specified';
      currentPage.sections.push({
        id: `treatment-${treatment.id}`,
        type: 'checkbox-group',
        content: JSON.stringify({
          label: treatment.name,
          options: ['Want', 'Do Not Want', 'Undecided'],
          selected: preference,
        }),
        style: { fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left', marginTop: 8, marginBottom: 8 },
      });
    });

    pages.push(currentPage);

    // Page 5: Signatures
    currentPage = this.createEmptyPage(5);
    currentPage.sections.push({
      id: 'signature-heading',
      type: 'heading',
      content: 'Part 5: Signatures',
      style: { fontSize: 16, fontWeight: 'bold', fontStyle: 'normal', textAlign: 'left', marginTop: 0, marginBottom: 20 },
    });

    currentPage.sections.push({
      id: 'maker-signature',
      type: 'signature-block',
      content: JSON.stringify({
        label: 'Signature of Maker',
        name: doc.personalDetails?.fullName || '',
        date: doc.signatures?.[0]?.signedAt || '',
        hasSigned: doc.signatures?.length > 0,
      }),
      style: { fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left', marginTop: 20, marginBottom: 30 },
    });

    currentPage.sections.push({
      id: 'witness-heading',
      type: 'heading',
      content: 'Witness Signatures',
      style: { fontSize: 14, fontWeight: 'bold', fontStyle: 'normal', textAlign: 'left', marginTop: 20, marginBottom: 10 },
    });

    if (doc.witnesses && doc.witnesses.length > 0) {
      doc.witnesses.forEach((witness: any, index: number) => {
        currentPage.sections.push({
          id: `witness-${index}`,
          type: 'signature-block',
          content: JSON.stringify({
            label: `Witness ${index + 1}`,
            name: witness.fullName || '',
            occupation: witness.occupation || '',
            date: witness.signedAt || '',
            hasSigned: !!witness.signature,
          }),
          style: { fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left', marginTop: 15, marginBottom: 15 },
        });
      });
    }

    pages.push(currentPage);

    return pages;
  }

  // Create empty page
  private createEmptyPage(pageNumber: number): PageContent {
    return {
      id: `page_${pageNumber}`,
      pageNumber,
      sections: [],
      hasHeader: true,
      hasFooter: true,
      isPageBreak: false,
    };
  }

  // Generate thumbnails
  private generateThumbnails(documentId: string): void {
    const pages = this.pages.get(documentId) || [];
    const thumbnails: PageThumbnail[] = pages.map(page => ({
      pageNumber: page.pageNumber,
      imageData: `thumbnail_${documentId}_page_${page.pageNumber}`,
      width: 120,
      height: 170,
    }));
    this.thumbnails.set(documentId, thumbnails);
  }

  // Get preview state
  getPreviewState(documentId: string): PreviewState | null {
    return this.previewState.get(documentId) || null;
  }

  // Get pages
  getPages(documentId: string): PageContent[] {
    return this.pages.get(documentId) || [];
  }

  // Get specific page
  getPage(documentId: string, pageNumber: number): PageContent | null {
    const pages = this.pages.get(documentId) || [];
    return pages.find(p => p.pageNumber === pageNumber) || null;
  }

  // Get thumbnails
  getThumbnails(documentId: string): PageThumbnail[] {
    return this.thumbnails.get(documentId) || [];
  }

  // Navigate to page
  goToPage(documentId: string, pageNumber: number): PreviewState | null {
    const state = this.previewState.get(documentId);
    if (!state) return null;

    const pages = this.pages.get(documentId) || [];
    if (pageNumber < 1 || pageNumber > pages.length) return state;

    state.currentPage = pageNumber;
    return state;
  }

  // Next page
  nextPage(documentId: string): PreviewState | null {
    const state = this.previewState.get(documentId);
    if (!state) return null;

    if (state.currentPage < state.totalPages) {
      state.currentPage++;
    }
    return state;
  }

  // Previous page
  previousPage(documentId: string): PreviewState | null {
    const state = this.previewState.get(documentId);
    if (!state) return null;

    if (state.currentPage > 1) {
      state.currentPage--;
    }
    return state;
  }

  // Set zoom level
  setZoom(documentId: string, zoom: ZoomLevel): PreviewState | null {
    const state = this.previewState.get(documentId);
    if (!state) return null;

    state.zoom = zoom;
    state.fitMode = 'none';
    return state;
  }

  // Zoom in
  zoomIn(documentId: string): PreviewState | null {
    const state = this.previewState.get(documentId);
    if (!state) return null;

    const zoomLevels: ZoomLevel[] = [25, 50, 75, 100, 125, 150, 200];
    const currentIndex = zoomLevels.indexOf(state.zoom);
    if (currentIndex < zoomLevels.length - 1) {
      state.zoom = zoomLevels[currentIndex + 1];
      state.fitMode = 'none';
    }
    return state;
  }

  // Zoom out
  zoomOut(documentId: string): PreviewState | null {
    const state = this.previewState.get(documentId);
    if (!state) return null;

    const zoomLevels: ZoomLevel[] = [25, 50, 75, 100, 125, 150, 200];
    const currentIndex = zoomLevels.indexOf(state.zoom);
    if (currentIndex > 0) {
      state.zoom = zoomLevels[currentIndex - 1];
      state.fitMode = 'none';
    }
    return state;
  }

  // Set fit mode
  setFitMode(documentId: string, mode: PreviewState['fitMode']): PreviewState | null {
    const state = this.previewState.get(documentId);
    if (!state) return null;

    state.fitMode = mode;
    return state;
  }

  // Toggle thumbnails
  toggleThumbnails(documentId: string): PreviewState | null {
    const state = this.previewState.get(documentId);
    if (!state) return null;

    state.showThumbnails = !state.showThumbnails;
    return state;
  }

  // Toggle annotation panel
  toggleAnnotationPanel(documentId: string): PreviewState | null {
    const state = this.previewState.get(documentId);
    if (!state) return null;

    state.showAnnotationPanel = !state.showAnnotationPanel;
    return state;
  }

  // Add annotation
  addAnnotation(
    documentId: string,
    pageNumber: number,
    type: AnnotationType,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    content?: string,
    createdBy: string = 'user'
  ): Annotation {
    const annotation: Annotation = {
      id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pageNumber,
      type,
      x,
      y,
      width,
      height,
      color,
      content,
      createdAt: new Date().toISOString(),
      createdBy,
    };

    const annotations = this.annotations.get(documentId) || [];
    annotations.push(annotation);
    this.annotations.set(documentId, annotations);

    return annotation;
  }

  // Get annotations for page
  getAnnotations(documentId: string, pageNumber?: number): Annotation[] {
    const annotations = this.annotations.get(documentId) || [];
    if (pageNumber !== undefined) {
      return annotations.filter(a => a.pageNumber === pageNumber);
    }
    return annotations;
  }

  // Delete annotation
  deleteAnnotation(documentId: string, annotationId: string): boolean {
    const annotations = this.annotations.get(documentId) || [];
    const index = annotations.findIndex(a => a.id === annotationId);
    if (index === -1) return false;

    annotations.splice(index, 1);
    return true;
  }

  // Update annotation
  updateAnnotation(documentId: string, annotationId: string, updates: Partial<Annotation>): Annotation | null {
    const annotations = this.annotations.get(documentId) || [];
    const annotation = annotations.find(a => a.id === annotationId);
    if (!annotation) return null;

    Object.assign(annotation, updates);
    return annotation;
  }

  // Get print settings
  getSettings(documentId: string): PrintSettings {
    return this.settings.get(documentId) || { ...DEFAULT_SETTINGS };
  }

  // Update print settings
  updateSettings(documentId: string, updates: Partial<PrintSettings>): PrintSettings {
    const settings = this.settings.get(documentId) || { ...DEFAULT_SETTINGS };
    const updated = { ...settings, ...updates };
    this.settings.set(documentId, updated);
    return updated;
  }

  // Update watermark
  updateWatermark(documentId: string, watermark: Partial<Watermark>): Watermark {
    const settings = this.getSettings(documentId);
    settings.watermark = { ...settings.watermark, ...watermark };
    this.settings.set(documentId, settings);
    return settings.watermark;
  }

  // Update header
  updateHeader(documentId: string, header: Partial<HeaderFooter>): HeaderFooter {
    const settings = this.getSettings(documentId);
    settings.header = { ...settings.header, ...header };
    this.settings.set(documentId, settings);
    return settings.header;
  }

  // Update footer
  updateFooter(documentId: string, footer: Partial<HeaderFooter>): HeaderFooter {
    const settings = this.getSettings(documentId);
    settings.footer = { ...settings.footer, ...footer };
    this.settings.set(documentId, settings);
    return settings.footer;
  }

  // Get page dimensions
  getPageDimensions(documentId: string): PageDimensions {
    const settings = this.getSettings(documentId);
    const size = PAGE_SIZES[settings.pageSize];
    
    const width = settings.orientation === 'portrait' ? size.width : size.height;
    const height = settings.orientation === 'portrait' ? size.height : size.width;

    return {
      width,
      height,
      marginTop: settings.margins.top,
      marginBottom: settings.margins.bottom,
      marginLeft: settings.margins.left,
      marginRight: settings.margins.right,
    };
  }

  // Get available page sizes
  getAvailablePageSizes(): { id: PageSize; name: string; dimensions: string }[] {
    return [
      { id: 'A4', name: 'A4', dimensions: '210 × 297 mm' },
      { id: 'Letter', name: 'US Letter', dimensions: '8.5 × 11 in' },
      { id: 'Legal', name: 'US Legal', dimensions: '8.5 × 14 in' },
    ];
  }

  // Get available zoom levels
  getAvailableZoomLevels(): ZoomLevel[] {
    return [25, 50, 75, 100, 125, 150, 200];
  }

  // Get annotation types
  getAnnotationTypes(): { id: AnnotationType; name: string; icon: string }[] {
    return [
      { id: 'highlight', name: 'Highlight', icon: '🖍️' },
      { id: 'underline', name: 'Underline', icon: '📝' },
      { id: 'strikethrough', name: 'Strikethrough', icon: '✂️' },
      { id: 'note', name: 'Note', icon: '📌' },
      { id: 'stamp', name: 'Stamp', icon: '🔖' },
      { id: 'signature', name: 'Signature', icon: '✍️' },
    ];
  }

  // Export preview as PDF data
  exportPDF(documentId: string): { success: boolean; data: string; filename: string } {
    const pages = this.pages.get(documentId) || [];
    const settings = this.getSettings(documentId);
    const annotations = this.annotations.get(documentId) || [];

    // In a real implementation, this would generate actual PDF
    const pdfData = JSON.stringify({
      pages,
      settings,
      annotations: settings.includeAnnotations ? annotations : [],
      generatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      data: `data:application/pdf;base64,${Buffer.from(pdfData).toString('base64')}`,
      filename: `AHD_Document_${documentId}_${Date.now()}.pdf`,
    };
  }

  // Print document
  print(documentId: string): { success: boolean; message: string } {
    const pages = this.pages.get(documentId);
    if (!pages || pages.length === 0) {
      return { success: false, message: 'No pages to print' };
    }

    // In a real implementation, this would trigger native print dialog
    return {
      success: true,
      message: `Print job sent for ${pages.length} pages`,
    };
  }

  // Get analytics
  getAnalytics(): {
    totalPreviews: number;
    totalAnnotations: number;
    mostUsedAnnotationType: string;
    averagePagesPerDocument: number;
  } {
    let totalAnnotations = 0;
    const annotationCounts: Record<string, number> = {};

    this.annotations.forEach(annotations => {
      totalAnnotations += annotations.length;
      annotations.forEach(a => {
        annotationCounts[a.type] = (annotationCounts[a.type] || 0) + 1;
      });
    });

    let totalPages = 0;
    this.pages.forEach(pages => {
      totalPages += pages.length;
    });

    const mostUsedAnnotationType = Object.entries(annotationCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';

    return {
      totalPreviews: this.previewState.size,
      totalAnnotations,
      mostUsedAnnotationType,
      averagePagesPerDocument: this.pages.size > 0 ? totalPages / this.pages.size : 0,
    };
  }

  // Reset service
  reset(): void {
    this.pages.clear();
    this.annotations.clear();
    this.settings.clear();
    this.previewState.clear();
    this.thumbnails.clear();
  }
}

export const printPreviewService = new PrintPreviewService();
