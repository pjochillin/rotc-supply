import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import NewReturnForm from "@/components/NewReturnForm";

export default async function NewReturnPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ userId: string }> 
}) {
  const { userId } = await searchParams;
  
  if (!userId) notFound();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      transactions: {
        where: { status: 'COMPLETED' },
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

  // Extract unique items currently held
  const itemsMap: Record<string, any> = {};
  
  user.transactions.forEach(t => {
    t.items.forEach(i => {
      i.details.forEach(d => {
        const key = `${i.itemId}-${d.itemSizeId}`;
        if (itemsMap[key]) {
          itemsMap[key].quantity += d.quantity;
        } else {
          itemsMap[key] = {
            transactionId: i.transactionId,
            itemId: i.itemId,
            itemSizeId: d.itemSizeId,
            name: i.item.name,
            size: d.itemSize.size,
            quantity: d.quantity,
            imageUrl: i.item.imageUrl,
            category: i.item.category
          };
        }
      });
    });
  });

  const items = Object.values(itemsMap);

  return <NewReturnForm user={user} items={items} />;
}
