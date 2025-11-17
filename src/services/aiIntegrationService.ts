import { supabase } from '@/lib/supabaseClient'

export type Provider = { id: string, provider_name: string, base_url: string, api_key?: string, model_name?: string, priority?: number, status?: string }

export function getAiBaseUrl(): string {
  const base = (import.meta as any).env?.VITE_AI_SERVER_URL || 'http://localhost:3004'
  return String(base)
}

export async function getActiveProviders(): Promise<Provider[]> {
  const { data, error } = await supabase
    .from('api_integrations')
    .select('*')
    .eq('status', 'active')
    .order('priority', { ascending: true })
  if (error) return []
  return (data || []) as Provider[]
}

export async function checkHealth(base: string): Promise<boolean> {
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/health`)
    return res.ok
  } catch {
    return false
  }
}

export async function generateEmailTemplate(args: { subject: string, category: string, providerHint?: string, contentGuide?: string }) {
  const base = getAiBaseUrl().replace(/\/$/, '')
  const res = await fetch(`${base}/api/generate-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args)
  })
  if (!res.ok) {
    let err: any = {}
    try { err = await res.json() } catch {}
    throw new Error(err.error || 'AI generation failed')
  }
  return res.json()
}
