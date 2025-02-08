import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables first
config({ 
  path: path.resolve(__dirname, '.env.local') 
});

// Helper function to create child process
const createProcess = (command, args, name) => {
  console.log(`Starting ${name}...`);
  
  const childProcess = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname,
    env: {
      ...process.env,
      // Ensure environment variables are passed to child processes
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      TWITTER_API_KEY: process.env.TWITTER_API_KEY,
      TWITTER_API_SECRET: process.env.TWITTER_API_SECRET,
      TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN,
      TWITTER_ACCESS_SECRET: process.env.TWITTER_ACCESS_SECRET,
      TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN,
      VITE_DISCORD_BOT_TOKEN: process.env.VITE_DISCORD_BOT_TOKEN,
      VITE_DISCORD_GUILD_ID: process.env.VITE_DISCORD_GUILD_ID
    }
  });

  childProcess.on('error', (err) => console.error(`${name} error:`, err));
  
  return childProcess;
};

// Helper function for graceful shutdown
const cleanup = (processes) => {
  console.log('\nShutting down development servers...');
  processes.forEach(proc => proc.kill());
  process.exit(0);
};

// Main startup function
const startDevelopment = () => {
  // Verify required environment variables
  const requiredVars = [
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY',
    'TWITTER_API_KEY',
    'TWITTER_API_SECRET',
    'TWITTER_ACCESS_TOKEN',
    'TWITTER_ACCESS_SECRET',
    'VITE_DISCORD_BOT_TOKEN',
    'VITE_DISCORD_GUILD_ID'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '));
    process.exit(1);
  }

  // Start servers
  const processes = [
    createProcess('node', ['server.js'], 'Backend server'),
    createProcess('vite', [], 'Vite server')
  ];

  // Handle process termination
  process.on('SIGINT', () => cleanup(processes));
  process.on('SIGTERM', () => cleanup(processes));

  // Log startup status
  console.log('\nDevelopment servers started successfully');
  console.log('Backend server: http://localhost:3001');
  console.log('Frontend server: http://localhost:5173');
};

// Start the development environment
try {
  startDevelopment();
} catch (error) {
  console.error('Failed to start development environment:', error);
  process.exit(1);
} 