import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Minus, Car, Users, DollarSign, AlertTriangle, Trash2, Settings, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VehicleOption } from './SmartCombinationForm';

// Validation Schema
const vehicleSelectionSchema = z.object({
  vehicleType: z.string().min(1, "Vehicle type is required"),
  quantity: z.number().min(1, "Quantity must be at least 1").max(20, "Quantity cannot exceed 20"),
  priceOverride: z.number().optional(),
});

const manualSelectionSchema = z.object({
  selections: z.array(vehicleSelectionSchema).min(1, "At least one vehicle selection is required"),
  totalBudget: z.number().optional(),
  notes: z.string().optional(),
});

type VehicleSelectionData = z.infer<typeof vehicleSelectionSchema>;
type ManualSelectionFormData = z.infer<typeof manualSelectionSchema>;

export interface ManualVehicleSelection {
  selections: Array<{
    vehicleType: string;
    quantity: number;
    pricePerVehicle: number;
    capacity: number;
    subtotal: number;
  }>;
  totalCapacity: number;
  totalPrice: number;
  totalVehicles: number;
  capacityUtilization: number;
  warnings: string[];
}

interface ManualVehicleSelectionFormProps {
  totalPax: number;
  availableVehicles: VehicleOption[];
  currency: string;
  onSelectionChange: (selection: ManualVehicleSelection) => void;
  onFormDataChange?: (formData: ManualSelectionFormData) => void;
  className?: string;
  initialSelections?: Array<{ vehicleType: string; quantity: number; priceOverride?: number }>;
}

