# Vercel Build Configuration Fix

## Current Issue
The Vercel build is failing because of configuration conflicts. Let me fix this step by step.

## Solution

### Step 1: Update vercel.json with proper configuration

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@vite_supabase_url",
    "VITE_SUPABASE_SERVICE_ROLE_KEY": "@vite_supabase_service_role_key",
    "SUPABASE_URL": "@supabase_url",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key"
  }
}
```

### Step 2: Alternative Minimal Configuration

If the above doesn't work, try this minimal configuration:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Step 3: Build Settings

Make sure your build settings in Vercel dashboard are:
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 4: Environment Variables

Set these in Vercel project settings:
```
VITE_SUPABASE_URL=https://xzofytokwszfwiupsdvi.supabase.co
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b2Z5dG9rd3N6ZndpdXBzZHZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM1MzQxMSwiZXhwIjoyMDczOTI5NDExfQ.DtdmBPTmaaMtXk8s_ZKTuXv9b9EHHQoNaepUUFj89rU
```

## Testing After Fix

```bash
# Test the build locally
npm run build

# Test API routes locally
npm run dev
```

## Common Issues

1. **Build fails**: Check if `dist` directory exists after build
2. **API routes 404**: Verify API files are in `/api` directory
3. **Environment variables**: Make sure they're set in Vercel dashboard
4. **Functions pattern error**: Use the minimal configuration above