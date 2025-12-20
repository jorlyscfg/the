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
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        })
                        // Explicitly set maxAge for persistence
                        response.cookies.set({
                            name,
                            value,
                            ...options,
                            maxAge: MAX_AGE,
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
