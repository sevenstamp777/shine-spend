import { Category, PaymentMethod, Transaction } from '@/types/finance';

export const defaultCategories: Category[] = [
  // Fixed expenses
  { id: 'cat-1', name: 'Aluguel', icon: 'Home', expenseType: 'fixed', type: 'expense' },
  { id: 'cat-2', name: 'Condomínio', icon: 'Building', expenseType: 'fixed', type: 'expense' },
  { id: 'cat-3', name: 'Internet', icon: 'Wifi', expenseType: 'fixed', type: 'expense' },
  { id: 'cat-4', name: 'Assinaturas', icon: 'Play', expenseType: 'fixed', type: 'expense' },
  { id: 'cat-5', name: 'Energia', icon: 'Zap', expenseType: 'fixed', type: 'expense' },
  { id: 'cat-6', name: 'Água', icon: 'Droplets', expenseType: 'fixed', type: 'expense' },
  
  // Variable expenses
  { id: 'cat-7', name: 'Alimentação', icon: 'Utensils', expenseType: 'variable', type: 'expense' },
  { id: 'cat-8', name: 'Transporte', icon: 'Car', expenseType: 'variable', type: 'expense' },
  { id: 'cat-9', name: 'Lazer', icon: 'Gamepad2', expenseType: 'variable', type: 'expense' },
  { id: 'cat-10', name: 'Saúde', icon: 'HeartPulse', expenseType: 'variable', type: 'expense' },
  { id: 'cat-11', name: 'Compras', icon: 'ShoppingBag', expenseType: 'variable', type: 'expense' },
  { id: 'cat-12', name: 'Educação', icon: 'GraduationCap', expenseType: 'variable', type: 'expense' },
  
  // Income categories
  { id: 'cat-13', name: 'Salário', icon: 'Briefcase', type: 'income' },
  { id: 'cat-14', name: 'Freelance', icon: 'Laptop', type: 'income' },
  { id: 'cat-15', name: 'Investimentos', icon: 'TrendingUp', type: 'income' },
  { id: 'cat-16', name: 'Outros', icon: 'Coins', type: 'income' },
];

export const defaultPaymentMethods: PaymentMethod[] = [
  { id: 'pm-1', name: 'Dinheiro', type: 'cash' },
  { id: 'pm-2', name: 'PIX', type: 'bank_account' },
  { id: 'pm-3', name: 'Débito', type: 'bank_account' },
  { id: 'pm-4', name: 'Cartão Nubank', type: 'credit_card', limit: 5000, closingDay: 3, dueDay: 10 },
  { id: 'pm-5', name: 'Cartão Inter', type: 'credit_card', limit: 3000, closingDay: 15, dueDay: 22 },
];

// Sample transactions for demo
const today = new Date();
const currentMonth = today.getMonth();
const currentYear = today.getFullYear();

export const sampleTransactions: Transaction[] = [
  {
    id: 'tr-1',
    description: 'Salário',
    amount: 8500,
    type: 'income',
    date: new Date(currentYear, currentMonth, 5),
    categoryId: 'cat-13',
    paymentMethodId: 'pm-2',
  },
  {
    id: 'tr-2',
    description: 'Aluguel do apartamento',
    amount: 1800,
    type: 'expense',
    date: new Date(currentYear, currentMonth, 5),
    categoryId: 'cat-1',
    paymentMethodId: 'pm-2',
  },
  {
    id: 'tr-3',
    description: 'Mercado da semana',
    amount: 450,
    type: 'expense',
    date: new Date(currentYear, currentMonth, 8),
    categoryId: 'cat-7',
    paymentMethodId: 'pm-4',
  },
  {
    id: 'tr-4',
    description: 'Uber para o trabalho',
    amount: 35,
    type: 'expense',
    date: new Date(currentYear, currentMonth, today.getDate() - 2),
    categoryId: 'cat-8',
    paymentMethodId: 'pm-2',
  },
  {
    id: 'tr-5',
    description: 'Netflix',
    amount: 55.90,
    type: 'expense',
    date: new Date(currentYear, currentMonth, 1),
    categoryId: 'cat-4',
    paymentMethodId: 'pm-4',
  },
  {
    id: 'tr-6',
    description: 'Jantar com amigos',
    amount: 180,
    type: 'expense',
    date: new Date(currentYear, currentMonth, today.getDate() - 1),
    categoryId: 'cat-9',
    paymentMethodId: 'pm-4',
  },
  {
    id: 'tr-7',
    description: 'Conta de luz',
    amount: 220,
    type: 'expense',
    date: new Date(currentYear, currentMonth, 10),
    categoryId: 'cat-5',
    paymentMethodId: 'pm-2',
  },
  {
    id: 'tr-8',
    description: 'Farmácia',
    amount: 89.50,
    type: 'expense',
    date: new Date(currentYear, currentMonth, today.getDate()),
    categoryId: 'cat-10',
    paymentMethodId: 'pm-1',
  },
  {
    id: 'tr-9',
    description: 'Projeto freelance',
    amount: 2500,
    type: 'income',
    date: new Date(currentYear, currentMonth, 15),
    categoryId: 'cat-14',
    paymentMethodId: 'pm-2',
  },
  {
    id: 'tr-10',
    description: 'Internet',
    amount: 119.90,
    type: 'expense',
    date: new Date(currentYear, currentMonth, 12),
    categoryId: 'cat-3',
    paymentMethodId: 'pm-2',
  },
];

export const chartColors = [
  'hsl(173, 58%, 39%)',  // primary teal
  'hsl(199, 89%, 48%)',  // blue
  'hsl(262, 83%, 58%)',  // purple
  'hsl(38, 92%, 50%)',   // amber
  'hsl(0, 72%, 51%)',    // red
  'hsl(152, 69%, 40%)',  // green
  'hsl(326, 78%, 48%)',  // pink
  'hsl(20, 90%, 48%)',   // orange
];
