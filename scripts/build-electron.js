const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Electron application...');

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
  
  // Step 5: Build Electron application
  console.log('⚡ Building Electron application...');
  execSync('cd electron && npm run electron-pack', { stdio: 'inherit' });
  
  console.log('✅ Electron application built successfully!');
  console.log('📁 Check the electron/dist folder for the built application.');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}