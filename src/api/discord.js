import axios from 'axios';

const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;
const BOT_TOKEN = import.meta.env.VITE_DISCORD_BOT_TOKEN;
const API_BASE_URL = '/api/discord'; // Use relative URL for proxy

// Helper for making API requests
const makeRequest = async (method, endpoint, data = null) => {
  if (!BOT_TOKEN) {
    console.error('Discord bot token missing');
    throw new Error('Discord bot token not configured');
  }

  try {
    console.log(`Discord API ${method} request to ${endpoint}`);
    
    // Check server health first with retries
    const maxRetries = 3;
    let retryCount = 0;
    while (retryCount < maxRetries) {
      try {
        await axios.get(`${API_BASE_URL}/health`);
        break; // Success, exit retry loop
      } catch (error) {
        retryCount++;
        if (retryCount === maxRetries) {
          console.error('Server health check failed:', error);
          throw new Error('Server not accessible after multiple attempts');
        }
        console.log(`Retrying server health check (${retryCount}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between retries
      }
    }

    const response = await axios({
      method,
      url: `${API_BASE_URL}${endpoint}`,
      data,
      headers: {
        'Authorization': `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(`Discord API response:`, response.data);
    return response.data;
  } catch (error) {
    console.error('Discord API error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      endpoint,
      isAxiosError: error.isAxiosError,
      config: error.config
    });
    throw new Error(error.response?.data?.message || 'Discord API request failed');
  }
};

// Discord API methods
export const getAuthUrl = () => {
  const permissions = '68608'; // VIEW_CHANNEL (1024) + SEND_MESSAGES (2048) + READ_MESSAGE_HISTORY (65536)
  console.log('Generating Discord auth URL with client ID:', DISCORD_CLIENT_ID);
  return `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=${permissions}&scope=bot%20applications.commands`;
};

export const getGuildChannels = async (guildId) => {
  if (!guildId) {
    throw new Error('Guild ID is required');
  }

  try {
    const channels = await makeRequest('GET', `/channels/${guildId}`);
    const textChannels = channels.filter(channel => channel.type === 0);
    console.log('Filtered text channels:', textChannels);
    return textChannels;
  } catch (error) {
    console.error('Failed to fetch guild channels:', error);
    throw error;
  }
};

export const postToDiscord = async (channelId, message) => {
  if (!channelId) {
    throw new Error('Channel ID is required');
  }
  if (!message) {
    throw new Error('Message content is required');
  }

  try {
    return await makeRequest('POST', `/messages/${channelId}`, { content: message });
  } catch (error) {
    console.error('Failed to post message to Discord:', error);
    throw error;
  }
}; 