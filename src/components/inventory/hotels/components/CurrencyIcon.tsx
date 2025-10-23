
import React from 'react';
import { 
  DollarSign, 
  Euro, 
  IndianRupee, 
  PoundSterling,
  JapaneseYen,
  BadgeDollarSign,
  BadgeEuro,
  BadgeIndianRupee,
  BadgePoundSterling,
  BadgeJapaneseYen
} from 'lucide-react';

interface CurrencyIconProps {
  currencyCode?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'badge';
}

const CurrencyIcon: React.FC<CurrencyIconProps> = ({ 
  currencyCode = 'USD',
  size = 'sm',
  variant = 'default'
}) => {
  const sizeClass = {
    sm: 'h-3 w-3 mr-1',
    md: 'h-4 w-4 mr-1',
    lg: 'h-5 w-5 mr-1'
  }[size];

  // Determine which icon to use based on variant and currency code
  const renderIcon = () => {
    if (variant === 'badge') {
      // Badge variant
      switch (currencyCode) {
        case 'EUR':
          return <BadgeEuro className={sizeClass} />;
        case 'GBP':
          return <BadgePoundSterling className={sizeClass} />;
        case 'INR':
          return <BadgeIndianRupee className={sizeClass} />;
        case 'JPY':
          return <BadgeJapaneseYen className={sizeClass} />;
        case 'USD':
        case 'THB':
        case 'AED':
        case 'SGD':
        case 'MYR':
        default:
          return <BadgeDollarSign className={sizeClass} />;
      }
    } else {
      // Default variant
      switch (currencyCode) {
        case 'EUR':
          return <Euro className={sizeClass} />;
        case 'GBP':
          return <PoundSterling className={sizeClass} />;
        case 'INR':
          return <IndianRupee className={sizeClass} />;
        case 'JPY':
          return <JapaneseYen className={sizeClass} />;
        case 'USD':
        case 'THB':
        case 'AED':
        case 'SGD':
        case 'MYR':
        default:
          return <DollarSign className={sizeClass} />;
      }
    }
  };

  return renderIcon();
};

export default CurrencyIcon;
