require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const analyzerRoutes = require('./routes/analyzerRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const tableRoutes = require('./routes/tableRoutes');
const authRoutes = require('./routes/auth');
const pageRoutes = require('./routes/pages');
const { connectMongoose } = require('./services/mongoClient');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration must be registered before any routes
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/analyzer', analyzerRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/table', tableRoutes);
app.use('/auth', authRoutes);
app.use('/api', pageRoutes);

// Serve Angular dist files (built in CI into frontend/dist)
app.use(express.static(path.join(__dirname, 'frontend/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  const status = error?.statusCode || error?.status || 500;
  const message =
    error?.message || 'An unexpected error occurred while processing the request.';
  res.status(status).json({ error: message });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;

  connectMongoose()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Bluffly backend listening on port ${PORT}`);
      });
    })
    .catch(error => {
      console.error('Failed to connect to MongoDB:', error);
      process.exit(1);
    });
}

module.exports = app;
