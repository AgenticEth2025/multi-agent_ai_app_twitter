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

// At the top of the file, make LLM_PROVIDERS exportable
export const LLM_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic'
};

// Default configurations
const DEFAULT_CONFIG = {
  [LLM_PROVIDERS.OPENAI]: {
    model: "gpt-4",
    temperature: 0.7,
    max_tokens: 300
  },
  [LLM_PROVIDERS.ANTHROPIC]: {
    model: "claude-3-haiku-20240307",
    temperature: 0.7,
    max_tokens: 300
  }
};

// Helper to format messages for different providers
const formatMessages = (messages, provider) => {
  if (provider === LLM_PROVIDERS.ANTHROPIC) {
    return messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
  }
  return messages; // OpenAI format is our default format
};

export const sendMessage = async (messages, provider = LLM_PROVIDERS.ANTHROPIC) => {
  try {
    console.log(`Sending message to ${provider}:`, messages);

    const endpoint = provider === LLM_PROVIDERS.ANTHROPIC 
      ? '/api/anthropic/messages'
      : '/api/openai/messages';

    const formattedMessages = formatMessages(messages, provider);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: formattedMessages,
        ...DEFAULT_CONFIG[provider]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`${provider} API Error:`, errorData);
      throw new Error(errorData.error || `${provider} API error`);
    }

    const data = await response.json();
    
    // Normalize response format
    let content;
    if (provider === LLM_PROVIDERS.ANTHROPIC) {
      content = data.content?.[0]?.text || data.message?.content || '';
    } else {
      content = data.choices?.[0]?.message?.content || '';
    }

    if (!content) {
      throw new Error(`Invalid response from ${provider}`);
    }

    return {
      role: 'assistant',
      content
    };
  } catch (error) {
    console.error(`Error in ${provider} message:`, error);
    throw error;
  }
};

export const createDebateAgent = (name, role, provider = LLM_PROVIDERS.ANTHROPIC) => {
  const systemMessage = {
    role: 'system',
    content: `You are ${name}, ${role}. Respond in character, considering your role and expertise.`
  };

  return {
    name,
    role,
    systemMessage,
    provider,
    messages: [systemMessage]
  };
};

export const getAgentResponse = async (agent, prompt) => {
  const messages = [
    ...agent.messages,
    { role: 'user', content: prompt }
  ];

  const response = await sendMessage(messages, agent.provider);
  return response;
};
