'use client';

import { useState, useEffect } from 'react';
import { Phase6UILayout } from '@/components/ui/phase5-ui-layout';
import { ChatMessage, ActionPlan, GeneratedCodeBlock } from '@/components/ui/enhanced-chat-command-center';
import { FileNode } from '@/components/ui/project-tree';

// Demo page for real-time project tree updates
export default function Phase10DemoPage() {
  // Initial files for the project tree with various statuses
  const initialFiles: FileNode[] = [
    {
      id: '1',
      name: 'src',
      path: 'src',
      type: 'directory',
      status: 'unchanged',
      isExpanded: true,
      children: [
        {
          id: '2',
          name: 'components',
          path: 'src/components',
          type: 'directory',
          status: 'unchanged',
          isExpanded: true,
          children: [
            {
              id: '3',
              name: 'Button.tsx',
              path: 'src/components/Button.tsx',
              type: 'file',
              status: 'modified'
            },
            {
              id: '4',
              name: 'Header.tsx',
              path: 'src/components/Header.tsx',
              type: 'file',
              status: 'unchanged'
            },
          ]
        },
        {
          id: '5',
          name: 'pages',
          path: 'src/pages',
          type: 'directory',
          status: 'unchanged',
          isExpanded: false,
          children: [
            {
              id: '6',
              name: 'Home.tsx',
              path: 'src/pages/Home.tsx',
              type: 'file',
              status: 'unchanged'
            },
          ]
        },
        {
          id: '7',
          name: 'utils',
          path: 'src/utils',
          type: 'directory',
          status: 'unchanged',
          isExpanded: false,
        },
        {
          id: '8',
          name: 'services',
          path: 'src/services',
          type: 'directory',
          status: 'unchanged',
          isExpanded: false,
        },
        {
          id: '9',
          name: 'App.tsx',
          path: 'src/App.tsx',
          type: 'file',
          status: 'new'
        }
      ]
    },
    {
      id: '10',
      name: 'public',
      path: 'public',
      type: 'directory',
      status: 'unchanged',
      isExpanded: false,
      children: [
        {
          id: '11',
          name: 'favicon.ico',
          path: 'public/favicon.ico',
          type: 'file',
          status: 'unchanged'
        }
      ]
    },
    {
      id: '12',
      name: 'package.json',
      path: 'package.json',
      type: 'file',
      status: 'modified'
    },
    {
      id: '13',
      name: 'README.md',
      path: 'README.md',
      type: 'file',
      status: 'unchanged'
    }
  ];

  // Sample initial messages demonstrating different types of code generation
  const initialMessages: ChatMessage[] = [
    {
      id: '1',
      role: 'user',
      content: 'Create a new React component for user authentication',
      timestamp: new Date(Date.now() - 300000),
    },
    {
      id: '2',
      role: 'assistant',
      content: `I'll create a user authentication component for you. Based on the nature of this component, I suggest placing it in the /src/components folder.\n\n\`\`\`tsx
import React, { useState } from 'react';

interface UserAuthProps {
  onLogin: (email: string, password: string) => void;
  onRegister: (email: string, password: string) => void;
}

export function UserAuth({ onLogin, onRegister }: UserAuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      onLogin(email, password);
    } else {
      onRegister(email, password);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">
          {isLogin ? 'Login' : 'Register'}
        </button>
        <button type="button" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
        </button>
      </form>
    </div>
  );
}
\`\`\``,
      timestamp: new Date(Date.now() - 240000),
      generatedCode: [
        {
          fileName: 'UserAuth.tsx',
          filePath: 'src/components/UserAuth.tsx',
          content: `import React, { useState } from 'react';

interface UserAuthProps {
  onLogin: (email: string, password: string) => void;
  onRegister: (email: string, password: string) => void;
}

export function UserAuth({ onLogin, onRegister }: UserAuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      onLogin(email, password);
    } else {
      onRegister(email, password);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">
          {isLogin ? 'Login' : 'Register'}
        </button>
        <button type="button" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
        </button>
      </form>
    </div>
  );
}`,
          language: 'typescript',
          action: 'create'
        }
      ]
    },
    {
      id: '3',
      role: 'user',
      content: 'I need a service function to handle API calls',
      timestamp: new Date(Date.now() - 180000),
    },
    {
      id: '4',
      role: 'assistant',
      content: `Here's a service function for handling API calls. I recommend placing this in the /src/services folder for better organization.\n\n\`\`\`ts
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

export async function apiCall<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', headers = {}, body } = options;
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body && { body: JSON.stringify(body) }),
  };

  try {
    const response = await fetch(\`\${API_BASE_URL}\${endpoint}\`, config);
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

export async function get<T>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: 'GET' });
}

export async function post<T>(endpoint: string, data: any): Promise<T> {
  return apiCall<T>(endpoint, { method: 'POST', body: data });
}

export async function put<T>(endpoint: string, data: any): Promise<T> {
  return apiCall<T>(endpoint, { method: 'PUT', body: data });
}

export async function del(endpoint: string): Promise<void> {
  await apiCall<void>(endpoint, { method: 'DELETE' });
}
\`\`\``,
      timestamp: new Date(Date.now() - 120000),
      generatedCode: [
        {
          fileName: 'apiService.ts',
          filePath: 'src/services/apiService.ts',
          content: `const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

export async function apiCall<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', headers = {}, body } = options;
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body && { body: JSON.stringify(body) }),
  };

  try {
    const response = await fetch(\`\${API_BASE_URL}\${endpoint}\`, config);
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

export async function get<T>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: 'GET' });
}

export async function post<T>(endpoint: string, data: any): Promise<T> {
  return apiCall<T>(endpoint, { method: 'POST', body: data });
}

export async function put<T>(endpoint: string, data: any): Promise<T> {
  return apiCall<T>(endpoint, { method: 'PUT', body: data });
}

export async function del(endpoint: string): Promise<void> {
  await apiCall<void>(endpoint, { method: 'DELETE' });
}`,
          language: 'typescript',
          action: 'create'
        }
      ]
    }
  ];

  // Handler functions with enhanced functionality for real-time updates
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string>('');

  const handleSendMessage = (content: string) => {
    console.log('Sending message:', content);
  };

  const handleExecutePlan = (plan: ActionPlan) => {
    console.log('Executing plan:', plan);
  };

  const handleRejectPlan = (plan: ActionPlan) => {
    console.log('Rejecting plan:', plan);
  };

  const handleCreateFile = (filePath: string, content: string) => {
    console.log('Creating file:', filePath);
  };

  const handleMoveToProjectTree = (codeBlocks: GeneratedCodeBlock[]) => {
    console.log('Moving code blocks to project tree:', codeBlocks);
    // In a real implementation, this would move the code to the project tree and update statuses
    const fileNames = codeBlocks.map(cb => cb.fileName).join(', ');
    const actionTypes = codeBlocks.map(cb => cb.action === 'create' ? 'new file(s)' : 'modified file(s)').join(' and ');
    setSaveSuccessMessage(`✓ Successfully added ${fileNames} as ${actionTypes}! Check the Project Tree to see real-time updates.`);
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSaveSuccessMessage('');
    }, 3000);
  };

  return (
    <div className="h-screen w-full flex flex-col">
      <div className="p-4 border-b bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-900">Phase 10: Real-Time Project Tree Updates</h1>
        <p className="text-sm text-gray-600 mt-1">
          See immediate updates when AI-generated code is saved to the project
        </p>
        {saveSuccessMessage && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium text-sm">{saveSuccessMessage}</p>
          </div>
        )}
      </div>
      <div className="flex-1 relative">
        <Phase6UILayout
          initialFiles={initialFiles}
          initialMessages={initialMessages}
          onSendMessage={handleSendMessage}
          onExecutePlan={handleExecutePlan}
          onRejectPlan={handleRejectPlan}
          onCreateFile={handleCreateFile}
          onMoveToProjectTree={handleMoveToProjectTree}
        />
        {saveSuccessMessage && (
          <div className="absolute top-4 right-4 p-3 bg-blue-100 border border-blue-300 rounded-lg shadow-lg z-50 max-w-sm animate-fadeIn">
            <div className="flex items-start gap-2">
              <div className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</div>
              <div className="text-blue-800 text-sm">
                <p className="font-medium">File Added Successfully!</p>
                <p className="mt-1">{saveSuccessMessage.replace('✓ ', '')}</p>
                <p className="mt-2 text-xs opacity-75">The Project Tree has been updated in real-time</p>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 bg-gray-50 border-t text-sm text-gray-600">
        <div className="max-w-6xl mx-auto">
          <h3 className="font-medium mb-2">Real-Time Update Features:</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Immediate tree updates when files are saved
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
              Auto-selection of newly created files
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
              Visual status indicators (new/modified)
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></span>
              Seamless transition to file editor
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}