import {
  pgTable,
  text,
  serial,
  timestamp,
  numeric,
  integer,
  boolean,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Usuários
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  githubId: varchar('github_id', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).unique(),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Categorias
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  icon: varchar('icon', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'income' | 'expense'
  expenseType: varchar('expense_type', { length: 50 }), // 'fixed' | 'variable'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Métodos de Pagamento
export const paymentMethods = pgTable('payment_methods', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'credit_card' | 'cash' | 'bank_account'
  limit: numeric('limit', { precision: 12, scale: 2 }),
  closingDay: integer('closing_day'),
  dueDay: integer('due_day'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Transações
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  description: varchar('description', { length: 255 }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'income' | 'expense'
  date: timestamp('date').notNull(),
  categoryId: integer('category_id')
    .notNull()
    .references(() => categories.id),
  paymentMethodId: integer('payment_method_id')
    .notNull()
    .references(() => paymentMethods.id),
  notes: text('notes'),
  isClosed: boolean('is_closed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Itens de Transação (para cupons fiscais, etc)
export const transactionItems = pgTable('transaction_items', {
  id: serial('id').primaryKey(),
  transactionId: integer('transaction_id')
    .notNull()
    .references(() => transactions.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  discount: numeric('discount', { precision: 12, scale: 2 }).default('0'),
  totalPrice: numeric('total_price', { precision: 12, scale: 2 }).notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  isConfirmed: boolean('is_confirmed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relações
export const usersRelations = relations(users, ({ many }) => ({
  categories: many(categories),
  paymentMethods: many(paymentMethods),
  transactions: many(transactions),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
  transactionItems: many(transactionItems),
}));

export const paymentMethodsRelations = relations(
  paymentMethods,
  ({ one, many }) => ({
    user: one(users, {
      fields: [paymentMethods.userId],
      references: [users.id],
    }),
    transactions: many(transactions),
  })
);

export const transactionsRelations = relations(
  transactions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [transactions.userId],
      references: [users.id],
    }),
    category: one(categories, {
      fields: [transactions.categoryId],
      references: [categories.id],
    }),
    paymentMethod: one(paymentMethods, {
      fields: [transactions.paymentMethodId],
      references: [paymentMethods.id],
    }),
    items: many(transactionItems),
  })
);

export const transactionItemsRelations = relations(
  transactionItems,
  ({ one }) => ({
    transaction: one(transactions, {
      fields: [transactionItems.transactionId],
      references: [transactions.id],
    }),
    category: one(categories, {
      fields: [transactionItems.categoryId],
      references: [categories.id],
    }),
  })
);

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = typeof paymentMethods.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

export type TransactionItem = typeof transactionItems.$inferSelect;
export type InsertTransactionItem = typeof transactionItems.$inferInsert;
