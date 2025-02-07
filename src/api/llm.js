import axios from 'axios';

// Safe serialization function
function safeStringify(obj) {
  try {
    return JSON.stringify(obj, (key, value) => {
      // Handle potential non-serializable values
      if (value === undefined) return null;
      if (typeof value === 'function') return value.toString();
      if (value instanceof Error) {
        return {
          name: value.name,
          message: value.message,
          stack: value.stack
        };
      }
      return value;
    }, 2);
  } catch {
    return 'Unable to serialize object';
  }
}

// Safe logging function
function safeLog(message, data) {
  try {
    console.log(message, safeStringify(data));
  } catch {
    console.log(message, 'Unable to log data');
  }
}

// Centralized API configuration
const API_CONFIGS = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    getHeaders: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }),
    formatPayload: (prompt) => ({
      model: "gpt-3.5-turbo",
      messages: [
        {"role": "system", "content": "You are a debate agent arguing a point."},
        {"role": "user", "content": prompt}
      ],
      max_tokens: 150
    }),
    extractResponse: (data) => {
      if (!data.choices || !data.choices.length) {
        throw new Error('Invalid OpenAI API response');
      }
      return data.choices[0].message.content.trim();
    }
  },
  anthropic: {
    url: '/api/anthropic/messages',
    getHeaders: () => ({
      'Content-Type': 'application/json'
    }),
    formatPayload: (prompt) => ({
      messages: [
        {
          "role": "user", 
          "content": `You are a debate agent. ${prompt}`
        }
      ]
    }),
    extractResponse: (data) => {
      // Enhanced error checking for Anthropic response
      if (!data || !data.content || !data.content.length) {
        throw new Error('Invalid Anthropic API response');
      }
      return data.content[0].text.trim();
    }
  }
};

export const getLLMResponse = async (apiChoice, prompt) => {
  try {
    // Validate API choice
    if (!API_CONFIGS[apiChoice]) {
      throw new Error(`Unsupported API: ${apiChoice}`);
    }

    // Get API configuration
    const config = API_CONFIGS[apiChoice];
    
    // Get API key from environment
    const apiKey = apiChoice === 'openai' 
      ? import.meta.env.VITE_OPENAI_API_KEY 
      : import.meta.env.VITE_ANTHROPIC_API_KEY;

    // Validate API key
    if (!apiKey) {
      throw new Error(`Missing API key for ${apiChoice}`);
    }

    // Prepare request configuration
    const requestConfig = {
      method: 'post',
      url: config.url,
      headers: config.getHeaders(apiKey),
      data: config.formatPayload(prompt)
    };

    // Safe logging of request details
    safeLog('API Request Config:', {
      url: requestConfig.url,
      method: requestConfig.method,
      data: requestConfig.data
    });

    // Make the API call
    const response = await axios(requestConfig);

    // Extract and return response
    return config.extractResponse(response.data);
  } catch (error) {
    // Safe error logging
    safeLog('API Error Details:', {
      message: error.message,
      name: error.name,
      response: error.response ? safeStringify(error.response.data) : 'No response',
      config: error.config ? safeStringify(error.config) : 'No config'
    });

    // Throw a serializable error
    throw new Error(`API Call Failed: ${error.message}`);
  }
};
