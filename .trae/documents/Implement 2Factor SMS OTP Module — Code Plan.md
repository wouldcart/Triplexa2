## Backend
- Create `server/smsServer.js` with Express routes (server-only API key).
```js
import express from 'express'
import rateLimit from 'express-rate-limit'
import fetch from 'node-fetch'

const router = express.Router()
const API_KEY = process.env.TWO_FACTOR_API_KEY
const SMS_TEMPLATE = process.env.SMS_TEMPLATE || 'SMSTemplate1'
const otpLimiter = rateLimit({ windowMs: 60_000, max: 5 })

function toE164India(phone) {
  const digits = String(phone).replace(/\D+/g, '')
  if (digits.startsWith('91')) return `+${digits}`
  return `+91${digits}`
}

router.post('/api/sms/sendOtp', otpLimiter, async (req, res) => {
  try {
    const { phone, name } = req.body || {}
    if (!API_KEY) return res.status(500).json({ error: 'missing_api_key' })
    if (!phone) return res.status(400).json({ error: 'invalid_phone' })
    const e164 = toE164India(phone)
    const url = `https://2factor.in/API/V1/${API_KEY}/SMS/${encodeURIComponent(e164)}/AUTOGEN/${encodeURIComponent(SMS_TEMPLATE)}`
    const t0 = Date.now()
    const resp = await fetch(url)
    const ms = Date.now() - t0
    const data = await resp.json().catch(() => ({}))
    // TODO: insert into otp_logs via Supabase service role
    if (resp.ok && data?.Status === 'Success') {
      return res.json({ session_id: data.Details, status: data.Status, message: 'OTP sent' })
    }
    return res.status(400).json({ error: 'send_failed', status: data?.Status, message: data?.Details || 'Failed to send OTP' })
  } catch (e) {
    res.status(500).json({ error: 'server_error', message: e.message })
  }
})

router.post('/api/sms/verifyOtp', otpLimiter, async (req, res) => {
  try {
    const { session_id, otp } = req.body || {}
    if (!API_KEY) return res.status(500).json({ error: 'missing_api_key' })
    if (!session_id || !otp) return res.status(400).json({ error: 'invalid_input' })
    const url = `https://2factor.in/API/V1/${API_KEY}/SMS/VERIFY/${encodeURIComponent(session_id)}/${encodeURIComponent(String(otp))}`
    const t0 = Date.now()
    const resp = await fetch(url)
    const ms = Date.now() - t0
    const data = await resp.json().catch(() => ({}))
    // TODO: insert into otp_logs via Supabase service role
    if (resp.ok && data?.Status === 'Success') {
      return res.json({ verified: true, status: data.Status, message: 'OTP verified' })
    }
    return res.status(400).json({ verified: false, status: data?.Status, message: data?.Details || 'Invalid OTP' })
  } catch (e) {
    res.status(500).json({ error: 'server_error', message: e.message })
  }
})

router.post('/api/sms/sendTemplate', otpLimiter, async (req, res) => {
  try {
    const { to, template, vars = {} } = req.body || {}
    if (!API_KEY) return res.status(500).json({ error: 'missing_api_key' })
    if (!to || !template) return res.status(400).json({ error: 'invalid_input' })
    const e164 = toE164India(to)
    const url = `https://2factor.in/API/V1/${API_KEY}/ADDON_SERVICES/SEND/TSMS`
    const payload = { From: process.env.SMS_SENDER_ID || 'TFCTOR', To: e164, TemplateName: template, VAR1: vars.VAR1 || '', VAR2: vars.VAR2 || '' }
    const t0 = Date.now()
    const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const ms = Date.now() - t0
    const data = await resp.json().catch(() => ({}))
    // TODO: insert into otp_logs
    if (resp.ok && data?.Status === 'Success') {
      return res.json({ status: data.Status, message: 'Template SMS sent', details: data.Details })
    }
    return res.status(400).json({ error: 'send_failed', status: data?.Status, message: data?.Details || 'Failed to send template SMS' })
  } catch (e) {
    res.status(500).json({ error: 'server_error', message: e.message })
  }
})

