import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

router.post('/messages', async (req, res) => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: req.body.model || "gpt-4",
        messages: req.body.messages || [],
        max_tokens: req.body.max_tokens || 300,
        temperature: req.body.temperature || 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      return res.status(response.status).json({ 
        error: errorData.error?.message || 'Unknown error',
        type: errorData.error?.type || 'api_error'
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ 
      error: error.message,
      type: 'server_error'
    });
  }
});

export default router; 