import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';
import { Query } from '@/types/query';
import { useProposalPersistence } from '@/hooks/useProposalPersistence';

interface CitySelectionPanelProps {
  query: Query;
}

const CitySelectionPanel: React.FC<CitySelectionPanelProps> = ({ query }) => {
  const { data, updateCitySelection } = useProposalPersistence(query.id, 'daywise');

  const cityOptions = useMemo(() => {
    const cities = Array.isArray(query?.destination?.cities) ? query.destination.cities : [];
    // Remove duplicates and empty strings
    return Array.from(new Set(cities.filter(Boolean)));
  }, [query]);

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <MapPin className="h-4 w-4" />
          City Selection (Optional)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="city-select">Preferred City</Label>
            <Select
              value={data.citySelection || ''}
              onValueChange={(val) => updateCitySelection(val || null)}
            >
              <SelectTrigger id="city-select" className="w-full">
                <SelectValue placeholder="Select a city" />
              </SelectTrigger>
              <SelectContent>
                {cityOptions.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
                {cityOptions.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No cities available</div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => updateCitySelection(null)}
            >
              Clear
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CitySelectionPanel;