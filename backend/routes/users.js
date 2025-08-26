const express = require('express');
const router = express.Router();

// Placeholder users routes
router.get('/', (req, res) => {
  res.json({ message: 'Users route - to be implemented' });
});

module.exports = router;
