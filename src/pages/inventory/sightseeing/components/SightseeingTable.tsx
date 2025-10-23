
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import ImageWithFallback from '@/components/ui/image-with-fallback';
import { Eye, Edit, Trash, Copy, User } from 'lucide-react';
import { Sightseeing } from '@/types/sightseeing';
import { formatCurrency, getCurrencyByCountry } from '../utils/currency';

interface SightseeingTableProps {
  sightseeings: Sightseeing[];
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  onToggleStatus: (id: number) => void;
}

const SightseeingTable: React.FC<SightseeingTableProps> = ({
  sightseeings,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus
}) => {
  // Format price with currency symbol using the currency mapping utility
  const formatPrice = (price: number | undefined, country: string): string => {
    if (price === undefined || price === 0) return 'Free';
    return formatCurrency(price, country);
  };

  // Get transfer options display
  const getTransferOptions = (sightseeing: Sightseeing) => {
    if (sightseeing.transferOptions && sightseeing.transferOptions.length > 0) {
      const enabledOptions = sightseeing.transferOptions.filter(option => option.isEnabled !== false);
      return (
        <div className="space-y-1">
          {enabledOptions.slice(0, 2).map((option, index) => (
            <div key={index} className="flex items-center gap-1 text-sm">
              <Badge variant="outline" className="text-xs">{option.vehicleType}</Badge>
              {option.price ? (
                <span className="text-xs">
                  {formatPrice(option.price, sightseeing.country)}
                </span>
              ) : null}
            </div>
          ))}
          {enabledOptions.length > 2 && (
            <Badge variant="secondary" className="text-xs">+{enabledOptions.length - 2} more</Badge>
          )}
        </div>
      );
    }
    
    if (sightseeing.transferTypes && sightseeing.transferTypes.length > 0) {
      return (
        <div className="flex flex-wrap gap-1">
          {sightseeing.transferTypes.slice(0, 2).map((type, index) => (
            <Badge key={index} variant="secondary" className="text-xs">{type}</Badge>
          ))}
        </div>
      );
    }
    
    return <span className="text-muted-foreground text-sm">No transfers</span>;
  };
  
  // Get pricing display
  const getPricingDisplay = (sightseeing: Sightseeing) => {
    if (sightseeing.isFree) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Free</Badge>;
    }
    
    if (sightseeing.price && (sightseeing.price.adult > 0 || sightseeing.price.child > 0)) {
      return (
        <div className="space-y-1">
          <div className="text-sm">
            <span className="font-medium">A: {formatPrice(sightseeing.price.adult, sightseeing.country)}</span>
          </div>
          <div className="text-sm">
            <span className="font-medium">C: {formatPrice(sightseeing.price.child, sightseeing.country)}</span>
          </div>
        </div>
      );
    }
    
    // Check pricing options
    if (sightseeing.pricingOptions && sightseeing.pricingOptions.length > 0) {
      const enabledOptions = sightseeing.pricingOptions.filter(opt => opt.isEnabled !== false);
      return (
        <div className="space-y-1">
          {enabledOptions.slice(0, 1).map((option, idx) => (
            <div key={idx} className="text-sm">
              <Badge variant="secondary" className="mr-1 text-xs">{option.type}</Badge>
              <div className="text-xs">
                A: {formatPrice(option.adultPrice, sightseeing.country)}
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    return <span className="text-muted-foreground text-sm">No pricing</span>;
  };

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200 dark:border-gray-700">
                <TableHead className="font-semibold text-gray-900 dark:text-white">Sightseeing</TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-white">Location</TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-white">Category</TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-white">Transfer Options</TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-white">Pricing</TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-white">Status</TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sightseeings.map((sightseeing, index) => (
                <TableRow key={`${sightseeing.id}-${sightseeing.createdAt ?? ''}-${index}`} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <ImageWithFallback
                        src={sightseeing.images?.[0]?.url || sightseeing.imageUrl || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2070'} 
                        alt={sightseeing.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        fallbackIcon={<User className="h-4 w-4 text-muted-foreground" />}
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{sightseeing.name}</div>
                        {sightseeing.duration && (
                          <div className="text-sm text-gray-500">{sightseeing.duration}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{sightseeing.city}</div>
                      <div className="text-sm text-gray-500">{sightseeing.country}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {sightseeing.category ? (
                      <div className="flex flex-wrap gap-1">
                        {sightseeing.category.split(', ').slice(0, 2).map((cat, index) => (
                          <Badge key={index} variant="outline" className="text-xs">{cat}</Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No category</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getTransferOptions(sightseeing)}
                  </TableCell>
                  <TableCell>
                    {getPricingDisplay(sightseeing)}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={sightseeing.status === 'active'}
                      onCheckedChange={() => onToggleStatus(sightseeing.id)}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => onView(sightseeing.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-600 hover:text-green-600 hover:bg-green-50"
                        onClick={() => onEdit(sightseeing.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                        onClick={() => onDuplicate(sightseeing.id)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-600 hover:text-red-600 hover:bg-red-50"
                        onClick={() => onDelete(sightseeing.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default SightseeingTable;
