import { useState, useCallback } from 'react';
import { Transaction } from '@/types/finance';

interface TransactionWithItems extends Transaction {
  items?: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    totalPrice: number;
    categoryId?: string;
    isConfirmed: boolean;
  }>;
  isClosed?: boolean;
}

export function useTransactionAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTransaction = useCallback(
    async (data: {
      description: string;
      amount: number;
      type: 'income' | 'expense';
      date: Date;
      categoryId: string;
      paymentMethodId: string;
      notes?: string;
      items?: Array<{
        name: string;
        quantity: number;
        unitPrice: number;
        discount?: number;
        categoryId?: string;
      }>;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error('Erro ao criar transação');
        }

        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getTransactions = useCallback(
    async (filters?: {
      startDate?: Date;
      endDate?: Date;
      type?: 'income' | 'expense';
      categoryId?: string;
      paymentMethodId?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filters?.startDate)
          params.append('startDate', filters.startDate.toISOString());
        if (filters?.endDate)
          params.append('endDate', filters.endDate.toISOString());
        if (filters?.type) params.append('type', filters.type);
        if (filters?.categoryId) params.append('categoryId', filters.categoryId);
        if (filters?.paymentMethodId)
          params.append('paymentMethodId', filters.paymentMethodId);

        const response = await fetch(`/api/transactions?${params}`, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error('Erro ao buscar transações');
        }

        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const confirmItem = useCallback(
    async (transactionId: string, itemId: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/transactions/${transactionId}/items/${itemId}/confirm`,
          {
            method: 'POST',
          }
        );

        if (!response.ok) {
          throw new Error('Erro ao confirmar item');
        }

        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateTransaction = useCallback(
    async (
      transactionId: string,
      data: {
        description?: string;
        amount?: number;
        date?: Date;
        categoryId?: string;
        paymentMethodId?: string;
        notes?: string;
      }
    ) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/transactions/${transactionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error('Erro ao atualizar transação');
        }

        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteTransaction = useCallback(async (transactionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar transação');
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMonthlyBalance = useCallback(
    async (year: number, month: number) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/transactions/balance?year=${year}&month=${month}`,
          {
            method: 'GET',
          }
        );

        if (!response.ok) {
          throw new Error('Erro ao buscar balanço mensal');
        }

        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    createTransaction,
    getTransactions,
    confirmItem,
    updateTransaction,
    deleteTransaction,
    getMonthlyBalance,
  };
}
