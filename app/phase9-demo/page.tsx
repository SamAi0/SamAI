'use client';

import { useState } from 'react';
import { Phase6UILayout } from '@/components/ui/phase5-ui-layout';
import { ChatMessage, ActionPlan, GeneratedCodeBlock } from '@/components/ui/enhanced-chat-command-center';
import { FileNode } from '@/components/ui/project-tree';

// Demo page for the enhanced chat command center with Save to Project functionality
export default function Phase9DemoPage() {
  // Initial files for the project tree
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
          ]
        },
        {
          id: '4',
          name: 'utils',
          path: 'src/utils',
          type: 'directory',
          status: 'unchanged',
          isExpanded: false,
        },
        {
          id: '5',
          name: 'App.tsx',
          path: 'src/App.tsx',
          type: 'file',
          status: 'unchanged'
        }
      ]
    },
    {
      id: '6',
      name: 'public',
      path: 'public',
      type: 'directory',
      status: 'unchanged',
      isExpanded: false,
    },
    {
      id: '7',
      name: 'README.md',
      path: 'README.md',
      type: 'file',
      status: 'unchanged'
    }
  ];

  // Sample initial messages
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
      content: `I'll create a user authentication component for you. Here's the code:\n\n\`\`\`tsx
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
      content: 'Generate a utility function for formatting dates',
      timestamp: new Date(Date.now() - 180000),
    },
    {
      id: '4',
      role: 'assistant',
      content: `Here's a utility function for formatting dates:\n\n\`\`\`ts
export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day);
}

export function formatDateTime(date: Date): string {
  const time = date.toTimeString().substring(0, 5);
  return \`\${formatDate(date)} \${time}\`;
}
\`\`\``,
      timestamp: new Date(Date.now() - 120000),
      generatedCode: [
        {
          fileName: 'dateUtils.ts',
          filePath: 'src/utils/dateUtils.ts',
          content: `export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day);
}

export function formatDateTime(date: Date): string {
  const time = date.toTimeString().substring(0, 5);
  return \`\${formatDate(date)} \${time}\`;
}`,
          language: 'typescript',
          action: 'create'
        }
      ]
    }
  ];

  // Handler functions
  const handleSendMessage = (content: string) => {
    console.log('Sending message:', content);
    // In a real implementation, this would call the backend API
  };

  const handleExecutePlan = (plan: ActionPlan) => {
    console.log('Executing plan:', plan);
    // In a real implementation, this would execute the action plan
  };

  const handleRejectPlan = (plan: ActionPlan) => {
    console.log('Rejecting plan:', plan);
    // In a real implementation, this would reject the action plan
  };

  const handleCreateFile = (filePath: string, content: string) => {
    console.log('Creating file:', filePath);
    // In a real implementation, this would create the file in the project
  };

  const handleMoveToProjectTree = (codeBlocks: GeneratedCodeBlock[]) => {
    console.log('Moving code blocks to project tree:', codeBlocks);
    // In a real implementation, this would move the code to the project tree
    alert(`Code saved to project: ${codeBlocks.map(cb => cb.filePath).join(', ')}`);
  };

  return (
    <div className="h-screen w-full">
      <h1 className="text-2xl font-bold p-4 border-b">Phase 9: File Creation and Project Tree Integration</h1>
      <Phase6UILayout
        initialFiles={initialFiles}
        initialMessages={initialMessages}
        onSendMessage={handleSendMessage}
        onExecutePlan={handleExecutePlan}
        onRejectPlan={handleRejectPlan}
        onCreateFile={handleCreateFile}
        onMoveToProjectTree={handleMoveToProjectTree}
      />
    </div>
  );
}