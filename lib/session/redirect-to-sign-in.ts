import { redirect } from 'next/navigation'

export async function redirectToSignIn(): Promise<void> {
  // Redirect to Google OAuth sign in
  redirect('/api/auth/signin/google')
}
