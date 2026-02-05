/**
 * Security Configuration - File Access Control System 0.1
 * 
 * Centralized security configuration for the application.
 * This file defines all security policies and restrictions.
 */

// Get workspace root with Edge Runtime compatibility
function getWorkspaceRoot(): string {
  // Check if we're in Edge Runtime (middleware)
  if (typeof process === 'undefined' || !process.cwd) {
    // Fallback for Edge Runtime - use a safe default
    // In a real deployment, this should be configured via environment variables
    return '/workspace' // Safe default that will block all file access
  }
  
  try {
    return process.cwd()
  } catch {
    // Fallback if process.cwd() fails
    return '/workspace'
  }
}

// Workspace Security Configuration
export const SECURITY_CONFIG = {
  // Workspace root - only directory AI can access
  WORKSPACE_ROOT: getWorkspaceRoot(),
  
  // Path validation rules
  PATH_VALIDATION: {
    // Block path traversal attempts
    BLOCK_PATH_TRAVERSAL: true,
    // Block absolute paths outside workspace
    BLOCK_ABSOLUTE_OUTSIDE_WORKSPACE: true,
    // Block symbolic links (if implemented)
    BLOCK_SYMLINKS: true,
  },
  
  // File operation restrictions
  FILE_RESTRICTIONS: {
    // Allowed file extensions (empty array = no restriction)
    ALLOWED_EXTENSIONS: [] as string[],
    // Blocked file patterns
    BLOCKED_PATTERNS: [
      '.env*',
      '*.key',
      '*.pem',
      '*.crt',
      'config.json',
      'secrets.json',
      'credentials.json'
    ],
    // Maximum file size (bytes)
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  },
  
  // API Security
  API_SECURITY: {
    // Enable path parameter validation
    VALIDATE_PATH_PARAMETERS: true,
    // Enable request body validation
    VALIDATE_REQUEST_BODY: true,
    // Log all security violations
    LOG_VIOLATIONS: true,
    // Block suspicious user agents
    BLOCK_SUSPICIOUS_AGENTS: false,
  },
  
  // Security Headers
  SECURITY_HEADERS: {
    // Content Security Policy
    CSP: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
    // X-Content-Type-Options
    X_CONTENT_TYPE_OPTIONS: 'nosniff',
    // X-Frame-Options
    X_FRAME_OPTIONS: 'DENY',
    // X-XSS-Protection
    X_XSS_PROTECTION: '1; mode=block',
  }
} as const

// Type definitions
export type SecurityConfig = typeof SECURITY_CONFIG

// Export for use in other modules
export default SECURITY_CONFIG