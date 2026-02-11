import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard'];

// Routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = ['/login'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check for Supabase auth token in cookies
    // Pattern: sb-<project-ref>-auth-token
    const authToken = request.cookies.getAll().find(
        c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
    );

    const isAuthenticated = !!authToken?.value;

    // Protect dashboard routes - redirect to login if not authenticated
    if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
        if (!isAuthenticated) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // Redirect authenticated users away from login page
    if (AUTH_ROUTES.some(route => pathname === route)) {
        if (isAuthenticated) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
    matcher: [
        // Match all dashboard routes
        '/dashboard/:path*',
        // Match login page
        '/login',
    ],
};
