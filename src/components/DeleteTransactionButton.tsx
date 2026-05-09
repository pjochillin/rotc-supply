'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { deleteTransaction } from '@/app/actions';

export default function DeleteTransactionButton({ transactionId }: { transactionId: string }) {
  const [isConfirming, setIsConfirming] = useState(false);

  return (
    <div className="relative flex items-center justify-center h-8">
      <AnimatePresence initial={false} mode="wait">
        {!isConfirming ? (
          <motion.button
            key="delete"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            type="button"
            onClick={() => setIsConfirming(true)}
            className="text-red-600 hover:text-red-900"
            aria-label="Delete transaction"
          >
            <Trash2 className="h-4 w-4" />
          </motion.button>
        ) : (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="flex items-center space-x-2"
          >
            <button
              onClick={() => deleteTransaction(transactionId)}
              className="px-2 py-1 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-800"
            >
              Delete
            </button>
            <button
              onClick={() => setIsConfirming(false)}
              className="px-2 py-1 text-xs font-bold text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
