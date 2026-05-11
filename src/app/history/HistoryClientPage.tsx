'use client';

import { useState, useMemo } from 'react';
import { History, Calendar, User, Package, Search } from "lucide-react";
import TransactionDetailModal from "@/components/TransactionDetailModal";

export default function HistoryClientPage({ history: initialHistory }: { history: any[] }) {
  const [searchQuery, setSearchQuery] = useState('');

  const history = useMemo(() => {
    if (!searchQuery) return initialHistory;

    return initialHistory.filter(item => {
      const searchLower = searchQuery.toLowerCase();
      const recipientMatch = item.recipient.toLowerCase().includes(searchLower);
      const itemMatch = item.items.some((itemName: string) => itemName.toLowerCase().includes(searchLower));
      return recipientMatch || itemMatch;
    });
  }, [initialHistory, searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
        <p className="mt-1 text-sm text-gray-500">
          A full log of all sign-outs and returns.
        </p>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          placeholder="Search by user or item..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6"
        />
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {history.map((item) => (
            <li key={item.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-3 ${
                      item.isReturn ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.isReturn ? <History className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                    </div>
                    <div className="flex flex-wrap gap-x-1 items-center text-sm font-medium">
                      {item.items.map((itemName: string, index: number) => (
                        <div key={index} className="flex items-center">
                          <span className="text-red-700">{itemName}</span>
                          {index < item.items.length - 1 && <span className="text-gray-500 mx-1">+</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex items-center">
                    <p className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      item.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' : 
                      item.status === 'RETURN_IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      item.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status.replace(/_/g, ' ')}
                    </p>
                    <TransactionDetailModal transaction={item} />
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      <User className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
                      {item.recipient}
                    </p>
                    <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                      <Calendar className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
                      {item.date}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
