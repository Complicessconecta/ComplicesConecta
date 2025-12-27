import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/buttons/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { Input } from '@/components/ui/forms/Input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { logger } from '@/lib/logger';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

interface EmailVerificationProps {
  email: string;
  onVerificationComplete: () => void;
  onBack: () => void;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({
  email,
  onVerificationComplete,
  onBack
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos
  const [canResend, setCanResend] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "CÃ³digo invÃ¡lido",
        description: "Por favor ingresa un cÃ³digo de 6 dÃ­gitos",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);
    try {
      if (!supabase) {
        logger.error('âŒ Supabase no estÃ¡ disponible');
        toast({
          title: "Error de conexiÃ³n",
          description: "No se pudo conectar con el servidor",
          variant: "destructive"
        });
        setIsVerifying(false);
        return;
      }
      
      // Verificar el cÃ³digo OTP con Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: verificationCode,
        type: 'signup'
      });

      if (error) {
        logger.error('âŒ Error al verificar cÃ³digo:', { error: error.message });
        toast({
          title: "CÃ³digo incorrecto",
          description: "El cÃ³digo ingresado no es vÃ¡lido o ha expirado",
          variant: "destructive"
        });
        return;
      }

      if (data.user) {
        logger.info('âœ… Email verificado exitosamente:', { userId: data.user.id });
        toast({
          title: "Â¡Email verificado!",
          description: "Tu cuenta ha sido activada exitosamente",
          duration: 5000
        });
        onVerificationComplete();
      }
    } catch (error: any) {
      logger.error('âŒ Error en verificaciÃ³n de email:', { error: error.message });
      toast({
        title: "Error de verificaciÃ³n",
        description: "Hubo un problema al verificar tu email. IntÃ©ntalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      if (!supabase) {
        logger.error('âŒ Supabase no estÃ¡ disponible');
        toast({
          title: "Error de conexiÃ³n",
          description: "No se pudo conectar con el servidor",
          variant: "destructive"
        });
        setIsResending(false);
        return;
      }
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        logger.error('âŒ Error al reenviar cÃ³digo:', { error: error.message });
        toast({
          title: "Error al reenviar",
          description: "No se pudo reenviar el cÃ³digo. IntÃ©ntalo mÃ¡s tarde.",
          variant: "destructive"
        });
        return;
      }

      logger.info('âœ… CÃ³digo reenviado exitosamente:', { email });
      toast({
        title: "CÃ³digo reenviado",
        description: "Se ha enviado un nuevo cÃ³digo a tu email",
        duration: 5000
      });

      // Reiniciar timer
      setTimeLeft(300);
      setCanResend(false);
    } catch (error: any) {
      logger.error('âŒ Error al reenviar cÃ³digo:', { error: error.message });
      toast({
        title: "Error de conexiÃ³n",
        description: "No se pudo conectar con el servidor. Verifica tu conexiÃ³n.",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white text-center flex items-center justify-center gap-2">
            <Mail className="h-6 w-6" />
            VerificaciÃ³n de Email
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* InformaciÃ³n del email */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-white/90">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-sm">CÃ³digo enviado a:</span>
            </div>
            <p className="text-white font-medium">{email}</p>
            <p className="text-white/70 text-sm">
              Revisa tu bandeja de entrada y carpeta de spam
            </p>
          </div>

          {/* Campo de cÃ³digo */}
          <div className="space-y-2">
            <Label htmlFor="verification-code" className="text-white">
              CÃ³digo de verificaciÃ³n (6 dÃ­gitos)
            </Label>
            <Input
              id="verification-code"
              type="text"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setVerificationCode(value);
              }}
              placeholder="123456"
              className="text-center text-lg tracking-widest bg-white/10 border-white/20 text-white placeholder:text-white/50"
              maxLength={6}
            />
          </div>

          {/* Timer y reenvÃ­o */}
          <div className="text-center space-y-2">
            {!canResend ? (
              <p className="text-white/70 text-sm">
                PodrÃ¡s solicitar un nuevo cÃ³digo en: {formatTime(timeLeft)}
              </p>
            ) : (
              <Button
                variant="ghost"
                onClick={handleResendCode}
                disabled={isResending}
                className="text-purple-300 hover:text-white hover:bg-white/10"
              >
                {isResending ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Reenviando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Reenviar cÃ³digo
                  </div>
                )}
              </Button>
            )}
          </div>

          {/* Botones de acciÃ³n */}
          <div className="space-y-3">
            <Button
              onClick={handleVerifyCode}
              disabled={isVerifying || verificationCode.length !== 6}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isVerifying ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Verificando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Verificar cÃ³digo
                </div>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={onBack}
              className="w-full text-white/80 hover:text-white hover:bg-white/10"
            >
              Volver al registro
            </Button>
          </div>

          {/* InformaciÃ³n adicional */}
          <div className="bg-blue-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-200 space-y-1">
                <p>â€¢ El cÃ³digo expira en 5 minutos</p>
                <p>â€¢ Revisa tu carpeta de spam si no lo encuentras</p>
                <p>â€¢ Puedes solicitar un nuevo cÃ³digo despuÃ©s del tiempo lÃ­mite</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

