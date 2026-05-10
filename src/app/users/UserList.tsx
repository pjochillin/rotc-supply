import { prisma } from "@/lib/prisma";
import UserClientPage from "./UserClientPage";

export default async function UserList() {
  const usersData = await prisma.user.findMany({
    include: {
      receivedTransactions: {
        where: { status: { in: ['COMPLETED', 'RETURNED'] } },
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

  const users = usersData.map(user => {
    const itemMap = new Map<string, { quantity: number }>();

    // Process COMPLETED transactions to add items
    user.receivedTransactions
      .filter(t => t.status === 'COMPLETED')
      .flatMap(t => t.items)
      .flatMap(i => i.details.map(d => ({ itemSizeId: d.itemSizeId, quantity: d.quantity })))
      .forEach(item => {
        const existing = itemMap.get(item.itemSizeId);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          itemMap.set(item.itemSizeId, { quantity: item.quantity });
        }
      });

    // Process RETURNED transactions to subtract items
    user.receivedTransactions
      .filter(t => t.status === 'RETURNED')
      .flatMap(t => t.items)
      .flatMap(i => i.details.map(d => ({ itemSizeId: d.itemSizeId, quantity: d.quantity })))
      .forEach(returnedItem => {
        const existing = itemMap.get(returnedItem.itemSizeId);
        if (existing) {
          existing.quantity -= returnedItem.quantity;
        }
      });

    // Filter out items with zero or negative quantity and sum the rest
    const totalItems = Array.from(itemMap.values()).reduce((acc, item) => acc + (item.quantity > 0 ? item.quantity : 0), 0);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      items: totalItems,
    };
  });

  return <UserClientPage users={users} />;
}
