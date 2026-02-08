import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;   // lebih aman pakai cookie

  // Atau kalau masih pakai localStorage → tidak bisa dibaca di middleware
  // Jadi lebih baik pindah ke cookie httpOnly nanti

  const protectedPaths = ['/dashboard', '/users', '/gejala', '/kerusakan' /* tambah path lain */];

  const isProtected = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtected && !token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Kalau sudah login tapi buka /login → redirect ke dashboard
  if (request.nextUrl.pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', /* tambah path lain yang dilindungi */],
};