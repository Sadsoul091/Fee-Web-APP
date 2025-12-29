const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'null'], // Allow local development and file:// protocol
    credentials: true
}));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Fee management service is running' });
});

// Start server
app.listen(port, () => {
    console.log(`Fee management service running on port ${port}`);
});
