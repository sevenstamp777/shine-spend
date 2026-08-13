const express = require('express');
const bcrypt = require('bcryptjs');
const { get, run } = require('../database');
const { isAuthenticated } = require('../middleware/auth');
const router = express.Router();

router.use(isAuthenticated);

router.put('/', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { name, email, avatar, currentPassword, newPassword } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório.' });
    }

    let newPasswordHash = null;
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Informe a senha atual para alterar a senha.' });
      }
      if (String(newPassword).length < 6) {
        return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
      }
      const user = await get('SELECT password_hash FROM users WHERE id = $1', [userId]);
      if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
        return res.status(400).json({ error: 'Senha atual incorreta.' });
      }
      newPasswordHash = bcrypt.hashSync(newPassword, 10);
    }

    if (newPasswordHash) {
      await run('UPDATE users SET name=$1, email=$2, avatar=$3, password_hash=$4 WHERE id=$5', [name, email || '', avatar || '', newPasswordHash, userId]);
    } else {
      await run('UPDATE users SET name=$1, email=$2, avatar=$3 WHERE id=$4', [name, email || '', avatar || '', userId]);
    }

    req.session.user = { id: userId, name, email: email || '', avatar: avatar || '' };
    res.json({ user: req.session.user });
  } catch (e) { next(e); }
});

module.exports = router;
