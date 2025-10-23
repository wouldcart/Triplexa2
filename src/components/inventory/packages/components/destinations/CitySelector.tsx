
import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { City } from '../../types/packageTypes';

interface CitySelectorProps {
  selectedCountry: string | null;
  citiesByCountry: Record<string, City[]>;
  selectedCities: City[];
  onCityToggle: (id: string, checked: boolean) => void;
  onAddDestination: () => void;
}

const CitySelector: React.FC<CitySelectorProps> = ({
  selectedCountry,
  citiesByCountry,
  selectedCities,
  onCityToggle,
  onAddDestination
}) => {
  return (
    <div>
      <Label htmlFor="cities">Select Cities (optional)</Label>
      <div className="flex space-x-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              {selectedCities.length > 0 
                ? `${selectedCities.length} cities selected`
                : "Select cities"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="start" side="bottom">
            <Command>
              <CommandInput placeholder="Search cities..." />
              <CommandList>
                <CommandEmpty>No cities found.</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-y-auto">
                  {selectedCountry && citiesByCountry[selectedCountry] && citiesByCountry[selectedCountry].length > 0 ? 
                    citiesByCountry[selectedCountry].map(city => (
                      <CommandItem 
                        key={city.id}
                        onSelect={() => {
                          const isSelected = selectedCities.some(c => c.id === city.id);
                          onCityToggle(city.id, !isSelected);
                        }}
                        value={city.id}
                      >
                        <div className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          selectedCities.some(c => c.id === city.id) 
                            ? "bg-primary text-primary-foreground" 
                            : "opacity-50 [&_svg]:invisible"
                        )}>
                          <Check className={cn("h-4 w-4")} />
                        </div>
                        {city.name}
                      </CommandItem>
                    )) : (
                      <CommandItem value="no-cities-available">
                        {selectedCountry ? "No cities available" : "Select a country first"}
                      </CommandItem>
                    )
                  }
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        <Button type="button" size="icon" onClick={onAddDestination} disabled={!selectedCountry}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CitySelector;
