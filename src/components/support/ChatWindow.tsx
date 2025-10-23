import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType, ChatConversation } from '@/types/supportTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ChatMessage from './ChatMessage';
import { Send, Paperclip, Phone, Video, MoreVertical, Circle, User } from 'lucide-react';

interface ChatWindowProps {
  conversation: ChatConversation;
  messages: ChatMessageType[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  currentUserId,
  onSendMessage
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
      inputRef.current?.focus();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 text-red-700 bg-red-50';
      case 'high':
        return 'border-orange-500 text-orange-700 bg-orange-50';
      case 'medium':
        return 'border-yellow-500 text-yellow-700 bg-yellow-50';
      default:
        return 'border-green-500 text-green-700 bg-green-50';
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

  return (
    <Card className="h-full flex flex-col shadow-lg">
      {/* Chat Header */}
      <CardHeader className="border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-12 w-12 ring-2 ring-primary/30 shadow-lg">
                <AvatarImage src={conversation.assignedAgent?.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-sm">
                  {conversation.assignedAgent?.name.split(' ').map(n => n[0]).join('') || 'S'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Live Support Chat
                </CardTitle>
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {conversation.title}
              </p>
              <div className="flex items-center gap-3">
                {conversation.assignedAgent && (
                  <span className="text-sm text-foreground font-medium flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {conversation.assignedAgent.name}
                  </span>
                )}
                <Badge 
                  variant="outline" 
                  className={`h-6 text-xs px-3 py-1 font-semibold border-2 ${getPriorityColor(conversation.priority)}`}
                >
                  {conversation.priority.toUpperCase()}
                </Badge>
                <Badge variant="secondary" className={`h-6 text-xs px-3 py-1 font-semibold ${getStatusColor(conversation.status)} bg-opacity-20`}>
                  ● {conversation.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="hover:bg-primary/10">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-primary/10">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-primary/10">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 overflow-y-auto p-0">
        <div className="p-4 space-y-4 min-h-full bg-gradient-to-b from-background to-muted/20">
          {/* Welcome Message */}
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm text-primary font-medium">
              <Circle className="h-2 w-2 fill-current" />
              Support chat started - We're here to help!
            </div>
          </div>
          
          {messages.map((message, index) => {
            const isOwn = message.senderId === currentUserId;
            const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
            
            return (
              <ChatMessage
                key={message.id}
                message={message}
                isOwn={isOwn}
                showAvatar={showAvatar}
              />
            );
          })}
          
          {/* Typing indicator placeholder */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar className="h-6 w-6">
              <AvatarImage src={conversation.assignedAgent?.avatar} />
              <AvatarFallback className="text-xs">
                {conversation.assignedAgent?.name.split(' ').map(n => n[0]).join('') || 'S'}
              </AvatarFallback>
            </Avatar>
            <span className="italic">{conversation.assignedAgent?.name} is online</span>
          </div>
          
          <div ref={messagesEndRef} />
        </div>
      </CardContent>

      {/* Message Input */}
      <div className="border-t border-border p-4 bg-background">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="sm" className="hover:bg-primary/10">
            <Paperclip className="h-4 w-4" />
          </Button>
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="pr-12 bg-muted/50 border-muted-foreground/20 focus:border-primary"
            />
            <Button 
              type="submit" 
              size="sm" 
              disabled={!newMessage.trim()}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </form>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>Press Enter to send</span>
          <span>Avg. response time: 2-3 minutes</span>
        </div>
      </div>
    </Card>
  );
};

export default ChatWindow;