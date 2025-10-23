
import { Sightseeing } from '@/types/sightseeing';

export type ExpirationStatus = 'valid' | 'expiring-soon' | 'expired' | 'no-period';

/**
 * Get the expiration status of a sightseeing item
 */
export const getExpirationStatus = (sightseeing: Sightseeing): ExpirationStatus => {
  if (!sightseeing.validityPeriod) {
    return 'no-period';
  }

  const now = new Date();
  const endDate = new Date(sightseeing.validityPeriod.endDate);
  const daysUntilExpiration = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiration < 0) {
    return 'expired';
  } else if (daysUntilExpiration <= 30) {
    return 'expiring-soon';
  } else {
    return 'valid';
  }
};

/**
 * Check if a sightseeing item is expired
 */
export const isExpired = (sightseeing: Sightseeing): boolean => {
  return getExpirationStatus(sightseeing) === 'expired';
};

/**
 * Check if a sightseeing item is expiring soon (within 30 days)
 */
export const isExpiringSoon = (sightseeing: Sightseeing): boolean => {
  return getExpirationStatus(sightseeing) === 'expiring-soon';
};

/**
 * Get days until expiration
 */
export const getDaysUntilExpiration = (sightseeing: Sightseeing): number | null => {
  if (!sightseeing.validityPeriod) {
    return null;
  }

  const now = new Date();
  const endDate = new Date(sightseeing.validityPeriod.endDate);
  return Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Format validity period for display
 */
export const formatValidityPeriod = (validityPeriod: { startDate: string; endDate: string }): string => {
  const startDate = new Date(validityPeriod.startDate);
  const endDate = new Date(validityPeriod.endDate);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

/**
 * Get expiration warning message
 */
export const getExpirationWarning = (sightseeing: Sightseeing): string | null => {
  const status = getExpirationStatus(sightseeing);
  const days = getDaysUntilExpiration(sightseeing);

  switch (status) {
    case 'expired':
      return 'This sightseeing has expired and should be updated or removed.';
    case 'expiring-soon':
      return `This sightseeing expires in ${days} day${days === 1 ? '' : 's'}. Consider updating the validity period.`;
    default:
      return null;
  }
};

/**
 * Filter sightseeings by expiration status
 */
export const filterByExpirationStatus = (sightseeings: Sightseeing[], status: ExpirationStatus): Sightseeing[] => {
  return sightseeings.filter(sightseeing => getExpirationStatus(sightseeing) === status);
};

/**
 * Get expiration statistics
 */
export const getExpirationStats = (sightseeings: Sightseeing[]) => {
  const stats = {
    total: sightseeings.length,
    valid: 0,
    expiringSoon: 0,
    expired: 0,
    noPeriod: 0
  };

  sightseeings.forEach(sightseeing => {
    const status = getExpirationStatus(sightseeing);
    switch (status) {
      case 'valid':
        stats.valid++;
        break;
      case 'expiring-soon':
        stats.expiringSoon++;
        break;
      case 'expired':
        stats.expired++;
        break;
      case 'no-period':
        stats.noPeriod++;
        break;
    }
  });

  return stats;
};
