import PageLayout from '@/components/layout/PageLayout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'
import { AppSettingsService, AppSettingsHelpers } from '@/services/appSettingsService_database'
import { sendOtp, verifyOtp, getSmsConfigStatus } from '@/services/smsService.ts'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/components/ui/use-toast'

export default function SmsOtpSettings() {
  const { toast } = useToast()
  const [provider, setProvider] = useState('2factor')
  const [mode, setMode] = useState<'mock'|'live'>('mock')
  const [apiKey, setApiKey] = useState('')
  const [senderId, setSenderId] = useState('TRIPEX')
  const [templateName, setTemplateName] = useState('SMSTemplate1otp')
  const [companyName, setCompanyName] = useState('Heeya Travels')
  const [companyWebsite, setCompanyWebsite] = useState('heeyatravels.com')
  const [approvalStatus, setApprovalStatus] = useState('APPROVED')
  const [nature, setNature] = useState('Transactional')
  const [purpose, setPurpose] = useState('Sending OTP to customers')
  const [isOpenTemplate, setIsOpenTemplate] = useState(false)
  const [templateText, setTemplateText] = useState('Hi #VAR1#, Your one time password for phone verification is #VAR2#')
  const [enabledSend, setEnabledSend] = useState(true)
  const [enabledVerify, setEnabledVerify] = useState(true)
  const [mobileLoginVisible, setMobileLoginVisible] = useState(true)
  const [saving, setSaving] = useState(false)
  const [health, setHealth] = useState<any>(null)
  const [testPhone, setTestPhone] = useState('')
  const [requestId, setRequestId] = useState('')
  const [otp, setOtp] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    ;(async () => {
      const status = await getSmsConfigStatus()
      if (status.ok && status.data) setHealth(status.data)
      const cfg = await AppSettingsService.getSetting('Integrations','sms_otp_config')
      if (cfg.success && cfg.data && cfg.data.setting_json) {
        const j: any = cfg.data.setting_json
        setProvider(String(j.provider || provider))
        setMode(String(j.mode || mode) as any)
        setApiKey(String(j.api_key || apiKey))
        setSenderId(String(j.sender_id || senderId))
        setTemplateName(String(j.template_name || templateName))
        setCompanyName(String(j.company_name || companyName))
        setCompanyWebsite(String(j.company_website || companyWebsite))
        setApprovalStatus(String(j.approval_status || approvalStatus))
        setNature(String(j.nature || nature))
        setPurpose(String(j.purpose || purpose))
        setIsOpenTemplate(!!j.is_open_template)
        setTemplateText(String(j.template_text || templateText))
        setEnabledSend(j.enabled_send !== false)
        setEnabledVerify(j.enabled_verify !== false)
        setMobileLoginVisible(j.mobile_login_visible !== false)
      }
      const { data } = await supabase.from('otp_logs').select('*').order('created_at',{ ascending: false }).limit(20)
      setLogs(data || [])
    })()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      provider,
      mode,
      api_key: apiKey,
      sender_id: senderId,
      template_name: templateName,
      company_name: companyName,
      company_website: companyWebsite,
      approval_status: approvalStatus,
      nature,
      purpose,
      is_open_template: isOpenTemplate,
      template_text: templateText,
      enabled_send: enabledSend,
      enabled_verify: enabledVerify,
      mobile_login_visible: mobileLoginVisible,
    }
    await AppSettingsHelpers.upsertSetting({ category: 'Integrations', setting_key: 'sms_otp_config', setting_json: payload })
    setSaving(false)
  }

  const handleSend = async () => {
    setSending(true)
    const r = await sendOtp(testPhone, 'login')
    if (r.ok) {
      setRequestId(r.data.request_id || '')
      toast({ title: 'OTP sent', description: `Request ID: ${r.data.request_id || ''}` })
    } else {
      toast({ title: 'Send failed', description: String(r.data?.error || 'Unknown error') })
    }
    setSending(false)
  }

  const handleVerify = async () => {
    setVerifying(true)
    const r = await verifyOtp(testPhone, requestId, otp)
    if (r.ok) {
      toast({ title: 'OTP verified', description: 'Verification successful' })
      setOtp('')
    } else {
      toast({ title: 'Verification failed', description: String(r.data?.error || 'Unknown error') })
    }
    setVerifying(false)
  }

  return (
    <PageLayout>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>SMS & OTP Configuration</CardTitle>
            <CardDescription>Store provider credentials and control service behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Provider</Label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2factor">2Factor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mode</Label>
                <Select value={mode} onValueChange={(v) => setMode(v as any)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mock">Mock</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>API Key</Label>
                <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" placeholder="Enter API key" />
              </div>
              <div>
                <Label>Sender Id</Label>
                <Input value={senderId} onChange={(e) => setSenderId(e.target.value)} placeholder="TRIPEX" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Template Name</Label>
                <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
              </div>
              <div>
                <Label>Company Name</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Company Website</Label>
                <Input value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} />
              </div>
              <div>
                <Label>Approval Status</Label>
                <Input value={approvalStatus} onChange={(e) => setApprovalStatus(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nature</Label>
                <Input value={nature} onChange={(e) => setNature(e.target.value)} />
              </div>
              <div>
                <Label>Purpose</Label>
                <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Template Text</Label>
              <Input value={templateText} onChange={(e) => setTemplateText(e.target.value)} />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><Switch checked={enabledSend} onCheckedChange={setEnabledSend} /><span>Enable Send</span></div>
              <div className="flex items-center gap-2"><Switch checked={enabledVerify} onCheckedChange={setEnabledVerify} /><span>Enable Verify</span></div>
              <div className="flex items-center gap-2"><Switch checked={isOpenTemplate} onCheckedChange={setIsOpenTemplate} /><span>Open Template</span></div>
              <div className="flex items-center gap-2"><Switch checked={mobileLoginVisible} onCheckedChange={setMobileLoginVisible} /><span>Show Mobile Login</span></div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Configuration'}</Button>
              {health && (
                <Badge variant="outline">{health.provider || 'sms'} • {health.mode}</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Sender</CardTitle>
            <CardDescription>Send and verify OTP</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="8104430753" />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSend} disabled={sending || !testPhone}>{sending ? 'Sending…' : 'Send OTP'}</Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Request ID</Label>
                <Input value={requestId} onChange={(e) => setRequestId(e.target.value)} />
              </div>
              <div>
                <Label>OTP</Label>
                <Input value={otp} onChange={(e) => setOtp(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button onClick={handleVerify} disabled={verifying || !testPhone || !requestId || !otp}>{verifying ? 'Verifying…' : 'Verify OTP'}</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent OTP Logs</CardTitle>
            <CardDescription>Latest events from Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="p-2">Time</th>
                    <th className="p-2">Phone</th>
                    <th className="p-2">Mode</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Provider</th>
                    <th className="p-2">Req ID</th>
                    <th className="p-2">Err</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="p-2">{r.phone}</td>
                      <td className="p-2">{r.mode}</td>
                      <td className="p-2">{r.status}</td>
                      <td className="p-2">{r.provider}</td>
                      <td className="p-2">{r.request_id}</td>
                      <td className="p-2">{r.error_message || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
