import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/lib/supabaseClient';
import { checkBucketExists } from '@/lib/storageChecks';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { MultiSelect } from '@/components/ui/multi-select';

import AgentDashboardHeader from '@/components/dashboards/agent/AgentDashboardHeader';
import MobileBottomNavigation from '@/components/dashboards/agent/MobileBottomNavigation';

// Types for tax records (expects agent_tax_info to have id PK)
interface TaxRecord {
  id?: string;
  agent_id: string;
  tax_country?: string | null;
  tax_type?: string | null;
  tax_number?: string | null;
  gst_number?: string | null;
  pan_number?: string | null;
  vat_number?: string | null;
  tax_certificate_url?: string | null;
  tax_registered?: boolean;
  tax_verified?: boolean;
  tax_notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

const ProfilePage: React.FC = () => {
  const { currentUser } = useApp();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Storage configuration: use Supabase Storage only


  // Profile form
  const [agentId, setAgentId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [agentBucketExists, setAgentBucketExists] = useState<boolean>(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    alternate_email: '',
    profile_image: '',
    agency_name: '',
    business_type: 'Proprietorship',
    business_phone: '',
    mobile_numbers: [] as string[],
    website: '',
    business_address: '',
    city: '',
    country: '',
    status: 'active',
    license_number: '',
    iata_number: '',
    commission_type: 'percentage' as 'percentage' | 'flat',
    commission_value: '' as string | number,
    specializations: [] as string[],
  });
  const [initialForm, setInitialForm] = useState<any>(null);

  // Documents state (stored in agent_settings.preferences.documents)
  const [agentDocs, setAgentDocs] = useState<{ title?: string; url: string; type: string; uploaded_at: string }[]>([]);

  // Tax records state
  const [taxRecords, setTaxRecords] = useState<TaxRecord[]>([]);
  const [taxDialogOpen, setTaxDialogOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxRecord | null>(null);
  // Preview state for document/image and validation config
  const [previewDoc, setPreviewDoc] = useState<{ url: string; type: string; title?: string } | null>(null);
  const MAX_LOGO_MB = 2;
  const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
  const MAX_DOC_MB = 10;
  const ALLOWED_DOC_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

  const SPECIALIZATION_OPTIONS = [
    { label: 'Flights', value: 'Flights' },
    { label: 'Hotels', value: 'Hotels' },
    { label: 'Tours & Activities', value: 'Tours & Activities' },
    { label: 'Cruises', value: 'Cruises' },
    { label: 'Visa Assistance', value: 'Visa Assistance' },
    { label: 'Transport', value: 'Transport' },
    { label: 'MICE', value: 'MICE' },
    { label: 'Corporate Travel', value: 'Corporate Travel' },
    { label: 'Luxury Travel', value: 'Luxury Travel' },
    { label: 'Budget Travel', value: 'Budget Travel' },
    { label: 'Adventure', value: 'Adventure' },
    { label: 'Honeymoon', value: 'Honeymoon' },
    { label: 'Family Travel', value: 'Family Travel' },
    { label: 'Solo Travel', value: 'Solo Travel' },
    { label: 'Pilgrimage', value: 'Pilgrimage' },
    { label: 'Umrah & Hajj', value: 'Umrah & Hajj' },
    { label: 'Insurance', value: 'Insurance' },
    { label: 'Rail', value: 'Rail' },
    { label: 'Bus', value: 'Bus' },
    { label: 'Car Rental', value: 'Car Rental' },
  ];
  // Derived profile completion
  const completion = useMemo(() => {
    const req = ['name','agency_name','country','city','mobile_numbers'];
    const count = req.filter((f) => {
      if (f === 'mobile_numbers') return (form.mobile_numbers || []).length > 0;
      return Boolean((form as any)[f]);
    }).length;
    return Math.round((count / req.length) * 100);
  }, [form]);

  // Load agent profile, docs, and tax records
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth?.user?.id || currentUser?.id;
        if (!uid) return;
        setAgentId(uid);

        // Load agent row
        const { data: agentRow } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', uid)
          .maybeSingle();
        // Seed documents from agents.documents (text[] of URLs)
        let seededDocs: { title?: string; url: string; type: string; uploaded_at: string }[] = [];
        if (agentRow) {
          const a: any = agentRow;
          setForm(prev => {
            const hydrated = {
              name: a.name || a.agency_name || prev.name,
              email: a.email || currentUser?.email || prev.email,
              alternate_email: a.alternate_email || '',
              profile_image: a.profile_image || '',
              agency_name: a.agency_name || '',
              business_type: a.business_type || prev.business_type,
              business_phone: a.business_phone || '',
              mobile_numbers: Array.isArray(a.mobile_numbers) ? a.mobile_numbers : [],
              website: a.website || '',
              business_address: a.business_address || '',
              city: a.city || '',
              country: a.country || '',
              status: a.status || prev.status,
              license_number: a.license_number || '',
              iata_number: a.iata_number || '',
              commission_type: (a.commission_type as any) || prev.commission_type,
              commission_value: (a.commission_value as any) || prev.commission_value,
              specializations: Array.isArray(a.specializations) ? a.specializations : [],
            };
            setInitialForm(hydrated);
            return { ...prev, ...hydrated };
          });

          // Convert agents.documents (urls) into UI doc objects
          if (Array.isArray((a as any).documents)) {
            seededDocs = (a as any).documents
              .filter((u: any) => typeof u === 'string' && u)
              .map((url: string) => {
                const last = decodeURIComponent(url.split('?')[0].split('/').pop() || 'Document');
                const ext = last.split('.').pop()?.toLowerCase() || '';
                const type = ext === 'pdf' ? 'application/pdf'
                  : ext === 'png' ? 'image/png'
                  : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
                  : ext === 'webp' ? 'image/webp'
                  : 'application/octet-stream';
                return { title: last, url, type, uploaded_at: new Date().toISOString() };
              });
          }
        }

        // Load documents
        const { data: settingsRow } = await (supabase as any)
          .from('agent_settings')
          .select('preferences')
          .eq('agent_id', uid)
          .maybeSingle();
        const prefDocs = settingsRow?.preferences?.documents && Array.isArray(settingsRow.preferences.documents)
          ? settingsRow.preferences.documents as { title?: string; url: string; type: string; uploaded_at: string }[]
          : [];
        // Merge by URL, prefer richer prefDocs entries when overlapping
        const byUrl = new Map<string, { title?: string; url: string; type: string; uploaded_at: string }>();
        for (const d of seededDocs) byUrl.set(d.url, d);
        for (const d of prefDocs) byUrl.set(d.url, d);
        if (byUrl.size) setAgentDocs(Array.from(byUrl.values()));

        // Load tax records (multi-entry)
        const { data: taxRows } = await (supabase as any)
          .from('agent_tax_info')
          .select('*')
          .eq('agent_id', uid)
          .order('updated_at', { ascending: false });
        if (Array.isArray(taxRows)) setTaxRecords(taxRows as TaxRecord[]);
      } catch (e) {
        /* noop */
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser?.id]);

