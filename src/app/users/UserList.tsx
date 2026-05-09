import { prisma } from "@/lib/prisma";
import UserClientPage from "./UserClientPage";

export default async function UserList() {
  const usersData = await prisma.user.findMany({
    include: {
      receivedTransactions: {
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
    items: user.receivedTransactions.reduce((acc, t) => {
      const itemsInTransaction = t.items.reduce((sum, i) => {
        const detailsSum = i.details.reduce((dSum, d) => dSum + d.quantity, 0);
        return sum + (detailsSum || i.authQuantity);
      }, 0);
      return acc + itemsInTransaction;
    }, 0),
  }));

  return <UserClientPage users={users} />;
}
