
import { useState, useEffect, useMemo } from 'react';
import { Agent } from '@/types/agent';
import { AgentStorageService } from '@/services/agentStorageService';
import { agents as defaultAgents } from '@/data/agentData';

export const useLocalAgentData = () => {
  const [localAgents, setLocalAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAgents = () => {
      try {
        const storedAgents = AgentStorageService.getAgents();
        setLocalAgents(storedAgents);
      } catch (error) {
        console.error('Error loading agents:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAgents();
  }, []);

  // Combine default agents with locally stored agents
  const allAgents = useMemo(() => {
    return [...defaultAgents, ...localAgents];
  }, [localAgents]);

  const saveAgent = (agentData: Omit<Agent, 'id'>) => {
    try {
      const savedAgent = AgentStorageService.saveAgent(agentData);
      setLocalAgents(prev => [...prev, savedAgent]);
      return savedAgent;
    } catch (error) {
      console.error('Error saving agent:', error);
      throw error;
    }
  };

  const updateAgent = (id: number, updates: Partial<Agent>) => {
    try {
      const updatedAgent = AgentStorageService.updateAgent(id, updates);
      if (updatedAgent) {
        setLocalAgents(prev => 
          prev.map(agent => agent.id === id ? updatedAgent : agent)
        );
      }
      return updatedAgent;
    } catch (error) {
      console.error('Error updating agent:', error);
      return null;
    }
  };

  const deleteAgent = (id: number) => {
    try {
      const success = AgentStorageService.deleteAgent(id);
      if (success) {
        setLocalAgents(prev => prev.filter(agent => agent.id !== id));
      }
      return success;
    } catch (error) {
      console.error('Error deleting agent:', error);
      return false;
    }
  };

  return {
    agents: allAgents,
    localAgents,
    saveAgent,
    updateAgent,
    deleteAgent,
    loading
  };
};
