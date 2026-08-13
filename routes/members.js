const express = require('express');
const { all, get, run } = require('../database');
const { isAuthenticated } = require('../middleware/auth');
const router = express.Router();

router.use(isAuthenticated);

router.get('/', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const members = await all('SELECT * FROM members WHERE user_id = $1', [userId]);
    res.json(members);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { name, relation } = req.body;
    if (!name || !relation) {
      return res.status(400).json({ error: 'Nome e relação são obrigatórios.' });
    }
    const result = await run(
      'INSERT INTO members (user_id, name, relation) VALUES ($1, $2, $3) RETURNING id',
      [userId, name, relation]
    );
    const member = await get('SELECT * FROM members WHERE id = $1', [result.rows[0].id]);
    res.status(201).json(member);
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    const { name, relation } = req.body;

    const existing = await get('SELECT * FROM members WHERE id = $1 AND user_id = $2', [id, userId]);
    if (!existing) return res.status(404).json({ error: 'Membro não encontrado.' });

    await run('UPDATE members SET name=$1, relation=$2 WHERE id=$3 AND user_id=$4', [name, relation, id, userId]);
    const updated = await get('SELECT * FROM members WHERE id = $1', [id]);
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    const result = await run('DELETE FROM members WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Membro não encontrado.' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
