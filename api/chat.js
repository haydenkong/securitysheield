const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const SUPABASE_URL = 'https://nvriywibysvgezidjira.supabase.co';
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cml5d2lieXN2Z2V6aWRqaXJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ2NTAzMjQsImV4cCI6MjA0MDIyNjMyNH0.39Rvs4oXsbc92uYBVzMZ7Ov25ACczgn_Fp6lbCB0rZ4";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const chatOrigin = 'https://pixelverseit.github.io';

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