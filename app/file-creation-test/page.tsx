'use client';

import { useState } from 'react';
import { Phase6UILayout } from '@/components/ui/phase5-ui-layout';
import { ChatMessage, ActionPlan, GeneratedCodeBlock } from '@/components/ui/enhanced-chat-command-center';
import { FileNode } from '@/components/ui/project-tree';

// Test page to demonstrate the fixed file creation workflow
export default function FileCreationTestPage() {
  // Initial empty project structure
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
        },
        {
          id: '3',
          name: 'pages',
          path: 'src/pages',
          type: 'directory',
          status: 'unchanged',
          isExpanded: false,
        },
        {
          id: '4',
          name: 'utils',
          path: 'src/utils',
          type: 'directory',
          status: 'unchanged',
          isExpanded: false,
        }
      ]
    },
    {
      id: '5',
      name: 'public',
      path: 'public',
      type: 'directory',
      status: 'unchanged',
      isExpanded: false,
    }
  ];

  // Sample messages that demonstrate the file creation workflow
  const initialMessages: ChatMessage[] = [
    {
      id: '1',
      role: 'user',
      content: 'Create a todo list program for learning programming in HTML',
      timestamp: new Date(Date.now() - 300000),
    },
    {
      id: '2',
      role: 'assistant',
      content: `I'll create a todo list program for programming learning. This will help you track your learning goals and progress!\n\n\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Programming Learning Todo List</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 30px;
        }
        .input-section {
            display: flex;
            margin-bottom: 20px;
            gap: 10px;
        }
        #newTodo {
            flex: 1;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
        }
        #newTodo:focus {
            outline: none;
            border-color: #3498db;
        }
        button {
            padding: 12px 20px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            transition: background 0.3s;
        }
        button:hover {
            background: #2980b9;
        }
        ul {
            list-style: none;
            padding: 0;
        }
        li {
            display: flex;
            align-items: center;
            padding: 15px;
            margin-bottom: 10px;
            background: #f8f9fa;
            border-radius: 5px;
            border-left: 4px solid #3498db;
        }
        li.completed {
            opacity: 0.7;
            border-left-color: #27ae60;
        }
        li.completed .todo-text {
            text-decoration: line-through;
        }
        .todo-text {
            flex: 1;
            margin: 0 15px;
        }
        .delete-btn {
            background: #e74c3c;
            padding: 8px 12px;
            font-size: 14px;
        }
        .delete-btn:hover {
            background: #c0392b;
        }
        .priority-badge {
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
            margin-right: 10px;
        }
        .high { background: #e74c3c; color: white; }
        .medium { background: #f39c12; color: white; }
        .low { background: #27ae60; color: white; }
        .stats {
            display: flex;
            justify-content: space-around;
            margin-top: 20px;
            padding: 15px;
            background: #ecf0f1;
            border-radius: 5px;
        }
        .stat-item {
            text-align: center;
        }
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #3498db;
        }
        .stat-label {
            font-size: 14px;
            color: #7f8c8d;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>💻 Programming Learning Todo List</h1>
        
        <div class="input-section">
            <input type="text" id="newTodo" placeholder="Add a programming learning goal..." />
            <select id="priority">
                <option value="low">Low Priority</option>
                <option value="medium" selected>Medium Priority</option>
                <option value="high">High Priority</option>
            </select>
            <button onclick="addTodo()">Add Goal</button>
        </div>
        
        <ul id="todoList"></ul>
        
        <div class="stats">
            <div class="stat-item">
                <div class="stat-number" id="totalTodos">0</div>
                <div class="stat-label">Total Goals</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" id="completedTodos">0</div>
                <div class="stat-label">Completed</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" id="pendingTodos">0</div>
                <div class="stat-label">Pending</div>
            </div>
        </div>
    </div>

    <script>
        let todos = JSON.parse(localStorage.getItem('programmingTodos')) || [];
        
        function saveTodos() {
            localStorage.setItem('programmingTodos', JSON.stringify(todos));
            updateStats();
        }
        
        function updateStats() {
            const total = todos.length;
            const completed = todos.filter(todo => todo.completed).length;
            const pending = total - completed;
            
            document.getElementById('totalTodos').textContent = total;
            document.getElementById('completedTodos').textContent = completed;
            document.getElementById('pendingTodos').textContent = pending;
        }
        
        function addTodo() {
            const input = document.getElementById('newTodo');
            const prioritySelect = document.getElementById('priority');
            const text = input.value.trim();
            
            if (text) {
                const newTodo = {
                    id: Date.now(),
                    text: text,
                    completed: false,
                    priority: prioritySelect.value,
                    createdAt: new Date().toISOString()
                };
                
                todos.push(newTodo);
                saveTodos();
                renderTodos();
                input.value = '';
            }
        }
        
        function toggleTodo(id) {
            const todo = todos.find(t => t.id === id);
            if (todo) {
                todo.completed = !todo.completed;
                saveTodos();
                renderTodos();
            }
        }
        
        function deleteTodo(id) {
            todos = todos.filter(t => t.id !== id);
            saveTodos();
            renderTodos();
        }
        
        function getPriorityClass(priority) {
            return priority;
        }
        
        function renderTodos() {
            const todoList = document.getElementById('todoList');
            todoList.innerHTML = '';
            
            todos.forEach(todo => {
                const li = document.createElement('li');
                if (todo.completed) li.classList.add('completed');
                
                li.innerHTML = \`
                    <span class="priority-badge \${getPriorityClass(todo.priority)}">\${todo.priority.toUpperCase()}</span>
                    <span class="todo-text">\${todo.text}</span>
                    <button onclick="toggleTodo(\${todo.id})">\${todo.completed ? 'Undo' : 'Complete'}</button>
                    <button class="delete-btn" onclick="deleteTodo(\${todo.id})">Delete</button>
                \`;
                
                todoList.appendChild(li);
            });
        }
        
        // Initialize
        document.getElementById('newTodo').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addTodo();
            }
        });
        
        renderTodos();
        updateStats();
    </script>
</body>
</html>
\`\`\``,
      timestamp: new Date(Date.now() - 240000),
      generatedCode: [
        {
          fileName: 'programming-todo-list.html',
          filePath: 'src/pages/programming-todo-list.html',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Programming Learning Todo List</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 30px;
        }
        .input-section {
            display: flex;
            margin-bottom: 20px;
            gap: 10px;
        }
        #newTodo {
            flex: 1;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
        }
        #newTodo:focus {
            outline: none;
            border-color: #3498db;
        }
        button {
            padding: 12px 20px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            transition: background 0.3s;
        }
        button:hover {
            background: #2980b9;
        }
        ul {
            list-style: none;
            padding: 0;
        }
        li {
            display: flex;
            align-items: center;
            padding: 15px;
            margin-bottom: 10px;
            background: #f8f9fa;
            border-radius: 5px;
            border-left: 4px solid #3498db;
        }
        li.completed {
            opacity: 0.7;
            border-left-color: #27ae60;
        }
        li.completed .todo-text {
            text-decoration: line-through;
        }
        .todo-text {
            flex: 1;
            margin: 0 15px;
        }
        .delete-btn {
            background: #e74c3c;
            padding: 8px 12px;
            font-size: 14px;
        }
        .delete-btn:hover {
            background: #c0392b;
        }
        .priority-badge {
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
            margin-right: 10px;
        }
        .high { background: #e74c3c; color: white; }
        .medium { background: #f39c12; color: white; }
        .low { background: #27ae60; color: white; }
        .stats {
            display: flex;
            justify-content: space-around;
            margin-top: 20px;
            padding: 15px;
            background: #ecf0f1;
            border-radius: 5px;
        }
        .stat-item {
            text-align: center;
        }
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #3498db;
        }
        .stat-label {
            font-size: 14px;
            color: #7f8c8d;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>💻 Programming Learning Todo List</h1>
        
        <div class="input-section">
            <input type="text" id="newTodo" placeholder="Add a programming learning goal..." />
            <select id="priority">
                <option value="low">Low Priority</option>
                <option value="medium" selected>Medium Priority</option>
                <option value="high">High Priority</option>
            </select>
            <button onclick="addTodo()">Add Goal</button>
        </div>
        
        <ul id="todoList"></ul>
        
        <div class="stats">
            <div class="stat-item">
                <div class="stat-number" id="totalTodos">0</div>
                <div class="stat-label">Total Goals</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" id="completedTodos">0</div>
                <div class="stat-label">Completed</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" id="pendingTodos">0</div>
                <div class="stat-label">Pending</div>
            </div>
        </div>
    </div>

    <script>
        let todos = JSON.parse(localStorage.getItem('programmingTodos')) || [];
        
        function saveTodos() {
            localStorage.setItem('programmingTodos', JSON.stringify(todos));
            updateStats();
        }
        
        function updateStats() {
            const total = todos.length;
            const completed = todos.filter(todo => todo.completed).length;
            const pending = total - completed;
            
            document.getElementById('totalTodos').textContent = total;
            document.getElementById('completedTodos').textContent = completed;
            document.getElementById('pendingTodos').textContent = pending;
        }
        
        function addTodo() {
            const input = document.getElementById('newTodo');
            const prioritySelect = document.getElementById('priority');
            const text = input.value.trim();
            
            if (text) {
                const newTodo = {
                    id: Date.now(),
                    text: text,
                    completed: false,
                    priority: prioritySelect.value,
                    createdAt: new Date().toISOString()
                };
                
                todos.push(newTodo);
                saveTodos();
                renderTodos();
                input.value = '';
            }
        }
        
        function toggleTodo(id) {
            const todo = todos.find(t => t.id === id);
            if (todo) {
                todo.completed = !todo.completed;
                saveTodos();
                renderTodos();
            }
        }
        
        function deleteTodo(id) {
            todos = todos.filter(t => t.id !== id);
            saveTodos();
            renderTodos();
        }
        
        function getPriorityClass(priority) {
            return priority;
        }
        
        function renderTodos() {
            const todoList = document.getElementById('todoList');
            todoList.innerHTML = '';
            
            todos.forEach(todo => {
                const li = document.createElement('li');
                if (todo.completed) li.classList.add('completed');
                
                li.innerHTML = \`
                    <span class="priority-badge \${getPriorityClass(todo.priority)}">\${todo.priority.toUpperCase()}</span>
                    <span class="todo-text">\${todo.text}</span>
                    <button onclick="toggleTodo(\${todo.id})">\${todo.completed ? 'Undo' : 'Complete'}</button>
                    <button class="delete-btn" onclick="deleteTodo(\${todo.id})">Delete</button>
                \`;
                
                todoList.appendChild(li);
            });
        }
        
        // Initialize
        document.getElementById('newTodo').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addTodo();
            }
        });
        
        renderTodos();
        updateStats();
    </script>
</body>
</html>`,
          language: 'html',
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

  const handleMoveToProjectTree = async (codeBlocks: GeneratedCodeBlock[]) => {
    console.log('Moving code blocks to project tree:', codeBlocks);
    
    // Show immediate feedback
    const fileNames = codeBlocks.map(cb => cb.fileName).join(', ');
    alert(`✅ File creation initiated!\n\nFiles to be created: ${fileNames}\n\nCheck the Project Tree panel to see the new files appear with 🟢 status.`);
    
    // The actual file creation happens in the layout component's handleMoveToProjectTree function
  };

  return (
    <div className="h-screen w-full flex flex-col">
      <div className="p-4 border-b bg-gradient-to-r from-green-50 to-blue-50">
        <h1 className="text-2xl font-bold text-gray-900">File Creation Test - Fixed!</h1>
        <p className="text-sm text-gray-600 mt-1">
          Test the complete workflow: AI generates code → Code is saved to actual files → Project tree updates
        </p>
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>🔧 Fix Applied:</strong> Added missing API endpoints for file creation and updated the workflow to actually create files, not just simulate it.
          </p>
        </div>
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
        
        {/* Instructions overlay */}
        <div className="absolute top-4 right-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg max-w-sm z-50">
          <h3 className="font-semibold text-gray-900 mb-2">🧪 Test Instructions</h3>
          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>Look at the chat message with the HTML todo list code</li>
            <li>Click the "Save to Project" button below the code</li>
            <li>Review the file placement in the modal</li>
            <li>Click "Save to Project" to confirm</li>
            <li>Watch the Project Tree update with the new file 🟢</li>
            <li>The file should appear in src/pages/ directory</li>
          </ol>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              The file is now actually created via API calls, not just UI simulation!
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-gray-50 border-t text-sm text-gray-600">
        <div className="max-w-6xl mx-auto">
          <h3 className="font-medium mb-2">✅ Fixed Issues:</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Added missing /api/tasks/[taskId]/create-file endpoint
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Added missing /api/tasks/[taskId]/save-file endpoint
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Updated layout component to make actual API calls
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Files are now created in temporary storage
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}