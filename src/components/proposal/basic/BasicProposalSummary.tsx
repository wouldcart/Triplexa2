
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Query } from '@/types/query';
import { FileText, Download, Send, MapPin, Calendar, Users, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface BasicProposalItem {
  id: string;
  type: 'hotel' | 'transport' | 'restaurant' | 'sightseeing' | 'custom';
  name: string;
  description?: string;
  basePrice: number;
  quantity: number;
  markup: number;
  finalPrice: number;
  currency: string;
  data?: any;
}

interface BasicProposalSummaryProps {
  query: Query;
  selectedItems: BasicProposalItem[];
  totals: {
    subtotal: number;
    markupAmount: number;
    total: number;
  };
  currencySymbol: string;
}

const BasicProposalSummary: React.FC<BasicProposalSummaryProps> = ({
  query,
  selectedItems,
  totals,
  currencySymbol
}) => {
  const paxCount = query.paxDetails.adults + query.paxDetails.children;
  const perPersonCost = totals.total / paxCount;

  const groupedItems = selectedItems.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, BasicProposalItem[]>);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hotel': return '🏨';
      case 'transport': return '🚗';
      case 'restaurant': return '🍽️';
      case 'sightseeing': return '🏛️';
      case 'custom': return '⭐';
      default: return '📋';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'hotel': return 'Accommodation';
      case 'transport': return 'Transportation';
      case 'restaurant': return 'Dining';
      case 'sightseeing': return 'Activities';
      case 'custom': return 'Additional Services';
      default: return 'Other';
    }
  };

  const exportProposal = () => {
    const proposalData = {
      query,
      selectedItems,
      totals,
      generatedAt: new Date().toISOString(),
      type: 'basic'
    };
    
    const dataStr = JSON.stringify(proposalData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `basic_proposal_${query.destination.country}_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-6">
      {/* Proposal Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Basic Proposal Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{query.destination.country}</p>
                <p className="text-xs text-muted-foreground">{query.destination.cities.join(', ')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {new Date(query.travelDates.from).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  to {new Date(query.travelDates.to).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{paxCount} Travelers</p>
                <p className="text-xs text-muted-foreground">
                  {query.paxDetails.adults} Adults, {query.paxDetails.children} Children
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{selectedItems.length} Items</p>
                <p className="text-xs text-muted-foreground capitalize">{query.packageType} Package</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proposal Items by Category */}
      {Object.entries(groupedItems).map(([type, items]) => (
        <Card key={type}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-xl">{getTypeIcon(type)}</span>
              {getTypeLabel(type)}
              <Badge variant="secondary" className="ml-auto">
                {items.length} item{items.length > 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>Quantity: {item.quantity}</span>
                        <span>Base: {formatCurrency(item.basePrice)} {currencySymbol}</span>
                        <span>Markup: {item.markup}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        {formatCurrency(item.finalPrice)} {currencySymbol}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ({formatCurrency(item.finalPrice / paxCount)} per person)
                      </div>
                    </div>
                  </div>
                  {index < items.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Pricing Summary */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">Pricing Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-green-700">Subtotal (Base Prices):</span>
              <span className="font-medium text-green-800">
                {formatCurrency(totals.subtotal)} {currencySymbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Total Markup:</span>
              <span className="font-medium text-green-800">
                {formatCurrency(totals.markupAmount)} {currencySymbol}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg">
              <span className="font-bold text-green-800">Total Package Price:</span>
              <span className="font-bold text-green-800">
                {formatCurrency(totals.total)} {currencySymbol}
              </span>
            </div>
            <div className="text-center bg-white/50 rounded-lg p-3 border border-green-200">
              <p className="text-sm text-green-700 mb-1">Cost per person</p>
              <p className="text-xl font-bold text-green-800">
                {formatCurrency(perPersonCost)} {currencySymbol}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={exportProposal}>
              <Download className="h-4 w-4 mr-2" />
              Export Proposal
            </Button>
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Send to Client
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedItems.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">No Items to Preview</h3>
            <p className="text-muted-foreground text-center">
              Add items from the Templates or Inventory tabs to see your proposal preview.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BasicProposalSummary;
