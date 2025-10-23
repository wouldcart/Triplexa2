import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CentralItinerary } from '@/types/itinerary';
import { Query } from '@/types/query';
import { formatCurrency } from '@/lib/formatters';
import ProposalService from '@/services/proposalService';
import { 
  FileText, Send, Download, Eye, Calendar, MapPin, 
  Users, DollarSign, Hotel, Car, Camera, Utensils,
  Clock, CheckCircle
} from 'lucide-react';

interface DayByDayProposalCreatorProps {
  query: Query;
  itinerary: CentralItinerary;
  onProposalCreated?: (proposalId: string) => void;
}

export const DayByDayProposalCreator: React.FC<DayByDayProposalCreatorProps> = ({
  query,
  itinerary,
  onProposalCreated
}) => {
  const { toast } = useToast();
  const [proposalTitle, setProposalTitle] = useState(`${query.destination.cities.join(', ')} - ${itinerary.duration.days} Day Package`);
  const [proposalDescription, setProposalDescription] = useState('');
  const [markupType, setMarkupType] = useState<'percentage' | 'fixed'>('percentage');
  const [markupValue, setMarkupValue] = useState(15);
  const [isCreating, setIsCreating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const calculateTotalCost = () => {
    return itinerary.days.reduce((total, day) => total + day.totalCost, 0);
  };

  const calculateFinalPrice = () => {
    const baseCost = calculateTotalCost();
    if (markupType === 'percentage') {
      return baseCost + (baseCost * markupValue / 100);
    } else {
      return baseCost + markupValue;
    }
  };

  const generateProposalModules = () => {
    return itinerary.days.map(day => ({
      id: `day-${day.day}`,
      type: 'transport' as const, // Using a valid ModuleType from the enum
      name: `Day ${day.day} - ${day.location.city}`,
      category: 'itinerary',
      data: {
        dayNumber: day.day,
        date: day.date,
        location: day.location,
        accommodation: day.accommodation,
        transport: day.transport || [],
        activities: day.activities,
        meals: day.meals,
        notes: day.notes
      },
      pricing: {
        basePrice: day.totalCost,
        finalPrice: day.totalCost,
        currency: 'USD',
        breakdown: {
          accommodation: day.accommodation?.price || 0,
          transport: day.transport?.reduce((sum, t) => sum + t.price, 0) || 0,
          activities: day.activities.reduce((sum, a) => sum + a.price, 0),
          meals: day.meals.reduce((sum, m) => sum + m.price, 0)
        }
      },
      status: 'active' as const,
      metadata: {
        supplier: 'Internal',
        confirmationRequired: false,
        tags: ['day-by-day', 'itinerary', day.location.city.toLowerCase()]
      }
    }));
  };

  const handleCreateProposal = async () => {
    try {
      setIsCreating(true);
      
      const baseCost = calculateTotalCost();
      const finalPrice = calculateFinalPrice();
      const modules = generateProposalModules();

      const proposalData = {
        queryId: query.id,
        query: query,
        modules: modules,
        totals: {
          subtotal: baseCost,
          discountAmount: 0,
          total: finalPrice,
          moduleCount: modules.length
        },
        metadata: {
          status: 'draft' as const,
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      const proposalId = ProposalService.saveProposal(proposalData);
      
      toast({
        title: "Proposal Created Successfully",
        description: `Day-by-day proposal with ${modules.length} days has been created.`
      });

      if (onProposalCreated) {
        onProposalCreated(proposalId);
      }

    } catch (error) {
      console.error('Error creating proposal:', error);
      toast({
        title: "Error Creating Proposal",
        description: "Failed to create the proposal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const baseCost = calculateTotalCost();
  const finalPrice = calculateFinalPrice();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Create Day-by-Day Proposal
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Generate a detailed proposal based on your itinerary
              </p>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {itinerary.duration.days} Days
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Proposal Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Proposal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Proposal Title</label>
            <Input
              value={proposalTitle}
              onChange={(e) => setProposalTitle(e.target.value)}
              placeholder="Enter proposal title"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={proposalDescription}
              onChange={(e) => setProposalDescription(e.target.value)}
              placeholder="Add a description for this proposal..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Markup Type</label>
              <Select value={markupType} onValueChange={(value: 'percentage' | 'fixed') => setMarkupType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Markup Value {markupType === 'percentage' ? '(%)' : '($)'}
              </label>
              <Input
                type="number"
                value={markupValue}
                onChange={(e) => setMarkupValue(Number(e.target.value))}
                min="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Base Cost</span>
              <span className="font-medium">{formatCurrency(baseCost)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">
                Markup ({markupType === 'percentage' ? `${markupValue}%` : formatCurrency(markupValue)})
              </span>
              <span className="font-medium">
                {formatCurrency(markupType === 'percentage' ? (baseCost * markupValue / 100) : markupValue)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Final Price</span>
              <span className="text-green-600">{formatCurrency(finalPrice)}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Per person: {formatCurrency(finalPrice / (query.paxDetails.adults + query.paxDetails.children))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Itinerary Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Itinerary Overview</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
          </div>
        </CardHeader>
        {showPreview && (
          <CardContent>
            <div className="space-y-4">
              {itinerary.days.map((day) => (
                <div key={day.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Day {day.day} - {day.location.city}</h4>
                    <Badge variant="outline">{formatCurrency(day.totalCost)}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {day.accommodation && (
                      <div className="flex items-center gap-2">
                        <Hotel className="h-4 w-4 text-blue-500" />
                        <span>Hotel</span>
                      </div>
                    )}
                    {day.transport && day.transport.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-green-500" />
                        <span>{day.transport.length} Transport(s)</span>
                      </div>
                    )}
                    {day.activities.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4 text-orange-500" />
                        <span>{day.activities.length} Activity(ies)</span>
                      </div>
                    )}
                    {day.meals.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Utensils className="h-4 w-4 text-purple-500" />
                        <span>{day.meals.length} Meal(s)</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={handleCreateProposal}
          disabled={isCreating || !proposalTitle.trim()}
          className="flex-1"
        >
          {isCreating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating Proposal...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Create Day-by-Day Proposal
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
