import 'server-only'

import { db } from './client'
import { users, accounts, type InsertUser } from './schema'
import { eq, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'

/**
 * Find or create a user in the database
 * Returns the internal user ID (our generated ID, not the external auth provider ID)
 *
 * IMPORTANT: This checks if the externalId is already connected to an existing user via accounts
 * to prevent duplicate accounts when someone connects Google then later signs in with Google
 */
export async function upsertUser(
  userData: Omit<InsertUser, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt'>,
): Promise<string> {
  // Ensure all required fields have proper fallback values to prevent undefined errors in PostgreSQL
  const safeUserData = {
    ...userData,
    username: userData.username || 'default_user',
    email: userData.email || null,
    name: userData.name || userData.username || 'Unknown User',
    avatarUrl: userData.avatarUrl || null,
  }

  const { provider, externalId, accessToken, refreshToken, scope } = safeUserData

  // First check: Does this exact provider + externalId combination exist as a primary account?
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.provider, provider), eq(users.externalId, externalId)))
    .limit(1)

  if (existingUser.length > 0) {
    // User exists - update tokens, last login, and other fields that might have changed
    await db
      .update(users)
      .set({
        accessToken,
        refreshToken,
        scope,
        username: safeUserData.username,
        email: safeUserData.email,
        name: safeUserData.name,
        avatarUrl: safeUserData.avatarUrl,
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      })
      .where(eq(users.id, existingUser[0].id))

    return existingUser[0].id
  }

  // Second check: Is this a connected account already connected to an existing user via accounts table?
  // This prevents duplicate accounts when someone:
  // 1. Signs in with Google
  // 2. Connects another account
  // 3. Later signs in directly with Google
  if (provider === 'google') {
    const existingAccount = await db
      .select({ userId: accounts.userId })
      .from(accounts)
      .where(and(eq(accounts.provider, provider), eq(accounts.externalUserId, externalId)))
      .limit(1)

    if (existingAccount.length > 0) {
      console.log(
        `[upsertUser] ${provider.charAt(0).toUpperCase() + provider.slice(1)} account (${externalId}) is already connected to user ${existingAccount[0].userId}. Using existing user.`,
      )

      // Update the existing user's last login
      await db
        .update(users)
        .set({
          updatedAt: new Date(),
          lastLoginAt: new Date(),
        })
        .where(eq(users.id, existingAccount[0].userId))

      return existingAccount[0].userId
    }
  }

  // User doesn't exist at all - create new
  const userId = nanoid()
  const now = new Date()

  await db.insert(users).values({
    id: userId,
    provider: safeUserData.provider,
    externalId: safeUserData.externalId,
    accessToken: safeUserData.accessToken,
    refreshToken: safeUserData.refreshToken,
    scope: safeUserData.scope,
    username: safeUserData.username,
    email: safeUserData.email,
    name: safeUserData.name,
    avatarUrl: safeUserData.avatarUrl,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  })

  return userId
}

/**
 * Get user by internal ID
 */
export async function getUserById(userId: string) {
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  return result[0] || null
}

/**
 * Get user by auth provider and external ID
 */
export async function getUserByExternalId(provider: 'google', externalId: string) {
  const result = await db
    .select()
    .from(users)
    .where(and(eq(users.provider, provider), eq(users.externalId, externalId)))
    .limit(1)
  return result[0] || null
}

/**
 * Find user by account connection
 * Used to check if a Google account is already connected to a user
 */
export async function getUserByAccountConnection(provider: 'google', externalId: string) {
  const result = await db
    .select({ user: users })
    .from(accounts)
    .innerJoin(users, eq(accounts.userId, users.id))
    .where(and(eq(accounts.provider, provider), eq(accounts.externalUserId, externalId)))
    .limit(1)
  return result[0]?.user || null
}
