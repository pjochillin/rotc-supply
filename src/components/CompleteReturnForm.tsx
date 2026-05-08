'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowLeft, Package, Info, Plus, Trash2, RotateCcw } from 'lucide-react';
import { completeReturn } from '@/app/actions';
import Link from 'next/link';

interface Size {
  id: string;
  size: string;
  availableQuantity: number;
}

interface Item {
  id: string;
  name: string;
  imageUrl: string | null;
  sizes: Size[];
}

interface TransactionItem {
  id: string;
  itemId: string;
  item: Item;
  authQuantity: number;
}

interface Transaction {
  id: string;
  userId: string;
  user: { name: string };
  items: TransactionItem[];
}

export default function CompleteReturnForm({ 
  transaction 
}: { 
  transaction: Transaction 
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [itemDetails, setItemDetails] = useState<Record<string, { itemSizeId: string; quantity: number }[]>>(() => {
    const initial: Record<string, { itemSizeId: string; quantity: number }[]> = {};
    transaction.items.forEach(tItem => {
      initial[tItem.id] = [{ itemSizeId: '', quantity: tItem.authQuantity }];
    });
    return initial;
  });

  const addSizeRow = (transactionItemId: string) => {
    setItemDetails(prev => ({
      ...prev,
      [transactionItemId]: [...prev[transactionItemId], { itemSizeId: '', quantity: 1 }]
    }));
  };

  const removeSizeRow = (transactionItemId: string, index: number) => {
    setItemDetails(prev => ({
      ...prev,
      [transactionItemId]: prev[transactionItemId].filter((_, i) => i !== index)
    }));
  };

  const updateSizeRow = (transactionItemId: string, index: number, field: 'itemSizeId' | 'quantity', value: string | number) => {
    setItemDetails(prev => ({
      ...prev,
      [transactionItemId]: prev[transactionItemId].map((row, i) => 
        i === index ? { ...row, [field]: value } : row
      )
    }));
  };

  const isFormValid = transaction.items.every(tItem => 
    itemDetails[tItem.id].length > 0 && 
    itemDetails[tItem.id].every(d => d.itemSizeId && d.quantity > 0)
  );

  const handleSubmit = async () => {
    if (!isFormValid) return;
    
    setIsSubmitting(true);
    try {
      const itemsToReturn: { itemId: string; itemSizeId: string; quantity: number }[] = [];
      for (const transactionItemId in itemDetails) {
        const transactionItem = transaction.items.find(item => item.id === transactionItemId);
        if (transactionItem) {
          const { itemId } = transactionItem;
          const details = itemDetails[transactionItemId];
          for (const detail of details) {
            itemsToReturn.push({
              itemId,
              itemSizeId: detail.itemSizeId,
              quantity: detail.quantity,
            });
          }
        }
      }

      await completeReturn(transaction.id, itemsToReturn);
      router.push(`/users/${transaction.userId}`);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error completing return');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/users/${transaction.userId}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Complete Return</h1>
            <p className="text-gray-500 text-sm">Logging returned items for <span className="font-bold text-gray-900">{transaction.user.name}</span></p>
          </div>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-8 flex items-start">
        <Info className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-red-700 font-medium">
          Confirm the actual sizes and quantities that were physically returned. These will be added back to the inventory stock.
        </p>
      </div>

      <div className="space-y-8">
        {transaction.items.map((tItem) => (
          <div key={tItem.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {tItem.item.imageUrl ? (
                  <img src={tItem.item.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover border bg-white" />
                ) : (
                  <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center border border-dashed">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">{tItem.item.name}</h3>
                  <p className="text-xs font-black text-red-700 uppercase tracking-wider">Expected Return: {tItem.authQuantity}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => addSizeRow(tItem.id)}
                className="flex items-center text-xs font-black text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
              >
                <Plus className="h-3 w-3 mr-1" /> Add Another Size
              </button>
            </div>

            <div className="p-6 space-y-4">
              {itemDetails[tItem.id].map((detail, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  <div className="md:col-span-7">
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Size Returned</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {tItem.item.sizes.map(size => (
                        <button
                          key={size.id}
                          type="button"
                          onClick={() => updateSizeRow(tItem.id, idx, 'itemSizeId', size.id)}
                          className={`flex flex-col items-center justify-center p-2 border-2 rounded-lg transition-all ${
                            detail.itemSizeId === size.id
                              ? 'border-red-600 bg-red-50 text-red-700 shadow-sm'
                              : 'border-white bg-white hover:border-red-200 text-gray-600 shadow-sm'
                          }`}
                        >
                          <span className="text-[10px] font-black uppercase">{size.size}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Quantity Returned</label>
                    <input
                      type="number"
                      min="1"
                      value={detail.quantity}
                      onChange={(e) => updateSizeRow(tItem.id, idx, 'quantity', parseInt(e.target.value))}
                      className="w-full rounded-lg border-gray-200 focus:ring-2 focus:ring-red-500 p-3 border font-bold"
                    />
                  </div>

                  <div className="md:col-span-1 flex justify-center">
                    <button
                      type="button"
                      disabled={itemDetails[tItem.id].length === 1}
                      onClick={() => removeSizeRow(tItem.id, idx)}
                      className="p-2 text-gray-300 hover:text-red-600 disabled:opacity-0 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className="px-12 py-4 bg-red-700 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black text-lg shadow-xl transition-all flex items-center group"
        >
          {isSubmitting ? 'Processing...' : 'Complete Return & Update Stock'}
          <RotateCcw className="ml-3 h-6 w-6 group-hover:rotate-180 transition-transform duration-500" />
        </button>
      </div>
    </div>
  );
}
