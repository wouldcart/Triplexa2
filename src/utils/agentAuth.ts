import { generateUsernameFromEmail, generateSecurePassword } from './credentialGenerator';

export interface AgentCredentials {
  agentId: string;
  username: string;
  password: string;
  email: string;
  forcePasswordChange: boolean;
  isTemporary: boolean;
  createdAt: string;
  createdBy: {
    staffId: string;
    staffName: string;
  };
}

export interface LoginActivity {
  lastLogin: string | null;
  loginCount: number;
  failedAttempts: number;
  isLocked: boolean;
  lockExpiry: string | null;
  loginHistory: {
    timestamp: string;
    success: boolean;
    ip?: string;
    userAgent?: string;
  }[];
}

// Store agent credentials securely
export const storeAgentCredentials = (credentials: AgentCredentials): void => {
  try {
    const existingCredentials = getStoredAgentCredentials();
    const updatedCredentials = existingCredentials.filter(cred => cred.agentId !== credentials.agentId);
    updatedCredentials.push(credentials);
    
    localStorage.setItem('agent_credentials', JSON.stringify(updatedCredentials));
    console.log('Agent credentials stored successfully for agent:', credentials.agentId);
  } catch (error) {
    console.error('Error storing agent credentials:', error);
  }
};

// Retrieve stored agent credentials
export const getStoredAgentCredentials = (): AgentCredentials[] => {
  try {
    const stored = localStorage.getItem('agent_credentials');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error retrieving agent credentials:', error);
    return [];
  }
};

// Authenticate agent login
export const authenticateAgent = (username: string, password: string): { success: boolean; agent?: any; message?: string } => {
  try {
    const credentials = getStoredAgentCredentials();
    const agentCredential = credentials.find(cred => 
      cred.username === username || cred.email === username
    );

    if (!agentCredential) {
      return { success: false, message: 'Invalid username or email' };
    }

    // Enforce password change: block login if flagged
    if (agentCredential.forcePasswordChange || agentCredential.isTemporary) {
      return { 
        success: false, 
        message: 'Password change required. Please use the invite link or reset your password.' 
      };
    }

    // Check if account is locked
    const loginActivity = getAgentLoginActivity(agentCredential.agentId);
    if (loginActivity.isLocked && loginActivity.lockExpiry) {
      const lockExpiry = new Date(loginActivity.lockExpiry);
      if (new Date() < lockExpiry) {
        return { success: false, message: 'Account is temporarily locked. Please try again later.' };
      } else {
        // Unlock account if lock period has expired
        unlockAgentAccount(agentCredential.agentId);
      }
    }

    // Verify password
    if (agentCredential.password !== password) {
      recordLoginAttempt(agentCredential.agentId, false);
      return { success: false, message: 'Invalid password' };
    }

    // Get agent details
    const agents = JSON.parse(localStorage.getItem('agents') || '[]');
    const agent = agents.find((a: any) => a.id.toString() === agentCredential.agentId);

    if (!agent || agent.status !== 'active') {
      return { success: false, message: 'Agent account is not active' };
    }

    // Record successful login
    recordLoginAttempt(agentCredential.agentId, true);

    return { 
      success: true, 
      agent: {
        ...agent,
        requiresPasswordChange: agentCredential.forcePasswordChange,
        isTemporaryPassword: agentCredential.isTemporary
      }
    };
  } catch (error) {
    console.error('Error authenticating agent:', error);
    return { success: false, message: 'Authentication error occurred' };
  }
};

// Track agent login activity
export const getAgentLoginActivity = (agentId: string): LoginActivity => {
  try {
    const stored = localStorage.getItem(`agent_login_activity_${agentId}`);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Return default activity if none exists
    return {
      lastLogin: null,
      loginCount: 0,
      failedAttempts: 0,
      isLocked: false,
      lockExpiry: null,
      loginHistory: []
    };
  } catch (error) {
    console.error('Error getting agent login activity:', error);
    return {
      lastLogin: null,
      loginCount: 0,
      failedAttempts: 0,
      isLocked: false,
      lockExpiry: null,
      loginHistory: []
    };
  }
};

