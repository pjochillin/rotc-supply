'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Item Actions
export async function createItem(formData: FormData) {
  const name = formData.get('name') as string;
  const category = formData.get('category') as string;
  const room = formData.get('room') as string;
  const shelf = formData.get('shelf') as string;
  const imageUrl = formData.get('imageUrl') as string;
  
  const sizesJson = formData.get('sizes') as string;
  const sizesData = JSON.parse(sizesJson);

  await prisma.item.create({
    data: {
      name,
      category,
      room,
      shelf,
      imageUrl,
      sizes: {
        create: sizesData.map((s: { size: string; quantity: string }) => ({
          size: s.size,
          totalQuantity: parseInt(s.quantity),
          availableQuantity: parseInt(s.quantity),
        })),
      },
    },
  });

  revalidatePath('/inventory');
  revalidatePath('/');
}

export async function updateItem(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const category = formData.get('category') as string;
  const room = formData.get('room') as string;
  const shelf = formData.get('shelf') as string;
  const imageUrl = formData.get('imageUrl') as string;
  
  const sizesJson = formData.get('sizes') as string;
  const sizesData = JSON.parse(sizesJson);

  await prisma.$transaction(async (tx) => {
    await tx.item.update({
      where: { id },
      data: { name, category, room, shelf, imageUrl },
    });

    const existingSizes = await tx.itemSize.findMany({ where: { itemId: id } });

    for (const sizeInfo of sizesData) {
      const existing = existingSizes.find(s => s.size === sizeInfo.size);
      if (existing) {
        const diff = parseInt(sizeInfo.quantity) - existing.totalQuantity;
        await tx.itemSize.update({
          where: { id: existing.id },
          data: {
            totalQuantity: parseInt(sizeInfo.quantity),
            availableQuantity: Math.max(0, existing.availableQuantity + diff),
          }
        });
      } else {
        await tx.itemSize.create({
          data: {
            itemId: id,
            size: sizeInfo.size,
            totalQuantity: parseInt(sizeInfo.quantity),
            availableQuantity: parseInt(sizeInfo.quantity),
          }
        });
      }
    }
  });

  revalidatePath('/inventory');
  revalidatePath('/');
}

export async function deleteItem(id: string) {
  await prisma.item.delete({ where: { id } });
  revalidatePath('/inventory');
  revalidatePath('/');
}

// User Actions
export async function createUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const role = formData.get('role') as 'USER' | 'ADMIN';

  await prisma.user.create({
    data: { name, email, role },
  });

  revalidatePath('/users');
}

export async function deleteUser(userId: string) {
  await prisma.$transaction(async (tx) => {
    // 1. Get the user's current outstanding OCIE record.
    const ocieItems = await getUserOcie(userId);

    // 2. For each outstanding item, decrement the total quantity in the master supply record.
    for (const item of ocieItems) {
      if (item.quantity > 0) {
        await tx.itemSize.update({
          where: { id: item.itemSizeId },
          data: {
            totalQuantity: { decrement: item.quantity },
          },
        });
      }
    }

    // 3. Delete all transactions associated with the user.
    await tx.transaction.deleteMany({
      where: { userId: userId },
    });

    // 4. Finally, delete the user.
    await tx.user.delete({
      where: { id: userId },
    });
  });

  // 5. Revalidate paths to reflect the changes.
  revalidatePath('/users');
  revalidatePath('/inventory');
  revalidatePath('/');
}


// Transaction Actions

/**
 * Stage 1: Initiate a sign-out (IN_PROGRESS)
 * Admin picks a user and multiple items with authorized quantities.
 */
export async function initiateSignOut(userId: string, items: { itemId: string; authQuantity: number }[]) {
  const transaction = await prisma.transaction.create({
    data: {
      userId,
      status: 'IN_PROGRESS',
      items: {
        create: items.map(item => ({
          itemId: item.itemId,
          authQuantity: item.authQuantity,
        })),
      },
    },
  });

  revalidatePath('/history');
  revalidatePath('/');
  return transaction.id;
}

/**
 * Stage 2: Complete a sign-out (COMPLETED)
 * Admin inputs actual sizes and quantities given. Stock is deducted.
 */
export async function completeSignOut(
  transactionId: string, 
  itemsData: { 
    transactionItemId: string; 
    details: { itemSizeId: string; quantity: number }[] 
  }[]
) {
  await prisma.$transaction(async (tx) => {
    for (const item of itemsData) {
      // 1. Create multiple size details for this transaction item
      for (const detail of item.details) {
        const itemSize = await tx.itemSize.findUnique({ where: { id: detail.itemSizeId } });
        if (!itemSize || itemSize.availableQuantity < detail.quantity) {
          throw new Error(`Not enough stock for size ${itemSize?.size}`);
        }

        await tx.transactionItemDetail.create({
          data: {
            transactionItemId: item.transactionItemId,
            itemSizeId: detail.itemSizeId,
            quantity: detail.quantity,
          },
        });

        // 2. Deduct from inventory
        await tx.itemSize.update({
          where: { id: detail.itemSizeId },
          data: {
            availableQuantity: itemSize.availableQuantity - detail.quantity,
          },
        });
      }
    }

    // 3. Mark transaction as completed
    await tx.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  });

  revalidatePath('/inventory');
  revalidatePath('/history');
  revalidatePath('/');
}

