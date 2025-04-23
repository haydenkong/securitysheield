const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Your verification token should be stored in environment variables
const VERIFICATION_TOKEN = process.env.EBAY_VERIFICATION_TOKEN || 'YourVerificationToken123_456789123';
// Your endpoint URL (this should be the full URL path that eBay will use)
const ENDPOINT = process.env.EBAY_ENDPOINT_URL || 'https://api.pixelverse.tech/ebay/compliance';

// Handle GET requests for the eBay verification challenge
router.get('/compliance', (req, res) => {
    const challengeCode = req.query.challenge_code;
    
    if (!challengeCode) {
        return res.status(400).json({ error: 'Missing challenge_code parameter' });
    }
    
    try {
        // Create a SHA-256 hash using challengeCode + verificationToken + endpoint
        const hash = crypto.createHash('sha256');
        hash.update(challengeCode);
        hash.update(VERIFICATION_TOKEN);
        hash.update(ENDPOINT);
        const responseHash = hash.digest('hex');
        
        // Log the challenge response for debugging
        console.log('Challenge code received:', challengeCode);
        console.log('Challenge response generated:', responseHash);
        
        // Return the challenge response with 200 OK status
        res.status(200).json({
            challengeResponse: responseHash
        });
    } catch (error) {
        console.error('Error processing eBay verification challenge:', error);
        res.status(500).json({ error: 'Failed to process verification challenge' });
    }
});

// Handle POST requests for marketplace account deletion notifications
router.post('/compliance', async (req, res) => {
    try {
        // Store the entire notification in the database
        const notificationData = req.body;
        const timestamp = new Date().toISOString();
        
        // Log the received notification
        console.log('eBay marketplace account deletion notification received:', JSON.stringify(notificationData));
        
        // Insert into the ebay-compliance table
        const { data, error } = await supabase
            .from('ebay-compliance')
            .insert([{ 
                'api-response': notificationData,
                timestamp,
                notification_type: 'marketplace_account_deletion'
            }]);

        if (error) throw error;

        // Return 200 OK to acknowledge receipt of the notification
        res.status(200).json({ success: true, message: 'eBay marketplace account deletion notification received and processed' });
    } catch (error) {
        console.error('Error processing eBay marketplace account deletion notification:', error);
        res.status(500).json({ success: false, error: 'Could not process notification', details: error.message });
    }
});

module.exports = router;