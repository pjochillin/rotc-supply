'use client';

import { signIn } from 'next-auth/react';
import { useEffect } from 'react';

export default function LoginPage() {
  useEffect(() => {
    signIn('oidc', { callbackUrl: '/' });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">ROTC Supply</h1>
        <p className="text-center text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
}

