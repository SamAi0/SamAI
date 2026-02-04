# SamAi0

An AI-powered coding agent template that helps you automate development tasks with local Ollama models.

## Quick Start

You can deploy your own version of the SamAi0 with one click:
[![Deploy with GitHub](https://github.com/favicon.ico)](https://github.com/your-repo/SamAi0)

**What happens during deployment:**

- **Environment Configuration**: You'll be prompted to provide required environment variables (encryption keys)
- **OAuth Setup**: After deployment, you'll need to configure GitHub OAuth in your project settings for user authentication
- **User Authentication**: Secure sign-in with GitHub OAuth
- **Database Setup**: PostgreSQL database is automatically configured

## Features

- **Ollama Integration**: Choose from various local Ollama models to execute coding tasks
- **User Authentication**: Secure sign-in with Google OAuth
- **Multi-User Support**: Each user has their own tasks, API keys, and GitHub connection
- **Secure Execution**: Runs code in isolated, secure environments
- **Git Integration**: Automatically creates branches and commits changes
- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS
- **Task Management**: Track task progress with real-time updates
- **Persistent Storage**: Tasks stored in PostgreSQL database
- **AI-Generated Branch Names**: Automatically generates descriptive Git branch names using local Ollama models

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: Ollama models (locally hosted)
- **Authentication**: Google OAuth 2.0
- **Git**: Automated branching and commits with AI-generated branch names

## Local Development Setup

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL database (local or cloud)

### 1. Clone the repository

```bash
git clone https://github.com/your-repo/SamAi0.git
cd SamAi0
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```bash
# Database Configuration
DB_TYPE=postgresql
DATABASE_URL=your_postgresql_connection_string

# Required for core infrastructure
JWE_SECRET=your_base64_encoded_secret
ENCRYPTION_KEY=your_32_byte_hex_string

# Google OAuth (required)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**Generate required secrets:**

```bash
# Generate JWE_SECRET (32-byte base64)
openssl rand -base64 32

# Generate ENCRYPTION_KEY (32-byte hex)
openssl rand -hex 32
```

### 4. Set up Google OAuth App

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the Google+ API:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it

4. Create OAuth 2.0 Credentials:
   - Navigate to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Select "Web application"
   - **Application name**: Your app name (e.g., "My Coding Agent")
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

### 5. Set up the database

The project uses Drizzle ORM with PostgreSQL and has a comprehensive migration system:

```bash
# Generate new migrations from schema changes
pnpm db:generate

# Apply pending migrations to your database
pnpm db:migrate

# Push schema changes directly (development only)
pnpm db:push

# View database in Drizzle Studio
pnpm db:studio
```

**Migration Workflow:**
1. Make changes to `lib/db/schema.ts`
2. Run `pnpm db:generate` to create new migration files
3. Run `pnpm db:migrate` to apply migrations to your database
4. Check `lib/db/migrations/` for the migration history

The database schema includes tables for:
- `users` - User profiles and OAuth accounts
- `tasks` - AI coding tasks with progress tracking
- `connectors` - MCP server connections
- `accounts` - Additional OAuth accounts
- `keys` - Encrypted API keys
- `task_messages` - Conversation history
- `settings` - User-specific configuration

All migrations are version-controlled and reproducible across environments.

### 6. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Sign In**: Authenticate with Google OAuth
2. **Create a Task**: Enter a repository URL and describe what you want the AI to do
3. **Monitor Progress**: Watch real-time logs as the agent works
4. **Review Results**: See the changes made and the branch created
5. **Manage Tasks**: View all your tasks in the sidebar with status updates

## Environment Variables

### Required Environment Variables (App Infrastructure)

These are set once by you (the app developer) and are used for core infrastructure:

- `POSTGRES_URL`: Your PostgreSQL connection string
- `JWE_SECRET`: Base64-encoded secret for session encryption (generate with: `openssl rand -base64 32`)
- `ENCRYPTION_KEY`: 32-byte hex string for encrypting user API keys and tokens (generate with: `openssl rand -hex 32`)

### User Authentication (Required)

**You must configure Google authentication:**

#### Google OAuth App

**Required Configuration:**

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Your Google OAuth app client ID (exposed to client)
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth app client secret
- `NEXT_PUBLIC_AUTH_PROVIDERS`: Set to `"google"`

## Version History

### Version 2.0.0 - Major Update: User Authentication & Security

This release introduces **user authentication** and **major security improvements**, but contains **breaking changes** that require migration for existing deployments.

#### New Features

- **User Authentication System**
  - Sign in with Google
  - Session management with encrypted tokens
  - Per-user task isolation
  - Secure API key storage

- **Security Enhancements**
  - End-to-end encryption for sensitive data
  - Secure session management
  - Token-based authentication
  - Per-user data isolation

#### Migration Guide for Existing Deployments

1. **Database Migration Required**
   - Run `pnpm db:generate` and `pnpm db:push` to update the database schema
   - New tables: `users`, `accounts`, `sessions`

2. **New Required Variables:**
   - `JWE_SECRET`: Base64-encoded secret for session encryption (generate: `openssl rand -base64 32`)
   - `ENCRYPTION_KEY`: 32-byte hex string for encrypting sensitive data (generate: `openssl rand -hex 32`)
   - `NEXT_PUBLIC_AUTH_PROVIDERS`: Configure which auth providers to enable (`github`)

3. **New OAuth Configuration (required):**
   - Google: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

4. **Authentication Required**
   - All routes now require user authentication
   - No anonymous access to tasks or API endpoints
   - Users must sign in with Google before creating tasks

#### Migration Guide for Existing Deployments

For existing deployments, you'll need to:

1. Add the new environment variables
2. Update the database schema
3. Configure GitHub OAuth
4. Re-deploy the application

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
