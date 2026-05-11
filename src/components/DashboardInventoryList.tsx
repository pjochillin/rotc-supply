'use client';

import { useState } from 'react';
import { Package, Edit } from 'lucide-react';
import Link from 'next/link';
import ImageModal from './ImageModal';
import DeleteItemButton from './DeleteItemButton';

interface Item {
  id: string;
  name: string;
  room: string | null;
  shelf: string | null;
  imageUrl: string | null;
  sizes: { id: string; size: string; availableQuantity: number; totalQuantity: number; }[];
}

interface DashboardInventoryListProps {
  items: Item[];
}

export default function DashboardInventoryList({ items }: DashboardInventoryListProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center">
          <Package className="h-5 w-5 text-red-700 mr-2" />
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Inventory Management</h2>
        </div>
        <Link href="/inventory" className="text-xs font-bold text-red-700 hover:text-red-900">View All</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Item</th>
              <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Stock</th>
              <th className="px-6 py-3 text-right text-xs font-black text-gray-500 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="h-8 w-8 rounded object-cover mr-3 border cursor-pointer" onClick={() => setSelectedImage(item.imageUrl)} />
                    ) : (
                      <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center mr-3 border">
                        <Package className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-gray-900">{item.name}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.sizes.length === 1 && item.sizes[0].size === 'Standard' 
                          ? null
                          : item.sizes.map(s => (
                            <span key={s.id} className="text-[10px] bg-gray-50 px-1 rounded border text-gray-500 font-bold">
                              {s.size}: {s.availableQuantity}/{s.totalQuantity}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">
                    {item.sizes.reduce((acc, s) => acc + s.availableQuantity, 0)} / {item.sizes.reduce((acc, s) => acc + s.totalQuantity, 0)}
                  </div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">{item.room} • {item.shelf}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <Link href={`/edit-item/${item.id}`} className="text-blue-600 hover:text-blue-900">
                      <Edit className="h-4 w-4" />
                    </Link>
                    <DeleteItemButton itemId={item.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </div>
  );
}
