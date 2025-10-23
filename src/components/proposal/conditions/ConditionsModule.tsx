import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FileText, Plus, Edit, Trash2, AlertTriangle, DollarSign, Calendar } from 'lucide-react';

interface Condition {
  id: string;
  type: 'terms' | 'cancellation' | 'payment' | 'custom';
  title: string;
  content: string;
  isActive: boolean;
  priority: number;
}

interface PaymentTerms {
  depositPercentage: number;
  depositDueDate: string;
  finalPaymentDays: number;
  acceptedMethods: string[];
}

interface CancellationPolicy {
  freeCancel: number; // days before travel
  cancellationFees: {
    days: number;
    feePercentage: number;
  }[];
}

interface ConditionsModuleProps {
  onConditionsChange?: (conditions: Condition[]) => void;
  onPaymentTermsChange?: (terms: PaymentTerms) => void;
  onCancellationPolicyChange?: (policy: CancellationPolicy) => void;
}

const defaultConditions: Condition[] = [
  {
    id: '1',
    type: 'terms',
    title: 'Booking Terms & Conditions',
    content: 'All bookings are subject to availability and confirmation. Prices are per person and subject to change without notice.',
    isActive: true,
    priority: 1
  },
  {
    id: '2',
    type: 'cancellation',
    title: 'Cancellation Policy',
    content: 'Free cancellation up to 30 days before travel. Cancellation fees apply after this period.',
    isActive: true,
    priority: 2
  }
];

const defaultPaymentTerms: PaymentTerms = {
  depositPercentage: 25,
  depositDueDate: '7 days',
  finalPaymentDays: 30,
  acceptedMethods: ['Credit Card', 'Bank Transfer', 'PayPal']
};

const defaultCancellationPolicy: CancellationPolicy = {
  freeCancel: 30,
  cancellationFees: [
    { days: 30, feePercentage: 0 },
    { days: 15, feePercentage: 25 },
    { days: 7, feePercentage: 50 },
    { days: 0, feePercentage: 100 }
  ]
};

