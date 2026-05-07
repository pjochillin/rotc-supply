'use client';

import { useState } from 'react';

interface LogoFallbackProps {
  fallbackText: string;
  className?: string;
  imgClassName?: string;
}

export default function LogoFallback({ fallbackText, className, imgClassName }: LogoFallbackProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-50 border-2 border-black rounded-full text-center`}>
        <div 
          className="text-black font-black leading-tight tracking-tighter italic"
          dangerouslySetInnerHTML={{ __html: fallbackText }}
        />
      </div>
    );
  }

  return (
    <div className={`${className} flex items-center justify-center bg-gray-50 border-2 border-black rounded-full overflow-hidden`}>
      <img 
        src="/logo.png" 
        alt="Cornell ROTC Logo" 
        className={imgClassName || "h-full w-full object-contain"}
        onError={() => setError(true)}
      />
    </div>
  );
}
