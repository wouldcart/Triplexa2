import { Query } from '@/types/query';
import { FollowUp, FollowUpPriority, FollowUpCategory, FollowUpType, EnquiryDetails, BookingDetails } from '../types/followUpTypes';
import { mockQueries } from '@/data/queryData';
import { v4 as uuidv4 } from 'uuid';

export class EnquiryIntegrationService {
  
  /**
   * Convert Query data to EnquiryDetails for follow-ups
   */
  static queryToEnquiryDetails(query: Query): EnquiryDetails {
    return {
      enquiryId: query.id,
      destination: `${query.destination.country} - ${query.destination.cities.join(', ')}`,
      travelDates: {
        from: query.travelDates.from,
        to: query.travelDates.to
      },
      paxCount: query.paxDetails.adults + query.paxDetails.children + query.paxDetails.infants,
      packageType: query.packageType,
      enquiryStatus: query.status,
      priority: query.priority,
      assignedTo: query.assignedTo || undefined,
      budget: query.budget
    };
  }

  /**
   * Generate booking details from query information
   */
  static generateBookingDetails(query: Query, bookingStatus: 'confirmed' | 'pending' | 'cancelled' | 'completed' = 'pending'): BookingDetails {
    const totalAmount = (query.budget.min + query.budget.max) / 2;
    const paidAmount = bookingStatus === 'confirmed' ? totalAmount * 0.4 : 0; // 40% advance
    
    return {
      bookingId: `BK-${query.id}`,
      bookingStatus,
      bookingReference: `REF-${query.id}-${Date.now()}`,
      totalAmount,
      paidAmount,
      balanceAmount: totalAmount - paidAmount,
      paymentDueDate: this.calculatePaymentDueDate(query.travelDates.from),
      travelStartDate: query.travelDates.from,
      travelEndDate: query.travelDates.to,
      vendorConfirmations: {
        hotels: false,
        flights: false,
        transfers: false,
        activities: false
      }
    };
  }

