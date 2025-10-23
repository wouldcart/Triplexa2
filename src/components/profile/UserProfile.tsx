
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { useAccessControl } from '@/hooks/use-access-control';
import { 
  User, Mail, Phone, MapPin, Calendar, Clock, 
  Building, Shield, Award, Users, Edit, Save, X 
} from 'lucide-react';

const UserProfile: React.FC = () => {
  const { currentUser } = useApp();
  const { canPerformAction, isAgent } = useAccessControl();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(currentUser);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  const handleSave = () => {
    // In a real app, this would save to backend
    console.log('Saving profile data:', editData);
    setIsEditing(false);
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully",
    });
  };

  const canEdit = canPerformAction('edit-profile', currentUser.id);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-purple-100 text-purple-800';
      case 'staff': return 'bg-blue-100 text-blue-800';
      case 'agent': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRole = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {currentUser.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{currentUser.name}</h1>
                <p className="text-muted-foreground">{currentUser.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge className={getRoleColor(currentUser.role)}>
                    {formatRole(currentUser.role)}
                  </Badge>
                  {currentUser.department && (
                    <Badge variant="outline">{currentUser.department}</Badge>
                  )}
                  <Badge variant={currentUser.status === 'active' ? 'default' : 'secondary'}>
                    {currentUser.status}
                  </Badge>
                </div>
              </div>
            </div>
            {canEdit && (
              <Button
                variant={isEditing ? "outline" : "default"}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="work">Work Details</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          {isAgent && <TabsTrigger value="company">Company Info</TabsTrigger>}
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  {isEditing ? (
                    <Input
                      value={editData?.name || ''}
                      onChange={(e) => setEditData({...editData!, name: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{currentUser.name}</p>
                  )}
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  {isEditing ? (
                    <Input
                      value={editData?.phone || ''}
                      onChange={(e) => setEditData({...editData!, phone: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{currentUser.phone}</p>
                  )}
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <p className="text-sm text-muted-foreground">
                    {currentUser.personalInfo?.dateOfBirth || 'Not provided'}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label>Address</Label>
                <p className="text-sm text-muted-foreground">
                  {currentUser.personalInfo?.address || 'Not provided'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nationality</Label>
                  <p className="text-sm text-muted-foreground">
                    {currentUser.personalInfo?.nationality || 'Not provided'}
                  </p>
                </div>
                <div>
                  <Label>Languages</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentUser.personalInfo?.languages?.map((lang) => (
                      <Badge key={lang} variant="outline" className="text-xs">
                        {lang}
                      </Badge>
                    )) || <span className="text-sm text-muted-foreground">Not provided</span>}
                  </div>
                </div>
              </div>

              {currentUser.emergencyContact && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-base font-medium">Emergency Contact</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <Label className="text-sm">Name</Label>
                        <p className="text-sm text-muted-foreground">
                          {currentUser.emergencyContact.name}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm">Phone</Label>
                        <p className="text-sm text-muted-foreground">
                          {currentUser.emergencyContact.phone}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm">Relationship</Label>
                        <p className="text-sm text-muted-foreground">
                          {currentUser.emergencyContact.relationship}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Work Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Employee ID</Label>
                  <p className="text-sm text-muted-foreground">
                    {currentUser.employeeId || 'Not assigned'}
                  </p>
                </div>
                <div>
                  <Label>Position</Label>
                  <p className="text-sm text-muted-foreground">
                    {currentUser.position || 'Not specified'}
                  </p>
                </div>
                <div>
                  <Label>Department</Label>
                  <p className="text-sm text-muted-foreground">
                    {currentUser.department || 'Not assigned'}
                  </p>
                </div>
                <div>
                  <Label>Work Location</Label>
                  <p className="text-sm text-muted-foreground">
                    {currentUser.workLocation || 'Not specified'}
                  </p>
                </div>
                <div>
                  <Label>Join Date</Label>
                  <p className="text-sm text-muted-foreground">{currentUser.joinDate}</p>
                </div>
                <div>
                  <Label>Last Login</Label>
                  <p className="text-sm text-muted-foreground">
                    {currentUser.lastLogin ? new Date(currentUser.lastLogin).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>

              {currentUser.skills && currentUser.skills.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <Label>Skills</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {currentUser.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {currentUser.certifications && currentUser.certifications.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <Label>Certifications</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {currentUser.certifications.map((cert) => (
                        <Badge key={cert} variant="outline" className="flex items-center">
                          <Award className="h-3 w-3 mr-1" />
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {currentUser.workSchedule && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-base font-medium">Work Schedule</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label className="text-sm">Working Days</Label>
                        <p className="text-sm text-muted-foreground">
                          {currentUser.workSchedule.workingDays.join(', ')}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm">Working Hours</Label>
                        <p className="text-sm text-muted-foreground">
                          {currentUser.workSchedule.startTime} - {currentUser.workSchedule.endTime}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Permissions & Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Role Permissions</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentUser.permissions.includes('*') ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        All Permissions
                      </Badge>
                    ) : (
                      currentUser.permissions.map((permission) => (
                        <Badge key={permission} variant="outline">
                          {permission}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isAgent && (
          <TabsContent value="company" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentUser.companyInfo && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Company Name</Label>
                      <p className="text-sm text-muted-foreground">
                        {currentUser.companyInfo.companyName}
                      </p>
                    </div>
                    <div>
                      <Label>Registration Number</Label>
                      <p className="text-sm text-muted-foreground">
                        {currentUser.companyInfo.registrationNumber}
                      </p>
                    </div>
                    <div>
                      <Label>Business Type</Label>
                      <p className="text-sm text-muted-foreground">
                        {currentUser.companyInfo.businessType}
                      </p>
                    </div>
                    <div>
                      <Label>Contract Period</Label>
                      <p className="text-sm text-muted-foreground">
                        {currentUser.companyInfo.contractStartDate} - {currentUser.companyInfo.contractEndDate}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {isEditing && (
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
