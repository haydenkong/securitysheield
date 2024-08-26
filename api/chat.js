const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const SUPABASE_URL = 'https://nvriywibysvgezidjira.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const chatOrigin = 'https://pixelverseit.github.io';

// Middleware check origin for chat-related requests
function checkChatOrigin(req, res, next) {
  const origin = req.get('origin');
  if (origin === chatOrigin) {
    next(); // move on
  } else {
    res.status(403).json({ error: 'Access denied' });
  }
}

// POST - store new chat message
router.post('/send', checkChatOrigin, async (req, res) => {
  const { name, message } = req.body;
  
  if (!name || !message) {
    return res.status(400).json({ error: 'Name and message are required' });
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert([{ name, message, timestamp: new Date().toISOString() }]);

  if (error) {
    return res.status(500).json({ error: 'Could not save message' });
  }

  res.status(200).json({ success: 'Message sent successfully', data });
});

// GET request to retrieve all chat messages
router.get('/messages', checkChatOrigin, async (req, res) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .order('timestamp', { ascending: true });

  if (error) {
    return res.status(500).json({ error: 'Could not load messages' });
  }

  res.json(data);
});

module.exports = router;