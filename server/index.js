const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const DISCORD_API = 'https://discord.com/api/v10';

// Proxy endpoint for getting channels
app.get('/api/discord/channels/:guildId', async (req, res) => {
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
app.post('/api/discord/messages/:channelId', async (req, res) => {
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

app.listen(port, () => {
  console.log(`Proxy server running on port ${port}`);
}); 