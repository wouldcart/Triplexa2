import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Car } from 'lucide-react';
import { useProposalPersistence } from '@/hooks/useProposalPersistence';

interface TransportOptionsModuleProps {
  queryId: string;
}

type TransportOption = {
  option_label: string;
  vehicle_type: string;
  capacity: number;
  cost: number;
  remarks?: string;
};

const emptyOption = (): TransportOption => ({ option_label: '', vehicle_type: '', capacity: 0, cost: 0, remarks: '' });

const TransportOptionsModule: React.FC<TransportOptionsModuleProps> = ({ queryId }) => {
  const { data, updateTransportOptions } = useProposalPersistence(queryId, 'daywise');
  const initial = useMemo<TransportOption[]>(() => Array.isArray(data.transportOptions) ? data.transportOptions : [], [data.transportOptions]);
  const [options, setOptions] = useState<TransportOption[]>(initial);

  useEffect(() => {
    setOptions(initial);
  }, [initial]);

  const addOption = () => setOptions((prev) => [...prev, emptyOption()]);
  const removeOption = (idx: number) => setOptions((prev) => prev.filter((_, i) => i !== idx));
  const updateRow = (idx: number, patch: Partial<TransportOption>) => {
    setOptions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch } as TransportOption;
      return copy;
    });
  };

  const saveAll = async () => {
    await updateTransportOptions(options);
  };

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Car className="h-4 w-4" />
          Transport Options (Optional)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <Button variant="secondary" onClick={addOption}>Add Option</Button>
          <Button onClick={saveAll}>Save Transport Options</Button>
        </div>
        <Separator />

        {options.length === 0 && (
          <div className="text-sm text-muted-foreground">No transport options added.</div>
        )}

        <div className="space-y-4">
          {options.map((opt, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-3 space-y-2">
                <Label htmlFor={`label-${idx}`}>Option Label</Label>
                <Input id={`label-${idx}`} value={opt.option_label} onChange={(e) => updateRow(idx, { option_label: e.target.value })} />
              </div>
              <div className="sm:col-span-3 space-y-2">
                <Label htmlFor={`vehicle-${idx}`}>Vehicle Type</Label>
                <Input id={`vehicle-${idx}`} value={opt.vehicle_type} onChange={(e) => updateRow(idx, { vehicle_type: e.target.value })} />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor={`capacity-${idx}`}>Capacity</Label>
                <Input id={`capacity-${idx}`} type="number" value={Number(opt.capacity) || 0} onChange={(e) => updateRow(idx, { capacity: Number(e.target.value) })} />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor={`cost-${idx}`}>Cost</Label>
                <Input id={`cost-${idx}`} type="number" value={Number(opt.cost) || 0} onChange={(e) => updateRow(idx, { cost: Number(e.target.value) })} />
              </div>
              <div className="sm:col-span-1 flex gap-2">
                <Button variant="destructive" onClick={() => removeOption(idx)}>Remove</Button>
              </div>
              <div className="sm:col-span-12 space-y-2">
                <Label htmlFor={`remarks-${idx}`}>Remarks</Label>
                <Input id={`remarks-${idx}`} value={opt.remarks || ''} onChange={(e) => updateRow(idx, { remarks: e.target.value })} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransportOptionsModule;