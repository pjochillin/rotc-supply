import { Suspense } from 'react';
import LoginManager from '@/components/LoginManager';

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginManager />
    </Suspense>
  );
}


