const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Make this endpoint publicly accessible
router.post('/compliance', async (req, res) => {
    try {
        // Store the entire request body as the API response
        const apiResponse = req.body;
        const timestamp = new Date().toISOString();
        
        // Insert into the ebay-compliance table with the api-response column
        const { data, error } = await supabase
            .from('ebay-compliance')
            .insert([{ 'api-response': apiResponse, timestamp }]);

        if (error) throw error;

        // Return 200 OK if successful
        res.status(200).json({ success: true, message: 'Webhook data received and stored successfully' });
    } catch (error) {
        console.error('Error processing eBay compliance webhook:', error);
        res.status(500).json({ success: false, error: 'Could not process webhook data', details: error.message });
    }
});

module.exports = router;