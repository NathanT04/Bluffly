require('dotenv').config();
const express = require('express');
const cors = require('cors');

const analyzerRoutes = require('./routes/analyzerRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const tableRoutes = require('./routes/tableRoutes');
const { connectMongoose } = require('./services/mongoClient');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/analyzer', analyzerRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/table', tableRoutes);

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
