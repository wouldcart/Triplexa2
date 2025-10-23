import React from 'react';
import { ChatMessage as ChatMessageType } from '@/types/supportTypes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { User, UserCheck, Shield, Settings } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
  isOwn: boolean;
  showAvatar?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isOwn, 
  showAvatar = true 
}) => {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-3 w-3" />;
      case 'staff':
        return <Settings className="h-3 w-3" />;
      case 'agent':
        return <UserCheck className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'staff':
        return 'secondary';
      case 'agent':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <div className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isOwn && showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face`} />
          <AvatarFallback>{message.senderName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-[70%] ${isOwn ? 'order-first' : ''}`}>
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground">
              {message.senderName}
            </span>
            <Badge 
              variant={getRoleBadgeVariant(message.senderRole)} 
              className="h-4 text-xs px-1 py-0 flex items-center gap-1"
            >
              {getRoleIcon(message.senderRole)}
              {message.senderRole}
            </Badge>
          </div>
        )}
        
        <div
          className={`rounded-lg px-3 py-2 ${
            isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        
        <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span>
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </span>
          {isOwn && (
            <span className={message.isRead ? 'text-blue-500' : 'text-muted-foreground'}>
              {message.isRead ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>

      {isOwn && showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face`} />
          <AvatarFallback>JT</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;