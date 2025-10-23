import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

export interface PDFTemplate {
  id: string;
  name: string;
  type: 'report' | 'invoice' | 'proposal' | 'activity' | 'custom';
  layout: 'portrait' | 'landscape';
  sections: PDFSection[];
  styles: PDFStyles;
  metadata: {
    author?: string;
    title?: string;
    subject?: string;
    keywords?: string[];
  };
}

export interface PDFSection {
  id: string;
  type: 'header' | 'footer' | 'content' | 'chart' | 'table' | 'image' | 'text';
  position: { x: number; y: number; width: number; height: number };
  content: any;
  styles?: Partial<PDFStyles>;
}

export interface PDFStyles {
  fontSize: number;
  fontFamily: string;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  padding: number;
  margin: number;
  alignment: 'left' | 'center' | 'right' | 'justify';
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: any[];
  options: {
    title?: string;
    xAxis?: string;
    yAxis?: string;
    colors?: string[];
    showLegend?: boolean;
    showGrid?: boolean;
  };
}

export interface ExportOptions {
  format: 'pdf' | 'png' | 'jpeg' | 'svg';
  quality?: number;
  compression?: boolean;
  password?: string;
  watermark?: {
    text: string;
    opacity: number;
    position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };
}

export class UniversalPDFService {
  private templates: Map<string, PDFTemplate> = new Map();
  private defaultStyles: PDFStyles = {
    fontSize: 12,
    fontFamily: 'helvetica',
    textColor: '#000000',
    backgroundColor: '#ffffff',
    borderColor: '#cccccc',
    borderWidth: 1,
    padding: 10,
    margin: 10,
    alignment: 'left'
  };

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    // Activity Report Template
    const activityTemplate: PDFTemplate = {
      id: 'activity-report',
      name: 'Activity Report',
      type: 'activity',
      layout: 'portrait',
      sections: [
        {
          id: 'header',
          type: 'header',
          position: { x: 0, y: 0, width: 100, height: 15 },
          content: {
            title: 'Employee Activity Report',
            logo: null,
            date: true
          }
        },
        {
          id: 'summary',
          type: 'content',
          position: { x: 0, y: 20, width: 100, height: 30 },
          content: {
            type: 'summary',
            fields: ['totalActiveTime', 'productivityScore', 'pageViews', 'breakTime']
          }
        },
        {
          id: 'chart',
          type: 'chart',
          position: { x: 0, y: 55, width: 100, height: 35 },
          content: {
            type: 'productivity-trend'
          }
        }
      ],
      styles: this.defaultStyles,
      metadata: {
        title: 'Employee Activity Report',
        subject: 'Productivity and Activity Analysis'
      }
    };

    // Proposal Template
    const proposalTemplate: PDFTemplate = {
      id: 'business-proposal',
      name: 'Business Proposal',
      type: 'proposal',
      layout: 'portrait',
      sections: [
        {
          id: 'cover',
          type: 'header',
          position: { x: 0, y: 0, width: 100, height: 25 },
          content: {
            title: 'Business Proposal',
            subtitle: 'Professional Services',
            logo: null
          }
        },
        {
          id: 'executive-summary',
          type: 'content',
          position: { x: 0, y: 30, width: 100, height: 20 },
          content: {
            type: 'text',
            title: 'Executive Summary'
          }
        },
        {
          id: 'services',
          type: 'table',
          position: { x: 0, y: 55, width: 100, height: 30 },
          content: {
            type: 'services-table'
          }
        }
      ],
      styles: this.defaultStyles,
      metadata: {
        title: 'Business Proposal',
        subject: 'Service Proposal Document'
      }
    };

