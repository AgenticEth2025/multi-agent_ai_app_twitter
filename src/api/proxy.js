import axios from 'axios';

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const proxyRequest = async (method, endpoint, data = null, headers = {}) => {
  try {
    const response = await axios({
      method,
      url: `${VITE_API_BASE_URL}/api/discord${endpoint}`,
      data,
      headers,
    });
    return response.data;
  } catch (error) {
    console.error('Proxy request failed:', error);
    throw error;
  }
}; 