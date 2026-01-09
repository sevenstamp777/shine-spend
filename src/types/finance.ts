export type TransactionType = 'income' | 'expense';
export type ExpenseType = 'fixed' | 'variable';
export type PaymentMethodType = 'credit_card' | 'cash' | 'bank_account';

export interface Category {
  id: string;
  name: string;
  icon: string;
  expenseType?: ExpenseType;
  type: TransactionType;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  limit?: number;
  closingDay?: number;
  dueDay?: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: Date;
  categoryId: string;
  paymentMethodId: string;
  notes?: string;
}

export interface MonthlyBalance {
  income: number;
  expenses: number;
  balance: number;
}

export interface CategoryExpense {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  amount: number;
  percentage: number;
  color: string;
}
