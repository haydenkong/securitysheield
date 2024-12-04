const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// CORS configuration
const corsOptions = {
    origin: [
        'https://playrockmine.vercel.app',
        'https://ai.pixelverse.tech',
        'http://localhost:3000'
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

// Apply CORS middleware
router.use(cors(corsOptions));

// Get leaderboard
router.get('/sciencegame/leaderboard', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('leaderboard')
            .select('*')
            .order('score', { ascending: false })
            .limit(10);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch leaderboard'
        });
    }
});

// Add score
router.post('/sciencegame/score', async (req, res) => {
    try {
        const { name, score } = req.body;

        // Input validation
        if (!name || typeof score !== 'number') {
            return res.status(400).json({
                success: false,
                error: 'Invalid input: name and score are required'
            });
        }

        const { data, error } = await supabase
            .from('leaderboard')
            .insert([{ 
                name: name.trim(),
                score: Math.floor(score)
            }]);

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Score submission error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save score'
        });
    }
});

// Delete score (admin only)
router.delete('/sciencegame/score/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('leaderboard')
            .delete()
            .match({ id });

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete score'
        });
    }
});

module.exports = router;