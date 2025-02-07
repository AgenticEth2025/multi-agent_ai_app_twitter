import { TwitterApi } from 'twitter-api-v2';

export class TwitterClient {
  static instance = null;

  constructor() {
    if (!TwitterClient.instance) {
      // Initialize the client with OAuth 1.0a credentials
      const client = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_SECRET,
      });

      // Create v2 client instance
      this.v2Client = client.v2;
      
      TwitterClient.instance = this;
      console.log('Twitter v2 client initialized successfully');
    }
    return TwitterClient.instance;
  }

  static getInstance() {
    if (!TwitterClient.instance) {
      TwitterClient.instance = new TwitterClient();
    }
    return TwitterClient.instance;
  }

  // Tweet methods
  async createTweet(text, replyToId = null) {
    try {
      console.log('Creating tweet:', { text, replyToId });
      
      const tweetData = {
        text: text,
        ...(replyToId && { reply: { in_reply_to_tweet_id: replyToId } })
      };
      
      console.log('Prepared tweet data:', tweetData);

      const response = await this.v2Client.tweet(tweetData);
      console.log('Tweet created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating tweet:', {
        message: error.message,
        code: error.code,
        details: error.data,
        tweetText: text,
        replyToId
      });
      
      // Throw a more informative error
      throw new Error(`Failed to create tweet: ${error.message}`);
    }
  }

  async verifyCredentials() {
    try {
      const me = await this.v2Client.me();
      return {
        verified: true,
        user: me.data
      };
    } catch (error) {
      console.error('Error verifying credentials:', error);
      throw error;
    }
  }

  async createThreadedTweets(tweets) {
    try {
      console.log('Creating threaded tweets:', { numberOfTweets: tweets.length });
      
      let lastTweetId = null;
      const postedTweets = [];

      for (let i = 0; i < tweets.length; i++) {
        const tweetText = tweets[i];
        console.log(`Posting tweet ${i + 1}/${tweets.length}:`, {
          text: tweetText,
          replyingTo: lastTweetId
        });

        const tweet = await this.createTweet(tweetText, lastTweetId);
        lastTweetId = tweet.id;
        postedTweets.push(tweet);
        
        console.log(`Successfully posted tweet ${i + 1}/${tweets.length}:`, {
          tweetId: tweet.id
        });
      }

      console.log('Thread creation completed successfully:', {
        totalTweets: postedTweets.length,
        threadStartId: postedTweets[0]?.id,
        threadEndId: lastTweetId
      });

      return postedTweets;
    } catch (error) {
      console.error('Error creating thread:', {
        message: error.message,
        tweetsPosted: postedTweets.length,
        totalTweetsIntended: tweets.length,
        lastSuccessfulTweetId: lastTweetId
      });
      
      throw new Error(`Failed to create thread: ${error.message}`);
    }
  }
}

// Create and export the default instance
const instance = new TwitterClient();
export default instance; 