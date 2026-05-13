import { getUserOcie } from "@/app/actions";
import { notFound } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";
import LogoFallback from "@/components/LogoFallback";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma"; // Import prisma

export default async function PrintUserOCIEPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const user = await prisma.user.findUnique({ where: { id } });
  const ocieItems = await getUserOcie(id);

  if (!user) notFound();

  return (
    <div className="max-w-6xl mx-auto pb-12 print:m-0 print:p-0 print:max-w-none">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <Link href={`/users/${id}`} className="flex items-center text-gray-600 hover:text-gray-900 font-bold">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
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

      <div className="hidden lg:block print:block bg-white p-8 border shadow-sm print:shadow-none print:border-none print:p-0 text-black font-serif">
        <div className="grid grid-cols-4 border-2 border-black text-[10px] mb-4">
          <div className="col-span-3 p-2 border-r-2 border-black">
            <h1 className="text-base font-bold uppercase underline">Individual OCIE Record (Digital DA 3645)</h1>
            <div className="grid grid-cols-2 mt-2">
              <p><span className="font-bold">NAME:</span> {user.name}</p>
              <p><span className="font-bold">EMAIL:</span> {user.email}</p>
            </div>
            <p><span className="font-bold">UNIT:</span> Cornell Army ROTC</p>
            <p className="font-bold mt-1">OCIE Record generated on: <span className="font-normal">{new Date().toLocaleString()} by {session?.user?.name}</span></p>
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
              <th className="p-1 w-24 uppercase font-black">Qty Held</th>
            </tr>
          </thead>
          <tbody>
            {ocieItems.map((item, idx) => (
              <tr key={idx} className="border-b-2 border-black">
                <td className="border-r-2 border-black p-0.5 text-center align-middle">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="h-8 w-8 object-contain mx-auto" />
                  ) : (
                    <div className="h-8 w-8 border border-dashed border-gray-300 flex items-center justify-center mx-auto">
                      <Package className="h-5 w-5 text-gray-300" />
                    </div>
                  )}
                </td>
                <td className="border-r-2 border-black p-1 align-middle">
                  <div className="font-bold text-[10px] uppercase leading-none">{item.name}</div>
                </td>
                <td className="border-r-2 border-black p-1 text-center align-middle font-bold text-[10px]">
                  {item.size === 'Standard' ? 'N/A' : item.size}
                </td>
                <td className="p-1 text-center align-middle font-black text-sm">
                  {item.quantity}
                </td>
              </tr>
            ))}
            {ocieItems.length === 0 && (
              <tr>
                <td colSpan={4} className="p-12 text-center italic text-gray-400">
                  No items currently signed out to this cadet.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-16 print:break-inside-avoid">
          <div className="grid grid-cols-2 gap-24">
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
    </div>
  );
}
