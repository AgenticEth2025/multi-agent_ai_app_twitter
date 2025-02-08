import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { handleOAuthCallback } from '../api/discord';

function DiscordCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get('code');

      if (code) {
        try {
          await handleOAuthCallback(code);
          navigate('/'); // Redirect back to main page
        } catch (error) {
          console.error('Discord authentication failed:', error);
          navigate('/?error=discord_auth_failed');
        }
      }
    };

    handleCallback();
  }, [location, navigate]);

  return (
    <div className="discord-callback">
      <p>Authenticating with Discord...</p>
    </div>
  );
}

export default DiscordCallback; 