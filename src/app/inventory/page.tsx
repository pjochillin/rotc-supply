import { Package, Search, Filter, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function InventoryPage() {
  // Fetch real data from Prisma
  const [itemsData, usersData] = await Promise.all([
    prisma.item.findMany({
      include: { sizes: true },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  const items = itemsData.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    room: item.room,
    shelf: item.shelf,
    imageUrl: item.imageUrl,
    sizes: item.sizes.map(s => ({
      id: s.id,
      size: s.size,
      total: s.totalQuantity,
      available: s.availableQuantity,
    })),
  }));

  const users = usersData.map(user => ({
    id: user.id,
    name: user.name,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your supply items and stock levels.
          </p>
        </div>
        <Link
          href="/add-item"
          className="inline-flex items-center rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
          Add Item
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6"
            placeholder="Search items..."
          />
        </div>
        <button className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
          <Filter className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
          Filter
        </button>
      </div>

      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                Item Name
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Sizes & Availability
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Location
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                  <div className="flex items-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-10 w-10 rounded-md object-cover mr-3 border shadow-sm" />
                    ) : (
                      <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center mr-3 border border-dashed">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-gray-900">{item.name}</div>
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        {item.category}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 text-sm text-gray-500">
                  <div className="flex flex-wrap gap-2">
                    {item.sizes.map(s => (
                      <div key={s.id} className="flex flex-col border rounded p-1 min-w-[60px] bg-gray-50">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{s.size}</span>
                        <div className="flex items-baseline space-x-1">
                          <span className={`text-sm font-bold ${s.available < 3 ? 'text-red-600' : 'text-gray-900'}`}>
                            {s.available}
                          </span>
                          <span className="text-[10px] text-gray-400">/ {s.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <div className="text-xs text-gray-400">Room: {item.room || '-'}</div>
                  <div className="font-medium text-gray-700">Shelf: {item.shelf || '-'}</div>
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <Link 
                    href={`/edit-item/${item.id}`} 
                    className="text-red-700 hover:text-red-900 mr-4 font-medium"
                  >
                    Edit
                  </Link>
                  <Link 
                    href="/transactions/new"
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Sign Out
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
