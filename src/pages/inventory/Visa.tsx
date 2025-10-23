import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { VisaService, EnhancedVisa } from '@/services/visaService';

const VisaPage = () => {
  // Basic state
  const [visas, setVisas] = useState<EnhancedVisa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Data fetching
  const fetchVisas = async () => {
    try {
      setLoading(true);
      const response = await VisaService.getAllVisas();
      // Ensure we store an array; service returns { visas, total }
      setVisas(response.data?.visas || []);
    } catch (error) {
      console.error('Error fetching visas:', error);
      toast({
        title: "Error",
        description: "Failed to fetch visas",
        variant: "destructive",
      });
      // Defensive fallback to keep UI stable
      setVisas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisas();
  }, []);

  // Form handling
  const handleAddVisa = () => {
    navigate('/inventory/visa/add');
  };

  const handleEditVisa = (visa: EnhancedVisa) => {
    navigate(`/inventory/visa/${visa.id}/edit`);
  };

  const handleViewVisa = (visa: EnhancedVisa) => {
    navigate(`/inventory/visa/${visa.id}/view`);
  };

  const handleDeleteVisa = async (id: string) => {
    try {
      await VisaService.deleteVisa(id);
      toast({ title: 'Deleted', description: 'Visa deleted successfully.' });
      fetchVisas();
    } catch (error) {
      console.error('Error deleting visa:', error);
      toast({ title: 'Error', description: 'Failed to delete visa.', variant: 'destructive' });
    }
  };

  return (
    <PageLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visa Management</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage visa information for different countries</p>
          </div>
          <Button className="flex items-center gap-2" onClick={handleAddVisa}>
            <Plus className="h-4 w-4" />
            Add Visa
          </Button>
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Visa Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Visa Type</TableHead>
                  <TableHead>Processing Time</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Loading visas...
                    </TableCell>
                  </TableRow>
                ) : visas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No visas found
                    </TableCell>
                  </TableRow>
                ) : (
                  (Array.isArray(visas) ? visas.filter(visa =>
                    visa.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    visa.visa_type.toLowerCase().includes(searchQuery.toLowerCase())
                  ) : [])
                    .map((visa) => (
                      <TableRow key={visa.id}>
                        <TableCell className="font-medium">{visa.country}</TableCell>
                        <TableCell>{visa.visa_type}</TableCell>
                        <TableCell>{visa.processing_time}</TableCell>
                        <TableCell>${visa.price}</TableCell>
                        <TableCell>
                          <Badge variant={visa.status === 'active' ? "default" : "secondary"}>
                            {visa.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewVisa(visa)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditVisa(visa)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteVisa(visa.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </CardContent>
         </Card>

         {/* Add Visa modal removed; use /inventory/visa/add page */}

         {/* View Visa modal removed; use /inventory/visa/:id/view page */}

         {/* Edit Visa modal removed; use /inventory/visa/:id/edit page */}
       </div>
     </PageLayout>
   );
 };

export default VisaPage;
