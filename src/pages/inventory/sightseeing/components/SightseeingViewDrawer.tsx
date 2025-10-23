
import React from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ImageWithFallback from '@/components/ui/image-with-fallback';
import { 
  Edit, 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  Car, 
  Users, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  ExternalLink,
  User,
  UserCheck,
  Package
} from 'lucide-react';
import { Sightseeing } from '@/types/sightseeing';
import { getExpirationStatus, formatValidityPeriod } from '../services/expirationService';
import { formatCurrency, getCurrencyByCountry } from '../utils/currency';

// Helpers to safely render policy fields that may be arrays or strings
const toStringArray = (val: unknown): string[] => {
  if (Array.isArray(val)) {
    return val.filter((v) => typeof v === 'string' && v.trim().length > 0);
  }
  if (typeof val === 'string') {
    const t = val.trim();
    return t.length > 0 ? [t] : [];
  }
  return [];
};

const hasNonEmptyString = (val: unknown): boolean => {
  return typeof val === 'string' && val.trim().length > 0;
};

interface SightseeingViewDrawerProps {
  sightseeing: Sightseeing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

const SightseeingViewDrawer: React.FC<SightseeingViewDrawerProps> = ({
  sightseeing,
  open,
  onOpenChange,
  onEdit
}) => {
  if (!sightseeing) return null;

  // Get primary image
  const primaryImage = sightseeing.images?.find(img => img.isPrimary)?.url || 
                      sightseeing.images?.[0]?.url || 
                      sightseeing.imageUrl ||
                      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2070';

  // Format price with currency symbol (using shared util)
  const formatPrice = (price: number | undefined): string => {
    if (price === undefined || price === 0) return 'Free';
    return formatCurrency(price, sightseeing.country);
  };

  // Get expiration status
  const expirationStatus = sightseeing.validityPeriod ? getExpirationStatus(sightseeing) : null;
  
  const getExpirationBadge = () => {
    if (!expirationStatus) return null;
    
    switch (expirationStatus) {
      case 'expired':
        return (
          <Badge className="bg-red-500 text-white">
            <XCircle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      case 'expiring-soon':
        return (
          <Badge className="bg-yellow-500 text-white">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Expiring Soon
          </Badge>
        );
      case 'valid':
        return (
          <Badge className="bg-blue-500 text-white">
            <Clock className="h-3 w-3 mr-1" />
            Valid Period
          </Badge>
        );
      default:
        return null;
    }
  };

  // Prepare policy values safely
  const policies = sightseeing.policies || {};
  const highlightsList = toStringArray((policies as any).highlights);
  const inclusionsList = toStringArray((policies as any).inclusions);
  const exclusionsList = toStringArray((policies as any).exclusions);
  const cancellationPolicyText = hasNonEmptyString((policies as any).cancellationPolicy)
    ? String((policies as any).cancellationPolicy)
    : '';
  const refundPolicyText = hasNonEmptyString((policies as any).refundPolicy)
    ? String((policies as any).refundPolicy)
    : '';
  const confirmationPolicyText = hasNonEmptyString((policies as any).confirmationPolicy)
    ? String((policies as any).confirmationPolicy)
    : '';
  const advisoryText = hasNonEmptyString((policies as any).advisory)
    ? String((policies as any).advisory)
    : '';
  const termsConditionsText = hasNonEmptyString((policies as any).termsConditions)
    ? String((policies as any).termsConditions)
    : '';

  // Helpers for Operational Details formatting
  const dayLabelMap: Record<string, string> = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun'
  };
  const formatDaysOfWeek = (days?: string[]) => {
    const d = (days ?? []).map((v) => dayLabelMap[v?.toLowerCase?.() || ''] || (v || '')).filter(Boolean);
    return d.length ? d.join(', ') : 'None';
  };
  const formatPickupTimeHHMM = (t?: string) => {
    if (!t) return 'Not specified';
    const m = t.trim().match(/^([0-1]?\d|2[0-3]):([0-5]\d)\s*(AM|PM)?$/i);
    if (!m) return t; // fallback to raw
    let hh = parseInt(m[1], 10);
    const mm = m[2];
    const ampm = m[3]?.toUpperCase();
    if (ampm === 'PM' && hh < 12) hh += 12;
    if (ampm === 'AM' && hh === 12) hh = 0;
    return `${String(hh).padStart(2, '0')}:${mm}`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-xl font-bold pr-8">{sightseeing.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-2">
                <MapPin className="h-4 w-4" />
                {sightseeing.city}, {sightseeing.country}
              </SheetDescription>
            </div>
            <Button onClick={onEdit} size="sm" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Image */}
          <div className="aspect-video rounded-lg overflow-hidden">
            <ImageWithFallback
              src={primaryImage} 
              alt={sightseeing.name}
              className="w-full h-full object-cover"
              fallbackIcon={<User className="h-12 w-12 text-muted-foreground" />}
            />
          </div>

          {/* Status and Badges */}
          <div className="flex flex-wrap gap-2">
            {sightseeing.status === 'active' ? (
              <Badge className="bg-green-500 text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge className="bg-red-500 text-white">
                <XCircle className="h-3 w-3 mr-1" />
                Inactive
              </Badge>
            )}
            {getExpirationBadge()}
            {sightseeing.category && (
              <Badge variant="outline">
                {sightseeing.category.split(', ')[0]}
              </Badge>
            )}
          </div>

          {/* Description */}
          {sightseeing.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {sightseeing.description}
              </p>
            </div>
          )}

