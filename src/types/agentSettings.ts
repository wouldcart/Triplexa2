
export interface AgentPermissions {
  modules: {
    inventory: {
      access: boolean;
      permissions: ('read' | 'write' | 'edit' | 'delete')[];
      showPricing: boolean;
    };
    bookings: {
      access: boolean;
      permissions: ('read' | 'write' | 'edit' | 'delete')[];
    };
    queries: {
      access: boolean;
      permissions: ('read' | 'write' | 'edit' | 'delete')[];
    };
    proposals: {
      access: boolean;
      permissions: ('read' | 'write' | 'edit' | 'delete')[];
    };
    reports: {
      access: boolean;
      permissions: ('read' | 'write' | 'edit' | 'delete')[];
    };
  };
  apiAccess: boolean;
  bulkOperations: boolean;
  adminAccess: boolean;
}

export interface CommissionSlab {
  id: string;
  name: string;
  type: 'volume' | 'performance' | 'tier';
  minThreshold: number;
  maxThreshold: number;
  commissionRate: number;
  isActive: boolean;
  applicableProducts: string[];
  validFrom: string;
  validTo?: string;
}

export interface MarkupConfiguration {
  id: string;
  name: string;
  baseMarkup: number;
  tierMultipliers: {
    basic: number;
    premium: number;
    vip: number;
  };
  geographicVariations: {
    region: string;
    multiplier: number;
  }[];
  seasonalAdjustments: {
    season: string;
    adjustment: number;
    startDate: string;
    endDate: string;
  }[];
  isActive: boolean;
}

export interface DocumentManagement {
  id: string;
  type: 'tos' | 'privacy' | 'contract' | 'other';
  title: string;
  version: string;
  effectiveDate: string;
  fileUrl: string;
  isActive: boolean;
  acknowledgments: {
    agentId: number;
    acknowledgedAt: string;
    version: string;
  }[];
}

export interface AgentSettings {
  id: number;
  permissions: AgentPermissions;
  commissionSlabs: CommissionSlab[];
  markupConfig: MarkupConfiguration;
  documents: DocumentManagement[];
  tier: 'basic' | 'premium' | 'vip' | 'partner';
  whiteLabel: {
    enabled: boolean;
    logoUrl?: string;
    primaryColor?: string;
    companyName?: string;
  };
  communicationPreferences: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    pushNotifications: boolean;
  };
  temporaryAccess: {
    module: string;
    expiresAt: string;
    grantedBy: string;
  }[];
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface BulkOperation {
  type: 'enable' | 'disable' | 'updateCommission' | 'updatePermissions' | 'updateTier';
  agentIds: number[];
  data: any;
  executedBy: string;
  executedAt: string;
  status: 'pending' | 'completed' | 'failed';
}
