import { EmailTemplate, EmailTemplateVariable, EmailPreview } from '@/types/query';

class EmailTemplateService {
  private templates: EmailTemplate[] = [];
  private templateId = 1;

  private defaultTemplates: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[] = [
    {
      name: 'Lead Enquiry Thank You',
      subject: 'Thank you for your enquiry – {TripName}',
      content: `Hi {ClientName},

Thank you for your interest in our {TripName} package. Our team will review your request and get back to you shortly.

You can also reach us at {SupportEmail} or WhatsApp us at {SupportPhone}.

Warm regards,
Team {CompanyName}`,
      category: 'lead',
      role: 'traveller',
      trigger: 'Lead submission',
      language: 'en',
      variables: ['ClientName', 'TripName', 'SupportEmail', 'SupportPhone', 'CompanyName'],
      isActive: true,
      isDefault: true
    },
    {
      name: 'Quotation Sent',
      subject: 'Your Tour Quotation for {TripName} – Ref: {QuoteID}',
      content: `Hi {ClientName},

Please find your requested tour quotation below:

📍 Destination: {TripName}
📅 Travel Dates: {StartDate} to {EndDate}
👥 Pax: {AdultCount} Adults, {ChildCount} Children

👉 [View Quotation PDF]
Let us know if you'd like any changes.

Best Regards,
{AgentName} – {CompanyName}`,
      category: 'quotation',
      role: 'traveller',
      trigger: 'Proposal sent',
      language: 'en',
      variables: ['ClientName', 'TripName', 'QuoteID', 'StartDate', 'EndDate', 'AdultCount', 'ChildCount', 'AgentName', 'CompanyName'],
      isActive: true,
      isDefault: true
    },
    {
      name: 'Booking Confirmation',
      subject: 'Booking Confirmed – {TripName} | Ref: {BookingID}',
      content: `Hi {ClientName},

Your trip to {Destination} from {StartDate} is now confirmed!

✔ Booking ID: {BookingID}
✔ Total Amount: {TotalAmount}
✔ Hotel: {HotelName}
✔ Sightseeing: {SightseeingList}

🎫 Download your itinerary and vouchers: [Download PDF]

Thank you for choosing {CompanyName}!`,
      category: 'booking',
      role: 'traveller',
      trigger: 'Booking confirmed',
      language: 'en',
      variables: ['ClientName', 'TripName', 'Destination', 'StartDate', 'BookingID', 'TotalAmount', 'HotelName', 'SightseeingList', 'CompanyName'],
      isActive: true,
      isDefault: true
    },
    {
      name: 'Payment Receipt',
      subject: 'Payment Acknowledgement – Ref: {InvoiceNo}',
      content: `Hi {ClientName},

We have received your payment of ₹{AmountPaid} for booking {BookingID}.

💳 Payment Date: {PaymentDate}
📄 Invoice No: {InvoiceNo}
📎 [Download Invoice PDF]

Thank you for your trust in us.

Regards,
Accounts Team – {CompanyName}`,
      category: 'payment',
      role: 'traveller',
      trigger: 'Payment received',
      language: 'en',
      variables: ['ClientName', 'AmountPaid', 'BookingID', 'PaymentDate', 'InvoiceNo', 'CompanyName'],
      isActive: true,
      isDefault: true
    },
    {
      name: 'Agent Performance Summary',
      subject: 'Monthly Report – Performance Summary for {MonthYear}',
      content: `Hi {AgentName},

Here's your performance summary for {MonthYear}:

✅ Total Bookings: {BookingCount}
💰 Total Revenue: ₹{TotalRevenue}
🎯 Conversion Rate: {ConversionRate}%

Keep up the great work!

Regards,
{CompanyName} CRM Team`,
      category: 'account',
      role: 'agent',
      trigger: 'Monthly report generation',
      language: 'en',
      variables: ['AgentName', 'MonthYear', 'BookingCount', 'TotalRevenue', 'ConversionRate', 'CompanyName'],
      isActive: true,
      isDefault: true
    }
  ];

