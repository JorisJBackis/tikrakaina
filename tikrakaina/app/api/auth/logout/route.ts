import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Create response that clears cookies
  const response = NextResponse.json({ success: true })

  // Clear all Supabase auth cookies (project-specific)
  const cookiesToClear = [
    'sb-tzftzmqntxnijkfvvtfz-auth-token',
    'sb-tzftzmqntxnijkfvvtfz-auth-token.0',
    'sb-tzftzmqntxnijkfvvtfz-auth-token.1',
  ]

  cookiesToClear.forEach(cookieName => {
    response.cookies.delete(cookieName)
  })

  return response
}
