const TestSprite = require('./test-suite');

async function main() {
  const testSprite = new TestSprite();
  
  // Listen for results
  testSprite.on('diagnosticsComplete', (results) => {
    console.log('\n🎯 TestSprite Diagnostics Complete!');
    console.log('Check the results above for detailed analysis.');
  });
  
  // Run diagnostics
  await testSprite.runDiagnostics();
  
  // Ask if user wants to run quick fixes
  console.log('\n🔧 Would you like TestSprite to attempt automatic fixes? (y/n)');
  // For now, auto-run fixes
  console.log('Auto-running quick fixes...\n');
  await testSprite.runQuickFix();
}

main().catch(console.error);