  private availableVariables: EmailTemplateVariable[] = [
    { name: 'ClientName', description: 'Customer/Client name', example: 'John Smith', category: 'Customer' },
    { name: 'AgentName', description: 'Agent name', example: 'Sarah Johnson', category: 'Staff' },
    { name: 'CompanyName', description: 'Company name', example: 'Dream Travels', category: 'Company' },
    { name: 'TripName', description: 'Trip/Package name', example: 'Dubai 5D/4N', category: 'Trip' },
    { name: 'Destination', description: 'Travel destination', example: 'Dubai, UAE', category: 'Trip' },
    { name: 'StartDate', description: 'Trip start date', example: '15th March 2024', category: 'Trip' },
    { name: 'EndDate', description: 'Trip end date', example: '20th March 2024', category: 'Trip' },
    { name: 'BookingID', description: 'Booking reference ID', example: 'DTR-2024-001', category: 'Booking' },
    { name: 'QuoteID', description: 'Quotation reference ID', example: 'QT-2024-001', category: 'Quotation' },
    { name: 'TotalAmount', description: 'Total booking amount', example: '₹45,000', category: 'Payment' },
    { name: 'AmountPaid', description: 'Amount paid', example: '₹15,000', category: 'Payment' },
    { name: 'PaymentDate', description: 'Payment date', example: '10th March 2024', category: 'Payment' },
    { name: 'InvoiceNo', description: 'Invoice number', example: 'INV-2024-001', category: 'Payment' },
    { name: 'HotelName', description: 'Hotel name', example: 'Burj Al Arab', category: 'Trip' },
    { name: 'AdultCount', description: 'Number of adults', example: '2', category: 'Passengers' },
    { name: 'ChildCount', description: 'Number of children', example: '1', category: 'Passengers' },
    { name: 'SupportEmail', description: 'Support email address', example: 'support@dreamtravels.com', category: 'Company' },
    { name: 'SupportPhone', description: 'Support phone number', example: '+91 98765 43210', category: 'Company' }
  ];

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    this.defaultTemplates.forEach(template => {
      const newTemplate: EmailTemplate = {
        ...template,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };
      this.templates.push(newTemplate);
    });
  }

  private generateId(): string {
    return `template_${this.templateId++}_${Date.now()}`;
  }

  // Get all templates
  async getTemplates(): Promise<EmailTemplate[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return [...this.templates];
  }

  // Get templates by category
  async getTemplatesByCategory(category: EmailTemplate['category']): Promise<EmailTemplate[]> {
    return this.templates.filter(t => t.category === category);
  }

  // Get templates by role
  async getTemplatesByRole(role: EmailTemplate['role']): Promise<EmailTemplate[]> {
    return this.templates.filter(t => t.role === role);
  }

  // Get template by ID
  async getTemplateById(id: string): Promise<EmailTemplate | null> {
    return this.templates.find(t => t.id === id) || null;
  }

  // Create new template
  async createTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailTemplate> {
    const newTemplate: EmailTemplate = {
      ...template,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.templates.push(newTemplate);
    return newTemplate;
  }

  // Update template
  async updateTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate | null> {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) return null;

    this.templates[index] = {
      ...this.templates[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return this.templates[index];
  }

  // Delete template
  async deleteTemplate(id: string): Promise<boolean> {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) return false;

    // Don't allow deletion of default templates
    if (this.templates[index].isDefault) {
      throw new Error('Cannot delete default templates');
    }

    this.templates.splice(index, 1);
    return true;
  }

  // Duplicate template
  async duplicateTemplate(id: string): Promise<EmailTemplate | null> {
    const original = await this.getTemplateById(id);
    if (!original) return null;

    return this.createTemplate({
      ...original,
      name: `${original.name} (Copy)`,
      isDefault: false
    });
  }

  // Toggle template status
  async toggleTemplateStatus(id: string): Promise<EmailTemplate | null> {
    const template = this.templates.find(t => t.id === id);
    if (!template) return null;

    template.isActive = !template.isActive;
    template.updatedAt = new Date().toISOString();

    return template;
  }

  // Get available variables
  getAvailableVariables(): EmailTemplateVariable[] {
    return [...this.availableVariables];
  }

  // Get variables by category
  getVariablesByCategory(category: string): EmailTemplateVariable[] {
    return this.availableVariables.filter(v => v.category === category);
  }

  // Preview template with variables
  previewTemplate(template: EmailTemplate, variables: Record<string, string>): EmailPreview {
    let previewSubject = template.subject;
    let previewContent = template.content;

    // Replace variables in subject and content
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      previewSubject = previewSubject.replace(regex, value);
      previewContent = previewContent.replace(regex, value);
    });

    return {
      subject: previewSubject,
      content: previewContent,
      variables
    };
  }

  // Send test email
  async sendTestEmail(templateId: string, testEmail: string, variables: Record<string, string>): Promise<void> {
    const template = await this.getTemplateById(templateId);
    if (!template) throw new Error('Template not found');

    const preview = this.previewTemplate(template, variables);
    
    // Simulate sending email
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('📧 Test Email Sent:', {
      to: testEmail,
      subject: preview.subject,
      content: preview.content,
      templateId,
      timestamp: new Date().toISOString()
    });
  }

  // Get template statistics
  getTemplateStats(): {
    total: number;
    active: number;
    inactive: number;
    byCategory: Record<string, number>;
    byRole: Record<string, number>;
  } {
    const stats = {
      total: this.templates.length,
      active: this.templates.filter(t => t.isActive).length,
      inactive: this.templates.filter(t => !t.isActive).length,
      byCategory: {} as Record<string, number>,
      byRole: {} as Record<string, number>
    };

    this.templates.forEach(template => {
      stats.byCategory[template.category] = (stats.byCategory[template.category] || 0) + 1;
      stats.byRole[template.role] = (stats.byRole[template.role] || 0) + 1;
    });

    return stats;
  }
}

export const emailTemplateService = new EmailTemplateService();