
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import ImageWithFallback from '@/components/ui/image-with-fallback';
import { 
  MapPin, 
  Eye, 
  Edit, 
  Trash, 
  Copy, 
  Calendar,
  DollarSign,
  Car,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  User
} from 'lucide-react';
import { Sightseeing } from '@/types/sightseeing';
import { getExpirationStatus, formatValidityPeriod } from '../services/expirationService';
import { formatCurrency } from '../utils/currency';

interface SightseeingCardProps {
  sightseeing: Sightseeing;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleStatus: () => void;
}

const SightseeingCard: React.FC<SightseeingCardProps> = ({
  sightseeing,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus
}) => {
  // Get primary image or fallback
  const primaryImage = sightseeing.images?.find(img => img.isPrimary)?.url || 
                      sightseeing.images?.[0]?.url || 
                      sightseeing.imageUrl ||
                      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2070';

  // Format price with currency symbol (using shared util)
  const formatPrice = (price: number | undefined): string => {
    if (price === undefined || price === 0) return 'Free';
    return formatCurrency(price, sightseeing.country);
  };

  // Get pricing display
  const getPricingDisplay = () => {
    if (sightseeing.isFree) {
      return <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700">Free</Badge>;
    }
    
    if (sightseeing.price && (sightseeing.price.adult > 0 || sightseeing.price.child > 0)) {
      return (
        <div className="text-sm">
          <div className="font-semibold text-gray-900 dark:text-white">{formatPrice(sightseeing.price.adult)}</div>
          <div className="text-gray-500 dark:text-gray-400">per adult</div>
        </div>
      );
    }
    
    return <span className="text-sm text-gray-500 dark:text-gray-400">Price on request</span>;
  };

  // Get transfer options count
  const getTransferOptionsCount = () => {
    const enabledTransfers = sightseeing.transferOptions?.filter(opt => opt.isEnabled !== false) || [];
    return enabledTransfers.length;
  };

  // Get expiration status and badge
  const expirationStatus = sightseeing.validityPeriod ? getExpirationStatus(sightseeing) : 'no-period';
  
  const getExpirationBadge = () => {
    if (!sightseeing.validityPeriod) return null;
    
    switch (expirationStatus) {
      case 'expired':
        return (
          <Badge className="bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg">
            <XCircle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      case 'expiring-soon':
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-0 shadow-lg">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Expiring Soon
          </Badge>
        );
      case 'valid':
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-lg">
            <Clock className="h-3 w-3 mr-1" />
            Valid Period
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-md hover:-translate-y-2 bg-white dark:bg-gray-800 overflow-hidden rounded-2xl" onClick={onView}>
      {/* Banner Image */}
      <div className="relative h-48 overflow-hidden">
        <ImageWithFallback
          src={primaryImage} 
          alt={sightseeing.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          fallbackIcon={<User className="h-12 w-12 text-muted-foreground" />}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Status and Expiration Badges */}
        <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
          {sightseeing.status === 'active' ? (
            <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 shadow-lg">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
          ) : (
            <Badge className="bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg">
              <XCircle className="h-3 w-3 mr-1" />
              Inactive
            </Badge>
          )}
          {getExpirationBadge()}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-gray-700 border-0 shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-gray-700 border-0 shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>

        {/* Category */}
        {sightseeing.category && (
          <div className="absolute bottom-4 left-4">
            <Badge variant="outline" className="bg-white/90 text-gray-700 border-0 shadow-lg">
              {sightseeing.category.split(', ')[0]}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-6">
        {/* Sightseeing Name */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {sightseeing.name}
          </h3>
        </div>
        
        {/* Location */}
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="h-4 w-4" />
          <span>{sightseeing.city}, {sightseeing.country}</span>
        </div>
        
        {/* Validity Period Display */}
        {sightseeing.validityPeriod && (
          <div className="flex items-center gap-2 mb-4 text-sm">
            <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">
              {formatValidityPeriod(sightseeing.validityPeriod)}
            </span>
          </div>
        )}
        
        {/* Duration & Timing */}
        {(sightseeing.duration || sightseeing.timing) && (
          <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
            {sightseeing.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{sightseeing.duration}</span>
              </div>
            )}
            {sightseeing.timing && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{sightseeing.timing}</span>
              </div>
            )}
          </div>
        )}

        {/* Transfer Options */}
        {getTransferOptionsCount() > 0 && (
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
            <Car className="h-4 w-4" />
            <span>{getTransferOptionsCount()} transfer option{getTransferOptionsCount() > 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Pricing */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            {getPricingDisplay()}
          </div>
        </div>

        {/* Difficulty Level */}
        {sightseeing.difficultyLevel && (
          <div className="mb-4">
            <Badge 
              variant="outline" 
              className={`text-xs ${
                sightseeing.difficultyLevel === 'Easy' ? 'text-green-700 border-green-200 bg-green-50 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700' :
                sightseeing.difficultyLevel === 'Moderate' ? 'text-yellow-700 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700' :
                'text-red-700 border-red-200 bg-red-50 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
              }`}
            >
              {sightseeing.difficultyLevel}
            </Badge>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Updated {new Date(sightseeing.lastUpdated).toLocaleDateString()}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={sightseeing.status === 'active'}
              onCheckedChange={onToggleStatus}
              className="data-[state=checked]:bg-green-500"
            />
            
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300"
              onClick={onDuplicate}
            >
              <Copy className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300"
              onClick={onDelete}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SightseeingCard;
