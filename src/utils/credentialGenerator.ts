
export const generateUsernameFromEmail = (email: string): string => {
  const [localPart] = email.split('@');
  return localPart.toLowerCase().replace(/[^a-z0-9]/g, '.');
};

export const generateUsernameFromName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(' ')
    .filter(part => part.length > 0)
    .join('.');
};

export const generateSecurePassword = (length: number = 12): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  let password = '';
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

export const validatePasswordStrength = (password: string): {
  score: number;
  feedback: string[];
  isValid: boolean;
} => {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password must be at least 8 characters long');
  }
  
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include at least one uppercase letter');
  }
  
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include at least one lowercase letter');
  }
  
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include at least one number');
  }
  
  if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include at least one special character');
  }
  
  const isValid = score >= 4;
  
  return { score, feedback, isValid };
};

export const checkUsernameUniqueness = (username: string, excludeId?: string): boolean => {
  // This would typically check against a database
  // For now, we'll check against the existing auth data
  try {
    const existingUsers = JSON.parse(localStorage.getItem('auth_users') || '[]');
    return !existingUsers.some((user: any) => 
      user.username === username && user.id !== excludeId
    );
  } catch {
    return true;
  }
};
