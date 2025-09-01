const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const platform = process.argv[2] || 'all';

console.log(`🚀 Distributing Electron application for ${platform}...`);

try {
  // Step 1: Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Step 2: Generate Prisma clients
  console.log('🗄️ Generating Prisma clients...');
  execSync('npx prisma generate --schema=prisma/online.prisma', { stdio: 'inherit' });
  execSync('npx prisma generate --schema=prisma/schema.prisma', { stdio: 'inherit' });
  
  // Step 3: Build Next.js application
  console.log('⚛️ Building Next.js application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Step 4: Install Electron dependencies
  console.log('🔧 Installing Electron dependencies...');
  execSync('cd electron && npm install', { stdio: 'inherit' });
  
  // Step 5: Build distribution packages
  console.log('📦 Building distribution packages...');
  
  switch (platform) {
    case 'win':
      execSync('cd electron && npm run dist-win', { stdio: 'inherit' });
      break;
    case 'mac':
      execSync('cd electron && npm run dist-mac', { stdio: 'inherit' });
      break;
    case 'linux':
      execSync('cd electron && npm run dist-linux', { stdio: 'inherit' });
      break;
    case 'all':
    default:
      execSync('cd electron && npm run dist', { stdio: 'inherit' });
      break;
  }
  
  console.log('✅ Distribution packages created successfully!');
  console.log('📁 Check the electron/dist folder for the distribution packages.');
  
  // List created files
  const distPath = path.join(__dirname, '..', 'electron', 'dist');
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath);
    console.log('📋 Created files:');
    files.forEach(file => {
      console.log(`   - ${file}`);
    });
  }
  
} catch (error) {
  console.error('❌ Distribution failed:', error.message);
  process.exit(1);
}