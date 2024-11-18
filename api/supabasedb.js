const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// env variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// CORS middleware
router.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Get all distributions
router.get('/distributions', async (req, res) => {
    const { data, error } = await supabase
        .from('map')
        .select('*')
        .order('timestamp', { ascending: false });

    if (error) return res.status(500).json({ error });
    
    res.json(data);
});

// Add new distribution
router.post('/distributions', async (req, res) => {
    const { data, error } = await supabase
        .from('map')
        .insert([req.body]);

    if (error) return res.status(500).json({ error });
    
    res.json(data);
});

module.exports = router;