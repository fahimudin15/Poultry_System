'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const PRICE_PER_CRATE = 5200;  // Default price per crate

export default function AddOrder() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    customerName: '',
    numberOfCrates: '',
    price: '0',
    dueTime: (() => {
      const now = new Date();
      now.setHours(now.getHours() + 1); // Add one hour for timezone
      now.setDate(now.getDate() + 7); // Add 7 days for the due date
      return now.toISOString().slice(0, 16);
    })()
  });

  const calculatePrice = (crates: string) => {
    const numCrates = parseInt(crates) || 0;
    return (numCrates * PRICE_PER_CRATE).toString();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'numberOfCrates') {
      // Ensure only positive numbers
      const sanitizedValue = Math.max(0, parseInt(value) || 0).toString();
      setFormData(prev => ({
        ...prev,
        numberOfCrates: sanitizedValue,
        price: calculatePrice(sanitizedValue)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.numberOfCrates || parseInt(formData.numberOfCrates) < 1) {
      alert('Please enter at least 1 crate');
      return;
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: formData.customerName,
          numberOfCrates: parseInt(formData.numberOfCrates),
          price: parseInt(formData.price),
          dueTime: formData.dueTime,
          status: 'pending'
        }),
      });

      if (response.ok) {
        router.push('/orders');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error adding order:', error);
      alert('Error adding order');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-[28px] font-normal mb-6">Add Order</h1>
      
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
          <div>
            <label htmlFor="customerName" className="block mb-2 text-[#212529]">
              Customer Name:
            </label>
            <input
              type="text"
              id="customerName"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              className="w-full bg-white"
              required
            />
          </div>
          
          <div>
            <label htmlFor="numberOfCrates" className="block mb-2 text-[#212529]">
              Number of Crates:
            </label>
            <input
              type="number"
              id="numberOfCrates"
              name="numberOfCrates"
              value={formData.numberOfCrates}
              onChange={handleChange}
              min="1"
              className="w-full bg-white"
              required
            />
            <div className="text-sm text-gray-500 mt-1">
              Minimum: 1 crate
            </div>
          </div>
          
          <div>
            <label htmlFor="price" className="block mb-2 text-[#212529]">
              Price: (₦{PRICE_PER_CRATE.toLocaleString()} per crate)
            </label>
            <div className="relative">
              <span className="absolute left-[3px] top-[50%] transform -translate-y-[50%] text-gray-600">₦</span>
              <input
                type="text"
                id="price"
                name="price"
                value={parseInt(formData.price).toLocaleString()}
                className="w-full bg-gray-100 pl-22 py-2 rounded"
                readOnly
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="dueTime" className="block mb-2 text-[#212529]">
              Due Time (1 week from now):
            </label>
            <input
              type="datetime-local"
              id="dueTime"
              name="dueTime"
              value={formData.dueTime}
              onChange={handleChange}
              className="w-full bg-white"
              required
            />
          </div>
        </div>
        
        <button
          type="submit"
          className="bg-[#198754] text-white px-4 py-[6px] rounded hover:bg-[#157347] text-sm font-normal"
        >
          Add Order
        </button>
      </form>
    </div>
  );
} 