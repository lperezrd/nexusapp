const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const msal = require('@azure/msal-node');
const { findUserByUsername } = require('../services/userService');

const router = express.Router();

function getRequiredEnvValue(name) {
  const value = process.env[name];

  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

function getEntraConfig() {
  const clientId = getRequiredEnvValue('ENTRA_CLIENT_ID');
  const tenantId = getRequiredEnvValue('ENTRA_TENANT_ID');
  const clientSecret = getRequiredEnvValue('ENTRA_CLIENT_SECRET');
  const redirectUri = getRequiredEnvValue('ENTRA_REDIRECT_URI');

  return {
    clientId,
    tenantId,
    clientSecret,
    redirectUri,
    authority: `https://login.microsoftonline.com/${tenantId}`
  };
}

function createMsalClient() {
  const entra = getEntraConfig();

  return new msal.ConfidentialClientApplication({
    auth: {
      clientId: entra.clientId,
      authority: entra.authority,
      clientSecret: entra.clientSecret
    },
    system: {
      loggerOptions: {
        loggerCallback(loglevel, message, containsPii) {
          if (!containsPii) console.log(message);
        },
        piiLoggingEnabled: false,
        logLevel: msal.LogLevel.Warning
      }
    }
  });
}

const entraScopes = ['openid', 'profile', 'email', 'User.Read'];

router.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');

  res.render('pages/login', {
    title: 'Login',
    error: null
  });
});

router.post('/login', async (req, res, next) => {
  try {
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
  } catch (error) {
    return next(error);
  }
});

router.get('/auth/entra', async (req, res) => {
  try {
    const entra = getEntraConfig();
    const cca = createMsalClient();

    const state = crypto.randomBytes(24).toString('hex');
    req.session.entraAuthState = state;

    const authUrl = await cca.getAuthCodeUrl({
      scopes: entraScopes,
      redirectUri: entra.redirectUri,
      responseMode: 'query',
      prompt: 'select_account',
      state
    });

    return res.redirect(authUrl);
  } catch (error) {
    console.error('Error starting Entra authentication:', error);

    return res.status(500).render('pages/login', {
      title: 'Login',
      error: 'Entra ID authentication is not configured correctly. Check the App Service environment variables and restart the app.'
    });
  }
});

router.get('/auth/entra/callback', async (req, res) => {
  try {
    if (req.query.error) {
      console.error('Entra callback error:', req.query.error, req.query.error_description);

      return res.status(401).render('pages/login', {
        title: 'Login',
        error: 'Microsoft Entra ID sign-in was cancelled or denied.'
      });
    }

    if (!req.query.code) {
      return res.status(400).render('pages/login', {
        title: 'Login',
        error: 'Microsoft Entra ID did not return an authorization code.'
      });
    }

    if (!req.query.state || req.query.state !== req.session.entraAuthState) {
      return res.status(400).render('pages/login', {
        title: 'Login',
        error: 'Microsoft Entra ID sign-in state validation failed. Please try again.'
      });
    }

    delete req.session.entraAuthState;

    const entra = getEntraConfig();
    const cca = createMsalClient();

    const response = await cca.acquireTokenByCode({
      code: req.query.code,
      scopes: entraScopes,
      redirectUri: entra.redirectUri
    });

    const account = response.account;

    if (!account) {
      return res.status(401).render('pages/login', {
        title: 'Login',
        error: 'Microsoft Entra ID did not return an account profile.'
      });
    }

    req.session.user = {
      id: account.localAccountId || account.homeAccountId,
      username: account.username,
      displayName: account.name || account.username,
      role: 'User',
      authProvider: 'entra',
      tenantId: account.tenantId
    };

    return res.redirect('/dashboard');
  } catch (error) {
    console.error('Error completing Entra authentication:', error);

    return res.status(500).render('pages/login', {
      title: 'Login',
      error: 'Failed to complete Microsoft Entra ID sign-in. Check the redirect URI, client secret, and App Registration configuration.'
    });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;