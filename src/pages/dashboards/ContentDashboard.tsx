
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Image, 
  FileText, 
  DollarSign, 
  Globe, 
  Camera,
  Upload,
  Edit,
  Eye,
  Star
} from 'lucide-react';
import { useAccessControl } from '@/hooks/use-access-control';

const ContentDashboard: React.FC = () => {
  const { canAccessModule } = useAccessControl();

  if (!canAccessModule('content-dashboard')) {
    return (
      <PageLayout title="Access Denied">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">You don't have access to this dashboard.</p>
        </div>
      </PageLayout>
    );
  }

  const contentStats = {
    totalPackages: 156,
    activePackages: 134,
    draftPackages: 22,
    totalDestinations: 45
  };

  const recentPackages = [
    { id: 1, title: 'Golden Triangle Tour', status: 'Active', destinations: 3, price: '₹25,000' },
    { id: 2, title: 'Kerala Backwaters', status: 'Draft', destinations: 5, price: '₹35,000' },
    { id: 3, title: 'Rajasthan Heritage', status: 'Review', destinations: 7, price: '₹45,000' }
  ];

  return (
    <PageLayout
      title="Content Dashboard"
      breadcrumbItems={[
        { title: "Home", href: "/" },
        { title: "Content Dashboard", href: "/dashboards/content" },
      ]}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Package & Content Manager Dashboard</h2>
            <p className="text-muted-foreground">Manage travel packages, inventory, and destination content</p>
          </div>
          <div className="flex gap-2">
            <Button>
              <Package className="mr-2 h-4 w-4" />
              New Package
            </Button>
          </div>
        </div>

        {/* Content Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{contentStats.totalPackages}</div>
              <p className="text-xs text-muted-foreground">All packages</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Packages</CardTitle>
              <Eye className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{contentStats.activePackages}</div>
              <p className="text-xs text-muted-foreground">Live packages</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft Packages</CardTitle>
              <Edit className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{contentStats.draftPackages}</div>
              <p className="text-xs text-muted-foreground">In development</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Destinations</CardTitle>
              <Globe className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{contentStats.totalDestinations}</div>
              <p className="text-xs text-muted-foreground">Available destinations</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="packages" className="space-y-4">
          <TabsList>
            <TabsTrigger value="packages">
              <Package className="mr-2 h-4 w-4" />
              Package Builder
            </TabsTrigger>
            <TabsTrigger value="inventory">
              <Star className="mr-2 h-4 w-4" />
              Inventory Management
            </TabsTrigger>
            <TabsTrigger value="content">
              <FileText className="mr-2 h-4 w-4" />
              Content Library
            </TabsTrigger>
            <TabsTrigger value="pricing">
              <DollarSign className="mr-2 h-4 w-4" />
              Pricing Matrix
            </TabsTrigger>
          </TabsList>

          <TabsContent value="packages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Packages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentPackages.map((pkg) => (
                    <div key={pkg.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{pkg.title}</p>
                          <p className="text-sm text-muted-foreground">{pkg.destinations} destinations • {pkg.price}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          pkg.status === 'Active' ? 'default' : 
                          pkg.status === 'Draft' ? 'secondary' : 'outline'
                        }>
                          {pkg.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Management Hub</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-6 border rounded-lg">
                    <Star className="h-8 w-8 mx-auto mb-3 text-yellow-500" />
                    <h3 className="font-medium mb-2">Hotels</h3>
                    <p className="text-sm text-muted-fore ground mb-4">Manage hotel inventory</p>
                    <Button variant="outline" size="sm">Manage Hotels</Button>
                  </div>
                  <div className="text-center p-6 border rounded-lg">
                    <Globe className="h-8 w-8 mx-auto mb-3 text-blue-500" />
                    <h3 className="font-medium mb-2">Sightseeing</h3>
                    <p className="text-sm text-muted-foreground mb-4">Manage attractions</p>
                    <Button variant="outline" size="sm">Manage Sightseeing</Button>
                  </div>
                  <div className="text-center p-6 border rounded-lg">
                    <Package className="h-8 w-8 mx-auto mb-3 text-green-500" />
                    <h3 className="font-medium mb-2">Transport</h3>
                    <p className="text-sm text-muted-foreground mb-4">Manage transport options</p>
                    <Button variant="outline" size="sm">Manage Transport</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Content Management System</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center p-6 border rounded-lg">
                    <Upload className="h-8 w-8 mx-auto mb-3 text-blue-500" />
                    <h3 className="font-medium mb-2">Document Upload</h3>
                    <p className="text-sm text-muted-foreground mb-4">Upload PDFs, images, and content</p>
                    <Button variant="outline">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Files
                    </Button>
                  </div>
                  <div className="text-center p-6 border rounded-lg">
                    <Camera className="h-8 w-8 mx-auto mb-3 text-purple-500" />
                    <h3 className="font-medium mb-2">Image Gallery</h3>
                    <p className="text-sm text-muted-foreground mb-4">Manage destination images</p>
                    <Button variant="outline">
                      <Image className="mr-2 h-4 w-4" />
                      Manage Gallery
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dynamic Pricing Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Per-pax/per-group pricing with seasonal adjustments</p>
                  <Button className="mt-4">
                    Configure Pricing
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col">
                <Package className="h-6 w-6 mb-2" />
                New Package
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <Upload className="h-6 w-6 mb-2" />
                Bulk Upload
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <Eye className="h-6 w-6 mb-2" />
                Preview Mode
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <Globe className="h-6 w-6 mb-2" />
                Add Destination
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default ContentDashboard;
