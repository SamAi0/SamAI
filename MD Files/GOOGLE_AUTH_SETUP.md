# Google OAuth Authentication Setup Guide

## Overview

This project uses Google OAuth 2.0 for user authentication with full session management, secure token storage, and multi-user isolation.

## Features Implemented

✅ **Google OAuth 2.0 Sign-in/Sign-out**
✅ **Secure Session Management** (JWE encrypted cookies)
✅ **Multi-user Isolation** (per-user data, tasks, API keys)
✅ **Account Connection** (connect Google to existing accounts)
✅ **Token Refresh** (automatic token renewal)
✅ **Rate Limiting** (per-user message quotas)
✅ **Secure Storage** (encrypted access tokens in database)

## Setup Instructions

### 1. Create Google OAuth 2.0 Application

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the Google+ API:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it

4. Create OAuth 2.0 Credentials:
   - Navigate to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Select "Web application"
   - **Application name**: Your app name (e.g., "SamAi0")
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://your-domain.com
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/api/auth/google/callback
     https://your-domain.com/api/auth/google/callback
     ```

5. Note down your credentials:
   - **Client ID** (starts with numbers and ends with .apps.googleusercontent.com)
   - **Client Secret** (long string with letters, numbers, and special characters)

### 2. Environment Configuration

Create a `.env.local` file in your project root:

```bash
# Required for Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Authentication configuration
NEXT_PUBLIC_AUTH_PROVIDERS=google

# Required for core infrastructure (already configured)
POSTGRES_URL=your_postgresql_connection_string
JWE_SECRET=your_base64_encoded_secret
ENCRYPTION_KEY=your_32_byte_hex_string
```

### 3. Generate Required Secrets

```bash
# Generate JWE_SECRET (32-byte base64)
openssl rand -base64 32

# Generate ENCRYPTION_KEY (32-byte hex)
openssl rand -hex 32
```

### 4. Database Setup

Run the database migrations:

```bash
pnpm db:generate
pnpm db:push
```

This creates the required tables:

- `users` - User profiles and primary OAuth accounts
- `accounts` - Additional connected accounts
- `sessions` - User sessions
- `tasks` - User tasks
- `keys` - Encrypted API keys
- `connectors` - MCP server connections

## How Authentication Works

### 1. Sign-in Flow

1. User clicks "Sign in with Google"
2. Redirects to Google OAuth consent screen
3. User grants permissions
4. Google redirects back with authorization code
5. Backend exchanges code for access token
6. User info is fetched from Google
7. User is created/updated in database
8. Encrypted session cookie is set
9. User is redirected to app

### 2. Session Management

- **Session Storage**: Encrypted JWE cookies (1 year expiration)
- **Token Storage**: Encrypted in database (AES-256)
- **Security**: HttpOnly, Secure, SameSite=Lax cookies
- **Refresh**: Automatic token refresh when needed

### 3. Account Connection Flow

1. Authenticated user clicks "Connect Google"
2. OAuth flow begins with `authMode=connect`
3. Google account is linked to existing user
4. Tokens are encrypted and stored
5. User can now use Google for API access

## API Endpoints

### Authentication Routes

- `GET /api/auth/signin/google` - Start Google OAuth flow
- `GET /api/auth/google/callback` - Handle OAuth callback
- `GET /api/auth/signout` - Sign out user
- `GET /api/auth/info` - Get current user info
- `GET /api/auth/rate-limit` - Get user rate limit info

### Protected Routes

All API routes automatically check for valid session:

```typescript
const session = await getServerSession()
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

## Security Features

### Data Encryption

- **Session Cookies**: JWE (JSON Web Encryption) with 256-bit keys
- **API Tokens**: AES-256 encryption before database storage
- **Sensitive Data**: All OAuth tokens and API keys encrypted

### Session Security

- **HttpOnly Cookies**: Prevent XSS attacks
- **Secure Flag**: HTTPS only in production
- **SameSite=Lax**: CSRF protection
- **1-Year Expiration**: Long-lived sessions

### Token Management

- **Automatic Refresh**: Refresh tokens used to get new access tokens
- **Scope Validation**: Proper OAuth scopes requested
- **Token Revocation**: Clean sign-out process

## User Interface Components

### Authentication Components

- `SignIn` - Google sign-in button with loading states
- `SignOut` - User dropdown with profile info and logout
- `User` - Main authentication component that switches between SignIn/SignOut
- `SessionProvider` - Jotai-based session state management

### Features

- **Profile Display**: User avatar, name, email
- **Rate Limit Info**: Daily message quota display
- **API Key Management**: Secure API key storage interface
- **Theme Toggle**: Dark/light mode switch

## Testing Authentication

### Local Development

1. Start the development server:

   ```bash
   pnpm dev
   ```

2. Visit `http://localhost:3000`
3. Click "Sign in" button
4. Complete Google OAuth flow
5. Verify you're logged in (avatar should appear in top-right)

### Verification Steps

- ✅ User appears in database (`users` table)
- ✅ Session cookie `_user_session_` is set
- ✅ User can access protected routes
- ✅ Rate limit information displays correctly
- ✅ Sign out works properly
- ✅ Session persists across page refreshes

## Troubleshooting

### Common Issues

**"Google OAuth not configured"**

- Check that `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Verify environment variables are loaded correctly

**"Invalid OAuth state"**

- This is a security feature - usually means the OAuth flow timed out
- Restart the sign-in process

**"Failed to exchange code for token"**

- Verify redirect URIs match exactly in Google Cloud Console
- Check that client ID/secret are correct
- Ensure Google+ API is enabled

**Session not persisting**

- Check browser cookie settings
- Verify `JWE_SECRET` is properly set
- Ensure HTTPS in production (cookies won't work over HTTP)

### Debugging

Enable debug logging by checking server console output:

```bash
# Look for these log prefixes:
[Google Callback] - OAuth callback processing
[Google Session] - Session creation
[upsertUser] - User database operations
```

## Production Deployment

### Environment Variables

Set these in your production environment:

```bash
NODE_ENV=production
NEXT_PUBLIC_GOOGLE_CLIENT_ID=production-client-id
GOOGLE_CLIENT_SECRET=production-client-secret
POSTGRES_URL=your-production-database-url
JWE_SECRET=production-jwe-secret
ENCRYPTION_KEY=production-encryption-key
```

### Redirect URIs

Add your production domain:

```
https://your-domain.com/api/auth/google/callback
```

### Security Considerations

- Use HTTPS only
- Rotate secrets periodically
- Monitor authentication logs
- Implement proper error handling
- Set up rate limiting

## Advanced Features

### Multi-Account Support

Users can connect multiple Google accounts to their profile:

- Primary account used for sign-in
- Additional accounts can be connected for API access
- Automatic account merging when needed

### API Key Management

- Secure storage of provider API keys (OpenAI, Anthropic, etc.)
- Per-user key isolation
- Encrypted storage with user's encryption key

### Rate Limiting

- Configurable daily message limits
- Per-user quota tracking
- Reset at midnight UTC
- Customizable via settings table

This authentication system provides enterprise-grade security with a smooth user experience.
