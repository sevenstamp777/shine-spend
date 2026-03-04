import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface BalanceCardProps {
  income: number;
  expenses: number;
  balance: number;
}

export function BalanceCard({ income, expenses, balance }: BalanceCardProps) {
  const isPositive = balance >= 0;

  return (
    <div className="rounded-2xl gradient-primary p-6 text-primary-foreground shadow-soft-lg animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <Wallet size={20} />
          </div>
          <span className="font-medium opacity-90">Saldo do Mês</span>
        </div>
      </div>
      
      <div className="mb-6">
        <p className={cn(
          "text-4xl font-bold tracking-tight",
          isPositive ? "text-primary-foreground" : "text-primary-foreground"
        )}>
          {formatCurrency(balance)}
        </p>
        <p className="text-sm opacity-75 mt-1">
          {isPositive ? 'Você está no positivo! 🎉' : 'Atenção aos gastos'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-primary-foreground/10 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
              <TrendingUp size={14} className="text-success-foreground" />
            </div>
            <span className="text-xs opacity-75">Receitas</span>
          </div>
          <p className="text-lg font-semibold">{formatCurrency(income)}</p>
        </div>

        <div className="bg-primary-foreground/10 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
              <TrendingDown size={14} className="text-destructive-foreground" />
            </div>
            <span className="text-xs opacity-75">Despesas</span>
          </div>
          <p className="text-lg font-semibold">{formatCurrency(expenses)}</p>
        </div>
      </div>
    </div>
  );
}
