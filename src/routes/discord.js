import express from 'express';
import axios from 'axios';

const router = express.Router();
const DISCORD_API = 'https://discord.com/api/v10';

// Verify server is running and connected
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handler middleware
const handleDiscordError = (error, res) => {
  console.error('Discord API Error:', {
    status: error.response?.status,
    data: error.response?.data,
    message: error.message
  });
  
  res.status(error.response?.status || 500).json({
    error: error.response?.data?.message || 'Internal server error',
    details: error.response?.data
  });
};

// Validate request middleware
const validateRequest = (req, res, next) => {
  console.log('Validating request headers:', {
    hasAuth: !!req.headers.authorization,
    method: req.method,
    path: req.path
  });
  
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Authorization header is required' });
  }
  next();
};

// Proxy endpoint for getting channels
router.get('/channels/:guildId', validateRequest, async (req, res) => {
  try {
    const { guildId } = req.params;
    console.log(`Fetching channels for guild: ${guildId}`);
    
    // Verify Discord API is accessible
    try {
      await axios.get(`${DISCORD_API}/gateway`);
    } catch (error) {
      console.error('Discord API not accessible:', error);
      return res.status(503).json({ error: 'Discord API not accessible' });
    }
    
    const response = await axios.get(
      `${DISCORD_API}/guilds/${guildId}/channels`,
      {
        headers: {
          'Authorization': req.headers.authorization,
        },
      }
    );
    
    console.log(`Successfully fetched ${response.data.length} channels`);
    res.json(response.data);
  } catch (error) {
    handleDiscordError(error, res);
  }
});

// Proxy endpoint for posting messages
router.post('/messages/:channelId', validateRequest, async (req, res) => {
  try {
    const { channelId } = req.params;
    console.log(`Posting message to channel: ${channelId}`);
    
    const response = await axios.post(
      `${DISCORD_API}/channels/${channelId}/messages`,
      req.body,
      {
        headers: {
          'Authorization': req.headers.authorization,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('Successfully posted message to Discord');
    res.json(response.data);
  } catch (error) {
    handleDiscordError(error, res);
  }
});

export default router; 