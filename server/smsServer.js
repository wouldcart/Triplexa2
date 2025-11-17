import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const app = express()
const PORT = Number(process.env.SMS_SERVER_PORT || 3005)
let MODE = String(process.env.SMS_MODE || 'mock').toLowerCase()
let TWO_FACTOR_API_KEY = process.env.TWO_FACTOR_API_KEY || ''
let SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'TXPORT'
let SMS_TEMPLATE = process.env.SMS_TEMPLATE || 'Your OTP for Triplexa is {otp}.'
let ENABLE_SEND = true
let ENABLE_VERIFY = true
let PROVIDER = '2factor'

app.use(helmet())
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean)
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true)
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
      if (/^http:\/\/localhost:\d+$/.test(origin)) return cb(null, true)
      return cb(new Error('Not allowed by CORS'))
    },
  })
)
app.options('*', cors())
app.use(express.json({ limit: '1mb' }))

const ipLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 })
app.use(ipLimiter)

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase configuration for SMS server')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function loadSmsConfig() {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('setting_json')
      .eq('category', 'Integrations')
      .eq('setting_key', 'sms_otp_config')
      .maybeSingle()
    if (!error && data && data.setting_json) {
      const cfg = data.setting_json
      PROVIDER = String(cfg.provider || PROVIDER)
      MODE = String(cfg.mode || MODE).toLowerCase()
      TWO_FACTOR_API_KEY = String(cfg.api_key || TWO_FACTOR_API_KEY)
      SMS_SENDER_ID = String(cfg.sender_id || SMS_SENDER_ID)
      SMS_TEMPLATE = String(cfg.template_text || SMS_TEMPLATE)
      ENABLE_SEND = cfg.enabled_send !== false
      ENABLE_VERIFY = cfg.enabled_verify !== false
      console.log('🔧 Loaded SMS config from app_settings')
    }
  } catch (e) {
    console.warn('SMS config load failed, using env fallback:', e.message)
  }
}

function randomPassword(len = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

async function ensureAgentUser(phone, name) {
  const digits = String(phone || '').replace(/\D/g, '')
  const email = `agent.${digits}@mobile.local`
  const pwd = randomPassword(14)
  try {
    const admin = supabase.auth.admin
    // Try find existing profile by phone
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('phone', `+91${digits.slice(-10)}`)
      .limit(1)
    let userId = existingProfile && existingProfile[0] && existingProfile[0].id
    if (userId) {
      // Update existing auth user with alias email and new password
      const { error: updErr } = await admin.updateUserById(userId, {
        email,
        password: pwd,
        email_confirm: true,
        user_metadata: { role: 'agent', phone: `+91${digits.slice(-10)}`, name },
        app_metadata: { role: 'agent' }
      })
      if (updErr) throw new Error(updErr.message || 'updateUserById failed')
    } else {
      const { data: created, error: createErr } = await admin.createUser({
        email,
        password: pwd,
        email_confirm: true,
        user_metadata: { role: 'agent', phone: `+91${digits.slice(-10)}`, name },
        app_metadata: { role: 'agent' }
      })
      if (createErr) throw new Error(createErr.message || 'createUser failed')
      userId = created?.user?.id
    }
    await supabase
      .from('profiles')
      .upsert({
        id: userId,
        name: name || `Agent ${digits.slice(-4)}`,
        email,
        role: 'agent',
        phone: `+91${digits.slice(-10)}`,
        status: 'active',
        position: 'Agent'
      }, { onConflict: 'id' })
    return { email, password: pwd, user_id: userId }
    throw new Error('User creation failed')
  } catch (e) {
    return { error: e.message || 'User creation error' }
  }
}

function normalizePhone(phone) {
  const p = String(phone || '').replace(/\D/g, '')
  if (!p) return ''
  if (p.length === 10) return `+91${p}`
  if (p.startsWith('91') && p.length === 12) return `+${p}`
  if (p.startsWith('0') && p.length === 11) return `+91${p.slice(1)}`
  if (p.startsWith('+')) return p
  return `+${p}`
}

function generateOtp(len = 6) {
  let s = ''
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10)
  return s
}

