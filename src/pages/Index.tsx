import { useState } from 'react';
import { Transaction } from '@/types/finance';
import { useFinanceData } from '@/hooks/useFinanceData';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { FloatingActionButton } from '@/components/layout/FloatingActionButton';
import { TransactionForm } from '@/components/transaction/TransactionForm';
import { DashboardView } from './DashboardView';
import { TransactionsView } from './TransactionsView';
import { CategoriesView } from './CategoriesView';
import { PaymentMethodsView } from './PaymentMethodsView';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

type TabId = 'dashboard' | 'transactions' | 'categories' | 'payments';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const {
    categories,
    paymentMethods,
    transactions,
    monthlyBalance,
    expensesByCategory,
    recentTransactions,
    selectedMonth,
    setSelectedMonth,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    deleteCategory,
    addPaymentMethod,
    deletePaymentMethod,
  } = useFinanceData();

  const handleAddClick = () => {
    setEditingTransaction(null);
    setShowTransactionForm(true);
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionForm(true);
  };

  const handleSaveTransaction = (data: Omit<Transaction, 'id'>) => {
    if (editingTransaction) {
      updateTransaction(editingTransaction.id, data);
      toast.success('Lançamento atualizado!');
    } else {
      addTransaction(data);
      toast.success('Lançamento adicionado!');
    }
    setShowTransactionForm(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = () => {
    if (editingTransaction) {
      deleteTransaction(editingTransaction.id);
      toast.success('Lançamento excluído!');
      setShowTransactionForm(false);
      setEditingTransaction(null);
    }
  };

  const handleAddCategory = (category: Omit<typeof categories[0], 'id'>) => {
    addCategory(category);
    toast.success('Categoria criada!');
  };

  const handleDeleteCategory = (id: string) => {
    deleteCategory(id);
    toast.success('Categoria excluída!');
  };

  const handleAddPaymentMethod = (method: Omit<typeof paymentMethods[0], 'id'>) => {
    addPaymentMethod(method);
    toast.success('Meio de pagamento criado!');
  };

  const handleDeletePaymentMethod = (id: string) => {
    deletePaymentMethod(id);
    toast.success('Meio de pagamento excluído!');
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-lg mx-auto px-4 py-4">
        {activeTab === 'dashboard' && (
          <DashboardView
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            monthlyBalance={monthlyBalance}
            expensesByCategory={expensesByCategory}
            recentTransactions={recentTransactions}
            categories={categories}
            paymentMethods={paymentMethods}
            onViewAllTransactions={() => setActiveTab('transactions')}
            onTransactionClick={handleTransactionClick}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            categories={categories}
            paymentMethods={paymentMethods}
            onTransactionClick={handleTransactionClick}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesView
            categories={categories}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentMethodsView
            paymentMethods={paymentMethods}
            onAddPaymentMethod={handleAddPaymentMethod}
            onDeletePaymentMethod={handleDeletePaymentMethod}
          />
        )}
      </main>

      <FloatingActionButton onClick={handleAddClick} />
      
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {showTransactionForm && (
        <TransactionForm
          categories={categories}
          paymentMethods={paymentMethods}
          transaction={editingTransaction}
          onSave={handleSaveTransaction}
          onDelete={editingTransaction ? handleDeleteTransaction : undefined}
          onClose={() => {
            setShowTransactionForm(false);
            setEditingTransaction(null);
          }}
        />
      )}

      <Toaster position="top-center" />
    </div>
  );
};

export default Index;
