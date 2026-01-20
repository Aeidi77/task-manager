import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/jwt'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = new URL(request.url)

  // Public routes yang tidak perlu auth
  const publicRoutes = ['/', '/login', '/register']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Jika tidak ada token dan mencoba akses protected route
  if (!token && !isPublicRoute && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Jika ada token, verify
  if (token) {
    const payload = verifyToken(token)

    // Jika token invalid, redirect ke login
    if (!payload && !isPublicRoute) {
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('token')
      return response
    }

    // Jika sudah login dan akses login/register, redirect ke dashboard
    if (payload && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
