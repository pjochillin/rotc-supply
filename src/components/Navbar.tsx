'use client';

import Link from 'next/link';
import { Package, Users, History, LayoutDashboard } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { UserNav } from './UserNav';

export default function Navbar() {
  const [logoError, setLogoError] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 print:hidden shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center group">
              <div className="relative h-10 w-10 mr-3 transition-transform group-hover:scale-110 flex items-center justify-center bg-red-50 rounded-full border border-red-100 overflow-hidden">
                {logoError ? (
                  <div className="text-red-700 font-black text-[10px]">ROTC</div>
                ) : (
                  <img 
                    src="/logo.png" 
                    alt="Cornell ROTC Logo" 
                    className="object-contain w-full h-full"
                    onError={() => setLogoError(true)}
                  />
                )}
              </div>
              <span className="text-xl font-black text-red-700 tracking-tighter uppercase">Cornell ROTC Supply</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
              <Link
                href="/inventory"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
              >
                <Package className="w-4 h-4 mr-2" />
                Inventory
              </Link>
              <Link
                href="/users"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
              >
                <Users className="w-4 h-4 mr-2" />
                Users
              </Link>
              <Link
                href="/history"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
              >
                <History className="w-4 h-4 mr-2" />
                History
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <UserNav />
          </div>
        </div>
      </div>
    </nav>
  );
}
