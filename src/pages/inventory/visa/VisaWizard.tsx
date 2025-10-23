import { useEffect, useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { VisaService, EnhancedVisa, VisaDocument } from '@/services/visaService';
import { VisaStatus } from '@/pages/inventory/transport/types/visaTypes';

type ApplicantInfo = {
  full_name: string;
  email: string;
  phone: string;
  nationality: string;
};

const steps = ['Applicant Info', 'Select Visa', 'Documents', 'Review & Submit'] as const;

const VisaWizard = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [visas, setVisas] = useState<EnhancedVisa[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicant, setApplicant] = useState<ApplicantInfo>({
    full_name: '',
    email: '',
    phone: '',
    nationality: ''
  });
  const [selectedVisa, setSelectedVisa] = useState<EnhancedVisa | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<VisaDocument[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await VisaService.getAllVisas({ status: 'active' });
        setVisas(res.data?.visas || []);
      } catch (e) {
        console.error(e);
        setVisas([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const next = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));

  const submit = async () => {
    try {
      // Minimal submit flow; in real flow, integrate booking service
      toast({ title: 'Submitted', description: 'Visa booking submitted successfully.' });
      setStep(0);
      setApplicant({ full_name: '', email: '', phone: '', nationality: '' });
      setSelectedVisa(null);
      setSelectedDocs([]);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to submit booking', variant: 'destructive' });
    }
  };

  return (
    <PageLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Visa Booking Wizard</h1>
            <p className="text-gray-500">Step-by-step visa application</p>
          </div>
          <Badge>{steps[step]}</Badge>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            {step === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <Input value={applicant.full_name} onChange={e => setApplicant({ ...applicant, full_name: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" value={applicant.email} onChange={e => setApplicant({ ...applicant, email: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input value={applicant.phone} onChange={e => setApplicant({ ...applicant, phone: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Nationality</label>
                  <Input value={applicant.nationality} onChange={e => setApplicant({ ...applicant, nationality: e.target.value })} />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                {loading ? (
                  <p>Loading visas...</p>
                ) : (visas.length === 0 ? (
                  <p>No active visas found</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visas.map(v => (
                      <div key={v.id} className={`border rounded p-4 ${selectedVisa?.id === v.id ? 'border-blue-500' : 'border-gray-200'}`}>
                        <div className="font-semibold">{v.country}</div>
                        <div className="text-sm text-gray-600">{v.visa_type}</div>
                        <div className="text-sm">Processing: {v.processing_time || 'N/A'}</div>
                        <div className="text-sm">Price: ${v.price ?? 0}</div>
                        <div className="mt-2">
                          <Button variant={selectedVisa?.id === v.id ? 'default' : 'outline'} size="sm" onClick={() => {
                            setSelectedVisa(v);
                            setSelectedDocs(v.documents_parsed || []);
                          }}>Select</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                {!selectedVisa ? (
                  <p className="text-gray-600">Please select a visa first.</p>
                ) : (
                  <div>
                    <h3 className="font-semibold mb-2">Required Documents</h3>
                    <div className="space-y-2">
                      {(selectedVisa.documents_parsed || []).map(doc => (
                        <div key={doc.id} className="flex items-center justify-between border rounded p-2">
                          <div>
                            <div className="font-medium">{doc.name}</div>
                            {doc.description && <div className="text-sm text-gray-600">{doc.description}</div>}
                          </div>
                          <Button variant={selectedDocs.find(d => d.id === doc.id) ? 'default' : 'outline'} size="sm" onClick={() => {
                            setSelectedDocs(prev => prev.find(d => d.id === doc.id) ? prev.filter(d => d.id !== doc.id) : [...prev, doc]);
                          }}>{selectedDocs.find(d => d.id === doc.id) ? 'Provided' : 'Mark Provided'}</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Review</h3>
                  <div className="text-sm">Applicant: {applicant.full_name} ({applicant.email})</div>
                  <div className="text-sm">Phone: {applicant.phone}</div>
                  <div className="text-sm">Nationality: {applicant.nationality}</div>
                  <div className="text-sm">Visa: {selectedVisa ? `${selectedVisa.country} - ${selectedVisa.visa_type}` : 'Not selected'}</div>
                  <div className="text-sm">Documents marked provided: {selectedDocs.length}</div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={back} disabled={step === 0}>Back</Button>
              {step < steps.length - 1 ? (
                <Button onClick={next} disabled={step === 1 && !selectedVisa}>Next</Button>
              ) : (
                <Button onClick={submit} disabled={!selectedVisa || applicant.full_name.trim() === ''}>Submit</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default VisaWizard;