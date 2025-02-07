import express from 'express';
import { ServerTwitterClient } from '../api/serverTwitterClient.js';

const router = express.Router();

// Twitter API error handler middleware
const handleTwitterError = (error, res) => {
  console.error('Twitter API Error:', {
    message: error.message,
    code: error.code,
    data: error.data,
    errors: error.errors
  });

  if (error.code) {
    const errorResponse = {
      error: 'Twitter API error',
      code: error.code,
      message: error.message
    };

    switch (error.code) {
      case 32:
      case 89:
        return res.status(401).json({
          ...errorResponse,
          error: 'Authentication error'
        });
      case 88:
        return res.status(429).json({
          ...errorResponse,
          error: 'Rate limit exceeded'
        });
      case 186:
        return res.status(400).json({
          ...errorResponse,
          error: 'Tweet is too long'
        });
      case 187:
        return res.status(400).json({
          ...errorResponse,
          error: 'Duplicate tweet'
        });
      default:
        return res.status(500).json(errorResponse);
    }
  }

  return res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
};

// Initialize Twitter client
let twitterClient = null;
try {
  twitterClient = ServerTwitterClient.getInstance();
  console.log('Twitter client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Twitter client:', error);
}

router.post('/tweet', async (req, res) => {
  if (!twitterClient) {
    return res.status(503).json({ error: 'Twitter service unavailable' });
  }

  console.log('Received tweet request:', req.body);
  
  try {
    const { text, reply_to } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Tweet text is required' });
    }

    const result = await twitterClient.createTweet(text, reply_to);
    console.log('Tweet posted successfully:', result);

    // Handle both single tweets and threads
    if (Array.isArray(result)) {
      res.json({
        thread: true,
        tweets: result.map(tweet => ({
          id: tweet.id,
          text: tweet.text,
          created_at: new Date().toISOString()
        }))
      });
    } else {
      res.json({
        thread: false,
        id: result.id,
        text: result.text,
        created_at: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error in tweet endpoint:', error);
    handleTwitterError(error, res);
  }
});

export default router; 