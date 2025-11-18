# Module Access Control Implementation Guide

This guide shows you how to implement access control for your existing modules using the new role-based system.

## 🚀 Quick Start

### 1. Basic Module Protection

Wrap your existing components with the `ProtectedModule` component:

```tsx
import { ProtectedModule } from '@/components/auth/ModuleAccessControl';

// Before (your existing component)
function QueriesPage() {
  return <QueryList />;
}

// After (with access control)
function QueriesPage() {
  return (
    <ProtectedModule moduleId="queries">
      <QueryList />
    </ProtectedModule>
  );
}
```

### 2. Conditional Rendering Based on Access

Use the `ModuleAccess` component for conditional rendering:

```tsx
import { ModuleAccess } from '@/components/auth/ModuleAccessControl';

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Show different content based on access */}
      <ModuleAccess 
        moduleId="sales-reports" 
        render={({hasAccess}) => 
          hasAccess ? 
            <SalesReport /> : 
            <BasicReport />
        } 
      />
      
      {/* Show admin features only if user has access */}
      <ModuleAccess 
        moduleId="agent-management" 
        render={({hasAccess}) => 
          hasAccess && <AdminControls />
        } 
      />
    </div>
  );
}
```

### 3. Using the Hook for Complex Logic

Use the `useModuleAccess` hook for more complex access control:

```tsx
import { useModuleAccess } from '@/hooks/useModuleAccess';

function ComplexComponent() {
  const { canAccess, hasRole, hasPermission, userRole } = useModuleAccess();
  
  return (
    <div>
      {canAccess('queries') && <QuerySection />}
      
      {hasRole(['super_admin', 'manager']) && <ManagementTools />}
      
      {hasPermission('hr_payroll_access') && <PayrollModule />}
      
      {userRole === 'agent' && <AgentDashboard />}
      
      {/* Show different views based on department */}
      {hasDepartment('Sales') && <SalesDashboard />}
      {hasDepartment('Operations') && <OperationsDashboard />}
    </div>
  );
}
```

## 📋 Available Module IDs

Here are the module IDs you can use for access control:

### Dashboard Modules
- `dashboard` - Main Dashboard
- `agent-dashboard` - Agent Dashboard  
- `manager-dashboard` - Manager Dashboard
- `operations-dashboard` - Operations Dashboard
- `sales-dashboard` - Sales Dashboard

### Query Management
- `queries` - Query Management
- `create-query` - Create Query
- `query-details` - Query Details
- `assign-queries` - Assign Queries

### Proposals & Bookings
- `proposals` - Proposal Management
- `advanced-proposal` - Advanced Proposal Builder
- `bookings` - Booking Management
- `itinerary-builder` - Itinerary Builder

### Inventory
- `inventory` - Inventory Management
- `hotels` - Hotel Management
- `transport` - Transport Management
- `restaurants` - Restaurant Management

### Sales
- `sales-enquiries` - Sales Enquiries
- `sales-bookings` - Sales Bookings
- `sales-agents` - Sales Agents
- `sales-reports` - Sales Reports

### Management
- `agent-management` - Agent Management
- `staff-management` - Staff Management
- `departments` - Department Management
- `hr-management` - HR Management

### HR Sub-modules
- `payroll` - Payroll Management
- `leaves` - Leave Management
- `attendance` - Attendance Management
- `salary-structure` - Salary Structure

### Settings
- `settings` - General Settings
- `general-settings` - General Settings
- `account-settings` - Account Settings
- `api-settings` - API Settings
- `access-control` - Access Control
- `pricing-settings` - Pricing Settings
- `email-templates` - Email Templates
- `sms-settings` - SMS Settings
- `language-manager` - Language Manager
- `translation-tool` - Translation Tool

### Reports & Communications
- `reports` - Reports
- `universal-reports` - Universal Reports
- `email-communications` - Email Communications
- `followups` - Follow-ups

### Traveler Portal
- `traveler-portal` - Traveler Portal
- `traveler-dashboard` - Traveler Dashboard
- `traveler-itinerary` - Traveler Itinerary
- `traveler-history` - Traveler History

### AI & Automation
- `ai-assistant` - AI Assistant
- `ai-settings` - AI Settings

## 🛠️ Implementation Examples

### Example 1: Protecting a Settings Page

```tsx
// src/pages/settings/ApiSettings.tsx
import { ProtectedModule } from '@/components/auth/ModuleAccessControl';

export default function ApiSettings() {
  return (
    <ProtectedModule moduleId="api-settings">
      <div className="settings-container">
        <h1>API Settings</h1>
        {/* Your existing API settings content */}
      </div>
    </ProtectedModule>
  );
}
```

### Example 2: Sales Dashboard with Department Check

```tsx
// src/pages/dashboards/SalesDashboard.tsx
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { Navigate } from 'react-router-dom';

export default function SalesDashboard() {
  const { canAccess, hasDepartment } = useModuleAccess();
  
  // Check both module access and department
  if (!canAccess('sales-dashboard') || !hasDepartment('Sales')) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return (
    <div className="sales-dashboard">
      <h1>Sales Dashboard</h1>
      {/* Your sales dashboard content */}
    </div>
  );
}
```

### Example 3: HR Module with Permission Check

