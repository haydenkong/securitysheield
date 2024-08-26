const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// env variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const chatOrigins = Array.isArray(process.env.CHAT_ORIGIN) 
  ? process.env.CHAT_ORIGIN 
  : ['https://pixelverseit.github.io', 'http://127.0.0.1:5501'];

// Middleware CORS handler
function handleCORS(req, res, next) {
  const origin = req.headers.origin;
  if (chatOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  // preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
}

// CORS middleware to all routes
router.use(handleCORS);

// POST - store new chat message
router.post('/send', async (req, res) => {
  const { name, message } = req.body;
  
  if (!name || !message) {
    return res.status(400).json({ error: 'Name and message are required' });
  }

  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{ name, message, timestamp: new Date().toISOString() }]);

    if (error) throw error;

    res.status(200).json({ success: 'Message sent successfully', data });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Could not save message', details: error.message });
  }
});

// GET request to retrieve all chat messages
router.get('/messages', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('timestamp', { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error loading messages:', error);
    res.status(500).json({ error: 'Could not load messages', details: error.message });
  }
});

module.exports = router;