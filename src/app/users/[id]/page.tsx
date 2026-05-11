import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { User, Package, History, ArrowLeft, Clock, CheckCircle2, Printer, RotateCcw } from "lucide-react";
import Link from "next/link";
import { DeleteUserButton } from '@/components/DeleteUserButton';
import TransactionDetailModal from '@/components/TransactionDetailModal';
import ToggleRoleButton from '@/components/ToggleRoleButton';

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      receivedTransactions: {
        include: {
          items: {
            include: {
              item: true,
              details: {
                include: {
                  itemSize: true
                }
              }
            }
          }
        },
        orderBy: { checkoutDate: 'desc' }
      }
    }
  });

  if (!user) notFound();

  const itemMap = new Map<string, { name: string; size: string; quantity: number; imageUrl: string | null; }>();

  // Process COMPLETED transactions to add items
  user.receivedTransactions
    .filter(t => t.status === 'COMPLETED')
    .flatMap(t => t.items)
    .flatMap(i => i.details.map(d => ({
      itemSizeId: d.itemSizeId,
      name: i.item.name,
      size: d.itemSize.size,
      quantity: d.quantity,
      imageUrl: i.item.imageUrl
    })))
    .forEach(item => {
      const existing = itemMap.get(item.itemSizeId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        itemMap.set(item.itemSizeId, { ...item });
      }
    });

  // Process RETURNED transactions to subtract items
  user.receivedTransactions
    .filter(t => t.status === 'RETURNED')
    .flatMap(t => t.items)
    .flatMap(i => i.details.map(d => ({
      itemSizeId: d.itemSizeId,
      quantity: d.quantity
    })))
    .forEach(returnedItem => {
      const existing = itemMap.get(returnedItem.itemSizeId);
      if (existing) {
        existing.quantity -= returnedItem.quantity;
      }
    });

  // Filter out items with zero or negative quantity and convert map to array
  const currentlySignedOut = Array.from(itemMap.values()).filter(item => item.quantity > 0);


  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-4 sm:mb-8 flex flex-col">
        <div className="flex items-center justify-between sm:hidden mb-4">
          <Link href="/users" className="flex items-center text-gray-600 hover:text-gray-800">
            <ArrowLeft className="h-5 w-5 mr-1" />
            <span className="font-bold">Back to Users</span>
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Link href="/users" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hidden sm:block">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-500 font-medium">{user.email} • <span className="uppercase text-xs font-black">{user.role}</span></p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2">
              <Link
                href={`/users/${id}/print-ocie`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all"
              >
                <Printer className="mr-2 h-4 w-4 text-red-700" />
                Print OCIE Record
              </Link>
              <ToggleRoleButton userId={user.id} currentRole={user.role} currentUserId={session?.user?.id} />
              {currentlySignedOut.length > 0 ? (
                <Link
                  href={`/transactions/return/new?userId=${id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-bold rounded-xl text-white bg-red-700 hover:bg-red-800 transition-all"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Process Return
                </Link>
              ) : (
                <button
                  disabled
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-bold rounded-xl text-white bg-gray-400 cursor-not-allowed"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Process Return
                </button>
              )}
              <DeleteUserButton userId={id} />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Current Items */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-red-100">
            <div className="px-6 py-4 border-b border-red-100 bg-red-50/50 flex items-center">
              <Package className="h-5 w-5 text-red-700 mr-2" />
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Currently Signed Out</h2>
            </div>
            <div className="p-0">
              {currentlySignedOut.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <p className="italic text-sm">No items currently signed out.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {currentlySignedOut.map((item, idx) => (
                    <div key={idx} className="flex items-center px-6 py-4">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover border mr-4" />
                      ) : (
                        <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4 border border-dashed">
                          <Package className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-grow">
                        <p className="text-sm font-bold text-gray-900">{item.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-black">{item.size} • Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Transaction History */}
        <div className="lg:col-span-2 space-y-6">

          <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center">
              <History className="h-5 w-5 text-gray-900 mr-2" />
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Transaction History</h2>
            </div>
            <div className="p-0">
              {/* Desktop Table View */}
              <div className="hidden sm:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Items</th>
                      <th className="px-6 py-3 text-right text-xs font-black text-gray-500 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {user.receivedTransactions.map((t) => (
                      <tr key={t.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {t.checkoutDate.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {t.items.map(i => (
                              <div key={i.id} className="text-[10px] bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md font-bold text-gray-600">
                                {i.item.name}
                                {i.details.length > 0 && (
                                  <span className="text-red-700 ml-1">
                                    ({i.details.map(d => d.itemSize.size === 'Standard' ? `x${d.quantity}` : `${d.itemSize.size} x${d.quantity}`).join(', ')})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end">
                            <span className={`inline-block text-[8px] font-black uppercase px-2 py-1 rounded-full ${
                              t.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' : 
                              t.status === 'RETURN_IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                              t.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {t.status.replace(/_/g, ' ')}
                            </span>
                            <TransactionDetailModal transaction={{
                              id: t.id,
                              items: t.items.map(i => {
                                const sizeStr = i.details.length > 0 
                                  ? ` (${i.details.map(d => `${d.itemSize.size} x${d.quantity}`).join(', ')})`
                                  : '';
                                return `${i.item.name}${sizeStr}`;
                              }),
                              recipient: user.name,
                              initiator: t.initiatorName,
                              completer: t.completerName ?? null,
                              date: t.checkoutDate.toLocaleDateString(),
                              type: t.status.includes('RETURN') ? 'Return' : 'Issue',
                              status: t.status,
                              isReturn: t.status.includes('RETURN'),
                              createdAt: t.createdAt,
                              completedAt: t.completedAt,
                            }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="sm:hidden">
                <ul role="list" className="divide-y divide-gray-200">
                  {user.receivedTransactions.map((t) => (
                    <li key={t.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-shrink-0 mr-4">
                          <div className="text-sm font-bold text-gray-900">{t.checkoutDate.toLocaleDateString()}</div>
                          <span className={`inline-block text-[8px] font-black uppercase mt-1 px-2 py-1 rounded-full ${
                            t.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' : 
                            t.status === 'RETURN_IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                            t.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {t.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex-grow">
                          <div className="flex flex-wrap gap-1">
                            {t.items.map(i => (
                              <div key={i.id} className="text-[10px] bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md font-bold text-gray-600">
                                {i.item.name}
                                {i.details.length > 0 && (
                                  <span className="text-red-700 ml-1">
                                    ({i.details.map(d => d.itemSize.size === 'Standard' ? `x${d.quantity}` : `${d.itemSize.size} x${d.quantity}`).join(', ')})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-2">
                          <TransactionDetailModal transaction={{
                              id: t.id,
                              items: t.items.map(i => {
                                const sizeStr = i.details.length > 0 
                                  ? ` (${i.details.map(d => `${d.itemSize.size} x${d.quantity}`).join(', ')})`
                                  : '';
                                return `${i.item.name}${sizeStr}`;
                              }),
                              recipient: user.name,
                              initiator: t.initiatorName,
                              completer: t.completerName ?? null,
                              date: t.checkoutDate.toLocaleDateString(),
                              type: t.status.includes('RETURN') ? 'Return' : 'Issue',
                              status: t.status,
                              isReturn: t.status.includes('RETURN'),
                              createdAt: t.createdAt,
                              completedAt: t.completedAt,
                            }} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