    this.templates.set(activityTemplate.id, activityTemplate);
    this.templates.set(proposalTemplate.id, proposalTemplate);
  }

  async generatePDF(templateId: string, data: any, options: ExportOptions = { format: 'pdf' }): Promise<Blob> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const pdf = new jsPDF({
      orientation: template.layout === 'landscape' ? 'l' : 'p',
      unit: 'mm',
      format: 'a4'
    });

    // Set metadata
    if (template.metadata.title) pdf.setProperties({ title: template.metadata.title });
    if (template.metadata.author) pdf.setProperties({ author: template.metadata.author });
    if (template.metadata.subject) pdf.setProperties({ subject: template.metadata.subject });

    // Process sections
    for (const section of template.sections) {
      await this.renderSection(pdf, section, data, template);
    }

    // Add watermark if specified
    if (options.watermark) {
      this.addWatermark(pdf, options.watermark);
    }

    // Return based on format
    switch (options.format) {
      case 'pdf':
        return new Blob([pdf.output('blob')], { type: 'application/pdf' });
      case 'png':
      case 'jpeg':
        return await this.convertToImage(pdf, options.format, options.quality);
      default:
        return new Blob([pdf.output('blob')], { type: 'application/pdf' });
    }
  }

  private async renderSection(pdf: jsPDF, section: PDFSection, data: any, template: PDFTemplate): Promise<void> {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    const x = (section.position.x / 100) * pageWidth;
    const y = (section.position.y / 100) * pageHeight;
    const width = (section.position.width / 100) * pageWidth;
    const height = (section.position.height / 100) * pageHeight;

    const styles = { ...template.styles, ...section.styles };

    switch (section.type) {
      case 'header':
        await this.renderHeader(pdf, section.content, x, y, width, height, styles);
        break;
      case 'content':
        await this.renderContent(pdf, section.content, data, x, y, width, height, styles);
        break;
      case 'chart':
        await this.renderChart(pdf, section.content, data, x, y, width, height);
        break;
      case 'table':
        await this.renderTable(pdf, section.content, data, x, y, width, height, styles);
        break;
      case 'text':
        this.renderText(pdf, section.content, x, y, width, height, styles);
        break;
      case 'image':
        await this.renderImage(pdf, section.content, x, y, width, height);
        break;
    }
  }

  private async renderHeader(pdf: jsPDF, content: any, x: number, y: number, width: number, height: number, styles: PDFStyles): Promise<void> {
    pdf.setFontSize(20);
    pdf.setFont(styles.fontFamily, 'bold');
    
    if (content.title) {
      pdf.text(content.title, x + width / 2, y + 15, { align: 'center' });
    }
    
    if (content.subtitle) {
      pdf.setFontSize(14);
      pdf.setFont(styles.fontFamily, 'normal');
      pdf.text(content.subtitle, x + width / 2, y + 25, { align: 'center' });
    }
    
    if (content.date) {
      pdf.setFontSize(10);
      pdf.text(`Generated: ${format(new Date(), 'PPP')}`, x + width - 5, y + 10, { align: 'right' });
    }

    // Add border
    pdf.setDrawColor(styles.borderColor);
    pdf.setLineWidth(styles.borderWidth);
    pdf.rect(x, y, width, height);
  }

  private async renderContent(pdf: jsPDF, content: any, data: any, x: number, y: number, width: number, height: number, styles: PDFStyles): Promise<void> {
    pdf.setFontSize(styles.fontSize);
    pdf.setFont(styles.fontFamily);

    if (content.type === 'summary' && data.metrics) {
      const metrics = data.metrics;
      let currentY = y + 10;

      pdf.setFontSize(16);
      pdf.setFont(styles.fontFamily, 'bold');
      pdf.text('Productivity Summary', x + 10, currentY);
      currentY += 15;

      pdf.setFontSize(12);
      pdf.setFont(styles.fontFamily, 'normal');

      const summaryItems = [
        { label: 'Productivity Score', value: `${metrics.productivityScore}%` },
        { label: 'Total Active Time', value: this.formatDuration(metrics.totalActiveTime) },
        { label: 'Page Views', value: metrics.pageViews.toString() },
        { label: 'Break Time', value: this.formatDuration(metrics.breakTime) },
        { label: 'Actions Performed', value: metrics.actionsPerformed.toString() }
      ];

      summaryItems.forEach(item => {
        pdf.text(`${item.label}:`, x + 10, currentY);
        pdf.text(item.value, x + width - 10, currentY, { align: 'right' });
        currentY += 8;
      });
    }
  }

  private async renderChart(pdf: jsPDF, content: any, data: any, x: number, y: number, width: number, height: number): Promise<void> {
    if (content.type === 'productivity-trend' && data.productivityTrend) {
      // Create a simple chart representation
      const chartData = data.productivityTrend.slice(-7); // Last 7 days
      const maxScore = Math.max(...chartData.map((d: any) => d.score));
      const chartWidth = width - 20;
      const chartHeight = height - 30;

      // Draw chart background
      pdf.setFillColor(245, 245, 245);
      pdf.rect(x + 10, y + 20, chartWidth, chartHeight, 'F');

      // Draw chart title
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('7-Day Productivity Trend', x + width / 2, y + 15, { align: 'center' });

      // Draw chart lines
      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(2);

      for (let i = 0; i < chartData.length - 1; i++) {
        const x1 = x + 10 + (i / (chartData.length - 1)) * chartWidth;
        const y1 = y + 20 + chartHeight - (chartData[i].score / 100) * chartHeight;
        const x2 = x + 10 + ((i + 1) / (chartData.length - 1)) * chartWidth;
        const y2 = y + 20 + chartHeight - (chartData[i + 1].score / 100) * chartHeight;
        
        pdf.line(x1, y1, x2, y2);
      }

      // Draw data points
      pdf.setFillColor(59, 130, 246);
      chartData.forEach((point: any, index: number) => {
        const pointX = x + 10 + (index / (chartData.length - 1)) * chartWidth;
        const pointY = y + 20 + chartHeight - (point.score / 100) * chartHeight;
        pdf.circle(pointX, pointY, 2, 'F');
      });
    }
  }

  private async renderTable(pdf: jsPDF, content: any, data: any, x: number, y: number, width: number, height: number, styles: PDFStyles): Promise<void> {
    if (content.type === 'services-table' && data.services) {
      const services = data.services;
      const rowHeight = 8;
      const colWidths = [width * 0.5, width * 0.25, width * 0.25];
      let currentY = y + 10;

      // Table header
      pdf.setFontSize(12);
      pdf.setFont(styles.fontFamily, 'bold');
      pdf.setFillColor(240, 240, 240);
      pdf.rect(x, currentY, width, rowHeight, 'F');
      
      pdf.text('Service', x + 5, currentY + 5);
      pdf.text('Quantity', x + colWidths[0] + 5, currentY + 5);
      pdf.text('Price', x + colWidths[0] + colWidths[1] + 5, currentY + 5);
      currentY += rowHeight;

      // Table rows
      pdf.setFont(styles.fontFamily, 'normal');
      services.forEach((service: any) => {
        pdf.text(service.name, x + 5, currentY + 5);
        pdf.text(service.quantity.toString(), x + colWidths[0] + 5, currentY + 5);
        pdf.text(`$${service.price}`, x + colWidths[0] + colWidths[1] + 5, currentY + 5);
        currentY += rowHeight;
      });

      // Table border
      pdf.setDrawColor(styles.borderColor);
      pdf.setLineWidth(styles.borderWidth);
      pdf.rect(x, y + 10, width, currentY - y - 10);
    }
  }

  private renderText(pdf: jsPDF, content: any, x: number, y: number, width: number, height: number, styles: PDFStyles): void {
    pdf.setFontSize(styles.fontSize);
    pdf.setFont(styles.fontFamily);
    
    if (content.title) {
      pdf.setFont(styles.fontFamily, 'bold');
      pdf.text(content.title, x + 10, y + 15);
    }
    
    if (content.text) {
      pdf.setFont(styles.fontFamily, 'normal');
      const lines = pdf.splitTextToSize(content.text, width - 20);
      pdf.text(lines, x + 10, y + (content.title ? 25 : 15));
    }
  }

  private async renderImage(pdf: jsPDF, content: any, x: number, y: number, width: number, height: number): Promise<void> {
    if (content.src) {
      try {
        pdf.addImage(content.src, 'JPEG', x, y, width, height);
      } catch (error) {
        console.error('Error adding image to PDF:', error);
      }
    }
  }

  private addWatermark(pdf: jsPDF, watermark: { text: string; opacity: number; position: string }): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    pdf.setGState(new pdf.GState({ opacity: watermark.opacity }));
    pdf.setFontSize(50);
    pdf.setTextColor(200, 200, 200);
    
    let x = pageWidth / 2;
    let y = pageHeight / 2;
    
    switch (watermark.position) {
      case 'top-left':
        x = 50; y = 50;
        break;
      case 'top-right':
        x = pageWidth - 50; y = 50;
        break;
      case 'bottom-left':
        x = 50; y = pageHeight - 50;
        break;
      case 'bottom-right':
        x = pageWidth - 50; y = pageHeight - 50;
        break;
    }
    
    pdf.text(watermark.text, x, y, { 
      align: 'center',
      angle: 45
    });
  }

  private async convertToImage(pdf: jsPDF, format: 'png' | 'jpeg', quality: number = 0.8): Promise<Blob> {
    const canvas = await html2canvas(document.createElement('div'));
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, `image/${format}`, quality);
    });
  }

  private formatDuration(milliseconds: number): string {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  // Template management methods
  createTemplate(template: PDFTemplate): void {
    this.templates.set(template.id, template);
  }

  updateTemplate(templateId: string, updates: Partial<PDFTemplate>): void {
    const existing = this.templates.get(templateId);
    if (existing) {
      this.templates.set(templateId, { ...existing, ...updates });
    }
  }

  deleteTemplate(templateId: string): void {
    this.templates.delete(templateId);
  }

  getTemplate(templateId: string): PDFTemplate | undefined {
    return this.templates.get(templateId);
  }

  getAllTemplates(): PDFTemplate[] {
    return Array.from(this.templates.values());
  }

  // Batch processing
  async generateBatchPDFs(requests: Array<{ templateId: string; data: any; filename: string }>): Promise<Blob[]> {
    const results: Blob[] = [];
    
    for (const request of requests) {
      try {
        const pdf = await this.generatePDF(request.templateId, request.data);
        results.push(pdf);
      } catch (error) {
        console.error(`Error generating PDF for ${request.filename}:`, error);
        results.push(new Blob()); // Empty blob for failed generation
      }
    }
    
    return results;
  }

  // Advanced features
  async generateActivityReport(staffId: string, metrics: any, activities: any[]): Promise<Blob> {
    const data = {
      staffId,
      metrics,
      activities,
      productivityTrend: metrics.productivityTrend || []
    };
    
    return this.generatePDF('activity-report', data);
  }

  async generateProposalPDF(proposalData: any): Promise<Blob> {
    return this.generatePDF('business-proposal', proposalData);
  }

  // Export utilities
  downloadPDF(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async emailPDF(blob: Blob, emailData: { to: string; subject: string; body: string }): Promise<void> {
    // This would integrate with your email service
    console.log('Email PDF functionality would be implemented here', { blob, emailData });
  }
}

// Singleton instance
export const universalPDFService = new UniversalPDFService();