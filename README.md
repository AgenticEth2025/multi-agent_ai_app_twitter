# Multi-Agent AI Debate Application

A React-based application that facilitates AI-powered debates using multiple LLM providers (OpenAI and Anthropic) with Twitter integration.

## Project Structure

Here's a comprehensive README.md for the project:
Project
├── src/
│ ├── api/
│ │ ├── llm.js # LLM integration (OpenAI & Anthropic)
│ │ ├── serverTwitterClient.js # Server-side Twitter client
│ │ └── twitter.js # Client-side Twitter API wrapper
│ ├── components/
│ │ ├── DebateForm.jsx # Main debate interface
│ │ └── DebateResponses.jsx # Debate responses display
│ └── routes/
│ ├── anthropic.js # Anthropic API routes
│ ├── openai.js # OpenAI API routes
│ └── twitter.js # Twitter API routes
├── .env.local # Environment variables
├── dev.js # Development server setup
├── package.json # Project dependencies
├── README.md # Project documentation
└── server.js # Main Express server


## Architecture

### Frontend Components
- **DebateForm**: Main component handling debate flow and user interactions
- **DebateResponses**: Renders debate responses in a threaded format

### API Layer
- **llm.js**: Unified interface for LLM providers
  - Handles both OpenAI and Anthropic APIs
  - Environment-aware configuration
  - Consistent response formatting

- **twitter.js**: Client-side Twitter integration
  - Tweet posting functionality
  - Error handling and logging

- **serverTwitterClient.js**: Server-side Twitter functionality
  - Single tweet and thread posting
  - Credential verification
  - Rate limiting handling

### Server Routes
- **anthropic.js**: Anthropic Claude API integration
  - Message handling
  - Error management
  - Response formatting

- **openai.js**: OpenAI GPT API integration
  - Chat completion endpoints
  - Error handling
  - Response normalization

- **twitter.js**: Twitter API endpoints
  - Tweet posting
  - Thread creation
  - Error handling

### Development Setup
- **dev.js**: Development environment configuration
  - Environment variable validation
  - Server process management
  - Hot reloading

### Environment Configuration
Required environment variables:
# Client-side variables (Vite)
VITE_OPENAI_MODEL=gpt-4
VITE_ANTHROPIC_MODEL=claude-3-haiku-20240307
Server-side variables
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
TWITTER_API_KEY=your_twitter_key
TWITTER_API_SECRET=your_twitter_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret

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