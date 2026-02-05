# Action-Based AI System - Phase 1 Documentation

## Overview

Phase 1 implements a strict action-based AI system where all AI responses must conform to a predefined JSON schema. This ensures predictable, controllable, and secure AI behavior.

## Core Architecture

### 1. Action Schema Definition

**File**: `lib/ai/action-schema.ts`

Defines the strict JSON structure that all AI responses must follow:

```json
{
  "thought": "string",
  "actions": [
    {
      "type": "create_file | update_file | delete_file | read_file | list_files | execute_command",
      "path": "string",
      "content": "string | null",
      "patch": "string | null",
      "command": "string | null"
    }
  ]
}
```

### 2. Intent Execution Engine

**File**: `lib/ai/intent-execution-engine.ts`

Backend service that:
- Validates actions against security boundaries
- Executes actions in memory first
- Produces diffs for changes
- Maintains file state context

### 3. AI Service

**File**: `lib/ai/ai-service.ts`

Handles:
- AI response parsing and validation
- Retry logic for failed responses
- Invalid response logging and debugging
- Integration with security systems

## System Flow

```
[AI Response] 
     ↓
[Parse & Validate JSON] → (action-schema.ts)
     ↓
[Security Validation] → (file-access-control.ts)
     ↓
[Execute Actions] → (intent-execution-engine.ts)
     ↓
[Log Results] → (audit-logger.ts)
     ↓
[Return Execution Results]
```

## Key Features

### ✅ Strict Schema Enforcement
- Only valid JSON responses accepted
- Plain text responses rejected
- Comprehensive validation with detailed error reporting

### ✅ Security Integration
- All file operations validated against workspace boundaries
- Path traversal and absolute path attacks blocked
- Audit logging of all AI actions

### ✅ Retry Logic
- Automatic retry for invalid responses
- Configurable retry limits and delays
- Detailed logging of failed attempts

### ✅ Execution Safety
- In-memory execution first
- Diff generation for all changes
- Context-aware file state management

## API Endpoints

### Test Endpoint
**POST** `/api/ai/test`

Test the AI system with various response types:

```bash
# Test valid response
curl -X POST http://localhost:3000/api/ai/test \
  -H "Content-Type: application/json" \
  -d '{"testType": "valid"}'

# Test custom response
curl -X POST http://localhost:3000/api/ai/test \
  -H "Content-Type: application/json" \
  -d '{"customResponse": "{\"thought\":\"test\",\"actions\":[{\"type\":\"read_file\",\"path\":\"README.md\"}]}"}'
```

### Available Test Types
- `valid` - Properly formatted schema
- `invalidFormat` - Missing required fields
- `invalidJSON` - Syntax errors
- `plainText` - Non-JSON responses
- `markdownJSON` - Markdown-wrapped JSON

## System Prompts (For AI Models)

### Required System Prompt
```
You MUST respond in JSON format only.
Follow this exact schema:
{
  "thought": "your reasoning",
  "actions": [
    {
      "type": "action_type",
      "path": "file_path",
      "content": "file_content"
    }
  ]
}

Rules:
- No markdown formatting
- No explanations outside the schema
- Only valid action types: create_file, update_file, delete_file, read_file, list_files, execute_command
- All file paths must be relative to workspace root
```

## Action Types

### File Operations
- **create_file**: Create new file with content
- **update_file**: Update existing file content or apply patch
- **delete_file**: Delete existing file
- **read_file**: Read file content
- **list_files**: List directory contents

### System Operations
- **execute_command**: Execute system commands (restricted)

## Security Enforcement

### Path Validation
- All paths validated against workspace boundaries
- Path traversal (`..`) blocked
- Absolute paths outside workspace rejected
- Security audit logging for all attempts

### Content Restrictions
- File size limits (configurable)
- Sensitive file pattern blocking
- Command execution restrictions

## Error Handling

### Validation Errors
- Detailed field-level error reporting
- Invalid response logging for debugging
- Retry mechanism with backoff

### Execution Errors
- Action-level success/failure tracking
- Diff generation for successful changes
- Security violation logging

## Testing

### Automated Tests
Run the test suite:
```bash
node ai-system-test.js
```

### Manual Testing
Use the API test endpoint to validate different scenarios:
- Valid schema responses
- Invalid format responses
- JSON parsing errors
- Security boundary violations

## Configuration

### AI Service Config
```typescript
{
  maxRetries: 3,        // Maximum retry attempts
  retryDelay: 1000,     // Delay between retries (ms)
  requireJSON: true     // Enforce JSON-only responses
}
```

### Action Schema Config
- Extensible action types
- Custom validation rules
- Field requirements configuration

## Monitoring & Debugging

### Audit Logging
- All AI responses logged
- Invalid responses tracked
- Security violations recorded
- Execution results monitored

### Debugging Tools
- Invalid response statistics
- Retry attempt tracking
- Error pattern analysis
- Performance metrics

## Integration Points

### With Security System
- Uses existing file access control
- Integrates with audit logging
- Respects workspace boundaries

### With Task System
- Designed for task-based execution
- Maintains execution context
- Produces structured results

## Future Extensions

### Phase 2 Considerations
- More sophisticated diff algorithms
- Advanced patch application
- State persistence and rollback
- Multi-step action planning

### Scalability Features
- Batch action processing
- Parallel execution optimization
- Resource usage monitoring
- Rate limiting integration

## Best Practices

### For AI Model Training
- Always enforce JSON schema in system prompts
- Provide clear examples of valid responses
- Include error recovery instructions
- Specify workspace context clearly

### For System Integration
- Validate all external AI responses
- Log all interactions for debugging
- Implement appropriate retry strategies
- Monitor for security violations

---

*Phase 1 establishes the foundation for controlled, secure AI execution with strict schema enforcement and comprehensive validation.*