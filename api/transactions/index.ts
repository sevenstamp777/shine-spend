import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../src/api/auth/auth';
import { db } from '../../src/api/db/client';
import { transactions, transactionItems, users } from '../../src/api/db/schema';
import { eq, gte, lte, desc, and } from 'drizzle-orm';
import { Decimal } from 'decimal.js';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Obter usuário do banco
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!dbUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (req.method === 'POST') {
      // Criar transação
      const { description, amount, type, date, categoryId, paymentMethodId, notes, items } = req.body;

      if (!description || !amount || !type || !date || !categoryId || !paymentMethodId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await db.transaction(async (tx) => {
        const [transaction] = await tx
          .insert(transactions)
          .values({
            userId: dbUser.id,
            description,
            amount: new Decimal(amount).toFixed(2),
            type,
            date: new Date(date),
            categoryId: parseInt(categoryId),
            paymentMethodId: parseInt(paymentMethodId),
            notes,
            isClosed: !items || items.length === 0,
          })
          .returning();

        if (items && items.length > 0) {
          const itemsToInsert = items.map((item: any) => {
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
              categoryId: item.categoryId ? parseInt(item.categoryId) : null,
              isConfirmed: false,
            };
          });

          await tx.insert(transactionItems).values(itemsToInsert);
        }

        return transaction;
      });

      return res.status(201).json(result);
    }

    if (req.method === 'GET') {
      // Listar transações
      const { startDate, endDate, type: filterType, categoryId, paymentMethodId } = req.query;

      let query = db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, dbUser.id));

      if (startDate) {
        query = query.where(gte(transactions.date, new Date(startDate as string)));
      }

      if (endDate) {
        query = query.where(lte(transactions.date, new Date(endDate as string)));
      }

      if (filterType) {
        query = query.where(eq(transactions.type, filterType as string));
      }

      if (categoryId) {
        query = query.where(eq(transactions.categoryId, parseInt(categoryId as string)));
      }

      if (paymentMethodId) {
        query = query.where(eq(transactions.paymentMethodId, parseInt(paymentMethodId as string)));
      }

      const result = await query.orderBy(desc(transactions.date));

      return res.status(200).json(result);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in transactions API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
