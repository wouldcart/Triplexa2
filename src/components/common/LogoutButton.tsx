import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = 'ghost',
  size = 'default',
  className = '',
  showIcon = true,
  showText = true
}) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`text-destructive hover:bg-destructive/10 ${className}`}
      onClick={handleLogout}
    >
      {showIcon && <LogOut className={showText ? "mr-2 h-4 w-4" : "h-4 w-4"} />}
      {showText && "Logout"}
    </Button>
  );
};