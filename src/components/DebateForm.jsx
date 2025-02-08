import React, { useState, useEffect } from 'react';
import { postTweet } from '../api/twitter';
import { createDebateAgent, getAgentResponse, LLM_PROVIDERS } from '../api/llm';
import DebateResponses from './DebateResponses';
import { postToDiscord, getGuildChannels } from '../api/discord';
import './DebateForm.css';

function DebateForm() {
  const [topic, setTopic] = useState('');
  const [apiChoice, setApiChoice] = useState(LLM_PROVIDERS.ANTHROPIC);
  const [debating, setDebating] = useState(false);
  const [responses, setResponses] = useState([]);
  const [error, setError] = useState(null);
  const [discordChannelId, setDiscordChannelId] = useState('');
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    const fetchDiscordChannels = async () => {
      try {
        const guildId = import.meta.env.VITE_DISCORD_GUILD_ID;
        const guildChannels = await getGuildChannels(guildId);
        setChannels(guildChannels);
        console.log('Fetched Discord channels:', guildChannels);
      } catch (error) {
        console.error('Failed to fetch Discord channels:', error);
        setError('Failed to fetch Discord channels: ' + error.message);
      }
    };

    fetchDiscordChannels();
  }, []);

  const generateDebatePrompt = (isSupporting, topic) => `
    You are an AI debate agent arguing ${isSupporting ? 'in favor of' : 'against'} the following topic: ${topic}. 

    ${isSupporting 
      ? 'Construct a compelling, logical argument supporting the topic under 1000 characters. Highlight specifc benefits, positive impacts, and use-cases.' 
      : 'Construct a critical, analytical argument challenging the topic under 1000 characters. Identify specific drawbacks, risks, and counterarguments.'
    }

    Provide a structured, persuasive argument under 1000 characters that:
    - Highlights a clear thesis in the first argument
    - Offers 2-3 substantive points
    - Uses logical reasoning
    - Uses the opposing agent's perspective as an input to offer rebuttal in your argument

    Your goal is to present a crisp and specific, well-reasoned perspective that demonstrates deep critical thinking with solid rebuttals to the other agent.
  `;

  const addResponse = (agent, content, isError = false) => {
    setResponses(prev => [...prev, {
      id: `${agent}-${Date.now()}`,
      agent,
      text: isError ? `Error: ${content}` : content
    }]);
  };

  const handleStartDebate = async () => {
    setResponses([]);
    setError(null);
    setDebating(true);

    try {
      const yesAgent = createDebateAgent('Yes Agent', 'Supportive debater arguing in favor', apiChoice);
      const noAgent = createDebateAgent('No Agent', 'Critical debater arguing against', apiChoice);

      console.log(`Starting debate using ${apiChoice} API`);
      console.log('Discord channel ID:', discordChannelId);

      for (let round = 0; round < 5; round++) {
        // Yes Agent's turn
        try {
          const yesResponse = await getAgentResponse(yesAgent, generateDebatePrompt(true, topic));
          addResponse('Yes Agent', yesResponse.content);
          
          // Commented out Twitter posting
          // await postTweet(`Yes Agent on ${topic}: ${yesResponse.content}`);
          
          if (discordChannelId) {
            try {
              console.log('Posting Yes Agent response to Discord...');
              await postToDiscord(discordChannelId, `**Yes Agent on "${topic}":**\n${yesResponse.content}`);
              console.log('Successfully posted Yes Agent response to Discord');
            } catch (discordError) {
              console.error('Failed to post to Discord:', discordError);
              setError(`Discord Error: ${discordError.message}`);
              // Continue with debate even if Discord posting fails
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
          addResponse('Yes Agent', error.message, true);
          throw error;
        }

        // No Agent's turn
        try {
          const noResponse = await getAgentResponse(noAgent, generateDebatePrompt(false, topic));
          addResponse('No Agent', noResponse.content);
          
          // Commented out Twitter posting
          // await postTweet(`No Agent on ${topic}: ${noResponse.content}`);
          
          if (discordChannelId) {
            try {
              console.log('Posting No Agent response to Discord...');
              await postToDiscord(discordChannelId, `**No Agent on "${topic}":**\n${noResponse.content}`);
              console.log('Successfully posted No Agent response to Discord');
            } catch (discordError) {
              console.error('Failed to post to Discord:', discordError);
              setError(`Discord Error: ${discordError.message}`);
              // Continue with debate even if Discord posting fails
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
          addResponse('No Agent', error.message, true);
          throw error;
        }
      }
    } catch (error) {
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setDebating(false);
    }
  };

  return (
    <div className="debate-container">
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="debate-input">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter debate topic"
          disabled={debating}
        />
        <select 
          value={apiChoice} 
          onChange={(e) => setApiChoice(e.target.value)}
          disabled={debating}
        >
          <option value={LLM_PROVIDERS.ANTHROPIC}>Anthropic</option>
          <option value={LLM_PROVIDERS.OPENAI}>OpenAI</option>
        </select>
        <div className="discord-controls">
          {channels.length > 0 && (
            <select 
              value={discordChannelId} 
              onChange={(e) => setDiscordChannelId(e.target.value)}
              className="discord-channel-select"
              disabled={debating}
            >
              <option value="">Select Channel</option>
              {channels.map(channel => (
                <option key={channel.id} value={channel.id}>
                  # {channel.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <button 
          onClick={handleStartDebate} 
          disabled={debating || !topic}
        >
          {debating ? 'Debating...' : 'Start Debate'}
        </button>
      </div>
      
      <DebateResponses responses={responses} />
    </div>
  );
}

export default DebateForm;
