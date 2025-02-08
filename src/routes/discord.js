import express from 'express';
import axios from 'axios';

const router = express.Router();
const DISCORD_API = 'https://discord.com/api/v10';

// Proxy endpoint for getting channels
router.get('/channels/:guildId', async (req, res) => {
  try {
    const response = await axios.get(
      `${DISCORD_API}/guilds/${req.params.guildId}/channels`,
      {
        headers: {
          'Authorization': req.headers.authorization,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Internal server error' });
  }
});

// Proxy endpoint for posting messages
router.post('/messages/:channelId', async (req, res) => {
  try {
    const response = await axios.post(
      `${DISCORD_API}/channels/${req.params.channelId}/messages`,
      req.body,
      {
        headers: {
          'Authorization': req.headers.authorization,
          'Content-Type': 'application/json',
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Internal server error' });
  }
});

export default router; 