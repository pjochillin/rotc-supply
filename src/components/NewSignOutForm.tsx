'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, Package, ArrowLeft, Plus, X, ClipboardList, Users, Check } from 'lucide-react';
import { initiateSignOut, initiateBatchSignOut } from '@/app/actions';
import Link from 'next/link';

interface Item {
  id: string;
  name: string;
  category: string;
  room: string | null;
  shelf: string | null;
  imageUrl: string | null;
}

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
}

export default function NewSignOutPage({ 
  users, 
  items 
}: { 
  users: UserData[], 
  items: Item[] 
}) {
  const router = useRouter();
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const handleUserToggle = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };


  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => {
      const next = { ...prev };
      if (next[itemId]) {
        delete next[itemId];
      } else {
        next[itemId] = 1;
      }
      return next;
    });
  };

  const updateQty = (itemId: string, newQty: number) => {
    if (newQty < 1) {
      // If quantity drops below 1, unselect the item
      setSelectedItems(prev => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    } else {
      setSelectedItems(prev => ({
        ...prev,
        [itemId]: newQty
      }));
    }
  };

  const handleSubmit = async () => {
    if (selectedUserIds.length === 0 || Object.keys(selectedItems).length === 0) return;
    
    setIsSubmitting(true);
    try {
      const itemsData = Object.entries(selectedItems).map(([itemId, authQuantity]) => ({
        itemId,
        authQuantity
      }));

      if (isBatchMode) {
        await initiateBatchSignOut(selectedUserIds, itemsData);
        router.push('/'); // Redirect to dashboard after batch creation
      } else {
        const transactionId = await initiateSignOut(selectedUserIds[0], itemsData);
        router.push(`/transactions/${transactionId}/print`);
      }
    } catch (error) {
      alert('Error initiating sign-out');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Sign Out</h1>
            <p className="text-gray-500">Initiate a supply handout</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Step 1: Pick User */}
        <div className="lg:col-span-1 lg:row-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-red-100 p-2 rounded-lg mr-3">
                  <User className="h-5 w-5 text-red-700" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">1. Select Cadet(s)</h2>
              </div>
              <button 
                onClick={() => setIsBatchMode(!isBatchMode)}
                className={`flex items-center text-xs font-black px-3 py-1.5 rounded-lg border transition-colors ${
                  isBatchMode
                    ? 'bg-red-700 text-white border-red-700'
                    : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                }`}>
                <Users className="h-3 w-3 mr-1.5" />
                Batch Mode {isBatchMode ? 'On' : 'Off'}
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search cadets..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 border-gray-300"
              />
            </div>
            <div className="max-h-60 overflow-y-auto border rounded-lg bg-white">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(u => (
                  <div 
                    key={u.id} 
                    onClick={() => isBatchMode ? handleUserToggle(u.id) : setSelectedUserIds([u.id])}
                    className={`p-3 cursor-pointer transition-colors flex items-center justify-between ${
                      selectedUserIds.includes(u.id)
                        ? 'bg-red-600 text-white' 
                        : 'hover:bg-red-50'
                    }`}
                  >
                    <div>
                      <p className={`font-medium ${selectedUserIds.includes(u.id) ? 'text-white' : 'text-gray-900'}`}>{u.name}</p>
                      <p className={`text-sm ${selectedUserIds.includes(u.id) ? 'text-red-100' : 'text-gray-500'}`}>{u.email}</p>
                    </div>
                    {isBatchMode && (
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 ${
                        selectedUserIds.includes(u.id)
                          ? 'bg-white border-white'
                          : 'border-gray-300'
                      }`}>
                        {selectedUserIds.includes(u.id) && <Check className="h-4 w-4 text-red-600" />}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 p-4">No cadets found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Pick Items */}
        <div className="lg:col-start-2 lg:col-span-2 lg:row-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="bg-red-100 p-2 rounded-lg mr-3">
                  <Package className="h-5 w-5 text-red-700" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">2. Select Items</h2>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search supplies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 border-gray-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
              {filteredItems.map(item => {
                const isSelected = !!selectedItems[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all flex flex-col cursor-pointer ${
                      isSelected 
                        ? 'border-red-600 bg-red-50 shadow-md' 
                        : 'border-gray-100 hover:border-red-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-4 mb-3">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover border shadow-sm" />
                      ) : (
                        <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center border border-dashed">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-grow">
                        <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">{item.category}</p>
                      </div>
                      {isSelected && (
                        <div className="bg-red-600 rounded-full p-1">
                          <X className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {isSelected && (
                      <div className="mt-auto pt-3 border-t border-red-100 flex items-center justify-between">
                        <span className="text-[10px] font-black text-red-700 uppercase">Authorized Qty:</span>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateQty(item.id, selectedItems[item.id] - 1); }}
                            className="w-6 h-6 rounded bg-white border border-red-200 flex items-center justify-center text-red-700 font-bold hover:bg-red-100"
                          >-</button>
                          <span className="font-black text-sm w-4 text-center">{selectedItems[item.id]}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateQty(item.id, selectedItems[item.id] + 1); }}
                            className="w-6 h-6 rounded bg-white border border-red-200 flex items-center justify-center text-red-700 font-bold hover:bg-red-100"
                          >+</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selection Summary */}
        <div className="lg:col-start-1 lg:row-start-2">
          <div className="bg-gray-900 text-white p-6 rounded-xl shadow-lg space-y-6">
            <h3 className="font-bold text-lg border-b border-gray-700 pb-2">Sign Out Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Cadet(s):</span>
                  <div className="font-medium text-right">
                    {selectedUserIds.length > 0 
                      ? selectedUserIds.map(id => users.find(u => u.id === id)?.name).join(', ')
                      : 'Not selected'}
                  </div>
                </div>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {Object.entries(selectedItems).map(([id, qty]) => {
                  const item = items.find(i => i.id === id);
                  return (
                    <div key={id} className="flex justify-between text-xs bg-gray-800 p-2 rounded">
                      <span className="truncate mr-2">{item?.name}</span>
                      <span className="font-black text-red-400">x{qty}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-sm border-t border-gray-700 pt-4">
                <span className="text-gray-400">Total Items:</span>
                <span className="font-medium">{Object.keys(selectedItems).length}</span>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={selectedUserIds.length === 0 || Object.keys(selectedItems).length === 0 || isSubmitting}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold transition-all flex items-center justify-center"
            >
              {isSubmitting 
                ? (isBatchMode ? 'Creating Transactions...' : 'Creating...')
                : (isBatchMode ? 'Initiate Batch Sign Out' : 'Initiate & Print Sheet')}
              <ClipboardList className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