export const ConditionsModule: React.FC<ConditionsModuleProps> = ({
  onConditionsChange,
  onPaymentTermsChange,
  onCancellationPolicyChange
}) => {
  const [conditions, setConditions] = useState<Condition[]>(defaultConditions);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>(defaultPaymentTerms);
  const [cancellationPolicy, setCancellationPolicy] = useState<CancellationPolicy>(defaultCancellationPolicy);
  const [editingCondition, setEditingCondition] = useState<string | null>(null);
  const [newCondition, setNewCondition] = useState<Partial<Condition>>({});
  const [activeTab, setActiveTab] = useState<'conditions' | 'payment' | 'cancellation'>('conditions');

  const handleAddCondition = () => {
    if (newCondition.title && newCondition.content) {
      const condition: Condition = {
        id: Date.now().toString(),
        type: newCondition.type || 'custom',
        title: newCondition.title,
        content: newCondition.content,
        isActive: true,
        priority: conditions.length + 1
      };

      const updatedConditions = [...conditions, condition];
      setConditions(updatedConditions);
      onConditionsChange?.(updatedConditions);
      setNewCondition({});
    }
  };

  const handleUpdateCondition = (id: string, updates: Partial<Condition>) => {
    const updatedConditions = conditions.map(condition =>
      condition.id === id ? { ...condition, ...updates } : condition
    );
    setConditions(updatedConditions);
    onConditionsChange?.(updatedConditions);
    setEditingCondition(null);
  };

  const handleDeleteCondition = (id: string) => {
    const updatedConditions = conditions.filter(condition => condition.id !== id);
    setConditions(updatedConditions);
    onConditionsChange?.(updatedConditions);
  };

  const handlePaymentTermsUpdate = (field: keyof PaymentTerms, value: any) => {
    const updatedTerms = { ...paymentTerms, [field]: value };
    setPaymentTerms(updatedTerms);
    onPaymentTermsChange?.(updatedTerms);
  };

  const getConditionIcon = (type: string) => {
    switch (type) {
      case 'terms': return <FileText className="h-4 w-4" />;
      case 'cancellation': return <AlertTriangle className="h-4 w-4" />;
      case 'payment': return <DollarSign className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getConditionColor = (type: string) => {
    switch (type) {
      case 'terms': return 'bg-blue-100 text-blue-700';
      case 'cancellation': return 'bg-orange-100 text-orange-700';
      case 'payment': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-purple-600" />
        <h3 className="text-xl font-semibold">Terms & Conditions</h3>
        <Badge variant="outline">{conditions.length} conditions</Badge>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'conditions'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('conditions')}
        >
          General Conditions
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'payment'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('payment')}
        >
          Payment Terms
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'cancellation'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('cancellation')}
        >
          Cancellation Policy
        </button>
      </div>

      {/* General Conditions Tab */}
      {activeTab === 'conditions' && (
        <div className="space-y-4">
          {/* Existing Conditions */}
          {conditions.map((condition) => (
            <Card key={condition.id} className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getConditionIcon(condition.type)}
                      <h4 className="font-semibold">{condition.title}</h4>
                      <Badge variant="outline" className={getConditionColor(condition.type)}>
                        {condition.type}
                      </Badge>
                      <Switch
                        checked={condition.isActive}
                        onCheckedChange={(checked) => 
                          handleUpdateCondition(condition.id, { isActive: checked })
                        }
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">{condition.content}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingCondition(condition.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCondition(condition.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add New Condition */}
          <Card className="border-2 border-dashed border-purple-300 bg-purple-50/50">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="h-5 w-5" />
                <h4 className="font-semibold">Add New Condition</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="conditionTitle">Title</Label>
                  <Input
                    id="conditionTitle"
                    value={newCondition.title || ''}
                    onChange={(e) => setNewCondition({ ...newCondition, title: e.target.value })}
                    placeholder="Enter condition title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="conditionType">Type</Label>
                  <Select onValueChange={(value: any) => setNewCondition({ ...newCondition, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="terms">Terms & Conditions</SelectItem>
                      <SelectItem value="cancellation">Cancellation</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="conditionContent">Content</Label>
                <Textarea
                  id="conditionContent"
                  value={newCondition.content || ''}
                  onChange={(e) => setNewCondition({ ...newCondition, content: e.target.value })}
                  placeholder="Enter condition details..."
                  rows={3}
                />
              </div>
              
              <Button onClick={handleAddCondition} className="w-full">
                Add Condition
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Terms Tab */}
      {activeTab === 'payment' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Terms Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="depositPercentage">Deposit Percentage (%)</Label>
                <Input
                  id="depositPercentage"
                  type="number"
                  value={paymentTerms.depositPercentage}
                  onChange={(e) => handlePaymentTermsUpdate('depositPercentage', Number(e.target.value))}
                  min="0"
                  max="100"
                />
              </div>
              
              <div>
                <Label htmlFor="depositDueDate">Deposit Due</Label>
                <Input
                  id="depositDueDate"
                  value={paymentTerms.depositDueDate}
                  onChange={(e) => handlePaymentTermsUpdate('depositDueDate', e.target.value)}
                  placeholder="e.g., 7 days"
                />
              </div>
              
              <div>
                <Label htmlFor="finalPaymentDays">Final Payment (Days Before Travel)</Label>
                <Input
                  id="finalPaymentDays"
                  type="number"
                  value={paymentTerms.finalPaymentDays}
                  onChange={(e) => handlePaymentTermsUpdate('finalPaymentDays', Number(e.target.value))}
                  min="0"
                />
              </div>
            </div>
            
            <div>
              <Label>Accepted Payment Methods</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Credit Card', 'Bank Transfer', 'PayPal', 'Cash', 'Check'].map((method) => (
                  <Button
                    key={method}
                    variant={paymentTerms.acceptedMethods.includes(method) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const updated = paymentTerms.acceptedMethods.includes(method)
                        ? paymentTerms.acceptedMethods.filter(m => m !== method)
                        : [...paymentTerms.acceptedMethods, method];
                      handlePaymentTermsUpdate('acceptedMethods', updated);
                    }}
                  >
                    {method}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancellation Policy Tab */}
      {activeTab === 'cancellation' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Cancellation Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="freeCancel">Free Cancellation (Days Before Travel)</Label>
              <Input
                id="freeCancel"
                type="number"
                value={cancellationPolicy.freeCancel}
                onChange={(e) => setCancellationPolicy({
                  ...cancellationPolicy,
                  freeCancel: Number(e.target.value)
                })}
                min="0"
              />
            </div>
            
            <div>
              <Label>Cancellation Fee Structure</Label>
              <div className="space-y-2 mt-2">
                {cancellationPolicy.cancellationFees.map((fee, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <span className="text-sm font-medium">
                        {fee.days === 0 ? 'Day of travel' : `${fee.days}+ days before`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={fee.feePercentage}
                        onChange={(e) => {
                          const updatedFees = [...cancellationPolicy.cancellationFees];
                          updatedFees[index].feePercentage = Number(e.target.value);
                          setCancellationPolicy({
                            ...cancellationPolicy,
                            cancellationFees: updatedFees
                          });
                        }}
                        className="w-20"
                        min="0"
                        max="100"
                      />
                      <span className="text-sm">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
