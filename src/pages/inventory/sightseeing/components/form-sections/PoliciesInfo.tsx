import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sightseeing } from '@/types/sightseeing';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

interface PoliciesInfoProps {
  formData: Sightseeing;
  handleFormChange: (field: string, value: any) => void;
}

const PoliciesInfo: React.FC<PoliciesInfoProps> = ({
  formData,
  handleFormChange
}) => {
  // Local inputs for tag-style arrays
  const [highlightInput, setHighlightInput] = useState('');
  const [exclusionInput, setExclusionInput] = useState('');

  const policies = formData.policies || { 
    highlights: [], 
    exclusions: [], 
    inclusions: [], 
    advisory: '',
    cancellationPolicy: '',
    refundPolicy: '',
    confirmationPolicy: '',
    termsConditions: ''
  };
  const highlights: string[] = Array.isArray(policies.highlights) ? policies.highlights : [];
  const exclusions: string[] = Array.isArray(policies.exclusions) ? policies.exclusions : [];

  const updatePolicies = (next: Partial<typeof policies>) => {
    handleFormChange('policies', { ...policies, ...next });
  };

  const addHighlight = () => {
    const value = highlightInput.trim();
    if (!value) return;
    updatePolicies({ highlights: [...highlights, value] });
    setHighlightInput('');
  };

  const removeHighlight = (idx: number) => {
    updatePolicies({ highlights: highlights.filter((_, i) => i !== idx) });
  };

  const addExclusion = () => {
    const value = exclusionInput.trim();
    if (!value) return;
    updatePolicies({ exclusions: [...exclusions, value] });
    setExclusionInput('');
  };

  const removeExclusion = (idx: number) => {
    updatePolicies({ exclusions: exclusions.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-6">
      {/* Other Inclusions */}
      <Card>
        <CardHeader>
          <CardTitle>Inclusions & Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otherInclusions">Other Inclusions</Label>
              <Textarea 
                id="otherInclusions" 
                value={formData.otherInclusions || ''} 
                onChange={(e) => handleFormChange('otherInclusions', e.target.value)}
                placeholder="Describe what else is included in the tour/sightseeing"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="advisory">Advisory</Label>
              <Textarea 
                id="advisory" 
                value={policies.advisory || ''} 
                onChange={(e) => updatePolicies({ advisory: e.target.value })}
                placeholder="Important information that visitors should know before booking"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Policies */}
      <Card>
        <CardHeader>
          <CardTitle>Policies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Highlights (multi-input/tag-style) */}
            <div className="space-y-2">
              <Label>Highlights</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {highlights.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No highlights added</span>
                ) : (
                  highlights.map((item, idx) => (
                    <Badge key={`highlight-${idx}`} variant="secondary" className="flex items-center gap-1">
                      {item}
                      <button type="button" onClick={() => removeHighlight(idx)} className="ml-1 inline-flex">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={highlightInput}
                  onChange={(e) => setHighlightInput(e.target.value)}
                  placeholder="Type a highlight and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addHighlight();
                    }
                  }}
                />
                <Button type="button" onClick={addHighlight} disabled={!highlightInput.trim()}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </div>

            {/* Exclusions (multi-input/tag-style) */}
            <div className="space-y-2">
              <Label>Exclusions</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {exclusions.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No exclusions added</span>
                ) : (
                  exclusions.map((item, idx) => (
                    <Badge key={`exclusion-${idx}`} variant="outline" className="flex items-center gap-1">
                      {item}
                      <button type="button" onClick={() => removeExclusion(idx)} className="ml-1 inline-flex">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={exclusionInput}
                  onChange={(e) => setExclusionInput(e.target.value)}
                  placeholder="Type an exclusion and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addExclusion();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addExclusion} disabled={!exclusionInput.trim()}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
              <Textarea 
                id="cancellationPolicy" 
                value={policies.cancellationPolicy || ''} 
                onChange={(e) => updatePolicies({ cancellationPolicy: e.target.value })}
                placeholder="Details about cancellation deadlines and fees"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="refundPolicy">Refund Policy</Label>
              <Textarea 
                id="refundPolicy" 
                value={policies.refundPolicy || ''} 
                onChange={(e) => updatePolicies({ refundPolicy: e.target.value })}
                placeholder="Information about when and how refunds are processed"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmationPolicy">Confirmation Policy</Label>
              <Textarea 
                id="confirmationPolicy" 
                value={policies.confirmationPolicy || ''} 
                onChange={(e) => updatePolicies({ confirmationPolicy: e.target.value })}
                placeholder="Information about booking confirmation process"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="termsConditions">Terms & Conditions</Label>
              <Textarea 
                id="termsConditions" 
                value={policies.termsConditions || ''} 
                onChange={(e) => updatePolicies({ termsConditions: e.target.value })}
                placeholder="Additional terms and conditions"
                rows={4}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Switch
              checked={formData.status === 'active'}
              onCheckedChange={(checked) => handleFormChange('status', checked ? 'active' : 'inactive')}
              id="status"
            />
            <Label htmlFor="status" className="font-medium">
              {formData.status === 'active' ? 'Active' : 'Inactive'}
            </Label>
          </div>
          <p className="text-muted-foreground text-sm mt-2">
            {formData.status === 'active'
              ? 'This sightseeing will be visible to users and available for bookings.'
              : 'This sightseeing will not be visible to users and unavailable for bookings.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PoliciesInfo;
