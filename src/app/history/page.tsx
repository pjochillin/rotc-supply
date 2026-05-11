import { prisma } from "@/lib/prisma";
import HistoryClientPage from "./HistoryClientPage";

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
    },
  });

  const history = historyData.map(t => {
    const isReturn = ['RETURN_IN_PROGRESS', 'RETURNED'].includes(t.status);

    return {
      id: t.id,
      items: t.items.map(i => {
        const sizeStr = i.details.length > 0 
          ? ` (${i.details.map(d => `${d.itemSize.size} x${d.quantity}`).join(', ')})`
          : '';
        return `${i.item.name}${sizeStr}`;
      }),
      recipient: t.recipient?.name ?? t.recipientName,
      initiatorName: t.initiatorName,
      completerName: t.completerName ?? null,
      date: (isReturn ? t.returnDate : t.checkoutDate)?.toLocaleDateString() ?? 'N/A',
      type: t.status,
      status: t.status,
      isReturn,
      createdAt: t.createdAt,
      completedAt: t.completedAt,
    };
  }).sort((a, b) => {
    const dateA = a.completedAt || a.createdAt;
    const dateB = b.completedAt || b.createdAt;
    return dateB.getTime() - dateA.getTime();
  });

  return <HistoryClientPage history={history} />;
}
