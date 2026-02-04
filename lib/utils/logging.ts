import { LogEntry } from '@/lib/db/schema'

export type { LogEntry }

// Redact sensitive information from log messages
export function redactSensitiveInfo(message: string): string {
  let redacted = message

  // API key patterns to redact
  const apiKeyPatterns = [
    // Anthropic API key
    /ANTHROPIC_API_KEY[=\s]*["']?([a-zA-Z0-9_-]{20,})/gi,
    // OpenAI API key
    /OPENAI_API_KEY[=\s]*["']?([a-zA-Z0-9_-]{20,})/gi,
    // GitHub token patterns
    /ghp_[a-zA-Z0-9]{36}/g,
    /gho_[a-zA-Z0-9]{36}/g,
    /ghu_[a-zA-Z0-9]{36}/g,
    /ghs_[a-zA-Z0-9]{36}/g,
    /ghr_[a-zA-Z0-9]{36}/g,
    // Generic API key patterns
    /API_KEY[=\s]*["']?([a-zA-Z0-9_-]{20,})/gi,
    // Bearer tokens
    /Bearer\s+([a-zA-Z0-9_-]{20,})/gi,
    // Generic tokens
    /TOKEN[=\s]*["']?([a-zA-Z0-9_-]{20,})/gi,
  ]

  // Apply redaction patterns
  apiKeyPatterns.forEach((pattern) => {
    redacted = redacted.replace(pattern, (match, key) => {
      // Keep the prefix and show first 4 and last 4 characters
      const prefix = match.substring(0, match.indexOf(key))
      const redactedKey =
        key.length > 8
          ? `${key.substring(0, 4)}${'*'.repeat(Math.max(8, key.length - 8))}${key.substring(key.length - 4)}`
          : '*'.repeat(key.length)
      return `${prefix}${redactedKey}`
    })
  })

  // Redact JSON field patterns (for teamId, projectId in JSON objects)
  redacted = redacted.replace(/"(teamId|projectId)"[\s:]*"([^"]+)"/gi, (match, fieldName) => {
    return `"${fieldName}": "[REDACTED]"`
  })

  // Redact environment variable assignments with sensitive values
  redacted = redacted.replace(
    /([A-Z_]*(?:KEY|TOKEN|SECRET|PASSWORD|TEAM_ID|PROJECT_ID)[A-Z_]*)[=\s:]*["']?([a-zA-Z0-9_-]{8,})["']?/gi,
    (match, varName, value) => {
      const redactedValue =
        value.length > 8
          ? `${value.substring(0, 4)}${'*'.repeat(Math.max(8, value.length - 8))}${value.substring(value.length - 4)}`
          : '*'.repeat(value.length)
      return `${varName}="${redactedValue}"`
    },
  )

  return redacted
}

export function createLogEntry(type: LogEntry['type'], message: string, timestamp?: Date): LogEntry {
  return {
    type,
    message: redactSensitiveInfo(message),
    timestamp: timestamp || new Date(),
  }
}

export function createInfoLog(message: string): LogEntry {
  return createLogEntry('info', message)
}

export function createCommandLog(command: string, args?: string[]): LogEntry {
  const fullCommand = args ? `${command} ${args.join(' ')}` : command
  return createLogEntry('command', `$ ${fullCommand}`)
}

export function createErrorLog(message: string): LogEntry {
  return createLogEntry('error', message)
}

export function createSuccessLog(message: string): LogEntry {
  return createLogEntry('success', message)
}
