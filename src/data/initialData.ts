import { Category, PaymentMethod, Transaction } from '@/types/finance';

// Dados padrão genéricos para quem instala o app pela primeira vez.
// Cada pessoa começa zerada (sem lançamentos, produtos ou orçamentos) e só
// vê dados de outra pessoa se digitar o token de sincronização dela.
export const defaultCategories: Category[] = [
  { id: 'cat-1', name: 'Alimentação', icon: 'Utensils', expenseType: 'variable', type: 'expense' },
  { id: 'cat-2', name: 'Transporte', icon: 'Car', expenseType: 'variable', type: 'expense' },
  { id: 'cat-3', name: 'Moradia', icon: 'Home', expenseType: 'fixed', type: 'expense' },
  { id: 'cat-4', name: 'Saúde', icon: 'HeartPulse', expenseType: 'variable', type: 'expense' },
  { id: 'cat-5', name: 'Compras', icon: 'ShoppingBag', expenseType: 'variable', type: 'expense' },
  { id: 'cat-6', name: 'Lazer', icon: 'Gamepad2', expenseType: 'variable', type: 'expense' },
  { id: 'cat-7', name: 'Educação', icon: 'GraduationCap', expenseType: 'variable', type: 'expense' },
  { id: 'cat-8', name: 'Telefone', icon: 'Phone', expenseType: 'fixed', type: 'expense' },
  { id: 'cat-9', name: 'Contas', icon: 'FileText', expenseType: 'fixed', type: 'expense' },
  { id: 'cat-10', name: 'Outros', icon: 'MoreHorizontal', expenseType: 'variable', type: 'expense' },
  { id: 'cat-11', name: 'Receitas', icon: 'HandCoins', expenseType: 'variable', type: 'income' },
];

export const defaultPaymentMethods: PaymentMethod[] = [
  { id: 'pm-1', name: 'Dinheiro', type: 'cash' },
  { id: 'pm-2', name: 'Pix', type: 'bank_account' },
  { id: 'pm-3', name: 'Crédito', type: 'credit_card' },
  { id: 'pm-4', name: 'Débito', type: 'bank_account' },
];

// Sem lançamentos pré-carregados: cada pessoa começa do zero.
export const sampleTransactions: Transaction[] = [];

export const chartColors = [
  'hsl(173, 58%, 39%)',  // primary teal
  'hsl(199, 89%, 48%)',  // blue
  'hsl(262, 83%, 58%)',  // purple
  'hsl(38, 92%, 50%)',   // amber
  'hsl(0, 72%, 51%)',    // red
  'hsl(152, 69%, 40%)',  // green
  'hsl(326, 78%, 48%)',  // pink
  'hsl(20, 90%, 48%)',   // orange
  'hsl(47, 96%, 53%)',   // yellow
  'hsl(221, 83%, 53%)',  // indigo
];
