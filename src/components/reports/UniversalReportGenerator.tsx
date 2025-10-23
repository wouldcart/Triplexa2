import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { 
  Download, 
  Calendar as CalendarIcon, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Table, 
  Settings, 
  Send,
  Plus,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { universalPDFService } from '@/services/universalPDFService';

export interface ReportConfig {
  type: 'staff_performance' | 'financial' | 'operational' | 'sales' | 'custom';
  dateRange: [Date, Date];
  filters: Record<string, any>;
  format: 'pdf' | 'excel' | 'csv' | 'dashboard';
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  };
}

interface ReportWidget {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'text';
  title: string;
  config: any;
  position: { x: number; y: number; w: number; h: number };
}

interface ChartConfig {
  chartType: 'bar' | 'line' | 'pie' | 'area';
  dataSource: string;
  xAxis: string;
  yAxis: string;
  groupBy?: string;
}

const UniversalReportGenerator: React.FC = () => {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: 'custom',
    dateRange: [new Date(), new Date()],
    filters: {},
    format: 'dashboard'
  });

  const [widgets, setWidgets] = useState<ReportWidget[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');

  // Available data sources for reports
  const dataSources = [
    { value: 'staff_performance', label: 'Staff Performance' },
    { value: 'sales_data', label: 'Sales Data' },
    { value: 'financial_metrics', label: 'Financial Metrics' },
    { value: 'operational_data', label: 'Operational Data' },
    { value: 'customer_data', label: 'Customer Data' }
  ];

  // Widget templates
  const widgetTemplates = [
    { type: 'chart', icon: BarChart3, label: 'Bar Chart' },
    { type: 'chart', icon: LineChart, label: 'Line Chart' },
    { type: 'chart', icon: PieChart, label: 'Pie Chart' },
    { type: 'table', icon: Table, label: 'Data Table' },
    { type: 'metric', icon: BarChart3, label: 'Key Metric' }
  ];

  const addWidget = useCallback((type: string) => {
    const newWidget: ReportWidget = {
      id: `widget_${Date.now()}`,
      type: type as any,
      title: `New ${type}`,
      config: type === 'chart' ? {
        chartType: 'bar',
        dataSource: 'staff_performance',
        xAxis: 'date',
        yAxis: 'value'
      } : {},
      position: { x: 0, y: 0, w: 6, h: 4 }
    };
    setWidgets(prev => [...prev, newWidget]);
  }, []);

  const updateWidget = useCallback((id: string, updates: Partial<ReportWidget>) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === id ? { ...widget, ...updates } : widget
    ));
  }, []);

  const deleteWidget = useCallback((id: string) => {
    setWidgets(prev => prev.filter(widget => widget.id !== id));
    if (selectedWidget === id) {
      setSelectedWidget(null);
    }
  }, [selectedWidget]);

  const generateReport = useCallback(async () => {
    try {
      if (reportConfig.format === 'pdf') {
        // Generate PDF using UniversalPDFService
        const reportData = {
          title: `${reportConfig.type.replace('_', ' ').toUpperCase()} Report`,
          dateRange: reportConfig.dateRange,
          widgets: widgets,
          filters: reportConfig.filters,
          generatedAt: new Date(),
          // Sample data for demonstration
          metrics: [
            { label: 'Total Revenue', value: '$125,430' },
            { label: 'Active Users', value: '2,847' },
            { label: 'Conversion Rate', value: '3.2%' },
            { label: 'Growth Rate', value: '+12.5%' }
          ],
          chartData: Array.from({ length: 7 }, (_, i) => ({
            date: format(new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000), 'MMM dd'),
            value: Math.floor(Math.random() * 100) + 50
          })),
          tableData: [
            { name: 'Service A', quantity: 15, price: 1200 },
            { name: 'Service B', quantity: 8, price: 800 },
            { name: 'Service C', quantity: 22, price: 2200 }
          ]
        };

        const pdfBlob = await universalPDFService.generatePDF('business-proposal', reportData);
        const filename = `${reportConfig.type}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        universalPDFService.downloadPDF(pdfBlob, filename);
        
        toast({
          title: "PDF Report Generated",
          description: "Your PDF report has been generated and downloaded successfully."
        });
      } else {
        // Simulate other format generation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        toast({
          title: "Report Generated",
          description: `${reportConfig.format.toUpperCase()} report has been generated successfully.`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    }
  }, [reportConfig, widgets]);

  const scheduleReport = useCallback(async () => {
    if (!reportConfig.schedule || recipients.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please configure schedule settings and add recipients.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Simulate scheduling
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Report Scheduled",
        description: `Report will be sent ${reportConfig.schedule.frequency} to ${recipients.length} recipients.`
      });
      setIsScheduleOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule report. Please try again.",
        variant: "destructive"
      });
    }
  }, [reportConfig.schedule, recipients]);

  const addRecipient = useCallback(() => {
    if (newRecipient && !recipients.includes(newRecipient)) {
      setRecipients(prev => [...prev, newRecipient]);
      setNewRecipient('');
    }
  }, [newRecipient, recipients]);

  const removeRecipient = useCallback((email: string) => {
    setRecipients(prev => prev.filter(r => r !== email));
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Universal Report Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="builder" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="builder">Report Builder</TabsTrigger>
              <TabsTrigger value="data">Data Sources</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>

            <TabsContent value="builder" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Widget Templates */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-sm">Add Widgets</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {widgetTemplates.map((template, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => addWidget(template.type)}
                      >
                        <template.icon className="h-4 w-4 mr-2" />
                        {template.label}
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                {/* Report Canvas */}
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="text-sm">Report Canvas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="min-h-[400px] border-2 border-dashed border-gray-200 rounded-lg p-4">
                      {widgets.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Drag widgets here to build your report</p>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-12 gap-4">
                          {widgets.map((widget) => (
                            <Card 
                              key={widget.id}
                              className={`col-span-${widget.position.w} cursor-pointer transition-all ${
                                selectedWidget === widget.id ? 'ring-2 ring-blue-500' : ''
                              }`}
                              onClick={() => setSelectedWidget(widget.id)}
                            >
                              <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-sm">{widget.title}</CardTitle>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteWidget(widget.id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
                                  <span className="text-gray-500 text-sm">
                                    {widget.type === 'chart' ? 'Chart Preview' : 
                                     widget.type === 'table' ? 'Table Preview' : 
                                     'Widget Preview'}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Widget Configuration */}
              {selectedWidget && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Widget Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="widget-title">Title</Label>
                        <Input
                          id="widget-title"
                          value={widgets.find(w => w.id === selectedWidget)?.title || ''}
                          onChange={(e) => updateWidget(selectedWidget, { title: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="data-source">Data Source</Label>
                        <Select
                          value={widgets.find(w => w.id === selectedWidget)?.config?.dataSource || ''}
                          onValueChange={(value) => updateWidget(selectedWidget, {
                            config: { ...widgets.find(w => w.id === selectedWidget)?.config, dataSource: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select data source" />
                          </SelectTrigger>
                          <SelectContent>
                            {dataSources.map((source) => (
                              <SelectItem key={source.value} value={source.value}>
                                {source.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="chart-type">Chart Type</Label>
                        <Select
                          value={widgets.find(w => w.id === selectedWidget)?.config?.chartType || ''}
                          onValueChange={(value) => updateWidget(selectedWidget, {
                            config: { ...widgets.find(w => w.id === selectedWidget)?.config, chartType: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select chart type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bar">Bar Chart</SelectItem>
                            <SelectItem value="line">Line Chart</SelectItem>
                            <SelectItem value="pie">Pie Chart</SelectItem>
                            <SelectItem value="area">Area Chart</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Data Source Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="report-type">Report Type</Label>
                      <Select
                        value={reportConfig.type}
                        onValueChange={(value) => setReportConfig(prev => ({ ...prev, type: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff_performance">Staff Performance</SelectItem>
                          <SelectItem value="financial">Financial</SelectItem>
                          <SelectItem value="operational">Operational</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Date Range</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {reportConfig.dateRange[0] && reportConfig.dateRange[1] 
                              ? `${format(reportConfig.dateRange[0], 'MMM dd')} - ${format(reportConfig.dateRange[1], 'MMM dd')}`
                              : 'Select date range'
                            }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="range"
                            selected={{
                              from: reportConfig.dateRange[0],
                              to: reportConfig.dateRange[1]
                            }}
                            onSelect={(range) => {
                              if (range?.from && range?.to) {
                                setReportConfig(prev => ({ ...prev, dateRange: [range.from!, range.to!] }));
                              }
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Report Scheduling</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="frequency">Frequency</Label>
                      <Select
                        value={reportConfig.schedule?.frequency || ''}
                        onValueChange={(value) => setReportConfig(prev => ({
                          ...prev,
                          schedule: { ...prev.schedule, frequency: value as any, recipients: recipients }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Recipients</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Enter email address"
                        value={newRecipient}
                        onChange={(e) => setNewRecipient(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                      />
                      <Button onClick={addRecipient}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recipients.map((email) => (
                        <Badge key={email} variant="secondary" className="flex items-center gap-1">
                          {email}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={() => removeRecipient(email)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button onClick={scheduleReport} className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Schedule Report
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Export Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="export-format">Export Format</Label>
                    <Select
                      value={reportConfig.format}
                      onValueChange={(value) => setReportConfig(prev => ({ ...prev, format: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF Document</SelectItem>
                        <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                        <SelectItem value="csv">CSV File</SelectItem>
                        <SelectItem value="dashboard">Interactive Dashboard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button onClick={generateReport} className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      Advanced Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UniversalReportGenerator;