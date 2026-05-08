import { redirect } from 'next/navigation';
import { initiateReturn } from '@/app/actions';
import { notFound } from 'next/navigation';

export default async function NewReturnPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ userId: string }> 
}) {
  const { userId } = await searchParams;
  
  if (!userId) {
    notFound();
  }

  // Directly initiate the return without needing item details
  const transactionId = await initiateReturn(userId);

  // Redirect to the new confirmation page
  redirect(`/transactions/return/confirm/${transactionId}`);
}
