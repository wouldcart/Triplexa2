import React, { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessControl } from '@/hooks/use-access-control';
import RoleBasedProfile from '@/components/profile/RoleBasedProfile';
import { ProfileActivity } from '@/components/profile/ProfileActivity';
import { EnhancedProfileValidation } from '@/components/profile/EnhancedProfileValidation';
// Removed ProfileSettings from Profile page; moved to General Settings
import { useEnhancedProfile, useProfileValidation } from '@/hooks/useEnhancedProfile';
import { EnhancedProfile } from '@/services/seoService';
import { SEOHead } from '@/components/seo/SEOHead';
import { 
  User, Shield, Edit, Save, X, Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface EditableUserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: 'active' | 'inactive' | 'suspended';
  position: string;
  workLocation: string;
  employeeId: string;
  joinDate: string;
  reportingManager: string;
  skills: string[];
  certifications: string[];
  permissions: string[];
  personalInfo: {
    dateOfBirth: string;
    address: string;
    nationality: string;
    languages: string[];
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  workSchedule: {
    workingDays: string[];
    startTime: string;
    endTime: string;
    timezone: string;
  };
  companyInfo?: {
    companyName: string;
    registrationNumber: string;
    businessType: string;
    contractStartDate: string;
    contractEndDate: string;
  };
}

const Profile: React.FC = () => {
  const { currentUser } = useApp();
  const { updateProfile, updatePassword } = useAuth();
  const { isSuperAdmin, isManager, isStaff, isAgent, canPerformAction } = useAccessControl();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<EditableUserData | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Basic info local state (for direct Supabase updates)
  const [basicName, setBasicName] = useState('');
  const [basicPhone, setBasicPhone] = useState('');
  const [basicDepartment, setBasicDepartment] = useState('');

  // Password update local state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Enhanced profile hooks for real-time database functionality
  const {
    profile: enhancedProfile,
    loading: profileLoading,
    saving: profileSaving,
    error: profileError,
    lastSaved,
    updateField,
    updateFields,
    saveProfile
  } = useEnhancedProfile(currentUser?.id);
  
  const { validateProfile } = useProfileValidation();

  useEffect(() => {
    if (currentUser) {
      setEditData({
        id: currentUser.id,
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        role: currentUser.role || 'user',
        department: currentUser.department || '',
        status: currentUser.status || 'active',
        position: currentUser.position || '',
        workLocation: currentUser.workLocation || '',
        employeeId: currentUser.employeeId || '',
        joinDate: currentUser.joinDate || '',
        reportingManager: currentUser.reportingManager || '',
        skills: currentUser.skills || [],
        certifications: currentUser.certifications || [],
        permissions: currentUser.permissions || [],
        personalInfo: {
          dateOfBirth: currentUser.personalInfo?.dateOfBirth || '',
          address: currentUser.personalInfo?.address || '',
          nationality: currentUser.personalInfo?.nationality || '',
          languages: currentUser.personalInfo?.languages || []
        },
        emergencyContact: {
          name: currentUser.emergencyContact?.name || '',
          phone: currentUser.emergencyContact?.phone || '',
          relationship: currentUser.emergencyContact?.relationship || ''
        },
        workSchedule: {
          workingDays: currentUser.workSchedule?.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          startTime: currentUser.workSchedule?.startTime || '09:00',
          endTime: currentUser.workSchedule?.endTime || '17:00',
          timezone: currentUser.workSchedule?.timezone || 'UTC-5'
        },
        companyInfo: currentUser.companyInfo ? {
          companyName: currentUser.companyInfo.companyName || '',
          registrationNumber: currentUser.companyInfo.registrationNumber || '',
          businessType: currentUser.companyInfo.businessType || '',
          contractStartDate: currentUser.companyInfo.contractStartDate || '',
          contractEndDate: currentUser.companyInfo.contractEndDate || ''
        } : undefined
      });

      // Sync basic info inputs
      setBasicName(currentUser.name || '');
      setBasicPhone(currentUser.phone || '');
      setBasicDepartment(currentUser.department || '');
    }
  }, [currentUser]);

  if (!currentUser || !editData) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </PageLayout>
    );
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!editData.name.trim()) errors.name = 'Name is required';
    if (!editData.email.trim()) errors.email = 'Email is required';
    if (editData.email && !/\S+@\S+\.\S+/.test(editData.email)) {
      errors.email = 'Invalid email format';
    }
    if (editData.phone && !/^\+?[\d\s\-\(\)]+$/.test(editData.phone)) {
      errors.phone = 'Invalid phone format';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveBasicInfo = async () => {
    if (!basicName.trim()) {
      toast({ title: 'Name required', description: 'Please enter your name.', variant: 'destructive' });
      return;
    }
    if (basicPhone && !/^\+?[\d\s\-\(\)]+$/.test(basicPhone)) {
      toast({ title: 'Invalid phone', description: 'Please enter a valid phone number.', variant: 'destructive' });
      return;
    }

    const { error } = await updateProfile({ name: basicName, phone: basicPhone, department: basicDepartment });
    if (error) {
      toast({ title: 'Update failed', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated', description: 'Basic information saved to Supabase.' });
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast({ title: 'Weak password', description: 'Password must be at least 8 characters.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Mismatch', description: 'New password and confirmation do not match.', variant: 'destructive' });
      return;
    }

    const { error } = await updatePassword(newPassword);
    if (error) {
      toast({ title: 'Password update failed', description: error, variant: 'destructive' });
    } else {
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: 'Password updated', description: 'Your password has been changed successfully.' });
    }
  };

  const handleSave = async () => {
    if (!editData) return;
    
    // Validate using enhanced validation
    const validation = validateProfile({
      first_name: editData.name.split(' ')[0],
      last_name: editData.name.split(' ').slice(1).join(' '),
      phone: editData.phone,
      bio: editData.personalInfo?.address
    });
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving",
        variant: "destructive"
      });
      return;
    }

    try {
      // Save to enhanced profile database
      await saveProfile({
        user_id: editData.id,
        first_name: editData.name.split(' ')[0],
        last_name: editData.name.split(' ').slice(1).join(' '),
        display_name: editData.name,
        phone: editData.phone,
        address: {
          street: editData.personalInfo?.address || '',
          nationality: editData.personalInfo?.nationality || ''
        },
        preferences: {
          department: editData.department,
          position: editData.position,
          workLocation: editData.workLocation,
          skills: editData.skills,
          certifications: editData.certifications
        },
        settings: {
          workSchedule: editData.workSchedule,
          emergencyContact: editData.emergencyContact
        },
        timezone: editData.workSchedule?.timezone,
        language: editData.personalInfo?.languages?.[0] || 'en'
      });
      
      setIsEditing(false);
      setValidationErrors({});
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully with real-time saving",
      });
    } catch (error) {
      toast({
        title: "Save Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    // Reset to original data
    if (currentUser) {
      setEditData({
        id: currentUser.id,
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        role: currentUser.role || 'user',
        department: currentUser.department || '',
        status: currentUser.status || 'active',
        position: currentUser.position || '',
        workLocation: currentUser.workLocation || '',
        employeeId: currentUser.employeeId || '',
        joinDate: currentUser.joinDate || '',
        reportingManager: currentUser.reportingManager || '',
        skills: currentUser.skills || [],
        certifications: currentUser.certifications || [],
        permissions: currentUser.permissions || [],
        personalInfo: {
          dateOfBirth: currentUser.personalInfo?.dateOfBirth || '',
          address: currentUser.personalInfo?.address || '',
          nationality: currentUser.personalInfo?.nationality || '',
          languages: currentUser.personalInfo?.languages || []
        },
        emergencyContact: {
          name: currentUser.emergencyContact?.name || '',
          phone: currentUser.emergencyContact?.phone || '',
          relationship: currentUser.emergencyContact?.relationship || ''
        },
        workSchedule: {
          workingDays: currentUser.workSchedule?.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          startTime: currentUser.workSchedule?.startTime || '09:00',
          endTime: currentUser.workSchedule?.endTime || '17:00',
          timezone: currentUser.workSchedule?.timezone || 'UTC-5'
        },
        companyInfo: currentUser.companyInfo ? {
          companyName: currentUser.companyInfo.companyName || '',
          registrationNumber: currentUser.companyInfo.registrationNumber || '',
          businessType: currentUser.companyInfo.businessType || '',
          contractStartDate: currentUser.companyInfo.contractStartDate || '',
          contractEndDate: currentUser.companyInfo.contractEndDate || ''
        } : undefined
      });
    }
    setIsEditing(false);
    setValidationErrors({});
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'manager': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'staff': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'agent': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatRole = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const canEdit = isSuperAdmin || canPerformAction('edit-profile', currentUser.id);
  const usesInternalUserProfile = !isSuperAdmin && !isManager && !isStaff && !isAgent;
  const requiredFields = ['name', 'phone', 'department'] as const;
  const completeness = Math.round(
    (requiredFields.filter((f) => !!(editData as any)[f]).length / requiredFields.length) * 100
  );

  // Real-time field update handler
  const handleFieldUpdate = async (field: string, value: any) => {
    if (isEditing && editData) {
      const updatedData = { ...editData, [field]: value };
      setEditData(updatedData);
      
      // Auto-save to database with debouncing
      await updateField(field as keyof EnhancedProfile, value);
    }
  };

  return (
    <PageLayout>
      <SEOHead 
        title="Profile - TripleXA"
        description="Manage your profile settings and personal information"
        keywords={["profile", "settings", "user", "account"]}
      />
      <div className="space-y-6">
        {/* Real-time Status Indicator */}
        {(profileLoading || profileSaving) && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-white dark:bg-gray-800 border rounded-lg p-3 shadow-lg flex items-center space-x-2">
              {profileSaving ? (
                <>
                  <Clock className="h-4 w-4 text-blue-500 animate-spin" />
                  <span className="text-sm text-blue-600 dark:text-blue-400">Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    Saved {lastSaved ? new Date(lastSaved).toLocaleTimeString() : ''}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error Indicator */}
        {profileError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400">
                Error saving profile: {profileError}
              </span>
            </div>
          </div>
        )}

        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex items-center md:items-start gap-4">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl md:text-2xl font-bold">
                  {editData.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl md:text-2xl font-bold">{editData.name}</h1>
                    {isSuperAdmin && (
                      <Badge variant="outline" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Super Admin
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground break-all">{editData.email}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className={getRoleColor(editData.role)}>
                      {formatRole(editData.role)}
                    </Badge>
                    {editData.department && (
                      <Badge variant="outline">{editData.department}</Badge>
                    )}
                    <Badge className={getStatusColor(editData.status)}>
                      {editData.status}
                    </Badge>
                  </div>
                </div>
              </div>
              {canEdit && !usesInternalUserProfile && (
                <div className="flex w-full md:w-auto flex-col md:flex-row gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" onClick={handleCancel} className="w-full md:w-auto">
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSave} 
                        disabled={profileSaving}
                        className="relative w-full md:w-auto"
                      >
                        {profileSaving ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)} className="w-full md:w-auto">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Quick actions section: button + two info blocks */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Actions</CardTitle>
            <CardDescription>Quick actions and profile status at a glance.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div className="space-y-2">
              {canEdit && !usesInternalUserProfile ? (
                <Button
                  onClick={isEditing ? handleSave : () => setIsEditing(true)}
                  disabled={profileSaving}
                  className="w-full md:w-auto"
                >
                  {isEditing ? (
                    profileSaving ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </>
                  )}
                </Button>
              ) : (
                <Button disabled className="w-full md:w-auto">Edit Disabled</Button>
              )}
            </div>
            <div className="space-y-2">
              <Label>Completeness</Label>
              <div className="text-sm text-muted-foreground">{completeness}% complete</div>
              <div className="h-2 bg-muted rounded">
                <div
                  className="h-2 bg-primary rounded"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Account Status</Label>
              <div className="text-sm">
                <Badge className={getStatusColor(editData.status)}>{editData.status}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Basic Information (Supabase) */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update your name, phone, and department directly in Supabase.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label htmlFor="basic-name">Name</Label>
              <Input id="basic-name" value={basicName} onChange={(e) => setBasicName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="basic-phone">Phone</Label>
              <Input id="basic-phone" value={basicPhone} onChange={(e) => setBasicPhone(e.target.value)} placeholder="+1 234 567 890" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="basic-dept">Department</Label>
              <Input id="basic-dept" value={basicDepartment} onChange={(e) => setBasicDepartment(e.target.value)} placeholder="Department" />
            </div>
            <div className="md:col-span-3">
              <Button onClick={handleSaveBasicInfo} className="w-full md:w-auto">Save Basic Info</Button>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Set a new password for your account.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
            </div>
            <div className="md:col-span-2">
              <Button variant="secondary" onClick={handleUpdatePassword} className="w-full md:w-auto">Update Password</Button>
            </div>
          </CardContent>
        </Card>

        {/* Role-Based Profile Content */}
        <RoleBasedProfile
          isEditing={isEditing}
          editData={editData}
          setEditData={setEditData}
          validationErrors={validationErrors}
        />

        {/* Profile Activity Tracking */}
        <ProfileActivity 
          userId={currentUser?.id}
          limit={15}
          showHeader={true}
        />
        
        {/* Enhanced Profile Validation */}
        <EnhancedProfileValidation 
            profileData={editData}
            onValidationChange={(isValid) => console.log('Validation changed:', isValid)}
          />
          
          {/* Application Settings moved notice */}
          <Card>
            <CardHeader>
              <CardTitle>Application Settings</CardTitle>
              <CardDescription>
                App-level settings are now managed in General Settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/settings/general">
                <Button>Go to General Settings</Button>
              </Link>
            </CardContent>
          </Card>
      </div>
    </PageLayout>
  );
};

export default Profile;
