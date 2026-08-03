'use client'

/**
 * A hidden form that can be triggered imperatively to log out.
 * This avoids the Radix UI DropdownMenuItem `e.preventDefault()` issue
 * and avoids `fetch` NetworkError issues with POST redirects.
 */
export function useLogout() {
  const submitLogout = () => {
    // Create a form programmatically
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = '/api/auth/logout'
    document.body.appendChild(form)
    form.submit()
  }

  return submitLogout
}
