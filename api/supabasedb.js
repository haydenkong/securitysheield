const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// env variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// CORS middleware
router.use((req, res, next) => {
    const allowedOrigins = ['https://ai.pixelverse.tech', 'https://playrockmine.vercel.app'];
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
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

    try {
        const { data, error } = await supabase
            .from('map')
            .update(updates)
            .eq('id', id)
            .select(); // Add .select() to return updated record

        if (error) throw error;
        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }

        res.json(data[0]);
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete distribution
router.delete('/distributions/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('map')
            .delete()
            .eq('id', id)
            .select(); // Add .select() to return deleted record

        if (error) throw error;
        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }

        res.json({ success: true, data: data[0] });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get leaderboard
router.get('/sciencegame/leaderboard', async (req, res) => {
    const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(10);

    if (error) {
        return res.status(500).json({ error: error.message });
    }
    res.json(data);
});

// Add score
router.post('/sciencegame/score', async (req, res) => {
    const { name, score } = req.body;

    const { data, error } = await supabase
        .from('leaderboard')
        .insert([{ name, score }]);

    if (error) {
        return res.status(500).json({ error: error.message });
    }
    res.json(data);
});

  
// Optional: Add error handling middleware
router.use((error, req, res, next) => {
    console.error('API Error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
    });
});

module.exports = router;