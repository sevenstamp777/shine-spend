const express = require('express');
const { all, get, run } = require('../database');
const { isAuthenticated } = require('../middleware/auth');
const router = express.Router();

const DEFAULTS = ['Pix', 'Pix no Crédito', 'Dinheiro', 'Cartão Nubank', 'Cartão Inter', 'Cartão C6', 'Cartão Bradesco', 'Cartão Itaú', 'Sem forma'];

router.use(isAuthenticated);

async function ensureDefaults(userId) {
  const row = await get('SELECT count(*)::int AS n FROM payment_methods WHERE user_id = $1', [userId]);
  if (row.n > 0) return;
  for (const name of DEFAULTS) {
    await run('INSERT INTO payment_methods (user_id, name) VALUES ($1, $2) ON CONFLICT (user_id, name) DO NOTHING', [userId, name]);
  }
}

router.get('/', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    await ensureDefaults(userId);
    const methods = await all('SELECT id, name FROM payment_methods WHERE user_id = $1 ORDER BY id ASC', [userId]);
    res.json(methods);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Informe o nome da forma de pagamento.' });
    if (name.length > 40) return res.status(400).json({ error: 'Nome muito longo (máx. 40 caracteres).' });

    const existing = await get('SELECT id FROM payment_methods WHERE user_id = $1 AND lower(name) = lower($2)', [userId, name]);
    if (existing) return res.status(409).json({ error: 'Esta forma de pagamento já existe.' });

    const result = await run('INSERT INTO payment_methods (user_id, name) VALUES ($1, $2) RETURNING id, name', [userId, name]);
    res.status(201).json(result.rows[0]);
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Informe o nome da forma de pagamento.' });

    const existing = await get('SELECT id FROM payment_methods WHERE user_id = $1 AND lower(name) = lower($2) AND id != $3', [userId, name, id]);
    if (existing) return res.status(409).json({ error: 'Esta forma de pagamento já existe.' });

    const result = await run('UPDATE payment_methods SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING id, name', [name, id, userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Forma de pagamento não encontrada.' });
    res.json(result.rows[0]);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    const result = await run('DELETE FROM payment_methods WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Forma de pagamento não encontrada.' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
