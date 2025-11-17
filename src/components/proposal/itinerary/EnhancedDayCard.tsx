
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import OptionalToggle from './OptionalToggle';
import RealTimeOptionalToggle from './RealTimeOptionalToggle';
import { 
  MapPin, Clock, DollarSign, Calendar, ChevronUp, ChevronDown,
  Sunrise, Sun, Sunset, Moon, Car, Plane, Train, Bus, Ship,
  Hotel, Utensils, Camera, MapIcon, Star, Users, Phone, Mail,
  Shield, Info, AlertCircle, CheckCircle, Globe, Navigation,
  FileText, CreditCard, UserCheck, Briefcase, HeadphonesIcon,
  MapPin as MapPinIcon, Clock as ClockIcon, Compass, Mountain
} from 'lucide-react';
import ActivityCard from './ActivityCard';
import TransportCard from './TransportCard';
import AccommodationCard from './AccommodationCard';

interface EnhancedDayCardProps {
  day: any;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onToggleActivityOptional?: (activityId: string, isOptional: boolean) => void;
  onToggleTransportOptional?: (transportId: string, isOptional: boolean) => void;
  optionalRecords?: any;
  proposalId?: string;
  onRealTimeUpdate?: (itemId: string, itemType: 'activity' | 'transport', isOptional: boolean) => Promise<void>;
  isLoading?: boolean;
}

