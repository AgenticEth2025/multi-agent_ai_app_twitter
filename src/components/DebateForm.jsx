import React, { useState, useEffect, useRef } from 'react';
import { postTweet } from '../api/twitter';
import { createDebateAgent, getAgentResponse, LLM_PROVIDERS } from '../api/llm';
import { processUrl, processFile } from '../utils/contentProcessor';
import DebateResponses from './DebateResponses';
import { postToDiscord, getGuildChannels } from '../api/discord';
import { Tooltip } from './Tooltip';
import './DebateForm.css';
import axios from 'axios';

function DebateForm() {
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [enableTwitter, setEnableTwitter] = useState(false);
  const [enableDiscord, setEnableDiscord] = useState(false);
  const fileInputRef = useRef(null);
  const [apiChoice, setApiChoice] = useState(LLM_PROVIDERS.ANTHROPIC);
  const [debating, setDebating] = useState(false);
  const [responses, setResponses] = useState([]);
  const [error, setError] = useState(null);
  const [discordChannelId, setDiscordChannelId] = useState('');
  const [channels, setChannels] = useState([]);
  const [debateInProgress, setDebateInProgress] = useState(false);
  const debateRef = useRef(null);

  useEffect(() => {
    const fetchDiscordChannels = async () => {
      try {
        // Check if server is running first
        try {
          await axios.get('/api/discord/health');
        } catch (error) {
          throw new Error('Server not accessible. Please ensure the backend server is running.');
        }

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

  const generateDebatePrompt = (isSupporting, topic, previousResponse = null) => `
    You are an AI debate agent arguing ${isSupporting ? 'in favor of' : 'against'} the following topic: ${topic}.
    
    ${previousResponse 
      ? `Your opponent's last argument was:\n"${previousResponse}"\n\n` 
      : ''}

    ${isSupporting 
      ? `Construct a compelling, logical argument supporting the topic under 1000 characters that directly addresses and rebuts the opposing arguments ${previousResponse ? 'above' : 'as they arise'}. Highlight specific benefits, positive impacts, and use-cases.` 
      : `Construct a critical, analytical argument challenging the topic under 1000 characters that directly addresses and rebuts the supporting arguments ${previousResponse ? 'above' : 'as they arise'}. Identify specific drawbacks, risks, and counterarguments.`
    }

    Your response should:
    - Start with a clear thesis
    - Directly address and counter specific points from your opponent's last argument ${previousResponse ? '' : '(when they arise)'}
    - Present 2-3 new substantive points to advance your position
    - Use concrete examples and logical reasoning
    - Maintain a professional, analytical tone

    Format your response to clearly separate your rebuttals from your new arguments.
    Your goal is to present a focused, well-reasoned perspective while systematically addressing your opponent's points.
  `;

  const addResponse = (agent, content, isError = false) => {
    setResponses(prev => [...prev, {
      id: `${agent}-${Date.now()}`,
      agent,
      text: isError ? `Error: ${content}` : content
    }]);
  };

  const processInput = async (input) => {
    if (input.startsWith('http://') || input.startsWith('https://')) {
      setIsProcessing(true);
      try {
        const extractedContent = await processUrl(input);
        return extractedContent;
      } catch (error) {
        setError(`Failed to process URL: ${error.message}`);
        return input;
      } finally {
        setIsProcessing(false);
      }
    }
    return input;
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsProcessing(true);
      setFileName(file.name);
      try {
        const content = await processFile(file);
        setTopic(content);
        setFile(file);
      } catch (error) {
        setError(`Failed to process file: ${error.message}`);
        setFileName('');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleStopDebate = () => {
    if (debateRef.current) {
      debateRef.current.stop = true;
      setDebating(false);
      setDebateInProgress(false);
    }
  };

  const handleStartDebate = async () => {
    setResponses([]);
    setError(null);
    setDebating(true);
    setDebateInProgress(true);
    
    debateRef.current = { stop: false };

    try {
      const processedInput = await processInput(topic);
      const yesAgent = createDebateAgent('Yes Agent', 'Supportive debater arguing in favor', apiChoice);
      const noAgent = createDebateAgent('No Agent', 'Critical debater arguing against', apiChoice);
      let lastResponse = null;

      console.log(`Starting debate using ${apiChoice} API`);

      for (let round = 0; round < 5; round++) {
        if (debateRef.current.stop) {
          console.log('Debate stopped by user');
          break;
        }

        // Yes Agent's turn
        try {
          const yesResponse = await getAgentResponse(
            yesAgent, 
            generateDebatePrompt(true, processedInput, lastResponse)
          );
          addResponse('Yes Agent', yesResponse.content);
          lastResponse = yesResponse.content;
          
          if (enableTwitter) {
            await postTweet(`Yes Agent on ${topic}: ${yesResponse.content}`);
          }
          
          if (enableDiscord && discordChannelId) {
            try {
              await postToDiscord(discordChannelId, `**Yes Agent on "${topic}":**\n${yesResponse.content}`);
            } catch (discordError) {
              setError(`Discord Error: ${discordError.message}`);
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
          addResponse('Yes Agent', error.message, true);
          throw error;
        }

        // No Agent's turn
        try {
          const noResponse = await getAgentResponse(
            noAgent, 
            generateDebatePrompt(false, processedInput, lastResponse)
          );
          addResponse('No Agent', noResponse.content);
          lastResponse = noResponse.content;
          
          if (enableTwitter) {
            await postTweet(`No Agent on ${topic}: ${noResponse.content}`);
          }
          
          if (enableDiscord && discordChannelId) {
            try {
              await postToDiscord(discordChannelId, `**No Agent on "${topic}":**\n${noResponse.content}`);
            } catch (discordError) {
              setError(`Discord Error: ${discordError.message}`);
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
      setDebateInProgress(false);
      debateRef.current = null;
    }
  };

  return (
    <div className="debate-container">
      <div className="debate-header">
        <h1>Multi-Agent DAO Governance</h1>
        <p>Enter a topic, URL, or upload a file to start an AI-powered debate</p>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="input-group">
        <div className="input-row">
          <Tooltip content="Enter a topic description or paste a URL">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter topic or paste URL"
              disabled={debating}
              className="topic-input"
            />
          </Tooltip>
        </div>
        
        <div className="input-row">
          <Tooltip content="Upload a file (PDF, DOC, TXT)">
            <div className="file-input-wrapper">
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.txt"
                ref={fileInputRef}
                disabled={debating}
              />
              <button 
                onClick={() => fileInputRef.current.click()}
                disabled={debating}
                className="file-button"
              >
                {fileName ? `File: ${fileName}` : 'Upload File'}
              </button>
              {fileName && (
                <button
                  onClick={() => {
                    setFileName('');
                    setFile(null);
                    setTopic('');
                  }}
                  className="clear-file-button"
                >
                  ×
                </button>
              )}
            </div>
          </Tooltip>
        </div>

        <div className="controls-group">
          <div className="api-selection">
            <select 
              value={apiChoice} 
              onChange={(e) => setApiChoice(e.target.value)}
              disabled={debating}
            >
              <option value={LLM_PROVIDERS.ANTHROPIC}>Anthropic</option>
              <option value={LLM_PROVIDERS.OPENAI}>OpenAI</option>
            </select>
          </div>

          <div className="posting-options">
            <div className="posting-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={enableTwitter}
                  onChange={(e) => setEnableTwitter(e.target.checked)}
                  disabled={debating}
                />
                <span>Post to Twitter</span>
              </label>
            </div>
            
            <div className="posting-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={enableDiscord}
                  onChange={(e) => setEnableDiscord(e.checked)}
                  disabled={debating}
                />
                <span>Post to Discord</span>
              </label>
              
              {enableDiscord && (
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
              )}
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button 
            onClick={handleStartDebate} 
            disabled={debating || !topic || isProcessing}
            className="primary-button"
          >
            {isProcessing ? 'Processing...' : debating ? 'Debating...' : 'Start Debate'}
          </button>
          
          {debateInProgress && (
            <button 
              onClick={handleStopDebate}
              className="stop-button"
            >
              Stop Debate
            </button>
          )}
        </div>
      </div>
      
      <DebateResponses responses={responses} />
    </div>
  );
}

export default DebateForm;
