import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';

export async function GET() {
  try {
    await connectDB();
    
    // Get all orders
    const orders = await Order.find({});
    
    // Calculate statistics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.price, 0);
    
    // Count only orders with status 'pending'
    const pendingOrders = await Order.countDocuments({ status: 'pending' });

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      pendingOrders
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
} 