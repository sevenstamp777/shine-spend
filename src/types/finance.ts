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

// Item individual de uma transação (como linha de cupom fiscal)
export interface TransactionItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: number; // Desconto aplicado ao item
  totalPrice: number; // (quantity * unitPrice) - discount
  categoryId?: string; // Categoria individual do item
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
  // Itens detalhados (opcional - para discriminação tipo cupom fiscal)
  items?: TransactionItem[];
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
