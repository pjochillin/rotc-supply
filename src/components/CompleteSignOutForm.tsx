'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowLeft, Package, Info, Plus, Trash2 } from 'lucide-react';
import { completeSignOut } from '@/app/actions';
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
  recipient: { name: string | null };
  items: TransactionItem[];
}

export default function CompleteSignOutForm({ 
  transaction 
}: { 
  transaction: Transaction 
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Track multiple size selections per transaction item
  const [itemDetails, setItemDetails] = useState<Record<string, { itemSizeId: string; quantity: number }[]>>(() => {
    const initial: Record<string, { itemSizeId: string; quantity: number }[]> = {};
    transaction.items.forEach(tItem => {
      initial[tItem.id] = [{ itemSizeId: '', quantity: tItem.authQuantity }];
    });
    return initial;
  });

  const validationErrors = useMemo(() => {
    const errors: Record<string, Record<number, string | null>> = {};
    for (const tItem of transaction.items) {
      errors[tItem.id] = {};
      const details = itemDetails[tItem.id];
      for (const [index, detail] of details.entries()) {
        if (detail.quantity > 0 && detail.itemSizeId) {
          const size = tItem.item.sizes.find(s => s.id === detail.itemSizeId);
          if (size && detail.quantity > size.availableQuantity) {
            errors[tItem.id][index] = `Max: ${size.availableQuantity}`;
          } else {
            errors[tItem.id][index] = null;
          }
        } else {
          errors[tItem.id][index] = null;
        }
      }
    }
    return errors;
  }, [itemDetails, transaction.items]);

  const hasStockErrors = useMemo(() =>
    Object.values(validationErrors).some(itemErrors =>
      Object.values(itemErrors).some(error => error !== null)
    ),
  [validationErrors]);

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

  const isFormValid = useMemo(() => {
    const hasAtLeastOneItem = Object.values(itemDetails)
      .flat()
      .some(d => d.quantity > 0);

    const allRowsHaveSizeIfNotEmpty = transaction.items.every(tItem =>
      itemDetails[tItem.id].every(d => d.quantity === 0 || (d.quantity > 0 && d.itemSizeId))
    );

    return hasAtLeastOneItem && allRowsHaveSizeIfNotEmpty && !hasStockErrors;
  }, [itemDetails, transaction.items, hasStockErrors]);

  const handleSubmit = async () => {
    if (!isFormValid) return;
    
    setIsSubmitting(true);
    try {
      const formattedData = Object.entries(itemDetails).map(([id, details]) => ({
        transactionItemId: id,
        details
      }));

      await completeSignOut(transaction.id, formattedData);
      router.push('/');
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error completing sign-out');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Complete Sign Out</h1>
            <p className="text-gray-500 text-sm">Assigning items for <span className="font-bold text-gray-900">{transaction.recipient.name}</span></p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-8 flex items-start">
        <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-700 font-medium">
          Select the actual sizes and quantities that were physically handed out. You can add multiple sizes for a single item if needed.
        </p>
      </div>

      <div className="space-y-8">
        {transaction.items.map((tItem) => (
          <div key={tItem.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                  <p className="text-xs font-black text-red-700 uppercase tracking-wider">Authorized: {tItem.authQuantity}</p>
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
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Size Provided</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {tItem.item.sizes.map(size => (
                        <button
                          key={size.id}
                          type="button"
                          disabled={size.availableQuantity <= 0 || detail.quantity === 0}
                          onClick={() => updateSizeRow(tItem.id, idx, 'itemSizeId', size.id)}
                          className={`flex flex-col items-center justify-center p-2 border-2 rounded-lg transition-all ${
                            detail.itemSizeId === size.id
                              ? 'border-red-600 bg-red-50 text-red-700 shadow-sm'
                              : size.availableQuantity <= 0
                              ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50'
                              : 'border-white bg-white hover:border-red-200 text-gray-600 shadow-sm'
                          }`}
                        >
                          <span className="text-[10px] font-black uppercase">{size.size}</span>
                          <span className="text-[9px] font-bold">{size.availableQuantity}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Quantity Given</label>
                    <input
                      type="number"
                      min="0"
                      value={detail.quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        updateSizeRow(tItem.id, idx, 'quantity', isNaN(value) ? 0 : value);
                      }}
                      className={`w-full rounded-lg border-gray-200 focus:ring-2 focus:ring-red-500 p-3 border font-bold ${validationErrors[tItem.id]?.[idx] ? 'border-red-500 text-red-600' : ''}`}
                    />
                    {validationErrors[tItem.id]?.[idx] && (
                      <p className="text-red-600 text-xs font-bold mt-1">{validationErrors[tItem.id][idx]}</p>
                    )}
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
          className="px-12 py-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black text-lg shadow-xl transition-all flex items-center group"
        >
          {isSubmitting ? 'Processing...' : 'Complete & Update Inventory'}
          <CheckCircle2 className="ml-3 h-6 w-6 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
}
