import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
import type { LocationCode } from "@/pages/inventory/transport/types/transportTypes";

interface SearchableLocationSelectProps {
  locations: LocationCode[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  emptyText?: string;
}

function getLocationLabel(loc: LocationCode) {
  const code = (loc?.code || "").trim();
  const name = loc?.fullName || loc?.name || code || "Unknown";
  const category = loc?.category || "N/A";
  return `${code} - ${name} (${category})`;
}

export function SearchableLocationSelect({
  locations,
  value,
  onValueChange,
  placeholder = "Select location...",
  className,
  disabled = false,
  emptyText = "No location found.",
}: SearchableLocationSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selected = locations.find((l) => l.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selected ? (
            <span className="truncate text-left w-full">{getLocationLabel(selected)}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search locations..." />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {locations.map((loc) => (
                <CommandItem
                  key={loc.id}
                  value={`${loc.code} ${loc.fullName ?? ""} ${loc.category ?? ""} ${loc.city ?? ""}`}
                  onSelect={() => {
                    onValueChange?.(loc.code);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === loc.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-2 truncate">
                    <span className="truncate">{getLocationLabel(loc)}</span>
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