'use client';

import Link from 'next/link';
import { Package, Users, History, LayoutDashboard, Menu, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { UserNav } from './UserNav';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [logoError, setLogoError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
            <div className="hidden lg:ml-6 lg:flex lg:space-x-8">
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
          <div className="flex items-center ml-auto">
            <div className="hidden lg:flex lg:items-center">
              <UserNav />
            </div>
            <div className="-mr-2 flex items-center lg:hidden">
              <button
                suppressHydrationWarning
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden"
            >
              <div className="space-y-1 pt-2 pb-3">
                <Link
                  href="/"
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-md py-2 text-base font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                >
                  Dashboard
                </Link>
                <Link
                  href="/inventory"
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-md py-2 text-base font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                >
                  Inventory
                </Link>
                <Link
                  href="/users"
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-md py-2 text-base font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                >
                  Users
                </Link>
                <Link
                  href="/history"
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-md py-2 text-base font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                >
                  History
                </Link>
              </div>
              <div className="border-t border-gray-200 pt-4 pb-3">
                <UserNav />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
