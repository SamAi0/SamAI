'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugModelsPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDebugInfo = async () => {
    setIsLoading(true);
    try {
      // Fetch from our debug endpoint
      const debugResponse = await fetch('/api/debug-models');
      const debugData = await debugResponse.json();
      
      // Also fetch from the main Ollama endpoint
      const ollamaResponse = await fetch('/api/llm/chat');
      const ollamaData = await ollamaResponse.json();
      
      setDebugInfo({
        debugEndpoint: debugData,
        ollamaEndpoint: ollamaData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Model Debug Information</h1>
        
        <div className="mb-6">
          <Button onClick={fetchDebugInfo} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh Debug Info'}
          </Button>
        </div>

        {debugInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Results</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 mb-2">What to Look For</h3>
          <ul className="text-blue-700 list-disc list-inside space-y-1">
            <li><strong>debugEndpoint.availableModels</strong> - Should contain "deepseek-coder:6.7b-instruct-q4_K_M"</li>
            <li><strong>ollamaEndpoint.models</strong> - Should contain "deepseek-coder:6.7b-instruct-q4_K_M"</li>
            <li><strong>ollamaEndpoint.connected</strong> - Should be true</li>
          </ul>
        </div>
      </div>
    </div>
  );
}