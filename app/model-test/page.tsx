'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ModelTestPage() {
  const [selectedModel, setSelectedModel] = useState('deepseek-coder:6.7b-instruct-q4_K_M');
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testModel = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/test-deepseek');
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        error: 'Network error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const models = [
    { value: 'codellama', label: 'CodeLlama' },
    { value: 'deepseek-coder:6.7b-instruct-q4_K_M', label: 'DeepSeek Coder 6.7B' },
    { value: 'qwen', label: 'Qwen' },
    { value: 'gemma3:1b', label: 'Gemma 1B' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Model Integration Test</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Model Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Model to Test
                </label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={testModel} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Testing...' : 'Test Selected Model'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {testResult && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <h3 className={`font-semibold ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {testResult.success ? '✅ Success' : '❌ Error'}
                  </h3>
                  <p className="mt-2 text-sm">
                    <strong>Model:</strong> {testResult.model || selectedModel}
                  </p>
                  {testResult.response && (
                    <div className="mt-3">
                      <p className="font-medium">Response:</p>
                      <pre className="mt-2 p-3 bg-white rounded text-sm whitespace-pre-wrap">
                        {testResult.response}
                      </pre>
                    </div>
                  )}
                  {testResult.error && (
                    <div className="mt-3">
                      <p className="font-medium">Error Details:</p>
                      <p className="text-sm mt-1">{testResult.details || testResult.error}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 mb-2">Next Steps</h3>
          <ul className="text-blue-700 list-disc list-inside space-y-1">
            <li>Test different models to compare responses</li>
            <li>Verify DeepSeek integration is working properly</li>
            <li>Check that model appears in task creation form</li>
            <li>Test file creation workflow with different models</li>
          </ul>
        </div>
      </div>
    </div>
  );
}