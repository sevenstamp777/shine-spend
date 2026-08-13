const express = require('express');
const { all, get, run } = require('../database');
const { isAuthenticated } = require('../middleware/auth');
const router = express.Router();

const DEFAULT_CATEGORIES = [
  { id: 'salary', label: 'Salário', icon: '💼', color: '#10d9a0', type: 'income' },
  { id: 'freelance', label: 'Freelance', icon: '💻', color: '#38bdf8', type: 'income' },
  { id: 'investment', label: 'Investimentos', icon: '📈', color: '#a78bfa', type: 'income' },
  { id: 'bonus', label: 'Bônus', icon: '🎁', color: '#fbbf24', type: 'income' },
  { id: 'rent', label: 'Aluguel Receb.', icon: '🏠', color: '#34d399', type: 'income' },
  { id: 'other_in', label: 'Outros', icon: '💰', color: '#6c63ff', type: 'income' },
  { id: 'housing', label: 'Moradia', icon: '🏠', color: '#f97316', type: 'expense' },
  { id: 'food', label: 'Alimentação', icon: '🍕', color: '#fb923c', type: 'expense' },
  { id: 'transport', label: 'Transporte', icon: '🚗', color: '#60a5fa', type: 'expense' },
  { id: 'health', label: 'Saúde', icon: '💊', color: '#f43f5e', type: 'expense' },
  { id: 'education', label: 'Educação', icon: '🎓', color: '#a78bfa', type: 'expense' },
  { id: 'leisure', label: 'Lazer', icon: '🎮', color: '#fb7185', type: 'expense' },
  { id: 'clothing', label: 'Vestuário', icon: '👗', color: '#e879f9', type: 'expense' },
  { id: 'utilities', label: 'Contas/Serviços', icon: '💡', color: '#fbbf24', type: 'expense' },
  { id: 'shopping', label: 'Compras', icon: '🛒', color: '#34d399', type: 'expense' },
  { id: 'other_ex', label: 'Outros', icon: '📌', color: '#94a3b8', type: 'expense' },
];

router.use(isAuthenticated);

async function ensureSeeded(userId) {
  const have = await all('SELECT category FROM categories WHERE user_id = $1 AND is_builtin', [userId]);
  const haveSet = new Set(have.map(r => r.category));
  const missing = DEFAULT_CATEGORIES.filter(c => !haveSet.has(c.id));
  if (missing.length) {
    const values = [];
    const params = [];
    missing.forEach((c, i) => {
      const base = i * 7;
      params.push(userId, c.id, c.label, c.icon, c.color, c.type, true);
      values.push(`($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7})`);
    });
    await run(
      `INSERT INTO categories (user_id, category, label, icon, color, type, is_builtin) VALUES ${values.join(',')} ON CONFLICT (user_id, category) DO NOTHING`,
      params
    );
  }

  const hasCustom = await get('SELECT count(*)::int AS n FROM categories WHERE user_id = $1 AND NOT is_builtin', [userId]);
  if (hasCustom.n > 0) return;

  const used = await all(`
    SELECT category FROM (
      SELECT category FROM transactions WHERE user_id = $1
      UNION ALL SELECT i.category FROM transaction_items i JOIN transactions t ON t.id = i.transaction_id WHERE t.user_id = $1
      UNION ALL SELECT category FROM budgets WHERE user_id = $1
    ) u GROUP BY category
  `, [userId]);

  const toInsert = [];
  for (const u of used) {
    const cat = String(u.category || '').trim();
    if (!cat) continue;
    const type = await guessType(userId, cat);
    toInsert.push({ cat, type });
  }
  if (toInsert.length) {
    const values = [];
    const params = [];
    toInsert.forEach((t, i) => {
      const base = i * 6;
      params.push(userId, t.cat, t.cat, '', '', t.type);
      values.push(`($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6})`);
    });
    await run(
      `INSERT INTO categories (user_id, category, label, icon, color, type, is_builtin) VALUES ${values.join(',')} ON CONFLICT (user_id, category) DO NOTHING`,
      params
    );
  }
}

