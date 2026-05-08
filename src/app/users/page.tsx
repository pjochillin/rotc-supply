import { Users, Plus, Search, Mail } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function UsersPage() {
  // Fetch real data from Prisma
  const usersData = await prisma.user.findMany({
    include: {
      transactions: {
        where: { status: { in: ['IN_PROGRESS', 'COMPLETED'] } },
        include: {
          items: {
            include: {
              details: true
            }
          }
        }
      }
    },
    orderBy: { name: 'asc' },
  });

  const users = usersData.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    items: user.transactions.reduce((acc, t) => {
      const itemsInTransaction = t.items.reduce((sum, i) => {
        const detailsSum = i.details.reduce((dSum, d) => dSum + d.quantity, 0);
        return sum + (detailsSum || i.authQuantity);
      }, 0);
      return acc + itemsInTransaction;
    }, 0),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage cadets and staff who can sign out items.
          </p>
        </div>
        <Link
          href="/users/new"
          className="inline-flex items-center rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
          Add User
        </Link>
      </div>

      <div className="relative flex-grow max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6"
          placeholder="Search users..."
        />
      </div>

      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                Name
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Email
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Role
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Items Out
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-red-50/50 transition-colors group">
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                  <div className="flex items-center">
                    <span className="font-bold">
                      {user.name}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Mail className="h-3 w-3 mr-1.5 text-gray-400" />
                    {user.email}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 uppercase font-black text-[10px]">
                  {user.role}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    user.items > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {user.items} items
                  </span>
                </td>
                <td className="py-4 pr-4 text-sm font-medium sm:pr-6 text-right w-32 pl-3">
                  <Link href={`/users/${user.id}`} className="text-red-700 group-hover:underline flex items-center justify-end font-bold">
                    View Profile
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
