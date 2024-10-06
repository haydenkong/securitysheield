const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// env variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const chatOrigins = Array.isArray(process.env.CHAT_ORIGIN) 
  ? process.env.CHAT_ORIGIN 
  : ['https://pixelverseit.github.io', 'https://ai.pixelverse.tech', 'https://haydenkong.dev', 'https://haydenkong.vercel.app'];

// Middleware CORS handler
function handleCORS(req, res, next) {
  const origin = req.headers.origin;
  if (chatOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
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

    if (message.length > 400) {
        return res.status(400).json({ error: 'Message exceeds maximum length of 400 characters' });
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


// generate editID
function generateEditID() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  for (let i = 0; i < 4; i++) {
    result += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return result;
}

// POST - store new journal entry
router.post('/journal', async (req, res) => {
    const { slack_handle, profile_url, message, name } = req.body;

    if (!slack_handle || !message || !name) {
        return res.status(400).json({ error: 'Slack handle, message, and name are required' });
    }

    try {
        // check if slack_handle or name already exists for security
        const { data: existingEntries, error: checkError } = await supabase
            .from('journal')
            .select('slack_handle, name')
            .or(`slack_handle.eq.${slack_handle},name.eq.${name}`);

        if (checkError) throw checkError;

        if (existingEntries && existingEntries.length > 0) {
            return res.status(403).json({ error: 'Slack handle or name already exists' });
        }

        const timestamp = new Date().toISOString();
        const editID = generateEditID();
        const { data, error } = await supabase
            .from('journal')
            .insert([{ slack_handle, profile_url, message, name, timestamp, editID }]);

        if (error) throw error;

        res.status(200).json({ success: 'Journal entry saved successfully', data, editID });
    } catch (error) {
        console.error('Error saving journal entry:', error);
        res.status(500).json({ error: 'Could not save journal entry', details: error.message });
    }
});

// PUT - edit existing journal entry
router.put('/journal', async (req, res) => {
    const { editID, message } = req.body;

    if (!editID || !message) {
        return res.status(400).json({ error: 'EditID and message are required' });
    }

    try {
        const { data, error } = await supabase
            .from('journal')
            .update({ message })
            .match({ editID });

        if (error) throw error;

        if (data && data.length === 0) {
            return res.status(404).json({ error: 'No entry found with the provided editID' });
        }

        res.status(200).json({ success: 'Journal entry updated successfully', data });
    } catch (error) {
        console.error('Error updating journal entry:', error);
        res.status(500).json({ error: 'Could not update journal entry', details: error.message });
    }
});

// GET - retrieve all journal entries
router.get('/journal', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('journal')
            .select('*')
            .order('timestamp', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error loading journal entries:', error);
        res.status(500).json({ error: 'Could not load journal entries', details: error.message });
    }
});

// GET request to retrieve all journal entries without CORS restrictions
router.get('/arcadeweb', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('journal')
            .select('*')
            .order('timestamp', { ascending: false });

        if (error) throw error;

        res.setHeader('Access-Control-Allow-Origin', '*'); // Allow requests from any domain
        res.json(data);
    } catch (error) {
        console.error('Error loading journal entries:', error);
        res.status(500).json({ error: 'Could not load journal entries', details: error.message });
    }
});

// POST REQUEST that inserts in the supabase table - dt-contact
router.post('/contact', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    try {
        const { data, error } = await supabase
            .from('dt-contact')
            .insert([{ name, email, message, timestamp: new Date().toISOString() }]);

        if (error) throw error;

        res.status(200).json({ success: 'Message sent successfully', data });
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ error: 'Could not save message', details: error.message });
    }
});


// POST - table name is pixelverseai-t1-logs. post with user_msg, ai_msg, ai_model, created_at (timestamptz)
// also, it should only accept repsonses from https://ai.pixelverse.tech
router.post('/logs', async (req, res) => {
    const { user_msg, ai_msg, ai_model } = req.body;

    if (!user_msg || !ai_msg || !ai_model) {
        return res.status(400).json({ error: 'user_msg, ai_msg, and ai_model are required' });
    }

    try {
        const { data, error } = await supabase
            .from('pixelverseai-t1-logs')
            .insert([{ user_msg, ai_msg, ai_model, created_at: new Date().toISOString() }]);

        if (error) throw error;

        res.status(200).json({ success: 'Log saved successfully', data });
    } catch (error) {
        console.error('Error saving log:', error);
        res.status(500).json({ error: 'Could not save log', details: error.message });
    }
});

router.get('/logs', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('pixelverseai-t1-logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error loading logs:', error);
        res.status(500).json({ error: 'Could not load logs', details: error.message });
    }
});

module.exports = router;