
import { useMemo } from 'react';
import { useLocalAgentData } from '@/hooks/useLocalAgentData';
import { Agent } from '@/types/agent';

export const useAgentData = () => {
  const { agents } = useLocalAgentData();

  // Get active agents from the combined agent data (default + local)
  const activeAgents = useMemo(() => {
    return agents.filter((agent: Agent) => agent.status === 'active');
  }, [agents]);

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
    return agents.find((agent: Agent) => agent.id === agentId);
  };

  // Get high-performing agents (based on conversion rate)
  const getHighPerformingAgents = () => {
    return activeAgents.filter((agent: Agent) => 
      agent.stats.conversionRate > 15
    ).sort((a, b) => b.stats.conversionRate - a.stats.conversionRate);
  };

  return {
    activeAgents,
    getAgentsByCountry,
    getAgentsByCity,
    getAgentById,
    getHighPerformingAgents,
    totalActiveAgents: activeAgents.length,
    totalAgents: agents.length
  };
};
