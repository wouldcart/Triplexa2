
import React from 'react';
import { AgentSelector as SearchableAgentSelector } from '@/pages/queries/components/AgentSelector';

interface AgentSelectorProps {
  selectedAgentId: string;
  onAgentChange: (agentId: string, agentName: string) => void;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  selectedAgentId,
  onAgentChange
}) => {
  const handleAgentSelect = (agentId: string) => {
    // Get agent name from the useAgentData hook via the SearchableAgentSelector
    onAgentChange(agentId, ''); // The SearchableAgentSelector will handle getting the agent name
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Agent *</label>
      <SearchableAgentSelector
        value={selectedAgentId}
        onValueChange={(agentId) => {
          // We need to get the agent name, but the SearchableAgentSelector handles this internally
          onAgentChange(agentId, '');
        }}
        placeholder="Search and select an agent..."
      />
    </div>
  );
};
