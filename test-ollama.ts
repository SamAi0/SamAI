/**
 * Test script to verify Ollama integration
 */

async function testOllamaIntegration() {
  console.log('Testing Ollama integration...')

  // Test 1: Check if Ollama API is accessible
  try {
    const healthResponse = await fetch('http://localhost:11434/api/tags')
    if (healthResponse.ok) {
      const data = await healthResponse.json()
      console.log('✅ Ollama is running and accessible')
      console.log('Available models:', data.models?.map((m: any) => m.name) || [])
    } else {
      console.log('❌ Ollama is not accessible at http://localhost:11434')
      return
    }
  } catch (error) {
    console.log('❌ Cannot connect to Ollama:', error)
    return
  }

  // Test 2: Test the application's Ollama endpoint
  try {
    const testResponse = await fetch('http://localhost:3000/api/llm/chat', {
      method: 'GET', // Health check endpoint
    })

    if (testResponse.ok) {
      const data = await testResponse.json()
      console.log('✅ Application Ollama endpoint is accessible')
      console.log('Connected to Ollama:', data.connected)
      if (data.connected) {
        console.log('Models from app:', data.models)
      }
    } else {
      console.log('❌ Application Ollama endpoint not accessible')
    }
  } catch (error) {
    console.log('❌ Error accessing application Ollama endpoint:', error)
  }

  // Test 3: Test a sample chat request
  try {
    console.log('\nTesting sample chat request...')
    const chatResponse = await fetch('http://localhost:3000/api/llm/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, how are you?',
        model: 'codellama', // Default model - CodeLlama for Ollama
      }),
    })

    if (chatResponse.ok) {
      console.log('✅ Chat endpoint accepted the request')
      console.log('Status:', chatResponse.status)
      console.log('Headers:', Object.fromEntries(chatResponse.headers.entries()))
    } else {
      console.log('❌ Chat endpoint returned error:', chatResponse.status)
      const errorText = await chatResponse.text()
      console.log('Error:', errorText)
    }
  } catch (error) {
    console.log('❌ Error testing chat endpoint:', error)
  }

  console.log('\nOllama integration test completed!')
}

// Run the test
testOllamaIntegration().catch(console.error)
