require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const SQLiteStore = require('connect-sqlite3')(session);

const authRoutes = require('./routes/auth');
const appRoutes = require('./routes/app');
const { ensureDatabase } = require('./db');

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(
  session({
    store: new SQLiteStore({ db: 'sessions.sqlite', dir: './data' }),
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentPath = req.path;
  next();
});

app.use('/', authRoutes);
app.use('/', appRoutes);

app.use((req, res) => {
  res.status(404).render('pages/404', { title: 'Page Not Found' });
});

ensureDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Nexus CRM running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database provider:', error);
    process.exit(1);
  });
