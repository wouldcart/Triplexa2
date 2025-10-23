
import { Query } from '@/types/query';
import { ProposalDay } from '@/components/proposal/DayPlanningInterface';

export interface EnhancedProposalTemplate {
  id: string;
  name: string;
  description: string;
  destination: {
    country: string;
    cities: string[];
  };
  duration: {
    days: number;
    nights: number;
  };
  category: 'Budget' | 'Standard' | 'Premium' | 'Luxury';
  dayPlan: ProposalDay[];
  pricingMatrix: {
    paxCount: number;
    basePrice: number;
    markup: number;
  }[];
  metadata: {
    createdFrom?: string;
    usageCount: number;
    averageRating: number;
    lastUsed: string;
    isActive: boolean;
    tags: string[];
  };
  createdAt: string;
  updatedAt: string;
}

class ProposalTemplateService {
  private static instance: ProposalTemplateService;
  private storageKey = 'proposal_templates_enhanced_v1';

  public static getInstance(): ProposalTemplateService {
    if (!ProposalTemplateService.instance) {
      ProposalTemplateService.instance = new ProposalTemplateService();
    }
    return ProposalTemplateService.instance;
  }

  public getAllTemplates(): EnhancedProposalTemplate[] {
    try {
      const saved = localStorage.getItem(this.storageKey) || '[]';
      const templates = JSON.parse(saved);
      return templates.concat(this.getDefaultTemplates());
    } catch (error) {
      console.error('Error loading templates:', error);
      return this.getDefaultTemplates();
    }
  }

  public getTemplatesByDestination(country: string, cities: string[]): EnhancedProposalTemplate[] {
    const allTemplates = this.getAllTemplates();
    return allTemplates.filter(template => 
      template.destination.country.toLowerCase() === country.toLowerCase() &&
      template.destination.cities.some(city => 
        cities.some(queryCity => city.toLowerCase().includes(queryCity.toLowerCase()))
      )
    );
  }

  public getTemplatesByDuration(days: number): EnhancedProposalTemplate[] {
    const allTemplates = this.getAllTemplates();
    return allTemplates.filter(template => template.duration.days === days);
  }

  public getRecommendedTemplates(query: Query): EnhancedProposalTemplate[] {
    const destinationTemplates = this.getTemplatesByDestination(
      query.destination.country, 
      query.destination.cities
    );
    
    return destinationTemplates
      .filter(template => template.metadata.isActive)
      .sort((a, b) => {
        // Sort by usage count and rating
        const scoreA = a.metadata.usageCount * 0.3 + a.metadata.averageRating * 0.7;
        const scoreB = b.metadata.usageCount * 0.3 + b.metadata.averageRating * 0.7;
        return scoreB - scoreA;
      })
      .slice(0, 6);
  }

