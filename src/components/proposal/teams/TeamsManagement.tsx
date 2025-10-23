
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Plus, Trash2, Mail, Phone, UserCheck } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  avatar?: string;
  responsibilities: string[];
}

interface TeamsManagementProps {
  onTeamChange?: (team: TeamMember[]) => void;
}

const defaultTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    role: 'Tour Manager',
    email: 'sarah@travelagency.com',
    phone: '+1 (555) 123-4567',
    responsibilities: ['Itinerary Planning', 'Customer Relations']
  },
  {
    id: '2',
    name: 'Mike Chen',
    role: 'Pricing Specialist',
    email: 'mike@travelagency.com',
    phone: '+1 (555) 234-5678',
    responsibilities: ['Cost Analysis', 'Vendor Negotiations']
  }
];

const roles = [
  'Tour Manager',
  'Pricing Specialist',
  'Customer Relations',
  'Operations Coordinator',
  'Sales Representative'
];

const responsibilities = [
  'Itinerary Planning',
  'Customer Relations',
  'Cost Analysis',
  'Vendor Negotiations',
  'Transportation',
  'Accommodation',
  'Activities Coordination',
  'Emergency Support'
];

export const TeamsManagement: React.FC<TeamsManagementProps> = ({ onTeamChange }) => {
  const [team, setTeam] = useState<TeamMember[]>(defaultTeamMembers);
  const [newMember, setNewMember] = useState<Partial<TeamMember>>({
    responsibilities: []
  });
  const [isAddingMember, setIsAddingMember] = useState(false);

  const handleAddMember = () => {
    if (newMember.name && newMember.role && newMember.email) {
      const member: TeamMember = {
        id: Date.now().toString(),
        name: newMember.name,
        role: newMember.role,
        email: newMember.email,
        phone: newMember.phone,
        responsibilities: newMember.responsibilities || []
      };

      const updatedTeam = [...team, member];
      setTeam(updatedTeam);
      onTeamChange?.(updatedTeam);
      setNewMember({ responsibilities: [] });
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = (id: string) => {
    const updatedTeam = team.filter(member => member.id !== id);
    setTeam(updatedTeam);
    onTeamChange?.(updatedTeam);
  };

  const handleResponsibilityToggle = (responsibility: string) => {
    const current = newMember.responsibilities || [];
    const updated = current.includes(responsibility)
      ? current.filter(r => r !== responsibility)
      : [...current, responsibility];
    
    setNewMember({ ...newMember, responsibilities: updated });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-semibold">Team Management</h3>
          <Badge variant="outline">{team.length} members</Badge>
        </div>
        <Button 
          onClick={() => setIsAddingMember(true)}
          className="gap-2"
          disabled={isAddingMember}
        >
          <Plus className="h-4 w-4" />
          Add Member
        </Button>
      </div>

      {/* Current Team Members */}
      <div className="grid gap-4">
        {team.map((member) => (
          <Card key={member.id} className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-lg">{member.name}</h4>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        {member.role}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {member.phone}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Responsibilities:</p>
                      <div className="flex flex-wrap gap-1">
                        {member.responsibilities.map((resp, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {resp}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Member Form */}
      {isAddingMember && (
        <Card className="border-2 border-dashed border-blue-300 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Add New Team Member
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={newMember.name || ''}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select onValueChange={(value) => setNewMember({ ...newMember, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newMember.email || ''}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  value={newMember.phone || ''}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            
            <div>
              <Label>Responsibilities</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {responsibilities.map((responsibility) => (
                  <Button
                    key={responsibility}
                    variant={(newMember.responsibilities || []).includes(responsibility) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleResponsibilityToggle(responsibility)}
                    className="justify-start text-xs"
                  >
                    {responsibility}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddMember} className="flex-1">
                Add Member
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddingMember(false);
                  setNewMember({ responsibilities: [] });
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
