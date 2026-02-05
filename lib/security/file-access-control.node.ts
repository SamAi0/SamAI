import path from 'path'
import { NextRequest } from 'next/server'
import { securityAudit } from './audit-logger'
import { SECURITY_CONFIG } from './config'

/**
 * File Access Control System - Security Layer 0.1
 * 
 * Enforces strict workspace boundary to prevent AI from accessing system files.
 * This is a non-negotiable security measure.
 */

// Define the workspace root - this is the only directory AI can access
const WORKSPACE_ROOT = path.resolve(SECURITY_CONFIG.WORKSPACE_ROOT)

/**
 * Validates that a given path is within the workspace boundaries
 * @param inputPath - The path to validate
 * @param operation - The operation being performed (for logging context)
 * @returns The resolved absolute path if valid, throws error if invalid
 */
export function validateWorkspacePath(inputPath: string, operation: string = 'file_operation'): string {
  // Log access attempt
  securityAudit.logAccessAttempt(operation, inputPath)
  
  // Resolve the input path to absolute path
  const resolvedPath = path.resolve(inputPath)
  
  // Check if path is within workspace root
  const isWithinWorkspace = resolvedPath.startsWith(WORKSPACE_ROOT)
  
  // Additional security checks
  const hasPathTraversal = inputPath.includes('..')
  const isAbsoluteOutsideWorkspace = path.isAbsolute(inputPath) && !resolvedPath.startsWith(WORKSPACE_ROOT)
  
  // Log security violations (server-side only)
  if (!isWithinWorkspace || hasPathTraversal || isAbsoluteOutsideWorkspace) {
    const violationDetails = {
      resolvedPath,
      workspaceRoot: WORKSPACE_ROOT,
      isWithinWorkspace,
      hasPathTraversal,
      isAbsoluteOutsideWorkspace,
      securityConfig: SECURITY_CONFIG.PATH_VALIDATION
    }
    
    securityAudit.logViolationBlocked(operation, inputPath, violationDetails)
    
    console.error(`SECURITY VIOLATION: Path access blocked`, violationDetails)
    
    throw new Error('ACCESS_DENIED: Path outside workspace boundaries')
  }
  
  // Log successful validation
  securityAudit.logPathValidated(operation, inputPath, resolvedPath)
  
  return resolvedPath
}

/**
 * Middleware to validate file paths in API requests
 * @param request - Next.js request object
 * @param pathParam - The path parameter to validate
 * @returns Validated absolute path
 */
export function validateRequestPath(request: NextRequest, pathParam: string): string {
  try {
    // Get the path from request parameters or body
    const url = new URL(request.url)
    const searchParams = url.searchParams
    const pathFromParams = searchParams.get(pathParam) || ''
    
    // If no path provided, return workspace root
    if (!pathFromParams) {
      return WORKSPACE_ROOT
    }
    
    return validateWorkspacePath(pathFromParams, `api_request_${request.method}`)
  } catch (error) {
    console.error('Path validation failed:', error)
    throw new Error('Invalid file path')
  }
}

/**
 * Utility to safely join paths within workspace
 * @param paths - Path segments to join
 * @returns Validated absolute path
 */
export function safeJoinPath(...paths: string[]): string {
  const joinedPath = path.join(...paths)
  return validateWorkspacePath(joinedPath, 'path_join')
}

/**
 * Get workspace root directory
 * @returns The absolute path to workspace root
 */
export function getWorkspaceRoot(): string {
  return WORKSPACE_ROOT
}

/**
 * Check if a path is within workspace boundaries
 * @param inputPath - Path to check
 * @returns boolean indicating if path is safe
 */
export function isPathInWorkspace(inputPath: string): boolean {
  try {
    validateWorkspacePath(inputPath)
    return true
  } catch {
    return false
  }
}

// Export for use in other modules
export const FileAccessControl = {
  validateWorkspacePath,
  validateRequestPath,
  safeJoinPath,
  getWorkspaceRoot,
  isPathInWorkspace
}