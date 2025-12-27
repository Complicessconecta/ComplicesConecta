import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/buttons/Button';
import { Input } from '@/components/ui/forms/Input';
import { Coins, Gift, Users, TrendingUp, Copy, Check, Sparkles, Image as ImageIcon } from 'lucide-react';
// import { getUserTokenBalance, processReferralReward, validateReferralCode, TOKEN_CONFIG } from '@/lib/tokens'; // Eliminado
// Mock functions para compatibilidad
const TOKEN_CONFIG = {
  REFERRAL_REWARD: 50,
  WELCOME_BONUS: 50,
  MONTHLY_LIMIT: 500,
  RESET_DAY: 1,
};

const getUserTokenBalance = (userId: string) => ({
  userId,
  cmpxBalance: 0,
  monthlyEarned: 0,
  lastResetDate: new Date().toISOString(),
  referralCode: `CMPX${userId.slice(-6).toUpperCase()}`,
  totalReferrals: 0
});

const processReferralReward = async (_code: string, _userId: string) => ({
  success: false,
  message: 'FunciÃ³n migrada a TokenService'
});

const validateReferralCode = (code: string) => /^CMPX[A-Z0-9]{6}$/.test(code);
import { useToast } from '@/hooks/useToast';
import { useNavigate } from 'react-router-dom';

interface TokenBalanceProps {
  userId: string;
}

export function TokenBalance({ userId }: TokenBalanceProps) {
  const [balance, setBalance] = useState(getUserTokenBalance(userId));
  const [referralCode, setReferralCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    setBalance(getUserTokenBalance(userId));
  }, [userId]);

  const handleReferralSubmit = async () => {
    if (!referralCode.trim()) {
      toast({
        title: "Error",
        description: "Ingresa un cÃ³digo de referido",
        variant: "destructive"
      });
      return;
    }

    if (!validateReferralCode(referralCode)) {
      toast({
        title: "CÃ³digo invÃ¡lido",
        description: "El formato debe ser CMPX seguido de 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const result = await processReferralReward(referralCode, userId);
      
      if (result.success) {
        setBalance(getUserTokenBalance(userId));
        setReferralCode('');
        toast({
          title: "Â¡Recompensa recibida!",
          description: result.message,
          variant: "default"
        });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Error al procesar el cÃ³digo de referido",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(balance.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Â¡Copiado!",
        description: "CÃ³digo de referido copiado al portapapeles",
        variant: "default"
      });
    } catch {
      toast({
        title: "Error",
        description: "No se pudo copiar el cÃ³digo",
        variant: "destructive"
      });
    }
  };

  const remainingLimit = TOKEN_CONFIG.MONTHLY_LIMIT - balance.monthlyEarned;
  const progressPercentage = (balance.monthlyEarned / TOKEN_CONFIG.MONTHLY_LIMIT) * 100;

  return (
    <div className="space-y-6">
      {/* Balance Principal */}
      <Card className="bg-gradient-to-r from-purple-900/80 to-pink-900/80 backdrop-blur-sm border border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Coins className="h-6 w-6 text-yellow-400" />
            Balance CMPX
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">
              {balance.cmpxBalance.toLocaleString('es-MX')}
            </div>
            <div className="text-white/70">CMPX Disponibles</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-white/10 rounded-lg">
              <div className="text-lg font-semibold text-white">
                {balance.monthlyEarned}
              </div>
              <div className="text-xs text-white/70">Ganados este mes</div>
            </div>
            <div className="text-center p-3 bg-white/10 rounded-lg">
              <div className="text-lg font-semibold text-white">
                {remainingLimit}
              </div>
              <div className="text-xs text-white/70">Restantes este mes</div>
            </div>
          </div>

          {/* Barra de progreso mensual */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-white/70">
              <span>LÃ­mite mensual</span>
              <span>{balance.monthlyEarned}/{TOKEN_CONFIG.MONTHLY_LIMIT}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-300 progress-bar"
                data-progress={Math.min(progressPercentage, 100)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tu CÃ³digo de Referido */}
      <Card className="bg-card/80 backdrop-blur-sm border border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Gift className="h-5 w-5 text-green-400" />
            Tu CÃ³digo de Referido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg">
            <code className="flex-1 text-lg font-mono text-white bg-black/30 px-3 py-2 rounded">
              {balance.referralCode}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyReferralCode}
              className="text-white hover:bg-white/10"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="text-sm text-white/70">
            Comparte este cÃ³digo y gana <strong className="text-yellow-400">{TOKEN_CONFIG.REFERRAL_REWARD} CMPX</strong> por cada amigo que se registre.
          </div>
          
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Users className="h-4 w-4" />
            <span>{balance.totalReferrals} referidos exitosos</span>
          </div>
        </CardContent>
      </Card>

      {/* Canjear CÃ³digo de Referido */}
      <Card className="bg-card/80 backdrop-blur-sm border border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            Canjear CÃ³digo de Referido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Ingresa cÃ³digo (ej: CMPXABC123)"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              maxLength={10}
            />
          </div>
          
          <Button
            onClick={handleReferralSubmit}
            disabled={isProcessing || !referralCode.trim()}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            {isProcessing ? 'Procesando...' : `Canjear (+${TOKEN_CONFIG.WELCOME_BONUS} CMPX)`}
          </Button>
          
          <div className="text-xs text-white/60 text-center">
            RecibirÃ¡s <strong className="text-green-400">{TOKEN_CONFIG.WELCOME_BONUS} CMPX</strong> de bienvenida al usar un cÃ³digo vÃ¡lido
          </div>
        </CardContent>
      </Card>

      {/* GalerÃ­as NFT */}
      <Card className="bg-gradient-to-r from-purple-900/80 to-indigo-900/80 backdrop-blur-sm border border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-purple-400" />
            GalerÃ­as NFT-Verificadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-white/80">
            Convierte tus galerÃ­as en NFTs verificados usando tokens <strong className="text-purple-300">GTK</strong>. 
            Verifica la autenticidad de tus fotos en blockchain.
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-white/10 rounded-lg">
              <div className="text-white/70 mb-1">Costo GalerÃ­a</div>
              <div className="text-lg font-semibold text-white">1,000 GTK</div>
            </div>
            <div className="p-3 bg-white/10 rounded-lg">
              <div className="text-white/70 mb-1">Costo Imagen</div>
              <div className="text-lg font-semibold text-white">100 GTK</div>
            </div>
          </div>

          <Button
            onClick={() => navigate('/profile?tab=nft-galleries')}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Gestionar GalerÃ­as NFT
          </Button>

          <div className="text-xs text-white/60 text-center">
            ðŸ’¡ Los NFTs se activarÃ¡n en blockchain en Q2 2026. Actualmente en preparaciÃ³n.
          </div>
        </CardContent>
      </Card>

      {/* InformaciÃ³n del Sistema */}
      <Card className="bg-card/80 backdrop-blur-sm border border-primary/10">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <Badge variant="secondary" className="mb-2">
                Por Referido
              </Badge>
              <div className="text-lg font-semibold text-white">
                {TOKEN_CONFIG.REFERRAL_REWARD} CMPX
              </div>
            </div>
            <div>
              <Badge variant="secondary" className="mb-2">
                LÃ­mite Mensual
              </Badge>
              <div className="text-lg font-semibold text-white">
                {TOKEN_CONFIG.MONTHLY_LIMIT} CMPX
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-white/60 text-center">
            Los CMPX son tokens internos de ComplicesConecta. En futuras versiones podrÃ¡n convertirse en GTK (blockchain).
            Los GTK se usan para mint NFTs y hacer staking.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

