import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { GuideOption } from '@/types/proposalOptions';
import { User, Languages, Clock, MapPin } from 'lucide-react';

interface GuideOptionsSelectorProps {
  options: GuideOption[];
  onToggleOption: (optionId: string) => void;
  onAddOption: (option: Partial<GuideOption>) => void;
  formatCurrency?: (amount: number) => string;
}

export const GuideOptionsSelector: React.FC<GuideOptionsSelectorProps> = ({
  options,
  onToggleOption,
  onAddOption,
  formatCurrency = (amount) => `$${amount}`
}) => {
  const sampleGuideOptions: Partial<GuideOption>[] = [
    {
      name: 'Local English Guide',
      description: 'Professional local guide fluent in English',
      type: 'optional',
      pricing: { basePrice: 150, totalPrice: 150 },
      metadata: {
        languages: ['English', 'Local Language'],
        coverage: 'city_specific',
        experience: '5+ years'
      }
    },
    {
      name: 'Multi-language Expert Guide',
      description: 'Expert guide speaking multiple languages with historical expertise',
      type: 'upgrade',
      pricing: { basePrice: 250, totalPrice: 250 },
      metadata: {
        languages: ['English', 'French', 'German', 'Local Language'],
        specialization: ['History', 'Culture', 'Architecture'],
        coverage: 'full_trip',
        experience: '10+ years'
      }
    },
    {
      name: 'Heritage Specialist Guide',
      description: 'Certified heritage guide for UNESCO sites',
      type: 'alternative',
      pricing: { basePrice: 200, totalPrice: 200 },
      metadata: {
        languages: ['English'],
        specialization: ['UNESCO Heritage', 'Archaeology'],
        coverage: 'day_specific',
        experience: '8+ years'
      }
    }
  ];

  if (options.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Guide Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Guide Options Available</h3>
            <p className="text-muted-foreground mb-4">
              Add guide services to enhance your travel experience
            </p>
            <div className="space-y-2">
              {sampleGuideOptions.map((option, index) => (
                <Button 
                  key={index}
                  variant="outline" 
                  onClick={() => onAddOption(option)}
                  className="w-full"
                >
                  Add {option.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <User className="h-5 w-5" />
          Guide Services
        </h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onAddOption(sampleGuideOptions[0])}
        >
          Add New Guide Option
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option) => (
          <Card 
            key={option.id}
            className={`transition-all duration-200 ${
              option.isSelected 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:shadow-md'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Checkbox
                    checked={option.isSelected}
                    onCheckedChange={() => onToggleOption(option.id)}
                  />
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {option.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
                <Badge variant={option.type === 'upgrade' ? 'default' : 'outline'}>
                  {option.type}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Guide Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Languages className="h-3 w-3" />
                    <span>{option.metadata.languages.join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="capitalize">{option.metadata.coverage.replace('_', ' ')}</span>
                  </div>
                </div>

                {option.metadata.specialization && (
                  <div className="flex flex-wrap gap-1">
                    {option.metadata.specialization.map((spec, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                )}

                {option.metadata.experience && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Experience:</strong> {option.metadata.experience}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    {option.metadata.coverage === 'full_trip' && 'Full trip coverage'}
                    {option.metadata.coverage === 'city_specific' && 'Per city'}
                    {option.metadata.coverage === 'day_specific' && 'Per day'}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-lg">
                      {formatCurrency(option.pricing.totalPrice)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {option.metadata.coverage === 'full_trip' ? 'Total' : 'Per unit'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};