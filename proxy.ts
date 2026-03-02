import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const LOCALES = ['en', 'cs'] as const
const DEFAULT_LOCALE = 'en'

function getPreferredLocale(request: NextRequest): string {
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
    if (cookieLocale && (LOCALES as readonly string[]).includes(cookieLocale)) {
        return cookieLocale
    }

    const acceptLang = request.headers.get('accept-language') || ''
    // Simple: check if Czech is preferred
    if (acceptLang.toLowerCase().startsWith('cs') || acceptLang.includes(',cs')) {
        return 'cs'
    }
    return DEFAULT_LOCALE
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Skip for API, auth callback, and static files
    const isSkipped =
        pathname.startsWith('/api/') ||
        pathname.startsWith('/auth/callback') ||
        pathname.startsWith('/_next')

    if (!isSkipped) {
        // Check if already has a locale prefix
        const hasLocale = LOCALES.some(
            loc => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)
        )

        if (!hasLocale) {
            const locale = getPreferredLocale(request)
            const url = request.nextUrl.clone()
            url.pathname = `/${locale}${pathname}`
            return NextResponse.redirect(url)
        }
    }

    // Supabase session refresh
    return await updateSession(request)
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
