'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { initiateReturn, getUserOcie, findInProgressReturn } from '@/app/actions';
import { Loader2 } from 'lucide-react';

export default function ReturnProcessor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const processingRef = useRef(false);

  useEffect(() => {
    if (userId) {
      if (processingRef.current) return;
      processingRef.current = true;

      const processReturn = async () => {
        try {
          const existingTransaction = await findInProgressReturn(userId);
          if (existingTransaction) {
            router.push(`/transactions/return/confirm/${existingTransaction.id}`);
            return;
          }

          const ocie = await getUserOcie(userId);
          if (ocie.length === 0) {
            throw new Error("This cadet has no items to return.");
          }
          const transactionId = await initiateReturn(userId);
          router.push(`/transactions/return/confirm/${transactionId}`);
        } catch (error) {
          alert((error as Error).message);
          router.push(`/users/${userId}`);
        }
      };
      processReturn();
    } else {
      if (processingRef.current) return;
      processingRef.current = true;
      alert('User ID is missing.');
      router.push('/');
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
