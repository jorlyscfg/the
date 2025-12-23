import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set({
                            name,
                            value,
                            ...options,
                            sameSite: 'lax',
                            secure: process.env.NODE_ENV === 'production',
                            path: '/',
                        })
                    })
                },
            },
        }
    )

    // This will refresh the session if needed
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Lógica de redirección
    const isLoginPage = request.nextUrl.pathname.startsWith('/login')
    const isPublicRoute = request.nextUrl.pathname.startsWith('/consulta') ||
        request.nextUrl.pathname.startsWith('/api/public')

    if (!user && !isLoginPage && !isPublicRoute) {
        // Redirigir al login si no hay usuario y no es una ruta pública
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        // Opcional: Guardar la URL actual para volver después del login
        url.searchParams.set('next', request.nextUrl.pathname)
        return NextResponse.redirect(url)
    }

    if (user && isLoginPage) {
        // Redirigir al inicio si ya está logueado e intenta ir al login
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    return response
}
