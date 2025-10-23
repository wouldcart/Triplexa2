import { Agent } from '@/types/agent';

export class AgentApiService {
  private static baseUrl = '/api/agents';

  static async fetchAgents(): Promise<Agent[]> {
    try {
      // For now, simulate API call since we don't have a real backend
      // In a real implementation, this would be:
      // const response = await fetch(this.baseUrl);
      // return response.json();
      
      console.log('Fetching agents from API...');
      
      // Simulate API response with delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return mock data that would come from the API
      return [
        {
          id: 1001,
          name: "API Agent One",
          email: "api.agent1@example.com",
          country: "Thailand",
          city: "Bangkok",
          type: "company",
          status: "active",
          commissionType: "percentage",
          commissionValue: "10%",
          contact: {
            email: "api.agent1@example.com",
            phone: "+66-1234-5678",
            website: "https://apiacent1.com"
          },
          joinDate: "2024-01-15",
          createdAt: "2024-01-15T08:00:00Z",
          stats: {
            totalQueries: 45,
            totalBookings: 32,
            conversionRate: 18,
            revenueGenerated: 125000,
            averageBookingValue: 3900,
            activeCustomers: 28
          },
          recentActivity: []
        },
        {
          id: 1002,
          name: "API Agent Two",
          email: "api.agent2@example.com",
          country: "India",
          city: "Mumbai",
          type: "individual",
          status: "active",
          commissionType: "flat",
          commissionValue: "500",
          contact: {
            email: "api.agent2@example.com",
            phone: "+91-9876-543210"
          },
          joinDate: "2024-02-20",
          createdAt: "2024-02-20T10:30:00Z",
          stats: {
            totalQueries: 38,
            totalBookings: 25,
            conversionRate: 22,
            revenueGenerated: 98000,
            averageBookingValue: 3920,
            activeCustomers: 22
          },
          recentActivity: []
        }
      ];
    } catch (error) {
      console.error('Failed to fetch agents from API:', error);
      return [];
    }
  }

  static async fetchAgentById(id: number): Promise<Agent | null> {
    try {
      const agents = await this.fetchAgents();
      return agents.find(agent => agent.id === id) || null;
    } catch (error) {
      console.error('Failed to fetch agent by ID:', error);
      return null;
    }
  }

  static async searchAgents(query: string): Promise<Agent[]> {
    try {
      const agents = await this.fetchAgents();
      const searchTerm = query.toLowerCase();
      
      return agents.filter(agent => 
        agent.name.toLowerCase().includes(searchTerm) ||
        agent.email.toLowerCase().includes(searchTerm) ||
        agent.city.toLowerCase().includes(searchTerm) ||
        agent.country.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Failed to search agents:', error);
      return [];
    }
  }
}