const TestSpriteFrontend = require('./frontend-test-suite');

async function main() {
  const testSprite = new TestSpriteFrontend();
  
  // Listen for results
  testSprite.on('frontendDiagnosticsComplete', (results) => {
    console.log('\n🎯 TestSprite Frontend Diagnostics Complete!');
    console.log('Check the results above for detailed analysis.');
  });
  
  // Run diagnostics
  await testSprite.runFrontendDiagnostics();
  
  // Ask if user wants to run fixes
  console.log('\n🔧 Would you like TestSprite to attempt frontend fixes? (y/n)');
  // Auto-run fixes
  console.log('Auto-running frontend fixes...\n');
  await testSprite.runFrontendFixes();
}

main().catch(console.error);
