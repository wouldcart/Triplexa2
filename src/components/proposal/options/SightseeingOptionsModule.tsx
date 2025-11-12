import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Camera } from 'lucide-react';
import { useProposalPersistence } from '@/hooks/useProposalPersistence';

interface SightseeingOptionsModuleProps {
  queryId: string;
}

type Activity = { name: string; cost: number; type: string; description?: string };
type SightseeingOption = { option_label: string; activities: Activity[] };

const emptyActivity = (): Activity => ({ name: '', cost: 0, type: 'sightseeing', description: '' });

const SightseeingOptionsModule: React.FC<SightseeingOptionsModuleProps> = ({ queryId }) => {
  const { data, updateSightseeingOptions } = useProposalPersistence(queryId, 'daywise');
  const initial = useMemo<SightseeingOption[]>(() => {
    const base = Array.isArray(data.sightseeingOptions) ? data.sightseeingOptions : [];
    if (base.length >= 2) return base.slice(0, 2);
    // Ensure two options exist
    const opts = [...base];
    while (opts.length < 2) opts.push({ option_label: `Option ${opts.length + 1}`, activities: [] });
    return opts;
  }, [data.sightseeingOptions]);

  const [options, setOptions] = useState<SightseeingOption[]>(initial);

  useEffect(() => {
    setOptions(initial);
  }, [initial]);

  const addActivity = (index: number) => {
    setOptions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], activities: [...copy[index].activities, emptyActivity()] };
      return copy;
    });
  };

  const updateActivity = (optIdx: number, actIdx: number, patch: Partial<Activity>) => {
    setOptions((prev) => {
      const copy = [...prev];
      const act = copy[optIdx].activities[actIdx] || emptyActivity();
      copy[optIdx].activities[actIdx] = { ...act, ...patch } as Activity;
      return copy;
    });
  };

  const removeActivity = (optIdx: number, actIdx: number) => {
    setOptions((prev) => {
      const copy = [...prev];
      copy[optIdx].activities = copy[optIdx].activities.filter((_, i) => i !== actIdx);
      return copy;
    });
  };

  const saveAll = async () => {
    await updateSightseeingOptions(options);
  };

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Camera className="h-4 w-4" />
          Sightseeing Options (Optional)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="option-1" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="option-1">{options[0]?.option_label || 'Option 1'}</TabsTrigger>
            <TabsTrigger value="option-2">{options[1]?.option_label || 'Option 2'}</TabsTrigger>
          </TabsList>

          {options.map((opt, idx) => (
            <TabsContent key={idx} value={`option-${idx + 1}`} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor={`opt-label-${idx}`}>Option Label</Label>
                  <Input
                    id={`opt-label-${idx}`}
                    value={opt.option_label}
                    onChange={(e) => {
                      const val = e.target.value;
                      setOptions((prev) => {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], option_label: val };
                        return copy;
                      });
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => addActivity(idx)}>Add Activity</Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                {opt.activities.length === 0 && (
                  <div className="text-sm text-muted-foreground">No activities added for this option.</div>
                )}
                {opt.activities.map((act, aIdx) => (
                  <div key={aIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-4 space-y-2">
                      <Label htmlFor={`name-${idx}-${aIdx}`}>Activity Name</Label>
                      <Input
                        id={`name-${idx}-${aIdx}`}
                        value={act.name}
                        onChange={(e) => updateActivity(idx, aIdx, { name: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-3 space-y-2">
                      <Label htmlFor={`type-${idx}-${aIdx}`}>Type</Label>
                      <Input
                        id={`type-${idx}-${aIdx}`}
                        value={act.type}
                        onChange={(e) => updateActivity(idx, aIdx, { type: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-3 space-y-2">
                      <Label htmlFor={`cost-${idx}-${aIdx}`}>Cost</Label>
                      <Input
                        id={`cost-${idx}-${aIdx}`}
                        type="number"
                        value={Number(act.cost) || 0}
                        onChange={(e) => updateActivity(idx, aIdx, { cost: Number(e.target.value) })}
                      />
                    </div>
                    <div className="sm:col-span-2 flex gap-2">
                      <Button variant="destructive" onClick={() => removeActivity(idx, aIdx)}>Remove</Button>
                    </div>
                    <div className="sm:col-span-12 space-y-2">
                      <Label htmlFor={`desc-${idx}-${aIdx}`}>Description</Label>
                      <Input
                        id={`desc-${idx}-${aIdx}`}
                        value={act.description || ''}
                        onChange={(e) => updateActivity(idx, aIdx, { description: e.target.value })}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button onClick={saveAll}>Save Sightseeing Options</Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SightseeingOptionsModule;