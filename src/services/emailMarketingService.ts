type QueryParams = Record<string, string | number | boolean | undefined>;

export function getBaseUrl() {
  const port = (import.meta as any).env?.VITE_EMAIL_SERVER_PORT || 3001;
  const baseUrl = (import.meta as any).env?.VITE_EMAIL_SERVER_URL || `http://localhost:${port}`;
  return baseUrl;
}

function buildUrl(path: string, params?: QueryParams) {
  const url = new URL(path, getBaseUrl());
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

export async function fetchOutbox(params?: QueryParams) {
  const res = await fetch(buildUrl('/email/outbox', params));
  if (!res.ok) throw new Error('Failed to load outbox');
  return res.json();
}

export async function fetchInbox(params?: QueryParams) {
  const res = await fetch(buildUrl('/email/inbox', params));
  if (!res.ok) throw new Error('Failed to load inbox');
  return res.json();
}

export async function markInboxRead(messageId: string, read: boolean) {
  const res = await fetch(buildUrl('/email/inbox/mark-read'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageId, read })
  });
  if (!res.ok) throw new Error('Failed to update read status');
  return res.json();
}

export async function fetchCampaigns(params?: QueryParams) {
  const res = await fetch(buildUrl('/email/campaigns', params));
  if (!res.ok) throw new Error('Failed to load campaigns');
  return res.json();
}

export async function fetchCampaignRecipients(id: string) {
  const res = await fetch(buildUrl(`/email/campaigns/${id}/recipients`));
  if (!res.ok) throw new Error('Failed to load recipients');
  return res.json();
}

export async function fetchQueueStatus() {
  const res = await fetch(buildUrl('/email/queue/status'));
  if (!res.ok) throw new Error('Failed to load queue status');
  return res.json();
}

export async function createCampaign(payload: { sender_email?: string; subject: string; body_html: string; campaign_type?: string; recipients: string[]; scheduled_at?: string; created_by?: string; config_id?: string; }) {
  const res = await fetch(buildUrl('/email/campaigns'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    let err: any = {};
    try { err = await res.json(); } catch {}
    throw new Error(err.error || 'Failed to create campaign');
  }
  return res.json();
}

export async function sendCampaignNow(id: string) {
  const res = await fetch(buildUrl(`/email/campaigns/${id}/send-now`), { method: 'POST' });
  if (!res.ok) throw new Error('Failed to enqueue campaign');
  return res.json();
}

export async function scheduleCampaign(id: string, scheduled_at: string) {
  const res = await fetch(buildUrl(`/email/campaigns/${id}/schedule`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scheduled_at })
  });
  if (!res.ok) throw new Error('Failed to schedule campaign');
  return res.json();
}

export async function webhookBounce(provider: string, payload: any) {
  const res = await fetch(buildUrl(`/email/webhooks/${provider}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Webhook failed');
  return res.json();
}

export async function pauseCampaign(id: string) {
  const res = await fetch(buildUrl(`/email/campaigns/${id}/pause`), { method: 'POST' });
  if (!res.ok) throw new Error('Failed to pause campaign');
  return res.json();
}

export async function resumeCampaign(id: string) {
  const res = await fetch(buildUrl(`/email/campaigns/${id}/resume`), { method: 'POST' });
  if (!res.ok) throw new Error('Failed to resume campaign');
  return res.json();
}

export async function fetchDashboard() {
  const res = await fetch(buildUrl('/email/dashboard'));
  if (!res.ok) throw new Error('Failed to load dashboard');
  return res.json();
}