// Record login attempt
export const recordLoginAttempt = (agentId: string, success: boolean): void => {
  try {
    const activity = getAgentLoginActivity(agentId);
    const timestamp = new Date().toISOString();
    
    // Add to login history
    activity.loginHistory.push({
      timestamp,
      success,
      // In a real app, you would capture actual IP and user agent
      ip: '127.0.0.1',
      userAgent: navigator.userAgent
    });
    
    // Keep only last 50 login attempts
    if (activity.loginHistory.length > 50) {
      activity.loginHistory = activity.loginHistory.slice(-50);
    }
    
    if (success) {
      activity.lastLogin = timestamp;
      activity.loginCount += 1;
      activity.failedAttempts = 0; // Reset failed attempts on successful login
      activity.isLocked = false;
      activity.lockExpiry = null;
    } else {
      activity.failedAttempts += 1;
      
      // Lock account after 5 failed attempts
      if (activity.failedAttempts >= 5) {
        activity.isLocked = true;
        // Lock for 30 minutes
        activity.lockExpiry = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      }
    }
    
    localStorage.setItem(`agent_login_activity_${agentId}`, JSON.stringify(activity));
    console.log(`Login attempt recorded for agent ${agentId}:`, { success, failedAttempts: activity.failedAttempts });
  } catch (error) {
    console.error('Error recording login attempt:', error);
  }
};

// Unlock agent account
export const unlockAgentAccount = (agentId: string): void => {
  try {
    const activity = getAgentLoginActivity(agentId);
    activity.isLocked = false;
    activity.lockExpiry = null;
    activity.failedAttempts = 0;
    
    localStorage.setItem(`agent_login_activity_${agentId}`, JSON.stringify(activity));
    console.log(`Agent account unlocked: ${agentId}`);
  } catch (error) {
    console.error('Error unlocking agent account:', error);
  }
};

// Generate and send password reset email
export const sendPasswordResetEmail = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    const credentials = getStoredAgentCredentials();
    const agentCredential = credentials.find(cred => cred.email === email);
    
    if (!agentCredential) {
      return { success: false, message: 'Email address not found' };
    }
    
    // Generate new temporary password
    const tempPassword = generateSecurePassword(10);
    
    // Update credentials with temporary password
    const updatedCredential = {
      ...agentCredential,
      password: tempPassword,
      isTemporary: true,
      forcePasswordChange: true
    };
    
    storeAgentCredentials(updatedCredential);
    
    // In a real app, this would send an actual email
    console.log(`Password reset email sent to: ${email}`);
    console.log(`Temporary password: ${tempPassword}`);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { 
      success: true, 
      message: 'Password reset email sent successfully. Please check your inbox for the temporary password.' 
    };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, message: 'Failed to send password reset email' };
  }
};

// Send initial credentials email
export const sendCredentialsEmail = async (agentCredentials: AgentCredentials): Promise<{ success: boolean; message: string }> => {
  try {
    // In a real app, this would send an actual email
    console.log(`Credentials email sent to: ${agentCredentials.email}`);
    console.log(`Username: ${agentCredentials.username}`);
    console.log(`Password: ${agentCredentials.password}`);
    console.log(`Force password change: ${agentCredentials.forcePasswordChange}`);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { 
      success: true, 
      message: 'Login credentials sent successfully to agent\'s email address.' 
    };
  } catch (error) {
    console.error('Error sending credentials email:', error);
    return { success: false, message: 'Failed to send credentials email' };
  }
};

// Change agent password
export const changeAgentPassword = (agentId: string, oldPassword: string, newPassword: string): { success: boolean; message: string } => {
  try {
    const credentials = getStoredAgentCredentials();
    const agentCredential = credentials.find(cred => cred.agentId === agentId);
    
    if (!agentCredential) {
      return { success: false, message: 'Agent credentials not found' };
    }
    
    if (agentCredential.password !== oldPassword) {
      return { success: false, message: 'Current password is incorrect' };
    }
    
    // Update password
    const updatedCredential = {
      ...agentCredential,
      password: newPassword,
      forcePasswordChange: false,
      isTemporary: false
    };
    
    storeAgentCredentials(updatedCredential);
    
    return { success: true, message: 'Password changed successfully' };
  } catch (error) {
    console.error('Error changing agent password:', error);
    return { success: false, message: 'Failed to change password' };
  }
};
