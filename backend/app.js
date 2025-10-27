const express = require('express');
const cors = require('cors');

const analyzerRoutes = require('./routes/analyzerRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/analyzer', analyzerRoutes);

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

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Bluffly backend listening on port ${PORT}`);
  });
}
