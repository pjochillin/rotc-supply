'use client';

import { useSession, signOut } from "next-auth/react";

export function UserNav() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  return (
    <div className="flex items-center space-x-4">
      <span className="text-sm font-medium text-gray-500">
        Logged in as {session.user.name}
      </span>
      <button
        onClick={() => signOut()}
        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        suppressHydrationWarning={true}
      >
        Sign Out
      </button>
    </div>
  );
}
