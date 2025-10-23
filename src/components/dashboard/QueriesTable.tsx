
import React from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DashboardQuery } from '@/data/mockData';

interface QueriesTableProps {
  queries: DashboardQuery[];
}

const QueriesTable: React.FC<QueriesTableProps> = ({ queries }) => {
  return (
    <Card>
      <CardHeader className="py-4">
        <div className="flex justify-between">
          <CardTitle className="text-lg">Recent Enquiries</CardTitle>
          <Button variant="link" className="p-0" asChild>
            <Link to="/queries">View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="pb-2 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">ID</th>
                <th className="pb-2 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">Agent</th>
                <th className="pb-2 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">Destination</th>
                <th className="pb-2 px-6 text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Duration</th>
                <th className="pb-2 px-6 text-sm font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">PAX</th>
                <th className="pb-2 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="pb-2 px-6 text-sm font-medium text-gray-500 dark:text-gray-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {queries.map((query) => (
                <tr key={query.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-6 text-sm">{query.id}</td>
                  <td className="py-3 px-6 text-sm">
                    <div className="font-medium">{query.agent.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{query.agent.company}</div>
                  </td>
                  <td className="py-3 px-6 text-sm">
                    <div className="font-medium">{query.destination.country}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{query.destination.cities.join(', ')}</div>
                  </td>
                  <td className="py-3 px-6 text-sm hidden sm:table-cell">{query.duration}</td>
                  <td className="py-3 px-6 text-sm hidden md:table-cell">{query.pax}</td>
                  <td className="py-3 px-6 text-sm">
                    <Badge
                      className={cn(
                        "text-xs font-medium",
                        query.status === 'New' && "bg-blue-100 text-blue-800 hover:bg-blue-200",
                        query.status === 'Proposal Sent' && "bg-amber-100 text-amber-800 hover:bg-amber-200",
                        query.status === 'Follow Up' && "bg-purple-100 text-purple-800 hover:bg-purple-200",
                        query.status === 'Confirmed' && "bg-green-100 text-green-800 hover:bg-green-200"
                      )}
                      variant="outline"
                    >
                      {query.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-6 text-sm text-right">
                    <Button size="sm" variant="ghost" asChild>
                      <Link to={`/queries/${encodeURIComponent(query.id)}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default QueriesTable;
