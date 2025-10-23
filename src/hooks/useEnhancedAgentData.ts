import { useState, useEffect, useMemo } from 'react';
import { Agent } from '@/types/agent';
import { useLocalAgentData } from '@/hooks/useLocalAgentData';
import { AgentApiService } from '@/services/agentApiService';

export const useEnhancedAgentData = (queryId?: string) => {
  const { agents: localAgents, loading: localLoading } = useLocalAgentData();
  const [apiAgents, setApiAgents] = useState<Agent[]>([]);
  const [queryAgents, setQueryAgents] = useState<Agent[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);

  // Load agents from API endpoint
  useEffect(() => {
    const loadApiAgents = async () => {
      setApiLoading(true);
      try {
        const agents = await AgentApiService.fetchAgents();
        setApiAgents(agents);
      } catch (error) {
        console.error('Error loading agents from API:', error);
      } finally {
        setApiLoading(false);
      }
    };

    loadApiAgents();
  }, []);

  // Load agents from query data if editing a query
  useEffect(() => {
    if (queryId) {
      setQueryLoading(true);
      try {
        // Load agents from the specific query's context
        const savedQueries = localStorage.getItem('travel_queries');
        if (savedQueries) {
          const queries = JSON.parse(savedQueries);
          const currentQuery = queries.find((q: any) => q.id === queryId);
          
          if (currentQuery && currentQuery.agentId && currentQuery.agentName) {
            // Create an agent object from query data
            const queryAgent: Agent = {
              id: currentQuery.agentId,
              name: currentQuery.agentName,
              email: `${currentQuery.agentName.toLowerCase().replace(/\s+/g, '.')}@query.local`,
              country: 'Unknown',
              city: 'Unknown',
              type: 'individual',
              status: 'active',
              commissionType: 'percentage',
              commissionValue: '10%',
              contact: {
                email: `${currentQuery.agentName.toLowerCase().replace(/\s+/g, '.')}@query.local`,
                phone: 'N/A'
              },
              joinDate: currentQuery.createdAt || new Date().toISOString(),
              createdAt: currentQuery.createdAt || new Date().toISOString(),
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
            
            setQueryAgents([queryAgent]);
          }
        }
      } catch (error) {
        console.error('Error loading agents from query data:', error);
      } finally {
        setQueryLoading(false);
      }
    }
  }, [queryId]);

  // Combine all agent sources with deduplication
  const allAgents = useMemo(() => {
    const agentMap = new Map<number, Agent>();
    
    // Add local agents first
    localAgents.forEach(agent => {
      agentMap.set(agent.id, agent);
    });
    
    // Add API agents (may override local agents)
    apiAgents.forEach(agent => {
      agentMap.set(agent.id, agent);
    });
    
    // Add query agents (prioritize query context)
    queryAgents.forEach(agent => {
      agentMap.set(agent.id, { ...agentMap.get(agent.id), ...agent });
    });
    
    return Array.from(agentMap.values());
  }, [localAgents, apiAgents, queryAgents]);

  // Get active agents from the combined agent data
  const activeAgents = useMemo(() => {
    return allAgents.filter((agent: Agent) => agent.status === 'active');
  }, [allAgents]);

  // Get agents by country
  const getAgentsByCountry = (country: string) => {
    return activeAgents.filter((agent: Agent) => 
      agent.country.toLowerCase() === country.toLowerCase()
    );
  };

  // Get agents by city
  const getAgentsByCity = (city: string) => {
    return activeAgents.filter((agent: Agent) => 
      agent.city.toLowerCase() === city.toLowerCase()
    );
  };

  // Get agent by ID
  const getAgentById = (agentId: number) => {
    return allAgents.find((agent: Agent) => agent.id === agentId);
  };

  // Get high-performing agents (based on conversion rate)
  const getHighPerformingAgents = () => {
    return activeAgents.filter((agent: Agent) => 
      agent.stats.conversionRate > 15
    ).sort((a, b) => b.stats.conversionRate - a.stats.conversionRate);
  };

  // Search agents across all sources
  const searchAgents = async (searchTerm: string) => {
    const localResults = activeAgents.filter(agent =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.country.toLowerCase().includes(searchTerm.toLowerCase())
    );

    try {
      const apiResults = await AgentApiService.searchAgents(searchTerm);
      
      // Combine and deduplicate results
      const resultMap = new Map<number, Agent>();
      localResults.forEach(agent => resultMap.set(agent.id, agent));
      apiResults.forEach(agent => resultMap.set(agent.id, agent));
      
      return Array.from(resultMap.values());
    } catch (error) {
      console.error('Error searching agents:', error);
      return localResults;
    }
  };

  const loading = localLoading || apiLoading || queryLoading;

  return {
    activeAgents,
    allAgents,
    getAgentsByCountry,
    getAgentsByCity,
    getAgentById,
    getHighPerformingAgents,
    searchAgents,
    totalActiveAgents: activeAgents.length,
    totalAgents: allAgents.length,
    loading,
    sources: {
      local: localAgents.length,
      api: apiAgents.length,
      query: queryAgents.length
    }
  };
};