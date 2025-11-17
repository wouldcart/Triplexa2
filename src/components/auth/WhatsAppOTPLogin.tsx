import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Smartphone, Send, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { validatePhoneNumber, formatPhoneNumber } from '@/utils/phoneValidation';

interface WhatsAppOTPLoginProps {
  onBack: () => void;
  onSuccess: (user: any) => void;
}

export const WhatsAppOTPLogin: React.FC<WhatsAppOTPLoginProps> = ({ onBack, onSuccess }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const { toast } = useToast();

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate phone number
    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }

    const formattedPhone = formatPhoneNumber(phone);
    if (!validatePhoneNumber(formattedPhone)) {
      setError('Please enter a valid phone number in international format (e.g., +1234567890)');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      if (data.success) {
        toast({
          title: 'OTP Sent!',
          description: `WhatsApp OTP has been sent to ${formattedPhone}`,
        });
        setStep('otp');
        setCountdown(60); // 60 second countdown
        setCanResend(false);
      } else {
        throw new Error(data.error || 'Failed to send OTP');
      }
    } catch (err: any) {
      console.error('❌ WhatsApp OTP send error:', err);
      setError(err.message || 'Failed to send OTP. Please try again.');
      toast({
        title: 'Error',
        description: err.message || 'Failed to send OTP',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phone);
      const response = await fetch('/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: formattedPhone, 
          otp: otp.trim() 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      if (data.success && data.user) {
        toast({
          title: 'Success!',
          description: 'Logged in successfully with WhatsApp OTP',
        });
        onSuccess(data.user);
      } else {
        throw new Error(data.error || 'Invalid OTP');
      }
    } catch (err: any) {
      console.error('❌ WhatsApp OTP verification error:', err);
      setError(err.message || 'Invalid OTP. Please try again.');
      toast({
        title: 'Error',
        description: err.message || 'Invalid OTP',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setError('');
    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phone);
      const response = await fetch('/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend OTP');
      }

      if (data.success) {
        toast({
          title: 'OTP Resent!',
          description: `New WhatsApp OTP has been sent to ${formattedPhone}`,
        });
        setOtp('');
        setCountdown(60);
        setCanResend(false);
      } else {
        throw new Error(data.error || 'Failed to resend OTP');
      }
    } catch (err: any) {
      console.error('❌ WhatsApp OTP resend error:', err);
      setError(err.message || 'Failed to resend OTP. Please try again.');
      toast({
        title: 'Error',
        description: err.message || 'Failed to resend OTP',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (step === 'phone') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-0 h-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            WhatsApp OTP Login
          </CardTitle>
          <CardDescription>
            Enter your phone number to receive a WhatsApp OTP
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="font-mono"
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Enter your phone number in international format (e.g., +1234567890)
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending OTP...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send WhatsApp OTP
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStep('phone');
              setOtp('');
              setError('');
            }}
            className="p-0 h-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Enter OTP
        </CardTitle>
        <CardDescription>
          Enter the 6-digit OTP sent to {formatPhoneNumber(phone)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleOTPSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="font-mono text-center text-lg tracking-widest"
              maxLength={6}
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Enter the 6-digit code received via WhatsApp
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || otp.length !== 6}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Verify OTP
              </>
            )}
          </Button>

          <div className="text-center space-y-2">
            {countdown > 0 ? (
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                Resend OTP in {formatTime(countdown)}
              </p>
            ) : (
              <Button
                type="button"
                variant="link"
                className="text-sm"
                onClick={handleResendOTP}
                disabled={loading || !canResend}
              >
                Didn't receive OTP? Resend
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};