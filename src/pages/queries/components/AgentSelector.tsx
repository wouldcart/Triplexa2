
import React, { useMemo, useState } from "react";
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
import { useSupabaseAgentsList } from "@/hooks/useSupabaseAgentsList";
import { toNumericAgentId } from "@/utils/supabaseAgentIds";

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
  const { agents, loading, error } = useSupabaseAgentsList();

  // Filter agents based on location filters (Supabase-backed)
  const filteredAgents = useMemo(() => {
    let list = agents;
    if (countryFilter) {
      const cf = countryFilter.toLowerCase();
      const byCountry = list.filter(a => (a.country || '').toLowerCase() === cf);
      if (byCountry.length > 0) list = byCountry;
    }
    if (cityFilter) {
      const ct = cityFilter.toLowerCase();
      const byCity = list.filter(a => (a.city || '').toLowerCase() === ct);
      if (byCity.length > 0) list = byCity;
    }
    return list;
  }, [agents, countryFilter, cityFilter]);

  // Supabase stats are not yet populated; provide simple top suggestions
  const highPerformers = useMemo(() => filteredAgents.slice(0, 3), [filteredAgents]);

  const selectedAgent = useMemo(() => {
    const numeric = Number.parseInt(value || '');
    return filteredAgents.find(a => toNumericAgentId(a.id) === numeric);
  }, [filteredAgents, value]);

  const renderAgentItem = (agent: { id: string; name: string; email?: string; city?: string; country?: string; agencyName?: string; stats?: any }) => (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="font-medium">{agent.name}</span>
        {agent.agencyName && (
          <Badge variant="outline" className="text-xs ml-2">
            {agent.agencyName}
          </Badge>
        )}
        {agent?.stats?.conversionRate > 20 && (
          <Badge variant="secondary" className="text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            Top Performer
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {agent.email && <span>{agent.email}</span>}
        {agent.email && <span>•</span>}
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span>{agent.city || 'Unknown'}, {agent.country || 'Unknown'}</span>
        </div>
      </div>
      {agent?.stats && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Conversion: {agent.stats.conversionRate}%</span>
          <span>•</span>
          <span>Bookings: {agent.stats.totalBookings}</span>
        </div>
      )}
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
              {loading ? "Loading agents..." : error ? "Failed to load agents." : "No agent found."}
            </CommandEmpty>
            
            {highPerformers.length > 0 && (
              <CommandGroup heading="Recommended">
                {highPerformers.map((agent) => (
                  <CommandItem
                    key={agent.id}
                    value={agent.name}
                    onSelect={() => {
                      const numId = toNumericAgentId(agent.id);
                      onValueChange(numId.toString());
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        Number.parseInt(value || '') === toNumericAgentId(agent.id)
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
                    const numId = toNumericAgentId(agent.id);
                    onValueChange(numId.toString());
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      Number.parseInt(value || '') === toNumericAgentId(agent.id)
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
