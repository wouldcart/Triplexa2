
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  X, 
  Calendar, 
  DollarSign, 
  Users, 
  MapPin,
  Bookmark,
  RefreshCw
} from 'lucide-react';

interface AdvancedFiltersProps {
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  onFiltersChange,
  onClearFilters,
  activeFiltersCount
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: { from: '', to: '' },
    budgetRange: { min: '', max: '' },
    paxRange: { min: '', max: '' },
    destination: '',
    packageType: '',
    assignedTo: '',
    priority: ''
  });

  const [savedFilters] = useState([
    { name: 'High Priority Urgent', count: 12 },
    { name: 'New This Week', count: 28 },
    { name: 'Luxury Packages', count: 8 }
  ]);

  const updateFilters = (key: string, value: any) => {
    // Convert "all" values to empty string for consistent handling
    const processedValue = value === "all" ? "" : value;
    const newFilters = { ...filters, [key]: processedValue };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const destinations = [
    'Thailand', 'UAE', 'Japan', 'Maldives', 'Turkey', 'Malaysia', 'Nepal'
  ];

  const packageTypes = [
    'luxury', 'business', 'family', 'adventure', 'cultural', 'leisure'
  ];

  const staffMembers = [
    'Sarah Sales', 'Mike Marketing', 'Operations Staff', 'John Manager'
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {activeFiltersCount} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Saved Filter Presets */}
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Quick Filters
            </label>
            <div className="flex flex-wrap gap-2">
              {savedFilters.map(preset => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {preset.name}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {preset.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Travel Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  placeholder="From"
                  value={filters.dateRange.from}
                  onChange={(e) => updateFilters('dateRange', { ...filters.dateRange, from: e.target.value })}
                />
                <Input
                  type="date"
                  placeholder="To"
                  value={filters.dateRange.to}
                  onChange={(e) => updateFilters('dateRange', { ...filters.dateRange, to: e.target.value })}
                />
              </div>
            </div>

            {/* Budget Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Budget Range (USD)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.budgetRange.min}
                  onChange={(e) => updateFilters('budgetRange', { ...filters.budgetRange, min: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.budgetRange.max}
                  onChange={(e) => updateFilters('budgetRange', { ...filters.budgetRange, max: e.target.value })}
                />
              </div>
            </div>

            {/* PAX Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Number of Passengers
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min PAX"
                  value={filters.paxRange.min}
                  onChange={(e) => updateFilters('paxRange', { ...filters.paxRange, min: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Max PAX"
                  value={filters.paxRange.max}
                  onChange={(e) => updateFilters('paxRange', { ...filters.paxRange, max: e.target.value })}
                />
              </div>
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Destination
              </label>
              <Select value={filters.destination || "all"} onValueChange={(value) => updateFilters('destination', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Destinations</SelectItem>
                  {destinations.map(dest => (
                    <SelectItem key={dest} value={dest}>{dest}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Package Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Package Type</label>
              <Select value={filters.packageType || "all"} onValueChange={(value) => updateFilters('packageType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select package type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {packageTypes.map(type => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assigned To */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Assigned To</label>
              <Select value={filters.assignedTo || "all"} onValueChange={(value) => updateFilters('assignedTo', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {staffMembers.map(staff => (
                    <SelectItem key={staff} value={staff}>{staff}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Apply/Reset Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClearFilters}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
            <Button onClick={() => onFiltersChange(filters)}>
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default AdvancedFilters;
