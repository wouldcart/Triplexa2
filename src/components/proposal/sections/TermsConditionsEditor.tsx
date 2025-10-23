
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Edit3, Save, X, FileText } from 'lucide-react';

interface TermsConditionsData {
  paymentTerms: string;
  cancellationPolicy: string;
  additionalTerms: string;
}

interface TermsConditionsEditorProps {
  data: TermsConditionsData;
  onChange: (data: TermsConditionsData) => void;
  readonly?: boolean;
}

const defaultTemplates = {
  paymentTerms: [
    '30% advance payment required at the time of booking',
    '50% advance payment required at the time of booking',
    '70% advance payment required 30 days before travel',
    'Full payment required 15 days before travel',
    'Payment can be made in installments as per agreement'
  ],
  cancellationPolicy: [
    'Free cancellation up to 30 days before travel',
    '25% cancellation charge 15-30 days before travel',
    '50% cancellation charge 7-15 days before travel',
    '100% cancellation charge within 7 days of travel',
    'No refund for no-show or early departure'
  ],
  additionalTerms: [
    'All rates are subject to availability at the time of booking',
    'Hotel check-in time is 3:00 PM and check-out time is 12:00 PM',
    'Valid passport required for international travel',
    'Travel insurance is highly recommended',
    'Rates may vary during peak seasons and special events'
  ]
};

const TermsConditionsEditor: React.FC<TermsConditionsEditorProps> = ({
  data,
  onChange,
  readonly = false
}) => {
  const [editingField, setEditingField] = useState<keyof TermsConditionsData | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (field: keyof TermsConditionsData) => {
    setEditingField(field);
    setEditValue(data[field]);
  };

  const saveEdit = () => {
    if (!editingField) return;
    
    onChange({
      ...data,
      [editingField]: editValue
    });
    
    setEditingField(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const useTemplate = (field: keyof TermsConditionsData, template: string) => {
    const currentValue = data[field];
    const newValue = currentValue ? `${currentValue}\n• ${template}` : `• ${template}`;
    
    onChange({
      ...data,
      [field]: newValue
    });
  };

  const renderField = (field: keyof TermsConditionsData, title: string, placeholder: string) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{title}</h4>
        {!readonly && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => startEdit(field)}
            disabled={editingField === field}
          >
            <Edit3 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
      </div>

      {editingField === field ? (
        <div className="space-y-3">
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder}
            rows={6}
            className="min-h-[120px]"
          />
          
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={saveEdit}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={cancelEdit}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Quick Templates:</p>
            <div className="grid gap-2">
              {defaultTemplates[field].map((template, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="ghost"
                  className="text-left justify-start h-auto p-2 text-xs"
                  onClick={() => useTemplate(field, template)}
                >
                  • {template}
                </Button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 border rounded-md bg-gray-50 min-h-[80px]">
          {data[field] ? (
            <div className="whitespace-pre-wrap text-sm">{data[field]}</div>
          ) : (
            <div className="text-gray-500 italic text-sm">{placeholder}</div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Terms & Conditions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderField('paymentTerms', 'Payment Terms', 'Enter payment terms and conditions...')}
        {renderField('cancellationPolicy', 'Cancellation Policy', 'Enter cancellation policy details...')}
        {renderField('additionalTerms', 'Additional Terms', 'Enter any additional terms and conditions...')}
        
        {!readonly && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md">
            <Badge variant="secondary">💡 Tip</Badge>
            <span className="text-sm text-blue-700">
              Click on any template above to add it to your terms. You can customize them as needed.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TermsConditionsEditor;
