const express = require('express');
const bcrypt = require('bcryptjs');
const msal = require('@azure/msal-node');
const { findUserByUsername } = require('../services/userService');

const router = express.Router();

function createMsalClient() {
  const { ENTRA_CLIENT_ID, ENTRA_TENANT_ID, ENTRA_CLIENT_SECRET } = process.env;
  if (!ENTRA_CLIENT_ID || !ENTRA_TENANT_ID || !ENTRA_CLIENT_SECRET) {
    return null;
  }

  const msalConfig = {
    auth: {
      clientId: ENTRA_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${ENTRA_TENANT_ID}`,
      clientSecret: ENTRA_CLIENT_SECRET
    }
  };

  return new msal.ConfidentialClientApplication(msalConfig);
}

const cca = createMsalClient();

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
    role: user.role,
    authProvider: 'local'
  };

  return res.redirect('/dashboard');
});

router.get('/auth/entra', async (req, res) => {
  try {
    if (!process.env.ENTRA_CLIENT_ID || !process.env.ENTRA_TENANT_ID || !process.env.ENTRA_CLIENT_SECRET || !process.env.ENTRA_REDIRECT_URI) {
      return res.status(500).send('Entra ID environment variables are not fully configured.');
    }

    const authCodeUrlParameters = {
      scopes: ['openid', 'profile', 'email', 'User.Read'],
      redirectUri: process.env.ENTRA_REDIRECT_URI,
      prompt: 'select_account'
    };

    const authUrl = await cca.getAuthCodeUrl(authCodeUrlParameters);
    return res.redirect(authUrl);
  } catch (error) {
    console.error('Error starting Entra authentication:', error);
    return res.status(500).send('Failed to start Entra authentication.');
  }
});

router.get('/auth/entra/callback', async (req, res) => {
  if (!cca) {
    return res.status(500).send('Entra ID environment variables are not fully configured.');
  }

  try {
    const tokenRequest = {
      code: req.query.code,
      scopes: ['openid', 'profile', 'email', 'User.Read'],
      redirectUri: process.env.ENTRA_REDIRECT_URI
    };

    const response = await cca.acquireTokenByCode(tokenRequest);

    const account = response.account;

    req.session.user = {
      id: account.localAccountId,
      username: account.username,
      displayName: account.name || account.username,
      role: 'User',
      authProvider: 'entra'
    };

    return res.redirect('/dashboard');
  } catch (error) {
    console.error('Error completing Entra authentication:', error);
    return res.status(500).send('Failed to complete Entra authentication.');
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;