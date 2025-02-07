import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

router.post('/messages', async (req, res) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'messages-2023-12-15'
      },
      body: JSON.stringify({
        model: req.body.model || "claude-3-haiku-20240307",
        max_tokens: req.body.max_tokens || 300,
        messages: req.body.messages || [],
        temperature: req.body.temperature || 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API Error:', errorData);
      return res.status(response.status).json({ 
        error: errorData.error?.message || 'Unknown error',
        type: errorData.error?.type || 'api_error'
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Anthropic API Error:', error);
    res.status(500).json({ 
      error: error.message,
      type: 'server_error'
    });
  }
});

export default router; 