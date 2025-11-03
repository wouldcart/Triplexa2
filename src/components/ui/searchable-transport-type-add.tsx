import * as React from "react";
import { Plus, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { TransportType } from "@/pages/inventory/transport/types/transportTypes";

interface SearchableTransportTypeAddProps {
  transportTypes: TransportType[];
  onSelectType: (typeId: string) => void;
  buttonText?: string;
  disabled?: boolean;
}

export function SearchableTransportTypeAdd({
  transportTypes,
  onSelectType,
  buttonText = "Add Transport Type",
  disabled = false,
}: SearchableTransportTypeAddProps) {
  const [open, setOpen] = React.useState(false);

  const activeTypes = React.useMemo(() => {
    // Only show active types; if 'active' is missing, include the type
    return transportTypes.filter((t) => (t as any).active !== false);
  }, [transportTypes]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Plus className="h-4 w-4 mr-1" />
          {buttonText}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="end">
        <Command>
          <CommandInput placeholder="Search transport types..." />
          <CommandList>
            <CommandEmpty>No transport type found.</CommandEmpty>
            <CommandGroup>
              {activeTypes.map((t) => (
                <CommandItem
                  key={t.id}
                  value={`${t.name} ${t.category ?? ""}`}
                  onSelect={() => {
                    onSelectType(t.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{t.name || "Unknown"}</span>
                    {t.category && (
                      <span className="text-xs text-muted-foreground">{t.category}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}