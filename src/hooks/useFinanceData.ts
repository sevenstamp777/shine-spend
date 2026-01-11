// File System Storage - dados salvos em arquivo JSON no computador
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { 
  Category, 
  PaymentMethod, 
  Transaction, 
  MonthlyBalance, 
  CategoryExpense 
} from '@/types/finance';
import { 
  defaultCategories, 
  defaultPaymentMethods, 
  chartColors 
} from '@/data/initialData';
import { useFileSystemStorage } from './useFileSystemStorage';

export function useFinanceData() {
  const fileSystem = useFileSystemStorage();
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(defaultPaymentMethods);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isInitialized, setIsInitialized] = useState(false);
  const isFirstLoad = useRef(true);

  // Load data when file system is ready
  useEffect(() => {
    async function loadInitialData() {
      if (fileSystem.isReady && isFirstLoad.current) {
        isFirstLoad.current = false;
        const data = await fileSystem.loadData();
        if (data) {
          if (data.categories?.length) setCategories(data.categories);
          if (data.paymentMethods?.length) setPaymentMethods(data.paymentMethods);
          if (data.transactions) setTransactions(data.transactions);
        }
        setIsInitialized(true);
      }
    }
    loadInitialData();
  }, [fileSystem.isReady, fileSystem.loadData]);

  // Save data whenever it changes (after initialization)
  useEffect(() => {
    if (fileSystem.isReady && isInitialized) {
      fileSystem.saveData({ categories, paymentMethods, transactions });
    }
  }, [categories, paymentMethods, transactions, fileSystem.isReady, isInitialized, fileSystem.saveData]);

  // Handle file selection and load data
  const connectToFile = useCallback(async () => {
    const data = await fileSystem.selectFile();
    if (data) {
      if (data.categories?.length) setCategories(data.categories);
      if (data.paymentMethods?.length) setPaymentMethods(data.paymentMethods);
      if (data.transactions) setTransactions(data.transactions);
    }
    setIsInitialized(true);
  }, [fileSystem]);

  // Filter transactions by selected month
  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate.getMonth() === selectedMonth.getMonth() &&
        transactionDate.getFullYear() === selectedMonth.getFullYear()
      );
    });
  }, [transactions, selectedMonth]);

  // Calculate monthly balance
  const monthlyBalance: MonthlyBalance = useMemo(() => {
    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }, [monthlyTransactions]);

  // Calculate expenses by category for chart
  const expensesByCategory: CategoryExpense[] = useMemo(() => {
    const expenseTransactions = monthlyTransactions.filter(t => t.type === 'expense');
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

    const categoryMap = new Map<string, number>();
    
    expenseTransactions.forEach(t => {
      const current = categoryMap.get(t.categoryId) || 0;
      categoryMap.set(t.categoryId, current + t.amount);
    });

    const result: CategoryExpense[] = [];
    let colorIndex = 0;

    categoryMap.forEach((amount, categoryId) => {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        result.push({
          categoryId,
          categoryName: category.name,
          categoryIcon: category.icon,
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
          color: chartColors[colorIndex % chartColors.length],
        });
        colorIndex++;
      }
    });

    return result.sort((a, b) => b.amount - a.amount);
  }, [monthlyTransactions, categories]);

  // Get recent transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [transactions]);

  // CRUD operations
  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `tr-${Date.now()}`,
    };
    setTransactions(prev => [...prev, newTransaction]);
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => 
      prev.map(t => t.id === id ? { ...t, ...updates } : t)
    );
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const addCategory = useCallback((category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: `cat-${Date.now()}`,
    };
    setCategories(prev => [...prev, newCategory]);
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setCategories(prev => 
      prev.map(c => c.id === id ? { ...c, ...updates } : c)
    );
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  const addPaymentMethod = useCallback((method: Omit<PaymentMethod, 'id'>) => {
    const newMethod: PaymentMethod = {
      ...method,
      id: `pm-${Date.now()}`,
    };
    setPaymentMethods(prev => [...prev, newMethod]);
  }, []);

  const updatePaymentMethod = useCallback((id: string, updates: Partial<PaymentMethod>) => {
    setPaymentMethods(prev => 
      prev.map(m => m.id === id ? { ...m, ...updates } : m)
    );
  }, []);

  const deletePaymentMethod = useCallback((id: string) => {
    setPaymentMethods(prev => prev.filter(m => m.id !== id));
  }, []);

  const getCategoryById = useCallback((id: string) => {
    return categories.find(c => c.id === id);
  }, [categories]);

  const getPaymentMethodById = useCallback((id: string) => {
    return paymentMethods.find(m => m.id === id);
  }, [paymentMethods]);

  // Clear all data
  const clearAllData = useCallback(() => {
    setTransactions([]);
    setCategories(defaultCategories);
    setPaymentMethods(defaultPaymentMethods);
  }, []);

  return {
    // File System Status
    fileSystem: {
      isSupported: fileSystem.isSupported,
      isReady: fileSystem.isReady,
      isLoading: fileSystem.isLoading,
      fileName: fileSystem.fileName,
      error: fileSystem.error,
      connect: connectToFile,
      disconnect: fileSystem.disconnect,
    },
    
    // Data
    categories,
    paymentMethods,
    transactions,
    monthlyTransactions,
    monthlyBalance,
    expensesByCategory,
    recentTransactions,
    selectedMonth,
    isInitialized,
    
    // Setters
    setSelectedMonth,
    
    // Operations
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    getCategoryById,
    getPaymentMethodById,
    clearAllData,
  };
}