  public saveTemplate(template: Partial<EnhancedProposalTemplate>): string {
    try {
      const templates = this.getAllTemplates().filter(t => !t.id.startsWith('default_'));
      const templateId = template.id || `template_${Date.now()}`;
      
      const newTemplate: EnhancedProposalTemplate = {
        id: templateId,
        name: template.name || 'Untitled Template',
        description: template.description || '',
        destination: template.destination || { country: '', cities: [] },
        duration: template.duration || { days: 1, nights: 0 },
        category: template.category || 'Standard',
        dayPlan: template.dayPlan || [],
        pricingMatrix: template.pricingMatrix || [],
        metadata: {
          createdFrom: template.metadata?.createdFrom,
          usageCount: template.metadata?.usageCount || 0,
          averageRating: template.metadata?.averageRating || 4.0,
          lastUsed: template.metadata?.lastUsed || new Date().toISOString(),
          isActive: template.metadata?.isActive !== false,
          tags: template.metadata?.tags || []
        },
        createdAt: template.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const existingIndex = templates.findIndex(t => t.id === templateId);
      if (existingIndex >= 0) {
        templates[existingIndex] = newTemplate;
      } else {
        templates.push(newTemplate);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(templates));
      return templateId;
    } catch (error) {
      console.error('Error saving template:', error);
      throw new Error('Failed to save template');
    }
  }

  public saveProposalAsTemplate(
    proposalDays: ProposalDay[], 
    query: Query,
    templateName: string,
    category: EnhancedProposalTemplate['category'] = 'Standard'
  ): string {
    const totalCost = proposalDays.reduce((sum, day) => sum + day.totalCost, 0);
    const totalPax = query.paxDetails.adults + query.paxDetails.children;
    
    const template: Partial<EnhancedProposalTemplate> = {
      name: templateName,
      description: `Template created from ${query.destination.country} proposal`,
      destination: {
        country: query.destination.country,
        cities: query.destination.cities
      },
      duration: {
        days: proposalDays.length,
        nights: Math.max(0, proposalDays.length - 1)
      },
      category,
      dayPlan: proposalDays,
      pricingMatrix: [
        {
          paxCount: totalPax,
          basePrice: totalCost,
          markup: 0.15 // 15% default markup
        }
      ],
      metadata: {
        usageCount: 0,
        averageRating: 4.0,
        lastUsed: new Date().toISOString(),
        isActive: true,
        tags: [query.destination.country.toLowerCase(), `${proposalDays.length}days`]
      }
    };

    return this.saveTemplate(template);
  }

  public incrementUsage(templateId: string): void {
    try {
      const templates = this.getAllTemplates().filter(t => !t.id.startsWith('default_'));
      const templateIndex = templates.findIndex(t => t.id === templateId);
      
      if (templateIndex >= 0) {
        templates[templateIndex].metadata.usageCount += 1;
        templates[templateIndex].metadata.lastUsed = new Date().toISOString();
        localStorage.setItem(this.storageKey, JSON.stringify(templates));
      }
    } catch (error) {
      console.error('Error incrementing template usage:', error);
    }
  }

  private getDefaultTemplates(): EnhancedProposalTemplate[] {
    return [
      {
        id: 'default_thailand_3d4n',
        name: 'Thailand Beach Getaway - 3D/4N',
        description: 'Perfect beach vacation with hotel, transport and activities',
        destination: { country: 'Thailand', cities: ['Bangkok', 'Phuket'] },
        duration: { days: 4, nights: 3 },
        category: 'Standard',
        dayPlan: [
          {
            id: 'day1',
            dayNumber: 1,
            date: '',
            city: 'Bangkok',
            title: 'Arrival in Bangkok',
            description: 'Airport transfer and city exploration',
            activities: [
              { id: 'act1', name: 'Airport Transfer', price: 25, duration: '1 hour' },
              { id: 'act2', name: 'City Temple Tour', price: 40, duration: '3 hours' }
            ],
            meals: { breakfast: false, lunch: true, dinner: true },
            totalCost: 165
          },
          {
            id: 'day2',
            dayNumber: 2,
            date: '',
            city: 'Bangkok',
            title: 'Bangkok Sightseeing',
            description: 'Full day city tour with cultural sites',
            activities: [
              { id: 'act3', name: 'Grand Palace Tour', price: 50, duration: '4 hours' },
              { id: 'act4', name: 'Floating Market Visit', price: 35, duration: '3 hours' }
            ],
            meals: { breakfast: true, lunch: true, dinner: false },
            totalCost: 185
          }
        ],
        pricingMatrix: [
          { paxCount: 2, basePrice: 350, markup: 0.15 },
          { paxCount: 4, basePrice: 650, markup: 0.12 }
        ],
        metadata: {
          usageCount: 15,
          averageRating: 4.5,
          lastUsed: new Date().toISOString(),
          isActive: true,
          tags: ['thailand', 'beach', 'bangkok', 'phuket', '4days']
        },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ];
  }
}

export default ProposalTemplateService;
