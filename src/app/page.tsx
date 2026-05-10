import { prisma } from "@/lib/prisma";
import { Package, Edit, UserPlus, Plus, Clock, ClipboardList, CheckCircle2, Printer, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { deleteItem } from "@/app/actions";
import Link from "next/link";
import DeleteTransactionButton from "@/components/DeleteTransactionButton";
import DeleteItemButton from "@/components/DeleteItemButton";

export default async function Home() {
  const [items, users, inProgressTransactions, totalItemsCount, activeTransactionsCount, usersCount, recentTransactionsData] = await Promise.all([
    prisma.item.findMany({ 
      include: { sizes: true },
      orderBy: { updatedAt: 'desc' } 
    }),
    prisma.user.findMany({ orderBy: { name: 'asc' } }),
    prisma.transaction.findMany({
      where: { status: { in: ['IN_PROGRESS', 'RETURN_IN_PROGRESS'] } },
      include: { 
        recipient: true,
        initiator: true,
        completer: true,
        items: { include: { item: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.item.count(),
    prisma.transaction.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.user.count(),
    prisma.transaction.findMany({
      take: 5,
      orderBy: { checkoutDate: 'desc' },
      include: { 
        items: {
          include: { item: true }
        }, 
        recipient: true,
        initiator: true,
        completer: true,
      },
    }),
  ]);

  const stats = [
    { name: 'Total Items', value: totalItemsCount.toString(), icon: Package, change: '+0', changeType: 'increase' },
    { name: 'Active Sign-outs', value: activeTransactionsCount.toString(), icon: Clock, change: '+0', changeType: 'increase' },
    { name: 'Registered Users', value: usersCount.toString(), icon: Users, change: '+0', changeType: 'increase' },
  ];

  const recentTransactions = recentTransactionsData.map(t => ({
    id: t.id,
    item: t.items.length > 0 ? `${t.items[0].item.name}${t.items.length > 1 ? ` +${t.items.length - 1} more` : ''}` : 'No items',
    recipient: t.recipient.name,
    initiator: t.initiator.name,
    completer: t.completer?.name,
    date: t.checkoutDate.toLocaleDateString(),
    status: t.status,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Supply Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Overview of the ROTC supply inventory and activity.
          </p>
        </div>
        <Link
          href="/transactions/new"
          className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl shadow-lg text-white bg-red-700 hover:bg-red-800 transition-all"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          New Sign Out
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-xl bg-white px-4 pt-5 pb-12 shadow-sm border border-gray-200 sm:px-6 sm:pt-6"
          >
            <dt>
              <div className="absolute rounded-lg bg-red-700 p-3">
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-bold text-gray-900">{item.value}</p>

            </dd>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2/3: Main Management Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Handouts (In Progress) Section */}
          <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-red-100">
            <div className="px-6 py-4 border-b border-red-100 bg-red-50/50 flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-red-700 mr-2" />
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Active Transactions</h2>
              </div>
              <span className="bg-red-700 text-white text-xs font-black px-2.5 py-1 rounded-full">
                {inProgressTransactions.length}
              </span>
            </div>
            <div className="p-0">
              {inProgressTransactions.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <p className="italic text-sm">No active transactions in progress.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 table-fixed">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest w-1/4">Cadet</th>
                        <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Items</th>
                        <th className="px-6 py-3 text-right text-xs font-black text-gray-500 uppercase tracking-widest w-48">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {inProgressTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-red-50/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">{t.recipient.name}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase">
                              {t.status === 'IN_PROGRESS' ? 'Issue' : 'Return'} by {t.initiator.name} • {t.checkoutDate.toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {t.items.map(i => (
                                <span key={i.id} className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-full font-bold text-gray-600">
                                  {i.item.name} <span className="text-red-700 ml-1">x{i.authQuantity}</span>
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end items-center space-x-3">
                              <Link 
                                href={t.status === 'IN_PROGRESS' ? `/transactions/${t.id}/print` : `/transactions/${t.id}/print-return`} 
                                className="text-gray-500 hover:text-gray-900"
                              >
                                <Printer className="h-4 w-4" />
                              </Link>
                              <Link 
                                href={t.status === 'IN_PROGRESS' ? `/transactions/complete/${t.id}` : `/transactions/return/confirm/${t.id}`} 
                                className="text-green-600 hover:text-green-800"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Link>
                              <DeleteTransactionButton transactionId={t.id} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Inventory Section */}
          <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center">
                <Package className="h-5 w-5 text-red-700 mr-2" />
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Inventory Management</h2>
              </div>
              <Link
                href="/add-item"
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-bold rounded-lg text-white bg-red-700 hover:bg-red-800 shadow-sm transition-all"
              >
                <Plus className="-ml-0.5 mr-1 h-4 w-4" aria-hidden="true" />
                Add Item
              </Link>
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
                            <img src={item.imageUrl} alt="" className="h-8 w-8 rounded object-cover mr-3 border" />
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
                            </div>                          </div>
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
          </div>
        </div>

        {/* Right 1/3: Users & Recent Activity */}
        <div className="space-y-8">
          {/* Users Section */}
          <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-red-700 mr-2" />
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Users</h2>
              </div>
            </div>
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto font-sans">
              {users.map((user) => (
                <Link 
                  key={user.id} 
                  href={`/users/${user.id}`}
                  className="flex items-center px-6 py-5 hover:bg-red-50 transition-all group border-l-4 border-transparent hover:border-red-700 relative"
                >
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <p className="text-base font-black text-gray-900 group-hover:text-red-700 transition-colors leading-tight">{user.name}</p>
                    </div>
                    <div className="flex items-center mt-1">
                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider px-2 py-0.5 bg-gray-100 rounded border border-gray-200">{user.role}</span>
                      <span className="text-[10px] text-gray-400 ml-2 font-medium">{user.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">View Profile</span>
                    <ArrowUpRight className="h-5 w-5 text-red-700" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Recent Activity</h2>
            </div>
            <div className="p-6">
              <ul className="space-y-4">
                {recentTransactions.map((t) => (
                  <li key={t.id} className="relative pl-4 border-l-2 border-red-700">
                    <p className="text-xs font-black text-gray-900">{t.item}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">
                      <span>{t.recipient}</span>
                      <span className="font-normal normal-case text-gray-400"> {
                        t.status === 'RETURN_IN_PROGRESS' ? 'returning' :
                        t.status === "IN_PROGRESS" ? 'signing out' : 
                        t.status === "COMPLETED" ? 'signed out' : 'returned'
                      }</span>
                      <span className="font-normal normal-case text-gray-400"> on </span>
                      <span>{t.date}</span>
                    </p>
                    <span className={`inline-block mt-1 text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                      t.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' : 
                      t.status === 'RETURN_IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      t.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {t.status.replace(/_/g, ' ')}
                    </span>
                  </li>
                ))}
              </ul>
              <Link href="/history" className="block text-center mt-6 text-xs font-black text-red-700 hover:text-red-800 uppercase tracking-widest">
                View All History
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
