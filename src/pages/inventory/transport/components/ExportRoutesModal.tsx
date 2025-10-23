import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { exportTransportRoutes } from '@/utils/transportRoutesImportExport';

type Format = 'xlsx' | 'csv' | 'json';

interface ExportRoutesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultFields = [
  'id',
  'code',
  'name',
  'country',
  'currency',
  'transferType',
  'startLocation',
  'endLocation',
  'intermediateStops',
  'transportTypes',
  'enableSightseeing',
  'sightseeingOptions',
  'status',
  'price',
  'distance',
  'duration',
  'description',
];

const ExportRoutesModal: React.FC<ExportRoutesModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<Format>('xlsx');
  const [exportStatus, setExportStatus] = useState<string | undefined>(undefined);
  const [exportCountry, setExportCountry] = useState<string | undefined>(undefined);
  const [selectedFields, setSelectedFields] = useState<string[]>([...defaultFields]);

  const handleFieldToggle = (field: string, checked: boolean) => {
    setSelectedFields((prev) => {
      const set = new Set(prev);
      if (checked) set.add(field); else set.delete(field);
      return Array.from(set);
    });
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const { blob, filename, meta } = await exportTransportRoutes({
        format: exportFormat,
        selectedFields,
        filters: { status: exportStatus, country: exportCountry },
      });

      // eslint-disable-next-line no-console
      console.debug('[ExportRoutes] Meta:', meta);

      if (meta && meta.rowsCount === 0) {
        toast({ title: 'No data to export', description: 'No routes matched the selected filters.', variant: 'destructive' });
        setExporting(false);
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Export complete', description: `Saved as ${filename}` });
    } catch (err: any) {
      toast({ title: 'Export failed', description: err?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full md:max-w-[700px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Export Transport Routes</SheetTitle>
          <SheetDescription>Export Excel/CSV/JSON with filters and selected fields.</SheetDescription>
        </SheetHeader>

        <div className="space-y-8 mt-4">
          <section className="space-y-4">
            <h3 className="text-lg font-semibold">Export</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Format</Label>
                <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as Format)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Choose format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                    <SelectItem value="json">JSON (.json)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status filter</Label>
                <Select
                  value={exportStatus ?? 'any'}
                  onValueChange={(v) => setExportStatus(v === 'any' ? undefined : v)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Country filter</Label>
                <Input placeholder="e.g., Thailand" value={exportCountry ?? ''} onChange={(e) => setExportCountry(e.target.value || undefined)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Select fields</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {defaultFields.map((f) => (
                  <label key={f} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={selectedFields.includes(f)} onCheckedChange={(c) => handleFieldToggle(f, Boolean(c))} />
                    {f}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Button onClick={handleExport} disabled={exporting}>Export Routes</Button>
            </div>
          </section>

          <SheetFooter>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ExportRoutesModal;