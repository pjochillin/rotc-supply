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
  
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      user: true,
      items: {
        include: {
          item: true
        }
      }
    }
  });

  if (!transaction || transaction.status !== 'RETURN_IN_PROGRESS') notFound();

  return (
    <div className="max-w-6xl mx-auto pb-12 print:m-0 print:p-0">
      <div className="mb-8 flex items-center justify-between print:hidden">
        <Link href={`/users/${transaction.userId}`} className="flex items-center text-gray-600 hover:text-gray-900 font-bold">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Link>
        <PrintButton />
      </div>

      <div className="bg-white p-8 border shadow-sm print:shadow-none print:border-none print:p-0 text-black font-serif">
        <div className="text-center mb-6 border-b-2 border-black pb-4">
          <div className="flex justify-center mb-4">
            <LogoFallback className="h-32 w-32" fallbackText="EXCELSIOR<br/>BATTALION" />
          </div>
          <h1 className="text-lg font-bold uppercase underline">Supply Return Sheet (Digital DA 3645)</h1>
          <p className="text-sm font-bold mt-1 uppercase">Equipment Turn-In Record</p>
        </div>

        <div className="grid grid-cols-2 border-2 border-black mb-6 text-[10px]">
          <div className="p-2 border-r-2 border-black space-y-1">
            <p className="font-bold">Record generated on: <span className="font-normal">{new Date().toLocaleString()}</span></p>
            <p className="font-bold underline uppercase mt-2">OCIE Record Holder Information:</p>
            <div className="grid grid-cols-2 mt-1">
              <p><span className="font-bold">NAME:</span> {transaction.user.name}</p>
              <p><span className="font-bold">EMAIL:</span> {transaction.user.email}</p>
            </div>
            <p><span className="font-bold">UNIT:</span> Cornell ROTC</p>
          </div>
          <div className="p-2 space-y-1">
            <p><span className="font-bold">Return Date:</span> {new Date().toLocaleDateString()}</p>
            <p className="font-bold">Basis of Return:</p>
            <p>Equipment Turn-In / End of Term</p>
            <p>Transaction ID: {transaction.id}</p>
          </div>
        </div>

        <table className="w-full border-collapse border-2 border-black text-[10px]">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-black">
              <th className="border-r-2 border-black p-2 w-24 uppercase font-black">Picture</th>
              <th className="border-r-2 border-black p-2 uppercase font-black text-left">Item Description</th>
              <th className="border-r-2 border-black p-2 w-20 uppercase font-black">Size</th>
              <th className="border-r-2 border-black p-2 w-20 uppercase font-black">Exp. Qty</th>
              <th className="p-2 w-24 uppercase font-black bg-gray-200">Qty Returned</th>
            </tr>
          </thead>
          <tbody>
            {transaction.items.map((tItem) => (
              <tr key={tItem.id} className="border-b-2 border-black h-24">
                <td className="border-r-2 border-black p-1 text-center align-middle">
                  {tItem.item.imageUrl ? (
                    <img src={tItem.item.imageUrl} alt="" className="h-20 w-20 object-contain mx-auto" />
                  ) : (
                    <div className="h-20 w-20 border border-dashed border-gray-300 flex items-center justify-center mx-auto" />
                  )}
                </td>
                <td className="border-r-2 border-black p-2 align-middle">
                  <div className="font-bold text-sm uppercase leading-tight">{tItem.item.name}</div>
                  <div className="mt-1 text-[9px] italic">{tItem.item.category}</div>
                </td>
                <td className="border-r-2 border-black p-2 text-center align-middle font-bold text-sm bg-gray-50">
                  {/* Blank for handwriting */}
                </td>
                <td className="border-r-2 border-black p-2 text-center align-middle font-black text-lg">
                  {tItem.authQuantity}
                </td>
                <td className="p-2 text-center align-middle bg-gray-100 font-black text-lg">
                  {/* Blank for handwriting */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-12 grid grid-cols-2 gap-24">
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
  );
}
