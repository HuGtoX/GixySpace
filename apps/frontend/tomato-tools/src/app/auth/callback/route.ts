import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/clients/supabase/server';
import { createRequestLogger, generateCorrelationId } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || generateCorrelationId();
  const logger = createRequestLogger(correlationId, 'auth/callback');
  
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error) {
        logger.info('Email confirmation successful');
        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';
        
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${next}`);
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`);
        } else {
          return NextResponse.redirect(`${origin}${next}`);
        }
      } else {
        logger.error({ error: error.message }, 'Email confirmation failed');
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
      }
    } catch (error) {
      logger.error({ error }, 'Auth callback error');
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }
  }

  logger.warn('No auth code provided in callback');
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}