import { proxyRequest } from './proxy';

const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;
const DISCORD_API = 'https://discord.com/api/v10';
const BOT_TOKEN = import.meta.env.VITE_DISCORD_BOT_TOKEN;

export const getAuthUrl = () => {
  console.log('Generating Discord auth URL with client ID:', DISCORD_CLIENT_ID);
  const permissions = '68608'; // Includes VIEW_CHANNEL (1024), SEND_MESSAGES (2048), READ_MESSAGE_HISTORY (65536)
  return `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=${permissions}&scope=bot%20applications.commands`;
};

export const getGuildChannels = async (guildId) => {
  console.log('Fetching channels for guild:', guildId);
  
  if (!BOT_TOKEN) {
    console.error('Discord bot token missing');
    throw new Error('Discord bot token not configured');
  }

  try {
    const response = await proxyRequest(
      'GET',
      `/channels/${guildId}`,
      null,
      {
        'Authorization': `Bot ${BOT_TOKEN}`,
      }
    );
    console.log('Fetched channels:', response);
    // Filter to only text channels
    const textChannels = response.filter(channel => channel.type === 0);
    console.log('Filtered text channels:', textChannels);
    return textChannels;
  } catch (error) {
    console.error('Error fetching channels:', error.response?.data || error.message);
    throw new Error(`Failed to fetch Discord channels: ${error.response?.data?.message || error.message}`);
  }
};

export const postToDiscord = async (channelId, message) => {
  console.log('Attempting to post to Discord channel:', channelId);
  console.log('Message content:', message);
  
  if (!BOT_TOKEN) {
    console.error('Discord bot token missing');
    throw new Error('Discord bot token not configured');
  }

  try {
    const response = await proxyRequest(
      'POST',
      `/messages/${channelId}`,
      { content: message },
      {
        'Authorization': `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json',
      }
    );
    console.log('Successfully posted to Discord:', response);
    return response;
  } catch (error) {
    console.error('Error posting to Discord:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      channelId,
      botTokenPresent: !!BOT_TOKEN
    });
    throw new Error(`Failed to post to Discord: ${error.response?.data?.message || error.message}`);
  }
}; 