import React, { useState } from 'react';
import './Tooltip.css';

export function Tooltip({ children, content }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="tooltip-container"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      {showTooltip && (
        <div className="tooltip-content">
          {content}
        </div>
      )}
    </div>
  );
} 