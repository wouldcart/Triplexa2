# Vercel Deployment Guide

This guide explains how to deploy the Triplexa application to Vercel with the new serverless architecture.

## Architecture Overview

The application has been converted to use a serverless architecture compatible with Vercel:

- **Frontend**: React + Vite application served as static files
- **API Routes**: Serverless functions in `/api` directory
- **AI Integration**: Uses existing `/settings/api` infrastructure for AI providers
- **SMS/Auth**: Serverless functions for OTP and authentication

## Local Development

### Development Setup

1. **Start the API Server** (port 3002):
   ```bash
   npm run dev:server
   ```

2. **Start the Frontend** (port 3001):
   ```bash
   npm run dev
   ```

3. **Access the application**: http://localhost:3001

### API Endpoints

- **AI Chat**: `POST /api/ai/chat` - Uses configured AI providers from Settings > API
- **SMS OTP**: `POST /api/sms/sendOtp` - Send OTP via SMS
- **SMS Verify**: `POST /api/sms/verifyOtp` - Verify OTP code
- **Auth OTP**: `POST /api/auth/send-otp` - Send auth OTP
- **Auth Verify**: `POST /api/auth/verify-otp` - Verify auth OTP
- **Agent Upsert**: `POST /api/auth/upsert-agent-phone` - Create/update agent

## Vercel Deployment

### Prerequisites

1. **Vercel Account**: Sign up at https://vercel.com
2. **Git Repository**: Push your code to GitHub/GitLab
3. **Environment Variables**: Configure in Vercel dashboard

### Environment Variables

Configure these in your Vercel project settings:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: AI Provider Keys (if not using Settings > API)
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_google_key
```

### Deployment Steps

1. **Connect to Vercel**:
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

2. **Configure Project**:
   - Framework: Vite
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Set Environment Variables** in Vercel dashboard

4. **Deploy**:
   ```bash
   vercel --prod
   ```

## AI Integration Setup

### Configure AI Providers

1. **Go to Settings > API Settings**
2. **Add AI Providers**:
   - **Google Gemini**: Use `https://generativelanguage.googleapis.com/v1` as base URL
   - **OpenAI**: Use `https://api.openai.com/v1` as base URL
3. **Set Priority**: Lower numbers run first
4. **Test Connection**: Use the "Test" button to verify

### AI Chat Features

- **Floating Chat Widget**: Available on all pages when logged in
- **Multi-Provider Support**: Automatically falls back to next provider if one fails
- **Usage Logging**: All AI requests are logged in Settings > API Usage
- **Rate Limiting**: Respects provider rate limits and quotas

## Mobile Login Flow

The mobile login flow has been enhanced:

1. **Step 1**: Choose login method (Email/Phone)
2. **Step 2**: For phone login, choose mode (Login/Register)
3. **Step 3**: Enter phone number and get OTP
4. **Step 4**: Verify OTP and complete login

### Features

- **Existing User Detection**: Shows appropriate form based on registration status
- **OTP Verification**: Secure SMS-based authentication
- **Agent Registration**: Seamless agent onboarding via phone

## Testing

### Test AI Chat
```bash
curl -X POST http://localhost:3002/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello, can you help me plan a trip to Thailand?"}'
```

### Test SMS OTP
```bash
curl -X POST http://localhost:3002/api/sms/sendOtp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890"}'
```

### Test OTP Verification
```bash
curl -X POST http://localhost:3002/api/sms/verifyOtp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","otp":"123456"}'
```

## Troubleshooting

### Common Issues

1. **API 404 Errors**: Ensure API server is running on port 3002
2. **CORS Issues**: Check CORS configuration in server.js
3. **AI Provider Failures**: Verify API keys in Settings > API
4. **SMS Not Working**: Check SMS server configuration

### Logs

- **Frontend**: Browser console logs
- **API Server**: Terminal output from `npm run dev:server`
- **Vercel Functions**: Check Vercel dashboard logs

## Production Considerations

### Security

- All API keys are stored securely in environment variables
- Rate limiting is implemented on all endpoints
- CORS is properly configured for production domains

### Performance

- API responses are cached where appropriate
- AI provider fallback ensures reliability
- Static assets are served via Vercel's CDN

### Monitoring

- Health check endpoint: `/health`
- API usage logging in Settings > API Usage
- Error tracking via Vercel dashboard

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Vercel deployment logs
3. Test locally first to isolate issues
4. Check AI provider status in Settings > API Settings