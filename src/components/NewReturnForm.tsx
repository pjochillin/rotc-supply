'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Package, X, ArrowLeft, ClipboardList, RotateCcw } from 'lucide-react';
import { initiateReturn } from '@/app/actions';
import Link from 'next/link';

interface ItemDetail {
  transactionId: string;
  itemId: string;
  itemSizeId: string;
  name: string;
  size: string;
  quantity: number;
  imageUrl: string | null;
  category: string;
}

export default function NewReturnPage({ 
  user, 
  items 
}: { 
  user: { id: string; name: string }, 
  items: ItemDetail[] 
}) {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleItem = (itemKey: string) => {
    setSelectedItems(prev => {
      const next = { ...prev };
      if (next[itemKey]) {
        delete next[itemKey];
      } else {
        const item = items.find(i => `${i.itemId}-${i.itemSizeId}` === itemKey);
        next[itemKey] = item?.quantity || 1;
      }
      return next;
    });
  };

  const updateQty = (itemKey: string, qty: number, max: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemKey]: Math.min(max, Math.max(1, qty))
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(selectedItems).length === 0) return;
    
    setIsSubmitting(true);
    try {
      const returnData = Object.entries(selectedItems).map(([key, quantity]) => {
        const [itemId, itemSizeId] = key.split('-');
        return { itemId, itemSizeId, quantity };
      });

      const transactionId = await initiateReturn(user.id, returnData);
      router.push(`/transactions/${transactionId}/print-return`);
    } catch (error) {
      alert('Error initiating return');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/users/${user.id}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Initiate Return</h1>
            <p className="text-gray-500">Processing return for <span className="font-bold text-gray-900">{user.name}</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 text-white p-6 rounded-xl shadow-lg space-y-6 sticky top-8">
            <h3 className="font-bold text-lg border-b border-gray-700 pb-2 flex items-center">
              <RotateCcw className="h-5 w-5 mr-2 text-red-500" />
              Return Summary
            </h3>
            <div className="space-y-4">
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {Object.entries(selectedItems).map(([key, qty]) => {
                  const item = items.find(i => `${i.itemId}-${i.itemSizeId}` === key);
                  return (
                    <div key={key} className="flex justify-between text-xs bg-gray-800 p-2 rounded">
                      <span className="truncate mr-2">{item?.name} ({item?.size})</span>
                      <span className="font-black text-red-400">x{qty}</span>
                    </div>
                  );
                })}
                {Object.keys(selectedItems).length === 0 && (
                  <p className="text-gray-500 text-xs italic">Select items to return...</p>
                )}
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={Object.keys(selectedItems).length === 0 || isSubmitting}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold transition-all flex items-center justify-center shadow-xl"
            >
              {isSubmitting ? 'Creating...' : 'Initiate & Print Return Sheet'}
              <ClipboardList className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Right Column: Items Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <Package className="h-5 w-5 mr-2 text-red-700" />
              Items Currently Signed Out
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map(item => {
                const itemKey = `${item.itemId}-${item.itemSizeId}`;
                const isSelected = !!selectedItems[itemKey];
                return (
                  <div
                    key={itemKey}
                    className={`relative p-4 rounded-xl border-2 transition-all flex flex-col ${
                      isSelected 
                        ? 'border-red-600 bg-red-50 shadow-md' 
                        : 'border-gray-100 hover:border-red-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-4 mb-3 cursor-pointer" onClick={() => toggleItem(itemKey)}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover border shadow-sm" />
                      ) : (
                        <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center border border-dashed">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-grow">
                        <h4 className="font-bold text-gray-900 text-sm">{item.name} - <span className="text-gray-500">{item.size}</span></h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Max Qty: {item.quantity}</p>
                      </div>
                      {isSelected && (
                        <div className="bg-red-600 rounded-full p-1">
                          <X className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {isSelected && (
                      <div className="mt-auto pt-3 border-t border-red-100 flex items-center justify-between">
                        <span className="text-[10px] font-black text-red-700 uppercase">Return Qty:</span>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => updateQty(itemKey, selectedItems[itemKey] - 1, item.quantity)}
                            className="w-6 h-6 rounded bg-white border border-red-200 flex items-center justify-center text-red-700 font-bold hover:bg-red-100"
                          >-</button>
                          <span className="font-black text-sm w-4 text-center">{selectedItems[itemKey]}</span>
                          <button 
                            onClick={() => updateQty(itemKey, selectedItems[itemKey] + 1, item.quantity)}
                            className="w-6 h-6 rounded bg-white border border-red-200 flex items-center justify-center text-red-700 font-bold hover:bg-red-100"
                          >+</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {items.length === 0 && (
                <div className="col-span-2 py-12 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                  <p className="italic">No items available for return.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
