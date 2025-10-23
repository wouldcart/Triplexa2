
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CentralItinerary } from '@/types/itinerary';
import { Query } from '@/types/query';
import { Download, FileText, Mail, Printer, File, Database } from 'lucide-react';

interface ItineraryExportProps {
  itinerary: CentralItinerary;
  query: Query;
}

export const ItineraryExport: React.FC<ItineraryExportProps> = ({
  itinerary,
  query
}) => {
  const handleExportPDF = () => {
    console.log('Exporting as PDF...');
    // PDF export functionality will be implemented here
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify({ itinerary, query }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `itinerary_${query.destination.country}_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleExportCSV = () => {
    // Create CSV content
    let csvContent = 'Day,Date,Location,Activity,Type,Time,Price\n';
    
    itinerary.days.forEach((day) => {
      day.activities.forEach((activity) => {
        csvContent += `${day.day},"${day.date}","${activity.location.name}","${activity.name}","${activity.type}","${activity.startTime} - ${activity.endTime}",${activity.price}\n`;
      });
      
      day.meals.forEach((meal) => {
        csvContent += `${day.day},"${day.date}","${meal.location.name}","${meal.restaurant} (${meal.type})","dining","${meal.time}",${meal.price}\n`;
      });
    });
    
    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    const exportFileDefaultName = `itinerary_${query.destination.country}_${new Date().toISOString().split('T')[0]}.csv`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleExportText = () => {
    // Create text content
    let textContent = `ITINERARY: ${itinerary.title}\n`;
    textContent += `Destination: ${query.destination.cities.join(', ')}, ${query.destination.country}\n`;
    textContent += `Duration: ${itinerary.duration.days} days, ${itinerary.duration.nights} nights\n`;
    textContent += `Travelers: ${query.paxDetails.adults + query.paxDetails.children + query.paxDetails.infants} people\n`;
    textContent += `Total Price: $${itinerary.pricing.finalPrice.toFixed(2)}\n`;
    textContent += `\n${'='.repeat(50)}\n\n`;
    
    itinerary.days.forEach((day) => {
      textContent += `DAY ${day.day} - ${day.date}\n`;
      textContent += `Location: ${day.location.name}\n`;
      textContent += `${'-'.repeat(30)}\n`;
      
      if (day.activities.length > 0) {
        textContent += 'ACTIVITIES:\n';
        day.activities.forEach((activity) => {
          textContent += `• ${activity.name} (${activity.type})\n`;
          textContent += `  Time: ${activity.startTime} - ${activity.endTime}\n`;
          textContent += `  Location: ${activity.location.name}\n`;
          textContent += `  Price: $${activity.price}\n\n`;
        });
      }
      
      if (day.meals.length > 0) {
        textContent += 'MEALS:\n';
        day.meals.forEach((meal) => {
          textContent += `• ${meal.restaurant} (${meal.type})\n`;
          textContent += `  Time: ${meal.time}\n`;
          textContent += `  Cuisine: ${meal.cuisine}\n`;
          textContent += `  Price: $${meal.price}\n\n`;
        });
      }
      
      textContent += `Day Total: $${day.totalCost}\n`;
      textContent += `\n${'='.repeat(50)}\n\n`;
    });
    
    const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(textContent);
    const exportFileDefaultName = `itinerary_${query.destination.country}_${new Date().toISOString().split('T')[0]}.txt`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleEmailExport = () => {
    console.log('Sending via email...');
    // Email functionality will be implemented here
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Export Itinerary</h3>
        <p className="text-muted-foreground">
          Export your itinerary in various formats
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              PDF Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate a professional PDF document with your complete itinerary.
            </p>
            <Button onClick={handleExportPDF} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              CSV Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export as CSV file for use in spreadsheet applications.
            </p>
            <Button onClick={handleExportCSV} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              Text Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export as plain text file for easy reading and sharing.
            </p>
            <Button onClick={handleExportText} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Text
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              JSON Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export raw data for backup or integration with other systems.
            </p>
            <Button onClick={handleExportJSON} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download JSON
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send the itinerary directly to the client's email.
            </p>
            <Button onClick={handleEmailExport} variant="outline" className="w-full">
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Print
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Print the itinerary for physical delivery.
            </p>
            <Button onClick={handlePrint} variant="outline" className="w-full">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Destination:</span>
              <span>{query.destination.cities.join(', ')}, {query.destination.country}</span>
            </div>
            <div className="flex justify-between">
              <span>Duration:</span>
              <span>{itinerary.duration.days} days, {itinerary.duration.nights} nights</span>
            </div>
            <div className="flex justify-between">
              <span>Travelers:</span>
              <span>{query.paxDetails.adults + query.paxDetails.children + query.paxDetails.infants} people</span>
            </div>
            <div className="flex justify-between">
              <span>Total Price:</span>
              <span>${itinerary.pricing.finalPrice.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
