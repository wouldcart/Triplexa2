export interface AppModule {
  id: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  dependencies: string[];
  permissions: string[];
  configuration: Record<string, any>;
}

const ModuleManager: React.FC = () => {
  // Toggle features on/off
  // Configure module settings
  // Manage dependencies
  // Role-based feature access
};