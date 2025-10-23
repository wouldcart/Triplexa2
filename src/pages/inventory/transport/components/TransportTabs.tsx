
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from '@/components/ui/card';
import TransportRoutesTab from './routes/TransportRoutesTab';
import TransportTypesTab from './types/TransportTypesTab';
import LocationCodesManager from './locationCodes/LocationCodesManager';
import TransportErrorBoundary from '@/components/error/TransportErrorBoundary';

const TransportTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState("routes");

  return (
    <Tabs defaultValue="routes" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="mb-4 mt-2">
        <h1 className="text-2xl font-bold mb-2">Transport Management</h1>
        <p className="text-sm text-muted-foreground">Manage transport routes, types, and location codes</p>
      </div>
      <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
        <TabsTrigger value="routes">Routes</TabsTrigger>
        <TabsTrigger value="types">Transport Types</TabsTrigger>
        <TabsTrigger value="locations">Location Codes</TabsTrigger>
      </TabsList>
      <Card className="p-4">
        <TabsContent value="routes" className="mt-0">
          <TransportErrorBoundary>
            <TransportRoutesTab />
          </TransportErrorBoundary>
        </TabsContent>
        <TabsContent value="types" className="mt-0">
          <TransportTypesTab />
        </TabsContent>
        <TabsContent value="locations" className="mt-0">
          <LocationCodesManager />
        </TabsContent>
      </Card>
    </Tabs>
  );
};

export default TransportTabs;
