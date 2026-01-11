import { useState } from 'react';
import { ChevronDown, ChevronUp, Receipt } from 'lucide-react';
import { Transaction, Category, PaymentMethod } from '@/types/finance';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { cn } from '@/lib/utils';

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  paymentMethod?: PaymentMethod;
  onClick?: () => void;
  showDetails?: boolean;
}

export function TransactionItem({ 
  transaction, 
  category, 
  paymentMethod,
  onClick,
  showDetails = false,
}: TransactionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isIncome = transaction.type === 'income';
  const hasItems = transaction.items && transaction.items.length > 0;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-card rounded-xl overflow-hidden">
      <button
        onClick={handleClick}
        className="w-full flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors duration-200 text-left group"
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
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground truncate">
              {transaction.description}
            </p>
            {hasItems && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                <Receipt size={10} />
                {transaction.items!.length}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {category?.name} • {paymentMethod?.name}
          </p>
        </div>

        <div className="text-right flex-shrink-0 flex items-center gap-2">
          <div>
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
          
          {hasItems && showDetails && (
            <button
              onClick={handleExpandClick}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </button>

      {/* Expanded Items View */}
      {hasItems && isExpanded && showDetails && (
        <div className="px-4 pb-4 pt-0">
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground border-b border-border pb-2">
              <Receipt size={12} />
              <span>Itens discriminados:</span>
            </div>
            
            {transaction.items!.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-muted-foreground text-xs w-4">
                    {index + 1}.
                  </span>
                  <span className="truncate">{item.name}</span>
                  <span className="text-muted-foreground text-xs flex-shrink-0">
                    ({item.quantity}x R${item.unitPrice.toFixed(2)})
                  </span>
                </div>
                <span className="font-medium flex-shrink-0">
                  {formatCurrency(item.totalPrice)}
                </span>
              </div>
            ))}

            <div className="flex items-center justify-between text-sm font-semibold border-t border-border pt-2 mt-2">
              <span>Total</span>
              <span className={isIncome ? "text-success" : "text-destructive"}>
                {formatCurrency(transaction.amount)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
