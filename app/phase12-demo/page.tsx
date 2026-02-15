'use client';

import { useState, useEffect } from 'react';
import { Phase6UILayout } from '@/components/ui/phase5-ui-layout';
import { ChatMessage, ActionPlan, GeneratedCodeBlock } from '@/components/ui/enhanced-chat-command-center';
import { FileNode } from '@/components/ui/project-tree';

// Demo page for file diff and review functionality
export default function Phase12DemoPage() {
  // Initial files for the project tree with some existing files to demonstrate updates
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
      name: 'package.json',
      path: 'package.json',
      type: 'file',
      status: 'unchanged'
    }
  ];

  // Sample messages with modifications to existing files
  const initialMessages: ChatMessage[] = [
    {
      id: '1',
      role: 'user',
      content: 'Update the Button component to add a disabled state and loading spinner',
      timestamp: new Date(Date.now() - 300000),
    },
    {
      id: '2',
      role: 'assistant',
      content: `I'll update the Button component to add disabled state and loading functionality. This will modify the existing file.\n\n\`\`\`tsx
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false,
  loading = false,
  size = 'md'
}: ButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };

  return (
    <button 
      onClick={handleClick}
      disabled={disabled || loading}
      className={\`rounded transition-colors \${sizeClasses[size]} \${variantClasses[variant]} \${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} flex items-center justify-center gap-2\`}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}
\`\`\``,
      timestamp: new Date(Date.now() - 240000),
      generatedCode: [
        {
          fileName: 'Button.tsx',
          filePath: 'src/components/Button.tsx',
          content: `import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false,
  loading = false,
  size = 'md'
}: ButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };

  return (
    <button 
      onClick={handleClick}
      disabled={disabled || loading}
      className={\`rounded transition-colors \${sizeClasses[size]} \${variantClasses[variant]} \${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} flex items-center justify-center gap-2\`}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}`,
          language: 'typescript',
          action: 'update' as const,
          originalContent: `import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={\`px-4 py-2 rounded \${variant === 'primary' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}\`}
    >
      {children}
    </button>
  );
}`
        }
      ]
    },
    {
      id: '3',
      role: 'user',
      content: 'Create a new utility function for form validation',
      timestamp: new Date(Date.now() - 180000),
    },
    {
      id: '4',
      role: 'assistant',
      content: `Here's a new form validation utility that will be created as a new file:\n\n\`\`\`ts
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export function validateRequired(value: any, fieldName: string): ValidationError | null {
  if (value === null || value === undefined || value === '') {
    return { field: fieldName, message: \`\${fieldName} is required\` };
  }
  return null;
}

export function validateEmail(email: string, fieldName: string = 'Email'): ValidationError | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { field: fieldName, message: 'Please enter a valid email address' };
  }
  return null;
}

export function validateMinLength(value: string, minLength: number, fieldName: string): ValidationError | null {
  if (value.length < minLength) {
    return { field: fieldName, message: \`\${fieldName} must be at least \${minLength} characters long\` };
  }
  return null;
}

export function validateForm(fields: Record<string, any>, validators: Record<string, ((value: any, fieldName: string) => ValidationError | null)[]>): ValidationResult {
  const errors: ValidationError[] = [];
  
  Object.keys(fields).forEach(fieldName => {
    const value = fields[fieldName];
    const fieldValidators = validators[fieldName] || [];
    
    fieldValidators.forEach(validator => {
      const error = validator(value, fieldName);
      if (error) {
        errors.push(error);
      }
    });
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
\`\`\``,
      timestamp: new Date(Date.now() - 120000),
      generatedCode: [
        {
          fileName: 'formValidation.ts',
          filePath: 'src/utils/formValidation.ts',
          content: `export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export function validateRequired(value: any, fieldName: string): ValidationError | null {
  if (value === null || value === undefined || value === '') {
    return { field: fieldName, message: \`\${fieldName} is required\` };
  }
  return null;
}

export function validateEmail(email: string, fieldName: string = 'Email'): ValidationError | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { field: fieldName, message: 'Please enter a valid email address' };
  }
  return null;
}

export function validateMinLength(value: string, minLength: number, fieldName: string): ValidationError | null {
  if (value.length < minLength) {
    return { field: fieldName, message: \`\${fieldName} must be at least \${minLength} characters long\` };
  }
  return null;
}

export function validateForm(fields: Record<string, any>, validators: Record<string, ((value: any, fieldName: string) => ValidationError | null)[]>): ValidationResult {
  const errors: ValidationError[] = [];
  
  Object.keys(fields).forEach(fieldName => {
    const value = fields[fieldName];
    const fieldValidators = validators[fieldName] || [];
    
    fieldValidators.forEach(validator => {
      const error = validator(value, fieldName);
      if (error) {
        errors.push(error);
      }
    });
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}`,
          language: 'typescript',
          action: 'create' as const
        }
      ]
    }
  ];

  // Handler functions
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
    const fileNames = codeBlocks.map(cb => cb.fileName).join(', ');
    const actions = codeBlocks.map(cb => cb.action === 'create' ? 'created' : 'updated').join(' and ');
    alert(`✓ Files ${actions}: ${fileNames}\n\nCheck the Project Tree and File Editor to see the changes!`);
  };

  return (
    <div className="h-screen w-full flex flex-col">
      <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
        <h1 className="text-2xl font-bold text-gray-900">Phase 12: File Diff and Review</h1>
        <p className="text-sm text-gray-600 mt-1">
          Review detailed changes before accepting modifications to existing files
        </p>
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
        
        {/* Demo instructions overlay */}
        <div className="absolute top-4 right-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg max-w-sm z-50">
          <h3 className="font-semibold text-gray-900 mb-2">Demo Instructions</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Click "Save to Project" on the updated Button component</li>
            <li>• Review the detailed diff before accepting changes</li>
            <li>• See the new form validation file created without diff review</li>
            <li>• Notice how modified files show 🟡 status in the tree</li>
          </ul>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Updates to existing files require diff review for safety
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-gray-50 border-t text-sm text-gray-600">
        <div className="max-w-6xl mx-auto">
          <h3 className="font-medium mb-2">Safety Features Demonstrated:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Diff Review</span>
              </div>
              <p className="text-xs text-gray-600">Detailed line-by-line comparison before accepting changes to existing files</p>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Safe Updates</span>
              </div>
              <p className="text-xs text-gray-600">New files bypass diff review, updates require explicit approval</p>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Visual Indicators</span>
              </div>
              <p className="text-xs text-gray-600">Clear status indicators for new (🟢) and modified (🟡) files</p>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Rejection Option</span>
              </div>
              <p className="text-xs text-gray-600">Ability to reject changes and keep original file content</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}