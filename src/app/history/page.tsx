import { History, Calendar, User, Package } from "lucide-react";
import { prisma } from "@/lib/prisma";

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
      user: true,
    },
    orderBy: { checkoutDate: 'desc' },
  });

  const history = historyData.map(t => ({
    id: t.id,
    item: t.items.map(i => {
      const sizeStr = i.details.length > 0 
        ? ` (${i.details.map(d => `${d.itemSize.size} x${d.quantity}`).join(', ')})`
        : '';
      return `${i.item.name}${sizeStr}`;
    }).join(' + '),
    user: t.user.name,
    date: t.checkoutDate.toLocaleDateString(),
    type: t.status === 'COMPLETED' ? 'Checkout' : t.status === 'IN_PROGRESS' ? 'Handout Init' : 'Return',
    status: t.status === 'IN_PROGRESS' ? 'Active' : 'Completed',
  }));

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
                      item.type === 'Checkout' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {item.type === 'Checkout' ? <Package className="h-5 w-5" /> : <History className="h-5 w-5" />}
                    </div>
                    <p className="truncate text-sm font-medium text-red-700">{item.item}</p>
                  </div>
                  <div className="ml-2 flex flex-shrink-0">
                    <p className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      item.status === 'Active' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {item.status}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      <User className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
                      {item.user}
                    </p>
                    <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                      <Calendar className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
                      {item.date}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>
                      {item.type}
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
