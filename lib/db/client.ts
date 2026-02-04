import { drizzle } from 'drizzle-orm/postgres-js'
import { drizzle as sqliteDrizzle } from 'drizzle-orm/better-sqlite3'
import postgres from 'postgres'
import Database from 'better-sqlite3'
import * as schema from './schema'

let _db: any | null = null

export const db = new Proxy({} as any, {
  get(target, prop) {
    if (!_db) {
      if (process.env.DB_TYPE === 'sqlite') {
        // Use SQLite for local development
        const sqlite = new Database('./samai0.db')
        _db = sqliteDrizzle(sqlite, { schema })
      } else {
        // Use PostgreSQL for production
        if (!process.env.DATABASE_URL) {
          throw new Error('DATABASE_URL environment variable is required when DB_TYPE=postgresql')
        }
        const client = postgres(process.env.DATABASE_URL)
        _db = drizzle(client, { schema })
      }
    }
    return Reflect.get(_db, prop)
  },
})
