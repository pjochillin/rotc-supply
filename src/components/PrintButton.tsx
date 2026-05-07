'use client';

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="bg-red-700 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow-md hover:bg-red-800"
    >
      <Printer className="mr-2 h-4 w-4" />
      Print Sign Out Sheet
    </button>
  );
}
