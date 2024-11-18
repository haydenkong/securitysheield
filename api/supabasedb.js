const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// env variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Get all distributions
router.get('/distributions', async (req, res) => {
    const { data, error } = await supabase
        .from('map')
        .select('*')
        .order('timestamp', { ascending: false });

    if (error) return res.status(500).json({ error });
    
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow requests from any domain
    res.json(data);
});

// Add new distribution
router.post('/distributions', async (req, res) => {
    const { data, error } = await supabase
        .from('map')
        .insert([req.body]);

    if (error) return res.status(500).json({ error });
    
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow requests from any domain
    res.json(data);
});

module.exports = router;