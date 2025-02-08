# Multi-Agent AI Debate Application

A React-based application that facilitates AI-powered debates using multiple LLM providers (OpenAI and Anthropic) with Twitter integration.

## Project Structure

Here's a comprehensive README.md for the project:
Project
src/
├── api/
│ ├── llm.js # LLM provider integration (OpenAI & Anthropic)
│ ├── twitter.js # Twitter API client wrapper
│ ├── discord.js # Discord API client wrapper
│ └── serverTwitterClient.js # Server-side Twitter client implementation
│
├── components/
│ ├── DebateForm.jsx # Main debate interface component
│ ├── DebateResponses.jsx # Debate responses display component
│ ├── Tooltip.jsx # Reusable tooltip component
│ └── DebateForm.css # Styles for debate form
│
├── routes/
│ ├── anthropic.js # Anthropic API routes
│ ├── openai.js # OpenAI API routes
│ ├── twitter.js # Twitter API routes
│ ├── discord.js # Discord API routes
│ └── content.js # Content processing routes
│
├── utils/
│ └── contentProcessor.js # URL and file content processing utilities
│
├── App.jsx # Root React component
├── main.jsx # Application entry point
└── index.css # Global styles
server/
└── index.js # Express server setup for Discord
Root Files
├── dev.js # Development server configuration
├── server.js # Main Express server
├── startup.js # Application startup script
├── index.html # HTML entry point
└── package.json # Project dependencies and scripts


## Architecture

Key Components:

1. **Frontend Components**:
   - DebateForm: Main component handling debate flow and user interactions
   - DebateResponses: Renders debate responses in a threaded format
   - Tooltip: Reusable tooltip component for UI elements

2. **API Layer**:
   - llm.js: Unified interface for LLM providers (OpenAI & Anthropic)
   - twitter.js: Twitter integration for posting debates
   - discord.js: Discord integration for channel management and posting
   - serverTwitterClient.js: Server-side Twitter functionality

3. **Server Routes**:
   - anthropic.js: Anthropic Claude API integration
   - openai.js: OpenAI GPT API integration
   - twitter.js: Twitter API endpoints
   - discord.js: Discord API endpoints
   - content.js: Content processing endpoints

4. **Development Tools**:
   - dev.js: Development environment configuration
   - startup.js: Application initialization
   - server.js: Express server setup

This structure follows a modular architecture with clear separation of concerns between frontend components, API integrations, and server-side functionality.

### Environment Configuration
Required environment variables:
# Client-side variables (Vite)
VITE_OPENAI_MODEL=gpt-4
VITE_ANTHROPIC_MODEL=claude-3-haiku-20240307
VITE_DISCORD_BOT_TOKEN=your_discord_bot_token
VITE_DISCORD_GUILD_ID=your_discord_guild_id

# Server-side variables
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
TWITTER_API_KEY=your_twitter_key
TWITTER_API_SECRET=your_twitter_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret
TWITTER_BEARER_TOKEN=your_bearer_token

# Discord Configuration
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_GUILD_ID=your_discord_guild_id

# Server Configuration
PORT=3001 # Optional, defaults to 3001
NODE_ENV=development # Optional, defaults to development

## Features
- Multi-provider LLM support (OpenAI & Anthropic)
- Real-time AI debates
- Twitter integration for debate sharing
- Error handling and logging
- Environment-aware configuration
- Modular architecture
- Clean separation of concerns

## Development
1. Clone the repository
2. Copy `.env.local.example` to `.env.local` and fill in your API keys
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`

## Production
1. Build the application: `npm run build`
2. Start the server: `npm start`

## Error Handling
- Client-side error handling with user feedback
- Server-side error logging and management
- API-specific error handling for each provider
- Graceful degradation

## Future Improvements
- Add more LLM providers
- Enhance debate strategies
- Improve thread management
- Add user authentication
- Implement rate limiting
- Add testing suite