type TelemetryEvent = {
  id: string;
  timestamp: string;
  category: string; // e.g., 'location_cache'
  action: string;   // e.g., 'refresh' | 'prewarm'
  payload?: Record<string, any>;
};

import { supabase } from '@/lib/supabaseClient';

class TelemetryService {
  private storageKey = 'telemetry_events';
  private maxEvents = 1000;
  private uploaderRunning = false;
  private uploadTimer: number | null = null;
  private baseIntervalMs = 30000; // 30s
  private currentIntervalMs = this.baseIntervalMs;
  private maxIntervalMs = 5 * 60 * 1000; // 5 minutes
  private endpointUrl: string | null = (import.meta as any)?.env?.VITE_TELEMETRY_ENDPOINT || null;
  private useSupabase = ((import.meta as any)?.env?.VITE_ENABLE_TELEMETRY_SUPABASE === 'true');

  private load(): TelemetryEvent[] {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(this.storageKey) : null;
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private save(events: TelemetryEvent[]): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(events.slice(-this.maxEvents)));
      }
    } catch {
      // Ignore storage errors in dev
    }
  }

  recordEvent(category: string, action: string, payload?: Record<string, any>): void {
    const event: TelemetryEvent = {
      id: `${category}_${action}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      category,
      action,
      payload: this.sanitizePayload(payload || {}),
    };
    const events = this.load();
    events.push(event);
    this.save(events);
    // Also surface in console during development for quick visibility
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug('[Telemetry]', category, action, payload || {});
    }
  }

  getEvents(category?: string): TelemetryEvent[] {
    const events = this.load();
    return category ? events.filter(e => e.category === category) : events;
  }

  configure(opts: { endpointUrl?: string | null; useSupabase?: boolean; intervalMs?: number } = {}): void {
    if (typeof opts.endpointUrl !== 'undefined') this.endpointUrl = opts.endpointUrl || null;
    if (typeof opts.useSupabase !== 'undefined') this.useSupabase = !!opts.useSupabase;
    if (typeof opts.intervalMs === 'number' && opts.intervalMs > 5000) {
      this.baseIntervalMs = opts.intervalMs;
      this.currentIntervalMs = opts.intervalMs;
    }
  }

  startUploader(): void {
    if (this.uploaderRunning) return;
    this.uploaderRunning = true;
    const schedule = () => {
      if (!this.uploaderRunning) return;
      this.uploadTimer = window.setTimeout(async () => {
        const ok = await this.flush();
        // Backoff on failure; reset on success
        if (ok) {
          this.currentIntervalMs = this.baseIntervalMs;
        } else {
          this.currentIntervalMs = Math.min(this.currentIntervalMs * 2, this.maxIntervalMs);
        }
        schedule();
      }, this.currentIntervalMs);
    };
    schedule();
  }

  stopUploader(): void {
    this.uploaderRunning = false;
    if (this.uploadTimer) {
      clearTimeout(this.uploadTimer);
      this.uploadTimer = null;
    }
  }

  async flush(): Promise<boolean> {
    const events = this.load();
    if (!events.length) return true;

    // Prefer HTTP endpoint if configured; else attempt Supabase
    try {
      if (this.endpointUrl) {
        const res = await fetch(this.endpointUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        this.save([]);
        return true;
      } else if (this.useSupabase) {
        // Map events to telemetry table rows
        const rows = events.map(e => ({
          id: e.id,
          timestamp: e.timestamp,
          category: e.category,
          action: e.action,
          payload: e.payload || {},
        }));
        // Cast to untyped client to avoid strict schema union blocking custom tables
        const client: any = supabase;
        const { error } = await client.from('telemetry_events').insert(rows);
        if (error) throw error;
        this.save([]);
        return true;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      if (import.meta.env.DEV) console.warn('Telemetry flush failed:', err);
      return false;
    }

    // No sink configured; treat as success so we don't backoff endlessly
    return true;
  }

  private sanitizePayload(payload: Record<string, any>): Record<string, any> {
    // Drop known PII keys; limit string sizes; basic safety
    const disallowed = new Set(['email', 'name', 'userId', 'phone', 'address']);
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(payload)) {
      if (disallowed.has(k)) continue;
      if (typeof v === 'string') {
        result[k] = v.length > 256 ? v.slice(0, 256) : v;
      } else if (typeof v === 'object' && v !== null) {
        // Shallow clone to avoid circular refs
        result[k] = JSON.parse(JSON.stringify(v));
      } else {
        result[k] = v;
      }
    }
    return result;
  }
}

export const telemetryService = new TelemetryService();