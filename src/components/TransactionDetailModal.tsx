'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Info } from 'lucide-react';

export type TransactionDetail = {
  id: string;
  items: string[];
  recipient: string | null;
  initiator: string | null;
  completer: string | null;
  date: string;
  type: string;
  status: string;
  isReturn: boolean;
  completedAt: Date | null;
  createdAt: Date;
};

export default function TransactionDetailModal({ transaction }: { transaction: TransactionDetail }) {
  const [isOpen, setIsOpen] = useState(false);

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  return (
    <>
      <button onClick={openModal} className="p-1 text-gray-400 hover:text-gray-700">
        <Info className="h-4 w-4" />
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 border-b pb-4 mb-4 flex justify-between items-center"
                  >
                    Transaction Details
                    <button onClick={closeModal} className="p-1 rounded-full hover:bg-gray-100">
                        <X className="h-4 w-4" />
                    </button>
                  </Dialog.Title>
                  <div className="mt-2">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 text-sm">
                        <div className="sm:col-span-2">
                            <dt className="font-medium text-gray-500">Items</dt>
                            <dd className="text-gray-900 mt-1">
                                <ul className="list-disc list-inside max-h-32 overflow-y-auto p-2 border rounded-md bg-gray-50/50">
                                    {transaction.items.map((item, i) => <li key={i}>{item}</li>)}
                                </ul>
                            </dd>
                        </div>
                        <div className="sm:col-span-2">
                            <dt className="font-medium text-gray-500">Transaction ID</dt>
                            <dd className="text-gray-700 font-mono mt-1">{transaction.id}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-gray-500">Recipient</dt>
                            <dd className="text-gray-900 mt-1">{transaction.recipient}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-gray-500">Status</dt>
                            <dd className="text-gray-900 mt-1">
                                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                    transaction.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' : 
                                    transaction.status === 'RETURN_IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                    transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {transaction.status.replace(/_/g, ' ')}
                                </span>
                            </dd>
                        </div>
                        <div>
                            <dt className="font-medium text-gray-500">Initiated By</dt>
                            <dd className="text-gray-900 mt-1">{transaction.initiator} at {new Date(transaction.createdAt).toLocaleString()}</dd>
                        </div>
                        {transaction.completer && (
                            <div>
                                <dt className="font-medium text-gray-500">Completed By</dt>
                                <dd className="text-gray-900 mt-1">{transaction.completer} at {transaction.completedAt ? new Date(transaction.completedAt).toLocaleString() : 'N/A'}</dd>
                            </div>
                        )}
                    </dl>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
