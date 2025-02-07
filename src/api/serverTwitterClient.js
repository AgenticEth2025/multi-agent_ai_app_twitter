import { TwitterApi } from 'twitter-api-v2';

export class ServerTwitterClient {
  static #instance = null;
  static MAX_TWEET_LENGTH = 280;

  constructor() {
    if (ServerTwitterClient.#instance) {
      return ServerTwitterClient.#instance;
    }

    const config = {
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    };

    const client = new TwitterApi(config);
    this.v2Client = client.v2;
    ServerTwitterClient.#instance = this;
  }

  static getInstance() {
    if (!ServerTwitterClient.#instance) {
      new ServerTwitterClient();
    }
    return ServerTwitterClient.#instance;
  }

  // Helper method to get first valid tweet chunk
  getFirstTweetChunk(text) {
    console.log('\nPreparing tweet text:', { textLength: text.length });
    
    // Get first 280 characters, breaking at last word boundary if needed
    let chunk = text.slice(0, ServerTwitterClient.MAX_TWEET_LENGTH);
    if (text.length > ServerTwitterClient.MAX_TWEET_LENGTH) {
      const lastSpace = chunk.lastIndexOf(' ');
      if (lastSpace > 0) {
        chunk = chunk.slice(0, lastSpace);
      }
    }

    console.log('\nPrepared tweet:', {
      length: chunk.length,
      text: chunk
    });
    
    return chunk;
  }

  async createTweet(text, replyToId = null) {
    // Get only the first valid chunk
    const tweetText = this.getFirstTweetChunk(text);
    
    console.log('\nAttempting to post tweet:', {
      length: tweetText.length,
      text: tweetText
    });

    const tweetData = {
      text: tweetText,
      ...(replyToId && { reply: { in_reply_to_tweet_id: replyToId } })
    };

    const response = await this.v2Client.tweet(tweetData);
    console.log('Tweet posted successfully:', response.data);
    return response.data;
  }

  async verifyCredentials() {
    const me = await this.v2Client.me();
    return {
      verified: true,
      user: me.data
    };
  }
}

export default ServerTwitterClient; 