import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const item = await prisma.item.findUnique({
      where: { id },
      include: { sizes: true },
    });
    
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
