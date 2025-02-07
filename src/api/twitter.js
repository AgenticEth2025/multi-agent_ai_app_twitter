// Helper function for consistent logging
const logTwitterEvent = (type, message, error = null, details = null) => {
  const timestamp = new Date().toISOString();
  const prefix = `[Twitter ${type}]`;
  
  if (error) {
    console.error(`${prefix} ${message}`, { timestamp, error, details });
  } else {
    console.log(`${prefix} ${message}`, { timestamp, details });
  }
};

export const postTweet = async (text) => {
  try {
    logTwitterEvent('Post', 'Initiating tweet post request', null, {
      textLength: text.length
    });

    const response = await fetch('/api/twitter/tweet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        const rawResponse = await response.text().catch(() => 'Unable to get response text');
        errorData = {
          parseError: e.message,
          rawResponse
        };
      }
      
      logTwitterEvent('Error', 'Backend API request failed', null, {
        status: response.status,
        statusText: response.statusText,
        errorData,
        requestUrl: response.url
      });
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    
    // Log the posted tweets
    if (data.thread) {
      logTwitterEvent('Success', 'Thread posted successfully', null, {
        numberOfTweets: data.tweets.length,
        tweets: data.tweets.map(t => t.text)
      });
    } else {
      logTwitterEvent('Success', 'Tweet posted successfully', null, {
        tweet: data.text
      });
    }
    
    return data;
  } catch (error) {
    const isNetworkError = error.name === 'TypeError' && error.message.includes('fetch');
    
    logTwitterEvent('Error', 'Failed to post tweet', error, {
      originalTextLength: text.length,
      errorCode: error.code,
      errorType: error.name,
      isNetworkError,
      errorMessage: error.message
    });

    if (isNetworkError) {
      throw new Error('Failed to connect to the server. Please check your internet connection.');
    } else {
      throw error;
    }
  }
};
