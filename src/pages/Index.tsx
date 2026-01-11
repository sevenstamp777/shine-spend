import { useState } from 'react';
import { Transaction } from '@/types/finance';
import { useFinanceData } from '@/hooks/useFinanceData';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { FloatingActionButton } from '@/components/layout/FloatingActionButton';
import { TransactionForm } from '@/components/transaction/TransactionForm';
import { FileSetupScreen } from '@/components/setup/FileSetupScreen';
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
    fileSystem,
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
    updateCategory,
    deleteCategory,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
  } = useFinanceData();

  // Show setup screen if file system not ready
  if (fileSystem.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!fileSystem.isReady) {
    return (
      <>
        <FileSetupScreen
          isSupported={fileSystem.isSupported}
          error={fileSystem.error}
          onConnect={fileSystem.connect}
        />
        <Toaster position="top-center" />
      </>
    );
  }

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

  const handleUpdateCategory = (id: string, category: Partial<typeof categories[0]>) => {
    updateCategory(id, category);
    toast.success('Categoria atualizada!');
  };

  const handleDeleteCategory = (id: string) => {
    deleteCategory(id);
    toast.success('Categoria excluída!');
  };

  const handleAddPaymentMethod = (method: Omit<typeof paymentMethods[0], 'id'>) => {
    addPaymentMethod(method);
    toast.success('Meio de pagamento criado!');
  };

  const handleUpdatePaymentMethod = (id: string, method: Partial<typeof paymentMethods[0]>) => {
    updatePaymentMethod(id, method);
    toast.success('Meio de pagamento atualizado!');
  };

  const handleDeletePaymentMethod = (id: string) => {
    deletePaymentMethod(id);
    toast.success('Meio de pagamento excluído!');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* File indicator */}
      <div className="bg-muted/30 border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span className="font-medium text-foreground">{fileSystem.fileName}</span>
        </div>
        <button
          onClick={fileSystem.disconnect}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Trocar arquivo
        </button>
      </div>

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
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentMethodsView
            paymentMethods={paymentMethods}
            onAddPaymentMethod={handleAddPaymentMethod}
            onUpdatePaymentMethod={handleUpdatePaymentMethod}
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
