'use client';

import { useState } from 'react';
import { updateUserRole } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { Shield, User } from 'lucide-react';

export default function ToggleRoleButton({ userId, currentRole, currentUserId }: { userId: string, currentRole: 'USER' | 'ADMIN', currentUserId: string | undefined }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleToggleRole = async () => {
    setIsLoading(true);
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await updateUserRole(userId, newRole);
      router.refresh();
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isCurrentlyAdmin = currentRole === 'ADMIN';
  const isSelf = userId === currentUserId;

  return (
    <button
      onClick={handleToggleRole}
      disabled={isLoading || isSelf}
      className={`inline-flex items-center px-4 py-2 border shadow-sm text-sm font-bold rounded-xl transition-all ${
        isCurrentlyAdmin
          ? 'border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      {isCurrentlyAdmin ? (
        <User className="mr-2 h-4 w-4" />
      ) : (
        <Shield className="mr-2 h-4 w-4" />
      )}
      {isLoading ? 'Updating...' : (isCurrentlyAdmin ? 'Make User' : 'Make Admin')}
    </button>
  );
}
