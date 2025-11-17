import { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchInbox, fetchOutbox, fetchCampaigns, fetchQueueStatus, createCampaign, sendCampaignNow, scheduleCampaign, getBaseUrl } from '@/services/emailMarketingService';
import Papa from 'papaparse';
import React, { Suspense } from 'react';
const ReactQuill = React.lazy(() => import('react-quill'));
// import 'react-quill/dist/quill.snow.css'; // Temporarily commented out to fix build issue
// Basic Quill styles fallback
const quillStyles = `
  .ql-container {
    box-sizing: border-box;
    font-family: Helvetica, Arial, sans-serif;
    font-size: 13px;
    height: 100%;
    margin: 0px;
    position: relative;
  }
  .ql-editor {
    box-sizing: border-box;
    line-height: 1.42;
    height: 100%;
    outline: none;
    overflow-y: auto;
    padding: 12px 15px;
    tab-size: 4;
    -moz-tab-size: 4;
    text-align: left;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  .ql-toolbar {
    border: 1px solid #ccc;
    box-sizing: border-box;
    font-family: Helvetica, Arial, sans-serif;
    padding: 8px;
  }
`;
import { emailTemplateService } from '@/services/emailTemplateService';
import { emailConfigurationService } from '@/services/emailConfigurationService';
import { useApp } from '@/contexts/AppContext';
import PageLayout from '@/components/layout/PageLayout';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { getAiBaseUrl, getActiveProviders as getAiProviders, checkHealth as aiHealth, generateEmailTemplate } from '@/services/aiIntegrationService';
import { fetchDashboard, pauseCampaign, resumeCampaign } from '@/services/emailMarketingService';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean } > {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {}
  render() {
    if (this.state.hasError) return React.createElement('div', { className: 'p-2 text-red-500' }, 'Module error');
    return this.props.children as any;
  }
}

