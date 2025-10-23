import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calculator, Car, DollarSign, Users, Zap, Shield, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

// Validation Schema
const smartCombinationSchema = z.object({
  priority: z.enum(['cost', 'comfort', 'speed', 'efficiency']),
  preferFewerVehicles: z.boolean().default(true),
  includePremiumOptions: z.boolean().default(false),
  requireWheelchairAccess: z.boolean().default(false),
  requireExtraLuggage: z.boolean().default(false),
  maxVehicleCount: z.number().min(1).max(10).default(5),
  routeDistance: z.number().optional(),
  specialRequirements: z.array(z.string()).default([])
});

type SmartCombinationFormData = z.infer<typeof smartCombinationSchema>;

export interface VehicleOption {
  type: string;
  capacity: number;
  price: number;
  features: string[];
  wheelchairAccessible?: boolean;
  premiumLevel?: 'standard' | 'premium' | 'luxury';
}

export interface SmartCombination {
  vehicles: Array<{ type: string; count: number; price: number; capacity: number }>;
  totalCapacity: number;
  totalPrice: number;
  vehicleCount: number;
  efficiency: number;
  comfortScore: number;
  recommendation: string;
}

interface SmartCombinationFormProps {
  totalPax: number;
  availableVehicles: VehicleOption[];
  currency: string;
  routeDistance?: number;
  onSelectionChange: (combination: SmartCombination) => void;
  onFormDataChange?: (formData: SmartCombinationFormData) => void;
  className?: string;
}

