import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!transaction) {
    return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
  }
  return NextResponse.json(transaction);
}
