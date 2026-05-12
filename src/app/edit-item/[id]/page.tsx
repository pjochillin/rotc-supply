'use client';

import { useState, useRef, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Package, X, Upload, Image as ImageIcon, ArrowLeft, Save, Plus, Trash2, Minus } from 'lucide-react';
import { updateItem, adjustItemQuantity, deleteItem } from '@/app/actions';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';

interface SizeEntry {
  id: string;
  size: string;
  quantity: string;
}

interface EditItemPageProps {
  params: Promise<{ id: string }>;
}

export default function EditItemPage({ params }: EditItemPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [sizes, setSizes] = useState<SizeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageModified, setImageModified] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hasSizes, setHasSizes] = useState(true);

  useEffect(() => {
    // Fetch item details on client side for simplicity in this interactive form
    async function fetchItem() {
      try {
        const response = await fetch(`/api/items/${id}`);
        const data = await response.json();
        setItem(data);
        setBase64Image(data.imageUrl);

        if (data.sizes.length === 1 && data.sizes[0].size === 'Standard') {
          setHasSizes(false);
          setSizes([{ id: data.sizes[0].id, size: 'Standard', quantity: data.sizes[0].totalQuantity.toString() }]);
        } else {
          setHasSizes(true);
          setSizes(data.sizes.map((s: any) => ({
            id: s.id,
            size: s.size,
            quantity: s.totalQuantity.toString(),
          })));
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch item:', error);
        alert('Could not load item details.');
        router.push('/');
      }
    }
    fetchItem();
  }, [id, router]);

  const handleQuantityChange = async (itemSizeId: string, adjustment: number) => {
    try {
      await adjustItemQuantity(itemSizeId, adjustment);
      // Optimistically update the UI or refetch the item data
      setSizes(sizes.map(s => 
        s.id === itemSizeId 
          ? { ...s, quantity: (parseInt(s.quantity) + adjustment).toString() } 
          : s
      ));
    } catch (error) {
      console.error('Failed to update quantity:', error);
      alert('Could not update quantity.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to permanently delete this item and all its stock? This action cannot be undone.')) {
      try {
        await deleteItem(id);
        router.push('/inventory');
        router.refresh();
      } catch (error) {
        console.error('Failed to delete item:', error);
        alert('Could not delete item.');
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64Image(reader.result as string);
        setImageModified(true);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error compressing image:', error);
      alert('Failed to process image.');
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

  const updateSizeField = (id: string, field: 'size' | 'quantity', value: string) => {
    setSizes(sizes.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/inventory" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Item: {item.name}</h1>
        </div>
        <button
          onClick={handleDelete}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-red-600 bg-white text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete Item</span>
        </button>
      </div>

      <form action={async (formData) => {
        setIsUploading(true);
        if (imageModified && base64Image) {
          formData.set('imageUrl', base64Image);
        } else if (imageModified && !base64Image) {
          // Handle case where image is removed
          formData.set('imageUrl', '');
        }

        const sizesToSubmit = hasSizes
          ? sizes.filter(s => s.size && s.quantity)
          : [{ ...sizes[0], size: 'Standard' }];

        formData.set('sizes', JSON.stringify(sizesToSubmit));

        try {
          await updateItem(id, formData);
          router.push('/');
          router.refresh();
        } catch (error) {
          alert('Error updating item. Please try again.');
          setIsUploading(false);
        }
      }} className="space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                    <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
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
                <input 
                  type="text" 
                  name="name" 
                  id="name" 
                  defaultValue={item.name}
                  required 
                  className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm p-3 border" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-semibold text-gray-700">Category</label>
                  <select 
                    name="category" 
                    id="category" 
                    defaultValue={item.category}
                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm p-3 border bg-white"
                  >
                    <option>Uniform</option><option>Equipment</option><option>Headgear</option><option>Footwear</option><option>APFUs</option><option>ECWCS</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Location (Room / Shelf)</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input type="text" name="room" defaultValue={item.room} placeholder="Room" className="rounded-lg border-gray-300 focus:ring-red-500 border p-3 text-sm" />
                    <input type="text" name="shelf" defaultValue={item.shelf} placeholder="Shelf" className="rounded-lg border-gray-300 focus:ring-red-500 border p-3 text-sm" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">Sizes & Quantities</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      id="has-sizes-checkbox"
                      type="checkbox" 
                      checked={!hasSizes} 
                      onChange={(e) => setHasSizes(!e.target.checked)} 
                      className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-600"
                    />
                    <label htmlFor="has-sizes-checkbox" className="text-sm text-gray-600">There are no sizes</label>
                  </div>
                </div>
                {hasSizes ? (
                  <div className="space-y-3">
                    {sizes.map((s) => (
                      <div key={s.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Size (e.g. M-R)"
                            value={s.size}
                            onChange={(e) => updateSizeField(s.id, 'size', e.target.value)}
                            className="flex-grow rounded-lg border-gray-300 focus:ring-red-500 border p-3 text-sm"
                          />
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => handleQuantityChange(s.id, -1)} className="p-2 rounded-md hover:bg-gray-100"><Minus className="h-4 w-4"/></button>
                            <input
                              type="number"
                              placeholder="Qty"
                              value={s.quantity}
                              onChange={(e) => updateSizeField(s.id, 'quantity', e.target.value)}
                              className="w-20 rounded-lg border-gray-300 focus:ring-red-500 border p-3 text-sm text-center"
                              min="0"
                            />
                            <button type="button" onClick={() => handleQuantityChange(s.id, 1)} className="p-2 rounded-md hover:bg-gray-100"><Plus className="h-4 w-4"/></button>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeSize(s.id)}
                            className="p-3 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                    ))}
                    <button type="button" onClick={addSize} className="text-xs font-bold text-red-700 hover:text-red-800 flex items-center">
                      <Plus className="h-3 w-3 mr-1" /> Add Size
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Quantity</label>
                    <input
                      type="number"
                      placeholder="Total Quantity"
                      value={sizes[0]?.quantity || ''}
                      onChange={(e) => setSizes([{ ...sizes[0], quantity: e.target.value }])}
                      className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm p-3 border"
                      min="0"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4">
              <Link href="/" className="px-6 py-3 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</Link>
              <button
                type="submit"
                disabled={isUploading}
                className={`px-8 py-3 rounded-lg bg-red-700 text-sm font-bold text-white hover:bg-red-800 shadow-md flex items-center transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Save className="h-4 w-4 mr-2" />
                {isUploading ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
