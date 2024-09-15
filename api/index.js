const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
// groq api: import Groq from 'groq-sdk';
import Groq from 'groq-sdk';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const chatRouter = require('./chat');
require('dotenv').config();

app.use('/chat', chatRouter);

const allowedOrigins = ['https://ai.pixelverse.tech'];

const alwaysAccessibleRoutes = [
  '/securityshield/v0/identity',
  '/ping',
  '/',
  '/securityshield/v1/log',
  '/securityshield/v0/devmode',
  '/securityshield/v1/status',
  '/services/urltext',
];

let devMode = false;
let devModeTimer = null;
const adminPassword = process.env.ADMIN_PASSWORD;

// Middleware to check origin for all requests
function checkOrigin(req, res, next) {
  const origin = req.get('origin') || req.get('referer') || req.get('host');
  
  if (alwaysAccessibleRoutes.some(route => req.path.startsWith(route))) {
    return next();
  }

  if (devMode) {
    return next();
  }

  if (origin && allowedOrigins.includes(origin)) {
    return next();
  }

  return res.status(403).json({ error: 'Access denied' });
}

// Apply checkOrigin middleware to all routes
app.use(checkOrigin);

// CORS middleware (for browser requests)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', allowedOrigins.join(','));
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
});

// Admin password check middleware
function checkPassword(req, res, next) {
  const password = req.body.password;
  if (password === adminPassword) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied' });
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

// API Home
app.get('/', (req, res) => {
  res.json({ status: 'Welcome to PixelVerse Systems API.' });
});

// API status
app.get('/ping', (req, res) => {
  res.json({ status: 'PixelVerse Systems API is up and running. All checks return normal. Please email contact@pixelverse.tech if you experience any errors.' });
});

// SecurityShield status
app.get('/securityshield/v1/status', (req, res) => {
  res.json({ status: 'SecurityShield is currently active.' });
});

// Dev Mode Status
app.get('/securityshield/v0/devmode', (req, res) => {
  res.json({ status: devMode });
});

// Log
app.get('/securityshield/v1/log', (req, res) => {
  const requestDetails = {
    method: req.method,
    url: req.url,
    headers: req.headers,
  };
  res.json(requestDetails);
});

// Restricted routes (API keys)
const restrictedRoutes = [
  { path: '/securityshield/v1/KJHG88293543', key: 'GOOGLE_GEMINI_API_KEY' },
  { path: '/securityshield/v1/DHGJ35274528', key: 'OPENAI_API_KEY' },
  { path: '/securityshield/v1/GNDO38562846', key: 'GROQ_API_KEY' },
  { path: '/securityshield/v1/WIFN48264853', key: 'ELEVENLABS_API_KEY' },
];

restrictedRoutes.forEach(route => {
  app.post(route.path, (req, res) => {
    res.json({ apiKey: process.env[route.key] });
  });
});

// BETA test
app.post('/securityshield/beta/KJHG88293543', (req, res) => {
  res.json({ apiKey: 'pxvsai-34872983482HDSJAK' });
});

// URL TO TEXT (post a url and then return with all the text in that website)
// how to use
// POST /services/urltext
// { "url": "https://www.pixelverse.tech" }
// response: { "text": "..." }
app.post('/services/urltext', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  let browser;
  try {
    browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    // Simulate Ctrl+A to select all text
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    
    // Copy the selected text
    const text = await page.evaluate(() => window.getSelection().toString());
    
    await browser.close();
    
    res.json({ text: text.trim() });
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    res.status(500).json({ error: 'Could not fetch URL', details: error.message });
  }
});

app.post('/generate', async (req, res) => {
  try {
    const { messages, model } = req.body;
    const stream = await groq.chat.completions.create({
      messages,
      model,
      stream: true,  // Enable streaming
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${content}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');  // End of stream
    res.end();
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;