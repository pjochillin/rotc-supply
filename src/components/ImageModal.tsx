'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export default function ImageModal({ imageUrl, onClose }: ImageModalProps) {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!imageUrl) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="relative"
          onClick={(e) => e.stopPropagation()}
        >
          <img src={imageUrl} alt="Enlarged view" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
          <button
            onClick={onClose}
            className="absolute -top-4 -right-4 bg-white text-gray-900 rounded-full p-2 shadow-lg hover:bg-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