async function logOtp({ phone, mode, provider = '2factor', request_id, status, error_code = null, error_message = null, otp_last2 = null }) {
  try {
    await supabase.from('otp_logs').insert({
      phone,
      mode,
      provider,
      request_id,
      status,
      error_code,
      error_message,
      otp_last2,
    })
  } catch (e) {
    console.error('Failed to log OTP:', e.message)
  }
}

const phoneLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => normalizePhone(req.body?.phone || req.query?.phone || req.params?.phone || req.ip),
  skipFailedRequests: false,
})

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'sms-server', mode: MODE, provider: PROVIDER, enabled_send: ENABLE_SEND, enabled_verify: ENABLE_VERIFY, timestamp: new Date().toISOString() })
})

app.get('/api/sms/config/status', async (req, res) => {
  await loadSmsConfig()
  res.json({ mode: MODE, provider: PROVIDER, sender_id: SMS_SENDER_ID, enabled_send: ENABLE_SEND, enabled_verify: ENABLE_VERIFY })
})

app.post('/api/sms/sendOtp', phoneLimiter, async (req, res) => {
  try {
    await loadSmsConfig()
    const phoneRaw = req.body?.phone
    const purpose = String(req.body?.purpose || 'login')
    const phone = normalizePhone(phoneRaw)
    if (!phone) return res.status(400).json({ error: 'Invalid phone number' })

    if (!ENABLE_SEND) return res.status(503).json({ error: 'SMS send disabled' })
    const otp = generateOtp(6)
    const maskedLast2 = otp.slice(-2)

    if (MODE === 'mock') {
      const request_id = `mock_${Date.now()}`
      await logOtp({ phone, mode: 'send', request_id, status: 'sent', otp_last2: maskedLast2 })
      return res.json({ request_id, status: 'sent', mode: 'mock' })
    }

    if (!TWO_FACTOR_API_KEY) {
      await logOtp({ phone, mode: 'send', status: 'failed', error_code: 401, error_message: 'Missing TWO_FACTOR_API_KEY' })
      return res.status(500).json({ error: 'SMS provider not configured' })
    }

    const url = `https://2factor.in/API/V1/${encodeURIComponent(TWO_FACTOR_API_KEY)}/SMS/${encodeURIComponent(phone)}/${encodeURIComponent(otp)}/${encodeURIComponent(SMS_SENDER_ID)}`
    const controller = new AbortController()
    const to = setTimeout(() => controller.abort('timeout'), 10000)
    const resp = await fetch(url, { method: 'GET', signal: controller.signal }).catch((e) => ({ ok: false, status: 0, json: async () => ({ Details: e.message }) }))
    clearTimeout(to)
    const json = await resp.json().catch(() => ({}))
    const ok = resp.ok && String(json?.Status || '').toLowerCase() === 'success'
    const request_id = json?.Details || ''

    if (!ok) {
      const code = resp.status || 500
      const msg = json?.Details || 'Provider error'
      await logOtp({ phone, mode: 'send', request_id, status: 'failed', error_code: code, error_message: msg, otp_last2: maskedLast2 })
      const mapped = code === 429 ? 'Rate limit exceeded' : code === 401 ? 'Authentication failed' : 'Failed to send OTP'
      return res.status(code === 0 ? 500 : code).json({ error: mapped, provider_error: msg })
    }

    await logOtp({ phone, mode: 'send', request_id, status: 'sent', otp_last2: maskedLast2 })
    res.json({ request_id, status: 'sent' })
  } catch (err) {
    await logOtp({ phone: normalizePhone(req.body?.phone), mode: 'send', status: 'failed', error_code: 500, error_message: err.message })
    res.status(500).json({ error: 'Internal error' })
  }
})

