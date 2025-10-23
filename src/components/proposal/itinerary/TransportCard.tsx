
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Car, Plane, Train, Bus, Ship, MapPin, Clock, ArrowRight 
} from 'lucide-react';

interface TransportCardProps {
  transport: any;
  formatCurrency: (amount: number) => string;
}

const TransportCard: React.FC<TransportCardProps> = ({ transport, formatCurrency }) => {
  const getTransportIcon = (type: string) => {
    const iconMap = {
      'flight': Plane,
      'car': Car,
      'bus': Bus,
      'train': Train,
      'boat': Ship,
      'taxi': Car
    };
    
    return iconMap[type?.toLowerCase() as keyof typeof iconMap] || Car;
  };

  const getTransportColor = (type: string) => {
    const colorMap = {
      'flight': 'from-sky-500 to-blue-600',
      'car': 'from-green-500 to-emerald-600',
      'bus': 'from-yellow-500 to-orange-600',
      'train': 'from-purple-500 to-indigo-600',
      'boat': 'from-cyan-500 to-teal-600',
      'taxi': 'from-amber-500 to-yellow-600'
    };
    
    return colorMap[type?.toLowerCase() as keyof typeof colorMap] || colorMap.car;
  };

  const IconComponent = getTransportIcon(transport.type);
  const bgGradient = getTransportColor(transport.type);

  const getLocationName = (location: any) => {
    if (typeof location === 'string') return location;
    return location?.name || location?.city || 'Unknown';
  };

  return (
    <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
      {/* Header with gradient */}
      <div className={`bg-gradient-to-r ${bgGradient} p-3 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            <span className="font-medium capitalize">{transport.type}</span>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/20">
            {formatCurrency(transport.price || 0)}
          </Badge>
        </div>
      </div>

      {/* Transport Details */}
      <div className="p-4 space-y-3">
        {/* Route */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="font-medium">{getLocationName(transport.from)}</span>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{getLocationName(transport.to)}</span>
        </div>

        {/* Duration and Details */}
        {transport.duration && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{transport.duration}</span>
          </div>
        )}

        {transport.details && (
          <p className="text-sm text-gray-600">{transport.details}</p>
        )}
      </div>
    </div>
  );
};

export default TransportCard;
