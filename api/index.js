const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));

const allowedOrigin = 'https://ai.pixelverse.tech';
const adminPassword = 'a95XE5Is4dXlvHJDN95sZIDEJ0Ydm6YwDjFz8s6N16yYjk3RkB'; 
let devMode = false;
let devModeTimer = null;

// restrict access using Middleware based on the request 
function checkOrigin(req, res, next) {
  if (devMode) {
    next(); // allow all traffic in dev mode
  } else {
    const origin = req.get('origin');
    if (origin === allowedOrigin) {
      next(); // move on if request is from allowed origin
    } else {
      res.status(403).json({ error: 'Access denied' });
    }
  }
}

// Admin psw check middleware
function checkPassword(req, res, next) {
  const password = req.query.password;
  if (password === adminPassword) {
    next();
  } else {
    res.status(403).json({ error: 'Invalid password' });
  }
}

// API status - general status of whole API
app.get('/ping', (req, res) => {
  res.json({ status: 'API is running' });
});

// Status - see if SecurityShield is active
app.get('/securityshield/v1/status', checkOrigin, (req, res) => {
  res.json({ status: 'SecurityShield is active' });
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

// Admin UI Dashboard
app.get('/securityshield/v0/dashboard', checkPassword, (req, res) => {
  res.send(`
    <h1>SecurityShield Dashbaord</h1>
    <p>Hello, Admin!</p>
    <form action="/securityshield/v0/dashboard/devmode" method="post">
      <button type="submit">Enable Dev Mode (10 minutes)</button>
    </form>
  `);
});

// Dev Mode - 10 minutes
app.post('/securityshield/v0/dashboard/devmode', checkPassword, (req, res) => {
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
app.get('/securityshield/v1/KJHG88293543', checkOrigin, (req, res) => {
  res.json({ apiKey: 'google-gemini-api' });
});

// OpenAI API Key (restricted access)
app.get('/securityshield/v1/DHGJ35274528', checkOrigin, (req, res) => {
  res.json({ apiKey: 'openai-api' });
});

// Groq API Key (restricted access)
app.get('/securityshield/v1/GNDO38562846', checkOrigin, (req, res) => {
  res.json({ apiKey: 'groq-api' });
});

// ElevenLabs API Key (restricted access)
app.get('/securityshield/v1/WIFN48264853', checkOrigin, (req, res) => {
  res.json({ apiKey: 'elevenlabs-api' });
});

module.exports = app;