import { NextRequest, NextResponse } from 'next/server'

// Gate de sesión (Next 16 "proxy", antes "middleware"). Rutas públicas: el
// login, los route handlers /api/* (incluido el proxy de auth) y los assets.
const PUBLIC_PATHS = ['/login', '/api', '/_next', '/favicon.ico']

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  const sessionCookie =
    request.cookies.get('better-auth.session_token') ??
    request.cookies.get('__Secure-better-auth.session_token')

  // Sin sesión y en ruta protegida → al login (guardando el destino).
  if (!isPublic && !sessionCookie) {
    const login = new URL('/login', request.url)
    login.searchParams.set('from', pathname)
    return NextResponse.redirect(login)
  }

  // Con sesión y en el login → directo al panel de obras.
  if (pathname.startsWith('/login') && sessionCookie) {
    return NextResponse.redirect(new URL('/obras', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
