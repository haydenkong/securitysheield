const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// env variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const chatOrigin = process.env.CHAT_ORIGIN || 'https://pixelverseit.github.io';

// Middleware check origin for chat-related requests
function checkChatOrigin(req, res, next) {
  const origin = req.get('origin');
  if (origin === chatOrigin) {
    next(); // move on
  } else {
    next(); // move on
  }
}

// POST - store new chat message
router.post('/send', checkChatOrigin, async (req, res) => {
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
router.get('/messages', checkChatOrigin, async (req, res) => {
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