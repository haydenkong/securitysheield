const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Single permissive CORS middleware for all routes
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');
    
    // Handle preflight
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

// Update distribution
router.patch('/distributions/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
        .from('map')
        .update(updates)
        .eq('id', id)
        .select();

    if (error) return res.status(500).json({ error });
    res.json(data);
});

// Delete distribution
router.delete('/distributions/:id', async (req, res) => {
    const { id } = req.params;

    const { data, error } = await supabase
        .from('map')
        .delete()
        .eq('id', id)
        .select();

    if (error) return res.status(500).json({ error });
    res.json(data);
});

// Get leaderboard 
router.get('/sciencegame/leaderboard', async (req, res) => {
    const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(10);

    if (error) return res.status(500).json({ error });
    res.json(data);
});

// Add score
router.post('/sciencegame/score', async (req, res) => {
    const { data, error } = await supabase
        .from('leaderboard')
        .insert([req.body]);

    if (error) return res.status(500).json({ error });
    res.json(data);
});

// Basic error handler
router.use((error, req, res, next) => {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
});

module.exports = router;