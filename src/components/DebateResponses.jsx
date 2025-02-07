import React from 'react';

const DebateResponses = ({ responses }) => {
  const getAgentClass = (agent) => {
    if (agent === 'Yes Agent') return 'yes-agent';
    if (agent === 'No Agent') return 'no-agent';
    return 'system-agent';
  };

  return (
    <div className="debate-responses">
      <h3>Debate Responses</h3>
      {responses.map((response) => (
        <div 
          key={response.id} 
          className={`response-item ${getAgentClass(response.agent)}`}
        >
          <strong>{response.agent}:</strong>
          <p>{response.text}</p>
        </div>
      ))}
    </div>
  );
};

export default DebateResponses;
