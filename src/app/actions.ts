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
  revalidatePath('/admin');
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
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function deleteItem(id: string) {
  await prisma.item.delete({ where: { id } });
  revalidatePath('/inventory');
  revalidatePath('/admin');
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
  revalidatePath('/admin');
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

  revalidatePath('/admin');
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
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function initiateReturn(userId: string, items: { itemId: string; itemSizeId: string; quantity: number }[]) {
  const transaction = await prisma.transaction.create({
    data: {
      userId,
      status: 'RETURN_IN_PROGRESS',
      items: {
        create: items.map(item => ({
          itemId: item.itemId,
          authQuantity: item.quantity, // We reuse authQuantity to store how much is being returned
        })),
      },
    },
  });

  revalidatePath('/admin');
  revalidatePath('/history');
  revalidatePath(`/users/${userId}`);
  return transaction.id;
}

export async function completeReturn(
  transactionId: string, 
  itemsData: { 
    transactionItemId: string; 
    details: { itemSizeId: string; quantity: number }[] 
  }[]
) {
  await prisma.$transaction(async (tx) => {
    for (const item of itemsData) {
      for (const detail of item.details) {
        // 1. Create detail record
        await tx.transactionItemDetail.create({
          data: {
            transactionItemId: item.transactionItemId,
            itemSizeId: detail.itemSizeId,
            quantity: detail.quantity,
          },
        });

        // 2. Add back to inventory
        await tx.itemSize.update({
          where: { id: detail.itemSizeId },
          data: {
            availableQuantity: { increment: detail.quantity },
          },
        });
      }
    }

    // 3. Mark transaction as returned
    await tx.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'RETURNED',
        returnDate: new Date(),
      },
    });
  });

  revalidatePath('/inventory');
  revalidatePath('/history');
  revalidatePath('/admin');
  revalidatePath('/');
}
