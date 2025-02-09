import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log('Middleware - Current path:', req.nextUrl.pathname); // Debug log
    console.log('Middleware - Session exists:', !!session); // Debug log

    if (!session && req.nextUrl.pathname.startsWith('/chat')) {
      console.log('Redirecting to login'); // Debug log
      return NextResponse.redirect(new URL('/login', req.url));
    }

    if (session && req.nextUrl.pathname.startsWith('/login')) {
      console.log('Redirecting to chat'); // Debug log
      return NextResponse.redirect(new URL('/chat', req.url));
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error); // Debug log
    return res;
  }
}

export const config = {
  matcher: ['/chat/:path*', '/login'],
};