```tsx
// src/pages/management/hr/PayrollPage.tsx
import { ModuleAccess } from '@/components/auth/ModuleAccessControl';

export default function PayrollPage() {
  return (
    <ModuleAccess 
      moduleId="payroll" 
      render={({hasAccess}) => 
        hasAccess ? (
          <div className="payroll-page">
            <h1>Payroll Management</h1>
            {/* Payroll content */}
          </div>
        ) : (
          <div className="access-denied">
            <h2>Payroll Access Required</h2>
            <p>You need HR payroll permissions to access this module.</p>
          </div>
        )
      } 
    />
  );
}
```

### Example 4: Navigation Menu with Access Control

```tsx
// src/components/Navigation.tsx
import { useModuleAccess } from '@/hooks/useModuleAccess';

export default function Navigation() {
  const { canAccess, accessibleModules } = useModuleAccess();
  
  return (
    <nav>
      <ul>
        {canAccess('dashboard') && (
          <li><Link to="/dashboard">Dashboard</Link></li>
        )}
        
        {canAccess('queries') && (
          <li><Link to="/queries">Queries</Link></li>
        )}
        
        {canAccess('bookings') && (
          <li><Link to="/bookings">Bookings</Link></li>
        )}
        
        {/* Show settings only if user has access */}
        {canAccess('settings') && (
          <li><Link to="/settings">Settings</Link></li>
        )}
      </ul>
      
      {/* Show accessible modules count */}
      <div className="access-info">
        Accessible Modules: {accessibleModules.length}
      </div>
    </nav>
  );
}
```

### Example 5: Module Access Panel for Dashboard

```tsx
// src/pages/Dashboard.tsx
import { ModuleAccessPanel } from '@/components/auth/ModuleAccessPanel';

export default function Dashboard() {
  return (
    <div className="dashboard">
      <h1>Welcome to Your Dashboard</h1>
      
      {/* Show all accessible modules */}
      <ModuleAccessPanel 
        layout="category" // 'grid', 'list', or 'category'
        showCategories={['Dashboard', 'Queries', 'Bookings']} // Optional: filter categories
        className="mt-6"
      />
      
      {/* Or show specific categories */}
      <div className="mt-8">
        <h2>Management Tools</h2>
        <ModuleAccessPanel 
          showCategories={['Management', 'HR', 'Settings']}
          layout="grid"
          className="mt-4"
        />
      </div>
    </div>
  );
}
```

## 🔧 Advanced Usage

### Custom Access Logic

```tsx
import { useModuleAccess } from '@/hooks/useModuleAccess';

function CustomComponent() {
  const { userRole, userDepartment, userPermissions, hasRole, hasPermission } = useModuleAccess();
  
  // Custom business logic
  const canEditSettings = hasRole(['super_admin', 'manager']) || 
                         (userRole === 'admin' && userDepartment === 'IT');
  
  const canViewReports = hasPermission('reports_access') || 
                        userRole === 'manager' || 
                        userDepartment === 'Finance';
  
  return (
    <div>
      {canEditSettings && <SettingsEditor />}
      {canViewReports && <ReportsSection />}
    </div>
  );
}
```

### Access Control with Fallback

```tsx
import { ProtectedModule } from '@/components/auth/ModuleAccessControl';

function AdminPanel() {
  // Show limited admin panel if no full access
  return (
    <ProtectedModule 
      moduleId="admin-panel" 
      fallback={<LimitedAdminPanel />}
    >
      <FullAdminPanel />
    </ProtectedModule>
  );
}
```

### Role-Based UI Components

```tsx
import { ModuleAccess } from '@/components/auth/ModuleAccessControl';

function UserInterface() {
  return (
    <div>
      {/* Show different interfaces based on role */}
      <ModuleAccess 
        moduleId="agent-dashboard" 
        render={({userRole}) => {
          switch(userRole) {
            case 'super_admin': return <SuperAdminInterface />;
            case 'manager': return <ManagerInterface />;
            case 'agent': return <AgentInterface />;
            default: return <BasicInterface />;
          }
        }} 
      />
    </div>
  );
}
```

## 📊 Access Control Best Practices

1. **Use the Hook for Complex Logic**: When you need custom access logic, use the `useModuleAccess` hook
2. **Protect Routes at Component Level**: Use `ProtectedModule` for route-level protection
3. **Show Meaningful Messages**: Always provide clear feedback when access is denied
4. **Test with Different Roles**: Test your implementation with different user roles
5. **Use Conditional Rendering**: Use `ModuleAccess` for UI elements that should change based on access
6. **Document Your Modules**: Keep track of which modules require which permissions

## 🧪 Testing Access Control

You can test access control by:

1. **Using different user accounts** with different roles
2. **Temporarily changing your role** in the auth context
3. **Using the dev auth bypass** (`?dev=1` in URL)
4. **Checking the module access panel** to see what modules are accessible

## 🔍 Debugging Access Issues

If users can't access modules they should:

1. Check the user's role and department in the auth context
2. Verify the module ID is correct in your code
3. Check the module access configuration in `/src/config/moduleAccess.ts`
4. Use the `ModulePermissionBadge` to show access status
5. Check browser console for any access control logs

## 📚 Next Steps

1. **Review your existing modules** and identify which ones need access control
2. **Implement basic protection** using `ProtectedModule`
3. **Add conditional rendering** for UI elements that should vary by role
4. **Test with different user roles** to ensure proper access
5. **Document any custom access rules** for your team

The access control system is now ready to use! Start with your most critical modules and gradually add protection to all modules as needed.