import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, Mail, Phone, MapPin, Building2, Calendar, Edit3, 
  Camera, Save, X, Star, TrendingUp, DollarSign, Award
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import PageLayout from '@/components/layout/PageLayout';
import CompanyLogoUpload from '@/components/inventory/packages/components/CompanyLogoUpload';
import { AgentManagementService } from '@/services/agentManagementService';

const AgentProfile: React.FC = () => {
  const { currentUser } = useApp();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    companyName: 'Elite Travel Solutions',
    address: '123 Business District, Downtown',
    city: 'Mumbai',
    country: 'India',
    specialization: 'Luxury Travel',
    experience: '5 years',
    gstNumber: 'GST123456789',
    bio: 'Experienced travel consultant specializing in luxury and adventure travel packages.'
  });
  const [logoUrl, setLogoUrl] = useState<string>(currentUser?.avatar || '');

  const performanceStats = [
    { title: 'Total Bookings', value: '142', icon: Calendar, color: 'text-blue-600' },
    { title: 'Revenue Generated', value: '$125.4K', icon: DollarSign, color: 'text-green-600' },
    { title: 'Client Rating', value: '4.8/5', icon: Star, color: 'text-yellow-600' },
    { title: 'Commission Earned', value: '$12.5K', icon: Award, color: 'text-purple-600' }
  ];

  const recentActivity = [
    { action: 'Booking confirmed', client: 'John Doe', amount: '$2,450', date: '2 hours ago' },
    { action: 'Proposal sent', client: 'Jane Smith', amount: '$3,200', date: '5 hours ago' },
    { action: 'Payment received', client: 'Bob Wilson', amount: '$1,800', date: '1 day ago' },
    { action: 'Query created', client: 'Alice Brown', amount: '$4,100', date: '2 days ago' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    (async () => {
      try {
        if (currentUser?.id) {
          const { data } = await AgentManagementService.getAgentById(currentUser.id);
          if (data) {
            setProfileData(prev => ({
              ...prev,
              name: (data as any).name || prev.name,
              email: (data as any).email || prev.email,
              phone: (data as any).phone || prev.phone,
              companyName: (data as any).company_name || prev.companyName,
              city: (data as any).city || prev.city,
              country: (data as any).country || prev.country,
            }));
            setLogoUrl((data as any).profile_image || currentUser?.avatar || '');
          }
        }
      } catch {}
    })();
  }, [currentUser?.id]);

  const handleSave = async () => {
    try {
      if (!currentUser?.id) throw new Error('No user found');
      const { error } = await AgentManagementService.updateAgent({
        id: currentUser.id,
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        company_name: profileData.companyName,
        profile_image: logoUrl,
        country: profileData.country,
        city: profileData.city,
      });
      if (error) throw error;
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
      setIsEditing(false);
    } catch (e: any) {
      toast({
        title: 'Update failed',
        description: e?.message || 'Could not save changes',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    // Reset to original data
    setProfileData({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
      companyName: 'Elite Travel Solutions',
      address: '123 Business District, Downtown',
      city: 'Mumbai',
      country: 'India',
      specialization: 'Luxury Travel',
      experience: '5 years',
      gstNumber: 'GST123456789',
      bio: 'Experienced travel consultant specializing in luxury and adventure travel packages.'
    });
    setLogoUrl(currentUser?.avatar || '');
    setIsEditing(false);
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Agent Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your profile and view performance metrics
            </p>
          </div>
          <Button 
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? "outline" : "default"}
          >
            {isEditing ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal and business details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={logoUrl} />
                      <AvatarFallback className="text-lg">
                        {currentUser?.name?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {profileData.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {profileData.companyName}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      Travel Agent
                    </Badge>
                  </div>
                </div>
                {isEditing && (
                  <div className="mt-4">
                    <CompanyLogoUpload
                      currentImage={logoUrl}
                      onImageChange={(url) => setLogoUrl(url)}
                      onImageRemove={() => setLogoUrl('')}
                    />
                  </div>
                )}

                {/* Personal Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                      />
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        {profileData.name}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        {profileData.email}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        {profileData.phone}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    {isEditing ? (
                      <Input
                        id="companyName"
                        value={profileData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                      />
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <Building2 className="h-4 w-4 mr-2 text-gray-500" />
                        {profileData.companyName}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    {isEditing ? (
                      <Input
                        id="specialization"
                        value={profileData.specialization}
                        onChange={(e) => handleInputChange('specialization', e.target.value)}
                      />
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <Star className="h-4 w-4 mr-2 text-gray-500" />
                        {profileData.specialization}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience</Label>
                    {isEditing ? (
                      <Input
                        id="experience"
                        value={profileData.experience}
                        onChange={(e) => handleInputChange('experience', e.target.value)}
                      />
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        {profileData.experience}
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  {isEditing ? (
                    <Textarea
                      id="address"
                      value={profileData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={3}
                    />
                  ) : (
                    <div className="flex items-start p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <MapPin className="h-4 w-4 mr-2 mt-1 text-gray-500" />
                      <div>
                        <p>{profileData.address}</p>
                        <p>{profileData.city}, {profileData.country}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  {isEditing ? (
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={4}
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      {profileData.bio}
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="flex gap-4">
                    <Button onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {performanceStats.map((stat) => (
                <Card key={stat.title}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {stat.value}
                        </p>
                      </div>
                      <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Performance Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>
                  Your booking and revenue trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Performance chart will be displayed here
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest transactions and activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {activity.action}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Client: {activity.client}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {activity.amount}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default AgentProfile;