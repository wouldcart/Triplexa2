import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserMinus } from "lucide-react";

const Offboarding: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Employee Offboarding</h2>
          <p className="text-muted-foreground">Checklist for offboarding employees</p>
        </div>
        <Button variant="outline">
          <UserMinus className="h-4 w-4 mr-2" /> New Offboarding
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li>Collect company assets</li>
            <li>Disable access and credentials</li>
            <li>Finalize payroll and dues</li>
            <li>Exit interview and feedback</li>
            <li>Archive documents and handover</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Offboarding;