export const ManualVehicleSelectionForm: React.FC<ManualVehicleSelectionFormProps> = ({
  totalPax,
  availableVehicles,
  currency,
  onSelectionChange,
  onFormDataChange,
  className,
  initialSelections = []
}) => {
  const [currentSelection, setCurrentSelection] = React.useState<ManualVehicleSelection | null>(null);

  const form = useForm<ManualSelectionFormData>({
    resolver: zodResolver(manualSelectionSchema),
    defaultValues: {
      selections: initialSelections.length > 0 
        ? initialSelections.map(sel => ({
            vehicleType: sel.vehicleType,
            quantity: sel.quantity,
            priceOverride: sel.priceOverride
          }))
        : [{ vehicleType: '', quantity: 1, priceOverride: undefined }],
      totalBudget: undefined,
      notes: ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "selections"
  });

  const watchedSelections = form.watch("selections");

  // Calculate current selection details
  const calculateSelection = React.useCallback((selections: VehicleSelectionData[]) => {
    const processedSelections = selections
      .filter(sel => sel.vehicleType && sel.quantity > 0)
      .map(sel => {
        const vehicleInfo = availableVehicles.find(v => v.type === sel.vehicleType);
        if (!vehicleInfo) return null;

        const pricePerVehicle = sel.priceOverride ?? vehicleInfo.price;
        return {
          vehicleType: sel.vehicleType,
          quantity: sel.quantity,
          pricePerVehicle,
          capacity: vehicleInfo.capacity,
          subtotal: sel.quantity * pricePerVehicle
        };
      })
      .filter(Boolean) as ManualVehicleSelection['selections'];

    const totalCapacity = processedSelections.reduce((sum, sel) => sum + (sel.quantity * sel.capacity), 0);
    const totalPrice = processedSelections.reduce((sum, sel) => sum + sel.subtotal, 0);
    const totalVehicles = processedSelections.reduce((sum, sel) => sum + sel.quantity, 0);
    const capacityUtilization = totalCapacity > 0 ? (totalPax / totalCapacity) * 100 : 0;

    // Generate warnings
    const warnings: string[] = [];
    if (totalCapacity < totalPax) {
      warnings.push(`Insufficient capacity: ${totalCapacity} seats for ${totalPax} passengers`);
    }
    if (capacityUtilization < 50 && totalCapacity >= totalPax) {
      warnings.push(`Low utilization: Only ${Math.round(capacityUtilization)}% capacity used`);
    }
    if (totalVehicles > 5) {
      warnings.push(`High vehicle count: ${totalVehicles} vehicles may be inefficient`);
    }

    return {
      selections: processedSelections,
      totalCapacity,
      totalPrice,
      totalVehicles,
      capacityUtilization,
      warnings
    };
  }, [availableVehicles, totalPax]);

  // Update selection when form data changes
  React.useEffect(() => {
    const selection = calculateSelection(watchedSelections);
    setCurrentSelection(selection);
    onSelectionChange(selection);
    onFormDataChange?.(form.getValues());
  }, [watchedSelections, calculateSelection, onSelectionChange, onFormDataChange, form]);

  const addVehicleSelection = () => {
    append({ vehicleType: '', quantity: 1, priceOverride: undefined });
  };

  const removeVehicleSelection = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const getVehicleInfo = (vehicleType: string) => {
    return availableVehicles.find(v => v.type === vehicleType);
  };

  const quickAddVehicle = (vehicleType: string) => {
    const existingIndex = watchedSelections.findIndex(sel => sel.vehicleType === vehicleType);
    if (existingIndex >= 0) {
      const currentQuantity = watchedSelections[existingIndex].quantity;
      form.setValue(`selections.${existingIndex}.quantity`, currentQuantity + 1);
    } else {
      append({ vehicleType, quantity: 1, priceOverride: undefined });
    }
  };

  const getCapacityStatusColor = (utilization: number, hasCapacity: boolean) => {
    if (!hasCapacity) return 'text-red-600 dark:text-red-400';
    if (utilization > 80) return 'text-green-600 dark:text-green-400';
    if (utilization > 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="h-5 w-5 text-purple-600" />
          Manual Vehicle Selection
          <Badge variant="secondary" className="ml-auto">
            {totalPax} passengers
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <Form {...form}>
          <form className="space-y-6">
            {/* Quick Add Section */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Quick Add Vehicles</Label>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {availableVehicles.map((vehicle) => (
                  <Button
                    key={vehicle.type}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => quickAddVehicle(vehicle.type)}
                    className="justify-start text-left h-auto p-3"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Car className="h-3 w-3" />
                        <span className="font-medium text-xs">{vehicle.type}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {vehicle.capacity} seats • {currency} {vehicle.price}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Vehicle Selections */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Vehicle Configuration</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVehicleSelection}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Vehicle
                </Button>
              </div>

              {fields.map((field, index) => {
                const selection = watchedSelections[index];
                const vehicleInfo = selection ? getVehicleInfo(selection.vehicleType) : null;
                const basePrice = vehicleInfo?.price || 0;
                const overridePrice = selection?.priceOverride;
                const finalPrice = overridePrice ?? basePrice;

                return (
                  <Card key={field.id} className="p-4 bg-muted/30">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          Vehicle #{index + 1}
                        </Label>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVehicleSelection(index)}
                            className="text-destructive hover:text-destructive p-1 h-auto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Vehicle Type */}
                        <FormField
                          control={form.control}
                          name={`selections.${index}.vehicleType`}
                          render={({ field: fieldProps }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Vehicle Type</FormLabel>
                              <FormControl>
                                <select
                                  {...fieldProps}
                                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <option value="">Select vehicle</option>
                                  {availableVehicles.map((vehicle) => (
                                    <option key={vehicle.type} value={vehicle.type}>
                                      {vehicle.type} ({vehicle.capacity} seats)
                                    </option>
                                  ))}
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Quantity */}
                        <FormField
                          control={form.control}
                          name={`selections.${index}.quantity`}
                          render={({ field: fieldProps }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Quantity</FormLabel>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const current = fieldProps.value || 1;
                                    if (current > 1) fieldProps.onChange(current - 1);
                                  }}
                                  disabled={(fieldProps.value || 1) <= 1}
                                  className="h-8 w-8 p-0"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <FormControl>
                                  <Input
                                    {...fieldProps}
                                    type="number"
                                    min="1"
                                    max="20"
                                    onChange={(e) => fieldProps.onChange(parseInt(e.target.value) || 1)}
                                    className="text-center h-8 w-16"
                                  />
                                </FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const current = fieldProps.value || 1;
                                    if (current < 20) fieldProps.onChange(current + 1);
                                  }}
                                  disabled={(fieldProps.value || 1) >= 20}
                                  className="h-8 w-8 p-0"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Price Override */}
                        <FormField
                          control={form.control}
                          name={`selections.${index}.priceOverride`}
                          render={({ field: fieldProps }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Price Override 
                                <span className="text-muted-foreground ml-1">
                                  (default: {currency} {basePrice})
                                </span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...fieldProps}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder={`${basePrice}`}
                                  onChange={(e) => fieldProps.onChange(parseFloat(e.target.value) || undefined)}
                                  className="h-8"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Selection Summary */}
                      {vehicleInfo && selection.quantity > 0 && (
                        <div className="pt-2 border-t border-border/50">
                          <div className="grid grid-cols-3 gap-4 text-xs">
                            <div>
                              <span className="text-muted-foreground">Capacity:</span>
                              <div className="font-medium">
                                {selection.quantity * vehicleInfo.capacity} seats
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Unit Price:</span>
                              <div className="font-medium">
                                {currency} {finalPrice}
                                {overridePrice && overridePrice !== basePrice && (
                                  <span className="text-yellow-600 ml-1">*</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Subtotal:</span>
                              <div className="font-medium text-green-600">
                                {currency} {selection.quantity * finalPrice}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </form>
        </Form>

        {/* Current Selection Summary */}
        {currentSelection && currentSelection.selections.length > 0 && (
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Selection Summary</Label>
                  <Badge 
                    variant={currentSelection.totalCapacity >= totalPax ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {currentSelection.totalCapacity >= totalPax ? "Adequate" : "Insufficient"} Capacity
                  </Badge>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-xs">Total Vehicles</div>
                    <div className="flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      <span className="font-medium">{currentSelection.totalVehicles}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-xs">Total Capacity</div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span className={cn(
                        "font-medium",
                        getCapacityStatusColor(
                          currentSelection.capacityUtilization, 
                          currentSelection.totalCapacity >= totalPax
                        )
                      )}>
                        {currentSelection.totalCapacity} seats
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-xs">Utilization</div>
                    <div className="font-medium">
                      {Math.round(currentSelection.capacityUtilization)}%
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-xs">Total Price</div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-green-600" />
                      <span className="font-bold text-green-600">
                        {currency} {currentSelection.totalPrice}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Capacity Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Capacity utilization</span>
                    <span>{totalPax} / {currentSelection.totalCapacity} passengers</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        currentSelection.totalCapacity < totalPax
                          ? "bg-red-500"
                          : currentSelection.capacityUtilization > 80
                          ? "bg-green-500"
                          : currentSelection.capacityUtilization > 50
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                      )}
                      style={{
                        width: `${Math.min(currentSelection.capacityUtilization, 100)}%`
                      }}
                    />
                  </div>
                </div>

                {/* Warnings */}
                {currentSelection.warnings.length > 0 && (
                  <div className="space-y-2">
                    {currentSelection.warnings.map((warning, index) => (
                      <Alert key={index} className="py-2">
                        <AlertTriangle className="h-3 w-3" />
                        <AlertDescription className="text-xs">
                          {warning}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};