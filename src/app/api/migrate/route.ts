import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';

export async function GET() {
  try {
    await connectDB();
    
    // Update all orders without a status to have 'pending' status
    const result = await Order.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'pending' } }
    );

    // Get all orders to verify
    const orders = await Order.find({});
    
    return NextResponse.json({
      message: 'Migration completed successfully',
      ordersUpdated: result.modifiedCount,
      totalOrders: orders.length,
      orders: orders
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
} 