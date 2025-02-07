import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
config({ 
  path: path.resolve(__dirname, '../.env.local') 
});

// Check Twitter environment variables
const twitterVars = [
  'TWITTER_API_KEY',
  'TWITTER_API_SECRET',
  'TWITTER_ACCESS_TOKEN',
  'TWITTER_ACCESS_SECRET',
  'TWITTER_BEARER_TOKEN'
];

console.log('\nChecking Twitter environment variables:');
twitterVars.forEach(varName => {
  console.log(`${varName}: ${process.env[varName] ? 'Present' : 'Missing'}`);
}); 