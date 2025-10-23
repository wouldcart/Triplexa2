import { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { VisaService, VisaInsert, VisaDocument } from '@/services/visaService';
import { useNavigate } from 'react-router-dom';

const AddVisa = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [country, setCountry] = useState('');
  const [visaType, setVisaType] = useState('');
  const [processingTime, setProcessingTime] = useState('');
  const [validity, setValidity] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [isRushAvailable, setIsRushAvailable] = useState<boolean>(false);
  const [rushProcessingTime, setRushProcessingTime] = useState('');
  const [rushPrice, setRushPrice] = useState<number>(0);
  const [requirements, setRequirements] = useState('');
  const [status, setStatus] = useState<'active' | 'disabled'>('active');
  const [documents, setDocuments] = useState<VisaDocument[]>([]);
  const [saving, setSaving] = useState(false);

  const addDocument = () => {
    setDocuments(prev => ([...prev, {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      required: true,
      format: ''
    }]));
  };

  const updateDocument = (id: string, patch: Partial<VisaDocument>) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      const payload: VisaInsert = {
        country,
        visa_type: visaType,
        processing_time: processingTime || null,
        validity: validity || null,
        price: price || 0,
        is_rush_available: isRushAvailable,
        rush_processing_time: isRushAvailable ? (rushProcessingTime || null) : null,
        rush_price: isRushAvailable ? (rushPrice || 0) : 0,
        requirements: requirements || null,
        documents: VisaService.formatDocumentsForStorage(documents),
        status,
      } as VisaInsert;

      const res = await VisaService.createVisa(payload);
      if (!res.success) {
        throw new Error(res.error || 'Failed to create visa');
      }
      toast({ title: 'Visa created', description: `Added ${country} (${visaType})` });
      navigate('/inventory/visa');
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Add Visa</h1>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Country</label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Enter country" />
              </div>
              <div>
                <label className="text-sm font-medium">Visa Type</label>
                <Input value={visaType} onChange={(e) => setVisaType(e.target.value)} placeholder="e.g., Tourist" />
              </div>
              <div>
                <label className="text-sm font-medium">Processing Time</label>
                <Input value={processingTime} onChange={(e) => setProcessingTime(e.target.value)} placeholder="e.g., 5-7 business days" />
              </div>
              <div>
                <label className="text-sm font-medium">Validity</label>
                <Input value={validity} onChange={(e) => setValidity(e.target.value)} placeholder="e.g., 90 days" />
              </div>
              <div>
                <label className="text-sm font-medium">Price</label>
                <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="0" />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={status} onValueChange={(v) => setStatus(v as 'active' | 'disabled')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">active</SelectItem>
                    <SelectItem value="disabled">disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={isRushAvailable} onCheckedChange={setIsRushAvailable} />
              <span className="text-sm">Is Rush Available</span>
            </div>

            {isRushAvailable && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Rush Processing Time</label>
                  <Input value={rushProcessingTime} onChange={(e) => setRushProcessingTime(e.target.value)} placeholder="e.g., 1-2 days" />
                </div>
                <div>
                  <label className="text-sm font-medium">Rush Price</label>
                  <Input type="number" value={rushPrice} onChange={(e) => setRushPrice(Number(e.target.value))} placeholder="0" />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Requirements</label>
              <Textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="Enter requirements" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Documents</label>
                <Button variant="outline" onClick={addDocument}>Add Document</Button>
              </div>
              <div className="space-y-3">
                {documents.map(doc => (
                  <div key={doc.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end border p-3 rounded-md">
                    <div className="md:col-span-2">
                      <label className="text-xs">Name</label>
                      <Input value={doc.name} onChange={(e) => updateDocument(doc.id, { name: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs">Format</label>
                      <Input value={doc.format || ''} onChange={(e) => updateDocument(doc.id, { format: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs">Required</label>
                      <div className="mt-2"><Switch checked={doc.required} onCheckedChange={(v) => updateDocument(doc.id, { required: v })} /></div>
                    </div>
                    <div className="md:col-span-5">
                      <label className="text-xs">Description</label>
                      <Textarea value={doc.description || ''} onChange={(e) => updateDocument(doc.id, { description: e.target.value })} />
                    </div>
                    <div className="md:col-span-5 flex justify-end">
                      <Button variant="destructive" size="sm" onClick={() => removeDocument(doc.id)}>Remove</Button>
                    </div>
                  </div>
                ))}
                {documents.length === 0 && (
                  <p className="text-sm text-muted-foreground">No documents added yet.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => navigate('/inventory/visa')}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Save Visa'}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default AddVisa;