
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, Calculator, Info } from 'lucide-react';
import { CurrencyService, ExchangeRate } from '@/services/currencyService';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CurrencyCalculatorProps {
  rates: ExchangeRate[];
  currencies: Array<{ code: string; name: string; symbol: string }>;
}

const CurrencyCalculator: React.FC<CurrencyCalculatorProps> = ({ rates, currencies }) => {
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('THB');
  const [amount, setAmount] = useState('100');
  const [result, setResult] = useState<{
    converted: number;
    rate: number;
    margin: number;
    finalRate: number;
    additionalSurcharge?: number;
  } | null>(null);

  const handleCalculate = () => {
    const numAmount = parseFloat(amount) || 0;
    
    // Find the rate for this conversion
    const rate = rates.find(r => 
      r.fromCurrency === fromCurrency && r.toCurrency === toCurrency
    );

    if (rate) {
      const finalRate = CurrencyService.calculateWithMargin(
        rate.rate, 
        rate.margin, 
        1, 
        rate.additionalSurcharge || 0
      );
      const converted = finalRate * numAmount;
      
      setResult({
        converted,
        rate: rate.rate,
        margin: rate.margin,
        finalRate,
        additionalSurcharge: rate.additionalSurcharge
      });
    }
  };

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setResult(null);
  };

  useEffect(() => {
    if (amount && fromCurrency && toCurrency) {
      handleCalculate();
    }
  }, [amount, fromCurrency, toCurrency, rates]);

  // Check if current conversion is THB to INR for special notice
  const isThbToInr = fromCurrency === 'THB' && toCurrency === 'INR';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calculator className="h-5 w-5 mr-2" />
          Currency Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isThbToInr && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              THB to INR conversion includes an additional surcharge of ₹0.18 per THB for enhanced service.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
            />
          </div>

          <div className="space-y-2">
            <Label>From</Label>
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(currency => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSwapCurrencies}
            >
              <ArrowRightLeft className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label>To</Label>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(currency => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleCalculate}>Calculate</Button>
        </div>

        {result && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-center mb-2">
              {currencies.find(c => c.code === toCurrency)?.symbol}{result.converted.toFixed(2)}
            </div>
            <div className="text-center text-sm text-muted-foreground space-y-1">
              <div>Base Rate: 1 {fromCurrency} = {result.rate.toFixed(4)} {toCurrency}</div>
              <div>Margin: {result.margin}%</div>
              {result.additionalSurcharge && (
                <div className="text-orange-600 font-medium">
                  Additional Surcharge: +{result.additionalSurcharge.toFixed(2)} {toCurrency}
                </div>
              )}
              <div className="font-medium">
                Final Rate: 1 {fromCurrency} = {result.finalRate.toFixed(4)} {toCurrency}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrencyCalculator;
