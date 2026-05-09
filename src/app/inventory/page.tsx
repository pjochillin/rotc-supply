import { prisma } from "@/lib/prisma";
import InventoryList from "@/components/InventoryList";

export default async function InventoryPage() {
  const itemsData = await prisma.item.findMany({
    include: { sizes: true },
    orderBy: { name: 'asc' },
  });

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

  return <InventoryList items={items} />;
}