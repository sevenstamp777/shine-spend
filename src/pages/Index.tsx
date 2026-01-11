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
import { Database, FileText, FolderOpen } from 'lucide-react';

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

  // Show loading state
  if (fileSystem.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
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

  const handleSwitchToFile = async () => {
    await fileSystem.connect();
    toast.success('Dados migrados para arquivo!');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Storage indicator */}
      <div className="bg-muted/30 border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {fileSystem.usingFallback ? (
            <Database className="w-4 h-4" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          <span className="font-medium text-foreground">{fileSystem.fileName}</span>
        </div>
        {fileSystem.isSupported && fileSystem.usingFallback && (
          <button
            onClick={handleSwitchToFile}
            className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            <FolderOpen className="w-3 h-3" />
            Salvar em arquivo
          </button>
        )}
        {!fileSystem.usingFallback && (
          <button
            onClick={fileSystem.useLocalStorage}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Usar armazenamento local
          </button>
        )}
      </div>

      <main className="container max-w-lg mx-auto px-4 py-4 pb-24">
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
