import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // 30 days in seconds
    const MAX_AGE = 30 * 24 * 60 * 60

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
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        })
                        // Explicitly set attributes for persistence and Safari compatibility
                        response.cookies.set({
                            name,
                            value,
                            ...options,
                            maxAge: MAX_AGE,
                            sameSite: 'lax',
                            secure: process.env.NODE_ENV === 'production',
                            path: '/',
                        })
                    })
                },
            },
        }
    )

    // This will refresh the session if needed - customizes the response
    await supabase.auth.getUser()

    return response
}
