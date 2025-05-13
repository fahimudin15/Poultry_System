import { NextResponse } from 'next/server';
import { sseManager } from '@/lib/sseManager';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';  // Optional but recommended for SSE

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