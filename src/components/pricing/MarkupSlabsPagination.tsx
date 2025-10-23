import React, { useState, useMemo } from 'react';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious, 
  PaginationEllipsis 
} from '@/components/ui/pagination';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Search, Filter, Globe, Edit, Trash2, X } from 'lucide-react';
import { MarkupSlab } from '@/types/pricing';
import { CurrencyService } from '@/services/currencyService';
import { EnhancedPricingService } from '@/services/enhancedPricingService';

interface MarkupSlabsPaginationProps {
  slabs: MarkupSlab[];
  onEdit: (slab: MarkupSlab) => void;
  onDelete: (slabId: string) => void;
  onToggleStatus: (slabId: string) => void;
  isLoading: boolean;
  editingSlab: MarkupSlab | null;
  isCreating: boolean;
}

interface FilterState {
  search: string;
  currency: string;
  country: string;
  status: 'all' | 'active' | 'inactive';
  markupType: 'all' | 'percentage' | 'fixed';
}

const MarkupSlabsPagination: React.FC<MarkupSlabsPaginationProps> = ({
  slabs,
  onEdit,
  onDelete,
  onToggleStatus,
  isLoading,
  editingSlab,
  isCreating
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    currency: 'all',
    country: 'all',
    status: 'all',
    markupType: 'all'
  });

  const availableCountries = EnhancedPricingService.getAvailableCountries();
  const availableCurrencies = Array.from(new Set(slabs.map(s => s.currency)));

  // Filter and search slabs
  const filteredSlabs = useMemo(() => {
    return slabs.filter(slab => {
      const matchesSearch = filters.search === '' || 
        slab.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        slab.id.toLowerCase().includes(filters.search.toLowerCase());

      const matchesCurrency = filters.currency === 'all' || slab.currency === filters.currency;
      
      const matchesCountry = filters.country === 'all' || 
        availableCountries.find(c => c.currency === slab.currency)?.code === filters.country;

      const matchesStatus = filters.status === 'all' || 
        (filters.status === 'active' && slab.isActive) ||
        (filters.status === 'inactive' && !slab.isActive);

      const matchesMarkupType = filters.markupType === 'all' || slab.markupType === filters.markupType;

      return matchesSearch && matchesCurrency && matchesCountry && matchesStatus && matchesMarkupType;
    });
  }, [slabs, filters, availableCountries]);

  // Pagination logic
  const totalPages = Math.ceil(filteredSlabs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredSlabs.length);
  const paginatedSlabs = filteredSlabs.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, currentPage + 2);
      
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push('ellipsis-start');
        }
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('ellipsis-end');
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      currency: 'all',
      country: 'all',
      status: 'all',
      markupType: 'all'
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== 'all');

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-muted/50 p-4 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filters</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                {Object.values(filters).filter(v => v !== '' && v !== 'all').length} active
              </Badge>
            )}
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search slabs..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-9"
            />
          </div>

          {/* Country Filter */}
          <Select 
            value={filters.country} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, country: value }))}
          >
            <SelectTrigger>
              <div className="flex items-center">
                <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All Countries" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {availableCountries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name} ({country.currency})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Currency Filter */}
          <Select 
            value={filters.currency} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, currency: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Currencies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Currencies</SelectItem>
              {availableCurrencies.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select 
            value={filters.status} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as FilterState['status'] }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>

          {/* Markup Type Filter */}
          <Select 
            value={filters.markupType} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, markupType: value as FilterState['markupType'] }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed">Fixed Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Summary and Items Per Page */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {filteredSlabs.length === 0 ? 0 : startIndex + 1}-{endIndex} of {filteredSlabs.length} slabs
          {hasActiveFilters && ` (filtered from ${slabs.length} total)`}
        </div>
        
        <div className="flex items-center gap-2">
          <Label htmlFor="itemsPerPage" className="text-sm">Show</Label>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
            <SelectTrigger className="w-[70px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>
      </div>

      {/* Slabs List */}
      <div className="space-y-3">
        {paginatedSlabs.map(slab => (
          <div key={slab.id} className="p-4 border rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium">{slab.name}</h4>
                  <Badge variant={slab.isActive ? "default" : "secondary"}>
                    {slab.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">{slab.currency}</Badge>
                  <Badge variant="outline" className="capitalize">
                    {slab.markupType}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Range:</span>
                    <div className="font-medium">
                      {CurrencyService.formatCurrency(slab.minAmount, slab.currency)} - {CurrencyService.formatCurrency(slab.maxAmount, slab.currency)}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Markup:</span>
                    <div className="font-medium">
                      {slab.markupType === 'percentage' 
                        ? `${slab.markupValue}%` 
                        : `${CurrencyService.formatCurrency(slab.markupValue, slab.currency)}`
                      }
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Updated:</span>
                    <div className="font-medium text-xs">
                      {new Date(slab.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={slab.isActive}
                  onCheckedChange={() => onToggleStatus(slab.id)}
                  disabled={isLoading}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(slab)}
                  disabled={isCreating || editingSlab !== null || isLoading}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(slab.id)}
                  className="text-red-500 hover:text-red-700"
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredSlabs.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {hasActiveFilters ? (
            <div>
              <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No slabs match your filters</p>
              <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
                Clear Filters
              </Button>
            </div>
          ) : (
            <div>
              <Filter className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No markup slabs configured</p>
              <p className="text-sm">Create your first slab to get started</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {generatePageNumbers().map((page, index) => (
                <PaginationItem key={index}>
                  {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page as number);
                      }}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                  }}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default MarkupSlabsPagination;