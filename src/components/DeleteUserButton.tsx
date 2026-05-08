'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteUser } from '@/app/actions';
import { Trash2 } from 'lucide-react';

export function DeleteUserButton({ userId }: { userId: string }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteUser(userId);
      alert('User successfully deleted.');
      router.push('/users');
      router.refresh(); // Force a refresh to update the user list
    } catch (error) {
      console.error(error);
      alert('Failed to delete user.');
      setIsDeleting(false);
    }
  };

  if (isConfirming) {
    return (
      <div className="flex items-center space-x-2">
        <p className="text-sm text-gray-600">Are you sure? This is permanent.</p>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-3 py-1 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:bg-red-300"
        >
          {isDeleting ? 'Deleting...' : 'Yes, Delete'}
        </button>
        <button
          onClick={() => setIsConfirming(false)}
          disabled={isDeleting}
          className="px-3 py-1 rounded-md bg-gray-200 text-gray-800 text-sm font-semibold hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsConfirming(true)}
      className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-red-600 bg-white text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
    >
      <Trash2 className="h-4 w-4" />
      <span>Delete User</span>
    </button>
  );
}
