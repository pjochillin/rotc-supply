import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CompleteSignOutForm from "@/components/CompleteSignOutForm";

export default async function CompleteSignOutPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      user: true,
      items: {
        include: {
          item: {
            include: {
              sizes: true
            }
          }
        }
      }
    }
  });

  if (!transaction || transaction.status !== 'IN_PROGRESS') notFound();

  return <CompleteSignOutForm transaction={transaction} />;
}
