import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get environment PATH
const envPath = process.env.PATH;

// Improved process spawning function
function spawnProcess(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Starting: ${command} ${args.join(' ')}`);
    
    const processOptions = {
      stdio: 'inherit',
      shell: true,
      cwd: __dirname,
      env: { 
        ...process.env,
        NODE_ENV: 'development',
        PATH: `${path.join(__dirname, 'node_modules', '.bin')}${path.delimiter}${envPath}`
      },
      ...options
    };

    const childProcess = spawn(command, args, processOptions);

    childProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`${command} completed successfully`);
        resolve();
      } else {
        console.error(`${command} failed with code ${code}`);
        reject(new Error(`${command} failed`));
      }
    });

    childProcess.on('error', (error) => {
      console.error(`Error in ${command}:`, error);
      reject(error);
    });
  });
}

// Ensure environment is prepared
async function prepareEnvironment() {
  try {
    // Ensure .env.local exists
    const envLocalPath = path.join(__dirname, '.env.local');
    if (!fs.existsSync(envLocalPath)) {
      fs.writeFileSync(envLocalPath, `
VITE_TWITTER_USERNAME=your_twitter_username
VITE_TWITTER_PASSWORD=your_twitter_password
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
`);
      console.log('Created default .env.local file');
    }

    // Clean install
    console.log('Cleaning previous installation...');
    await spawnProcess('npm', ['run', 'clean']);
    
    console.log('Installing dependencies...');
    await spawnProcess('npm', ['install', '--legacy-peer-deps']);
    
  } catch (error) {
    console.error('Environment preparation failed:', error);
    throw error;
  }
}

// Main startup function
async function startAll() {
  try {
    // Prepare environment
    await prepareEnvironment();

    // Build project
    console.log('Building project...');
    await spawnProcess('npm', ['run', 'build']);

    // Start server
    console.log('Starting server...');
    const serverProcess = spawn('npm', ['run', 'server'], {
      stdio: 'inherit',
      shell: true,
      cwd: __dirname
    });

    // Start dev server
    console.log('Starting development server...');
    const devProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true,
      cwd: __dirname
    });

    // Handle process termination
    const cleanup = () => {
      console.log('\nShutting down processes...');
      serverProcess.kill();
      devProcess.kill();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // Log any process errors
    serverProcess.on('error', (err) => console.error('Server error:', err));
    devProcess.on('error', (err) => console.error('Dev server error:', err));

  } catch (error) {
    console.error('Startup failed:', error);
    process.exit(1);
  }
}

// Run startup
startAll().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
