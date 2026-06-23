import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Route yang butuh login
const protectedRoutes = ['/dashboard', '/profil', '/users', '/gejala', '/kerusakan', '/aturan', '/diagnosa', '/vespa-pedia'];

// Route yang hanya bisa diakses kalau BELUM login
const authRoutes = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ambil token dari cookie
  const token = request.cookies.get('token')?.value;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // 1. Belum login tapi mau akses protected route → redirect ke /login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname); // opsional: simpan tujuan asal
    return NextResponse.redirect(loginUrl);
  }

  // 2. Sudah login tapi mau akses /login → redirect ke /dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Jalankan middleware di semua route kecuali static file dan api
  matcher: ['/((?!_next/static|_next/image|favicon.ico|asset|api).*)'],
};