export default function MarketingCommunications() {
  // Apply Quill styles fallback
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = quillStyles;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [tab, setTab] = useState('inbox');
  const [inbox, setInbox] = useState<any[]>([]);
  const [outbox, setOutbox] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [queue, setQueue] = useState<any | null>(null);
  const { currentUser } = useApp();
  const { toast } = useToast();
  const [sseReady, setSseReady] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [csvRows, setCsvRows] = useState<{ email: string; name?: string; phone?: string }[]>([]);
  const [manualEmails, setManualEmails] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [vars, setVars] = useState<{ name: string }[]>([]);
  const [creating, setCreating] = useState(false);
  const [configs, setConfigs] = useState<any[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('__auto__');
  const [defaultConfig, setDefaultConfig] = useState<any | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [selectedInboxConfigId, setSelectedInboxConfigId] = useState<string>('__all__');
  const [inboxPage, setInboxPage] = useState(1);
  const [inboxLimit, setInboxLimit] = useState(20);

  useEffect(() => {
    const load = async () => {
      try {
        await refreshInbox();
      } catch {}
      try {
        const ob = await fetchOutbox({ limit: 50 });
        setOutbox(ob.data || []);
      } catch {}
      try {
        const cs = await fetchCampaigns({ limit: 50 });
        setCampaigns(cs.data || []);
      } catch {}
      try {
        const qs = await fetchQueueStatus();
        setQueue(qs.data || null);
      } catch {}
      try {
        const v = emailTemplateService.getAvailableVariables();
        setVars(v.map(x => ({ name: x.name })));
      } catch {}
      try {
        const resp = await emailConfigurationService.getEmailConfigurations();
        if (resp.success) {
          const raw = (resp.data || []).filter((c:any) => c.is_active);
          const seen = new Set<string>();
          const list = raw.filter((c:any) => {
            const key = String(c.from_email || '').toLowerCase();
            if (!key || seen.has(key)) return false;
            seen.add(key); return true;
          });
          setConfigs(list);
          const def = list.find((c:any) => c.is_default) || list[0] || null;
          setDefaultConfig(def || null);
        }
      } catch {}
    };
    load();
  }, []);

  async function refreshInbox() {
    const params: any = { limit: inboxLimit, page: inboxPage };
    if (selectedInboxConfigId !== '__all__') {
      const cfg = configs.find((c:any) => c.id === selectedInboxConfigId);
      if (cfg?.from_email) params.sender = cfg.from_email;
    }
    const ib = await fetchInbox(params);
    setInbox(ib.data || []);
  }

  useEffect(() => {
    (async () => {
      try { await refreshInbox(); } catch {}
    })();
  }, [selectedInboxConfigId]);

  function nextInboxPage() {
    setInboxPage(p => p + 1);
  }
  function prevInboxPage() {
    setInboxPage(p => Math.max(1, p - 1));
  }
  useEffect(() => {
    (async () => {
      try { await refreshInbox(); } catch {}
    })();
  }, [inboxPage, inboxLimit]);

  useEffect(() => {
    const baseUrl = getBaseUrl();
    const es = new EventSource(`${baseUrl}/email/notifications`);
    es.addEventListener('inbox_new', async () => {
      await refreshInbox();
      toast({ description: 'New inbox message', variant: 'default' });
    });
    es.addEventListener('outbox_update', async () => {
      const ob = await fetchOutbox({ limit: 50 });
      setOutbox(ob.data || []);
      toast({ description: 'Outbox updated', variant: 'default' });
    });
    es.addEventListener('queue_update', async () => {
      const qs = await fetchQueueStatus();
      setQueue(qs.data || null);
      toast({ description: 'Queue status updated', variant: 'default' });
    });
    es.onopen = () => setSseReady(true);
    es.onerror = () => setSseReady(false);
    return () => {
      es.close();
    };
  }, []);

  const inboxCount = useMemo(() => inbox.length, [inbox]);
  const outboxCount = useMemo(() => outbox.length, [outbox]);

  function parseCsv(file: File) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows = (res.data as any[]).map(r => ({
          email: String(r.email || r.Email || '').trim(),
          name: String(r.name || r.Name || '').trim(),
          phone: String(r.phone || r.Phone || '').trim()
        })).filter(r => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email));
        const dedup = Array.from(new Set(rows.map(r => r.email))).map(e => rows.find(r => r.email === e)!)
        setCsvRows(dedup);
      }
    });
  }

  function mergeRecipients() {
    const manualList = manualEmails.split(',').map(e => e.trim()).filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    const combined = Array.from(new Set([...csvRows.map(r => r.email), ...manualList]));
    setRecipients(combined);
  }

  function insertVar(token: string) {
    setBody(prev => prev + ` {{${token}}}`);
    setSubject(prev => prev + ` {{${token}}}`);
  }

  async function handleSendNow() {
    if (!subject || !body || recipients.length === 0) return;
    setCreating(true);
    try {
      const payload = { subject, body_html: body, recipients, created_by: currentUser?.id, config_id: selectedConfigId !== '__auto__' ? selectedConfigId : undefined } as any;
      const created = await createCampaign(payload);
      if (created && created.id) await sendCampaignNow(created.id);
      toast({ description: 'Campaign created and enqueued', variant: 'default' });
    } finally {
      setCreating(false);
    }
  }

  const [scheduledAt, setScheduledAt] = useState('');
  async function handleSchedule() {
    if (!subject || !body || recipients.length === 0 || !scheduledAt) return;
    setCreating(true);
    try {
      const payload = { subject, body_html: body, recipients, created_by: currentUser?.id } as any;
      const created = await createCampaign(payload);
      if (created && created.id) await scheduleCampaign(created.id, scheduledAt);
      toast({ description: 'Campaign scheduled', variant: 'default' });
    } catch (e:any) {
      toast({ description: e?.message || 'Schedule failed', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  }

  const [searchScope, setSearchScope] = useState('inbox');
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  async function runSearch() {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/email/search?q=${encodeURIComponent(searchQ)}&scope=${searchScope}`);
    const json = await res.json();
    setSearchResults(json.data || []);
  }
  const [filterName, setFilterName] = useState('');
  async function saveSearch() {
    await supabase.from('email_saved_filters').insert([{ name: filterName || 'Saved', owner_id: currentUser?.id, definition: { q: searchQ, scope: searchScope } }]);
  }
  const [savedFilters, setSavedFilters] = useState<any[]>([]);
  async function loadSaved() {
    const { data } = await supabase.from('email_saved_filters').select('*').order('created_at', { ascending: false }).limit(20);
    setSavedFilters(data || []);
  }
  useEffect(() => { loadSaved(); }, []);
  useEffect(() => {
    (async () => {
      try { const list = await getAiProviders(); setAiProviders(list || []); } catch {}
      try { const ok = await aiHealth(getAiBaseUrl()); setAiBaseHealthy(ok); } catch {}
    })();
  }, []);

  const [tplName, setTplName] = useState('');
  const [tplSubject, setTplSubject] = useState('');
  const [tplHtml, setTplHtml] = useState('');
  const [tplCategory, setTplCategory] = useState('custom');
  const [tplRole, setTplRole] = useState<'traveller' | 'agent' | 'account'>('traveller');
  const [mobilePreview, setMobilePreview] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiMode, setAiMode] = useState<'smart'|'specific'>('smart');
  const [aiProviders, setAiProviders] = useState<any[]>([]);
  const [aiProviderHint, setAiProviderHint] = useState<string>('');
  const [aiBaseHealthy, setAiBaseHealthy] = useState<boolean>(false);
  async function generateWithAI() {
    try {
      const base = getAiBaseUrl();
      const healthy = await aiHealth(base);
      setAiBaseHealthy(healthy);
      if (!healthy) throw new Error('AI relay offline');
      const resp = await generateEmailTemplate({ subject: tplSubject, category: tplCategory, providerHint: aiMode === 'specific' ? aiProviderHint : undefined });
      const html = resp?.html || resp?.text || '';
      if (!html) throw new Error('Empty AI response');
      setTplHtml(html);
      setAiError(null);
    } catch (e:any) {
      setAiError('AI is unavailable. Paste or import HTML to continue.');
      toast({ description: e?.message || 'AI unavailable. Use Paste/Import.', variant: 'destructive' });
    }
  }
  async function saveTemplate() {
    if (!tplName || !tplSubject || !tplHtml) return;
    const varsList = emailTemplateService.getAvailableVariables().map(v => v.name);
    await emailTemplateService.createTemplate({ name: tplName, subject: tplSubject, content: tplHtml, category: tplCategory, role: tplRole, trigger: 'custom', language: 'en', variables: varsList, isActive: true, isDefault: false, createdBy: currentUser?.id || 'system' } as any);
    setTplName('');
    setTplSubject('');
    setTplHtml('');
    toast({ description: 'Template saved', variant: 'default' });
  }
  function exportHtml() {
    if (!tplHtml) return;
    const blob = new Blob([tplHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tplName || 'template'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function importHtml(file: File) {
    const reader = new FileReader();
    reader.onload = () => setTplHtml(String(reader.result || ''));
    reader.readAsText(file);
  }

  const [segSource, setSegSource] = useState('agents');
  const [segField, setSegField] = useState('');
  const [segValue, setSegValue] = useState('');
  const [segName, setSegName] = useState('');
  async function applySegment() {
    try {
      let q;
      if (segSource === 'agents') {
        q = supabase.from('agents').select('email').not('email','is',null).limit(1000);
        if (segField && segValue) q = q.ilike(segField, `%${segValue}%`);
      } else if (segSource === 'enquiries') {
        q = supabase.from('enquiries').select('email').not('email','is',null).limit(1000);
        if (segField && segValue) q = q.ilike(segField, `%${segValue}%`);
      } else if (segSource === 'profiles') {
        q = supabase.from('profiles').select('email').not('email','is',null).limit(1000);
        if (segField && segValue) q = q.eq(segField, segValue);
      } else if (segSource === 'companies') {
        q = supabase.from('companies').select('email').not('email','is',null).limit(1000);
        if (segField && segValue) q = q.ilike(segField, `%${segValue}%`);
      }
      const { data } = await q;
      const emails = (data || []).map((r:any) => r.email).filter((e:string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
      setRecipients(prev => Array.from(new Set([...prev, ...emails])));
    } catch {}
  }
  async function saveSegment() {
    await supabase.from('email_saved_filters').insert([{ name: segName || 'Segment', owner_id: currentUser?.id, definition: { kind: 'segment', source: segSource, field: segField, value: segValue } }]);
    await loadSaved();
  }
  async function applySavedSegment(f:any) {
    const d = f.definition || {};
    setSegSource(d.source || 'agents');
    setSegField(d.field || '');
    setSegValue(d.value || '');
    await applySegment();
  }
  async function excludeSavedSegment(f:any) {
    const d = f.definition || {};
    try {
      let q;
      if (d.source === 'agents') q = supabase.from('agents').select('email').not('email','is',null).limit(1000);
      else if (d.source === 'enquiries') q = supabase.from('enquiries').select('email').not('email','is',null).limit(1000);
      else if (d.source === 'profiles') q = supabase.from('profiles').select('email').not('email','is',null).limit(1000);
      else if (d.source === 'companies') q = supabase.from('companies').select('email').not('email','is',null).limit(1000);
      if (d.field && d.value) {
        if (d.source === 'profiles') q = q.eq(d.field, d.value);
        else q = q.ilike(d.field, `%${d.value}%`);
      }
      const { data } = await q;
      const exEmails = (data || []).map((r:any) => r.email);
      setRecipients(prev => prev.filter(e => !exEmails.includes(e)));
    } catch {}
  }

  return (
    <PageLayout title="Email Marketing & Communication" description="Inbox, Outbox, Dashboard, Campaigns, Templates, Audience, Upload, Logs, Settings">
      <ErrorBoundary>
      <div className="p-4 md:p-6 max-w-full">
        <div className="grid gap-3 md:grid-cols-3 mb-4">
          <Card>
            <CardHeader>
              <CardTitle>Active/Default Sender</CardTitle>
              <CardDescription>{defaultConfig ? `${defaultConfig.name} (${defaultConfig.from_email})` : 'None'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm">Daily Limit: {defaultConfig?.daily_send_limit ?? '-'}</div>
              <div className="text-sm">Sent Today: {defaultConfig?.current_day_sent ?? '-'}</div>
              <div className="text-sm">Remaining: {(defaultConfig && typeof defaultConfig.daily_send_limit === 'number' && typeof defaultConfig.current_day_sent === 'number') ? Math.max(0, defaultConfig.daily_send_limit - defaultConfig.current_day_sent) : '-'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">Queue Size: {queue?.queueSize ?? 0}</div>
              <div className="text-sm">Failed: {queue?.failed ?? 0}</div>
              <div className="text-sm">Slow: {queue?.slow ?? 0}</div>
              <div className="text-sm">Rate Limit: {queue?.rateLimit ?? 100}/min</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Test Send</CardTitle>
              <CardDescription>Send a test using the selected account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="test@example.com" />
                <Button disabled={testing || !testEmail || selectedConfigId==='__auto__'} onClick={async () => {
                  try {
                    setTesting(true);
                    const useId = selectedConfigId==='__auto__' ? (defaultConfig?.id || '') : selectedConfigId;
                    if (!useId) throw new Error('Select a specific account to test');
                    const resp = await emailConfigurationService.testEmailConfiguration(useId, testEmail);
                    if (resp.success) toast({ description: 'Test email sent', variant: 'default' });
                    else toast({ description: resp.error || 'Test failed', variant: 'destructive' });
                  } finally {
                    setTesting(false);
                  }
                }}>Test Send</Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex flex-wrap">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="create">Create Campaign</TabsTrigger>
              <TabsTrigger value="audience">Audience</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="inbox">Inbox</TabsTrigger>
              <TabsTrigger value="outbox">Outbox</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="inbox">
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Input placeholder="Search" />
                  <Select>
                    <SelectTrigger className="w-48"><SelectValue placeholder="Filter" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unread">Unread</SelectItem>
                      <SelectItem value="attachment">Has attachment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Page</Label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={prevInboxPage}>Prev</Button>
                    <div className="text-sm">{inboxPage}</div>
                    <Button variant="outline" onClick={nextInboxPage}>Next</Button>
                  </div>
                  <Label>Page Size</Label>
                  <Select value={String(inboxLimit)} onValueChange={(v) => setInboxLimit(Number(v))}>
                    <SelectTrigger className="w-28"><SelectValue placeholder="Limit" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Inbox Account</Label>
                  <Select value={selectedInboxConfigId} onValueChange={setSelectedInboxConfigId}>
                    <SelectTrigger className="w-64"><SelectValue placeholder="All accounts" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All accounts</SelectItem>
                      {configs.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.from_email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={refreshInbox}>Refresh Inbox</Button>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={searchScope} onValueChange={setSearchScope}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="Scope" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inbox">Inbox</SelectItem>
                      <SelectItem value="threads">Threads</SelectItem>
                      <SelectItem value="outbox">Outbox</SelectItem>
                      <SelectItem value="campaigns">Campaigns</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="FTS query" />
                  <Button variant="outline" onClick={runSearch}>Search</Button>
                  <Input value={filterName} onChange={(e) => setFilterName(e.target.value)} placeholder="Save as" className="w-36" />
                  <Button variant="outline" onClick={saveSearch}>Save</Button>
                </div>
                <div className="border rounded">
                  {searchResults.slice(0,20).map((r, i) => (
                    <div key={i} className="p-2 border-b text-sm grid grid-cols-4 gap-2">
                      <div>{r.subject || '-'}</div>
                      <div>{r.sender || r.recipient || r.recipient_email || '-'}</div>
                      <div>{r.timestamp || r.received_at || r.sent_at || r.created_at || '-'}</div>
                      <div>{r.status || '-'}</div>
                    </div>
                  ))}
                </div>
                <div className="border rounded">
                  <div className="p-2 text-xs font-medium">Saved Filters</div>
                  {savedFilters.map(f => (
                    <div key={f.id} className="p-2 border-b text-sm">{f.name}</div>
                  ))}
                </div>
                <div className="border rounded">
                  {inbox.map(t => (
                    <div key={t.id} className="p-3 border-b">
                      <div className="font-medium">{t.subject || 'No subject'}</div>
                      <div className="text-sm text-muted-foreground">{(t.participants || []).join(', ')}</div>
                    </div>
                  ))}
                  {inboxCount === 0 && <div className="p-4 text-sm">No threads</div>}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="outbox">
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Input placeholder="Subject or recipient" />
                  <Select>
                    <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="bounced">Bounced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="border rounded">
                  {outbox.map(row => (
                    <div key={row.id} className="p-3 border-b">
                      <div className="flex justify-between">
                        <div className="font-medium">{row.subject}</div>
                        <div className="text-sm">{row.status}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">{row.recipient_email}</div>
                    </div>
                  ))}
                  {outboxCount === 0 && <div className="p-4 text-sm">No outbox records</div>}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="dashboard">
              <DashboardSection />
            </TabsContent>

            <TabsContent value="campaigns">
              <CampaignsSection campaigns={campaigns} onPause={async (id:string)=>{ await pauseCampaign(id); const cs = await fetchCampaigns({ limit: 50 }); setCampaigns(cs.data||[]); }} onResume={async (id:string)=>{ await resumeCampaign(id); const cs = await fetchCampaigns({ limit: 50 }); setCampaigns(cs.data||[]); }} />
            </TabsContent>

            <TabsContent value="create">
              <div className="grid gap-3">
                <Label>Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
                <Label>Variables</Label>
                <div className="flex flex-wrap gap-2">
                  {vars.map(v => (
                    <Button key={v.name} variant="outline" size="sm" onClick={() => insertVar(v.name)}>{v.name}</Button>
                  ))}
                </div>
                <Label>Editor</Label>
                {tab === 'create' && (
                  <Suspense fallback={<div className="h-48 border rounded" />}> 
                    <ReactQuill theme="snow" value={body} onChange={setBody} />
                  </Suspense>
                )}
                <Label>From Account</Label>
                <Select value={selectedConfigId} onValueChange={setSelectedConfigId}>
                  <SelectTrigger className="w-64"><SelectValue placeholder="Auto" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__auto__">Auto</SelectItem>
                    {configs.map(c => {
                      const remaining = typeof c.daily_send_limit === 'number' && typeof c.current_day_sent === 'number'
                        ? Math.max(0, c.daily_send_limit - c.current_day_sent)
                        : undefined;
                      const receiving = c.provider ? 'webhook' : 'none';
                      return (
                        <SelectItem key={c.id} value={c.id}>
                          <div className="flex items-center justify-between w-full">
                            <div>{c.name} ({c.from_email})</div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">Remain: {remaining ?? '-'}</Badge>
                              <Badge variant={receiving === 'webhook' ? 'default' : 'outline'}>Receiving: {receiving}</Badge>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Card>
                  <CardHeader>
                    <CardTitle>Audience Sources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div>
                        <Label>Agents</Label>
                        <div className="flex gap-2 mt-2">
                          <Input placeholder="City (optional)" id="agentsCity" />
                          <Input placeholder="Agency (optional)" id="agentsAgency" />
                          <Button variant="outline" onClick={async () => {
                            try {
                              const city = (document.getElementById('agentsCity') as HTMLInputElement)?.value || '';
                              const agency = (document.getElementById('agentsAgency') as HTMLInputElement)?.value || '';
                              let q = supabase.from('agents').select('email,city,agency,status').not('email','is',null).limit(500);
                              if (city) q = q.ilike('city', `%${city}%`);
                              if (agency) q = q.ilike('agency', `%${agency}%`);
                              const { data } = await q;
                              const emails = (data || []).map((a:any) => a.email).filter((e:string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
                              setRecipients(prev => Array.from(new Set([...prev, ...emails])));
                            } catch {}
                          }}>Add</Button>
                        </div>
                      </div>
                      <div>
                        <Label>Staff (profiles)</Label>
                        <div className="flex gap-2 mt-2">
                          <Select onValueChange={async (role) => {
                            try {
                              let q = supabase.from('profiles').select('email,role').not('email','is',null).limit(500);
                              if (role && role !== 'all') q = q.eq('role', role);
                              const { data } = await q;
                              const emails = (data || []).map((p:any) => p.email).filter((e:string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
                              setRecipients(prev => Array.from(new Set([...prev, ...emails])));
                            } catch {}
                          }}>
                            <SelectTrigger className="w-40"><SelectValue placeholder="Role" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="staff">Staff</SelectItem>
                              <SelectItem value="agent">Agent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Travellers (enquiries)</Label>
                        <div className="flex gap-2 mt-2">
                          <Input placeholder="Destination (optional)" id="travDest" />
                          <Button variant="outline" onClick={async () => {
                            try {
                              const dest = (document.getElementById('travDest') as HTMLInputElement)?.value || '';
                              let q = supabase.from('enquiries').select('email,destination,status').not('email','is',null).limit(500);
                              if (dest) q = q.ilike('destination', `%${dest}%`);
                              const { data } = await q;
                              const emails = (data || []).map((r:any) => r.email).filter((e:string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
                              setRecipients(prev => Array.from(new Set([...prev, ...emails])));
                            } catch {}
                          }}>Add</Button>
                        </div>
                      </div>
                      <div>
                        <Label>Companies/B2B</Label>
                        <div className="flex gap-2 mt-2">
                          <Input placeholder="City (optional)" id="compCity" />
                          <Select onValueChange={async (status) => {
                            try {
                              const city = (document.getElementById('compCity') as HTMLInputElement)?.value || '';
                              let q = supabase.from('companies').select('email,city,status').not('email','is',null).limit(500);
                              if (city) q = q.ilike('city', `%${city}%`);
                              if (status && status !== 'all') q = q.eq('status', status);
                              const { data } = await q;
                              const emails = (data || []).map((c:any) => c.email).filter((e:string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
                              setRecipients(prev => Array.from(new Set([...prev, ...emails])));
                            } catch {}
                          }}>
                            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" onClick={async () => {
                            try {
                              const { data } = await supabase.from('companies').select('email').not('email','is',null).limit(500);
                              const emails = (data || []).map((c:any) => c.email).filter((e:string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
                              setRecipients(prev => Array.from(new Set([...prev, ...emails])));
                            } catch {}
                          }}>Add</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Label>Upload CSV</Label>
                <Input type="file" accept=".csv" onChange={(e) => e.target.files && parseCsv(e.target.files[0])} />
                <div className="border rounded">
                  {csvRows.slice(0,10).map(r => (
                    <div key={r.email} className="p-2 border-b text-sm">{r.email}</div>
                  ))}
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>Segmentation Presets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <Select onValueChange={(src) => setSegSource(src)}>
                          <SelectTrigger className="w-40"><SelectValue placeholder="Source" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="agents">Agents</SelectItem>
                            <SelectItem value="enquiries">Travellers</SelectItem>
                            <SelectItem value="profiles">Staff</SelectItem>
                            <SelectItem value="companies">Companies</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input value={segField} onChange={(e) => setSegField(e.target.value)} placeholder="Field (e.g., city, agency, destination, role, status)" className="w-64" />
                        <Input value={segValue} onChange={(e) => setSegValue(e.target.value)} placeholder="Value" className="w-64" />
                        <Button variant="outline" onClick={applySegment}>Apply</Button>
                        <Input value={segName} onChange={(e) => setSegName(e.target.value)} placeholder="Save name" className="w-40" />
                        <Button variant="outline" onClick={saveSegment}>Save Segment</Button>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        <div>
                          <Label>Include Lists</Label>
                          <div className="border rounded">
                            {savedFilters.filter(f => (f.definition?.kind === 'segment')).map(f => (
                              <div key={f.id} className="p-2 border-b text-sm flex justify-between">
                                <span>{f.name}</span>
                                <Button size="sm" variant="outline" onClick={() => applySavedSegment(f)}>Include</Button>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label>Exclude Lists</Label>
                          <div className="border rounded">
                            {savedFilters.filter(f => (f.definition?.kind === 'segment')).map(f => (
                              <div key={f.id} className="p-2 border-b text-sm flex justify-between">
                                <span>{f.name}</span>
                                <Button size="sm" variant="outline" onClick={() => excludeSavedSegment(f)}>Exclude</Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Label>Manual Emails</Label>
                <Input value={manualEmails} onChange={(e) => setManualEmails(e.target.value)} placeholder="email1@example.com, email2@example.com" />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={mergeRecipients}>Merge Recipients</Button>
                  <div className="text-sm self-center">Total: {recipients.length}</div>
                </div>
                <Label>Schedule At (ISO)</Label>
                <Input value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} placeholder="YYYY-MM-DDTHH:mm:ssZ" />
                <div className="flex gap-2">
                  <Button onClick={handleSendNow} disabled={creating}>Send Now</Button>
                  <Button variant="outline" onClick={handleSchedule} disabled={creating}>Schedule</Button>
                  <Button variant="secondary">Save Draft</Button>
                  <Button variant="outline">Send Test Email</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="templates">
              <div className="grid gap-3">
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Template Name</Label>
                    <Input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="Welcome Email" />
                    <Label>Subject</Label>
                    <Input value={tplSubject} onChange={(e) => setTplSubject(e.target.value)} placeholder="Welcome to {CompanyName}" />
                    <Label>Category</Label>
                    <Select value={tplCategory} onValueChange={setTplCategory}>
                      <SelectTrigger className="w-64"><SelectValue placeholder="Category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="quotation">Quotation</SelectItem>
                        <SelectItem value="booking">Booking</SelectItem>
                        <SelectItem value="payment">Payment</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <Label>AI Source</Label>
                    <Select value={aiMode} onValueChange={(v:any) => setAiMode(v)}>
                      <SelectTrigger className="w-64"><SelectValue placeholder="Smart (Relay)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="smart">Smart (Relay)</SelectItem>
                        <SelectItem value="specific">Specific Provider</SelectItem>
                      </SelectContent>
                    </Select>
                    {aiMode === 'specific' && (
                      <>
                        <Label>Provider</Label>
                        <Select value={aiProviderHint} onValueChange={setAiProviderHint}>
                          <SelectTrigger className="w-64"><SelectValue placeholder="Select provider" /></SelectTrigger>
                          <SelectContent>
                            {aiProviders.map(p => (
                              <SelectItem key={p.id} value={p.provider_name}>{p.provider_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    )}
                    <Label>Role</Label>
                    <Select value={tplRole} onValueChange={(v:any) => setTplRole(v)}>
                      <SelectTrigger className="w-64"><SelectValue placeholder="Role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="traveller">Traveller</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="account">Account</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={generateWithAI}>AI Generate</Button>
                      <Button variant="outline" onClick={saveTemplate}>Save</Button>
                      <Button variant="outline" onClick={exportHtml}>Export HTML</Button>
                    </div>
                    <Label>Import HTML</Label>
                    <Input type="file" accept=".html,.htm" onChange={(e) => e.target.files && importHtml(e.target.files[0])} />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={aiBaseHealthy ? 'default' : 'secondary'}>{aiBaseHealthy ? 'Relay: Online' : 'Relay: Offline'}</Badge>
                      {aiMode === 'specific' && aiProviderHint && (
                        <Badge variant="outline">Provider: {aiProviderHint}</Badge>
                      )}
                    </div>
                    <Label>Builder</Label>
                    <Suspense fallback={<div className="h-48 border rounded" />}> 
                      <ReactQuill theme="snow" value={tplHtml} onChange={setTplHtml} />
                    </Suspense>
                    {aiError && (
                      <Alert className="mt-2">
                        <AlertTitle>AI Unavailable</AlertTitle>
                        <AlertDescription>{aiError}</AlertDescription>
                      </Alert>
                    )}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          if (text) setTplHtml(text);
                        } catch {
                          toast({ description: 'Clipboard read failed. Paste manually below.', variant: 'destructive' });
                        }
                      }}>Paste from clipboard</Button>
                    </div>
                    <Label>Paste HTML</Label>
                    <Textarea value={tplHtml} onChange={(e) => setTplHtml(e.target.value)} placeholder="Paste HTML here" className="min-h-[160px]" />
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => setMobilePreview(p => !p)}>{mobilePreview ? 'Desktop' : 'Mobile'}</Button>
                    </div>
                    <Label>Preview</Label>
                    <div className="border rounded p-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                      <div className={mobilePreview ? 'max-w-[390px] border border-gray-200 dark:border-gray-700 rounded mx-auto' : 'max-w-full'} dangerouslySetInnerHTML={{ __html: tplHtml || '<div />' }} />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="audience">
              <div className="text-sm">Audience</div>
            </TabsContent>

            <TabsContent value="upload">
              <div className="text-sm">Upload Emails</div>
            </TabsContent>

            <TabsContent value="logs">
              <div className="text-sm">Logs</div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="grid gap-3">
                <Label>Per-minute cap</Label>
                <Input type="number" defaultValue={100} />
              </div>
            </TabsContent>
          </Tabs>
          </CardContent>
        </Card>
      </div>
      </ErrorBoundary>
    </PageLayout>
  );
}

function DashboardSection() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { (async () => { try { const res = await fetchDashboard(); setData(res.data || null); } catch {} })(); }, []);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Campaigns</CardTitle></CardHeader>
        <CardContent>
          <div className="text-sm">Draft: {data?.campaigns?.draft ?? '-'}</div>
          <div className="text-sm">Scheduled: {data?.campaigns?.scheduled ?? '-'}</div>
          <div className="text-sm">Sent: {data?.campaigns?.sent ?? '-'}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Performance</CardTitle></CardHeader>
        <CardContent>
          <div className="text-sm">Sent: {data?.recipients?.sent ?? '-'}</div>
          <div className="text-sm">Opened: {data?.recipients?.opened ?? '-'}</div>
          <div className="text-sm">Clicked: {data?.recipients?.clicked ?? '-'}</div>
          <div className="text-sm">Failed: {data?.recipients?.failed ?? '-'}</div>
        </CardContent>
      </Card>
    </div>
  );
}

function CampaignsSection({ campaigns, onPause, onResume }: { campaigns: any[], onPause: (id:string)=>void, onResume: (id:string)=>void }) {
  return (
    <div className="border rounded">
      {campaigns.map(c => (
        <div key={c.id} className="p-3 border-b grid grid-cols-5 gap-2 items-center">
          <div className="font-medium col-span-2">{c.subject}</div>
          <div className="text-sm">{c.status}</div>
          <div className="text-sm">{c.scheduled_at || '-'}</div>
          <div className="flex gap-2 justify-end">
            {c.status !== 'paused' ? (
              <Button variant="outline" onClick={() => onPause(c.id)}>Pause</Button>
            ) : (
              <Button variant="outline" onClick={() => onResume(c.id)}>Resume</Button>
            )}
          </div>
        </div>
      ))}
      {campaigns.length === 0 && <div className="p-4 text-sm">No campaigns</div>}
    </div>
  );
}
