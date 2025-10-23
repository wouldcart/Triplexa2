
import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Define the activity type interface
interface ActivityType {
  id: number;
  name: string;
  slug: string;
}

// Sample data for activity types
const activityTypes = [
  { id: 1, name: "City Tour", slug: "city-tour" },
  { id: 2, name: "Adventure", slug: "adventure" },
  { id: 3, name: "Cultural", slug: "cultural" },
  { id: 4, name: "Historical", slug: "historical" },
  { id: 5, name: "Food & Drink", slug: "food-drink" },
  { id: 6, name: "Religious", slug: "religious" },
  { id: 7, name: "Nature", slug: "nature" },
  { id: 8, name: "Shopping", slug: "shopping" },
  { id: 9, name: "Beach", slug: "beach" },
  { id: 10, name: "Mountains", slug: "mountains" },
  { id: 11, name: "Wellness", slug: "wellness" },
  { id: 12, name: "Entertainment", slug: "entertainment" },
];

interface ActivityTypeSelectorProps {
  // Making these props optional to support both interfaces
  selectedTypes?: number[];
  onChange?: (selectedIds: number[]) => void;
  className?: string;
  // Adding props for alternative interface
  activityType?: string;
  options?: any;
  onSelect?: (options: any) => void;
  selectedOptions?: any;
}

export default function ActivityTypeSelector({ 
  selectedTypes = [], 
  onChange = () => {}, // Default no-op function
  className,
  // Adding optional props to avoid errors in other files
  activityType,
  options,
  onSelect,
  selectedOptions
}: ActivityTypeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<ActivityType[]>([]);

  // Initialize selected items
  useEffect(() => {
    const selectedActivityTypes = activityTypes.filter(type => 
      selectedTypes.includes(type.id)
    );
    setSelectedItems(selectedActivityTypes);
  }, [selectedTypes]);

  // Handle selection change
  const handleSelect = (id: number) => {
    const isSelected = selectedTypes.includes(id);
    let newSelected: number[];
    
    if (isSelected) {
      newSelected = selectedTypes.filter(typeId => typeId !== id);
    } else {
      newSelected = [...selectedTypes, id];
    }
    
    onChange(newSelected);
    
    // Support for legacy interface
    if (onSelect && options) {
      onSelect({
        activityType,
        selected: newSelected
      });
    }
  };

  // Remove a selected item
  const removeItem = (id: number) => {
    const newSelected = selectedTypes.filter(typeId => typeId !== id);
    onChange(newSelected);
    
    // Support for legacy interface
    if (onSelect && options) {
      onSelect({
        activityType,
        selected: newSelected
      });
    }
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedItems.length > 0
              ? `${selectedItems.length} selected`
              : "Select activity types..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search activity types..." />
            <CommandEmpty>No activity types found.</CommandEmpty>
            <CommandGroup heading="Activity Types" className="max-h-64 overflow-y-auto">
              {activityTypes.map((type) => (
                <CommandItem
                  key={type.id}
                  value={type.slug}
                  onSelect={() => handleSelect(type.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedTypes.includes(type.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {type.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Display selected items */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedItems.map((item) => (
            <Badge
              key={item.id}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1"
            >
              {item.name}
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="ml-1 rounded-full outline-none focus:outline-none"
              >
                <span className="sr-only">Remove {item.name}</span>
                <span aria-hidden="true">&times;</span>
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
