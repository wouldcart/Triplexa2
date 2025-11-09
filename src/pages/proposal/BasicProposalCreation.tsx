
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Send, Eye, FileText, Plus, Search, Calculator, Package, Trash2 } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { Query } from '@/types/query';
import ProposalService from '@/services/proposalService';
import { useToast } from '@/hooks/use-toast';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { useInventoryData } from '@/pages/queries/hooks/useInventoryData';
import { formatCurrency } from '@/lib/formatters';
import BasicInventorySelector from '@/components/proposal/basic/BasicInventorySelector';
import BasicPricingControls from '@/components/proposal/basic/BasicPricingControls';
import BasicProposalSummary from '@/components/proposal/basic/BasicProposalSummary';
import BasicPackageTemplates from '@/components/proposal/basic/BasicPackageTemplates';

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

const BasicProposalCreation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [query, setQuery] = useState<Query | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<BasicProposalItem[]>([]);
  const [globalMarkup, setGlobalMarkup] = useState(10);
  const [activeTab, setActiveTab] = useState('templates');
  
  const { hotels, restaurants, sightseeing, transportRoutes, currency, currencySymbol } = useInventoryData();

  useEffect(() => {
    const loadQuery = async () => {
      try {
        if (!id) {
          throw new Error('Query ID not provided');
        }

        const queryData = await ProposalService.getQueryByIdAsync(id);
        if (!queryData) {
          throw new Error(`Query with ID ${id} not found`);
        }

        setQuery(queryData);
      } catch (error) {
        console.error('Error loading query:', error);
        toast({
          title: "Error loading query",
          description: error instanceof Error ? error.message : "Failed to load query details",
          variant: "destructive"
        });
        setTimeout(() => navigate('/queries'), 2000);
      } finally {
        setLoading(false);
      }
    };

    loadQuery();
  }, [id, navigate, toast]);

  const addItem = (item: Omit<BasicProposalItem, 'id' | 'finalPrice'>) => {
    const newItem: BasicProposalItem = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      finalPrice: item.basePrice * item.quantity * (1 + item.markup / 100)
    };
    setSelectedItems(prev => [...prev, newItem]);
    
    toast({
      title: "Item Added",
      description: `${item.name} has been added to the proposal`,
    });
  };

  const removeItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
    toast({
      title: "Item Removed",
      description: "Item has been removed from the proposal",
    });
  };

  const updateItemPricing = (itemId: string, markup: number, quantity: number) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          markup,
          quantity,
          finalPrice: item.basePrice * quantity * (1 + markup / 100)
        };
      }
      return item;
    }));
  };

  const applyGlobalMarkup = () => {
    setSelectedItems(prev => prev.map(item => ({
      ...item,
      markup: globalMarkup,
      finalPrice: item.basePrice * item.quantity * (1 + globalMarkup / 100)
    })));
    
    toast({
      title: "Markup Applied",
      description: `${globalMarkup}% markup applied to all items`,
    });
  };

  const loadTemplate = (templateItems: BasicProposalItem[]) => {
    setSelectedItems(templateItems);
    setActiveTab('inventory');
    
    toast({
      title: "Template Loaded",
      description: `Template with ${templateItems.length} items has been loaded`,
    });
  };

  const calculateTotals = () => {
    const subtotal = selectedItems.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
    const markupAmount = selectedItems.reduce((sum, item) => sum + (item.basePrice * item.quantity * item.markup / 100), 0);
    const total = selectedItems.reduce((sum, item) => sum + item.finalPrice, 0);
    
    return { subtotal, markupAmount, total };
  };

  const saveProposal = () => {
    const proposalData = {
      queryId: query?.id,
      query,
      items: selectedItems,
      totals: calculateTotals(),
      createdAt: new Date().toISOString(),
      type: 'basic'
    };
    
    localStorage.setItem(`basic_proposal_${query?.id}`, JSON.stringify(proposalData));
    
    toast({
      title: "Proposal Saved",
      description: "Your basic proposal has been saved as draft",
    });
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h2 className="text-xl font-semibold">Loading Query Details...</h2>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!query) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center text-red-600">Query Not Found</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                The query with ID "{id}" could not be found.
              </p>
              <Button onClick={() => navigate('/queries')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Queries
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const breadcrumbItems = [
    { label: 'Queries', href: '/queries' },
    { label: query.id, href: `/queries/${query.id}` },
    { label: 'Basic Proposal', icon: FileText }
  ];

  const totals = calculateTotals();

  return (
    <PageLayout>
      <div className="space-y-6">
        <Breadcrumb items={breadcrumbItems} />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/queries/${encodeURIComponent(query.id)}`)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Query
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600" />
                Basic Proposal Builder
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">Query: {query.id}</Badge>
                <Badge variant="secondary">{query.destination.country}</Badge>
                <Badge variant="outline">
                  {query.paxDetails.adults + query.paxDetails.children} PAX
                </Badge>
                <Badge variant="outline">
                  {selectedItems.length} Items
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={saveProposal}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Generate Proposal
            </Button>
          </div>
        </div>

        {/* Query Summary */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Query Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-blue-700">Destination</p>
                <p className="text-sm text-blue-600">{query.destination.country}</p>
                <p className="text-xs text-blue-500">{query.destination.cities.join(', ')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Travel Dates</p>
                <p className="text-sm text-blue-600">
                  {new Date(query.travelDates.from).toLocaleDateString()} - {new Date(query.travelDates.to).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Travelers</p>
                <p className="text-sm text-blue-600">
                  {query.paxDetails.adults} Adults
                  {query.paxDetails.children > 0 && `, ${query.paxDetails.children} Children`}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Package Type</p>
                <p className="text-sm text-blue-600 capitalize">{query.packageType}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="inventory">Add Items</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="templates" className="mt-4">
                <BasicPackageTemplates 
                  query={query}
                  onLoadTemplate={loadTemplate}
                  currencySymbol={currencySymbol}
                />
              </TabsContent>

              <TabsContent value="inventory" className="mt-4">
                <BasicInventorySelector
                  query={query}
                  hotels={hotels}
                  restaurants={restaurants}
                  sightseeing={sightseeing}
                  transportRoutes={transportRoutes}
                  onAddItem={addItem}
                  currencySymbol={currencySymbol}
                />
              </TabsContent>

              <TabsContent value="pricing" className="mt-4">
                <BasicPricingControls
                  selectedItems={selectedItems}
                  globalMarkup={globalMarkup}
                  onGlobalMarkupChange={setGlobalMarkup}
                  onApplyGlobalMarkup={applyGlobalMarkup}
                  onUpdateItemPricing={updateItemPricing}
                  onRemoveItem={removeItem}
                  currencySymbol={currencySymbol}
                />
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <BasicProposalSummary
                  query={query}
                  selectedItems={selectedItems}
                  totals={totals}
                  currencySymbol={currencySymbol}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Pricing Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal:</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(totals.subtotal)} {currencySymbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Markup:</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(totals.markupAmount)} {currencySymbol}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(totals.total)} {currencySymbol}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Per person: {formatCurrency(totals.total / (query.paxDetails.adults + query.paxDetails.children))} {currencySymbol}
                </div>
              </CardContent>
            </Card>

            {selectedItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Selected Items ({selectedItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 border rounded text-sm">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(item.finalPrice)} {currencySymbol}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItem(item.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default BasicProposalCreation;
