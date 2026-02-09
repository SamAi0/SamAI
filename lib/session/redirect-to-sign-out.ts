export async function redirectToSignOut(): Promise<void> {
  try {
    const res = await fetch(
      `/api/auth/signout?${new URLSearchParams({
        next: window.location.pathname,
      }).toString()}`,
    )

    if (!res.ok) {
      // If the response is not OK, redirect to homepage
      window.location.href = '/'
      return
    }

    // Check if the response is actually JSON before parsing
    const contentType = res.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      try {
        const { url } = await res.json()
        window.location.href = url
      } catch (jsonError) {
        // If JSON parsing fails, redirect to homepage
        console.error('Failed to parse JSON response:', jsonError)
        window.location.href = '/'
      }
    } else {
      // If not JSON, assume error and redirect to homepage
      window.location.href = '/'
    }
  } catch (error) {
    // If there's any error (network, parsing, etc.), redirect to homepage
    console.error('Sign out error:', error)
    window.location.href = '/'
  }
  
  if (window.location.hash) {
    window.location.reload()
  }
}