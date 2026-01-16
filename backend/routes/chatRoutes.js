const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Simple chat endpoint for the library chatbot
router.post('/', chatController.handleChat);

module.exports = router;
