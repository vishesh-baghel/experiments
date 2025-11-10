// Quick test script to verify routing is working
const testQueries = [
  { query: "What are your business hours?", expected: "simple" },
  { query: "My laptop is running slow after the latest update. What steps can I take to troubleshoot this issue?", expected: "moderate/complex" },
  { query: "I placed three orders last month but was charged for four. Two items arrived damaged, one never shipped, and my account shows duplicate charges.", expected: "complex/reasoning" }
];

async function testRouting() {
  console.log('Testing routing with cache disabled...\n');
  
  for (const { query, expected } of testQueries) {
    console.log(`Query: "${query.substring(0, 60)}..."`);
    console.log(`Expected: ${expected}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: query }],
        }),
      });

      const complexity = response.headers.get('X-Router-Complexity');
      const cacheHit = response.headers.get('X-Router-Cache-Hit');
      const model = response.headers.get('X-Router-Model');
      
      console.log(`Got: ${complexity} (cache: ${cacheHit}, model: ${model})`);
      
      // Consume the stream
      await response.body?.cancel();
      
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
    
    console.log('---\n');
  }
}

testRouting();
