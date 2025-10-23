import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ProposalComponentOption } from '@/types/proposalOptions';
import { Clock, MapPin, Users, DollarSign, Info } from 'lucide-react';

interface OptionSelectionCardProps {
  option: ProposalComponentOption;
  onToggle: (optionId: string) => void;
  onUpdate?: (optionId: string, updates: Partial<ProposalComponentOption>) => void;
  formatCurrency?: (amount: number) => string;
  mode?: 'toggle' | 'checkbox' | 'radio';
  showDetails?: boolean;
  disabled?: boolean;
}

export const OptionSelectionCard: React.FC<OptionSelectionCardProps> = ({
  option,
  onToggle,
  onUpdate,
  formatCurrency = (amount) => `$${amount}`,
  mode = 'toggle',
  showDetails = true,
  disabled = false
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'standard': return 'bg-green-100 text-green-800 border-green-200';
      case 'optional': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'alternative': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'upgrade': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComponentIcon = (componentType: string) => {
    switch (componentType) {
      case 'sightseeing': return <MapPin className="h-4 w-4" />;
      case 'transfer': return <Clock className="h-4 w-4" />;
      case 'dining': return <Users className="h-4 w-4" />;
      case 'guide': return <Info className="h-4 w-4" />;
      case 'activity': return <MapPin className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const renderSelectionControl = () => {
    switch (mode) {
      case 'checkbox':
        return (
          <Checkbox
            checked={option.isSelected}
            onCheckedChange={() => onToggle(option.id)}
            disabled={disabled}
          />
        );
      case 'radio':
        return (
          <input
            type="radio"
            checked={option.isSelected}
            onChange={() => onToggle(option.id)}
            disabled={disabled}
            className="h-4 w-4 text-primary focus:ring-primary"
          />
        );
      default:
        return (
          <Switch
            checked={option.isSelected}
            onCheckedChange={() => onToggle(option.id)}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <Card className={`transition-all duration-200 ${
      option.isSelected 
        ? 'ring-2 ring-primary bg-primary/5' 
        : 'hover:shadow-md'
    } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex items-center gap-2">
              {getComponentIcon(option.componentType)}
              <CardTitle className="text-base">{option.name}</CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getTypeColor(option.type)}>
              {option.type}
            </Badge>
            {renderSelectionControl()}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {option.description && (
          <p className="text-sm text-muted-foreground mb-3">
            {option.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {option.metadata?.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{option.metadata.duration}</span>
              </div>
            )}
            {option.metadata?.capacity && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{option.metadata.capacity}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="font-semibold text-lg">
                {formatCurrency(option.pricing.totalPrice)}
              </div>
              {option.pricing.adultPrice && option.pricing.childPrice && (
                <div className="text-xs text-muted-foreground">
                  Adult: {formatCurrency(option.pricing.adultPrice)} | 
                  Child: {formatCurrency(option.pricing.childPrice)}
                </div>
              )}
            </div>
          </div>
        </div>

        {showDetails && option.conditions && option.conditions.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-xs text-muted-foreground">
              <strong>Conditions:</strong> {option.conditions.join(', ')}
            </div>
          </div>
        )}

        {showDetails && option.type === 'upgrade' && (
          <div className="mt-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => onToggle(option.id)}
              disabled={disabled}
            >
              {option.isSelected ? 'Remove Upgrade' : 'Add Upgrade'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};