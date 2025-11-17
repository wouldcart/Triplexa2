/* 
 * Comprehensive Authentication Server for Triplexa
 * Handles /signup/agent and /login endpoints with Supabase integration
 * Includes data validation, transaction handling, audit logging, and security features
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import { 
  generateOTP, 
  validatePhoneNumber, 
  sendWhatsAppOTP, 
  storeOTP, 
  verifyOTP, 
  checkRateLimit 
} from './whatsappService.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.AUTH_SERVER_PORT || 5000;

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing required Supabase environment variables');
  process.exit(1);
}

// Initialize Supabase clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting (temporarily increased for testing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs (increased for testing)
  message: {
    error: 'Too many authentication attempts, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

app.use('/signup', authLimiter);
app.use('/login', authLimiter);
app.use(generalLimiter);

// Validation schemas
const agentSignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number and special character'),
  phone: z.string().optional(),
  company_name: z.string().min(2, 'Company name must be at least 2 characters').max(200, 'Company name too long'),
  business_address: z.string().optional(),
  business_phone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  business_type: z.enum(['travel_agency', 'tour_operator', 'hotel', 'transport', 'individual', 'other']).optional(),
  specializations: z.array(z.string()).optional(),
  license_number: z.string().optional(),
  agency_code: z.string().optional(),
  iata_number: z.string().optional(),
  source_type: z.enum(['organic', 'referral', 'marketing', 'staff_referral', 'partner']).default('organic'),
  source_details: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().optional().default(false)
});

// WhatsApp OTP Schemas
const sendOTPSchema = z.object({
  phone: z.string().min(10, 'Phone number is required').max(15, 'Phone number too long'),
  role: z.enum(['admin', 'staff', 'agent']).optional().default('agent')
});

const verifyOTPSchema = z.object({
  phone: z.string().min(10, 'Phone number is required').max(15, 'Phone number too long'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must contain only digits'),
  remember_me: z.boolean().optional().default(false)
});

// Utility functions
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  return input;
};

const sanitizeObject = (obj) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeInput(value);
  }
  return sanitized;
};

// Audit logging function
const logActivity = async (action, userId, details, ipAddress, userAgent) => {
  try {
    await adminSupabase
      .from('activity_logs')
      .insert({
        action,
        user_id: userId,
        entity_type: 'auth',
        entity_id: userId,
        details: details || {},
        ip_address: ipAddress,
        user_agent: userAgent,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

// Error handling middleware
const handleError = (res, error, statusCode = 500) => {
  console.error('Auth Server Error:', error);
  
  const errorResponse = {
    success: false,
    error: {
      message: error.message || 'Internal server error',
      code: error.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    }
  };

  // Don't expose sensitive error details in production
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.error.details = error.details || error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// Middleware to extract client info
const extractClientInfo = (req, res, next) => {
  req.clientInfo = {
    ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'],
    userAgent: req.headers['user-agent'] || 'Unknown'
  };
  next();
};

app.use(extractClientInfo);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'auth-server',
    version: '1.0.0'
  });
});

// Agent Signup Endpoint
app.post('/signup/agent', async (req, res) => {
  try {
    console.log('🚀 Agent signup request received');
    
    // Sanitize input data
    const sanitizedData = sanitizeObject(req.body);
    
    // Validate input data
    const validationResult = agentSignupSchema.safeParse(sanitizedData);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors,
          timestamp: new Date().toISOString()
        }
      });
    }

    const agentData = validationResult.data;
    
    // Check if email already exists
    const { data: existingUser, error: checkError } = await adminSupabase
      .from('profiles')
      .select('email')
      .eq('email', agentData.email)
      .single();

    if (existingUser) {
      await logActivity('SIGNUP_FAILED', null, { 
        reason: 'Email already exists', 
        email: agentData.email 
      }, req.clientInfo.ipAddress, req.clientInfo.userAgent);
      
      return res.status(409).json({
        success: false,
        error: {
          message: 'Email already registered',
          code: 'EMAIL_EXISTS',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Start transaction-like operation
    let authUserId = null;
    let profileCreated = false;
    let agentCreated = false;

    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
        email: agentData.email,
        password: agentData.password,
        email_confirm: true,
        user_metadata: {
          role: 'agent',
          name: agentData.name,
          phone: agentData.phone,
          company_name: agentData.company_name,
          source_type: agentData.source_type,
          source_details: agentData.source_details
        }
      });

      if (authError) {
        console.error('❌ Supabase Auth Error:', JSON.stringify(authError, null, 2));
        throw new Error(`Auth user creation failed: ${authError.message}`);
      }

      authUserId = authData.user.id;
      console.log(`✅ Auth user created with ID: ${authUserId}`);

      // Step 2: Create profile record
      const { error: profileError } = await adminSupabase
        .from('profiles')
        .insert({
          id: authUserId,
          name: agentData.name,
          email: agentData.email,
          phone: agentData.phone,
          company_name: agentData.company_name,
          role: 'agent',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      profileCreated = true;
      console.log('✅ Profile record created');

      // Step 3: Create agent record
      const { error: agentError } = await adminSupabase
        .from('agents')
        .insert({
          id: randomUUID(),
          user_id: authUserId,
          agency_name: agentData.company_name,
          business_address: agentData.business_address,
          business_phone: agentData.business_phone,
          license_number: agentData.license_number,
          agency_code: agentData.agency_code,
          iata_number: agentData.iata_number,
          specializations: agentData.specializations || [],
          status: 'active',
          commission_structure: {
            type: 'percentage',
            value: 10,
            currency: 'USD'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (agentError) {
        throw new Error(`Agent record creation failed: ${agentError.message}`);
      }

      agentCreated = true;
      console.log('✅ Agent record created');

      // Log successful signup
      await logActivity('AGENT_SIGNUP_SUCCESS', authUserId, {
        email: agentData.email,
        company_name: agentData.company_name,
        source_type: agentData.source_type
      }, req.clientInfo.ipAddress, req.clientInfo.userAgent);

      // Return success response
      res.status(201).json({
        success: true,
        data: {
          message: 'Agent registration successful',
          user_id: authUserId,
          email: agentData.email,
          name: agentData.name,
          company_name: agentData.company_name,
          role: 'agent',
          status: 'active'
        },
        timestamp: new Date().toISOString()
      });

    } catch (transactionError) {
      console.error('Transaction failed, attempting rollback:', transactionError);
      
      // Rollback operations
      if (agentCreated) {
        try {
          await adminSupabase.from('agents').delete().eq('user_id', authUserId);
          console.log('🔄 Agent record rolled back');
        } catch (rollbackError) {
          console.error('Failed to rollback agent record:', rollbackError);
        }
      }

      if (profileCreated) {
        try {
          await adminSupabase.from('profiles').delete().eq('id', authUserId);
          console.log('🔄 Profile record rolled back');
        } catch (rollbackError) {
          console.error('Failed to rollback profile record:', rollbackError);
        }
      }

      if (authUserId) {
        try {
          await adminSupabase.auth.admin.deleteUser(authUserId);
          console.log('🔄 Auth user rolled back');
        } catch (rollbackError) {
          console.error('Failed to rollback auth user:', rollbackError);
        }
      }

      await logActivity('AGENT_SIGNUP_FAILED', authUserId, {
        error: transactionError.message,
        email: agentData.email
      }, req.clientInfo.ipAddress, req.clientInfo.userAgent);

      throw transactionError;
    }

  } catch (error) {
    handleError(res, error, 500);
  }
});

// Login Endpoint
app.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login request received');
    
    // Sanitize input data
    const sanitizedData = sanitizeObject(req.body);
    
    // Validate input data
    const validationResult = loginSchema.safeParse(sanitizedData);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors,
          timestamp: new Date().toISOString()
        }
      });
    }

    const { email, password, remember_me } = validationResult.data;

    // Attempt authentication with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      await logActivity('LOGIN_FAILED', null, {
        reason: authError.message,
        email: email
      }, req.clientInfo.ipAddress, req.clientInfo.userAgent);

      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
          timestamp: new Date().toISOString()
        }
      });
    }

    const userId = authData.user.id;

    // Get user profile and role information
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select(`
        id,
        name,
        email,
        role,
        status,
        department,
        phone,
        company_name,
        position,
        created_at,
        updated_at
      `)
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      await logActivity('LOGIN_FAILED', userId, {
        reason: 'Profile not found',
        email: email
      }, req.clientInfo.ipAddress, req.clientInfo.userAgent);

      return res.status(404).json({
        success: false,
        error: {
          message: 'User profile not found',
          code: 'PROFILE_NOT_FOUND',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Check if user is active
    if (profile.status !== 'active') {
      await logActivity('LOGIN_FAILED', userId, {
        reason: 'Account inactive',
        email: email,
        status: profile.status
      }, req.clientInfo.ipAddress, req.clientInfo.userAgent);

      return res.status(403).json({
        success: false,
        error: {
          message: 'Account is not active',
          code: 'ACCOUNT_INACTIVE',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Get additional role-specific data
    let roleSpecificData = {};
    if (profile.role === 'agent') {
      const { data: agentData } = await adminSupabase
        .from('agents')
        .select(`
          id,
          agency_name,
          business_address,
          business_phone,
          license_number,
          agency_code,
          iata_number,
          specializations,
          commission_structure,
          status as agent_status
        `)
        .eq('user_id', userId)
        .single();

      if (agentData) {
        roleSpecificData = {
          agent_id: agentData.id,
          agency_name: agentData.agency_name,
          business_address: agentData.business_address,
          business_phone: agentData.business_phone,
          license_number: agentData.license_number,
          agency_code: agentData.agency_code,
          iata_number: agentData.iata_number,
          specializations: agentData.specializations,
          commission_structure: agentData.commission_structure,
          agent_status: agentData.agent_status
        };
      }
    }

    // Generate session token (optional, for additional security)
    const sessionToken = jwt.sign(
      {
        userId: userId,
        email: profile.email,
        role: profile.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (remember_me ? 30 * 24 * 60 * 60 : 24 * 60 * 60) // 30 days or 1 day
      },
      process.env.JWT_SECRET || 'fallback-secret-key'
    );

    // Log successful login
    await logActivity('LOGIN_SUCCESS', userId, {
      email: profile.email,
      role: profile.role,
      remember_me: remember_me
    }, req.clientInfo.ipAddress, req.clientInfo.userAgent);

    // Return success response with user data and session
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          status: profile.status,
          department: profile.department,
          phone: profile.phone,
          company_name: profile.company_name,
          position: profile.position,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          ...roleSpecificData
        },
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_at: authData.session.expires_at,
          token_type: authData.session.token_type,
          session_token: sessionToken
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    handleError(res, error, 500);
  }
});

// Logout endpoint
app.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    handleError(res, error, 500);
  }
});

// Session validation endpoint
app.get('/validate-session', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'No authorization token provided',
          code: 'NO_TOKEN',
          timestamp: new Date().toISOString()
        }
      });
    }

    const token = authHeader.substring(7);
    
    // Verify the session with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid or expired session',
          code: 'INVALID_SESSION',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Get current user profile
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('id, name, email, role, status')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User profile not found',
          code: 'PROFILE_NOT_FOUND',
          timestamp: new Date().toISOString()
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          status: profile.status
        },
        session_valid: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    handleError(res, error, 500);
  }
});

// WhatsApp OTP Endpoints

/**
 * Send WhatsApp OTP
 * POST /auth/send-otp
 */
