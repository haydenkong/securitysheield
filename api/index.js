const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// temp chat
const chatRouter = require('./chat');

require('dotenv').config();

// use chat router under the /chat path
app.use('/chat', chatRouter);

// Define allowed origins
const allowedOrigins = ['https://ai.pixelverse.tech'];

let devMode = false;
let devModeTimer = null;
const adminPassword = 'a95XE5Is4dXlvHJDN95sZIDEJ0Ydm6YwDjFz8s6N16yYjk3RkB'; 

// Setup CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || devMode) {
      callback(null, true);  // Allow requests from allowed origins or in dev mode
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// Handle preflight requests
app.options('*', cors());

// restrict access using Middleware based on the request origin
function checkOrigin(req, res, next) {
  if (devMode) {
    next(); // allow all traffic in dev mode
  } else {
    const origin = req.get('origin');
    if (allowedOrigins.includes(origin)) {
      next(); // move on if request is from allowed origin
    } else {
      res.status(403).json({ error: 'An unknown error occurred.' });
    }
  }
}

// Admin password check middleware
function checkPassword(req, res, next) {
  const password = req.body.password;
  if (password === adminPassword) {
    next();
  } else {
    res.status(403).json({ error: 'An unknown error occurred.' });
  }
}

// API status - general status of whole API
app.get('/', (req, res) => {
  res.json({ status: 'Welcome to PixelVerse Systems API.' });
});

// API GitHub Deploy ID
app.get('/vs', (req, res) => {
  const commitId = process.env.GITHUB_SHA;
  res.json({ deployId: commitId });
});

// API status - general status of whole API
app.get('/ping', (req, res) => {
  res.json({ status: 'PixelVerse Systems API is up and running. All checks return normal. Please email contact@pixelverse.tech if you experience any errors.' });
});

// API status - general status of whole API
app.get('/ping', (req, res) => {
  res.json({ status: 'PixelVerse Systems API is up and running. All checks return normal. Please email contact@pixelverse.tech if you experience any errors.' });
});

// Status - see if SecurityShield is active
app.get('/securityshield/v1/status', checkOrigin, (req, res) => {
  res.json({ status: 'SecurityShield is currently active.' });
});

// Log - returns with request info
app.get('/securityshield/v1/log', (req, res) => {
  const requestDetails = {
    method: req.method,
    url: req.url,
    headers: req.headers,
  };
  res.json(requestDetails);
});

// Admin UI Dashboard (displays password input form)
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

// Admin UI Dashboard (password protected, POST request)
app.post('/securityshield/v0/identity', checkPassword, (req, res) => {
  res.send(`
    <h1>SecurityShield Dashboard</h1>
    <p>Welcome, Admin!</p>
    <form action="/securityshield/v0/identity/devmode" method="post">
      <input type="hidden" name="password" value="${req.body.password}">
      <button type="submit">Enable Dev Mode (10 minutes)</button>
      <p>Enabling dev mode allows traffic from any url for 10 minutes. Be careful!</p>
    </form>
  `);
});

// Dev Mode - 10 minutes
app.post('/securityshield/v0/identity/devmode', checkPassword, (req, res) => {
  devMode = true;
  if (devModeTimer) {
    clearTimeout(devModeTimer);
  }
  devModeTimer = setTimeout(() => {
    devMode = false;
  }, 10 * 60 * 1000);

  res.send(`
    <h1>Dev Mode Enabled</h1>
    <p>All origins will be allowed for 10 minutes.</p>
  `);
});

// Google Gemini API Key (restricted access)
app.post('/securityshield/v1/KJHG88293543', checkOrigin, (req, res) => {
  res.json({ apiKey: 'google-gemini-api' });
});

// OpenAI API Key (restricted access)
app.post('/securityshield/v1/DHGJ35274528', checkOrigin, (req, res) => {
  res.json({ apiKey: 'openai-api' });
});

// Groq API Key (restricted access)
app.post('/securityshield/v1/GNDO38562846', checkOrigin, (req, res) => {
  res.json({ apiKey: 'groq-api' });
});

// ElevenLabs API Key (restricted access)
app.post('/securityshield/v1/WIFN48264853', checkOrigin, (req, res) => {
  res.json({ apiKey: 'elevenlabs-api' });
});

// BETA test
app.post('/securityshield/beta/KJHG88293543', (req, res) => {
  res.json({ apiKey: 'google-gemini-api' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;