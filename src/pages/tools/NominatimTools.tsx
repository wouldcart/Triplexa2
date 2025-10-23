import React, { useEffect, useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AppSettingsService, SETTING_CATEGORIES } from '@/services/appSettingsService';

const NominatimTools: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AppSettingsService.getSettingValue(SETTING_CATEGORIES.INTEGRATIONS, 'nominatim_geocoding_enabled');
        setEnabled(String(raw) === 'true');
      } catch (e) {
        setEnabled(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <PageLayout
      title="Nominatim Geocoding Tools"
      breadcrumbItems={[{ title: 'Home', href: '/' }, { title: 'Tools', href: '/tools' }, { title: 'Nominatim', href: '/tools/nominatim' }]}
    >
      {loading ? (
        <div className="p-6">Loading...</div>
      ) : !enabled ? (
        <Alert>
          <AlertDescription>
            Nominatim geocoding is disabled by admin. Enable it in Settings → General → System Settings.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Search (Forward Geocoding)</CardTitle>
              <CardDescription>Find coordinates by place name</CardDescription>
            </CardHeader>
            <CardContent>
              <iframe
                title="Nominatim Search"
                src="https://nominatim.openstreetmap.org/ui/search.html"
                className="w-full h-[70vh] border rounded"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reverse Geocoding</CardTitle>
              <CardDescription>Find place details by coordinates</CardDescription>
            </CardHeader>
            <CardContent>
              <iframe
                title="Nominatim Reverse"
                src="https://nominatim.openstreetmap.org/ui/reverse.html"
                className="w-full h-[70vh] border rounded"
              />
            </CardContent>
          </Card>
        </div>
      )}
    </PageLayout>
  );
};

export default NominatimTools;