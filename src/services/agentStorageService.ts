
import { Agent } from '@/types/agent';

const AGENTS_STORAGE_KEY = 'travel_agents';

export class AgentStorageService {
  static getAgents(): Agent[] {
    try {
      const storedAgents = localStorage.getItem(AGENTS_STORAGE_KEY);
      return storedAgents ? JSON.parse(storedAgents) : [];
    } catch (error) {
      console.error('Error loading agents from localStorage:', error);
      return [];
    }
  }

  static saveAgent(agent: Omit<Agent, 'id'>): Agent {
    try {
      const agents = this.getAgents();
      const newId = Math.max(0, ...agents.map(a => a.id)) + 1;
      
      const newAgent: Agent = {
        ...agent,
        id: newId,
        createdAt: new Date().toISOString(),
        stats: {
          totalQueries: 0,
          totalBookings: 0,
          conversionRate: 0,
          revenueGenerated: 0,
          averageBookingValue: 0,
          activeCustomers: 0
        },
        recentActivity: []
      };

      const updatedAgents = [...agents, newAgent];
      localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(updatedAgents));
      
      return newAgent;
    } catch (error) {
      console.error('Error saving agent to localStorage:', error);
      throw new Error('Failed to save agent');
    }
  }

  static updateAgent(id: number, updates: Partial<Agent>): Agent | null {
    try {
      const agents = this.getAgents();
      const agentIndex = agents.findIndex(a => a.id === id);
      
      if (agentIndex === -1) {
        return null;
      }

      const updatedAgent = { ...agents[agentIndex], ...updates };
      agents[agentIndex] = updatedAgent;
      
      localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(agents));
      return updatedAgent;
    } catch (error) {
      console.error('Error updating agent:', error);
      return null;
    }
  }

  static deleteAgent(id: number): boolean {
    try {
      const agents = this.getAgents();
      const filteredAgents = agents.filter(a => a.id !== id);
      
      localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(filteredAgents));
      return true;
    } catch (error) {
      console.error('Error deleting agent:', error);
      return false;
    }
  }
}
