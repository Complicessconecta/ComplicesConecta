// Componente de tarjeta de billetera para mostrar balance de tokens
// Fase 4: Componente de Billetera UI

import { Wallet, Coins, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/cards/Card';

interface WalletCardProps {
  cmpxBalance: number;
  gtkBalance: number;
  cmpxLocked?: number;
  gtkLocked?: number;
  address?: string;
  loading?: boolean;
}

export function WalletCard({
  cmpxBalance,
  gtkBalance,
  cmpxLocked = 0,
  gtkLocked = 0,
  address,
  loading = false,
}: WalletCardProps) {
  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20 rounded-2xl p-6 shadow-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-20 bg-white/10 rounded-xl" />
            <div className="h-20 bg-white/10 rounded-xl" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-bold flex items-center gap-2 text-lg">
          <Wallet className="h-5 w-5 text-purple-400" /> Mi Billetera
        </h3>
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <ShieldCheck className="h-3 w-3 mr-1" /> Cuenta Segura
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Token Interno CMPX */}
        <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 p-4 rounded-xl border border-white/10">
          <div className="flex justify-between items-start mb-2">
            <span className="text-white/60 text-xs font-medium">SALDO INTERNO</span>
            <Coins className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white">{cmpxBalance.toFixed(2)}</span>
            <span className="text-purple-400 text-xs font-bold">CMPX</span>
          </div>
          {cmpxLocked > 0 && (
            <p className="text-white/40 text-xs mt-1">
              {cmpxLocked.toFixed(2)} bloqueados
            </p>
          )}
        </div>

        {/* Token Web3 GTK */}
        <div className="bg-gradient-to-br from-fuchsia-600/20 to-orange-600/20 p-4 rounded-xl border border-white/10">
          <div className="flex justify-between items-start mb-2">
            <span className="text-white/60 text-xs font-medium">BLOCKCHAIN WALLET</span>
            <ArrowUpRight className="h-4 w-4 text-orange-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white">{gtkBalance.toFixed(2)}</span>
            <span className="text-orange-400 text-xs font-bold">GTK</span>
          </div>
          {gtkLocked > 0 && (
            <p className="text-white/40 text-xs mt-1">
              {gtkLocked.toFixed(2)} en staking
            </p>
          )}
        </div>
      </div>

      {address && (
        <p className="mt-4 text-[10px] text-white/30 truncate font-mono">
          Wallet: {address}
        </p>
      )}
    </Card>
  );
}
