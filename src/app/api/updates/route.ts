import { NextResponse } from 'next/server';
import { sseManager } from '@/lib/sseManager';

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      sseManager.addClient(controller);
      controller.enqueue(sseManager.formatSSEMessage({ type: 'connected' }));

      return () => {
        sseManager.removeClient(controller);
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