import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/session';

export async function middleware(request: NextRequest) {
    const session = request.cookies.get('session')?.value;
    const path = request.nextUrl.pathname;
    const isLoginPage = path.startsWith('/login');
    const isSimulador = path.startsWith('/simulador');

    // Ignore internal next.js files and static images
    if (path.startsWith('/_next') || path.includes('.')) {
        return NextResponse.next();
    }

    // Always allow API routes to pass (internal validation happens inside them)
    // Allow the simulator visual page to run unprotected for the IoT demo
    if (path.startsWith('/api') || isSimulador) {
        return NextResponse.next();
    }

    // Verify cryptographic JWT session signature for the Dashboard
    let payload = null;
    if (session) {
        payload = await decrypt(session);
    }

    // Redirect to login if unauthorized and trying to access root (or other protected pages)
    if (!payload && !isLoginPage) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('session'); // Cleans up invalid cookies
        return response;
    }

    // Redirect to dashboard if logged in and trying to view the login page
    if (payload && isLoginPage) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
