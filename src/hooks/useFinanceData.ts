// File System Storage - dados salvos em arquivo JSON ou localStorage
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { 
  Category, 
  PaymentMethod, 
  Transaction, 
  Product,
  Budget,
  MonthlyBalance, 
  CategoryExpense 
} from '@/types/finance';
import { 
  defaultCategories, 
  defaultPaymentMethods, 
  sampleTransactions, 
  chartColors 
} from '@/data/initialData';
import migrated from '@/data/migrated.json';
import { useFileSystemStorage } from './useFileSystemStorage';
import type { FileSystemStorageData } from './useFileSystemStorage';

export function useFinanceData() {
  const fileSystem = useFileSystemStorage();
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(defaultPaymentMethods);
  const [products, setProducts] = useState<Product[]>(migrated.products as Product[]);
  const [budgets, setBudgets] = useState<Budget[]>(migrated.budgets as Budget[]);
  const [transactions, setTransactions] = useState<Transaction[]>(sampleTransactions);
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
          if (data.products?.length) setProducts(data.products);
          if (data.budgets?.length) setBudgets(data.budgets);
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
      fileSystem.saveData({ categories, paymentMethods, products, budgets, transactions });
    }
  }, [categories, paymentMethods, products, budgets, transactions, fileSystem.isReady, isInitialized, fileSystem.saveData]);

  // Handle file selection and load data
  const connectToFile = useCallback(async () => {
    const data = await fileSystem.selectFile();
    if (data) {
      if (data.categories?.length) setCategories(data.categories);
      if (data.paymentMethods?.length) setPaymentMethods(data.paymentMethods);
      if (data.products?.length) setProducts(data.products);
      if (data.budgets?.length) setBudgets(data.budgets);
      if (data.transactions) setTransactions(data.transactions);
    }
    setIsInitialized(true);
  }, [fileSystem]);

  // Import a full data snapshot (exported backup)
  const importData = useCallback((data: FileSystemStorageData) => {
    if (data.categories) setCategories(data.categories);
    if (data.paymentMethods) setPaymentMethods(data.paymentMethods);
    if (data.products) setProducts(data.products);
    if (data.budgets) setBudgets(data.budgets);
    if (data.transactions) setTransactions(data.transactions);
    setIsInitialized(true);
  }, []);

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

  // Calculate expenses by category for chart - NOW USES ITEM CATEGORIES
  const expensesByCategory: CategoryExpense[] = useMemo(() => {
    const expenseTransactions = monthlyTransactions.filter(t => t.type === 'expense');
    
    const categoryMap = new Map<string, number>();
    
    expenseTransactions.forEach(t => {
      // If transaction has items, use item categories
      if (t.items && t.items.length > 0) {
        t.items.forEach(item => {
          if (item.categoryId) {
            const current = categoryMap.get(item.categoryId) || 0;
            categoryMap.set(item.categoryId, current + item.totalPrice);
          }
        });
      } else {
        // Fallback for old transactions without items: use transaction category
        const current = categoryMap.get(t.categoryId) || 0;
        categoryMap.set(t.categoryId, current + t.amount);
      }
    });

    // Calculate total for percentages
    let totalExpenses = 0;
    categoryMap.forEach(amount => {
      totalExpenses += amount;
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

  const addProduct = useCallback((product: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
    };
    setProducts(prev => [...prev, newProduct]);
  }, []);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts(prev =>
      prev.map(p => p.id === id ? { ...p, ...updates } : p)
    );
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  const addBudget = useCallback((budget: Omit<Budget, 'categoryId' | 'categoryName'> & { categoryId: string; categoryName: string }) => {
    setBudgets(prev => {
      const existing = prev.find(b => b.categoryId === budget.categoryId);
      if (existing) {
        return prev.map(b => b.categoryId === budget.categoryId ? { ...b, ...budget } : b);
      }
      return [...prev, budget];
    });
  }, []);

  const updateBudget = useCallback((categoryId: string, limit: number) => {
    setBudgets(prev =>
      prev.map(b => b.categoryId === categoryId ? { ...b, limit } : b)
    );
  }, []);

  const deleteBudget = useCallback((categoryId: string) => {
    setBudgets(prev => prev.filter(b => b.categoryId !== categoryId));
  }, []);

  // Clear all data
  const clearAllData = useCallback(() => {
    setTransactions([]);
    setCategories(defaultCategories);
    setPaymentMethods(defaultPaymentMethods);
    setProducts(migrated.products as Product[]);
    setBudgets(migrated.budgets as Budget[]);
  }, []);

  return {
    // File System Status
    fileSystem: {
      isSupported: fileSystem.isSupported,
      isReady: fileSystem.isReady,
      isLoading: fileSystem.isLoading,
      fileName: fileSystem.fileName,
      error: fileSystem.error,
      usingFallback: fileSystem.usingFallback,
      connect: connectToFile,
      useLocalStorage: fileSystem.useLocalStorage,
    },
    
    // Data
    categories,
    paymentMethods,
    products,
    budgets,
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
    addProduct,
    updateProduct,
    deleteProduct,
    addBudget,
    updateBudget,
    deleteBudget,
    getCategoryById,
    getPaymentMethodById,
    clearAllData,
    importData,
  };
}
