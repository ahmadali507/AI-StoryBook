import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refreshing the auth token
    const { data: { user } } = await supabase.auth.getUser()

    const fullPath = request.nextUrl.pathname

    // Strip locale prefix (/en, /cs) to get the logical path
    const locales = ['en', 'cs']
    let logicalPath = fullPath
    for (const locale of locales) {
        if (fullPath === `/${locale}` || fullPath.startsWith(`/${locale}/`)) {
            logicalPath = fullPath.slice(locale.length + 1) || '/'
            break
        }
    }

    // Detect the current locale from the URL (default to 'en')
    const currentLocale = locales.find(
        loc => fullPath === `/${loc}` || fullPath.startsWith(`/${loc}/`)
    ) ?? 'en'

    const isAuthRoute = logicalPath.startsWith('/auth')
    const isPublicRoute = logicalPath === '/' || logicalPath.startsWith('/api/')

    if (!user && !isAuthRoute && !isPublicRoute) {
        // Redirect unauthenticated users to locale-aware login page
        const url = request.nextUrl.clone()
        url.pathname = `/${currentLocale}/auth/login`
        return NextResponse.redirect(url)
    }

    if (user && isAuthRoute) {
        // Redirect authenticated users away from auth pages
        const url = request.nextUrl.clone()
        url.pathname = `/${currentLocale}`
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
