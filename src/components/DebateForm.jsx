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

  const generateAgentPrompt = (agent, topic) => {
    return `You are an AI debate agent arguing ${agent === 'Yes Agent' ? 'in favor of' : 'against'} the following topic: ${topic}. 

${agent === 'Yes Agent' ? 'Construct a compelling, logical argument supporting the topic under 1000 characters. Highlight specifc benefits, positive impacts, and use-cases.' : 'Construct a critical, analytical argument challenging the topic under 1000 characters. Identify specific drawbacks, risks, and counterarguments.'}

Provide a structured, persuasive argument under 1000 characters that:
- Highlights a clear thesis in the first argument
- Offers 2-3 substantive points
- Uses logical reasoning
- Uses the opposing agent's perspective as an input to offer rebuttal in your argument

Your goal is to present a crisp and specific, well-reasoned perspective that demonstrates deep critical thinking with solid rebuttals to the other agent.`;
  };

  const handleStartDebate = async () => {
    setResponses([]);
    setError(null);
    setDebating(true);

    // Create debate agents
    const yesAgent = createDebateAgent('Yes Agent', 'Supportive debater arguing in favor', apiChoice);
    const noAgent = createDebateAgent('No Agent', 'Critical debater arguing against', apiChoice);

    let round = 0;
    try {
      while (round < 5) {
        // Yes Agent's turn
        const yesPrompt = generateAgentPrompt('Yes Agent', topic);
        const yesResponse = await getAgentResponse(yesAgent, yesPrompt);
        setResponses(prev => [...prev, {
          id: `yes-${round}`,
          agent: 'Yes Agent',
          text: yesResponse.content
        }]);

        // Post to Twitter
        await postTweet(`Yes Agent on ${topic}: ${yesResponse.content}`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait between tweets

        // No Agent's turn
        const noPrompt = generateAgentPrompt('No Agent', topic);
        const noResponse = await getAgentResponse(noAgent, noPrompt);
        setResponses(prev => [...prev, {
          id: `no-${round}`,
          agent: 'No Agent',
          text: noResponse.content
        }]);

        // Post to Twitter
        await postTweet(`No Agent on ${topic}: ${noResponse.content}`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait between rounds

        round += 1;
      }
    } catch (error) {
      const errorMessage = error.message || 'An unexpected error occurred';
      setError(errorMessage);
      setResponses(prev => [...prev, {
        id: `error-${round}`,
        agent: 'System',
        text: `Error: ${errorMessage}`
      }]);
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
