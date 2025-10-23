
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar, 
  Clock,
  Send,
  Plus,
  Bell
} from 'lucide-react';
import { Query } from '@/types/query';
import { format } from 'date-fns';

interface CommunicationHubProps {
  query: Query;
  onAddNote: (note: string) => void;
  onScheduleFollowUp: (date: string, type: string) => void;
}

const CommunicationHub: React.FC<CommunicationHubProps> = ({
  query,
  onAddNote,
  onScheduleFollowUp
}) => {
  const [newNote, setNewNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpType, setFollowUpType] = useState('call');

  // Mock communication history
  const communicationHistory = [
    {
      id: '1',
      type: 'email',
      direction: 'outbound',
      subject: 'Welcome to TripOEx - Your Travel Enquiry',
      timestamp: '2024-01-20T10:30:00Z',
      status: 'sent',
      from: 'Sarah Sales',
      content: 'Thank you for your travel enquiry. We are processing your request...'
    },
    {
      id: '2',
      type: 'note',
      direction: 'internal',
      subject: 'Client Requirements Discussion',
      timestamp: '2024-01-19T15:45:00Z',
      status: 'completed',
      from: 'Mike Marketing',
      content: 'Discussed luxury accommodation preferences. Client prefers 5-star resorts with spa facilities.'
    },
    {
      id: '3',
      type: 'call',
      direction: 'inbound',
      subject: 'Follow-up call completed',
      timestamp: '2024-01-18T14:20:00Z',
      status: 'completed',
      from: 'Operations Staff',
      content: 'Duration: 15 minutes. Discussed itinerary options and budget adjustments.'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      case 'note': return <MessageSquare className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-800';
      case 'call': return 'bg-green-100 text-green-800';
      case 'note': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote(newNote);
      setNewNote('');
    }
  };

  const handleScheduleFollowUp = () => {
    if (followUpDate) {
      onScheduleFollowUp(followUpDate, followUpType);
      setFollowUpDate('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Communication Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Communication Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {communicationHistory.map((comm) => (
              <div key={comm.id} className="flex gap-3 p-3 rounded-lg border border-gray-100">
                <div className={`p-2 rounded-full ${getTypeColor(comm.type)}`}>
                  {getTypeIcon(comm.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{comm.subject}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getTypeColor(comm.type)}>
                        {comm.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comm.timestamp), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{comm.content}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-xs">
                        {comm.from.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span>{comm.from}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Internal Note */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Internal Note
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Add internal note or communication summary..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-end">
            <Button onClick={handleAddNote} disabled={!newNote.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Follow-up */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Schedule Follow-up
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Follow-up Date & Time</label>
              <input
                type="datetime-local"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full p-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Follow-up Type</label>
              <select
                value={followUpType}
                onChange={(e) => setFollowUpType(e.target.value)}
                className="w-full p-2 border rounded-md text-sm"
              >
                <option value="call">Phone Call</option>
                <option value="email">Email</option>
                <option value="meeting">Meeting</option>
                <option value="proposal">Send Proposal</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleScheduleFollowUp} disabled={!followUpDate}>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Follow-up
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Communication Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Call Client
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Send Email
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule Call
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunicationHub;
