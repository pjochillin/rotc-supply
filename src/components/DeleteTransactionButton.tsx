'use client';

import { Trash2 } from 'lucide-react';
import { deleteTransaction } from '@/app/actions';

export default function DeleteTransactionButton({ transactionId }: { transactionId: string }) {
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      await deleteTransaction(transactionId);
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="text-red-600 hover:text-red-900"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
