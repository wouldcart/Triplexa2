import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PricingConfigurationService } from '@/integrations/supabase/services/pricingConfigurationService';
import type { PricingConfigurationRow, PricingMarkupSlabRow } from '@/integrations/supabase/services/pricingConfigurationService';
import type { MarkupSlab } from '@/types/pricing';

const TestPricingCrud: React.FC = () => {
  const [defaultConfig, setDefaultConfig] = useState<PricingConfigurationRow | null>(null);
  const [createdSlab, setCreatedSlab] = useState<PricingMarkupSlabRow | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const log = (msg: string) => setLogs((prev) => [new Date().toLocaleTimeString() + ' — ' + msg, ...prev].slice(0, 200));

  const refreshDefault = async () => {
    try {
      const cfg = await PricingConfigurationService.getDefaultConfiguration();
      setDefaultConfig(cfg);
      log(`Loaded default config: ${cfg?.config_name ?? 'none'} (id=${cfg?.id ?? 'n/a'})`);
    } catch (err: any) {
      log(`Error loading default config: ${err.message ?? err}`);
    }
  };

  useEffect(() => {
    refreshDefault();
  }, []);

  const setDefaultTH = async () => {
    try {
      const row = await PricingConfigurationService.setDefaultConfiguration('TH', 'THB');
      setDefaultConfig(row);
      log(`Set default configuration to TH/THB (id=${row.id})`);
    } catch (err: any) {
      log(`Error setting default config: ${err.message ?? err}`);
    }
  };

  const listConfigs = async () => {
    try {
      const rows = await PricingConfigurationService.listConfigurations();
      log(`Configurations: ${rows.length} found. Names: ${rows.map(r => r.config_name).join(', ')}`);
    } catch (err: any) {
      log(`Error listing configurations: ${err.message ?? err}`);
    }
  };

  const listSlabs = async () => {
    try {
      if (!defaultConfig) return log('No default config loaded');
      const slabs = await PricingConfigurationService.listMarkupSlabs(defaultConfig.id);
      log(`Slabs: ${slabs.length} for config ${defaultConfig.config_name}.`);
    } catch (err: any) {
      log(`Error listing slabs: ${err.message ?? err}`);
    }
  };

  const createSlab = async () => {
    try {
      if (!defaultConfig) return log('No default config loaded');
      const slab: MarkupSlab = {
        id: 'temp',
        name: `Test Slab ${Date.now()}`,
        minAmount: 20000,
        maxAmount: 25000,
        markupType: 'percentage',
        markupValue: 12,
        currency: defaultConfig.base_currency ?? 'USD',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const row = await PricingConfigurationService.createMarkupSlab(defaultConfig.id, slab);
      setCreatedSlab(row);
      log(`Created slab id=${row.id}, name=${row.slab_name}`);
    } catch (err: any) {
      log(`Error creating slab: ${err.message ?? err}`);
    }
  };

  const updateSlab = async () => {
    try {
      if (!createdSlab) return log('No slab created yet');
      const updated = await PricingConfigurationService.updateMarkupSlab(createdSlab.id, {
        markupType: 'percentage',
        markupValue: (createdSlab.additional_percentage ?? 0) + 1,
      });
      setCreatedSlab(updated);
      log(`Updated slab id=${updated.id}, percentage=${updated.additional_percentage}`);
    } catch (err: any) {
      log(`Error updating slab: ${err.message ?? err}`);
    }
  };

  const toggleSlabActive = async () => {
    try {
      if (!createdSlab) return log('No slab created yet');
      const toggled = await PricingConfigurationService.updateMarkupSlabStatus(createdSlab.id, !createdSlab.is_active);
      setCreatedSlab(toggled);
      log(`Toggled slab id=${toggled.id} active=${toggled.is_active}`);
    } catch (err: any) {
      log(`Error toggling slab: ${err.message ?? err}`);
    }
  };

  const fetchSlabById = async () => {
    try {
      if (!createdSlab) return log('No slab created yet');
      const found = await PricingConfigurationService.getMarkupSlabById(createdSlab.id);
      log(`Fetched slab id=${found?.id}, name=${found?.slab_name}`);
    } catch (err: any) {
      log(`Error fetching slab: ${err.message ?? err}`);
    }
  };

  const deleteSlab = async () => {
    try {
      if (!createdSlab) return log('No slab created yet');
      await PricingConfigurationService.deleteMarkupSlab(createdSlab.id);
      log(`Deleted slab id=${createdSlab.id}`);
      setCreatedSlab(null);
    } catch (err: any) {
      log(`Error deleting slab: ${err.message ?? err}`);
    }
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Pricing CRUD Test</CardTitle>
          <CardDescription>Verify Supabase-backed configuration + slab CRUD operations end-to-end.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={refreshDefault}>Refresh Default</Button>
            <Button variant="outline" onClick={setDefaultTH}>Set Default TH/THB</Button>
            <Button variant="outline" onClick={listConfigs}>List Configurations</Button>
            <Button variant="outline" onClick={listSlabs} disabled={!defaultConfig}>List Slabs</Button>
            <Button onClick={createSlab} disabled={!defaultConfig}>Create Test Slab</Button>
            <Button onClick={updateSlab} disabled={!createdSlab}>Update Test Slab</Button>
            <Button variant="secondary" onClick={toggleSlabActive} disabled={!createdSlab}>Toggle Active</Button>
            <Button variant="outline" onClick={fetchSlabById} disabled={!createdSlab}>Fetch By Id</Button>
            <Button variant="destructive" onClick={deleteSlab} disabled={!createdSlab}>Delete Test Slab</Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Default Config: {defaultConfig ? `${defaultConfig.config_name} (${defaultConfig.base_currency})` : 'not loaded'}</p>
            <p className="text-sm text-muted-foreground">Created Slab: {createdSlab ? `${createdSlab.slab_name} [${createdSlab.id}]` : 'none'}</p>
          </div>

          <Textarea value={logs.join('\n')} readOnly rows={12} className="w-full font-mono text-xs" />
        </CardContent>
      </Card>
    </div>
  );
};

export default TestPricingCrud;