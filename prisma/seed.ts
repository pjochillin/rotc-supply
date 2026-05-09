import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean up
  await prisma.transactionItemDetail.deleteMany();
  await prisma.transactionItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.itemSize.deleteMany();
  await prisma.item.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const user1 = await prisma.user.create({
    data: {
      name: 'Cadet Smith',
      email: 'smith@cornell.edu',
      role: 'USER',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Cadet Jones',
      email: 'jones@cornell.edu',
      role: 'USER',
    },
  });

  // Create Items
  const item1 = await prisma.item.create({
    data: {
      name: 'OCP Uniform Top',
      category: 'Uniform',
      room: 'Supply Room A',
      shelf: 'Shelf 1-A',
      sizes: {
        create: [
          { size: 'M-R', totalQuantity: 50, availableQuantity: 48 }
        ]
      }
    },
  });

  const item3 = await prisma.item.create({
    data: {
      name: 'Patrol Cap',
      category: 'Headgear',
      room: 'Supply Room B',
      shelf: 'Bin 4',
      sizes: {
        create: [
          { size: '7 1/4', totalQuantity: 100, availableQuantity: 99 }
        ]
      }
    },
  });

  // Fetch created item sizes
  const sizes1 = await prisma.itemSize.findMany({ where: { itemId: item1.id } });
  const sizes3 = await prisma.itemSize.findMany({ where: { itemId: item3.id } });

  // 1. Create a COMPLETED transaction
  await prisma.transaction.create({
    data: {
      recipientId: user1.id,
      initiatorId: user1.id, // Assuming user1 initiated this for simplicity
      completerId: user1.id, // Assuming user1 completed this for simplicity
      status: 'COMPLETED',
      completedAt: new Date(),
      items: {
        create: [
          {
            itemId: item1.id,
            authQuantity: 2,
            details: {
              create: [
                {
                  itemSizeId: sizes1[0].id,
                  quantity: 2,
                }
              ]
            }
          }
        ]
      }
    },
  });

  // 2. Create an IN_PROGRESS transaction
  await prisma.transaction.create({
    data: {
      recipientId: user2.id,
      initiatorId: user1.id, // Assuming user1 initiated this for simplicity
      status: 'IN_PROGRESS',
      items: {
        create: [
          {
            itemId: item3.id,
            authQuantity: 1,
          }
        ]
      }
    },
  });

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
