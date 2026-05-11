'use client';

import { Printer, Package } from 'lucide-react';
import Link from 'next/link';

interface OcieItem {
  itemSizeId: string;
  itemId: string;
  name: string;
  size: string;
  quantity: number;
  imageUrl: string | null;
}

export function UserOcieClientPage({ ocieItems, userName }: { ocieItems: OcieItem[], userName: string }) {

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 print:hidden">
        <div className='mb-4 sm:mb-0'>
          <h1 className="text-3xl font-bold">My OCIE Record</h1>
          <p className="text-gray-500">A record of all items currently signed out to {userName}.</p>
        </div>
        <Link
          href="/my-ocie/print"
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print Record
        </Link>
      </div>

      {ocieItems.length > 0 ? (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <ul role="list" className="divide-y divide-gray-200">
            {ocieItems.map((item) => (
              <li key={item.itemSizeId} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover border" />
                  ) : (
                    <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="ml-4">
                    <p className="text-lg font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">Size: {item.size}</p>
                  </div>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">x{item.quantity}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-gray-500">You do not have any items signed out.</p>
        </div>
      )}
    </div>
  );
}
