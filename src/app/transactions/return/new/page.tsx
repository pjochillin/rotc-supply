import { Suspense } from 'react';
import ReturnProcessor from '@/components/ReturnProcessor';

export default function NewReturnPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReturnProcessor />
    </Suspense>
  );
}
