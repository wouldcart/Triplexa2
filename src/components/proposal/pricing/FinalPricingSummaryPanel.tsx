import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, DollarSign, Download, Share, Printer, 
  Users, Calendar, MapPin, Building, Activity, 
  Car, UtensilsCrossed, TrendingUp, Save, 
  Copy, FileText, Mail
} from 'lucide-react';
import { EnhancedMarkupData, AccommodationPricingOption } from '@/types/enhancedMarkup';

interface FinalPricingSummaryPanelProps {
  markupData: EnhancedMarkupData;
  selectedOption: AccommodationPricingOption | undefined;
  formatCurrency: (amount: number) => string;
  onSave: () => void;
}

export const FinalPricingSummaryPanel: React.FC<FinalPricingSummaryPanelProps> = ({
  markupData,
  selectedOption,
  formatCurrency,
  onSave
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('summary');

  if (!selectedOption) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Package Selected</h3>
          <p className="text-muted-foreground">
            Please select an accommodation package to view the final pricing summary.
          </p>
        </CardContent>
      </Card>
    );
  }

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to Clipboard",
        description: `${description} has been copied to your clipboard.`
      });
    });
  };

  const generatePricingSummaryText = () => {
    return `
PRICING SUMMARY
===============

Package: ${selectedOption.type.charAt(0).toUpperCase() + selectedOption.type.slice(1)}
Travelers: ${markupData.adults} Adults${markupData.children > 0 ? ` + ${markupData.children} Children` : ''}

COST BREAKDOWN:
- Accommodations: ${formatCurrency(selectedOption.accommodations.reduce((sum, acc) => sum + acc.totalPrice, 0))}
- Sightseeing: ${formatCurrency(selectedOption.serviceCosts.sightseeing.total)}
- Transport: ${formatCurrency(selectedOption.serviceCosts.transport.totalCost)}
- Dining: ${formatCurrency(selectedOption.serviceCosts.dining.total)}

Subtotal: ${formatCurrency(selectedOption.baseTotal)}
Markup: ${formatCurrency(selectedOption.markup)}
TOTAL: ${formatCurrency(selectedOption.finalTotal)}

Per Person: ${formatCurrency(selectedOption.finalTotal / markupData.totalPax)}
    `.trim();
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(generatePricingSummaryText());
    const url = `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const shareEmail = () => {
    const subject = encodeURIComponent('Travel Pricing Summary');
    const body = encodeURIComponent(generatePricingSummaryText());
    const url = `mailto:?subject=${subject}&body=${body}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header with Package Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                Final Pricing Summary
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Complete pricing breakdown for the selected package
              </p>
            </div>
            <Badge variant="default" className="text-lg px-4 py-2">
              {selectedOption.type.charAt(0).toUpperCase() + selectedOption.type.slice(1)} Package
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Detailed Summary Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="accommodation">Hotels</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Base Cost</p>
                    <p className="text-lg font-semibold">{formatCurrency(selectedOption.baseTotal)}</p>
                  </div>
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Markup</p>
                    <p className="text-lg font-semibold text-green-600">+{formatCurrency(selectedOption.markup)}</p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Final Total</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(selectedOption.finalTotal)}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Per Person</p>
                    <p className="text-lg font-semibold">{formatCurrency(selectedOption.finalTotal / markupData.totalPax)}</p>
                  </div>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Traveler Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Adults:</span>
                      <span className="font-medium">{markupData.adults}</span>
                    </div>
                    {markupData.children > 0 && (
                      <div className="flex justify-between">
                        <span>Children:</span>
                        <span className="font-medium">{markupData.children}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Total Travelers:</span>
                      <span className="font-medium">{markupData.totalPax}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Package Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Package Type:</span>
                      <Badge variant="outline">{selectedOption.type}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Hotels:</span>
                      <span className="font-medium">{selectedOption.accommodations.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Markup Type:</span>
                      <span className="font-medium">{markupData.markupSettings.type}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Profit Analysis */}
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Profit Analysis
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Markup Amount</p>
                    <p className="font-semibold text-green-600">{formatCurrency(selectedOption.markup)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Profit Margin</p>
                    <p className="font-semibold text-green-600">
                      {((selectedOption.markup / selectedOption.baseTotal) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cost Per Pax</p>
                    <p className="font-semibold">{formatCurrency(selectedOption.baseTotal / markupData.totalPax)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Service Categories */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Accommodations</span>
                    <Badge variant="outline">{selectedOption.accommodations.length} hotels</Badge>
                  </div>
                  <span className="font-semibold">
                    {formatCurrency(selectedOption.accommodations.reduce((sum, acc) => sum + acc.totalPrice, 0))}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Sightseeing & Activities</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(selectedOption.serviceCosts.sightseeing.total)}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Transportation</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(selectedOption.serviceCosts.transport.totalCost)}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Meals & Dining</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(selectedOption.serviceCosts.dining.total)}</span>
                </div>
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(selectedOption.baseTotal)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span className="font-medium">Markup ({((selectedOption.markup / selectedOption.baseTotal) * 100).toFixed(1)}%):</span>
                  <span className="font-semibold">+{formatCurrency(selectedOption.markup)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Final Total:</span>
                  <span className="text-primary">{formatCurrency(selectedOption.finalTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accommodation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Accommodation Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedOption.accommodations.map((acc, index) => (
                  <div key={acc.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{acc.hotelName}</h4>
                      <Badge variant="outline">{acc.city}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Room Type</p>
                        <p className="font-medium">{acc.roomType}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Nights</p>
                        <p className="font-medium">{acc.nights}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Rooms</p>
                        <p className="font-medium">{acc.numberOfRooms}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Cost</p>
                        <p className="font-semibold text-primary">{formatCurrency(acc.totalPrice)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Per Person Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Adult Pricing ({markupData.adults} travelers)
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Per Adult:</span>
                      <span className="font-medium">{formatCurrency(selectedOption.distribution.adultPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total for Adults:</span>
                      <span className="font-semibold">{formatCurrency(selectedOption.distribution.adultPrice * markupData.adults)}</span>
                    </div>
                  </div>
                </div>

                {markupData.children > 0 && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Child Pricing ({markupData.children} travelers)
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Per Child:</span>
                        <span className="font-medium">{formatCurrency(selectedOption.distribution.childPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total for Children:</span>
                        <span className="font-semibold">{formatCurrency(selectedOption.distribution.childPrice * markupData.children)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Grand Total:</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(selectedOption.finalTotal)}</span>
                </div>
                <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
                  <span>Average per person:</span>
                  <span>{formatCurrency(selectedOption.finalTotal / markupData.totalPax)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={onSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save Configuration
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => copyToClipboard(generatePricingSummaryText(), "Pricing summary")}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Summary
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={shareWhatsApp} className="gap-2">
                <Share className="h-4 w-4" />
                WhatsApp
              </Button>
              
              <Button variant="outline" onClick={shareEmail} className="gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Button>
              
              <Button variant="outline" onClick={() => window.print()} className="gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};