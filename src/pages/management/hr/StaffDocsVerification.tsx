import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle2, XCircle } from "lucide-react";

const StaffDocsVerification: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Staff Documents Verification</h2>
          <p className="text-muted-foreground">Review and verify uploaded documents</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Pending Verifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1,2,3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-sm">EMP00{i} • ID Proof.pdf</p>
                <p className="text-xs text-muted-foreground">Uploaded 2 days ago</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">pending</Badge>
                <Button size="sm" variant="outline"><CheckCircle2 className="h-4 w-4 mr-1" /> Approve</Button>
                <Button size="sm" variant="destructive"><XCircle className="h-4 w-4 mr-1" /> Reject</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffDocsVerification;