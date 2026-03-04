import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../src/api/auth/auth';
import { db } from '../../src/api/db/client';
import { transactions, users } from '../../src/api/db/schema';
import { eq, gte, lte, and } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: 'Missing year or month' });
    }

    // Obter usuário do banco
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!dbUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
    const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);

    const monthTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, dbUser.id),
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

    return res.status(200).json({
      income,
      expenses,
      balance: income - expenses,
    });
  } catch (error) {
    console.error('Error calculating balance:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
