import { useState, useMemo, useCallback } from 'react';
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
  sampleTransactions,
  chartColors 
} from '@/data/initialData';

export function useFinanceData() {
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(defaultPaymentMethods);
  const [transactions, setTransactions] = useState<Transaction[]>(sampleTransactions);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

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

  const deletePaymentMethod = useCallback((id: string) => {
    setPaymentMethods(prev => prev.filter(m => m.id !== id));
  }, []);

  const getCategoryById = useCallback((id: string) => {
    return categories.find(c => c.id === id);
  }, [categories]);

  const getPaymentMethodById = useCallback((id: string) => {
    return paymentMethods.find(m => m.id === id);
  }, [paymentMethods]);

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
    deleteCategory,
    addPaymentMethod,
    deletePaymentMethod,
    getCategoryById,
    getPaymentMethodById,
  };
}
