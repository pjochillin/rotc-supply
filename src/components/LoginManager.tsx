'use client';

import { signIn } from 'next-auth/react';
import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function LoginManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !error) {
      console.log('[AUTH] Development mode detected, attempting auto-login.');
      const autoLogin = async () => {
        const res = await signIn('credentials', { redirect: false });
        if (res?.ok) {
          console.log('[AUTH] Local dev sign-in successful.');
          router.push('/');
        } else {
          console.error('[AUTH] Local dev sign-in failed:', res);
        }
      };
      autoLogin();
    } else if (!error) {
      signIn('oidc', { callbackUrl: '/' });
    }
  }, [error, router]);

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md max-w-sm w-full">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">ROTC Supply</h1>
        {error ? (
          <div className="text-center">
            <p className="text-red-600 font-semibold">Authentication Failed</p>
            <p className="text-gray-600 mt-2">There was an error during the authentication process. This could be because your account is not yet approved. Please contact an administrator.</p>
            <p className="text-xs text-gray-400 mt-4">Error: {error}</p>
          </div>
        ) : (
          <p className="text-center text-gray-600">
            {isDevelopment ? 'Attempting local sign-in...' : 'Redirecting to login...'}
          </p>
        )}
      </div>
    </div>
  );
}
