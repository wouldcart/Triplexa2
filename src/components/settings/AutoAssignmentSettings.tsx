
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Zap, Target, Users, Shield } from 'lucide-react';
import { useAutoAssignmentSettings } from '@/hooks/useAutoAssignmentSettings';

const AutoAssignmentSettings: React.FC = () => {
  const { settings, updateSettings, toggleAutoAssignment } = useAutoAssignmentSettings();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Auto-Assignment Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Auto-Assignment Toggle */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-assignment" className="text-base font-medium">
                Enable Auto-Assignment
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically assign new enquiries to staff based on destination expertise
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="auto-assignment"
                checked={settings.enabled}
                onCheckedChange={toggleAutoAssignment}
              />
              <Badge variant={settings.enabled ? "default" : "secondary"}>
                {settings.enabled ? "ON" : "OFF"}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Assignment Rules */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <Label className="text-base font-medium">Assignment Rules</Label>
            </div>

            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="require-country-match" className="text-sm font-medium">
                    Require Country Match
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Only assign to staff with operational country expertise
                  </p>
                </div>
                <Switch
                  id="require-country-match"
                  checked={settings.requireCountryMatch}
                  onCheckedChange={(checked) => 
                    updateSettings({ requireCountryMatch: checked })
                  }
                  disabled={!settings.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="fallback-any-staff" className="text-sm font-medium">
                    Fallback to Any Available Staff
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    If no country expert found, assign to any available staff
                  </p>
                </div>
                <Switch
                  id="fallback-any-staff"
                  checked={settings.fallbackToAnyStaff}
                  onCheckedChange={(checked) => 
                    updateSettings({ fallbackToAnyStaff: checked })
                  }
                  disabled={!settings.enabled}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Assignment Priority */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <Label className="text-base font-medium">Assignment Priority Order</Label>
            </div>
            
            <div className="pl-6 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 flex items-center justify-center text-xs">1</Badge>
                <span>Staff with matching operational countries</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 flex items-center justify-center text-xs">2</Badge>
                <span>Agent-staff relationship (if exists)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 flex items-center justify-center text-xs">3</Badge>
                <span>Staff with destination expertise</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 flex items-center justify-center text-xs">4</Badge>
                <span>Staff with lowest workload</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Status Summary */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <Label className="text-base font-medium">Current Configuration</Label>
            </div>
            
            <div className="pl-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Auto-Assignment:</span>
                <Badge variant={settings.enabled ? "default" : "secondary"}>
                  {settings.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Country Matching:</span>
                <Badge variant={settings.requireCountryMatch ? "default" : "outline"}>
                  {settings.requireCountryMatch ? "Required" : "Optional"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Fallback Assignment:</span>
                <Badge variant={settings.fallbackToAnyStaff ? "default" : "outline"}>
                  {settings.fallbackToAnyStaff ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoAssignmentSettings;
