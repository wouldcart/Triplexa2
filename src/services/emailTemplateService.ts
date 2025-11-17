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
    },
    // ✳️ 1. Lead Follow-Up Reminder
    {
      name: 'Lead Follow-Up Reminder',
      subject: 'Follow-Up Reminder for Your Trip Enquiry – {TripName}',
      content: `Hi {TravellerName},

We wanted to follow up on your recent enquiry for {TripName}.

📅 Follow-up Date: {FollowupDate}
👤 Assigned Agent: {AgentName}

We'd love to help you plan your perfect trip. Please let us know if you have any questions or would like to proceed with booking.

Best regards,
{AgentName} - {CompanyName}`,
      category: 'lead',
      role: 'traveller',
      trigger: 'Lead follow-up scheduled',
      language: 'en',
      variables: ['LeadID', 'TripName', 'TravellerName', 'FollowupDate', 'AgentName', 'CompanyName'],
      isActive: true,
      isDefault: true
    },
    // ✳️ 2. Lead Auto-Closure Warning
    {
      name: 'Lead Auto Closure Alert',
      subject: 'Your Enquiry Will Auto-Close in 24 Hours – {TripName}',
      content: `Hi {TravellerName},

This is a friendly reminder that your enquiry for {TripName} will automatically close in 24 hours.

⏰ Closure Time: {ClosureTime}
🆔 Lead ID: {LeadID}

If you're still interested in this trip, please respond to this email or contact us to keep your enquiry active.

Best regards,
{CompanyName} Team`,
      category: 'lead',
      role: 'traveller',
      trigger: 'Lead auto-close warning',
      language: 'en',
      variables: ['LeadID', 'TripName', 'TravellerName', 'ClosureTime', 'CompanyName'],
      isActive: true,
      isDefault: true
    },
    // ✳️ 3. Proposal Expiry Alert
    {
      name: 'Proposal Expiry Notification',
      subject: 'Your Tour Proposal for {TripName} Expires Soon',
      content: `Hi {TravellerName},

Your tour proposal for {TripName} will expire soon.

📋 Quote ID: {QuoteID}
📅 Expiry Date: {ExpiryDate}

To secure your booking at the quoted prices, please confirm your acceptance before the expiry date. Prices may change after expiry.

📞 Contact us: {SupportPhone}
📧 Email: {SupportEmail}

Best regards,
{CompanyName}`,
      category: 'quotation',
      role: 'traveller',
      trigger: 'Proposal expiry reminder',
      language: 'en',
      variables: ['QuoteID', 'TripName', 'ExpiryDate', 'TravellerName', 'SupportPhone', 'SupportEmail', 'CompanyName'],
      isActive: true,
      isDefault: true
    },
    // ✳️ 4. Revised Quotation Sent
    {
      name: 'Updated Quotation Sent',
      subject: 'Revised Tour Quotation for {TripName} – Ref: {QuoteID}',
      content: `Hi {TravellerName},

We have sent you a revised quotation for your {TripName} trip.

📋 Quote ID: {QuoteID}
🔄 Revision No: {RevisionNo}
💰 Total Amount: {TotalAmount}
📅 Valid Until: {ValidityDate}

Please review the updated details and let us know if you'd like to proceed or need any further modifications.

📞 Questions? Call us at {SupportPhone}

Best regards,
{AgentName} - {CompanyName}`,
      category: 'quotation',
      role: 'traveller',
      trigger: 'Revised quotation sent',
      language: 'en',
      variables: ['QuoteID', 'TripName', 'RevisionNo', 'TotalAmount', 'ValidityDate', 'TravellerName', 'AgentName', 'SupportPhone', 'CompanyName'],
      isActive: true,
      isDefault: true
    },
    // ✳️ 5. Booking Payment Due Reminder
    {
      name: 'Payment Due Reminder',
      subject: 'Payment Reminder for Your Booking – Ref: {BookingID}',
      content: `Hi {TravellerName},

This is a friendly reminder about your pending payment for booking {BookingID}.

📋 Booking ID: {BookingID}
🧳 Trip: {TripName}
💳 Due Amount: {DueAmount}
📅 Due Date: {DueDate}

To avoid cancellation, please make the payment by the due date. You can pay online or contact us for payment assistance.

💳 Pay Now: [Payment Link]
📞 Need Help? Call {SupportPhone}

Best regards,
Accounts Team - {CompanyName}`,
      category: 'booking',
      role: 'traveller',
      trigger: 'Payment due reminder',
      language: 'en',
      variables: ['BookingID', 'TripName', 'DueAmount', 'DueDate', 'TravellerName', 'SupportPhone', 'CompanyName'],
      isActive: true,
      isDefault: true
    },
    // ✳️ 6. Voucher Delivery (Flight/Hotel/Sightseeing)
    {
      name: 'Your Travel Vouchers Are Ready',
      subject: 'Travel Vouchers for {TripName} – Ref: {BookingID}',
      content: `Hi {TravellerName},

Your travel vouchers for {TripName} are now ready for download!

📋 Booking Reference: {BookingID}
🧳 Trip Name: {TripName}
📎 Voucher Links: {VoucherLinks}

Please download and save these vouchers. You may need to present them during your trip.

📱 Save to Phone: [Mobile Vouchers]
🖨️ Print Options: [Printable Version]

Have a wonderful trip!

Best regards,
{CompanyName} Team`,
      category: 'booking',
      role: 'traveller',
      trigger: 'Vouchers generated',
      language: 'en',
      variables: ['BookingID', 'TripName', 'VoucherLinks', 'TravellerName', 'CompanyName'],
      isActive: true,
      isDefault: true
    },
    // ✳️ 7. Final Itinerary Delivery
    {
      name: 'Your Final Travel Itinerary',
      subject: 'Final Itinerary for {TripName} – Ref: {BookingID}',
      content: `Hi {TravellerName},

Your final travel itinerary for {TripName} is ready!

📋 Booking Reference: {BookingID}
🧳 Trip Name: {TripName}
📅 Trip Start Date: {TripStartDate}
📎 Itinerary PDF: {PDFLink}

This is your complete itinerary with all confirmed details. Please review it carefully and contact us immediately if you notice any discrepancies.

📱 Mobile Version: [Mobile Itinerary]
🧭 Offline Access: [Download for Offline]

Safe travels!

Best regards,
{CompanyName}`,
      category: 'itinerary',
      role: 'traveller',
      trigger: 'Itinerary finalized',
      language: 'en',
      variables: ['BookingID', 'TripName', 'PDFLink', 'TripStartDate', 'TravellerName', 'CompanyName'],
      isActive: true,
      isDefault: true
    },
    // ✳️ 8. Travel Reminder (Trip Starts Soon)
    {
      name: 'Trip Reminder',
      subject: 'Your Trip to {Destination} Starts Tomorrow',
      content: `Hi {TravellerName},

Your exciting trip to {Destination} starts tomorrow!

🧳 Trip Name: {TripName}
📅 Start Date: {StartDate}
📞 Emergency Contact: {EmergencyContact}

Final Reminders:
• Check your passport and travel documents
• Confirm airport/station arrival time
• Pack according to weather forecast
• Keep vouchers and itinerary handy

Have an amazing journey!

Safe travels,
{CompanyName} Team`,
      category: 'reminder',
      role: 'traveller',
      trigger: 'Trip start reminder',
      language: 'en',
      variables: ['TravellerName', 'TripName', 'StartDate', 'Destination', 'EmergencyContact', 'CompanyName'],
      isActive: true,
      isDefault: true
    },
    // ✳️ 9. Post-Trip Feedback Request
    {
      name: 'Thank You – Share Your Feedback',
      subject: 'How Was Your Trip to {Destination}?',
      content: `Hi {TravellerName},

We hope you had a wonderful time on your trip to {Destination}!

🧳 Trip: {TripName}
📋 We'd love to hear about your experience: {FeedbackLink}

Your feedback helps us improve our services and plan even better trips for future travelers. It only takes 2 minutes to complete.

As a token of appreciation, you'll receive a 10% discount on your next booking after submitting your feedback.

Thank you for choosing {CompanyName}!

Best regards,
Customer Experience Team`,
      category: 'feedback',
      role: 'traveller',
      trigger: 'Post-trip feedback request',
      language: 'en',
      variables: ['TravellerName', 'TripName', 'Destination', 'FeedbackLink', 'CompanyName'],
      isActive: true,
      isDefault: true
    },
    // ✳️ 10. Cancellation Notification
    {
      name: 'Booking Cancellation Notice',
      subject: 'Cancellation Confirmed – {TripName} | Ref: {BookingID}',
      content: `Hi {TravellerName},

Your booking has been cancelled as requested.

📋 Booking ID: {BookingID}
🧳 Trip: {TripName}
💰 Refund Amount: {RefundAmount}
📅 Cancellation Date: {CancellationDate}

We understand that plans can change. Your refund of {RefundAmount} will be processed within 5-7 business days to your original payment method.

If you have any questions about the cancellation or refund process, please don't hesitate to contact us.

We hope to serve you again in the future.

Best regards,
{CompanyName} Team`,
      category: 'booking',
      role: 'traveller',
      trigger: 'Booking cancelled',
      language: 'en',
      variables: ['BookingID', 'TripName', 'RefundAmount', 'CancellationDate', 'TravellerName', 'CompanyName'],
      isActive: true,
      isDefault: true
    },
    // ✳️ 11. Refund Processed
    {
      name: 'Refund Successfully Processed',
      subject: 'Refund for {TripName} – Ref: {RefundID}',
      content: `Hi {TravellerName},

Your refund has been successfully processed!

💳 Refund ID: {RefundID}
📋 Booking Reference: {BookingID}
💰 Refund Amount: {RefundAmount}
📅 Refund Date: {RefundDate}

The refund has been initiated to your original payment method and should reflect in your account within 3-5 business days, depending on your bank's processing time.

Thank you for your patience during this process.

Best regards,
Accounts Team - {CompanyName}`,
      category: 'payment',
      role: 'traveller',
      trigger: 'Refund processed',
      language: 'en',
      variables: ['RefundID', 'BookingID', 'RefundAmount', 'RefundDate', 'TravellerName', 'CompanyName'],
      isActive: true,
      isDefault: true
    },
    // ✳️ 12. Agent New Lead Notification
    {
      name: 'New Lead Assigned',
      subject: 'New Lead Assigned – {TravellerName} for {TripName}',
      content: `Hi {AgentName},

A new lead has been assigned to you!

👤 Client: {TravellerName}
🧳 Trip: {TripName}
🆔 Lead ID: {LeadID}

Please contact the client within 2 hours for best results. Review their requirements and prepare a customized proposal.

📞 Contact Priority: High
⏰ Response Time: Within 2 hours

Good luck with the conversion!

Best regards,
Lead Management Team - {CompanyName}`,
      category: 'lead',
      role: 'agent',
      trigger: 'New lead assigned',
      language: 'en',
      variables: ['AgentName', 'TravellerName', 'TripName', 'LeadID', 'CompanyName'],
      isActive: true,
      isDefault: true
    },
    // ✳️ 13. Agent Query Reminder
    {
      name: 'Pending Lead Reminder',
      subject: 'Follow-Up Required – Lead ID: {LeadID}',
      content: `Hi {AgentName},

This is a reminder about your pending lead that requires follow-up.

🆔 Lead ID: {LeadID}
👤 Client: {TravellerName}
🧳 Trip: {TripName}
📅 Last Follow-Up: {LastFollowUp}

Please contact the client today to maintain engagement and move towards conversion.

💡 Suggested Action: Call to discuss their concerns and offer solutions
📞 Priority: Medium-High

Keep up the good work!

Best regards,
Sales Team - {CompanyName}`,
      category: 'lead',
      role: 'agent',
      trigger: 'Lead follow-up reminder',
      language: 'en',
      variables: ['LeadID', 'TravellerName', 'TripName', 'LastFollowUp', 'AgentName', 'CompanyName'],
      isActive: true,
      isDefault: true
    },
    // ✳️ 14. Agent Payment Settlement Summary
    {
      name: 'Payment Settlement Summary',
      subject: 'Monthly Agent Settlement – {MonthYear}',
      content: `Hi {AgentName},

Your monthly settlement summary for {MonthYear} is ready!

📊 Sales Performance:
• Total Sales: ₹{TotalSales}
• Total Bookings: {BookingCount}
• Commission Rate: 8%

💰 Commission Details:
• Commission Amount: ₹{CommissionAmount}
• Adjustments: ₹0
• Net Payable: ₹{CommissionAmount}

The commission amount will be transferred to your registered bank account within 5 business days.

Thank you for your excellent performance this month!

Best regards,
Finance Team - {CompanyName}`,
      category: 'account',
      role: 'agent',
      trigger: 'Monthly settlement',
      language: 'en',
      variables: ['AgentName', 'MonthYear', 'TotalSales', 'CommissionAmount', 'BookingCount', 'CompanyName'],
      isActive: true,
      isDefault: true
    },
    // ✳️ 15. Admin System Alerts (Low Balance / API Error)
    {
      name: 'System Alert',
      subject: 'API/Balance Alert – {AlertType}',
      content: `URGENT: System Alert

Alert Type: {AlertType}
Description: {Description}
Time: {Time}
Priority Level: {PriorityLevel}

Immediate action may be required. Please check the system dashboard and take appropriate action.

🔧 Action Required: Check system logs and resolve issue
📊 Dashboard: [View System Status]
📞 Emergency Contact: Technical Team

This is an automated system alert.

System Monitoring - {CompanyName}`,
      category: 'support',
      role: 'admin',
      trigger: 'System alert triggered',
      language: 'en',
      variables: ['AlertType', 'Description', 'Time', 'PriorityLevel', 'CompanyName'],
      isActive: true,
      isDefault: true
    }
  ];

  private availableVariables: EmailTemplateVariable[] = [
    { name: 'ClientName', description: 'Customer/Client name', example: 'John Smith', category: 'Customer' },
    { name: 'TravellerName', description: 'Traveller name', example: 'John Smith', category: 'Customer' },
    { name: 'AgentName', description: 'Agent name', example: 'Sarah Johnson', category: 'Staff' },
    { name: 'CompanyName', description: 'Company name', example: 'Dream Travels', category: 'Company' },
    { name: 'TripName', description: 'Trip/Package name', example: 'Dubai 5D/4N', category: 'Trip' },
    { name: 'Destination', description: 'Travel destination', example: 'Dubai, UAE', category: 'Trip' },
    { name: 'StartDate', description: 'Trip start date', example: '15th March 2024', category: 'Trip' },
    { name: 'EndDate', description: 'Trip end date', example: '20th March 2024', category: 'Trip' },
    { name: 'TripStartDate', description: 'Trip start date', example: '15th March 2024', category: 'Trip' },
    { name: 'BookingID', description: 'Booking reference ID', example: 'DTR-2024-001', category: 'Booking' },
    { name: 'QuoteID', description: 'Quotation reference ID', example: 'QT-2024-001', category: 'Quotation' },
    { name: 'LeadID', description: 'Lead reference ID', example: 'LD-2024-001', category: 'Lead' },
    { name: 'RefundID', description: 'Refund reference ID', example: 'RF-2024-001', category: 'Payment' },
    { name: 'TotalAmount', description: 'Total booking amount', example: '₹45,000', category: 'Payment' },
    { name: 'AmountPaid', description: 'Amount paid', example: '₹15,000', category: 'Payment' },
    { name: 'DueAmount', description: 'Due payment amount', example: '₹30,000', category: 'Payment' },
    { name: 'RefundAmount', description: 'Refund amount', example: '₹15,000', category: 'Payment' },
    { name: 'PaymentDate', description: 'Payment date', example: '10th March 2024', category: 'Payment' },
    { name: 'DueDate', description: 'Payment due date', example: '25th March 2024', category: 'Payment' },
    { name: 'RefundDate', description: 'Refund date', example: '15th March 2024', category: 'Payment' },
    { name: 'InvoiceNo', description: 'Invoice number', example: 'INV-2024-001', category: 'Payment' },
    { name: 'HotelName', description: 'Hotel name', example: 'Burj Al Arab', category: 'Trip' },
    { name: 'SightseeingList', description: 'Sightseeing activities list', example: 'City Tour, Desert Safari, Burj Khalifa', category: 'Trip' },
    { name: 'VoucherLinks', description: 'Travel voucher download links', example: '[Download Vouchers]', category: 'Booking' },
    { name: 'PDFLink', description: 'PDF document link', example: '[Download PDF]', category: 'Documents' },
    { name: 'FeedbackLink', description: 'Feedback form link', example: '[Submit Feedback]', category: 'Feedback' },
    { name: 'AdultCount', description: 'Number of adults', example: '2', category: 'Passengers' },
    { name: 'ChildCount', description: 'Number of children', example: '1', category: 'Passengers' },
    { name: 'SupportEmail', description: 'Support email address', example: 'support@dreamtravels.com', category: 'Company' },
    { name: 'SupportPhone', description: 'Support phone number', example: '+91 98765 43210', category: 'Company' },
    { name: 'EmergencyContact', description: 'Emergency contact number', example: '+91 98765 43210', category: 'Emergency' },
    { name: 'FollowupDate', description: 'Follow-up scheduled date', example: '20th March 2024', category: 'Lead' },
    { name: 'ClosureTime', description: 'Auto-closure time', example: '24 hours', category: 'Lead' },
    { name: 'LastFollowUp', description: 'Last follow-up date', example: '15th March 2024', category: 'Lead' },
    { name: 'ExpiryDate', description: 'Proposal expiry date', example: '25th March 2024', category: 'Quotation' },
    { name: 'RevisionNo', description: 'Quotation revision number', example: '2', category: 'Quotation' },
    { name: 'ValidityDate', description: 'Quotation validity date', example: '30th March 2024', category: 'Quotation' },
    { name: 'CancellationDate', description: 'Booking cancellation date', example: '18th March 2024', category: 'Booking' },
    { name: 'MonthYear', description: 'Month and year', example: 'March 2024', category: 'Date' },
    { name: 'BookingCount', description: 'Total booking count', example: '15', category: 'Statistics' },
    { name: 'TotalRevenue', description: 'Total revenue amount', example: '₹450,000', category: 'Statistics' },
    { name: 'ConversionRate', description: 'Lead conversion rate', example: '25%', category: 'Statistics' },
    { name: 'TotalSales', description: 'Total sales amount', example: '₹500,000', category: 'Statistics' },
    { name: 'CommissionAmount', description: 'Agent commission amount', example: '₹40,000', category: 'Commission' },
    { name: 'AlertType', description: 'System alert type', example: 'Low Balance', category: 'System' },
    { name: 'Description', description: 'Alert description', example: 'API connection failed', category: 'System' },
    { name: 'Time', description: 'Alert timestamp', example: '14:30 PM', category: 'System' },
    { name: 'PriorityLevel', description: 'Alert priority level', example: 'HIGH', category: 'System' }
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
    
    // Use the email service to actually send the email
    try {
      console.log('📧 Attempting to send test email...');
      console.log('Template preview:', preview);
      console.log('Recipient:', testEmail);
      
      const { sendEmail } = await import('@/services/emailService');
      console.log('Email service imported successfully');
      
      const result = await sendEmail(testEmail, preview.subject, preview.content);
      console.log('✅ Test email sent successfully:', result);
      
      console.log('📧 Test Email Sent:', {
        to: testEmail,
        subject: preview.subject,
        content: preview.content,
        templateId,
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      console.error('❌ Failed to send test email:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw new Error(`Failed to send test email: ${error.message}`);
    }
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