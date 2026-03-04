import { db } from '../db/client';
import {
  transactions,
  transactionItems,
  categories,
  paymentMethods,
} from '../db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { Decimal } from 'decimal.js';

export interface CreateTransactionInput {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: Date;
  categoryId: number;
  paymentMethodId: number;
  notes?: string;
  items?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    categoryId?: number;
  }>;
}

export interface UpdateTransactionInput {
  description?: string;
  amount?: number;
  date?: Date;
  categoryId?: number;
  paymentMethodId?: number;
  notes?: string;
}

export interface ConfirmItemInput {
  itemId: number;
}

// Criar transação com itens
export async function createTransaction(
  userId: number,
  input: CreateTransactionInput
) {
  try {
    const result = await db.transaction(async (tx) => {
      // Criar transação
      const [transaction] = await tx
        .insert(transactions)
        .values({
          userId,
          description: input.description,
          amount: new Decimal(input.amount).toFixed(2),
          type: input.type,
          date: input.date,
          categoryId: input.categoryId,
          paymentMethodId: input.paymentMethodId,
          notes: input.notes,
          isClosed: !input.items || input.items.length === 0, // Fecha automaticamente se não houver itens
        })
        .returning();

      // Criar itens se fornecidos
      if (input.items && input.items.length > 0) {
        const items = input.items.map((item) => {
          const unitPrice = new Decimal(item.unitPrice);
          const quantity = new Decimal(item.quantity);
          const discount = new Decimal(item.discount || 0);
          const totalPrice = quantity.times(unitPrice).minus(discount);

          return {
            transactionId: transaction.id,
            name: item.name,
            quantity: quantity.toFixed(2),
            unitPrice: unitPrice.toFixed(2),
            discount: discount.toFixed(2),
            totalPrice: totalPrice.toFixed(2),
            categoryId: item.categoryId,
            isConfirmed: false,
          };
        });

        await tx.insert(transactionItems).values(items);
      }

      return transaction;
    });

    return result;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

// Listar transações do usuário
export async function getTransactions(
  userId: number,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    type?: 'income' | 'expense';
    categoryId?: number;
    paymentMethodId?: number;
  }
) {
  try {
    let query = db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId));

    if (filters?.startDate) {
      query = query.where(gte(transactions.date, filters.startDate));
    }

    if (filters?.endDate) {
      query = query.where(lte(transactions.date, filters.endDate));
    }

    if (filters?.type) {
      query = query.where(eq(transactions.type, filters.type));
    }

    if (filters?.categoryId) {
      query = query.where(eq(transactions.categoryId, filters.categoryId));
    }

    if (filters?.paymentMethodId) {
      query = query.where(
        eq(transactions.paymentMethodId, filters.paymentMethodId)
      );
    }

    const result = await query.orderBy(desc(transactions.date));
    return result;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

// Obter transação com itens
export async function getTransactionWithItems(transactionId: number) {
  try {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1);

    if (!transaction) {
      return null;
    }

    const items = await db
      .select()
      .from(transactionItems)
      .where(eq(transactionItems.transactionId, transactionId));

    return {
      ...transaction,
      items,
    };
  } catch (error) {
    console.error('Error fetching transaction with items:', error);
    throw error;
  }
}

// Confirmar item de transação
export async function confirmTransactionItem(
  userId: number,
  transactionId: number,
  itemId: number
) {
  try {
    return await db.transaction(async (tx) => {
      // Confirmar item
      await tx
        .update(transactionItems)
        .set({ isConfirmed: true })
        .where(eq(transactionItems.id, itemId));

      // Verificar se todos os itens foram confirmados
      const unconfirmedItems = await tx
        .select()
        .from(transactionItems)
        .where(
          and(
            eq(transactionItems.transactionId, transactionId),
            eq(transactionItems.isConfirmed, false)
          )
        );

      // Se não há itens não confirmados, fechar a transação
      if (unconfirmedItems.length === 0) {
        await tx
          .update(transactions)
          .set({ isClosed: true })
          .where(eq(transactions.id, transactionId));
      }

      return true;
    });
  } catch (error) {
    console.error('Error confirming transaction item:', error);
    throw error;
  }
}

// Atualizar transação
export async function updateTransaction(
  userId: number,
  transactionId: number,
  input: UpdateTransactionInput
) {
  try {
    const [updated] = await db
      .update(transactions)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.userId, userId)
        )
      )
      .returning();

    return updated;
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
}

// Deletar transação
export async function deleteTransaction(
  userId: number,
  transactionId: number
) {
  try {
    await db
      .delete(transactions)
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.userId, userId)
        )
      );

    return true;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
}

// Obter resumo mensal
export async function getMonthlyBalance(
  userId: number,
  year: number,
  month: number
) {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const monthTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      );

    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount as any), 0);

    const expenses = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount as any), 0);

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  } catch (error) {
    console.error('Error calculating monthly balance:', error);
    throw error;
  }
}
