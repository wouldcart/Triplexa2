import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { VisaService, EnhancedVisa } from '@/services/visaService';

const ViewVisa = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [visa, setVisa] = useState<EnhancedVisa | null>(null);
  const [loading, setLoading] = useState(true);

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
      setVisa(res.data);
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <PageLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">View Visa</h1>
          <div className="flex gap-2">
            {visa && (
              <Button variant="outline" onClick={() => navigate(`/inventory/visa/${visa.id}/edit`)}>Edit</Button>
            )}
            <Button variant="outline" onClick={() => navigate('/inventory/visa')}>Back</Button>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <p>Loading...</p>
            ) : visa ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">{visa.country} — {visa.visa_type}</h2>
                  <Badge variant={visa.status === 'active' ? 'default' : 'secondary'}>{visa.status}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Processing Time</p>
                    <p>{visa.processing_time || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Validity</p>
                    <p>{visa.validity || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p>${visa.price ?? 0}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Rush Available</p>
                    <p>{visa.is_rush_available ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rush Processing Time</p>
                    <p>{visa.rush_processing_time || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rush Price</p>
                    <p>{visa.rush_price ? `$${visa.rush_price}` : '-'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Requirements</p>
                  <p>{visa.requirements || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Documents</p>
                  <div className="space-y-2 mt-2">
                    {(visa.documents_parsed || []).length === 0 && <p className="text-sm text-muted-foreground">No documents listed</p>}
                    {(visa.documents_parsed || []).map(doc => (
                      <div key={doc.id} className="border p-3 rounded-md">
                        <div className="flex justify-between">
                          <p className="font-medium">{doc.name}</p>
                          <Badge variant={doc.required ? 'default' : 'secondary'}>{doc.required ? 'Required' : 'Optional'}</Badge>
                        </div>
                        {doc.format && <p className="text-sm">Format: {doc.format}</p>}
                        {doc.description && <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p>Visa not found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default ViewVisa;