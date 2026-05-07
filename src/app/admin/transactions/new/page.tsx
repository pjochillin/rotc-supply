import { prisma } from "@/lib/prisma";
import NewSignOutForm from "@/components/NewSignOutForm";

export default async function NewSignOutPage() {
  const [users, items] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: 'asc' } }),
    prisma.item.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return <NewSignOutForm users={users} items={items} />;
}
