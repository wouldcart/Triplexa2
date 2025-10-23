import React, { useRef, useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { importTransportRoutes, parseTransportRoutes } from '@/utils/transportRoutesImportExport';
import { refreshSupabaseSession } from '@/utils/supabaseSessionRefresh';

type ImportMode = 'add' | 'update';

interface ImportRoutesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportRoutesModal: React.FC<ImportRoutesModalProps> = ({ isOpen, onClose }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>('add');
  const [validate, setValidate] = useState(true);
  const [continueOnError, setContinueOnError] = useState(false);
  const [preview, setPreview] = useState<{ validRows: any[]; invalidRows: { route: any; errors: string[] }[] } | null>(null);
  
  // Refresh Supabase session when modal opens to prevent net::ERR_ABORTED errors
  useEffect(() => {
    if (isOpen) {
      refreshSupabaseSession().then(session => {
        if (!session) {
          toast({ 
            title: 'Session refresh failed', 
            description: 'You may need to log in again if you encounter errors',
            variant: 'destructive'
          });
        }
      });
    }
  }, [isOpen, toast]);

  const reset = () => {
    if (fileRef.current) fileRef.current.value = '';
    setImporting(false);
    setParsing(false);
    setPreview(null);
  };

  const handleParse = async () => {
    try {
      const file = fileRef.current?.files?.[0];
      if (!file) {
        toast({ title: 'No file selected', description: 'Please choose a file to preview.', variant: 'destructive' });
        return;
      }
      
      // Refresh session before parsing to prevent net::ERR_ABORTED errors
      await refreshSupabaseSession();
      
      setParsing(true);
      const result = await parseTransportRoutes(file, { validate, continueOnError });
      setPreview(result);
      toast({ title: 'Preview generated', description: `${result.validRows.length} valid, ${result.invalidRows.length} invalid` });
    } catch (err: any) {
      console.error('Parse error:', err);
      toast({ title: 'Preview failed', description: err?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    try {
      const file = fileRef.current?.files?.[0];
      if (!file) {
        toast({ title: 'No file selected', description: 'Please choose a file to import.', variant: 'destructive' });
        return;
      }
      
      // Refresh session before import to prevent net::ERR_ABORTED errors
      await refreshSupabaseSession();
      
      setImporting(true);
      const result = await importTransportRoutes(file, { validate, continueOnError, importMode });
      toast({ title: 'Import complete', description: `${result.validCount} rows imported. ${result.invalidCount} invalid.` });
      if (result.invalidCount) {
        // eslint-disable-next-line no-console
        console.warn('Invalid import rows:', result.invalidRows);
      }
      reset();
      onClose();
    } catch (err: any) {
      console.error('Import error:', err);
      toast({ 
        title: 'Import failed', 
        description: err?.message || 'Unknown error. Check console for details.', 
        variant: 'destructive' 
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full md:max-w-[700px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Import Transport Routes</SheetTitle>
          <SheetDescription>Import Excel/CSV/JSON. Validate and preview before confirming.</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-4">
          <section className="space-y-4">
            <h3 className="text-lg font-semibold">Source File</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label>File</Label>
                <Input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.json" />
              </div>
              <div>
                <Label>Import Mode</Label>
                <Select value={importMode} onValueChange={(v) => setImportMode(v as ImportMode)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add (append new)</SelectItem>
                    <SelectItem value="update">Update existing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="flex items-center gap-3">
                <Switch checked={validate} onCheckedChange={setValidate} />
                <div>
                  <Label>Validate data</Label>
                  <p className="text-xs text-muted-foreground">Check required fields and types before import</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={continueOnError} onCheckedChange={setContinueOnError} />
                <div>
                  <Label>Continue on error</Label>
                  <p className="text-xs text-muted-foreground">Import valid rows; collect invalid errors</p>
                </div>
              </div>
              <div>
                <Button variant="secondary" onClick={handleParse} disabled={parsing}>Preview</Button>
              </div>
            </div>
          </section>

          {preview && (
            <section className="space-y-3">
              <h3 className="text-lg font-semibold">Preview</h3>
              <div className="text-sm">
                <span className="mr-4">Valid: {preview.validRows.length}</span>
                <span>Invalid: {preview.invalidRows.length}</span>
              </div>
              <div className="border rounded p-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {preview.validRows.slice(0, 6).map((r, idx) => (
                    <div key={idx} className="p-2 rounded border bg-muted">
                      <div className="font-medium">{r.name || r.route_code}</div>
                      <div className="text-xs text-muted-foreground">{r.country} • {r.start_location} → {r.end_location}</div>
                      <div className="text-xs">Stops: {Array.isArray(r.intermediate_stops) ? r.intermediate_stops.length : 0} • Types: {Array.isArray(r.transport_types) ? r.transport_types.length : 0}</div>
                    </div>
                  ))}
                </div>
                {preview.invalidRows.length > 0 && (
                  <div className="mt-3">
                    <Label>Invalid rows</Label>
                    <ul className="list-disc pl-5 text-xs">
                      {preview.invalidRows.slice(0, 6).map((ir, idx) => (
                        <li key={idx}>{ir.errors.join(', ')}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="flex gap-3">
            <Button onClick={handleImport} disabled={importing}>Import</Button>
            <Button variant="outline" onClick={() => { reset(); onClose(); }}>Close</Button>
          </div>

          <SheetFooter />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ImportRoutesModal;