  /**
   * Auto-generate follow-ups based on enquiry status
   */
  static generateFollowUpsForEnquiry(query: Query): FollowUp[] {
    const enquiryDetails = this.queryToEnquiryDetails(query);
    const followUps: FollowUp[] = [];
    const now = new Date();

    switch (query.status) {
      case 'new':
        followUps.push(this.createFollowUp({
          title: `Initial contact for ${query.destination.cities.join(', ')} enquiry`,
          description: `Contact client to understand requirements for ${query.packageType} package`,
          dueDate: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
          priority: 'high',
          category: 'enquiry',
          type: 'client-call',
          queryId: query.id,
          assignedTo: query.assignedTo,
          enquiryDetails,
          contactMethod: query.communicationPreference as any
        }));
        break;

      case 'assigned':
        followUps.push(this.createFollowUp({
          title: `Prepare proposal for ${query.destination.cities.join(', ')}`,
          description: `Create detailed proposal based on client requirements`,
          dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 1 day
          priority: query.priority === 'high' ? 'urgent' : 'high',
          category: 'enquiry',
          type: 'proposal-follow',
          queryId: query.id,
          assignedTo: query.assignedTo,
          enquiryDetails
        }));
        break;

      case 'proposal-sent':
        followUps.push(this.createFollowUp({
          title: `Follow up on ${query.destination.cities.join(', ')} proposal`,
          description: `Check if client has reviewed the proposal and answer any questions`,
          dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
          priority: 'medium',
          category: 'enquiry',
          type: 'proposal-follow',
          queryId: query.id,
          assignedTo: query.assignedTo,
          enquiryDetails,
          contactMethod: query.communicationPreference as any
        }));
        break;

      case 'confirmed':
        const bookingDetails = this.generateBookingDetails(query, 'confirmed');
        
        // Payment follow-up
        followUps.push(this.createFollowUp({
          title: `Collect advance payment for ${query.destination.cities.join(', ')}`,
          description: `Send payment link and collect advance payment`,
          dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
          category: 'payment',
          type: 'payment-reminder',
          queryId: query.id,
          assignedTo: query.assignedTo,
          enquiryDetails,
          bookingDetails
        }));

        // Documentation follow-up
        followUps.push(this.createFollowUp({
          title: `Collect travel documents for ${query.destination.cities.join(', ')}`,
          description: `Collect passport copies, visa requirements, and other documents`,
          dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'medium',
          category: 'documentation',
          type: 'document-collection',
          queryId: query.id,
          assignedTo: query.assignedTo,
          enquiryDetails,
          bookingDetails
        }));

        // Vendor confirmations
        followUps.push(this.createFollowUp({
          title: `Confirm all bookings for ${query.destination.cities.join(', ')}`,
          description: `Confirm hotels, flights, transfers, and activities with vendors`,
          dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
          category: 'booking',
          type: 'vendor-confirmation',
          queryId: query.id,
          assignedTo: query.assignedTo,
          enquiryDetails,
          bookingDetails
        }));
        break;

      case 'converted':
        const completedBooking = this.generateBookingDetails(query, 'completed');
        
        // Pre-travel check
        const travelDate = new Date(query.travelDates.from);
        const preTravelDate = new Date(travelDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 1 week before
        
        if (preTravelDate > now) {
          followUps.push(this.createFollowUp({
            title: `Pre-travel check for ${query.destination.cities.join(', ')}`,
            description: `Final confirmation of all arrangements and share emergency contacts`,
            dueDate: preTravelDate.toISOString(),
            priority: 'medium',
            category: 'travel',
            type: 'pre-travel-check',
            queryId: query.id,
            assignedTo: query.assignedTo,
            enquiryDetails,
            bookingDetails: completedBooking
          }));
        }

        // Post-travel feedback
        const postTravelDate = new Date(new Date(query.travelDates.to).getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days after return
        
        followUps.push(this.createFollowUp({
          title: `Collect feedback for ${query.destination.cities.join(', ')} trip`,
          description: `Call client to collect feedback and request reviews`,
          dueDate: postTravelDate.toISOString(),
          priority: 'low',
          category: 'post-travel',
          type: 'post-travel-feedback',
          queryId: query.id,
          assignedTo: query.assignedTo,
          enquiryDetails,
          bookingDetails: completedBooking
        }));
        break;
    }

    return followUps;
  }

  /**
   * Create a standardized follow-up object
   */
  private static createFollowUp(params: {
    title: string;
    description: string;
    dueDate: string;
    priority: FollowUpPriority;
    category: FollowUpCategory;
    type: FollowUpType;
    queryId: string;
    assignedTo?: string | null;
    enquiryDetails?: EnquiryDetails;
    bookingDetails?: BookingDetails;
    contactMethod?: 'phone' | 'email' | 'whatsapp' | 'sms';
  }): FollowUp {
    const now = new Date().toISOString();
    
    return {
      id: `fu-${uuidv4()}`,
      title: params.title,
      description: params.description,
      dueDate: params.dueDate,
      priority: params.priority,
      status: 'pending',
      category: params.category,
      type: params.type,
      queryId: params.queryId,
      assignedTo: params.assignedTo || undefined,
      createdAt: now,
      updatedAt: now,
      enquiryDetails: params.enquiryDetails,
      bookingDetails: params.bookingDetails,
      contactMethod: params.contactMethod || 'email',
      isAutoGenerated: true,
      tags: [params.category, params.type]
    };
  }

  /**
   * Calculate payment due date based on travel date
   */
  private static calculatePaymentDueDate(travelStartDate: string): string {
    const travelDate = new Date(travelStartDate);
    const paymentDueDate = new Date(travelDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days before travel
    return paymentDueDate.toISOString();
  }

  /**
   * Get all queries that need follow-up generation
   */
  static getQueriesNeedingFollowUps(): Query[] {
    return mockQueries.filter(query => 
      ['new', 'assigned', 'proposal-sent', 'confirmed', 'converted'].includes(query.status)
    );
  }

  /**
   * Generate follow-ups for all active queries
   */
  static generateAllPendingFollowUps(): FollowUp[] {
    const queries = this.getQueriesNeedingFollowUps();
    const allFollowUps: FollowUp[] = [];

    queries.forEach(query => {
      const followUps = this.generateFollowUpsForEnquiry(query);
      allFollowUps.push(...followUps);
    });

    return allFollowUps;
  }

  /**
   * Get query by ID for follow-up context
   */
  static getQueryById(queryId: string): Query | undefined {
    return mockQueries.find(query => query.id === queryId);
  }

  /**
   * Update follow-up with enquiry context
   */
  static enrichFollowUpWithEnquiryData(followUp: FollowUp): FollowUp {
    if (!followUp.queryId) return followUp;

    const query = this.getQueryById(followUp.queryId);
    if (!query) return followUp;

    return {
      ...followUp,
      enquiryDetails: this.queryToEnquiryDetails(query),
      bookingDetails: followUp.bookingDetails || this.generateBookingDetails(query)
    };
  }
}