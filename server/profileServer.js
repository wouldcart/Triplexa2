import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PROFILE_SERVER_PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

// Create regular client for auth verification
const authClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Middleware to verify JWT token
async function verifyAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await authClient.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

// GET /api/profile - Get current user's profile
app.get('/api/profile', verifyAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Profile API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/profile - Create or update profile
app.post('/api/profile', verifyAuth, async (req, res) => {
  try {
    const profileData = {
      id: req.user.id,
      email: req.user.email,
      ...req.body,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileData)
      .select()
      .single();

    if (error) {
      console.error('Profile upsert error:', error);
      return res.status(500).json({ error: 'Failed to save profile' });
    }

    res.json(data);
  } catch (error) {
    console.error('Profile save API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/profile - Update profile
app.put('/api/profile', verifyAuth, async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    res.json(data);
  } catch (error) {
    console.error('Profile update API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/profiles - Get all profiles (admin only)
app.get('/api/profiles', verifyAuth, async (req, res) => {
  try {
    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (!userProfile || !['super_admin', 'admin'].includes(userProfile.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Support filtering by role
    const { role } = req.query;
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Profiles fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch profiles' });
    }

    res.json(data);
  } catch (error) {
    console.error('Profiles API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/profiles/:id - Update any profile by ID (admin only)
app.put('/api/profiles/:id', verifyAuth, async (req, res) => {
  try {
    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (!userProfile || !['super_admin', 'admin'].includes(userProfile.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const profileId = req.params.id;
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Profile update API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/profiles/:id - Delete profile by ID (admin only)
app.delete('/api/profiles/:id', verifyAuth, async (req, res) => {
  try {
    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (!userProfile || !['super_admin', 'admin'].includes(userProfile.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const profileId = req.params.id;

    // Prevent deleting own profile
    if (profileId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own profile' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      console.error('Profile delete error:', error);
      return res.status(500).json({ error: 'Failed to delete profile' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ message: 'Profile deleted successfully', profile: data });
  } catch (error) {
    console.error('Profile delete API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/profile - Create profile after signup (public endpoint)
app.post('/api/auth/profile', async (req, res) => {
  try {
    const { userId, email, name, role = 'user' } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: 'userId and email are required' });
    }

    const profileData = {
      id: userId,
      email,
      name: name || email.split('@')[0],
      role,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      console.error('Profile creation error:', error);
      return res.status(500).json({ error: 'Failed to create profile' });
    }

    res.json(data);
  } catch (error) {
    console.error('Profile creation API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'profile-api', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Profile API server running on http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /api/profile - Get current user's profile`);
  console.log(`   POST /api/profile - Create/update profile`);
  console.log(`   PUT  /api/profile - Update profile`);
  console.log(`   GET  /api/profiles - Get all profiles (admin only)`);
  console.log(`   POST /api/auth/profile - Create profile after signup`);
  console.log(`   GET  /health - Health check`);
});

export default app;