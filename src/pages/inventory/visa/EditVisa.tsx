import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { VisaService, VisaUpdate, VisaDocument, EnhancedVisa } from '@/services/visaService';

const EditVisa = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      const res = await VisaService.getVisaById(id);
      if (!res.success || !res.data) {
        toast({ title: 'Error', description: res.error || 'Visa not found', variant: 'destructive' });
        navigate('/inventory/visa');
        return;
      }
      const v: EnhancedVisa = res.data;
      setCountry(v.country || '');
      setVisaType(v.visa_type || '');
      setProcessingTime(v.processing_time || '');
      setValidity(v.validity || '');
      setPrice(v.price || 0);
      setIsRushAvailable(!!v.is_rush_available);
      setRushProcessingTime(v.rush_processing_time || '');
      setRushPrice(v.rush_price || 0);
      setRequirements(v.requirements || '');
      setStatus((v.status as 'active' | 'disabled') || 'active');
      setDocuments(v.documents_parsed || []);
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const addDocument = () => {
    setDocuments(prev => ([...prev, {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      required: true,
      format: ''
    }]));
  };

  const updateDocument = (docId: string, patch: Partial<VisaDocument>) => {
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, ...patch } : d));
  };

  const removeDocument = (docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
  };

  const handleSubmit = async () => {
    if (!id) return;
    try {
      setSaving(true);
      const payload: VisaUpdate = {
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
      } as VisaUpdate;

      const res = await VisaService.updateVisa(id, payload);
      if (!res.success) {
        throw new Error(res.error || 'Failed to update visa');
      }
      toast({ title: 'Visa updated', description: `${country} (${visaType})` });
      navigate('/inventory/visa');
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to update', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Edit Visa</h1>
        <Card>
          <CardContent className="space-y-4 pt-6">
            {loading ? (
              <p>Loading...</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Country</label>
                    <Input value={country} onChange={(e) => setCountry(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Visa Type</label>
                    <Input value={visaType} onChange={(e) => setVisaType(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Processing Time</label>
                    <Input value={processingTime} onChange={(e) => setProcessingTime(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Validity</label>
                    <Input value={validity} onChange={(e) => setValidity(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Price</label>
                    <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
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
                      <Input value={rushProcessingTime} onChange={(e) => setRushProcessingTime(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Rush Price</label>
                      <Input type="number" value={rushPrice} onChange={(e) => setRushPrice(Number(e.target.value))} />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Requirements</label>
                  <Textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} />
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
                      <p className="text-sm text-muted-foreground">No documents listed.</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => navigate('/inventory/visa')}>Cancel</Button>
                  <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Update Visa'}</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default EditVisa;