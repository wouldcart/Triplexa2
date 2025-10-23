import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showSelectedBadges?: boolean;
}

export function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select options...",
  className,
  disabled = false,
  showSelectedBadges = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const selected = React.useMemo(() => {
    const set = new Set(value);
    return options.filter((o) => set.has(o.value));
  }, [options, value]);

  const toggle = (val: string) => {
    const set = new Set(value);
    if (set.has(val)) {
      set.delete(val);
    } else {
      set.add(val);
    }
    onValueChange(Array.from(set));
  };

  const clearAll = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onValueChange([]);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selected.length > 0 ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-wrap truncate">
                  {selected.slice(0, 3).map((opt) => (
                    <Badge key={opt.value} variant="secondary" className="max-w-[140px] truncate">
                      {opt.label}
                    </Badge>
                  ))}
                  {selected.length > 3 && (
                    <Badge variant="outline">+{selected.length - 3}</Badge>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-8 px-2"
                  onClick={clearAll}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" side="bottom">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => {
                  const isSelected = value.includes(opt.value);
                  return (
                    <CommandItem
                      key={opt.value}
                      value={`${opt.value} ${opt.label}`}
                      onSelect={() => toggle(opt.value)}
                      className="cursor-pointer"
                    >
                      <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                      {opt.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {showSelectedBadges && selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((opt) => (
            <Badge key={opt.value} variant="secondary" className="cursor-pointer" onClick={() => toggle(opt.value)}>
              {opt.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}