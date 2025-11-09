import React, { useState } from "react";
import LeaveManagement from "@/pages/management/staff/hr/LeaveManagement";
import { LeaveApplication } from "@/types/staff";

const LeavesPage: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveApplication[]>([
    {
      id: '1',
      employeeId: 'EMP001',
      employeeName: 'John Doe',
      leaveType: 'annual',
      startDate: '2025-06-10',
      endDate: '2025-06-12',
      days: 3,
      reason: 'Family vacation',
      status: 'pending',
      appliedDate: '2025-05-26'
    },
    {
      id: '2',
      employeeId: 'EMP002',
      employeeName: 'Sarah Wilson',
      leaveType: 'sick',
      startDate: '2025-05-28',
      endDate: '2025-05-28',
      days: 1,
      reason: 'Medical checkup',
      status: 'approved',
      appliedDate: '2025-05-27',
      approvedBy: 'HR Manager',
      approvedDate: '2025-05-27'
    }
  ]);

  return <LeaveManagement leaves={leaves} setLeaves={setLeaves} />;
};

export default LeavesPage;