import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import fetch from 'node-fetch';
//import TwitterClient from './src/api/twitterClient.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';

// Load environment variables
config({ 
  path: path.resolve(__dirname, '.env.local') 
});

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files in production
if (isProduction) {
  app.use(express.static(path.join(__dirname, 'dist')));
}

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.post('/api/anthropic/messages', async (req, res) => {
  try {
    console.log('Anthropic API Key Present:', !!process.env.ANTHROPIC_API_KEY);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 300,
        messages: req.body.messages || []
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API Error:', errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Twitter API error handler middleware
const handleTwitterError = (error, res) => {
  console.error('Twitter API Error:', {
    message: error.message,
    code: error.code,
    data: error.data,
    errors: error.errors
  });

  // Handle specific Twitter API errors
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

// Twitter API endpoints
/* app.post('/api/twitter/verify', async (req, res) => {
  try {
    const client = TwitterClient.getInstance();
    const result = await client.verifyCredentials();
    res.json(result);
  } catch (error) {
    handleTwitterError(error, res);
  }
}); */

/* app.post('/api/twitter/tweet', async (req, res) => {
  try {
    const { text, reply_to } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Tweet text is required' });
    }

    const client = TwitterClient.getInstance();
    const result = await client.createTweet(text, reply_to);
    
    res.json({
      id: result.id,
      text: result.text,
      created_at: new Date().toISOString()
    });

  } catch (error) {
    handleTwitterError(error, res);
  }
}); */

// Serve React app in production
if (isProduction) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  
  // Log environment variables status
  console.log('\nEnvironment Variables:');
  console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'Present' : 'Missing');
  console.log('TWITTER_API_KEY:', process.env.TWITTER_API_KEY ? 'Present' : 'Missing');
  console.log('TWITTER_ACCESS_TOKEN:', process.env.TWITTER_ACCESS_TOKEN ? 'Present' : 'Missing');
  
  // Verify Twitter credentials on startup
  /* try {
    const client = TwitterClient.getInstance();
    const credentials = await client.verifyCredentials();
    if (credentials.verified) {
      console.log('\nTwitter API credentials verified successfully');
      console.log('Authenticated as:', credentials.user.username);
    } else {
      console.error('\nFailed to verify Twitter API credentials');
    }
  } catch (error) {
    console.error('\nError initializing Twitter client:', error);
  } */
});
