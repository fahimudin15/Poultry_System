'use client';

import { useEffect, useState } from 'react';
import type { Order } from '@/types/order';
import { useRouter } from 'next/navigation';

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  date.setHours(date.getHours() + 1); // Add one hour to adjust for timezone
  return date.toLocaleString();
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    customerName: '',
    numberOfCrates: '',
    price: '',
    dueTime: ''
  });
  const router = useRouter();

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders', {
        cache: 'no-store'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      // Sort orders by ID to ensure they're in sequential order
      const sortedOrders = data.sort((a: Order, b: Order) => a.id - b.id);
      console.log('Fetched orders:', sortedOrders); // Debug log
      setOrders(sortedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  // Initial setup and migration
  useEffect(() => {
    const initializeOrders = async () => {
      try {
        await fetch('/api/migrate');
        await fetchOrders();
      } catch (error) {
        console.error('Error initializing orders:', error);
      }
    };

    initializeOrders();
  }, []);

  // Set up real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/updates');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received SSE update:', data);
        
        if (data.type === 'update') {
          fetchOrders();
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

  const handleExport = () => {
    try {
      // Convert orders to CSV format
      const headers = ['ID', 'Customer Name', 'Number of Crates', 'Price (₦)', 'Due Time', 'Created At'];
      const csvData = orders.map(order => [
        order.id,
        order.customerName,
        order.numberOfCrates,
        order.price.toLocaleString(),
        new Date(order.dueTime).toLocaleString(),
        new Date(order.createdAt).toLocaleString()
      ]);

      // Add headers to CSV data
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting orders:', error);
      alert('Error exporting orders');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this order?')) {
      try {
        const response = await fetch('/api/orders', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        });
        
        if (response.ok) {
          fetchOrders(); // Refresh the list
        } else {
          alert('Failed to delete order');
        }
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Error deleting order');
      }
    }
  };

  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    const now = new Date();
    now.setHours(now.getHours() + 1); // Add one hour to current time
    setEditForm({
      customerName: order.customerName,
      numberOfCrates: order.numberOfCrates.toString(),
      price: order.price.toString(),
      dueTime: now.toISOString().slice(0, 16)
    });
    setShowEdit(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedOrder._id,
          customerName: editForm.customerName,
          numberOfCrates: Number(editForm.numberOfCrates),
          price: Number(editForm.price),
          dueTime: editForm.dueTime
        }),
      });

      if (response.ok) {
        setShowEdit(false);
        fetchOrders();
      } else {
        alert('Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Error updating order');
    }
  };

  const handleDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const handleToggleStatus = async (order: Order) => {
    try {
      const newStatus = order.status === 'pending' ? 'completed' : 'pending';
      
      // Optimistic update - update UI immediately
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o._id === order._id ? { ...o, status: newStatus } : o
        )
      );

      // Then make the server request
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: order._id,
          status: newStatus
        }),
      });

      if (!response.ok) {
        // If server request fails, revert the optimistic update
        setOrders(prevOrders => 
          prevOrders.map(o => 
            o._id === order._id ? { ...o, status: order.status } : o
          )
        );
        throw new Error('Failed to update order status');
      }

    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-[28px] font-normal mb-6">Orders</h1>
      
      <button 
        onClick={handleExport}
        className="bg-[#6C757D] text-white px-3 py-[6px] rounded text-sm font-normal mb-4 hover:bg-[#5c636a]"
      >
        Export Orders
      </button>
      
      <div className="bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#212529] text-white">
              <th className="py-2 px-3 text-left font-normal">Status</th>
              <th className="py-2 px-3 text-left font-normal">ID</th>
              <th className="py-2 px-3 text-left font-normal">Customer Name</th>
              <th className="py-2 px-3 text-left font-normal">Number of Crates</th>
              <th className="py-2 px-3 text-left font-normal">Price</th>
              <th className="py-2 px-3 text-left font-normal">Due Time</th>
              <th className="py-2 px-3 text-left font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr 
                key={order._id} 
                className={`border-b border-[#dee2e6] ${
                  order.status === 'completed' ? 'bg-gray-100' : ''
                }`}
              >
                <td className="py-2 px-3">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    order.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                  } text-white`}>
                    {order.status === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                </td>
                <td className="py-2 px-3">{order.id}</td>
                <td className="py-2 px-3">{order.customerName}</td>
                <td className="py-2 px-3">{order.numberOfCrates}</td>
                <td className="py-2 px-3">₦{order.price.toLocaleString()}</td>
                <td className="py-2 px-3">{formatDateTime(order.dueTime)}</td>
                <td className="py-2 px-3 space-x-2">
                  <button 
                    onClick={() => handleDelete(order._id)}
                    className="bg-[#DC3545] text-white px-2 py-[3px] rounded text-sm hover:bg-[#bb2d3b]"
                  >
                    Delete
                  </button>
                  <button 
                    onClick={() => handleEdit(order)}
                    className="bg-[#FFC107] text-white px-2 py-[3px] rounded text-sm hover:bg-[#ffca2c]"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDetails(order)}
                    className="bg-[#0DCAF0] text-white px-2 py-[3px] rounded text-sm hover:bg-[#31d2f2]"
                  >
                    Details
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={order.status === 'completed'}
                      onChange={() => handleToggleStatus(order)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer 
                      peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                      peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                      after:start-[2px] after:bg-white after:border-gray-300 after:border 
                      after:rounded-full after:h-5 after:w-5 after:transition-all 
                      peer-checked:bg-green-500">
                    </div>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showEdit && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-[500px]">
            <h2 className="text-xl mb-4">Edit Order</h2>
            <form onSubmit={handleUpdate}>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1">Customer Name:</label>
                  <input
                    type="text"
                    value={editForm.customerName}
                    onChange={(e) => setEditForm({...editForm, customerName: e.target.value})}
                    className="w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Number of Crates:</label>
                  <input
                    type="number"
                    value={editForm.numberOfCrates}
                    onChange={(e) => setEditForm({...editForm, numberOfCrates: e.target.value})}
                    className="w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Price:</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                    className="w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Due Time:</label>
                  <input
                    type="datetime-local"
                    value={editForm.dueTime}
                    onChange={(e) => setEditForm({...editForm, dueTime: e.target.value})}
                    className="w-full"
                    required
                    defaultValue={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="bg-[#6C757D] text-white px-3 py-[6px] rounded text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#198754] text-white px-3 py-[6px] rounded text-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-[500px]">
            <h2 className="text-xl mb-4">Order Details</h2>
            <div className="space-y-2">
              <p><strong>Order ID:</strong> {selectedOrder.id}</p>
              <p><strong>Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded-full text-sm ${
                  selectedOrder.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                } text-white`}>
                  {selectedOrder.status === 'completed' ? 'Completed' : 'Pending'}
                </span>
              </p>
              <p><strong>Customer Name:</strong> {selectedOrder.customerName}</p>
              <p><strong>Number of Crates:</strong> {selectedOrder.numberOfCrates}</p>
              <p><strong>Price:</strong> ₦{selectedOrder.price.toLocaleString()}</p>
              <p><strong>Due Time:</strong> {formatDateTime(selectedOrder.dueTime)}</p>
              {selectedOrder.createdAt && (
                <p><strong>Created At:</strong> {formatDateTime(selectedOrder.createdAt)}</p>
              )}
              {selectedOrder.updatedAt && (
                <p><strong>Last Updated:</strong> {formatDateTime(selectedOrder.updatedAt)}</p>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="bg-[#6C757D] text-white px-3 py-[6px] rounded text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 