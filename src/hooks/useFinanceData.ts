// LocalStorage persistence enabled
import { useState, useMemo, useCallback, useEffect } from 'react';
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

const STORAGE_KEYS = {
  categories: 'finapp_categories',
  paymentMethods: 'finapp_payment_methods',
  transactions: 'finapp_transactions',
} as const;

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
  }
  return defaultValue;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

export function useFinanceData() {
  const [categories, setCategories] = useState<Category[]>(() => 
    loadFromStorage(STORAGE_KEYS.categories, defaultCategories)
  );
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => 
    loadFromStorage(STORAGE_KEYS.paymentMethods, defaultPaymentMethods)
  );
  const [transactions, setTransactions] = useState<Transaction[]>(() => 
    loadFromStorage(STORAGE_KEYS.transactions, [])
  );
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Persist to localStorage whenever data changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.categories, categories);
  }, [categories]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.paymentMethods, paymentMethods);
  }, [paymentMethods]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.transactions, transactions);
  }, [transactions]);

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
    // Data
    categories,
    paymentMethods,
    transactions,
    monthlyTransactions,
    monthlyBalance,
    expensesByCategory,
    recentTransactions,
    selectedMonth,
    
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
