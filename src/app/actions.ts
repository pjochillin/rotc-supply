'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
  const sizesData = sizesJson ? JSON.parse(sizesJson) : [];

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
          totalQuantity: parseInt(s.quantity, 10) || 0,
          availableQuantity: parseInt(s.quantity, 10) || 0,
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
  // If sizes are not provided or the field is empty, default to an empty array.
  const sizesData = sizesJson ? JSON.parse(sizesJson) : [];

  await prisma.$transaction(async (tx) => {
    // First, update the basic details of the item.
    await tx.item.update({
      where: { id },
      data: { name, category, room, shelf, imageUrl },
    });

    // Get the current sizes of the item from the database.
    const existingSizes = await tx.itemSize.findMany({ where: { itemId: id } });
    const existingSizeIds = existingSizes.map(s => s.id);

    // Get the IDs of the sizes submitted from the form.
    // Filter out any new sizes which won't have an ID yet.
    const submittedSizeIds = sizesData.map((s: any) => s.id).filter(Boolean);

    // Determine which sizes need to be deleted.
    // These are sizes that exist in the database but not in the form submission.
    const idsToDelete = existingSizeIds.filter(id => !submittedSizeIds.includes(id));
    if (idsToDelete.length > 0) {
      await tx.itemSize.deleteMany({
        where: {
          id: { in: idsToDelete },
        },
      });
    }

    // Iterate through the submitted sizes to either create new ones or update existing ones.
    for (const sizeInfo of sizesData) {
      const quantity = parseInt(sizeInfo.quantity);

      if (sizeInfo.id) {
        // If the size has an ID, it's an existing size that needs to be updated.
        const existingSize = existingSizes.find(s => s.id === sizeInfo.id);
        if (existingSize) {
          const quantityDifference = quantity - existingSize.totalQuantity;
          await tx.itemSize.update({
            where: { id: sizeInfo.id },
            data: {
              size: sizeInfo.size,
              totalQuantity: quantity,
              // Adjust available quantity based on the change in total quantity.
              availableQuantity: Math.max(0, existingSize.availableQuantity + quantityDifference),
            },
          });
        }
      } else {
        // If the size has no ID, it's a new size that needs to be created.
        await tx.itemSize.create({
          data: {
            itemId: id,
            size: sizeInfo.size,
            totalQuantity: quantity,
            availableQuantity: quantity,
          },
        });
      }
    }
  });

  // Revalidate paths to ensure the UI updates with the new data.
  revalidatePath('/inventory');
  revalidatePath('/');
}

