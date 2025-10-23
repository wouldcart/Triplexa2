import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useProfileValidation } from '@/hooks/useEnhancedProfile';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Clock,
  Shield,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Star
} from 'lucide-react';

interface EnhancedProfileValidationProps {
  profileData: any;
  onValidationChange?: (isValid: boolean, errors: Record<string, string>) => void;
  showProgress?: boolean;
  autoValidate?: boolean;
}

const EnhancedProfileValidation: React.FC<EnhancedProfileValidationProps> = ({
  profileData,
  onValidationChange,
  showProgress = true,
  autoValidate = true
}) => {
  const { validateProfile } = useProfileValidation();
  const [validation, setValidation] = useState<{
    isValid: boolean;
    errors: Record<string, string>;
    warnings: Record<string, string>;
    suggestions: Record<string, string>;
  }>({
    isValid: true,
    errors: {},
    warnings: {},
    suggestions: {}
  });

  const [completionScore, setCompletionScore] = useState(0);

  useEffect(() => {
    if (autoValidate && profileData) {
      const result = validateProfile(profileData);
      const warnings: Record<string, string> = {};
      const suggestions: Record<string, string> = {};

      // Add warnings for optional but recommended fields
      if (!profileData.bio) {
        warnings.bio = 'Adding a bio helps others understand your background';
      }
      if (!profileData.timezone) {
        warnings.timezone = 'Setting your timezone helps with scheduling';
      }
      if (!profileData.language) {
        warnings.language = 'Specifying your language preference improves communication';
      }

      // Add suggestions for profile improvement
      if (profileData.bio && profileData.bio.length < 50) {
        suggestions.bio = 'Consider expanding your bio to at least 50 characters';
      }
      if (!profileData.skills || profileData.skills.length === 0) {
        suggestions.skills = 'Add your skills to help with project assignments';
      }
      if (!profileData.certifications || profileData.certifications.length === 0) {
        suggestions.certifications = 'Add certifications to showcase your expertise';
      }

      const validationResult = {
        ...result,
        warnings,
        suggestions
      };

      setValidation(validationResult);
      
      // Calculate completion score
      const totalFields = 12; // Total important fields
      let completedFields = 0;
      
      if (profileData.first_name) completedFields++;
      if (profileData.last_name) completedFields++;
      if (profileData.phone) completedFields++;
      if (profileData.bio) completedFields++;
      if (profileData.address?.street) completedFields++;
      if (profileData.timezone) completedFields++;
      if (profileData.language) completedFields++;
      if (profileData.preferences?.department) completedFields++;
      if (profileData.preferences?.position) completedFields++;
      if (profileData.preferences?.skills?.length > 0) completedFields++;
      if (profileData.preferences?.certifications?.length > 0) completedFields++;
      if (profileData.settings?.workSchedule) completedFields++;

      const score = Math.round((completedFields / totalFields) * 100);
      setCompletionScore(score);

      if (onValidationChange) {
        onValidationChange(result.isValid, result.errors);
      }
    }
  }, [profileData, autoValidate, validateProfile, onValidationChange]);

  const getValidationIcon = (type: 'error' | 'warning' | 'suggestion' | 'success') => {
    switch (type) {
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'suggestion': return <Star className="h-4 w-4 text-blue-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getFieldIcon = (field: string) => {
    switch (field) {
      case 'first_name':
      case 'last_name':
      case 'display_name': return <User className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'address':
      case 'street': return <MapPin className="h-4 w-4" />;
      case 'bio':
      case 'department':
      case 'position':
      case 'skills':
      case 'certifications': return <Briefcase className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getCompletionColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompletionBadgeVariant = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    if (score >= 50) return 'outline';
    return 'destructive';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Profile Validation</span>
          </div>
          {showProgress && (
            <Badge variant={getCompletionBadgeVariant(completionScore)}>
              {completionScore}% Complete
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Real-time validation and suggestions for your profile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Profile Completion</span>
              <span className={getCompletionColor(completionScore)}>
                {completionScore}%
              </span>
            </div>
            <Progress value={completionScore} className="h-2" />
          </div>
        )}

        {/* Validation Results */}
        <div className="space-y-3">
          {/* Errors */}
          {Object.entries(validation.errors).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-red-600 flex items-center space-x-2">
                {getValidationIcon('error')}
                <span>Errors ({Object.keys(validation.errors).length})</span>
              </h4>
              {Object.entries(validation.errors).map(([field, message]) => (
                <div key={field} className="flex items-start space-x-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
                  {getFieldIcon(field)}
                  <div className="flex-1">
                    <div className="text-sm font-medium capitalize">{field.replace('_', ' ')}</div>
                    <div className="text-xs text-red-600 dark:text-red-400">{message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {Object.entries(validation.warnings).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-yellow-600 flex items-center space-x-2">
                {getValidationIcon('warning')}
                <span>Warnings ({Object.keys(validation.warnings).length})</span>
              </h4>
              {Object.entries(validation.warnings).map(([field, message]) => (
                <div key={field} className="flex items-start space-x-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                  {getFieldIcon(field)}
                  <div className="flex-1">
                    <div className="text-sm font-medium capitalize">{field.replace('_', ' ')}</div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">{message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {Object.entries(validation.suggestions).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-blue-600 flex items-center space-x-2">
                {getValidationIcon('suggestion')}
                <span>Suggestions ({Object.keys(validation.suggestions).length})</span>
              </h4>
              {Object.entries(validation.suggestions).map(([field, message]) => (
                <div key={field} className="flex items-start space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  {getFieldIcon(field)}
                  <div className="flex-1">
                    <div className="text-sm font-medium capitalize">{field.replace('_', ' ')}</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">{message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Success State */}
          {validation.isValid && 
           Object.keys(validation.warnings).length === 0 && 
           Object.keys(validation.suggestions).length === 0 && (
            <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
              {getValidationIcon('success')}
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Profile validation passed!
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Your profile meets all requirements
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {(Object.keys(validation.errors).length > 0 || completionScore < 80) && (
          <div className="pt-2 border-t">
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full"
              onClick={() => {
                // Scroll to first error field or incomplete section
                const firstError = Object.keys(validation.errors)[0];
                if (firstError) {
                  const element = document.querySelector(`[name="${firstError}"]`);
                  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
            >
              {Object.keys(validation.errors).length > 0 
                ? 'Fix First Error' 
                : 'Complete Profile'
              }
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { EnhancedProfileValidation };