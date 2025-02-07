// Base interface for Twitter functionality
class BaseTwitterClient {
  async createTweet() { return null; }
  async verifyCredentials() { return null; }
  async createThreadedTweets() { return null; }
}

// Browser-safe implementation that just makes HTTP requests
class BrowserTwitterClient extends BaseTwitterClient {
  async createTweet(text, replyToId = null) {
    const response = await fetch('/api/twitter/tweet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, reply_to: replyToId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create tweet');
    }

    return response.json();
  }

  async verifyCredentials() {
    const response = await fetch('/api/twitter/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to verify credentials');
    }

    return response.json();
  }

  async createThreadedTweets(tweets) {
    let lastTweetId = null;
    const postedTweets = [];

    for (const text of tweets) {
      const tweet = await this.createTweet(text, lastTweetId);
      lastTweetId = tweet.id;
      postedTweets.push(tweet);
    }

    return postedTweets;
  }
}

// Export browser-safe instance
export const TwitterClient = BrowserTwitterClient;
export default new BrowserTwitterClient(); 