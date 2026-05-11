'use client';

import { Users, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

interface DashboardUserListProps {
  users: User[];
}

export default function DashboardUserList({ users }: DashboardUserListProps) {
  return (
    <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center">
          <Users className="h-5 w-5 text-red-700 mr-2" />
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Users</h2>
        </div>
        <Link href="/users" className="text-xs font-bold text-red-700 hover:text-red-900">View All</Link>
      </div>
      <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto font-sans">
        {users.slice(0, 5).map((user) => (
          <Link 
            key={user.id} 
            href={`/users/${user.id}`}
            className="flex items-center px-6 py-5 hover:bg-red-50 transition-all group border-l-4 border-transparent hover:border-red-700 relative"
          >
            <div className="flex-grow">
              <div className="flex items-center justify-between">
                <p className="text-base font-black text-gray-900 group-hover:text-red-700 transition-colors leading-tight">{user.name}</p>
              </div>
              <div className="flex items-center mt-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider px-2 py-0.5 bg-gray-100 rounded border border-gray-200">{user.role}</span>
                <span className="text-[10px] text-gray-400 ml-2 font-medium">{user.email}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">View Profile</span>
              <ArrowUpRight className="h-5 w-5 text-red-700" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
