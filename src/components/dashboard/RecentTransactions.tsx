import { Transaction, Category, PaymentMethod } from '@/types/finance';
import { TransactionItem } from './TransactionItem';
import { ArrowRight } from 'lucide-react';

interface RecentTransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onViewAll: () => void;
  onTransactionClick: (transaction: Transaction) => void;
}

export function RecentTransactions({
  transactions,
  categories,
  paymentMethods,
  onViewAll,
  onTransactionClick,
}: RecentTransactionsProps) {
  const getCategoryById = (id: string) => categories.find(c => c.id === id);
  const getPaymentMethodById = (id: string) => paymentMethods.find(m => m.id === id);

  return (
    <div className="bg-card rounded-2xl p-6 shadow-soft animate-fade-in stagger-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Últimos Lançamentos</h3>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
        >
          Ver todos
          <ArrowRight size={16} />
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p>Nenhum lançamento ainda</p>
          <p className="text-sm mt-1">Toque no + para adicionar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.slice(0, 5).map((transaction, index) => (
            <div 
              key={transaction.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <TransactionItem
                transaction={transaction}
                category={getCategoryById(transaction.categoryId)}
                paymentMethod={getPaymentMethodById(transaction.paymentMethodId)}
                onClick={() => onTransactionClick(transaction)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
