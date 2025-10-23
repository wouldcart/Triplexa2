
import React from 'react';
import TravelerLayout from '@/components/traveler/TravelerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, MapPin, Calendar, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const TravelerProfilePage: React.FC = () => {
  const { currentUser } = useApp();
  const isMobile = useIsMobile();

  return (
    <TravelerLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">My Profile</h1>
        </div>

        {/* Profile Header */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                <AvatarImage src={currentUser?.avatar} />
                <AvatarFallback className="text-xl sm:text-2xl bg-primary text-primary-foreground">
                  {currentUser?.name?.charAt(0) || 'T'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
                  {currentUser?.name || 'Traveler'}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-4">Traveler Account</p>
                <Button variant="outline" size={isMobile ? "sm" : "default"}>
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-sm sm:text-base text-foreground truncate">
                    {currentUser?.email || 'Not provided'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium text-sm sm:text-base text-foreground truncate">
                    {currentUser?.phone || 'Not provided'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Address</p>
                  <p className="font-medium text-sm sm:text-base text-foreground">New York, NY</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium text-sm sm:text-base text-foreground">January 2024</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Travel Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Travel Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Preferred Destinations</p>
                <p className="font-medium text-sm sm:text-base text-foreground">Cultural Sites, Historical Places</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Travel Style</p>
                <p className="font-medium text-sm sm:text-base text-foreground">Guided Tours, Local Experiences</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Accommodation</p>
                <p className="font-medium text-sm sm:text-base text-foreground">4-5 Star Hotels</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Budget Range</p>
                <p className="font-medium text-sm sm:text-base text-foreground">Premium</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Emergency Contacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-3 sm:p-4">
              <h4 className="font-medium text-sm sm:text-base text-foreground mb-2">Primary Contact</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                <div>
                  <span className="text-muted-foreground">Name: </span>
                  <span className="text-foreground">John Smith</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Relationship: </span>
                  <span className="text-foreground">Spouse</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone: </span>
                  <span className="text-foreground">+1-555-0123</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  <span className="text-foreground">john.smith@email.com</span>
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full" size={isMobile ? "sm" : "default"}>
              <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Manage Emergency Contacts
            </Button>
          </CardContent>
        </Card>
      </div>
    </TravelerLayout>
  );
};

export default TravelerProfilePage;