app.post('/api/sms/verifyOtp', phoneLimiter, async (req, res) => {
  try {
    await loadSmsConfig()
    const phoneRaw = req.body?.phone
    const request_id = String(req.body?.request_id || '')
    const otp = String(req.body?.otp || '')
    const phone = normalizePhone(phoneRaw)
    if (!phone || !request_id || !otp) return res.status(400).json({ error: 'phone, request_id and otp are required' })

    if (MODE === 'mock') {
      await logOtp({ phone, mode: 'verify', request_id, status: 'verified' })
      return res.json({ status: 'verified' })
    }

    if (!ENABLE_VERIFY) return res.status(503).json({ error: 'SMS verify disabled' })
    if (!TWO_FACTOR_API_KEY) {
      await logOtp({ phone, mode: 'verify', request_id, status: 'failed', error_code: 401, error_message: 'Missing TWO_FACTOR_API_KEY' })
      return res.status(500).json({ error: 'SMS provider not configured' })
    }

    const url = `https://2factor.in/API/V1/${encodeURIComponent(TWO_FACTOR_API_KEY)}/SMS/VERIFY/${encodeURIComponent(request_id)}/${encodeURIComponent(otp)}`
    const controller = new AbortController()
    const to = setTimeout(() => controller.abort('timeout'), 10000)
    const resp = await fetch(url, { method: 'GET', signal: controller.signal }).catch((e) => ({ ok: false, status: 0, json: async () => ({ Details: e.message }) }))
    clearTimeout(to)
    const json = await resp.json().catch(() => ({}))
    const ok = resp.ok && String(json?.Status || '').toLowerCase() === 'success'

    if (!ok) {
      const code = resp.status || 500
      const msg = json?.Details || 'Provider error'
      await logOtp({ phone, mode: 'verify', request_id, status: 'failed', error_code: code, error_message: msg })
      const mapped = code === 429 ? 'Too many attempts' : code === 401 ? 'Authentication failed' : (msg?.toLowerCase().includes('expired') ? 'OTP expired' : 'Invalid OTP')
      return res.status(code === 0 ? 500 : code).json({ error: mapped, provider_error: msg })
    }

    await logOtp({ phone, mode: 'verify', request_id, status: 'verified' })
    res.json({ status: 'verified' })
  } catch (err) {
    await logOtp({ phone: normalizePhone(req.body?.phone), mode: 'verify', request_id: String(req.body?.request_id || ''), status: 'failed', error_code: 500, error_message: err.message })
    res.status(500).json({ error: 'Internal error' })
  }
})

app.post('/api/sms/agent/upsert', async (req, res) => {
  try {
    await loadSmsConfig()
    const phoneRaw = req.body?.phone
    const name = String(req.body?.name || '')
    const phone = normalizePhone(phoneRaw)
    if (!phone) return res.status(400).json({ error: 'Invalid phone number' })
    const result = await ensureAgentUser(phone, name)
    if (result?.error) return res.status(500).json({ error: result.error })
    res.json({ email: result.email, password: result.password, user_id: result.user_id })
  } catch (err) { res.status(500).json({ error: 'Internal error' }) }
})

app.post('/api/auth/update-email', async (req, res) => {
  try {
    const { user_id, new_email } = req.body || {}
    if (!user_id || !new_email) return res.status(400).json({ error: 'user_id and new_email required' })
    const email = String(new_email || '').trim().toLowerCase()
    const emailValid = /.+@.+\..+/.test(email)
    if (!emailValid) return res.status(400).json({ error: 'Invalid email format' })
    const admin = supabase.auth.admin
    const { error: updErr } = await admin.updateUserById(user_id, {
      email,
      email_confirm: true
    })
    if (updErr) return res.status(409).json({ error: updErr.message || 'Update failed' })
    const { error: profErr } = await supabase.from('profiles').update({ email, updated_at: new Date().toISOString() }).eq('id', user_id)
    if (profErr) return res.status(500).json({ error: profErr.message || 'Profile update failed' })
    res.json({ ok: true, email })
  } catch (e) { res.status(500).json({ error: e.message || 'Internal error' }) }
})

app.listen(PORT, async () => {
  await loadSmsConfig()
  console.log(`📲 SMS server running on http://localhost:${PORT} (mode=${MODE})`)
})

export default app
