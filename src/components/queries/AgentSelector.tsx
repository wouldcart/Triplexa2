
import React, { useMemo } from 'react';
import { AgentSelector as SearchableAgentSelector } from '@/pages/queries/components/AgentSelector';
import { useSupabaseAgentsList } from '@/hooks/useSupabaseAgentsList';
import { toNumericAgentId } from '@/utils/supabaseAgentIds';

interface AgentSelectorProps {
  selectedAgentId: string;
  onAgentChange: (agentId: string, agentName: string) => void;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  selectedAgentId,
  onAgentChange
}) => {
  const { agents } = useSupabaseAgentsList();

  const selectedAgentName = useMemo(() => {
    const numeric = Number.parseInt(selectedAgentId || '');
    const match = agents.find(a => toNumericAgentId(a.id) === numeric);
    return match?.name || '';
  }, [agents, selectedAgentId]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Agent *</label>
      <SearchableAgentSelector
        value={selectedAgentId}
        onValueChange={(agentId) => {
          const numeric = Number.parseInt(agentId || '');
          const match = agents.find(a => toNumericAgentId(a.id) === numeric);
          onAgentChange(agentId, match?.name || '');
        }}
        placeholder="Search and select an agent..."
      />
    </div>
  );
};
