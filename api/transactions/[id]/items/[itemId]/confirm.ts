import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../src/api/auth/auth';
import { db } from '../../../../../src/api/db/client';
import { transactionItems, transactions, users } from '../../../../../src/api/db/schema';
import { eq, and } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id: transactionId, itemId } = req.query;

    // Obter usuário do banco
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!dbUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Verificar se a transação pertence ao usuário
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.id, parseInt(transactionId as string)),
          eq(transactions.userId, dbUser.id)
        )
      )
      .limit(1);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Confirmar item e verificar fechamento
    await db.transaction(async (tx) => {
      // Confirmar item
      await tx
        .update(transactionItems)
        .set({ isConfirmed: true })
        .where(eq(transactionItems.id, parseInt(itemId as string)));

      // Verificar se todos os itens foram confirmados
      const unconfirmedItems = await tx
        .select()
        .from(transactionItems)
        .where(
          and(
            eq(transactionItems.transactionId, parseInt(transactionId as string)),
            eq(transactionItems.isConfirmed, false)
          )
        );

      // Se não há itens não confirmados, fechar a transação
      if (unconfirmedItems.length === 0) {
        await tx
          .update(transactions)
          .set({ isClosed: true })
          .where(eq(transactions.id, parseInt(transactionId as string)));
      }
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error confirming item:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
