import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';

// Import routes
import anthropicRoutes from './src/routes/anthropic.js';
import twitterRoutes from './src/routes/twitter.js';
import openaiRoutes from './src/routes/openai.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables first
config({ 
  path: path.resolve(__dirname, '.env.local') 
});

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/anthropic', anthropicRoutes);
app.use('/api/twitter', twitterRoutes);
app.use('/api/openai', openaiRoutes);

// Serve static files in production
if (isProduction) {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  
  // Log environment variables status
  console.log('\nEnvironment Variables:');
  console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'Present' : 'Missing');
  console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');
  console.log('TWITTER_API_KEY:', process.env.TWITTER_API_KEY ? 'Present' : 'Missing');
  console.log('TWITTER_ACCESS_TOKEN:', process.env.TWITTER_ACCESS_TOKEN ? 'Present' : 'Missing');
});
