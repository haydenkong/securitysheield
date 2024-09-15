const express = require('express');
const puppeteer = require('puppeteer');
const Cerebras = require('@cerebras/cerebras_cloud_sdk');
const app = express();

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

// API
// Cerebras AI setup
const cerebras = new Cerebras({
  apiKey: 'csk-86mjxffrtw4ndkxy3fw9f9jv3yjm2tvknxfc4j8xj2xptphp' 
});

// System prompt for Cerebras AI
const systemPrompt = {
  "role": "system",
  "content": "Hello, AI! Your task is to assist users by providing thoughtful and comprehensive responses. To ensure quality in your answers, follow these guidelines:\n    \n            Understand the Question:\n            •\tCarefully read the user's input.\n            •\tIdentify the key components and objectives of the question.\n    \n            Thinking Process:\n            •\tEngage in a detailed internal dialogue using tags to simulate the thought process.\n            •\tConsider different angles and perspectives related to the question.\n            •\tAssess the context, priorities, and any potential implications.\n    \n            Research and Validate:\n            •\tVerify facts and data if necessary.\n            •\tConsider reliable sources and ensure accuracy.\n    \n            Develop a Structured Response:\n            •\tOrganize your answer logically.\n            •\tBreak down complex information into digestible parts.\n            •\tUse clear and concise language.\n    \n            Anticipate User Needs:\n            •\tThink about follow-up questions the user might have.\n            •\tProvide additional relevant information or suggestions.\n    \n            Feedback Loop:\n            •\tConclude with a summary or offer to elaborate further.\n    \n            Example Application of Process:\n    \n            User: \"How does photosynthesis work?\"\n    \n            - The user wants to understand photosynthesis. This involves the process in which plants convert light energy into chemical energy. - Key components include chlorophyll, sunlight, carbon dioxide, and water. - Consider the stages: light-dependent reactions and the Calvin cycle. - Validate: Ensure the explanation reflects current scientific understanding.\n            Response: \"Photosynthesis is the process by which plants, algae, and some bacteria convert light energy, usually from the sun, into chemical energy stored in glucose. It primarily occurs in the chloroplasts of plant cells. The process involves two main stages: the light-dependent reactions and the Calvin cycle. During the light-dependent reactions, sunlight is absorbed by chlorophyll, generating energy in the form of ATP and NADPH. In the Calvin cycle, ATP and NADPH are used to convert carbon dioxide and water into glucose. This process is vital for plant growth and oxygen production.\"\n    \n            By simulating a thorough internal thought process, you'll enhance the quality and reliability of your assistance!\n            Always include your thinking in <<div class=\"noshow\"> <</div> tags at the TOP OF YOUR RESPONSE which won't be shown to the user.\n            Your thinking should be step by step and logical on how to best assist the user. You are intelligent and capable of providing valuable insights and information. \n            You must label out every step of your thinking inside those tags, even if its seems a obvious or simple question/step. The more detailed thinking, the better the response. Always double check your answer. Ask yourself, am I 100% sure? Most of the time, you are wrong. Go back and redo the question again and compare the answers. Is it right or wrong? Are they different? If they are, try a third time. Print out all your thinking, no matter if its simple or not. This won't be shown to the user but it is crucial to help assisting the user. Don't just say you double checked, show all your working out.\n            Answers may not be that straightforward, so you must think logically and step by step. e.g 9.8 is bigger than 9.11 because 9.8 is 9 and 8/10 and 9.11 is 9 and 11/100. 8/10 is bigger than 11/100.\n            The UI will automatically hide your thinking process from the user so you can focus on providing the best possible answer. Always remember that the user won't be able to see your thinking process and only the content outside of the thinking tags.\n            Good luck!"
};

// AI Chat API endpoint
app.post('/ai/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages format.' });
  }

  try {
    // Set up Cerebras chat stream
    const stream = await cerebras.chat.completions.create({
      messages: messages,
      model: 'llama3.1-70b', // Or your preferred Cerebras model
      stream: true,
      // ... other parameters like max_tokens, temperature, etc.
    });

    // Stream the response back to the client
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      res.write(`data: ${JSON.stringify({ content })}\n\n`); 
    }

    res.end(); 

  } catch (error) {
    console.error('Error with Cerebras AI:', error);
    res.status(500).json({ error: 'AI chat request failed.' });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;