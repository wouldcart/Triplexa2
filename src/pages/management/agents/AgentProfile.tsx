
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  BarChart3, 
  Calendar, 
  CheckCheck, 
  Clock, 
  FileText, 
  Globe, 
  Mail, 
  MapPin, 
  Phone, 
  PieChart, 
  Star, 
  Users, 
  Building, 
  User,
  Upload,
  Trash2
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';

import { supabase, adminSupabase, isAdminClientConfigured } from '@/lib/supabaseClient';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageLayout from '@/components/layout/PageLayout';
import { 
  getQueriesByAgentId, 
  getBookingsByAgentId,
  getCustomersByAgentId,
  getRecentActivity,
  getStaffAssignmentsForAgent
} from '@/data/agentData';
import { AgentManagementService } from '@/services/agentManagementService';
import { Agent, AgentActivity, Customer } from '@/types/agent';
import { Query } from '@/types/query';
import StaffAssignmentTab from './components/StaffAssignmentTab';
import { useToast } from '@/hooks/use-toast';
import type { Agent as UiAgent } from '@/types/agent';
import { useAccessControl } from '@/hooks/use-access-control';

const AgentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, isManager, isStaff, hasAdminAccess } = useAccessControl();
  const canEdit = hasAdminAccess || isStaff;
  const canDelete = hasAdminAccess;
  const [agent, setAgent] = useState<UiAgent | null>(null);
  const [queries, setQueries] = useState<Query[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [recentActivity, setRecentActivity] = useState<AgentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [detailsForm, setDetailsForm] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    agency_code: '',
    city: '',
    country: '',
    status: 'active' as 'active' | 'inactive' | 'suspended',
    type: 'individual' as 'individual' | 'company',
    commission_type: 'percentage' as 'percentage' | 'flat',
    commission_value: '' as string | number,
    // extended optional fields
    alternate_email: '',
    business_phone: '',
    mobile_numbers_text: '',
    website: '',
    partnership: '',
    business_address: '',
    license_number: '',
    iata_number: '',
    specializations_text: ''
  });
  const [taxRecords, setTaxRecords] = useState<any[]>([]);
  const [taxLoading, setTaxLoading] = useState(false);
  const [editingTax, setEditingTax] = useState<any | null>(null);
  const { toast } = useToast();
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [brandingFiles, setBrandingFiles] = useState<{ name: string; publicUrl: string }[]>([]);
  const [brandingLoading, setBrandingLoading] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const brandingInputRef = useRef<HTMLInputElement>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const taxCertInputRef = useRef<HTMLInputElement>(null);
  const [certTargetRecordId, setCertTargetRecordId] = useState<string | null>(null);
  const [uploadingTaxCert, setUploadingTaxCert] = useState(false);
  const [creatorProfile, setCreatorProfile] = useState<{ name?: string; email?: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<{ name: string; publicUrl: string } | null>(null);

  const loadAgentData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const client = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      const { data: agentRow, error } = await client
        .from('agents')
        .select('*, agent_tax_info(*)')
        .eq('id', id)
        .single();
      if (error) throw error;

      const a: any = agentRow || {};
      const uiAgent: UiAgent = {
        id: Number.isNaN(parseInt(id)) ? 0 : parseInt(id),
        name: a.name || a.agency_name || '',
        email: a.email || '',
        country: a.country || '',
        city: a.city || '',
        type: (a.business_type === 'company' ? 'company' : 'individual'),
        status: (a.status === 'active' ? 'active' : a.status === 'inactive' ? 'inactive' : 'suspended') as any,
        commissionType: (a?.commission_structure?.type === 'flat' ? 'flat' : 'percentage'),
        commissionValue: (a?.commission_structure?.value !== undefined && a?.commission_structure?.value !== null) ? String(a.commission_structure.value) : '',
        profileImage: a.profile_image || undefined,
        contact: {
          email: a.email || '',
          phone: a.business_phone || '',
          website: a.website || '',
          address: a.business_address || ''
        },
        joinDate: a.created_at || new Date().toISOString(),
        createdAt: a.created_at || new Date().toISOString(),
        source: { type: a.source_type || 'website', details: a.source_details || '' },
        stats: { totalQueries: 0, totalBookings: 0, conversionRate: 0, revenueGenerated: 0, averageBookingValue: 0, activeCustomers: 0 },
        recentActivity: [],
        staffAssignments: []
      };
      setAgent(uiAgent);

      setDetailsForm(prev => ({
        ...prev,
        name: a.name || '',
        email: a.email || '',
        phone: a.business_phone || '',
        company_name: a.agency_name || '',
        agency_code: a.agency_code || '',
        city: a.city || '',
        country: a.country || '',
        status: (a.status === 'active' ? 'active' : a.status === 'inactive' ? 'inactive' : 'suspended') as any,
        type: (a.business_type === 'company' ? 'company' : 'individual'),
        commission_type: (a?.commission_structure?.type === 'flat' ? 'flat' : 'percentage'),
        commission_value: (a?.commission_structure?.value ?? ''),
        alternate_email: a.alternate_email || '',
        business_phone: a.business_phone || '',
        mobile_numbers_text: Array.isArray(a.mobile_numbers) ? (a.mobile_numbers as string[]).join(', ') : '',
        website: a.website || '',
        partnership: a.partnership || '',
        business_address: a.business_address || '',
        license_number: a.license_number || '',
        iata_number: a.iata_number || '',
        specializations_text: Array.isArray(a.specializations) ? (a.specializations as string[]).join(', ') : ''
      }));

      const taxRecords = Array.isArray(a.agent_tax_info) ? a.agent_tax_info : a.agent_tax_info ? [a.agent_tax_info] : [];
      setTaxRecords(taxRecords);

      if (a.created_by) {
        const { data: creator } = await client.from('profiles').select('name,email').eq('id', a.created_by).single();
        if (creator) setCreatorProfile(creator as any);
      } else {
        setCreatorProfile(null);
      }

      if (Array.isArray(a.documents) && a.documents.length) {
        setBrandingFiles(a.documents.map((url: string) => ({ name: url.split('/').pop() || url, publicUrl: url })));
      } else {
        await loadBrandingFiles();
      }

      const agentIdNum = Number.isNaN(parseInt(id)) ? 0 : parseInt(id);
      setQueries(getQueriesByAgentId(agentIdNum));
      setBookings(getBookingsByAgentId(agentIdNum));
      setCustomers(getCustomersByAgentId(agentIdNum));
      setRecentActivity(getRecentActivity(agentIdNum));
    } catch (err) {
      const { data, error } = await AgentManagementService.getAgentById(String(id));
      if (error) {
        console.error('Failed to load agent', error);
      }
      if (data) {
        const a = data as any;
        const uiAgent: UiAgent = {
          id: Number.isNaN(parseInt(id)) ? 0 : parseInt(id),
          name: a.name || '',
          email: a.email || '',
          country: a.country || '',
          city: a.city || '',
          type: (a.type === 'company' ? 'company' : 'individual'),
          status: (a.status === 'active' ? 'active' : a.status === 'inactive' ? 'inactive' : 'suspended') as any,
          commissionType: (a.commission_type === 'flat' ? 'flat' : 'percentage'),
          commissionValue: (a.commission_value !== undefined && a.commission_value !== null) ? String(a.commission_value) : '',
          profileImage: a.profile_image || undefined,
          contact: { email: a.email || '', phone: a.phone || '', website: (a as any).website || '', address: (a as any).business_address || '' },
          joinDate: a.created_at || new Date().toISOString(),
          createdAt: a.created_at || new Date().toISOString(),
          source: { type: (a.source_type || 'website'), details: a.source_details || '' },
          stats: { totalQueries: 0, totalBookings: 0, conversionRate: 0, revenueGenerated: 0, averageBookingValue: 0, activeCustomers: 0 },
          recentActivity: [],
          staffAssignments: []
        };
        setAgent(uiAgent);
        const agentIdNum = Number.isNaN(parseInt(id)) ? 0 : parseInt(id);
        setQueries(getQueriesByAgentId(agentIdNum));
        setBookings(getBookingsByAgentId(agentIdNum));
        setCustomers(getCustomersByAgentId(agentIdNum));
        setRecentActivity(getRecentActivity(agentIdNum));
        setDetailsForm(prev => ({
          ...prev,
          name: a.name || '',
          email: a.email || '',
          phone: a.phone || '',
          company_name: a.company_name || a.agency_name || '',
          city: a.city || '',
          country: a.country || '',
          status: (a.status === 'active' ? 'active' : a.status === 'inactive' ? 'inactive' : 'suspended') as any,
          type: a.type === 'company' ? 'company' : 'individual',
          commission_type: a.commission_type === 'flat' ? 'flat' : 'percentage',
          commission_value: a.commission_value ?? '',
          alternate_email: (a as any).alternate_email || '',
          business_phone: (a as any).business_phone || '',
          mobile_numbers_text: Array.isArray((a as any).mobile_numbers) ? ((a as any).mobile_numbers as string[]).join(', ') : '',
          website: (a as any).website || '',
          partnership: (a as any).partnership || '',
          business_address: (a as any).business_address || '',
          license_number: (a as any).license_number || '',
          iata_number: (a as any).iata_number || '',
          specializations_text: Array.isArray((a as any).specializations) ? ((a as any).specializations as string[]).join(', ') : ''
        }));
        try {
          setTaxLoading(true);
          const { data: tx } = await AgentManagementService.getAgentTaxInfo(String(id));
          setTaxRecords(tx || []);
        } catch {} finally { setTaxLoading(false); }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgentData();
  }, [id]);

  useEffect(() => {
    if (id) {
      loadBrandingFiles();
    }
  }, [id]);

  // Handler for when staff assignments change
  const handleAssignmentChange = () => {
    loadAgentData();
  };

  // Branding documents storage helpers
  const storageClient = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
  const brandingBucket = 'agent_branding';
  const brandingPrefix = id ? `agents/${id}/docs` : '';

  async function loadBrandingFiles() {
    if (!id) return;
    setBrandingLoading(true);
    try {
      const { data, error } = await storageClient.storage.from(brandingBucket).list(brandingPrefix, { limit: 100, offset: 0 });
      if (error) throw error;
      const files = (data || []).filter((item: any) => item && !String(item.name || '').endsWith('/')).map((item: any) => {
        const path = `${brandingPrefix}/${item.name}`;
        const { data: pub } = storageClient.storage.from(brandingBucket).getPublicUrl(path);
        return { name: item.name as string, publicUrl: pub?.publicUrl as string };
      });
      setBrandingFiles(files);
    } catch (err) {
      console.error('Failed to load branding files', err);
    } finally {
      setBrandingLoading(false);
    }
  }



  if (loading) {
    return (
      <PageLayout title="Agent Profile">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading agent profile...</p>
        </div>
      </PageLayout>
    );
  }

  if (!agent) {
    return (
      <PageLayout title="Agent Profile">
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">Agent not found</p>
        </div>
      </PageLayout>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd MMM yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  const formatDateTime = (dateTimeStr: string) => {
    try {
      return format(new Date(dateTimeStr), 'dd MMM yyyy, HH:mm');
    } catch (e) {
      return dateTimeStr;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const updateDetailsField = (field: keyof typeof detailsForm, value: any) => {
    setDetailsForm(prev => ({ ...prev, [field]: value }));
  };

  const saveDetails = async () => {
    if (!id) return;
    const mobileNumbersArray = detailsForm.mobile_numbers_text
      ? detailsForm.mobile_numbers_text.split(',').map(s => s.trim()).filter(s => s.length > 0)
      : [];
    const specializationsArray = detailsForm.specializations_text
      ? detailsForm.specializations_text.split(',').map(s => s.trim()).filter(s => s.length > 0)
      : [];
    try {
      const client = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      const { error } = await client.from('agents').update({
        name: detailsForm.name,
        email: detailsForm.email,
        business_phone: detailsForm.business_phone || detailsForm.phone,
        agency_name: detailsForm.company_name,
        agency_code: detailsForm.agency_code,
        country: detailsForm.country,
        city: detailsForm.city,
        status: detailsForm.status,
        business_type: detailsForm.type,
        commission_type: detailsForm.commission_type,
        commission_value: detailsForm.commission_value,
        commission_structure: { type: detailsForm.commission_type, value: Number(detailsForm.commission_value || 0) },
        alternate_email: detailsForm.alternate_email,
        website: detailsForm.website,
        partnership: detailsForm.partnership,
        business_address: detailsForm.business_address,
        license_number: detailsForm.license_number,
        iata_number: detailsForm.iata_number,
        mobile_numbers: mobileNumbersArray,
        specializations: specializationsArray,
        updated_at: new Date().toISOString()
      }).eq('id', id);
      if (error) throw error;
      setIsEditingDetails(false);
      await loadAgentData();
    } catch (err) {
      const { error } = await AgentManagementService.updateAgent({
        id: String(id),
        name: detailsForm.name,
        email: detailsForm.email,
        phone: detailsForm.phone,
        company_name: detailsForm.company_name,
        country: detailsForm.country,
        city: detailsForm.city,
        status: detailsForm.status as any,
        type: detailsForm.type as any,
        commission_type: detailsForm.commission_type as any,
        commission_value: detailsForm.commission_value,
        alternate_email: detailsForm.alternate_email,
        business_phone: detailsForm.business_phone,
        website: detailsForm.website,
        partnership: detailsForm.partnership,
        business_address: detailsForm.business_address,
        license_number: detailsForm.license_number,
        iata_number: detailsForm.iata_number,
        mobile_numbers: mobileNumbersArray,
        specializations: specializationsArray,
      } as any);
      if (!error) {
        setIsEditingDetails(false);
        await loadAgentData();
      } else {
        console.error('Failed to save agent details', error);
      }
    }
  };

  const saveTaxRecord = async () => {
    if (!id || !editingTax) return;
    const payload = { ...editingTax, agent_id: String(id) };
    try {
      const client = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      if (editingTax.id) {
        const { error } = await client.from('agent_tax_info').update({
          tax_country: editingTax.tax_country,
          tax_type: editingTax.tax_type,
          tax_number: editingTax.tax_number,
          pan_number: editingTax.pan_number,
          gst_number: editingTax.gst_number,
          vat_number: editingTax.vat_number,
          tax_certificate_url: editingTax.tax_certificate_url,
          tax_registered: editingTax.tax_registered,
          tax_verified: editingTax.tax_verified,
          tax_notes: editingTax.tax_notes,
          updated_at: new Date().toISOString()
        }).eq('id', editingTax.id);
        if (error) throw error;
      } else {
        const { error } = await client.from('agent_tax_info').insert(payload);
        if (error) throw error;
      }
      const { data } = await AgentManagementService.getAgentTaxInfo(String(id));
      setTaxRecords(data || []);
      setEditingTax(null);
    } catch (err) {
      const { error } = await AgentManagementService.upsertAgentTaxInfo(String(id), payload);
      if (!error) {
        const { data } = await AgentManagementService.getAgentTaxInfo(String(id));
        setTaxRecords(data || []);
        setEditingTax(null);
      } else {
        console.error('Failed to save tax info', error);
      }
    }
  };

  const handleStatusChange = async (newStatus: 'active' | 'inactive' | 'suspended') => {
    if (!id) return;
    try {
      setStatusUpdating(true);
      const client = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      const { error } = await client.from('agents').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      setAgent(prev => prev ? { ...prev, status: newStatus as any } : prev);
      setDetailsForm(prev => ({ ...prev, status: newStatus as any }));
      toast({ title: 'Status updated', description: `Agent is now ${newStatus}` });
    } catch (err) {
      const { error } = await AgentManagementService.updateAgent({ id: String(id), status: newStatus } as any);
      if (error) {
        console.error('Failed to update status', error);
        toast({ title: 'Status update failed', description: String((error as any)?.message || error), variant: 'destructive' });
      } else {
        setAgent(prev => prev ? { ...prev, status: newStatus as any } : prev);
        setDetailsForm(prev => ({ ...prev, status: newStatus as any }));
        toast({ title: 'Status updated', description: `Agent is now ${newStatus}` });
      }
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDeleteAgent = async () => {
    if (!id || !canDelete) return;
    const confirmed = window.confirm('This will permanently delete the agent. Continue?');
    if (!confirmed) return;
    try {
      const client = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      const { error } = await client.from('agents').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Agent deleted' });
      navigate('/management/agents');
    } catch (err) {
      console.error('Delete failed', err);
      toast({ title: 'Delete failed', description: (err as any)?.message || 'Could not delete agent', variant: 'destructive' });
    }
  };

  const handleUploadProfileImage = async (file: File) => {
    if (!id) return;
    setUploadingDocs(true);
    try {
      const storage = (isAdminClientConfigured && adminSupabase) ? adminSupabase.storage : supabase.storage;
      const client = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      const safeName = `${crypto.randomUUID()}-${file.name}`.replace(/\s+/g, '_');
      const path = `agents/${id}/logo/${safeName}`;
      // Resolve content type from file or extension
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let contentType = file.type || '';
      if (!contentType) {
        if (ext === 'png') contentType = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
        else if (ext === 'webp') contentType = 'image/webp';
        else contentType = 'image/png';
      }
      const res = await storage.from(brandingBucket).upload(path, file, { upsert: true, contentType });
      if (res.error) throw res.error;
      const { data: pub } = storage.from(brandingBucket).getPublicUrl(path);
      const { error } = await client.from('agents').update({ profile_image: pub.publicUrl, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Profile image updated' });
      await loadAgentData();
    } catch (err) {
      console.error('Profile image upload failed', err);
      toast({ title: 'Upload failed', description: (err as any)?.message || 'Could not upload profile image', variant: 'destructive' });
    } finally {
      setUploadingDocs(false);
    }
  };

  const handleRemoveProfileImage = async () => {
    if (!id) return;
    try {
      const client = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      const currentUrl = agent?.profileImage || '';
      if (currentUrl) {
        try {
          const marker = '/storage/v1/object/public/';
          const idx = currentUrl.indexOf(marker);
          if (idx >= 0) {
            const after = currentUrl.substring(idx + marker.length);
            const [bucket, ...rest] = after.split('/');
            const key = rest.join('/');
            if (bucket === brandingBucket && key.startsWith(`agents/${id}/logo/`)) {
              await storageClient.storage.from(bucket).remove([key]);
            }
          }
        } catch (parseErr) {
          console.warn('Logo delete parse error:', parseErr);
        }
      }
      const { error } = await client.from('agents').update({ profile_image: null, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      await loadAgentData();
      toast({ title: 'Logo removed' });
    } catch (err) {
      console.error('Remove logo failed', err);
      toast({ title: 'Remove failed', description: (err as any)?.message || 'Could not remove logo', variant: 'destructive' });
    }
  };

  async function handleUploadDocuments(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!id || !files || files.length === 0) return;
    setUploadingDocs(true);
    try {
      const client = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const safeName = `${crypto.randomUUID()}-${file.name}`.replace(/\s+/g, '_');
        const fullPath = `${brandingPrefix}/${safeName}`;
        // Resolve content type from file or extension
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        let contentType = file.type || '';
        if (!contentType) {
          if (ext === 'pdf') contentType = 'application/pdf';
          else if (ext === 'png') contentType = 'image/png';
          else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
          else if (ext === 'webp') contentType = 'image/webp';
          else contentType = 'application/octet-stream';
        }
        const { error } = await storageClient.storage.from(brandingBucket).upload(fullPath, file, { upsert: true, contentType });
        if (error) throw error;
        const { data: pub } = storageClient.storage.from(brandingBucket).getPublicUrl(fullPath);
        if (pub?.publicUrl) newUrls.push(pub.publicUrl);
      }
      // Sync agents.documents array with newly uploaded public URLs
      const { data: docRow } = await client.from('agents').select('documents').eq('id', id).single();
      const existingDocs: string[] = Array.isArray(docRow?.documents) ? (docRow!.documents as string[]) : [];
      const updatedDocs = Array.from(new Set([ ...existingDocs, ...newUrls ]));
      const { error: updErr } = await client.from('agents').update({ documents: updatedDocs, updated_at: new Date().toISOString() }).eq('id', id);
      if (updErr) throw updErr;
      await loadBrandingFiles();
      toast({ title: 'Documents uploaded', description: `${newUrls.length} file(s) added.` });
    } catch (err: any) {
      console.error('Upload failed', err);
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('bucket') || msg.includes('not found')) {
        toast({ title: 'Branding bucket missing', description: 'Create bucket "agent_branding" or run migrations.', variant: 'destructive' });
      } else if (msg.includes('policy')) {
        toast({ title: 'Storage write blocked', description: 'Configure admin client or adjust RLS to allow writes.', variant: 'destructive' });
      } else {
        toast({ title: 'Upload failed', description: err?.message || 'Could not upload documents', variant: 'destructive' });
      }
    } finally {
      setUploadingDocs(false);
      if (brandingInputRef.current) brandingInputRef.current.value = '';
    }
  }

  async function handleDeleteDocument(name: string) {
    if (!id) return;
    try {
      const path = `${brandingPrefix}/${name}`;
      const { error } = await storageClient.storage.from(brandingBucket).remove([path]);
      if (error) throw error;
      // Remove from agents.documents
      const client = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      const { data: pub } = storageClient.storage.from(brandingBucket).getPublicUrl(path);
      const publicUrl = pub?.publicUrl;
      const { data: docRow } = await client.from('agents').select('documents').eq('id', id).single();
      const existingDocs: string[] = Array.isArray(docRow?.documents) ? (docRow!.documents as string[]) : [];
      const filteredDocs = existingDocs.filter(u => {
        const tail = u.split('/').pop();
        return tail !== name && u !== publicUrl;
      });
      const { error: updErr } = await client.from('agents').update({ documents: filteredDocs, updated_at: new Date().toISOString() }).eq('id', id);
      if (updErr) throw updErr;
      await loadBrandingFiles();
      toast({ title: 'Document deleted' });
    } catch (err) {
      console.error('Delete failed', err);
      toast({ title: 'Delete failed', description: (err as any)?.message || 'Could not delete document', variant: 'destructive' });
    }
  }

  // === Tax Certificate Upload/Delete Helpers ===
  async function onTaxCertFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingTaxCert(true);
      const taxBucket = brandingBucket;
      const taxPrefix = id ? `agents/${id}/tax` : '';
      const fileName = `${Date.now()}-${file.name}`;
      const fullPath = `${taxPrefix}/${fileName}`;
      // Resolve content type to prevent ORB issues on images/PDFs
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let contentType = file.type || '';
      if (!contentType) {
        if (ext === 'pdf') contentType = 'application/pdf';
        else if (ext === 'png') contentType = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
        else if (ext === 'webp') contentType = 'image/webp';
        else contentType = 'application/octet-stream';
      }
      const { error: upErr } = await storageClient.storage.from(taxBucket).upload(fullPath, file, { upsert: true, contentType });
      if (upErr) throw upErr;
      const { data: pub } = storageClient.storage.from(taxBucket).getPublicUrl(fullPath);
      const publicUrl = pub?.publicUrl as string;
      // If we have a specific record target, update that record immediately
      if (certTargetRecordId) {
        const client = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
        const { error } = await client
          .from('agent_tax_info')
          .update({ tax_certificate_url: publicUrl, updated_at: new Date().toISOString() })
          .eq('id', certTargetRecordId);
        if (error) throw error;
        const { data } = await AgentManagementService.getAgentTaxInfo(String(id));
        setTaxRecords(data || []);
        toast({ title: 'Certificate updated' });
      } else if (editingTax) {
        // Otherwise, attach to the editing record (persisted on Save)
        setEditingTax({ ...editingTax, tax_certificate_url: publicUrl });
        toast({ title: 'Certificate uploaded', description: 'Save to persist changes' });
      }
    } catch (err) {
      console.error('Certificate upload failed', err);
      toast({ title: 'Upload failed', description: (err as any)?.message || 'Could not upload certificate', variant: 'destructive' });
    } finally {
      setUploadingTaxCert(false);
      if (taxCertInputRef.current) taxCertInputRef.current.value = '';
      setCertTargetRecordId(null);
    }
  }

  async function handleDeleteTaxCertificate(rec: any) {
    if (!id || !rec?.id || !rec?.tax_certificate_url) return;
    try {
      // Try to parse bucket/path from public URL
      const url = String(rec.tax_certificate_url);
      let bucket = brandingBucket;
      let path = '';
      const marker = '/object/public/';
      const idx = url.indexOf(marker);
      if (idx >= 0) {
        const rest = url.slice(idx + marker.length);
        const firstSlash = rest.indexOf('/');
        if (firstSlash > 0) {
          bucket = rest.slice(0, firstSlash);
          path = rest.slice(firstSlash + 1);
        }
      }
      // If path couldn't be parsed, fallback to expected tax path prefix
      if (!path) {
        const name = url.split('/').pop() as string;
        path = `agents/${id}/tax/${name}`;
      }
      const { error: rmErr } = await storageClient.storage.from(bucket).remove([path]);
      if (rmErr) throw rmErr;
      const client = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      const { error } = await client
        .from('agent_tax_info')
        .update({ tax_certificate_url: null, updated_at: new Date().toISOString() })
        .eq('id', rec.id);
      if (error) throw error;
      const { data } = await AgentManagementService.getAgentTaxInfo(String(id));
      setTaxRecords(data || []);
      toast({ title: 'Certificate deleted' });
    } catch (err) {
      console.error('Certificate delete failed', err);
      toast({ title: 'Delete failed', description: (err as any)?.message || 'Could not delete certificate', variant: 'destructive' });
    }
  }

  async function handleToggleTaxVerified(rec: any, value: boolean) {
    if (!id || !rec?.id) return;
    try {
      const client = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      const { error } = await client
        .from('agent_tax_info')
        .update({ tax_verified: value, updated_at: new Date().toISOString() })
        .eq('id', rec.id);
      if (error) throw error;
      setTaxRecords(prev => prev.map(r => (String(r.id) === String(rec.id) ? { ...r, tax_verified: value } : r)));
      toast({ title: 'Verification updated', description: value ? 'Marked as VERIFIED' : 'Marked as UNVERIFIED' });
    } catch (err) {
      console.error('Toggle verify failed', err);
      toast({ title: 'Update failed', description: (err as any)?.message || 'Could not update verification', variant: 'destructive' });
    }
  }

  async function verifyLatestTaxRecord() {
    if (!id || taxRecords.length === 0) return;
    const latest = taxRecords[0];
    try {
      const client = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      const { error } = await client.from('agent_tax_info').update({ tax_verified: true, updated_at: new Date().toISOString() }).eq('id', latest.id);
      if (error) throw error;
      const { data } = await AgentManagementService.getAgentTaxInfo(String(id));
      setTaxRecords(data || []);
      toast({ title: 'Tax Info verified' });
    } catch (err) {
      toast({ title: 'Verify failed', description: (err as any)?.message || 'Could not verify tax info', variant: 'destructive' });
    }
  }

  if (loading) {
    return (
      <PageLayout title="Agent Profile">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading agent profile...</p>
        </div>
      </PageLayout>
    );
  }

  if (!agent) {
    return (
      <PageLayout title="Agent Profile">
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">Agent not found</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Agent Profile"
      breadcrumbItems={[
        { title: "Home", href: "/" },
        { title: "Agent Management", href: "/management/agents" },
        { title: agent.name, href: `/management/agents/${id}` },
      ]}
    >
      <div className="space-y-6">
        {/* Agent Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              {agent.type === 'company' && agent.profileImage ? (
                <div className="h-24 w-24 border rounded bg-white flex items-center justify-center overflow-hidden">
                  <img src={agent.profileImage} alt={`${agent.name} logo`} className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <Avatar className="h-24 w-24 border">
                  {agent.profileImage ? (
                    <AvatarImage src={agent.profileImage} alt={agent.name} />
                  ) : (
                    <AvatarFallback className="text-3xl">
                      {agent.type === 'company' ? 
                        <Building className="h-12 w-12" /> : 
                        <User className="h-12 w-12" />
                      }
                    </AvatarFallback>
                  )}
                </Avatar>
              )}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{agent.name}</h2>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                      <Globe className="h-4 w-4" />
                      <span>{agent.city}, {agent.country}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Created: {formatDateTime(agent.createdAt)}
                    </div>
                    {creatorProfile && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Created by {creatorProfile.name || creatorProfile.email}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-start md:items-end mt-2 md:mt-0 space-y-2">
                    <Badge variant={agent.status === 'active' ? 'success' : 'secondary'}>
                      {agent.status === 'active' ? 'Active' : agent.status === 'inactive' ? 'Inactive' : 'Suspended'}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Status</span>
                      <Switch
                        checked={agent.status === 'active'}
                        onCheckedChange={(checked) => handleStatusChange(checked ? 'active' : 'inactive')}
                        disabled={statusUpdating}
                      />
                      <span className="text-xs">{agent.status === 'active' ? 'Active' : 'Inactive'}</span>
                      {statusUpdating && <span className="text-xs text-muted-foreground">Updating...</span>}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Joined: {formatDate(agent.joinDate)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${agent.contact.email}`} className="text-sm hover:underline">
                        {agent.contact.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${agent.contact.phone}`} className="text-sm hover:underline">
                        {agent.contact.phone}
                      </a>
                    </div>
                    {agent.contact.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a href={`https://${agent.contact.website}`} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">
                          {agent.contact.website}
                        </a>
                      </div>
                    )}
                  </div>
                  <div>
                    {agent.contact.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                        <span className="text-sm">{agent.contact.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Commission: {agent.commissionValue} ({agent.commissionType})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm capitalize">
                        Type: {agent.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Conversion Rate</span>
                    <span className="text-sm font-medium">{agent.stats.conversionRate}%</span>
                  </div>
                  <Progress value={agent.stats.conversionRate} className="h-2 mt-1" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Total Queries</span>
                    <span className="text-2xl font-bold">{agent.stats.totalQueries}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Confirmed Bookings</span>
                    <span className="text-2xl font-bold">{agent.stats.totalBookings}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <span className="text-3xl font-bold">
                  {formatCurrency(agent.stats.revenueGenerated)}
                </span>
                <span className="text-sm text-muted-foreground mt-2">
                  Avg. Booking Value: {formatCurrency(agent.stats.averageBookingValue)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Customer Base</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <span className="text-3xl font-bold">{agent.stats.activeCustomers}</span>
                <span className="text-sm text-muted-foreground mt-2">Active customers</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="queries">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="tax">Tax Info</TabsTrigger>
            <TabsTrigger value="queries">Queries</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="staff">Staff Assignment</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Profile Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={agent.profileImage || ''} alt={agent.name} />
                    <AvatarFallback>
                      {agent.type === 'company' ? <Building className="h-6 w-6" /> : <User className="h-6 w-6" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold">{agent.name}</h3>
                      <Badge variant="outline" className="capitalize">{agent.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {agent.city && agent.country ? `${agent.city}, ${agent.country}` : (agent.country || agent.city || '')}
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{agent.contact.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{agent.contact.phone}</span>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{agent.type === 'company' ? (agent.contact.website || 'Company') : 'Individual'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Commission: {agent.commissionValue} ({agent.commissionType})</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle>Agent Details</CardTitle>
                <div className="flex gap-2">
                  {!isEditingDetails ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditingDetails(true)}>
                      Edit
                    </Button>
                  ) : (
                    <>
                      <Button size="sm" onClick={saveDetails}>Save</Button>
                      <Button variant="outline" size="sm" onClick={() => setIsEditingDetails(false)}>Cancel</Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    {isEditingDetails ? (
                      <Input value={detailsForm.name} onChange={e => updateDetailsField('name', e.target.value)} />
                    ) : <div className="mt-2">{detailsForm.name || '-'}</div>}
                  </div>
                  <div>
                    <Label>Email</Label>
                    {isEditingDetails ? (
                      <Input value={detailsForm.email} onChange={e => updateDetailsField('email', e.target.value)} />
                    ) : <div className="mt-2">{detailsForm.email || '-'}</div>}
                  </div>
                  <div>
                    <Label>Phone</Label>
                    {isEditingDetails ? (
                      <Input value={detailsForm.phone} onChange={e => updateDetailsField('phone', e.target.value)} />
                    ) : <div className="mt-2">{detailsForm.phone || '-'}</div>}
                  </div>
                  <div>
                    <Label>Company Name</Label>
                    {isEditingDetails ? (
                      <Input value={detailsForm.company_name} onChange={e => updateDetailsField('company_name', e.target.value)} />
                    ) : <div className="mt-2">{detailsForm.company_name || '-'}</div>}
                  </div>
                  <div>
                    <Label>City</Label>
                    {isEditingDetails ? (
                      <Input value={detailsForm.city} onChange={e => updateDetailsField('city', e.target.value)} />
                    ) : <div className="mt-2">{detailsForm.city || '-'}</div>}
                  </div>
                  <div>
                    <Label>Country</Label>
                    {isEditingDetails ? (
                      <Input value={detailsForm.country} onChange={e => updateDetailsField('country', e.target.value)} />
                    ) : <div className="mt-2">{detailsForm.country || '-'}</div>}
                  </div>
                  <div>
                    <Label>Status</Label>
                    {isEditingDetails ? (
                      <Select value={detailsForm.status} onValueChange={(v) => updateDetailsField('status', v as any)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : <div className="mt-2 capitalize">{detailsForm.status}</div>}
                  </div>
                  <div>
                    <Label>Type</Label>
                    {isEditingDetails ? (
                      <Select value={detailsForm.type} onValueChange={(v) => updateDetailsField('type', v as any)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="company">Company</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : <div className="mt-2 capitalize">{detailsForm.type}</div>}
                  </div>
                  <div>
                    <Label>Commission Type</Label>
                    {isEditingDetails ? (
                      <Select value={detailsForm.commission_type} onValueChange={(v) => updateDetailsField('commission_type', v as any)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select commission type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="flat">Flat</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : <div className="mt-2 capitalize">{detailsForm.commission_type}</div>}
                  </div>
                  <div>
                    <Label>Commission Value</Label>
                    {isEditingDetails ? (
                      <Input type="number" step="0.01" min="0" value={String(detailsForm.commission_value || '')} onChange={e => updateDetailsField('commission_value', e.target.value)} />
                    ) : <div className="mt-2">{String(detailsForm.commission_value || '')}</div>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Personal & Business Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Alternate Email</Label>
                    {isEditingDetails ? (
                      <Input value={detailsForm.alternate_email} onChange={e => updateDetailsField('alternate_email', e.target.value)} />
                    ) : <div className="mt-2">{detailsForm.alternate_email || '-'}</div>}
                  </div>
                  <div>
                    <Label>Business Phone</Label>
                    {isEditingDetails ? (
                      <Input value={detailsForm.business_phone} onChange={e => updateDetailsField('business_phone', e.target.value)} />
                    ) : <div className="mt-2">{detailsForm.business_phone || '-'}</div>}
                  </div>
                  <div>
                    <Label>Mobile Numbers</Label>
                    {isEditingDetails ? (
                      <Input value={detailsForm.mobile_numbers_text} onChange={e => updateDetailsField('mobile_numbers_text', e.target.value)} placeholder="Comma-separated" />
                    ) : <div className="mt-2">{detailsForm.mobile_numbers_text || '-'}</div>}
                  </div>
                  <div>
                    <Label>Website</Label>
                    {isEditingDetails ? (
                      <Input value={detailsForm.website} onChange={e => updateDetailsField('website', e.target.value)} />
                    ) : <div className="mt-2">{detailsForm.website || '-'}</div>}
                  </div>
                  <div>
                    <Label>Partnership</Label>
                    {isEditingDetails ? (
                      <Input value={detailsForm.partnership} onChange={e => updateDetailsField('partnership', e.target.value)} />
                    ) : <div className="mt-2">{detailsForm.partnership || '-'}</div>}
                  </div>
                  <div className="md:col-span-2">
                    <Label>Business Address</Label>
                    {isEditingDetails ? (
                      <Textarea value={detailsForm.business_address} onChange={e => updateDetailsField('business_address', e.target.value)} />
                    ) : <div className="mt-2">{detailsForm.business_address || '-'}</div>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Agency Code</Label>
                    {isEditingDetails ? (
                      <Input value={detailsForm.agency_code} onChange={e => updateDetailsField('agency_code', e.target.value)} />
                    ) : <div className="mt-2">{detailsForm.agency_code || '-'}</div>}
                  </div>
                  <div>
                    <Label>License Number</Label>
                    {isEditingDetails ? (
                      <Input value={detailsForm.license_number} onChange={e => updateDetailsField('license_number', e.target.value)} />
                    ) : <div className="mt-2">{detailsForm.license_number || '-'}</div>}
                  </div>
                  <div>
                    <Label>IATA Number</Label>
                    {isEditingDetails ? (
                      <Input value={detailsForm.iata_number} onChange={e => updateDetailsField('iata_number', e.target.value)} />
                    ) : <div className="mt-2">{detailsForm.iata_number || '-'}</div>}
                  </div>
                  <div className="md:col-span-2">
                    <Label>Specializations</Label>
                    {isEditingDetails ? (
                      <Input value={detailsForm.specializations_text} onChange={e => updateDetailsField('specializations_text', e.target.value)} placeholder="Comma-separated (e.g., flights, hotels)" />
                    ) : <div className="mt-2">{detailsForm.specializations_text || '-'}</div>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex items-center justify-between">
                <CardTitle>Branding & Company Documents</CardTitle>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={agent.profileImage || ''} alt={agent.name} />
                    <AvatarFallback>{agent.type === 'company' ? <Building className="h-4 w-4" /> : <User className="h-4 w-4" />}</AvatarFallback>
                  </Avatar>
                  {isEditingDetails && (
                    <>
                      <input ref={profileImageInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadProfileImage(f); }} />
                      <Button size="sm" variant="outline" onClick={() => profileImageInputRef.current?.click()} disabled={uploadingDocs}>
                        Update Logo
                      </Button>
                      <Button size="sm" variant="destructive" onClick={handleRemoveProfileImage} disabled={uploadingDocs}>
                        Remove Logo
                      </Button>
                    </>
                  )}
                  <input ref={brandingInputRef} type="file" multiple className="hidden" onChange={handleUploadDocuments} />
                  <Button size="sm" onClick={() => brandingInputRef.current?.click()} disabled={uploadingDocs}>
                    <Upload className="h-4 w-4 mr-1" />
                    {uploadingDocs ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {brandingLoading ? (
                  <div className="text-sm text-muted-foreground">Loading documents...</div>
                ) : brandingFiles.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No branding documents uploaded.</div>
                ) : (
                  <div className="space-y-2">
                    {brandingFiles.map((f) => (
                      <div key={f.name} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <a href={f.publicUrl} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">{f.name}</a>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setPreviewItem(f);
                              setPreviewOpen(true);
                            }}
                          >
                            Preview
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteDocument(f.name)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              {/* Preview Dialog */}
              <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle className="truncate">
                      {previewItem?.name || 'Preview'}
                    </DialogTitle>
                    <DialogDescription>
                      Preview of the selected branding file
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-2">
                    {(() => {
                      const name = previewItem?.name || '';
                      const url = previewItem?.publicUrl || '';
                      const ext = name.split('.').pop()?.toLowerCase() || '';
                      const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
                      const isPdf = ext === 'pdf';
                      if (isImage) {
                        return (
                          <img
                            src={url}
                            alt={name}
                            className="max-h-[70vh] w-auto mx-auto rounded border"
                          />
                        );
                      }
                      if (isPdf) {
                        return (
                          <iframe
                            src={url}
                            title={name}
                            className="w-full h-[70vh] rounded border"
                          />
                        );
                      }
                      return (
                        <div className="text-sm text-muted-foreground">
                          Preview not available for this file type.{' '}
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            Open in new tab
                          </a>
                        </div>
                      );
                    })()}
                  </div>
                </DialogContent>
              </Dialog>
            </Card>
          </TabsContent>

          {/* Tax Info Tab */}
          <TabsContent value="tax" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2 flex items-center justify-between">
                <CardTitle>Tax Information</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingTax(taxRecords[0] || { agent_id: id })}>
                    {taxRecords.length > 0 ? 'Edit Latest' : 'Add New'}
                  </Button>
                  {taxRecords.length > 0 && !editingTax && (
                    <Button variant="secondary" size="sm" onClick={verifyLatestTaxRecord}>
                      Verify Latest
                    </Button>
                  )}
                  {editingTax && (
                    <>
                      <Button size="sm" onClick={saveTaxRecord}>Save</Button>
                      <Button variant="outline" size="sm" onClick={() => setEditingTax(null)}>Cancel</Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Hidden input used for certificate uploads (both edit and per-card update) */}
                <input ref={taxCertInputRef} type="file" className="hidden" accept=".pdf,image/*" onChange={onTaxCertFileSelected} />
                {editingTax ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Tax Country</Label>
                      <Input value={editingTax.tax_country || ''} onChange={e => setEditingTax({ ...editingTax, tax_country: e.target.value })} />
                    </div>
                    <div>
                      <Label>Tax Type</Label>
                      <Input value={editingTax.tax_type || ''} onChange={e => setEditingTax({ ...editingTax, tax_type: e.target.value })} />
                    </div>
                    <div>
                      <Label>Tax Number</Label>
                      <Input value={editingTax.tax_number || ''} onChange={e => setEditingTax({ ...editingTax, tax_number: e.target.value })} />
                    </div>
                    <div>
                      <Label>GST Number</Label>
                      <Input value={editingTax.gst_number || ''} onChange={e => setEditingTax({ ...editingTax, gst_number: e.target.value })} />
                    </div>
                    <div>
                      <Label>PAN Number</Label>
                      <Input value={editingTax.pan_number || ''} onChange={e => setEditingTax({ ...editingTax, pan_number: e.target.value })} />
                    </div>
                    <div>
                      <Label>VAT Number</Label>
                      <Input value={editingTax.vat_number || ''} onChange={e => setEditingTax({ ...editingTax, vat_number: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Notes</Label>
                      <Textarea value={editingTax.tax_notes || ''} onChange={e => setEditingTax({ ...editingTax, tax_notes: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Tax Certificate</Label>
                      {editingTax.tax_certificate_url ? (
                        <div className="flex items-center justify-between p-2 border rounded mt-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <a href={editingTax.tax_certificate_url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">View Certificate</a>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setCertTargetRecordId(editingTax.id || null); taxCertInputRef.current?.click(); }} disabled={uploadingTaxCert}>
                              {uploadingTaxCert ? 'Uploading...' : 'Update'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteTaxCertificate(editingTax)}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <Button variant="outline" size="sm" onClick={() => { setCertTargetRecordId(null); taxCertInputRef.current?.click(); }} disabled={uploadingTaxCert}>
                            {uploadingTaxCert ? 'Uploading...' : 'Upload Certificate'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {taxLoading && <div className="text-sm text-muted-foreground">Loading tax records...</div>}
                    {!taxLoading && taxRecords.length === 0 && (
                      <div className="text-sm text-muted-foreground">No tax records found.</div>
                    )}
                    {!taxLoading && taxRecords.length > 0 && (
                      <div className="space-y-4">
                        {taxRecords.map((rec, idx) => (
                          <Card key={rec.id || idx}>
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Badge variant={rec.tax_verified ? 'success' : 'secondary'}>
                                    {rec.tax_verified ? 'Verified' : 'Unverified'}
                                  </Badge>
                                  <div className="flex items-center gap-2 text-sm">
                                    <span>Verified</span>
                                    <Switch checked={!!rec.tax_verified} onCheckedChange={(v) => handleToggleTaxVerified(rec, v)} />
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {rec.tax_certificate_url ? (
                                    <>
                                      <a href={rec.tax_certificate_url} target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" size="sm">
                                          Preview
                                        </Button>
                                      </a>
                                      <Button variant="outline" size="sm" onClick={() => { setCertTargetRecordId(rec.id || null); taxCertInputRef.current?.click(); }} disabled={uploadingTaxCert}>
                                        {uploadingTaxCert ? 'Uploading...' : 'Update'}
                                      </Button>
                                      <Button variant="outline" size="sm" onClick={() => handleDeleteTaxCertificate(rec)}>
                                        Delete
                                      </Button>
                                    </>
                                  ) : (
                                    <Button variant="outline" size="sm" onClick={() => { setCertTargetRecordId(rec.id || null); taxCertInputRef.current?.click(); }} disabled={uploadingTaxCert}>
                                      {uploadingTaxCert ? 'Uploading...' : 'Upload Certificate'}
                                    </Button>
                                  )}
                                  <Button variant="secondary" size="sm" onClick={() => setEditingTax(rec)}>
                                    Edit
                                  </Button>
                                </div>
                              </div>
                              {rec.updated_at && <span className="text-xs text-muted-foreground">Updated: {formatDateTime(rec.updated_at)}</span>}
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div><span className="text-xs text-muted-foreground">Tax Country</span><div>{rec.tax_country || '-'}</div></div>
                                <div><span className="text-xs text-muted-foreground">Tax Type</span><div>{rec.tax_type || '-'}</div></div>
                                <div><span className="text-xs text-muted-foreground">Tax Number</span><div>{rec.tax_number || '-'}</div></div>
                                <div><span className="text-xs text-muted-foreground">GST Number</span><div>{rec.gst_number || '-'}</div></div>
                                <div><span className="text-xs text-muted-foreground">PAN Number</span><div>{rec.pan_number || '-'}</div></div>
                                <div><span className="text-xs text-muted-foreground">VAT Number</span><div>{rec.vat_number || '-'}</div></div>
                                <div className="md:col-span-2"><span className="text-xs text-muted-foreground">Notes</span><div>{rec.tax_notes || '-'}</div></div>
                                {rec.tax_certificate_url && (
                                  <div className="md:col-span-2 mt-2">
                                    {/* Inline preview for images, link-only for PDFs */}
                                    {/\.(png|jpg|jpeg|gif|webp)$/i.test(rec.tax_certificate_url) ? (
                                      <img src={rec.tax_certificate_url} alt="Tax Certificate" className="max-h-48 object-contain border rounded" />
                                    ) : (
                                      <a href={rec.tax_certificate_url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">
                                        Open Certificate
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Queries Tab */}
          <TabsContent value="queries" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Enquiries & Queries</CardTitle>
              </CardHeader>
              <CardContent>
                {queries.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">ID</th>
                          <th className="text-left p-2">Destination</th>
                          <th className="text-left p-2">Travel Dates</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Created At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {queries.map((query) => (
                          <tr key={query.id} className="border-b hover:bg-muted/50">
                            <td className="p-2">{query.id}</td>
                            <td className="p-2">
                              {query.destination.country} ({query.destination.cities.join(', ')})
                            </td>
                            <td className="p-2">
                              {formatDate(query.travelDates.from)} to {formatDate(query.travelDates.to)}
                            </td>
                            <td className="p-2">
                              <Badge variant={
                                query.status === 'new' ? 'default' :
                                query.status === 'confirmed' ? 'success' : 'secondary'
                              }>
                                {query.status}
                              </Badge>
                            </td>
                            <td className="p-2">
                              {formatDateTime(query.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No queries found for this agent</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Confirmed Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Booking ID</th>
                          <th className="text-left p-2">Customer</th>
                          <th className="text-left p-2">Destination</th>
                          <th className="text-left p-2">Travel Dates</th>
                          <th className="text-left p-2">Amount</th>
                          <th className="text-left p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking) => (
                          <tr key={booking.id} className="border-b hover:bg-muted/50">
                            <td className="p-2">{booking.id}</td>
                            <td className="p-2">{booking.customerName}</td>
                            <td className="p-2">{booking.destination}</td>
                            <td className="p-2">
                              {formatDate(booking.travelDates.from)} to {formatDate(booking.travelDates.to)}
                            </td>
                            <td className="p-2">{formatCurrency(booking.totalAmount)}</td>
                            <td className="p-2">
                              <Badge variant={
                                booking.status === 'confirmed' ? 'success' : 'secondary'
                              }>
                                {booking.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No bookings found for this agent</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Top Customers</CardTitle>
              </CardHeader>
              <CardContent>
                {customers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Customer</th>
                          <th className="text-left p-2">Contact</th>
                          <th className="text-left p-2">Bookings</th>
                          <th className="text-left p-2">Total Spent</th>
                          <th className="text-left p-2">Last Booking</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.map((customer) => (
                          <tr key={customer.id} className="border-b hover:bg-muted/50">
                            <td className="p-2">{customer.name}</td>
                            <td className="p-2">
                              <div>{customer.email}</div>
                              {customer.phone && <div className="text-xs text-muted-foreground">{customer.phone}</div>}
                            </td>
                            <td className="p-2">{customer.bookingsCount}</td>
                            <td className="p-2">{formatCurrency(customer.totalSpent)}</td>
                            <td className="p-2">
                              {customer.lastBookingDate ? formatDate(customer.lastBookingDate) : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No customers data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
                        <div className="min-w-8 mt-1">
                          {activity.action.includes('Query') && <FileText className="h-6 w-6 text-blue-500" />}
                          {activity.action.includes('Booking') && <CheckCheck className="h-6 w-6 text-green-500" />}
                          {activity.action.includes('Customer') && <Users className="h-6 w-6 text-purple-500" />}
                          {activity.action.includes('Proposal') && <PieChart className="h-6 w-6 text-orange-500" />}
                          {!activity.action.includes('Query') && 
                           !activity.action.includes('Booking') && 
                           !activity.action.includes('Customer') && 
                           !activity.action.includes('Proposal') && 
                           <Clock className="h-6 w-6 text-gray-500" />}
                        </div>
                        <div>
                          <div className="font-medium">{activity.action}</div>
                          <div className="text-sm text-muted-foreground">{activity.details}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatDateTime(activity.date)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No recent activity recorded</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Assignment Tab */}
          <TabsContent value="staff" className="space-y-4 mt-4">
            <StaffAssignmentTab agent={agent} agentId={id} onAssignmentChange={handleAssignmentChange} />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default AgentProfile;
