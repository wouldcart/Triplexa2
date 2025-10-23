import React, { useEffect, useState } from 'react';
import AgentDashboardHeader from '@/components/dashboards/agent/AgentDashboardHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { useApp } from '@/contexts/AppContext';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { AgentManagementService } from '@/services/agentManagementService';
import { ManagedAgent, AgentStatus } from '@/types/agentManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { Edit3, Save, X, User, Mail, Phone, Building2, MapPin, Percent, DollarSign, Info, Camera, CheckCircle2, AlertCircle } from 'lucide-react';

const statusOptions: AgentStatus[] = ['pending', 'active', 'inactive', 'approved', 'rejected', 'suspended'];
const typeOptions = ['individual', 'company'] as const;
const commissionTypeOptions = ['flat', 'percentage'] as const;
const sourceTypeOptions = ['event', 'lead', 'referral', 'website', 'other'] as const;

const AgentProfilePage: React.FC = () => {
  const isMobile = useIsMobile();
  const { currentUser } = useApp();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<ManagedAgent | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingTax, setSavingTax] = useState(false);
  const [taxForm, setTaxForm] = useState({
    tax_country: '',
    tax_type: '',
    tax_number: '',
    pan_number: '',
    gst_number: '',
    vat_number: '',
    tax_certificate_url: '',
    tax_registered: false,
    tax_verified: false,
    tax_notes: ''
  });

  const [form, setForm] = useState({
    name: '',
    email: '',
    alternate_email: '',
    mobile_numbers: [] as string[],
    profile_image: '',
    agency_name: '',
    license_number: '',
    iata_number: '',
    website: '',
    business_type: 'Sole Proprietor' as 'Sole Proprietor' | 'Private Ltd.' | 'Partnership' | 'Other',
    business_phone: '',
    business_address: '',
    country: '',
    city: '',
    specializations: [] as string[],
    status: 'pending' as AgentStatus,
    type: 'individual' as 'individual' | 'company',
    commission_type: 'flat' as 'flat' | 'percentage',
    commission_value: '' as string | number,
    source_type: 'lead' as 'event' | 'lead' | 'referral' | 'website' | 'other',
    source_details: ''
  });

  // Upload configuration and agent documents state
  const uploadServerUrl = (import.meta.env.VITE_UPLOAD_SERVER_URL as string) || 'http://localhost:4000';
  const [uploadTarget, setUploadTarget] = useState<'local' | 'supabase'>('local');
  const [agentDocs, setAgentDocs] = useState<{ title?: string; url: string; type: string; uploaded_at: string }[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth?.user?.id || currentUser?.id;
        if (!userId) return;

        // Fetch agent record from public.agents by user_id
        const { data: agentRow, error } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && agentRow) {
          const a = agentRow as any;
          setAgentId(a.id || userId);
          setAgent({
            id: a.id || userId,
            name: a.name || a.agency_name || currentUser?.name || '',
            email: a.email || currentUser?.email || '',
            phone: a.business_phone || a.phone || '',
            company_name: a.agency_name || '',
            country: a.country || '',
            city: a.city || '',
            status: (a.status as any) || 'pending',
            type: (a.type as any) || 'individual',
            commission_type: (a.commission_type as any) || 'flat',
            commission_value: (a.commission_value as any) || '',
            source_type: (a.source_type as any) || 'lead',
            source_details: (a.source_details as any) || ''
          } as any);

          setForm({
            name: a.name || a.agency_name || '',
            email: a.email || currentUser?.email || '',
            alternate_email: a.alternate_email || '',
            mobile_numbers: Array.isArray(a.mobile_numbers) ? a.mobile_numbers : [],
            profile_image: a.profile_image || '',
            agency_name: a.agency_name || '',
            license_number: a.license_number || '',
            iata_number: a.iata_number || '',
            website: a.website || '',
            business_type: a.business_type || 'Sole Proprietor',
            business_phone: a.business_phone || '',
            business_address: a.business_address || '',
            country: a.country || '',
            city: a.city || '',
            specializations: Array.isArray(a.specializations) ? a.specializations : [],
            status: (a.status as any) || 'pending',
            type: (a.type as any) || 'individual',
            commission_type: (a.commission_type as any) || 'flat',
            commission_value: (a.commission_value as any) || '',
            source_type: (a.source_type as any) || 'lead',
            source_details: (a.source_details as any) || ''
          });
        }

        // Load agent_settings preferences for documents
        const { data: settingsRow, error: settingsErr } = await (supabase as any)
          .from('agent_settings')
          .select('preferences')
          .eq('agent_id', userId)
          .maybeSingle();
        if (!settingsErr && settingsRow && settingsRow.preferences && Array.isArray(settingsRow.preferences.documents)) {
          setAgentDocs(settingsRow.preferences.documents);
        }
      } catch (e) {
        // silent fail: keep defaults
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser?.id]);

  useEffect(() => {
    (async () => {
      if (!agentId) return;
      try {
        const { data, error } = await (supabase as any)
          .from('agent_tax_info')
          .select('*')
          .eq('agent_id', agentId)
          .maybeSingle();
        if (!error && data) {
          const t = data as any;
          setTaxForm({
            tax_country: t.tax_country || '',
            tax_type: t.tax_type || '',
            tax_number: t.tax_number || '',
            pan_number: t.pan_number || '',
            gst_number: t.gst_number || '',
            vat_number: t.vat_number || '',
            tax_certificate_url: t.tax_certificate_url || '',
            tax_registered: !!t.tax_registered,
            tax_verified: !!t.tax_verified,
            tax_notes: t.tax_notes || ''
          });
        }
      } catch { /* noop */ }
    })();
  }, [agentId]);

  const updateField = (key: keyof typeof form, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSavingProfile(true);
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user?.id) throw new Error('Not authenticated');

      const payload = {
        name: form.name,
        alternate_email: form.alternate_email || null,
        mobile_numbers: (form.mobile_numbers || []).filter(n => n && n.trim()),
        agency_name: form.agency_name,
        license_number: form.license_number || null,
        iata_number: form.iata_number || null,
        website: form.website || null,
        business_type: form.business_type,
        business_phone: form.business_phone || null,
        business_address: form.business_address || null,
        country: form.country,
        city: form.city,
        specializations: (form.specializations || []),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('agents')
        .update(payload)
        .eq('user_id', user.id);
      if (error) throw error;

      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // Mobile numbers management
  const addMobileNumber = () => updateField('mobile_numbers', [...(form.mobile_numbers || []), '']);
  const updateMobileNumber = (idx: number, value: string) => {
    const numbers = [...(form.mobile_numbers || [])];
    numbers[idx] = value;
    updateField('mobile_numbers', numbers);
  };
  const removeMobileNumber = (idx: number) => {
    const numbers = [...(form.mobile_numbers || [])];
    numbers.splice(idx, 1);
    updateField('mobile_numbers', numbers);
  };

  // Specializations management
  const [newSpecialization, setNewSpecialization] = useState('');
  const addSpecialization = () => {
    const label = newSpecialization.trim();
    if (!label) return;
    const set = new Set([...(form.specializations || []), label]);
    updateField('specializations', Array.from(set));
    setNewSpecialization('');
  };
  const removeSpecialization = (label: string) => {
    updateField('specializations', (form.specializations || []).filter(s => s !== label));
  };

  // Logo upload
  const uploadLogo = async (file: File) => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) throw new Error('Not authenticated');
      const id = agentId || user.id;

      let publicUrl = '';
      if (uploadTarget === 'local') {
        const fd = new FormData();
        fd.append('file', file);
        const resp = await fetch(`${uploadServerUrl}/upload/agent/${id}/logo`, {
          method: 'POST',
          body: fd,
        });
        if (!resp.ok) throw new Error(`Local upload failed: ${resp.status}`);
        const json = await resp.json();
        publicUrl = json?.url;
        if (!publicUrl) throw new Error('Upload server did not return URL');
      } else {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
        const path = `agents/${id}/profile.${ext}`;
        const { error } = await supabase.storage.from('agent-media').upload(path, file, { upsert: true });
        if (error) throw error;
        const { data: publicUrlData } = supabase.storage.from('agent-media').getPublicUrl(path);
        publicUrl = (publicUrlData as any)?.publicUrl;
      }

      const { error: updateErr } = await supabase
        .from('agents')
        .update({ profile_image: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (updateErr) throw updateErr;
      updateField('profile_image', publicUrl);
      toast.success('Profile logo uploaded.');
    } catch (e: any) {
      toast.error(e?.message || 'Logo upload failed');
    }
  };

  const uploadTaxCertificate = async (file: File) => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      const id = user?.id;
      if (!id) throw new Error('Not authenticated');
      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const path = `agents/${id}/tax_certificate.${ext}`;
      const { error } = await supabase.storage.from('agent-media').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage.from('agent-media').getPublicUrl(path);
      const publicUrl = (publicUrlData as any)?.publicUrl;

      // upsert tax info with new certificate url
      const payload = {
        agent_id: id,
        tax_country: taxForm.tax_country || null,
        tax_type: taxForm.tax_type || null,
        tax_number: taxForm.tax_number || null,
        pan_number: taxForm.pan_number || null,
        gst_number: taxForm.gst_number || null,
        vat_number: taxForm.vat_number || null,
        tax_certificate_url: publicUrl,
        tax_registered: !!taxForm.tax_registered,
        tax_verified: !!taxForm.tax_verified,
        tax_notes: taxForm.tax_notes || null,
        updated_at: new Date().toISOString()
      };
      const { data: existing, error: selErr } = await (supabase as any)
        .from('agent_tax_info')
        .select('agent_id')
        .eq('agent_id', id)
        .maybeSingle();
      if (selErr) throw selErr;
      if (existing) {
        const { error: updErr } = await (supabase as any)
          .from('agent_tax_info')
          .update(payload)
          .eq('agent_id', id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await (supabase as any)
          .from('agent_tax_info')
          .insert(payload);
        if (insErr) throw insErr;
      }

      setTaxForm(prev => ({ ...prev, tax_certificate_url: publicUrl }));
      toast.success('Tax certificate uploaded.');
    } catch (e: any) {
      toast.error(e?.message || 'Tax info upload failed');
    }
  };

  // Persist agent documents in agent_settings.preferences
  const saveAgentSettingsPreferences = async (
    docs: { title?: string; url: string; type: string; uploaded_at: string }[]
  ) => {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user?.id) throw new Error('Not authenticated');
    const payload = { preferences: { documents: docs }, updated_at: new Date().toISOString() };

    const { data: existing, error: selErr } = await (supabase as any)
      .from('agent_settings')
      .select('agent_id')
      .eq('agent_id', user.id)
      .maybeSingle();
    if (selErr) throw selErr;
    if (existing) {
      const { error: updErr } = await (supabase as any)
        .from('agent_settings')
        .update(payload)
        .eq('agent_id', user.id);
      if (updErr) throw updErr;
    } else {
      const { error: insErr } = await (supabase as any)
        .from('agent_settings')
        .insert({ agent_id: user.id, created_at: new Date().toISOString(), ...payload });
      if (insErr) throw insErr;
    }
  };

  // Document upload with dual storage
  const uploadAgentDocument = async (file: File) => {
    try {
      setIsUploadingDoc(true);
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user?.id) throw new Error('Not authenticated');
      const id = user.id;

      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const type = file.type || (ext === 'pdf' ? 'application/pdf' : 'application/octet-stream');
      let url = '';

      if (uploadTarget === 'local') {
        const fd = new FormData();
        fd.append('file', file);
        const resp = await fetch(`${uploadServerUrl}/upload/agent/${id}/documents`, { method: 'POST', body: fd });
        if (!resp.ok) throw new Error(`Local upload failed: ${resp.status}`);
        const json = await resp.json();
        url = json?.url;
        if (!url) throw new Error('Upload server did not return URL');
      } else {
        const filename = `agents/${id}/documents/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('agent-media').upload(filename, file, { upsert: true, contentType: type });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('agent-media').getPublicUrl(filename);
        url = (pub as any)?.publicUrl;
      }

      const docEntry = { title: file.name, url, type, uploaded_at: new Date().toISOString() };
      const docs = [...agentDocs, docEntry];
      setAgentDocs(docs);
      await saveAgentSettingsPreferences(docs);
      toast.success('Document uploaded.');
    } catch (e: any) {
      toast.error(e?.message || 'Document upload failed');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleSaveTax = async () => {
    try {
      setSavingTax(true);
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      const id = user?.id;
      if (!id) throw new Error('Not authenticated');

      // basic validation
      if (taxForm.gst_number && taxForm.gst_number.length !== 15) {
        toast.error('GST must be 15 characters');
        return;
      }
      if (taxForm.pan_number && taxForm.pan_number.length !== 10) {
        toast.error('PAN must be 10 characters');
        return;
      }
      if (taxForm.vat_number && taxForm.vat_number.length < 8) {
        toast.error('VAT must be at least 8 characters');
        return;
      }

      const payload = {
        agent_id: id,
        tax_country: taxForm.tax_country || null,
        tax_type: taxForm.tax_type || null,
        tax_number: taxForm.tax_number || null,
        pan_number: taxForm.pan_number || null,
        gst_number: taxForm.gst_number || null,
        vat_number: taxForm.vat_number || null,
        tax_certificate_url: taxForm.tax_certificate_url || null,
        tax_registered: !!taxForm.tax_registered,
        tax_verified: !!taxForm.tax_verified,
        tax_notes: taxForm.tax_notes || null,
        updated_at: new Date().toISOString()
      };

      const { data: existing, error: selErr } = await (supabase as any)
        .from('agent_tax_info')
        .select('agent_id')
        .eq('agent_id', id)
        .maybeSingle();
      if (selErr) throw selErr;
      if (existing) {
        const { error: updErr } = await (supabase as any)
          .from('agent_tax_info')
          .update(payload)
          .eq('agent_id', id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await (supabase as any)
          .from('agent_tax_info')
          .insert(payload);
        if (insErr) throw insErr;
      }

      toast.success('Tax details saved!');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save tax details');
    } finally {
      setSavingTax(false);
    }
  };

  // Profile completion progress
  const requiredFields = ['name','agency_name','country','city','mobile_numbers'] as const;
  const completedCount = requiredFields.filter((f) => f === 'mobile_numbers' ? (form.mobile_numbers && form.mobile_numbers.length > 0) : Boolean((form as any)[f])).length;
  const completion = Math.round((completedCount / requiredFields.length) * 100);

  return (
    <div className={`min-h-screen bg-background ${isMobile ? 'pb-20' : ''}`}>
      <AgentDashboardHeader />

      <div className={`container mx-auto ${isMobile ? 'px-4 py-4' : 'p-6'} space-y-6`}>
        {/* Header */}
        <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border">
          <div className="flex justify-between items-start">
            <div>
              <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold`}>Agent Profile</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{agent?.status || form.status}</Badge>
                <span className="text-sm text-muted-foreground">{agent?.company_name || form.agency_name || '—'}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Completion */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Completion</CardTitle>
            <CardDescription>Complete required fields to finish setup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Progress value={completion} className="w-full" />
              <span className="text-sm text-muted-foreground">{completion}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Profile Summary */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className={`${isMobile ? 'h-14 w-14' : 'h-20 w-20'}`}>
              <AvatarImage src={form.profile_image || ''} />
              <AvatarFallback>{(form.name || 'A').charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>{form.name || 'Agent'}</h3>
              <p className="text-muted-foreground">{form.agency_name || '—'}</p>
              <Badge variant="secondary" className="mt-1">Travel Agent</Badge>
              {isEditing && (
                <div className="mt-2">
                  <Label htmlFor="profile_image_upload">Profile Image</Label>
                  <Input id="profile_image_upload" type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadLogo(file);
                  }} />
                </div>
              )}
            </div>
            </div>
          </CardContent>
        </Card>

        {/* Branding & Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Branding & Documents</CardTitle>
            <CardDescription>Upload logo and manage agent documents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label>Storage Target</Label>
                <Select value={uploadTarget} onValueChange={(v) => setUploadTarget(v as 'local' | 'supabase')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose storage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local Uploads</SelectItem>
                    <SelectItem value="supabase">Supabase Storage</SelectItem>
                  </SelectContent>
                </Select>
                <div className="space-y-2">
                  <Label htmlFor="profile_image_upload2">Company Logo</Label>
                  <Input id="profile_image_upload2" type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadLogo(file);
                  }} />
                  {form.profile_image && (
                    <img src={form.profile_image} alt="Logo" className="h-14 mt-2 rounded-md border" />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="agent_doc_upload">Documents</Label>
                <Input id="agent_doc_upload" type="file" accept=".pdf,image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadAgentDocument(file);
                }} />
                <div className="space-y-2">
                  {agentDocs.length ? (
                    agentDocs.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 border rounded-md">
                        <div>
                          <div className="text-sm font-medium">{doc.title || doc.type}</div>
                          <div className="text-xs text-muted-foreground">{new Date(doc.uploaded_at).toLocaleString()}</div>
                        </div>
                        <a href={doc.url} target="_blank" rel="noreferrer" className="text-primary text-sm">View</a>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No documents uploaded.</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Editable Details */}
        <Card>
          <CardHeader>
            <CardTitle>Personal & Business Details</CardTitle>
            <CardDescription>Update contact info and basic profile data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                {isEditing ? (
                  <Input id="name" value={form.name} onChange={(e) => updateField('name', e.target.value)} />
                ) : (
                  <div className="flex items-center p-3 bg-muted rounded-md">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    {form.name || '—'}
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                {isEditing ? (
                  <Input id="email" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} />
                ) : (
                  <div className="flex items-center p-3 bg-muted rounded-md">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    {form.email || '—'}
                  </div>
                )}
              </div>

              {/* Agency / Company (from public.agents.agency_name via ManagedAgent.company_name) */}
              {!isEditing && (
                <div className="space-y-2">
                  <Label>Agency / Company</Label>
                  <div className="flex items-center p-3 bg-muted rounded-md">
                    <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                    {form.agency_name || '—'}
                  </div>
                </div>
              )}
              {/* Alternate Email */}
              <div className="space-y-2">
                <Label htmlFor="alternate_email">Alternate Email</Label>
                {isEditing ? (
                  <Input id="alternate_email" type="email" value={form.alternate_email} onChange={(e) => updateField('alternate_email', e.target.value)} />
                ) : (
                  <div className="flex items-center p-3 bg-muted rounded-md">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    {form.alternate_email || '—'}
                  </div>
                )}
              </div>

              {/* Agency / Company Name */}
              <div className="space-y-2">
                <Label htmlFor="agency_name">Agency / Company Name</Label>
                {isEditing ? (
                  <Input id="agency_name" value={form.agency_name} onChange={(e) => updateField('agency_name', e.target.value)} />
                ) : (
                  <div className="flex items-center p-3 bg-muted rounded-md">
                    <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                    {form.agency_name || '—'}
                  </div>
                )}
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                {isEditing ? (
                  <Input id="country" value={form.country} onChange={(e) => updateField('country', e.target.value)} />
                ) : (
                  <div className="flex items-center p-3 bg-muted rounded-md">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    {form.country || '—'}
                  </div>
                )}
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                {isEditing ? (
                  <Input id="city" value={form.city} onChange={(e) => updateField('city', e.target.value)} />
                ) : (
                  <div className="flex items-center p-3 bg-muted rounded-md">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    {form.city || '—'}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Details */}
        <Card>
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
            <CardDescription>Legal, contact, and website information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* License Number */}
              <div className="space-y-2">
                <Label htmlFor="license_number">License Number</Label>
                {isEditing ? (
                  <Input id="license_number" value={form.license_number} onChange={(e) => updateField('license_number', e.target.value)} />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {form.license_number || '—'}
                  </div>
                )}
              </div>

              {/* IATA Number */}
              <div className="space-y-2">
                <Label htmlFor="iata_number">IATA Number</Label>
                {isEditing ? (
                  <Input id="iata_number" value={form.iata_number} onChange={(e) => updateField('iata_number', e.target.value)} />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {form.iata_number || '—'}
                  </div>
                )}
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                {isEditing ? (
                  <Input id="website" type="url" value={form.website} onChange={(e) => updateField('website', e.target.value)} />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {form.website || '—'}
                  </div>
                )}
              </div>

              {/* Business Type */}
              <div className="space-y-2">
                <Label>Business Type</Label>
                {isEditing ? (
                  <Select value={form.business_type} onValueChange={(v) => updateField('business_type', v as 'Sole Proprietor' | 'Private Ltd.' | 'Partnership' | 'Other')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sole Proprietor">Sole Proprietor</SelectItem>
                      <SelectItem value="Private Ltd.">Private Ltd.</SelectItem>
                      <SelectItem value="Partnership">Partnership</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {form.business_type || '—'}
                  </div>
                )}
              </div>

              {/* Business Phone */}
              <div className="space-y-2">
                <Label htmlFor="business_phone">Business Phone</Label>
                {isEditing ? (
                  <Input id="business_phone" value={form.business_phone} onChange={(e) => updateField('business_phone', e.target.value)} />
                ) : (
                  <div className="flex items-center p-3 bg-muted rounded-md">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    {form.business_phone || '—'}
                  </div>
                )}
              </div>

              {/* Business Address */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="business_address">Business Address</Label>
                {isEditing ? (
                  <Textarea id="business_address" value={form.business_address} onChange={(e) => updateField('business_address', e.target.value)} />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {form.business_address || '—'}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Numbers */}
            <div className="space-y-2">
              <Label>Mobile Numbers</Label>
              {isEditing ? (
                <div className="space-y-2">
                  {(form.mobile_numbers || []).map((num, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input value={num} onChange={(e) => updateMobileNumber(idx, e.target.value)} />
                      <Button variant="outline" onClick={() => removeMobileNumber(idx)}>Remove</Button>
                    </div>
                  ))}
                  <Button variant="secondary" onClick={addMobileNumber}>Add Number</Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(form.mobile_numbers || []).length > 0 ? (
                    (form.mobile_numbers || []).map((num, idx) => (
                      <Badge key={idx} variant="outline">{num}</Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Specialization */}
        <Card>
          <CardHeader>
            <CardTitle>Specialization</CardTitle>
            <CardDescription>Your areas of expertise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="Add specialization" value={newSpecialization} onChange={(e) => setNewSpecialization(e.target.value)} />
                  <Button variant="secondary" onClick={addSpecialization}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(form.specializations || []).map((s) => (
                    <Badge key={s} variant="secondary" className="flex items-center gap-1">
                      {s}
                      <button className="ml-1 text-xs text-muted-foreground hover:text-foreground" onClick={() => removeSpecialization(s)}>×</button>
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(form.specializations || []).length > 0 ? (
                  (form.specializations || []).map((s) => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tax Information */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Tax Information</CardTitle>
                <CardDescription>Manage your tax details and certificates</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {taxForm.tax_verified ? (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    Pending Verification
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax_country">Tax Country</Label>
                <Input id="tax_country" value={taxForm.tax_country || ''} disabled={!isEditing} onChange={(e) => setTaxForm(prev => ({ ...prev, tax_country: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_type">Tax Type</Label>
                <Input id="tax_type" value={taxForm.tax_type || ''} disabled={!isEditing} onChange={(e) => setTaxForm(prev => ({ ...prev, tax_type: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_number">Tax Number</Label>
                <Input id="tax_number" value={taxForm.tax_number || ''} disabled={!isEditing} onChange={(e) => setTaxForm(prev => ({ ...prev, tax_number: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gst_number">GST Number</Label>
                <Input id="gst_number" value={taxForm.gst_number || ''} disabled={!isEditing} onChange={(e) => setTaxForm(prev => ({ ...prev, gst_number: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pan_number">PAN Number</Label>
                <Input id="pan_number" value={taxForm.pan_number || ''} disabled={!isEditing} onChange={(e) => setTaxForm(prev => ({ ...prev, pan_number: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vat_number">VAT Number</Label>
                <Input id="vat_number" value={taxForm.vat_number || ''} disabled={!isEditing} onChange={(e) => setTaxForm(prev => ({ ...prev, vat_number: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Registered</Label>
                <div className="flex items-center gap-2">
                  <Switch checked={!!taxForm.tax_registered} disabled={!isEditing} onCheckedChange={(v) => setTaxForm(prev => ({ ...prev, tax_registered: v }))} />
                  <span className="text-sm text-muted-foreground">{taxForm.tax_registered ? 'Registered' : 'Not Registered'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_certificate_upload">Tax Certificate</Label>
                <Input id="tax_certificate_upload" type="file" accept=".pdf,image/*" disabled={!isEditing} onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadTaxCertificate(file); }} />
                {taxForm.tax_certificate_url ? (
                  <a href={taxForm.tax_certificate_url} target="_blank" rel="noreferrer" className="text-sm text-primary">View current certificate</a>
                ) : (
                  <span className="text-sm text-muted-foreground">No certificate uploaded</span>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="tax_notes">Notes / Comments</Label>
                <Textarea id="tax_notes" value={taxForm.tax_notes || ''} disabled={!isEditing} onChange={(e) => setTaxForm(prev => ({ ...prev, tax_notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveTax} disabled={savingTax || !isEditing}>
                <Save className="h-4 w-4 mr-2" />
                Save Tax Details
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Agent Table Fields */}
        <Card className="hidden">
          <CardHeader>
            <CardTitle>Agent Settings</CardTitle>
            <CardDescription>Manage status, commission, and source details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                {isEditing ? (
                  <Select value={form.status} onValueChange={(v) => updateField('status', v as AgentStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center p-3 bg-muted rounded-md">
                    <Info className="h-4 w-4 mr-2 text-muted-foreground" />
                    {String(form.status)}
                  </div>
                )}
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label>Agent Type</Label>
                {isEditing ? (
                  <Select value={form.type} onValueChange={(v) => updateField('type', v as 'individual' | 'company')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center p-3 bg-muted rounded-md">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    {String(form.type)}
                  </div>
                )}
              </div>

              {/* Commission Type */}
              <div className="space-y-2">
                <Label>Commission Type</Label>
                {isEditing ? (
                  <Select value={form.commission_type} onValueChange={(v) => updateField('commission_type', v as 'flat' | 'percentage')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select commission type" />
                    </SelectTrigger>
                    <SelectContent>
                      {commissionTypeOptions.map(ct => (
                        <SelectItem key={ct} value={ct}>{ct}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center p-3 bg-muted rounded-md">
                    <Percent className="h-4 w-4 mr-2 text-muted-foreground" />
                    {String(form.commission_type)}
                  </div>
                )}
              </div>

              {/* Commission Value */}
              <div className="space-y-2">
                <Label>Commission Value</Label>
                {isEditing ? (
                  <Input type="number" value={String(form.commission_value || '')} onChange={(e) => updateField('commission_value', e.target.value)} />
                ) : (
                  <div className="flex items-center p-3 bg-muted rounded-md">
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    {String(form.commission_value || '—')}
                  </div>
                )}
              </div>

              {/* Source Type */}
              <div className="space-y-2">
                <Label>Source Type</Label>
                {isEditing ? (
                  <Select value={form.source_type} onValueChange={(v) => updateField('source_type', v as 'event' | 'lead' | 'referral' | 'website' | 'other')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source type" />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceTypeOptions.map(st => (
                        <SelectItem key={st} value={st}>{st}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center p-3 bg-muted rounded-md">
                    <Info className="h-4 w-4 mr-2 text-muted-foreground" />
                    {String(form.source_type || '—')}
                  </div>
                )}
              </div>

              {/* Source Details */}
              <div className="space-y-2 md:col-span-2">
                <Label>Source Details</Label>
                {isEditing ? (
                  <Input value={form.source_details || ''} onChange={(e) => updateField('source_details', e.target.value)} />
                ) : (
                  <div className="flex items-center p-3 bg-muted rounded-md">
                    <Info className="h-4 w-4 mr-2 text-muted-foreground" />
                    {String(form.source_details || '—')}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentProfilePage;