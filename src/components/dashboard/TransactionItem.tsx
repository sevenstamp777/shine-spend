import { Transaction, Category, PaymentMethod } from '@/types/finance';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { cn } from '@/lib/utils';

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  paymentMethod?: PaymentMethod;
  onClick?: () => void;
}

export function TransactionItem({ 
  transaction, 
  category, 
  paymentMethod,
  onClick 
}: TransactionItemProps) {
  const isIncome = transaction.type === 'income';

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl bg-card hover:bg-accent/50 transition-colors duration-200 text-left group"
    >
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105",
        isIncome ? "bg-success-muted" : "bg-destructive-muted"
      )}>
        <CategoryIcon 
          name={category?.icon || 'Coins'} 
          size={22}
          className={cn(
            isIncome ? "text-success" : "text-destructive"
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">
          {transaction.description}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {category?.name} • {paymentMethod?.name}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className={cn(
          "font-semibold",
          isIncome ? "text-success" : "text-destructive"
        )}>
          {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(transaction.date)}
        </p>
      </div>
    </button>
  );
}
