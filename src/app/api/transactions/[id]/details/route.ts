import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ message: 'Not Found' }, { status: 404 });
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      user: true,
      items: {
        include: {
          item: true,
          details: true,
        },
      },
    },
  });

  if (!transaction || transaction.status !== 'RETURN_IN_PROGRESS') {
    return NextResponse.json({ message: 'Not Found' }, { status: 404 });
  }

  // Also fetch itemSize details for each transaction item
  const transactionItemsWithDetails = await Promise.all(
    transaction.items.map(async (tItem) => {
      // Assuming a transactionItem corresponds to a single itemSize for now.
      // If a transactionItem can have multiple itemSizes (via TransactionItemDetail),
      // this logic would need to be adjusted to aggregate them.
      const itemSize = await prisma.itemSize.findFirst({
        where: {
          transactionItemDetails: {
            some: {
              transactionItemId: tItem.id,
            },
          },
        },
      });

      return {
        ...tItem,
        itemSize: itemSize, // Attach itemSize directly
      };
    })
  );

  const responseData = {
    ...transaction,
    items: transactionItemsWithDetails,
  };

  return NextResponse.json(responseData);
}
