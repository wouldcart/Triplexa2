import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Search, 
  Filter, 
  X, 
  Calendar,
  DollarSign,
  User,
  MapPin,
  Tag,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  count?: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'checkbox' | 'range' | 'date';
  options?: FilterOption[];
  min?: number;
  max?: number;
}

export interface SearchFilterProps {
  searchPlaceholder?: string;
  filterGroups?: FilterGroup[];
  onSearch?: (query: string) => void;
  onFilter?: (filters: Record<string, any>) => void;
  onClear?: () => void;
  activeFilters?: Record<string, any>;
  resultCount?: number;
  showQuickFilters?: boolean;
  quickFilters?: FilterOption[];
}

export const AdvancedSearchFilter: React.FC<SearchFilterProps> = ({
  searchPlaceholder = "Search...",
  filterGroups = [],
  onSearch,
  onFilter,
  onClear,
  activeFilters = {},
  resultCount,
  showQuickFilters = true,
  quickFilters = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>(activeFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const isMobile = useIsMobile();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Call onSearch when debounced query changes
  useEffect(() => {
    onSearch?.(debouncedSearchQuery);
  }, [debouncedSearchQuery, onSearch]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleFilterChange = (groupId: string, value: any) => {
    const newFilters = { ...filters, [groupId]: value };
    setFilters(newFilters);
    onFilter?.(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
    onClear?.();
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== null && value !== '' && 
      (Array.isArray(value) ? value.length > 0 : true)
    ).length;
  };

  const renderFilterGroup = (group: FilterGroup) => {
    const value = filters[group.id];

    switch (group.type) {
      case 'select':
        return (
          <div key={group.id} className="space-y-2">
            <Label className="text-sm font-medium">{group.label}</Label>
            <Select value={value || ''} onValueChange={(val) => handleFilterChange(group.id, val)}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${group.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {group.options?.map((option) => (
                  <SelectItem key={option.id} value={option.value}>
                    <div className="flex justify-between items-center w-full">
                      <span>{option.label}</span>
                      {option.count && (
                        <Badge variant="secondary" className="ml-2">
                          {option.count}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'multiselect':
        return (
          <div key={group.id} className="space-y-2">
            <Label className="text-sm font-medium">{group.label}</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {group.options?.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.id}
                    checked={Array.isArray(value) && value.includes(option.value)}
                    onCheckedChange={(checked) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      const newValues = checked
                        ? [...currentValues, option.value]
                        : currentValues.filter(v => v !== option.value);
                      handleFilterChange(group.id, newValues);
                    }}
                  />
                  <Label htmlFor={option.id} className="text-sm flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <span>{option.label}</span>
                      {option.count && (
                        <Badge variant="outline" className="ml-2">
                          {option.count}
                        </Badge>
                      )}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'range':
        return (
          <div key={group.id} className="space-y-2">
            <Label className="text-sm font-medium">{group.label}</Label>
            <div className="flex space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={value?.min || ''}
                onChange={(e) => handleFilterChange(group.id, { ...value, min: e.target.value })}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Max"
                value={value?.max || ''}
                onChange={(e) => handleFilterChange(group.id, { ...value, max: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
        );

      case 'date':
        return (
          <div key={group.id} className="space-y-2">
            <Label className="text-sm font-medium">{group.label}</Label>
            <DateRangePicker
              value={value}
              onChange={(dateRange) => handleFilterChange(group.id, dateRange)}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Filters</h3>
        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </div>
      
      {filterGroups.map(renderFilterGroup)}
      
      <div className="flex gap-2 pt-4">
        <Button onClick={() => setIsFilterOpen(false)} className="flex-1">
          Apply Filters
        </Button>
        {isMobile && (
          <Button variant="outline" onClick={() => setIsFilterOpen(false)}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => handleSearchChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Filter Button */}
        {isMobile ? (
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4" />
                {getActiveFilterCount() > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Filter Results</SheetTitle>
                <SheetDescription>
                  Refine your search with advanced filters
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 overflow-y-auto">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {getActiveFilterCount() > 0 && (
                  <Badge className="ml-2">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-96">
              <SheetHeader>
                <SheetTitle>Advanced Filters</SheetTitle>
                <SheetDescription>
                  Refine your search results
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Quick Filters */}
      {showQuickFilters && quickFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <Button
              key={filter.id}
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => handleFilterChange('quick', filter.value)}
            >
              {filter.label}
              {filter.count && (
                <Badge variant="secondary" className="ml-2">
                  {filter.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      )}

      {/* Active Filters */}
      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {Object.entries(filters).map(([key, value]) => {
            if (!value || (Array.isArray(value) && value.length === 0)) return null;
            
            const group = filterGroups.find(g => g.id === key);
            const displayValue = Array.isArray(value) ? value.join(', ') : value;
            
            return (
              <Badge key={key} variant="secondary" className="gap-1">
                {group?.label}: {displayValue}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleFilterChange(key, undefined)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            Clear all
          </Button>
        </div>
      )}

      {/* Results Count */}
      {resultCount !== undefined && (
        <div className="text-sm text-muted-foreground">
          {resultCount} result{resultCount !== 1 ? 's' : ''} found
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchFilter;