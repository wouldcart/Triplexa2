import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Car, Users, DollarSign, TrendingUp, 
  AlertTriangle, CheckCircle2, Zap,
  RotateCcw, Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VehicleOption {
  id: string;
  name: string;
  capacity: number;
  pricePerDay: number;
  type: 'economy' | 'standard' | 'premium' | 'luxury';
}

interface OptimizationResult {
  vehicles: { option: VehicleOption; count: number }[];
  totalCost: number;
  totalCapacity: number;
  utilization: number;
  efficiency: number;
  environmentalScore: number;
}

interface VehicleCapacityOptimizerProps {
  totalPax: number;
  availableVehicles: VehicleOption[];
  currentSelection?: { option: VehicleOption; count: number }[];
  onOptimizationSelect: (result: OptimizationResult) => void;
  className?: string;
}

export const VehicleCapacityOptimizer: React.FC<VehicleCapacityOptimizerProps> = ({
  totalPax,
  availableVehicles,
  currentSelection = [],
  onOptimizationSelect,
  className
}) => {
  const [priorityWeight, setPriorityWeight] = useState([50]); // 0-100: cost vs comfort
  const [showComparison, setShowComparison] = useState(false);

  // Generate optimization scenarios
  const optimizationScenarios = useMemo(() => {
    const scenarios: OptimizationResult[] = [];
    
    // Scenario 1: Most cost-effective
    const costEffective = generateCostEffectiveScenario();
    if (costEffective) scenarios.push(costEffective);
    
    // Scenario 2: Best utilization
    const bestUtilization = generateBestUtilizationScenario();
    if (bestUtilization) scenarios.push(bestUtilization);
    
    // Scenario 3: Balanced approach
    const balanced = generateBalancedScenario();
    if (balanced) scenarios.push(balanced);
    
    // Scenario 4: Premium comfort
    const premium = generatePremiumScenario();
    if (premium) scenarios.push(premium);

    return scenarios.filter(s => s.totalCapacity >= totalPax);
  }, [totalPax, availableVehicles]);

  function generateCostEffectiveScenario(): OptimizationResult | null {
    // Sort vehicles by cost per seat
    const sortedVehicles = [...availableVehicles].sort((a, b) => 
      (a.pricePerDay / a.capacity) - (b.pricePerDay / b.capacity)
    );
    
    const vehicles: { option: VehicleOption; count: number }[] = [];
    let remainingPax = totalPax;
    
    for (const vehicle of sortedVehicles) {
      if (remainingPax <= 0) break;
      
      const neededCount = Math.ceil(remainingPax / vehicle.capacity);
      vehicles.push({ option: vehicle, count: neededCount });
      remainingPax -= vehicle.capacity * neededCount;
    }
    
    return calculateScenarioMetrics(vehicles);
  }

  function generateBestUtilizationScenario(): OptimizationResult | null {
    let bestResult: OptimizationResult | null = null;
    let bestUtilization = 0;
    
    // Try different combinations
    for (const vehicle of availableVehicles) {
      const count = Math.ceil(totalPax / vehicle.capacity);
      const vehicles = [{ option: vehicle, count }];
      const result = calculateScenarioMetrics(vehicles);
      
      if (result && result.utilization > bestUtilization) {
        bestUtilization = result.utilization;
        bestResult = result;
      }
    }
    
    return bestResult;
  }

  function generateBalancedScenario(): OptimizationResult | null {
    // Try to mix vehicle types for optimal balance
    const midCapacityVehicles = availableVehicles.filter(v => v.capacity >= 4 && v.capacity <= 8);
    if (midCapacityVehicles.length === 0) return generateCostEffectiveScenario();
    
    const bestVehicle = midCapacityVehicles.reduce((best, current) => 
      (current.pricePerDay / current.capacity) < (best.pricePerDay / best.capacity) ? current : best
    );
    
    const count = Math.ceil(totalPax / bestVehicle.capacity);
    const vehicles = [{ option: bestVehicle, count }];
    
    return calculateScenarioMetrics(vehicles);
  }

  function generatePremiumScenario(): OptimizationResult | null {
    const premiumVehicles = availableVehicles.filter(v => 
      v.type === 'premium' || v.type === 'luxury'
    );
    
    if (premiumVehicles.length === 0) return null;
    
    const bestPremium = premiumVehicles.reduce((best, current) => 
      current.capacity > best.capacity ? current : best
    );
    
    const count = Math.ceil(totalPax / bestPremium.capacity);
    const vehicles = [{ option: bestPremium, count }];
    
    return calculateScenarioMetrics(vehicles);
  }

  function calculateScenarioMetrics(vehicles: { option: VehicleOption; count: number }[]): OptimizationResult {
    const totalCost = vehicles.reduce((sum, v) => sum + (v.option.pricePerDay * v.count), 0);
    const totalCapacity = vehicles.reduce((sum, v) => sum + (v.option.capacity * v.count), 0);
    const utilization = (totalPax / totalCapacity) * 100;
    const efficiency = totalPax / totalCost * 1000; // passengers per $1000
    const environmentalScore = 100 - (vehicles.length * 10); // fewer vehicles = better score
    
    return {
      vehicles,
      totalCost,
      totalCapacity,
      utilization,
      efficiency,
      environmentalScore: Math.max(environmentalScore, 0)
    };
  }

  const currentScenario = useMemo(() => {
    if (currentSelection.length === 0) return null;
    return calculateScenarioMetrics(currentSelection);
  }, [currentSelection, totalPax]);

  const getScenarioLabel = (index: number) => {
    const labels = ['Most Cost-Effective', 'Best Utilization', 'Balanced Choice', 'Premium Comfort'];
    return labels[index] || `Option ${index + 1}`;
  };

  const getScenarioIcon = (index: number) => {
    const icons = [DollarSign, TrendingUp, CheckCircle2, Car];
    const Icon = icons[index] || Car;
    return <Icon className="h-4 w-4" />;
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (utilization >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Current Selection Alert */}
      {currentScenario && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <Car className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                Current selection: {currentScenario.utilization.toFixed(1)}% utilization, 
                ${currentScenario.totalCost} total cost
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
              >
                {showComparison ? 'Hide' : 'Compare'} Options
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Priority Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Optimization Priority
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Cost Focus</span>
              <span>Comfort Focus</span>
            </div>
            <Slider
              value={priorityWeight}
              onValueChange={setPriorityWeight}
              max={100}
              step={10}
              className="w-full"
            />
            <div className="text-center text-sm text-muted-foreground">
              Current priority: {priorityWeight[0] < 30 ? 'Cost-focused' : 
                              priorityWeight[0] > 70 ? 'Comfort-focused' : 'Balanced'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Scenarios */}
      <div className="grid gap-4">
        {optimizationScenarios.map((scenario, index) => (
          <Card 
            key={index}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              getUtilizationColor(scenario.utilization)
            )}
            onClick={() => onOptimizationSelect(scenario)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getScenarioIcon(index)}
                  <h4 className="font-medium">{getScenarioLabel(index)}</h4>
                </div>
                <Badge variant="outline" className="text-xs">
                  {scenario.utilization.toFixed(1)}% utilization
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Cost:</span>
                  <div className="font-bold">${scenario.totalCost}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Vehicles:</span>
                  <div className="font-medium">
                    {scenario.vehicles.reduce((sum, v) => sum + v.count, 0)} total
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Capacity:</span>
                  <div className="font-medium">{scenario.totalCapacity} seats</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Efficiency:</span>
                  <div className="font-medium">{scenario.efficiency.toFixed(1)}/1k</div>
                </div>
              </div>

              {/* Vehicle breakdown */}
              <div className="mt-3 space-y-1">
                {scenario.vehicles.map((vehicle, vIndex) => (
                  <div key={vIndex} className="flex items-center justify-between text-xs">
                    <span>{vehicle.count}x {vehicle.option.name}</span>
                    <span>${vehicle.option.pricePerDay * vehicle.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison Table */}
      {showComparison && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Scenario</th>
                    <th className="text-right p-2">Cost</th>
                    <th className="text-right p-2">Vehicles</th>
                    <th className="text-right p-2">Utilization</th>
                    <th className="text-right p-2">Efficiency</th>
                    <th className="text-right p-2">Eco Score</th>
                  </tr>
                </thead>
                <tbody>
                  {optimizationScenarios.map((scenario, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{getScenarioLabel(index)}</td>
                      <td className="p-2 text-right">${scenario.totalCost}</td>
                      <td className="p-2 text-right">
                        {scenario.vehicles.reduce((sum, v) => sum + v.count, 0)}
                      </td>
                      <td className="p-2 text-right">{scenario.utilization.toFixed(1)}%</td>
                      <td className="p-2 text-right">{scenario.efficiency.toFixed(1)}</td>
                      <td className="p-2 text-right">{scenario.environmentalScore}/100</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimization Tips */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <h5 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                Optimization Tips
              </h5>
              <ul className="text-amber-700 dark:text-amber-300 space-y-1">
                <li>• Higher utilization (80%+) indicates efficient vehicle usage</li>
                <li>• Consider comfort needs for longer journeys</li>
                <li>• Fewer vehicles reduce environmental impact</li>
                <li>• Factor in luggage space requirements</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};