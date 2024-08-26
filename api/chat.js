const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const router = express.Router();

// env variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// allowed origins
const allowedOrigins = ['https://pixelverseit.github.io', 'http://127.0.0.1:5501'];

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
};

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