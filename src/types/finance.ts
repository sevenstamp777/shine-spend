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
export type DiscountType = 'amount' | 'percent';

export interface TransactionItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string; // Unidade de medida: UN, KG, L, ML, G, CX, etc.
  unitPrice: number;
  discount?: number; // Desconto aplicado ao item (na unidade definida por discountType)
  discountType?: DiscountType; // 'amount' = em R$; 'percent' = % do subtotal do item
  totalPrice: number; // (quantity * unitPrice) - desconto convertido em R$
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

// Produto do catálogo (autocomplete e histórico)
export interface Product {
  id: string;
  name: string;
  categoryId?: string;
}

// Limite mensal por categoria
export interface Budget {
  categoryId: string;
  categoryName: string;
  limit: number;
}
