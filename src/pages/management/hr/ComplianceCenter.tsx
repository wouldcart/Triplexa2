import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

const ComplianceCenter: React.FC = () => {
  const alerts = [
    { id: "C1", title: "Monthly TDS Filing", due: "2025-06-07", priority: "high" },
    { id: "C2", title: "PF Contribution Return", due: "2025-06-15", priority: "medium" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Compliance Center</h2>
          <p className="text-muted-foreground">Track HR compliance tasks and filings</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" /> Active Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.map((a) => (
            <div key={a.id} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground">Due: {new Date(a.due).toLocaleDateString()}</p>
                </div>
                <Badge variant={a.priority === "high" ? "destructive" : "secondary"} className="text-xs">
                  {a.priority}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceCenter;