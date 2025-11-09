import React from "react";
import { Outlet } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import HRSidebar from "./HRSidebar";

const HRLayout: React.FC = () => {
  return (
    <PageLayout
      hideGlobalSidebar
      headerVariant="hr"
      title="HR Center"
      breadcrumbItems={[
        { title: "Home", href: "/" },
        { title: "Staff Management", href: "/management/staff" },
        { title: "HR", href: "/management/hr" },
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3">
          <HRSidebar />
        </div>
        <div className="lg:col-span-9">
          <Outlet />
        </div>
      </div>
    </PageLayout>
  );
};

export default HRLayout;