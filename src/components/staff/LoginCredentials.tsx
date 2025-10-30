
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Control } from 'react-hook-form';
import { Eye, EyeOff, RefreshCw, Copy, Check } from 'lucide-react';
import { 
  generateUsernameFromEmail, 
  generateUsernameFromName, 
  generateSecurePassword, 
  validatePasswordStrength,
  checkUsernameUniqueness
} from '@/utils/credentialGenerator';
import { toast } from '@/hooks/use-toast';

interface LoginCredentialsProps {
  control: Control<any>;
  watchedEmail: string;
  watchedName: string;
  formErrors: any;
}

const LoginCredentials: React.FC<LoginCredentialsProps> = ({
  control,
  watchedEmail,
  watchedName,
  formErrors
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [autoGenerateUsername, setAutoGenerateUsername] = useState(true);
  const [autoGeneratePassword, setAutoGeneratePassword] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerateUsername = (setValue: (value: string) => void) => {
    let username = '';
    if (watchedEmail) {
      // Default username exactly equals the entered email address
      username = watchedEmail.trim();
    } else if (watchedName) {
      username = generateUsernameFromName(watchedName);
    }

    // Ensure uniqueness
    let finalUsername = username;
    let counter = 1;
    while (!checkUsernameUniqueness(finalUsername)) {
      finalUsername = `${username}${counter}`;
      counter++;
    }

    setValue(finalUsername);
  };

  const handleGeneratePassword = (setValue: (value: string) => void, setConfirmValue: (value: string) => void) => {
    const password = generateSecurePassword(12);
    setValue(password);
    setConfirmValue(password);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: "Copied to clipboard",
        description: `${field} has been copied to clipboard`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const getPasswordStrengthColor = (score: number) => {
    if (score <= 2) return 'bg-red-500';
    if (score <= 3) return 'bg-orange-500';
    if (score <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (score: number) => {
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-gray-100">Login Credentials</CardTitle>
        <p className="text-sm text-muted-foreground">
          Set up login credentials for the new staff member
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Username Field */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-gray-900 dark:text-gray-100">Username Generation</Label>
            <div className="flex items-center space-x-2">
              <Label htmlFor="auto-username" className="text-sm text-muted-foreground">
                Auto-generate
              </Label>
              <Switch
                id="auto-username"
                checked={autoGenerateUsername}
                onCheckedChange={setAutoGenerateUsername}
              />
            </div>
          </div>

          <FormField
            control={control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-900 dark:text-gray-100">Username</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      {...field}
                      disabled={autoGenerateUsername}
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      placeholder="Enter username"
                    />
                  </FormControl>
                  {autoGenerateUsername && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateUsername(field.onChange)}
                      disabled={!watchedEmail && !watchedName}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(field.value || '', 'Username')}
                    disabled={!field.value}
                  >
                    {copiedField === 'Username' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <FormMessage />
                {field.value && !checkUsernameUniqueness(field.value) && (
                  <p className="text-sm text-red-500">This username is already taken</p>
                )}
              </FormItem>
            )}
          />
        </div>

        {/* Password Generation Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-gray-900 dark:text-gray-100">Password Generation</Label>
            <div className="flex items-center space-x-2">
              <Label htmlFor="auto-password" className="text-sm text-muted-foreground">
                Auto-generate
              </Label>
              <Switch
                id="auto-password"
                checked={autoGeneratePassword}
                onCheckedChange={setAutoGeneratePassword}
              />
            </div>
          </div>

          <FormField
            control={control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-900 dark:text-gray-100">Password</FormLabel>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FormControl>
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        disabled={autoGeneratePassword}
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 pr-10"
                        placeholder="Enter password"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {autoGeneratePassword && (
                    <FormField
                      control={control}
                      name="confirmPassword"
                      render={({ field: confirmField }) => (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleGeneratePassword(field.onChange, confirmField.onChange)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                    />
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(field.value || '', 'Password')}
                    disabled={!field.value}
                  >
                    {copiedField === 'Password' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <FormMessage />
                {field.value && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Password strength:</span>
                      <span className={`text-sm font-medium ${
                        validatePasswordStrength(field.value).score <= 2 ? 'text-red-500' :
                        validatePasswordStrength(field.value).score <= 3 ? 'text-orange-500' :
                        validatePasswordStrength(field.value).score <= 4 ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>
                        {getPasswordStrengthText(validatePasswordStrength(field.value).score)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${getPasswordStrengthColor(validatePasswordStrength(field.value).score)}`}
                        style={{ width: `${(validatePasswordStrength(field.value).score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </FormItem>
            )}
          />

          {!autoGeneratePassword && (
            <FormField
              control={control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900 dark:text-gray-100">Confirm Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        {...field}
                        type={showConfirmPassword ? "text" : "password"}
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 pr-10"
                        placeholder="Confirm password"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Additional Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
            <div>
              <Label className="text-gray-900 dark:text-gray-100">Force Password Change</Label>
              <p className="text-sm text-muted-foreground">
                Require user to change password on first login
              </p>
            </div>
            <Switch
              checked={mustChangePassword}
              onCheckedChange={setMustChangePassword}
            />
          </div>

          <FormField
            control={control}
            name="mustChangePassword"
            render={({ field }) => {
              // Sync the hidden field with our state
              React.useEffect(() => {
                field.onChange(mustChangePassword);
              }, [mustChangePassword, field.onChange]);

              return <input type="hidden" {...field} />;
            }}
          />
        </div>

        {/* Auto-generate effects */}
        <FormField
          control={control}
          name="username"
          render={({ field }) => {
            React.useEffect(() => {
              if (autoGenerateUsername && (watchedEmail || watchedName)) {
                handleGenerateUsername(field.onChange);
              }
            }, [watchedEmail, watchedName, autoGenerateUsername]);

            return null;
          }}
        />

        <FormField
          control={control}
          name="password"
          render={({ field }) => (
            <FormField
              control={control}
              name="confirmPassword"
              render={({ field: confirmField }) => {
                React.useEffect(() => {
                  if (autoGeneratePassword && !field.value) {
                    handleGeneratePassword(field.onChange, confirmField.onChange);
                  }
                }, [autoGeneratePassword]);

                return null;
              }}
            />
          )}
        />
      </CardContent>
    </Card>
  );
};

export default LoginCredentials;