  // Preflight: verify required bucket exists
  useEffect(() => {
    (async () => {
      const res = await checkBucketExists('agent_branding');
      setAgentBucketExists(res.exists);
      if (!res.exists) {
        toast.error('Missing Supabase bucket "agent_branding". Please create it and make it public.');
      }
    })();
  }, []);

  // Helpers
  const updateField = (k: keyof typeof form, v: any) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (autoSave) saveProfile(true);
  };

  const saveProfile = async (silent = false) => {
    try {
      setSaving(true);
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) throw new Error('Not authenticated');
      const payload: any = { ...form, updated_at: new Date().toISOString() };
      delete payload.email; // keep email readonly
      const { error } = await supabase.from('agents').update(payload).eq('user_id', uid);
      if (error) throw error;
      setInitialForm(form);
      if (!silent) toast.success('Profile saved');
    } catch (e: any) {
      if (!silent) toast.error(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file: File) => {
    try {
      if (!agentBucketExists) { toast.error('Bucket "agent_branding" is missing. Contact admin to create it.'); return; }
      // Validate image type and size
      let logoType = file.type || '';
      if (!logoType) {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (ext === 'png') logoType = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') logoType = 'image/jpeg';
        else if (ext === 'webp') logoType = 'image/webp';
      }
      if (!ALLOWED_LOGO_TYPES.includes(logoType)) {
        toast.error('Logo must be PNG, JPG, or WebP');
        return;
      }
      if (file.size > MAX_LOGO_MB * 1024 * 1024) {
        toast.error(`Logo must be <= ${MAX_LOGO_MB}MB`);
        return;
      }
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id; if (!uid) throw new Error('Not authenticated');
      const safeName = `${crypto.randomUUID()}-${file.name}`.replace(/\s+/g, '_');
      const fullPath = `agents/${uid}/logo/${safeName}`;
      const { error: uploadError } = await supabase.storage.from('agent_branding').upload(fullPath, file, { upsert: true, contentType: logoType || 'image/png' });
      if (uploadError) throw uploadError;
      const { data: pub } = supabase.storage.from('agent_branding').getPublicUrl(fullPath);
      const publicUrl = pub?.publicUrl; if (!publicUrl) throw new Error('Failed to obtain public URL');
      await supabase.from('agents').update({ profile_image: publicUrl, updated_at: new Date().toISOString() }).eq('user_id', uid);
      updateField('profile_image', publicUrl);
      toast.success('Logo updated');
    } catch (e: any) { toast.error(e?.message || 'Logo upload failed'); }
  };

  const removeLogo = async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id; if (!uid) throw new Error('Not authenticated');
      const url = form.profile_image as string | null;
      if (!url) {
        toast.error('No logo to remove');
        return;
      }
      // Attempt to delete from storage when path is under agent_branding/agents/<uid>/logo/
      try {
        const marker = '/storage/v1/object/public/';
        const idx = url.indexOf(marker);
        if (idx >= 0) {
          const after = url.substring(idx + marker.length); // e.g. agent_branding/agents/<uid>/logo/<file>
          const [bucket, ...rest] = after.split('/');
          const key = rest.join('/');
          if (bucket === 'agent_branding' && key.startsWith(`agents/${uid}/logo/`)) {
            const { error: delErr } = await supabase.storage.from(bucket).remove([key]);
            if (delErr) {
              // Soft-fail: continue clearing DB even if storage delete fails due to policy
              console.warn('Logo storage delete failed:', delErr.message);
            }
          }
        }
      } catch (err) {
        console.warn('Logo delete parse error:', err);
      }
      const { error } = await supabase
        .from('agents')
        .update({ profile_image: null, updated_at: new Date().toISOString() })
        .eq('user_id', uid);
      if (error) throw error;
      updateField('profile_image', null as any);
      toast.success('Logo removed');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to remove logo');
    }
  };

  const saveAgentSettingsPreferences = async (docs: { title?: string; url: string; type: string; uploaded_at: string }[]) => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id; if (!uid) throw new Error('Not authenticated');
    const payload = { preferences: { documents: docs }, updated_at: new Date().toISOString() };
    const { data: existing } = await (supabase as any).from('agent_settings').select('agent_id').eq('agent_id', uid).maybeSingle();
    if (existing) await (supabase as any).from('agent_settings').update(payload).eq('agent_id', uid);
    else await (supabase as any).from('agent_settings').insert({ agent_id: uid, created_at: new Date().toISOString(), ...payload });

    // Persist URLs also into agents.documents (text[])
    const urls = (docs || []).map(d => d.url);
    await supabase.from('agents').update({ documents: urls, updated_at: new Date().toISOString() }).eq('user_id', uid);
  };

  const uploadDocuments = async (files: FileList) => {
    try {
      if (!agentBucketExists) { toast.error('Bucket "agent_branding" is missing. Contact admin to create it.'); return; }
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id; if (!uid) throw new Error('Not authenticated');
      const added: any[] = [];
      for (const file of Array.from(files)) {
        // Resolve type from extension when missing and validate
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        let type = file.type || '';
        if (!type) {
          if (ext === 'pdf') type = 'application/pdf';
          else if (ext === 'png') type = 'image/png';
          else if (ext === 'jpg' || ext === 'jpeg') type = 'image/jpeg';
          else if (ext === 'webp') type = 'image/webp';
        }
        if (!ALLOWED_DOC_TYPES.includes(type)) {
          toast.error(`${file.name}: unsupported file type (allowed: PDF, PNG, JPG, WebP)`);
          continue;
        }
        if (file.size > MAX_DOC_MB * 1024 * 1024) {
          toast.error(`${file.name}: exceeds ${MAX_DOC_MB}MB limit`);
          continue;
        }
        const safeName = `${crypto.randomUUID()}-${file.name}`.replace(/\s+/g, '_');
        const fullPath = `agents/${uid}/docs/${safeName}`;
        const { error: uploadError } = await supabase.storage.from('agent_branding').upload(fullPath, file, { upsert: true, contentType: type || 'application/octet-stream' });
        if (uploadError) { toast.error(`${file.name}: ${uploadError.message || 'Upload failed'}`); continue; }
        const { data: pub } = supabase.storage.from('agent_branding').getPublicUrl(fullPath);
        const publicUrl = pub?.publicUrl; if (!publicUrl) { toast.error(`${file.name}: Failed to obtain public URL`); continue; }
        added.push({ title: file.name, url: publicUrl, type, uploaded_at: new Date().toISOString() });
      }
      const docs = [...agentDocs, ...added];
      setAgentDocs(docs);
      await saveAgentSettingsPreferences(docs);
      if (added.length) toast.success('Documents uploaded');
    } catch (e: any) { toast.error(e?.message || 'Document upload failed'); }
  };

  const removeDocument = async (idx: number) => {
    const docs = agentDocs.filter((_, i) => i !== idx);
    setAgentDocs(docs);
    await saveAgentSettingsPreferences(docs);
  };

  // Tax CRUD
  const openTaxDialog = (rec?: TaxRecord) => { setEditingTax(rec || null); setTaxDialogOpen(true); };
  const saveTaxRecord = async (rec: TaxRecord) => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id || agentId || currentUser?.id;
      if (!uid) throw new Error('Not authenticated');
      const payload = { ...rec, agent_id: uid, updated_at: new Date().toISOString() };
      if (rec.id) {
        const { error } = await (supabase as any).from('agent_tax_info').update(payload).eq('id', rec.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('agent_tax_info').insert({ ...payload, created_at: new Date().toISOString() });
        if (error) throw error;
      }
      const { data: taxRows, error: fetchError } = await (supabase as any)
        .from('agent_tax_info').select('*').eq('agent_id', uid).order('updated_at', { ascending: false });
      if (fetchError) throw fetchError;
      setTaxRecords(Array.isArray(taxRows) ? taxRows : []);
      setTaxDialogOpen(false);
      toast.success('Tax record saved');
    } catch (e: any) {
      toast.error(e?.message || 'Save failed');
    }
  };
  const deleteTaxRecord = async (id?: string) => {
    try {
      if (!id) return;
      const { error } = await (supabase as any).from('agent_tax_info').delete().eq('id', id);
      if (error) throw error;
      setTaxRecords(prev => prev.filter(r => r.id !== id));
      toast.success('Tax record deleted');
    } catch (e: any) {
      toast.error(e?.message || 'Delete failed');
    }
  };
  const uploadTaxCertificate = async (file: File, rec?: TaxRecord) => {
    try {
      if (!agentBucketExists) { toast.error('Bucket "agent_branding" is missing. Contact admin to create it.'); return; }
      if (!rec?.id) { toast.error('Save the tax record before uploading a certificate'); return; }
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id || agentId || currentUser?.id;
      if (!uid) throw new Error('Not authenticated');
      const safeName = `${crypto.randomUUID()}-${file.name}`.replace(/\s+/g, '_');
      const fullPath = `agents/${uid}/tax/${safeName}`;
      // Resolve content type if missing (prevents ORB issues)
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let contentType = file.type || '';
      if (!contentType) {
        if (ext === 'pdf') contentType = 'application/pdf';
        else if (ext === 'png') contentType = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
        else if (ext === 'webp') contentType = 'image/webp';
        else contentType = 'application/octet-stream';
      }
      const { error: uploadError } = await supabase.storage.from('agent_branding').upload(fullPath, file, { upsert: true, contentType });
      if (uploadError) throw uploadError;
      const { data: pub } = supabase.storage.from('agent_branding').getPublicUrl(fullPath);
      const publicUrl = pub?.publicUrl; if (!publicUrl) throw new Error('Failed to obtain public URL');
      const payload: any = { agent_id: uid, tax_certificate_url: publicUrl, updated_at: new Date().toISOString() };
      const { error } = await (supabase as any).from('agent_tax_info').update(payload).eq('id', rec.id);
      if (error) throw error;
      const { data: taxRows, error: fetchError2 } = await (supabase as any).from('agent_tax_info').select('*').eq('agent_id', uid);
      if (fetchError2) throw fetchError2;
      setTaxRecords(Array.isArray(taxRows) ? taxRows : []);
      toast.success('Certificate uploaded');
    } catch (e: any) { toast.error(e?.message || 'Upload failed'); }
  };

  return (
    <div className={`min-h-screen bg-background ${isMobile ? 'pb-20' : ''}`}>
      <AgentDashboardHeader />
      {/* 1️⃣ Header */}
      <div className={`container mx-auto ${isMobile ? 'px-4' : 'px-6'}`}>
        <Card className={`md:static sticky top-14 z-30 shadow-lg border border-muted/30 transition-colors duration-300 ${isEditing ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}`}>
          <CardContent className="p-6 flex items-center gap-6">
            <div className={`${isMobile ? 'h-16 min-w-[4rem]' : 'h-24 min-w-[6rem]'} flex items-center justify-center`}>
              {form.profile_image ? (
                <img
                  src={form.profile_image}
                  alt="Company Logo"
                  className="h-full w-auto object-contain rounded-md border"
                />
              ) : (
                <div className="h-full w-[6rem] flex items-center justify-center rounded-md border bg-muted text-xl font-semibold">
                  {(form.name || 'A').charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-semibold">{form.name || 'Agent'}</h1>
                {form.status && <Badge variant="outline" className="rounded-full">{String(form.status).toUpperCase()}</Badge>}
              </div>
              <p className="text-muted-foreground">{form.agency_name || '—'}</p>
              <div className="mt-3">
                <Progress value={completion} className="h-2 bg-gradient-to-r from-blue-100 to-blue-200" />
                <div className="text-xs text-muted-foreground mt-1">Profile completion: {completion}%</div>
              </div>
            </div>
            <div className="space-y-2 text-right">
              <div className="flex items-center gap-2 justify-end">
                <Label>Auto-save</Label>
                <Switch checked={autoSave} onCheckedChange={setAutoSave} />
              </div>
              {!isEditing ? (
                <Button variant="default" onClick={() => { setInitialForm(form); setIsEditing(true); }}>Edit Profile</Button>
              ) : (
                <div className="flex items-center gap-2 justify-end">
                  <Button variant="outline" onClick={() => { setForm(initialForm || form); setIsEditing(false); }}>Cancel</Button>
                  <Button variant="default" onClick={async () => { await saveProfile(); setIsEditing(false); }} disabled={saving}>
                    {saving ? 'Saving...' : 'Save All Changes'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={`container mx-auto ${isMobile ? 'px-4' : 'px-6'} mt-6 grid grid-cols-1 md:grid-cols-2 gap-6`}>
        {/* Personal & Business Details (prioritized) */}
        <Card className={`shadow-md md:col-span-2 transition-colors duration-300 ${isEditing ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}`}>
          <CardHeader>
            <CardTitle>Personal & Business Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                {isEditing ? (
                  <Input value={form.name} onChange={(e) => updateField('name', e.target.value)} />
                ) : (
                  <p className="text-foreground">{form.name || '—'}</p>
                )}
              </div>
              <div>
                <Label>Email (readonly)</Label>
                {isEditing ? (
                  <Input value={form.email} readOnly />
                ) : (
                  <p className="text-foreground">{form.email || '—'}</p>
                )}
              </div>
              <div>
                <Label>Alternate Email</Label>
                {isEditing ? (
                  <Input value={form.alternate_email} onChange={(e) => updateField('alternate_email', e.target.value)} />
                ) : (
                  <p className="text-foreground">{form.alternate_email || '—'}</p>
                )}
              </div>
              <div>
                <Label>Agency / Company Name</Label>
                {isEditing ? (
                  <Input value={form.agency_name} onChange={(e) => updateField('agency_name', e.target.value)} />
                ) : (
                  <p className="text-foreground">{form.agency_name || '—'}</p>
                )}
              </div>
              <div>
                <Label>Business Type</Label>
                {isEditing ? (
                  <Select value={form.business_type} onValueChange={(v) => updateField('business_type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Proprietorship">Proprietorship</SelectItem>
                      <SelectItem value="Partnership">Partnership</SelectItem>
                      <SelectItem value="Pvt. Ltd">Pvt. Ltd</SelectItem>
                      <SelectItem value="LLP">LLP</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-foreground">{form.business_type || '—'}</p>
                )}
              </div>
              <div>
                <Label>Business Phone</Label>
                {isEditing ? (
                  <Input value={form.business_phone} onChange={(e) => updateField('business_phone', e.target.value)} />
                ) : (
                  <p className="text-foreground">{form.business_phone || '—'}</p>
                )}
              </div>
              <div>
                <Label>Mobile Numbers</Label>
                {isEditing && (
                  <Input placeholder="Add number" onKeyDown={(e) => { if (e.key === 'Enter') { const v = (e.target as HTMLInputElement).value.trim(); if (v) updateField('mobile_numbers', [...form.mobile_numbers, v]); (e.target as HTMLInputElement).value=''; } }} />
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {(form.mobile_numbers || []).map((n, i) => (
                    <Badge key={i} variant="secondary" onClick={isEditing ? () => updateField('mobile_numbers', form.mobile_numbers.filter((_, idx) => idx !== i)) : undefined}>{n}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label>Website</Label>
                {isEditing ? (
                  <Input type="url" value={form.website} onChange={(e) => updateField('website', e.target.value)} />
                ) : (
                  <p className="text-foreground">{form.website || '—'}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <Label>Business Address</Label>
                {isEditing ? (
                  <Textarea value={form.business_address} onChange={(e) => updateField('business_address', e.target.value)} />
                ) : (
                  <p className="text-foreground whitespace-pre-wrap">{form.business_address || '—'}</p>
                )}
              </div>
              <div>
                <Label>City</Label>
                {isEditing ? (
                  <Input value={form.city} onChange={(e) => updateField('city', e.target.value)} />
                ) : (
                  <p className="text-foreground">{form.city || '—'}</p>
                )}
              </div>
              <div>
                <Label>Country</Label>
                {isEditing ? (
                  <Input value={form.country} onChange={(e) => updateField('country', e.target.value)} />
                ) : (
                  <p className="text-foreground">{form.country || '—'}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card className={`shadow-md md:col-span-2 transition-colors duration-300 ${isEditing ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}`}>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>License, IATA, Commission & Specializations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>License Number</Label>
                {isEditing ? (
                  <Input value={form.license_number} onChange={(e) => updateField('license_number', e.target.value)} />
                ) : (
                  <p className="text-foreground">{form.license_number || '—'}</p>
                )}
              </div>
              <div>
                <Label>IATA Number</Label>
                {isEditing ? (
                  <Input value={form.iata_number} onChange={(e) => updateField('iata_number', e.target.value)} />
                ) : (
                  <p className="text-foreground">{form.iata_number || '—'}</p>
                )}
              </div>
              <div>
                <Label>Commission Type</Label>
                {isEditing ? (
                  <Select value={form.commission_type} onValueChange={(v) => updateField('commission_type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="flat">Flat</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-foreground">{form.commission_type || '—'}</p>
                )}
              </div>
              <div>
                <Label>Commission Value</Label>
                {isEditing ? (
                  <Input type="number" value={String(form.commission_value)} onChange={(e) => updateField('commission_value', e.target.value)} />
                ) : (
                  <p className="text-foreground">{String(form.commission_value || '') || '—'}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <Label>Specializations</Label>
                {isEditing ? (
                  <MultiSelect
                    options={SPECIALIZATION_OPTIONS}
                    value={form.specializations}
                    onValueChange={(vals) => updateField('specializations', vals)}
                    placeholder="Select specializations..."
                    showSelectedBadges
                  />
                ) : (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(form.specializations || []).length > 0 ? (
                      (form.specializations || []).map((s, i) => (
                        <Badge key={i} variant="secondary">{s}</Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">—</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            {isEditing && (
              <div className="flex justify-end">
                <Button onClick={() => saveProfile()}>Save</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Branding & Company Documents */}
        <Card className={`shadow-md md:col-span-2 transition-colors duration-300 ${isEditing ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}`}>
          <CardHeader>
            <CardTitle>Branding & Company Documents</CardTitle>
            <CardDescription>Upload logo and manage documents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Company Logo</Label>
                {isEditing && (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="agent-logo-input"
                      onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])}
                    />
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" onClick={() => document.getElementById('agent-logo-input')?.click()}>
                        Update Logo
                      </Button>
                      {form.profile_image && (
                        <Button size="sm" variant="destructive" onClick={() => { if (confirm('Remove current logo?')) removeLogo(); }}>
                          Remove Logo
                        </Button>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Accepted: PNG, JPG, WebP · Max size: {MAX_LOGO_MB}MB</div>
                  </>
                )}
                {form.profile_image && (
                  <div className={`${isMobile ? 'hidden md:flex' : 'flex'} mt-2 h-16 items-center`}>
                    <img
                      src={form.profile_image}
                      alt="Company Logo"
                      className="max-h-16 w-auto object-contain rounded-md border"
                    />
                  </div>
                )}
                {isMobile && form.profile_image && (
                  <div className="text-xs text-muted-foreground mt-1 md:hidden">Logo uploaded</div>
                )}
              </div>
              <div>
                <Label>Business Documents</Label>
                {isEditing && (
                  <>
                    <Input type="file" multiple accept=".pdf,image/*" onChange={(e) => e.target.files && uploadDocuments(e.target.files)} />
                    <div className="text-xs text-muted-foreground mt-1">Accepted: PDF, PNG, JPG, WebP · Max size: {MAX_DOC_MB}MB per file</div>
                  </>
                )}
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {agentDocs.map((d, i) => (
                    <div key={i} className="border rounded-md p-2 flex items-center justify-between">
                      <div className="truncate text-sm">{d.title || d.type}</div>
                      <div className="flex items-center gap-2">
                        {(!isMobile || isEditing) && (
                          <Button size="sm" variant="outline" onClick={() => setPreviewDoc(d)}>Preview</Button>
                        )}
                        <a className="text-blue-600 text-sm" href={d.url} target="_blank" rel="noreferrer">Open</a>
                        {isEditing && (
                          <Button size="sm" variant="destructive" onClick={() => removeDocument(i)}>Delete</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax Information (simplified when empty) */}
        <Card className={`shadow-md md:col-span-2 transition-colors duration-300 ${isEditing ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}`}>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Tax Information</CardTitle>
              <CardDescription>Manage registration, IDs, and certificates</CardDescription>
            </div>
            {taxRecords.length > 0 && isEditing && <Button onClick={() => openTaxDialog()}>+ Add Tax Information</Button>}
          </CardHeader>
          <CardContent>
            {taxRecords.length === 0 ? (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">No tax information added yet.</div>
                {isEditing && <Button onClick={() => openTaxDialog()}>Add Tax Information</Button>}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {taxRecords.map((t) => (
                  <div key={t.id} className="border rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {t.tax_verified ? <Badge className="bg-green-600">Verified</Badge> : (t.tax_registered ? <Badge className="bg-yellow-500">Pending</Badge> : <Badge className="bg-red-600">Not Registered</Badge>)}
                        <div className="text-sm text-muted-foreground">{t.tax_type || '—'} · {t.tax_country || '—'}</div>
                      </div>
                      {isEditing && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openTaxDialog(t)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteTaxRecord(t.id)}>Delete</Button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                      <div>Tax No: {t.tax_number || '—'}</div>
                      <div>GST: {t.gst_number || '—'}</div>
                      <div>PAN: {t.pan_number || '—'}</div>
                      <div>VAT: {t.vat_number || '—'}</div>
                    </div>
                    <div className="mt-2 text-sm">{t.tax_notes || ''}</div>
                    <div className="mt-2 flex items-center gap-2">
                      {isEditing && (
                        <Input type="file" accept=".pdf,image/*" onChange={(e) => e.target.files?.[0] && uploadTaxCertificate(e.target.files[0], t)} />
                      )}
                      {t.tax_certificate_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const url = t.tax_certificate_url as string;
                            const clean = url.split('?')[0];
                            const ext = clean.split('.').pop()?.toLowerCase() || '';
                            const type = ext === 'pdf' ? 'application/pdf'
                              : ext === 'png' ? 'image/png'
                              : (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg'
                              : ext === 'webp' ? 'image/webp'
                              : 'application/octet-stream';
                            setPreviewDoc({ url, type, title: 'Tax Certificate' });
                          }}
                        >
                          Preview Certificate
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile footer using existing component */}
      {isMobile && (
        <MobileBottomNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          notificationCount={0}
        />
      )}

      {/* Tax dialog */}
      <Dialog open={taxDialogOpen} onOpenChange={setTaxDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingTax?.id ? 'Edit Tax Record' : 'Add Tax Record'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tax Country</Label>
              <Input value={editingTax?.tax_country || ''} onChange={(e) => setEditingTax(prev => ({ ...(prev || { agent_id: agentId! }), tax_country: e.target.value }))} />
            </div>
            <div>
              <Label>Tax Type</Label>
              <Select value={editingTax?.tax_type || ''} onValueChange={(v) => setEditingTax(prev => ({ ...(prev || { agent_id: agentId! }), tax_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GST">GST</SelectItem>
                  <SelectItem value="VAT">VAT</SelectItem>
                  <SelectItem value="PAN">PAN</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tax Number</Label>
              <Input value={editingTax?.tax_number || ''} onChange={(e) => setEditingTax(prev => ({ ...(prev || { agent_id: agentId! }), tax_number: e.target.value }))} />
            </div>
            <div>
              <Label>GST Number</Label>
              <Input value={editingTax?.gst_number || ''} onChange={(e) => setEditingTax(prev => ({ ...(prev || { agent_id: agentId! }), gst_number: e.target.value }))} />
            </div>
            <div>
              <Label>PAN Number</Label>
              <Input value={editingTax?.pan_number || ''} onChange={(e) => setEditingTax(prev => ({ ...(prev || { agent_id: agentId! }), pan_number: e.target.value }))} />
            </div>
            <div>
              <Label>VAT Number</Label>
              <Input value={editingTax?.vat_number || ''} onChange={(e) => setEditingTax(prev => ({ ...(prev || { agent_id: agentId! }), vat_number: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <Label>Tax Registered</Label>
                <Switch checked={!!editingTax?.tax_registered} onCheckedChange={(v) => setEditingTax(prev => ({ ...(prev || { agent_id: agentId! }), tax_registered: v }))} />
                <Badge variant="outline">{editingTax?.tax_verified ? 'Verified' : 'Not Verified'}</Badge>
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={editingTax?.tax_notes || ''} onChange={(e) => setEditingTax(prev => ({ ...(prev || { agent_id: agentId! }), tax_notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setTaxDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              const rec = editingTax || { agent_id: agentId! };
              // Validation: if registered, require one of GST/PAN/VAT
              if (rec.tax_registered && !rec.gst_number && !rec.pan_number && !rec.vat_number) {
                toast.error('Provide GST/PAN/VAT when registered');
                return;
              }
              saveTaxRecord(rec);
            }}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview dialog for documents */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => { if (!open) setPreviewDoc(null); }}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewDoc?.title || 'Document Preview'}</DialogTitle>
          </DialogHeader>
          {previewDoc?.type?.startsWith('image/') ? (
            <img src={previewDoc.url} alt={previewDoc.title || 'Document'} className="max-h-[70vh] w-auto mx-auto rounded-md border" />
          ) : previewDoc?.type === 'application/pdf' ? (
            <object data={previewDoc.url} type="application/pdf" width="100%" height="600">
              <a href={previewDoc.url} target="_blank" rel="noreferrer">Open PDF</a>
            </object>
          ) : (
            <div className="text-sm text-muted-foreground">Preview not available. Use the Open link to view.</div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setPreviewDoc(null)}>Close</Button>
            {isEditing && (
              <Button variant="destructive" onClick={() => { const idx = agentDocs.findIndex(x => x.url === previewDoc?.url); if (idx >= 0) removeDocument(idx); setPreviewDoc(null); }}>Delete</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;