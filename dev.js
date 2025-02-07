import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables first
config({ 
  path: path.resolve(__dirname, '.env.local') 
});

console.log('Starting development servers...');

// Pass environment variables to child processes
const env = {
  ...process.env,
  TWITTER_API_KEY: process.env.TWITTER_API_KEY,
  TWITTER_API_SECRET: process.env.TWITTER_API_SECRET,
  TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_SECRET: process.env.TWITTER_ACCESS_SECRET,
  TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN
};

// Start backend server
const serverProcess = spawn('node', ['server.js'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
  env: env
});

// Start Vite dev server
const viteProcess = spawn('vite', [], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
  env: env
});

// Handle process termination
const cleanup = () => {
  console.log('\nShutting down development servers...');
  serverProcess.kill();
  viteProcess.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Log any process errors
serverProcess.on('error', (err) => console.error('Backend server error:', err));
viteProcess.on('error', (err) => console.error('Vite server error:', err));

// Log environment variable status
console.log('\nEnvironment Variables Status:');
[
  'TWITTER_API_KEY',
  'TWITTER_API_SECRET', 
  'TWITTER_ACCESS_TOKEN',
  'TWITTER_ACCESS_SECRET',
  'TWITTER_BEARER_TOKEN'
].forEach(key => {
  console.log(`${key}: ${process.env[key] ? 'Present' : 'Missing'}`);
}); 