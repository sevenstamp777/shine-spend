const express = require('express');
const { all, get, run } = require('../database');
const { isAuthenticated } = require('../middleware/auth');
const router = express.Router();

router.use(isAuthenticated);

router.get('/', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const goals = await all('SELECT * FROM goals WHERE user_id = $1', [userId]);
    res.json(goals);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { name, icon, target, current, deadline } = req.body;
    if (!name || !target) {
      return res.status(400).json({ error: 'Nome e valor alvo são obrigatórios.' });
    }
    const result = await run(
      'INSERT INTO goals (user_id, name, icon, target, current, deadline) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [userId, name, icon || '🏆', target, current || 0, deadline || null]
    );
    const goal = await get('SELECT * FROM goals WHERE id = $1', [result.rows[0].id]);
    res.status(201).json(goal);
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    const { name, icon, target, current, deadline } = req.body;

    const existing = await get('SELECT * FROM goals WHERE id = $1 AND user_id = $2', [id, userId]);
    if (!existing) return res.status(404).json({ error: 'Meta não encontrada.' });

    await run(
      'UPDATE goals SET name=$1, icon=$2, target=$3, current=$4, deadline=$5 WHERE id=$6 AND user_id=$7',
      [name, icon || '🏆', target, current || 0, deadline || null, id, userId]
    );
    const updated = await get('SELECT * FROM goals WHERE id = $1', [id]);
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    const result = await run('DELETE FROM goals WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Meta não encontrada.' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
