const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const chatRouter = require('./chat');
require('dotenv').config();

app.use('/chat', chatRouter);

const allowedOrigins = ['https://ai.pixelverse.tech'];
const adminPassword = process.env.ADMIN_PASSWORD;
const API_KEY = process.env.API_KEY; // Add this to your .env file

let devMode = false;
let devModeTimer = null;

// Middleware to check API key
function checkApiKey(req, res, next) {
  const apiKey = req.get('X-API-Key');
  
  if (devMode) {
    return next();
  }

  if (apiKey && apiKey === API_KEY) {
    return next();
  }

  return res.status(403).json({ error: 'Access denied. Invalid API key.' });
}

// Middleware to check origin for browser requests
function checkOrigin(req, res, next) {
  const origin = req.get('origin');
  
  if (devMode) {
    return next();
  }

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    
    return next();
  }

  if (!origin) {
    // Non-browser requests (like Postman) often don't set the origin
    // We'll require API key for these requests
    return checkApiKey(req, res, next);
  }

  return res.status(403).json({ error: 'Access denied. Invalid origin.' });
}

// Apply checkOrigin middleware to all routes
app.use(checkOrigin);

// Admin password check middleware
function checkPassword(req, res, next) {
  const password = req.body.password;
  if (password === adminPassword) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Invalid password.' });
  }
}

// Public routes (no API key required)
app.get('/', (req, res) => {
  res.json({ status: 'Welcome to PixelVerse Systems API.' });
});

app.get('/ping', (req, res) => {
  res.json({ status: 'PixelVerse Systems API is up and running.' });
});

// Admin routes
app.get('/securityshield/v0/identity', (req, res) => {
  res.send(`
    <h1>SecurityShield Needs to Verify Your Identity</h1>
    <form action="/securityshield/v0/identity" method="post">
      <label for="password">Enter your SecureID:</label>
      <input type="password" id="password" name="password" required>
      <button type="submit">Verify</button>
    </form>
  `);
});

app.post('/securityshield/v0/identity', checkPassword, (req, res) => {
  res.send(`
    <h1>SecurityShield Dashboard</h1>
    <p>Welcome, Admin!</p>
    <form action="/securityshield/v0/identity/devmode" method="post">
      <input type="hidden" name="password" value="${req.body.password}">
      <button type="submit">Enable Dev Mode (10 minutes)</button>
    </form>
  `);
});

app.post('/securityshield/v0/identity/devmode', checkPassword, (req, res) => {
  devMode = true;
  
  if (devModeTimer) {
    clearTimeout(devModeTimer);
  }

  devModeTimer = setTimeout(() => {
    devMode = false;
    console.log('Dev mode disabled after 10 minutes');
  }, 10 * 60 * 1000);

  res.send(`
    <h1>Dev Mode Enabled</h1>
    <p>All origins will be allowed for 10 minutes.</p>
  `);
});

// Protected routes (API key required)
app.use(checkApiKey);

app.get('/securityshield/v1/status', (req, res) => {
  res.json({ status: 'SecurityShield is currently active.' });
});

app.get('/securityshield/v0/devmode', (req, res) => {
  res.json({ status: devMode });
});

app.get('/securityshield/v1/log', (req, res) => {
  const requestDetails = {
    method: req.method,
    url: req.url,
    headers: req.headers,
  };
  res.json(requestDetails);
});

// API key routes
const apiRoutes = [
  { path: '/securityshield/v1/KJHG88293543', key: 'GOOGLE_GEMINI_API_KEY' },
  { path: '/securityshield/v1/DHGJ35274528', key: 'OPENAI_API_KEY' },
  { path: '/securityshield/v1/GNDO38562846', key: 'GROQ_API_KEY' },
  { path: '/securityshield/v1/WIFN48264853', key: 'ELEVENLABS_API_KEY' },
];

apiRoutes.forEach(route => {
  app.post(route.path, (req, res) => {
    res.json({ apiKey: process.env[route.key] });
  });
});

// BETA test
app.post('/securityshield/beta/KJHG88293543', (req, res) => {
  res.json({ apiKey: 'pxvsai-34872983482HDSJAK' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;