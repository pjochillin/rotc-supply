import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";
import LogoFallback from "@/components/LogoFallback";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserOcie } from "@/app/actions"; // Import the new function

export default async function PrintReturnPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!id) notFound();

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      recipient: true,
      items: {
        include: {
          item: true,
          details: { include: { itemSize: true } }
        }
      }
    }
  });

  if (!transaction) notFound();

  // 1. Fetch the full OCIE record for the user
  const ocieRecord = await getUserOcie(transaction.recipientId);

  // 2. Create a map of items returned in this specific transaction
  const returnedItemsMap = new Map<string, number>();
  transaction.items.forEach(tItem => {
    tItem.details.forEach(detail => {
      returnedItemsMap.set(detail.itemSizeId, detail.quantity);
    });
  });

  // 3. Merge the full OCIE record with the returned items data
  const itemsForDisplay = ocieRecord.map(item => ({
    ...item,
    returnedQuantity: returnedItemsMap.get(item.itemSizeId) || 0
  })).sort((a, b) => a.name.localeCompare(b.name) || a.size.localeCompare(b.size));

  return (
    <div className="max-w-6xl mx-auto pb-12 print:m-0 print:p-0 print:max-w-none">
      <div className="mb-8 flex items-center justify-between print:hidden">
        <Link href={`/users/${transaction.recipientId}`} className="flex items-center text-gray-600 hover:text-gray-900 font-bold">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Link>
        <PrintButton />
      </div>

      <div className="bg-white p-8 border shadow-sm print:shadow-none print:border-none print:p-0 text-black font-serif">
        <div className="grid grid-cols-4 border-2 border-black text-[10px] mb-4">
          <div className="col-span-3 p-2 border-r-2 border-black">
            <h1 className="text-base font-bold uppercase underline">Supply Return Sheet (Digital DA 3645)</h1>
            <div className="grid grid-cols-2 mt-2">
              <p><span className="font-bold">NAME:</span> {transaction.recipient.name}</p>
              <p><span className="font-bold">EMAIL:</span> {transaction.recipient.email}</p>
            </div>
            <p><span className="font-bold">UNIT:</span> Cornell Army ROTC</p>
            <p className="font-bold mt-1">Return receipt generated on: <span className="font-normal">{new Date().toLocaleString()} by {session?.user?.name}</span></p>
            <p className="font-bold">Transaction ID: <span className="font-normal">{transaction.id}</span></p>
          </div>
          <div className="col-span-1 flex items-center justify-center">
            <LogoFallback 
              className="h-20 w-20"
              fallbackText="EXCELSIOR<br/>BATTALION" 
            />
          </div>
        </div>

        <table className="w-full border-collapse border-2 border-black text-[10px]">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-black text-xs">
              <th className="border-r-2 border-black p-1 w-12 uppercase font-black">Pic</th>
              <th className="border-r-2 border-black p-1 uppercase font-black text-left">Item Description</th>
              <th className="border-r-2 border-black p-1 w-16 uppercase font-black">Size</th>
              <th className="border-r-2 border-black p-1 w-24 uppercase font-black">Currently Issued</th>
              <th className="p-1 w-24 uppercase font-black bg-gray-200">Qty Returned</th>
            </tr>
          </thead>
          <tbody>
            {itemsForDisplay.map((itemRecord, idx) => (
              <tr key={idx} className="border-b-2 border-black">
                <td className="border-r-2 border-black p-0.5 text-center align-middle">
                  {itemRecord.imageUrl ? (
                    <img src={itemRecord.imageUrl} alt="" className="h-8 w-8 object-contain mx-auto" />
                  ) : (
                    <div className="h-8 w-8 border border-dashed border-gray-300 flex items-center justify-center mx-auto">
                      <Package className="h-5 w-5 text-gray-300" />
                    </div>
                  )}
                </td>
                <td className="border-r-2 border-black p-1 align-middle">
                  <div className="font-bold text-[10px] uppercase leading-none">{itemRecord.name}</div>
                </td>
                <td className="border-r-2 border-black p-1 text-center align-middle font-bold text-[10px]">
                  {itemRecord.size}
                </td>
                <td className="border-r-2 border-black p-1 text-center align-middle font-bold text-sm">
                  {itemRecord.quantity}
                </td>
                <td className="p-1 text-center align-middle bg-gray-100 font-black text-sm">
                  {itemRecord.returnedQuantity > 0 ? itemRecord.returnedQuantity : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-16 print:break-inside-avoid">
          <div className="grid grid-cols-2 gap-24">
            <div className="text-center">
              <div className="border-b-2 border-black mb-1 h-8"></div>
              <p className="text-[9px] font-bold uppercase">Cadet Signature</p>
            </div>
            <div className="text-center">
              <div className="border-b-2 border-black mb-1 h-8"></div>
              <p className="text-[9px] font-bold uppercase">Supply Officer Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
