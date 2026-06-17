/**
 * Advanced Health Directive PDF Export Service
 * Generates professional PDF documents from completed AHD forms
 */

import { AdvancedHealthDirective } from './advanced-health-directive-service';

export interface PDFExportOptions {
  includeSignaturePage?: boolean;
  includeWitnessPage?: boolean;
  fontSize?: number;
  pageSize?: 'A4' | 'Letter';
}

class AHDPDFExportService {
  private readonly defaultOptions: PDFExportOptions = {
    includeSignaturePage: true,
    includeWitnessPage: true,
    fontSize: 11,
    pageSize: 'A4',
  };

  /**
   * Generate PDF content as HTML string for printing
   */
  generatePDFHTML(document: AdvancedHealthDirective, options?: PDFExportOptions): string {
    const opts = { ...this.defaultOptions, ...options };
    const today = new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });
    const now = new Date().toLocaleString('en-AU');
    
    let treatmentDecisionsHTML = '';
    for (const decision of document.treatmentDecisions) {
      const treatment = document.lifeSustainingTreatments.find(t => t.id === decision.treatmentId);
      if (!treatment) continue;
      
      const preferenceClass = 'preference-' + decision.preference.replace('_', '-');
      const preferenceLabel = {
        'want': 'I want this treatment',
        'do-not-want': 'I do not want this treatment',
        'unsure': 'I am unsure / Let my TDM decide',
        'not-applicable': 'Not applicable to me'
      }[decision.preference] || decision.preference;
      
      const notesHTML = decision.notes ? '<p style="font-size: 9pt; margin-top: 8px; color: #1f2937;">Notes: ' + decision.notes + '</p>' : '';
      
      treatmentDecisionsHTML += '<div class="treatment-section">' +
        '<div class="treatment-title">' + treatment.name + '</div>' +
        '<p style="font-size: 9pt; color: #666; margin-bottom: 8px;">' + treatment.description + '</p>' +
        '<div class="treatment-preference ' + preferenceClass + '">' +
        preferenceLabel +
        '</div>' +
        notesHTML +
        '</div>';
    }

    let treatmentDecisionMakersHTML = '';
    if (document.treatmentDecisionMakers.length > 0) {
      treatmentDecisionMakersHTML = '<table>' +
        '<thead><tr><th>Name</th><th>Relationship</th><th>Phone</th><th>Status</th></tr></thead>' +
        '<tbody>';
      
      for (const tdm of document.treatmentDecisionMakers) {
        treatmentDecisionMakersHTML += '<tr>' +
          '<td>' + tdm.fullName + '</td>' +
          '<td>' + tdm.relationship + '</td>' +
          '<td>' + tdm.phone + '</td>' +
          '<td>' + (tdm.acceptedAppointment ? 'Accepted' : 'Pending') + '</td>' +
          '</tr>';
      }
      treatmentDecisionMakersHTML += '</tbody></table>';
    } else {
      treatmentDecisionMakersHTML = '<p style="color: #9ca3af; font-style: italic;">No treatment decision makers appointed.</p>';
    }

    const signaturePageHTML = opts.includeSignaturePage ? 
      '<div class="page-break"></div>' +
      '<div class="signature-section">' +
      '<div class="section-title">Signature and Acknowledgment</div>' +
      '<div class="warning-box">' +
      '<strong>Important:</strong> This document must be signed and witnessed to be valid. ' +
      'The witnesses must be independent and not related to you.' +
      '</div>' +
      '<p style="margin-bottom: 20px;">' +
      'I declare that I have read and understood this Advanced Health Directive, ' +
      'and that the information contained herein accurately reflects my wishes and values ' +
      'regarding my healthcare and medical treatment.' +
      '</p>' +
      '<div class="signature-line">' +
      '<div class="signature-box"><div style="height: 40px;"></div>Signature of Declarant</div>' +
      '<div class="date-box"><div style="height: 40px;"></div>Date</div>' +
      '</div>' +
      '<p style="margin-bottom: 20px; font-weight: 600;">Witness 1:</p>' +
      '<div class="signature-line">' +
      '<div class="signature-box"><div style="height: 40px;"></div>Signature of Witness 1</div>' +
      '<div class="date-box"><div style="height: 40px;"></div>Date</div>' +
      '</div>' +
      '<p style="margin-bottom: 20px; font-weight: 600;">Witness 2:</p>' +
      '<div class="signature-line">' +
      '<div class="signature-box"><div style="height: 40px;"></div>Signature of Witness 2</div>' +
      '<div class="date-box"><div style="height: 40px;"></div>Date</div>' +
      '</div>' +
      '</div>' : '';
    
    return '<!DOCTYPE html>' +
      '<html lang="en">' +
      '<head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>Advanced Health Directive - ' + document.personalDetails.fullName + '</title>' +
      '<style>' +
      '* { margin: 0; padding: 0; box-sizing: border-box; }' +
      'body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; font-size: ' + opts.fontSize + 'pt; line-height: 1.6; color: #333; background: white; padding: 40px; }' +
      '@media print { body { padding: 20px; } .page-break { page-break-after: always; margin-bottom: 40px; } }' +
      '.header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1e40af; padding-bottom: 20px; }' +
      '.header h1 { font-size: 24pt; color: #1e40af; margin-bottom: 5px; }' +
      '.header p { font-size: 10pt; color: #666; }' +
      '.section { margin-bottom: 25px; page-break-inside: avoid; }' +
      '.section-title { font-size: 14pt; font-weight: bold; color: #1e40af; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }' +
      '.form-group { margin-bottom: 15px; display: grid; grid-template-columns: 150px 1fr; gap: 15px; }' +
      '.form-label { font-weight: 600; color: #374151; vertical-align: top; }' +
      '.form-value { color: #1f2937; word-wrap: break-word; white-space: pre-wrap; padding: 8px; background: #f9fafb; border-radius: 4px; border-left: 3px solid #1e40af; padding-left: 12px; }' +
      '.form-value.empty { color: #9ca3af; font-style: italic; }' +
      '.two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }' +
      '.treatment-section { margin-bottom: 20px; padding: 12px; background: #f0f9ff; border-left: 4px solid #0284c7; border-radius: 4px; }' +
      '.treatment-title { font-weight: 600; color: #0c4a6e; margin-bottom: 8px; }' +
      '.treatment-preference { padding: 8px; margin: 4px 0; border-radius: 3px; font-size: 10pt; }' +
      '.preference-want { background: #dcfce7; color: #166534; }' +
      '.preference-do-not-want { background: #fee2e2; color: #991b1b; }' +
      '.preference-unsure { background: #fef3c7; color: #92400e; }' +
      '.preference-not-applicable { background: #f3f4f6; color: #4b5563; }' +
      '.signature-section { margin-top: 40px; page-break-inside: avoid; }' +
      '.signature-line { display: grid; grid-template-columns: 200px 100px; gap: 20px; margin-bottom: 30px; }' +
      '.signature-box { border-top: 1px solid #000; padding-top: 5px; text-align: center; font-size: 9pt; }' +
      '.date-box { text-align: center; }' +
      '.footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #d1d5db; font-size: 9pt; color: #6b7280; text-align: center; }' +
      '.warning-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px; margin: 15px 0; font-size: 9pt; color: #7f1d1d; }' +
      'table { width: 100%; border-collapse: collapse; margin: 15px 0; }' +
      'th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }' +
      'th { background: #f3f4f6; font-weight: 600; color: #1f2937; }' +
      'tr:nth-child(even) { background: #f9fafb; }' +
      '</style>' +
      '</head>' +
      '<body>' +
      '<div class="header">' +
      '<h1>Advanced Health Directive</h1>' +
      '<p>Western Australian Advance Health Directive Form</p>' +
      '<p>Document prepared on ' + today + '</p>' +
      '</div>' +
      '<div class="section">' +
      '<div class="section-title">1. Personal Details</div>' +
      '<div class="form-group"><div class="form-label">Full Name:</div><div class="form-value">' + (document.personalDetails.fullName || '(Not provided)') + '</div></div>' +
      '<div class="form-group"><div class="form-label">Date of Birth:</div><div class="form-value">' + (document.personalDetails.dateOfBirth || '(Not provided)') + '</div></div>' +
      '<div class="form-group"><div class="form-label">Address:</div><div class="form-value">' + (document.personalDetails.address || '(Not provided)') + '</div></div>' +
      '<div class="two-column">' +
      '<div><div class="form-group"><div class="form-label">Suburb:</div><div class="form-value">' + (document.personalDetails.suburb || '(Not provided)') + '</div></div></div>' +
      '<div><div class="form-group"><div class="form-label">Postcode:</div><div class="form-value">' + (document.personalDetails.postcode || '(Not provided)') + '</div></div></div>' +
      '</div>' +
      '<div class="two-column">' +
      '<div><div class="form-group"><div class="form-label">Phone:</div><div class="form-value">' + (document.personalDetails.phone || '(Not provided)') + '</div></div></div>' +
      '<div><div class="form-group"><div class="form-label">Email:</div><div class="form-value">' + (document.personalDetails.email || '(Not provided)') + '</div></div></div>' +
      '</div>' +
      '</div>' +
      '<div class="section">' +
      '<div class="section-title">2. Your Values and Wishes</div>' +
      '<div class="form-group"><div class="form-label">Quality of Life:</div><div class="form-value' + (!document.valuesAndWishes.qualityOfLife ? ' empty' : '') + '">' + (document.valuesAndWishes.qualityOfLife || '(Not provided)') + '</div></div>' +
      '<div class="form-group"><div class="form-label">Important Activities:</div><div class="form-value' + (!document.valuesAndWishes.importantActivities ? ' empty' : '') + '">' + (document.valuesAndWishes.importantActivities || '(Not provided)') + '</div></div>' +
      '<div class="form-group"><div class="form-label">Religious/Spiritual Beliefs:</div><div class="form-value' + (!document.valuesAndWishes.religiousBeliefs ? ' empty' : '') + '">' + (document.valuesAndWishes.religiousBeliefs || '(Not provided)') + '</div></div>' +
      '<div class="form-group"><div class="form-label">Cultural Considerations:</div><div class="form-value' + (!document.valuesAndWishes.culturalConsiderations ? ' empty' : '') + '">' + (document.valuesAndWishes.culturalConsiderations || '(Not provided)') + '</div></div>' +
      '<div class="form-group"><div class="form-label">Personal Values:</div><div class="form-value' + (!document.valuesAndWishes.personalValues ? ' empty' : '') + '">' + (document.valuesAndWishes.personalValues || '(Not provided)') + '</div></div>' +
      '<div class="form-group"><div class="form-label">Fears and Concerns:</div><div class="form-value' + (!document.valuesAndWishes.fearsConcerns ? ' empty' : '') + '">' + (document.valuesAndWishes.fearsConcerns || '(Not provided)') + '</div></div>' +
      '</div>' +
      '<div class="section">' +
      '<div class="section-title">3. Life-Sustaining Treatment Decisions</div>' +
      treatmentDecisionsHTML +
      '</div>' +
      '<div class="section">' +
      '<div class="section-title">4. Treatment Decision Makers</div>' +
      treatmentDecisionMakersHTML +
      '</div>' +
      signaturePageHTML +
      '<div class="footer">' +
      '<p>This Advanced Health Directive was generated by MediVac WACHS</p>' +
      '<p>For assistance or questions, contact your healthcare provider or local hospital</p>' +
      '<p style="margin-top: 10px; color: #9ca3af;">Document ID: ' + document.id + ' | Generated: ' + now + '</p>' +
      '</div>' +
      '</body>' +
      '</html>';
  }

  /**
   * Open PDF in print dialog
   */
  printPDF(document: AdvancedHealthDirective, options?: PDFExportOptions): void {
    const html = this.generatePDFHTML(document, options);
    const printWindow = window.open('', '', 'width=800,height=600');
    
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  }

  /**
   * Download HTML file
   */
  downloadPDF(document: AdvancedHealthDirective, options?: PDFExportOptions): void {
    const html = this.generatePDFHTML(document, options);
    const filename = 'AHD_' + document.personalDetails.fullName.replace(/\s+/g, '_') + '_' + new Date().getTime() + '.html';
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Get PDF as data URL for embedding
   */
  getPDFDataURL(document: AdvancedHealthDirective, options?: PDFExportOptions): string {
    const html = this.generatePDFHTML(document, options);
    const blob = new Blob([html], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }
}

export const ahdPDFExportService = new AHDPDFExportService();
