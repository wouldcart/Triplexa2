
import React, { useRef, useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Edit, Trash2, ChevronLeft, ChevronRight, ToggleLeft, AlertTriangle } from "lucide-react";
import { Country } from '../types/country';
import { cn } from "@/lib/utils";
import { getFlagUrl } from '../utils/flagUtils';
import { getCurrencyDisplayInfo } from '../utils/currencyUtils';

interface CountriesTableProps {
  countries: Country[];
  loading?: boolean;
  currentPage: number;
  totalPages: number;
  itemsPerPage?: number;
  totalCountries?: number;
  selectedCountries?: string[];
  onNextPage: () => void;
  onPrevPage: () => void;
  onPageSelect: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  onView: (country: Country) => void;
  onEdit: (country: Country) => void;
  onDelete: (country: Country) => void;
  onToggleStatus: (id: string) => void;
  onSelectCountry?: (id: string) => void;
  onSelectAll?: (selected: boolean) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkToggleStatus?: (ids: string[]) => void;
  onBulkEdit?: () => void;
}

const CountriesTable: React.FC<CountriesTableProps> = ({
  countries,
  loading,
  currentPage,
  totalPages,
  itemsPerPage = 5,
  totalCountries,
  selectedCountries = [],
  onNextPage,
  onPrevPage,
  onPageSelect,
  onItemsPerPageChange,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onSelectCountry,
  onSelectAll,
  onBulkDelete,
  onBulkToggleStatus,
  onBulkEdit
}) => {
  // State for confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [countryToToggle, setCountryToToggle] = useState<Country | null>(null);

  // Handle toggle status with confirmation
  const handleToggleStatusClick = (country: Country) => {
    setCountryToToggle(country);
    setShowConfirmDialog(true);
  };

  const confirmToggleStatus = () => {
    if (countryToToggle) {
      onToggleStatus(countryToToggle.id);
    }
    setShowConfirmDialog(false);
    setCountryToToggle(null);
  };

  const cancelToggleStatus = () => {
    setShowConfirmDialog(false);
    setCountryToToggle(null);
  };
  const isAllSelected = countries.length > 0 && countries.every(country => selectedCountries.includes(country.id));
  const isIndeterminate = selectedCountries.length > 0 && !isAllSelected;

  const handleSelectAll = (checked: boolean) => {
    if (onSelectAll) {
      onSelectAll(checked);
    }
  };

  const handleSelectCountry = (id: string) => {
    if (onSelectCountry) {
      onSelectCountry(id);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="w-12">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                </TableHead>
                <TableHead className="w-16">
                  <div className="h-4 bg-muted rounded w-8 animate-pulse"></div>
                </TableHead>
                <TableHead>
                  <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                </TableHead>
                <TableHead>
                  <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
                </TableHead>
                <TableHead>
                  <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                </TableHead>
                <TableHead>
                  <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                </TableHead>
                <TableHead>
                  <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
                </TableHead>
                <TableHead>
                  <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell>
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted rounded w-8 animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted rounded w-12 animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <div className="h-8 bg-muted rounded w-8 animate-pulse"></div>
                      <div className="h-8 bg-muted rounded w-8 animate-pulse"></div>
                      <div className="h-8 bg-muted rounded w-8 animate-pulse"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Operations Bar */}
      {selectedCountries.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {selectedCountries.length} {selectedCountries.length === 1 ? 'country' : 'countries'} selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkEdit?.()}
                className="border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkToggleStatus?.(selectedCountries)}
                className="border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
              >
                <ToggleLeft className="h-4 w-4 mr-2" />
                Toggle Status
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onBulkDelete?.(selectedCountries)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden md:block rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="border-border bg-muted/50">
                <TableHead className="w-12 sticky left-0 bg-background z-20 shadow-sm">
                  <Checkbox
                    checked={isAllSelected}
                    ref={(el: HTMLButtonElement | null) => {
                      if (el) (el as any).indeterminate = isIndeterminate;
                    }}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-semibold text-foreground w-16 sticky left-12 bg-background z-20 shadow-sm">#</TableHead>
                <TableHead className="font-semibold text-foreground min-w-[150px] sticky left-28 bg-background z-20 shadow-sm">Country</TableHead>
                <TableHead className="font-semibold text-foreground min-w-[80px]">Code</TableHead>
                <TableHead className="font-semibold text-foreground min-w-[100px]">Region</TableHead>
                <TableHead className="font-semibold text-foreground min-w-[120px]">Continent</TableHead>
                <TableHead className="font-semibold text-foreground min-w-[100px]">Currency</TableHead>
                <TableHead className="font-semibold text-foreground min-w-[80px]">Status</TableHead>
                <TableHead className="font-semibold text-foreground text-center min-w-[120px] sticky right-0 bg-background z-20 shadow-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {countries.map((country, index) => {
              const isSelected = selectedCountries.includes(country.id);
              const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
              return (
                <TableRow
                  key={country.id}
                  className={cn(
                    "border-border transition-all duration-200 hover:bg-muted/50",
                    isSelected && "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-950/50 dark:hover:to-indigo-950/50 border-l-4 border-l-blue-500 dark:border-l-blue-400 shadow-sm"
                  )}
                >
                  <TableCell className={cn(
                    "sticky left-0 z-10 shadow-sm",
                    isSelected 
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30" 
                      : "bg-background"
                  )}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleSelectCountry(country.id)}
                      className={isSelected ? "border-blue-500 dark:border-blue-400" : ""}
                    />
                  </TableCell>
                  <TableCell className={cn(
                    "sticky left-12 z-10 shadow-sm",
                    isSelected 
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30" 
                      : "bg-background"
                  )}>
                    <span className={cn(
                      "text-sm font-mono",
                      isSelected ? "text-blue-700 dark:text-blue-300 font-semibold" : "text-muted-foreground"
                    )}>
                      {rowNumber}
                    </span>
                  </TableCell>
                  <TableCell className={cn(
                    "sticky left-28 z-10 shadow-sm",
                    isSelected 
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30" 
                      : "bg-background"
                  )}>
                    <div className="flex items-center gap-3">
                      <img
                        src={getFlagUrl(country)}
                        alt={`${country.name} flag`}
                        className="w-6 h-4 object-cover rounded border border-border"
                        onError={(e) => {
                          // Fallback to a default flag or hide if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <span className="font-medium text-foreground">{country.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm bg-muted px-2 py-1 rounded text-foreground">
                      {country.code}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">{country.region}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">{country.continent}</span>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const currencyInfo = getCurrencyDisplayInfo(country);
                      return (
                        <div className="text-sm">
                          <span className="font-medium text-foreground">{currencyInfo.displayCurrency}</span>
                          <span className="text-muted-foreground ml-1">({currencyInfo.displaySymbol})</span>
                          {currencyInfo.hasPricingOverride && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              Pricing: {currencyInfo.pricingCurrency} ({currencyInfo.pricingSymbol})
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <Button
                        variant={country.status === 'active' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onToggleStatus(country.id)}
                        className={cn(
                          "transition-all duration-200 hover:scale-105",
                          country.status === 'active' 
                            ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800'
                        )}
                      >
                        {country.status === 'active' ? 'Active' : 'Inactive'}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="sticky right-0 bg-background z-10 shadow-sm">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(country)}
                        className="h-8 w-8 p-0 hover:bg-muted"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(country)}
                        className="h-8 w-8 p-0 hover:bg-muted"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(country)}
                        className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Enhanced Mobile Card View - Modern Design */}
      <div className="md:hidden space-y-4">
        {countries.map((country, index) => {
          const isSelected = selectedCountries.includes(country.id);
          const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
          return (
            <div
              key={country.id}
              className={cn(
                "bg-gradient-to-br from-card to-card/80 border-2 border-border/50 rounded-xl p-5 space-y-4 transition-all duration-300 shadow-sm hover:shadow-md hover:border-border",
                isSelected && "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-300 dark:border-blue-600 shadow-blue-100 dark:shadow-blue-900/20"
              )}
            >
              {/* Enhanced Header with improved layout */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleSelectCountry(country.id)}
                      className="h-5 w-5 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-muted/80 text-muted-foreground px-2 py-1 rounded-md border">
                      #{rowNumber}
                    </span>
                    {country.status === 'active' && (
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>
                
                {/* Enhanced Action Buttons */}
                <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(country)}
                    className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(country)}
                    className="h-8 w-8 p-0 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(country)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Enhanced Country Info Section */}
              <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={getFlagUrl(country)}
                      alt={`${country.name} flag`}
                      className="w-10 h-7 object-cover rounded-md border-2 border-border shadow-sm"
                      onError={(e) => {
                        // Fallback to a default flag or hide if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-background border border-border rounded-full flex items-center justify-center">
                      <span className="text-[8px]">🌍</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-lg leading-tight truncate">{country.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs font-semibold border border-primary/20">
                        {country.code}
                      </span>
                      <span className="text-sm text-muted-foreground font-medium">{country.region}</span>
                      <span className="text-xs text-muted-foreground/80">• {country.continent}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Currency and Status Grid */}
              <div className="grid grid-cols-1 gap-4">
                {/* Currency Information */}
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 bg-amber-100 dark:bg-amber-900/50 rounded-md flex items-center justify-center">
                        <span className="text-amber-600 dark:text-amber-400 text-xs font-bold">💰</span>
                      </div>
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Currency</span>
                    </div>
                    <div className="text-right">
                      {(() => {
                        const currencyInfo = getCurrencyDisplayInfo(country);
                        return (
                          <>
                            <div className="text-sm font-bold text-amber-900 dark:text-amber-100">
                              {currencyInfo.displayCurrency} ({currencyInfo.displaySymbol})
                            </div>
                            {currencyInfo.hasPricingOverride && (
                              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                                Pricing: {currencyInfo.pricingCurrency} ({currencyInfo.pricingSymbol})
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                
                {/* Status Information */}
                <div className={cn(
                  "border rounded-lg p-3 transition-colors",
                  country.status === 'active' 
                    ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800"
                    : "bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border-gray-200 dark:border-gray-700"
                )}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </span>
                    <Button
                      variant={country.status === 'active' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleStatusClick(country)}
                      className={cn(
                        "transition-all duration-200 hover:scale-105",
                        country.status === 'active' 
                          ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800'
                      )}
                    >
                      {country.status === 'active' ? 'Active' : 'Inactive'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modern Unified Pagination Footer */}
      <div className="bg-gradient-to-r from-card to-card/80 border border-border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          
          {/* Left Section: Items per page & Info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Items per page selector */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Rows per page:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => onItemsPerPageChange?.(parseInt(value))}
              >
                <SelectTrigger className="w-20 h-9 border-2 border-border/50 hover:border-border transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Results info */}
            <div className="flex items-center gap-2">
              <div className="h-4 w-px bg-border"></div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {Math.min((currentPage - 1) * itemsPerPage + 1, countries.length)}–{Math.min(currentPage * itemsPerPage, countries.length)}
                </span>
                {" "}of{" "}
                <span className="font-medium text-foreground">{countries.length}</span>
                {" "}countries
              </div>
            </div>
          </div>

          {/* Right Section: Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-3">
              {/* Page info for mobile */}
              <div className="lg:hidden">
                <span className="text-sm font-medium text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              
              {/* Navigation buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPrevPage}
                  disabled={currentPage === 1}
                  className="h-9 px-3 border-2 border-border/50 hover:border-border disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Previous</span>
                </Button>
                
                {/* Page numbers - Enhanced responsive design */}
                <div className="hidden sm:flex items-center gap-1 mx-2">
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    
                    if (totalPages <= maxVisible) {
                      // Show all pages if total is small
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      // Smart pagination logic
                      if (currentPage <= 3) {
                        pages.push(1, 2, 3, 4, '...', totalPages);
                      } else if (currentPage >= totalPages - 2) {
                        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                      } else {
                        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                      }
                    }
                    
                    return pages.map((page, index) => {
                      if (page === '...') {
                        return (
                          <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                            ...
                          </span>
                        );
                      }
                      
                      return (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => onPageSelect(page as number)}
                          className={cn(
                            "w-9 h-9 p-0 border-2 transition-all duration-200",
                            page === currentPage
                              ? "bg-primary border-primary text-primary-foreground shadow-md"
                              : "border-border/50 hover:border-border hover:bg-accent"
                          )}
                        >
                          {page}
                        </Button>
                      );
                    });
                  })()}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNextPage}
                  disabled={currentPage === totalPages}
                  className="h-9 px-3 border-2 border-border/50 hover:border-border disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <span className="hidden sm:inline mr-1">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Toggle Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Status Change
            </DialogTitle>
            <DialogDescription className="text-left">
              {countryToToggle && (
                <>
                  Are you sure you want to {countryToToggle.status === 'active' ? 'deactivate' : 'activate'}{' '}
                  <span className="font-semibold text-foreground">{countryToToggle.name}</span>?
                  <br />
                  <br />
                  This will change the country status from{' '}
                  <span className={cn(
                    "font-semibold",
                    countryToToggle.status === 'active' ? 'text-green-600' : 'text-gray-600'
                  )}>
                    {countryToToggle.status === 'active' ? 'Active' : 'Inactive'}
                  </span>{' '}
                  to{' '}
                  <span className={cn(
                    "font-semibold",
                    countryToToggle.status === 'active' ? 'text-gray-600' : 'text-green-600'
                  )}>
                    {countryToToggle.status === 'active' ? 'Inactive' : 'Active'}
                  </span>.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={cancelToggleStatus}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmToggleStatus}
              className={cn(
                "w-full sm:w-auto",
                countryToToggle?.status === 'active'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              )}
            >
              {countryToToggle?.status === 'active' ? 'Deactivate' : 'Activate'} Country
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CountriesTable;
