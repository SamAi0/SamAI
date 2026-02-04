#!/usr/bin/env node

// Script to generate required authentication secrets
const crypto = require('crypto')

console.log('🔐 Authentication Secret Generator')
console.log('==================================\n')

// Generate JWE_SECRET (32-byte base64)
const jweSecret = crypto.randomBytes(32).toString('base64')
console.log('JWE_SECRET (for session encryption):')
console.log(jweSecret)
console.log()

// Generate ENCRYPTION_KEY (32-byte hex)
const encryptionKey = crypto.randomBytes(32).toString('hex')
console.log('ENCRYPTION_KEY (for data encryption):')
console.log(encryptionKey)
console.log()

console.log('✅ Generated authentication secrets!')
console.log('\nNext steps:')
console.log('1. Copy these values to your .env.local file')
console.log('2. Set up Google OAuth credentials in Google Cloud Console')
console.log('3. Configure your PostgreSQL database')
console.log('4. Run: pnpm verify-auth')
