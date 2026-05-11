'use client';

import { useState, useEffect, Suspense } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { completeReturn, getUserOcie, getUser, getTransaction } from '@/app/actions';

function ConfirmReturnForm({ transactionId }: { transactionId: string }) {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [ocieRecord, setOcieRecord] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quantities, setQuantities] = useState<{ [itemSizeId: string]: number }>({});

  useEffect(() => {
    async function fetchData() {
      if (!transactionId || ocieRecord.length > 0) {
        setLoading(false);
        return;
      }
      try {
        const transaction = await getTransaction(transactionId);
        if (!transaction) throw new Error('Transaction not found');
        const userId = transaction.recipientId;

        if (!userId) {
          throw new Error("User ID not found for this transaction.");
        }

        const [userData, ocieData] = await Promise.all([
          getUser(userId),
          getUserOcie(userId),
        ]);

        if (!userData) throw new Error('Could not load user data');

        setUser(userData);
        setOcieRecord(ocieData);

        const initialQuantities: { [key: string]: number } = {};
        ocieData.forEach((item: any) => {
          initialQuantities[item.itemSizeId] = 0;
        });
        setQuantities(initialQuantities);

      } catch (error) {
        console.error('Failed to load return data:', error);
        alert((error as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [transactionId]);

  const handleQuantityChange = (itemSizeId: string, value: string) => {
    const qty = parseInt(value, 10);
    setQuantities((prev) => ({
      ...prev,
      [itemSizeId]: isNaN(qty) ? 0 : qty,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const itemsToReturn = ocieRecord.filter(item => quantities[item.itemSizeId] > 0)
      .map(item => ({
        itemId: item.itemId,
        itemSizeId: item.itemSizeId,
        quantity: quantities[item.itemSizeId],
      }));

    try {
      // We may need to adjust completeReturn to handle this payload
      // It now expects a simpler structure based on what's being returned.
      await completeReturn(transactionId, itemsToReturn);
      alert('Return completed successfully!');
      router.push(`/users/${user.id}`);
      router.refresh();
    } catch (error) {
      console.error('Failed to complete return:', error);
      alert('An error occurred while completing the return.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading OCIE Record...</div>;
  }
  
  if (!user) {
    return <div className="text-center p-8 text-red-600">Could not load user data.</div>
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8 flex items-center space-x-4">
        <Link href={`/users/${user.id}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Complete Cadet Return</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="hidden md:flex justify-between items-center">
          <p className="text-lg font-bold text-gray-800">Cadet: {user.name}</p>
          <Link
            href={`/transactions/${transactionId}/print-return`}
            target="_blank"
            className="px-4 py-2 rounded-lg border border-blue-600 bg-white text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
          >
            Print Return Form
          </Link>
        </div>
        <div className="md:hidden">
            <p className="text-lg font-bold text-gray-800">Cadet: {user.name}</p>
            <Link
                href={`/transactions/${transactionId}/print-return`}
                target="_blank"
                className="mt-2 block w-full text-center px-4 py-2 rounded-lg border border-blue-600 bg-white text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
            >
                Print Return Form
            </Link>
        </div>
        <p className="text-sm text-gray-600">Enter the quantity of each item being returned. All other items will remain on the cadet's record.</p>

        {/* Mobile View */}
        <div className="space-y-4 md:hidden">
          {ocieRecord.map((item) => (
            <div key={`${item.itemSizeId}-mobile`} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                <div className="font-medium text-gray-900">
                  {item.name}
                  {item.size !== 'Standard' && <span className="text-gray-500"> - {item.size}</span>}
                </div>
                <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 uppercase font-bold">Issued</div>
                    <div className="text-sm font-bold text-gray-800">{item.quantity}</div>
                  </div>
                  <div className="flex items-center space-x-2 rounded-lg bg-gray-50 p-2">
                    <label htmlFor={`quantity-${item.itemSizeId}-mobile`} className="text-xs text-gray-500 uppercase font-bold">Returning</label>
                    <input
                      type="number"
                      id={`quantity-${item.itemSizeId}-mobile`}
                      min="0"
                      max={item.quantity}
                      value={quantities[item.itemSizeId] || 0}
                      onChange={(e) => handleQuantityChange(item.itemSizeId, e.target.value)}
                      className="w-20 text-center rounded-md border-gray-300 shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Currently Issued</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">Quantity to Return</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {ocieRecord.map((item) => (
                <tr key={`${item.itemSizeId}-desktop`}>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{item.size}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-center text-sm font-bold text-gray-800">{item.quantity}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-500 bg-gray-50">
                    <input
                      type="number"
                      id={`quantity-${item.itemSizeId}-desktop`}
                      min="0"
                      max={item.quantity}
                      value={quantities[item.itemSizeId] || 0}
                      onChange={(e) => handleQuantityChange(item.itemSizeId, e.target.value)}
                      className="w-20 text-center rounded-md border-gray-300 shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end items-center space-x-4 mt-6">
          <Link href={`/users/${user.id}`} className="px-6 py-3 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-8 py-3 rounded-lg bg-green-600 text-sm font-semibold text-white hover:bg-green-700 shadow-md flex items-center transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Processing Return...' : 'Complete Return'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ConfirmReturnPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);

  return (
    <Suspense fallback={<div className="text-center p-8">Loading OCIE Record...</div>}>
      <ConfirmReturnForm transactionId={resolvedParams.id} />
    </Suspense>
  );
}
