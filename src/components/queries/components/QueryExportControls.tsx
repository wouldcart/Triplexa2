import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchAllEnquiries } from '@/services/enquiriesService';
import { buildExportFilename, computeLastMonthRange, mapQueryToExportRow } from '@/utils/exportUtils';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

type Props = {
  search?: string;
  status?: string;
};

const QueryExportControls: React.FC<Props> = ({ search = '', status = 'all' }) => {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const triggerDownload = (filename: string, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportCurrent = async (format: 'csv' | 'xlsx') => {
    setExporting(true);
    try {
      const { data, count } = await fetchAllEnquiries({ search, filters: { status } });
      const rows = data.map(mapQueryToExportRow);
      const filename = buildExportFilename('current', format);
      if (format === 'csv') {
        const csv = Papa.unparse(rows);
        triggerDownload(filename, new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
      } else {
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Queries');
        const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        triggerDownload(filename, new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      }
      toast({ title: 'Export complete', description: `Exported ${count} enquiries as ${format.toUpperCase()}.` });
    } catch (e: any) {
      toast({ title: 'Export failed', description: e?.message || 'Unexpected error', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const exportLastMonth = async (format: 'csv' | 'xlsx') => {
    setExporting(true);
    try {
      const range = computeLastMonthRange(new Date());
      const { data, count } = await fetchAllEnquiries({ search, filters: { status, createdFrom: range.from, createdTo: range.to } });
      const rows = data.map(mapQueryToExportRow);
      const filename = buildExportFilename('last-month', format);
      if (format === 'csv') {
        const csv = Papa.unparse(rows);
        triggerDownload(filename, new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
      } else {
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Queries');
        const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        triggerDownload(filename, new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      }
      toast({ title: 'Export complete', description: `Exported ${count} enquiries from last month.` });
    } catch (e: any) {
      toast({ title: 'Export failed', description: e?.message || 'Unexpected error', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={exporting} className="gap-2">
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting…' : 'Export'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-background border-border">
          <DropdownMenuItem onClick={() => exportCurrent('csv')}>Export Current (CSV)</DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportCurrent('xlsx')}>Export Current (Excel)</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={exporting} className="gap-2">
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting…' : 'Last Month'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-background border-border">
          <DropdownMenuItem onClick={() => exportLastMonth('csv')}>Export Last Month (CSV)</DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportLastMonth('xlsx')}>Export Last Month (Excel)</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default QueryExportControls;