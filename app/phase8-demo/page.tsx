'use client';

import { useState } from 'react';
import { Phase6UILayout } from '@/components/ui/phase5-ui-layout';
import { ChatMessage, ActionPlan, GeneratedCodeBlock } from '@/components/ui/enhanced-chat-command-center';

// Demo page for the enhanced chat command center
export default function Phase8DemoPage() {
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
      content: 'Generate an API endpoint for user management',
      timestamp: new Date(Date.now() - 180000),
    },
    {
      id: '4',
      role: 'assistant',
      content: `Here's a user management API endpoint:\n\n\`\`\`ts
import express from 'express';
import { User } from '../models/user';

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create a new user
router.post('/', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

export default router;
\`\`\``,
      timestamp: new Date(Date.now() - 120000),
      generatedCode: [
        {
          fileName: 'userRoutes.ts',
          filePath: 'src/routes/userRoutes.ts',
          content: `import express from 'express';
import { User } from '../models/user';

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create a new user
router.post('/', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

export default router;`,
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
  };

  return (
    <div className="h-screen w-full">
      <h1 className="text-2xl font-bold p-4 border-b">Phase 8: AI-Generated Code Transfer Demo</h1>
      <Phase6UILayout
        initialMessages={initialMessages}
      />
    </div>
  );
}