# Trust System - Phase 2 Documentation

## Overview

Phase 2 implements a comprehensive trust system with virtual filesystem, diff generation, and accept/reject UI. This enables safe review and approval of AI-generated changes before they're applied to the actual filesystem.

## Core Architecture

### 1. Virtual Filesystem Layer (`lib/ai/virtual-filesystem.ts`)

**Purpose**: In-memory representation of filesystem changes
**Key Features**:
- Load files into memory without disk changes
- Track before/after states for all operations
- Generate detailed diffs for changes
- Apply or discard changes as a unit

### 2. Diff Preview Generator (`lib/ai/diff-preview-generator.ts`)

**Purpose**: Generate human-readable previews of changes
**Key Features**:
- Line-by-line diffs for file updates
- Full file previews for new files
- Explicit delete confirmations
- Summary views of all changes

### 3. Trust System (`lib/ai/trust-system.ts`)

**Purpose**: Manage the accept/reject workflow
**Key Features**:
- Change request management
- Decision tracking and history
- Accept/reject operations
- Integration with virtual filesystem

### 4. UI Component (`components/ai/trust-system-ui.tsx`)

**Purpose**: User interface for reviewing and approving changes
**Key Features**:
- File-by-file review interface
- Accept/Reject/Pending status tracking
- Summary views and statistics
- Action buttons for each change type

## System Workflow

```
[AI Actions] 
     ↓
[Virtual Filesystem] → Load files into memory
     ↓
[Diff Generation] → Create human-readable previews  
     ↓
[Trust System] → Manage change requests
     ↓
[UI Review] → User accepts/rejects changes
     ↓
[Apply/Discard] → Write to disk or discard
```

## Key Components

### Virtual Filesystem Operations

#### File States
- **Original State**: Content as it exists on disk
- **Current State**: Content in virtual memory
- **Modified Flag**: Tracks if changes were made
- **Existence Status**: Whether file exists or is deleted

#### Supported Operations
- `loadFile()`: Load existing file into memory
- `createFile()`: Create new file in memory
- `updateFile()`: Update file content in memory
- `deleteFile()`: Mark file for deletion
- `applyChanges()`: Write all changes to disk
- `discardChanges()`: Discard all changes

### Diff Generation Types

#### New Files (`full` preview)
```
📄 New File: components/new-component.tsx
   1 | import React from 'react';
   2 | 
   3 | export function NewComponent() {
   4 |   return <div>Hello World</div>;
   5 | }
```

#### Updated Files (`diff` preview)
```
📝 Updated File: lib/utils.ts
--- a/lib/utils.ts
+++ b/lib/utils.ts
  10 | export function formatString(str: string): string {
- 11 |   return str.trim().toLowerCase();
+ 11 |   return str.trim().toUpperCase();
  12 | }
```

#### Deleted Files (`confirmation` preview)
```
🗑️ Delete File: deprecated/file.ts
⚠️  You are about to DELETE this file!
File: deprecated/file.ts
Size: 1250 bytes
Lines: 25

First 20 lines of content:
   1 | // This file is deprecated
   2 | const oldFunction = () => {
   3 |   console.log("old code");
   4 | }
```

### Trust System Workflow

#### Change Request Lifecycle
1. **Create Request**: AI actions loaded into virtual filesystem
2. **Generate Previews**: Diff previews created for all changes
3. **User Review**: UI presents changes for review
4. **Decision Making**: User accepts/rejects individual files
5. **Final Action**: Apply all accepted changes or discard everything

#### Decision Types
- **accept**: Apply this specific change
- **reject**: Discard this specific change
- **partial**: Accept some changes, reject others
- **pending**: No decision made yet

## API Endpoints

### Demo Endpoint
**POST** `/api/trust/demo`
Create a demo change request with sample operations

```bash
# Create file demo
curl -X POST http://localhost:3000/api/trust/demo \
  -H "Content-Type: application/json" \
  -d '{"operation": "createFile"}'

# Update file demo  
curl -X POST http://localhost:3000/api/trust/demo \
  -H "Content-Type: application/json" \
  -d '{"operation": "updateFile"}'

# Delete file demo
curl -X POST http://localhost:3000/api/trust/demo \
  -H "Content-Type: application/json" \
  -d '{"operation": "deleteFile"}'
```

### Trust Request Management
**GET** `/api/trust/[requestId]`
Get change request details and previews

**POST** `/api/trust/[requestId]`
Manage trust decisions:
- `action: "accept_all"` - Accept all changes
- `action: "reject_all"` - Reject all changes  
- `action: "decide"` - Make decision on specific file
- `action: "get_preview"` - Get preview for specific file

## UI Component Integration

### TrustSystemUI Props
```typescript
interface TrustSystemUIProps {
  taskId: string
  userId: string
  requestId: string
  onDecisionMade?: (filePath: string, decision: string) => void
  onAllDecisionsMade?: (status: 'accept' | 'reject' | 'partial') => void
}
```

### Features
- **Summary View**: Overview of all changes with statistics
- **File Previews**: Individual file change previews
- **Action Buttons**: Accept/Reject/Pending controls
- **Status Tracking**: Real-time status updates
- **Error Handling**: Graceful error display

## Security Integration

### Workspace Protection
- All virtual filesystem operations validated against workspace boundaries
- Path traversal and absolute path attacks blocked
- Security audit logging for all operations

### Change Validation
- Files can only be modified within workspace
- Delete operations require explicit confirmation
- All changes tracked and reversible

## Testing

### Automated Tests
```bash
# Run comprehensive trust system tests
node trust-system-test.js
```

### Manual Testing
1. Create demo change requests
2. Review generated previews
3. Test accept/reject workflows
4. Verify change application/discard
5. Check security boundary enforcement

## Configuration Options

### Virtual Filesystem
```typescript
{
  workspaceRoot: string,  // Base directory
  taskId: string,         // Associated task
  userId: string          // User identifier
}
```

### Trust System
```typescript
{
  autoCleanup: boolean,   // Auto-cleanup old requests
  cleanupAfter: number    // Hours before cleanup
}
```

## Monitoring & Debugging

### Audit Logging
- All filesystem operations logged
- Decision history tracked
- Change request lifecycle monitoring
- Error and violation logging

### Debugging Tools
- Request status inspection
- File state comparison
- Diff analysis tools
- Performance metrics

## Integration Points

### With Phase 1 (Action-Based AI)
- Uses validated action schemas
- Integrates with intent execution engine
- Shares security validation logic

### With Existing Systems
- Security audit logging integration
- Session and authentication systems
- File access control boundaries

## Best Practices

### For Implementation
- Always validate workspace boundaries
- Log all user decisions for audit
- Provide clear preview information
- Handle errors gracefully
- Implement proper cleanup procedures

### For User Experience
- Clear visual distinction between change types
- Explicit confirmation for destructive operations
- Summary views for quick overview
- Undo capabilities where appropriate
- Progress indicators for operations

## Future Extensions

### Phase 3 Considerations
- Partial file acceptance (line-by-line)
- Change conflict detection
- Branch/merge workflow integration
- Advanced diff algorithms
- Collaborative review features

### Scalability Features
- Database-backed change requests
- WebSocket real-time updates
- Batch operation support
- Performance optimization
- Caching strategies

---

*Phase 2 establishes a robust trust framework for safe AI code execution with comprehensive review capabilities and user-controlled change management.*