'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getOrCreateReturnTransaction } from '@/app/actions';
import { Loader2 } from 'lucide-react';

export default function ReturnProcessor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  useEffect(() => {
    if (userId) {
      const processReturn = async () => {
        try {
          const transactionId = await getOrCreateReturnTransaction(userId);
          router.push(`/transactions/return/confirm/${transactionId}?userId=${userId}`);
        } catch (error) {
          alert((error as Error).message);
          router.push(`/users/${userId}`);
        }
      };
      processReturn();
    } else {
      alert('User ID is missing.');
      router.push('/'); // Redirect if no user ID
    }
  }, [userId, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="flex items-center text-lg font-semibold text-gray-700">
        <Loader2 className="mr-3 h-6 w-6 animate-spin text-red-700" />
        Processing return...
      </div>
      <p className="mt-2 text-sm text-gray-500">Please wait, you will be redirected shortly.</p>
    </div>
  );
}