const EnhancedDayCard: React.FC<EnhancedDayCardProps> = ({
  day,
  formatCurrency,
  formatDate,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  onToggleActivityOptional,
  onToggleTransportOptional,
  optionalRecords,
  proposalId,
  onRealTimeUpdate,
  isLoading = false
}) => {
  // Safely extract location information
  const getLocationName = () => {
    if (typeof day.location === 'string') return day.location;
    if (day.location && typeof day.location === 'object') {
      return day.location.name || day.location.city || 'Unknown Location';
    }
    return day.city || 'Unknown Location';
  };

  const getDayTitle = () => {
    return day.title || `Day ${day.dayNumber || day.day || 1}`;
  };

  const getActivities = () => {
    return day.activities || [];
  };

  const getTransport = () => {
    return day.transport || [];
  };

  const getAccommodation = () => {
    return day.accommodation || day.accommodations?.[0];
  };

  const getMeals = () => {
    return day.meals || [];
  };

  const isActivityOptional = (activityId: string) => {
    if (!optionalRecords?.sightseeing) return false;
    return optionalRecords.sightseeing.some((record: any) => 
      record.optionId === activityId && record.isOptional
    );
  };

  const isTransportOptional = (transportId: string) => {
    if (!optionalRecords?.transport) return false;
    return optionalRecords.transport.some((record: any) => 
      record.optionId === transportId && record.isOptional
    );
  };

  const getTimeOfDayIcon = (dayNumber: number) => {
    const icons = [Sunrise, Sun, Sunset, Moon];
    return icons[(dayNumber - 1) % icons.length];
  };

  const TimeIcon = getTimeOfDayIcon(day.dayNumber || 1);

  const getDayColor = (dayNumber: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600', 
      'from-purple-500 to-purple-600',
      'from-orange-500 to-orange-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
      'from-teal-500 to-teal-600',
      'from-red-500 to-red-600'
    ];
    return colors[(dayNumber - 1) % colors.length];
  };

  const dayGradient = getDayColor(day.dayNumber || 1);

  return (
    <Card className="group w-full overflow-hidden bg-card border border-border hover:border-primary/20 shadow-sm hover:shadow-lg transition-all duration-500 dark:bg-card dark:border-border print:shadow-none print:border backdrop-blur-sm">
      {/* Enhanced Header with Gradient and Glass Effect */}
      <CardHeader className={`relative overflow-hidden bg-gradient-to-br ${dayGradient} text-white p-6`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
        
        {/* Reorder Buttons */}
        <div className="absolute right-3 top-3 flex flex-col gap-1 print:hidden z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/90 hover:text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg transition-all duration-200"
            onClick={onMoveUp}
            disabled={!canMoveUp}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/90 hover:text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg transition-all duration-200"
            onClick={onMoveDown}
            disabled={!canMoveDown}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Header Content */}
        <div className="relative z-10">
          <div className="flex items-center justify-between pr-16 mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                <div className="p-1 bg-white/20 rounded-lg">
                  <TimeIcon className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-bold text-lg">Day {day.dayNumber || day.day || 1}</span>
                  <div className="text-xs text-white/80 font-medium">
                    {day.date && formatDate(day.date)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                <MapPin className="h-4 w-4 text-white/80" />
                <span className="font-medium text-sm">{getLocationName()}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 border border-white/20">
                {formatCurrency(day.totalCost || 0)}
              </div>
              <div className="text-xs text-white/80 font-medium mt-1">Total Cost</div>
            </div>
          </div>

          {/* Day Title */}
          <CardTitle className="text-xl font-bold mb-2 text-white drop-shadow-sm">
            {getDayTitle()}
          </CardTitle>

          {/* Description */}
          {day.description && (
            <p className="text-sm text-white/90 leading-relaxed line-clamp-2 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              {day.description}
            </p>
          )}

          {/* Quick Stats */}
          <div className="flex items-center gap-4 mt-4 text-xs text-white/80">
            <div className="flex items-center gap-1">
              <Camera className="h-3 w-3" />
              <span>{getActivities().length} Activities</span>
            </div>
            <div className="flex items-center gap-1">
              <Car className="h-3 w-3" />
              <span>{getTransport().length} Transfers</span>
            </div>
            <div className="flex items-center gap-1">
              <Utensils className="h-3 w-3" />
              <span>{getMeals().length} Meals</span>
            </div>
            {getAccommodation() && (
              <div className="flex items-center gap-1">
                <Hotel className="h-3 w-3" />
                <span>1 Hotel</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6 bg-background dark:bg-card">
        {/* Transport Section */}
        {getTransport().length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm font-semibold text-foreground dark:text-white">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 dark:from-emerald-400/20 dark:to-emerald-500/30 flex items-center justify-center shadow-sm border border-emerald-200/50 dark:border-emerald-400/20">
                  <Car className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <span className="text-base text-foreground dark:text-white">Transportation</span>
                  <Badge variant="outline" className="ml-2 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-400/20 text-emerald-700 dark:text-emerald-300 text-xs">
                    {getTransport().length} transfers
                  </Badge>
                </div>
              </div>
              {onToggleTransportOptional && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Optional</span>
                  <Switch
                    checked={getTransport().some(transport => isTransportOptional(transport.id))}
                    onCheckedChange={(checked) => {
                      // Toggle all transport options as optional
                      getTransport().forEach(transport => {
                        onToggleTransportOptional(transport.id, checked);
                      });
                    }}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 ml-16">
              {getTransport().map((transport: any, index: number) => (
                <div key={transport.id || index} className={`relative group border rounded-xl p-4 bg-gradient-to-r backdrop-blur-sm transition-all duration-300 hover:shadow-md ${
                  isTransportOptional(transport.id) 
                    ? 'border-dashed border-emerald-400 bg-gradient-to-r from-emerald-50/60 to-white dark:from-emerald-900/5 dark:to-card opacity-75' 
                    : 'border-border dark:border-border from-emerald-50/80 to-white dark:from-emerald-900/10 dark:to-card'
                }`}>
                  {/* Transport visual */}
                  <div className="absolute top-4 right-4 w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-800 dark:to-emerald-700 rounded-lg flex items-center justify-center opacity-50">
                    <Car className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                  </div>

                  {/* Enhanced Optional Toggle */}
                  {onToggleTransportOptional && (
                    <div className="absolute top-4 left-4">
                      {onRealTimeUpdate && proposalId ? (
                        <RealTimeOptionalToggle
                          itemId={transport.id}
                          itemType="transport"
                          proposalId={proposalId}
                          isOptional={isTransportOptional(transport.id)}
                          onToggle={(checked) => onToggleTransportOptional(transport.id, checked)}
                          onRealTimeUpdate={onRealTimeUpdate}
                          isLoading={isLoading}
                          size="sm"
                          showLabels={false}
                        />
                      ) : (
                        <OptionalToggle
                          isOptional={isTransportOptional(transport.id)}
                          onToggle={(checked) => onToggleTransportOptional(transport.id, checked)}
                          size="sm"
                          showLabels={false}
                        />
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pr-12">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-800 rounded-lg flex items-center justify-center">
                        <Car className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                      </div>
                      <div>
                        <span className="font-medium text-sm text-foreground dark:text-white">
                          {transport.name || transport.type || 'Transport'}
                          {isTransportOptional(transport.id) && (
                            <Badge variant="outline" className="ml-2 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-600">
                              Optional
                            </Badge>
                          )}
                        </span>
                        <div className="text-xs text-muted-foreground dark:text-gray-400">
                          {typeof transport.from === 'string' ? transport.from : transport.from?.name || 'Start'} → {typeof transport.to === 'string' ? transport.to : transport.to?.name || 'End'}
                        </div>
                        {transport.vehicleType && (
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            {transport.vehicleType} • {transport.totalPax || 'N/A'} pax
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                      {formatCurrency(transport.price || 0)}
                    </Badge>
                  </div>
                  
                  {/* Transport Details */}
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {transport.pickupTime && (
                      <div className="flex items-center gap-2 bg-white/50 dark:bg-card/50 rounded-lg px-3 py-1.5">
                        <Clock className="h-3 w-3 text-emerald-600" />
                        <span>Pickup: {transport.pickupTime}</span>
                      </div>
                    )}
                    {transport.dropTime && (
                      <div className="flex items-center gap-2 bg-white/50 dark:bg-card/50 rounded-lg px-3 py-1.5">
                        <Clock className="h-3 w-3 text-emerald-600" />
                        <span>Drop: {transport.dropTime}</span>
                      </div>
                    )}
                    {transport.routeCode && (
                      <div className="flex items-center gap-2 bg-white/50 dark:bg-card/50 rounded-lg px-3 py-1.5">
                        <MapIcon className="h-3 w-3 text-emerald-600" />
                        <span>Route: {transport.routeCode}</span>
                      </div>
                    )}
                    {transport.vehicleSummary && (
                      <div className="flex items-center gap-2 bg-white/50 dark:bg-card/50 rounded-lg px-3 py-1.5">
                        <Car className="h-3 w-3 text-emerald-600" />
                        <span>{transport.vehicleSummary}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Accommodation Section - 3 Options */}
        {(getAccommodation() || day.accommodationOptions) && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm font-semibold text-foreground dark:text-white">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/20 dark:from-purple-400/20 dark:to-purple-500/30 flex items-center justify-center shadow-sm border border-purple-200/50 dark:border-purple-400/20">
                <Hotel className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <span className="text-base text-foreground dark:text-white">Hotel & Accommodation</span>
                <Badge variant="outline" className="ml-2 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-400/20 text-purple-700 dark:text-purple-300 text-xs">
                  {day.accommodationOptions?.length || 1} Options
                </Badge>
              </div>
            </div>
            
            <div className="ml-16 space-y-4">
              {/* Display accommodation options if available */}
              {day.accommodationOptions && day.accommodationOptions.length > 0 ? (
                day.accommodationOptions.map((accommodation: any, index: number) => (
                  <div key={accommodation.id || index} className="relative group border border-border dark:border-border rounded-xl p-6 bg-gradient-to-br from-purple-50/80 to-white dark:from-purple-900/10 dark:to-card hover:shadow-lg transition-all duration-300 backdrop-blur-sm overflow-hidden">
                    {/* Option Badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold">
                        Option {accommodation.option || index + 1}
                      </Badge>
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4 pr-20">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Hotel className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            <h3 className="font-bold text-lg text-foreground dark:text-white">
                              {accommodation.hotelName || accommodation.name}
                            </h3>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-muted-foreground dark:text-gray-400">
                                Hotel Type: <span className="font-medium text-foreground dark:text-white">{accommodation.hotelType || accommodation.type}</span>
                              </span>
                              <span className="text-muted-foreground dark:text-gray-400">
                                Room Type: <span className="font-medium text-foreground dark:text-white">{accommodation.roomType}</span>
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-muted-foreground dark:text-gray-400">
                                Number of Rooms: <span className="font-medium text-foreground dark:text-white">{accommodation.numberOfRooms || accommodation.rooms || 1}</span>
                              </span>
                              <span className="text-muted-foreground dark:text-gray-400">
                                City: <span className="font-medium text-foreground dark:text-white">{accommodation.city}</span>
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-muted-foreground dark:text-gray-400">
                                Number of Nights: <span className="font-medium text-foreground dark:text-white">{accommodation.numberOfNights || accommodation.nights || 1}</span>
                              </span>
                            </div>
                            
                            {accommodation.starRating && (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  {[...Array(accommodation.starRating)].map((_, i) => (
                                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  ))}
                                </div>
                                <span className="text-xs text-muted-foreground dark:text-gray-400">{accommodation.starRating} Star Hotel</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-bold px-3 py-1">
                            {formatCurrency(accommodation.pricePerNight || accommodation.price || 0)}/night
                          </Badge>
                          <div className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                            Total: {formatCurrency((accommodation.pricePerNight || accommodation.price || 0) * (accommodation.numberOfNights || 1))}
                          </div>
                        </div>
                      </div>

                      {/* Check-in/Check-out dates */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center gap-2 bg-white/70 dark:bg-card/70 rounded-lg px-3 py-2 border border-purple-100 dark:border-purple-800">
                          <Calendar className="h-3 w-3 text-purple-500" />
                          <span className="text-foreground dark:text-white font-medium">Check-in: {accommodation.checkInDate || accommodation.checkIn || day.date}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-white/70 dark:bg-card/70 rounded-lg px-3 py-2 border border-purple-100 dark:border-purple-800">
                          <Calendar className="h-3 w-3 text-purple-500" />
                          <span className="text-foreground dark:text-white font-medium">Check-out: {accommodation.checkOutDate || accommodation.checkOut}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : getAccommodation() ? (
                // Fallback to single accommodation display
                <div className="relative group border border-border dark:border-border rounded-xl p-6 bg-gradient-to-br from-purple-50/80 to-white dark:from-purple-900/10 dark:to-card hover:shadow-lg transition-all duration-300 backdrop-blur-sm overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Hotel className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          <h3 className="font-bold text-lg text-foreground dark:text-white">
                            {getAccommodation().name || getAccommodation().hotel}
                          </h3>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground dark:text-gray-400">
                            {getAccommodation().roomType || getAccommodation().type || 'Standard Room'}
                          </div>
                          
                          {getAccommodation().starRating && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {[...Array(getAccommodation().starRating)].map((_, i) => (
                                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground dark:text-gray-400">{getAccommodation().starRating} Star Hotel</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-bold px-3 py-1">
                          {formatCurrency(getAccommodation().price || 0)}/night
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Enhanced Sightseeing & Activities Section with Transfer Configuration */}
        {(getActivities().length > 0 || day.enhancedActivities) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm font-semibold text-foreground dark:text-white">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/20 dark:from-blue-400/20 dark:to-blue-500/30 flex items-center justify-center shadow-sm border border-blue-200/50 dark:border-blue-400/20">
                  <Camera className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <span className="text-base text-foreground dark:text-white">Activities & Sightseeing</span>
                  <Badge variant="outline" className="ml-2 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-400/20 text-blue-700 dark:text-blue-300 text-xs">
                    {getActivities().length} experiences
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-xs text-muted-foreground dark:text-gray-400 font-medium">
                  Total: {formatCurrency(getActivities().reduce((sum, act) => sum + (act.price || act.cost || 0), 0))}
                </div>
                {onToggleActivityOptional && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Optional</span>
                    <Switch
                      checked={getActivities().some(activity => isActivityOptional(activity.id))}
                      onCheckedChange={(checked) => {
                        // Toggle all activities as optional
                        getActivities().forEach(activity => {
                          onToggleActivityOptional(activity.id, checked);
                        });
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-6 ml-16">
              {getActivities().map((activity: any, index: number) => (
                <div key={activity.id || index} className={`bg-gradient-to-br rounded-xl border p-6 hover:shadow-lg transition-all duration-300 ${
                  isActivityOptional(activity.id)
                    ? 'border-dashed border-blue-400 bg-gradient-to-br from-slate-50/60 to-purple-50/20 dark:from-slate-900/30 dark:to-purple-950/10 opacity-75'
                    : 'border-slate-200/50 dark:border-slate-700/50 from-slate-50 to-purple-50/30 dark:from-slate-900/50 dark:to-purple-950/20'
                }`}>
                  {/* Activity Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {onToggleActivityOptional && (
                        <div className="flex-shrink-0">
                          {onRealTimeUpdate && proposalId ? (
                            <RealTimeOptionalToggle
                              itemId={activity.id}
                              itemType="activity"
                              proposalId={proposalId}
                              isOptional={isActivityOptional(activity.id)}
                              onToggle={(checked) => onToggleActivityOptional(activity.id, checked)}
                              onRealTimeUpdate={onRealTimeUpdate}
                              isLoading={isLoading}
                              size="sm"
                              showLabels={false}
                            />
                          ) : (
                            <OptionalToggle
                              isOptional={isActivityOptional(activity.id)}
                              onToggle={(checked) => onToggleActivityOptional(activity.id, checked)}
                              size="sm"
                              showLabels={false}
                            />
                          )}
                        </div>
                      )}
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">
                        #{index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-lg font-semibold text-foreground mb-1">
                          {activity.name || activity.activityName || `Activity ${index + 1}`}
                          {isActivityOptional(activity.id) && (
                            <Badge variant="outline" className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600">
                              Optional
                            </Badge>
                          )}
                        </h5>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {activity.description.length > 120 ? `${activity.description.substring(0, 120)}...` : activity.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                      {formatCurrency(activity.cost || activity.price || 0)}
                    </Badge>
                  </div>

                  {/* Activity Meta Information */}
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    {activity.duration && (
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <Clock className="h-4 w-4" />
                        <span>{activity.duration}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                      <Camera className="h-4 w-4" />
                      <span>{activity.type || 'Sightseeing'}</span>
                    </div>
                    {activity.transportType && activity.transportType !== 'none' && (
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <Car className="h-4 w-4" />
                        <span>{activity.transportType.toUpperCase()}</span>
                      </div>
                    )}
                  </div>

                  {/* Activity Options and Selections */}
                  {activity.selectedOptions && activity.selectedOptions.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium text-foreground">Selected Options</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {activity.selectedOptions.slice(0, 3).map((option: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300">
                            {typeof option === 'string' ? option : option.name || option.title || `Option ${idx + 1}`}
                          </Badge>
                        ))}
                        {activity.selectedOptions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{activity.selectedOptions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Transfer Configuration Section */}
                  {activity.transportType && activity.transportType !== 'none' && activity.transportType !== 'walking' && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Transfer Configuration</span>
                      </div>
                      
                      {(() => {
                        // Helper function to convert type indicators to proper vehicle names
                        const getVehicleNameFromType = (vehicleType: string): string => {
                          const type = vehicleType.toLowerCase().trim();
                          switch (type) {
                            case 'private':
                              return 'Private Car';
                            case 'sic':
                              return 'Shared Vehicle';
                            case 'private_car':
                              return 'Private Car';
                            case 'private_van':
                              return 'Private Van';
                            case 'shared_car':
                              return 'Shared Car';
                            case 'bus':
                              return 'Tour Bus';
                            case 'minibus':
                              return 'Mini Bus';
                            case 'suv':
                              return 'SUV';
                            case 'taxi':
                              return 'Taxi';
                            case 'tuk_tuk':
                              return 'Tuk Tuk';
                            case 'songthaew':
                              return 'Red Songthaew';
                            default:
                              return vehicleType;
                          }
                        };

                        // Get vehicle name
                        let vehicleName = 'Standard Vehicle';
                        if (activity.vehicleType && activity.vehicleType.trim() !== '' && activity.vehicleType !== 'Standard Vehicle' && activity.vehicleType !== 'standard') {
                          vehicleName = getVehicleNameFromType(activity.vehicleType);
                        } else if (activity.selectedOptions && typeof activity.selectedOptions === 'object' && !Array.isArray(activity.selectedOptions) && (activity.selectedOptions as any).transferOption?.vehicleType && (activity.selectedOptions as any).transferOption.vehicleType.trim() !== '') {
                          vehicleName = getVehicleNameFromType((activity.selectedOptions as any).transferOption.vehicleType);
                        } else if (activity.transportType === 'private_car' || activity.transportType === 'private' || (activity.transportLabel && activity.transportLabel.toLowerCase().includes('private'))) {
                          vehicleName = 'Private Car';
                        } else if (activity.transportType === 'private_van') vehicleName = 'Private Van';
                        else if (activity.transportType === 'shared_car') vehicleName = 'Shared Car';
                        else if (activity.transportType === 'bus') vehicleName = 'Tour Bus';
                        else if (activity.transportType === 'minibus') vehicleName = 'Mini Bus';
                        else if (activity.transportType === 'suv') vehicleName = 'SUV';
                        else if (activity.transportType === 'taxi') vehicleName = 'Taxi';
                        else if (activity.transportType === 'tuk_tuk') vehicleName = 'Tuk Tuk';
                        else if (activity.transportType === 'songthaew') vehicleName = 'Red Songthaew';
                        else if (activity.transportType && (activity.transportType.toLowerCase().includes('private') || activity.transportType === 'suv')) vehicleName = 'Private Car';

                        // Get vehicle capacity (default values based on vehicle type)
                        const getVehicleCapacity = (vehicleName: string): number => {
                          switch (vehicleName.toLowerCase()) {
                            case 'private car':
                              return 4;
                            case 'private van':
                              return 8;
                            case 'suv':
                              return 6;
                            case 'mini bus':
                              return 15;
                            case 'tour bus':
                              return 45;
                            case 'taxi':
                              return 4;
                            case 'tuk tuk':
                              return 3;
                            case 'red songthaew':
                              return 10;
                            case 'shared vehicle':
                              return 12;
                            case 'shared car':
                              return 4;
                            default:
                              return 4;
                          }
                        };
                        
                        const vehicleCapacity = activity.seatingCapacity || getVehicleCapacity(vehicleName);
                        const totalPax = activity.effectivePax || 2;
                        const vehicleCount = activity.vehicleCount || Math.ceil(totalPax / vehicleCapacity);

                        // Transfer type determination
                        const getTransferType = () => {
                          if (activity.transportType && (activity.transportType.toLowerCase().includes('private') || activity.transportType === 'private_car' || activity.transportType === 'private_van' || activity.transportType === 'suv')) {
                            return 'PVT';
                          }
                          if (activity.transportType && (activity.transportType.toLowerCase().includes('shared') || activity.transportType.toLowerCase().includes('sic') || activity.transportType === 'bus' || activity.transportType === 'minibus')) {
                            return 'SIC';
                          }
                          if (activity.transportLabel && activity.transportLabel.toLowerCase().includes('private')) {
                            return 'PVT';
                          }
                          if (activity.transportLabel && activity.transportLabel.toLowerCase().includes('sic')) {
                            return 'SIC';
                          }
                          if (activity.vehicleType && activity.vehicleType.toLowerCase().includes('private')) {
                            return 'PVT';
                          }
                          return 'SIC';
                        };

                        return (
                          <div className="space-y-3">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-blue-600 dark:text-blue-400 font-medium">Vehicle:</span>
                                <span className="ml-2 text-blue-800 dark:text-blue-200 capitalize font-medium">
                                  {vehicleName}
                                </span>
                              </div>
                              <div>
                                <span className="text-blue-600 dark:text-blue-400 font-medium">Type:</span>
                                <span className="ml-2 text-blue-800 dark:text-blue-200">
                                  {getTransferType()}
                                </span>
                              </div>
                            </div>

                            {/* Capacity Information */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-blue-600 dark:text-blue-400 font-medium">Capacity:</span>
                                <span className="ml-2 text-blue-800 dark:text-blue-200">
                                  {vehicleCapacity} pax
                                </span>
                              </div>
                              <div>
                                <span className="text-blue-600 dark:text-blue-400 font-medium">Required:</span>
                                <span className="ml-2 text-blue-800 dark:text-blue-200">
                                  {vehicleCount} vehicle{vehicleCount > 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                            
                            {/* Additional Details */}
                            {(activity.transportLabel || activity.transportFrom || activity.transportTo) && (
                              <div className="space-y-2 text-xs">
                                {activity.transportLabel && (
                                  <div className="bg-white/50 dark:bg-card/50 rounded-lg px-3 py-2">
                                    <span className="text-blue-600 dark:text-blue-400 font-medium">Service:</span>
                                    <span className="ml-2 text-blue-800 dark:text-blue-200">
                                      {activity.transportLabel}
                                    </span>
                                  </div>
                                )}
                                {(activity.transportFrom || activity.transportTo) && (
                                  <div className="bg-white/50 dark:bg-card/50 rounded-lg px-3 py-2">
                                    <span className="text-blue-600 dark:text-blue-400 font-medium">Route:</span>
                                    <span className="ml-2 text-blue-800 dark:text-blue-200">
                                      {activity.transportFrom || 'Start'} → {activity.transportTo || 'End'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meals Section */}
        {getMeals().length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm font-semibold text-foreground dark:text-white">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/20 dark:from-orange-400/20 dark:to-orange-500/30 flex items-center justify-center shadow-sm border border-orange-200/50 dark:border-orange-400/20">
                <Utensils className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <span className="text-base text-foreground dark:text-white">Meals & Dining</span>
                <Badge variant="outline" className="ml-2 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-400/20 text-orange-700 dark:text-orange-300 text-xs">
                  {getMeals().length} included
                </Badge>
              </div>
            </div>
            <div className="ml-16 grid grid-cols-1 md:grid-cols-3 gap-4">
              {day.meals?.breakfast && (
                <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <Sunrise className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Breakfast</span>
                </div>
              )}
              {day.meals?.lunch && (
                <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <Sun className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Lunch</span>
                </div>
              )}
              {day.meals?.dinner && (
                <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <Moon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Dinner</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hotel Check-in/Check-out Section */}
        {(day.hotelCheckin || day.hotelCheckout) && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm font-semibold text-foreground dark:text-white">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/20 dark:from-indigo-400/20 dark:to-indigo-500/30 flex items-center justify-center shadow-sm border border-indigo-200/50 dark:border-indigo-400/20">
                <Hotel className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <span className="text-base text-foreground dark:text-white">Hotel Services</span>
              </div>
            </div>
            <div className="ml-16 space-y-3">
              {day.hotelCheckin && (
                <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center gap-3">
                    <Hotel className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <span className="font-medium text-indigo-800 dark:text-indigo-200">Check-in</span>
                      <div className="text-sm text-indigo-600 dark:text-indigo-400">
                        {day.hotelCheckin.name} • {day.hotelCheckin.checkinTime}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                    {formatCurrency(day.hotelCheckin.price || 0)}
                  </Badge>
                </div>
              )}
              {day.hotelCheckout && (
                <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center gap-3">
                    <Hotel className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <span className="font-medium text-indigo-800 dark:text-indigo-200">Check-out</span>
                      <div className="text-sm text-indigo-600 dark:text-indigo-400">
                        {day.hotelCheckout.name} • {day.hotelCheckout.checkoutTime}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                    {formatCurrency(day.hotelCheckout.price || 0)}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tour Guide & Local Services Section */}
        {(day.guideServices || day.localServices || day.guides) && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm font-semibold text-foreground dark:text-white">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-600/20 dark:from-cyan-400/20 dark:to-cyan-500/30 flex items-center justify-center shadow-sm border border-cyan-200/50 dark:border-cyan-400/20">
                <UserCheck className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <span className="text-base text-foreground dark:text-white">Tour Guide & Local Services</span>
                <Badge variant="outline" className="ml-2 bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-400/20 text-cyan-700 dark:text-cyan-300 text-xs">
                  Professional Service
                </Badge>
              </div>
            </div>
            <div className="ml-16 space-y-4">
              {day.guideServices && (
                <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <UserCheck className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                      <div>
                        <span className="font-medium text-cyan-800 dark:text-cyan-200">
                          {day.guideServices.name || 'Professional Tour Guide'}
                        </span>
                        <div className="text-sm text-cyan-600 dark:text-cyan-400">
                          {day.guideServices.languages || 'English Speaking'} • {day.guideServices.experience || 'Experienced'}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300">
                      {formatCurrency(day.guideServices.price || 0)}
                    </Badge>
                  </div>
                  {day.guideServices.specialties && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {day.guideServices.specialties.map((specialty: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-cyan-50 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-700">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact Information & Emergency Section */}
        {(day.contacts || day.emergencyInfo || day.localContacts) && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm font-semibold text-foreground dark:text-white">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/20 dark:from-green-400/20 dark:to-green-500/30 flex items-center justify-center shadow-sm border border-green-200/50 dark:border-green-400/20">
                <Phone className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <span className="text-base text-foreground dark:text-white">Contact Information</span>
                <Badge variant="outline" className="ml-2 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-400/20 text-green-700 dark:text-green-300 text-xs">
                  24/7 Support
                </Badge>
              </div>
            </div>
            <div className="ml-16 space-y-3">
              {day.contacts && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {day.contacts.phone && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">{day.contacts.phone}</span>
                    </div>
                  )}
                  {day.contacts.email && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">{day.contacts.email}</span>
                    </div>
                  )}
                  {day.contacts.whatsapp && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <HeadphonesIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">WhatsApp: {day.contacts.whatsapp}</span>
                    </div>
                  )}
                  {day.contacts.emergency && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-medium text-red-800 dark:text-red-200">Emergency: {day.contacts.emergency}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Special Services & Inclusions Section */}
        {(day.specialServices || day.inclusions || day.exclusions) && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm font-semibold text-foreground dark:text-white">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-600/20 dark:from-violet-400/20 dark:to-violet-500/30 flex items-center justify-center shadow-sm border border-violet-200/50 dark:border-violet-400/20">
                <Shield className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <span className="text-base text-foreground dark:text-white">Services & Coverage</span>
              </div>
            </div>
            <div className="ml-16 space-y-4">
              {day.inclusions && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-green-800 dark:text-green-200">Included Services</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {day.inclusions.map((inclusion: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-green-700 dark:text-green-300">{inclusion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {day.exclusions && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <span className="font-medium text-red-800 dark:text-red-200">Not Included</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {day.exclusions.map((exclusion: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-3 w-3 text-red-500" />
                        <span className="text-red-700 dark:text-red-300">{exclusion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Weather & Local Information Section */}
        {(day.weather || day.localInfo || day.tips) && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm font-semibold text-foreground dark:text-white">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/20 dark:from-amber-400/20 dark:to-amber-500/30 flex items-center justify-center shadow-sm border border-amber-200/50 dark:border-amber-400/20">
                <Globe className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <span className="text-base text-foreground dark:text-white">Local Information & Tips</span>
              </div>
            </div>
            <div className="ml-16 space-y-4">
              {day.weather && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Sun className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <span className="font-medium text-amber-800 dark:text-amber-200">Weather Information</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {day.weather.temperature && (
                      <div className="text-amber-700 dark:text-amber-300">
                        <span className="font-medium">Temp:</span> {day.weather.temperature}
                      </div>
                    )}
                    {day.weather.humidity && (
                      <div className="text-amber-700 dark:text-amber-300">
                        <span className="font-medium">Humidity:</span> {day.weather.humidity}
                      </div>
                    )}
                    {day.weather.rainfall && (
                      <div className="text-amber-700 dark:text-amber-300">
                        <span className="font-medium">Rainfall:</span> {day.weather.rainfall}
                      </div>
                    )}
                    {day.weather.season && (
                      <div className="text-amber-700 dark:text-amber-300">
                        <span className="font-medium">Season:</span> {day.weather.season}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {day.tips && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-blue-800 dark:text-blue-200">Travel Tips</span>
                  </div>
                  <div className="space-y-2">
                    {day.tips.map((tip: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <Info className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />
                        <span className="text-blue-700 dark:text-blue-300">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cost Breakdown Section */}
        {(day.costBreakdown || day.pricing) && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm font-semibold text-foreground dark:text-white">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 dark:from-emerald-400/20 dark:to-emerald-500/30 flex items-center justify-center shadow-sm border border-emerald-200/50 dark:border-emerald-400/20">
                <CreditCard className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <span className="text-base text-foreground dark:text-white">Cost Breakdown</span>
              </div>
            </div>
            <div className="ml-16">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="space-y-3">
                  {day.costBreakdown && Object.entries(day.costBreakdown).map(([category, amount]: [string, any]) => (
                    <div key={category} className="flex items-center justify-between text-sm">
                      <span className="text-emerald-700 dark:text-emerald-300 capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="font-medium text-emerald-800 dark:text-emerald-200">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                  <div className="border-t border-emerald-200 dark:border-emerald-700 pt-3 mt-3">
                    <div className="flex items-center justify-between font-bold text-base">
                      <span className="text-emerald-800 dark:text-emerald-200">Day Total</span>
                      <span className="text-emerald-800 dark:text-emerald-200">{formatCurrency(day.totalCost || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedDayCard;
