'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Statistics {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

export default function Home() {
  const [stats, setStats] = useState<Statistics>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/statistics', {
        cache: 'no-store'  // Ensure we always get fresh data
      });
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      const data = await response.json();
      console.log('Updated statistics:', data); // Debug log
      setStats(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Fetch initial data
  useEffect(() => {
    fetchStatistics();
  }, []);

  // Set up real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/updates');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received SSE update:', data);
        
        if (data.type === 'update') {
          fetchStatistics();
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl text-center mb-2">Welcome to the Egg Management System</h1>
      <p className="text-center mb-8">
        <span className="text-blue-600">Manage</span> your orders efficiently with our 
        <span className="text-blue-600"> simple</span> and 
        <span className="text-blue-600"> intuitive</span> system.
      </p>

      <div className="flex justify-center gap-4 mb-8">
        <Link href="/orders" className="bg-[#0D6EFD] text-white py-2 px-4 rounded-md w-[300px] text-center">
          View Orders
        </Link>
        <Link href="/add-order" className="bg-[#198754] text-white py-2 px-4 rounded-md w-[300px] text-center">
          Add Order
        </Link>
        <Link href="/orders?status=pending" className="bg-[#FFC107] text-white py-2 px-4 rounded-md w-[300px] text-center">
          Pending Orders
        </Link>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        <div className="border rounded-md p-6 w-[300px] text-center">
          <div className="text-lg">Total Orders</div>
          <div className="text-4xl mt-2">{stats.totalOrders}</div>
        </div>
        <div className="border rounded-md p-6 w-[300px] text-center">
          <div className="text-lg">Total Revenue</div>
          <div className="text-4xl mt-2">₦{stats.totalRevenue.toLocaleString()}</div>
        </div>
        <div className="border rounded-md p-6 w-[300px] text-center">
          <div className="text-lg">Pending Orders</div>
          <div className="text-4xl mt-2">{stats.pendingOrders}</div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Orders</h2>
        <div className="bg-[#2D2D2D] text-white">
          <div className="grid grid-cols-5 p-2">
            <div>ID</div>
            <div>Customer Name</div>
            <div>Number of Crates</div>
            <div>Price</div>
            <div>Due Time</div>
          </div>
        </div>
      </div>
    </div>
  );
}
