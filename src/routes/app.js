const express = require('express');
const { requireAuth } = require('../services/authMiddleware');

const router = express.Router();

router.get('/dashboard', requireAuth, (req, res) => {
  res.render('pages/dashboard', {
    title: 'Dashboard',
    stats: [
      { label: 'Open Opportunities', value: '—', note: 'Placeholder for CRM pipeline count' },
      { label: 'Expected Revenue', value: '—', note: 'Placeholder for revenue forecast' },
      { label: 'Active Customers', value: '—', note: 'Placeholder for customer count' },
      { label: 'Tasks Due', value: '—', note: 'Placeholder for pending actions' }
    ]
  });
});

router.get('/settings', requireAuth, (req, res) => {
  res.render('pages/settings', { title: 'Settings' });
});

module.exports = router;
