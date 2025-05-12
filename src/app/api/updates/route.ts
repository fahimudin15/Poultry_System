import { NextResponse } from 'next/server';

// Keep track of connected clients
const clients = new Set<ReadableStreamController<Uint8Array>>();

// Create a TextEncoder instance for converting strings to Uint8Arrays
const encoder = new TextEncoder();

// Helper function to format SSE messages
function formatSSEMessage(data: any) {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller);
      controller.enqueue(formatSSEMessage({ type: 'connected' }));

      // Remove client when connection closes
      return () => {
        clients.delete(controller);
      };
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

// Helper function to notify all clients
export function notifyClients() {
  const encodedMessage = formatSSEMessage({ type: 'update' });
  
  clients.forEach(client => {
    try {
      client.enqueue(encodedMessage);
    } catch (error) {
      console.error('Error sending SSE update:', error);
      clients.delete(client);
    }
  });
} 