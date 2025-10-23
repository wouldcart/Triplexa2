import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSupabaseHotelsData } from '../hooks/useSupabaseHotelsData';
import { importThailandLuxuryHotels } from '../utils/sampleDataImporter';
import { toast } from 'sonner';
import { Download, MapPin, Star, Building } from 'lucide-react';

const SampleDataImporter: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const { addHotel } = useSupabaseHotelsData();

  const handleImportSampleData = async () => {
    setIsImporting(true);
    try {
      const importedHotels = importThailandLuxuryHotels(addHotel);
      
      toast.success(
        `Successfully imported ${importedHotels.length} luxury hotels for Thailand!`,
        {
          description: 'Hotels have been added with THB pricing and luxury amenities'
        }
      );
    } catch (error) {
      console.error('Failed to import sample data:', error);
      toast.error('Failed to import sample data. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const sampleHotelsInfo = [
    { city: 'Bangkok', count: 2, hotels: ['The Oriental Residence', 'Shangri-La Bangkok'] },
    { city: 'Phuket', count: 2, hotels: ['Amanpuri', 'Banyan Tree'] },
    { city: 'Chiang Mai', count: 1, hotels: ['Four Seasons Resort'] },
    { city: 'Krabi', count: 1, hotels: ['Rayavadee Resort'] },
    { city: 'Koh Samui', count: 1, hotels: ['Six Senses Samui'] }
  ];

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          <CardTitle>Import Thailand Luxury Hotels</CardTitle>
        </div>
        <CardDescription>
          Import sample luxury hotel data for Thailand with THB pricing and comprehensive room types
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sampleHotelsInfo.map((city) => (
            <div key={city.city} className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{city.city}</span>
                <Badge variant="secondary">{city.count} hotels</Badge>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {city.hotels.map((hotel) => (
                  <li key={hotel} className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {hotel}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Building className="h-4 w-4" />
            What's Included:
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• 7 luxury hotels (5-star rating)</li>
            <li>• All pricing in Thai Baht (THB) with ฿ symbol</li>
            <li>• 3 room types per hotel (Deluxe, Suite, Villa)</li>
            <li>• Comprehensive amenities and facilities</li>
            <li>• Real hotel brands and authentic locations</li>
            <li>• Adult/child pricing with extra bed options</li>
          </ul>
        </div>

        <Button 
          onClick={handleImportSampleData}
          disabled={isImporting}
          className="w-full"
          size="lg"
        >
          {isImporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Importing Hotels...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Import 7 Thailand Luxury Hotels
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          This will add sample hotels to your inventory. You can edit or delete them later.
        </p>
      </CardContent>
    </Card>
  );
};

export default SampleDataImporter;