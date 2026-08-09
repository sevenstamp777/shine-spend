import { Category, PaymentMethod, Transaction } from '@/types/finance';
import migrated from './migrated.json';

export const defaultCategories: Category[] = migrated.categories as Category[];
export const defaultPaymentMethods: PaymentMethod[] = migrated.paymentMethods as PaymentMethod[];
export const sampleTransactions: Transaction[] = migrated.transactions as Transaction[];

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
