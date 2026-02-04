/**
 * Get the list of enabled authentication providers from environment variables
 * Defaults to Google only if not specified
 */
export function getEnabledAuthProviders(): {
  google: boolean
} {
  const providers = 'google' // Always use Google since we removed the env var
  const enabledProviders = providers.split(',').map((p) => p.trim().toLowerCase())

  return {
    google: enabledProviders.includes('google'),
  }
}
