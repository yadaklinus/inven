const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up POS System Electron application...');

try {
  // Step 1: Install main dependencies
  console.log('📦 Installing main dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Step 2: Install server dependencies
  console.log('🖥️ Installing server dependencies...');
  execSync('cd server && npm install', { stdio: 'inherit' });
  
  // Step 3: Install Electron dependencies
  console.log('⚡ Installing Electron dependencies...');
  execSync('cd electron && npm install', { stdio: 'inherit' });
  
  // Step 4: Generate Prisma clients
  console.log('🗄️ Generating Prisma clients...');
  execSync('npx prisma generate --schema=prisma/online.prisma', { stdio: 'inherit' });
  execSync('npx prisma generate --schema=prisma/schema.prisma', { stdio: 'inherit' });
  
  // Step 5: Create .env file if it doesn't exist
  if (!fs.existsSync('.env')) {
    console.log('📝 Creating .env file...');
    fs.copyFileSync('.env.example', '.env');
    console.log('⚠️  Please update the .env file with your database credentials and JWT secret.');
  }
  
  // Step 6: Create database if it doesn't exist
  console.log('🗄️ Setting up database...');
  try {
    execSync('npx prisma db push --schema=prisma/schema.prisma', { stdio: 'inherit' });
    console.log('✅ SQLite database setup complete.');
  } catch (error) {
    console.log('⚠️  SQLite database setup failed. Please check your DATABASE_URL in .env file.');
  }
  
  console.log('✅ Setup complete!');
  console.log('');
  console.log('🎯 Next steps:');
  console.log('1. Update .env file with your database credentials');
  console.log('2. Run "npm run electron" to start the application in development mode');
  console.log('3. Run "npm run electron-dist" to build distribution packages');
  console.log('');
  console.log('📚 Available commands:');
  console.log('  npm run electron          - Start in development mode');
  console.log('  npm run electron-build    - Build the application');
  console.log('  npm run electron-dist     - Create distribution packages');
  console.log('  npm run electron-dist-win - Create Windows distribution');
  console.log('  npm run electron-dist-mac - Create macOS distribution');
  console.log('  npm run electron-dist-linux - Create Linux distribution');
  
} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}