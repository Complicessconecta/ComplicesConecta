// Componente de historial de transacciones de tokens
// Fase 4: Componente de Billetera UI

import { ArrowDown, ArrowUp, TrendingUp, Lock, Unlock, Gift, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/cards/Card';
import { TokenTransaction } from '@/services/wallet/WalletService';

interface TransactionHistoryProps {
  transactions: TokenTransaction[];
  loading?: boolean;
}

export function TransactionHistory({ transactions, loading = false }: TransactionHistoryProps) {
  const getTransactionIcon = (type: TokenTransaction['transactionType']) => {
    switch (type) {
      case 'earn':
        return <ArrowDown className="h-4 w-4 text-green-400" />;
      case 'spend':
        return <ArrowUp className="h-4 w-4 text-red-400" />;
      case 'transfer':
        return <ArrowRight className="h-4 w-4 text-blue-400" />;
      case 'stake':
        return <Lock className="h-4 w-4 text-purple-400" />;
      case 'unstake':
        return <Unlock className="h-4 w-4 text-purple-400" />;
      case 'reward':
        return <Gift className="h-4 w-4 text-yellow-400" />;
      default:
        return <TrendingUp className="h-4 w-4 text-white/60" />;
    }
  };

  const getTransactionLabel = (type: TokenTransaction['transactionType']) => {
    switch (type) {
      case 'earn':
        return 'Recibido';
      case 'spend':
        return 'Gastado';
      case 'transfer':
        return 'Transferencia';
      case 'stake':
        return 'Stake';
      case 'unstake':
        return 'Unstake';
      case 'reward':
        return 'Recompensa';
      default:
        return type;
    }
  };

  const getAmountColor = (type: TokenTransaction['transactionType']) => {
    switch (type) {
      case 'earn':
      case 'reward':
        return 'text-green-400';
      case 'spend':
        return 'text-red-400';
      case 'stake':
      case 'transfer':
        return 'text-purple-400';
      case 'unstake':
        return 'text-blue-400';
      default:
        return 'text-white';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20 rounded-2xl p-6 shadow-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/3" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-white/10 rounded-lg" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20 rounded-2xl p-6 shadow-xl">
        <div className="text-center py-8">
          <TrendingUp className="h-12 w-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/60">No hay transacciones aún</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 rounded-2xl p-6 shadow-xl">
      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-purple-400" /> Historial de Transacciones
      </h3>

      <div className="space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                {getTransactionIcon(tx.transactionType)}
              </div>
              <div>
                <p className="text-white font-medium text-sm">
                  {getTransactionLabel(tx.transactionType)}
                </p>
                <p className="text-white/60 text-xs">
                  {tx.description || 'Sin descripción'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className={`font-bold ${getAmountColor(tx.transactionType)}`}>
                {tx.transactionType === 'spend' ? '-' : '+'}{tx.amount.toFixed(2)} {tx.tokenType.toUpperCase()}
              </p>
              <p className="text-white/40 text-xs">{formatDate(tx.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