export const SmartCombinationForm: React.FC<SmartCombinationFormProps> = ({
  totalPax,
  availableVehicles,
  currency,
  routeDistance,
  onSelectionChange,
  onFormDataChange,
  className
}) => {
  const [suggestedCombinations, setSuggestedCombinations] = React.useState<SmartCombination[]>([]);
  const [selectedCombination, setSelectedCombination] = React.useState<SmartCombination | null>(null);

  const form = useForm<SmartCombinationFormData>({
    resolver: zodResolver(smartCombinationSchema),
    defaultValues: {
      priority: 'efficiency',
      preferFewerVehicles: true,
      includePremiumOptions: false,
      requireWheelchairAccess: false,
      requireExtraLuggage: false,
      maxVehicleCount: 5,
      routeDistance,
      specialRequirements: []
    }
  });

  const watchedValues = form.watch();

  // Calculate optimal combinations based on form criteria
  const calculateOptimalCombinations = React.useCallback((formData: SmartCombinationFormData) => {
    const combinations: SmartCombination[] = [];
    
    // Filter vehicles based on requirements
    let eligibleVehicles = availableVehicles.filter(vehicle => {
      if (formData.requireWheelchairAccess && !vehicle.wheelchairAccessible) return false;
      if (!formData.includePremiumOptions && vehicle.premiumLevel === 'luxury') return false;
      return true;
    });

    // Generate combinations
    const generateCombination = (vehicles: VehicleOption[], targetCapacity: number) => {
      const results: SmartCombination[] = [];
      
      // Simple greedy algorithm for different priorities
      switch (formData.priority) {
        case 'cost':
          // Prioritize cheapest vehicles first
          eligibleVehicles.sort((a, b) => a.price - b.price);
          break;
        case 'comfort':
          // Prioritize larger capacity vehicles
          eligibleVehicles.sort((a, b) => b.capacity - a.capacity);
          break;
        case 'speed':
          // Prioritize fewer vehicles (larger capacity)
          eligibleVehicles.sort((a, b) => b.capacity - a.capacity);
          break;
        case 'efficiency':
          // Balance price per seat
          eligibleVehicles.sort((a, b) => (a.price / a.capacity) - (b.price / b.capacity));
          break;
      }

      // Generate multiple combinations
      for (let i = 0; i < Math.min(3, eligibleVehicles.length); i++) {
        const primaryVehicle = eligibleVehicles[i];
        const primaryCount = Math.ceil(targetCapacity / primaryVehicle.capacity);
        
        if (primaryCount <= formData.maxVehicleCount) {
          const combination: SmartCombination = {
            vehicles: [{ 
              type: primaryVehicle.type, 
              count: primaryCount, 
              price: primaryVehicle.price,
              capacity: primaryVehicle.capacity 
            }],
            totalCapacity: primaryCount * primaryVehicle.capacity,
            totalPrice: primaryCount * primaryVehicle.price,
            vehicleCount: primaryCount,
            efficiency: calculateEfficiency(primaryCount, primaryVehicle, targetCapacity),
            comfortScore: calculateComfortScore(primaryVehicle, primaryCount),
            recommendation: getRecommendationText(formData.priority, primaryVehicle, primaryCount)
          };
          results.push(combination);
        }

        // Try mixed combinations if there are multiple vehicle types
        if (eligibleVehicles.length > 1 && formData.preferFewerVehicles) {
          const secondaryVehicle = eligibleVehicles[(i + 1) % eligibleVehicles.length];
          const mixedCombination = generateMixedCombination(
            primaryVehicle, 
            secondaryVehicle, 
            targetCapacity, 
            formData
          );
          if (mixedCombination) results.push(mixedCombination);
        }
      }

      return results;
    };

    const newCombinations = generateCombination(eligibleVehicles, totalPax);
    
    // Sort by priority criteria
    newCombinations.sort((a, b) => {
      switch (formData.priority) {
        case 'cost': return a.totalPrice - b.totalPrice;
        case 'comfort': return b.comfortScore - a.comfortScore;
        case 'speed': return a.vehicleCount - b.vehicleCount;
        case 'efficiency': return b.efficiency - a.efficiency;
        default: return 0;
      }
    });

    return newCombinations.slice(0, 4); // Top 4 combinations
  }, [availableVehicles, totalPax]);

  // Helper functions
  const calculateEfficiency = (vehicleCount: number, vehicle: VehicleOption, targetCapacity: number) => {
    const utilizationRate = targetCapacity / (vehicleCount * vehicle.capacity);
    const priceEfficiency = 1 / (vehicle.price / vehicle.capacity);
    return utilizationRate * priceEfficiency;
  };

  const calculateComfortScore = (vehicle: VehicleOption, count: number) => {
    let score = vehicle.capacity * 10; // Base score
    if (vehicle.premiumLevel === 'premium') score += 20;
    if (vehicle.premiumLevel === 'luxury') score += 40;
    if (vehicle.wheelchairAccessible) score += 15;
    return score / count; // Penalize more vehicles
  };

  const getRecommendationText = (priority: string, vehicle: VehicleOption, count: number) => {
    switch (priority) {
      case 'cost': return `Most economical option with ${vehicle.type}`;
      case 'comfort': return `Maximum comfort with ${vehicle.premiumLevel || 'standard'} vehicles`;
      case 'speed': return `Fastest setup with ${count} vehicle${count > 1 ? 's' : ''}`;
      case 'efficiency': return `Best balance of cost and capacity`;
      default: return `Recommended ${vehicle.type} configuration`;
    }
  };

  const generateMixedCombination = (
    primary: VehicleOption, 
    secondary: VehicleOption, 
    targetCapacity: number,
    formData: SmartCombinationFormData
  ): SmartCombination | null => {
    const primaryCount = Math.floor(targetCapacity / primary.capacity);
    const remainingCapacity = targetCapacity - (primaryCount * primary.capacity);
    const secondaryCount = Math.ceil(remainingCapacity / secondary.capacity);
    
    if (primaryCount + secondaryCount <= formData.maxVehicleCount && remainingCapacity > 0) {
      return {
        vehicles: [
          { type: primary.type, count: primaryCount, price: primary.price, capacity: primary.capacity },
          { type: secondary.type, count: secondaryCount, price: secondary.price, capacity: secondary.capacity }
        ],
        totalCapacity: (primaryCount * primary.capacity) + (secondaryCount * secondary.capacity),
        totalPrice: (primaryCount * primary.price) + (secondaryCount * secondary.price),
        vehicleCount: primaryCount + secondaryCount,
        efficiency: calculateEfficiency(primaryCount + secondaryCount, primary, targetCapacity),
        comfortScore: (calculateComfortScore(primary, primaryCount) + calculateComfortScore(secondary, secondaryCount)) / 2,
        recommendation: `Mixed fleet: ${primary.type} + ${secondary.type}`
      };
    }
    return null;
  };

  // Update combinations when form data changes
  React.useEffect(() => {
    const newCombinations = calculateOptimalCombinations(watchedValues);
    setSuggestedCombinations(newCombinations);
    
    // Auto-select the first (best) combination
    if (newCombinations.length > 0 && !selectedCombination) {
      setSelectedCombination(newCombinations[0]);
      onSelectionChange(newCombinations[0]);
    }
    
    onFormDataChange?.(watchedValues);
  }, [watchedValues, calculateOptimalCombinations, selectedCombination, onSelectionChange, onFormDataChange]);

  const handleCombinationSelect = (combination: SmartCombination) => {
    setSelectedCombination(combination);
    onSelectionChange(combination);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'cost': return <DollarSign className="h-4 w-4" />;
      case 'comfort': return <Shield className="h-4 w-4" />;
      case 'speed': return <Zap className="h-4 w-4" />;
      case 'efficiency': return <Calculator className="h-4 w-4" />;
      default: return <Calculator className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5 text-blue-600" />
          Smart Vehicle Combinations
          <Badge variant="secondary" className="ml-auto">
            {totalPax} passengers
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Form {...form}>
          <form className="space-y-4">
            {/* Priority Selection */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    {getPriorityIcon(field.value)}
                    Optimization Priority
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cost">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Lowest Cost
                        </div>
                      </SelectItem>
                      <SelectItem value="comfort">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Maximum Comfort
                        </div>
                      </SelectItem>
                      <SelectItem value="speed">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Fastest Setup
                        </div>
                      </SelectItem>
                      <SelectItem value="efficiency">
                        <div className="flex items-center gap-2">
                          <Calculator className="h-4 w-4" />
                          Best Balance
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preferences */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="preferFewerVehicles"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm">
                        Prefer fewer vehicles
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="includePremiumOptions"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm">
                        Include premium options
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Special Requirements */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="requireWheelchairAccess"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm">
                        Wheelchair accessible
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requireExtraLuggage"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm">
                        Extra luggage space
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>

        {/* Smart Combinations Results */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Recommended Combinations</Label>
            <Badge variant="outline" className="text-xs">
              {suggestedCombinations.length} options
            </Badge>
          </div>

          {suggestedCombinations.map((combination, index) => (
            <div
              key={index}
              className={cn(
                "p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
                selectedCombination === combination
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                  : "border-border hover:border-blue-300"
              )}
              onClick={() => handleCombinationSelect(combination)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 transition-colors",
                    selectedCombination === combination
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  )}>
                    {selectedCombination === combination && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm">
                        {combination.vehicles.map(v => `${v.count}x ${v.type}`).join(' + ')}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {combination.recommendation}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {combination.totalCapacity} seats
                      </span>
                      <span className="flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        {combination.vehicleCount} vehicle{combination.vehicleCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {currency} {combination.totalPrice}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(combination.efficiency * 100)}% efficient
                  </div>
                </div>
              </div>
            </div>
          ))}

          {suggestedCombinations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No suitable combinations found</p>
              <p className="text-xs">Try adjusting your requirements</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};