import React, { useState } from 'react';
import { postTweet } from '../api/twitter';
import { createDebateAgent, getAgentResponse, LLM_PROVIDERS } from '../api/llm';
import DebateResponses from './DebateResponses';

function DebateForm() {
  const [topic, setTopic] = useState('');
  const [apiChoice, setApiChoice] = useState(LLM_PROVIDERS.ANTHROPIC);
  const [debating, setDebating] = useState(false);
  const [responses, setResponses] = useState([]);
  const [error, setError] = useState(null);

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

      for (let round = 0; round < 5; round++) {
        // Yes Agent's turn
        try {
          const yesResponse = await getAgentResponse(yesAgent, generateDebatePrompt(true, topic));
          addResponse('Yes Agent', yesResponse.content);
          await postTweet(`Yes Agent on ${topic}: ${yesResponse.content}`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
          addResponse('Yes Agent', error.message, true);
          throw error;
        }

        // No Agent's turn
        try {
          const noResponse = await getAgentResponse(noAgent, generateDebatePrompt(false, topic));
          addResponse('No Agent', noResponse.content);
          await postTweet(`No Agent on ${topic}: ${noResponse.content}`);
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
