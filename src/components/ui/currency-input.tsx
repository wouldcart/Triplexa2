
import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  DollarSign, 
  Euro, 
  PoundSterling, 
  Flag, 
  Globe,
  CurrencyIcon
} from "lucide-react";
import { Input } from "./input";
import { Label } from "./label";

export type CurrencyOption = {
  code: string;
  symbol: string;
  icon: React.ReactNode;
};

export const commonCurrencies: CurrencyOption[] = [
  { code: "USD", symbol: "$", icon: <DollarSign className="h-4 w-4" /> },
  { code: "EUR", symbol: "€", icon: <Euro className="h-4 w-4" /> },
  { code: "GBP", symbol: "£", icon: <PoundSterling className="h-4 w-4" /> },
  { code: "THB", symbol: "฿", icon: <CurrencyIcon className="h-4 w-4" /> },
  { code: "AED", symbol: "د.إ", icon: <CurrencyIcon className="h-4 w-4" /> },
  { code: "SGD", symbol: "S$", icon: <CurrencyIcon className="h-4 w-4" /> },
  { code: "INR", symbol: "₹", icon: <CurrencyIcon className="h-4 w-4" /> },
  { code: "MYR", symbol: "RM", icon: <CurrencyIcon className="h-4 w-4" /> },
  { code: "VND", symbol: "₫", icon: <CurrencyIcon className="h-4 w-4" /> },
  { code: "IDR", symbol: "Rp", icon: <CurrencyIcon className="h-4 w-4" /> },
  { code: "JPY", symbol: "¥", icon: <CurrencyIcon className="h-4 w-4" /> },
  { code: "PHP", symbol: "₱", icon: <CurrencyIcon className="h-4 w-4" /> },
  { code: "CNY", symbol: "¥", icon: <CurrencyIcon className="h-4 w-4" /> },
  { code: "AUD", symbol: "A$", icon: <CurrencyIcon className="h-4 w-4" /> },
];

// Helper to get currency icon
export const getCurrencyIcon = (code: string) => {
  const currency = commonCurrencies.find(c => c.code === code);
  if (currency) return currency.icon;
  
  // Default icon if currency not found
  return <Globe className="h-4 w-4" />;
};

// Helper to get currency symbol
export const getCurrencySymbol = (code: string) => {
  const currency = commonCurrencies.find(c => c.code === code);
  if (currency) return currency.symbol;
  return "";
};

interface CurrencyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  currency: string;
  onCurrencyChange: (currency: string) => void;
  symbol?: string;
  onSymbolChange?: (symbol: string) => void;
  label?: string;
  description?: string;
  showSymbolInput?: boolean;
}

export function CurrencyInput({
  className,
  currency,
  onCurrencyChange,
  symbol,
  onSymbolChange,
  label,
  description,
  showSymbolInput = false,
  ...props
}: CurrencyInputProps) {
  const currencyIcon = getCurrencyIcon(currency);
  
  return (
    <div className="space-y-2">
      {label && <Label htmlFor={props.id}>{label}</Label>}
      <div className="relative">
        <Input
          maxLength={3}
          className={cn("pl-9 uppercase", className)}
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value.toUpperCase())}
          {...props}
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {currencyIcon}
        </div>
      </div>
      {showSymbolInput && (
        <div className="mt-2">
          <Label htmlFor={`${props.id}-symbol`}>Currency Symbol</Label>
          <Input
            id={`${props.id}-symbol`}
            className="mt-1"
            placeholder="e.g. $, €, £"
            value={symbol}
            onChange={(e) => onSymbolChange && onSymbolChange(e.target.value)}
            maxLength={4}
          />
        </div>
      )}
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
}
