'use client';

import { useState, useMemo } from 'react';
import { Package, Search, Filter, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ImageModal from './ImageModal';

// Define the types for the props we'll receive
interface Item {
  id: string;
  name: string;
  category: string;
  room: string | null;
  shelf: string | null;
  imageUrl: string | null;
  sizes: { id: string; size: string; total: number; available: number; }[];
}

interface InventoryListProps {
  items: Item[];
}

export default function InventoryList({ items }: InventoryListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const [isRoomFilterOpen, setIsRoomFilterOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Get a list of unique categories for the filter dropdown
  const categories = useMemo(() => {
    const allCategories = items.map(item => item.category);
    return ['All', ...Array.from(new Set(allCategories))];
  }, [items]);

  const rooms = useMemo(() => {
    const allRooms = items.map(item => item.room).filter(Boolean) as string[];
    return ['All', ...Array.from(new Set(allRooms))];
  }, [items]);

  // Filter the items based on the search query and selected category
  const filteredItems = useMemo(() => {
    let filtered = items;

    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory && selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (selectedRoom && selectedRoom !== 'All') {
      filtered = filtered.filter(item => item.room === selectedRoom);
    }

    return filtered;
  }, [items, searchQuery, selectedCategory, selectedRoom]);

  const getTotalStock = (sizes: Item['sizes']) => {
    return sizes.reduce((acc, s) => acc + s.total, 0);
  };

  const getAvailableStock = (sizes: Item['sizes']) => {
    return sizes.reduce((acc, s) => acc + s.available, 0);
  };


  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your supply items and stock levels.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            suppressHydrationWarning
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative">
          <button
            suppressHydrationWarning
            onClick={() => {
              setIsCategoryFilterOpen(!isCategoryFilterOpen);
              setIsRoomFilterOpen(false);
            }}
            className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset transition-colors ${(selectedCategory && selectedCategory !== 'All') || isCategoryFilterOpen ? 'bg-red-50 text-red-700 ring-red-300 hover:bg-red-100' : 'bg-white text-gray-900 ring-gray-300 hover:bg-gray-50'} w-full justify-center md:w-auto`}
          >
            {isCategoryFilterOpen ? (
              <X className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            ) : (
              <Filter className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            )}
            Category {selectedCategory && selectedCategory !== 'All' && `(${selectedCategory})`}
          </button>
          <AnimatePresence>
            {isCategoryFilterOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
              >
                <div className="py-1">
                  <div className="px-4 py-2 flex justify-between items-center">
                    <p className="text-xs font-bold text-gray-500 uppercase">Filter by Category</p>
                    {selectedCategory && selectedCategory !== 'All' && (
                      <button
                        onClick={() => {
                          setSelectedCategory('All');
                          setIsCategoryFilterOpen(false);
                        }}
                        className="text-xs font-bold text-red-700 hover:text-red-900 flex items-center"
                      >
                        <X className="h-3 w-3 mr-1" /> Clear
                      </button>
                    )}
                  </div>
                  {categories.map(category => (
                    <a
                      key={category}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedCategory(category);
                        setIsCategoryFilterOpen(false);
                      }}
                      className={`block px-4 py-2 text-sm ${selectedCategory === category ? 'bg-red-50 text-red-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      {category}
                    </a>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="relative">
          <button
            suppressHydrationWarning
            onClick={() => {
              setIsRoomFilterOpen(!isRoomFilterOpen);
              setIsCategoryFilterOpen(false);
            }}
            className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset transition-colors ${(selectedRoom && selectedRoom !== 'All') || isRoomFilterOpen ? 'bg-red-50 text-red-700 ring-red-300 hover:bg-red-100' : 'bg-white text-gray-900 ring-gray-300 hover:bg-gray-50'} w-full justify-center md:w-auto`}
          >
            {isRoomFilterOpen ? (
              <X className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            ) : (
              <Filter className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            )}
            Room {selectedRoom && selectedRoom !== 'All' && `(${selectedRoom})`}
          </button>
          <AnimatePresence>
            {isRoomFilterOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
              >
                <div className="py-1">
                  <div className="px-4 py-2 flex justify-between items-center">
                    <p className="text-xs font-bold text-gray-500 uppercase">Filter by Room</p>
                    {selectedRoom && selectedRoom !== 'All' && (
                      <button
                        onClick={() => {
                          setSelectedRoom('All');
                          setIsRoomFilterOpen(false);
                        }}
                        className="text-xs font-bold text-red-700 hover:text-red-900 flex items-center"
                      >
                        <X className="h-3 w-3 mr-1" /> Clear
                      </button>
                    )}
                  </div>
                  {rooms.map(room => (
                    <a
                      key={room}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedRoom(room);
                        setIsRoomFilterOpen(false);
                      }}
                      className={`block px-4 py-2 text-sm ${selectedRoom === room ? 'bg-red-50 text-red-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      {room}
                    </a>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Link
          href="/add-item"
          className="inline-flex items-center justify-center rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 md:w-auto w-full"
          >
          <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
          Add Item
        </Link>
      </div>

      <div>
        <div className="hidden sm:block shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300 table-fixed">
            <colgroup>
              <col className="w-2/5" />
              <col className="w-1/5" />
              <col className="w-1/5" />
              <col className="w-1/5" />
              <col className="w-24" />
            </colgroup>
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Item Name</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Sizes & Availability</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Total Stock</th>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Location</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="h-10 w-10 rounded-md object-cover border shadow-sm cursor-pointer" onClick={() => setSelectedImage(item.imageUrl)} />
                        ) : (
                          <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center border border-dashed">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="font-bold text-gray-900 whitespace-normal">{item.name}</div>
                        <div className="text-gray-500">{item.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    <div className="flex flex-wrap gap-2">
                      {item.sizes.length === 1 && item.sizes[0].size === 'Standard' ? (
                        null
                      ) : (
                        item.sizes.map(s => (
                          <div key={s.id} className="flex flex-col border rounded p-1 min-w-[60px] bg-gray-50">
                            <span className="text-[10px] font-bold text-gray-500 uppercase">{s.size}</span>
                            <div className="flex items-baseline space-x-1">
                              <span className={`text-sm font-bold ${s.available < 3 ? 'text-red-600' : 'text-gray-900'}`}>{s.available}</span>
                              <span className="text-[10px] text-gray-400">/ {s.total}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    <div className="font-bold text-gray-900">{getAvailableStock(item.sizes)} / {getTotalStock(item.sizes)}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <div className="text-xs text-gray-400">Room: {item.room || '-'}</div>
                    <div className="font-medium text-gray-700">Shelf: {item.shelf || '-'}</div>
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <Link href={`/edit-item/${item.id}`} className="text-red-700 hover:text-red-900 font-medium">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sm:hidden">
          <ul role="list" className="divide-y divide-gray-200 shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            {filteredItems.map((item) => (
              <li key={item.id} className="bg-white px-4 py-4 rounded-xl">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 flex-shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-12 w-12 rounded-md object-cover border shadow-sm cursor-pointer" onClick={() => setSelectedImage(item.imageUrl)} />
                    ) : (
                      <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center border border-dashed">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex-grow">
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.category}</p>
                      </div>
                      <Link href={`/edit-item/${item.id}`} className="text-red-700 hover:text-red-900 font-medium">Edit</Link>
                    </div>
                    <div className="mt-2 flex flex-col space-y-2">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Total Stock</span>
                        <span className="text-lg font-bold">{getAvailableStock(item.sizes)} / {getTotalStock(item.sizes)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Location</span>
                        <span className="font-medium">{item.room || '-'} / {item.shelf || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {item.sizes.length === 1 && item.sizes[0].size === 'Standard' ? (
                       null
                    ) : (
                      item.sizes.map(s => (
                        <div key={s.id} className="flex flex-col border rounded p-1.5 min-w-[70px] bg-gray-50 flex-grow text-center">
                          <span className="text-xs font-bold text-gray-500 uppercase">{s.size}</span>
                          <div className="flex items-baseline justify-center space-x-1">
                            <span className={`text-lg font-bold ${s.available < 3 ? 'text-red-600' : 'text-gray-900'}`}>{s.available}</span>
                            <span className="text-sm text-gray-400">/ {s.total}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </div>
  );
}
