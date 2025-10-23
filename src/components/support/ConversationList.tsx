import React from 'react';
import { ChatConversation } from '@/types/supportTypes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { Circle, User, UserCheck, Shield, Settings } from 'lucide-react';

interface ConversationListProps {
  conversations: ChatConversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversation: ChatConversation) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-500';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-yellow-500';
      default:
        return 'text-green-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-green-500';
      case 'pending':
        return 'text-yellow-500';
      case 'closed':
        return 'text-gray-500';
      default:
        return 'text-blue-500';
    }
  };

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

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <Card
          key={conversation.id}
          className={`cursor-pointer transition-colors hover:bg-muted/50 ${
            selectedConversationId === conversation.id ? 'border-primary bg-primary/5' : ''
          }`}
          onClick={() => onSelectConversation(conversation)}
        >
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={conversation.assignedAgent?.avatar} />
                  <AvatarFallback>
                    {conversation.assignedAgent?.name.split(' ').map(n => n[0]).join('') || 'S'}
                  </AvatarFallback>
                </Avatar>
                <Circle 
                  className={`absolute -bottom-1 -right-1 h-3 w-3 ${getStatusColor(conversation.status)} fill-current`} 
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-foreground truncate">
                      {conversation.title}
                    </h4>
                    {conversation.assignedAgent && (
                      <div className="flex items-center gap-1 mt-1">
                        {getRoleIcon(conversation.assignedAgent.role)}
                        <span className="text-xs text-muted-foreground">
                          {conversation.assignedAgent.name}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conversation.lastActivity), { addSuffix: true })}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="h-4 min-w-4 text-xs px-1 py-0">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {conversation.lastMessage && (
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {conversation.lastMessage.content}
                  </p>
                )}
                
                <div className="flex items-center gap-2 mt-2">
                  <Badge 
                    variant="outline" 
                    className={`h-4 text-xs px-1 py-0 ${getPriorityColor(conversation.priority)}`}
                  >
                    {conversation.priority}
                  </Badge>
                  <Badge 
                    variant="secondary" 
                    className={`h-4 text-xs px-1 py-0 ${getStatusColor(conversation.status)}`}
                  >
                    {conversation.status}
                  </Badge>
                  {conversation.tags && conversation.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="h-4 text-xs px-1 py-0">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ConversationList;