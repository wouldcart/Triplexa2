
import { useState, useEffect } from 'react';

interface AutoAssignmentSettings {
  enabled: boolean;
  requireCountryMatch: boolean;
  fallbackToAnyStaff: boolean;
}

const DEFAULT_SETTINGS: AutoAssignmentSettings = {
  enabled: true,
  requireCountryMatch: true,
  fallbackToAnyStaff: true,
};

export const useAutoAssignmentSettings = () => {
  const [settings, setSettings] = useState<AutoAssignmentSettings>(() => {
    const saved = localStorage.getItem('autoAssignmentSettings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('autoAssignmentSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<AutoAssignmentSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const toggleAutoAssignment = () => {
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  return {
    settings,
    updateSettings,
    toggleAutoAssignment,
    isAutoAssignmentEnabled: settings.enabled,
  };
};
