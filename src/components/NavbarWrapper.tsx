'use client';

import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';

export function NavbarWrapper() {
  const { data: session, status } = useSession();

  if (status === 'authenticated') {
    return <Navbar />;
  }

  return null;
}
