const express = require('express');
const app = express();

// restrict access using Middleware based on the request origin
function checkOrigin(req, res, next) {
  const allowedOrigin = 'https://ai.pixelverse.tech';
  const origin = req.get('origin');

  if (origin === allowedOrigin) {
    next(); // move on if request is from origin
  } else {
    res.status(403).json({ error: 'Access denied' });
  }
}

// API status - general status of whole API
app.get('/ping', (req, res) => {
  res.json({ status: 'API is running' });
});

// Status - see if SeucirtyShield is active
app.get('/securityshield/v1/status', checkOrigin, (req, res) => {
  res.json({ status: 'SecurityShield is active' });
});

// Log - returns with request info
app.get('/securityshield/v1/log', checkOrigin, (req, res) => {
  const requestDetails = {
    method: req.method,
    url: req.url,
    headers: req.headers,
  };
  res.json(requestDetails);
});

// Admin UI Dashboard (restricted access)
app.get('/securityshield/v0/dashboard', checkOrigin, (req, res) => {
  res.send('<h1>Admin UI Dashboard</h1><p>Only accessible from allowed origin.</p>');
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
