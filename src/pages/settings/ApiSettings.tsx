
import React, { useEffect, useMemo, useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { EyeIcon, EyeOffIcon, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { AppSettingsHelpers, AppSettingsService, SETTING_CATEGORIES } from '@/services/appSettingsService_database';
import { agentWelcomeTemplate } from '@/email/templates';
import { loadSMTPConfig, sendEmail } from '@/services/emailService';
import { useApplicationSettings } from '@/contexts/ApplicationSettingsContext';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase, adminSupabase, isAdminClientConfigured } from '@/lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ResponsiveContainer } from 'recharts';

const ApiSettings: React.FC = () => {
  const { translate, hasPermission, currentUser } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showApiKey, setShowApiKey] = useState(false);
  const { settings: appSettings } = useApplicationSettings();
  // Use untyped Supabase for tables not present in generated types
  const sb = supabase as any;
  const adminSb = adminSupabase as any;
  const isAdmin = (currentUser?.role === 'super_admin' || currentUser?.role === 'manager');

  // AI Integrations state
  const [apis, setApis] = useState<any[]>([]);
  const [loadingAPIs, setLoadingAPIs] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [editingApiId, setEditingApiId] = useState<string | null>(null);
  const [savingApi, setSavingApi] = useState<boolean>(false);
  const [testingApiId, setTestingApiId] = useState<string | null>(null);
  const [testingSmartId, setTestingSmartId] = useState<string | null>(null);
  const [deletingApiId, setDeletingApiId] = useState<string | null>(null);
  const [modalShowKey, setModalShowKey] = useState<boolean>(false);
  const [form, setForm] = useState<{ provider_name: string; base_url: string; api_key: string; status: 'active' | 'inactive'; model_name?: string; temperature?: number; max_tokens?: number; priority?: number; daily_limit?: number; requests_per_minute_limit?: number; tokens_per_minute_limit?: number; requests_per_day_limit?: number }>({
    provider_name: '',
    base_url: '',
    api_key: '',
    status: 'inactive',
    model_name: '',
    temperature: 0.7,
    max_tokens: 2048,
    priority: 0,
    daily_limit: 250,
    requests_per_minute_limit: 10,
    tokens_per_minute_limit: 250000,
    requests_per_day_limit: 250,
  });
  // Selected provider being edited (for read-only counters)
  const editingApi = useMemo(() => apis.find(a => a.id === editingApiId) || null, [apis, editingApiId]);
  // Prompt testing state per provider
  const [testPromptMap, setTestPromptMap] = useState<Record<string, string>>({});
  const [modelOverrideMap, setModelOverrideMap] = useState<Record<string, string>>({});
  const [testResponseMap, setTestResponseMap] = useState<Record<string, string>>({});
  const [responseDialogOpen, setResponseDialogOpen] = useState<boolean>(false);
  const [activeResponseProviderId, setActiveResponseProviderId] = useState<string | null>(null);
  // UI-only filters and meta for AI Integrations
  const [aiListFilter, setAiListFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [testMetaMap, setTestMetaMap] = useState<Record<string, { listStatus: number; listMs: number; genStatus?: number; genMs?: number }>>({});
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  // Reports state
  const [usageLogs, setUsageLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [logsPage, setLogsPage] = useState<number>(1);
  const [logsPageSize, setLogsPageSize] = useState<number>(50);
  const [logsTotal, setLogsTotal] = useState<number>(0);
  // Model limits configuration (from public.api_model_limits)
  const [modelLimits, setModelLimits] = useState<any[]>([]);

  // SMTP form state
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState<string>('');
  const [smtpSecure, setSmtpSecure] = useState<boolean>(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  
  const handleRegenerateKey = () => {
    toast({
      title: "API Key Regenerated",
      description: "Your new API key has been generated successfully",
    });
  };
  
  const handleSave = () => {
    toast({
      title: translate('success'),
      description: translate('apiSettingsSaved'),
    });
  };

  useEffect(() => {
    // Load SMTP config into form
    (async () => {
      try {
        const cfg = await loadSMTPConfig();
        setSmtpHost((cfg.smtp_host as string) || '');
        setSmtpPort(String(cfg.smtp_port || ''));
        setSmtpSecure(Boolean(cfg.smtp_secure) === true);
        setSmtpUser((cfg.smtp_user as string) || '');
        setSmtpPassword((cfg.smtp_password as string) || '');
        setFromEmail((cfg.from_email as string) || '');
        setFromName((cfg.from_name as string) || '');
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    fetchAPIs();
  }, []);

  useEffect(() => {
    // Initial logs load
    fetchUsageLogs();
    // Realtime updates for logs and integrations
    const ch1 = supabase
      .channel('realtime:api_usage_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'api_usage_logs' }, (payload: any) => {
        setUsageLogs(prev => [payload.new, ...prev]);
      })
      .subscribe();
    const ch2 = supabase
      .channel('realtime:api_integrations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'api_integrations' }, () => {
        fetchAPIs();
      })
      .subscribe();
    // Load model limits and subscribe to changes
    fetchModelLimits();
    const ch3 = supabase
      .channel('realtime:api_model_limits')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'api_model_limits' }, () => {
        fetchModelLimits();
      })
      .subscribe();
    return () => {
      try { supabase.removeChannel(ch1); } catch {}
      try { supabase.removeChannel(ch2); } catch {}
      try { supabase.removeChannel(ch3); } catch {}
    };
  }, []);

  async function fetchAPIs() {
    try {
      setLoadingAPIs(true);
      const { data, error } = await sb
        .from('api_integrations')
        .select('*')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      setApis(data || []);
    } catch (e: any) {
      toast({ title: 'Failed to load APIs', description: e?.message || 'Could not fetch API providers', variant: 'destructive' });
    } finally {
      setLoadingAPIs(false);
    }
  }

  async function fetchModelLimits() {
    try {
      const { data, error } = await sb
        .from('api_model_limits')
        .select('*')
        .order('model_name', { ascending: true });
      if (error) throw error;
      setModelLimits(data || []);
    } catch (e: any) {
      // Keep silent to avoid noise if table empty
      console.debug('Failed to load model limits:', e?.message);
    }
  }

  async function fetchUsageLogs() {
    try {
      setLoadingLogs(true);
      const from = Math.max(0, (logsPage - 1) * logsPageSize);
      const to = from + logsPageSize - 1;
      let query = sb
        .from('api_usage_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      // Date range filter applied server-side if provided
      if (dateFrom) query = query.gte('created_at', new Date(dateFrom).toISOString());
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        query = query.lte('created_at', end.toISOString());
      }
      if (providerFilter && providerFilter !== 'all') {
        query = query.eq('provider_name', providerFilter);
      }
      const { data, error, count } = await query;
      if (error) throw error;
      setUsageLogs(data || []);
      setLogsTotal(typeof count === 'number' ? count : 0);
    } catch (e: any) {
      toast({ title: 'Failed to load logs', description: e?.message || 'Could not fetch API usage logs', variant: 'destructive' });
    } finally {
      setLoadingLogs(false);
    }
  }

  useEffect(() => {
    // Re-fetch logs when pagination or date range changes
    fetchUsageLogs();
  }, [logsPage, logsPageSize]);

  async function resetMinuteCounters() {
    try {
      if (!editingApiId) return;
      const target = { current_minute_requests: 0, current_minute_tokens: 0, last_reset_minute: new Date().toISOString() } as any;
      const client = isAdminClientConfigured ? adminSb : sb;
      const { error } = await client.from('api_integrations').update(target).eq('id', editingApiId);
      if (error) throw error;
      setApis(prev => prev.map(api => (api.id === editingApiId ? { ...api, ...target } : api)));
      toast({ title: 'Minute counters reset', description: 'Current minute counters cleared for this provider.' });
    } catch (e: any) {
      toast({ title: 'Failed to reset minute counters', description: e?.message || 'Admin client update failed', variant: 'destructive' });
    }
  }

  async function resetDayCounters() {
    try {
      if (!editingApiId) return;
      const target = { current_day_requests: 0, last_reset_day: new Date().toISOString() } as any;
      const client = isAdminClientConfigured ? adminSb : sb;
      const { error } = await client.from('api_integrations').update(target).eq('id', editingApiId);
      if (error) throw error;
      setApis(prev => prev.map(api => (api.id === editingApiId ? { ...api, ...target } : api)));
      toast({ title: 'Day counters reset', description: 'Current day requests counter cleared.' });
    } catch (e: any) {
      toast({ title: 'Failed to reset day counters', description: e?.message || 'Admin client update failed', variant: 'destructive' });
    }
  }

  async function resetAllCounters() {
    try {
      if (!editingApiId) return;
      const target = {
        current_minute_requests: 0,
        current_minute_tokens: 0,
        current_day_requests: 0,
        last_reset_minute: new Date().toISOString(),
        last_reset_day: new Date().toISOString(),
      } as any;
      const client = isAdminClientConfigured ? adminSb : sb;
      const { error } = await client.from('api_integrations').update(target).eq('id', editingApiId);
      if (error) throw error;
      setApis(prev => prev.map(api => (api.id === editingApiId ? { ...api, ...target } : api)));
      toast({ title: 'All counters reset', description: 'Minute and day counters cleared.' });
    } catch (e: any) {
      toast({ title: 'Failed to reset counters', description: e?.message || 'Admin client update failed', variant: 'destructive' });
    }
  }

  async function deleteSelectedLog() {
    try {
      if (!selectedLog?.id) return;
      const client = isAdminClientConfigured ? adminSb : sb;
      const { error } = await client.from('api_usage_logs').delete().eq('id', selectedLog.id);
      if (error) throw error;
      setUsageLogs(prev => prev.filter(l => l.id !== selectedLog.id));
      setSelectedLog(null);
      toast({ title: 'Log deleted', description: 'The selected log was removed.' });
    } catch (e: any) {
      toast({ title: 'Failed to delete log', description: e?.message || 'Admin client delete failed', variant: 'destructive' });
    }
  }

  function isGemini(api: any) {
    const url = String(api?.base_url || '').toLowerCase();
    const name = String(api?.provider_name || '').toLowerCase();
    return url.includes('generativelanguage.googleapis.com') || name.includes('gemini');
  }

  function startAddAPI() {
    setEditingApiId(null);
    setForm({ provider_name: '', base_url: '', api_key: '', status: 'inactive', model_name: '', temperature: 0.7, max_tokens: 2048, priority: 0, daily_limit: 50, requests_per_minute_limit: 60, tokens_per_minute_limit: 30000, requests_per_day_limit: 500 });
    setOpenModal(true);
  }

  function editAPI(api: any) {
    setEditingApiId(api.id);
    setForm({
      provider_name: api.provider_name || '',
      base_url: api.base_url || '',
      api_key: api.api_key || '',
      status: (api.status as 'active' | 'inactive') || 'inactive',
      model_name: api.model_name || '',
      temperature: typeof api.temperature === 'number' ? api.temperature : 0.7,
      max_tokens: typeof api.max_tokens === 'number' ? api.max_tokens : 2048,
      priority: typeof api.priority === 'number' ? api.priority : 0,
      daily_limit: typeof api.daily_limit === 'number' ? api.daily_limit : 50,
      requests_per_minute_limit: typeof api.requests_per_minute_limit === 'number' ? api.requests_per_minute_limit : 60,
      tokens_per_minute_limit: typeof api.tokens_per_minute_limit === 'number' ? api.tokens_per_minute_limit : 30000,
      requests_per_day_limit: typeof api.requests_per_day_limit === 'number' ? api.requests_per_day_limit : 500,
    });
    setOpenModal(true);
  }

  async function handleSaveProvider() {
    try {
      setSavingApi(true);
      if (editingApiId) {
        const { error } = await sb
          .from('api_integrations')
          .update({
            provider_name: form.provider_name,
            base_url: form.base_url,
            api_key: form.api_key,
            status: form.status,
            model_name: form.model_name,
            temperature: form.temperature,
            max_tokens: form.max_tokens,
            priority: typeof form.priority === 'number' ? form.priority : 0,
            daily_limit: typeof form.daily_limit === 'number' ? form.daily_limit : 50,
            requests_per_minute_limit: typeof form.requests_per_minute_limit === 'number' ? form.requests_per_minute_limit : 60,
            tokens_per_minute_limit: typeof form.tokens_per_minute_limit === 'number' ? form.tokens_per_minute_limit : 30000,
            requests_per_day_limit: typeof form.requests_per_day_limit === 'number' ? form.requests_per_day_limit : 500,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingApiId);
        if (error) throw error;
        toast({ title: 'API updated successfully' });
      } else {
        // Insert only allowed columns for api_integrations
        const insertPayload = {
          provider_name: form.provider_name,
          base_url: form.base_url,
          api_key: form.api_key,
          status: form.status,
          model_name: form.model_name,
          temperature: form.temperature,
          max_tokens: form.max_tokens,
          priority: typeof form.priority === 'number' ? form.priority : 0,
          daily_limit: typeof form.daily_limit === 'number' ? form.daily_limit : 50,
          requests_per_minute_limit: typeof form.requests_per_minute_limit === 'number' ? form.requests_per_minute_limit : 60,
          tokens_per_minute_limit: typeof form.tokens_per_minute_limit === 'number' ? form.tokens_per_minute_limit : 30000,
          requests_per_day_limit: typeof form.requests_per_day_limit === 'number' ? form.requests_per_day_limit : 500,
        };
        const { error } = await sb.from('api_integrations').insert([insertPayload]);
        if (error) throw error;
        toast({ title: 'API added successfully' });
      }

      setOpenModal(false);
      setEditingApiId(null);
      fetchAPIs();
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Could not save API provider', variant: 'destructive' });
    } finally {
      setSavingApi(false);
    }
  }

  async function testConnection(api: any, promptOverride?: string, modelOverride?: string) {
    setTestingApiId(api.id);
    try {
      // 1) List models using provider-specific auth semantics
      const base = String(api.base_url || '').replace(/\/$/, '');
      let listUrl = '';
      let listInit: RequestInit = { method: 'GET' };
      if (isGemini(api)) {
        listUrl = `${base}/models?key=${encodeURIComponent(api.api_key)}`;
      } else {
        listUrl = `${base}/v1/models`;
        listInit.headers = { Authorization: `Bearer ${api.api_key}` } as any;
      }
      const listStart = performance.now();
      let listStatus = 0;
      let listOk = false;
      let listTime = 0;
      try {
        const listRes = await fetch(listUrl, listInit);
        listTime = performance.now() - listStart;
        listStatus = listRes.status;
        listOk = listRes.ok;
        await sb.from('api_usage_logs').insert({
          provider_name: api.provider_name,
          endpoint: 'list-models',
          status_code: listStatus,
          response_time: listTime,
        });
      } catch (e: any) {
        listTime = performance.now() - listStart;
        listStatus = -1; // Network/abort marker
        listOk = false;
        // Log a minimal entry so the UI still shows timing
        try {
          await sb.from('api_usage_logs').insert({
            provider_name: api.provider_name,
            endpoint: 'list-models',
            status_code: listStatus,
            response_time: listTime,
          });
        } catch { /* ignore secondary logging errors */ }
      }
      // Record list meta for UI
      setTestMetaMap(prev => ({
        ...prev,
        [api.id]: { listStatus, listMs: listTime }
      }));

      let genSnippet = '';
      let genStatus = 0;
      let genTime = 0;
      const promptText = (promptOverride && promptOverride.trim()) ? promptOverride.trim() : 'Test connection: Reply with "OK" if you received this message.';
      const model = (modelOverride && modelOverride.trim()) ? modelOverride.trim() : api.model_name;
      // 2) If a model_name or override is provided, attempt a short generation
      if (model || api.model_name) {
        if (isGemini(api)) {
          const useModel = model || api.model_name;
          const genUrl = `${base}/models/${useModel}:generateContent?key=${encodeURIComponent(api.api_key)}`;
          const genStart = performance.now();
          const genRes = await fetch(genUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] }),
          });
          genTime = performance.now() - genStart;
          genStatus = genRes.status;
          if (genRes.ok) {
            const data = await genRes.json();
            genSnippet = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          }
          // Record gen meta for UI
          setTestMetaMap(prev => ({
            ...prev,
            [api.id]: { ...(prev[api.id] || { listStatus, listMs: listTime }), genStatus, genMs: genTime }
          }));
          try {
            await sb.from('api_usage_logs').insert({
              provider_name: api.provider_name,
              endpoint: 'generate-content',
              status_code: genRes.status,
              response_time: genTime,
              response_time_ms: Math.round(genTime),
              prompt: promptText,
              answer: genSnippet || '',
              timestamp: new Date().toISOString(),
            });
          } catch (e) {
            await sb.from('api_usage_logs').insert({
              provider_name: api.provider_name,
              endpoint: 'generate-content',
              status_code: genRes.status,
              response_time: genTime,
            });
          }
          if (genSnippet) {
            setTestResponseMap(prev => ({ ...prev, [api.id]: genSnippet }));
            setActiveResponseProviderId(api.id);
            setResponseDialogOpen(true);
          }
        } else {
          const genUrl = `${base}/v1/chat/completions`;
          const useModel = (model || api.model_name || 'gpt-4o-mini');
          const genStart = performance.now();
          const genRes = await fetch(genUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${api.api_key}` },
            body: JSON.stringify({
              model: useModel,
              messages: [
                { role: 'system', content: 'You are an AI itinerary assistant.' },
                { role: 'user', content: promptText },
              ],
            }),
          });
          genTime = performance.now() - genStart;
          genStatus = genRes.status;
          if (genRes.ok) {
            const data = await genRes.json();
            genSnippet = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';
          } else {
            // Try to surface error message so user can diagnose
            try {
              const errData = await genRes.json();
              genSnippet = errData?.error?.message ? `Error: ${errData.error.message}` : JSON.stringify(errData);
            } catch {
              try {
                genSnippet = await genRes.text();
              } catch {
                genSnippet = '';
              }
            }
          }
          // Record gen meta for UI
          setTestMetaMap(prev => ({
            ...prev,
            [api.id]: { ...(prev[api.id] || { listStatus, listMs: listTime }), genStatus, genMs: genTime }
          }));
          try {
            await sb.from('api_usage_logs').insert({
              provider_name: api.provider_name,
              endpoint: 'chat-completions',
              status_code: genRes.status,
              response_time: genTime,
              response_time_ms: Math.round(genTime),
              prompt: promptText,
              answer: genSnippet || '',
              timestamp: new Date().toISOString(),
            });
          } catch (e) {
            await sb.from('api_usage_logs').insert({
              provider_name: api.provider_name,
              endpoint: 'chat-completions',
              status_code: genRes.status,
              response_time: genTime,
            });
          }
          if (genSnippet) {
            setTestResponseMap(prev => ({ ...prev, [api.id]: genSnippet }));
            setActiveResponseProviderId(api.id);
            setResponseDialogOpen(true);
          }
        }
      }

      // 3) Update provider metadata
      await sb
        .from('api_integrations')
        .update({
          last_tested: new Date().toISOString(),
          usage_count: (typeof api.usage_count === 'number' ? api.usage_count : 0) + 1,
        })
        .eq('id', api.id);

      const title = listOk ? '✅ Connection Successful' : '❌ Connection Failed';
      const descParts = [
        `List status ${listStatus}, ${listTime.toFixed(1)} ms`,
      ];
      if (model || api.model_name) {
        descParts.push(`Gen status ${genStatus || '—'}, ${genTime ? genTime.toFixed(1) : '—'} ms`);
      }
      if (genSnippet) {
        descParts.push(`"${genSnippet.slice(0, 100)}"`);
      }
      toast({ title, description: descParts.join(' • ') });
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Connection test failed', variant: 'destructive' });
    } finally {
      setTestingApiId(null);
    }
  }

  async function toggleStatus(id: string, isActive: boolean) {
    try {
      // Allow multiple active providers; only update the selected provider
      const { error } = await sb
        .from('api_integrations')
        .update({ status: isActive ? 'active' : 'inactive' })
        .eq('id', id);
      if (error) throw error;
      fetchAPIs();
    } catch (e: any) {
      toast({ title: 'Update failed', description: e?.message || 'Could not update status', variant: 'destructive' });
    }
  }

  async function deleteAPI(id: string) {
    try {
      setDeletingApiId(id);
      const { error } = await sb.from('api_integrations').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'API deleted' });
      fetchAPIs();
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message || 'Could not delete API provider', variant: 'destructive' });
    } finally {
      setDeletingApiId(null);
    }
  }

  // Derived report data
  const providerNames = useMemo(() => Array.from(new Set(apis.map(a => a.provider_name))), [apis]);
  const allowedProviders = useMemo(() => {
    const base = statusFilter === 'all' ? apis : apis.filter(a => a.status === statusFilter);
    if (providerFilter !== 'all') return base.filter(a => a.provider_name === providerFilter);
    return base;
  }, [apis, statusFilter, providerFilter]);

  const filteredLogs = useMemo(() => {
    const namesSet = new Set(allowedProviders.map(a => String(a.provider_name).toLowerCase()));
    return (usageLogs || []).filter((log: any) => {
      const nameOk = namesSet.size === 0 ? true : namesSet.has(String(log.provider_name || '').toLowerCase());
      const providerOk = providerFilter === 'all' || String(log.provider_name) === providerFilter;
      const search = searchQuery.trim().toLowerCase();
      const searchOk = !search || String(log.provider_name || '').toLowerCase().includes(search) || String(log.endpoint || '').toLowerCase().includes(search);
      return nameOk && providerOk && searchOk;
    });
  }, [usageLogs, allowedProviders, providerFilter, searchQuery]);

  const overviewMetrics = useMemo(() => {
    const map = new Map<string, { requests: number; avgMs: number; errors: number }>();
    for (const api of allowedProviders) {
      map.set(api.provider_name, { requests: 0, avgMs: 0, errors: 0 });
    }
    const sums = new Map<string, number>();
    for (const log of filteredLogs) {
      const name = log.provider_name;
      if (!map.has(name)) continue;
      const cur = map.get(name)!;
      cur.requests += 1;
      const rt = Number(log.response_time || 0);
      sums.set(name, (sums.get(name) || 0) + rt);
      if (Number(log.status_code || 0) >= 400) cur.errors += 1;
    }
    for (const [name, totalRt] of sums.entries()) {
      const data = map.get(name)!;
      data.avgMs = data.requests > 0 ? totalRt / data.requests : 0;
    }
    return map;
  }, [filteredLogs, allowedProviders]);

  const monitorMetrics = useMemo(() => {
    const byProvider = new Map<string, { total: number; success: number; errors: number; times: number[] }>();
    for (const api of allowedProviders) {
      byProvider.set(api.provider_name, { total: 0, success: 0, errors: 0, times: [] });
    }
    for (const log of filteredLogs) {
      const name = String(log.provider_name || '');
      if (!byProvider.has(name)) continue;
      const m = byProvider.get(name)!;
      m.total += 1;
      const status = Number(log.status_code || 0);
      if (status >= 400) m.errors += 1; else m.success += 1;
      const rt = Number(log.response_time || log.response_time_ms || 0);
      if (!Number.isNaN(rt)) m.times.push(rt);
    }
    const rows: Array<{ provider_name: string; total: number; successRate: number; avgMs: number; p95Ms: number; errors: number }> = [];
    for (const [name, m] of byProvider.entries()) {
      const avg = m.times.length ? m.times.reduce((a, b) => a + b, 0) / m.times.length : 0;
      const sorted = m.times.slice().sort((a, b) => a - b);
      const idx = Math.floor(0.95 * sorted.length) - 1;
      const p95 = sorted.length ? sorted[Math.max(0, idx)] : 0;
      const successRate = m.total ? Math.round((m.success / m.total) * 100) : 0;
      rows.push({ provider_name: name, total: m.total, successRate, avgMs: avg, p95Ms: p95, errors: m.errors });
    }
    return rows;
  }, [filteredLogs, allowedProviders]);

  const trendData = useMemo(() => {
    // Aggregate by day: YYYY-MM-DD
    const counts = new Map<string, number>();
    for (const log of filteredLogs) {
      const d = new Date(log.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const entries = Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b));
    return entries.map(([date, total]) => ({ date, total }));
  }, [filteredLogs]);

  // Google Rate Limits (by model) — current month peak usage vs limits
  const googleApis = useMemo(() => {
    return apis.filter((api) => {
      const url = String(api?.base_url || '').toLowerCase();
      const name = String(api?.provider_name || '').toLowerCase();
      return url.includes('generativelanguage.googleapis.com') || name.includes('gemini') || name.includes('google');
    });
  }, [apis]);

  const currentMonthStart = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, []);

  const googleRateLimitRows = useMemo(() => {
    const monthLogs = (usageLogs || []).filter((log: any) => {
      const name = String(log?.provider_name || '').toLowerCase();
      const isGoogle = name.includes('gemini') || name.includes('google');
      const createdIso = log?.created_at || log?.timestamp;
      const createdAt = createdIso ? new Date(createdIso) : null;
      return isGoogle && createdAt && createdAt >= currentMonthStart;
    });

    const logsByProvider = new Map<string, any[]>();
    for (const log of monthLogs) {
      const pn = String(log?.provider_name || '');
      if (!logsByProvider.has(pn)) logsByProvider.set(pn, []);
      logsByProvider.get(pn)!.push(log);
    }

    function deriveCategory(model?: string): string {
      const m = String(model || '').toLowerCase();
      if (m.includes('flash-lite')) return 'flash-lite';
      if (m.includes('flash')) return 'flash';
      if (m.includes('pro')) return 'pro';
      return '—';
    }

    return googleApis.map((api) => {
      const providerName = api.provider_name;
      const providerLogs = logsByProvider.get(providerName) || [];

      const minuteCounts = new Map<string, number>();
      const minuteTokenCounts = new Map<string, number>();
      const dayCounts = new Map<string, number>();
      for (const log of providerLogs) {
        const d = new Date(log?.created_at || log?.timestamp);
        const minuteKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        minuteCounts.set(minuteKey, (minuteCounts.get(minuteKey) || 0) + 1);
        dayCounts.set(dayKey, (dayCounts.get(dayKey) || 0) + 1);
        const tokens = typeof log?.total_tokens === 'number'
          ? Number(log.total_tokens)
          : (typeof log?.prompt_tokens === 'number' || typeof log?.completion_tokens === 'number')
            ? Number(log.prompt_tokens || 0) + Number(log.completion_tokens || 0)
            : 0;
        minuteTokenCounts.set(minuteKey, (minuteTokenCounts.get(minuteKey) || 0) + (tokens || 0));
      }

      const peakRPM = Array.from(minuteCounts.values()).reduce((m, v) => (v > m ? v : m), 0);
      const peakRPD = Array.from(dayCounts.values()).reduce((m, v) => (v > m ? v : m), 0);
      const peakTPM = Array.from(minuteTokenCounts.values()).reduce((m, v) => (v > m ? v : m), 0);

      // Pull configured limits from public.api_model_limits, fallback to latest log metadata if present
      const limitsMatch = modelLimits.find((l: any) => {
        return String(l?.provider_name || '') === providerName && String(l?.model_name || '') === String(api?.model_name || '');
      }) || null;

      const latest = providerLogs.find((l: any) => l?.['Category'] || l?.['RPM'] || l?.['TPM'] || l?.['RPD']) || {};
      const category = (limitsMatch?.category) || latest?.['Category'] || deriveCategory(api?.model_name);

      const rpmLimitNum = limitsMatch?.rpm_unlimited ? null : (typeof limitsMatch?.rpm_limit === 'number' ? limitsMatch?.rpm_limit : undefined);
      const rpdLimitNum = limitsMatch?.rpd_unlimited ? null : (typeof limitsMatch?.rpd_limit === 'number' ? limitsMatch?.rpd_limit : undefined);
      const tpmLimitNum = (typeof limitsMatch?.tpm_limit === 'number' ? limitsMatch?.tpm_limit : undefined);

      const rpm = limitsMatch ? (limitsMatch.rpm_unlimited ? 'Unlimited' : (rpmLimitNum ?? 'N/A')) : (latest?.['RPM'] || '—');
      const tpm = limitsMatch ? (tpmLimitNum ?? 'N/A') : (latest?.['TPM'] || '—');
      const rpd = limitsMatch ? (limitsMatch.rpd_unlimited ? 'Unlimited' : (rpdLimitNum ?? 'N/A')) : (latest?.['RPD'] || '—');

      const warnThreshold = typeof limitsMatch?.warn_threshold_percent === 'number' ? limitsMatch.warn_threshold_percent : 80;
      const rpmUtilPct = (typeof rpmLimitNum === 'number' && rpmLimitNum > 0) ? Math.round((peakRPM / rpmLimitNum) * 100) : null;
      const rpdUtilPct = (typeof rpdLimitNum === 'number' && rpdLimitNum > 0) ? Math.round((peakRPD / rpdLimitNum) * 100) : null;
      const tpmUtilPct = (typeof tpmLimitNum === 'number' && tpmLimitNum > 0) ? Math.round((peakTPM / tpmLimitNum) * 100) : null;
      const rpmUtil = rpmUtilPct !== null ? `${rpmUtilPct}%` : '—';
      const rpdUtil = rpdUtilPct !== null ? `${rpdUtilPct}%` : '—';
      const tpmUtil = tpmUtilPct !== null ? `${tpmUtilPct}%` : '—';
      const warn = (rpmUtilPct !== null && rpmUtilPct >= warnThreshold) || (rpdUtilPct !== null && rpdUtilPct >= warnThreshold) ? '⚠︎ Extend' : '';

      return {
        id: api.id,
        provider: providerName,
        model: api?.model_name || '—',
        category,
        rpm,
        tpm,
        rpd,
        peakRPM,
        peakRPD,
        peakTPM,
        rpmUtil,
        rpdUtil,
        tpmUtil,
        warn,
      };
    });
  }, [usageLogs, currentMonthStart, googleApis, modelLimits]);

  function exportCsvOverview() {
    const rows = [
      ['Provider', 'Status', 'Total Usage Count', 'Requests (range)', 'Avg Response (ms)', 'Last Tested', 'Errors (range)'],
    ];
    for (const api of allowedProviders) {
      const m = overviewMetrics.get(api.provider_name) || { requests: 0, avgMs: 0, errors: 0 };
      rows.push([
        api.provider_name,
        api.status,
        String(typeof api.usage_count === 'number' ? api.usage_count : 0),
        String(m.requests),
        m.avgMs.toFixed(1),
        api.last_tested ? new Date(api.last_tested).toLocaleString() : 'Never',
        String(m.errors),
      ]);
    }
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'api-overview.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCsvLogs() {
    const rows = [ ['Provider', 'Endpoint', 'Status', 'Response Time (ms)', 'Timestamp'] ];
    for (const log of filteredLogs) {
      rows.push([
        log.provider_name || '—',
        log.endpoint || '—',
        String(log.status_code ?? ''),
        String(Number(log.response_time || 0).toFixed(1)),
        log.created_at ? new Date(log.created_at).toLocaleString() : '—',
      ]);
    }
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'api-logs.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPdfOverview() {
    try {
      const mod = await import('jspdf');
      const jsPDF = (mod as any).jsPDF || (mod as any).default?.jsPDF || (mod as any).default;
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('API Usage Overview', 14, 20);
      doc.setFontSize(11);
      let y = 32;
      for (const api of allowedProviders) {
        const m = overviewMetrics.get(api.provider_name) || { requests: 0, avgMs: 0, errors: 0 };
        doc.text(`Provider: ${api.provider_name}`, 14, y); y += 6;
        doc.text(`Status: ${api.status}`, 14, y); y += 6;
        doc.text(`Total Usage: ${typeof api.usage_count === 'number' ? api.usage_count : 0}`, 14, y); y += 6;
        doc.text(`Requests (range): ${m.requests}`, 14, y); y += 6;
        doc.text(`Avg Response: ${m.avgMs.toFixed(1)} ms`, 14, y); y += 6;
        doc.text(`Errors (range): ${m.errors}`, 14, y); y += 8;
        if (y > 270) { doc.addPage(); y = 20; }
      }
      doc.save('api-overview.pdf');
    } catch (e) {
      toast({ title: 'PDF export failed', description: (e as any)?.message || 'Unable to generate PDF', variant: 'destructive' });
    }
  }

  const persistSMTP = async () => {
    setSaving(true);
    setPreviewUrl(null);
    try {
      const entries = [
        { key: 'smtp_host', value: smtpHost },
        { key: 'smtp_port', value: smtpPort },
        { key: 'smtp_secure', value: smtpSecure },
        { key: 'smtp_user', value: smtpUser },
        { key: 'smtp_password', value: smtpPassword },
        { key: 'from_email', value: fromEmail },
        { key: 'from_name', value: fromName },
      ];
      for (const { key, value } of entries) {
        await AppSettingsHelpers.upsertSetting({
          category: SETTING_CATEGORIES.NOTIFICATIONS,
          setting_key: key,
          ...(typeof value === 'string' ? { setting_value: value } : { setting_json: value as any }),
        });
      }
      toast({ title: 'SMTP settings saved', description: 'Notifications credentials updated.' });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Could not save SMTP settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      toast({ title: 'Enter test email', description: 'Please provide an email to send test', variant: 'destructive' });
      return;
    }
    setSending(true);
    setPreviewUrl(null);
    try {
      // Build sample email
      const companyName = appSettings?.companyDetails?.name || 'Triplexa';
      const html = agentWelcomeTemplate({ companyName, recipientName: 'Test Recipient' });
      const subject = 'SMTP Test Email';
      const res = await sendEmail(testEmail, subject, html, {
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_secure: smtpSecure,
        smtp_user: smtpUser,
        smtp_password: smtpPassword,
        from_email: fromEmail || undefined,
        from_name: fromName || companyName,
      });
      if (res?.previewUrl) {
        setPreviewUrl(res.previewUrl);
        toast({ title: 'Test sent', description: 'Preview available via Ethereal link.' });
      } else {
        toast({ title: 'Test sent', description: 'Email sent successfully.' });
      }
    } catch (e: any) {
      toast({ title: 'Send failed', description: e?.message || 'Failed to send test email', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <h1 className="text-xl md:text-2xl font-bold">API Settings</h1>
        {/* AI Integrations */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>AI Integrations</CardTitle>
              <CardDescription>Centralized management for AI API providers</CardDescription>
            </div>
            <Button onClick={startAddAPI}>Add API</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters for AI Integrations */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">View</Label>
                <div className="flex gap-1">
                  <Button variant={aiListFilter === 'all' ? 'secondary' : 'outline'} size="sm" onClick={() => setAiListFilter('all')}>All</Button>
                  <Button variant={aiListFilter === 'active' ? 'secondary' : 'outline'} size="sm" onClick={() => setAiListFilter('active')}>Active</Button>
                  <Button variant={aiListFilter === 'inactive' ? 'secondary' : 'outline'} size="sm" onClick={() => setAiListFilter('inactive')}>Inactive</Button>
                </div>
              </div>
            </div>
            {loadingAPIs && <p className="text-sm text-muted-foreground">Loading providers…</p>}
            {!loadingAPIs && apis.length === 0 && (
              <p className="text-sm text-muted-foreground">No providers configured yet. Click "Add API" to create one.</p>
            )}
            {!loadingAPIs && apis
              .filter(api => aiListFilter === 'all' ? true : api.status === aiListFilter)
              .map((api) => (
              <Card
                key={api.id}
                className={`border ${selectedProviderId === api.id || activeResponseProviderId === api.id ? 'ring-1 ring-primary border-primary' : ''}`}
                onClick={() => setSelectedProviderId(api.id)}
              >
                <CardHeader className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold flex items-center gap-2">
                      <span>{api.provider_name}</span>
                      {String(api?.base_url || '').toLowerCase().includes('api.openai.com') && (
                        <Badge variant="secondary">OpenAI</Badge>
                      )}
                      {String(api?.base_url || '').toLowerCase().includes('generativelanguage.googleapis.com') && (
                        <Badge variant="secondary">Gemini</Badge>
                      )}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>Status:</span>
                      <Badge variant={api.status === 'active' ? 'success' : 'secondary'}>{api.status}</Badge>
                      <span>• Model: {api.model_name || '—'}</span>
                      <span>• Priority: {typeof api.priority === 'number' ? api.priority : 0}</span>
                      <span>• Usage: {typeof api.usage_count === 'number' ? api.usage_count : 0}</span>
                      <span>• Last Tested: {api.last_tested ? new Date(api.last_tested).toLocaleString() : 'Never'}</span>
                    </div>
                  </div>
                  <Switch
                    checked={api.status === 'active'}
                    onCheckedChange={(checked) => toggleStatus(api.id, checked)}
                  />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Base URL: {api.base_url || '—'}</p>
                  {/* Last test meta chips */}
                  {testMetaMap[api.id] && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">List {testMetaMap[api.id].listStatus}</Badge>
                      <span>{(testMetaMap[api.id].listMs || 0).toFixed(1)} ms</span>
                      {typeof testMetaMap[api.id].genStatus !== 'undefined' && (
                        <>
                          <span>•</span>
                          <Badge variant="outline">Gen {testMetaMap[api.id].genStatus}</Badge>
                          <span>{(testMetaMap[api.id].genMs || 0).toFixed(1)} ms</span>
                        </>
                      )}
                    </div>
                  )}
                  {/* Prompt Test Controls */}
                  <div className="mt-3 space-y-2">
                    <Label>Test Prompt</Label>
                    <Input
                      placeholder="Test connection: Reply with 'OK' if you received this message."
                      value={testPromptMap[api.id] || ''}
                      onChange={(e) => setTestPromptMap(prev => ({ ...prev, [api.id]: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setTestPromptMap(prev => ({ ...prev, [api.id]: "Test connection: Reply with 'OK' if you received this message." }))}>Use OK Sample</Button>
                      <Button variant="outline" size="sm" onClick={() => setTestPromptMap(prev => ({ ...prev, [api.id]: `Generate a 4-day Thailand itinerary covering Bangkok and Pattaya. Include hotel suggestions, sightseeing highlights, and approximate timing per day. Keep it short, structured, and easy to read.` }))}>Use Itinerary Sample</Button>
                    </div>
                    {/* Model override for OpenAI */}
                    {((String(api.base_url || '').toLowerCase().includes('api.openai.com')) || (String(api.provider_name || '').toLowerCase().includes('openai'))) && (
                      <div className="mt-2">
                        <Label>Model Override (optional)</Label>
                        <select
                          className="w-full border rounded px-2 py-1"
                          value={modelOverrideMap[api.id] || ''}
                          onChange={(e) => setModelOverrideMap(prev => ({ ...prev, [api.id]: e.target.value }))}
                        >
                          <option value="">Default (integration)</option>
                          <option value="gpt-4o-mini">gpt-4o-mini</option>
                          <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                        </select>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => testConnection(api, testPromptMap[api.id], modelOverrideMap[api.id])} disabled={testingApiId === api.id}>
                    {testingApiId === api.id ? 'Testing…' : 'Test'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setTestingSmartId(api.id);
                      try {
                        const res = await fetch('http://localhost:3006/api/test-ai', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ prompt: 'System test: reply with READY.' }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data?.error || 'Test failed');
                        toast({ title: 'Smart Router', description: `✅ ${data.provider} (${data.model}) – ${Math.round(data.response_time_ms)} ms` });
                      } catch (e: any) {
                        toast({ title: 'Smart test failed', description: e?.message || 'Unable to test /api/test-ai', variant: 'destructive' });
                      } finally {
                        setTestingSmartId(null);
                      }
                    }}
                    disabled={testingSmartId === api.id}
                  >
                    {testingSmartId === api.id ? 'Routing…' : 'Test AI'}
                  </Button>
                  {testResponseMap[api.id] && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => { setActiveResponseProviderId(api.id); setResponseDialogOpen(true); }}>View Response</Button>
                      <Button variant="outline" size="sm" onClick={() => setTestResponseMap(prev => { const next = { ...prev }; delete next[api.id]; return next; })}>Clear</Button>
                    </>
                  )}
                  <Button variant="outline" size="sm" onClick={() => editAPI(api)}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteAPI(api.id)} disabled={deletingApiId === api.id}>
                    {deletingApiId === api.id ? 'Deleting…' : 'Delete'}
                  </Button>
                </CardFooter>

                {/* Test Response Viewer Dialog */}
                <Dialog open={responseDialogOpen && activeResponseProviderId === api.id} onOpenChange={(open) => setResponseDialogOpen(open)}>
                  <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Test Response</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      <Label>Prompt</Label>
                      <Textarea readOnly value={(testPromptMap[api.id] || '').trim()} className="h-24" />
                      <Label>Full Response</Label>
                      <Textarea readOnly value={(testResponseMap[api.id] || '').trim()} className="h-48" />
                    </div>
                    <DialogFooter className="gap-2">
                      <Button variant="outline" onClick={() => { setResponseDialogOpen(false); }}>Close</Button>
                      <Button variant="outline" onClick={() => navigator.clipboard.writeText(testResponseMap[api.id] || '')}>Copy</Button>
                      <Button variant="destructive" onClick={() => { setTestResponseMap(prev => { const next = { ...prev }; delete next[api.id]; return next; }); setResponseDialogOpen(false); }}>Clear</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </Card>
              ))}
          </CardContent>
        </Card>
        
        {/* Currency API Notice */}
        {/* <Alert>
          <ArrowRight className="h-4 w-4" />
          <AlertDescription>
            <strong>Looking for Currency API settings?</strong> CurrencyAPI.com configuration has been moved to{' '}
            <button 
              onClick={() => navigate('/settings/currency-converter')}
              className="text-blue-600 hover:underline font-medium"
            >
              Currency Converter Settings
            </button>{' '}
            for better integration.
          </AlertDescription>
        </Alert> */}
        
       

        {/* API Usage Reports */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>API Usage Reports</CardTitle>
              <CardDescription>View, analyze, and manage AI API activity and performance</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => exportCsvOverview()}>Export Overview CSV</Button>
              <Button variant="outline" onClick={() => exportCsvLogs()}>Download Logs CSV</Button>
              <Button onClick={() => exportPdfOverview()}>Export Overview PDF</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <div>
                <Label>Provider</Label>
                <select className="w-full border rounded px-2 py-1" value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}>
                  <option value="all">All</option>
                  {providerNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Status</Label>
                <select className="w-full border rounded px-2 py-1" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <Label>From</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div>
                <Label>To</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
              <div>
                <Label>Search</Label>
                <Input placeholder="Provider or keyword" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div>
                <Label>Rows</Label>
                <select className="w-full border rounded px-2 py-1" value={logsPageSize} onChange={(e) => { setLogsPageSize(Number(e.target.value)); setLogsPage(1); }}>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setLogsPage(1); fetchUsageLogs(); }} disabled={loadingLogs}>{loadingLogs ? 'Loading…' : 'Apply Filters'}</Button>
              <Button variant="outline" onClick={() => { setDateFrom(''); setDateTo(''); setProviderFilter('all'); setStatusFilter('all'); setSearchQuery(''); setLogsPage(1); fetchUsageLogs(); }}>Reset</Button>
            </div>

            {/* Tabs: Overview / Logs / Trends */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="monitor">Monitor</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
                <TabsTrigger value="limits">Google Rate Limits</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allowedProviders.map(api => {
                    const metrics = overviewMetrics.get(api.provider_name) || { requests: 0, avgMs: 0, errors: 0 };
                    return (
                      <Card key={api.id} className="border">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>{api.provider_name}</span>
                            <Badge variant={api.status === 'active' ? 'success' : 'secondary'}>{api.status}</Badge>
                          </CardTitle>
                          <CardDescription>Last Tested: {api.last_tested ? new Date(api.last_tested).toLocaleString() : 'Never'}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center justify-between"><span>Total Usage Count</span><span className="font-semibold">{typeof api.usage_count === 'number' ? api.usage_count : 0}</span></div>
                          <div className="flex items-center justify-between"><span>Requests (range)</span><span className="font-semibold">{metrics.requests}</span></div>
                          <div className="flex items-center justify-between"><span>Avg. Response Time</span><span className="font-semibold">{metrics.avgMs.toFixed(1)} ms</span></div>
                          <div className="flex items-center justify-between"><span>Recent Errors</span><span className="font-semibold">{metrics.errors}</span></div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                {/* Error summary panel */}
                <Card className="mt-3">
                  <CardHeader>
                    <CardTitle>Error Summary</CardTitle>
                    <CardDescription>Recent failures by provider in selected range</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Provider</TableHead>
                          <TableHead>Errors</TableHead>
                          <TableHead>Last Tested</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allowedProviders.map(api => {
                          const m = overviewMetrics.get(api.provider_name) || { errors: 0 } as any;
                          return (
                            <TableRow key={api.id}>
                              <TableCell>{api.provider_name}</TableCell>
                              <TableCell className="text-destructive font-semibold">{m.errors}</TableCell>
                              <TableCell>{api.last_tested ? new Date(api.last_tested).toLocaleString() : 'Never'}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="monitor">
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Provider Health</CardTitle>
                    <CardDescription>Success rate and latency metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {monitorMetrics.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No activity in selected range.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Provider</TableHead>
                            <TableHead>Requests</TableHead>
                            <TableHead>Success Rate</TableHead>
                            <TableHead>Avg Latency</TableHead>
                            <TableHead>p95 Latency</TableHead>
                            <TableHead>Errors</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {monitorMetrics.map((m) => (
                            <TableRow key={m.provider_name}>
                              <TableCell>{m.provider_name}</TableCell>
                              <TableCell>{m.total}</TableCell>
                              <TableCell>{m.successRate}%</TableCell>
                              <TableCell>{m.avgMs.toFixed(1)} ms</TableCell>
                              <TableCell>{m.p95Ms.toFixed(1)} ms</TableCell>
                              <TableCell className={m.errors > 0 ? 'text-destructive font-semibold' : ''}>{m.errors}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="logs">
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Detailed Logs</CardTitle>
                    <CardDescription>Endpoint, timestamp, status, and duration</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingLogs && <p className="text-sm text-muted-foreground">Loading logs…</p>}
                    {!loadingLogs && filteredLogs.length === 0 && <p className="text-sm text-muted-foreground">No logs match current filters.</p>}
                    {!loadingLogs && filteredLogs.length > 0 && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Provider</TableHead>
                            <TableHead>Endpoint</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Response Time</TableHead>
                            <TableHead>Timestamp</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLogs.map((log: any, idx: number) => (
                            <TableRow key={`${log.id || idx}`} className="cursor-pointer" onClick={() => setSelectedLog(log)}>
                              <TableCell>{log.provider_name || '—'}</TableCell>
                              <TableCell className="truncate max-w-[260px]" title={log.endpoint}>{log.endpoint}</TableCell>
                              <TableCell>{log.status_code}</TableCell>
                              <TableCell>{Number(log.response_time || 0).toFixed(1)} ms</TableCell>
                              <TableCell>{log.created_at ? new Date(log.created_at).toLocaleString() : '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    {!loadingLogs && filteredLogs.length > 0 && (
                      <div className="flex items-center justify-between pt-3">
                        <div className="text-sm text-muted-foreground">
                          Page {logsPage} of {Math.max(1, Math.ceil(((logsTotal || filteredLogs.length) / logsPageSize)))} · Showing {filteredLogs.length} rows
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setLogsPage(p => Math.max(1, p - 1))} disabled={logsPage <= 1}>Prev</Button>
                          <Button variant="outline" size="sm" onClick={() => setLogsPage(p => p + 1)} disabled={logsTotal > 0 ? logsPage >= Math.ceil(logsTotal / logsPageSize) : false}>Next</Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trends">
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Request Trends</CardTitle>
                    <CardDescription>Daily volume in selected range</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="total" stroke="#2563eb" name="Requests" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="h-[260px] mt-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="total" fill="#22c55e" name="Requests" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="limits">
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Rate Limits by Model (Google Keys)</CardTitle>
                    <CardDescription>Current month peak usage vs configured limits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {googleRateLimitRows.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No Google integrations found or no logs this month.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Provider</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>RPM</TableHead>
                            <TableHead>TPM</TableHead>
                            <TableHead>RPD</TableHead>
                            <TableHead>Peak RPM (month)</TableHead>
                          <TableHead>Peak RPD (month)</TableHead>
                          <TableHead>Peak TPM (month)</TableHead>
                          <TableHead>RPM Utilization</TableHead>
                          <TableHead>RPD Utilization</TableHead>
                          <TableHead>TPM Utilization</TableHead>
                          <TableHead>Warning</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {googleRateLimitRows.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell>{row.provider}</TableCell>
                              <TableCell className="truncate max-w-[220px]" title={row.model}>{row.model}</TableCell>
                              <TableCell>{row.category}</TableCell>
                              <TableCell>{row.rpm}</TableCell>
                              <TableCell>{row.tpm}</TableCell>
                              <TableCell>{row.rpd}</TableCell>
                              <TableCell>{row.peakRPM}</TableCell>
                              <TableCell>{row.peakRPD}</TableCell>
                              <TableCell>{row.peakTPM}</TableCell>
                              <TableCell>{row.rpmUtil}</TableCell>
                              <TableCell>{row.rpdUtil}</TableCell>
                              <TableCell>{row.tpmUtil}</TableCell>
                              <TableCell className={row.warn ? 'text-red-600 font-medium' : ''}>{row.warn || '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        {/* Add / Edit API Modal */}
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingApiId ? 'Edit API Provider' : 'Add New API'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Provider Name (Gemini / OpenAI)"
                value={form.provider_name}
                onChange={(e) => setForm({ ...form, provider_name: e.target.value })}
              />
              <Input
                placeholder="Base URL (e.g. https://generativelanguage.googleapis.com/v1 or https://api.openai.com)"
                value={form.base_url}
                onChange={(e) => setForm({ ...form, base_url: e.target.value })}
              />
              <div className="relative">
                <Input
                  type={modalShowKey ? 'text' : 'password'}
                  placeholder="API Key"
                  value={form.api_key}
                  onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                />
                <button type="button" className="absolute right-3 top-2" onClick={() => setModalShowKey(!modalShowKey)}>
                  {modalShowKey ? <EyeOffIcon className="h-4 w-4 text-gray-500" /> : <EyeIcon className="h-4 w-4 text-gray-500" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <label>Status:</label>
                <Switch
                  checked={form.status === 'active'}
                  onCheckedChange={(checked) => setForm({ ...form, status: checked ? 'active' : 'inactive' })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input
                  placeholder="Model Name (optional, e.g. gemini-2.5-flash or gpt-4o-mini)"
                  value={form.model_name || ''}
                  onChange={(e) => setForm({ ...form, model_name: e.target.value })}
                />
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Temperature"
                  value={String(form.temperature ?? 0.7)}
                  onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })}
                />
                <Input
                  type="number"
                  placeholder="Max Tokens"
                  value={String(form.max_tokens ?? 2048)}
                  onChange={(e) => setForm({ ...form, max_tokens: Number(e.target.value) })}
                />
                <Input
                  type="number"
                  placeholder="Priority (lower runs first, default 0)"
                  value={String(typeof form.priority === 'number' ? form.priority : 0)}
                  onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                />
              </div>
              {/* Limits configuration */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input
                  type="number"
                  placeholder="Daily Limit (requests per day)"
                  value={String(typeof form.daily_limit === 'number' ? form.daily_limit : 50)}
                  onChange={(e) => setForm({ ...form, daily_limit: Number(e.target.value) })}
                />
                <Input
                  type="number"
                  placeholder="RPM (requests per minute)"
                  value={String(form.requests_per_minute_limit ?? 60)}
                  onChange={(e) => setForm({ ...form, requests_per_minute_limit: Number(e.target.value) })}
                />
                <Input
                  type="number"
                  placeholder="TPM (tokens per minute, input)"
                  value={String(form.tokens_per_minute_limit ?? 30000)}
                  onChange={(e) => setForm({ ...form, tokens_per_minute_limit: Number(e.target.value) })}
                />
                <Input
                  type="number"
                  placeholder="RPD (requests per day)"
                  value={String(form.requests_per_day_limit ?? 500)}
                  onChange={(e) => setForm({ ...form, requests_per_day_limit: Number(e.target.value) })}
                />
              </div>
              {editingApi && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between"><span>Current minute requests</span><span className="font-semibold">{typeof editingApi.current_minute_requests === 'number' ? editingApi.current_minute_requests : 0}</span></div>
                  <div className="flex items-center justify-between"><span>Current minute tokens</span><span className="font-semibold">{typeof editingApi.current_minute_tokens === 'number' ? editingApi.current_minute_tokens : 0}</span></div>
                  <div className="flex items-center justify-between"><span>Current day requests</span><span className="font-semibold">{typeof editingApi.current_day_requests === 'number' ? editingApi.current_day_requests : 0}</span></div>
                  <div className="flex items-center justify-between"><span>Last reset minute</span><span className="font-semibold">{editingApi.last_reset_minute ? new Date(editingApi.last_reset_minute).toLocaleString() : '—'}</span></div>
                  <div className="flex items-center justify-between"><span>Last reset day</span><span className="font-semibold">{editingApi.last_reset_day ? new Date(editingApi.last_reset_day).toLocaleString() : '—'}</span></div>
                </div>
              )}
              {editingApi && isAdmin && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={resetMinuteCounters}>Reset minute counters</Button>
                  <Button variant="outline" size="sm" onClick={resetDayCounters}>Reset day counters</Button>
                  <Button variant="destructive" size="sm" onClick={resetAllCounters}>Zero all counters</Button>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleSaveProvider} disabled={savingApi}>{savingApi ? 'Saving…' : 'Save'}</Button>
              <Button variant="outline" onClick={() => setOpenModal(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Log Details Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Log Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between"><span>Provider</span><span className="font-semibold">{selectedLog?.provider_name || '—'}</span></div>
              <div className="flex items-center justify-between"><span>Endpoint</span><span className="font-semibold truncate max-w-[360px]" title={selectedLog?.endpoint}>{selectedLog?.endpoint || '—'}</span></div>
              <div className="flex items-center justify-between"><span>Status Code</span><span className="font-semibold">{selectedLog?.status_code ?? '—'}</span></div>
              <div className="flex items-center justify-between"><span>Response Time</span><span className="font-semibold">{selectedLog ? Number(selectedLog.response_time || 0).toFixed(1) : '—'} ms</span></div>
              <div className="flex items-center justify-between"><span>Timestamp</span><span className="font-semibold">{selectedLog?.created_at ? new Date(selectedLog.created_at).toLocaleString() : '—'}</span></div>
              <div className="flex items-center justify-between"><span>Model</span><span className="font-semibold">{selectedLog?.model_name || '—'}</span></div>
              <div className="flex items-center justify-between"><span>Prompt Tokens</span><span className="font-semibold">{typeof selectedLog?.prompt_tokens === 'number' ? selectedLog?.prompt_tokens : '—'}</span></div>
              <div className="flex items-center justify-between"><span>Completion Tokens</span><span className="font-semibold">{typeof selectedLog?.completion_tokens === 'number' ? selectedLog?.completion_tokens : '—'}</span></div>
              <div className="flex items-center justify-between"><span>Total Tokens</span><span className="font-semibold">{typeof selectedLog?.total_tokens === 'number' ? selectedLog?.total_tokens : (typeof selectedLog?.prompt_tokens === 'number' || typeof selectedLog?.completion_tokens === 'number' ? (Number(selectedLog?.prompt_tokens || 0) + Number(selectedLog?.completion_tokens || 0)) : '—')}</span></div>
              {selectedLog?.fallback_reason && (<div className="flex items-center justify-between"><span>Fallback</span><span className="font-semibold truncate max-w-[360px]" title={selectedLog.fallback_reason}>{selectedLog.fallback_reason}</span></div>)}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setSelectedLog(null)}>Close</Button>
              {isAdmin && selectedLog?.id && (
                <Button variant="destructive" onClick={deleteSelectedLog}>Delete Log</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};

export default ApiSettings;