          <Separator />

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Duration</p>
                <p className="font-medium">{sightseeing.duration || 'Not specified'}</p>
              </div>
              
              {sightseeing.difficultyLevel && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Difficulty</p>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      sightseeing.difficultyLevel === 'Easy' ? 'text-green-700 border-green-200' :
                      sightseeing.difficultyLevel === 'Moderate' ? 'text-yellow-700 border-yellow-200' :
                      'text-red-700 border-red-200'
                    }`}
                  >
                    {sightseeing.difficultyLevel}
                  </Badge>
                </div>
              )}
              
              {sightseeing.timing && (
                <div className="col-span-2">
                  <p className="text-gray-500 dark:text-gray-400">Timing</p>
                  <p className="font-medium">{sightseeing.timing}</p>
                </div>
              )}

              {sightseeing.allowedAgeGroup && (
                <div className="col-span-2">
                  <p className="text-gray-500 dark:text-gray-400">Age Group</p>
                  <p className="font-medium">{sightseeing.allowedAgeGroup}</p>
                </div>
              )}

              {/* Currency Information */}
              {(sightseeing.currency || sightseeing.pricing_currency || sightseeing.country) && (
                <div className="col-span-2">
                  <p className="text-gray-500 dark:text-gray-400">Currency</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <div className="flex flex-col">
                      {sightseeing.currency ? (
                        <p className="font-medium text-sm">
                          Display: {sightseeing.currency} {sightseeing.currencySymbol && `(${sightseeing.currencySymbol})`}
                        </p>
                      ) : sightseeing.country && (
                        <p className="font-medium text-sm">
                          Display: {getCurrencyByCountry(sightseeing.country).code} ({getCurrencyByCountry(sightseeing.country).symbol})
                        </p>
                      )}
                      {sightseeing.pricing_currency ? (
                        <p className="font-medium text-sm">
                          Pricing: {sightseeing.pricing_currency} {sightseeing.pricing_currency_symbol && `(${sightseeing.pricing_currency_symbol})`}
                        </p>
                      ) : sightseeing.country && (
                        <p className="font-medium text-sm">
                          Pricing: {getCurrencyByCountry(sightseeing.country).code} ({getCurrencyByCountry(sightseeing.country).symbol})
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Validity Period */}
          {sightseeing.validityPeriod && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Validity Period</h3>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{formatValidityPeriod(sightseeing.validityPeriod)}</span>
                </div>
              </div>
            </>
          )}

          {/* Operational Details / Timing & Location */}
          <Separator />
          <div>
            <h3 className="font-semibold mb-3">Operational Details / Timing & Location</h3>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Activities</p>
                {Array.isArray(sightseeing.activities) && sightseeing.activities.length > 0 ? (
                  <p className="font-medium">{sightseeing.activities.join(', ')}</p>
                ) : (
                  <p className="font-medium">None</p>
                )}
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Season</p>
                <p className="font-medium">{sightseeing.season || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Days of Week</p>
                <p className="font-medium">{formatDaysOfWeek(sightseeing.daysOfWeek)}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Pick-up Time</p>
                <p className="font-medium">{formatPickupTimeHHMM(sightseeing.pickupTime)}</p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <Separator />
          <div>
            <h3 className="font-semibold mb-3">Pricing</h3>
            
            {sightseeing.isFree ? (
              <Badge className="bg-green-100 text-green-800 border-green-200">Free Entry</Badge>
            ) : (
              <div className="space-y-3">
                {sightseeing.price && (sightseeing.price.adult > 0 || sightseeing.price.child > 0) && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-sm font-medium mb-2">Standard Pricing</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Adult</p>
                        <p className="font-medium">{formatPrice(sightseeing.price.adult)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Child</p>
                        <p className="font-medium">{formatPrice(sightseeing.price.child)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SIC Pricing */}
                {sightseeing.sicAvailable && sightseeing.sicPricing && (sightseeing.sicPricing.adult > 0 || sightseeing.sicPricing.child > 0) && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCheck className="h-4 w-4 text-blue-600" />
                      <p className="text-sm font-medium">SIC (Seat-in-Coach) Pricing</p>
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Available</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Adult</p>
                        <p className="font-medium">{formatPrice(sightseeing.sicPricing.adult)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Child</p>
                        <p className="font-medium">{formatPrice(sightseeing.sicPricing.child)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pricing Options */}
                {sightseeing.pricingOptions && sightseeing.pricingOptions.filter(opt => opt.isEnabled).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Pricing Options</p>
                    {sightseeing.pricingOptions
                      .filter(opt => opt.isEnabled)
                      .map((option) => (
                        <div key={option.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                          <p className="text-sm font-medium mb-1">{option.type}</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-gray-500">Adult</p>
                              <p className="font-medium">{formatPrice(option.adultPrice)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Child</p>
                              <p className="font-medium">{formatPrice(option.childPrice)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Package Options */}
                {sightseeing.packageOptions && sightseeing.packageOptions.filter(opt => opt.isEnabled).length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <p className="text-sm font-medium">Package Options</p>
                    </div>
                    {sightseeing.packageOptions
                      .filter(opt => opt.isEnabled)
                      .map((option) => (
                        <div key={option.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                          <div className="mb-2">
                            <p className="text-sm font-medium">{option.name}</p>
                            <p className="text-xs text-gray-500">{option.type}</p>
                            {option.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{option.description}</p>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-gray-500">Adult</p>
                              <p className="font-medium">{formatPrice(option.adultPrice)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Child</p>
                              <p className="font-medium">{formatPrice(option.childPrice)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Group Size Options */}
                {sightseeing.groupSizeOptions && sightseeing.groupSizeOptions.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <p className="text-sm font-medium">Group Size Options</p>
                    </div>
                    {sightseeing.groupSizeOptions.map((option) => (
                      <div key={option.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <div className="mb-2">
                          <p className="text-sm font-medium">{option.minPeople} - {option.maxPeople} people</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-500">Adult</p>
                            <p className="font-medium">{formatPrice(option.adultPrice)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Child</p>
                            <p className="font-medium">{formatPrice(option.childPrice)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Transfer Options */}
          {sightseeing.transferOptions && sightseeing.transferOptions.filter(opt => opt.isEnabled).length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Transfer Options</h3>
                <div className="space-y-2">
                  {sightseeing.transferOptions
                    .filter(opt => opt.isEnabled)
                    .map((option) => (
                      <div key={option.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{option.vehicleType}</p>
                            <p className="text-xs text-gray-500">Capacity: {option.capacity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">{formatPrice(option.price)}</p>
                            <p className="text-xs text-gray-500">{option.priceUnit}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}

          {/* Address and Links */}
          {(sightseeing.address || sightseeing.googleMapLink) && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Location Details</h3>
                {sightseeing.address && (
                  <div className="mb-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                    <p className="text-sm">{sightseeing.address}</p>
                  </div>
                )}
                {sightseeing.googleMapLink && (
                  <a 
                    href={sightseeing.googleMapLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View on Google Maps
                  </a>
                )}
              </div>
            </>
          )}

          {/* Policies */}
          {(highlightsList.length > 0 || inclusionsList.length > 0 || exclusionsList.length > 0 || cancellationPolicyText || refundPolicyText || confirmationPolicyText || advisoryText || termsConditionsText) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold">Policies & Information</h3>

                {highlightsList.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Highlights</p>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {highlightsList.map((highlight, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {inclusionsList.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Inclusions</p>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {inclusionsList.map((inclusion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                          {inclusion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {exclusionsList.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Exclusions</p>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {exclusionsList.map((exclusion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <XCircle className="h-3 w-3 text-red-500 mt-1 flex-shrink-0" />
                          {exclusion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {cancellationPolicyText && (
                  <div>
                    <p className="text-sm font-medium mb-2">Cancellation Policy</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{cancellationPolicyText}</p>
                  </div>
                )}

                {refundPolicyText && (
                  <div>
                    <p className="text-sm font-medium mb-2">Refund Policy</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{refundPolicyText}</p>
                  </div>
                )}

                {confirmationPolicyText && (
                  <div>
                    <p className="text-sm font-medium mb-2">Confirmation Policy</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{confirmationPolicyText}</p>
                  </div>
                )}

                {advisoryText && (
                  <div>
                    <p className="text-sm font-medium mb-2">Advisory</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{advisoryText}</p>
                  </div>
                )}

                {termsConditionsText && (
                  <div>
                    <p className="text-sm font-medium mb-2">Terms & Conditions</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{termsConditionsText}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Metadata */}
          <Separator />
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Created: {new Date(sightseeing.createdAt).toLocaleDateString()}</p>
            <p>Last Updated: {new Date(sightseeing.lastUpdated).toLocaleDateString()}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SightseeingViewDrawer;
