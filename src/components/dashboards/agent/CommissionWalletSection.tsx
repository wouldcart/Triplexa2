import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; 
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Wallet, DollarSign, TrendingUp, Calendar, 
  CreditCard, Download, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';

const CommissionWalletSection: React.FC = () => {
  const walletData = {
    totalCommission: 8240.50,
    pendingCommission: 1650.25,
    availableWithdrawal: 6590.25,
    thisMonthEarnings: 2450.00,
    lastMonthEarnings: 3150.75,
    monthlyTarget: 5000.00
  };

  const recentTransactions = [
    {
      id: "T001",
      type: "earning",
      description: "Commission for Thailand Trip - Williams Family",
      amount: 245.50,
      date: "2024-01-20",
      status: "completed",
      tripId: "P002"
    },
    {
      id: "T002", 
      type: "withdrawal",
      description: "Bank Transfer to Account ***1234",
      amount: -1500.00,
      date: "2024-01-18",
      status: "completed",
      reference: "WD123456"
    },
    {
      id: "T003",
      type: "earning",
      description: "Commission for Bali Trip - Johnson Couple",
      amount: 180.25,
      date: "2024-01-15",
      status: "pending",
      tripId: "P003"
    },
    {
      id: "T004",
      type: "earning", 
      description: "Commission for Dubai Tour - Brown Group",
      amount: 320.75,
      date: "2024-01-12",
      status: "completed",
      tripId: "P004"
    }
  ];

  const monthlyStats = [
    { month: "Jan 2024", earnings: 2450.00, bookings: 8 },
    { month: "Dec 2023", earnings: 3150.75, bookings: 12 },
    { month: "Nov 2023", earnings: 2890.50, bookings: 10 },
    { month: "Oct 2023", earnings: 2635.25, bookings: 9 }
  ];

  const getTransactionIcon = (type: string) => {
    return type === 'earning' ? ArrowUpRight : ArrowDownLeft;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Wallet Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/50">
                <Wallet className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  ${walletData.totalCommission.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Total Earned</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50">
                <DollarSign className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  ${walletData.availableWithdrawal.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/50">
                <Calendar className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  ${walletData.pendingCommission.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  ${walletData.thisMonthEarnings.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">This Month</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Commission Tracking
            </CardTitle>
            <CardDescription>
              Your monthly performance and targets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Monthly Target Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Monthly Target Progress</span>
                <span>${walletData.thisMonthEarnings.toFixed(2)} / ${walletData.monthlyTarget.toFixed(2)}</span>
              </div>
              <Progress 
                value={(walletData.thisMonthEarnings / walletData.monthlyTarget) * 100} 
                className="h-3"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {Math.round((walletData.thisMonthEarnings / walletData.monthlyTarget) * 100)}% completed
              </div>
            </div>

            {/* Monthly Breakdown */}
            <div className="space-y-3">
              <h4 className="font-medium">Recent Months</h4>
              {monthlyStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{stat.month}</div>
                    <div className="text-sm text-muted-foreground">{stat.bookings} bookings</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${stat.earnings.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Button className="w-full">
                <CreditCard className="h-4 w-4 mr-2" />
                Request Withdrawal
              </Button>
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Statement
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              Recent earnings and withdrawals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => {
                const Icon = getTransactionIcon(transaction.type);
                return (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'earning' 
                          ? 'bg-green-50 dark:bg-green-950/50' 
                          : 'bg-red-50 dark:bg-red-950/50'
                      }`}>
                        <Icon className={`h-4 w-4 ${
                          transaction.type === 'earning' ? 'text-green-500' : 'text-red-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {transaction.description}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString()}
                          {transaction.tripId && ` • Trip: ${transaction.tripId}`}
                          {transaction.reference && ` • Ref: ${transaction.reference}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                      </div>
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommissionWalletSection;