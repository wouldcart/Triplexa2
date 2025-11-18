# Vercel Deployment Protection Issue

## Problem
Your Vercel deployment has authentication protection enabled, which is blocking access to the API routes. This is why you're seeing the 405 error - the authentication middleware is intercepting requests before they reach our API endpoints.

## Solution

### Option 1: Disable Deployment Protection (Recommended)
1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project (triplexa2)
3. Go to Settings → General
4. Scroll down to "Deployment Protection"
5. Disable "Vercel Authentication" for the deployment
6. Redeploy your project

### Option 2: Use Bypass Token
If you need to keep protection enabled for security reasons, you can:
1. Generate a bypass token in Vercel dashboard
2. Add it to your requests as a query parameter: `?x-vercel-protection-bypass=YOUR_TOKEN`

### Option 3: Configure Environment Variables
Make sure these environment variables are set in your Vercel project:
```
VITE_SUPABASE_URL=https://xzofytokwszfwiupsdvi.supabase.co
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b2Z5dG9rd3N6ZndpdXBzZHZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM1MzQxMSwiZXhwIjoyMDczOTI5NDExfQ.DtdmBPTmaaMtXk8s_ZKTuXv9b9EHHQoNaepUUFj89rU
```

## Testing After Fix

Once you've disabled deployment protection, test the API:

```bash
# Test SMS API
curl -X POST https://triplexa2-fm1q0qh85-ags-projects-3d2c8039.vercel.app/api/sms/sendOtp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890"}'

# Test AI API
curl -X POST https://triplexa2-fm1q0qh85-ags-projects-3d2c8039.vercel.app/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello, can you help me?"}'
```

## Next Steps
1. Disable deployment protection in Vercel dashboard
2. Set the required environment variables
3. Test the API endpoints
4. Verify SMS and AI functionality works on the deployed site