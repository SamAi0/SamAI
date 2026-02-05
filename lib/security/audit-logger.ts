/**
 * Security Audit Logger - File Access Control System 0.1
 * 
 * Logs all security-related events for monitoring and compliance.
 * This provides an audit trail of all access attempts and security violations.
 */

interface SecurityEvent {
  timestamp: Date
  eventType: 'ACCESS_ATTEMPT' | 'VIOLATION_BLOCKED' | 'PATH_VALIDATED' | 'CONFIG_CHANGE'
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  operation: string
  path?: string
  resolvedPath?: string
  userId?: string
  ipAddress?: string
  userAgent?: string
  details?: Record<string, unknown>
}

class SecurityAuditLogger {
  private events: SecurityEvent[] = []
  private readonly MAX_EVENTS = 1000 // Keep last 1000 events in memory
  
  /**
   * Log a security event
   */
  log(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      timestamp: new Date(),
      ...event
    }
    
    // Add to events array
    this.events.push(securityEvent)
    
    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS)
    }
    
    // Log to console for immediate visibility
    this.logToConsole(securityEvent)
  }
  
  /**
   * Log security event to console
   */
  private logToConsole(event: SecurityEvent): void {
    const timestamp = event.timestamp.toISOString()
    const prefix = `[SECURITY-${event.severity}]`
    
    switch (event.severity) {
      case 'CRITICAL':
        console.error(`${prefix} ${timestamp} - ${event.eventType}: ${event.operation}`, event)
        break
      case 'ERROR':
        console.error(`${prefix} ${timestamp} - ${event.eventType}: ${event.operation}`, event)
        break
      case 'WARNING':
        console.warn(`${prefix} ${timestamp} - ${event.eventType}: ${event.operation}`, event)
        break
      case 'INFO':
        console.info(`${prefix} ${timestamp} - ${event.eventType}: ${event.operation}`)
        break
    }
  }
  
  /**
   * Log path access attempt
   */
  logAccessAttempt(operation: string, path: string, userId?: string): void {
    this.log({
      eventType: 'ACCESS_ATTEMPT',
      severity: 'INFO',
      operation,
      path,
      userId
    })
  }
  
  /**
   * Log security violation that was blocked
   */
  logViolationBlocked(operation: string, path: string, details?: Record<string, unknown>): void {
    this.log({
      eventType: 'VIOLATION_BLOCKED',
      severity: 'CRITICAL',
      operation,
      path,
      details
    })
  }
  
  /**
   * Log successful path validation
   */
  logPathValidated(operation: string, path: string, resolvedPath: string): void {
    this.log({
      eventType: 'PATH_VALIDATED',
      severity: 'INFO',
      operation,
      path,
      resolvedPath
    })
  }
  
  /**
   * Get recent security events
   */
  getRecentEvents(count: number = 50): SecurityEvent[] {
    return this.events.slice(-count)
  }
  
  /**
   * Get events by type
   */
  getEventsByType(eventType: SecurityEvent['eventType']): SecurityEvent[] {
    return this.events.filter(event => event.eventType === eventType)
  }
  
  /**
   * Get violation events
   */
  getViolations(): SecurityEvent[] {
    return this.getEventsByType('VIOLATION_BLOCKED')
  }
  
  /**
   * Clear all events
   */
  clearEvents(): void {
    this.events = []
  }
  
  /**
   * Get security statistics
   */
  getStats(): {
    totalEvents: number
    violations: number
    accessAttempts: number
    validations: number
  } {
    return {
      totalEvents: this.events.length,
      violations: this.getEventsByType('VIOLATION_BLOCKED').length,
      accessAttempts: this.getEventsByType('ACCESS_ATTEMPT').length,
      validations: this.getEventsByType('PATH_VALIDATED').length
    }
  }
}

// Create singleton instance
export const securityAudit = new SecurityAuditLogger()

// Export types
export type { SecurityEvent }
export { SecurityAuditLogger }