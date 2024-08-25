const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const chatOrigin = 'https://pixelverseit.github.io';
const messagesFilePath = path.join(__dirname, 'messages.json');

// Middleware check origin for chat-related requests
function checkChatOrigin(req, res, next) {
  const origin = req.get('origin');
  if (origin === chatOrigin) {
    next(); // approve and next 
  } else {
    res.status(403).json({ error: 'Access denied' });
  }
}

// make messages file if it doesn't exist
if (!fs.existsSync(messagesFilePath)) {
  fs.writeFileSync(messagesFilePath, JSON.stringify([]));
}

// POST - store new chat message
router.post('/send', checkChatOrigin, (req, res) => {
  const { name, message } = req.body;
  
  if (!name || !message) {
    return res.status(400).json({ error: 'Name and message are required' });
  }

  const newMessage = {
    name,
    message,
    timestamp: new Date().toISOString(),
  };

  const messages = JSON.parse(fs.readFileSync(messagesFilePath, 'utf8'));

  // Add new message to the list
  messages.push(newMessage);

  fs.writeFileSync(messagesFilePath, JSON.stringify(messages, null, 2));

  res.status(200).json({ success: 'Message sent successfully' });
});

// GET - retrieve all chat messages
router.get('/messages', checkChatOrigin, (req, res) => {
  const messages = JSON.parse(fs.readFileSync(messagesFilePath, 'utf8'));
  res.json(messages);
});

module.exports = router;
