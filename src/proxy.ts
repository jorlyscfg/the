import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
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
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    // IMPORTANTE: getUser() es más seguro que getSession() en el middleware
    const { data: { user } } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Páginas públicas
    const isPublicPage = pathname.startsWith('/login') ||
        pathname.startsWith('/register') ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/consulta')

    // 1. Si no hay sesión y no es página pública, redirigir a login
    if (!user && !isPublicPage) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // 2. Si hay sesión
    if (user) {
        // Si intenta ir a login/register ya logueado, mandarlo a raíz
        // Las páginas de consulta siguen siendo accesibles aunque esté logueado
        const isAuthOnlyPage = pathname.startsWith('/login') ||
            pathname.startsWith('/register') ||
            pathname.startsWith('/auth')

        if (isAuthOnlyPage) {
            return NextResponse.redirect(new URL('/', request.url))
        }

        // 3. Verificar empresa
        if (!pathname.startsWith('/_next') && !pathname.includes('.')) {
            const { data: empleado } = await supabase
                .from('empleados')
                .select('id')
                .eq('auth_user_id', user.id)
                .single()

            if (pathname === '/onboarding') {
                if (empleado) {
                    // Ya tiene empresa, no debe estar en onboarding
                    return NextResponse.redirect(new URL('/', request.url))
                }
            } else if (!empleado) {
                // No tiene empresa y no está en onboarding, mandarlo allá
                return NextResponse.redirect(new URL('/onboarding', request.url))
            }
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - manifest.json (PWA)
         * - sw.js (Service Worker)
         */
        '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