app.post('/send-otp', async (req, res) => {
  try {
    console.log('📱 WhatsApp OTP send request received');
    
    // Sanitize input data
    const sanitizedData = sanitizeObject(req.body);
    
    // Validate input data
    const validationResult = sendOTPSchema.safeParse(sanitizedData);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors,
          timestamp: new Date().toISOString()
        }
      });
    }

    const { phone, role } = validationResult.data;
    
    // Validate and format phone number
    let formattedPhone;
    try {
      formattedPhone = validatePhoneNumber(phone);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          message: error.message,
          code: 'INVALID_PHONE_FORMAT',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Check rate limiting (max 5 attempts per 60 minutes)
    const rateLimit = await checkRateLimit(formattedPhone, 5, 60);
    if (!rateLimit.canRetry) {
      return res.status(429).json({
        success: false,
        error: {
          message: `Too many attempts. Please try again later. Remaining attempts: ${rateLimit.remainingAttempts}`,
          code: 'RATE_LIMIT_EXCEEDED',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Get Meta configuration
    let metaConfig;
    try {
      metaConfig = await getMetaConfiguration();
    } catch (error) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'WhatsApp service not configured. Please contact administrator.',
          code: 'SERVICE_NOT_CONFIGURED',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Store OTP in database
    const otpRecord = await storeOTP(
      formattedPhone, 
      otp, 
      req.clientInfo.ipAddress, 
      req.clientInfo.userAgent
    );

    // Send WhatsApp OTP
    try {
      await sendWhatsAppOTP(formattedPhone, otp, metaConfig.business_name);
    } catch (error) {
      console.error('❌ WhatsApp OTP send failed:', error.message);
      
      // Mark OTP as expired since sending failed
      await adminSupabase
        .from('otp_logs')
        .update({ status: 'expired' })
        .eq('id', otpRecord.id);

      return res.status(503).json({
        success: false,
        error: {
          message: 'Failed to send WhatsApp OTP. Please try again.',
          code: 'WHATSAPP_SEND_FAILED',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Log successful OTP send
    await logActivity('OTP_SENT', null, {
      phone: formattedPhone,
      otp_id: otpRecord.id,
      role: role
    }, req.clientInfo.ipAddress, req.clientInfo.userAgent);

    res.status(200).json({
      success: true,
      data: {
        phone: formattedPhone,
        message: 'OTP sent successfully via WhatsApp',
        expires_in: 300, // 5 minutes in seconds
        attempts_remaining: rateLimit.remainingAttempts - 1
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    handleError(res, error, 500);
  }
});

/**
 * Verify WhatsApp OTP and create/login user
 * POST /auth/verify-otp
 */
app.post('/verify-otp', async (req, res) => {
  try {
    console.log('🔐 WhatsApp OTP verification request received');
    
    // Sanitize input data
    const sanitizedData = sanitizeObject(req.body);
    
    // Validate input data
    const validationResult = verifyOTPSchema.safeParse(sanitizedData);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors,
          timestamp: new Date().toISOString()
        }
      });
    }

    const { phone, otp, remember_me } = validationResult.data;
    
    // Validate and format phone number
    let formattedPhone;
    try {
      formattedPhone = validatePhoneNumber(phone);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          message: error.message,
          code: 'INVALID_PHONE_FORMAT',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Verify OTP
    let verificationResult;
    try {
      verificationResult = await verifyOTP(formattedPhone, otp);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          message: error.message,
          code: 'OTP_VERIFICATION_FAILED',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Check if user exists with this phone number
    const { data: existingUser, error: userError } = await adminSupabase
      .from('profiles')
      .select('id, email, name, role, status, phone')
      .eq('phone', formattedPhone)
      .single();

    let userId;
    let userProfile;

    if (existingUser && !userError) {
      // User exists, use existing user
      userId = existingUser.id;
      userProfile = existingUser;

      // Check if user is active
      if (existingUser.status !== 'active') {
        await logActivity('OTP_LOGIN_FAILED', userId, {
          reason: 'Account inactive',
          phone: formattedPhone
        }, req.clientInfo.ipAddress, req.clientInfo.userAgent);

        return res.status(403).json({
          success: false,
          error: {
            message: 'Account is not active',
            code: 'ACCOUNT_INACTIVE',
            timestamp: new Date().toISOString()
          }
        });
      }

    } else {
      // New user - create Supabase auth user and profile
      console.log('🆕 Creating new user for phone:', formattedPhone);
      
      // Generate a unique email for Supabase (since phone auth doesn't provide email)
      const generatedEmail = `whatsapp_${Date.now()}@temp.local`;
      const generatedPassword = crypto.randomBytes(32).toString('hex');

      // Create Supabase auth user
      const { data: authData, error: authError } = await adminSupabase.auth.signUp({
        email: generatedEmail,
        password: generatedPassword,
        data: {
          phone: formattedPhone,
          role: 'agent', // Default role for WhatsApp users
          source: 'whatsapp_otp'
        }
      });

      if (authError || !authData.user) {
        console.error('❌ Failed to create Supabase user:', authError);
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to create user account',
            code: 'USER_CREATION_FAILED',
            timestamp: new Date().toISOString()
          }
        });
      }

      userId = authData.user.id;

      // Create user profile
      const { data: newProfile, error: profileError } = await adminSupabase
        .from('profiles')
        .insert({
          id: userId,
          email: generatedEmail,
          name: `WhatsApp User`, // Default name, can be updated later
          phone: formattedPhone,
          role: 'agent', // Default role for WhatsApp users
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (profileError || !newProfile) {
        console.error('❌ Failed to create user profile:', profileError);
        
        // Rollback: delete the auth user
        await adminSupabase.auth.admin.deleteUser(userId);

        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to create user profile',
            code: 'PROFILE_CREATION_FAILED',
            timestamp: new Date().toISOString()
          }
        });
      }

      userProfile = newProfile;

      // Create agent record for new users
      const { error: agentError } = await adminSupabase
        .from('agents')
        .insert({
          user_id: userId,
          agency_name: 'Not Specified',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (agentError) {
        console.error('❌ Failed to create agent record:', agentError);
        // Continue anyway, agent record can be created later
      }
    }

    // Generate session token
    const sessionToken = jwt.sign(
      {
        userId: userId,
        phone: formattedPhone,
        role: userProfile.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (remember_me ? 30 * 24 * 60 * 60 : 24 * 60 * 60) // 30 days or 1 day
      },
      process.env.JWT_SECRET || 'fallback-secret-key'
    );

    // Log successful OTP login
    await logActivity('OTP_LOGIN_SUCCESS', userId, {
      phone: formattedPhone,
      role: userProfile.role,
      is_new_user: !existingUser
    }, req.clientInfo.ipAddress, req.clientInfo.userAgent);

    // Return success response
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: userProfile.id,
          name: userProfile.name,
          email: userProfile.email,
          phone: userProfile.phone,
          role: userProfile.role,
          status: userProfile.status,
          created_at: userProfile.created_at,
          updated_at: userProfile.updated_at
        },
        session: {
          access_token: existingUser ? 'generated_by_supabase' : 'new_user_token',
          refresh_token: existingUser ? 'generated_by_supabase' : 'new_user_refresh',
          expires_at: Math.floor(Date.now() / 1000) + (remember_me ? 30 * 24 * 60 * 60 : 24 * 60 * 60),
          token_type: 'bearer',
          session_token: sessionToken,
          is_new_user: !existingUser
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    handleError(res, error, 500);
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  handleError(res, error, 500);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Endpoint not found',
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString()
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Authentication Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Agent signup: http://localhost:${PORT}/signup/agent`);
  console.log(`🔑 Login: http://localhost:${PORT}/login`);
  console.log(`📱 WhatsApp OTP send: http://localhost:${PORT}/send-otp`);
  console.log(`🔐 WhatsApp OTP verify: http://localhost:${PORT}/verify-otp`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;