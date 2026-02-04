import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: process.env.DB_TYPE === 'sqlite' ? 'sqlite' : 'postgresql',
  dbCredentials:
    process.env.DB_TYPE === 'sqlite'
      ? {
          url: './samai0.db',
        }
      : {
          url: process.env.DATABASE_URL!,
        },
})
