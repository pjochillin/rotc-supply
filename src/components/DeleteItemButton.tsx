'use client';

import { Trash2 } from 'lucide-react';
import { deleteItem } from '@/app/actions';

export default function DeleteItemButton({ itemId }: { itemId: string }) {
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await deleteItem(itemId);
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
