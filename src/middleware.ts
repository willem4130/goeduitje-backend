export { auth as middleware } from '@/lib/auth'

export const config = {
  matcher: [
    // Protect all routes except login, API, static files, and Next.js internals
    '/((?!login|api|_next/static|_next/image|favicon.ico|icon).*)',
  ],
}
