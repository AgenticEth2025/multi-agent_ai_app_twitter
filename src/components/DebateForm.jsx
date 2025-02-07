import React, { useState } from 'react';
import { postTweet } from '../api/twitter';
import { getLLMResponse } from '../api/llm';
import DebateResponses from './DebateResponses';

function DebateForm() {
  const [topic, setTopic] = useState('');
  const [apiChoice, setApiChoice] = useState('openai');
  const [debating, setDebating] = useState(false);
  const [responses, setResponses] = useState([]);
  const [error, setError] = useState(null);

  const generateAgentPrompt = (agent, topic) => {
    const baseInstructions = `You are an AI debate agent arguing ${agent === 'Yes Agent' ? 'in favor of' : 'against'} the following topic: ${topic}. 

${agent === 'Yes Agent' ? 'Construct a compelling, logical argument supporting the topic. Highlight its potential benefits, positive impacts, and strong points.' : 'Construct a critical, analytical argument challenging the topic. Identify potential drawbacks, risks, and counterarguments.'}

Provide a structured, persuasive argument that:
- Highlights a clear thesis
- Offers 2-3 substantive points
- Uses logical reasoning
- Uses the opposing agent's perspective to offer rebuttal in your argument

Your goal is to present a nuanced, well-reasoned perspective that demonstrates deep critical thinking.`;

    return baseInstructions;
  };

  const handleStartDebate = async () => {
    // Reset previous state
    setResponses([]);
    setError(null);
    setDebating(true);

    let yesTurn = true;
    let round = 0;

    while (round < 5) {
      const agent = yesTurn ? 'Yes Agent' : 'No Agent';
      const prompt = generateAgentPrompt(agent, topic);
      
      try {
        const response = await getLLMResponse(apiChoice, prompt);
        
        // Update responses
        setResponses(prevResponses => [
          ...prevResponses, 
          { 
            id: `${agent}-${round}`, 
            agent, 
            text: response 
          }
        ]);

        // Post to Twitter (optional, can be commented out during testing)
        await postTweet(`${agent} on ${topic}: ${response}`);
      } catch (error) {
        // Handle and display errors
        const errorMessage = error.message || 'An unexpected error occurred';
        setError(errorMessage);
        
        setResponses(prevResponses => [
          ...prevResponses, 
          { 
            id: `error-${round}`, 
            agent: 'System', 
            text: `Error: ${errorMessage}` 
          }
        ]);

        // Stop the debate if an error occurs
        break;
      }

      yesTurn = !yesTurn;
      round += 1;
      
      // Wait between rounds
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    setDebating(false);
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
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
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
