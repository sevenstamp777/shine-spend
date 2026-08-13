const express = require('express');
const bcrypt = require('bcryptjs');
const { get, run } = require('../database');
const router = express.Router();

router.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    const user = await get('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Email ou senha incorretos.' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Email ou senha incorretos.' });
    }

    req.session.user = { id: user.id, name: user.name, email: user.email, avatar: user.avatar };
    res.json({ user: req.session.user });
  } catch (e) { next(e); }
});

router.post('/api/auth/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }
    if (name.length < 2) {
      return res.status(400).json({ error: 'Nome deve ter pelo menos 2 caracteres.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres.' });
    }

    const emailLower = email.toLowerCase().trim();
    const existing = await get('SELECT id FROM users WHERE email = $1', [emailLower]);
    if (existing) {
      return res.status(409).json({ error: 'Este email já está cadastrado.' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const result = await run(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [name.trim(), emailLower, password_hash]
    );

    req.session.user = { id: result.rows[0].id, name: name.trim(), email: emailLower, avatar: '' };
    res.status(201).json({ user: req.session.user });
  } catch (e) { next(e); }
});

router.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get('/api/auth/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  res.json({ user: req.session.user });
});

module.exports = router;
