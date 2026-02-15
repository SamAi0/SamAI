'use client';

import { useState, useEffect, useRef } from 'react';
import { Phase6UILayout } from '@/components/ui/phase5-ui-layout';
import { ChatMessage, ActionPlan, GeneratedCodeBlock } from '@/components/ui/enhanced-chat-command-center';
import { FileNode } from '@/components/ui/project-tree';

// Demo page specifically for real-time project tree updates
export default function Phase11DemoPage() {
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
              status: 'unchanged'
            }
          ]
        },
        {
          id: '4',
          name: 'App.tsx',
          path: 'src/App.tsx',
          type: 'file',
          status: 'unchanged'
        }
      ]
    },
    {
      id: '5',
      name: 'README.md',
      path: 'README.md',
      type: 'file',
      status: 'unchanged'
    }
  ];

  // Sample messages that demonstrate the real-time workflow
  const initialMessages: ChatMessage[] = [
    {
      id: '1',
      role: 'user',
      content: 'Create a new React component for a user profile card',
      timestamp: new Date(Date.now() - 300000),
    },
    {
      id: '2',
      role: 'assistant',
      content: `I'll create a user profile card component for you. This will be placed in the components folder.\n\n\`\`\`tsx
import React from 'react';

interface UserProfileProps {
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
}

export function UserProfile({ name, email, avatar, bio }: UserProfileProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-sm">
      <div className="flex items-center space-x-4 mb-4">
        {avatar ? (
          <img 
            src={avatar} 
            alt={name} 
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600 font-medium">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
          <p className="text-gray-600">{email}</p>
        </div>
      </div>
      {bio && (
        <p className="text-gray-700 text-sm">{bio}</p>
      )}
    </div>
  );
}
\`\`\``,
      timestamp: new Date(Date.now() - 240000),
      generatedCode: [
        {
          fileName: 'UserProfile.tsx',
          filePath: 'src/components/UserProfile.tsx',
          content: `import React from 'react';

interface UserProfileProps {
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
}

export function UserProfile({ name, email, avatar, bio }: UserProfileProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-sm">
      <div className="flex items-center space-x-4 mb-4">
        {avatar ? (
          <img 
            src={avatar} 
            alt={name} 
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600 font-medium">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
          <p className="text-gray-600">{email}</p>
        </div>
      </div>
      {bio && (
        <p className="text-gray-700 text-sm">{bio}</p>
      )}
    </div>
  );
}`,
          language: 'typescript',
          action: 'create'
        }
      ]
    }
  ];

  // State for tracking the demo workflow
  const [demoStep, setDemoStep] = useState(0);
  const [isAutoDemoRunning, setIsAutoDemoRunning] = useState(false);
  const [autoDemoMessages, setAutoDemoMessages] = useState<ChatMessage[]>(initialMessages);
  const autoDemoRef = useRef<NodeJS.Timeout | null>(null);

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
    // For demo purposes, we'll show a success message
    const fileNames = codeBlocks.map(cb => cb.fileName).join(', ');
    alert(`✓ Files added to project: ${fileNames}\n\nCheck the Project Tree panel to see real-time updates!`);
  };

  // Auto-demo functionality
  const startAutoDemo = () => {
    if (isAutoDemoRunning) return;
    
    setIsAutoDemoRunning(true);
    setDemoStep(0);
    
    const demoSteps = [
      {
        delay: 1000,
        message: "Create a new React component for a dashboard layout"
      },
      {
        delay: 3000,
        message: `Here's a dashboard layout component:\n\n\`\`\`tsx
import React, { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
\`\`\``,
        codeBlocks: [{
          fileName: 'DashboardLayout.tsx',
          filePath: 'src/components/DashboardLayout.tsx',
          content: `import React, { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}`,
          language: 'typescript',
          action: 'create' as const
        }]
      },
      {
        delay: 2000,
        message: "Now let's create a utility function for data validation"
      },
      {
        delay: 3000,
        message: `Here's a validation utility:\n\n\`\`\`ts
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function required(value: any, fieldName: string): string | null {
  if (value === null || value === undefined || value === '') {
    return \`\${fieldName} is required\`;
  }
  return null;
}
\`\`\``,
        codeBlocks: [{
          fileName: 'validationUtils.ts',
          filePath: 'src/utils/validationUtils.ts',
          content: `export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function required(value: any, fieldName: string): string | null {
  if (value === null || value === undefined || value === '') {
    return \`\${fieldName} is required\`;
  }
  return null;
}`,
          language: 'typescript',
          action: 'create' as const
        }]
      }
    ];

    let currentStep = 0;
    
    const runNextStep = () => {
      if (currentStep >= demoSteps.length) {
        setIsAutoDemoRunning(false);
        if (autoDemoRef.current) {
          clearTimeout(autoDemoRef.current);
        }
        return;
      }
      
      const step = demoSteps[currentStep];
      
      if (step.codeBlocks) {
        // Simulate AI response with code
        const aiResponse: ChatMessage = {
          id: `demo_${currentStep}_${Date.now()}`,
          role: 'assistant',
          content: step.message,
          timestamp: new Date(),
          generatedCode: step.codeBlocks
        };
        
        setAutoDemoMessages(prev => [...prev, 
          { 
            id: `user_${currentStep}`, 
            role: 'user', 
            content: `Demo step ${currentStep + 1}`, 
            timestamp: new Date() 
          },
          aiResponse
        ]);
      } else {
        // Simulate user message
        const userMessage: ChatMessage = {
          id: `user_${currentStep}_${Date.now()}`,
          role: 'user',
          content: step.message,
          timestamp: new Date()
        };
        setAutoDemoMessages(prev => [...prev, userMessage]);
      }
      
      currentStep++;
      setDemoStep(currentStep);
      
      autoDemoRef.current = setTimeout(runNextStep, step.delay);
    };
    
    runNextStep();
  };

  const stopAutoDemo = () => {
    setIsAutoDemoRunning(false);
    if (autoDemoRef.current) {
      clearTimeout(autoDemoRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (autoDemoRef.current) {
        clearTimeout(autoDemoRef.current);
      }
    };
  }, []);

  return (
    <div className="h-screen w-full flex flex-col">
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Phase 11: Real-Time Project Tree Updates</h1>
            <p className="text-sm text-gray-600 mt-1">
              Watch the Project Tree update in real-time as AI-generated code is saved
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={startAutoDemo}
              disabled={isAutoDemoRunning}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              {isAutoDemoRunning ? 'Demo Running...' : 'Start Auto-Demo'}
            </button>
            {isAutoDemoRunning && (
              <button
                onClick={stopAutoDemo}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
              >
                Stop Demo
              </button>
            )}
          </div>
        </div>
        {isAutoDemoRunning && (
          <div className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-blue-800 text-sm font-medium">
                Auto-demo in progress: Step {demoStep} of 4
              </span>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 relative">
        <Phase6UILayout
          initialFiles={initialFiles}
          initialMessages={isAutoDemoRunning ? autoDemoMessages : initialMessages}
          onSendMessage={handleSendMessage}
          onExecutePlan={handleExecutePlan}
          onRejectPlan={handleRejectPlan}
          onCreateFile={handleCreateFile}
          onMoveToProjectTree={handleMoveToProjectTree}
        />
        
        {/* Demo instructions overlay */}
        {!isAutoDemoRunning && (
          <div className="absolute top-4 right-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg max-w-sm z-50">
            <h3 className="font-semibold text-gray-900 mb-2">Demo Instructions</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Click "Save to Project" on any code block</li>
              <li>• Watch the Project Tree update immediately</li>
              <li>• See new files appear with 🟢 status</li>
              <li>• Try the auto-demo for a guided experience</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Files are automatically selected and opened in the editor after saving
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-gray-50 border-t text-sm text-gray-600">
        <div className="max-w-6xl mx-auto">
          <h3 className="font-medium mb-2">Real-Time Features Demonstrated:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Instant Updates</span>
              </div>
              <p className="text-xs text-gray-600">Project Tree refreshes immediately when files are saved</p>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Auto-Selection</span>
              </div>
              <p className="text-xs text-gray-600">New files are automatically selected and opened for editing</p>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Status Tracking</span>
              </div>
              <p className="text-xs text-gray-600">Clear visual indicators for new and modified files</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}