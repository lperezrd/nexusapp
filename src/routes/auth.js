const express = require('express');
const bcrypt = require('bcryptjs');
const { findUserByUsername } = require('../services/userService');

const router = express.Router();

router.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('pages/login', { title: 'Login', error: null });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).render('pages/login', {
      title: 'Login',
      error: 'Username and password are required.'
    });
  }

  const user = await findUserByUsername(username);
  if (!user) {
    return res.status(401).render('pages/login', {
      title: 'Login',
      error: 'Invalid username or password.'
    });
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    return res.status(401).render('pages/login', {
      title: 'Login',
      error: 'Invalid username or password.'
    });
  }

  req.session.user = {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    role: user.role
  };

  return res.redirect('/dashboard');
});

router.get('/auth/entra', (req, res) => {
  res.render('pages/entra-placeholder', {
    title: 'Entra ID Placeholder',
    clientId: process.env.ENTRA_CLIENT_ID || 'not configured',
    tenantId: process.env.ENTRA_TENANT_ID || 'not configured',
    redirectUri: process.env.ENTRA_REDIRECT_URI || 'not configured'
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
