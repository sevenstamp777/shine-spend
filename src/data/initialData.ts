import { Category, PaymentMethod, Transaction } from '@/types/finance';

export const defaultCategories: Category[] = [
  // ========== DESPESAS FIXAS ==========
  { id: 'cat-1', name: 'Aluguel', icon: 'Home', expenseType: 'fixed', type: 'expense' },
  { id: 'cat-2', name: 'Condomínio', icon: 'Building', expenseType: 'fixed', type: 'expense' },
  { id: 'cat-3', name: 'Internet', icon: 'Wifi', expenseType: 'fixed', type: 'expense' },
  { id: 'cat-4', name: 'Assinaturas', icon: 'Play', expenseType: 'fixed', type: 'expense' },
  { id: 'cat-5', name: 'Energia', icon: 'Zap', expenseType: 'fixed', type: 'expense' },
  { id: 'cat-6', name: 'Água', icon: 'Droplets', expenseType: 'fixed', type: 'expense' },
  { id: 'cat-7', name: 'Gás', icon: 'Flame', expenseType: 'fixed', type: 'expense' },
  { id: 'cat-8', name: 'Telefone', icon: 'Phone', expenseType: 'fixed', type: 'expense' },
  { id: 'cat-9', name: 'Seguro', icon: 'Shield', expenseType: 'fixed', type: 'expense' },
  { id: 'cat-10', name: 'Financiamento', icon: 'Landmark', expenseType: 'fixed', type: 'expense' },
  { id: 'cat-11', name: 'Mensalidade Escolar', icon: 'GraduationCap', expenseType: 'fixed', type: 'expense' },
  { id: 'cat-12', name: 'Academia', icon: 'Dumbbell', expenseType: 'fixed', type: 'expense' },
  
  // ========== DESPESAS VARIÁVEIS ==========
  { id: 'cat-20', name: 'Alimentação', icon: 'Utensils', expenseType: 'variable', type: 'expense' },
  { id: 'cat-21', name: 'Mercado', icon: 'ShoppingCart', expenseType: 'variable', type: 'expense' },
  { id: 'cat-22', name: 'Transporte', icon: 'Car', expenseType: 'variable', type: 'expense' },
  { id: 'cat-23', name: 'Combustível', icon: 'Fuel', expenseType: 'variable', type: 'expense' },
  { id: 'cat-24', name: 'Lazer', icon: 'Gamepad2', expenseType: 'variable', type: 'expense' },
  { id: 'cat-25', name: 'Saúde', icon: 'HeartPulse', expenseType: 'variable', type: 'expense' },
  { id: 'cat-26', name: 'Farmácia', icon: 'Pill', expenseType: 'variable', type: 'expense' },
  { id: 'cat-27', name: 'Compras', icon: 'ShoppingBag', expenseType: 'variable', type: 'expense' },
  { id: 'cat-28', name: 'Roupas', icon: 'Shirt', expenseType: 'variable', type: 'expense' },
  { id: 'cat-29', name: 'Educação', icon: 'BookOpen', expenseType: 'variable', type: 'expense' },
  { id: 'cat-30', name: 'Presentes', icon: 'Gift', expenseType: 'variable', type: 'expense' },
  { id: 'cat-31', name: 'Pets', icon: 'PawPrint', expenseType: 'variable', type: 'expense' },
  { id: 'cat-32', name: 'Viagem', icon: 'Plane', expenseType: 'variable', type: 'expense' },
  { id: 'cat-33', name: 'Manutenção Casa', icon: 'Wrench', expenseType: 'variable', type: 'expense' },
  { id: 'cat-34', name: 'Eletrônicos', icon: 'Smartphone', expenseType: 'variable', type: 'expense' },
  { id: 'cat-35', name: 'Beleza', icon: 'Sparkles', expenseType: 'variable', type: 'expense' },
  { id: 'cat-36', name: 'Outros (Despesa)', icon: 'MoreHorizontal', expenseType: 'variable', type: 'expense' },
  
  // ========== RECEITAS FIXAS ==========
  { id: 'cat-50', name: 'Salário', icon: 'Briefcase', expenseType: 'fixed', type: 'income' },
  { id: 'cat-51', name: 'Aposentadoria', icon: 'Armchair', expenseType: 'fixed', type: 'income' },
  { id: 'cat-52', name: 'Pensão', icon: 'HandCoins', expenseType: 'fixed', type: 'income' },
  { id: 'cat-53', name: 'Aluguel Recebido', icon: 'KeyRound', expenseType: 'fixed', type: 'income' },
  { id: 'cat-54', name: 'Benefício', icon: 'BadgeCheck', expenseType: 'fixed', type: 'income' },
  
  // ========== RECEITAS VARIÁVEIS ==========
  { id: 'cat-60', name: 'Freelance', icon: 'Laptop', expenseType: 'variable', type: 'income' },
  { id: 'cat-61', name: 'Investimentos', icon: 'TrendingUp', expenseType: 'variable', type: 'income' },
  { id: 'cat-62', name: 'Dividendos', icon: 'PiggyBank', expenseType: 'variable', type: 'income' },
  { id: 'cat-63', name: 'Venda', icon: 'Store', expenseType: 'variable', type: 'income' },
  { id: 'cat-64', name: 'Presente Recebido', icon: 'PartyPopper', expenseType: 'variable', type: 'income' },
  { id: 'cat-65', name: 'Reembolso', icon: 'RotateCcw', expenseType: 'variable', type: 'income' },
  { id: 'cat-66', name: 'Prêmio/Bônus', icon: 'Trophy', expenseType: 'variable', type: 'income' },
  { id: 'cat-67', name: 'Outros (Receita)', icon: 'Coins', expenseType: 'variable', type: 'income' },
];

export const defaultPaymentMethods: PaymentMethod[] = [
  { id: 'pm-1', name: 'Dinheiro', type: 'cash' },
  { id: 'pm-2', name: 'PIX', type: 'bank_account' },
  { id: 'pm-3', name: 'Débito', type: 'bank_account' },
  { id: 'pm-4', name: 'Cartão de Crédito', type: 'credit_card', limit: 5000, closingDay: 5, dueDay: 15 },
  { id: 'pm-5', name: 'Transferência', type: 'bank_account' },
];

// No sample transactions - start fresh
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
