import { TwitterClient } from './twitterClient.js';
const twitterClient = TwitterClient.getInstance();

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

// Add a function to verify Twitter credentials
export const verifyTwitterCredentials = async () => {
  try {
    logTwitterEvent('Auth', 'Loading Twitter client');
    const client = TwitterClient.getInstance();
    if (!client) {
      throw new Error('Failed to initialize Twitter client');
    }
    
    logTwitterEvent('Auth', 'Verifying Twitter credentials');
    const result = await client.verifyCredentials();
    
    logTwitterEvent('Auth', 'Twitter credentials verified successfully', null, {
      userId: result.id,
      username: result.username
    });
    return result;
  } catch (error) {
    logTwitterEvent('Auth', 'Twitter credential verification failed', error, {
      errorCode: error.code,
      errorType: error.name
    });
    throw new Error(`Failed to verify Twitter credentials: ${error.message}`);
  }
};

export const postTweet = async (text) => {
  // Declare tweetChunks at the start of the function scope
  let tweetChunks = [];
  
  try {
    logTwitterEvent('Post', 'Loading Twitter client');
    const client = TwitterClient.getInstance();

    logTwitterEvent('Post', 'Processing tweet text', null, {
      textLength: text.length,
      isThread: text.length > 280
    });

    // Break tweet into chunks of 280 characters if needed
    let remainingText = text;
    
    while (remainingText.length > 0) {
      if (remainingText.length <= 280) {
        tweetChunks.push(remainingText);
        break;
      }
      
      // Find last space before 280 chars to avoid breaking words
      let cutoff = remainingText.lastIndexOf(' ', 280);
      if (cutoff === -1) {
        logTwitterEvent('Warning', 'No space found for clean break, forcing split at 280 chars');
        cutoff = 280;
      }
      
      tweetChunks.push(remainingText.substring(0, cutoff));
      remainingText = remainingText.substring(cutoff + 1);
    }

    logTwitterEvent('Post', `Preparing to post tweets`, null, {
      numberOfChunks: tweetChunks.length,
      chunkLengths: tweetChunks.map(chunk => chunk.length)
    });

    // Post tweets as a thread
    const postedTweets = await client.createThreadedTweets(tweetChunks);
    
    logTwitterEvent('Complete', `Successfully posted tweets`, null, {
      numberOfTweets: postedTweets.length,
      tweetIds: postedTweets.map(tweet => tweet.id),
      firstTweetId: postedTweets[0]?.id,
      lastTweetId: postedTweets[postedTweets.length - 1]?.id
    });
    
    return postedTweets;
  } catch (error) {
    logTwitterEvent('Error', 'Failed to post tweet', error, {
      originalTextLength: text.length,
      errorCode: error.code,
      errorType: error.name,
      attemptedChunks: tweetChunks?.length
    });
    throw new Error(`Failed to post tweet: ${error.message}`);
  }
};
