'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, User, Users } from 'lucide-react';
import { createUser, createUsersInBatch } from '@/app/actions';
import Link from 'next/link';

export default function NewUserPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addMode, setAddMode] = useState('single'); // 'single' or 'batch'

  const handleSingleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      await createUser(formData);
      router.push('/users');
      router.refresh();
    } catch (error) {
      alert('Error creating user. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleBatchSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const usersData = formData.get('usersData') as string;

    try {
      const result = await createUsersInBatch(usersData);
      alert(`${result.createdCount} users created successfully.`);
      router.push('/users');
      router.refresh();
    } catch (error) {
      alert('Error creating users in batch. Please check the format and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto pb-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/users" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New User(s)</h1>
        </div>
        <div className="flex rounded-lg bg-gray-200 p-1">
          <button 
            onClick={() => setAddMode('single')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${addMode === 'single' ? 'bg-white text-red-700 shadow' : 'bg-transparent text-gray-600 hover:text-gray-900'}`}>
              <User className="h-4 w-4 inline-block mr-1"/>
              Single
            </button>
          <button 
            onClick={() => setAddMode('batch')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${addMode === 'batch' ? 'bg-white text-red-700 shadow' : 'bg-transparent text-gray-600 hover:text-gray-900'}`}>
              <Users className="h-4 w-4 inline-block mr-1"/>
              Batch
            </button>
        </div>
      </div>

      {addMode === 'single' ? (
        <form action={handleSingleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700">Full Name</label>
            <input
              type="text"
              name="name"
              id="name"
              required
              className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm p-3 border"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Email Address</label>
            <input
              type="email"
              name="email"
              id="email"
              required
              className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm p-3 border"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-semibold text-gray-700">Role</label>
            <select
              name="role"
              id="role"
              className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm p-3 border bg-white"
              defaultValue="USER"
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="flex justify-end space-x-4">
            <Link href="/users" className="px-6 py-3 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-3 rounded-lg bg-red-700 text-sm font-semibold text-white hover:bg-red-800 shadow-md flex items-center transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleBatchSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div>
            <label htmlFor="usersData" className="block text-sm font-semibold text-gray-700">User Data</label>
            <p className="text-xs text-gray-500 mt-1">Enter each user on a new line in the format: <code className="bg-gray-100 p-1 rounded">Full Name,email@domain.com</code>. All users will be created with the USER role.</p>
            <textarea
              name="usersData"
              id="usersData"
              required
              rows={10}
              className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm p-3 border"
              placeholder="Example:&#10;John Doe,johndoe@example.com&#10;Jane Smith,janesmith@example.com"
            />
          </div>
          <div className="flex justify-end space-x-4">
            <Link href="/users" className="px-6 py-3 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-3 rounded-lg bg-red-700 text-sm font-semibold text-white hover:bg-red-800 shadow-md flex items-center transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Creating Users...' : 'Create Users'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
