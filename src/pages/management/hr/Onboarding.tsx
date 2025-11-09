import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

const Onboarding: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Employee Onboarding</h2>
          <p className="text-muted-foreground">Guide for adding new employees</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" /> New Onboarding
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li>Create staff profile and assign department</li>
            <li>Collect and verify documents</li>
            <li>Set salary structure and bank details</li>
            <li>Assign manager and targets</li>
            <li>Setup access and training</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;