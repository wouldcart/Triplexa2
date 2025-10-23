
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  CreditCard, 
  FileText, 
  TrendingUp, 
  Wallet, 
  Receipt,
  AlertCircle,
  Download,
  Calculator,
  PieChart
} from 'lucide-react';
import { useAccessControl } from '@/hooks/use-access-control';

const FinanceDashboard: React.FC = () => {
  const { canAccessModule } = useAccessControl();

  if (!canAccessModule('finance-dashboard')) {
    return (
      <PageLayout title="Access Denied">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">You don't have access to this dashboard.</p>
        </div>
      </PageLayout>
    );
  }

  const financeStats = {
    totalRevenue: '₹25,48,000',
    pendingPayments: '₹4,25,000',
    monthlyCommissions: '₹1,85,000',
    overdueAmount: '₹65,000'
  };

  const recentTransactions = [
    { id: 1, client: 'Dream Tours Pvt Ltd', amount: '₹1,25,000', type: 'Payment Received', status: 'Completed', date: '2 hrs ago' },
    { id: 2, client: 'Travel Express', amount: '₹85,000', type: 'Commission Due', status: 'Pending', date: '1 day ago' },
    { id: 3, client: 'Vacation Paradise', amount: '₹2,10,000', type: 'Invoice Generated', status: 'Sent', date: '2 days ago' }
  ];

  return (
    <PageLayout
      title="Finance Dashboard"
      breadcrumbItems={[
        { title: "Home", href: "/" },
        { title: "Finance Dashboard", href: "/dashboards/finance" },
      ]}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Finance & Accounts Dashboard</h2>
            <p className="text-muted-foreground">Handle payments, commissions, invoices, and financial reports</p>
          </div>
          <div className="flex gap-2">
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Generate Invoice
            </Button>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{financeStats.totalRevenue}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <CreditCard className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{financeStats.pendingPayments}</div>
              <p className="text-xs text-muted-foreground">Awaiting collection</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commissions</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{financeStats.monthlyCommissions}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{financeStats.overdueAmount}</div>
              <p className="text-xs text-muted-foreground">Requires follow-up</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="payments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="payments">
              <CreditCard className="mr-2 h-4 w-4" />
              Payment Tracking
            </TabsTrigger>
            <TabsTrigger value="invoices">
              <FileText className="mr-2 h-4 w-4" />
              Invoice Management
            </TabsTrigger>
            <TabsTrigger value="commissions">
              <Calculator className="mr-2 h-4 w-4" />
              Commission Tracker
            </TabsTrigger>
            <TabsTrigger value="reports">
              <PieChart className="mr-2 h-4 w-4" />
              Financial Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agent Payment Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'Payment Received' ? 'bg-green-100' :
                          transaction.type === 'Commission Due' ? 'bg-orange-100' : 'bg-blue-100'
                        }`}>
                          <DollarSign className={`h-5 w-5 ${
                            transaction.type === 'Payment Received' ? 'text-green-600' :
                            transaction.type === 'Commission Due' ? 'text-orange-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium">{transaction.client}</p>
                          <p className="text-sm text-muted-foreground">{transaction.type} • {transaction.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-semibold">{transaction.amount}</p>
                          <Badge variant={
                            transaction.status === 'Completed' ? 'default' :
                            transaction.status === 'Pending' ? 'secondary' : 'outline'
                          }>
                            {transaction.status}
                          </Badge>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center p-6 border rounded-lg">
                    <FileText className="h-8 w-8 mx-auto mb-3 text-blue-500" />
                    <h3 className="font-medium mb-2">Auto-Generate Invoices</h3>
                    <p className="text-sm text-muted-foreground mb-4">Custom templates with digital signatures</p>
                    <Button variant="outline">
                      <FileText className="mr-2 h-4 w-4" />
                      Create Invoice
                    </Button>
                  </div>
                  <div className="text-center p-6 border rounded-lg">
                    <Download className="h-8 w-8 mx-auto mb-3 text-green-500" />
                    <h3 className="font-medium mb-2">Download Center</h3>
                    <p className="text-sm text-muted-foreground mb-4">Export invoices and statements</p>
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Download Reports
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Commission Calculator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">15%</div>
                      <p className="text-sm text-muted-foreground">Standard Rate</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">20%</div>
                      <p className="text-sm text-muted-foreground">Premium Rate</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">25%</div>
                      <p className="text-sm text-muted-foreground">VIP Rate</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Commission Progress (Monthly Target: ₹5,00,000)</span>
                      <span>37%</span>
                    </div>
                    <Progress value={37} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Reporting Suite</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h4 className="font-medium">Available Reports</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span className="text-sm">Profit & Loss Statement</span>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span className="text-sm">Cash Flow Report</span>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span className="text-sm">Commission Summary</span>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="text-center p-6 border rounded-lg">
                    <PieChart className="h-8 w-8 mx-auto mb-3 text-purple-500" />
                    <h3 className="font-medium mb-2">Custom Reports</h3>
                    <p className="text-sm text-muted-foreground mb-4">Generate custom financial reports</p>
                    <Button variant="outline">
                      Create Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Tax Management */}
        <Card>
          <CardHeader>
            <CardTitle>Tax Management Hub</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">18%</div>
                <p className="text-sm text-muted-foreground">GST Rate</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">₹4,25,000</div>
                <p className="text-sm text-muted-foreground">Tax Collected</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-orange-600">₹85,000</div>
                <p className="text-sm text-muted-foreground">Tax Payable</p>
              </div>
              <div className="text-center">
                <Button variant="outline" size="sm">
                  <Receipt className="mr-2 h-4 w-4" />
                  Generate GST Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default FinanceDashboard;
