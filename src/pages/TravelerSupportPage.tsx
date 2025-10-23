
import React, { useState } from 'react';
import TravelerLayout from '@/components/traveler/TravelerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ChatWindow from '@/components/support/ChatWindow';
import { getUserConversations, getConversationMessages } from '@/data/mockSupportData';
import { ChatConversation } from '@/types/supportTypes';
import { MessageSquare, Plus, Headphones, Phone, Mail, User } from 'lucide-react';
import { useTravelerData } from '@/hooks/useTravelerData';
import { useIsMobile } from '@/hooks/use-mobile';

const TravelerSupportPage: React.FC = () => {
  const currentUserId = 'user-001';
  const { currentTrip } = useTravelerData();
  const isMobile = useIsMobile();
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);

  const userConversations = getUserConversations(currentUserId);
  const currentMessages = selectedConversation 
    ? getConversationMessages(selectedConversation.id)
    : [];

  const handleSendMessage = (content: string) => {
    console.log('Sending message:', content);
  };

  const getActiveConversationsCount = () => {
    return userConversations.filter(conv => conv.status === 'open').length;
  };

  const getUnreadCount = () => {
    return userConversations.reduce((total, conv) => total + conv.unreadCount, 0);
  };

  return (
    <TravelerLayout>
      <div className="p-3 sm:p-4 lg:p-6 h-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
              <Headphones className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Support Center
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Get help from our travel experts
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <MessageSquare className="h-3 w-3" />
                {getActiveConversationsCount()} Active
              </Badge>
              {getUnreadCount() > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {getUnreadCount()} Unread
                </Badge>
              )}
            </div>
            <Button 
              size={isMobile ? "sm" : "default"}
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              {isMobile ? 'New' : 'New Request'}
            </Button>
          </div>
        </div>

        <div className={`grid gap-4 sm:gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-4'} h-[calc(100vh-200px)]`}>
          {/* Emergency & Agent Info */}
          <div className={`space-y-3 sm:space-y-4 ${isMobile ? 'col-span-1' : 'xl:col-span-1'}`}>
            {/* Emergency Contact */}
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-destructive text-sm">
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                  Emergency
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="destructive" size="sm" className="w-full text-xs" asChild>
                  <a href="tel:+1234567890">
                    <Phone className="h-3 w-3 mr-2" />
                    Call Now
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Current Trip Agent */}
            {currentTrip && (
              <Card>
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    Your Agent
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2 sm:space-y-3">
                  <div>
                    <h4 className="font-medium text-xs sm:text-sm">{currentTrip.agentDetails.name}</h4>
                    <p className="text-xs text-muted-foreground">{currentTrip.agentDetails.company}</p>
                  </div>
                  <div className="flex flex-col gap-1 sm:gap-2">
                    <Button variant="outline" size="sm" className="text-xs" asChild>
                      <a href={`tel:${currentTrip.agentDetails.phone}`}>
                        <Phone className="h-3 w-3 mr-2" />
                        Call
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs" asChild>
                      <a href={`mailto:${currentTrip.agentDetails.email}`}>
                        <Mail className="h-3 w-3 mr-2" />
                        Email
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm">Quick Help</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-1 sm:space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  <MessageSquare className="h-3 w-3 mr-2" />
                  Trip Changes
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  <MessageSquare className="h-3 w-3 mr-2" />
                  Payment Help
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  <MessageSquare className="h-3 w-3 mr-2" />
                  Documents
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className={`${isMobile ? 'col-span-1' : 'xl:col-span-3'}`}>
            <ChatWindow
              conversation={userConversations[0] || null}
              messages={currentMessages}
              currentUserId={currentUserId}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </div>
    </TravelerLayout>
  );
};

export default TravelerSupportPage;
