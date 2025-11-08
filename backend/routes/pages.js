const express = require('express');
const path = require('path');
const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Bluffly backend is running',
    authenticated: req.session?.isAuthenticated || false 
  });
});

module.exports = router;