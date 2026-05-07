import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";
import LogoFallback from "@/components/LogoFallback";

export default async function PrintUserOCIEPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      transactions: {
        where: { status: 'COMPLETED' },
        include: {
          items: {
            include: {
              item: true,
              details: {
                include: {
                  itemSize: true
                }
              }
            }
          }
        },
        orderBy: { checkoutDate: 'desc' }
      }
    }
  });

  if (!user) notFound();

  const items = user.transactions.flatMap(t => 
    t.items.flatMap(i => 
      i.details.map(d => ({
        ...i.item,
        size: d.itemSize.size,
        quantity: d.quantity,
        checkoutDate: t.checkoutDate
      }))
    )
  );

  return (
    <div className="max-w-6xl mx-auto pb-12 print:m-0 print:p-0">
      <div className="mb-8 flex items-center justify-between print:hidden">
        <Link href={`/users/${id}`} className="flex items-center text-gray-600 hover:text-gray-900 font-bold">
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
          <h1 className="text-lg font-bold uppercase underline">Individual OCIE Record (Digital DA 3645)</h1>
          <p className="text-sm font-bold mt-1 uppercase">Complete Equipment Record</p>
        </div>

        <div className="grid grid-cols-2 border-2 border-black mb-6 text-[10px]">
          <div className="p-2 border-r-2 border-black space-y-1">
            <p className="font-bold">Record generated on: <span className="font-normal">{new Date().toLocaleString()}</span></p>
            <p className="font-bold underline uppercase mt-2">OCIE Record Holder Information:</p>
            <div className="grid grid-cols-2 mt-1">
              <p><span className="font-bold">NAME:</span> {user.name}</p>
              <p><span className="font-bold">EMAIL:</span> {user.email}</p>
            </div>
            <p><span className="font-bold">UNIT:</span> Cornell ROTC</p>
          </div>
          <div className="p-2 space-y-1">
            <p><span className="font-bold">Items Currently Held:</span> {items.reduce((acc, i) => acc + i.quantity, 0)}</p>
            <p className="font-bold">Basis of Issue and Authorization:</p>
            <p>Assigned Cadet Position</p>
          </div>
        </div>

        <table className="w-full border-collapse border-2 border-black text-[10px]">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-black">
              <th className="border-r-2 border-black p-2 w-24 uppercase font-black">Picture</th>
              <th className="border-r-2 border-black p-2 uppercase font-black text-left">Item Description</th>
              <th className="border-r-2 border-black p-2 w-20 uppercase font-black">Size</th>
              <th className="border-r-2 border-black p-2 w-20 uppercase font-black">Checkout Date</th>
              <th className="p-2 w-24 uppercase font-black">Qty Held</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b-2 border-black h-24">
                <td className="border-r-2 border-black p-1 text-center align-middle">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="h-20 w-20 object-contain mx-auto" />
                  ) : (
                    <div className="h-20 w-20 border border-dashed border-gray-300 flex items-center justify-center mx-auto" />
                  )}
                </td>
                <td className="border-r-2 border-black p-2 align-middle">
                  <div className="font-bold text-sm uppercase leading-tight">{item.name}</div>
                  <div className="mt-1 text-[9px] italic">{item.category}</div>
                </td>
                <td className="border-r-2 border-black p-2 text-center align-middle font-bold text-sm">
                  {item.size}
                </td>
                <td className="border-r-2 border-black p-2 text-center align-middle">
                  {item.checkoutDate.toLocaleDateString()}
                </td>
                <td className="p-2 text-center align-middle font-black text-lg">
                  {item.quantity}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center italic text-gray-400">
                  No items currently signed out to this cadet.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-12 grid grid-cols-2 gap-24">
          <div className="text-center">
            <div className="border-b-2 border-black mb-1 h-8"></div>
            <p className="text-[9px] font-bold uppercase">Cadet Signature (Verified On {new Date().toLocaleDateString()})</p>
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
