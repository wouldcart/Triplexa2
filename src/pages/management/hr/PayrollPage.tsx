import React, { useState } from "react";
import PayrollManagement from "@/pages/management/staff/hr/PayrollManagement";
import { PayrollRun } from "@/types/staff";

const PayrollPage: React.FC = () => {
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([
    {
      id: '1',
      period: '05-2025',
      status: 'approved',
      employeesCount: 45,
      totalAmount: 2925000,
      createdBy: 'HR Manager',
      createdDate: '2025-05-25',
      approvalWorkflow: [
        { level: 1, approverRole: 'HR Manager', status: 'approved', approvedDate: '2025-05-25' },
        { level: 2, approverRole: 'Finance Manager', status: 'approved', approvedDate: '2025-05-26' }
      ],
      currency: 'USD'
    }
  ]);

  return <PayrollManagement payrollRuns={payrollRuns} setPayrollRuns={setPayrollRuns} />;
};

export default PayrollPage;