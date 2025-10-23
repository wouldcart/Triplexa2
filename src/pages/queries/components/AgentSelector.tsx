
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronDown, User, MapPin, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useEnhancedAgentData } from "@/hooks/useEnhancedAgentData";
import { Agent } from "@/types/agent";

interface AgentSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  countryFilter?: string;
  cityFilter?: string;
  queryId?: string;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  value,
  onValueChange,
  placeholder = "Search and select agent...",
  countryFilter,
  cityFilter,
  queryId
}) => {
  const [open, setOpen] = useState(false);
  const { activeAgents, getAgentsByCountry, getAgentsByCity, getHighPerformingAgents, loading, sources } = useEnhancedAgentData(queryId);

  // Filter agents based on location filters
  const filteredAgents = React.useMemo(() => {
    let agents = activeAgents;

    if (countryFilter) {
      const countryAgents = getAgentsByCountry(countryFilter);
      if (countryAgents.length > 0) {
        agents = countryAgents;
      }
    }

    if (cityFilter) {
      const cityAgents = getAgentsByCity(cityFilter);
      if (cityAgents.length > 0) {
        agents = cityAgents;
      }
    }

    return agents;
  }, [activeAgents, countryFilter, cityFilter, getAgentsByCountry, getAgentsByCity]);

  // Get high-performing agents for suggestions
  const highPerformers = getHighPerformingAgents().slice(0, 3);

  const selectedAgent = filteredAgents.find(agent => agent.id.toString() === value);

  const renderAgentItem = (agent: Agent) => (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="font-medium">{agent.name}</span>
        {agent.stats.conversionRate > 20 && (
          <Badge variant="secondary" className="text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            Top Performer
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{agent.email}</span>
        <span>•</span>
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span>{agent.city}, {agent.country}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Conversion: {agent.stats.conversionRate}%</span>
        <span>•</span>
        <span>Bookings: {agent.stats.totalBookings}</span>
      </div>
    </div>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {selectedAgent ? (
              <div className="flex items-center gap-2">
                <span>{selectedAgent.name}</span>
                <Badge variant="outline" className="text-xs">
                  {selectedAgent.city}
                </Badge>
              </div>
            ) : (
              placeholder
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search agents..." />
          <CommandList>
            <CommandEmpty>
              {loading ? "Loading agents..." : "No agent found."}
              {!loading && (
                <div className="text-xs text-muted-foreground mt-2">
                  Sources: Local ({sources.local}) • API ({sources.api}) • Query ({sources.query})
                </div>
              )}
            </CommandEmpty>
            
            {highPerformers.length > 0 && (
              <CommandGroup heading="Recommended">
                {highPerformers.map((agent) => (
                  <CommandItem
                    key={agent.id}
                    value={agent.name}
                    onSelect={() => {
                      onValueChange(agent.id.toString());
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === agent.id.toString()
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {renderAgentItem(agent)}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandGroup heading="All Agents">
              {filteredAgents.map((agent) => (
                <CommandItem
                  key={agent.id}
                  value={agent.name}
                  onSelect={() => {
                    onValueChange(agent.id.toString());
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === agent.id.toString()
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {renderAgentItem(agent)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
