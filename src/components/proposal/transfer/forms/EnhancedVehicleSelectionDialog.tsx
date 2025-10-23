import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SmartCombinationForm, SmartCombination, VehicleOption } from './SmartCombinationForm';
import { ManualVehicleSelectionForm, ManualVehicleSelection } from './ManualVehicleSelectionForm';
import { Calculator, Settings, Zap, Users, Car, DollarSign, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VehicleSelectionResult {
  type: 'smart' | 'manual';
  smartCombination?: SmartCombination;
  manualSelection?: ManualVehicleSelection;
  totalPrice: number;
  totalCapacity: number;
  totalVehicles: number;
  summary: string;
}

interface EnhancedVehicleSelectionDialogProps {
  totalPax: number;
  availableVehicles: VehicleOption[];
  currency: string;
  routeDistance?: number;
  onSelectionConfirm: (result: VehicleSelectionResult) => void;
  children: React.ReactNode;
  defaultTab?: 'smart' | 'manual';
  initialManualSelections?: Array<{ vehicleType: string; quantity: number; priceOverride?: number }>;
}

export const EnhancedVehicleSelectionDialog: React.FC<EnhancedVehicleSelectionDialogProps> = ({
  totalPax,
  availableVehicles,
  currency,
  routeDistance,
  onSelectionConfirm,
  children,
  defaultTab = 'smart',
  initialManualSelections
}) => {
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(defaultTab);
  const [smartSelection, setSmartSelection] = React.useState<SmartCombination | null>(null);
  const [manualSelection, setManualSelection] = React.useState<ManualVehicleSelection | null>(null);

  const handleSmartSelectionChange = (combination: SmartCombination) => {
    setSmartSelection(combination);
  };

  const handleManualSelectionChange = (selection: ManualVehicleSelection) => {
    setManualSelection(selection);
  };

  const handleConfirm = () => {
    if (activeTab === 'smart' && smartSelection) {
      const result: VehicleSelectionResult = {
        type: 'smart',
        smartCombination: smartSelection,
        totalPrice: smartSelection.totalPrice,
        totalCapacity: smartSelection.totalCapacity,
        totalVehicles: smartSelection.vehicleCount,
        summary: `Smart: ${smartSelection.vehicles.map(v => `${v.count}x ${v.type}`).join(' + ')}`
      };
      onSelectionConfirm(result);
      setOpen(false);
    } else if (activeTab === 'manual' && manualSelection) {
      const result: VehicleSelectionResult = {
        type: 'manual',
        manualSelection: manualSelection,
        totalPrice: manualSelection.totalPrice,
        totalCapacity: manualSelection.totalCapacity,
        totalVehicles: manualSelection.totalVehicles,
        summary: `Manual: ${manualSelection.selections.map(s => `${s.quantity}x ${s.vehicleType}`).join(' + ')}`
      };
      onSelectionConfirm(result);
      setOpen(false);
    }
  };

  const getCurrentSelection = () => {
    if (activeTab === 'smart') return smartSelection;
    if (activeTab === 'manual') return manualSelection;
    return null;
  };

  const isValidSelection = () => {
    const selection = getCurrentSelection();
    if (!selection) return false;
    
    if (activeTab === 'smart') {
      return smartSelection && smartSelection.totalCapacity >= totalPax;
    } else {
      return manualSelection && manualSelection.totalCapacity >= totalPax && manualSelection.selections.length > 0;
    }
  };

  const getSelectionSummary = () => {
    const selection = getCurrentSelection();
    if (!selection) return null;

    if (activeTab === 'smart' && smartSelection) {
      return {
        vehicles: smartSelection.vehicleCount,
        capacity: smartSelection.totalCapacity,
        price: smartSelection.totalPrice,
        description: smartSelection.vehicles.map(v => `${v.count}x ${v.type}`).join(' + ')
      };
    } else if (activeTab === 'manual' && manualSelection) {
      return {
        vehicles: manualSelection.totalVehicles,
        capacity: manualSelection.totalCapacity,
        price: manualSelection.totalPrice,
        description: manualSelection.selections.map(s => `${s.quantity}x ${s.vehicleType}`).join(' + ')
      };
    }
    return null;
  };

  const summary = getSelectionSummary();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        {/* Clean Header with Status Indicators */}
        <div className="border-b bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-t-lg p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Transfer Config</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Choose optimal vehicle configuration
                </p>
              </div>
            </div>
            
            {/* Status Indicators */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <Users className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{totalPax} pax</span>
              </div>
              {summary && (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">{summary.capacity} seats</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-semibold text-green-900 dark:text-green-100">
                      {currency} {summary.price}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden p-6 pt-2">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'smart' | 'manual')} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 dark:bg-slate-800 p-1">
              <TabsTrigger 
                value="smart" 
                className="flex items-center gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Calculator className="h-4 w-4" />
                <span className="font-medium">Smart Combinations</span>
                {smartSelection && (
                  <Badge variant="secondary" className="ml-2 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {smartSelection.vehicleCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="manual" 
                className="flex items-center gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Settings className="h-4 w-4" />
                <span className="font-medium">Manual Selection</span>
                {manualSelection && (
                  <Badge variant="secondary" className="ml-2 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {manualSelection.totalVehicles}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto">
              <TabsContent value="smart" className="mt-0 h-full">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <SmartCombinationForm
                    totalPax={totalPax}
                    availableVehicles={availableVehicles}
                    currency={currency}
                    routeDistance={routeDistance}
                    onSelectionChange={handleSmartSelectionChange}
                  />
                </div>
              </TabsContent>

              <TabsContent value="manual" className="mt-0 h-full">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <ManualVehicleSelectionForm
                    totalPax={totalPax}
                    availableVehicles={availableVehicles}
                    currency={currency}
                    onSelectionChange={handleManualSelectionChange}
                    initialSelections={initialManualSelections}
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Enhanced Summary and Actions */}
        <div className="border-t bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 space-y-4">
          {/* Current Configuration Display */}
          {summary && (
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={activeTab === 'smart' ? 'default' : 'secondary'} 
                    className={cn(
                      "px-2 py-1",
                      activeTab === 'smart' 
                        ? "bg-blue-600 text-white" 
                        : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                    )}
                  >
                    {activeTab === 'smart' ? 'Smart' : 'Manual'} Configuration
                  </Badge>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {summary.description}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {summary.vehicles}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      vehicle{summary.vehicles > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {summary.capacity}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      seats total
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    summary.capacity >= totalPax 
                      ? "bg-green-100 dark:bg-green-900/30" 
                      : "bg-red-100 dark:bg-red-900/30"
                  )}>
                    <CheckCircle className={cn(
                      "h-4 w-4",
                      summary.capacity >= totalPax 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-red-600 dark:text-red-400"
                    )} />
                  </div>
                  <div>
                    <div className={cn(
                      "text-sm font-medium",
                      summary.capacity >= totalPax 
                        ? "text-green-700 dark:text-green-300" 
                        : "text-red-700 dark:text-red-300"
                    )}>
                      {summary.capacity >= totalPax ? 'Optimal Configuration' : 'Insufficient Capacity'}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      {summary.capacity >= totalPax 
                        ? 'Perfect capacity utilization with minimal excess seats.'
                        : `Need ${totalPax - summary.capacity} more seats`
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="px-6"
            >
              Cancel
            </Button>
            
            <div className="flex gap-3">
              {activeTab === 'manual' && (
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('smart')}
                  className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Try Smart Suggestion
                </Button>
              )}
              
              <Button
                onClick={handleConfirm}
                disabled={!isValidSelection()}
                className={cn(
                  "min-w-[140px] font-medium",
                  isValidSelection() 
                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                    : "bg-slate-300 text-slate-500 cursor-not-allowed"
                )}
              >
                {isValidSelection() ? 'Confirm Selection' : 'Select Vehicles'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};