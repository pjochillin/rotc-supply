import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";
import LogoFallback from "@/components/LogoFallback";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function PrintTransactionPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      recipient: true,
      initiator: true,
      items: {
        include: {
          item: true
        }
      }
    }
  });

  if (!transaction) notFound();

  return (
    <div className="max-w-6xl mx-auto pb-12 print:m-0 print:p-0 print:max-w-none">
      {/* UI Controls (Hidden on print) */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 font-bold">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        <PrintButton />
      </div>

      {/* Mobile Placeholder */}
      <div className="lg:hidden print:hidden bg-gray-50 p-6 rounded-lg border border-dashed text-center">
        <h2 className="text-lg font-bold text-gray-800">OCIE Sheet is Ready</h2>
        <p className="text-gray-600 mt-2">
          The printable OCIE sheet is not displayed on small screens to save space.
        </p>
        <p className="text-gray-600 mt-1">
          Please view on a desktop or press the print button to generate the document.
        </p>
      </div>

      {/* Printable Sheet (DA 3645 Style) */}
      <div className="hidden lg:block print:block bg-white p-8 border shadow-sm print:shadow-none print:border-none print:p-0 text-black font-serif">
        <div className="grid grid-cols-4 border-2 border-black text-[10px] mb-4">
          <div className="col-span-3 p-2 border-r-2 border-black">
            <h1 className="text-base font-bold uppercase underline">Individual OCIE Record (Digital DA 3645)</h1>
            <div className="grid grid-cols-2 mt-2">
              <p><span className="font-bold">NAME:</span> {transaction.recipient.name}</p>
              <p><span className="font-bold">EMAIL:</span> {transaction.recipient.email}</p>
            </div>
            <p><span className="font-bold">UNIT:</span> Cornell Army ROTC</p>
            <p className="font-bold mt-1">OCIE Record downloaded on: <span className="font-normal">{new Date().toLocaleString()} by {session?.user?.name}</span></p>
            <p className="font-bold">Transaction ID: <span className="font-normal">{transaction.id}</span></p>
          </div>
          <div className="col-span-1 flex items-center justify-center">
            <LogoFallback 
              className="h-20 w-20"
              fallbackText="EXCELSIOR<br/>BATTALION" 
            />
          </div>
        </div>

        {/* Main Table */}
        <table className="w-full border-collapse border-2 border-black text-[10px]">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-black text-xs">
              <th className="border-r-2 border-black p-1 w-12 uppercase font-black">Pic</th>
              <th className="border-r-2 border-black p-1 uppercase font-black text-left">Item Description</th>
              <th className="border-r-2 border-black p-1 w-16 uppercase font-black">Size</th>
              <th className="border-r-2 border-black p-1 w-16 uppercase font-black">Location</th>
              <th className="border-r-2 border-black p-1 w-20 uppercase font-black">Auth Qty</th>
              <th className="p-1 w-20 uppercase font-black bg-gray-200">Rcvd Qty</th>
            </tr>
          </thead>
          <tbody>
            {transaction.items.map((tItem) => (
              <tr key={tItem.id} className="border-b-2 border-black">
                <td className="border-r-2 border-black p-0.5 text-center align-middle">
                  {tItem.item.imageUrl ? (
                    <img src={tItem.item.imageUrl} alt="" className="h-8 w-8 object-contain mx-auto" />
                  ) : (
                    <div className="h-8 w-8 border border-dashed border-gray-300 flex items-center justify-center mx-auto">
                      <Package className="h-5 w-5 text-gray-300" />
                    </div>
                  )}
                </td>
                <td className="border-r-2 border-black p-1 align-middle">
                  <div className="font-bold text-[10px] uppercase leading-none">{tItem.item.name}</div>
                </td>
                <td className="border-r-2 border-black p-1 text-center align-middle font-bold text-[10px] bg-gray-50">
                  {/* Blank for handwriting */}
                </td>
                <td className="border-r-2 border-black p-1 text-center align-middle text-[9px]">
                  <div className="font-bold">{tItem.item.room}</div>
                  <div>Shelf {tItem.item.shelf}</div>
                </td>
                <td className="border-r-2 border-black p-1 text-center align-middle font-bold text-sm">
                  {tItem.authQuantity}
                </td>
                <td className="p-1 text-center align-middle bg-gray-100 font-bold text-sm">
                  {/* Blank for handwriting */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer Signatures */}
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

          <div className="mt-4 text-[8px] text-gray-400 text-center uppercase tracking-widest">
            Automated Individual OCIE Record System - Generated for Cornell University ROTC
          </div>
        </div>
      </div>
    </div>
  );
}
