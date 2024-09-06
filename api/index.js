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

// Define always accessible routes
const alwaysAccessibleRoutes = [
  '/securityshield/v0/identity',
  '/ping',
  '/',
  '/securityshield/v1/log',
  '/securityshield/v0/devmode',
  '/securityshield/v1/status'
];

let devMode = false;
let devModeTimer = null;
const adminPassword = process.env.ADMIN_PASSWORD; 

// Setup CORS middleware for all routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (devMode || alwaysAccessibleRoutes.some(route => req.path.startsWith(route))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  } else if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  } else {
    res.status(403).json({ error: 'Not allowed by CORS' });
  }
});

// Handle preflight requests
app.options('*', cors());

// Middleware to handle origin check (now only used for non-CORS checks)
function checkOrigin(req, res, next) {
  if (devMode || alwaysAccessibleRoutes.some(route => req.path.startsWith(route))) {
    next(); // Allow if in dev mode or it's an always-accessible route
  } else {
    const origin = req.get('origin');
    if (allowedOrigins.includes(origin)) {
      next(); // Allow if from the correct origin
    } else {
      res.status(403).json({ error: 'An unknown error occurred' });
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

// Admin UI Dashboard
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

// Admin UI Dashboard (POST to enable dev mode)
app.post('/securityshield/v0/identity', checkPassword, (req, res) => {
  res.send(`
    <h1>SecurityShield Dashboard</h1>
    <p>Welcome, Admin!</p>
    <form action="/securityshield/v0/identity/devmode" method="post">
      <input type="hidden" name="password" value="${req.body.password}">
      <button type="submit">Enable Dev Mode (10 minutes)</button>
      <p>Enabling dev mode allows traffic from any URL for 10 minutes. Be careful!</p>
    </form>
  `);
});

// Enable Dev Mode
app.post('/securityshield/v0/identity/devmode', checkPassword, (req, res) => {
  devMode = true;
  
  // clear timer if it exists
  if (devModeTimer) {
    clearTimeout(devModeTimer);
  }

  // set 10 minute timer
  devModeTimer = setTimeout(() => {
    devMode = false;
  }, 10 * 60 * 1000);

  res.send(`
    <h1>Dev Mode Enabled</h1>
    <p>All origins will be allowed for 10 minutes.</p>
  `);
});

// API Home
app.get('/', (req, res) => {
  res.json({ status: 'Welcome to PixelVerse Systems API.' });
});

// API status - general status of whole API
app.get('/ping', (req, res) => {
  res.json({ status: 'PixelVerse Systems API is up and running. All checks return normal. Please email contact@pixelverse.tech if you experience any errors.' });
});

// Status - see if SecurityShield is active
app.get('/securityshield/v1/status', checkOrigin, (req, res) => {
  res.json({ status: 'SecurityShield is currently active.' });
});

// Dev Mode Status
app.get('/securityshield/v0/devmode', (req, res) => {
  res.json({ status: devMode });
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

// Google Gemini API Key (restricted access)
app.post('/securityshield/v1/KJHG88293543', checkOrigin, (req, res) => {
  res.json({ apiKey: process.env.GOOGLE_GEMINI_API_KEY });
});

// OpenAI API Key (restricted access)
app.post('/securityshield/v1/DHGJ35274528', checkOrigin, (req, res) => {
  res.json({ apiKey: process.env.OPENAI_API_KEY });
});

// Groq API Key (restricted access)
app.post('/securityshield/v1/GNDO38562846', checkOrigin, (req, res) => {
  res.json({ apiKey: process.env.GROQ_API_KEY });
});

// ElevenLabs API Key (restricted access)
app.post('/securityshield/v1/WIFN48264853', checkOrigin, (req, res) => {
  res.json({ apiKey: process.env.ELEVENLABS_API_KEY });
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