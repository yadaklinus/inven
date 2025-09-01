const fs = require('fs');
const path = require('path');

console.log('🧪 Testing POS System Electron setup...');

const tests = [
  {
    name: 'Check main package.json',
    test: () => fs.existsSync('package.json')
  },
  {
    name: 'Check Electron main process',
    test: () => fs.existsSync('electron/main.js')
  },
  {
    name: 'Check Electron preload script',
    test: () => fs.existsSync('electron/preload.js')
  },
  {
    name: 'Check Electron package.json',
    test: () => fs.existsSync('electron/package.json')
  },
  {
    name: 'Check Express server',
    test: () => fs.existsSync('server/index.js')
  },
  {
    name: 'Check server package.json',
    test: () => fs.existsSync('server/package.json')
  },
  {
    name: 'Check Prisma schemas',
    test: () => fs.existsSync('prisma/schema.prisma') && fs.existsSync('prisma/online.prisma')
  },
  {
    name: 'Check Next.js config',
    test: () => {
      const config = fs.readFileSync('next.config.js', 'utf8');
      return config.includes('output: \'export\'') && config.includes('assetPrefix');
    }
  },
  {
    name: 'Check build scripts',
    test: () => fs.existsSync('scripts/setup.js') && fs.existsSync('scripts/build-electron.js')
  },
  {
    name: 'Check environment example',
    test: () => fs.existsSync('.env.example')
  }
];

let passed = 0;
let failed = 0;

console.log('\n📋 Running tests...\n');

tests.forEach((test, index) => {
  try {
    const result = test.test();
    if (result) {
      console.log(`✅ ${index + 1}. ${test.name}`);
      passed++;
    } else {
      console.log(`❌ ${index + 1}. ${test.name}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${index + 1}. ${test.name} - Error: ${error.message}`);
    failed++;
  }
});

console.log('\n📊 Test Results:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${Math.round((passed / tests.length) * 100)}%`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Your Electron setup is ready.');
  console.log('\n🚀 Next steps:');
  console.log('1. Run "npm run setup" to install dependencies');
  console.log('2. Update .env file with your database credentials');
  console.log('3. Run "npm run electron" to start the application');
} else {
  console.log('\n⚠️  Some tests failed. Please check the setup.');
  process.exit(1);
}