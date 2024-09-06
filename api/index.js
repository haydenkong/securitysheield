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

// Setup CORS middleware for all routes except dev mode and identity
app.use((req, res, next) => {
  if (req.path.startsWith('/securityshield/v0/identity') || devMode) {
    next(); // Bypass CORS for identity routes and dev mode
  } else {
    cors({
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || devMode) {
          callback(null, true);  // Allow requests from allowed origins or in dev mode
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    })(req, res, next);
  }
});

// Handle preflight requests
app.options('*', cors());

// Middleware to handle origin check
function checkOrigin(req, res, next) {
  const origin = req.get('origin');
  
  if (devMode) {
    next(); // In dev mode, allow all origins
  } else if (allowedOrigins.includes(origin)) {
    next(); // Allow if from the correct origin
  } else {
    res.status(403).json({ error: 'An unknown error occurred' });
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

// Allow all origins for dev mode and identity routes
function allowAllOrigins(req, res, next) {
  next(); // Allow any origin for these routes
}

// Admin UI Dashboard
app.get('/securityshield/v0/identity', allowAllOrigins, (req, res) => {
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
app.post('/securityshield/v0/identity', allowAllOrigins, checkPassword, (req, res) => {
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
app.post('/securityshield/v0/identity/devmode', allowAllOrigins, checkPassword, (req, res) => {
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