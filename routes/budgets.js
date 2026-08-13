const express = require('express');
const { all, get, run } = require('../database');
const { isAuthenticated } = require('../middleware/auth');
const router = express.Router();

router.use(isAuthenticated);

router.get('/', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const budgets = await all('SELECT * FROM budgets WHERE user_id = $1', [userId]);
    res.json(budgets);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { category, limit } = req.body;
    if (!category || !limit) {
      return res.status(400).json({ error: 'Categoria e limite são obrigatórios.' });
    }

    const existing = await get('SELECT id FROM budgets WHERE user_id = $1 AND category = $2', [userId, category]);
    if (existing) {
      return res.status(409).json({ error: 'Já existe orçamento para esta categoria.' });
    }

    const result = await run(
      'INSERT INTO budgets (user_id, category, "limit") VALUES ($1, $2, $3) RETURNING id',
      [userId, category, limit]
    );
    const budget = await get('SELECT * FROM budgets WHERE id = $1', [result.rows[0].id]);
    res.status(201).json(budget);
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    const { category, limit } = req.body;

    const existing = await get('SELECT * FROM budgets WHERE id = $1 AND user_id = $2', [id, userId]);
    if (!existing) return res.status(404).json({ error: 'Orçamento não encontrado.' });

    await run(
      'UPDATE budgets SET category=$1, "limit"=$2 WHERE id=$3 AND user_id=$4',
      [category, limit, id, userId]
    );
    const updated = await get('SELECT * FROM budgets WHERE id = $1', [id]);
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    const result = await run('DELETE FROM budgets WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Orçamento não encontrado.' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
