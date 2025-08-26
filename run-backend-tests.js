const TestSpriteBackend = require('./backend-test-suite');

async function main() {
  const testSprite = new TestSpriteBackend();
  
  // Listen for results
  testSprite.on('backendDiagnosticsComplete', (results) => {
    console.log('\n🎯 TestSprite Backend Diagnostics Complete!');
    testSprite.printResults();
  });
  
  // Run diagnostics
  await testSprite.runBackendDiagnostics();
}

main().catch(console.error);
