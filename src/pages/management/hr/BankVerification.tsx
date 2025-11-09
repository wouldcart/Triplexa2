import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, XCircle, CheckCircle2 } from "lucide-react";

const BankVerification: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bank Account Verification</h2>
          <p className="text-muted-foreground">Review and verify staff bank details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> Pending Bank Accounts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { id: "EMP001", name: "John Doe", bank: "HDFC Bank", last4: "1234" },
            { id: "EMP002", name: "Sarah Wilson", bank: "ICICI Bank", last4: "9876" }
          ].map((rec) => (
            <div key={rec.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-sm">{rec.name} • {rec.bank}</p>
                <p className="text-xs text-muted-foreground">Account •••• {rec.last4}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">pending</Badge>
                <Button size="sm" variant="outline"><CheckCircle2 className="h-4 w-4 mr-1" /> Verify</Button>
                <Button size="sm" variant="destructive"><XCircle className="h-4 w-4 mr-1" /> Reject</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default BankVerification;