async function guessType(userId, category) {
  const r = await get(
    'SELECT type, count(*)::int AS n FROM transactions WHERE user_id = $1 AND category = $2 GROUP BY type ORDER BY n DESC LIMIT 1',
    [userId, category]
  );
  return r ? r.type : 'expense';
}

function slugify(label) {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'categoria';
}

function sanitize(value, max, fallback = '') {
  const s = String(value || '').trim();
  if (!s) return fallback;
  return s.slice(0, max);
}

router.get('/', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    await ensureSeeded(userId);
    const rows = await all(
      'SELECT id, category, label, icon, color, type, is_builtin FROM categories WHERE user_id = $1 ORDER BY is_builtin DESC, lower(label) ASC, id ASC',
      [userId]
    );
    res.json(rows.map(r => ({
      id: r.category,
      dbId: r.id,
      label: r.label,
      icon: r.icon || '',
      color: r.color || '',
      type: r.type,
      builtin: !!r.is_builtin,
    })));
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const label = sanitize(req.body.label, 40, '');
    if (!label) return res.status(400).json({ error: 'Informe o nome da categoria.' });
    const type = req.body.type === 'income' ? 'income' : 'expense';
    const icon = sanitize(req.body.icon, 8);
    const color = sanitize(req.body.color, 20);

    const existing = await get('SELECT category FROM categories WHERE user_id = $1 AND lower(category) = lower($2)', [userId, label]);
    if (existing) return res.status(409).json({ error: 'Já existe uma categoria com esse nome.' });

    let id = slugify(label);
    const usedInData = await get(
      `SELECT category FROM (
         SELECT category FROM transactions WHERE user_id = $1 AND lower(category) = lower($2)
         UNION ALL SELECT i.category FROM transaction_items i JOIN transactions t ON t.id = i.transaction_id WHERE t.user_id = $1 AND lower(i.category) = lower($2)
         UNION ALL SELECT category FROM budgets WHERE user_id = $1 AND lower(category) = lower($2)
       ) u LIMIT 1`,
      [userId, label]
    );
    if (usedInData) {
      id = usedInData.category;
      const row = await get('SELECT id FROM categories WHERE user_id = $1 AND category = $2', [userId, id]);
      if (row) return res.status(409).json({ error: 'Já existe uma categoria com esse nome.' });
    } else {
      let candidate = id;
      let i = 2;
      while (await get('SELECT id FROM categories WHERE user_id = $1 AND lower(category) = lower($2)', [userId, candidate])) {
        candidate = `${id}-${i++}`;
      }
      id = candidate;
    }

    const result = await run(
      'INSERT INTO categories (user_id, category, label, icon, color, type, is_builtin) VALUES ($1,$2,$3,$4,$5,$6,false) RETURNING id',
      [userId, id, label, icon, color, type]
    );
    res.status(201).json({ id, dbId: result.rows[0].id, label, icon, color, type, builtin: false });
  } catch (e) { next(e); }
});

router.put('/:dbId', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { dbId } = req.params;
    const label = sanitize(req.body.label, 40, '');
    if (!label) return res.status(400).json({ error: 'Informe o nome da categoria.' });
    const type = req.body.type === 'income' ? 'income' : 'expense';
    const icon = sanitize(req.body.icon, 8);
    const color = sanitize(req.body.color, 20);

    const dup = await get('SELECT category FROM categories WHERE user_id = $1 AND lower(label) = lower($2) AND id != $3', [userId, label, dbId]);
    if (dup) return res.status(409).json({ error: 'Já existe outra categoria com esse nome.' });

    const result = await run(
      'UPDATE categories SET label = $1, icon = $2, color = $3, type = $4 WHERE id = $5 AND user_id = $6 RETURNING id, category',
      [label, icon, color, type, dbId, userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Categoria não encontrada.' });
    res.json({ id: result.rows[0].category, dbId, label, icon, color, type });
  } catch (e) { next(e); }
});

router.delete('/:dbId', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { dbId } = req.params;
    const result = await run('DELETE FROM categories WHERE id = $1 AND user_id = $2', [dbId, userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Categoria não encontrada.' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
