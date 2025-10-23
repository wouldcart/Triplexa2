import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, Filter, X, ChevronDown, ArrowUpDown } from 'lucide-react';
import { QueryFilters } from '../hooks/useQueryFilters';
import { Query } from '@/types/query';

interface QueryFiltersProps {
  filters: QueryFilters;
  filterOptions: {
    agents: string[];
    countries: string[];
    packageTypes: string[];
    hotelCategories: string[];
  };
  activeFiltersCount: number;
  queries?: Query[];
  sortOrder?: 'newest' | 'oldest';
  onUpdateFilter: (key: keyof QueryFilters, value: any) => void;
  onClearAllFilters: () => void;
  onSortOrderChange?: (order: 'newest' | 'oldest') => void;
}

const QueryFiltersComponent: React.FC<QueryFiltersProps> = ({
  filters,
  filterOptions,
  activeFiltersCount,
  queries = [],
  sortOrder = 'newest',
  onUpdateFilter,
  onClearAllFilters,
  onSortOrderChange
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);

  // Get unique countries from enquiry list - safely handle undefined queries
  const countriesFromEnquiries = React.useMemo(() => {
    if (!queries || queries.length === 0) return [];
    const uniqueCountries = [...new Set(queries.map(query => query.destination.country))];
    return uniqueCountries.sort();
  }, [queries]);

  const handleMultiSelectToggle = (key: keyof QueryFilters, value: string) => {
    const currentValues = filters[key] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    onUpdateFilter(key, newValues);
  };

  const removeFilter = (key: keyof QueryFilters, value?: string) => {
    if (value && Array.isArray(filters[key])) {
      const currentValues = filters[key] as string[];
      onUpdateFilter(key, currentValues.filter(v => v !== value));
    } else {
      // Reset single value filters
      if (key === 'searchTerm') onUpdateFilter(key, '');
      else if (key === 'statusFilter' || key === 'dateFilter') onUpdateFilter(key, 'all');
      else if (key === 'paxRange') onUpdateFilter(key, { min: 0, max: 20 });
      else if (key === 'travelDateRange') onUpdateFilter(key, { from: '', to: '' });
    }
  };

  const handleSortOrderToggle = () => {
    if (!onSortOrderChange) return;
    console.log('Current sort order:', sortOrder);
    const newOrder = sortOrder === 'newest' ? 'oldest' : 'newest';
    console.log('Toggling to:', newOrder);
    onSortOrderChange(newOrder);
  };

  // Check if sort functionality is working
  const isSortFunctionWorking = typeof onSortOrderChange === 'function';

  return (
    <div className="space-y-4">
      {/* Basic Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search enquiries..."
            value={filters.searchTerm}
            onChange={(e) => onUpdateFilter('searchTerm', e.target.value)}
            className="pl-8 bg-background border-input text-foreground"
          />
        </div>
        
        <Select value={filters.statusFilter} onValueChange={(value) => onUpdateFilter('statusFilter', value)}>
          <SelectTrigger className="w-[180px] bg-background border-input">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="proposal-sent">Proposal Sent</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.dateFilter} onValueChange={(value) => onUpdateFilter('dateFilter', value)}>
          <SelectTrigger className="w-[150px] bg-background border-input">
            <SelectValue placeholder="Date filter" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Order Button - Only show if function is working */}
        {isSortFunctionWorking && (
          <Button 
            variant="outline" 
            onClick={handleSortOrderToggle}
            className="gap-2 min-w-[140px] hover:bg-accent hover:text-accent-foreground transition-colors"
            title={`Currently showing ${sortOrder === 'newest' ? 'newest' : 'oldest'} first. Click to toggle.`}
          >
            <ArrowUpDown className="h-4 w-4" />
            <span className="font-medium">
              {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
            </span>
          </Button>
        )}

        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Advanced Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">{activeFiltersCount}</Badge>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
        </Collapsible>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" onClick={onClearAllFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.searchTerm && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.searchTerm}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('searchTerm')} />
            </Badge>
          )}
          {filters.statusFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.statusFilter}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('statusFilter')} />
            </Badge>
          )}
          {filters.agentFilter.map(agent => (
            <Badge key={agent} variant="secondary" className="gap-1">
              Agent: {agent}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('agentFilter', agent)} />
            </Badge>
          ))}
          {filters.countryFilter.map(country => (
            <Badge key={country} variant="secondary" className="gap-1">
              Country: {country}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('countryFilter', country)} />
            </Badge>
          ))}
        </div>
      )}

      {/* Advanced Filters */}
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <CollapsibleContent className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Advanced Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Agent Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Agents</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {filterOptions.agents.map(agent => (
                      <div key={agent} className="flex items-center space-x-2">
                        <Checkbox
                          id={`agent-${agent}`}
                          checked={filters.agentFilter.includes(agent)}
                          onCheckedChange={() => handleMultiSelectToggle('agentFilter', agent)}
                        />
                        <Label htmlFor={`agent-${agent}`} className="text-sm cursor-pointer">
                          {agent}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Country Filter - Using countries from enquiries */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Countries ({countriesFromEnquiries.length})</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {countriesFromEnquiries.map(country => (
                      <div key={country} className="flex items-center space-x-2">
                        <Checkbox
                          id={`country-${country}`}
                          checked={filters.countryFilter.includes(country)}
                          onCheckedChange={() => handleMultiSelectToggle('countryFilter', country)}
                        />
                        <Label htmlFor={`country-${country}`} className="text-sm cursor-pointer">
                          {country}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Package Type Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Package Types</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {filterOptions.packageTypes.map(packageType => (
                      <div key={packageType} className="flex items-center space-x-2">
                        <Checkbox
                          id={`package-${packageType}`}
                          checked={filters.packageTypeFilter.includes(packageType)}
                          onCheckedChange={() => handleMultiSelectToggle('packageTypeFilter', packageType)}
                        />
                        <Label htmlFor={`package-${packageType}`} className="text-sm cursor-pointer capitalize">
                          {packageType.replace('-', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PAX Range Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">PAX Range</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.paxRange.min}
                    onChange={(e) => onUpdateFilter('paxRange', { ...filters.paxRange, min: Number(e.target.value) })}
                    className="w-20"
                  />
                  <span>to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.paxRange.max}
                    onChange={(e) => onUpdateFilter('paxRange', { ...filters.paxRange, max: Number(e.target.value) })}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">passengers</span>
                </div>
              </div>

              {/* Travel Date Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Travel Date Range</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="date"
                    value={filters.travelDateRange.from}
                    onChange={(e) => onUpdateFilter('travelDateRange', { ...filters.travelDateRange, from: e.target.value })}
                  />
                  <span>to</span>
                  <Input
                    type="date"
                    value={filters.travelDateRange.to}
                    onChange={(e) => onUpdateFilter('travelDateRange', { ...filters.travelDateRange, to: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default QueryFiltersComponent;
