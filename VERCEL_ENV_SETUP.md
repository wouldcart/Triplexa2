# Vercel Environment Variables Setup

For the SMS and AI functionality to work properly on Vercel, you need to configure the following environment variables in your Vercel project settings:

## Required Environment Variables

### Supabase Configuration
```
VITE_SUPABASE_URL=https://xzofytokwszfwiupsdvi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b2Z5dG9rd3N6ZndpdXBzZHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNTM0MTEsImV4cCI6MjA3MzkyOTQxMX0.FnTL4m0EmxzlNSRfCD12Gc1_PUpOI4rHvaRemr46CiQ
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b2Z5dG9rd3N6ZndpdXBzZHZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM1MzQxMSwiZXhwIjoyMDczOTI5NDExfQ.DtdmBPTmaaMtXk8s_ZKTuXv9b9EHHQoNaepUUFj89rU
SUPABASE_URL=https://xzofytokwszfwiupsdvi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b2Z5dG9rd3N6ZndpdXBzZHZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM1MzQxMSwiZXhwIjoyMDczOTI5NDExfQ.DtdmBPTmaaMtXk8s_ZKTuXv9b9EHHQoNaepUUFj89rU
```

### SMS Configuration (Optional)
```
TWO_FACTOR_API_KEY=your_2factor_api_key_here
SMS_SENDER_ID=TXPORT
SMS_MODE=mock
```

### AI Configuration (Optional)
```
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
```

## How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add all the variables listed above
5. Click "Save" and redeploy your project

## Testing the API

After setting up the environment variables, you can test the SMS API:

```bash
# Test the SMS API endpoint
curl -X POST https://your-domain.vercel.app/api/sms/sendOtp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890"}'

# Test the AI chat endpoint
curl -X POST https://your-domain.vercel.app/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello, can you help me?"}'
```

## Troubleshooting

If you get a 405 error:
1. Make sure you're using POST method
2. Check that the API route file exists in `/api/sms/sendOtp.js`
3. Verify environment variables are set correctly
4. Check Vercel deployment logs for errors

If SMS is not working:
1. Check that Supabase environment variables are set
2. Verify the `app_settings` table has SMS configuration
3. Check browser console for detailed error messages