export async function deleteItem(id: string) {
  await prisma.$transaction(async (tx) => {
    // First, find all transaction items related to this item
    const transactionItems = await tx.transactionItem.findMany({
      where: { itemId: id },
      select: { id: true }
    });
    const transactionItemIds = transactionItems.map(ti => ti.id);

    // If there are related transaction items, delete their details first
    if (transactionItemIds.length > 0) {
      await tx.transactionItemDetail.deleteMany({
        where: { transactionItemId: { in: transactionItemIds } }
      });
    }

    // Now delete the transaction items themselves
    await tx.transactionItem.deleteMany({
      where: { itemId: id }
    });

    // Delete all sizes associated with this item
    await tx.itemSize.deleteMany({
      where: { itemId: id }
    });

    // Finally, delete the item itself
    await tx.item.delete({ where: { id } });
  });

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

export async function updateUserRole(userId: string, newRole: 'USER' | 'ADMIN') {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    throw new Error('Not authorized to change user roles.');
  }
  
  if (session?.user?.id === userId) {
    throw new Error('You cannot change your own role.');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  revalidatePath('/users');
  revalidatePath(`/users/${userId}`);
}

export async function getUser(id: string) {
  if (!id) {
    return null;
  }
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function deleteUser(userId: string) {
  await prisma.$transaction(async (tx) => {
    // 1. Fetch the user's name before deleting them.
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    const userName = user?.name ?? 'Unknown User';

    // 2. Anonymize the user in any transactions they were involved in.
    //    This preserves the historical record of who did what.
    await tx.transaction.updateMany({
      where: { recipientId: userId },
      data: { recipientName: userName },
    });

    // 3. Get the user's current outstanding OCIE record (items they possess).
    const ocieItems = await getUserOcie(userId);

    // 4. For each outstanding item, decrement the total quantity in the master supply record
    //    to reflect that these items are permanently removed from inventory.
    for (const item of ocieItems) {
      await tx.itemSize.update({
        where: { id: item.itemSizeId },
        data: {
          totalQuantity: { decrement: item.quantity },
        },
      });
    }

    // 5. Finally, delete the user record itself.
    //    The schema's onDelete: SetNull will handle disassociating the user from transactions.
    await tx.user.delete({
      where: { id: userId },
    });
  });

  // Revalidate cached paths to show the changes across the app.
  revalidatePath('/users');
  revalidatePath('/inventory');
  revalidatePath('/');
}


// Transaction Actions

export async function getTransaction(id: string) {
  if (!id) {
    return null;
  }
  return prisma.transaction.findUnique({
    where: { id },
    include: {
      recipient: true,
    }
  });
}

/**
 * Stage 1: Initiate a sign-out (IN_PROGRESS)
 * Admin picks a user and multiple items with authorized quantities.
 */
export async function initiateSignOut(recipientId: string, items: { itemId: string; authQuantity: number }[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.name) {
    throw new Error("User is not authenticated or name is missing");
  }
  const initiatorId = session.user.id;
  const initiatorName = session.user.name;

  const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
  if (!recipient || !recipient.name) {
    throw new Error("Recipient not found or name is missing");
  }

  const transaction = await prisma.transaction.create({
    data: {
      recipientId,
      recipientName: recipient.name,
      initiatorName,
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



export async function findInProgressReturn(recipientId: string) {
  if (!recipientId) {
    return null;
  }

  return prisma.transaction.findFirst({
    where: {
      recipientId,
      status: 'RETURN_IN_PROGRESS',
    },
  });
}

export async function initiateBatchSignOut(recipientIds: string[], items: { itemId: string; authQuantity: number }[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.name) {
    throw new Error("User is not authenticated or name is missing");
  }
  const initiatorName = session.user.name;

  const recipients = await prisma.user.findMany({
    where: { id: { in: recipientIds } },
    select: { id: true, name: true },
  });

  const recipientMap = new Map(recipients.map(r => [r.id, r.name]));

  for (const recipientId of recipientIds) {
    await prisma.transaction.create({
      data: {
        recipientId,
        recipientName: recipientMap.get(recipientId) ?? 'Unknown User',
        initiatorName,
        status: 'IN_PROGRESS',
        items: {
          create: items.map(item => ({
            itemId: item.itemId,
            authQuantity: item.authQuantity,
          })),
        },
      },
    });
  }

  revalidatePath('/history');
  revalidatePath('/');
}

export async function initiateReturnProcess(transactionId: string) {
  await prisma.transaction.update({
    where: { id: transactionId },
    data: { status: 'RETURN_IN_PROGRESS' },
  });

  revalidatePath('/');
  revalidatePath('/history');
}

export async function wipeAllTransactions() {
  await prisma.$transaction(async (tx) => {
    // Delete all transaction-related records
    await tx.transactionItemDetail.deleteMany({});
    await tx.transactionItem.deleteMany({});
    await tx.transaction.deleteMany({});

    // Reset all item quantities
    const itemSizes = await tx.itemSize.findMany({});
    for (const itemSize of itemSizes) {
      await tx.itemSize.update({
        where: { id: itemSize.id },
        data: { availableQuantity: itemSize.totalQuantity },
      });
    }
  });

  revalidatePath('/');
  revalidatePath('/history');
  revalidatePath('/inventory');
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.name) {
    throw new Error("User is not authenticated or name is missing");
  }
  const completerId = session.user.id;
  const completerName = session.user.name;

  await prisma.$transaction(async (tx) => {
    for (const item of itemsData) {
      // Filter out details with a quantity of 0
      const validDetails = item.details.filter(d => d.quantity > 0);

      // 1. Create multiple size details for this transaction item
      for (const detail of validDetails) {
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
        completerName,
      },
    });
  });

  revalidatePath('/inventory');
  revalidatePath('/history');
  revalidatePath('/');
}

export async function initiateReturn(
  recipientId: string, 
  itemsToReturn: { 
    itemId: string;
    itemSizeId: string; 
    quantity: number; 
  }[] = []
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.name) {
    throw new Error("User is not authenticated or name is missing");
  }
  const initiatorId = session.user.id;
  const initiatorName = session.user.name;

  const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
  if (!recipient || !recipient.name) {
    throw new Error("Recipient not found or name is missing");
  }

  const transaction = await prisma.transaction.create({
    data: {
      recipientId,
      recipientName: recipient.name,
      initiatorName,
      status: 'RETURN_IN_PROGRESS',
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

  return transaction.id;
}

export async function confirmReturn(transactionId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.name) {
    throw new Error("User is not authenticated or name is missing");
  }
  const completerId = session.user.id;
  const completerName = session.user.name;

  const transaction = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      status: 'RETURNED',
      returnDate: new Date(),
      completerName,
    },
    include: {
      items: {
        include: {
          details: true
        }
      }
    }
  });

  await prisma.$transaction(async (tx) => {
    for (const item of transaction.items) {
      for (const detail of item.details) {
        if (detail.quantity > 0) {
          await tx.itemSize.update({
            where: { id: detail.itemSizeId },
            data: {
              availableQuantity: { increment: detail.quantity },
            },
          });
        }
      }
    }
  });

  revalidatePath('/');
  revalidatePath('/history');
  revalidatePath(`/users/${transaction.recipientId}`);
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
          recipientId: userId,
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
          recipientId: userId,
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
      imageUrl: detail.item.imageUrl,
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

    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.name) {
      throw new Error("User is not authenticated or name is missing");
    }
    const completerName = session.user.name;

    // 4. Mark the overall transaction as RETURNED
    const transaction = await tx.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'RETURNED',
        returnDate: new Date(),
        completedAt: new Date(),
        completerName,
      },
    });

    revalidatePath(`/users/${transaction.recipientId}`);
  });

  revalidatePath('/inventory');
  revalidatePath('/history');
  revalidatePath('/');
}
