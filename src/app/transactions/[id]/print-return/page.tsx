import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";
import LogoFallback from "@/components/LogoFallback";

export default async function PrintReturnPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;

  if (!id) notFound(); // Add this check

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      user: true,
      items: { // This refers to TransactionItems in the current RETURN_IN_PROGRESS transaction
        include: {
          item: true,
          details: true, // Include details for the items *being returned* in this transaction
        },
      },
    },
  });

  if (!transaction || transaction.status !== 'RETURN_IN_PROGRESS') notFound();

  // 1. Fetch all TransactionItemDetail entries for items ISSUED to the user
  const issuedDetails = await prisma.transactionItemDetail.findMany({
    where: {
      transactionItem: {
        transaction: {
          userId: transaction.userId,
          status: 'COMPLETED',
        },
      },
    },
    include: {
      itemSize: {
        include: {
          item: true,
        },
      },
    },
  });

  // 2. Fetch all TransactionItemDetail entries for items RETURNED by the user
  const returnedDetails = await prisma.transactionItemDetail.findMany({
    where: {
      transactionItem: {
        transaction: {
          userId: transaction.userId,
          status: 'RETURNED',
        },
      },
    },
    include: {
      itemSize: {
        include: {
          item: true,
        },
      },
    },
  });

  // 3. Aggregate to get the net OCIE record currently held by the user
  const userOCIERecord = new Map<string, {
    itemSize: any; // ItemSize with nested Item
    netQuantity: number; // Quantity currently held
  }>();

  issuedDetails.forEach(detail => {
    const key = detail.itemSizeId;
    const current = userOCIERecord.get(key);
    if (current) {
      current.netQuantity += detail.quantity;
    } else {
      userOCIERecord.set(key, { itemSize: detail.itemSize, netQuantity: detail.quantity });
    }
  });

  returnedDetails.forEach(detail => {
    const key = detail.itemSizeId;
    const current = userOCIERecord.get(key);
    if (current) { // Only subtract if it was originally issued
      current.netQuantity -= detail.quantity;
      if (current.netQuantity <= 0) {
        userOCIERecord.delete(key); // Remove if fully returned
      }
    }
  });

  // 4. Prepare items for display, merging with the current return transaction
  const itemsForDisplay = Array.from(userOCIERecord.values()).map(ocieRecord => {
    let returnedQuantityInCurrentTransaction = 0;
    
    // Check if this specific itemSize is part of the current RETURN_IN_PROGRESS transaction
    transaction.items.forEach(tItem => {
      tItem.details.forEach(detail => {
        if (detail.itemSizeId === ocieRecord.itemSize.id) {
          returnedQuantityInCurrentTransaction += detail.quantity;
        }
      });
    });

    return {
      item: ocieRecord.itemSize.item,
      itemSize: ocieRecord.itemSize,
      expectedQuantity: ocieRecord.netQuantity, // This is the total the user currently holds
      returnedQuantity: returnedQuantityInCurrentTransaction, // Quantity being returned in *this* transaction
    };
  });

  // Now sort itemsForDisplay for consistent output.
  itemsForDisplay.sort((a, b) => a.item.name.localeCompare(b.item.name) || a.itemSize.size.localeCompare(b.itemSize.size));

  return (
    <div className="max-w-6xl mx-auto pb-12 print:m-0 print:p-0">
      <div className="mb-8 flex items-center justify-between print:hidden">
        <Link href={`/users/${transaction.userId}`} className="flex items-center text-gray-600 hover:text-gray-900 font-bold">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Link>
        <PrintButton />
      </div>

      <div className="bg-white p-4 border shadow-sm print:shadow-none print:border-none print:p-0 text-black font-serif print:text-[8px]">
        <div className="text-center mb-2 border-b border-black pb-2">
          <div className="flex justify-center mb-2">
            <LogoFallback className="h-12 w-12" fallbackText="EXCELSIOR<br/>BATTALION" />
          </div>
          <h1 className="text-base font-bold uppercase underline">Supply Return Sheet (Digital DA 3645)</h1>
          <p className="text-xs font-bold mt-0.5 uppercase">Equipment Turn-In Record</p>
        </div>

        <div className="grid grid-cols-2 border border-black mb-4 text-[8px]">
          <div className="p-1 border-r border-black space-y-0.5">
            <p className="font-bold">Record generated on: <span className="font-normal">{new Date().toLocaleString()}</span></p>
            <p className="font-bold underline uppercase mt-1">OCIE Record Holder Information:</p>
            <div className="grid grid-cols-2 mt-0.5">
              <p><span className="font-bold">NAME:</span> {transaction.user.name}</p>
              <p><span className="font-bold">EMAIL:</span> {transaction.user.email}</p>
            </div>
            <p><span className="font-bold">UNIT:</span> Cornell ROTC</p>
          </div>
          <div className="p-1 space-y-0.5">
            <p><span className="font-bold">Return Date:</span> {new Date().toLocaleDateString()}</p>
            <p className="font-bold">Basis of Return:</p>
            <p>Equipment Turn-In / End of Term</p>
            <p>Transaction ID: {transaction.id}</p>
          </div>
        </div>

        <table className="w-full border-collapse border border-black text-[8px]">
          <thead>
            <tr className="bg-gray-100 border-b border-black">
              <th className="border-r border-black p-1 w-16 uppercase font-black">Picture</th>
              <th className="border-r border-black p-1 uppercase font-black text-left">Item Description</th>
              <th className="border-r border-black p-1 w-12 uppercase font-black">Size</th>
              <th className="border-r border-black p-1 w-12 uppercase font-black">Curr. Qty</th>
              <th className="p-1 w-12 uppercase font-black bg-gray-200">Qty Returned</th>
            </tr>
          </thead>
          <tbody>
            {itemsForDisplay.map((itemRecord) => (
              <tr key={`${itemRecord.item.id}-${itemRecord.itemSize.id}`} className="border-b border-black h-12">
                <td className="border-r border-black p-0.5 text-center align-middle">
                  {itemRecord.item.imageUrl ? (
                    <img src={itemRecord.item.imageUrl} alt="" className="h-8 w-8 object-contain mx-auto" />
                  ) : (
                    <div className="h-8 w-8 border border-dashed border-gray-300 flex items-center justify-center mx-auto" />
                  )}
                </td>
                <td className="border-r border-black p-1 align-middle">
                  <div className="font-bold text-xs uppercase leading-tight">{itemRecord.item.name}</div>
                  <div className="mt-0.5 text-[7px] italic">{itemRecord.item.category}</div>
                </td>
                <td className="border-r border-black p-1 text-center align-middle font-bold text-xs bg-gray-50">
                  {itemRecord.itemSize.size}
                </td>
                <td className="border-r border-black p-1 text-center align-middle font-black text-sm">
                  {itemRecord.expectedQuantity}
                </td>
                <td className="p-1 text-center align-middle bg-gray-100 font-black text-sm">
                  {itemRecord.returnedQuantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 grid grid-cols-2 gap-12">
          <div className="text-center">
            <div className="border-b border-black mb-0.5 h-6"></div>
            <p className="text-[7px] font-bold uppercase">Cadet Signature</p>
          </div>
          <div className="text-center">
            <div className="border-b border-black mb-0.5 h-6"></div>
            <p className="text-[7px] font-bold uppercase">Supply Officer Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}
