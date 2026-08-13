const express = require('express');
const { run } = require('../database');
const { isAuthenticated } = require('../middleware/auth');
const router = express.Router();

router.use(isAuthenticated);

router.put('/', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { name, email, avatar } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório.' });
    }
    await run('UPDATE users SET name=$1, email=$2, avatar=$3 WHERE id=$4', [name, email || '', avatar || '', userId]);
    req.session.user = { id: userId, name, email: email || '', avatar: avatar || '' };
    res.json({ user: req.session.user });
  } catch (e) { next(e); }
});

module.exports = router;
