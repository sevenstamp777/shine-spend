import { Transaction, Category, PaymentMethod, MonthlyBalance, CategoryExpense } from '@/types/finance';
import { Header } from '@/components/layout/Header';
import { MonthSelector } from '@/components/dashboard/MonthSelector';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { ExpenseChart } from '@/components/dashboard/ExpenseChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';

interface DashboardViewProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  monthlyBalance: MonthlyBalance;
  expensesByCategory: CategoryExpense[];
  recentTransactions: Transaction[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onViewAllTransactions: () => void;
  onTransactionClick: (transaction: Transaction) => void;
}

export function DashboardView({
  selectedMonth,
  onMonthChange,
  monthlyBalance,
  expensesByCategory,
  recentTransactions,
  categories,
  paymentMethods,
  onViewAllTransactions,
  onTransactionClick,
}: DashboardViewProps) {
  return (
    <div className="pb-32">
      <Header />
      
      <div className="mt-4 space-y-6">
        <MonthSelector 
          selectedMonth={selectedMonth} 
          onMonthChange={onMonthChange} 
        />
        
        <BalanceCard 
          income={monthlyBalance.income}
          expenses={monthlyBalance.expenses}
          balance={monthlyBalance.balance}
        />
        
        <ExpenseChart data={expensesByCategory} />
        
        <RecentTransactions
          transactions={recentTransactions}
          categories={categories}
          paymentMethods={paymentMethods}
          onViewAll={onViewAllTransactions}
          onTransactionClick={onTransactionClick}
        />
      </div>
    </div>
  );
}
