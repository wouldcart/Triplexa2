
import React from 'react';
import { Truck } from 'lucide-react';
import { formatCurrency, formatPriceForCountry } from '../utils/currencyUtils';
import { TransportRouteType } from '../types/transportTypes';

interface RouteVehicleTypesProps {
  transportTypes: TransportRouteType[];
  country?: string;
}

const RouteVehicleTypes: React.FC<RouteVehicleTypesProps> = ({
  transportTypes,
  country
}) => {
  if (!transportTypes || transportTypes.length === 0) {
    return <span className="text-xs text-muted-foreground">No vehicles</span>;
  }
  
  return (
    <div className="space-y-1">
      {transportTypes.map((transport, idx) => (
        <div key={idx} className="flex items-center justify-between text-xs">
          <div className="flex items-center">
            <Truck className="h-3 w-3 mr-1 text-muted-foreground" />
            <span>
              {transport.type}
              {transport.vehicleName ? ` / ${transport.vehicleName}` : ''}
            </span>
          </div>
          <span className="font-medium">
            {country 
              ? formatPriceForCountry(transport.price, country) 
              : formatCurrency(transport.price)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default RouteVehicleTypes;
