import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if this is a new user by checking if they have credits
      const { data: existingCredits } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', data.user.id)
        .single()

      if (!existingCredits) {
        // New OAuth user - grant 1 free credit
        const { error: insertError } = await supabase
          .from('user_credits')
          .insert({
            user_id: data.user.id,
            credits: 1,
            total_purchased: 0
          })

        if (!insertError) {
          console.log('✅ Granted 1 free credit to new OAuth user:', data.user.id)
        } else {
          console.error('❌ Error initializing OAuth user credits:', insertError)
        }
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin)
}
