const express = require('express');
const { all, get, run } = require('../database');
const { isAuthenticated } = require('../middleware/auth');
const router = express.Router();

router.use(isAuthenticated);

router.get('/', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const transactions = await all('SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC, id DESC', [userId]);
    if (transactions.length > 0) {
      const ids = transactions.map(t => t.id);
      const items = await all(
        'SELECT id, transaction_id, description, category, amount, quantity, unit, unit_price AS "unitPrice", brand, discount FROM transaction_items WHERE transaction_id = ANY($1) ORDER BY id ASC',
        [ids]
      );
      const byTransaction = new Map();
      for (const item of items) {
        if (!byTransaction.has(item.transaction_id)) byTransaction.set(item.transaction_id, []);
        byTransaction.get(item.transaction_id).push(item);
      }
      for (const tx of transactions) {
        tx.items = byTransaction.get(tx.id) || [];
      }
    }
    res.json(transactions);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { type, description, amount, date, category, place, note, items, payment_method } = req.body;

    const itemsList = normalizeItems(items);
    const total = itemsList.length > 0
      ? round2(itemsList.reduce((s, i) => s + i.amount, 0))
      : round2(parseFloat(amount) || 0);

    const finalType = type === 'income' ? 'income' : 'expense';
    const finalDescription = (description || '').trim() || (itemsList[0] && itemsList[0].description) || '';
    const finalCategory = category || (itemsList[0] && itemsList[0].category) || '';

    if (!finalDescription || !total || !date || !finalCategory) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }

    const result = await run(
      'INSERT INTO transactions (user_id, type, description, amount, date, category, place, note, payment_method) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [userId, finalType, finalDescription, total, date, finalCategory, place || '', note || '', payment_method || '']
    );

    const txId = result.rows[0].id;
    await replaceItems(txId, itemsList);

    const tx = await get('SELECT * FROM transactions WHERE id = $1', [txId]);
    tx.items = await all('SELECT id, description, category, amount, quantity, unit, unit_price AS "unitPrice", brand, discount FROM transaction_items WHERE transaction_id = $1 ORDER BY id ASC', [txId]);
    res.status(201).json(tx);
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    const { type, description, amount, date, category, place, note, items, payment_method } = req.body;

    const existing = await get('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
    if (!existing) return res.status(404).json({ error: 'Transação não encontrada.' });

    const itemsList = normalizeItems(items);
    const total = itemsList.length > 0
      ? round2(itemsList.reduce((s, i) => s + i.amount, 0))
      : round2(parseFloat(amount) || 0);

    const finalType = type === 'income' ? 'income' : 'expense';
    const finalDescription = (description || '').trim() || (itemsList[0] && itemsList[0].description) || '';
    const finalCategory = category || (itemsList[0] && itemsList[0].category) || '';

    if (!finalDescription || !total || !date || !finalCategory) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }

    await run(
      'UPDATE transactions SET type=$1, description=$2, amount=$3, date=$4, category=$5, place=$6, note=$7, payment_method=$8 WHERE id=$9 AND user_id=$10',
      [finalType, finalDescription, total, date, finalCategory, place || '', note || '', payment_method || '', id, userId]
    );

    await replaceItems(id, itemsList);

    const updated = await get('SELECT * FROM transactions WHERE id = $1', [id]);
    updated.items = await all('SELECT id, description, category, amount, quantity, unit, unit_price AS "unitPrice", brand, discount FROM transaction_items WHERE transaction_id = $1 ORDER BY id ASC', [id]);
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    const result = await run('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Transação não encontrada.' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map(i => {
      const quantity = parseFloat(i.quantity);
      const qty = !isNaN(quantity) && quantity > 0 ? quantity : 1;
      const unitPrice = parseFloat(i.unitPrice);
      const base = !isNaN(unitPrice) && unitPrice >= 0 ? unitPrice : 0;
      const rawAmount = qty * base;

      const discountType = i.discountType === 'percent' ? 'percent' : 'amount';
      const discountAmount = discountType === 'percent'
        ? round2(rawAmount * (parseFloat(i.discount) || 0) / 100)
        : round2(parseFloat(i.discount) || 0);

      return {
        description: String(i.description || '').trim(),
        brand: String(i.brand || '').trim(),
        category: String(i.category || '').trim(),
        quantity: qty,
        unit: String(i.unit || 'un').trim() || 'un',
        unitPrice: round2(base),
        discount: Math.max(0, discountAmount),
        amount: round2(Math.max(0, rawAmount - discountAmount)),
      };
    })
    .filter(i => i.description && i.category && i.amount > 0);
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

async function replaceItems(transactionId, items) {
  await run('DELETE FROM transaction_items WHERE transaction_id = $1', [transactionId]);
  for (const item of items) {
    await run(
      'INSERT INTO transaction_items (transaction_id, description, category, amount, quantity, unit, unit_price, brand, discount) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [transactionId, item.description, item.category, item.amount, item.quantity, item.unit, item.unitPrice, item.brand, item.discount]
    );
  }
}

module.exports = router;
