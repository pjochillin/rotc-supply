import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // This is a protected route. If there's no token, redirect to login.
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // If user is an admin, they can access everything.
  if (token.role === 'ADMIN') {
    console.log('Middleware: Admin user, access granted.');
    return NextResponse.next();
  }

  // If user is not an admin, they should only access their OCIE page.
  if (pathname.startsWith('/my-ocie')) {
    console.log('Middleware: Non-admin accessing /my-ocie, access granted.');
    return NextResponse.next();
  } else {
    console.log('Middleware: Non-admin trying to access other page, redirecting to /my-ocie');
    return NextResponse.redirect(new URL('/my-ocie', req.url));
  }

  // Fallback for any other case
  return NextResponse.next();
}


export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
