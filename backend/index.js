// backend/index.js

const express = require('express');
const cors = require('cors');
const reportRoutes = require('./routes/report');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());  // replaces body-parser.json()

// Routes
app.use('/', reportRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
