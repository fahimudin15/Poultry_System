import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { sseManager } from '@/lib/sseManager';

export async function GET() {
  try {
    await connectDB();
    const orders = await Order.find({}).sort({ id: 1 });
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const data = await request.json();
    
    // Get the next ID
    const lastOrder = await Order.findOne().sort({ id: -1 });
    const nextId = (lastOrder?.id || 0) + 1;
    
    // Create the order with the next ID and default status
    const order = await Order.create({
      ...data,
      id: nextId,
      status: 'pending' // Ensure status is set to pending for new orders
    });

    // Notify clients of the update
    sseManager.notifyClients();

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ 
      error: 'Failed to create order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { id } = await request.json();
    const order = await Order.findByIdAndDelete(id);
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Notify clients of the update
    sseManager.notifyClients();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    const { id, ...updateData } = await request.json();
    
    // Find the order and update it
    const order = await Order.findByIdAndUpdate(
      id,
      { ...updateData },
      { new: true, runValidators: true }
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Notify clients of the update
    sseManager.notifyClients();

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
} 