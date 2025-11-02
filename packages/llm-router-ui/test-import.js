// Test if llm-router can be imported
try {
  console.log('Testing llm-router import...');
  const { LLMRouter } = require('llm-router');
  console.log('✅ LLMRouter imported successfully');
  console.log('LLMRouter:', typeof LLMRouter);
  
  const router = new LLMRouter();
  console.log('✅ LLMRouter instantiated successfully');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}