export async function initiateReturn(
  userId: string, 
  itemsToReturn: { 
    itemId: string;
    itemSizeId: string; 
    quantity: number; 
  }[]
) {
  const transaction = await prisma.transaction.create({
    data: {
      userId,
      status: 'RETURNED',
      returnDate: new Date(),
      items: {
        create: (itemsToReturn || []).map(item => ({
          itemId: item.itemId,
          authQuantity: item.quantity,
          details: {
            create: {
              itemSizeId: item.itemSizeId,
              quantity: item.quantity,
            }
          }
        }))
      }
    },
  });

  await prisma.$transaction(async (tx) => {
    for (const item of itemsToReturn || []) {
      if (item.quantity <= 0) continue;

      await tx.itemSize.update({
        where: { id: item.itemSizeId },
        data: {
          availableQuantity: { increment: item.quantity },
        },
      });
    }
  });



  return transaction.id;
}

export async function deleteTransaction(id: string) {
  await prisma.transaction.delete({ where: { id } });
  revalidatePath('/');
  revalidatePath('/history');
}

export async function getUserOcie(userId: string) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  // Aggregate all issued quantities
  const issuedAggregates = await prisma.transactionItemDetail.groupBy({
    by: ['itemSizeId'],
    where: {
      transactionItem: {
        transaction: {
          userId: userId,
          status: 'COMPLETED',
        },
      },
    },
    _sum: {
      quantity: true,
    },
  });

  // Aggregate all returned quantities
  const returnedAggregates = await prisma.transactionItemDetail.groupBy({
    by: ['itemSizeId'],
    where: {
      transactionItem: {
        transaction: {
          userId: userId,
          status: 'RETURNED',
        },
      },
    },
    _sum: {
      quantity: true,
    },
  });

  // Create a map of returned quantities for easy lookup
  const returnedMap = new Map<string, number>();
  returnedAggregates.forEach(agg => {
    returnedMap.set(agg.itemSizeId, agg._sum.quantity || 0);
  });

  // Calculate the net quantity for each issued item
  const netOcie: { itemSizeId: string; netQuantity: number }[] = [];
  issuedAggregates.forEach(agg => {
    const issuedQty = agg._sum.quantity || 0;
    const returnedQty = returnedMap.get(agg.itemSizeId) || 0;
    const netQty = issuedQty - returnedQty;

    if (netQty > 0) {
      netOcie.push({
        itemSizeId: agg.itemSizeId,
        netQuantity: netQty,
      });
    }
  });

  // Fetch full details for the items the user currently holds
  const itemSizeIds = netOcie.map(item => item.itemSizeId);
  const itemDetails = await prisma.itemSize.findMany({
    where: {
      id: { in: itemSizeIds },
    },
    include: {
      item: true,
    },
  });

  // Combine the net quantities with the full item details
  const result = itemDetails.map(detail => {
    const ocieItem = netOcie.find(o => o.itemSizeId === detail.id);
    return {
      itemSizeId: detail.id,
      itemId: detail.item.id,
      name: detail.item.name,
      size: detail.size,
      quantity: ocieItem?.netQuantity || 0,
    };
  }).sort((a, b) => a.name.localeCompare(b.name) || a.size.localeCompare(b.size));

  return result;
}


export async function completeReturn(
  transactionId: string, 
  itemsToReturn: { 
    itemId: string;
    itemSizeId: string; 
    quantity: number; 
  }[]
) {
  await prisma.$transaction(async (tx) => {
    for (const item of itemsToReturn) {
      if (item.quantity <= 0) continue; // Skip if nothing is being returned

      // 1. Create a TransactionItem for the return
      const transactionItem = await tx.transactionItem.create({
        data: {
          transactionId,
          itemId: item.itemId,
          authQuantity: item.quantity, // Storing returned quantity here
        },
      });

      // 2. Create the TransactionItemDetail
      await tx.transactionItemDetail.create({
        data: {
          transactionItemId: transactionItem.id,
          itemSizeId: item.itemSizeId,
          quantity: item.quantity,
        },
      });

      // 3. Add stock back to inventory
      await tx.itemSize.update({
        where: { id: item.itemSizeId },
        data: {
          availableQuantity: { increment: item.quantity },
        },
      });
    }

    // 4. Mark the overall transaction as RETURNED
    const transaction = await tx.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'RETURNED',
        returnDate: new Date(),
      },
    });

    revalidatePath(`/users/${transaction.userId}`);
  });

  revalidatePath('/inventory');
  revalidatePath('/history');
  revalidatePath('/');
}