export default router
```
- Mount the router in your main server: `app.use(require('./smsServer').default)`.
- Add env vars: `TWO_FACTOR_API_KEY`, `SMS_SENDER_ID`, `SMS_TEMPLATE`, `SMS_MODE`.

## Supabase
- Migration SQL for `otp_logs` and optional `user_contact_settings`:
```sql
CREATE TABLE IF NOT EXISTS otp_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  phone TEXT,
  session_id TEXT,
  type TEXT CHECK (type IN ('autogen','verify','template')),
  status TEXT,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otp_logs_user_type_created ON otp_logs(user_id, type, created_at);

CREATE TABLE IF NOT EXISTS user_contact_settings (
  user_id UUID PRIMARY KEY,
  phone TEXT,
  otp_enabled BOOLEAN DEFAULT FALSE,
  preferred_provider TEXT
);
```
- RLS: allow users to `SELECT` their rows; service role writes.

## Frontend Settings Page
- Route in `src/App.tsx`:
```tsx
<Route path="/settings/sms-otp" element={<ProtectedRoute requiredRole={["super_admin","admin"]}><SmsOtpSettings /></ProtectedRoute>} />
```
- `src/pages/settings/sms-otp/index.tsx`:
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'

export default function SmsOtpSettings() {
  const { toast } = useToast()
  const [phone, setPhone] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [otp, setOtp] = useState('')
  async function sendTest() {
    const res = await fetch('/api/sms/sendOtp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) })
    const json = await res.json()
    if (res.ok) { setSessionId(json.session_id); toast({ description: 'OTP sent' }) } else { toast({ description: json.message || 'Failed', variant: 'destructive' }) }
  }
  async function verifyTest() {
    const res = await fetch('/api/sms/verifyOtp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: sessionId, otp }) })
    const json = await res.json()
    if (res.ok && json.verified) { toast({ description: 'OTP verified' }) } else { toast({ description: json.message || 'Invalid OTP', variant: 'destructive' }) }
  }
  return (
    <div className="p-4 grid gap-4">
      <Card>
        <CardHeader><CardTitle>API Configuration</CardTitle></CardHeader>
        <CardContent className="grid gap-2">
          <Input placeholder="API Key" type="password" />
          <Input value="TFCTOR" readOnly />
          <Input defaultValue="SMSTemplate1" placeholder="Template Name" />
          <Input defaultValue="autogen" placeholder="Mode (autogen|template)" />
          <Button>Save</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Test OTP Sender</CardTitle></CardHeader>
        <CardContent className="grid gap-2">
          <Input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Mobile Number" />
          <Button onClick={sendTest}>Send Test OTP</Button>
          <Input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Enter OTP" />
          <Button onClick={verifyTest}>Verify</Button>
        </CardContent>
      </Card>
    </div>
  )
}
```
- Client wrappers:
```ts
// src/api/sms/sendOtp.ts
export async function sendOtp(phone: string) {
  const res = await fetch('/api/sms/sendOtp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) })
  if (!res.ok) throw new Error((await res.json()).message || 'Failed')
  return res.json()
}
// src/api/sms/verifyOtp.ts
export async function verifyOtp(session_id: string, otp: string) {
  const res = await fetch('/api/sms/verifyOtp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id, otp }) })
  if (!res.ok) throw new Error((await res.json()).message || 'Failed')
  return res.json()
}
```
- Hook:
```ts
// src/hooks/useSmsService.ts
import { useState } from 'react'
import { sendOtp, verifyOtp } from '@/api/sms/sendOtp'
export function useSmsService() {
  const [sessionId, setSessionId] = useState('')
  const [cooldown, setCooldown] = useState(0)
  async function start(phone: string) {
    const r = await sendOtp(phone)
    setSessionId(r.session_id)
    setCooldown(30)
  }
  async function confirm(otp: string) {
    return verifyOtp(sessionId, otp)
  }
  return { sessionId, start, confirm, cooldown }
}
```

## Phone Login Flow
- In your phone login component:
```ts
// onSubmit phone
const { sessionId } = await sendOtp(phone)
setSessionId(sessionId)
// prompt for OTP, then
const r = await verifyOtp(sessionId, otp)
if (r.verified) {
  // proceed to existing role-based redirect
}
```

## Validation
- Add tests for valid/invalid phone, resend cooldown, provider 429 backoff, and logs population.

Confirm and I will proceed to create these files and wire them into your codebase. 