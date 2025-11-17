# Google OAuth Setup Guide for Triplexa

## Issue: Google Sign-in Error "TypeError: oe is not a function"

### Root Cause
Google OAuth provider is not configured in the Supabase dashboard, causing the authentication flow to fail.

### Solution Steps

#### 1. Configure Google OAuth in Supabase Dashboard

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Select your project**: `xzofytokwszfwiupsdvi`
3. **Navigate to Authentication**: Click on "Authentication" in the left sidebar
4. **Go to Providers**: Click on "Providers" tab
5. **Enable Google Provider**: 
   - Find "Google" in the list of providers
   - Toggle it ON
   - Fill in the required credentials:
     - **Client ID**: Your Google OAuth Client ID
     - **Client Secret**: Your Google OAuth Client Secret

#### 2. Set up Google Cloud Console

1. **Go to Google Cloud Console**: https://console.cloud.google.com
2. **Create a new project** or select existing one
3. **Enable Google+ API**: 
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `https://xzofytokwszfwiupsdvi.supabase.co/auth/v1/callback`
     - `http://localhost:5173/login` (for local development)
     - `https://tripoex.heeyatravels.com/login` (for production)

#### 3. Update Environment Variables

Add these to your `.env` file if not already present:

```bash
VITE_GOOGLE_OAUTH_CLIENT_ID=your_google_client_id
VITE_GOOGLE_OAUTH_CLIENT_SECRET=your_google_client_secret
```

#### 4. Verify Configuration

After setup, test the Google sign-in functionality:

1. **Local Development**: 
   ```bash
   npm run dev
   ```
   Then navigate to http://localhost:5173/login

2. **Production**: 
   Deploy to Vercel and test at https://tripoex.heeyatravels.com/login

### Debugging Tips

1. **Check Browser Console**: Look for specific OAuth error messages
2. **Supabase Auth Logs**: Check the Authentication logs in Supabase dashboard
3. **Google Cloud Logs**: Monitor OAuth usage in Google Cloud Console

### Common Issues and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "TypeError: oe is not a function" | Google OAuth not configured | Enable Google provider in Supabase |
| "Invalid redirect URI" | Redirect URI mismatch | Add correct URIs in Google Cloud Console |
| "Permission denied" | RLS policies blocking access | Check Supabase RLS policies |

### Current Status
- ✅ Supabase client configured
- ✅ Auth helpers implemented
- ✅ Login page Google OAuth integration
- ❌ **Google OAuth provider not enabled in Supabase dashboard**

### Next Steps
1. Complete Google OAuth configuration in Supabase dashboard
2. Test the authentication flow
3. Verify redirect URLs are properly configured