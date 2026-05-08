'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Package, X, Upload, Image as ImageIcon, ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { createItem } from '@/app/actions';
import Link from 'next/link';

interface SizeEntry {
  id: string;
  size: string;
  quantity: string;
}

export default function AddItemPage() {
  const router = useRouter();
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [sizes, setSizes] = useState<SizeEntry[]>([
    { id: Math.random().toString(), size: '', quantity: '' }
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File is too large. Please upload an image smaller than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setBase64Image(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addSize = () => {
    setSizes([...sizes, { id: Math.random().toString(), size: '', quantity: '' }]);
  };

  const removeSize = (id: string) => {
    if (sizes.length > 1) {
      setSizes(sizes.filter(s => s.id !== id));
    }
  };

  const updateSize = (id: string, field: 'size' | 'quantity', value: string) => {
    setSizes(sizes.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Supply Item</h1>
        </div>
      </div>

      <form action={async (formData) => {
        setIsUploading(true);
        if (base64Image) formData.set('imageUrl', base64Image);
        
        // Add sizes as JSON string
        formData.set('sizes', JSON.stringify(sizes.filter(s => s.size && s.quantity)));

        try {
          await createItem(formData);
          router.push('/');
          router.refresh();
        } catch (error) {
          alert('Error saving item. Please try again.');
          setIsUploading(false);
        }
      }} className="space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-4">Item Image</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  base64Image ? 'border-transparent bg-gray-50' : 'border-gray-300 hover:border-red-500 hover:bg-red-50'
                }`}
              >
                {base64Image ? (
                  <div className="relative w-full h-full group">
                    <img src={base64Image} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setBase64Image(null); }}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1.5 shadow-lg hover:bg-red-700 z-10"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <div className="bg-gray-100 p-4 rounded-full inline-block mb-3">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">Upload Photo</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700">Item Name</label>
                <input type="text" name="name" id="name" required className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm p-3 border" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-semibold text-gray-700">Category</label>
                  <select name="category" id="category" className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm p-3 border bg-white">
                    <option>Uniform</option><option>Equipment</option><option>Headgear</option><option>Footwear</option><option>PTs</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Location (Room / Shelf)</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input type="text" name="room" placeholder="Room" className="rounded-lg border-gray-300 focus:ring-red-500 border p-3 text-sm" />
                    <input type="text" name="shelf" placeholder="Shelf" className="rounded-lg border-gray-300 focus:ring-red-500 border p-3 text-sm" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">Sizes & Quantities</label>
                  <button type="button" onClick={addSize} className="text-xs font-bold text-red-700 hover:text-red-800 flex items-center">
                    <Plus className="h-3 w-3 mr-1" /> Add Size
                  </button>
                </div>
                <div className="space-y-3">
                  {sizes.map((s) => (
                    <div key={s.id} className="flex items-center space-x-3">
                      <input
                        type="text"
                        placeholder="Size (e.g. M-R)"
                        value={s.size}
                        onChange={(e) => updateSize(s.id, 'size', e.target.value)}
                        className="flex-grow rounded-lg border-gray-300 focus:ring-red-500 border p-3 text-sm"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={s.quantity}
                        onChange={(e) => updateSize(s.id, 'quantity', e.target.value)}
                        className="w-24 rounded-lg border-gray-300 focus:ring-red-500 border p-3 text-sm"
                        required
                        min="0"
                      />
                      <button 
                        type="button" 
                        onClick={() => removeSize(s.id)}
                        className="p-3 text-gray-400 hover:text-red-600"
                        disabled={sizes.length === 1}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4">
              <Link href="/" className="px-6 py-3 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</Link>
              <button
                type="submit"
                disabled={isUploading}
                className={`px-8 py-3 rounded-lg bg-red-700 text-sm font-semibold text-white hover:bg-red-800 shadow-md flex items-center transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Save className="h-4 w-4 mr-2" />
                {isUploading ? 'Saving...' : 'Create Item'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
