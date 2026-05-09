import { History, Calendar, User, Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import TransactionDetailModal from "@/components/TransactionDetailModal";

export default async function HistoryPage() {
  // Fetch real data from Prisma
  const historyData = await prisma.transaction.findMany({
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
      },
      recipient: true,
      initiator: true,
      completer: true,
    },
    orderBy: { checkoutDate: 'desc' },
  });

  const history = historyData.map(t => {
    const isReturn = ['RETURN_IN_PROGRESS', 'RETURNED'].includes(t.status);

    let typeText = '';
    if (t.status === 'IN_PROGRESS') typeText = 'Handout In Progress';
    if (t.status === 'COMPLETED') typeText = 'Checkout Completed';
    if (t.status === 'RETURN_IN_PROGRESS') typeText = 'Return In Progress';
    if (t.status === 'RETURNED') typeText = 'Return Completed';

    return {
      id: t.id,
      items: t.items.map(i => {
        const sizeStr = i.details.length > 0 
          ? ` (${i.details.map(d => `${d.itemSize.size} x${d.quantity}`).join(', ')})`
          : '';
        return `${i.item.name}${sizeStr}`;
      }),
      recipient: t.recipient.name,
      initiator: t.initiator.name,
      completer: t.completer?.name ?? null,
      date: (isReturn ? t.returnDate : t.checkoutDate)?.toLocaleDateString() ?? 'N/A',
      type: typeText,
      status: t.status,
      isReturn,
      createdAt: t.createdAt,
      completedAt: t.completedAt,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
        <p className="mt-1 text-sm text-gray-500">
          A full log of all sign-outs and returns.
        </p>
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
                      {item.items.map((itemName, index) => (
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
