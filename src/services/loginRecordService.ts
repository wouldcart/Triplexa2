
export interface LoginRecord {
  id: string;
  staffId: string;
  staffName: string;
  loginTime: string;
  logoutTime?: string;
  duration?: number; // in minutes
  status: 'active' | 'logged-out';
  ipAddress?: string;
  userAgent?: string;
}

export interface ActiveSession {
  staffId: string;
  staffName: string;
  loginTime: string;
  lastActivity: string;
  status: 'active';
}

const LOGIN_RECORDS_KEY = 'staff_login_records';
const ACTIVE_SESSIONS_KEY = 'active_staff_sessions';

export const getLoginRecords = (): LoginRecord[] => {
  try {
    const stored = localStorage.getItem(LOGIN_RECORDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading login records:', error);
    return [];
  }
};

export const getActiveStaffSessions = (): ActiveSession[] => {
  try {
    const stored = localStorage.getItem(ACTIVE_SESSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading active sessions:', error);
    return [];
  }
};

export const recordStaffLogin = (staffId: string, staffName: string): string => {
  try {
    const loginId = `login_${Date.now()}_${staffId}`;
    const loginTime = new Date().toISOString();
    
    // Create login record
    const loginRecord: LoginRecord = {
      id: loginId,
      staffId,
      staffName,
      loginTime,
      status: 'active',
      ipAddress: 'localhost', // In real app, get actual IP
      userAgent: navigator.userAgent
    };
    
    // Create active session
    const activeSession: ActiveSession = {
      staffId,
      staffName,
      loginTime,
      lastActivity: loginTime,
      status: 'active'
    };
    
    // Store login record
    const existingRecords = getLoginRecords();
    existingRecords.push(loginRecord);
    localStorage.setItem(LOGIN_RECORDS_KEY, JSON.stringify(existingRecords));
    
    // Store active session
    const activeSessions = getActiveStaffSessions();
    const existingSessionIndex = activeSessions.findIndex(s => s.staffId === staffId);
    
    if (existingSessionIndex !== -1) {
      activeSessions[existingSessionIndex] = activeSession;
    } else {
      activeSessions.push(activeSession);
    }
    
    localStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(activeSessions));
    
    console.log(`Login recorded for ${staffName} at ${loginTime}`);
    return loginId;
  } catch (error) {
    console.error('Error recording staff login:', error);
    return '';
  }
};

export const recordStaffLogout = (staffId: string): void => {
  try {
    const logoutTime = new Date().toISOString();
    
    // Update login record
    const loginRecords = getLoginRecords();
    const activeRecord = loginRecords.find(
      record => record.staffId === staffId && record.status === 'active'
    );
    
    if (activeRecord) {
      activeRecord.logoutTime = logoutTime;
      activeRecord.status = 'logged-out';
      activeRecord.duration = Math.floor(
        (new Date(logoutTime).getTime() - new Date(activeRecord.loginTime).getTime()) / (1000 * 60)
      );
      localStorage.setItem(LOGIN_RECORDS_KEY, JSON.stringify(loginRecords));
    }
    
    // Remove from active sessions
    const activeSessions = getActiveStaffSessions();
    const updatedSessions = activeSessions.filter(s => s.staffId !== staffId);
    localStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(updatedSessions));
    
    console.log(`Logout recorded for staff ${staffId} at ${logoutTime}`);
  } catch (error) {
    console.error('Error recording staff logout:', error);
  }
};

export const updateStaffActivity = (staffId: string): void => {
  try {
    const activeSessions = getActiveStaffSessions();
    const sessionIndex = activeSessions.findIndex(s => s.staffId === staffId);
    
    if (sessionIndex !== -1) {
      activeSessions[sessionIndex].lastActivity = new Date().toISOString();
      localStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(activeSessions));
    }
  } catch (error) {
    console.error('Error updating staff activity:', error);
  }
};

export const getStaffLoginHistory = (staffId: string, days: number = 30): LoginRecord[] => {
  const records = getLoginRecords();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return records.filter(
    record => record.staffId === staffId && 
    new Date(record.loginTime) >= cutoffDate
  ).sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime());
};

export const getTotalWorkingHours = (staffId: string, date: string): number => {
  const records = getLoginRecords();
  const targetDate = new Date(date).toDateString();
  
  const dayRecords = records.filter(record => {
    const recordDate = new Date(record.loginTime).toDateString();
    return record.staffId === staffId && recordDate === targetDate && record.duration;
  });
  
  return dayRecords.reduce((total, record) => total + (record.duration || 0), 0);
};

export const isStaffCurrentlyActive = (staffId: string): boolean => {
  const activeSessions = getActiveStaffSessions();
  return activeSessions.some(session => session.staffId === staffId);
};
